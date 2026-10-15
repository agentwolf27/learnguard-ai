import { AuditAction, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { streamAiResponse } from "@/lib/aiResponse";
import { recordLearningInsights } from "@/lib/analytics";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { classifyWithGpt } from "@/lib/gptClassifier";
import { getLtiContextFromCookies, mockLtiContext } from "@/lib/lti";
import { resolveOrCreateLtiRecords } from "@/lib/ltiPersistence";
import { prisma } from "@/lib/prisma";
import { classifyWithRules } from "@/lib/ruleClassifier";
import {
  assertRateLimit,
  assertSameOrigin,
  promptRequestSchema,
  requestMetadata,
  sanitizePrompt
} from "@/lib/security";
import { estimateSustainability } from "@/lib/sustainability";
import type { CombinedClassification, GovernanceClassification, LtiLaunchContext } from "@/lib/types";

const riskOrder = {
  low: 0,
  medium: 1,
  high: 2
} as const;

function highestRisk(a: CombinedClassification["riskLevel"], b: CombinedClassification["riskLevel"]) {
  return riskOrder[a] >= riskOrder[b] ? a : b;
}

function applyPolicy(
  classification: CombinedClassification,
  policy?: {
    allowBrainstorming: boolean;
    allowOutlining: boolean;
    allowDraftFeedback: boolean;
    allowConceptExplanation: boolean;
    blockFullEssayGeneration: boolean;
    blockFinalAnswers: boolean;
    blockTestQuizSolving: boolean;
    blockPlagiarismEvasion: boolean;
    requireCitation: boolean;
  } | null
): CombinedClassification {
  if (!policy) return classification;

  const phrases = classification.matchedPhrases.join(" ");
  let blockedReason = "";

  if (classification.category === "Brainstorming" && !policy.allowBrainstorming) {
    blockedReason = "Brainstorming is disabled for this assignment.";
  }

  if (classification.category === "Draft Feedback" && !policy.allowDraftFeedback) {
    blockedReason = "Draft feedback is disabled for this assignment.";
  }

  if (classification.category === "Concept Explanation" && !policy.allowConceptExplanation) {
    blockedReason = "Concept explanation is disabled for this assignment.";
  }

  if (policy.blockFullEssayGeneration && /write my essay|complete my assignment/.test(phrases)) {
    blockedReason = "Full assignment or essay generation is blocked by the teacher's policy.";
  }

  if (policy.blockFinalAnswers && /give me the answers|answer key/.test(phrases)) {
    blockedReason = "Final-answer requests are blocked by the teacher's policy.";
  }

  if (policy.blockTestQuizSolving && /take my quiz|solve this test|cheat on/.test(phrases)) {
    blockedReason = "Test and quiz circumvention is blocked by the teacher's policy.";
  }

  if (policy.blockPlagiarismEvasion && /make it undetectable|bypass plagiarism/.test(phrases)) {
    blockedReason = "Plagiarism-evasion requests are blocked by the teacher's policy.";
  }

  if (!blockedReason) return classification;

  return {
    ...classification,
    allowed: false,
    riskLevel: highestRisk(classification.riskLevel, "high"),
    reason: `${classification.reason} ${blockedReason}`,
    educationalAlternative:
      "Ask for an outline, a concept explanation, practice questions, or feedback on work you have already written."
  };
}

function combineClassifications(
  ruleClassification: ReturnType<typeof classifyWithRules>,
  gptClassification: GovernanceClassification
): CombinedClassification {
  const ruleBlocked = ruleClassification.flagged;

  return {
    ...gptClassification,
    allowed: gptClassification.allowed && !ruleBlocked,
    riskLevel: highestRisk(ruleClassification.riskLevel, gptClassification.riskLevel),
    flagged: ruleClassification.flagged,
    matchedPhrases: ruleClassification.matchedPhrases,
    ruleRiskLevel: ruleClassification.riskLevel,
    reason: ruleBlocked
      ? `${gptClassification.reason} Rule classifier matched: ${ruleClassification.matchedPhrases.join(", ")}.`
      : gptClassification.reason
  };
}

export async function POST(request: NextRequest) {
  const requestMeta = requestMetadata(request);

  try {
    assertSameOrigin(request);
    assertRateLimit(request, {
      key: "assistant",
      limit: 30,
      windowMs: 60_000
    });

    const body = promptRequestSchema.parse(await request.json());
    const prompt = sanitizePrompt(body.prompt);
    const signedContext = await getLtiContextFromCookies();
    const viewer = await getAuthenticatedViewer({
      required: false,
      allowedRoles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN],
      demoRole: UserRole.STUDENT
    });
    // Never trust client-supplied launch context when a signed session cookie
    // exists — the cookie is the tamper-proof source of Canvas role + assignment.
    const context =
      signedContext ||
      (body.context as LtiLaunchContext | undefined) ||
      (viewer
        ? {
            userId: viewer.clerkUserId || viewer.userId,
            userName: viewer.name,
            userEmail: viewer.email,
            role:
              viewer.role === UserRole.ADMIN
                ? "admin"
                : viewer.role === UserRole.TEACHER
                  ? "teacher"
                  : "student"
          }
        : mockLtiContext("student"));
    const records = await resolveOrCreateLtiRecords(context);
    const policy = records.assignment
      ? await prisma.assignmentPolicy.findUnique({
          where: { assignmentId: records.assignment.id }
        })
      : null;

    const ruleClassification = classifyWithRules(prompt);
    const gptClassification = await classifyWithGpt(prompt, ruleClassification);
    const classification = applyPolicy(
      combineClassifications(ruleClassification, gptClassification),
      policy
    );

    // Everything above can throw before the stream opens (and returns a normal
    // JSON error). Once the stream is open, the AI response is forwarded chunk
    // by chunk; persistence + audit logging happen after the stream completes,
    // because the full response text is needed to log it and estimate impact.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (frame: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`));
        };

        try {
          // Send the governance decision first so the UI can show it immediately.
          send({ type: "classification", classification });

          let aiResponse = "";
          for await (const delta of streamAiResponse(prompt, classification)) {
            aiResponse += delta;
            send({ type: "delta", text: delta });
          }

          if (classification.allowed && policy?.requireCitation) {
            const reminder =
              "\n\n---\nReminder: Cite your sources and course materials when applying this guidance to your assignment.";
            aiResponse += reminder;
            send({ type: "delta", text: reminder });
          }

          const sustainability = estimateSustainability(prompt, aiResponse);

          const promptLog = await prisma.promptLog.create({
            data: {
              studentId: records.user.id,
              teacherId: records.teacherId,
              schoolId: records.school.id,
              courseId: records.course?.id,
              assignmentId: records.assignment?.id,
              originalPrompt: prompt,
              aiResponse,
              allowed: classification.allowed,
              category: classification.category,
              riskLevel: classification.riskLevel,
              reason: classification.reason,
              educationalAlternative: classification.educationalAlternative,
              matchedPhrases: JSON.stringify(classification.matchedPhrases),
              estimatedTokens: sustainability.estimatedTokens,
              estimatedCO2Grams: sustainability.estimatedCO2Grams,
              estimatedWaterML: sustainability.estimatedWaterML,
              classification: {
                create: {
                  flagged: classification.flagged,
                  matchedPhrases: JSON.stringify(classification.matchedPhrases),
                  riskLevel: classification.riskLevel,
                  category: classification.category,
                  allowed: classification.allowed,
                  reason: classification.reason,
                  educationalAlternative: classification.educationalAlternative,
                  confidence: classification.confidence
                }
              }
            }
          });

          await recordLearningInsights({
            prisma,
            schoolId: records.school.id,
            courseId: records.course?.id,
            assignmentId: records.assignment?.id,
            prompt,
            context,
            classification
          });

          await writeAuditLog({
            schoolId: records.school.id,
            userId: records.user.id,
            clerkUserId: viewer?.clerkUserId,
            action: AuditAction.PROMPT_SUBMITTED,
            resource: "prompt_log",
            resourceId: promptLog.id,
            metadata: {
              allowed: classification.allowed,
              category: classification.category,
              riskLevel: classification.riskLevel
            },
            ...requestMeta
          });

          if (!classification.allowed) {
            await writeAuditLog({
              schoolId: records.school.id,
              userId: records.user.id,
              clerkUserId: viewer?.clerkUserId,
              action: AuditAction.PROMPT_BLOCKED,
              resource: "prompt_log",
              resourceId: promptLog.id,
              metadata: {
                matchedPhrases: classification.matchedPhrases,
                reason: classification.reason
              },
              ...requestMeta
            });
          }

          send({
            type: "done",
            promptLogId: promptLog.id,
            aiResponse,
            classification,
            sustainability
          });
        } catch (streamError) {
          console.error("assistant stream failed", {
            route: "/api/assistant",
            requestId: requestMeta.requestId,
            error: streamError
          });
          send({ type: "error", error: "The assistant request failed. Please try again." });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    return errorResponse(error, {
      route: "/api/assistant",
      requestId: requestMeta.requestId
    });
  }
}
