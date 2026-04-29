import type { DocumentStatus, FindingStatus } from "@/lib/types";
import { CheckCircle2, Clock, Loader2, XCircle, AlertCircle, MinusCircle } from "lucide-react";

type AnyStatus = DocumentStatus | FindingStatus;

const config: Record<AnyStatus, { label: string; className: string; Icon: React.ElementType; spin?: boolean }> = {
  pending:    { label: "Menunggu",     className: "bg-slate-100 text-slate-600",                    Icon: Clock },
  processing: { label: "Memproses...", className: "bg-blue-50 text-blue-600",                       Icon: Loader2, spin: true },
  complete:   { label: "Selesai",      className: "bg-emerald-50 text-emerald-700",                 Icon: CheckCircle2 },
  error:      { label: "Error",        className: "bg-red-50 text-red-600 border border-red-200",   Icon: AlertCircle },
  confirmed:  { label: "Dikonfirmasi", className: "bg-indigo-50 text-indigo-700 border border-indigo-200", Icon: CheckCircle2 },
  dismissed:  { label: "Diabaikan",    className: "bg-slate-100 text-slate-400",                    Icon: MinusCircle },
};

export default function StatusBadge({ status }: { status: AnyStatus }) {
  const { label, className, Icon, spin } = config[status] ?? {
    label: status, className: "bg-gray-100 text-gray-600", Icon: XCircle,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon className={`h-3 w-3 shrink-0 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}
