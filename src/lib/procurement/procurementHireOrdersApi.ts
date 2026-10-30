/**
 * Procurement Hire Orders API Client
 *
 * Implements real backend API endpoints for:
 *   GET    /realbizpro/api/v1/procurement/hire-orders/dropdowns  (Dropdown options)
 *   GET    /realbizpro/api/v1/procurement/hire-orders/trash      (Deleted hire orders only)
 *   GET    /realbizpro/api/v1/procurement/hire-orders            (List & filter active hire orders)
 *   POST   /realbizpro/api/v1/procurement/hire-orders            (Create requisition-based or free-hire order)
 *   GET    /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Single hire order details)
 *   PATCH  /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Update hire order)
 *   DELETE /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Soft-delete hire order)
 *
 * Real API integration only - no mock data, no local storage fallback.
 */

import api from "@/lib/api";

// =============================================================================
// INTERFACES & ENUMS
// =============================================================================

export type HireOrderMode = "requisition_based" | "free_hire";
export type HireOrderStatus = "draft" | "active" | "closed" | "cancelled";

export interface BackendHireOrderItem {
  uuid?: string;
  hire_order_id?: string;
  equipment_id?: string | null;
  equipment?: {
    uuid: string;
    item_code?: string;
    name: string;
  } | null;
  requisition_item_id?: string | null;
  unit_id?: string | null;
  unitRelation?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  equipment_description: string;
  unit: string;
  quantity: number;
  charged_by: string; // hour, day, week, month, shift, fixed
  rate: number;
  tax_percent: number;
  vat_percent: number;
  tax_amount: number;
  vat_amount: number;
  amount: number;
}

export interface BackendHireOrder {
  uuid: string;
  id?: number;
  hire_no: string;
  hire_mode: HireOrderMode;
  requisition_id?: string | null;
  requisition?: {
    uuid: string;
    code?: string;
    status?: string;
  } | null;
  project_id: string;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  site_id?: string | null;
  site?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  vendor_id: string;
  vendor?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
  } | null;
  hire_from: string;
  hire_to?: string | null;
  shipping_cost: number;
  order_discount: number;
  subtotal: number;
  vat_total: number;
  ait_tds_total: number;
  grand_total: number;
  status: HireOrderStatus;
  notes?: string | null;
  added_by_id?: number | null;
  addedBy?: {
    id: number;
    name: string;
  } | null;
  items: BackendHireOrderItem[];
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHireOrderItemPayload {
  equipment_id?: string;
  requisition_item_id?: string;
  unit_id?: string;
  equipment_description: string;
  unit: string;
  quantity: number;
  charged_by?: string;
  rate: number;
  tax_percent?: number;
  vat_percent?: number;
}

export interface CreateHireOrderPayload {
  hire_no?: string;
  hire_mode: HireOrderMode;
  requisition_id?: string;
  project_id: string;
  site_id?: string;
  vendor_id: string;
  hire_from: string;
  hire_to?: string;
  shipping_cost?: number;
  order_discount?: number;
  status?: HireOrderStatus;
  notes?: string;
  items: CreateHireOrderItemPayload[];
}

export interface HireOrderDropdownProject {
  uuid: string;
  code?: string;
  name: string;
}

export interface HireOrderDropdownVendor {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface HireOrderDropdownSite {
  uuid: string;
  projectId?: string;
  code?: string;
  name: string;
  location?: string;
}

export interface HireOrderDropdownEquipment {
  uuid: string;
  item_code?: string;
  name: string;
  unit_id?: string;
  category_id?: string;
}

export interface HireOrderDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
}

export interface HireOrderDropdownRequisitionItem {
  uuid: string;
  item_id?: string;
  item_code?: string;
  item_name?: string;
  demand_qty?: number;
  open_qty?: number;
  unit?: string;
  unit_id?: string;
  rate?: number;
}

export interface HireOrderDropdownRequisition {
  uuid: string;
  code?: string;
  name?: string;
  status?: string;
  items?: HireOrderDropdownRequisitionItem[];
}

export interface HireOrderDropdownsResult {
  projects: HireOrderDropdownProject[];
  vendors: HireOrderDropdownVendor[];
  sites: HireOrderDropdownSite[];
  equipment: HireOrderDropdownEquipment[];
  units: HireOrderDropdownUnit[];
  approvedEquipmentRequisitions: HireOrderDropdownRequisition[];
  hireModes: HireOrderMode[];
  orderStatuses: HireOrderStatus[];
  chargedBy: string[];
  users: Array<{ id: number; name: string }>;
}

export interface QueryHireOrderParams {
  hire_no?: string;
  project_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface HireOrderPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HireOrderListResult {
  data: BackendHireOrder[];
  meta: HireOrderPaginationMeta;
}

// =============================================================================
// FINANCIAL CALCULATIONS HELPER
// =============================================================================

export function calculateOrderTotals(
  items: Array<{
    quantity: number;
    rate: number;
    tax_percent?: number;
    vat_percent?: number;
  }>,
  shippingCost: number = 0,
  orderDiscount: number = 0
) {
  let subtotal = 0;
  let vat_total = 0;
  let ait_tds_total = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const base = qty * rate;
    const taxP = Number(item.tax_percent) || 0;
    const vatP = Number(item.vat_percent) || 0;
    const taxAmt = (base * taxP) / 100;
    const vatAmt = (base * vatP) / 100;

    subtotal += base;
    vat_total += vatAmt;
    ait_tds_total += taxAmt;
  });

  const grand_total = Math.max(
    0,
    subtotal + vat_total - ait_tds_total - (Number(orderDiscount) || 0) + (Number(shippingCost) || 0)
  );

  return { subtotal, vat_total, ait_tds_total, grand_total };
}

// =============================================================================
// API CLIENT IMPLEMENTATION
// =============================================================================

export const procurementHireOrdersApi = {
  /**
   * GET /realbizpro/api/v1/procurement/hire-orders/dropdowns
   * Load real dropdown options for projects, vendors, requisitions, assets, units, statuses
   */
  async getDropdowns(projectId?: string): Promise<HireOrderDropdownsResult> {
    const qs = projectId ? `?project_id=${projectId}` : "";
    const res = await api.get(`/procurement/hire-orders/dropdowns${qs}`);
    const data = res.data?.data || res.data || {};

    return {
      projects: Array.isArray(data.projects) ? data.projects : [],
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      sites: Array.isArray(data.sites) ? data.sites : [],
      equipment: Array.isArray(data.equipment) ? data.equipment : Array.isArray(data.assets) ? data.assets : [],
      units: Array.isArray(data.units) ? data.units : [],
      approvedEquipmentRequisitions: Array.isArray(data.approvedEquipmentRequisitions)
        ? data.approvedEquipmentRequisitions
        : [],
      hireModes: Array.isArray(data.hireModes)
        ? data.hireModes
        : ["requisition_based", "free_hire"],
      orderStatuses: Array.isArray(data.orderStatuses)
        ? data.orderStatuses
        : Array.isArray(data.statuses)
          ? data.statuses
          : ["draft", "active", "closed", "cancelled"],
      chargedBy: Array.isArray(data.chargedBy)
        ? data.chargedBy
        : ["hour", "day", "week", "month", "shift", "fixed"],
      users: Array.isArray(data.users) ? data.users : [],
    };
  },

  /**
   * GET /realbizpro/api/v1/procurement/hire-orders
   * List and filter active hire orders
   */
  async list(params?: QueryHireOrderParams): Promise<HireOrderListResult> {
    const query = new URLSearchParams();
    if (params?.hire_no) query.append("hire_no", params.hire_no.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-orders${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireOrder[] = [];
    let meta: HireOrderPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/hire-orders/trash
   * Fetch soft-deleted hire orders
   */
  async getTrash(params?: QueryHireOrderParams): Promise<HireOrderListResult> {
    const query = new URLSearchParams();
    if (params?.hire_no) query.append("hire_no", params.hire_no.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/hire-orders/trash${qs ? `?${qs}` : ""}`;

    const res = await api.get(url);
    const body = res.data;

    let items: BackendHireOrder[] = [];
    let meta: HireOrderPaginationMeta = {
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
   * GET /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Fetch single hire order details for viewing or editing
   */
  async getById(uuid: string): Promise<BackendHireOrder> {
    const res = await api.get(`/procurement/hire-orders/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * POST /realbizpro/api/v1/procurement/hire-orders
   * Create requisition-based or free-hire order with equipment lines and calculated totals
   */
  async create(payload: CreateHireOrderPayload): Promise<BackendHireOrder> {
    const res = await api.post("/procurement/hire-orders", payload);
    return res.data?.data || res.data;
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Update an existing hire order
   */
  async update(uuid: string, payload: CreateHireOrderPayload): Promise<BackendHireOrder> {
    const res = await api.patch(`/procurement/hire-orders/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Soft-delete a hire order
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/procurement/hire-orders/${uuid}`);
    return res.data || { success: true };
  },
};
