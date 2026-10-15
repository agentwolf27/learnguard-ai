import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PilotRequestForm } from "@/components/PilotRequestForm";

export default function PilotPage() {
  return (
    <AppShell active="home">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="border-b border-line/80 pb-5">
            <p className="text-sm font-semibold text-forest">Pilot program</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Request a LearnGuard AI pilot</h1>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              Share your interest for a classroom pilot. This form is for demo purposes and does not send email yet.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-line/80 bg-white/78 p-6 shadow-soft">
            <PilotRequestForm />
          </div>

          <p className="mt-6 text-sm text-ink/58">
            Review our{" "}
            <Link href="/privacy" className="font-semibold text-forest hover:underline">
              privacy overview
            </Link>{" "}
            before using real student data.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
