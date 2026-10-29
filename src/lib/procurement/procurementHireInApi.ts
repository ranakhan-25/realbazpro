/**
 * Procurement Hire In API Client
 *
 * Implements endpoints for:
 *   GET    /realbizpro/api/v1/procurement/hire-ins            (List & filter active hire-in records)
 *   GET    /realbizpro/api/v1/procurement/hire-ins/trash      (List soft-deleted hire-in records)
 *   GET    /realbizpro/api/v1/procurement/hire-ins/{uuid}     (Single hire-in details)
 *   DELETE /realbizpro/api/v1/procurement/hire-ins/{uuid}     (Soft-delete hire-in)
 *   PATCH  /realbizpro/api/v1/procurement/hire-ins/{uuid}/restore (Restore soft-deleted hire-in)
 */

import api from "@/lib/api";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface BackendHireInItem {
  uuid: string;
  hire_in_id: string;
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

export interface BackendHireIn {
  uuid: string;
  id?: number;
  hire_in_no: string;
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
  received_date: string;
  status: string; // "received", "inspected", "active"
  notes?: string;
  received_by_id?: number;
  receivedBy?: {
    id: number;
    name: string;
  };
  items?: BackendHireInItem[];
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryHireInParams {
  number?: string;
  status?: string;
  project_id?: string;
  hire_order_id?: string;
  page?: number;
  limit?: number;
}

export interface HireInPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HireInListResult {
  data: BackendHireIn[];
  meta: HireInPaginationMeta;
}

// =============================================================================
// API CLIENT IMPLEMENTATION
// =============================================================================

export const procurementHireInApi = {
  /**
   * GET /realbizpro/api/v1/procurement/hire-ins
   * List and filter active hire-in records
   */
  async list(params?: QueryHireInParams): Promise<HireInListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-ins${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireIn[] = [];
    let meta: HireInPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/hire-ins/trash
   * Fetch soft-deleted hire-in records
   */
  async getTrash(params?: QueryHireInParams): Promise<HireInListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-ins/trash${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireIn[] = [];
    let meta: HireInPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/hire-ins/{uuid}
   * Fetch single hire-in record details with line items
   */
  async getById(uuid: string): Promise<BackendHireIn> {
    const res = await api.get(`/procurement/hire-ins/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/hire-ins/{uuid}
   * Soft-delete a hire-in record
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/hire-ins/${uuid}`);
    return res.data || { success: true };
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/hire-ins/{uuid}/restore
   * Restore a soft-deleted hire-in record from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.patch(`/procurement/hire-ins/${uuid}/restore`);
    return res.data || { success: true };
  },
};
