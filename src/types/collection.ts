export type CollectionPaymentMode = "cash" | "bank" | "cheque" | "card" | "mobile";

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";

export interface PaymentScheduleItem {
  id: string;
  booking_code: string;
  party_name: string;
  project_name: string;
  unit_name: string;
  installment_no: number;
  label: string;
  due_date: string;
  amount: number;
  paid: number;
  balance: number;
  status: "paid" | "partial" | "pending" | "overdue";
  days_overdue: number;
}

export interface CustomerDueItem {
  id: string;
  booking_code: string;
  party_name: string;
  phone: string;
  due_amount: number;
  due_date: string;
  aging_days: number;
  aging_bucket: AgingBucket;
  status: "active" | "critical" | "legal_notice" | "default";
  officer_name: string;
}

export interface CollectionEntry {
  id: string;
  receipt_no: string;
  booking_id: string;
  booking_code: string;
  party_name: string;
  installment_id?: string;
  installment_label?: string;
  amount: number;
  mode: CollectionPaymentMode;
  txn_ref?: string;
  collected_by: string;
  collected_at: string;
  notes?: string;
  attachment?: string;
  journal_entry_no?: string;
}

export interface WaiverItem {
  id: string;
  booking_id: string;
  booking_code: string;
  party_name: string;
  amount: number;
  reason: string;
  approver_id?: string;
  approved_by?: string;
  status: "pending" | "approved" | "rejected";
  attachments?: string;
  created_at: string;
}

export interface AdjustmentItem {
  id: string;
  booking_id: string;
  booking_code: string;
  type: "credit_note" | "debit_note" | "rounding";
  amount: number;
  reason: string;
  reference?: string;
  created_at: string;
}

export interface OutstandingReceivable {
  booking_code: string;
  party_name: string;
  project: string;
  officer: string;
  total_agreed: number;
  total_paid: number;
  outstanding_balance: number;
  aging_percentage: number;
  aging_bucket: AgingBucket;
}

export interface AgingAnalysisRow {
  booking_code: string;
  party_name: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_due: number;
}

export interface OverdueCollectionItem {
  booking_code: string;
  party_name: string;
  officer: string;
  days_overdue: number;
  amount: number;
  last_followup_date: string;
  status: string;
}

export interface RecoveryActionItem {
  id: string;
  booking_id: string;
  booking_code: string;
  party_name: string;
  action_type: "call" | "visit" | "legal" | "notice";
  note: string;
  next_action_at: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "resolved";
}

export interface FollowUpItem {
  id: string;
  booking_id: string;
  booking_code: string;
  officer: string;
  note: string;
  next_at: string;
  status: "pending" | "completed" | "rescheduled";
}

export interface FieldVisitItem {
  id: string;
  booking_id: string;
  booking_code: string;
  party_name: string;
  officer_id: string;
  officer: string;
  visited_at: string;
  outcome: "collected" | "promise" | "refused" | "not_home";
  geo_coordinates: string;
  photos?: string;
  note?: string;
}

export interface OfficerPerformanceMetric {
  officer_id: string;
  officer: string;
  target_amount: number;
  collected_amount: number;
  achievement_percentage: number;
  leads_assigned: number;
}

export interface CollectionSummaryKPIs {
  todayCollection: number;
  mtdCollection: number;
  totalOverduePool: number;
  totalReceivables: number;
  collectionRate: number;
  activeFollowups: number;
}
