import Link from "next/link";
import { ArrowRight, GraduationCap, LayoutDashboard, School, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const launchOptions = [
  {
    href: "/api/mock-lti?role=student",
    title: "Student launch",
    detail: "Canvas external tool view",
    icon: GraduationCap
  },
  {
    href: "/api/mock-lti?role=teacher",
    title: "Teacher launch",
    detail: "Course analytics and policies",
    icon: LayoutDashboard
  },
  {
    href: "/api/mock-lti?role=admin",
    title: "Admin launch",
    detail: "School-wide analytics",
    icon: School
  }
];

export default function Home() {
  return (
    <AppShell active="home">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-line/80 pb-5">
            <p className="text-sm font-semibold text-forest">LTI 1.3 governance MVP</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">LearnGuard AI</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">
              AI governance infrastructure for classrooms, built around Canvas launch context, assignment guardrails,
              teacher visibility, learning analytics, and responsible student support.
            </p>
            <Link
              href="/demo"
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-forest/92"
            >
              Open professor demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {launchOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.href}
                  href={option.href}
                  className="focus-ring group rounded-lg border border-line/80 bg-white/78 p-5 shadow-soft hover:border-forest/35"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-lg bg-forest/10 p-3 text-forest">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight className="h-5 w-5 text-ink/35 transition group-hover:translate-x-0.5 group-hover:text-forest" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-ink">{option.title}</h2>
                  <p className="mt-2 text-sm text-ink/58">{option.detail}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-line/80 bg-white/78 p-5 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-sky/10 p-3 text-sky">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">Canvas configuration endpoints</h2>
                  <p className="mt-1 text-sm text-ink/58">
                    OIDC login, launch redirect, and JWKS routes are available for Developer Key setup.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-ink/65 sm:grid-cols-3 md:text-right">
                <span>/api/lti/login</span>
                <span>/api/lti/launch</span>
                <span>/api/lti/jwks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
