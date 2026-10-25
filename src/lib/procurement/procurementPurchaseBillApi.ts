import api from "../api";

// =============================================================================
// SWAGGER TYPES & SCHEMAS FOR PURCHASE BILL
// Base Path: /realbizpro/api/v1/procurement/purchase-bill
// =============================================================================

export interface PurchaseBillDropdownCompany {
  uuid: string;
  name: string;
}

export interface PurchaseBillDropdownSupplier {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface PurchaseBillDropdownProjectType {
  uuid: string;
  code?: string;
  name: string;
}

export interface PurchaseBillDropdownProject {
  uuid: string;
  code?: string;
  name: string;
  projectType?: string;
}

export interface PurchaseBillDropdownsResult {
  companies: PurchaseBillDropdownCompany[];
  suppliers: PurchaseBillDropdownSupplier[];
  projectTypes: PurchaseBillDropdownProjectType[];
  projects: PurchaseBillDropdownProject[];
}

export interface PendingGrnLineItem {
  uuid?: string;
  item_code: string;
  item_name: string;
  unit?: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PendingGrnItem {
  uuid: string;
  id?: number | string;
  code: string;
  date: string;
  reference?: string | null;
  supplier_id: string;
  project_id?: string | null;
  project_type_id?: string | null;
  subtotal: number;
  grand_total: number;
  paid?: number;
  due?: number;
  already_billed?: boolean;
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
  } | null;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  items?: PendingGrnLineItem[];
}

export interface CreatePurchaseBillPayload {
  date: string; // ISO 8601 string
  supplier_id: string; // UUID (required)
  grn_ids: string[]; // UUID[] (required)
  company_id?: string;
  project_type_id?: string;
  project_id?: string;
  code?: string;
  discount?: number;
  paid?: number;
  note?: string;
  attachment?: string;
}

export interface UpdatePurchaseBillPayload {
  date: string;
  supplier_id: string;
  grn_ids: string[];
  company_id?: string;
  project_type_id?: string;
  project_id?: string;
  code?: string;
  discount?: number;
  paid?: number;
  note?: string;
  attachment?: string;
}

export interface BackendPurchaseBillItem {
  uuid?: string;
  id?: number | string;
  item_code: string;
  item_name: string;
  unit?: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BackendPurchaseBill {
  uuid: string;
  id?: number;
  code: string;
  date: string;
  supplier_id: string;
  project_id?: string | null;
  project_type_id?: string | null;
  company_id?: string | null;
  subtotal: number | string;
  discount: number | string;
  grand_total: number | string;
  paid: number | string;
  due: number | string;
  note?: string | null;
  attachment?: string | null;
  approval_layer?: string | null;
  approvalSteps?: string[];
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
  } | null;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  projectType?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  company?: {
    uuid: string;
    name: string;
  } | null;
  addedBy?: {
    id: number;
    name: string;
  } | null;
  grns?: Array<{
    uuid: string;
    code: string;
  }>;
  items?: BackendPurchaseBillItem[];
}

export interface PurchaseBillPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseBillListResult {
  data: BackendPurchaseBill[];
  meta: PurchaseBillPaginationMeta;
}

export interface QueryPurchaseBillParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  supplier_id?: string;
}

// =============================================================================
// API SERVICE METHODS
// =============================================================================

export const procurementPurchaseBillApi = {
  /**
   * GET /procurement/purchase-bill
   * Query purchase bills with pagination and filters
   */
  async list(
    params?: QueryPurchaseBillParams,
  ): Promise<PurchaseBillListResult> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.supplier_id) query.append("supplier_id", params.supplier_id);

    const queryString = query.toString();
    const url = `/procurement/purchase-bill${queryString ? `?${queryString}` : ""}`;
    const res = await api.get(url);
    const body = res.data;

    let items: BackendPurchaseBill[] = [];
    let meta: PurchaseBillPaginationMeta = {
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
        }
      } else if (body.data && Array.isArray(body.data.data)) {
        items = body.data.data;
        const total =
          Number(body.data.total ?? body.data.count) || items.length;
        meta = {
          total,
          page: Number(body.data.page) || params?.page || 1,
          limit: Number(body.data.limit) || params?.limit || 10,
          totalPages: Math.max(1, Math.ceil(total / (params?.limit || 10))),
        };
      }
    }

    return { data: items, meta };
  },

  /**
   * GET /procurement/purchase-bill/dropdowns
   * Load projects, project types, suppliers, companies
   */
  async getDropdowns(): Promise<PurchaseBillDropdownsResult> {
    const res = await api.get("/procurement/purchase-bill/dropdowns");
    const data = res.data?.data || res.data || {};
    return {
      companies: Array.isArray(data.companies) ? data.companies : [],
      suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
      projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
    };
  },

  /**
   * GET /procurement/purchase-bill/pending-grns
   * Fetch eligible unbilled GRNs. If backend throws 500 (e.g. uninitialized model),
   * falls back to querying /procurement/grn to return genuine unbilled GRNs.
   */
  async getPendingGrns(params?: {
    project_id?: string;
    supplier_id?: string;
  }): Promise<PendingGrnItem[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.supplier_id) query.append("supplier_id", params.supplier_id);

    const qs = query.toString();
    try {
      const res = await api.get(
        `/procurement/purchase-bill/pending-grns${qs ? `?${qs}` : ""}`,
      );
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn(
        "Direct /purchase-bill/pending-grns endpoint failed, querying unbilled GRNs via fallback:",
        err,
      );
    }

    // Graceful fallback to verified GRN list
    try {
      const grnRes = await api.get("/procurement/grn?limit=100");
      const listData = grnRes.data?.data?.data || grnRes.data?.data || [];
      if (Array.isArray(listData)) {
        const unbilled = listData.filter(
          (g: Record<string, unknown>) => !g.already_billed,
        );
        return unbilled.map((g: Record<string, unknown>) => ({
          uuid: String(g.uuid),
          id: g.id as number | string | undefined,
          code: String(g.code || ""),
          date: String(g.date || ""),
          reference: (g.reference as string) || null,
          supplier_id: String(g.supplier_id || ""),
          project_id: (g.project_id as string) || null,
          project_type_id: (g.project_type_id as string) || null,
          subtotal: Number(g.subtotal) || 0,
          grand_total: Number(g.grand_total) || 0,
          paid: Number(g.paid) || 0,
          due: Number(g.due) || 0,
          already_billed: Boolean(g.already_billed),
          supplier: g.supplier as PendingGrnItem["supplier"],
          project: g.project as PendingGrnItem["project"],
          items: Array.isArray(g.items)
            ? (g.items as Array<Record<string, unknown>>).map((i) => ({
                uuid: (i.uuid as string) || undefined,
                item_code: String(i.item_code || ""),
                item_name: String(i.item_name || ""),
                unit: (i.unit as string) || null,
                quantity: Number(i.quantity) || 0,
                rate: Number(i.rate) || 0,
                amount: Number(i.amount) || 0,
              }))
            : [],
        }));
      }
    } catch {
      // Fallback exhausted
    }

    return [];
  },

  /**
   * GET /procurement/purchase-bill/{uuid}
   * Fetch complete purchase bill record
   */
  async getById(uuid: string): Promise<BackendPurchaseBill> {
    const res = await api.get(`/procurement/purchase-bill/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * POST /procurement/purchase-bill
   * Create a purchase bill/invoice
   */
  async create(
    payload: CreatePurchaseBillPayload,
  ): Promise<BackendPurchaseBill> {
    const res = await api.post("/procurement/purchase-bill", payload);
    return res.data?.data || res.data;
  },

  /**
   * PATCH /procurement/purchase-bill/{uuid}
   * Update an existing purchase bill/invoice
   */
  async update(
    uuid: string,
    payload: UpdatePurchaseBillPayload,
  ): Promise<BackendPurchaseBill> {
    const res = await api.patch(`/procurement/purchase-bill/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * DELETE /procurement/purchase-bill/{uuid}
   * Soft-delete a purchase bill
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/purchase-bill/${uuid}`);
    return res.data;
  },
};
