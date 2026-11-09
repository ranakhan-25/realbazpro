import api from "../api";

export interface AssetRfqItem {
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

export interface BackendAssetRfq {
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
  items?: AssetRfqItem[];
}

export interface AssetRfqPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetRfqListResult {
  data: BackendAssetRfq[];
  meta: AssetRfqPaginationMeta;
}

export interface CreateAssetRfqPayload {
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

export interface UpdateAssetRfqPayload extends Partial<CreateAssetRfqPayload> {}

export interface QueryAssetRfqParams {
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

export const procurementAssetRfqApi = {
  async getDropdowns(projectId?: string, categoryId?: string) {
    const res = await api.get("/procurement/asset-rfq/dropdowns", {
      params: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });
    return res.data?.data || res.data;
  },

  async getRfqs(params?: QueryAssetRfqParams): Promise<AssetRfqListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) delete cleanParams.withDeleted;

    const res = await api.get("/procurement/asset-rfq", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data) ? rootData.data : Array.isArray(rootData) ? rootData : [];
    const meta: AssetRfqPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return { data: items, meta };
  },

  async getRfq(uuid: string): Promise<BackendAssetRfq> {
    const res = await api.get(`/procurement/asset-rfq/${uuid}`);
    return res.data?.data || res.data;
  },

  async createRfq(payload: CreateAssetRfqPayload): Promise<BackendAssetRfq> {
    const res = await api.post("/procurement/asset-rfq", payload);
    return res.data?.data || res.data;
  },

  async updateRfq(uuid: string, payload: UpdateAssetRfqPayload): Promise<BackendAssetRfq> {
    const res = await api.patch(`/procurement/asset-rfq/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  async deleteRfq(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/asset-rfq/${uuid}`);
    return res.data?.data || res.data;
  },

  async restoreRfq(uuid: string): Promise<BackendAssetRfq> {
    const res = await api.patch(`/procurement/asset-rfq/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
