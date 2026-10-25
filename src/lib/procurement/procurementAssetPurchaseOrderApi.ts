import api from "../api";

export enum ProcurementAssetPurchaseOrderApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementAssetPurchaseOrderStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface AssetPODropdownCompany {
  uuid: string;
  name: string;
}

export interface AssetPODropdownSupplier {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface AssetPODropdownProjectType {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetPODropdownProject {
  uuid: string;
  code?: string;
  name: string;
  projectType?: string;
}

export interface AssetPODropdownTitleOfWork {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetPODropdownTask {
  uuid: string;
  uid?: string;
  taskName: string;
}

export interface AssetPODropdownSite {
  uuid: string;
  projectId?: string;
  code?: string;
  name: string;
}

export interface AssetPODropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetPODropdownItem {
  uuid: string;
  category_id?: string;
  unit_id?: string;
  item_code: string;
  name: string;
  purchase_price?: number | string;
  unit?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
}

export interface AssetPODropdownUnit {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetPODropdownRequisition {
  uuid: string;
  code: string;
  project_id?: string;
  date?: string;
}

export interface AssetPODropdownUser {
  id: number;
  name: string;
}

export interface AssetPurchaseOrderDropdownsResult {
  companies: AssetPODropdownCompany[];
  suppliers: AssetPODropdownSupplier[];
  projectTypes: AssetPODropdownProjectType[];
  projects: AssetPODropdownProject[];
  titleOfWorks: AssetPODropdownTitleOfWork[];
  tasks: AssetPODropdownTask[];
  sites: AssetPODropdownSite[];
  categories: AssetPODropdownCategory[];
  assetCategories?: AssetPODropdownCategory[];
  items: AssetPODropdownItem[];
  assetItems?: AssetPODropdownItem[];
  units: AssetPODropdownUnit[];
  assetRequisitions: AssetPODropdownRequisition[];
  users: AssetPODropdownUser[];
}

export interface BackendAssetPurchaseOrderItem {
  id?: number | string;
  uuid?: string;
  purchase_order_id?: string;
  item_id: string;
  unit_id?: string;
  item_code: string;
  item_name: string;
  details?: string;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
  item?: {
    uuid: string;
    item_code: string;
    name: string;
  } | null;
  unitRelation?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
}

export interface BackendAssetPurchaseOrder {
  id?: number;
  uuid: string;
  date: string;
  code: string;
  reference?: string | null;
  company_id?: string | null;
  supplier_id: string;
  project_type_id?: string | null;
  project_id?: string | null;
  title_of_work_id?: string | null;
  task_id?: string | null;
  site_id?: string | null;
  category_id?: string | null;
  requisition_id?: string | null;
  subtotal: number | string;
  grand_total: number | string;
  attachment?: string | null;
  added_by_id?: number | null;
  approval_layer: ProcurementAssetPurchaseOrderApprovalLayer | string;
  status: ProcurementAssetPurchaseOrderStatus | string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  company?: { uuid: string; name: string } | null;
  supplier?: { uuid: string; supplierCode?: string; supplierName: string } | null;
  projectType?: { uuid: string; code?: string; name: string } | null;
  project?: { uuid: string; code?: string; name: string; projectType?: string } | null;
  titleOfWork?: { uuid: string; code?: string; name: string } | null;
  task?: { uuid: string; taskName: string } | null;
  site?: { uuid: string; code?: string; name: string } | null;
  category?: { uuid: string; code?: string; name: string } | null;
  requisition?: { uuid: string; code: string } | null;
  addedBy?: { id: number; name: string } | null;
  items?: BackendAssetPurchaseOrderItem[];
}

export interface AssetPurchaseOrderPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetPurchaseOrderListResult {
  data: BackendAssetPurchaseOrder[];
  meta: AssetPurchaseOrderPaginationMeta;
}

export interface CreateAssetPurchaseOrderItemPayload {
  item_id: string;
  quantity: number;
  rate?: number;
  details?: string;
}

export interface CreateAssetPurchaseOrderPayload {
  date: string; // YYYY-MM-DD
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
  approval_layer?: ProcurementAssetPurchaseOrderApprovalLayer;
  status?: ProcurementAssetPurchaseOrderStatus;
  items: CreateAssetPurchaseOrderItemPayload[];
}

export interface UpdateAssetPurchaseOrderPayload {
  date?: string;
  supplier_id?: string;
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
  approval_layer?: ProcurementAssetPurchaseOrderApprovalLayer;
  status?: ProcurementAssetPurchaseOrderStatus;
  items?: CreateAssetPurchaseOrderItemPayload[];
}

export interface QueryAssetPurchaseOrderParams {
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  company_id?: string;
  supplier_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  added_by_id?: number;
  approval_layer?: ProcurementAssetPurchaseOrderApprovalLayer;
  status?: ProcurementAssetPurchaseOrderStatus;
  withDeleted?: boolean;
}

/**
 * Procurement Asset Purchase Order API Service
 * Interacts with /realbizpro/api/v1/procurement/asset-purchase-order
 */
export const procurementAssetPurchaseOrderApi = {
  /**
   * Fetch populated dropdown options for asset purchase orders
   */
  async getDropdowns(
    projectId?: string,
    categoryId?: string,
  ): Promise<AssetPurchaseOrderDropdownsResult> {
    const params: Record<string, string> = {};
    if (projectId) params.project_id = projectId;
    if (categoryId) params.category_id = categoryId;

    const res = await api.get("/procurement/asset-purchase-order/dropdowns", {
      params,
    });
    const d = res.data?.data || res.data || {};
    return {
      companies: Array.isArray(d.companies) ? d.companies : [],
      suppliers: Array.isArray(d.suppliers) ? d.suppliers : [],
      projectTypes: Array.isArray(d.projectTypes) ? d.projectTypes : [],
      projects: Array.isArray(d.projects) ? d.projects : [],
      titleOfWorks: Array.isArray(d.titleOfWorks) ? d.titleOfWorks : [],
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      sites: Array.isArray(d.sites) ? d.sites : [],
      categories: Array.isArray(d.categories)
        ? d.categories
        : Array.isArray(d.assetCategories)
          ? d.assetCategories
          : [],
      assetCategories: Array.isArray(d.assetCategories)
        ? d.assetCategories
        : Array.isArray(d.categories)
          ? d.categories
          : [],
      items: Array.isArray(d.items)
        ? d.items
        : Array.isArray(d.assetItems)
          ? d.assetItems
          : [],
      assetItems: Array.isArray(d.assetItems)
        ? d.assetItems
        : Array.isArray(d.items)
          ? d.items
          : [],
      units: Array.isArray(d.units) ? d.units : [],
      assetRequisitions: Array.isArray(d.assetRequisitions)
        ? d.assetRequisitions
        : [],
      users: Array.isArray(d.users) ? d.users : [],
    };
  },

  /**
   * Fetch paginated asset purchase orders with search, filters, and withDeleted
   */
  async getOrders(
    params?: QueryAssetPurchaseOrderParams,
  ): Promise<AssetPurchaseOrderListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    if (!params?.search) {
      delete cleanParams.search;
    }
    if (!params?.company_id) {
      delete cleanParams.company_id;
    }
    if (!params?.supplier_id) {
      delete cleanParams.supplier_id;
    }
    if (!params?.project_type_id) {
      delete cleanParams.project_type_id;
    }
    if (!params?.project_id) {
      delete cleanParams.project_id;
    }
    if (!params?.title_of_work_id) {
      delete cleanParams.title_of_work_id;
    }
    if (!params?.date_from) {
      delete cleanParams.date_from;
    }
    if (!params?.date_to) {
      delete cleanParams.date_to;
    }
    if (!params?.added_by_id) {
      delete cleanParams.added_by_id;
    }
    if (!params?.approval_layer) {
      delete cleanParams.approval_layer;
    }
    if (!params?.status) {
      delete cleanParams.status;
    }

    const res = await api.get("/procurement/asset-purchase-order", {
      params: cleanParams,
    });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data)
      ? rootData.data
      : Array.isArray(rootData)
        ? rootData
        : [];
    const meta: AssetPurchaseOrderPaginationMeta = rootData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return {
      data: items,
      meta,
    };
  },

  /**
   * Fetch details of a single asset purchase order by uuid
   */
  async getOrder(uuid: string): Promise<BackendAssetPurchaseOrder> {
    const res = await api.get(`/procurement/asset-purchase-order/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new asset purchase order
   */
  async createOrder(
    payload: CreateAssetPurchaseOrderPayload,
  ): Promise<BackendAssetPurchaseOrder> {
    const res = await api.post("/procurement/asset-purchase-order", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing asset purchase order by uuid
   */
  async updateOrder(
    uuid: string,
    payload: UpdateAssetPurchaseOrderPayload,
  ): Promise<BackendAssetPurchaseOrder> {
    const res = await api.patch(
      `/procurement/asset-purchase-order/${uuid}`,
      payload,
    );
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete an asset purchase order by uuid
   */
  async deleteOrder(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/asset-purchase-order/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted asset purchase order by uuid
   */
  async restoreOrder(uuid: string): Promise<BackendAssetPurchaseOrder> {
    const res = await api.patch(
      `/procurement/asset-purchase-order/${uuid}/restore`,
    );
    return res.data?.data || res.data;
  },
};
