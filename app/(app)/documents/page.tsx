"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Document, DocumentStatus } from "@/lib/types";
import UploadZone from "@/components/UploadZone";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  apbd: "APBD",
  spj: "SPJ",
  procurement: "Pengadaan",
};

const STATUS_BAR: Record<DocumentStatus, string> = {
  pending:    "bg-slate-300",
  processing: "bg-blue-400",
  complete:   "bg-emerald-500",
  error:      "bg-red-500",
};

const FISCAL_YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i);

function DocumentRow({
  doc,
  onRefresh,
  onDelete,
}: {
  doc: Document;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  useEffect(() => {
    if (doc.status === "pending" || doc.status === "processing") {
      const timer = setTimeout(() => onRefresh(doc.id), 4000);
      return () => clearTimeout(timer);
    }
  }, [doc.status, doc.id, onRefresh]);

  const isProcessing = doc.status === "pending" || doc.status === "processing";

  return (
    <div className={`flex items-stretch rounded-xl bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md ${isProcessing ? "animate-pulse" : ""}`}>
      <div className={`w-[3px] shrink-0 ${STATUS_BAR[doc.status]}`} />
      <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground/40 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.filename}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type} · {doc.fiscal_year}
            </span>
            {doc.item_count !== null && doc.item_count > 0 && (
              <span className="text-xs text-muted-foreground">{doc.item_count} item</span>
            )}
            {doc.error_message && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {doc.error_message.slice(0, 80)}
              </span>
            )}
          </div>
        </div>

        <StatusBadge status={doc.status} />

        <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
          {new Date(doc.uploaded_at).toLocaleDateString("id-ID")}
        </span>

        <div className="flex items-center gap-0.5 shrink-0">
          {doc.status === "complete" && (
            <button
              onClick={() => window.location.assign(`/findings?document_id=${doc.id}`)}
              className="p-1.5 rounded-lg hover:bg-muted text-primary transition-colors"
              title="Lihat Temuan"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            title="Hapus dokumen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments]   = useState<Document[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [file, setFile]             = useState<File | null>(null);
  const [docType, setDocType]       = useState("apbd");
  const [fiscalYear, setFiscalYear] = useState(String(new Date().getFullYear()));
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    api.documents
      .list()
      .then(setDocuments)
      .catch(() => toast.error("Gagal memuat daftar dokumen"))
      .finally(() => setLoadingList(false));
  }, []);

  const refreshDocument = useCallback(async (id: string) => {
    try {
      const updated = await api.documents.get(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (updated.status === "complete") {
        toast.success(`Dokumen selesai diproses — ${updated.item_count ?? 0} item ditemukan`);
      } else if (updated.status === "error") {
        toast.error(`Pemrosesan gagal: ${updated.error_message?.slice(0, 60) ?? "unknown error"}`);
      }
    } catch {
      // silently ignore
    }
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { document_id } = await api.documents.upload(file, docType, Number(fiscalYear));
      const newDoc = await api.documents.get(document_id);
      setDocuments((prev) => [newDoc, ...prev]);
      setFile(null);
      toast.success("Dokumen diunggah — AI mulai memproses...");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload gagal";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.documents.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dokumen dihapus");
    } catch {
      toast.error("Gagal menghapus dokumen");
    }
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dokumen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload dan pantau status pemrosesan dokumen keuangan
        </p>
      </div>

      {/* Upload form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Upload Dokumen Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone onFileSelect={setFile} disabled={uploading} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jenis Dokumen</Label>
              <Select value={docType} onValueChange={(v) => v && setDocType(v)} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apbd">APBD</SelectItem>
                  <SelectItem value="spj">SPJ</SelectItem>
                  <SelectItem value="procurement">Pengadaan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tahun Anggaran</Label>
              <Select value={fiscalYear} onValueChange={(v) => v && setFiscalYear(v)} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {uploadError && (
            <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </p>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengunggah...
              </>
            ) : (
              "Upload & Proses"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Pemrosesan AI memakan waktu 15–60 detik setelah upload.
          </p>
        </CardContent>
      </Card>

      {/* Document list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Dokumen Terupload
          </h2>
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground">{documents.length} dokumen</span>
          )}
        </div>

        {loadingList ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[58px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed border-2 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada dokumen</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Upload APBD, SPJ, atau data pengadaan untuk memulai analisis
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onRefresh={refreshDocument}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
