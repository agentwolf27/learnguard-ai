import { AlertTriangle, BarChart3, BookOpen, GraduationCap, School, TrendingUp, Users } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { MetricCard } from "@/components/MetricCard";
import { StatePanel } from "@/components/StatePanel";

export type AdminDashboardData = {
  metrics: {
    totalCourses: number;
    totalStudents: number;
    totalTeachers: number;
    totalInteractions: number;
    totalSchools: number;
    highRiskTrend: string;
    adoptionTrend: string;
  };
  charts: {
    categories: Array<{ name: string; value: number }>;
    risks: Array<{ name: string; value: number }>;
    dailyUsage: Array<{ date: string; prompts: number; highRisk: number }>;
  };
  subjectAreas: Array<{ name: string; value: number }>;
  commonRisks: Array<{ name: string; value: number }>;
  insights: Array<{
    id: string;
    concept: string;
    subjectArea: string;
    frequency: number;
    summary: string;
    trend: string;
  }>;
};

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <MetricCard label="Courses using LearnGuard" value={data.metrics.totalCourses} icon={BookOpen} tone="sky" />
        <MetricCard label="Students" value={data.metrics.totalStudents} icon={GraduationCap} tone="forest" />
        <MetricCard label="Teachers" value={data.metrics.totalTeachers} icon={Users} tone="ink" />
        <MetricCard label="AI interactions" value={data.metrics.totalInteractions} icon={BarChart3} tone="sky" />
        <MetricCard label="Schools" value={data.metrics.totalSchools} icon={School} tone="forest" />
        <MetricCard label="High-risk trend" value={data.metrics.highRiskTrend} icon={AlertTriangle} tone="coral" />
        <MetricCard label="Adoption trend" value={data.metrics.adoptionTrend} icon={TrendingUp} tone="gold" />
      </div>

      <DashboardCharts
        categories={data.charts.categories}
        risks={data.charts.risks}
        dailyUsage={data.charts.dailyUsage}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Top subject areas</h2>
          <div className="mt-4 space-y-3">
            {data.subjectAreas.length === 0 ? (
              <StatePanel variant="empty" title="No subject trends yet" description="Insights appear after students submit prompts." />
            ) : (
              data.subjectAreas.map((area) => (
                <div
                  key={area.name}
                  className="flex items-center justify-between rounded-lg border border-line/80 bg-paper/70 p-3"
                >
                  <span className="text-sm font-medium text-ink/72">{area.name}</span>
                  <span className="text-sm font-semibold text-forest">{area.value}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Common integrity risks</h2>
          <div className="mt-4 space-y-3">
            {data.commonRisks.length === 0 ? (
              <StatePanel variant="empty" title="No integrity risks recorded" description="Blocked or high-risk prompts will appear here." />
            ) : (
              data.commonRisks.map((risk) => (
                <div
                  key={risk.name}
                  className="flex items-center justify-between rounded-lg border border-line/80 bg-paper/70 p-3"
                >
                  <span className="text-sm font-medium text-ink/72">{risk.name}</span>
                  <span className="text-sm font-semibold text-coral">{risk.value}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Learning insights</h2>
          <div className="mt-4 space-y-3">
            {data.insights.length === 0 ? (
              <StatePanel variant="empty" title="No learning insights yet" description="Concept trends are extracted from governed student sessions." />
            ) : (
              data.insights.slice(0, 5).map((insight) => (
                <div key={insight.id} className="rounded-lg border border-line/80 bg-paper/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{insight.concept}</p>
                    <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-ink/58">
                      {insight.frequency}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-ink/62">{insight.summary}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
