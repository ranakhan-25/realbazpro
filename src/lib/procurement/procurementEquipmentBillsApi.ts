/**
 * Procurement Equipment Bills API Client
 *
 * Implements real backend API endpoints for:
 *   GET    /realbizpro/api/v1/procurement/equipment-bills            (List & filter active bills)
 *   GET    /realbizpro/api/v1/procurement/equipment-bills/trash      (List soft-deleted bills)
 *   GET    /realbizpro/api/v1/procurement/equipment-bills/dropdowns  (Dropdown options)
 *   GET    /realbizpro/api/v1/procurement/equipment-bills/{uuid}     (Single bill details)
 *   DELETE /realbizpro/api/v1/procurement/equipment-bills/{uuid}     (Soft-delete bill)
 *   PATCH  /realbizpro/api/v1/procurement/equipment-bills/{uuid}/restore (Restore bill)
 *
 * No mock data, hardcoded records, or local-store fallbacks. Real API responses only.
 */

import api from "@/lib/api";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface BackendEquipmentBillItem {
  uuid: string;
  bill_id?: string;
  hire_order_item_id?: string;
  hireOrderItem?: {
    uuid: string;
    equipment_description?: string;
    unit?: string;
    charged_by?: string;
  };
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
  tax_percent?: number;
  vat_percent?: number;
  tax_amount?: number;
  vat_amount?: number;
}

export interface BackendEquipmentBill {
  uuid: string;
  id?: number;
  bill_no: string;
  hire_order_id: string;
  hireOrder?: {
    uuid: string;
    hire_no: string;
    status: string;
  };
  project_id: string;
  project?: {
    uuid: string;
    code?: string;
    name?: string;
  };
  vendor_id: string;
  vendor?: {
    uuid: string;
    supplierCode?: string;
    supplierName?: string;
  };
  period_from: string;
  period_to: string;
  subtotal: number;
  vat_total: number;
  ait_tds_total: number;
  discount: number;
  carriage: number;
  net_amount: number;
  status: string; // pending, approved, paid, partially_paid, cancelled
  notes?: string;
  added_by_id?: number;
  addedBy?: {
    id: number;
    name: string;
  };
  items?: BackendEquipmentBillItem[];
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentBillDropdownProject {
  uuid: string;
  code: string;
  name: string;
}

export interface EquipmentBillDropdownVendor {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface EquipmentBillDropdownSite {
  uuid: string;
  projectId: string;
  code: string;
  name: string;
  location?: string;
}

export interface EquipmentBillDropdownHireOrder {
  uuid: string;
  hire_no: string;
  project_id?: string;
  vendor_id?: string;
  hire_from?: string;
  hire_to?: string;
  status: string;
  project?: { uuid: string; name: string };
  vendor?: { uuid: string; supplierName: string };
}

export interface EquipmentBillDropdownsResult {
  projects: EquipmentBillDropdownProject[];
  vendors: EquipmentBillDropdownVendor[];
  sites: EquipmentBillDropdownSite[];
  eligibleHireOrders: EquipmentBillDropdownHireOrder[];
  billStatuses: string[];
  orderStatuses: string[];
  chargedBy: string[];
  users: Array<{ id: number; name: string }>;
}

export interface QueryEquipmentBillParams {
  number?: string;
  status?: string;
  project_id?: string;
  hire_order_id?: string;
  page?: number;
  limit?: number;
}

export interface EquipmentBillPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EquipmentBillListResult {
  data: BackendEquipmentBill[];
  meta: EquipmentBillPaginationMeta;
}

// =============================================================================
// API CLIENT IMPLEMENTATION (REAL BACKEND CALLS ONLY)
// =============================================================================

export const procurementEquipmentBillsApi = {
  /**
   * GET /realbizpro/api/v1/procurement/equipment-bills/dropdowns
   * Load dropdowns for projects, vendors, eligible hire orders, and statuses
   */
  async getDropdowns(): Promise<EquipmentBillDropdownsResult> {
    const res = await api.get("/procurement/equipment-bills/dropdowns");
    const data = res.data?.data || res.data || {};

    return {
      projects: Array.isArray(data.projects) ? data.projects : [],
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      sites: Array.isArray(data.sites) ? data.sites : [],
      eligibleHireOrders: Array.isArray(data.eligibleHireOrders) ? data.eligibleHireOrders : [],
      billStatuses: Array.isArray(data.billStatuses)
        ? data.billStatuses
        : ["pending", "approved", "paid", "partially_paid", "cancelled"],
      orderStatuses: Array.isArray(data.orderStatuses) ? data.orderStatuses : ["active", "closed"],
      chargedBy: Array.isArray(data.chargedBy) ? data.chargedBy : ["hour", "day", "week", "month", "shift", "fixed"],
      users: Array.isArray(data.users) ? data.users : [],
    };
  },

  /**
   * GET /realbizpro/api/v1/procurement/equipment-bills
   * List and filter active equipment bills
   */
  async list(params?: QueryEquipmentBillParams): Promise<EquipmentBillListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/equipment-bills${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendEquipmentBill[] = [];
    let meta: EquipmentBillPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/equipment-bills/trash
   * Fetch soft-deleted equipment bills
   */
  async getTrash(params?: QueryEquipmentBillParams): Promise<EquipmentBillListResult> {
    const query = new URLSearchParams();
    if (params?.number) query.append("number", params.number.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.hire_order_id) query.append("hire_order_id", params.hire_order_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/equipment-bills/trash${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendEquipmentBill[] = [];
    let meta: EquipmentBillPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/equipment-bills/{uuid}
   * Fetch single equipment bill details with line items
   */
  async getById(uuid: string): Promise<BackendEquipmentBill> {
    const res = await api.get(`/procurement/equipment-bills/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/equipment-bills/{uuid}
   * Soft-delete an equipment bill (moves to trash)
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/equipment-bills/${uuid}`);
    return res.data || { success: true };
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/equipment-bills/{uuid}/restore
   * Restore a soft-deleted equipment bill from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.patch(`/procurement/equipment-bills/${uuid}/restore`);
    return res.data || { success: true };
  },
};
