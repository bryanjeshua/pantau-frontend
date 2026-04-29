export type RiskLevel = "red" | "yellow" | "green";
export type DocumentType = "apbd" | "spj" | "procurement" | "contract";
export type DocumentStatus = "pending" | "processing" | "complete" | "error";
export type FindingStatus = "pending" | "confirmed" | "dismissed";
export type FindingSource = "compliance_scan" | "procurement_anomaly";

export interface OpdUnit {
  id: string;
  opd_code: string;
  name: string;
  kabupaten: string;
  total_budget: number | null;
  fiscal_year: number | null;
}

export interface Document {
  id: string;
  filename: string;
  document_type: DocumentType;
  fiscal_year: number;
  status: DocumentStatus;
  page_count: number | null;
  item_count: number | null;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface RegulationRef {
  peraturan: string;
  pasal: string;
  isi: string;
}

export interface Finding {
  id: string;
  document_id: string;
  opd_id: string | null;
  source: FindingSource;
  finding_type: string;
  risk_level: RiskLevel;
  title: string;
  description: string;
  regulation_refs: RegulationRef[] | null;
  evidence: Record<string, unknown> | null;
  ai_explanation: string | null;
  confidence_score: number | null;
  status: FindingStatus;
  confirmed_at: string | null;
  created_at: string;
}

export interface DashboardOverview {
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_budget_at_risk: number;
  top_risk_opds: Array<{ opd: OpdUnit; red_count: number; total_at_risk: number }>;
  findings_by_type: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  regulation_refs: RegulationRef[] | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
}

export interface AuditMemo {
  id: string;
  opd_id: string | null;
  fiscal_year: number;
  memo_number: string | null;
  format: string;
  storage_path: string | null;
  generated_at: string;
}
