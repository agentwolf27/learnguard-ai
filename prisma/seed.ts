import { AuditAction, PrismaClient, UserRole } from "@prisma/client";
import { estimateSustainability } from "../lib/sustainability";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  await prisma.promptClassification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.promptLog.deleteMany();
  await prisma.assignmentPolicy.deleteMany();
  await prisma.learningInsight.deleteMany();
  await prisma.usageMetric.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.ltiDeployment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({
    data: {
      name: "Northstar High School",
      slug: "northstar-high",
      domain: "canvas.instructure.com"
    }
  });

  const [maya, omar] = await Promise.all([
    prisma.user.create({
      data: {
        canvasUserId: "canvas-teacher-1",
        name: "Maya Reynolds",
        email: "maya.reynolds@northstar.example",
        role: UserRole.TEACHER,
        schoolId: school.id
      }
    }),
    prisma.user.create({
      data: {
        canvasUserId: "canvas-teacher-2",
        name: "Omar Patel",
        email: "omar.patel@northstar.example",
        role: UserRole.TEACHER,
        schoolId: school.id
      }
    }),
    prisma.user.create({
      data: {
        canvasUserId: "canvas-admin-1",
        name: "Jordan Lee",
        email: "jordan.lee@northstar.example",
        role: UserRole.ADMIN,
        schoolId: school.id
      }
    })
  ]);

  const students = await Promise.all(
    [
      ["canvas-student-1", "Avery Chen"],
      ["canvas-student-2", "Eli Morgan"],
      ["canvas-student-3", "Sofia Rivera"],
      ["canvas-student-4", "Miles Johnson"],
      ["canvas-student-5", "Nina Brooks"]
    ].map(([canvasUserId, name]) =>
      prisma.user.create({
        data: {
          canvasUserId,
          name,
          email: `${name.toLowerCase().replace(" ", ".")}@northstar.example`,
          role: UserRole.STUDENT,
          schoolId: school.id
        }
      })
    )
  );

  const [computerScience, english] = await Promise.all([
    prisma.course.create({
      data: {
        canvasCourseId: "canvas-course-cs101",
        name: "Computer Science 101",
        subjectArea: "Computer Science",
        schoolId: school.id,
        teacherId: maya.id
      }
    }),
    prisma.course.create({
      data: {
        canvasCourseId: "canvas-course-eng10",
        name: "English 10",
        subjectArea: "English",
        schoolId: school.id,
        teacherId: omar.id
      }
    })
  ]);

  await Promise.all([
    ...students.map((student) =>
      prisma.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: computerScience.id,
          role: UserRole.STUDENT
        }
      })
    ),
    ...students.slice(0, 4).map((student) =>
      prisma.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: english.id,
          role: UserRole.STUDENT
        }
      })
    ),
    prisma.courseEnrollment.create({
      data: {
        userId: maya.id,
        courseId: computerScience.id,
        role: UserRole.TEACHER
      }
    }),
    prisma.courseEnrollment.create({
      data: {
        userId: omar.id,
        courseId: english.id,
        role: UserRole.TEACHER
      }
    })
  ]);

  const [recursionLab, essayDraft, sourceEvaluation] = await Promise.all([
    prisma.assignment.create({
      data: {
        canvasAssignmentId: "canvas-assignment-recursion",
        title: "Recursive Thinking Lab",
        dueAt: daysAgo(-10),
        courseId: computerScience.id,
        teacherId: maya.id,
        policy: {
          create: {
            allowBrainstorming: true,
            allowOutlining: true,
            allowDraftFeedback: true,
            allowConceptExplanation: true,
            blockFullEssayGeneration: true,
            blockFinalAnswers: true,
            blockTestQuizSolving: true,
            blockPlagiarismEvasion: true
          }
        }
      }
    }),
    prisma.assignment.create({
      data: {
        canvasAssignmentId: "canvas-assignment-essay",
        title: "Argument Essay Draft",
        dueAt: daysAgo(-7),
        courseId: english.id,
        teacherId: omar.id,
        policy: {
          create: {
            allowBrainstorming: true,
            allowOutlining: true,
            allowDraftFeedback: true,
            allowConceptExplanation: true,
            blockFullEssayGeneration: true,
            blockFinalAnswers: true,
            blockTestQuizSolving: true,
            blockPlagiarismEvasion: true
          }
        }
      }
    }),
    prisma.assignment.create({
      data: {
        canvasAssignmentId: "canvas-assignment-sources",
        title: "Source Evaluation",
        dueAt: daysAgo(-4),
        courseId: english.id,
        teacherId: omar.id,
        policy: {
          create: {
            allowBrainstorming: true,
            allowOutlining: true,
            allowDraftFeedback: false,
            allowConceptExplanation: true,
            blockFullEssayGeneration: true,
            blockFinalAnswers: true,
            blockTestQuizSolving: true,
            blockPlagiarismEvasion: true
          }
        }
      }
    })
  ]);

  await prisma.ltiDeployment.create({
    data: {
      issuer: "https://canvas.instructure.com",
      clientId: "local-client-id",
      deploymentId: "local-dev-deployment",
      jwksUrl: "https://sso.canvaslms.com/api/lti/security/jwks",
      authLoginUrl: "https://sso.canvaslms.com/api/lti/authorize_redirect",
      nrpsContextMembershipUrl: "https://canvas.example/api/lti/courses/1/names_and_roles",
      agsLineItemsUrl: "https://canvas.example/api/lti/courses/1/line_items",
      schoolId: school.id
    }
  });

  const promptFixtures = [
    {
      student: students[0],
      teacher: maya,
      course: computerScience,
      assignment: recursionLab,
      originalPrompt: "Explain recursion using a simple example before I try my lab.",
      aiResponse: "Recursion is when a function solves a problem by calling itself on a smaller version of the same problem.",
      allowed: true,
      category: "Concept Explanation",
      riskLevel: "low",
      reason: "The request asks for explanation before the student attempts the lab.",
      educationalAlternative: "Try tracing a small recursive call stack by hand.",
      matchedPhrases: [],
      confidence: 0.91,
      createdAt: daysAgo(0)
    },
    {
      student: students[1],
      teacher: omar,
      course: english,
      assignment: essayDraft,
      originalPrompt: "Write my essay about social media and make it undetectable.",
      aiResponse: "I can't complete graded work or provide final answers for you. I can help you create an outline or review your draft.",
      allowed: false,
      category: "Academic Integrity Risk",
      riskLevel: "high",
      reason: "The prompt asks for completed graded work and plagiarism evasion.",
      educationalAlternative: "Create a thesis, outline the body paragraphs, or ask for feedback on your own draft.",
      matchedPhrases: ["write my essay", "make it undetectable"],
      confidence: 0.98,
      createdAt: daysAgo(1)
    },
    {
      student: students[2],
      teacher: omar,
      course: english,
      assignment: essayDraft,
      originalPrompt: "Can you give feedback on whether my thesis about civic participation is specific enough?",
      aiResponse: "Your thesis is on the right path. Make the causal claim more precise and name the kind of civic participation you mean.",
      allowed: true,
      category: "Draft Feedback",
      riskLevel: "low",
      reason: "The request asks for feedback on student-authored work.",
      educationalAlternative: "Use rubric language to revise the claim.",
      matchedPhrases: [],
      confidence: 0.88,
      createdAt: daysAgo(2)
    },
    {
      student: students[3],
      teacher: maya,
      course: computerScience,
      assignment: recursionLab,
      originalPrompt: "Take my quiz on recursive functions and give me the answers.",
      aiResponse: "I can't complete quizzes or provide final answers. I can walk through a similar recursion example.",
      allowed: false,
      category: "Assessment Circumvention",
      riskLevel: "high",
      reason: "The prompt asks the assistant to complete an assessment.",
      educationalAlternative: "Practice with a similar recursion trace and compare your reasoning.",
      matchedPhrases: ["take my quiz", "give me the answers"],
      confidence: 0.97,
      createdAt: daysAgo(3)
    },
    {
      student: students[4],
      teacher: omar,
      course: english,
      assignment: sourceEvaluation,
      originalPrompt: "Help me brainstorm research questions about renewable energy policy.",
      aiResponse: "Here are several research-question directions that compare costs, adoption, equity, and long-term grid reliability.",
      allowed: true,
      category: "Brainstorming",
      riskLevel: "low",
      reason: "The request asks for learning-supportive idea generation.",
      educationalAlternative: "Choose one question and evaluate two credible sources.",
      matchedPhrases: [],
      confidence: 0.84,
      createdAt: daysAgo(4)
    },
    {
      student: students[0],
      teacher: omar,
      course: english,
      assignment: sourceEvaluation,
      originalPrompt: "How do I bypass plagiarism detection for copied source notes?",
      aiResponse: "I can't help evade plagiarism checks. I can help you paraphrase ethically, cite sources, and separate notes from your own analysis.",
      allowed: false,
      category: "Academic Integrity Risk",
      riskLevel: "high",
      reason: "The request asks for plagiarism evasion.",
      educationalAlternative: "Ask for citation help, paraphrasing practice, or a source-note template.",
      matchedPhrases: ["bypass plagiarism"],
      confidence: 0.96,
      createdAt: daysAgo(5)
    },
    {
      student: students[2],
      teacher: maya,
      course: computerScience,
      assignment: recursionLab,
      originalPrompt: "Give me practice questions for tracing recursive JavaScript functions.",
      aiResponse: "Try tracing a factorial function, a countdown function, and a nested array sum with small inputs.",
      allowed: true,
      category: "Homework Support",
      riskLevel: "low",
      reason: "The request asks for practice rather than answers to graded work.",
      educationalAlternative: "Attempt each trace before checking hints.",
      matchedPhrases: [],
      confidence: 0.86,
      createdAt: daysAgo(6)
    }
  ];

  for (const fixture of promptFixtures) {
    const estimate = estimateSustainability(fixture.originalPrompt, fixture.aiResponse);

    await prisma.promptLog.create({
      data: {
        studentId: fixture.student.id,
        teacherId: fixture.teacher.id,
        schoolId: school.id,
        courseId: fixture.course.id,
        assignmentId: fixture.assignment.id,
        originalPrompt: fixture.originalPrompt,
        aiResponse: fixture.aiResponse,
        allowed: fixture.allowed,
        category: fixture.category,
        riskLevel: fixture.riskLevel,
        reason: fixture.reason,
        educationalAlternative: fixture.educationalAlternative,
        matchedPhrases: JSON.stringify(fixture.matchedPhrases),
        estimatedTokens: estimate.estimatedTokens,
        estimatedCO2Grams: estimate.estimatedCO2Grams,
        estimatedWaterML: estimate.estimatedWaterML,
        createdAt: fixture.createdAt,
        classification: {
          create: {
            flagged: fixture.matchedPhrases.length > 0,
            matchedPhrases: JSON.stringify(fixture.matchedPhrases),
            riskLevel: fixture.riskLevel,
            category: fixture.category,
            allowed: fixture.allowed,
            reason: fixture.reason,
            educationalAlternative: fixture.educationalAlternative,
            confidence: fixture.confidence,
            createdAt: fixture.createdAt
          }
        }
      }
    });
  }

  await Promise.all([
    prisma.learningInsight.create({
      data: {
        schoolId: school.id,
        courseId: computerScience.id,
        assignmentId: recursionLab.id,
        subjectArea: "Computer Science",
        concept: "Recursion",
        frequency: 9,
        studentStruggleScore: 0.74,
        summary: "Students are frequently asking about recursion.",
        trend: "watch"
      }
    }),
    prisma.learningInsight.create({
      data: {
        schoolId: school.id,
        courseId: english.id,
        assignmentId: essayDraft.id,
        subjectArea: "English",
        concept: "Essay structure",
        frequency: 7,
        studentStruggleScore: 0.63,
        summary: "Many students need help with essay structure.",
        trend: "stable"
      }
    }),
    prisma.learningInsight.create({
      data: {
        schoolId: school.id,
        courseId: english.id,
        assignmentId: sourceEvaluation.id,
        subjectArea: "English",
        concept: "Academic integrity timing",
        frequency: 4,
        studentStruggleScore: 0.86,
        summary: "High-risk prompts increased near the midterm deadline.",
        trend: "watch"
      }
    })
  ]);

  await Promise.all(
    Array.from({ length: 7 }, (_, index) =>
      prisma.usageMetric.create({
        data: {
          schoolId: school.id,
          courseId: index % 2 === 0 ? computerScience.id : english.id,
          date: daysAgo(6 - index),
          totalPrompts: 8 + index * 2,
          activeStudents: Math.min(5, 2 + index),
          highRiskPrompts: index > 3 ? 2 : 1,
          blockedPrompts: index > 3 ? 3 : 1,
          learningSessions: 6 + index
        }
      })
    )
  );

  await prisma.auditLog.createMany({
    data: [
      {
        schoolId: school.id,
        userId: maya.id,
        action: AuditAction.LOGIN,
        resource: "clerk_session",
        metadata: { provider: "seed" }
      },
      {
        schoolId: school.id,
        userId: maya.id,
        action: AuditAction.DASHBOARD_ACCESSED,
        resource: "teacher_dashboard",
        metadata: { source: "seed" }
      },
      {
        schoolId: school.id,
        userId: students[1].id,
        action: AuditAction.PROMPT_BLOCKED,
        resource: "prompt_log",
        metadata: { source: "seed", matchedPhrases: ["write my essay", "make it undetectable"] }
      }
    ]
  });

  console.log(`Seeded ${school.name} with ${promptFixtures.length} prompt logs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
