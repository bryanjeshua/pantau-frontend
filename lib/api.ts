import { createClient } from "@/lib/supabase";
import type { Document, Finding, ChatSession, ChatMessage } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface DocumentUploadResponse {
  document_id: string;
  status: string;
}

export interface FindingSummary {
  total: number;
  red: number;
  yellow: number;
  green: number;
  pending: number;
  confirmed: number;
  dismissed: number;
}

export interface FindingListParams {
  document_id?: string;
  risk_level?: string;
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentListParams {
  status?: string;
  document_type?: string;
  fiscal_year?: number;
}

export interface MemoResponse {
  id: string;
  opd_id: string | null;
  fiscal_year: number;
  format: string;
  memo_number: string | null;
  storage_path: string | null;
  download_url: string | null;
  status: string;
  generated_at: string;
}

export interface DashboardOverview {
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_findings: number;
  top_risk_opds: Array<{
    opd_id: string;
    red: number;
    yellow: number;
    green: number;
    total: number;
  }>;
  findings_by_type: Record<string, number>;
}

export const api = {
  documents: {
    upload(file: File, documentType: string, fiscalYear: number) {
      const body = new FormData();
      body.append("file", file);
      body.append("document_type", documentType);
      body.append("fiscal_year", String(fiscalYear));
      return apiFetch<DocumentUploadResponse>("/api/v1/documents/upload", {
        method: "POST",
        body,
      });
    },
    list(params: DocumentListParams = {}) {
      const q = new URLSearchParams();
      if (params.status)        q.set("status", params.status);
      if (params.document_type) q.set("document_type", params.document_type);
      if (params.fiscal_year)   q.set("fiscal_year", String(params.fiscal_year));
      const qs = q.toString();
      return apiFetch<Document[]>(`/api/v1/documents/${qs ? `?${qs}` : ""}`);
    },
    get(id: string) {
      return apiFetch<Document>(`/api/v1/documents/${id}`);
    },
    delete(id: string) {
      return apiFetch<void>(`/api/v1/documents/${id}`, { method: "DELETE" });
    },
    getItems(id: string) {
      return apiFetch<unknown[]>(`/api/v1/documents/${id}/items`);
    },
  },

  findings: {
    list(params: FindingListParams = {}) {
      const q = new URLSearchParams();
      if (params.document_id) q.set("document_id", params.document_id);
      if (params.risk_level)  q.set("risk_level", params.risk_level);
      if (params.status)      q.set("status", params.status);
      if (params.source)      q.set("source", params.source);
      if (params.limit !== undefined)  q.set("limit", String(params.limit));
      if (params.offset !== undefined) q.set("offset", String(params.offset));
      const qs = q.toString();
      return apiFetch<Finding[]>(`/api/v1/findings/${qs ? `?${qs}` : ""}`);
    },
    get(id: string) {
      return apiFetch<Finding>(`/api/v1/findings/${id}`);
    },
    getSummary(documentId?: string) {
      const qs = documentId ? `?document_id=${documentId}` : "";
      return apiFetch<FindingSummary>(`/api/v1/findings/summary${qs}`);
    },
    updateStatus(id: string, status: string) {
      return apiFetch<Finding>(`/api/v1/findings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },

  dashboard: {
    getOverview() {
      return apiFetch<DashboardOverview>("/api/v1/dashboard/overview");
    },
  },

  chat: {
    createSession(title?: string) {
      return apiFetch<{ id: string; title: string; created_at: string }>(
        "/api/v1/chat/sessions",
        { method: "POST", body: JSON.stringify({ title }) }
      );
    },
    getSessions() {
      return apiFetch<ChatSession[]>("/api/v1/chat/sessions");
    },
    sendMessage(sessionId: string, content: string) {
      return apiFetch<ChatMessage>(
        `/api/v1/chat/sessions/${sessionId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) }
      );
    },
    getMessages(sessionId: string) {
      return apiFetch<ChatMessage[]>(
        `/api/v1/chat/sessions/${sessionId}/messages`
      );
    },
  },

  memos: {
    generate(body: { finding_ids: string[]; fiscal_year: number; format: string; opd_id?: string }) {
      return apiFetch<{ memo_id: string; status: string; memo_number: string }>(
        "/api/v1/memos/generate",
        { method: "POST", body: JSON.stringify(body) }
      );
    },
    list() {
      return apiFetch<MemoResponse[]>("/api/v1/memos/");
    },
    get(id: string) {
      return apiFetch<MemoResponse>(`/api/v1/memos/${id}`);
    },
  },
};
