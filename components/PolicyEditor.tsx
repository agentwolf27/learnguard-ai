"use client";

import { useState } from "react";
import { Ban, Check, Save } from "lucide-react";
import { StatePanel } from "@/components/StatePanel";

type Policy = {
  id: string;
  allowBrainstorming: boolean;
  allowOutlining: boolean;
  allowDraftFeedback: boolean;
  allowConceptExplanation: boolean;
  blockFullEssayGeneration: boolean;
  blockFinalAnswers: boolean;
  blockTestQuizSolving: boolean;
  blockPlagiarismEvasion: boolean;
  requireCitation: boolean;
};

export type AssignmentPolicyItem = {
  id: string;
  title: string;
  courseName: string;
  policy: Policy;
};

const allowControls = [
  ["allowBrainstorming", "Brainstorming"],
  ["allowOutlining", "Outlining"],
  ["allowDraftFeedback", "Draft feedback"],
  ["allowConceptExplanation", "Concept explanation"]
] as const;

const blockControls = [
  ["blockFullEssayGeneration", "Full essay generation"],
  ["blockFinalAnswers", "Final answers"],
  ["blockTestQuizSolving", "Test and quiz solving"],
  ["blockPlagiarismEvasion", "Plagiarism evasion"]
] as const;

const guidanceControls = [["requireCitation", "Require citation reminder"]] as const;

function Toggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line/80 bg-white px-3 py-2">
      <span className="text-sm font-medium text-ink/72">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-line text-forest focus:ring-forest"
      />
    </label>
  );
}

export function PolicyEditor({ assignments }: { assignments: AssignmentPolicyItem[] }) {
  const [items, setItems] = useState(assignments);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updatePolicy(assignmentId: string, key: keyof Policy, value: boolean) {
    setSavingId(assignmentId);
    setError("");
    const currentItems = items;
    const nextItems = items.map((item) =>
      item.id === assignmentId ? { ...item, policy: { ...item.policy, [key]: value } } : item
    );
    setItems(nextItems);

    try {
      const response = await fetch(`/api/assignment-policies/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Policy update failed.");
      }

      setSavedId(assignmentId);
      window.setTimeout(() => setSavedId((current) => (current === assignmentId ? null : current)), 2000);
    } catch (updateError) {
      setItems(currentItems);
      setError(updateError instanceof Error ? updateError.message : "Policy update failed.");
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Assignment policies</h2>
        <div className="mt-4">
          <StatePanel
            variant="empty"
            title="No assignments yet"
            description="Seed the database or launch from a course with assignments to configure per-assignment AI guardrails."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Assignment policies</h2>
          <p className="mt-1 text-sm text-ink/58">Teacher guardrails by assignment.</p>
        </div>
        <Save className="h-5 w-5 text-forest" aria-hidden="true" />
      </div>

      {error ? (
        <div className="mt-4">
          <StatePanel variant="error" title="Policy save failed" description={error} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-line/80 bg-paper/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-ink/56">{item.courseName}</p>
              </div>
              {savingId === item.id ? (
                <span className="rounded-full border border-sky/20 bg-sky/10 px-2 py-1 text-xs font-semibold text-sky">
                  Saving
                </span>
              ) : savedId === item.id ? (
                <span className="rounded-full border border-forest/20 bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
                  Saved
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-forest">
                <Check className="h-4 w-4" aria-hidden="true" />
                Allowed
              </div>
              <div className="grid gap-2">
                {allowControls.map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={item.policy[key]}
                    onChange={(checked) => updatePolicy(item.id, key, checked)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-coral">
                <Ban className="h-4 w-4" aria-hidden="true" />
                Blocked
              </div>
              <div className="grid gap-2">
                {blockControls.map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={item.policy[key]}
                    onChange={(checked) => updatePolicy(item.id, key, checked)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/55">
                Guidance
              </div>
              <div className="grid gap-2">
                {guidanceControls.map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={item.policy[key]}
                    onChange={(checked) => updatePolicy(item.id, key, checked)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
