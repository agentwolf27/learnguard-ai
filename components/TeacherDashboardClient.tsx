"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, Clock, Search, Users } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { StatePanel } from "@/components/StatePanel";
import { MetricCard } from "@/components/MetricCard";
import { AssignmentPolicyItem, PolicyEditor } from "@/components/PolicyEditor";
import { CategoryBadge, RiskBadge, StatusBadge } from "@/components/RiskBadge";

export type PromptRow = {
  id: string;
  student: string;
  course: string;
  assignment: string;
  promptPreview: string;
  category: string;
  riskLevel: string;
  allowed: boolean;
  timestamp: string;
};

export type DashboardFilterOptions = {
  courses: string[];
  assignments: string[];
  students: string[];
  categories: string[];
  riskLevels: string[];
};

export type AssignmentStudentStat = {
  studentId: string;
  student: string;
  prompts: number;
  high: number;
  medium: number;
  low: number;
  blocked: number;
  lastActivity: string;
};

export type AssignmentSummary = {
  id: string;
  title: string;
  courseName: string;
  submissions: number;
  studentsUsingAi: number;
  blocked: number;
  riskSummary: { low: number; medium: number; high: number };
  students: AssignmentStudentStat[];
};

export type TeacherDashboardData = {
  metrics: {
    totalPrompts: number;
    activeStudents: number;
    highRiskPrompts: number;
    blockedPrompts: number;
    learningSessions: number;
    topStrugglingConcepts: string;
  };
  rows: PromptRow[];
  filters: DashboardFilterOptions;
  charts: {
    categories: Array<{ name: string; value: number }>;
    risks: Array<{ name: string; value: number }>;
    dailyUsage: Array<{ date: string; prompts: number; highRisk: number }>;
  };
  assignmentSummaries: AssignmentSummary[];
  assignments: AssignmentPolicyItem[];
};

const allValue = "All";

export function TeacherDashboardClient({ data }: { data: TeacherDashboardData }) {
  const [course, setCourse] = useState(allValue);
  const [assignment, setAssignment] = useState(allValue);
  const [student, setStudent] = useState(allValue);
  const [category, setCategory] = useState(allValue);
  const [riskLevel, setRiskLevel] = useState(allValue);
  const [date, setDate] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  const filteredRows = useMemo(
    () =>
      data.rows.filter((row) => {
        const rowDate = new Date(row.timestamp).toISOString().slice(0, 10);
        return (
          (course === allValue || row.course === course) &&
          (assignment === allValue || row.assignment === assignment) &&
          (student === allValue || row.student === student) &&
          (category === allValue || row.category === category) &&
          (riskLevel === allValue || row.riskLevel === riskLevel) &&
          (!date || rowDate === date)
        );
      }),
    [assignment, category, course, data.rows, date, riskLevel, student]
  );

  const selectClass =
    "focus-ring min-h-10 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total AI prompts" value={data.metrics.totalPrompts} icon={Bot} tone="sky" />
        <MetricCard label="Active students" value={data.metrics.activeStudents} icon={Users} tone="forest" />
        <MetricCard label="High-risk prompts" value={data.metrics.highRiskPrompts} icon={AlertTriangle} tone="coral" />
        <MetricCard label="Blocked prompts" value={data.metrics.blockedPrompts} icon={CheckCircle2} tone="gold" />
        <MetricCard label="Learning sessions" value={data.metrics.learningSessions} icon={Clock} tone="ink" />
        <MetricCard
          label="Top struggling concepts"
          value={data.metrics.topStrugglingConcepts}
          icon={Search}
          tone="forest"
        />
      </div>

      <DashboardCharts
        categories={data.charts.categories}
        risks={data.charts.risks}
        dailyUsage={data.charts.dailyUsage}
      />

      <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
        <div className="border-b border-line/70 pb-4">
          <h2 className="text-base font-semibold text-ink">Assignments</h2>
          <p className="mt-1 text-sm text-ink/58">
            AI usage and risk per assignment, highest-risk first. Select an assignment for a
            per-student breakdown.
          </p>
        </div>

        {data.assignmentSummaries.length === 0 ? (
          <div className="mt-4">
            <StatePanel
              variant="empty"
              title="No assignments yet"
              description="Assignments appear here after a Canvas launch creates them, or run npm run db:seed for demo data."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-line/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line/80 text-sm">
                <thead className="bg-paper/85 text-left text-xs uppercase text-ink/52">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Assignment</th>
                    <th className="px-3 py-3 font-semibold">Course</th>
                    <th className="px-3 py-3 font-semibold">Submissions</th>
                    <th className="px-3 py-3 font-semibold">Used AI</th>
                    <th className="px-3 py-3 font-semibold">Risk (L / M / H)</th>
                    <th className="px-3 py-3 font-semibold">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70 bg-white">
                  {data.assignmentSummaries.map((summary) => {
                    const isOpen = expandedAssignment === summary.id;
                    return (
                      <Fragment key={summary.id}>
                        <tr
                          className="cursor-pointer align-top hover:bg-paper/50"
                          onClick={() => setExpandedAssignment(isOpen ? null : summary.id)}
                        >
                          <td className="px-3 py-3 font-medium text-ink">
                            <span className="inline-flex items-center gap-1.5">
                              <ChevronRight
                                className={`h-4 w-4 text-ink/45 transition-transform ${isOpen ? "rotate-90" : ""}`}
                                aria-hidden="true"
                              />
                              {summary.title}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink/65">{summary.courseName}</td>
                          <td className="px-3 py-3 text-ink/75">{summary.submissions}</td>
                          <td className="px-3 py-3 text-ink/75">{summary.studentsUsingAi}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
                                {summary.riskSummary.low}
                              </span>
                              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                                {summary.riskSummary.medium}
                              </span>
                              <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">
                                {summary.riskSummary.high}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink/65">{summary.blocked}</td>
                        </tr>
                        {isOpen ? (
                          <tr className="bg-paper/40">
                            <td colSpan={6} className="px-3 py-3">
                              {summary.students.length === 0 ? (
                                <p className="text-sm text-ink/55">No student activity for this assignment yet.</p>
                              ) : (
                                <table className="min-w-full text-sm">
                                  <thead className="text-left text-xs uppercase text-ink/45">
                                    <tr>
                                      <th className="px-2 py-2 font-semibold">Student</th>
                                      <th className="px-2 py-2 font-semibold">Prompts</th>
                                      <th className="px-2 py-2 font-semibold">High</th>
                                      <th className="px-2 py-2 font-semibold">Medium</th>
                                      <th className="px-2 py-2 font-semibold">Low</th>
                                      <th className="px-2 py-2 font-semibold">Blocked</th>
                                      <th className="px-2 py-2 font-semibold">Last activity</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {summary.students.map((stat) => (
                                      <tr key={stat.studentId} className="border-t border-line/50">
                                        <td className="px-2 py-2 font-medium text-ink">{stat.student}</td>
                                        <td className="px-2 py-2 text-ink/70">{stat.prompts}</td>
                                        <td className="px-2 py-2 text-coral">{stat.high}</td>
                                        <td className="px-2 py-2 text-gold">{stat.medium}</td>
                                        <td className="px-2 py-2 text-forest">{stat.low}</td>
                                        <td className="px-2 py-2 text-ink/70">{stat.blocked}</td>
                                        <td className="px-2 py-2 text-ink/55">
                                          {new Intl.DateTimeFormat("en", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit"
                                          }).format(new Date(stat.lastActivity))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Recent prompts</h2>
            <p className="mt-1 text-sm text-ink/58">{filteredRows.length} visible interactions</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select className={selectClass} value={course} onChange={(event) => setCourse(event.target.value)}>
              {[allValue, ...data.filters.courses].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              className={selectClass}
              value={assignment}
              onChange={(event) => setAssignment(event.target.value)}
            >
              {[allValue, ...data.filters.assignments].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select className={selectClass} value={student} onChange={(event) => setStudent(event.target.value)}>
              {[allValue, ...data.filters.students].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select className={selectClass} value={category} onChange={(event) => setCategory(event.target.value)}>
              {[allValue, ...data.filters.categories].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              className={selectClass}
              value={riskLevel}
              onChange={(event) => setRiskLevel(event.target.value)}
            >
              {[allValue, ...data.filters.riskLevels].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <input
              type="date"
              className={selectClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-line/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line/80 text-sm">
              <thead className="bg-paper/85 text-left text-xs uppercase text-ink/52">
                <tr>
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Course</th>
                  <th className="px-3 py-3 font-semibold">Assignment</th>
                  <th className="px-3 py-3 font-semibold">Prompt preview</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">Risk</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8">
                      <StatePanel
                        variant="empty"
                        title={
                          data.rows.length === 0
                            ? "No student prompts logged yet"
                            : "No prompts match these filters"
                        }
                        description={
                          data.rows.length === 0
                            ? "Submit prompts from the student assistant to populate this table, or run npm run db:seed for demo data."
                            : "Try clearing filters or choosing a different course or date."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-3 py-3 font-medium text-ink">{row.student}</td>
                      <td className="px-3 py-3 text-ink/65">{row.course}</td>
                      <td className="px-3 py-3 text-ink/65">{row.assignment}</td>
                      <td className="max-w-sm px-3 py-3 text-ink/70">{row.promptPreview}</td>
                      <td className="px-3 py-3">
                        <CategoryBadge category={row.category} />
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge riskLevel={row.riskLevel} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge allowed={row.allowed} />
                      </td>
                      <td className="px-3 py-3 text-ink/55">
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        }).format(new Date(row.timestamp))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <PolicyEditor assignments={data.assignments} />
    </div>
  );
}
