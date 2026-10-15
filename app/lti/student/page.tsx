import { AuditAction, UserRole } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { StudentAssistant } from "@/components/StudentAssistant";
import { writeAuditLog } from "@/lib/audit";
import { requirePageViewer } from "@/lib/auth";
import { getLtiContextFromCookies, mockLtiContext } from "@/lib/lti";

export const dynamic = "force-dynamic";

export default async function StudentLtiPage() {
  const viewer = await requirePageViewer({
    allowedRoles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN],
    demoRole: UserRole.STUDENT
  });
  const context = (await getLtiContextFromCookies()) || mockLtiContext("student");

  await writeAuditLog({
    schoolId: viewer.schoolId,
    userId: viewer.userId,
    clerkUserId: viewer.clerkUserId,
    action: AuditAction.DASHBOARD_ACCESSED,
    resource: "student_assistant"
  });

  return (
    <AppShell active="student" context={context}>
      <StudentAssistant context={context} />
    </AppShell>
  );
}
