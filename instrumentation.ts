import { logger } from "@/lib/logger";
import { assertLtiSessionSecret } from "@/lib/lti-session-secret";

export async function register() {
  // Fails the server at startup in production when LTI_SESSION_SECRET is missing or weak;
  // in development it logs that a random per-process secret is in use.
  assertLtiSessionSecret();
  logger.info("LearnGuard monitoring hooks registered.", {
    runtime: process.env.NEXT_RUNTIME || "nodejs"
  });
}

export function onRequestError(error: unknown, request: Request) {
  logger.error("Unhandled request error captured by instrumentation.", error, {
    url: request.url,
    method: request.method
  });
}
