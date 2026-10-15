import { AuditAction, UserRole } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { TeacherDashboardClient } from "@/components/TeacherDashboardClient";
import { writeAuditLog } from "@/lib/audit";
import { requirePageViewer } from "@/lib/auth";
import { getTeacherDashboardData } from "@/lib/dashboardData";
import { getLtiContextFromCookies, mockLtiContext } from "@/lib/lti";

export const dynamic = "force-dynamic";

export default async function TeacherLtiPage() {
  const viewer = await requirePageViewer({
    allowedRoles: [UserRole.TEACHER, UserRole.ADMIN],
    demoRole: UserRole.TEACHER
  });
  const [context, data] = await Promise.all([getLtiContextFromCookies(), getTeacherDashboardData(viewer)]);

  await writeAuditLog({
    schoolId: viewer.schoolId,
    userId: viewer.userId,
    clerkUserId: viewer.clerkUserId,
    action: AuditAction.DASHBOARD_ACCESSED,
    resource: "teacher_lti_dashboard"
  });

  return (
    <AppShell active="teacher" context={context || mockLtiContext("teacher")}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-line/80 pb-5">
            <p className="text-sm font-semibold text-forest">Teacher workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">Course AI governance</h1>
          </div>
          <div className="mt-6">
            <TeacherDashboardClient data={data} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
