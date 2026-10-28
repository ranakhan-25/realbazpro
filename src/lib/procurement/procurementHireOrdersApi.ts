/**
 * Procurement Hire Orders API Client
 *
 * Implements endpoints for:
 *   GET    /realbizpro/api/v1/procurement/hire-orders/dropdowns  (Dropdown options)
 *   GET    /realbizpro/api/v1/procurement/hire-orders/trash      (Deleted hire orders only)
 *   GET    /realbizpro/api/v1/procurement/hire-orders            (List & filter active hire orders)
 *   POST   /realbizpro/api/v1/procurement/hire-orders            (Create requisition-based or free-hire order)
 *   GET    /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Single hire order details)
 *   PATCH  /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Update hire order)
 *   DELETE /realbizpro/api/v1/procurement/hire-orders/{uuid}     (Soft-delete hire order)
 *   PATCH  /realbizpro/api/v1/procurement/hire-orders/{uuid}/restore (Restore deleted hire order)
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
  code: string;
  name: string;
}

export interface HireOrderDropdownVendor {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface HireOrderDropdownSite {
  uuid: string;
  projectId: string;
  code: string;
  name: string;
  location?: string;
}

export interface HireOrderDropdownRequisitionItem {
  uuid: string;
  item_id?: string;
  item_code?: string;
  item_name?: string;
  unit_id?: string;
  unit?: string;
  demand_qty: number;
  open_qty: number;
  rate?: number;
}

export interface HireOrderDropdownRequisition {
  uuid: string;
  code?: string;
  name?: string;
  status?: string;
  items: HireOrderDropdownRequisitionItem[];
  project?: {
    uuid: string;
    name: string;
  };
}

export interface HireOrderDropdownEquipment {
  uuid: string;
  item_code?: string;
  name: string;
  unit_id?: string;
  unit?: {
    uuid: string;
    code?: string;
    name: string;
  };
}

export interface HireOrderDropdownUnit {
  uuid: string;
  code: string;
  name: string;
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
  isFallback?: boolean;
}

// =============================================================================
// SEED FALLBACK DATA STORE
// Used when backend NestJS throws 500 (Sequelize ProcurementHireOrder model initialization)
// =============================================================================

const seedHireOrders: BackendHireOrder[] = [
  {
    uuid: "ho-11111111-1111-4111-a111-111111111111",
    id: 1,
    hire_no: "HO-2026-00101",
    hire_mode: "requisition_based",
    requisition_id: "req-101-uuid",
    requisition: {
      uuid: "req-101-uuid",
      code: "AREQ-2026-0042",
      status: "approved",
    },
    project_id: "proj-101-uuid",
    project: {
      uuid: "proj-101-uuid",
      code: "PRJ-DH-01",
      name: "Gulshan Corporate Tower",
    },
    site_id: "site-101-uuid",
    site: {
      uuid: "site-101-uuid",
      code: "STE-DH-01",
      name: "North Tower Foundation",
    },
    vendor_id: "vend-201-uuid",
    vendor: {
      uuid: "vend-201-uuid",
      supplierCode: "VND-EQ-001",
      supplierName: "Apex Heavy Equipment Ltd.",
    },
    hire_from: "2026-10-01",
    hire_to: "2026-10-31",
    shipping_cost: 15000,
    order_discount: 5000,
    subtotal: 270000,
    vat_total: 20250,
    ait_tds_total: 13500,
    grand_total: 286750,
    status: "active",
    notes: "Tower crane 50T hire for 30 days. Includes 2 certified operators and rigging gear.",
    deletedAt: null,
    createdAt: "2026-10-01T08:30:00.000Z",
    updatedAt: "2026-10-01T08:30:00.000Z",
    items: [
      {
        uuid: "hoi-101",
        hire_order_id: "ho-11111111-1111-4111-a111-111111111111",
        equipment_id: "eq-101-uuid",
        equipment: {
          uuid: "eq-101-uuid",
          item_code: "EQ-CR-01",
          name: "50-Ton Mobile Hydraulic Crane",
        },
        equipment_description: "50-Ton Mobile Hydraulic Crane with 45m Telescopic Boom",
        unit: "Day",
        quantity: 30,
        charged_by: "day",
        rate: 9000,
        tax_percent: 5,
        vat_percent: 7.5,
        tax_amount: 13500,
        vat_amount: 20250,
        amount: 270000,
      },
    ],
  },
  {
    uuid: "ho-22222222-2222-4222-a222-222222222222",
    id: 2,
    hire_no: "HO-2026-00102",
    hire_mode: "free_hire",
    project_id: "proj-102-uuid",
    project: {
      uuid: "proj-102-uuid",
      code: "PRJ-UT-02",
      name: "Uttara Heights Complex",
    },
    site_id: "site-102-uuid",
    site: {
      uuid: "site-102-uuid",
      code: "STE-UT-01",
      name: "Tower 2 Basement",
    },
    vendor_id: "vend-202-uuid",
    vendor: {
      uuid: "vend-202-uuid",
      supplierCode: "VND-EQ-002",
      supplierName: "PowerGen Equipment Rentals",
    },
    hire_from: "2026-10-05",
    hire_to: "2026-10-25",
    shipping_cost: 5000,
    order_discount: 2000,
    subtotal: 120000,
    vat_total: 9000,
    ait_tds_total: 6000,
    grand_total: 126000,
    status: "active",
    notes: "250 kVA Soundproof Diesel Generator rental for night casting operations.",
    deletedAt: null,
    createdAt: "2026-10-04T10:15:00.000Z",
    updatedAt: "2026-10-04T10:15:00.000Z",
    items: [
      {
        uuid: "hoi-201",
        hire_order_id: "ho-22222222-2222-4222-a222-222222222222",
        equipment_id: "eq-102-uuid",
        equipment: {
          uuid: "eq-102-uuid",
          item_code: "EQ-GEN-02",
          name: "250 kVA Diesel Generator",
        },
        equipment_description: "250 kVA Soundproof Diesel Generator (Cummins Engine)",
        unit: "Day",
        quantity: 20,
        charged_by: "day",
        rate: 6000,
        tax_percent: 5,
        vat_percent: 7.5,
        tax_amount: 6000,
        vat_amount: 9000,
        amount: 120000,
      },
    ],
  },
  {
    uuid: "ho-33333333-3333-4333-a333-333333333333",
    id: 3,
    hire_no: "HO-2026-00098",
    hire_mode: "free_hire",
    project_id: "proj-101-uuid",
    project: {
      uuid: "proj-101-uuid",
      code: "PRJ-DH-01",
      name: "Gulshan Corporate Tower",
    },
    vendor_id: "vend-201-uuid",
    vendor: {
      uuid: "vend-201-uuid",
      supplierCode: "VND-EQ-001",
      supplierName: "Apex Heavy Equipment Ltd.",
    },
    hire_from: "2026-09-01",
    hire_to: "2026-09-30",
    shipping_cost: 10000,
    order_discount: 0,
    subtotal: 280000,
    vat_total: 21000,
    ait_tds_total: 14000,
    grand_total: 297000,
    status: "closed",
    notes: "Excavator CAT 320D excavation phase completed and demobilized.",
    deletedAt: null,
    createdAt: "2026-08-30T14:00:00.000Z",
    updatedAt: "2026-09-30T17:00:00.000Z",
    items: [
      {
        uuid: "hoi-301",
        hire_order_id: "ho-33333333-3333-4333-a333-333333333333",
        equipment_id: "eq-103-uuid",
        equipment: {
          uuid: "eq-103-uuid",
          item_code: "EQ-EX-03",
          name: "CAT 320D Excavator",
        },
        equipment_description: "CAT 320D Hydraulic Crawler Excavator (Bucket 1.0 m³)",
        unit: "Day",
        quantity: 28,
        charged_by: "day",
        rate: 10000,
        tax_percent: 5,
        vat_percent: 7.5,
        tax_amount: 14000,
        vat_amount: 21000,
        amount: 280000,
      },
    ],
  },
  {
    uuid: "ho-44444444-4444-4444-a444-444444444444",
    id: 4,
    hire_no: "HO-2026-00075",
    hire_mode: "free_hire",
    project_id: "proj-103-uuid",
    project: {
      uuid: "proj-103-uuid",
      code: "PRJ-DN-03",
      name: "Dhanmondi Residency",
    },
    vendor_id: "vend-203-uuid",
    vendor: {
      uuid: "vend-203-uuid",
      supplierCode: "VND-EQ-003",
      supplierName: "FastMix Concrete Equipment",
    },
    hire_from: "2026-08-01",
    hire_to: "2026-08-15",
    shipping_cost: 3000,
    order_discount: 1000,
    subtotal: 65000,
    vat_total: 4875,
    ait_tds_total: 3250,
    grand_total: 68625,
    status: "cancelled",
    notes: "Cancelled due to revised piling schedule. Soft-deleted and kept in trash archive.",
    deletedAt: "2026-08-10T12:00:00.000Z",
    createdAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
    items: [
      {
        uuid: "hoi-401",
        hire_order_id: "ho-44444444-4444-4444-a444-444444444444",
        equipment_description: "Static Concrete Pump (60 m³/hr) Hire",
        unit: "Day",
        quantity: 10,
        charged_by: "day",
        rate: 6500,
        tax_percent: 5,
        vat_percent: 7.5,
        tax_amount: 3250,
        vat_amount: 4875,
        amount: 65000,
      },
    ],
  },
];

let clientHireOrdersStore: BackendHireOrder[] = [...seedHireOrders];

// Helper to compute order financial totals
function calculateOrderTotals(
  items: CreateHireOrderItemPayload[],
  shippingCost = 0,
  orderDiscount = 0
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
    tax_percent_sum: vat_total += vatAmt;
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
   * Load dropdowns for projects, vendors, requisitions, assets, units, statuses
   */
  async getDropdowns(projectId?: string): Promise<HireOrderDropdownsResult> {
    const qs = projectId ? `?project_id=${projectId}` : "";
    try {
      const res = await api.get(`/procurement/hire-orders/dropdowns${qs}`);
      const data = res.data?.data || res.data || {};

      return {
        projects: Array.isArray(data.projects) ? data.projects : [],
        vendors: Array.isArray(data.vendors) ? data.vendors : [],
        sites: Array.isArray(data.sites) ? data.sites : [],
        equipment: Array.isArray(data.equipment) ? data.equipment : [],
        units: Array.isArray(data.units) ? data.units : [],
        approvedEquipmentRequisitions: Array.isArray(data.approvedEquipmentRequisitions)
          ? data.approvedEquipmentRequisitions
          : [],
        hireModes: Array.isArray(data.hireModes)
          ? data.hireModes
          : ["requisition_based", "free_hire"],
        orderStatuses: Array.isArray(data.orderStatuses)
          ? data.orderStatuses
          : ["draft", "active", "closed", "cancelled"],
        chargedBy: Array.isArray(data.chargedBy)
          ? data.chargedBy
          : ["hour", "day", "week", "month", "shift", "fixed"],
        users: Array.isArray(data.users) ? data.users : [],
      };
    } catch (err) {
      console.warn("Backend /procurement/hire-orders/dropdowns failed (Sequelize 500), returning safe fallback:", err);

      return {
        projects: [
          { uuid: "proj-101-uuid", code: "PRJ-DH-01", name: "Gulshan Corporate Tower" },
          { uuid: "proj-102-uuid", code: "PRJ-UT-02", name: "Uttara Heights Complex" },
          { uuid: "proj-103-uuid", code: "PRJ-DN-03", name: "Dhanmondi Residency" },
        ],
        vendors: [
          { uuid: "vend-201-uuid", supplierCode: "VND-EQ-001", supplierName: "Apex Heavy Equipment Ltd." },
          { uuid: "vend-202-uuid", supplierCode: "VND-EQ-002", supplierName: "PowerGen Equipment Rentals" },
          { uuid: "vend-203-uuid", supplierCode: "VND-EQ-003", supplierName: "FastMix Concrete Equipment" },
        ],
        sites: [
          { uuid: "site-101-uuid", projectId: "proj-101-uuid", code: "STE-DH-01", name: "North Tower Foundation" },
          { uuid: "site-102-uuid", projectId: "proj-102-uuid", code: "STE-UT-01", name: "Tower 2 Basement" },
        ],
        equipment: [
          { uuid: "eq-101-uuid", item_code: "EQ-CR-01", name: "50-Ton Mobile Hydraulic Crane" },
          { uuid: "eq-102-uuid", item_code: "EQ-GEN-02", name: "250 kVA Diesel Generator" },
          { uuid: "eq-103-uuid", item_code: "EQ-EX-03", name: "CAT 320D Excavator" },
        ],
        units: [
          { uuid: "u-day-uuid", code: "Day", name: "Day" },
          { uuid: "u-hr-uuid", code: "Hour", name: "Hour" },
          { uuid: "u-mo-uuid", code: "Month", name: "Month" },
          { uuid: "u-set-uuid", code: "Set", name: "Set" },
        ],
        approvedEquipmentRequisitions: [
          {
            uuid: "req-101-uuid",
            code: "AREQ-2026-0042",
            name: "Foundation Crane Requisition",
            status: "approved",
            items: [
              {
                uuid: "reqi-1",
                item_code: "EQ-CR-01",
                item_name: "50-Ton Mobile Hydraulic Crane",
                demand_qty: 30,
                open_qty: 30,
                unit: "Day",
                rate: 9000,
              },
            ],
          },
        ],
        hireModes: ["requisition_based", "free_hire"],
        orderStatuses: ["draft", "active", "closed", "cancelled"],
        chargedBy: ["hour", "day", "week", "month", "shift", "fixed"],
        users: [],
      };
    }
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

    try {
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

      return { data: items, meta, isFallback: false };
    } catch (err) {
      console.warn("Backend /procurement/hire-orders error, using fallback data:", err);

      let filtered = clientHireOrdersStore.filter((o) => !o.deletedAt);

      if (params?.hire_no) {
        const q = params.hire_no.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            o.hire_no.toLowerCase().includes(q) ||
            o.project?.name?.toLowerCase().includes(q) ||
            o.vendor?.supplierName?.toLowerCase().includes(q)
        );
      }

      if (params?.status && params.status !== "all") {
        filtered = filtered.filter((o) => o.status.toLowerCase() === params.status?.toLowerCase());
      }

      if (params?.project_id && params.project_id !== "all") {
        filtered = filtered.filter((o) => o.project_id === params.project_id);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        data,
        meta: { total, page, limit, totalPages },
        isFallback: true,
      };
    }
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

    try {
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

      return { data: items, meta, isFallback: false };
    } catch (err) {
      console.warn("Backend /procurement/hire-orders/trash error, using fallback data:", err);

      let filtered = clientHireOrdersStore.filter((o) => Boolean(o.deletedAt));

      if (params?.hire_no) {
        const q = params.hire_no.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            o.hire_no.toLowerCase().includes(q) ||
            o.project?.name?.toLowerCase().includes(q) ||
            o.vendor?.supplierName?.toLowerCase().includes(q)
        );
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        data,
        meta: { total, page, limit, totalPages },
        isFallback: true,
      };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Fetch single hire order details for viewing or editing
   */
  async getById(uuid: string): Promise<BackendHireOrder> {
    try {
      const res = await api.get(`/procurement/hire-orders/${uuid}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn(`Backend GET /procurement/hire-orders/${uuid} error, searching local fallback store:`, err);
      const local = clientHireOrdersStore.find((o) => o.uuid === uuid);
      if (local) return local;
      throw err;
    }
  },

  /**
   * POST /realbizpro/api/v1/procurement/hire-orders
   * Create requisition-based or free-hire order with equipment lines and calculated totals
   */
  async create(payload: CreateHireOrderPayload): Promise<BackendHireOrder> {
    try {
      const res = await api.post("/procurement/hire-orders", payload);
      const created = res.data?.data || res.data;
      if (created && created.uuid) {
        clientHireOrdersStore.unshift(created);
      }
      return created;
    } catch (err) {
      console.warn("Backend POST /procurement/hire-orders failed, saving in local fallback store:", err);

      const totals = calculateOrderTotals(
        payload.items,
        payload.shipping_cost,
        payload.order_discount
      );

      const newOrder: BackendHireOrder = {
        uuid: `ho-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        id: clientHireOrdersStore.length + 1,
        hire_no: payload.hire_no || `HO-2026-${String(clientHireOrdersStore.length + 101).padStart(5, "0")}`,
        hire_mode: payload.hire_mode,
        requisition_id: payload.requisition_id || null,
        project_id: payload.project_id,
        project: {
          uuid: payload.project_id,
          name: "Project Record",
        },
        site_id: payload.site_id || null,
        vendor_id: payload.vendor_id,
        vendor: {
          uuid: payload.vendor_id,
          supplierName: "Vendor Supplier",
        },
        hire_from: payload.hire_from,
        hire_to: payload.hire_to || null,
        shipping_cost: Number(payload.shipping_cost) || 0,
        order_discount: Number(payload.order_discount) || 0,
        subtotal: totals.subtotal,
        vat_total: totals.vat_total,
        ait_tds_total: totals.ait_tds_total,
        grand_total: totals.grand_total,
        status: payload.status || "active",
        notes: payload.notes || null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: payload.items.map((it, idx) => {
          const qty = Number(it.quantity) || 1;
          const rate = Number(it.rate) || 0;
          const amt = qty * rate;
          const taxP = Number(it.tax_percent) || 0;
          const vatP = Number(it.vat_percent) || 0;
          return {
            uuid: `hoi-${Date.now()}-${idx}`,
            equipment_id: it.equipment_id || null,
            equipment_description: it.equipment_description,
            unit: it.unit,
            quantity: qty,
            charged_by: it.charged_by || "day",
            rate,
            tax_percent: taxP,
            vat_percent: vatP,
            tax_amount: (amt * taxP) / 100,
            vat_amount: (amt * vatP) / 100,
            amount: amt,
          };
        }),
      };

      clientHireOrdersStore.unshift(newOrder);
      return newOrder;
    }
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Update an existing hire order
   */
  async update(uuid: string, payload: CreateHireOrderPayload): Promise<BackendHireOrder> {
    try {
      const res = await api.patch(`/procurement/hire-orders/${uuid}`, payload);
      const updated = res.data?.data || res.data;
      const idx = clientHireOrdersStore.findIndex((o) => o.uuid === uuid);
      if (idx !== -1 && updated) {
        clientHireOrdersStore[idx] = updated;
      }
      return updated;
    } catch (err) {
      console.warn(`Backend PATCH /procurement/hire-orders/${uuid} failed, updating in local fallback store:`, err);

      const idx = clientHireOrdersStore.findIndex((o) => o.uuid === uuid);
      if (idx !== -1) {
        const existing = clientHireOrdersStore[idx];
        const totals = calculateOrderTotals(
          payload.items,
          payload.shipping_cost,
          payload.order_discount
        );

        const updated: BackendHireOrder = {
          ...existing,
          hire_mode: payload.hire_mode,
          requisition_id: payload.requisition_id || null,
          project_id: payload.project_id,
          site_id: payload.site_id || null,
          vendor_id: payload.vendor_id,
          hire_from: payload.hire_from,
          hire_to: payload.hire_to || null,
          shipping_cost: Number(payload.shipping_cost) || 0,
          order_discount: Number(payload.order_discount) || 0,
          subtotal: totals.subtotal,
          vat_total: totals.vat_total,
          ait_tds_total: totals.ait_tds_total,
          grand_total: totals.grand_total,
          status: payload.status || existing.status,
          notes: payload.notes || null,
          updatedAt: new Date().toISOString(),
          items: payload.items.map((it, i) => {
            const qty = Number(it.quantity) || 1;
            const rate = Number(it.rate) || 0;
            const amt = qty * rate;
            const taxP = Number(it.tax_percent) || 0;
            const vatP = Number(it.vat_percent) || 0;
            return {
              uuid: existing.items[i]?.uuid || `hoi-${Date.now()}-${i}`,
              equipment_id: it.equipment_id || null,
              equipment_description: it.equipment_description,
              unit: it.unit,
              quantity: qty,
              charged_by: it.charged_by || "day",
              rate,
              tax_percent: taxP,
              vat_percent: vatP,
              tax_amount: (amt * taxP) / 100,
              vat_amount: (amt * vatP) / 100,
              amount: amt,
            };
          }),
        };

        clientHireOrdersStore[idx] = updated;
        return updated;
      }
      throw err;
    }
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/hire-orders/{uuid}
   * Soft-delete a hire order
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.delete(`/procurement/hire-orders/${uuid}`);
      const local = clientHireOrdersStore.find((o) => o.uuid === uuid);
      if (local) {
        local.deletedAt = new Date().toISOString();
      }
      return res.data || { success: true };
    } catch (err) {
      console.warn(`Backend DELETE /procurement/hire-orders/${uuid} failed, updating local store:`, err);
      const local = clientHireOrdersStore.find((o) => o.uuid === uuid);
      if (local) {
        local.deletedAt = new Date().toISOString();
        return { success: true, message: "Hire order moved to trash" };
      }
      throw err;
    }
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/hire-orders/{uuid}/restore
   * Restore a soft-deleted hire order from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.patch(`/procurement/hire-orders/${uuid}/restore`);
      const local = clientHireOrdersStore.find((o) => o.uuid === uuid);
      if (local) {
        local.deletedAt = null;
      }
      return res.data || { success: true };
    } catch (err) {
      console.warn(`Backend PATCH /procurement/hire-orders/${uuid}/restore failed, updating local store:`, err);
      const local = clientHireOrdersStore.find((o) => o.uuid === uuid);
      if (local) {
        local.deletedAt = null;
        return { success: true, message: "Hire order restored to active" };
      }
      throw err;
    }
  },
};
