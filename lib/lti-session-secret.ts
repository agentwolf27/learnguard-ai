import { logger } from "@/lib/logger";

/**
 * Secret used to sign the LTI session cookie (HS256).
 *
 * - `LTI_SESSION_SECRET` must be set in production. There is no hard-coded
 *   fallback: a default string in public source would let anyone forge a
 *   session. `assertLtiSessionSecret()` runs at server startup (see
 *   `instrumentation.ts`) and stops a production server that lacks it.
 * - In development and test, a missing secret is replaced by a random secret
 *   generated once per process. Sessions then last only until the dev server
 *   restarts, which is fine for local mock launches.
 *
 * Generate one with: openssl rand -base64 48
 */

const MIN_LENGTH = 32;
// The default string older versions shipped with. Refuse it if it is still configured.
const RETIRED_DEFAULT = "learnguard-dev-session-secret-change-me";

let devSecret: Uint8Array | null = null;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function configuredSecret(): string | null {
  const value = process.env.LTI_SESSION_SECRET?.trim();
  return value ? value : null;
}

function problemWith(secret: string | null): string | null {
  if (!secret) return "LTI_SESSION_SECRET is not set";
  if (secret === RETIRED_DEFAULT) return "LTI_SESSION_SECRET is the old public default value";
  if (secret.length < MIN_LENGTH) return `LTI_SESSION_SECRET is shorter than ${MIN_LENGTH} characters`;
  return null;
}

/** Throws in production when the secret is missing or weak. Call once at startup. */
export function assertLtiSessionSecret(): void {
  const problem = problemWith(configuredSecret());
  if (!problem) return;
  if (isProduction()) {
    const message = `${problem}. Refusing to start: LTI session cookies cannot be signed safely. Generate one with \`openssl rand -base64 48\`.`;
    logger.error(message);
    throw new Error(message);
  }
  logger.warn(
    `${problem}. Development only: signing LTI sessions with a random per-process secret; sessions end when the server restarts.`
  );
}

export function ltiSessionSecret(): Uint8Array {
  const secret = configuredSecret();
  const problem = problemWith(secret);
  if (!problem && secret) {
    return new TextEncoder().encode(secret);
  }
  if (isProduction()) {
    // Defence in depth: startup should already have failed.
    throw new Error(`${problem}. LTI sessions cannot be signed in production without it.`);
  }
  if (!devSecret) {
    devSecret = crypto.getRandomValues(new Uint8Array(48));
    logger.warn(`${problem}. Generated a random per-process LTI session secret (development only).`);
  }
  return devSecret;
}

export function ltiSessionSecretConfigured(): boolean {
  return problemWith(configuredSecret()) === null;
}
