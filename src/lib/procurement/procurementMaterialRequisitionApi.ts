import api from "../api";

export enum ProcurementMaterialRequisitionApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementMaterialRequisitionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface MaterialRequisitionItem {
  id?: number;
  uuid?: string;
  item_id?: string;
  item_code: string;
  item_name?: string;
  details?: string;
  unit_id?: string;
  unit?: string;
  budget_qty?: number;
  already_purchase_qty?: number;
  available_qty?: number;
  demand_qty: number;
  stock?: number;
}

export interface BackendMaterialRequisition {
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
  note?: string;
  attachment?: string;
  approval_layer: ProcurementMaterialRequisitionApprovalLayer;
  status: ProcurementMaterialRequisitionStatus;
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
  items?: MaterialRequisitionItem[];
}

export interface MaterialRequisitionPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MaterialRequisitionListResult {
  data: BackendMaterialRequisition[];
  meta: MaterialRequisitionPaginationMeta;
}

export interface CreateMaterialRequisitionPayload {
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
  note?: string;
  attachment?: string;
  added_by_id?: number;
  approval_layer?: ProcurementMaterialRequisitionApprovalLayer;
  status?: ProcurementMaterialRequisitionStatus;
  items: MaterialRequisitionItem[];
  orgId?: number;
  projectId?: string;
}

export interface UpdateMaterialRequisitionPayload extends Partial<CreateMaterialRequisitionPayload> {}

export interface QueryMaterialRequisitionParams {
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
  approval_layer?: ProcurementMaterialRequisitionApprovalLayer;
  status?: ProcurementMaterialRequisitionStatus;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

export const procurementMaterialRequisitionApi = {
  async getDropdowns(projectId?: string, categoryId?: string) {
    const res = await api.get("/procurement/requisition/material/dropdowns", {
      params: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });
    return res.data?.data || res.data;
  },

  async getRequisitions(params?: QueryMaterialRequisitionParams): Promise<MaterialRequisitionListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) delete cleanParams.withDeleted;

    const res = await api.get("/procurement/requisition/material", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data) ? rootData.data : Array.isArray(rootData) ? rootData : [];
    const meta: MaterialRequisitionPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return { data: items, meta };
  },

  async getRequisition(uuid: string): Promise<BackendMaterialRequisition> {
    const res = await api.get(`/procurement/requisition/material/${uuid}`);
    return res.data?.data || res.data;
  },

  async createRequisition(payload: CreateMaterialRequisitionPayload): Promise<BackendMaterialRequisition> {
    const res = await api.post("/procurement/requisition/material", payload);
    return res.data?.data || res.data;
  },

  async updateRequisition(uuid: string, payload: UpdateMaterialRequisitionPayload): Promise<BackendMaterialRequisition> {
    const res = await api.patch(`/procurement/requisition/material/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  async deleteRequisition(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/requisition/material/${uuid}`);
    return res.data?.data || res.data;
  },

  async restoreRequisition(uuid: string): Promise<BackendMaterialRequisition> {
    const res = await api.patch(`/procurement/requisition/material/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
