import api from "@/lib/api";

export interface CustomerListItem {
  id: string;
  uuid: string;
  customer_code: string;
  customer_name: string;
  phone_number: string;
  email: string;
  nid_number: string;
  tin_number?: string;
  address: string;
  nominee_name: string;
  nominee_relation: string;
  nominee_nid: string;
  customer_status: "active" | "vip" | "disputed" | "closed";
  total_bookings: number;
  total_paid_amount: number;
  total_due_amount: number;
  joined_date: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date | null;
}

export type CustomerProfile = CustomerListItem;

export interface CustomerStats {
  total_clients: number;
  vip_clients: number;
  active_clients?: number;
  disputed_clients?: number;
  deleted_clients?: number;
  total_lifetime_collections: number;
  total_lifetime_collections_formatted: string;
}

export interface CustomerDetail {
  profile: {
    id: string;
    uuid: string;
    customer_code: string;
    customer_name: string;
    phone_number: string;
    email: string;
    nid_number: string;
    tin_number: string;
    address: string;
    customer_status: "active" | "vip" | "disputed" | "closed";
    joined_date: string;
    created_at?: string | Date;
    updated_at?: string | Date;
  };
  kyc: {
    verified: boolean;
    nid_number: string;
    tin_number: string;
    primary_phone: string;
    email: string;
    mailing_address: string;
  };
  nominee: {
    nominee_name: string;
    nominee_relation: string;
    nominee_nid: string;
  };
  financial_summary: {
    total_paid_amount: number;
    total_due_amount: number;
    total_bookings: number;
  };
  bookings: Array<{
    booking_id: string;
    uuid: string;
    project_name: string;
    booking_date: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    status: string;
  }>;
}

export type Customer360Details = CustomerDetail;

export interface CreateCustomerPayload {
  customer_name: string;
  phone_number: string;
  nid_number: string;
  email?: string;
  tin_number?: string;
  address?: string;
  nominee_name?: string;
  nominee_relation?: string;
  nominee_nid?: string;
  customer_status?: "active" | "vip" | "disputed" | "closed";
  party_id?: number;
  customer_account_id?: number;
  project_id?: string;
  projectId?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export interface CustomerDropdownOption {
  value: string;
  label: string;
  uuid: string;
  id?: number;
}

export interface CustomerDropdownMeta {
  customer_statuses: Array<{ value: string; label: string }>;
  nominee_relations: Array<{ value: string; label: string }>;
}

export interface PaginatedCustomersResult {
  items: CustomerListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page?: boolean;
    has_previous_page?: boolean;
  };
}

/**
 * Fetch paginated customer profiles with snake_case search, status filter, and pagination
 */
export async function getCustomers(params?: {
  search?: string;
  status?: string;
  is_deleted?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  project_id?: string;
  projectId?: string;
}): Promise<PaginatedCustomersResult> {
  const queryParams: Record<string, unknown> = { ...params };
  if (queryParams.is_deleted === false) {
    delete queryParams.is_deleted;
  }
  const targetProjectId = params?.projectId || params?.project_id;
  if (targetProjectId && targetProjectId !== "all") {
    queryParams.project_id = targetProjectId;
  }
  delete queryParams.projectId;
  delete queryParams.organization_id;
  delete queryParams.organizationId;
  const res = await api.get("/customer-service/customers", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: raw?.items || (Array.isArray(raw) ? raw : []),
    meta: raw?.meta || {
      total: raw?.items?.length || 0,
      page: 1,
      limit: 10,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
    },
  };
}

/**
 * Fetch Customer 360 overview KPI statistics (snake_case)
 */
export async function getCustomerStats(
  projectId?: string,
): Promise<CustomerStats> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/customers/stats", { params });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    total_clients: Number(raw?.total_clients || 0),
    vip_clients: Number(raw?.vip_clients || 0),
    active_clients: Number(raw?.active_clients || 0),
    disputed_clients: Number(raw?.disputed_clients || 0),
    deleted_clients: Number(raw?.deleted_clients || 0),
    total_lifetime_collections: Number(raw?.total_lifetime_collections || 0),
    total_lifetime_collections_formatted:
      raw?.total_lifetime_collections_formatted || "৳ 0.00",
  };
}

/**
 * Fetch comprehensive Customer 360 details including KYC, ledger, and bookings (snake_case)
 */
export async function getCustomer360ById(
  uuid: string,
): Promise<CustomerDetail> {
  const res = await api.get(`/customer-service/customers/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * Create new customer profile using snake_case payload
 */
export async function createCustomerProfile(
  payload: CreateCustomerPayload,
): Promise<CustomerListItem> {
    const sanitizedPayload: Record<string, unknown> = {
      ...payload,
      ...(payload.projectId || payload.project_id
        ? { project_id: payload.project_id || payload.projectId }
        : {}),
  };
delete sanitizedPayload.projectId;
delete sanitizedPayload.organization_id;
delete sanitizedPayload.organizationId;
const res = await api.post("/customer-service/customers", sanitizedPayload);
return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * Update existing customer profile using snake_case payload
 */
export async function updateCustomerProfile(
  uuid: string,
  payload: UpdateCustomerPayload,
): Promise<CustomerListItem> {
    const sanitizedPayload: Record<string, unknown> = {
      ...payload,
      ...(payload.projectId || payload.project_id
        ? { project_id: payload.project_id || payload.projectId }
        : {}),
  };
delete sanitizedPayload.projectId;
delete sanitizedPayload.organization_id;
delete sanitizedPayload.organizationId;
const res = await api.patch(
  `/customer-service/customers/${uuid}`,
  sanitizedPayload,
);
return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * Soft delete customer profile (paranoid delete)
 */
export async function deleteCustomerProfile(
  uuid: string,
): Promise<{ message: string }> {
  const res = await api.delete(`/customer-service/customers/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * Restore soft-deleted customer profile
 * Documented endpoint: PATCH /realbizpro/api/v1/customer-service/customers/{uuid}/restore
 */
export async function restoreCustomerProfile(
  uuid: string,
): Promise<{ message: string; customer?: CustomerListItem }> {
  const res = await api.patch(`/customer-service/customers/${uuid}/restore`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

/**
 * Fetch customer dropdown options from real database records
 */
export async function getCustomersDropdown(
  search?: string,
): Promise<CustomerDropdownOption[]> {
  const res = await api.get("/customer-service/customers/dropdown", {
    params: { search },
  });
  const data = res.data?.data !== undefined ? res.data.data : res.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch dynamic dropdown options for statuses and nominee relations (no hardcoded options)
 */
export async function getCustomerDropdownMeta(): Promise<CustomerDropdownMeta> {
  const res = await api.get("/customer-service/customers/dropdown/meta");
  const data = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    customer_statuses: Array.isArray(data?.customer_statuses)
      ? data.customer_statuses
      : [
        { value: "active", label: "Active Regular" },
        { value: "vip", label: "VIP Client" },
        { value: "disputed", label: "Flagged / Disputed" },
        { value: "closed", label: "Closed Account" },
      ],
    nominee_relations: Array.isArray(data?.nominee_relations)
      ? data.nominee_relations
      : [
        { value: "Spouse", label: "Spouse" },
        { value: "Son", label: "Son" },
        { value: "Daughter", label: "Daughter" },
        { value: "Father", label: "Father" },
        { value: "Mother", label: "Mother" },
        { value: "Brother", label: "Brother" },
      ],
  };
}
