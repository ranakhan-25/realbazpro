import api from "../api";

export enum ProcurementGrnApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementGrnStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface GrnDropdownCompany {
  uuid: string;
  name: string;
}

export interface GrnDropdownSupplier {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface GrnDropdownProjectType {
  uuid: string;
  code?: string;
  name: string;
}

export interface GrnDropdownProject {
  uuid: string;
  code?: string;
  name: string;
  projectType?: string;
}

export interface GrnDropdownTitleOfWork {
  uuid: string;
  code?: string;
  name: string;
}

export interface GrnDropdownTask {
  uuid: string;
  uid?: string;
  taskName: string;
}

export interface GrnDropdownSite {
  uuid: string;
  projectId?: string;
  code?: string;
  name: string;
}

export interface GrnDropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface GrnDropdownItem {
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

export interface GrnDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
}

export interface GrnDropdownPurchaseOrder {
  uuid: string;
  code: string;
  reference?: string;
  supplier_id?: string;
  project_id?: string;
}

export interface GrnDropdownRequisition {
  uuid: string;
  code: string;
  project_id?: string;
  date?: string;
}

export interface GrnDropdownUser {
  id: number;
  name: string;
}

export interface GrnDropdownsResult {
  companies: GrnDropdownCompany[];
  suppliers: GrnDropdownSupplier[];
  projectTypes: GrnDropdownProjectType[];
  projects: GrnDropdownProject[];
  titleOfWorks: GrnDropdownTitleOfWork[];
  tasks: GrnDropdownTask[];
  sites: GrnDropdownSite[];
  categories: GrnDropdownCategory[];
  items: GrnDropdownItem[];
  units: GrnDropdownUnit[];
  purchaseOrders: GrnDropdownPurchaseOrder[];
  requisitions: GrnDropdownRequisition[];
  users: GrnDropdownUser[];
}

export interface BackendGrnItem {
  uuid?: string;
  id?: number | string;
  grn_id?: string;
  purchase_order_item_id?: string | null;
  item_id?: string | null;
  unit_id?: string | null;
  item_code: string;
  item_name: string;
  details?: string | null;
  unit?: string | null;
  quantity: number | string;
  rate: number | string;
  budget_qty?: number | string;
  purchase_qty?: number | string;
  stock_qty?: number | string;
  amount: number | string;
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
  purchaseOrderItem?: {
    uuid: string;
    item_code: string;
    quantity: number;
    rate: number;
  } | null;
}

export interface BackendGrn {
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
  purchase_order_id?: string | null;
  requisition_id?: string | null;
  subtotal: number | string;
  discount: number | string;
  grand_total: number | string;
  paid: number | string;
  due: number | string;
  note?: string | null;
  attachment?: string | null;
  already_billed: boolean;
  added_by_id?: number | null;
  approval_layer: ProcurementGrnApprovalLayer;
  status: ProcurementGrnStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  company?: { uuid: string; name: string } | null;
  supplier?: { uuid: string; supplierCode?: string; supplierName: string } | null;
  projectType?: { uuid: string; code?: string; name: string } | null;
  project?: { uuid: string; code?: string; name: string } | null;
  titleOfWork?: { uuid: string; code?: string; name: string } | null;
  task?: { uuid: string; taskName: string } | null;
  site?: { uuid: string; code?: string; name: string } | null;
  category?: { uuid: string; code?: string; name: string } | null;
  purchaseOrder?: { uuid: string; code: string; reference?: string } | null;
  requisition?: { uuid: string; code: string } | null;
  addedBy?: { id: number; name: string } | null;
  items?: BackendGrnItem[];
}

export interface GrnPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GrnListResult {
  data: BackendGrn[];
  meta: GrnPaginationMeta;
}

export interface QueryGrnParams {
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
  task_id?: string;
  added_by_id?: number;
  approval_layer?: ProcurementGrnApprovalLayer;
  status?: ProcurementGrnStatus;
  already_billed?: string | boolean;
  withDeleted?: string | boolean;
  deleted_only?: string | boolean;
}

export interface UpdateGrnItemPayload {
  item_id?: string;
  purchase_order_item_id?: string;
  item_code?: string;
  item_name?: string;
  details?: string;
  unit_id?: string;
  unit?: string;
  quantity?: number;
  rate?: number;
  budget_qty?: number;
  purchase_qty?: number;
  stock_qty?: number;
}

export interface UpdateGrnPayload {
  date?: string;
  code?: string;
  reference?: string;
  company_id?: string;
  supplier_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  purchase_order_id?: string;
  requisition_id?: string;
  discount?: number;
  paid?: number;
  note?: string;
  attachment?: string;
  already_billed?: boolean;
  approval_layer?: ProcurementGrnApprovalLayer;
  status?: ProcurementGrnStatus;
  items?: UpdateGrnItemPayload[];
}

export const procurementGrnApi = {
  /**
   * Load dropdown options for GRN listing, filtering, viewing and updating
   */
  async getDropdowns(
    projectId?: string,
    categoryId?: string,
  ): Promise<GrnDropdownsResult> {
    const params: Record<string, string> = {};
    if (projectId) params.project_id = projectId;
    if (categoryId) params.category_id = categoryId;

    const res = await api.get("/procurement/grn/dropdowns", { params });
    const data = res.data?.data || res.data || {};
    return {
      companies: Array.isArray(data.companies) ? data.companies : [],
      suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
      projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      titleOfWorks: Array.isArray(data.titleOfWorks) ? data.titleOfWorks : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      sites: Array.isArray(data.sites) ? data.sites : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      items: Array.isArray(data.items) ? data.items : [],
      units: Array.isArray(data.units) ? data.units : [],
      purchaseOrders: Array.isArray(data.purchaseOrders)
        ? data.purchaseOrders
        : [],
      requisitions: Array.isArray(data.requisitions) ? data.requisitions : [],
      users: Array.isArray(data.users) ? data.users : [],
    };
  },

  /**
   * List, search, filter, and paginate Goods Receipt Notes
   */
  async list(params?: QueryGrnParams): Promise<GrnListResult> {
    const cleanParams: Record<string, any> = { ...params };
    Object.keys(cleanParams).forEach((k) => {
      if (
        cleanParams[k] === undefined ||
        cleanParams[k] === null ||
        cleanParams[k] === ""
      ) {
        delete cleanParams[k];
      }
    });

    const res = await api.get("/procurement/grn", {
      params: cleanParams,
    });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data)
      ? rootData.data
      : Array.isArray(rootData)
        ? rootData
        : [];
    const meta: GrnPaginationMeta = rootData?.meta || {
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
   * Fetch single GRN details by uuid
   */
  async getById(uuid: string): Promise<BackendGrn> {
    const res = await api.get(`/procurement/grn/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing GRN; already-billed GRNs are locked
   */
  async update(uuid: string, payload: UpdateGrnPayload): Promise<BackendGrn> {
    const res = await api.patch(`/procurement/grn/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete an existing GRN; already-billed GRNs are locked
   */
  async delete(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/grn/${uuid}`);
    return res.data?.data || res.data;
  },
};
