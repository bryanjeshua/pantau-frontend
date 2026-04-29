import type { RiskLevel } from "@/lib/types";

const config: Record<RiskLevel, { label: string; className: string; dot: string }> = {
  red: {
    label: "Risiko Tinggi",
    className: "bg-red-100 text-red-700 border border-red-300",
    dot: "bg-red-500",
  },
  yellow: {
    label: "Risiko Sedang",
    className: "bg-amber-50 text-amber-700 border border-amber-300",
    dot: "bg-amber-500",
  },
  green: {
    label: "Risiko Rendah",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function RiskBadge({ level, short = false }: { level: RiskLevel; short?: boolean }) {
  const { label, className, dot } = config[level];
  const display = short ? (level === "red" ? "Tinggi" : level === "yellow" ? "Sedang" : "Rendah") : label;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {display}
    </span>
  );
}
