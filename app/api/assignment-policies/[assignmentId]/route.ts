import { AuditAction, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedViewer } from "@/lib/auth";
import { AuthorizationError, errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  assertRateLimit,
  assertSameOrigin,
  policyPatchSchema,
  requestMetadata
} from "@/lib/security";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const requestMeta = requestMetadata(_request);

  try {
    const viewer = await getAuthenticatedViewer({
      allowedRoles: [UserRole.TEACHER, UserRole.ADMIN],
      demoRole: UserRole.TEACHER
    });
    if (!viewer) throw new AuthorizationError();
    const { assignmentId } = await context.params;
    await assertAssignmentAccess(assignmentId, viewer);
    const policy = await prisma.assignmentPolicy.upsert({
      where: { assignmentId },
      update: {},
      create: { assignmentId }
    });

    return NextResponse.json(policy);
  } catch (error) {
    return errorResponse(error, {
      route: "/api/assignment-policies/[assignmentId]",
      requestId: requestMeta.requestId
    });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestMeta = requestMetadata(request);

  try {
    assertSameOrigin(request);
    assertRateLimit(request, {
      key: "policy",
      limit: 60,
      windowMs: 60_000
    });

    const viewer = await getAuthenticatedViewer({
      allowedRoles: [UserRole.TEACHER, UserRole.ADMIN],
      demoRole: UserRole.TEACHER
    });
    if (!viewer) throw new AuthorizationError();
    const { assignmentId } = await context.params;
    await assertAssignmentAccess(assignmentId, viewer);
    const data = policyPatchSchema.parse(await request.json());

    const policy = await prisma.assignmentPolicy.upsert({
      where: { assignmentId },
      update: data,
      create: {
        assignmentId,
        ...data
      }
    });

    await writeAuditLog({
      schoolId: viewer?.schoolId,
      userId: viewer?.userId,
      clerkUserId: viewer?.clerkUserId,
      action: AuditAction.POLICY_CHANGED,
      resource: "assignment_policy",
      resourceId: policy.id,
      metadata: {
        assignmentId,
        changedFields: Object.keys(data)
      },
      ...requestMeta
    });

    return NextResponse.json(policy);
  } catch (error) {
    return errorResponse(error, {
      route: "/api/assignment-policies/[assignmentId]",
      requestId: requestMeta.requestId
    });
  }
}

async function assertAssignmentAccess(
  assignmentId: string,
  viewer: NonNullable<Awaited<ReturnType<typeof getAuthenticatedViewer>>>
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true
    }
  });

  if (!assignment || assignment.course.schoolId !== viewer.schoolId) {
    throw new AuthorizationError();
  }

  if (viewer.role !== UserRole.ADMIN && assignment.course.teacherId !== viewer.userId) {
    throw new AuthorizationError();
  }
}
