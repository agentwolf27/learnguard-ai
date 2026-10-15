import type { PrismaClient } from "@prisma/client";
import type { CombinedClassification, LtiLaunchContext } from "@/lib/types";

const conceptPatterns: Array<{ concept: string; subjectArea: string; pattern: RegExp }> = [
  { concept: "Recursion", subjectArea: "Computer Science", pattern: /\brecursion|recursive\b/i },
  { concept: "Essay structure", subjectArea: "English", pattern: /\bessay|thesis|paragraph|outline\b/i },
  { concept: "Evidence integration", subjectArea: "English", pattern: /\bevidence|quote|citation|source\b/i },
  { concept: "Derivatives", subjectArea: "Mathematics", pattern: /\bderivative|differentiat(e|ion)\b/i },
  { concept: "Linear equations", subjectArea: "Mathematics", pattern: /\blinear equation|slope|intercept\b/i },
  { concept: "Cell biology", subjectArea: "Science", pattern: /\bcell|mitosis|meiosis|photosynthesis\b/i },
  { concept: "Historical causation", subjectArea: "History", pattern: /\bcause|effect|revolution|war\b/i },
  { concept: "Research synthesis", subjectArea: "Research", pattern: /\bresearch|annotated bibliography|literature review\b/i }
];

export function extractLearningSignals(prompt: string, context?: LtiLaunchContext) {
  const matched = conceptPatterns.filter(({ pattern }) => pattern.test(prompt));
  const concepts = matched.length > 0 ? matched.map(({ concept }) => concept) : ["General learning support"];
  const subjectArea =
    matched[0]?.subjectArea ||
    (context?.courseName?.toLowerCase().includes("english")
      ? "English"
      : context?.courseName?.toLowerCase().includes("computer")
        ? "Computer Science"
        : context?.courseName?.toLowerCase().includes("math")
          ? "Mathematics"
          : "General Education");

  return {
    subjectArea,
    concepts
  };
}

export async function recordLearningInsights({
  prisma,
  schoolId,
  courseId,
  assignmentId,
  prompt,
  context,
  classification
}: {
  prisma: PrismaClient;
  schoolId?: string;
  courseId?: string;
  assignmentId?: string;
  prompt: string;
  context?: LtiLaunchContext;
  classification: CombinedClassification;
}) {
  const { concepts, subjectArea } = extractLearningSignals(prompt, context);
  const struggleScore =
    classification.riskLevel === "high" ? 0.88 : classification.allowed ? 0.48 : 0.72;

  await Promise.all(
    concepts.map(async (concept) => {
      const existing = await prisma.learningInsight.findFirst({
        where: {
          schoolId,
          courseId,
          assignmentId,
          concept
        }
      });

      const summary =
        classification.riskLevel === "high"
          ? `High-risk prompts suggest students may be trying to bypass learning around ${concept.toLowerCase()}.`
          : `Students are asking for support with ${concept.toLowerCase()}.`;

      if (existing) {
        await prisma.learningInsight.update({
          where: { id: existing.id },
          data: {
            frequency: { increment: 1 },
            studentStruggleScore: Math.min(1, (existing.studentStruggleScore + struggleScore) / 2),
            trend: classification.riskLevel === "high" ? "watch" : "stable",
            summary
          }
        });
        return;
      }

      await prisma.learningInsight.create({
        data: {
          schoolId,
          courseId,
          assignmentId,
          subjectArea,
          concept,
          frequency: 1,
          studentStruggleScore: struggleScore,
          trend: classification.riskLevel === "high" ? "watch" : "stable",
          summary
        }
      });
    })
  );
}
