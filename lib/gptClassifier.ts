import { defaultOpenAIModel, getOpenAIClient } from "@/lib/openaiClient";
import { withRetry } from "@/lib/retry";
import type {
  GovernanceClassification,
  PromptCategory,
  RiskLevel,
  RuleClassification
} from "@/lib/types";

const systemPrompt = `You are an Educational AI Governance Engine.
Your job is to decide whether a student's request supports learning or attempts to bypass learning.
Allow learning-focused help.
Block requests that ask for final answers, graded work completion, cheating, plagiarism evasion, or test circumvention.
Always provide an educational alternative.

Return JSON only.`;

const categoryValues: PromptCategory[] = [
  "Learning Assistance",
  "Research",
  "Brainstorming",
  "Draft Feedback",
  "Concept Explanation",
  "Homework Support",
  "Assessment Circumvention",
  "Direct Answer Request",
  "Academic Integrity Risk"
];

const riskValues: RiskLevel[] = ["low", "medium", "high"];

function parseClassification(raw: string): GovernanceClassification {
  const parsed = JSON.parse(raw) as Partial<GovernanceClassification>;

  return {
    category: categoryValues.includes(parsed.category as PromptCategory)
      ? (parsed.category as PromptCategory)
      : "Learning Assistance",
    riskLevel: riskValues.includes(parsed.riskLevel as RiskLevel)
      ? (parsed.riskLevel as RiskLevel)
      : "low",
    allowed: Boolean(parsed.allowed),
    reason: parsed.reason || "The request was evaluated against classroom AI-use rules.",
    educationalAlternative:
      parsed.educationalAlternative ||
      "Ask for a concept explanation, outline, practice question, or feedback on your own draft.",
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.7
  };
}

export function mockGptClassifier(
  prompt: string,
  ruleClassification: RuleClassification
): GovernanceClassification {
  const normalized = prompt.toLowerCase();

  if (ruleClassification.flagged) {
    return {
      category:
        ruleClassification.riskLevel === "high"
          ? "Academic Integrity Risk"
          : "Direct Answer Request",
      riskLevel: ruleClassification.riskLevel,
      allowed: false,
      reason: `The request matched academic-integrity risk language: ${ruleClassification.matchedPhrases.join(", ")}.`,
      educationalAlternative:
        "I can help you understand the concept, create an outline, review your draft, generate practice questions, or walk through a similar example.",
      confidence: 0.92
    };
  }

  if (/(brainstorm|ideas|topic|thesis)/i.test(normalized)) {
    return {
      category: "Brainstorming",
      riskLevel: "low",
      allowed: true,
      reason: "The request asks for idea generation that can support student thinking.",
      educationalAlternative: "Use the ideas as starting points and connect them to your own course materials.",
      confidence: 0.78
    };
  }

  if (/(draft|revise|feedback|rubric)/i.test(normalized)) {
    return {
      category: "Draft Feedback",
      riskLevel: "low",
      allowed: true,
      reason: "The request asks for feedback rather than replacement work.",
      educationalAlternative: "Share your draft and ask for targeted feedback on clarity, structure, or evidence.",
      confidence: 0.8
    };
  }

  if (/(explain|understand|concept|why|how does|walk me through)/i.test(normalized)) {
    return {
      category: "Concept Explanation",
      riskLevel: "low",
      allowed: true,
      reason: "The request is learning-focused and asks for explanation.",
      educationalAlternative: "Ask for a worked example or practice problem after the explanation.",
      confidence: 0.82
    };
  }

  return {
    category: "Learning Assistance",
    riskLevel: "low",
    allowed: true,
    reason: "The request appears to support learning without asking to bypass the assignment.",
    educationalAlternative: "Keep the interaction focused on understanding, feedback, and practice.",
    confidence: 0.68
  };
}

export async function classifyWithGpt(
  prompt: string,
  ruleClassification: RuleClassification
): Promise<GovernanceClassification> {
  const client = getOpenAIClient();

  if (!client) {
    return mockGptClassifier(prompt, ruleClassification);
  }

  try {
    const response = await withRetry(
      () =>
        client.responses.create({
          model: defaultOpenAIModel,
          input: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: JSON.stringify({
                studentPrompt: prompt,
                ruleClassification
              })
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "governance_classification",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  category: { type: "string", enum: categoryValues },
                  riskLevel: { type: "string", enum: riskValues },
                  allowed: { type: "boolean" },
                  reason: { type: "string" },
                  educationalAlternative: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: [
                  "category",
                  "riskLevel",
                  "allowed",
                  "reason",
                  "educationalAlternative",
                  "confidence"
                ]
              }
            }
          },
          max_output_tokens: 500
        }),
      { label: "gpt_classifier", attempts: 2 }
    );

    return parseClassification(response.output_text || "{}");
  } catch (error) {
    console.error("GPT classifier failed, using mock classifier.", error);
    return mockGptClassifier(prompt, ruleClassification);
  }
}
