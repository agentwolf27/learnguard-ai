import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell active="home">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="border-b border-line/80 pb-5">
            <p className="text-sm font-semibold text-forest">Pilot privacy overview</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">How LearnGuard AI handles data</h1>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              This MVP is for controlled demos and pilots. Do not use real production student data until your school
              completes a privacy review.
            </p>
          </div>

          <div className="mt-6 space-y-6 text-sm leading-7 text-ink/72">
            <section className="rounded-lg border border-line/80 bg-white/78 p-5 shadow-soft">
              <h2 className="text-base font-semibold text-ink">What data is logged</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Student prompts submitted through the assistant</li>
                <li>AI responses returned to the student (including blocked redirects)</li>
                <li>Classification metadata (category, risk level, allow/block decision, matched phrases)</li>
                <li>Course and assignment context from the Canvas LTI launch</li>
                <li>Estimated sustainability metrics (tokens, CO₂, water—educational estimates only)</li>
                <li>Audit events (dashboard access, policy changes, LTI launches)</li>
              </ul>
            </section>

            <section className="rounded-lg border border-line/80 bg-white/78 p-5 shadow-soft">
              <h2 className="text-base font-semibold text-ink">Why prompts are logged</h2>
              <p className="mt-3">
                Classroom AI governance requires transparency: teachers need visibility into how students use AI on
                assignments, and schools need evidence for policy conversations—not surveillance for its own sake.
                Logging supports assignment-specific guardrails, teacher dashboards, and integrity trend analysis.
              </p>
            </section>

            <section className="rounded-lg border border-line/80 bg-white/78 p-5 shadow-soft">
              <h2 className="text-base font-semibold text-ink">Who can see the data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong>Teachers</strong> see prompts and analytics for courses they own (scoped by school tenant).
                </li>
                <li>
                  <strong>School admins</strong> see school-wide rollups for their institution.
                </li>
                <li>
                  <strong>Students</strong> interact through the assistant; they do not see other students&apos; logs.
                </li>
              </ul>
            </section>

            <section className="rounded-lg border border-gold/30 bg-gold/10 p-5">
              <h2 className="text-base font-semibold text-ink">MVP / pilot notice</h2>
              <p className="mt-3">
                LearnGuard AI is an early pilot product. Features, retention policies, and data processing agreements are
                not finalized for district-wide deployment. Use seeded or synthetic demo data until your institution
                approves a pilot agreement and privacy review.
              </p>
            </section>
          </div>

          <div className="mt-8">
            <Link href="/demo" className="focus-ring text-sm font-semibold text-forest hover:underline">
              Back to demo launcher
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
