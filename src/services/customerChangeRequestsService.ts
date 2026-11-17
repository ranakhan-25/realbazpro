import api from "@/lib/api";

export type ChangeRequestType =
  "Ownership Transfer" | "Resale" | "Cancellation & Refund" | "Unit Swap";

export type ChangeRequestStatus =
  | "Draft"
  | "Legal Verification"
  | "HOD Approval"
  | "Accounts Clearance"
  | "Completed"
  | "Rejected";

export interface ChangeRequestListItem {
  id: string; // Request code / Display ID (e.g. CR-1042)
  uuid: string;
  request_code: string;
  request_type: ChangeRequestType;
  customer_id: string;
  customer_profile_id?: number | null;
  customer_name: string;
  unit: string;
  project: string;
  booking_id?: string | null;
  reason: string;
  transfer_fee: number;
  new_buyer_name?: string | null;
  new_buyer_nid?: string | null;
  new_buyer_phone?: string | null;
  status: ChangeRequestStatus;
  applied_date: string;
  approval_notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date | null;
}

export interface ChangeRequestStats {
  active_requests: number;
  completed_transfers: number;
  transfer_fees_collected: number;
  transfer_fees_collected_formatted: string;
  all_count: number;
  pending_count: number;
  completed_count: number;
  deleted_count: number;
}

export interface ChangeRequestDropdownMeta {
  request_types: ChangeRequestType[];
  statuses: ChangeRequestStatus[];
  workflow_pipeline: ChangeRequestStatus[];
  tab_filters: string[];
}

export interface PaginatedChangeRequestsResult {
  items: ChangeRequestListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface QueryChangeRequestParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: string;
  status?: string;
  request_type?: string;
  is_deleted?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc" | "ASC" | "DESC";
  project_id?: string;
  projectId?: string;
}

export interface CreateChangeRequestPayload {
  request_type: ChangeRequestType;
  customer_name: string;
  unit: string;
  customer_profile_id?: number;
  project?: string;
  project_id?: string;
  projectId?: string;
  booking_id?: string;
  reason?: string;
  transfer_fee?: number;
  new_buyer_name?: string;
  new_buyer_nid?: string;
  new_buyer_phone?: string;
  status?: ChangeRequestStatus;
  applied_date?: string;
  approval_notes?: string;
}

export type UpdateChangeRequestPayload = Partial<CreateChangeRequestPayload>;

export interface AdvanceChangeRequestPayload {
  notes?: string;
}

export interface UpdateChangeRequestStatusPayload {
  status: ChangeRequestStatus;
  remarks?: string;
}

/**
 * 1. Fetch Change Requests KPI Statistics (Aggregated real-time metrics)
 */
export async function getChangeRequestStats(
  projectId?: string,
): Promise<ChangeRequestStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get("/customer-service/change-requests/stats", {
      params,
    });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      active_requests: Number(raw?.active_requests || 0),
      completed_transfers: Number(raw?.completed_transfers || 0),
      transfer_fees_collected: Number(raw?.transfer_fees_collected || 0),
      transfer_fees_collected_formatted:
        raw?.transfer_fees_collected_formatted || "৳ 0.00",
      all_count: Number(raw?.all_count || 0),
      pending_count: Number(raw?.pending_count || 0),
      completed_count: Number(raw?.completed_count || 0),
      deleted_count: Number(raw?.deleted_count || 0),
    };
  } catch {
    return {
      active_requests: 0,
      completed_transfers: 0,
      transfer_fees_collected: 0,
      transfer_fees_collected_formatted: "৳ 0.00",
      all_count: 0,
      pending_count: 0,
      completed_count: 0,
      deleted_count: 0,
    };
  }
}

/**
 * 2. Fetch Dropdown Metadata (Request types, statuses, workflow stages)
 */
export async function getChangeRequestDropdownMeta(): Promise<ChangeRequestDropdownMeta> {
  const res = await api.get("/customer-service/change-requests/dropdown/meta");
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    request_types: Array.isArray(raw?.request_types)
      ? raw.request_types
      : ["Ownership Transfer", "Resale", "Cancellation & Refund", "Unit Swap"],
    statuses: Array.isArray(raw?.statuses)
      ? raw.statuses
      : [
          "Draft",
          "Legal Verification",
          "HOD Approval",
          "Accounts Clearance",
          "Completed",
          "Rejected",
        ],
    workflow_pipeline: Array.isArray(raw?.workflow_pipeline)
      ? raw.workflow_pipeline
      : [
          "Draft",
          "Legal Verification",
          "HOD Approval",
          "Accounts Clearance",
          "Completed",
        ],
    tab_filters: Array.isArray(raw?.tab_filters)
      ? raw.tab_filters
      : ["all", "pending", "completed", "deleted"],
  };
}

/**
 * 3. List Customer Change Requests with Search, Filter Tabs, and Server Pagination
 */
export async function getChangeRequests(
  params?: QueryChangeRequestParams,
): Promise<PaginatedChangeRequestsResult> {
  const queryParams: Record<string, unknown> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.search) queryParams.search = params.search;
  if (params?.tab && params.tab !== "all") queryParams.tab = params.tab;
  if (params?.status && params.status !== "all")
    queryParams.status = params.status;
  if (params?.request_type && params.request_type !== "all")
    queryParams.request_type = params.request_type;
  if (params?.is_deleted) {
    queryParams.is_deleted = true;
  }
  if (params?.sort_by) queryParams.sort_by = params.sort_by;
  if (params?.sort_order) queryParams.sort_order = params.sort_order;
  const targetProjectId = params?.projectId || params?.project_id;
  if (targetProjectId && targetProjectId !== "all") {
    queryParams.project_id = targetProjectId;
  }
  delete queryParams.projectId;
  delete queryParams.organization_id;
  delete queryParams.organizationId;

  try {
    const res = await api.get("/customer-service/change-requests", {
      params: queryParams,
    });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;

    return {
      items: Array.isArray(raw?.items) ? raw.items : [],
      meta: raw?.meta || {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        total_pages: 1,
      },
    };
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (
      errorObj?.response?.data?.message?.includes("does not exist") ||
      errorObj?.message?.includes("does not exist")
    ) {
      return {
        items: [],
        meta: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          total_pages: 1,
        },
      };
    }
    throw err;
  }
}

/**
 * 4. Get Change Request Detail by UUID
 */
export async function getChangeRequestByUuid(
  uuid: string,
): Promise<ChangeRequestListItem> {
  const res = await api.get(`/customer-service/change-requests/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 5. Create / Initiate New Change Request Application
 */
export async function createChangeRequest(
  payload: CreateChangeRequestPayload,
): Promise<ChangeRequestListItem> {
  const sanitizedPayload: Record<string, unknown> = {
    ...payload,
    project_id: payload.project_id || payload.projectId || payload.project,
  };
  delete sanitizedPayload.projectId;
  delete sanitizedPayload.project;
  delete sanitizedPayload.organization_id;
  delete sanitizedPayload.organizationId;
  const res = await api.post(
    "/customer-service/change-requests",
    sanitizedPayload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 6. Update Existing Change Request Details
 */
export async function updateChangeRequest(
  uuid: string,
  payload: UpdateChangeRequestPayload,
): Promise<ChangeRequestListItem> {
  const sanitizedPayload: Record<string, unknown> = {
    ...payload,
    ...(payload.projectId || payload.project_id
      ? { project_id: payload.project_id || payload.projectId }
      : {}),
  };
  delete sanitizedPayload.projectId;
  delete sanitizedPayload.project;
  delete sanitizedPayload.organization_id;
  delete sanitizedPayload.organizationId;
  const res = await api.patch(
    `/customer-service/change-requests/${uuid}`,
    sanitizedPayload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 7. Advance Workflow Pipeline Stage (Legal -> HOD -> Accounts -> Completed)
 */
export async function advanceChangeRequest(
  uuid: string,
  payload?: AdvanceChangeRequestPayload,
): Promise<{ message: string; data: ChangeRequestListItem }> {
  const res = await api.patch(
    `/customer-service/change-requests/${uuid}/advance`,
    payload || {},
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 8. Directly Update Workflow Status (e.g. Reject or Set Status)
 */
export async function updateChangeRequestStatus(
  uuid: string,
  payload: UpdateChangeRequestStatusPayload,
): Promise<{ message: string; data: ChangeRequestListItem }> {
  const res = await api.patch(
    `/customer-service/change-requests/${uuid}/status`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 9. Soft-Delete Change Request
 */
export async function deleteChangeRequest(
  uuid: string,
): Promise<{ message: string; uuid: string }> {
  const res = await api.delete(`/customer-service/change-requests/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 10. Restore Soft-Deleted Change Request (PATCH)
 */
export async function restoreChangeRequest(
  uuid: string,
): Promise<{ message: string; data: ChangeRequestListItem }> {
  const res = await api.patch(
    `/customer-service/change-requests/${uuid}/restore`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * 11. Restore Soft-Deleted Change Request (POST Alternative)
 */
export async function restoreChangeRequestPost(
  uuid: string,
): Promise<{ message: string; data: ChangeRequestListItem }> {
  const res = await api.post(
    `/customer-service/change-requests/${uuid}/restore`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}
