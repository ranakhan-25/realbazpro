import api from "../api";

// =============================================================================
// SWAGGER TYPES & SCHEMAS FOR PROCUREMENT MATERIAL ISSUES
// Base Path: /realbizpro/api/v1/procurement/material-issues
// =============================================================================

export interface MaterialIssueGrnItem {
  id?: string | number;
  uuid: string;
  grn_id?: string;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number | string;
  rate?: number | string;
  amount?: number | string;
  available_qty: number;
}

export interface MaterialIssueDropdownGrn {
  id?: string | number;
  uuid: string;
  code: string;
  reference?: string | null;
  date: string;
  supplier_id?: string | null;
  project_id?: string | null;
  status?: string;
  supplier?: {
    uuid?: string;
    supplierName?: string;
    name?: string;
  } | null;
  project?: {
    uuid?: string;
    name?: string;
    code?: string;
  } | null;
  items: MaterialIssueGrnItem[];
}

export interface MaterialIssueDropdownUser {
  id: number;
  name: string;
  email?: string;
}

export interface MaterialIssueDropdownsResult {
  grns: MaterialIssueDropdownGrn[];
  users: MaterialIssueDropdownUser[];
  statuses: string[];
}

export interface MaterialIssueItemPayload {
  grn_item_id: string; // UUID of the GRN line item
  quantity: number; // Must be > 0 and <= available_qty
}

export interface CreateMaterialIssuePayload {
  grn_id: string; // UUID of the approved GRN
  date: string; // ISO 8601 string
  purpose: string; // Purpose of the issue
  issued_by_id?: number | null; // User ID
  notes?: string;
  items: MaterialIssueItemPayload[];
}

export interface BackendMaterialIssueItem {
  uuid?: string;
  id?: number | string;
  grn_item_id: string;
  quantity: number;
  grnItem?: {
    uuid: string;
    item_code: string;
    item_name: string;
    unit: string;
    rate?: number | string;
  } | null;
}

export interface BackendMaterialIssue {
  uuid: string;
  id?: number;
  issue_no?: string;
  grn_id: string;
  date: string;
  purpose: string;
  issued_by_id?: number | null;
  notes?: string | null;
  status: "issued" | "cancelled" | "active" | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  grn?: {
    uuid: string;
    code: string;
    reference?: string | null;
    supplier?: {
      supplierName?: string;
      name?: string;
    } | null;
    project?: {
      name?: string;
      code?: string;
    } | null;
  } | null;
  issuedBy?: {
    id: number;
    name: string;
  } | null;
  items?: BackendMaterialIssueItem[];
}

export interface QueryMaterialIssueParams {
  grn_no?: string;
  status?: string;
  sort_by_date?: "ASC" | "DESC" | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface MaterialIssuePaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MaterialIssueListResult {
  data: BackendMaterialIssue[];
  meta: MaterialIssuePaginationMeta;
}

// Local client store to guarantee interactive CRUD testing
const clientMaterialIssueStore: BackendMaterialIssue[] = [];

// =============================================================================
// API SERVICE METHODS
// =============================================================================

export const procurementMaterialIssuesApi = {
  /**
   * GET /realbizpro/api/v1/procurement/material-issues/dropdowns
   * Load fully approved GRNs with remaining issuable quantities and user options
   */
  async getDropdowns(): Promise<MaterialIssueDropdownsResult> {
    try {
      const res = await api.get("/procurement/material-issues/dropdowns");
      const data = res.data?.data || res.data || {};

      const grns: MaterialIssueDropdownGrn[] = Array.isArray(data.grns)
        ? data.grns
        : Array.isArray(data.approvedGRNs)
          ? data.approvedGRNs
          : [];

      const users: MaterialIssueDropdownUser[] = Array.isArray(data.users)
        ? data.users
        : [];

      const statuses: string[] = Array.isArray(data.statuses)
        ? data.statuses
        : ["issued", "cancelled"];

      return { grns, users, statuses };
    } catch (err) {
      console.warn("Error fetching material-issues dropdowns:", err);
      return { grns: [], users: [], statuses: ["issued", "cancelled"] };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/material-issues
   * List and filter active material issues
   */
  async list(params?: QueryMaterialIssueParams): Promise<MaterialIssueListResult> {
    const query = new URLSearchParams();
    if (params?.grn_no) query.append("grn_no", params.grn_no.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by_date) query.append("sort_by_date", params.sort_by_date);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/material-issues${qs ? `?${qs}` : ""}`;

    try {
      const res = await api.get(url);
      const body = res.data;

      let items: BackendMaterialIssue[] = [];
      let meta: MaterialIssuePaginationMeta = {
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
          const total = Number(body.data.total ?? body.data.count) || items.length;
          meta = {
            total,
            page: Number(body.data.page) || params?.page || 1,
            limit: Number(body.data.limit) || params?.limit || 10,
            totalPages: Math.max(1, Math.ceil(total / (params?.limit || 10))),
          };
        } else if (Array.isArray(body)) {
          items = body;
          meta.total = body.length;
        }
      }

      // Merge locally created items if not yet returned by backend
      clientMaterialIssueStore.forEach((stored) => {
        if (!stored.deletedAt && !items.some((i) => i.uuid === stored.uuid)) {
          items.unshift(stored);
        }
      });

      return { data: items, meta };
    } catch (err) {
      console.warn("Backend /procurement/material-issues list error, using local fallback:", err);

      let filtered = clientMaterialIssueStore.filter((m) => !m.deletedAt);
      if (params?.grn_no) {
        const q = params.grn_no.toLowerCase();
        filtered = filtered.filter((m) =>
          m.grn?.code?.toLowerCase().includes(q)
        );
      }
      if (params?.status) {
        filtered = filtered.filter((m) => m.status === params.status);
      }
      if (params?.date_from) {
        filtered = filtered.filter((m) => m.date >= (params.date_from || ""));
      }
      if (params?.date_to) {
        filtered = filtered.filter((m) => m.date <= (params.date_to || ""));
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return { data, meta: { total, page, limit, totalPages } };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/material-issues/trash
   * Fetch soft-deleted material issues
   */
  async getTrash(params?: QueryMaterialIssueParams): Promise<MaterialIssueListResult> {
    const query = new URLSearchParams();
    if (params?.grn_no) query.append("grn_no", params.grn_no.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by_date) query.append("sort_by_date", params.sort_by_date);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/material-issues/trash${qs ? `?${qs}` : ""}`;

    try {
      const res = await api.get(url);
      const body = res.data;

      let items: BackendMaterialIssue[] = [];
      let meta: MaterialIssuePaginationMeta = {
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
          const total = Number(body.data.total ?? body.data.count) || items.length;
          meta = {
            total,
            page: Number(body.data.page) || params?.page || 1,
            limit: Number(body.data.limit) || params?.limit || 10,
            totalPages: Math.max(1, Math.ceil(total / (params?.limit || 10))),
          };
        } else if (Array.isArray(body)) {
          items = body;
          meta.total = body.length;
        }
      }

      // Merge local deleted items
      clientMaterialIssueStore.forEach((stored) => {
        if (stored.deletedAt && !items.some((i) => i.uuid === stored.uuid)) {
          items.unshift(stored);
        }
      });

      return { data: items, meta };
    } catch (err) {
      console.warn("Backend /procurement/material-issues/trash error, using local fallback:", err);

      let filtered = clientMaterialIssueStore.filter((m) => Boolean(m.deletedAt));
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return { data, meta: { total, page, limit, totalPages } };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/material-issues/{uuid}
   * Fetch a single material issue record details
   */
  async getById(uuid: string): Promise<BackendMaterialIssue> {
    try {
      const res = await api.get(`/procurement/material-issues/${uuid}`);
      return res.data?.data || res.data;
    } catch (err) {
      const local = clientMaterialIssueStore.find((m) => m.uuid === uuid);
      if (local) return local;
      throw err;
    }
  },

  /**
   * POST /realbizpro/api/v1/procurement/material-issues
   * Issue GRN materials (validates available quantity and records issuer)
   */
  async create(payload: CreateMaterialIssuePayload): Promise<BackendMaterialIssue> {
    const res = await api.post("/procurement/material-issues", payload);
    const created = res.data?.data || res.data;
    if (created && created.uuid) {
      clientMaterialIssueStore.unshift(created);
    }
    return created;
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/material-issues/{uuid}/cancel
   * Cancel a material issue
   */
  async cancel(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.patch(`/procurement/material-issues/${uuid}/cancel`);
    const local = clientMaterialIssueStore.find((m) => m.uuid === uuid);
    if (local) {
      local.status = "cancelled";
    }
    return res.data || { success: true };
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/material-issues/{uuid}
   * Soft-delete a material issue
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/material-issues/${uuid}`);
    const local = clientMaterialIssueStore.find((m) => m.uuid === uuid);
    if (local) {
      local.deletedAt = new Date().toISOString();
    }
    return res.data || { success: true };
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/material-issues/{uuid}/restore
   * Restore a soft-deleted material issue from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.patch(`/procurement/material-issues/${uuid}/restore`);
      const local = clientMaterialIssueStore.find((m) => m.uuid === uuid);
      if (local) {
        local.deletedAt = null;
      }
      return res.data || { success: true };
    } catch (err: unknown) {
      const is404 =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 404;

      if (is404) {
        throw new Error(
          "Backend endpoint PATCH /procurement/material-issues/{uuid}/restore is not implemented on server yet."
        );
      }
      throw err;
    }
  },
};
