import api from "../api";

export interface WorkOrderMeasurementDropdownProject {
  uuid: string;
  code: string;
  name: string;
}

export interface WorkOrderMeasurementDropdownWorkOrder {
  uuid: string;
  work_order_no: string;
  title: string;
  project_id: string;
  project?: {
    uuid: string;
    code: string;
    name: string;
  };
}

export interface WorkOrderMeasurementDropdownsResult {
  projects: WorkOrderMeasurementDropdownProject[];
  workOrders: WorkOrderMeasurementDropdownWorkOrder[];
  statuses: string[];
}

export interface BackendWorkOrderMeasurement {
  id?: number | string;
  uuid: string;
  measurement_no: string;
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
  date: string;
  amount: number | string;
  status: string;
  is_billed: boolean;
  notes?: string | null;
  workBill?: {
    id?: number;
    uuid: string;
    bill_no?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface WorkOrderMeasurementPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkOrderMeasurementListResult {
  data: BackendWorkOrderMeasurement[];
  meta: WorkOrderMeasurementPaginationMeta;
}

export interface QueryWorkOrderMeasurementParams {
  measurement_no?: string;
  work_order_id?: string;
  project_id?: string;
  status?: string;
  is_billed?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const procurementWorkOrderMeasurementsApi = {
  /**
   * GET /realbizpro/api/v1/procurement/work-order-measurements/dropdowns
   * Fetch filter dropdown options: projects, work orders, and measurement statuses
   */
  async getDropdowns(): Promise<WorkOrderMeasurementDropdownsResult> {
    const res = await api.get("/procurement/work-order-measurements/dropdowns");
    const payload = res.data;
    const data = payload?.data || payload || {};

    return {
      projects: Array.isArray(data.projects) ? data.projects : [],
      workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
      statuses: Array.isArray(data.statuses) ? data.statuses : [],
    };
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-order-measurements
   * Fetch work order measurements with filtering and pagination
   */
  async list(
    params?: QueryWorkOrderMeasurementParams
  ): Promise<WorkOrderMeasurementListResult> {
    const query = new URLSearchParams();
    if (params?.measurement_no) query.append("measurement_no", params.measurement_no.trim());
    if (params?.work_order_id) query.append("work_order_id", params.work_order_id);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.status) query.append("status", params.status);
    if (params?.is_billed !== undefined) query.append("is_billed", String(params.is_billed));
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/work-order-measurements${qs ? `?${qs}` : ""}`;
    const res = await api.get(url);
    const body = res.data;

    let items: BackendWorkOrderMeasurement[] = [];
    let meta: WorkOrderMeasurementPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/work-order-measurements/:uuid
   * View single work-order measurement and related associations
   */
  async getById(uuid: string): Promise<BackendWorkOrderMeasurement> {
    const res = await api.get(`/procurement/work-order-measurements/${uuid}`);
    const body = res.data;
    return body?.data || body;
  },
};

