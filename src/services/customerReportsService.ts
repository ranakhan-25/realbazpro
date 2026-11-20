import api from "@/lib/api";

// =========================================================================
// 1. COLLECTIONS & DUES AGEING REPORT TYPES
// =========================================================================

export type AgeingBracket =
  "Current (0-30 d)" | "31-60 Days" | "61-90 Days" | "90+ Days Critical";

export type NoticeStage =
  "On Track" | "1st Reminder" | "2nd Notice" | "Final Statutory Notice";

export interface AgeingReportRow {
  id: string;
  uuid?: string;
  booking_id?: string;
  customerName: string;
  customer_name?: string;
  phone: string;
  unit: string;
  project: string;
  project_id?: string;
  totalAgreementValue: string;
  total_agreement_value?: number;
  totalCollected: string;
  total_collected?: number;
  overdueAmount: string;
  overdue_amount?: number;
  overdueDays: number;
  overdue_days?: number;
  ageingBracket: AgeingBracket;
  ageing_bracket?: AgeingBracket;
  delaySurcharge: string;
  delay_surcharge?: number;
  noticeStage: NoticeStage;
  notice_stage?: NoticeStage;
  recoveryOfficer: string;
  recovery_officer?: string;
}

export interface AgeingKpis {
  total_overdue_receivables: number;
  total_overdue_receivables_formatted: string;
  critical_default_90_plus: number;
  critical_default_90_plus_formatted: string;
  realized_collections_mtd: number;
  realized_collections_mtd_formatted: string;
  collection_velocity_pct: number;
  active_projects_count: number;
}

export interface AgeingTabCounts {
  all: number;
  critical: number;
  "61to90": number;
  "31to60": number;
  current: number;
  notices: number;
}

export interface CollectionsAgeingResponse {
  success: boolean;
  kpis: AgeingKpis;
  tab_counts: AgeingTabCounts;
  items: AgeingReportRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface QueryCollectionsAgeingParams {
  project_id?: string;
  projectId?: string;
  bracket?: string;
  tab?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface IssueNoticePayload {
  notice_stage?: string;
  remedy_period_days?: number;
  officer_notes?: string;
  dispatch_method?: string;
}

// =========================================================================
// 2. HANDOVER & PROPERTY CARE REPORT TYPES
// =========================================================================

export type AssociationStatus =
  "Formed & Handed" | "In Formation" | "Developer Managed";

export interface ProjectHandoverReport {
  id: string;
  project_id?: string;
  projectName: string;
  project_name?: string;
  location: string;
  totalUnits: number;
  total_units?: number;
  handedOverUnits: number;
  handed_over_units?: number;
  handover_percentage?: number;
  pendingInspections: number;
  pending_inspections?: number;
  openSnags: number;
  open_snags?: number;
  activeDlpUnits: number;
  active_dlp_units?: number;
  dlpClaimsResolved: number;
  dlp_claims_resolved?: number;
  totalDlpExpenditure: string;
  total_dlp_expenditure_num?: number;
  maintenanceCollectionRate: string;
  maintenance_collection_rate_num?: number;
  associationStatus: AssociationStatus;
  association_status?: AssociationStatus;
}

export interface HandoverKpis {
  total_handed_over_units: number;
  total_units: number;
  total_handed_over_display: string;
  portfolio_handover_pct: number;
  portfolio_handover_pct_display: string;
  avg_snag_rectification_days: number;
  avg_snag_rectification_display: string;
  active_dlp_units: number;
  active_dlp_units_display: string;
  service_charge_recovery_rate: string;
}

export interface HandoverTabCounts {
  all: number;
  ongoing: number;
  handed: number;
  association: number;
}

export interface HandoverReportResponse {
  success: boolean;
  kpis: HandoverKpis;
  tab_counts: HandoverTabCounts;
  items: ProjectHandoverReport[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface QueryHandoverPropertyCareParams {
  project_id?: string;
  projectId?: string;
  status?: string;
  tab?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

// =========================================================================
// 3. SERVICE TICKET & SLA PERFORMANCE REPORT TYPES
// =========================================================================

export type TicketCategory =
  | "Plumbing & Sanitary"
  | "Finishing & Tiles"
  | "Electrical & MEP"
  | "Accounts & Billing"
  | "Legal & Handover"
  | string;

export type TicketPriority = "Urgent" | "High" | "Medium" | "Low";

export type TicketSlaStatus =
  "Within SLA" | "Breached" | "Approaching Breach" | "Pending Resolution";

export interface TicketSlaRow {
  id: string;
  uuid?: string;
  ticketNo: string;
  ticket_no?: string;
  customerName: string;
  customer_name?: string;
  unit: string;
  project: string;
  project_id?: string;
  category: TicketCategory;
  priority: TicketPriority;
  targetHours: number;
  target_hours?: number;
  actualHours: number;
  actual_hours?: number;
  firstResponseMinutes: number;
  first_response_minutes?: number;
  slaStatus: TicketSlaStatus;
  sla_status?: TicketSlaStatus;
  assignedAgent: string;
  assigned_agent?: string;
  csatRating?: number;
  csat_rating?: number;
}

export interface TicketSlaKpis {
  overall_sla_adherence_pct: number;
  overall_sla_adherence_display: string;
  avg_resolution_time_hours: number;
  avg_resolution_time_display: string;
  first_contact_resolution_pct: number;
  first_contact_resolution_display: string;
  sla_breaches_this_month: number;
  total_tickets_monitored: number;
}

export interface TicketSlaTabCounts {
  all: number;
  within: number;
  breached: number;
  approaching: number;
  urgent: number;
}

export interface TicketSlaReportResponse {
  success: boolean;
  kpis: TicketSlaKpis;
  tab_counts: TicketSlaTabCounts;
  items: TicketSlaRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface QueryServiceTicketSlaParams {
  project_id?: string;
  projectId?: string;
  tab?: string;
  sla_status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

// =========================================================================
// 4. API CLIENT IMPLEMENTATION
// =========================================================================

export const customerReportsService = {
  /**
   * 1. Get Collections Ageing Report with KPIs, tabs, and rows
   */
  async getCollectionsAgeing(
    params?: QueryCollectionsAgeingParams,
  ): Promise<CollectionsAgeingResponse> {
    const query: Record<string, unknown> = {};
    if (params?.project_id && params.project_id !== "all") {
      query.project_id = params.project_id;
    }
    if (params?.bracket && params.bracket !== "all") {
      query.bracket = params.bracket;
    }
    if (params?.tab && params.tab !== "all") {
      query.tab = params.tab;
    }
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get("/customer-service/reports/collections-ageing", {
      params: query,
    });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 2. Get Single Collections Ageing Statement Detail
   */
  async getCollectionsAgeingDetail(id: string) {
    const res = await api.get(
      `/customer-service/reports/collections-ageing/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 3. Issue Formal Statutory Recovery Notice (Real Estate Act 2010 Section 14)
   */
  async issueCollectionsNotice(id: string, payload?: IssueNoticePayload) {
    const res = await api.post(
      `/customer-service/reports/collections-ageing/${id}/issue-notice`,
      payload || {},
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 4. Get Handover & Property Care Report with KPIs, tabs, and projects
   */
  async getHandoverPropertyCare(
    params?: QueryHandoverPropertyCareParams,
  ): Promise<HandoverReportResponse> {
    const query: Record<string, unknown> = {};
    if (params?.project_id && params.project_id !== "all") {
      query.project_id = params.project_id;
    }
    if (params?.status && params.status !== "all") {
      query.status = params.status;
    }
    if (params?.tab && params.tab !== "all") {
      query.tab = params.tab;
    }
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get(
      "/customer-service/reports/handover-property-care",
      {
        params: query,
      },
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 5. Get Single Project Handover & DLP Care Audit Detail
   */
  async getHandoverPropertyCareDetail(id: string) {
    const res = await api.get(
      `/customer-service/reports/handover-property-care/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 6. Get Service Ticket & SLA Performance Report with adherence metrics
   */
  async getServiceTicketSla(
    params?: QueryServiceTicketSlaParams,
  ): Promise<TicketSlaReportResponse> {
    const query: Record<string, unknown> = {};
    if (params?.project_id && params.project_id !== "all") {
      query.project_id = params.project_id;
    }
    if (params?.tab && params.tab !== "all") {
      query.tab = params.tab;
    }
    if (params?.sla_status && params.sla_status !== "all") {
      query.sla_status = params.sla_status;
    }
    if (params?.category) query.category = params.category;
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get("/customer-service/reports/service-ticket-sla", {
      params: query,
    });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 7. Get Single Service Ticket SLA Audit Detail
   */
  async getServiceTicketSlaDetail(id: string) {
    const res = await api.get(
      `/customer-service/reports/service-ticket-sla/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 8. Executive Overview Across All Customer Service Reports
   */
  async getExecutiveSummary(projectId?: string) {
    const params =
      projectId && projectId !== "all" ? { project_id: projectId } : {};
    const res = await api.get("/customer-service/reports/summary", { params });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
};

export default customerReportsService;
