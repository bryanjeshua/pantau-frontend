"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Finding, RiskLevel, FindingStatus } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronRight, Filter, RefreshCw } from "lucide-react";

const RISK_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2 };

const RISK_BAR: Record<string, string> = {
  red: "risk-bar-red",
  yellow: "risk-bar-yellow",
  green: "risk-bar-green",
};

function FindingRow({ finding, onClick }: { finding: Finding; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left group">
      <Card className="border-0 shadow-sm transition-all hover:shadow-md overflow-hidden group-hover:border group-hover:border-primary/15">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div className={`w-[3px] shrink-0 ${RISK_BAR[finding.risk_level] ?? "bg-slate-300"}`} />
            <div className="flex-1 flex items-start gap-3 px-4 py-3.5">
              <div className="mt-0.5 shrink-0">
                <RiskBadge level={finding.risk_level as RiskLevel} short />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {finding.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{finding.description}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={finding.status as FindingStatus} />
                  <span className="text-xs text-muted-foreground">
                    {finding.source === "compliance_scan" ? "Scan Regulasi" : "Anomali Pengadaan"}
                  </span>
                  {finding.confidence_score !== null && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round((finding.confidence_score ?? 0) * 100)}% yakin
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(finding.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function FindingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState("");
  const [riskFilter, setRiskFilter] = useState(searchParams.get("risk_level") ?? "all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadFindings = useCallback(() => {
    startLoading(async () => {
      setError("");
      try {
        const params = {
          ...(riskFilter !== "all" && { risk_level: riskFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(searchParams.get("document_id") && { document_id: searchParams.get("document_id")! }),
          limit: 100,
        };
        const data = await api.findings.list(params);
        const sorted = [...data].sort(
          (a, b) => (RISK_ORDER[a.risk_level] ?? 3) - (RISK_ORDER[b.risk_level] ?? 3)
        );
        setFindings(sorted);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat temuan");
      }
    });
  }, [riskFilter, statusFilter, searchParams]);

  useEffect(() => {
    loadFindings();
  }, [loadFindings]);

  const redCount    = findings.filter((f) => f.risk_level === "red").length;
  const yellowCount = findings.filter((f) => f.risk_level === "yellow").length;
  const greenCount  = findings.filter((f) => f.risk_level === "green").length;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Temuan Risiko</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hasil analisis kepatuhan dokumen keuangan daerah
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFindings} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Risk summary pills */}
      {!loading && findings.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { label: `${redCount} Risiko Tinggi`,  risk: "red",    bg: "bg-red-50 text-red-700 border-red-200",     ring: "ring-red-400" },
            { label: `${yellowCount} Risiko Sedang`, risk: "yellow", bg: "bg-amber-50 text-amber-700 border-amber-200", ring: "ring-amber-400" },
            { label: `${greenCount} Risiko Rendah`,  risk: "green",  bg: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "ring-emerald-400" },
          ].map(({ label, risk, bg, ring }) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(riskFilter === risk ? "all" : risk)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${bg} ${
                riskFilter === risk ? `ring-2 ring-offset-1 ${ring}` : "opacity-60 hover:opacity-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v ?? "all")}>
          <SelectTrigger className="w-38 h-8 text-xs">
            <SelectValue placeholder="Semua Risiko" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Risiko</SelectItem>
            <SelectItem value="red">Risiko Tinggi</SelectItem>
            <SelectItem value="yellow">Risiko Sedang</SelectItem>
            <SelectItem value="green">Risiko Rendah</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-38 h-8 text-xs">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="dismissed">Diabaikan</SelectItem>
          </SelectContent>
        </Select>

        {findings.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{findings.length} temuan</span>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
      ) : findings.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              {riskFilter !== "all" || statusFilter !== "all"
                ? "Tidak ada temuan dengan filter ini"
                : "Tidak ada temuan"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {riskFilter !== "all" || statusFilter !== "all"
                ? "Coba ubah atau reset filter di atas"
                : "Upload dan proses dokumen untuk mendapatkan hasil analisis"}
            </p>
            {(riskFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => { setRiskFilter("all"); setStatusFilter("all"); }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Reset filter
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {findings.map((f) => (
            <FindingRow
              key={f.id}
              finding={f}
              onClick={() => router.push(`/findings/${f.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
