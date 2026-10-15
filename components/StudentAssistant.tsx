"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Leaf, Send, Sparkles } from "lucide-react";
import { StatePanel } from "@/components/StatePanel";
import { CategoryBadge, RiskBadge, StatusBadge } from "@/components/RiskBadge";
import type { CombinedClassification, LtiLaunchContext, SustainabilityEstimate } from "@/lib/types";

type AssistantResult = {
  promptLogId?: string;
  aiResponse: string;
  classification: CombinedClassification;
  sustainability?: SustainabilityEstimate;
};

type AssistantFrame =
  | { type: "classification"; classification: CombinedClassification }
  | { type: "delta"; text: string }
  | {
      type: "done";
      promptLogId: string;
      aiResponse: string;
      classification: CombinedClassification;
      sustainability: SustainabilityEstimate;
    }
  | { type: "error"; error: string };

const examples = [
  "Explain recursion using a simple example before I try my lab.",
  "Give me feedback on this thesis: social media changes civic participation by lowering the barrier to entry.",
  "Help me brainstorm research questions about renewable energy policy.",
  "Write my essay and make it undetectable."
];

export function StudentAssistant({ context }: { context: LtiLaunchContext }) {
  const [prompt, setPrompt] = useState(examples[0]);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contextLine = useMemo(
    () =>
      [context.courseName, context.assignmentTitle, context.userName]
        .filter(Boolean)
        .join(" / "),
    [context.assignmentTitle, context.courseName, context.userName]
  );

  async function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    setResult(null);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok || !response.body) {
        let message = "The assistant request failed.";
        try {
          const payload = (await response.json()) as { error?: string };
          message = payload.error || message;
        } catch {
          // non-JSON error body
        }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      let activeClassification: CombinedClassification | null = null;

      const handleFrame = (frame: AssistantFrame) => {
        if (frame.type === "classification") {
          activeClassification = frame.classification;
          setResult({ aiResponse: streamedText, classification: frame.classification });
        } else if (frame.type === "delta") {
          streamedText += frame.text;
          if (activeClassification) {
            setResult({ aiResponse: streamedText, classification: activeClassification });
          }
        } else if (frame.type === "done") {
          streamedText = frame.aiResponse;
          setResult({
            promptLogId: frame.promptLogId,
            aiResponse: frame.aiResponse,
            classification: frame.classification,
            sustainability: frame.sustainability
          });
        } else if (frame.type === "error") {
          throw new Error(frame.error);
        }
      };

      // The body is newline-delimited JSON (NDJSON): one frame per line.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            handleFrame(JSON.parse(line) as AssistantFrame);
          }
          newlineIndex = buffer.indexOf("\n");
        }
      }

      const leftover = buffer.trim();
      if (leftover) {
        handleFrame(JSON.parse(leftover) as AssistantFrame);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-line/80 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-forest">Canvas AI assistant</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">LearnGuard AI</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">{contextLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold capitalize text-ink/70">
              {context.role}
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink/70">
              LTI mock ready
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
            <form onSubmit={submitPrompt} className="space-y-4">
              <div>
                <label htmlFor="student-prompt" className="text-sm font-semibold text-ink">
                  Prompt
                </label>
                <textarea
                  id="student-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={12}
                  className="focus-ring mt-2 min-h-72 w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm leading-6 text-ink placeholder:text-ink/35"
                  placeholder="Ask for concept help, brainstorming, outlining, feedback, or practice."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="focus-ring rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-white"
                  >
                    {example.length > 48 ? `${example.slice(0, 48)}...` : example}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || prompt.trim().length === 0}
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-forest/92 disabled:cursor-not-allowed disabled:bg-ink/25"
              >
                {isSubmitting ? (
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Checking" : "Submit"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
              <div>
                <p className="text-sm font-semibold text-ink">Governance result</p>
                <p className="mt-1 text-xs text-ink/55">Rule classifier, GPT classifier, and assignment policy.</p>
              </div>
              {result ? (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge allowed={result.classification.allowed} />
                  <RiskBadge riskLevel={result.classification.riskLevel} />
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4">
                <StatePanel
                  variant="error"
                  title="Could not process this prompt"
                  description={error}
                  action={
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="focus-ring rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/75"
                    >
                      Dismiss
                    </button>
                  }
                />
              </div>
            ) : null}

            {isSubmitting && !result ? (
              <div className="mt-4">
                <StatePanel
                  variant="loading"
                  title="Running governance checks"
                  description="Rule classifier, policy enforcement, and response generation."
                />
              </div>
            ) : null}

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <CategoryBadge category={result.classification.category} />
                  <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-ink/60">
                    Confidence {Math.round(result.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="rounded-lg border border-line/80 bg-paper/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {result.classification.allowed ? (
                      <CheckCircle2 className="h-4 w-4 text-forest" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-coral" aria-hidden="true" />
                    )}
                    Decision rationale
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/68">{result.classification.reason}</p>
                </div>

                {!result.classification.allowed ? (
                  <div className="rounded-lg border border-gold/25 bg-gold/10 p-4">
                    <p className="text-sm font-semibold text-gold">Educational alternative</p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">
                      {result.classification.educationalAlternative}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-sm font-semibold text-ink">AI response</p>
                  <div className="mt-2 whitespace-pre-wrap rounded-lg border border-line/80 bg-white p-4 text-sm leading-6 text-ink/75">
                    {result.aiResponse}
                    {isSubmitting ? (
                      <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-ink/40 align-middle" aria-hidden="true" />
                    ) : null}
                  </div>
                </div>

                {result.sustainability ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-line/80 bg-white p-3">
                        <p className="text-xs font-medium text-ink/54">Estimated tokens</p>
                        <p className="mt-1 text-lg font-semibold">{result.sustainability.estimatedTokens}</p>
                      </div>
                      <div className="rounded-lg border border-line/80 bg-white p-3">
                        <p className="text-xs font-medium text-ink/54">CO2 grams</p>
                        <p className="mt-1 text-lg font-semibold">{result.sustainability.estimatedCO2Grams}</p>
                      </div>
                      <div className="rounded-lg border border-line/80 bg-white p-3">
                        <p className="text-xs font-medium text-ink/54">Water ml</p>
                        <p className="mt-1 text-lg font-semibold">{result.sustainability.estimatedWaterML}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs leading-5 text-ink/55">
                      <Leaf className="mt-0.5 h-4 w-4 text-forest" aria-hidden="true" />
                      <p>{result.sustainability.disclaimer}</p>
                    </div>
                  </>
                ) : null}
              </div>
            ) : !isSubmitting ? (
              <div className="mt-4">
                <StatePanel
                  variant="empty"
                  title="Ready for a governed AI session"
                  description="Submit a prompt to see classification, the AI response, prompt logging, and sustainability estimates. Try an allowed learning prompt or a blocked integrity example."
                  action={<Sparkles className="h-5 w-5 text-forest" aria-hidden="true" />}
                />
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
