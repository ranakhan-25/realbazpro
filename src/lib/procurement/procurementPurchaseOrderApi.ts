import api from "../api";

export enum ProcurementPurchaseOrderApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementPurchaseOrderStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface PurchaseOrderItem {
  id?: number;
  uuid?: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  details?: string;
  unit?: string;
  quantity: number;
  rate?: number;
  amount?: number;
  budget_qty?: number;
  purchase_qty?: number;
  stock_qty?: number;
  item?: {
    uuid: string;
    item_code: string;
    name: string;
    purchase_price?: number;
    unit?: {
      uuid: string;
      code: string;
      name: string;
    };
  };
}

export interface BackendPurchaseOrder {
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
  subtotal: number | string;
  discount: number | string;
  grand_total: number | string;
  paid: number | string;
  due: number | string;
  note?: string;
  attachment?: string;
  content_footer?: string;
  already_billed?: boolean;
  approval_layer: ProcurementPurchaseOrderApprovalLayer;
  status: ProcurementPurchaseOrderStatus;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
    mobile?: string;
    email?: string;
    address?: string;
  };
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
  company?: {
    uuid: string;
    name: string;
  };
  requisition?: {
    uuid: string;
    code: string;
  };
  addedBy?: {
    id: number;
    name: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchaseOrderListResult {
  data: BackendPurchaseOrder[];
  meta: PurchaseOrderPaginationMeta;
}

export interface CreatePurchaseOrderPayload {
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
  note?: string;
  attachment?: string;
  content_footer?: string;
  added_by_id?: number;
  approval_layer?: ProcurementPurchaseOrderApprovalLayer;
  status?: ProcurementPurchaseOrderStatus;
  items: {
    item_id: string;
    quantity: number;
    rate?: number;
    details?: string;
    budget_qty?: number;
    purchase_qty?: number;
    stock_qty?: number;
  }[];
  orgId?: number;
  projectId?: string;
}

export interface UpdatePurchaseOrderPayload extends Partial<CreatePurchaseOrderPayload> {}

export interface QueryPurchaseOrderParams {
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
  approval_layer?: ProcurementPurchaseOrderApprovalLayer;
  status?: ProcurementPurchaseOrderStatus;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

export const procurementPurchaseOrderApi = {
  async getDropdowns(projectId?: string, categoryId?: string) {
    const res = await api.get("/procurement/purchase-order/dropdowns", {
      params: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });
    return res.data?.data || res.data;
  },

  async getOrders(params?: QueryPurchaseOrderParams): Promise<PurchaseOrderListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) delete cleanParams.withDeleted;

    const res = await api.get("/procurement/purchase-order", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data) ? rootData.data : Array.isArray(rootData) ? rootData : [];
    const meta: PurchaseOrderPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return { data: items, meta };
  },

  async getOrder(uuid: string): Promise<BackendPurchaseOrder> {
    const res = await api.get(`/procurement/purchase-order/${uuid}`);
    return res.data?.data || res.data;
  },

  async createOrder(payload: CreatePurchaseOrderPayload): Promise<BackendPurchaseOrder> {
    const res = await api.post("/procurement/purchase-order", payload);
    return res.data?.data || res.data;
  },

  async updateOrder(uuid: string, payload: UpdatePurchaseOrderPayload): Promise<BackendPurchaseOrder> {
    const res = await api.patch(`/procurement/purchase-order/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  async deleteOrder(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/purchase-order/${uuid}`);
    return res.data?.data || res.data;
  },

  async restoreOrder(uuid: string): Promise<BackendPurchaseOrder> {
    const res = await api.patch(`/procurement/purchase-order/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
