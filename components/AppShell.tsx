import Link from "next/link";
import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  PlayCircle,
  ShieldCheck,
  Users
} from "lucide-react";
import { AuthControls } from "@/components/AuthControls";
import type { LtiLaunchContext } from "@/lib/types";

const navItems = [
  { href: "/demo", label: "Demo", icon: PlayCircle, key: "demo" },
  { href: "/lti/student", label: "Student", icon: GraduationCap, key: "student" },
  { href: "/dashboard/teacher", label: "Teacher", icon: LayoutDashboard, key: "teacher" },
  { href: "/dashboard/admin", label: "Admin", icon: BarChart3, key: "admin" },
  { href: "/api/lti/jwks", label: "JWKS", icon: KeyRound, key: "jwks" }
] as const;

export function AppShell({
  children,
  active,
  context
}: {
  children: React.ReactNode;
  active: "student" | "teacher" | "admin" | "home" | "demo";
  context?: LtiLaunchContext | null;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-line/80 bg-white/72 px-4 py-5 lg:block">
          <Link href="/" className="focus-ring flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">LearnGuard AI</span>
              <span className="text-xs text-ink/55">Classroom AI governance</span>
            </span>
          </Link>

          <nav className="mt-8 space-y-1" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    selected ? "bg-forest text-white" : "text-ink/68 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-lg border border-line/80 bg-paper/80 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpenCheck className="h-4 w-4 text-forest" aria-hidden="true" />
              Canvas context
            </div>
            <div className="mt-3 space-y-2 text-xs text-ink/64">
              <p>{context?.courseName || "Mock course ready"}</p>
              <p>{context?.assignmentTitle || "Assignment launch supported"}</p>
              <p className="capitalize">{context?.role || "local"} mode</p>
            </div>
          </div>

          <div className="mt-4">
            <AuthControls />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-line/80 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-forest" aria-hidden="true" />
                <span className="font-semibold">LearnGuard AI</span>
              </Link>
              <Link
                href="/demo"
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Demo
              </Link>
              <AuthControls />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
