import api from "../api";

export interface RfqItem {
  id?: number;
  uuid?: string;
  item_id: string;
  quantity: number;
  rate?: number;
  details?: string;
  required_qty?: number;
  purchase_qty?: number;
  stock_qty?: number;
  amount?: number;
  item?: {
    uuid: string;
    item_code: string;
    name: string;
    unit?: {
      code: string;
      name: string;
    };
  };
}

export interface BackendRfq {
  id: number;
  uuid: string;
  date: string;
  code: string;
  reference?: string;
  company_id?: string;
  supplier_id: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  requisition_id?: string;
  attachment?: string;
  subtotal: number | string;
  grand_total: number | string;
  added_by_id?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  };
  projectType?: {
    uuid: string;
    code?: string;
    name: string;
  };
  category?: {
    uuid: string;
    code?: string;
    name: string;
  };
  site?: {
    uuid: string;
    code?: string;
    name: string;
  };
  titleOfWork?: {
    uuid: string;
    code?: string;
    name: string;
  };
  task?: {
    uuid: string;
    taskName: string;
  };
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
    mobile?: string;
    email?: string;
    address?: string;
  };
  addedBy?: {
    id: number;
    name: string;
  };
  requisition?: {
    uuid: string;
    code: string;
  };
  items?: RfqItem[];
}

export interface RfqPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RfqListResult {
  data: BackendRfq[];
  meta: RfqPaginationMeta;
}

export interface CreateRfqPayload {
  date: string;
  supplier_id: string;
  code?: string;
  company_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  requisition_id?: string;
  reference?: string;
  attachment?: string;
  added_by_id?: number;
  items: {
    item_id: string;
    quantity: number;
    rate?: number;
    details?: string;
    required_qty?: number;
    purchase_qty?: number;
    stock_qty?: number;
  }[];
  orgId?: number;
  projectId?: string;
}

export interface UpdateRfqPayload extends Partial<CreateRfqPayload> {}

export interface QueryRfqParams {
  page?: number;
  limit?: number;
  search?: string;
  code?: string;
  reference?: string;
  supplier_id?: string;
  project_id?: string;
  category_id?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

export const procurementRfqApi = {
  async getDropdowns(projectId?: string, categoryId?: string) {
    const res = await api.get("/procurement/rfq/dropdowns", {
      params: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });
    return res.data?.data || res.data;
  },

  async getRfqs(params?: QueryRfqParams): Promise<RfqListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) delete cleanParams.withDeleted;

    const res = await api.get("/procurement/rfq", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data) ? rootData.data : Array.isArray(rootData) ? rootData : [];
    const meta: RfqPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return { data: items, meta };
  },

  async getRfq(uuid: string): Promise<BackendRfq> {
    const res = await api.get(`/procurement/rfq/${uuid}`);
    return res.data?.data || res.data;
  },

  async createRfq(payload: CreateRfqPayload): Promise<BackendRfq> {
    const res = await api.post("/procurement/rfq", payload);
    return res.data?.data || res.data;
  },

  async updateRfq(uuid: string, payload: UpdateRfqPayload): Promise<BackendRfq> {
    const res = await api.patch(`/procurement/rfq/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  async deleteRfq(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/rfq/${uuid}`);
    return res.data?.data || res.data;
  },

  async restoreRfq(uuid: string): Promise<BackendRfq> {
    const res = await api.patch(`/procurement/rfq/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
