import type { RiskLevel } from "@/lib/types";

const riskClasses: Record<RiskLevel, string> = {
  low: "border-forest/20 bg-forest/10 text-forest",
  medium: "border-gold/25 bg-gold/10 text-gold",
  high: "border-coral/25 bg-coral/10 text-coral"
};

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel | string }) {
  const normalized = riskLevel.toLowerCase() as RiskLevel;
  const className = riskClasses[normalized] || riskClasses.low;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {normalized}
    </span>
  );
}

export function StatusBadge({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        allowed
          ? "border-forest/20 bg-forest/10 text-forest"
          : "border-coral/25 bg-coral/10 text-coral"
      }`}
    >
      {allowed ? "Allowed" : "Blocked"}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sky/20 bg-sky/10 px-2.5 py-1 text-xs font-semibold text-sky">
      {category}
    </span>
  );
}
