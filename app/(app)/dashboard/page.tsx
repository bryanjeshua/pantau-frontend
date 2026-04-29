"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FindingSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MessageSquare,
  TrendingUp,
  Upload,
} from "lucide-react";

function DangerStatCard({
  title, value, loading,
}: { title: string; value: number | undefined; loading: boolean }) {
  const hasRisk = (value ?? 0) > 0;
  return (
    <Card className={`border shadow-sm transition-colors ${
      hasRisk ? "border-red-200 bg-red-50" : "border-0 bg-card"
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-xs font-medium uppercase tracking-wide ${
              hasRisk ? "text-red-500" : "text-muted-foreground"
            }`}>{title}</p>
            {loading
              ? <Skeleton className="mt-2 h-8 w-12" />
              : <p className={`mt-1 text-3xl font-bold tabular-nums ${hasRisk ? "text-red-700" : ""}`}>
                  {value ?? 0}
                </p>
            }
          </div>
          <div className={`rounded-xl p-2.5 ${hasRisk ? "bg-red-100" : "bg-slate-100"}`}>
            <AlertTriangle className={`h-5 w-5 ${hasRisk ? "text-red-600" : "text-slate-400"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title, value, icon, className = "", loading,
}: {
  title: string; value: number | undefined;
  icon: React.ReactNode; className?: string; loading: boolean;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {loading
              ? <Skeleton className="mt-2 h-8 w-12" />
              : <p className={`mt-1 text-3xl font-bold tabular-nums ${className}`}>{value ?? 0}</p>
            }
          </div>
          <div className="rounded-xl p-2.5 bg-muted">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [summary, setSummary]     = useState<FindingSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.findings
      .getSummary()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${base}/health`)
      .then((r) => setApiOnline(r.ok))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan risiko keuangan daerah</p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Konsultasi AI
          </Link>
          <Link href="/documents" className={buttonVariants({ size: "sm" })}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload Dokumen
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gagal memuat data: {error}
        </div>
      )}

      {/* Risk stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DangerStatCard
          title="Risiko Tinggi"
          value={summary?.red}
          loading={loading}
        />
        <StatCard
          title="Risiko Sedang"
          value={summary?.yellow}
          icon={<Info className="h-5 w-5 text-amber-500" />}
          className="text-amber-700"
          loading={loading}
        />
        <StatCard
          title="Risiko Rendah"
          value={summary?.green}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          className="text-emerald-700"
          loading={loading}
        />
        <StatCard
          title="Total Temuan"
          value={summary?.total}
          icon={<TrendingUp className="h-5 w-5 text-slate-500" />}
          loading={loading}
        />
      </div>

      {/* Status review row */}
      {!loading && summary && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Status Review
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Menunggu Review", value: summary.pending,   color: "text-slate-700",   bg: "bg-amber-50",   dot: "bg-amber-400" },
              { label: "Dikonfirmasi",    value: summary.confirmed, color: "text-indigo-700",  bg: "bg-indigo-50",  dot: "bg-indigo-500" },
              { label: "Diabaikan",       value: summary.dismissed, color: "text-slate-400",   bg: "bg-slate-50",   dot: "bg-slate-300" },
            ].map(({ label, value, color, bg, dot }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className={`p-4 rounded-xl ${bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* System status */}
      <Card className="border-0 shadow-sm bg-primary/5 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Status Sistem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Backend API</p>
              {apiOnline === null ? (
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-pulse" />
                  Memeriksa...
                </span>
              ) : apiOnline ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-600 font-medium text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Offline
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Regulasi ter-index</p>
              <p className="font-medium text-sm">19 pasal</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Model AI</p>
              <p className="font-medium text-sm">Gemini 2.5 Flash Lite</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
