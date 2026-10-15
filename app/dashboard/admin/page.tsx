import { AuditAction, UserRole } from "@prisma/client";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AppShell } from "@/components/AppShell";
import { writeAuditLog } from "@/lib/audit";
import { requirePageViewer } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboardData";
import { getLtiContextFromCookies, mockLtiContext } from "@/lib/lti";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const viewer = await requirePageViewer({
    allowedRoles: [UserRole.ADMIN],
    demoRole: UserRole.ADMIN
  });
  const [context, data] = await Promise.all([getLtiContextFromCookies(), getAdminDashboardData(viewer)]);

  await writeAuditLog({
    schoolId: viewer.schoolId,
    userId: viewer.userId,
    clerkUserId: viewer.clerkUserId,
    action: AuditAction.DASHBOARD_ACCESSED,
    resource: "admin_dashboard"
  });

  return (
    <AppShell active="admin" context={context || mockLtiContext("admin")}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-line/80 pb-5">
            <p className="text-sm font-semibold text-forest">Admin dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">School-wide AI adoption</h1>
          </div>
          <div className="mt-6">
            <AdminDashboard data={data} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
