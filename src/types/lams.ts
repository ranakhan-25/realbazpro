export type LeadStage =
  | "New"
  | "Contacted"
  | "In Negotiation"
  | "Legal Verification"
  | "Agreement Ready"
  | "Acquired"
  | "Draft"
  | "Submitted"
  | "Qualified"
  | "Approved"
  | "Rejected";

export type LeadSource =
  | "Direct Owner"
  | "Broker/Agent"
  | "Broker"
  | "Bank Auction"
  | "Referral"
  | "Field Survey"
  | "Media / Ad"
  | "Cold Contact"
  | "Online Listing";

export type VerificationStatus =
  | "Verified"
  | "Under Review"
  | "Discrepancy Found"
  | "Pending"
  | "Cleared"
  | "Flagged";

export type NegotiationStatus =
  | "In Progress"
  | "Agreed"
  | "Revision Needed"
  | "Declined"
  | "ongoing"
  | "agreed"
  | "failed";

export type FollowUpStatus =
  | "Pending"
  | "Completed"
  | "Rescheduled"
  | "Cancelled";

export interface NomineeItem {
  name: string;
  relation: string;
  nid: string;
  phone: string;
}

export interface CoOwnerItem {
  name: string;
  share_pct: number;
}

export interface LandOwner {
  id: string;
  uuid?: string;
  code?: string;
  acquisitionLeadId?: string;
  landPlot?: string;
  ownerName?: string;
  isPrimary?: boolean;
  fatherName?: string;
  nidNumber?: string;
  phone: string;
  address: string;
  status?: "Active" | "Inactive";
  addedBy?: string;
  remarks?: string;
  ownershipSharePercentage?: number;
  projectId?: string;
  // Module 02 properties
  name?: string;
  father_name?: string;
  nid?: string;
  email?: string;
  bank_name?: string;
  bank_account?: string;
  nominee_json?: NomineeItem[];
  lands_count?: number;
}

export interface AcquisitionLead {
  id: string;
  uuid?: string;
  leadCode?: string;
  title?: string;
  address?: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  dagNo?: string;
  khatianNo?: string;
  jlNo?: string;
  landArea?: number; // in decimals or katha
  landAreaUnit?: "Decimal" | "Katha" | "Bigha" | "Acre";
  landType?: "Residential" | "Commercial" | "Mixed-use" | "Industrial" | "Agricultural";
  leadStage?: LeadStage;
  leadSource?: LeadSource;
  leadStatus?: "Active" | "Pending" | "On Hold" | "Rejected";
  assignedUser?: string;
  expectedPrice?: number; // BDT
  offeredPrice?: number; // BDT
  ownerName?: string;
  ownerPhone?: string;
  ownerAddress?: string;
  createdAt?: string;
  remarks?: string;
  projectId?: string;
  // Module 02 properties
  code?: string;
  location?: string;
  area_katha?: number;
  area_sqft?: number;
  owner_name?: string;
  owner_phone?: string;
  asking_price?: number;
  source?: string;
  status?: string;
  assignee?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  notes?: string;
  owner_id?: string;
  // Feature 02.03 Land Information & Records
  khatian_no?: string;
  dag_no?: string;
  land_type?: "residential" | "commercial" | "agricultural" | "mixed";
  area_decimal?: number;
  co_owners_json?: CoOwnerItem[];
  map_url?: string;
}

export type ValuationMethod = "comparative" | "income" | "cost" | "residual";

export interface LandValuation {
  id: string;
  uuid?: string;
  lead_code?: string;
  lead_id?: string;
  valuer?: string;
  valuer_id?: string;
  market_rate: number;
  govt_rate?: number;
  total_value: number;
  method: ValuationMethod | string;
  report?: string;
  report_url?: string;
  valued_at?: string;
  notes?: string;
  status?: "Draft" | "Pending" | "Verified" | "Approved" | string;
  org_id?: string;
  createdAt?: string;
}

export interface LegalChecklistFinding {
  checklist_item: string;
  result: "pass" | "fail" | "conditional" | string;
  note: string;
}

export interface LegalVerification {
  id: string;
  uuid?: string;
  lead_code?: string;
  lead_id?: string;
  lawyer?: string;
  lawyer_name?: string;
  title_clear: boolean;
  mutation_ok: boolean;
  tax_clear: boolean;
  findings_json?: LegalChecklistFinding[] | any;
  report?: string;
  report_url?: string;
  opinion?: string;
  status: "pending" | "cleared" | "flagged" | string;
  verified_at?: string;
  org_id?: string;
  createdAt?: string;
}

export interface DueDiligenceItem {
  area: string;
  item: string;
  status: "pending" | "ok" | "issue" | string;
  note: string;
}

export interface DueDiligenceRecord {
  id: string;
  uuid?: string;
  lead?: string;
  lead_code?: string;
  lead_id?: string;
  surveyor_name?: string;
  checklist_items_count?: number;
  completed_count?: number;
  score?: number; // 0-100
  status: "pending" | "ok" | "issue" | "completed" | string;
  report?: string;
  report_url?: string;
  checklist_json?: DueDiligenceItem[] | any;
  created_at?: string;
  org_id?: string;
  createdAt?: string;
}

export interface NegotiationRecord {
  id: string;
  uuid?: string;
  acquisitionLeadId?: string;
  leadTitle?: string;
  mouza?: string;
  dagNo?: string;
  offeredTotalPrice?: number;
  offeredPricePerDecimal?: number;
  counterOfferByOwner?: number;
  counterPricePerDecimal?: number;
  negotiationStatus?: NegotiationStatus;
  meetingDate?: string;
  attendedBy?: string;
  remarks?: string;
  projectId?: string;
  // Module 02 properties
  lead?: string;
  lead_code?: string;
  round_no?: number;
  offer_amount?: number;
  counter_amount?: number;
  final_amount?: number;
  negotiator?: string;
  date?: string;
  status?: "ongoing" | "agreed" | "failed" | string;
  notes?: string;
}

export interface AcquisitionApproval {
  id: string;
  uuid?: string;
  lead?: string;
  lead_code?: string;
  lead_id?: string;
  level?: string; // "Level 1 (Legal)" | "Level 2 (Finance)" | "Level 3 (MD)"
  approver?: string;
  approver_name?: string;
  decision: "pending" | "approved" | "rejected" | string;
  comment?: string;
  decided_at?: string;
  stage?: string;
  org_id?: string;
  createdAt?: string;
}

export interface SettlementPaymentSchedule {
  id?: string | number;
  installment_no: number;
  due_date: string;
  amount: number;
  status?: "Paid" | "Pending" | string;
}

export interface SettlementRecord {
  id: string;
  uuid?: string;
  lead?: string;
  lead_code?: string;
  lead_id?: string;
  owner?: string;
  owner_id?: string;
  agreed_amount: number;
  advance?: number;
  advance_amount?: number;
  paid?: number;
  paid_amount?: number;
  due?: number;
  due_amount?: number;
  payment_mode?: "cash" | "bank" | "cheque" | string;
  scheduled_at?: string;
  status?: "Pending" | "Partially Paid" | "Settled" | "Overdue" | string;
  payment_schedule?: SettlementPaymentSchedule[] | any;
  notes?: string;
  org_id?: string;
  createdAt?: string;
}

export interface SettlementPayment {
  id: string;
  settlement_id: string;
  lead_code: string;
  amount: number;
  mode: "cash" | "bank" | "cheque" | "pay_order";
  txn_ref?: string;
  paid_at: string;
  note?: string;
}

export interface LegalDocument {
  id: string;
  uuid?: string;
  acquisitionLeadId?: string;
  leadTitle?: string;
  documentType?: string;
  verificationStatus?: VerificationStatus;
  documentFileName?: string;
  fileSize?: string;
  verifiedBy?: string;
  verificationDate?: string;
  remarks?: string;
  projectId?: string;
  // Module 02 doc properties
  lead_code?: string;
  category?: string;
  title?: string;
  file?: string;
  size?: string;
  version?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface FollowUpItem {
  id: string;
  uuid?: string;
  sl: number;
  date: string;
  acquisitionLeadId: string;
  landDetails: string;
  ownerDetails: string;
  contact: string;
  followUpType: "Call" | "Site Visit" | "Office Meeting" | "Registry Office" | "Legal Review";
  status: FollowUpStatus;
  note: string;
  assignedTo: string;
  projectId?: string;
}

export interface LamsKpiMetric {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  change: string;
  isPositive: boolean;
  description: string;
  color: "cyan" | "emerald" | "amber" | "indigo";
}

export interface PipelineStageStat {
  stage: LeadStage;
  count: number;
  areaDecimals: number;
  percentage: number;
}

export interface MouzaDistributionStat {
  mouza: string;
  district: string;
  areaDecimals: number;
  leadsCount: number;
  color: string;
}


