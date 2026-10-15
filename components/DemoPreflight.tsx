"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type HealthPayload = {
  status: string;
  readyForDemo: boolean;
  readyForCanvasPilot?: boolean;
  checks: Record<string, boolean | string>;
  hints: string[];
};

export function DemoPreflight() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Health check failed.");
        }
        return response.json() as Promise<HealthPayload>;
      })
      .then(setHealth)
      .catch(() => setError("Could not reach the app health endpoint. Is npm run dev running?"));
  }, []);

  if (error) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-coral/25 bg-coral/10 p-4 text-sm text-coral">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-line/80 bg-paper/70 px-4 py-3 text-sm text-ink/60">
        <Loader2 className="h-4 w-4 animate-spin text-forest" aria-hidden="true" />
        Checking demo readiness…
      </div>
    );
  }

  const items = [
    { label: "Database reachable", ok: health.checks.databaseReachable === true },
    { label: "Mock Canvas mode (LTI_MOCK_MODE=true)", ok: health.checks.ltiMockMode === true },
    { label: "Clerk configured (staff auth)", ok: health.checks.clerkConfigured === true, optional: true },
    { label: "OpenAI key (optional)", ok: health.checks.openAiConfigured === true, optional: true }
  ];

  const ready = health.readyForDemo || health.readyForCanvasPilot;

  return (
    <div
      className={`mt-6 rounded-lg border p-4 ${
        ready ? "border-forest/25 bg-forest/8" : "border-gold/30 bg-gold/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">
            {health.readyForCanvasPilot
              ? "Ready for Canvas pilot"
              : health.readyForDemo
                ? "Ready for professor demo"
                : "Demo needs setup"}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/68">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className={item.ok ? "text-forest" : item.optional ? "text-ink/40" : "text-gold"}>
                  {item.ok ? "✓" : item.optional ? "○" : "!"}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
          {health.hints.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/62">
              {health.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
