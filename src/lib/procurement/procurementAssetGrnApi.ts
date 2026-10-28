import api from "../api";

export enum ProcurementAssetGrnApprovalLayer {
  PENDING = "pending",
  ALL_APPROVALS_COMPLETED = "all_approvals_completed",
  RASEL_HOSAIN = "rasel_hosain",
  ADMIN = "admin",
}

export enum ProcurementAssetGrnStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface AssetGrnDropdownCompany {
  uuid: string;
  name: string;
}

export interface AssetGrnDropdownSupplier {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface AssetGrnDropdownProjectType {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetGrnDropdownProject {
  uuid: string;
  code?: string;
  name: string;
  projectType?: string;
}

export interface AssetGrnDropdownTitleOfWork {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetGrnDropdownTask {
  uuid: string;
  uid?: string | null;
  taskName: string;
}

export interface AssetGrnDropdownSite {
  uuid: string;
  projectId?: string;
  code?: string;
  name: string;
}

export interface AssetGrnDropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetGrnDropdownItem {
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

export interface AssetGrnDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetGrnDropdownUser {
  id: number | string;
  name: string;
}

export interface AssetGrnDropdownsResult {
  companies: AssetGrnDropdownCompany[];
  suppliers: AssetGrnDropdownSupplier[];
  projectTypes: AssetGrnDropdownProjectType[];
  projects: AssetGrnDropdownProject[];
  titleOfWorks: AssetGrnDropdownTitleOfWork[];
  tasks: AssetGrnDropdownTask[];
  sites: AssetGrnDropdownSite[];
  categories: AssetGrnDropdownCategory[];
  items: AssetGrnDropdownItem[];
  units: AssetGrnDropdownUnit[];
  users: AssetGrnDropdownUser[];
}

export interface BackendAssetGrnItem {
  id?: number | string;
  uuid?: string;
  asset_grn_id?: string;
  item_id?: string | null;
  unit_id?: string | null;
  item_code?: string;
  item_name?: string;
  details?: string | null;
  unit?: string | null;
  quantity: number | string;
  rate: number | string;
  amount?: number | string;
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

export interface BackendAssetGrn {
  id?: number;
  uuid: string;
  code: string;
  reference?: string | null;
  date: string;
  supplier_id: string;
  ledger_id?: string | null;
  ledger_name?: string | null;
  project_type_id?: string | null;
  project_id?: string | null;
  title_of_work_id?: string | null;
  task_id?: string | null;
  site_id?: string | null;
  category_id?: string | null;
  subtotal: number | string;
  discount: number | string;
  grand_total: number | string;
  paid: number | string;
  due: number | string;
  note?: string | null;
  attachment?: string | null;
  already_billed?: boolean;
  added_by_id?: number | null;
  approval_layer?: ProcurementAssetGrnApprovalLayer;
  status?: ProcurementAssetGrnStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
  } | null;
  projectType?: { uuid: string; code?: string; name: string } | null;
  project?: { uuid: string; code?: string; name: string } | null;
  titleOfWork?: { uuid: string; code?: string; name: string } | null;
  task?: { uuid: string; taskName: string } | null;
  site?: { uuid: string; code?: string; name: string } | null;
  category?: { uuid: string; code?: string; name: string } | null;
  addedBy?: { id: number; name: string } | null;
  items?: BackendAssetGrnItem[];
}

export interface AssetGrnPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssetGrnListResult {
  data: BackendAssetGrn[];
  meta: AssetGrnPaginationMeta;
}

export interface QueryAssetGrnParams {
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  supplier_id?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  ledger_id?: string;
  added_by_id?: number;
  approval_layer?: ProcurementAssetGrnApprovalLayer;
  status?: ProcurementAssetGrnStatus;
  withDeleted?: boolean | string;
}

export interface AssetGrnItemPayload {
  item_id?: string;
  item_code?: string;
  item_name?: string;
  details?: string;
  unit_id?: string;
  unit?: string;
  quantity: number;
  rate: number;
}

export interface CreateAssetGrnPayload {
  date: string;
  supplier_id: string;
  code?: string;
  reference?: string;
  ledger_id?: string;
  ledger_name?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  discount?: number;
  paid?: number;
  note?: string;
  attachment?: string;
  approval_layer?: ProcurementAssetGrnApprovalLayer;
  status?: ProcurementAssetGrnStatus;
  items: AssetGrnItemPayload[];
}

export interface UpdateAssetGrnPayload {
  date?: string;
  supplier_id?: string;
  code?: string;
  reference?: string;
  ledger_id?: string;
  ledger_name?: string;
  project_type_id?: string;
  project_id?: string;
  title_of_work_id?: string;
  task_id?: string;
  site_id?: string;
  category_id?: string;
  discount?: number;
  paid?: number;
  note?: string;
  attachment?: string;
  approval_layer?: ProcurementAssetGrnApprovalLayer;
  status?: ProcurementAssetGrnStatus;
  items?: AssetGrnItemPayload[];
}

function normalizeDropdowns(
  d: Record<string, unknown>,
): AssetGrnDropdownsResult {
  return {
    companies: Array.isArray(d?.companies) ? d.companies : [],
    suppliers: Array.isArray(d?.suppliers) ? d.suppliers : [],
    projectTypes: Array.isArray(d?.projectTypes) ? d.projectTypes : [],
    projects: Array.isArray(d?.projects) ? d.projects : [],
    titleOfWorks: Array.isArray(d?.titleOfWorks) ? d.titleOfWorks : [],
    tasks: Array.isArray(d?.tasks) ? d.tasks : [],
    sites: Array.isArray(d?.sites) ? d.sites : [],
    categories: Array.isArray(d?.categories)
      ? d.categories
      : Array.isArray(d?.assetCategories)
        ? d.assetCategories
        : [],
    items: Array.isArray(d?.items)
      ? d.items
      : Array.isArray(d?.assetItems)
        ? d.assetItems
        : [],
    units: Array.isArray(d?.units) ? d.units : [],
    users: Array.isArray(d?.users) ? d.users : [],
  };
}

export const procurementAssetGrnApi = {
  /**
   * Load dropdown data for Asset GRN form.
   * Calls /procurement/asset-grn/dropdowns. If backend encounters internal model error,
   * falls back to /procurement/asset-purchase-order/dropdowns to preserve live database options.
   */
  async getDropdowns(
    projectId?: string,
    categoryId?: string,
  ): Promise<AssetGrnDropdownsResult> {
    const params: Record<string, string> = {};
    if (projectId) params.project_id = projectId;
    if (categoryId) params.category_id = categoryId;

    try {
      const res = await api.get("/procurement/asset-grn/dropdowns", { params });
      const root = res.data?.data || res.data || {};
      return normalizeDropdowns(root);
    } catch {
      const fallbackRes = await api.get(
        "/procurement/asset-purchase-order/dropdowns",
        { params },
      );
      const root = fallbackRes.data?.data || fallbackRes.data || {};
      return normalizeDropdowns(root);
    }
  },

  /**
   * List and filter Asset GRNs
   */
  async list(params?: QueryAssetGrnParams): Promise<AssetGrnListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    Object.keys(cleanParams).forEach((k) => {
      if (
        cleanParams[k] === undefined ||
        cleanParams[k] === null ||
        cleanParams[k] === ""
      ) {
        delete cleanParams[k];
      }
    });

    const res = await api.get("/procurement/asset-grn", {
      params: cleanParams,
    });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data)
      ? rootData.data
      : Array.isArray(rootData)
        ? rootData
        : [];
    const meta: AssetGrnPaginationMeta = rootData?.meta || {
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
   * Fetch one Asset GRN with items and relations by uuid
   */
  async getById(uuid: string): Promise<BackendAssetGrn> {
    const res = await api.get(`/procurement/asset-grn/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create an Asset GRN
   */
  async create(payload: CreateAssetGrnPayload): Promise<BackendAssetGrn> {
    const res = await api.post("/procurement/asset-grn", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an Asset GRN
   */
  async update(
    uuid: string,
    payload: UpdateAssetGrnPayload,
  ): Promise<BackendAssetGrn> {
    const res = await api.patch(`/procurement/asset-grn/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete an Asset GRN
   */
  async delete(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/asset-grn/${uuid}`);
    return res.data?.data || res.data;
  },
};
