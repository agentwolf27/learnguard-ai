import { UserRole } from "@prisma/client";
import type { AuthenticatedViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminDashboardData } from "@/components/AdminDashboard";
import type { TeacherDashboardData } from "@/components/TeacherDashboardClient";

const dayMs = 24 * 60 * 60 * 1000;

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function dailyUsage(
  logs: Array<{ createdAt: Date; riskLevel: string }>,
  days = 7
) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * dayMs);
    const key = date.toISOString().slice(0, 10);
    const dayLogs = logs.filter((log) => log.createdAt.toISOString().slice(0, 10) === key);

    return {
      date: dateLabel(date),
      prompts: dayLogs.length,
      highRisk: dayLogs.filter((log) => log.riskLevel === "high").length
    };
  });
}

const defaultPolicy = {
  id: "local-policy",
  allowBrainstorming: true,
  allowOutlining: true,
  allowDraftFeedback: true,
  allowConceptExplanation: true,
  blockFullEssayGeneration: true,
  blockFinalAnswers: true,
  blockTestQuizSolving: true,
  blockPlagiarismEvasion: true,
  requireCitation: false
};

export async function getTeacherDashboardData(viewer: AuthenticatedViewer): Promise<TeacherDashboardData> {
  const promptWhere =
    viewer.role === UserRole.ADMIN
      ? { schoolId: viewer.schoolId }
      : {
          schoolId: viewer.schoolId,
          OR: [{ teacherId: viewer.userId }, { course: { teacherId: viewer.userId } }]
        };
  const assignmentWhere =
    viewer.role === UserRole.ADMIN
      ? { course: { schoolId: viewer.schoolId } }
      : {
          course: {
            schoolId: viewer.schoolId,
            teacherId: viewer.userId
          }
        };

  const [logs, assignments, insights] = await Promise.all([
    prisma.promptLog.findMany({
      where: promptWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        student: true,
        course: true,
        assignment: true
      }
    }),
    prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        course: true,
        policy: true
      },
      orderBy: { title: "asc" }
    }),
    prisma.learningInsight.findMany({
      where:
        viewer.role === UserRole.ADMIN
          ? { schoolId: viewer.schoolId }
          : {
              schoolId: viewer.schoolId,
              course: { teacherId: viewer.userId }
            },
      orderBy: [{ frequency: "desc" }, { updatedAt: "desc" }],
      take: 8
    })
  ]);

  const assignmentItems = await Promise.all(
    assignments.map(async (assignment) => {
      const policy =
        assignment.policy ||
        (await prisma.assignmentPolicy.create({
          data: { assignmentId: assignment.id }
        }));

      return {
        id: assignment.id,
        title: assignment.title,
        courseName: assignment.course.name,
        policy
      };
    })
  );

  const riskRank: Record<string, number> = { high: 2, medium: 1, low: 0 };

  const rows = logs
    .map((log) => ({
      id: log.id,
      student: log.student.name,
      course: log.course?.name || "Course launch",
      assignment: log.assignment?.title || "Course tool",
      promptPreview:
        log.originalPrompt.length > 120
          ? `${log.originalPrompt.slice(0, 120)}...`
          : log.originalPrompt,
      category: log.category,
      riskLevel: log.riskLevel,
      allowed: log.allowed,
      timestamp: log.createdAt.toISOString()
    }))
    // Surface the most concerning submissions first (high risk, then recency).
    .sort(
      (a, b) =>
        (riskRank[b.riskLevel] ?? 0) - (riskRank[a.riskLevel] ?? 0) ||
        b.timestamp.localeCompare(a.timestamp)
    );

  // Per-assignment rollup: submissions, distinct students who used AI, and a
  // low/medium/high risk breakdown, with an expandable per-student view.
  const assignmentScopedLogs = await prisma.promptLog.findMany({
    where: { ...promptWhere, assignmentId: { not: null } },
    select: {
      assignmentId: true,
      studentId: true,
      riskLevel: true,
      allowed: true,
      createdAt: true,
      student: { select: { name: true } }
    }
  });

  type StudentStat = {
    studentId: string;
    student: string;
    prompts: number;
    high: number;
    medium: number;
    low: number;
    blocked: number;
    lastActivity: string;
  };
  type AssignmentAgg = {
    submissions: number;
    studentIds: Set<string>;
    high: number;
    medium: number;
    low: number;
    blocked: number;
    students: Map<string, StudentStat>;
  };

  const aggByAssignment = new Map<string, AssignmentAgg>();
  for (const log of assignmentScopedLogs) {
    const assignmentId = log.assignmentId;
    if (!assignmentId) continue;

    const agg =
      aggByAssignment.get(assignmentId) ||
      ({
        submissions: 0,
        studentIds: new Set<string>(),
        high: 0,
        medium: 0,
        low: 0,
        blocked: 0,
        students: new Map<string, StudentStat>()
      } satisfies AssignmentAgg);

    agg.submissions += 1;
    agg.studentIds.add(log.studentId);
    if (log.riskLevel === "high") agg.high += 1;
    else if (log.riskLevel === "medium") agg.medium += 1;
    else agg.low += 1;
    if (!log.allowed) agg.blocked += 1;

    const iso = log.createdAt.toISOString();
    const stat =
      agg.students.get(log.studentId) ||
      ({
        studentId: log.studentId,
        student: log.student.name,
        prompts: 0,
        high: 0,
        medium: 0,
        low: 0,
        blocked: 0,
        lastActivity: iso
      } satisfies StudentStat);
    stat.prompts += 1;
    if (log.riskLevel === "high") stat.high += 1;
    else if (log.riskLevel === "medium") stat.medium += 1;
    else stat.low += 1;
    if (!log.allowed) stat.blocked += 1;
    if (iso > stat.lastActivity) stat.lastActivity = iso;
    agg.students.set(log.studentId, stat);

    aggByAssignment.set(assignmentId, agg);
  }

  const assignmentSummaries = assignmentItems
    .map((item) => {
      const agg = aggByAssignment.get(item.id);
      return {
        id: item.id,
        title: item.title,
        courseName: item.courseName,
        submissions: agg?.submissions ?? 0,
        studentsUsingAi: agg?.studentIds.size ?? 0,
        blocked: agg?.blocked ?? 0,
        riskSummary: {
          low: agg?.low ?? 0,
          medium: agg?.medium ?? 0,
          high: agg?.high ?? 0
        },
        students: agg
          ? Array.from(agg.students.values()).sort(
              (a, b) => b.high - a.high || b.prompts - a.prompts
            )
          : []
      };
    })
    // Highest-risk assignments first so teachers triage what matters.
    .sort(
      (a, b) =>
        b.riskSummary.high - a.riskSummary.high || b.submissions - a.submissions
    );

  const metrics = {
    totalPrompts: logs.length,
    activeStudents: new Set(logs.map((log) => log.studentId)).size,
    highRiskPrompts: logs.filter((log) => log.riskLevel === "high").length,
    blockedPrompts: logs.filter((log) => !log.allowed).length,
    learningSessions: logs.filter((log) => log.allowed).length,
    topStrugglingConcepts: insights
      .slice(0, 2)
      .map((insight) => insight.concept)
      .join(", ") || "No trends yet"
  };

  return {
    metrics,
    rows,
    filters: {
      courses: unique(rows.map((row) => row.course)),
      assignments: unique(rows.map((row) => row.assignment)),
      students: unique(rows.map((row) => row.student)),
      categories: unique(rows.map((row) => row.category)),
      riskLevels: ["low", "medium", "high"]
    },
    charts: {
      categories: countBy(logs, (log) => log.category),
      risks: ["low", "medium", "high"].map((risk) => ({
        name: risk,
        value: logs.filter((log) => log.riskLevel === risk).length
      })),
      dailyUsage: dailyUsage(logs)
    },
    assignmentSummaries,
    assignments: assignmentItems.map((item) => ({
      ...item,
      policy: item.policy || defaultPolicy
    }))
  };
}

export async function getAdminDashboardData(viewer: AuthenticatedViewer): Promise<AdminDashboardData> {
  const [logs, insights, totalCourses, totalStudents, totalTeachers, totalSchools] = await Promise.all([
    prisma.promptLog.findMany({
      where: { schoolId: viewer.schoolId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        course: true,
        assignment: true,
        student: true
      }
    }),
    prisma.learningInsight.findMany({
      where: { schoolId: viewer.schoolId },
      orderBy: [{ frequency: "desc" }, { updatedAt: "desc" }],
      take: 20
    }),
    prisma.course.count({ where: { schoolId: viewer.schoolId } }),
    prisma.user.count({ where: { schoolId: viewer.schoolId, role: UserRole.STUDENT } }),
    prisma.user.count({ where: { schoolId: viewer.schoolId, role: UserRole.TEACHER } }),
    prisma.school.count({ where: { id: viewer.schoolId } })
  ]);

  const commonRisks = countBy(
    logs.filter((log) => !log.allowed || log.riskLevel === "high"),
    (log) => {
      try {
        const phrases = JSON.parse(log.matchedPhrases) as string[];
        return phrases[0] || log.category;
      } catch {
        return log.category;
      }
    }
  ).sort((a, b) => b.value - a.value);

  const subjectAreas = countBy(insights, (insight) => insight.subjectArea).sort(
    (a, b) => b.value - a.value
  );
  const usage = dailyUsage(logs, 10);
  const previousHighRisk = usage.slice(0, 5).reduce((sum, item) => sum + item.highRisk, 0);
  const currentHighRisk = usage.slice(5).reduce((sum, item) => sum + item.highRisk, 0);
  const previousPrompts = usage.slice(0, 5).reduce((sum, item) => sum + item.prompts, 0);
  const currentPrompts = usage.slice(5).reduce((sum, item) => sum + item.prompts, 0);

  return {
    metrics: {
      totalCourses,
      totalStudents,
      totalTeachers,
      totalInteractions: logs.length,
      totalSchools,
      highRiskTrend:
        currentHighRisk === previousHighRisk
          ? "Flat"
          : currentHighRisk > previousHighRisk
            ? "Rising"
            : "Falling",
      adoptionTrend:
        currentPrompts === previousPrompts
          ? "Flat"
          : currentPrompts > previousPrompts
            ? "Rising"
            : "Falling"
    },
    charts: {
      categories: countBy(logs, (log) => log.category),
      risks: ["low", "medium", "high"].map((risk) => ({
        name: risk,
        value: logs.filter((log) => log.riskLevel === risk).length
      })),
      dailyUsage: usage
    },
    subjectAreas,
    commonRisks,
    insights: insights.map((insight) => ({
      id: insight.id,
      concept: insight.concept,
      subjectArea: insight.subjectArea,
      frequency: insight.frequency,
      summary: insight.summary,
      trend: insight.trend
    }))
  };
}
