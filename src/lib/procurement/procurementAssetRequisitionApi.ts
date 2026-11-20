import api from "../api";

export enum ProcurementAssetRequisitionApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementAssetRequisitionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface AssetRequisitionItem {
  id?: number;
  uuid?: string;
  item_id: string;
  demand_qty: number;
  details?: string;
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

export interface BackendAssetRequisition {
  id: number;
  uuid: string;
  date: string;
  demand_date?: string;
  code: string;
  ref?: string;
  company_id?: string;
  supplier_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  attachment?: string;
  note?: string;
  approval_layer: ProcurementAssetRequisitionApprovalLayer;
  status: ProcurementAssetRequisitionStatus;
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
  };
  addedBy?: {
    id: number;
    name: string;
  };
  items?: AssetRequisitionItem[];
}

export interface AssetRequisitionPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetRequisitionListResult {
  data: BackendAssetRequisition[];
  meta: AssetRequisitionPaginationMeta;
}

export interface CreateAssetRequisitionPayload {
  date: string;
  demand_date?: string;
  code?: string;
  ref?: string;
  company_id?: string;
  supplier_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  attachment?: string;
  note?: string;
  added_by_id?: number;
  approval_layer?: ProcurementAssetRequisitionApprovalLayer;
  status?: ProcurementAssetRequisitionStatus;
  items: {
    item_id: string;
    demand_qty: number;
    details?: string;
  }[];
  orgId?: number;
  projectId?: string;
}

export interface UpdateAssetRequisitionPayload extends Partial<CreateAssetRequisitionPayload> {}

export interface QueryAssetRequisitionParams {
  page?: number;
  limit?: number;
  search?: string;
  code?: string;
  ref?: string;
  project_id?: string;
  category_id?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
  approval_layer?: ProcurementAssetRequisitionApprovalLayer;
  status?: ProcurementAssetRequisitionStatus;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

export const procurementAssetRequisitionApi = {
  async getDropdowns(projectId?: string, categoryId?: string) {
    const res = await api.get("/procurement/requisition/asset/dropdowns", {
      params: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });
    return res.data?.data || res.data;
  },

  async getRequisitions(params?: QueryAssetRequisitionParams): Promise<AssetRequisitionListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) delete cleanParams.withDeleted;

    const res = await api.get("/procurement/requisition/asset", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data) ? rootData.data : Array.isArray(rootData) ? rootData : [];
    const meta: AssetRequisitionPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return { data: items, meta };
  },

  async getRequisition(uuid: string): Promise<BackendAssetRequisition> {
    const res = await api.get(`/procurement/requisition/asset/${uuid}`);
    return res.data?.data || res.data;
  },

  async createRequisition(payload: CreateAssetRequisitionPayload): Promise<BackendAssetRequisition> {
    const res = await api.post("/procurement/requisition/asset", payload);
    return res.data?.data || res.data;
  },

  async updateRequisition(uuid: string, payload: UpdateAssetRequisitionPayload): Promise<BackendAssetRequisition> {
    const res = await api.patch(`/procurement/requisition/asset/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  async deleteRequisition(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/requisition/asset/${uuid}`);
    return res.data?.data || res.data;
  },

  async restoreRequisition(uuid: string): Promise<BackendAssetRequisition> {
    const res = await api.patch(`/procurement/requisition/asset/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
