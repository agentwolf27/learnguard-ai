import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "forest"
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "forest" | "coral" | "gold" | "sky" | "ink";
}) {
  const toneClasses = {
    forest: "bg-forest/10 text-forest",
    coral: "bg-coral/10 text-coral",
    gold: "bg-gold/10 text-gold",
    sky: "bg-sky/10 text-sky",
    ink: "bg-ink/10 text-ink"
  };

  return (
    <div className="rounded-lg border border-line/80 bg-white/78 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink/60">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {detail ? <p className="mt-3 text-sm text-ink/56">{detail}</p> : null}
    </div>
  );
}
