import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function writeAuditLog({
  schoolId,
  userId,
  clerkUserId,
  action,
  resource,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
  requestId
}: {
  schoolId?: string | null;
  userId?: string | null;
  clerkUserId?: string | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: schoolId || undefined,
        userId: userId || undefined,
        clerkUserId: clerkUserId || undefined,
        action,
        resource,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
        requestId
      }
    });
  } catch (error) {
    logger.error("Failed to write audit log.", error, { action, schoolId, userId });
  }
}
