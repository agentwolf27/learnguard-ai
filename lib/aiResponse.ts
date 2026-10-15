import { defaultOpenAIModel, getOpenAIClient } from "@/lib/openaiClient";
import { withRetry } from "@/lib/retry";
import type { CombinedClassification } from "@/lib/types";

export const blockedResponse =
  "I can't complete graded work or provide final answers for you. I can help you understand the concept, create an outline, review your draft, generate practice questions, or walk through a similar example.";

const assistantSystemPrompt =
  "You are LearnGuard AI, a student-facing assistant. Help students learn without completing graded work for them. Prefer explanation, scaffolding, questions, examples with changed details, outlines, and feedback.";

const streamFallbackText =
  "I can help you learn this by breaking it into steps, explaining the key concept, and giving you a similar practice example to try.";

function localFallbackText(prompt: string): string {
  return [
    "Here is a learning-focused way to approach this:",
    "",
    "1. Identify the core concept or skill in your prompt.",
    "2. Write down what you already know and where you feel stuck.",
    "3. Try a small example before applying the idea to your assignment.",
    "",
    `For your request, I would start by reframing it as: "${prompt.slice(0, 180)}${prompt.length > 180 ? "..." : ""}"`,
    "",
    "Then ask for an explanation, checklist, practice problem, or feedback on your own work."
  ].join("\n");
}

export async function generateAiResponse(
  prompt: string,
  classification: CombinedClassification
): Promise<string> {
  if (!classification.allowed) {
    return blockedResponse;
  }

  const client = getOpenAIClient();

  if (!client) {
    return localFallbackText(prompt);
  }

  try {
    const response = await withRetry(
      () =>
        client.responses.create({
          model: defaultOpenAIModel,
          input: [
            {
              role: "system",
              content: assistantSystemPrompt
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_output_tokens: 900
        }),
      { label: "ai_response", attempts: 2 }
    );

    return response.output_text || "I can help with an explanation, outline, or practice example.";
  } catch (error) {
    console.error("AI response failed, using local fallback.", error);
    return streamFallbackText;
  }
}

/**
 * Streaming variant of {@link generateAiResponse}. Yields text chunks as they
 * arrive so the route can forward them to the client. Blocked prompts never
 * reach the LLM — they yield the canned guardrail message instead. When no
 * OpenAI key is configured, the deterministic fallback is chunked so the UI
 * still renders progressively.
 */
export async function* streamAiResponse(
  prompt: string,
  classification: CombinedClassification
): AsyncGenerator<string, void, unknown> {
  if (!classification.allowed) {
    yield blockedResponse;
    return;
  }

  const client = getOpenAIClient();

  if (!client) {
    const tokens = localFallbackText(prompt).match(/\S+\s*|\s+/g) || [localFallbackText(prompt)];
    for (const token of tokens) {
      yield token;
    }
    return;
  }

  try {
    const stream = await client.responses.create({
      model: defaultOpenAIModel,
      input: [
        {
          role: "system",
          content: assistantSystemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_output_tokens: 900,
      stream: true
    });

    let emittedAny = false;
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        emittedAny = true;
        yield event.delta;
      }
    }

    if (!emittedAny) {
      yield "I can help with an explanation, outline, or practice example.";
    }
  } catch (error) {
    console.error("AI response stream failed, using local fallback.", error);
    yield streamFallbackText;
  }
}
