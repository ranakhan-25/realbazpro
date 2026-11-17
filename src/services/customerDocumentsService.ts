import api from "@/lib/api";

// ============================================================================
// 1. DIGITAL VAULT & DOCUMENT CENTRE TYPES & METHODS
// ============================================================================

export type DocumentCategory =
  | "Sale Agreement (Baina)"
  | "Allotment Letter"
  | "Power of Attorney (POA)"
  | "KYC & NID Scans"
  | "Possession Certificate"
  | "Other";

export type DocumentVerificationStatus =
  "Pending Vetting" | "Verified" | "Signed & Executed" | "Rejected";

export interface CustomerDocumentItem {
  id: string; // e.g. DOC-201
  uuid: string;
  doc_code: string;
  doc_title: string;
  doc_category: DocumentCategory;
  customer_name: string;
  unit_name?: string | null;
  project_id?: string | null;
  booking_id?: string | null;
  customer_profile_id?: number | null;
  file_name?: string | null;
  file_size?: string | null;
  file_url?: string | null;
  file_key?: string | null;
  upload_date: string;
  verification_status: DocumentVerificationStatus;
  verified_by?: number | null;
  verified_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerDocumentStats {
  total_archived: number;
  pending_vetting: number;
  signed_executed: number;
  verified: number;
  all_count: number;
  pending_count: number;
  executed_count: number;
  deleted_count?: number;
}

export interface QueryCustomerDocumentParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  category?: string;
  status?: string;
  tab?: string;
  is_deleted?: boolean;
}

export interface PaginatedCustomerDocumentsResult {
  items: CustomerDocumentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateCustomerDocumentPayload {
  doc_title: string;
  doc_category?: string;
  customer_name: string;
  unit_name?: string;
  project_id?: string;
  file_name?: string;
  file_size?: string;
  file_url?: string;
  file_key?: string;
  upload_date?: string;
  verification_status?: string;
  notes?: string;
}

export type UpdateCustomerDocumentPayload =
  Partial<CreateCustomerDocumentPayload>;

export async function getCustomerDocumentStats(
  projectId?: string,
): Promise<CustomerDocumentStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get("/customer-service/documents/stats", { params });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      total_archived: Number(raw?.total_archived || 0),
      pending_vetting: Number(raw?.pending_vetting || 0),
      signed_executed: Number(raw?.signed_executed || 0),
      verified: Number(raw?.verified || 0),
      all_count: Number(raw?.all_count || 0),
      pending_count: Number(raw?.pending_count || 0),
      executed_count: Number(raw?.executed_count || 0),
    };
  } catch {
    return {
      total_archived: 0,
      pending_vetting: 0,
      signed_executed: 0,
      verified: 0,
      all_count: 0,
      pending_count: 0,
      executed_count: 0,
    };
  }
}

export async function getCustomerDocuments(
  params?: QueryCustomerDocumentParams,
): Promise<PaginatedCustomerDocumentsResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.category) query.category = params.category;
  if (params?.status) query.status = params.status;
  if (params?.tab) query.tab = params.tab;

  const res = await api.get("/customer-service/documents", { params: query });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function createCustomerDocument(
  payload: CreateCustomerDocumentPayload,
): Promise<CustomerDocumentItem> {
  const res = await api.post("/customer-service/documents", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateCustomerDocument(
  uuid: string,
  payload: UpdateCustomerDocumentPayload,
): Promise<CustomerDocumentItem> {
  const res = await api.patch(`/customer-service/documents/${uuid}`, payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteCustomerDocument(
  uuid: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await api.delete(`/customer-service/documents/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// ============================================================================
// 2. SUB-REGISTRAR REGISTRATION TRACKING TYPES & METHODS
// ============================================================================

export type DeedDraftStatus =
  "Draft Ready" | "Vetting Complete" | "Revision Requested";

export type RegistrationStatus =
  | "Documents Gathering"
  | "Drafting & Vetting"
  | "Appointment Booked"
  | "Registry Executed"
  | "Original Deed Delivered";

export interface RegistrationTrackingItem {
  id: string; // e.g. REG-801
  uuid: string;
  reg_code: string;
  customer_name: string;
  unit_name?: string | null;
  project_name?: string | null;
  project_id?: string | null;
  booking_id?: string | null;
  customer_profile_id?: number | null;
  sub_registrar_office: string;
  deed_draft_status: DeedDraftStatus;
  registration_date_scheduled?: string | null;
  total_govt_fees: number;
  fee_receipt_collected: boolean;
  registered_deed_no?: string | null;
  status: RegistrationStatus;
  delivered_date?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationTrackingStats {
  active_pipeline: number;
  appointments_scheduled: number;
  deeds_delivered: number;
  all_count: number;
  pending_count: number;
  delivered_count: number;
  deleted_count?: number;
}

export interface QueryRegistrationTrackingParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  status?: string;
  tab?: string;
  is_deleted?: boolean;
}

export interface PaginatedRegistrationTrackingResult {
  items: RegistrationTrackingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateRegistrationTrackingPayload {
  customer_name: string;
  unit_name?: string;
  project_name?: string;
  project_id?: string;
  sub_registrar_office: string;
  deed_draft_status?: string;
  registration_date_scheduled?: string;
  total_govt_fees?: number;
  fee_receipt_collected?: boolean;
  registered_deed_no?: string;
  status?: string;
  delivered_date?: string;
  remarks?: string;
}

export type UpdateRegistrationTrackingPayload =
  Partial<CreateRegistrationTrackingPayload>;

export async function getRegistrationTrackingStats(
  projectId?: string,
): Promise<RegistrationTrackingStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get(
      "/customer-service/documents/registration-tracking/stats",
      {
        params,
      },
    );
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      active_pipeline: Number(raw?.active_pipeline || 0),
      appointments_scheduled: Number(raw?.appointments_scheduled || 0),
      deeds_delivered: Number(raw?.deeds_delivered || 0),
      all_count: Number(raw?.all_count || 0),
      pending_count: Number(raw?.pending_count || 0),
      delivered_count: Number(raw?.delivered_count || 0),
    };
  } catch {
    return {
      active_pipeline: 0,
      appointments_scheduled: 0,
      deeds_delivered: 0,
      all_count: 0,
      pending_count: 0,
      delivered_count: 0,
    };
  }
}

export async function getRegistrationTrackings(
  params?: QueryRegistrationTrackingParams,
): Promise<PaginatedRegistrationTrackingResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.status) query.status = params.status;
  if (params?.tab) query.tab = params.tab;

  const res = await api.get(
    "/customer-service/documents/registration-tracking",
    {
      params: query,
    },
  );
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function createRegistrationTracking(
  payload: CreateRegistrationTrackingPayload,
): Promise<RegistrationTrackingItem> {
  const res = await api.post(
    "/customer-service/documents/registration-tracking",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateRegistrationTracking(
  uuid: string,
  payload: UpdateRegistrationTrackingPayload,
): Promise<RegistrationTrackingItem> {
  const res = await api.patch(
    `/customer-service/documents/registration-tracking/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteRegistrationTracking(
  uuid: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await api.delete(
    `/customer-service/documents/registration-tracking/${uuid}`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// ============================================================================
// 3. E-MUTATION & KHATIAN TRACKING TYPES & METHODS
// ============================================================================

export type MutationStage =
  | "Application Submitted"
  | "Kanungo/Surveyor Inquiry"
  | "Hearing Scheduled"
  | "DCR Payment Pending"
  | "Khatian Approved"
  | "Rejected";

export interface MutationTrackingItem {
  id: string; // e.g. MUT-701
  uuid: string;
  mut_code: string;
  customer_name: string;
  unit_name?: string | null;
  project_name?: string | null;
  project_id?: string | null;
  booking_id?: string | null;
  customer_profile_id?: number | null;
  mutation_app_no: string;
  ac_land_office: string;
  current_stage: MutationStage;
  hearing_date?: string | null;
  dcr_number?: string | null;
  dcr_fee_amount: number;
  dcr_paid: boolean;
  khatian_number?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MutationTrackingStats {
  active_cases: number;
  hearings_scheduled: number;
  khatian_approved: number;
  kanungo_inquiry: number;
  all_count: number;
  hearing_count: number;
  inquiry_count: number;
  approved_count: number;
  deleted_count?: number;
}

export interface QueryMutationTrackingParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  current_stage?: string;
  tab?: string;
  is_deleted?: boolean;
}

export interface PaginatedMutationTrackingResult {
  items: MutationTrackingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateMutationTrackingPayload {
  customer_name: string;
  unit_name?: string;
  project_name?: string;
  project_id?: string;
  mutation_app_no: string;
  ac_land_office: string;
  current_stage?: string;
  hearing_date?: string;
  dcr_number?: string;
  dcr_fee_amount?: number;
  dcr_paid?: boolean;
  khatian_number?: string;
  remarks?: string;
}

export type UpdateMutationTrackingPayload =
  Partial<CreateMutationTrackingPayload>;

export async function getMutationTrackingStats(
  projectId?: string,
): Promise<MutationTrackingStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get(
      "/customer-service/documents/mutation-tracking/stats",
      {
        params,
      },
    );
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      active_cases: Number(raw?.active_cases || 0),
      hearings_scheduled: Number(raw?.hearings_scheduled || 0),
      khatian_approved: Number(raw?.khatian_approved || 0),
      kanungo_inquiry: Number(raw?.kanungo_inquiry || 0),
      all_count: Number(raw?.all_count || 0),
      hearing_count: Number(raw?.hearing_count || 0),
      inquiry_count: Number(raw?.inquiry_count || 0),
      approved_count: Number(raw?.approved_count || 0),
    };
  } catch {
    return {
      active_cases: 0,
      hearings_scheduled: 0,
      khatian_approved: 0,
      kanungo_inquiry: 0,
      all_count: 0,
      hearing_count: 0,
      inquiry_count: 0,
      approved_count: 0,
    };
  }
}

export async function getMutationTrackings(
  params?: QueryMutationTrackingParams,
): Promise<PaginatedMutationTrackingResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.current_stage) query.current_stage = params.current_stage;
  if (params?.tab) query.tab = params.tab;

  const res = await api.get("/customer-service/documents/mutation-tracking", {
    params: query,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function createMutationTracking(
  payload: CreateMutationTrackingPayload,
): Promise<MutationTrackingItem> {
  const res = await api.post(
    "/customer-service/documents/mutation-tracking",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateMutationTracking(
  uuid: string,
  payload: UpdateMutationTrackingPayload,
): Promise<MutationTrackingItem> {
  const res = await api.patch(
    `/customer-service/documents/mutation-tracking/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteMutationTracking(
  uuid: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await api.delete(
    `/customer-service/documents/mutation-tracking/${uuid}`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}
