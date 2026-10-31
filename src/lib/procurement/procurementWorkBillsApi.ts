import api from "../api";

export type ProcurementWorkBillStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "partially_paid"
  | "paid"
  | "cancelled";

export interface WorkBillDropdownProject {
  uuid: string;
  code: string;
  name: string;
}

export interface WorkBillDropdownWorkOrder {
  uuid: string;
  work_order_no: string;
  title: string;
}

export interface WorkBillDropdownVendor {
  uuid: string;
  code: string;
  name: string;
  businessName?: string | null;
  mobileNo?: string | null;
}

export interface WorkBillDropdownMeasurement {
  uuid: string;
  measurement_no: string;
  date: string;
  amount: number | string;
  work_order_id: string;
  project_id: string;
  workOrder?: {
    uuid: string;
    work_order_no: string;
    title: string;
    subcontractor_id?: string;
    subcontractor?: {
      uuid: string;
      code: string;
      name: string;
      businessName?: string | null;
    };
  };
  project?: {
    uuid: string;
    code: string;
    name: string;
  };
}

export interface WorkBillDropdownsResult {
  eligibleMeasurements: WorkBillDropdownMeasurement[];
  projects: WorkBillDropdownProject[];
  workOrders: WorkBillDropdownWorkOrder[];
  vendors: WorkBillDropdownVendor[];
  statuses: ProcurementWorkBillStatus[];
}

export interface BackendWorkBill {
  id?: number | string;
  uuid: string;
  bill_no: string;
  measurement_id: string;
  measurement?: {
    uuid: string;
    measurement_no: string;
    date: string;
    amount: number | string;
    status: string;
  };
  work_order_id: string;
  workOrder?: {
    uuid: string;
    work_order_no: string;
    title: string;
    type?: string;
    status?: string;
  };
  project_id: string;
  project?: {
    uuid: string;
    code: string;
    name: string;
  };
  vendor_id?: string;
  vendor?: {
    uuid: string;
    code: string;
    name: string;
    businessName?: string | null;
    mobileNo?: string | null;
  };
  net_amount: number | string;
  status: ProcurementWorkBillStatus;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface WorkBillPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkBillListResult {
  data: BackendWorkBill[];
  meta: WorkBillPaginationMeta;
}

export interface QueryWorkBillParams {
  bill_no?: string;
  status?: ProcurementWorkBillStatus | string;
  page?: number;
  limit?: number;
}

export interface CreateWorkBillPayload {
  measurement_id: string;
}

export interface UpdateWorkBillStatusPayload {
  status: ProcurementWorkBillStatus;
}

export const procurementWorkBillsApi = {
  /**
   * GET /realbizpro/api/v1/procurement/work-bills/dropdowns
   * Fetch approved, unbilled measurements with linked work order, project, and vendor information
   */
  async getDropdowns(): Promise<WorkBillDropdownsResult> {
    const res = await api.get("/procurement/work-bills/dropdowns");
    const payload = res.data;
    const data = payload?.data || payload || {};

    return {
      eligibleMeasurements: Array.isArray(data.eligibleMeasurements) ? data.eligibleMeasurements : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      statuses: Array.isArray(data.statuses)
        ? data.statuses
        : ["pending", "approved", "rejected", "partially_paid", "paid", "cancelled"],
    };
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-bills
   * List and filter work bills with pagination
   */
  async list(params?: QueryWorkBillParams): Promise<WorkBillListResult> {
    const query = new URLSearchParams();
    if (params?.bill_no) query.append("bill_no", params.bill_no.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/work-bills${qs ? `?${qs}` : ""}`;
    const res = await api.get(url);
    const body = res.data;

    let items: BackendWorkBill[] = [];
    let meta: WorkBillPaginationMeta = {
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 1,
    };

    if (body) {
      if (Array.isArray(body.data)) {
        items = body.data;
        if (body.meta) {
          meta = {
            total: Number(body.meta.total) || items.length,
            page: Number(body.meta.page) || 1,
            limit: Number(body.meta.limit) || 10,
            totalPages: Number(body.meta.totalPages) || 1,
          };
        } else {
          meta.total = items.length;
          meta.totalPages = Math.max(1, Math.ceil(items.length / (params?.limit || 10)));
        }
      } else if (body.data && Array.isArray(body.data.data)) {
        items = body.data.data;
        const total = Number(body.data.meta?.total ?? body.data.total ?? body.data.count) || items.length;
        const page = Number(body.data.meta?.page ?? body.data.page) || params?.page || 1;
        const limit = Number(body.data.meta?.limit ?? body.data.limit) || params?.limit || 10;
        const totalPages =
          Number(body.data.meta?.totalPages ?? body.data.totalPages) ||
          Math.max(1, Math.ceil(total / limit));

        meta = { total, page, limit, totalPages };
      } else if (Array.isArray(body)) {
        items = body;
        meta.total = body.length;
        meta.totalPages = Math.max(1, Math.ceil(body.length / (params?.limit || 10)));
      }
    }

    return { data: items, meta };
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-bills/:uuid
   * View single work bill and related associations
   */
  async getById(uuid: string): Promise<BackendWorkBill> {
    const res = await api.get(`/procurement/work-bills/${uuid}`);
    const body = res.data;
    return body?.data || body;
  },

  /**
   * POST /realbizpro/api/v1/procurement/work-bills
   * Create work bill from an approved, unbilled measurement
   */
  async create(payload: CreateWorkBillPayload): Promise<BackendWorkBill> {
    const res = await api.post("/procurement/work-bills", payload);
    const body = res.data;
    return body?.data || body;
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/work-bills/:uuid/status
   * Update work bill status
   */
  async updateStatus(
    uuid: string,
    payload: UpdateWorkBillStatusPayload
  ): Promise<BackendWorkBill> {
    const res = await api.patch(`/procurement/work-bills/${uuid}/status`, payload);
    const body = res.data;
    return body?.data || body;
  },
};

