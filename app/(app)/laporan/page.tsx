"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type MemoResponse } from "@/lib/api";
import type { Finding } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckSquare,
  Download,
  FileOutput,
  Loader2,
  Square,
} from "lucide-react";

const FISCAL_YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i);

const DOC_TYPE_LABELS: Record<string, string> = {
  apbd: "APBD", spj: "SPJ", procurement: "Pengadaan",
};

function MemoRow({ memo }: { memo: MemoResponse }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-card shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {memo.memo_number ?? `Memo ${memo.id.slice(0, 8)}...`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          TA {memo.fiscal_year} · {memo.format.toUpperCase()} ·{" "}
          {new Date(memo.generated_at).toLocaleDateString("id-ID")}
        </p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        memo.status === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"
      }`}>
        {memo.status === "ready" ? "Siap" : "Generating..."}
      </span>
      {memo.download_url && (
        <a
          href={memo.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      )}
    </div>
  );
}

export default function LaporanPage() {
  const [confirmedFindings, setConfirmedFindings] = useState<Finding[]>([]);
  const [memos, setMemos]                         = useState<MemoResponse[]>([]);
  const [loadingFindings, setLoadingFindings]     = useState(true);
  const [loadingMemos, setLoadingMemos]           = useState(true);
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set());
  const [fiscalYear, setFiscalYear]               = useState(String(new Date().getFullYear()));
  const [format, setFormat]                       = useState("docx");
  const [generating, setGenerating]               = useState(false);

  useEffect(() => {
    api.findings
      .list({ status: "confirmed", limit: 200 })
      .then(setConfirmedFindings)
      .catch(() => toast.error("Gagal memuat temuan"))
      .finally(() => setLoadingFindings(false));

    api.memos
      .list()
      .then(setMemos)
      .catch(() => {})
      .finally(() => setLoadingMemos(false));
  }, []);

  function toggleFinding(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === confirmedFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(confirmedFindings.map((f) => f.id)));
    }
  }

  async function handleGenerate() {
    if (selectedIds.size === 0) {
      toast.error("Pilih minimal satu temuan");
      return;
    }
    setGenerating(true);
    try {
      const result = await api.memos.generate({
        finding_ids: Array.from(selectedIds),
        fiscal_year: Number(fiscalYear),
        format,
      });
      toast.success(`Laporan ${result.memo_number} berhasil dibuat`);
      // Reload memo list
      const updated = await api.memos.list();
      setMemos(updated);
      setSelectedIds(new Set());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal generate laporan");
    } finally {
      setGenerating(false);
    }
  }

  const allSelected = confirmedFindings.length > 0 && selectedIds.size === confirmedFindings.length;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate memo audit resmi dari temuan yang sudah dikonfirmasi
        </p>
      </div>

      {/* Generate form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileOutput className="h-4 w-4 text-primary" />
            Generate Laporan Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tahun Anggaran</Label>
              <Select value={fiscalYear} onValueChange={(v) => v && setFiscalYear(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FISCAL_YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => v && setFormat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">DOCX (Word)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Finding picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pilih Temuan</Label>
              {confirmedFindings.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {allSelected ? "Batalkan semua" : "Pilih semua"}
                </button>
              )}
            </div>

            {loadingFindings ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : confirmedFindings.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada temuan yang dikonfirmasi.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Konfirmasi temuan di halaman Temuan Risiko terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-xl border p-2">
                {confirmedFindings.map((f) => {
                  const selected = selectedIds.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFinding(f.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selected ? "bg-primary/8 border border-primary/20" : "hover:bg-muted"
                      }`}
                    >
                      {selected
                        ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                        : <Square className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {f.finding_type} · {DOC_TYPE_LABELS[f.source] ?? f.source}
                        </p>
                      </div>
                      <RiskBadge level={f.risk_level} short />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} temuan dipilih`
                : "Belum ada temuan yang dipilih"}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating || selectedIds.size === 0}
              className="min-w-36"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileOutput className="mr-2 h-4 w-4" />
                  Generate Laporan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Memo history */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Laporan Sebelumnya
        </h2>

        {loadingMemos ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-[62px] w-full rounded-xl" />)}
          </div>
        ) : memos.length === 0 ? (
          <Card className="border-dashed border-2 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <FileOutput className="mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Belum ada laporan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {memos.map((m) => <MemoRow key={m.id} memo={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
