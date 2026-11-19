import api from "@/lib/api";

// =========================================================================
// 1. DOMAIN ENUMS & TYPES
// =========================================================================

export type CommChannel = "SMS" | "Email" | "WhatsApp" | "Call";
export type CommType =
  | "Payment Reminder"
  | "Construction Milestone"
  | "Handover Invite"
  | "DLP Update"
  | "Legal Notice"
  | "General Service";
export type CommStatus = "Delivered" | "Read" | "Sent" | "Scheduled" | "Failed";

export type VisitPurpose =
  | "Milestone Inspection"
  | "Snagging Walkthrough"
  | "Handover Walkthrough"
  | "Interior Fit-out"
  | "General Visit";
export type VisitStatus =
  "Scheduled" | "In Progress" | "Completed" | "Rescheduled" | "Cancelled";

export type SurveyType =
  | "Handover CSAT"
  | "Construction Update"
  | "DLP Resolution"
  | "Pre-Sales to Post-Sales"
  | "General Service";
export type NpsCategory = "Promoter" | "Passive" | "Detractor";
export type FeedbackFollowUpStatus =
  | "Satisfied - Closed"
  | "Pending Review"
  | "Escalated to CX Head"
  | "Action Taken";

// =========================================================================
// 2. DATA MODELS
// =========================================================================

export interface CommunicationLog {
  id: string;
  uuid?: string;
  commNo: string;
  customerName: string;
  phone: string;
  email: string;
  unit: string;
  project: string;
  projectId?: string;
  channel: CommChannel;
  type: CommType;
  subjectOrPreview: string;
  sentAt: string;
  status: CommStatus;
  scheduledFor?: string;
  sentBy: string;
  notes?: string;
}

export interface SiteVisitAppointment {
  id: string;
  uuid?: string;
  visitNo: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  projectId?: string;
  visitPurpose: VisitPurpose;
  appointmentDate: string;
  timeSlot: string;
  assignedEscort: string;
  safetyPpeRequired: boolean;
  status: VisitStatus;
  customerNotes?: string;
  outcomeNotes?: string;
}

export interface FeedbackSurvey {
  id: string;
  uuid?: string;
  feedbackNo: string;
  customerName: string;
  unit: string;
  project: string;
  projectId?: string;
  surveyType: SurveyType;
  csatScore: number;
  npsScore: number;
  npsCategory: NpsCategory;
  comments: string;
  followUpStatus: FeedbackFollowUpStatus;
  assignedOfficer: string;
  submittedAt: string;
  resolutionNotes?: string;
}

// =========================================================================
// 3. OVERVIEW & DROPDOWNS
// =========================================================================

export interface CommOverviewData {
  total_communications: number;
  delivery_success_rate: string;
  active_scheduled_reminders: number;
  visits_scheduled_today: number;
  overall_csat_score: number;
  net_promoter_score: number;
  promoter_pct: number;
  detractor_pct: number;
  open_escalations_count: number;
}

export interface CommDropdowns {
  channels: CommChannel[];
  purposes: VisitPurpose[];
  surveys: SurveyType[];
  projects: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
}

// =========================================================================
// 4. QUERY & PAYLOAD INTERFACES
// =========================================================================

export interface QueryInboxParams {
  tab?: string;
  channel?: CommChannel;
  status?: CommStatus;
  search?: string;
  project_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  is_deleted?: boolean;
}

export interface CreateMessagePayload {
  customer_name: string;
  phone?: string;
  email?: string;
  unit?: string;
  project?: string;
  project_id?: string;
  booking_id?: string;
  channel: CommChannel;
  type: CommType;
  subject?: string;
  content?: string;
  subject_or_preview?: string;
  status?: CommStatus;
  scheduled_for?: string;
  notes?: string;
}

export interface QuerySiteVisitsParams {
  tab?: string;
  visit_purpose?: VisitPurpose;
  status?: VisitStatus;
  search?: string;
  project_id?: string;
  appointment_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  is_deleted?: boolean;
}

export interface CreateSiteVisitPayload {
  customer_name: string;
  phone?: string;
  unit?: string;
  project?: string;
  project_id?: string;
  booking_id?: string;
  visit_purpose: VisitPurpose;
  appointment_date: string;
  time_slot: string;
  assigned_escort?: string;
  safety_ppe_required?: boolean;
  status?: VisitStatus;
  customer_notes?: string;
}

export interface UpdateSiteVisitStatusPayload {
  status: VisitStatus;
  outcome_notes?: string;
}

export interface QueryFeedbackParams {
  tab?: string;
  survey_type?: SurveyType;
  nps_category?: NpsCategory;
  follow_up_status?: FeedbackFollowUpStatus;
  search?: string;
  project_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  is_deleted?: boolean;
}

export interface CreateFeedbackPayload {
  customer_name: string;
  unit?: string;
  project?: string;
  project_id?: string;
  booking_id?: string;
  survey_type: SurveyType;
  csat_score: number;
  nps_score: number;
  comments?: string;
  follow_up_status?: FeedbackFollowUpStatus;
  assigned_officer?: string;
}

export interface UpdateFeedbackStatusPayload {
  follow_up_status: FeedbackFollowUpStatus;
  resolution_notes?: string;
}

export interface PaginatedResponse<T, C = Record<string, number>> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: C;
}

// =========================================================================
// 5. SERVICE IMPLEMENTATION
// =========================================================================

export const customerCommunicationService = {
  /**
   * 1. Overview Dashboard Metrics
   */
  async getOverview(projectId?: string): Promise<CommOverviewData> {
    const params =
      projectId && projectId !== "all" ? { project_id: projectId } : {};
    const res = await api.get("/customer-service/communication/overview", {
      params,
    });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  /**
   * 2. Shared Metadata & Reference Dropdowns
   */
  async getDropdowns(): Promise<CommDropdowns> {
    const res = await api.get("/customer-service/communication/dropdowns");
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  // =======================================================================
  // INBOX & REMINDERS
  // =======================================================================

  async getInboxMessages(
    params?: QueryInboxParams,
  ): Promise<PaginatedResponse<CommunicationLog>> {
    const query: Record<string, unknown> = {};
    if (params?.tab && params.tab !== "all") query.tab = params.tab;
    if (params?.channel) query.channel = params.channel;
    if (params?.status) query.status = params.status;
    if (params?.search) query.search = params.search;
    if (params?.project_id && params.project_id !== "all")
      query.project_id = params.project_id;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get(
      "/customer-service/communication/inbox-reminders",
      {
        params: query,
      },
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async getMessage(id: string): Promise<CommunicationLog> {
    const res = await api.get(
      `/customer-service/communication/inbox-reminders/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async sendMessage(payload: CreateMessagePayload): Promise<CommunicationLog> {
    const rawContent = (
      payload.content ||
      payload.subject_or_preview ||
      payload.subject ||
      "Notification"
    ).trim();
      const body: Record<string, unknown> = {
        ...payload,
        content: rawContent,
      };
    delete body.subject_or_preview;
    delete body.subjectOrPreview;
    const res = await api.post(
      "/customer-service/communication/inbox-reminders",
      body,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async resendMessage(
    id: string,
  ): Promise<{ success: boolean; resend_at: string; comm_no: string }> {
    const res = await api.post(
      `/customer-service/communication/inbox-reminders/${id}/resend`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async deleteMessage(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(
      `/customer-service/communication/inbox-reminders/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  // =======================================================================
  // SITE VISITS & APPOINTMENTS
  // =======================================================================

  async getSiteVisits(
    params?: QuerySiteVisitsParams,
  ): Promise<PaginatedResponse<SiteVisitAppointment>> {
    const query: Record<string, unknown> = {};
    if (params?.tab && params.tab !== "all") query.tab = params.tab;
    if (params?.visit_purpose) query.visit_purpose = params.visit_purpose;
    if (params?.status) query.status = params.status;
    if (params?.search) query.search = params.search;
    if (params?.project_id && params.project_id !== "all")
      query.project_id = params.project_id;
    if (params?.appointment_date)
      query.appointment_date = params.appointment_date;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get("/customer-service/communication/site-visits", {
      params: query,
    });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async getSiteVisit(id: string): Promise<SiteVisitAppointment> {
    const res = await api.get(
      `/customer-service/communication/site-visits/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async bookSiteVisit(
    payload: CreateSiteVisitPayload,
  ): Promise<SiteVisitAppointment> {
    const res = await api.post(
      "/customer-service/communication/site-visits",
      payload,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async updateSiteVisitStatus(
    id: string,
    payload: UpdateSiteVisitStatusPayload,
  ): Promise<SiteVisitAppointment> {
    const res = await api.patch(
      `/customer-service/communication/site-visits/${id}/status`,
      payload,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async deleteSiteVisit(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(
      `/customer-service/communication/site-visits/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  // =======================================================================
  // FEEDBACK & CSAT SURVEYS
  // =======================================================================

  async getFeedbackSurveys(
    params?: QueryFeedbackParams,
  ): Promise<PaginatedResponse<FeedbackSurvey>> {
    const query: Record<string, unknown> = {};
    if (params?.tab && params.tab !== "all") query.tab = params.tab;
    if (params?.survey_type) query.survey_type = params.survey_type;
    if (params?.nps_category) query.nps_category = params.nps_category;
    if (params?.follow_up_status)
      query.follow_up_status = params.follow_up_status;
    if (params?.search) query.search = params.search;
    if (params?.project_id && params.project_id !== "all")
      query.project_id = params.project_id;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_order) query.sort_order = params.sort_order;

    const res = await api.get(
      "/customer-service/communication/feedback-surveys",
      {
        params: query,
      },
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async getFeedback(id: string): Promise<FeedbackSurvey> {
    const res = await api.get(
      `/customer-service/communication/feedback-surveys/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async recordFeedback(
    payload: CreateFeedbackPayload,
  ): Promise<FeedbackSurvey> {
    const res = await api.post(
      "/customer-service/communication/feedback-surveys",
      payload,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async updateFeedbackStatus(
    id: string,
    payload: UpdateFeedbackStatusPayload,
  ): Promise<FeedbackSurvey> {
    const res = await api.patch(
      `/customer-service/communication/feedback-surveys/${id}/status`,
      payload,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },

  async deleteFeedback(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(
      `/customer-service/communication/feedback-surveys/${id}`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
};

export default customerCommunicationService;
