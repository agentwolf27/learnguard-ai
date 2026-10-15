"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const colors = ["#1f7a5a", "#d45d4c", "#b7791f", "#2f6fbb", "#6f4aa8", "#0f766e"];

export type ChartDatum = {
  name: string;
  value: number;
};

export type DailyDatum = {
  date: string;
  prompts: number;
  highRisk?: number;
};

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 h-64 min-h-64 w-full min-w-0">{children}</div>
    </div>
  );
}

export function DashboardCharts({
  categories,
  risks,
  dailyUsage
}: {
  categories: ChartDatum[];
  risks: ChartDatum[];
  dailyUsage: DailyDatum[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartFrame title="Prompt categories">
        <ResponsiveContainer width="100%" height={256} minWidth={240}>
          <BarChart data={categories}>
            <CartesianGrid stroke="#ebe5da" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={70} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#1f7a5a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Risk distribution">
        <ResponsiveContainer width="100%" height={256} minWidth={240}>
          <PieChart>
            <Pie data={risks} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={3}>
              {risks.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Daily usage">
        <ResponsiveContainer width="100%" height={256} minWidth={240}>
          <LineChart data={dailyUsage}>
            <CartesianGrid stroke="#ebe5da" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="prompts" stroke="#2f6fbb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="highRisk" stroke="#d45d4c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
