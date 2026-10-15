import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  PlayCircle,
  School,
  ShieldCheck
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DemoPreflight } from "@/components/DemoPreflight";

const launchButtons = [
  {
    href: "/api/mock-lti?role=student",
    title: "Launch as Student",
    detail: "Governed AI assistant with assignment context",
    icon: GraduationCap,
    tone: "forest" as const
  },
  {
    href: "/api/mock-lti?role=teacher",
    title: "Launch as Teacher",
    detail: "Prompt visibility, risk trends, and policy controls",
    icon: LayoutDashboard,
    tone: "sky" as const
  },
  {
    href: "/api/mock-lti?role=admin",
    title: "Launch as Admin",
    detail: "School-wide adoption and integrity patterns",
    icon: School,
    tone: "gold" as const
  }
];

export default function DemoPage() {
  return (
    <AppShell active="demo">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-line/80 bg-white/85 p-8 shadow-soft">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-forest p-3 text-white">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-forest">Professor demo</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                  AI governance for Canvas classrooms
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/65">
                  LearnGuard AI gives students a responsible assistant, gives teachers visibility into how AI is used on
                  assignments, and applies assignment-specific guardrails—not a cheating detector.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-6 text-ink/72">
              <strong className="font-semibold text-ink">Local / mock Canvas mode.</strong> These launches simulate an
              LTI 1.3 external tool with seeded Northstar High School data. No real Canvas login is required for this
              demo.
            </div>

            <DemoPreflight />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {launchButtons.map((option) => {
                const Icon = option.icon;
                return (
                  <Link
                    key={option.href}
                    href={option.href}
                    className="focus-ring group rounded-xl border border-line/80 bg-paper/60 p-5 transition hover:border-forest/40 hover:bg-white"
                  >
                    <span
                      className={`inline-flex rounded-lg p-2.5 ${
                        option.tone === "forest"
                          ? "bg-forest/10 text-forest"
                          : option.tone === "sky"
                            ? "bg-sky/10 text-sky"
                            : "bg-gold/10 text-gold"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-ink">{option.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{option.detail}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest">
                      Start demo
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-line/70 pt-6">
              <a
                href="https://github.com/agentwolf27/learnguard-ai/blob/main/DEMO_SCRIPT.md"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink/75 hover:bg-paper"
              >
                <PlayCircle className="h-4 w-4 text-forest" aria-hidden="true" />
                Demo script
              </a>
              <Link
                href="/privacy"
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink/75 hover:bg-paper"
              >
                <BookOpen className="h-4 w-4 text-forest" aria-hidden="true" />
                Privacy overview
              </Link>
              <Link
                href="/pilot"
                className="focus-ring inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-forest/92"
              >
                Request a pilot
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink/50">
            Tip: run <code className="rounded bg-white px-1.5 py-0.5">npm run db:seed</code> before the demo for sample
            analytics.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
