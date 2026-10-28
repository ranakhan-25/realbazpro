/**
 * Procurement Hire Out API Client
 *
 * Implements endpoints for:
 *   GET    /realbizpro/api/v1/procurement/hire-outs            (List & filter active hire-out records)
 *   GET    /realbizpro/api/v1/procurement/hire-outs/trash      (List soft-deleted hire-out records)
 *   GET    /realbizpro/api/v1/procurement/hire-outs/{uuid}     (Single hire-out details)
 *   DELETE /realbizpro/api/v1/procurement/hire-outs/{uuid}     (Soft-delete hire-out)
 *   PATCH  /realbizpro/api/v1/procurement/hire-outs/{uuid}/restore (Restore soft-deleted hire-out)
 *
 * Real API client - No mock data, no local storage fallback.
 */

import api from "@/lib/api";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface BackendHireOutItem {
  uuid: string;
  hire_out_id: string;
  hire_order_item_id: string;
  hireOrderItem?: {
    uuid: string;
    equipment_description?: string;
    unit?: string;
    charged_by?: string;
    rate?: number;
    amount?: number;
  };
  quantity: number;
  condition: string; // e.g., "good", "fair", "damaged"
  remarks?: string;
}

export interface BackendHireOut {
  uuid: string;
  id?: number;
  hire_out_no: string;
  hire_order_id: string;
  hireOrder?: {
    uuid: string;
    hire_no: string;
    hire_mode?: string;
    project_id?: string;
    project?: {
      uuid: string;
      code?: string;
      name: string;
    };
    vendor_id?: string;
    vendor?: {
      uuid: string;
      supplierCode?: string;
      supplierName: string;
    };
  };
  return_date: string;
  status: string; // "returned", "inspected", "completed", "pending"
  notes?: string;
  returned_by_id?: number;
  returnedBy?: {
    id: number;
    name: string;
  };
  items?: BackendHireOutItem[];
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryHireOutParams {
  number?: string;
  status?: string;
  project_id?: string;
  hire_order_id?: string;
  page?: number;
  limit?: number;
}

export interface HireOutPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HireOutListResult {
  data: BackendHireOut[];
  meta: HireOutPaginationMeta;
}

// =============================================================================
// API CLIENT IMPLEMENTATION
// =============================================================================

export const procurementHireOutApi = {
  /**
   * GET /realbizpro/api/v1/procurement/hire-outs
   * List and filter active hire-out records
   */
  async list(params?: QueryHireOutParams): Promise<HireOutListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-outs${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireOut[] = [];
    let meta: HireOutPaginationMeta = {
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
        } else if (body.total !== undefined) {
          meta = {
            total: Number(body.total) || items.length,
            page: Number(body.page) || 1,
            limit: Number(body.limit) || 10,
            totalPages: Number(body.totalPages) || 1,
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

    return { data: items, meta };
  },

  /**
   * GET /realbizpro/api/v1/procurement/hire-outs/trash
   * Fetch soft-deleted hire-out records
   */
  async getTrash(params?: QueryHireOutParams): Promise<HireOutListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-outs/trash${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireOut[] = [];
    let meta: HireOutPaginationMeta = {
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
        } else if (body.total !== undefined) {
          meta = {
            total: Number(body.total) || items.length,
            page: Number(body.page) || 1,
            limit: Number(body.limit) || 10,
            totalPages: Number(body.totalPages) || 1,
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

    return { data: items, meta };
  },

  /**
   * GET /realbizpro/api/v1/procurement/hire-outs/{uuid}
   * Fetch single hire-out record details with returned line items
   */
  async getById(uuid: string): Promise<BackendHireOut> {
    const res = await api.get(`/procurement/hire-outs/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/hire-outs/{uuid}
   * Soft-delete a hire-out record
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/hire-outs/${uuid}`);
    return res.data || { success: true };
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/hire-outs/{uuid}/restore
   * Restore a soft-deleted hire-out record from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.patch(`/procurement/hire-outs/${uuid}/restore`);
    return res.data || { success: true };
  },
};
