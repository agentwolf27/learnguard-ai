import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { ltiContextCookieName, mockLtiContext, signLtiSession } from "@/lib/lti";
import { resolveOrCreateLtiRecords } from "@/lib/ltiPersistence";
import { requestMetadata } from "@/lib/security";
import type { LtiRole } from "@/lib/types";

function cookieSettings() {
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8,
    path: "/"
  };
}

export async function GET(request: NextRequest) {
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

  const target =
    role === "teacher" ? "/lti/teacher" : role === "admin" ? "/dashboard/admin" : "/lti/student";
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(ltiContextCookieName, await signLtiSession(context), cookieSettings());
  return response;
}
