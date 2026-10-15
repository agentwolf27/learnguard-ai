import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { requestMetadata } from "@/lib/security";

export async function GET(request: NextRequest) {
  const requestMeta = requestMetadata(request);

  try {
    const viewer = await getAuthenticatedViewer({ required: false });

    await writeAuditLog({
      schoolId: viewer?.schoolId,
      userId: viewer?.userId,
      clerkUserId: viewer?.clerkUserId,
      action: AuditAction.DEEP_LINK_REQUESTED,
      resource: "lti_deep_linking",
      metadata: {
        status: "not_enabled",
        message: "Deep Linking endpoint is provisioned for pilot deployment."
      },
      ...requestMeta
    });

    return NextResponse.json({
      status: "ready",
      message:
        "LTI Deep Linking architecture is provisioned. Enable signed Deep Linking responses after Canvas Developer Key scopes are approved.",
      scopes: ["https://purl.imsglobal.org/spec/lti-dl/scope/deeplinking"]
    });
  } catch (error) {
    return errorResponse(error, {
      route: "/api/lti/deep-link",
      requestId: requestMeta.requestId
    });
  }
}
