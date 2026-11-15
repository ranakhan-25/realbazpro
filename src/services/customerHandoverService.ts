import api from "@/lib/api";

// ============================================================================
// 1. HANDOVER SCHEDULE & READINESS TYPES & METHODS
// ============================================================================

export type HandoverStatus =
  | "Under Construction"
  | "Scheduled"
  | "Ready for Snagging"
  | "Snag Rectification"
  | "Ready for Key Delivery"
  | "Possession Taken"
  | "DLP Active"
  | "Handed Over";

export interface HandoverScheduleItem {
  id: string; // e.g. HO-301
  uuid: string;
  handover_code: string;
  customer_name: string;
  unit_name: string;
  project_name: string;
  project_id?: string | null;
  booking_id?: string | null;
  target_handover_date?: string | null;
  readiness_percentage: number;
  joint_inspection_done: boolean;
  snags_identified: number;
  snags_resolved: number;
  key_register_no?: string | null;
  possession_cert_no?: string | null;
  possession_cert_issued: boolean;
  handover_status: HandoverStatus;
  possession_date?: string | null;
  dlp_expiry_date?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HandoverScheduleStats {
  scheduled_count: number;
  ready_count: number;
  snags_count: number;
  completed_count: number;
  all_count: number;
}

export interface QueryHandoverScheduleParams {
  page?: number;
  limit?: number;
  project_id?: string;
  tab?: string;
  status?: string;
  search?: string;
}

export interface PaginatedHandoverScheduleResult {
  items: HandoverScheduleItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateHandoverSchedulePayload {
  customer_name: string;
  unit_name: string;
  project_name?: string;
  project_id?: string;
  booking_id?: string;
  target_handover_date?: string;
  readiness_percentage?: number;
  joint_inspection_done?: boolean;
  handover_status?: string;
  key_register_no?: string;
  possession_cert_issued?: boolean;
  remarks?: string;
}

export type UpdateHandoverSchedulePayload =
  Partial<CreateHandoverSchedulePayload>;

export async function getHandoverScheduleStats(
  projectId?: string,
): Promise<HandoverScheduleStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get("/customer-service/handover/schedule/stats", {
      params,
    });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      scheduled_count: Number(raw?.scheduled_count || 0),
      ready_count: Number(raw?.ready_count || 0),
      snags_count: Number(raw?.snags_count || 0),
      completed_count: Number(raw?.completed_count || 0),
      all_count: Number(raw?.all_count || 0),
    };
  } catch {
    return {
      scheduled_count: 0,
      ready_count: 0,
      snags_count: 0,
      completed_count: 0,
      all_count: 0,
    };
  }
}

export async function getHandoverScheduleList(
  params?: QueryHandoverScheduleParams,
): Promise<PaginatedHandoverScheduleResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.tab) query.tab = params.tab;
  if (params?.status) query.status = params.status;

  const res = await api.get("/customer-service/handover/schedule", {
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

export async function createHandoverSchedule(
  payload: CreateHandoverSchedulePayload,
): Promise<HandoverScheduleItem> {
  const res = await api.post("/customer-service/handover/schedule", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateHandoverSchedule(
  uuid: string,
  payload: UpdateHandoverSchedulePayload,
): Promise<HandoverScheduleItem> {
  const res = await api.patch(
    `/customer-service/handover/schedule/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteHandoverSchedule(
  uuid: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await api.delete(`/customer-service/handover/schedule/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// ============================================================================
// 2. JOINT INSPECTIONS & SNAGS TYPES & METHODS
// ============================================================================

export type SnagSeverity = "Minor" | "Major" | "Critical";

export type SnagStatus =
  | "Reported"
  | "In Rectification"
  | "Verified by Site Engr"
  | "Client Signed Off";

export interface SnagItem {
  id: string; // e.g. SNG-101
  uuid: string;
  snag_code: string;
  unit_name: string;
  customer_name: string;
  defect_location: string;
  description: string;
  severity: SnagSeverity;
  assigned_contractor: string;
  target_rectification_date?: string | null;
  status: SnagStatus;
  rectified_date?: string | null;
  project_id?: string | null;
  handover_id?: number | null;
  booking_id?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SnagStats {
  active_snags: number;
  pending_contractor: number;
  quality_signed_off: number;
  critical_count: number;
  all_count: number;
}

export interface QuerySnagParams {
  page?: number;
  limit?: number;
  project_id?: string;
  tab?: string;
  status?: string;
  severity?: string;
  search?: string;
}

export interface PaginatedSnagResult {
  items: SnagItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateSnagPayload {
  unit_name: string;
  customer_name: string;
  defect_location: string;
  description: string;
  severity?: string;
  assigned_contractor?: string;
  target_rectification_date?: string;
  status?: string;
  project_id?: string;
  handover_id?: number;
  remarks?: string;
}

export type UpdateSnagPayload = Partial<CreateSnagPayload>;

export async function getSnagStats(projectId?: string): Promise<SnagStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get("/customer-service/handover/snags/stats", {
      params,
    });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      active_snags: Number(raw?.active_snags || 0),
      pending_contractor: Number(raw?.pending_contractor || 0),
      quality_signed_off: Number(raw?.quality_signed_off || 0),
      critical_count: Number(raw?.critical_count || 0),
      all_count: Number(raw?.all_count || 0),
    };
  } catch {
    return {
      active_snags: 0,
      pending_contractor: 0,
      quality_signed_off: 0,
      critical_count: 0,
      all_count: 0,
    };
  }
}

export async function getSnagList(
  params?: QuerySnagParams,
): Promise<PaginatedSnagResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.tab) query.tab = params.tab;
  if (params?.status) query.status = params.status;
  if (params?.severity) query.severity = params.severity;

  const res = await api.get("/customer-service/handover/snags", {
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

export async function createSnagItem(
  payload: CreateSnagPayload,
): Promise<SnagItem> {
  const res = await api.post("/customer-service/handover/snags", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function advanceSnagStatus(uuid: string): Promise<SnagItem> {
  const res = await api.patch(
    `/customer-service/handover/snags/${uuid}/advance`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateSnagItem(
  uuid: string,
  payload: UpdateSnagPayload,
): Promise<SnagItem> {
  const res = await api.patch(
    `/customer-service/handover/snags/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteSnagItem(
  uuid: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await api.delete(`/customer-service/handover/snags/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// ============================================================================
// 3. POSSESSION & HANDOVER RECORDS TYPES & METHODS
// ============================================================================

export interface PossessionRecordItem {
  id: string; // e.g. POS-1001
  uuid: string;
  cert_no: string;
  customer_name: string;
  unit_name: string;
  project_name: string;
  project_id?: string | null;
  possession_date: string;
  dlp_start_date: string;
  dlp_expiry_date?: string | null;
  key_register_no: string;
  keys_delivered_count: number;
  electric_meter_reading: string;
  gas_meter_reading: string;
  water_meter_reading: string;
  signed_by_customer: boolean;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PossessionStats {
  certs_issued: number;
  active_dlp: number;
  keys_signed: number;
  all_count: number;
}

export interface QueryPossessionParams {
  page?: number;
  limit?: number;
  project_id?: string;
  search?: string;
}

export interface PaginatedPossessionResult {
  items: PossessionRecordItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreatePossessionRecordPayload {
  customer_name: string;
  unit_name: string;
  project_name?: string;
  project_id?: string;
  booking_id?: string;
  possession_cert_no?: string;
  possession_date?: string;
  dlp_expiry_date?: string;
  key_register_no?: string;
  keys_delivered_count?: number;
  electric_meter_reading?: string;
  gas_meter_reading?: string;
  water_meter_reading?: string;
  signed_by_customer?: boolean;
  remarks?: string;
}

export type UpdatePossessionRecordPayload =
  Partial<CreatePossessionRecordPayload>;

export async function getPossessionStats(
  projectId?: string,
): Promise<PossessionStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get(
      "/customer-service/handover/possession-records/stats",
      { params },
    );
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      certs_issued: Number(raw?.certs_issued || 0),
      active_dlp: Number(raw?.active_dlp || 0),
      keys_signed: Number(raw?.keys_signed || 0),
      all_count: Number(raw?.all_count || 0),
    };
  } catch {
    return {
      certs_issued: 0,
      active_dlp: 0,
      keys_signed: 0,
      all_count: 0,
    };
  }
}

export async function getPossessionList(
  params?: QueryPossessionParams,
): Promise<PaginatedPossessionResult> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;

  const res = await api.get("/customer-service/handover/possession-records", {
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

export async function createPossessionRecord(
  payload: CreatePossessionRecordPayload,
): Promise<PossessionRecordItem> {
  const res = await api.post(
    "/customer-service/handover/possession-records",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updatePossessionRecord(
  uuid: string,
  payload: UpdatePossessionRecordPayload,
): Promise<PossessionRecordItem> {
  const res = await api.patch(
    `/customer-service/handover/possession-records/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}
