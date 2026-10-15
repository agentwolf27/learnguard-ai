import { cookies } from "next/headers";
import { createRemoteJWKSet, decodeJwt, jwtVerify, SignJWT, type JWTPayload } from "jose";
import type { LtiLaunchContext, LtiRole } from "@/lib/types";
import { ltiSessionSecret } from "@/lib/lti-session-secret";

const rolesClaim = "https://purl.imsglobal.org/spec/lti/claim/roles";
const contextClaim = "https://purl.imsglobal.org/spec/lti/claim/context";
const resourceLinkClaim = "https://purl.imsglobal.org/spec/lti/claim/resource_link";
const deploymentClaim = "https://purl.imsglobal.org/spec/lti/claim/deployment_id";
const customClaim = "https://purl.imsglobal.org/spec/lti/claim/custom";

export const ltiContextCookieName = "learnguard_lti_context";
export const ltiStateCookieName = "learnguard_lti_state";
export const ltiNonceCookieName = "learnguard_lti_nonce";

type LtiClaims = JWTPayload & {
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  [rolesClaim]?: string[];
  [contextClaim]?: {
    id?: string;
    label?: string;
    title?: string;
  };
  [resourceLinkClaim]?: {
    id?: string;
    title?: string;
  };
  [deploymentClaim]?: string;
  [customClaim]?: Record<string, string | undefined>;
};

function canvasAuthUrlForIssuer(issuer?: string) {
  if (process.env.LTI_AUTH_LOGIN_URL) {
    return process.env.LTI_AUTH_LOGIN_URL;
  }

  if (issuer?.includes("beta")) {
    return "https://sso.beta.canvaslms.com/api/lti/authorize_redirect";
  }

  if (issuer?.includes("test")) {
    return "https://sso.test.canvaslms.com/api/lti/authorize_redirect";
  }

  return "https://sso.canvaslms.com/api/lti/authorize_redirect";
}

function canvasJwksUrlForIssuer(issuer?: string) {
  if (process.env.LTI_PLATFORM_JWKS_URL) {
    return process.env.LTI_PLATFORM_JWKS_URL;
  }

  if (issuer?.includes("beta")) {
    return "https://sso.beta.canvaslms.com/api/lti/security/jwks";
  }

  if (issuer?.includes("test")) {
    return "https://sso.test.canvaslms.com/api/lti/security/jwks";
  }

  return "https://sso.canvaslms.com/api/lti/security/jwks";
}

export function detectLtiRole(roles: string[] = []): LtiRole {
  const normalizedRoles = roles.map((role) => role.toLowerCase());

  if (normalizedRoles.some((role) => role.includes("administrator"))) {
    return "admin";
  }

  if (
    normalizedRoles.some(
      (role) =>
        role.includes("instructor") ||
        role.includes("teachingassistant") ||
        role.includes("contentdeveloper")
    )
  ) {
    return "teacher";
  }

  return "student";
}

export function claimsToLaunchContext(claims: LtiClaims): LtiLaunchContext {
  const context = claims[contextClaim];
  const resourceLink = claims[resourceLinkClaim];
  const custom = claims[customClaim] || {};
  const issuer = typeof claims.iss === "string" ? claims.iss : undefined;

  return {
    userId: String(claims.sub || custom.canvas_user_id || "unknown-user"),
    userName:
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
      custom.canvas_user_name ||
      "Canvas User",
    userEmail: claims.email,
    role: detectLtiRole(claims[rolesClaim] || []),
    courseId: context?.id || custom.canvas_course_id,
    courseName: context?.title || context?.label || custom.canvas_course_name,
    assignmentId: custom.canvas_assignment_id || resourceLink?.id,
    assignmentTitle: custom.canvas_assignment_title || resourceLink?.title,
    deploymentId: claims[deploymentClaim],
    issuer,
    targetLinkUri:
      typeof claims["https://purl.imsglobal.org/spec/lti/claim/target_link_uri"] === "string"
        ? (claims["https://purl.imsglobal.org/spec/lti/claim/target_link_uri"] as string)
        : undefined,
    canvasHost: issuer ? new URL(issuer).hostname : undefined
  };
}

export async function validateLtiIdToken(
  idToken: string,
  options: { expectedNonce?: string } = {}
) {
  const decoded = decodeJwt(idToken) as LtiClaims;
  const issuer = typeof decoded.iss === "string" ? decoded.iss : undefined;

  if (process.env.LTI_MOCK_MODE === "true" && !process.env.LTI_CLIENT_ID) {
    return claimsToLaunchContext(decoded);
  }

  const jwks = createRemoteJWKSet(new URL(canvasJwksUrlForIssuer(issuer)));
  const result = await jwtVerify(idToken, jwks, {
    issuer: process.env.LTI_ISSUER || issuer,
    audience: process.env.LTI_CLIENT_ID || undefined
  });

  // LTI 1.3 replay protection: the id_token nonce must match the nonce we
  // generated during the OIDC login step (stored in an httpOnly cookie).
  if (options.expectedNonce) {
    const tokenNonce = result.payload.nonce;
    if (typeof tokenNonce !== "string" || tokenNonce !== options.expectedNonce) {
      throw new Error("Invalid LTI nonce: launch token did not match the login nonce.");
    }
  }

  return claimsToLaunchContext(result.payload as LtiClaims);
}

export function buildOidcRedirectUrl({
  issuer,
  loginHint,
  ltiMessageHint,
  targetLinkUri,
  clientId,
  redirectUri,
  state,
  nonce,
  deploymentId
}: {
  issuer?: string;
  loginHint: string;
  ltiMessageHint?: string;
  targetLinkUri?: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  deploymentId?: string;
}) {
  const url = new URL(canvasAuthUrlForIssuer(issuer));

  url.searchParams.set("scope", "openid");
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("prompt", "none");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("login_hint", loginHint);

  if (ltiMessageHint) {
    url.searchParams.set("lti_message_hint", ltiMessageHint);
  }

  if (targetLinkUri) {
    url.searchParams.set("target_link_uri", targetLinkUri);
  }

  if (deploymentId) {
    url.searchParams.set("deployment_id", deploymentId);
  }

  return url;
}

export function encodeLtiContext(context: LtiLaunchContext) {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

export function decodeLtiContext(value?: string): LtiLaunchContext | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as LtiLaunchContext;
  } catch {
    return null;
  }
}

/**
 * Sign the launch context into a tamper-proof JWT. The previous implementation
 * stored the context as plain base64 JSON, which a user could forge (e.g. set
 * role=admin) since httpOnly only blocks JavaScript, not crafted HTTP requests.
 */
export async function signLtiSession(context: LtiLaunchContext): Promise<string> {
  return new SignJWT({ ctx: context })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(ltiSessionSecret());
}

export async function verifyLtiSession(token?: string): Promise<LtiLaunchContext | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, ltiSessionSecret());
    return (payload.ctx as LtiLaunchContext) ?? null;
  } catch {
    // Reject anything that is not a validly signed session. (Legacy unsigned
    // cookies are intentionally not honored so they cannot be forged.)
    return null;
  }
}

export async function getLtiContextFromCookies() {
  const cookieStore = await cookies();
  return verifyLtiSession(cookieStore.get(ltiContextCookieName)?.value);
}

export function mockLtiContext(role: LtiRole = "student"): LtiLaunchContext {
  const base = {
    courseId: "canvas-course-cs101",
    courseName: "Computer Science 101",
    assignmentId: "canvas-assignment-recursion",
    assignmentTitle: "Recursive Thinking Lab",
    deploymentId: "local-dev-deployment",
    issuer: "https://canvas.instructure.com",
    canvasHost: "canvas.instructure.com"
  };

  if (role === "teacher") {
    return {
      ...base,
      userId: "canvas-teacher-1",
      userName: "Maya Reynolds",
      userEmail: "maya.reynolds@northstar.example",
      role
    };
  }

  if (role === "admin") {
    return {
      ...base,
      userId: "canvas-admin-1",
      userName: "Jordan Lee",
      userEmail: "jordan.lee@northstar.example",
      role
    };
  }

  return {
    ...base,
    userId: "canvas-student-1",
    userName: "Avery Chen",
    userEmail: "avery.chen@northstar.example",
    role
  };
}
