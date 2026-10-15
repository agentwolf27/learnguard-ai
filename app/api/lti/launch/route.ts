import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import {
  ltiContextCookieName,
  ltiNonceCookieName,
  ltiStateCookieName,
  mockLtiContext,
  signLtiSession,
  validateLtiIdToken
} from "@/lib/lti";
import { resolveOrCreateLtiRecords } from "@/lib/ltiPersistence";
import { requestMetadata } from "@/lib/security";
import type { LtiRole } from "@/lib/types";

function cookieSettings() {
  const secure = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: 60 * 60 * 8,
    path: "/"
  };
}

function redirectPathForRole(role: LtiRole) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "teacher") return "/lti/teacher";
  return "/lti/student";
}

export async function GET(request: NextRequest) {
  if (process.env.LTI_MOCK_MODE !== "true") {
    return NextResponse.json(
      { error: "Mock LTI launch is disabled. Use Canvas OIDC login or set LTI_MOCK_MODE=true for local demos." },
      { status: 403 }
    );
  }

  const requestMeta = requestMetadata(request);
  const role = (request.nextUrl.searchParams.get("role") || "student") as LtiRole;
  const context = mockLtiContext(role);
  const records = await resolveOrCreateLtiRecords(context);

  await writeAuditLog({
    schoolId: records.school.id,
    userId: records.user.id,
    action: AuditAction.LTI_LAUNCH,
    resource: "mock_lti_launch",
    metadata: { role },
    ...requestMeta
  });

  const response = NextResponse.redirect(new URL(redirectPathForRole(context.role), request.url));
  response.cookies.set(ltiContextCookieName, await signLtiSession(context), cookieSettings());
  return response;
}

export async function POST(request: NextRequest) {
  const requestMeta = requestMetadata(request);
  const formData = await request.formData();
  const idToken = String(formData.get("id_token") || "");
  const state = String(formData.get("state") || "");
  const expectedState = request.cookies.get(ltiStateCookieName)?.value;
  const expectedNonce = request.cookies.get(ltiNonceCookieName)?.value;
  const isMock = process.env.LTI_MOCK_MODE === "true";

  if (!idToken) {
    return NextResponse.json({ error: "Missing id_token from Canvas LTI launch." }, { status: 400 });
  }

  // CSRF/replay protection for real launches: the OIDC login step set a state
  // cookie, so a real launch must echo it back. Previously this check was
  // skipped entirely whenever the cookie was absent.
  if (!isMock && (!expectedState || state !== expectedState)) {
    return NextResponse.json({ error: "Invalid or missing LTI state." }, { status: 400 });
  }

  const context = await validateLtiIdToken(idToken, {
    expectedNonce: isMock ? undefined : expectedNonce
  });
  const records = await resolveOrCreateLtiRecords(context);

  await writeAuditLog({
    schoolId: records.school.id,
    userId: records.user.id,
    action: AuditAction.LTI_LAUNCH,
    resource: "canvas_lti_launch",
    metadata: {
      issuer: context.issuer,
      deploymentId: context.deploymentId,
      role: context.role
    },
    ...requestMeta
  });

  const response = NextResponse.redirect(new URL(redirectPathForRole(context.role), request.url));
  response.cookies.set(ltiContextCookieName, await signLtiSession(context), cookieSettings());
  response.cookies.delete(ltiStateCookieName);
  response.cookies.delete(ltiNonceCookieName);
  return response;
}
