"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Document, Finding, RiskLevel, FindingStatus, RegulationRef } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";

const RISK_BAR: Record<string, string> = {
  red:    "bg-red-500",
  yellow: "bg-amber-400",
  green:  "bg-emerald-500",
};

function RegulationCard({ regulation: reg, defaultOpen = false }: { regulation: RegulationRef; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-muted/40">
      <button
        className="flex w-full items-center justify-between p-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div>
          <span className="text-xs font-semibold text-primary">{reg.peraturan}</span>
          <span className="ml-2 text-xs text-muted-foreground">{reg.pasal}</span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t px-3 py-3">
          <p className="text-xs leading-relaxed text-foreground/80">{reg.isi}</p>
        </div>
      )}
    </div>
  );
}

export default function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [finding, setFinding]   = useState<Finding | null>(null);
  const [sourceDoc, setSourceDoc] = useState<Document | null>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.findings.get(id)
      .then((f) => {
        setFinding(f);
        if (f.document_id) {
          api.documents.get(f.document_id).then(setSourceDoc).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(status: FindingStatus) {
    if (!finding) return;
    setUpdating(true);
    try {
      const updated = await api.findings.updateStatus(id, status);
      setFinding(updated);
      if (status === "confirmed") toast.success("Temuan dikonfirmasi");
      if (status === "dismissed") toast.success("Temuan diabaikan");
      if (status === "pending")   toast.success("Status dikembalikan ke pending");
    } catch {
      toast.error("Gagal mengubah status temuan");
    } finally {
      setUpdating(false);
    }
  }

  function handleAskAI() {
    if (!finding) return;
    const q = `${finding.title}: ${finding.description}`;
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  }

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto text-center">
        <p className="text-muted-foreground">Temuan tidak ditemukan.</p>
        <Button variant="link" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const regulationRefs = finding.regulation_refs as RegulationRef[] | null;
  const confidence = Math.round((finding.confidence_score ?? 0) * 100);

  return (
    <div className="px-6 py-8 pb-28 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Temuan
      </button>

      {/* Header card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex">
          <div className={`w-1 shrink-0 ${RISK_BAR[finding.risk_level] ?? "bg-slate-300"}`} />
          <CardContent className="flex-1 p-5">
            <div className="flex items-start gap-3 flex-wrap mb-3">
              <RiskBadge level={finding.risk_level as RiskLevel} />
              <StatusBadge status={finding.status as FindingStatus} />
              <span className="text-xs text-muted-foreground">
                {finding.source === "compliance_scan" ? "Scan Regulasi" : "Anomali Pengadaan"}
              </span>
            </div>

            <h1 className="text-lg font-bold leading-snug">{finding.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{finding.description}</p>

            {finding.confidence_score !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Kepercayaan AI</span>
                  <span className={`text-xs font-semibold ${
                    confidence >= 80 ? "text-emerald-600" :
                    confidence >= 60 ? "text-amber-600" : "text-slate-500"
                  }`}>{confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      confidence >= 80 ? "bg-emerald-500" :
                      confidence >= 60 ? "bg-amber-400" : "bg-slate-400"
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            )}

            {/* Secondary action: ask AI */}
            <div className="mt-4">
              <button
                onClick={handleAskAI}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Tanya AI tentang temuan ini
              </button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* AI Explanation */}
      {finding.ai_explanation && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-primary" />
              Penjelasan AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/85">{finding.ai_explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Regulation refs */}
      {regulationRefs && regulationRefs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" />
              Referensi Regulasi ({regulationRefs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {regulationRefs.map((ref, i) => (
              <RegulationCard key={i} regulation={ref} defaultOpen={i === 0} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      {finding.evidence && Object.keys(finding.evidence).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Data Bukti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(finding.evidence).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-muted-foreground capitalize shrink-0">
                    {k.replace(/_/g, " ")}
                  </span>
                  <span className="text-right font-medium text-foreground/90">{String(v)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source document */}
      {sourceDoc && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span>Dari dokumen:</span>
          <button
            onClick={() => window.location.assign(`/documents`)}
            className="font-medium text-primary hover:underline truncate"
          >
            {sourceDoc.filename}
          </button>
          <span>·</span>
          <span>{sourceDoc.document_type.toUpperCase()} {sourceDoc.fiscal_year}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        Ditemukan pada {new Date(finding.created_at).toLocaleString("id-ID")}
      </p>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-60 right-0 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {finding.status !== "dismissed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate("dismissed")}
              disabled={updating}
              className="text-muted-foreground"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1.5" />}
              Abaikan
            </Button>
          )}

          {finding.status !== "pending" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusUpdate("pending")}
              disabled={updating}
              className="text-muted-foreground"
            >
              Kembalikan ke Pending
            </Button>
          )}

          <div className="flex-1" />

          {finding.status !== "confirmed" ? (
            <Button
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6"
            >
              {updating
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <CheckCircle className="h-4 w-4 mr-2" />}
              Konfirmasi Temuan
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Sudah Dikonfirmasi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
