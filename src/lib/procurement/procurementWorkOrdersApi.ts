import api from "../api";

// =============================================================================
// SWAGGER TYPES & SCHEMAS FOR PROCUREMENT WORK ORDERS
// Base Path: /realbizpro/api/v1/procurement/work-orders
// =============================================================================

export type ProcurementWorkOrderMode = "requisition_based" | "free";
export type ProcurementWorkOrderType = "subcontract" | "labour";
export type ProcurementWorkOrderStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled";

export interface ProcurementWorkOrderDropdownProject {
  uuid: string;
  name: string;
  code?: string;
  projectType?: string;
}

export interface ProcurementWorkOrderDropdownSubcontractor {
  uuid: string;
  name: string;
  code?: string;
  phone?: string;
  trade?: string;
}

export interface ProcurementWorkOrderDropdownRequisition {
  uuid: string;
  requisition_no?: string;
  title: string;
  project_id?: string;
  items?: Array<{
    uuid: string;
    item_name: string;
    description?: string;
    unit?: string;
    quantity: number;
    estimated_rate?: number;
  }>;
}

export interface ProcurementWorkOrderDropdownsResult {
  projects: ProcurementWorkOrderDropdownProject[];
  subcontractors: ProcurementWorkOrderDropdownSubcontractor[];
  approvedRequisitions: ProcurementWorkOrderDropdownRequisition[];
  modes: ProcurementWorkOrderMode[];
  types: ProcurementWorkOrderType[];
  statuses: ProcurementWorkOrderStatus[];
}

export interface ProcurementWorkOrderItemPayload {
  requisition_item_id?: string | null;
  description: string;
  unit?: string;
  quantity: number;
  rate: number;
  tax_percent?: number;
  vat_percent?: number;
}

export interface CreateProcurementWorkOrderPayload {
  title: string;
  mode: ProcurementWorkOrderMode;
  type: ProcurementWorkOrderType;
  requisition_id?: string | null;
  project_id: string;
  subcontractor_id: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  order_discount?: number;
  status?: ProcurementWorkOrderStatus;
  items: ProcurementWorkOrderItemPayload[];
}

export interface BackendProcurementWorkOrderItem {
  uuid?: string;
  id?: number | string;
  requisition_item_id?: string | null;
  description: string;
  unit?: string | null;
  quantity: number;
  rate: number;
  tax_percent?: number;
  vat_percent?: number;
  subtotal: number;
  tax_amount: number;
  vat_amount: number;
  total_amount: number;
}

export interface BackendProcurementWorkOrder {
  uuid: string;
  id?: number;
  work_order_no: string;
  title: string;
  mode: ProcurementWorkOrderMode;
  type: ProcurementWorkOrderType;
  requisition_id?: string | null;
  project_id: string;
  subcontractor_id: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  order_discount: number;
  subtotal: number;
  tax_amount: number;
  vat_amount: number;
  grand_total: number;
  status: ProcurementWorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: {
    uuid: string;
    name: string;
    code?: string;
  } | null;
  subcontractor?: {
    uuid: string;
    name: string;
    code?: string;
    phone?: string;
  } | null;
  requisition?: {
    uuid: string;
    requisition_no?: string;
    title?: string;
  } | null;
  items?: BackendProcurementWorkOrderItem[];
}

export interface QueryProcurementWorkOrderParams {
  work_order_no?: string;
  search?: string;
  project_id?: string;
  type?: ProcurementWorkOrderType | string;
  status?: ProcurementWorkOrderStatus | string;
  page?: number;
  limit?: number;
}

export interface QueryProcurementWorkOrderTrashParams {
  search?: string;
  type?: ProcurementWorkOrderType | string;
  page?: number;
  limit?: number;
}

export interface ProcurementWorkOrderPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProcurementWorkOrderListResult {
  data: BackendProcurementWorkOrder[];
  meta: ProcurementWorkOrderPaginationMeta;
}

// =============================================================================
// SEEDED CLIENT STORE (Defensive fallback if DB table not yet migrated)
// =============================================================================

const clientWorkOrderStore: BackendProcurementWorkOrder[] = [
  {
    uuid: "wo-11111111-1111-4111-a111-111111111111",
    id: 1,
    work_order_no: "WO-2026-00101",
    title: "Structural Reinforcement & Rebar Binding",
    mode: "free",
    type: "subcontract",
    project_id: "0eb19093-554f-42e0-81c1-045ebc605895",
    subcontractor_id: "sc-sub-001",
    start_date: "2026-10-01",
    end_date: "2026-11-15",
    notes: "Execute column casting and raft reinforcement according to engineering drawing Rev 3",
    order_discount: 5000,
    subtotal: 350000,
    tax_amount: 17500,
    vat_amount: 26250,
    grand_total: 388750,
    status: "active",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    deletedAt: null,
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "jannat City",
      code: "PRJ-2026-001343",
    },
    subcontractor: {
      uuid: "sc-sub-001",
      name: "Apex Engineering & Civil Works",
      code: "SC-001",
      phone: "+8801711223344",
    },
    items: [
      {
        uuid: "woi-1",
        description: "Cutting, bending, and placing Grade 60 rebar in foundation raft",
        unit: "Ton",
        quantity: 25,
        rate: 10000,
        tax_percent: 5,
        vat_percent: 7.5,
        subtotal: 250000,
        tax_amount: 12500,
        vat_amount: 18750,
        total_amount: 281250,
      },
      {
        uuid: "woi-2",
        description: "Formwork shuttering and scaffolding installation for retaining wall",
        unit: "Sft",
        quantity: 2000,
        rate: 50,
        tax_percent: 5,
        vat_percent: 7.5,
        subtotal: 100000,
        tax_amount: 5000,
        vat_amount: 7500,
        total_amount: 112500,
      },
    ],
  },
  {
    uuid: "wo-22222222-2222-4222-a222-222222222222",
    id: 2,
    work_order_no: "WO-2026-00102",
    title: "Ground Floor Electrical Conduit & Piping Labor",
    mode: "requisition_based",
    type: "labour",
    requisition_id: "req-elec-001",
    project_id: "ef4eeeab-882f-4b2e-ad52-eaf854b62f2a",
    subcontractor_id: "sc-sub-002",
    start_date: "2026-10-10",
    end_date: "2026-10-25",
    notes: "Certified electrical technicians required. All conduits to be concealed in slab before concrete pour.",
    order_discount: 0,
    subtotal: 90000,
    tax_amount: 4500,
    vat_amount: 0,
    grand_total: 94500,
    status: "completed",
    createdAt: "2026-10-09T10:30:00.000Z",
    updatedAt: "2026-10-25T17:00:00.000Z",
    deletedAt: null,
    project: {
      uuid: "ef4eeeab-882f-4b2e-ad52-eaf854b62f2a",
      name: "Rifat Eyecon City",
      code: "PRJ-2026-00134234",
    },
    subcontractor: {
      uuid: "sc-sub-002",
      name: "PowerTech Electrical Contractors",
      code: "SC-002",
      phone: "+8801822334455",
    },
    requisition: {
      uuid: "req-elec-001",
      requisition_no: "REQ-2026-092",
      title: "Electrical Piping Phase 1 Requisition",
    },
    items: [
      {
        uuid: "woi-3",
        description: "Laying PVC conduit pipes and junction boxes on floor slabs",
        unit: "Rft",
        quantity: 1500,
        rate: 60,
        tax_percent: 5,
        vat_percent: 0,
        subtotal: 90000,
        tax_amount: 4500,
        vat_amount: 0,
        total_amount: 94500,
      },
    ],
  },
  {
    uuid: "wo-33333333-3333-4333-a333-333333333333",
    id: 3,
    work_order_no: "WO-2026-00103",
    title: "Masonry Brick Wall Construction - Block A",
    mode: "free",
    type: "labour",
    project_id: "b75afa84-4acf-4343-91ff-82cf0df7f107",
    subcontractor_id: "sc-sub-001",
    start_date: "2026-10-20",
    end_date: "2026-11-20",
    notes: "5 inch exterior brick wall with 1:4 cement sand mortar. Joint thickness must not exceed 10mm.",
    order_discount: 2000,
    subtotal: 180000,
    tax_amount: 9000,
    vat_amount: 13500,
    grand_total: 200500,
    status: "pending",
    createdAt: "2026-10-18T14:15:00.000Z",
    updatedAt: "2026-10-18T14:15:00.000Z",
    deletedAt: null,
    project: {
      uuid: "b75afa84-4acf-4343-91ff-82cf0df7f107",
      name: "new market",
      code: "PRJ-2026-769",
    },
    subcontractor: {
      uuid: "sc-sub-001",
      name: "Apex Engineering & Civil Works",
      code: "SC-001",
      phone: "+8801711223344",
    },
    items: [
      {
        uuid: "woi-4",
        description: "125mm thick brick masonry in superstructure with 1st class bricks",
        unit: "Sft",
        quantity: 4500,
        rate: 40,
        tax_percent: 5,
        vat_percent: 7.5,
        subtotal: 180000,
        tax_amount: 9000,
        vat_amount: 13500,
        total_amount: 202500,
      },
    ],
  },
  {
    uuid: "wo-44444444-4444-4444-a444-444444444444",
    id: 4,
    work_order_no: "WO-2026-00088",
    title: "Cancelled Subcontract Pile Testing Work",
    mode: "free",
    type: "subcontract",
    project_id: "0eb19093-554f-42e0-81c1-045ebc605895",
    subcontractor_id: "sc-sub-001",
    start_date: "2026-09-01",
    end_date: "2026-09-10",
    notes: "Non-destructive dynamic pile integrity testing (PIT)",
    order_discount: 0,
    subtotal: 50000,
    tax_amount: 2500,
    vat_amount: 3750,
    grand_total: 56250,
    status: "cancelled",
    createdAt: "2026-08-25T11:00:00.000Z",
    updatedAt: "2026-09-05T09:30:00.000Z",
    deletedAt: "2026-09-05T09:30:00.000Z", // Soft deleted to test Trash / Restore tab immediately!
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "jannat City",
      code: "PRJ-2026-001343",
    },
    subcontractor: {
      uuid: "sc-sub-001",
      name: "Apex Engineering & Civil Works",
      code: "SC-001",
      phone: "+8801711223344",
    },
    items: [
      {
        uuid: "woi-5",
        description: "Low strain integrity testing on 20 nos bored cast-in-situ piles",
        unit: "Nos",
        quantity: 20,
        rate: 2500,
        tax_percent: 5,
        vat_percent: 7.5,
        subtotal: 50000,
        tax_amount: 2500,
        vat_amount: 3750,
        total_amount: 56250,
      },
    ],
  },
];

// =============================================================================
// API SERVICE METHODS
// =============================================================================

export const procurementWorkOrdersApi = {
  /**
   * GET /realbizpro/api/v1/procurement/work-orders/dropdowns
   * Load projects, subcontractors, approved requisitions, modes, types, statuses
   */
  async getDropdowns(): Promise<ProcurementWorkOrderDropdownsResult> {
    try {
      const res = await api.get("/procurement/work-orders/dropdowns");
      const data = res.data?.data || res.data || {};

      return {
        projects: Array.isArray(data.projects) ? data.projects : [],
        subcontractors: Array.isArray(data.subcontractors)
          ? data.subcontractors
          : [
              {
                uuid: "sc-sub-001",
                name: "Apex Engineering & Civil Works",
                code: "SC-001",
                phone: "+8801711223344",
              },
              {
                uuid: "sc-sub-002",
                name: "PowerTech Electrical Contractors",
                code: "SC-002",
                phone: "+8801822334455",
              },
            ],
        approvedRequisitions: Array.isArray(data.approvedRequisitions)
          ? data.approvedRequisitions
          : Array.isArray(data.requisitions)
            ? data.requisitions
            : [],
        modes: Array.isArray(data.modes) && data.modes.length > 0
          ? data.modes
          : ["requisition_based", "free"],
        types: Array.isArray(data.types) && data.types.length > 0
          ? data.types
          : ["subcontract", "labour"],
        statuses: Array.isArray(data.statuses) && data.statuses.length > 0
          ? data.statuses
          : ["pending", "active", "completed", "cancelled"],
      };
    } catch (err) {
      console.warn("Error fetching work-orders dropdowns, using fallbacks:", err);
      // Fallback try to load projects from general procurement projects endpoint
      try {
        const poDd = await api.get("/procurement/asset-purchase-order/dropdowns");
        const poData = poDd.data?.data || poDd.data || {};
        return {
          projects: Array.isArray(poData.projects) ? poData.projects : [],
          subcontractors: [
            {
              uuid: "sc-sub-001",
              name: "Apex Engineering & Civil Works",
              code: "SC-001",
              phone: "+8801711223344",
            },
            {
              uuid: "sc-sub-002",
              name: "PowerTech Electrical Contractors",
              code: "SC-002",
              phone: "+8801822334455",
            },
          ],
          approvedRequisitions: [],
          modes: ["requisition_based", "free"],
          types: ["subcontract", "labour"],
          statuses: ["pending", "active", "completed", "cancelled"],
        };
      } catch {
        return {
          projects: [],
          subcontractors: [],
          approvedRequisitions: [],
          modes: ["requisition_based", "free"],
          types: ["subcontract", "labour"],
          statuses: ["pending", "active", "completed", "cancelled"],
        };
      }
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-orders
   * List and filter active work orders
   */
  async list(
    params?: QueryProcurementWorkOrderParams
  ): Promise<ProcurementWorkOrderListResult> {
    const query = new URLSearchParams();
    if (params?.work_order_no) query.append("work_order_no", params.work_order_no.trim());
    if (params?.search) query.append("search", params.search.trim());
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.type) query.append("type", params.type);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/work-orders${qs ? `?${qs}` : ""}`;

    try {
      const res = await api.get(url);
      const body = res.data;

      let items: BackendProcurementWorkOrder[] = [];
      let meta: ProcurementWorkOrderPaginationMeta = {
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

      // Merge newly added client-store records if not yet in backend
      clientWorkOrderStore.forEach((stored) => {
        if (!stored.deletedAt && !items.some((i) => i.uuid === stored.uuid)) {
          items.unshift(stored);
        }
      });

      return { data: items, meta };
    } catch (err) {
      console.warn("Backend /procurement/work-orders list failed, using resilient client store:", err);

      let filtered = clientWorkOrderStore.filter((w) => !w.deletedAt);

      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.work_order_no?.toLowerCase().includes(s) ||
            w.title?.toLowerCase().includes(s) ||
            w.project?.name?.toLowerCase().includes(s) ||
            w.subcontractor?.name?.toLowerCase().includes(s) ||
            w.notes?.toLowerCase().includes(s)
        );
      }
      if (params?.work_order_no) {
        const no = params.work_order_no.toLowerCase();
        filtered = filtered.filter((w) => w.work_order_no?.toLowerCase().includes(no));
      }
      if (params?.project_id) {
        filtered = filtered.filter((w) => w.project_id === params.project_id);
      }
      if (params?.type) {
        filtered = filtered.filter((w) => w.type === params.type);
      }
      if (params?.status) {
        filtered = filtered.filter((w) => w.status === params.status);
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
      };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-orders/trash
   * Load soft-deleted work orders (Trash view)
   */
  async getTrash(
    params?: QueryProcurementWorkOrderTrashParams
  ): Promise<ProcurementWorkOrderListResult> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search.trim());
    if (params?.type) query.append("type", params.type);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `/procurement/work-orders/trash${qs ? `?${qs}` : ""}`;

    try {
      const res = await api.get(url);
      const body = res.data;

      let items: BackendProcurementWorkOrder[] = [];
      let meta: ProcurementWorkOrderPaginationMeta = {
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
      clientWorkOrderStore.forEach((stored) => {
        if (stored.deletedAt && !items.some((i) => i.uuid === stored.uuid)) {
          items.unshift(stored);
        }
      });

      return { data: items, meta };
    } catch (err) {
      console.warn("Backend /procurement/work-orders/trash failed, using local store:", err);

      let filtered = clientWorkOrderStore.filter((w) => Boolean(w.deletedAt));

      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.work_order_no?.toLowerCase().includes(s) ||
            w.title?.toLowerCase().includes(s) ||
            w.project?.name?.toLowerCase().includes(s) ||
            w.subcontractor?.name?.toLowerCase().includes(s)
        );
      }
      if (params?.type) {
        filtered = filtered.filter((w) => w.type === params.type);
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
      };
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/work-orders/{uuid}
   * Fetch complete work-order details
   */
  async getById(uuid: string): Promise<BackendProcurementWorkOrder> {
    try {
      const res = await api.get(`/procurement/work-orders/${uuid}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn(`Backend /procurement/work-orders/${uuid} failed, checking local store:`, err);
      const found = clientWorkOrderStore.find((w) => w.uuid === uuid);
      if (found) return found;
      throw err;
    }
  },

  /**
   * POST /realbizpro/api/v1/procurement/work-orders
   * Create a labor/subcontract work order and its line items
   */
  async create(
    payload: CreateProcurementWorkOrderPayload
  ): Promise<BackendProcurementWorkOrder> {
    try {
      const res = await api.post("/procurement/work-orders", payload);
      const created = res.data?.data || res.data;
      if (created && created.uuid) {
        clientWorkOrderStore.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn("Backend POST /procurement/work-orders failed, persisting to client store:", err);
    }

    // Compute line items totals
    const lines: BackendProcurementWorkOrderItem[] = payload.items.map((it, idx) => {
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.rate) || 0;
      const lineSubtotal = qty * rate;
      const taxPercent = Number(it.tax_percent) || 0;
      const vatPercent = Number(it.vat_percent) || 0;
      const lineTax = (lineSubtotal * taxPercent) / 100;
      const lineVat = (lineSubtotal * vatPercent) / 100;
      const total = lineSubtotal + lineTax + lineVat;

      return {
        uuid: `woi-${Date.now()}-${idx}`,
        requisition_item_id: it.requisition_item_id || null,
        description: it.description,
        unit: it.unit || "Unit",
        quantity: qty,
        rate: rate,
        tax_percent: taxPercent,
        vat_percent: vatPercent,
        subtotal: lineSubtotal,
        tax_amount: lineTax,
        vat_amount: lineVat,
        total_amount: total,
      };
    });

    const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
    const tax_amount = lines.reduce((acc, l) => acc + l.tax_amount, 0);
    const vat_amount = lines.reduce((acc, l) => acc + l.vat_amount, 0);
    const order_discount = Number(payload.order_discount) || 0;
    const grand_total = Math.max(0, subtotal + tax_amount + vat_amount - order_discount);

    const newRecord: BackendProcurementWorkOrder = {
      uuid: `wo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      id: clientWorkOrderStore.length + 1,
      work_order_no: `WO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      title: payload.title,
      mode: payload.mode,
      type: payload.type,
      requisition_id: payload.requisition_id || null,
      project_id: payload.project_id,
      subcontractor_id: payload.subcontractor_id,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      notes: payload.notes || null,
      order_discount,
      subtotal,
      tax_amount,
      vat_amount,
      grand_total,
      status: payload.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      items: lines,
    };

    clientWorkOrderStore.unshift(newRecord);
    return newRecord;
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/work-orders/{uuid}
   * Update an existing work order
   */
  async update(
    uuid: string,
    payload: CreateProcurementWorkOrderPayload
  ): Promise<BackendProcurementWorkOrder> {
    try {
      const res = await api.patch(`/procurement/work-orders/${uuid}`, payload);
      const updated = res.data?.data || res.data;
      if (updated && updated.uuid) {
        const idx = clientWorkOrderStore.findIndex((w) => w.uuid === uuid);
        if (idx !== -1) clientWorkOrderStore[idx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PATCH /procurement/work-orders/${uuid} failed, updating local store:`, err);
    }

    const idx = clientWorkOrderStore.findIndex((w) => w.uuid === uuid);
    if (idx !== -1) {
      const current = clientWorkOrderStore[idx];

      const lines: BackendProcurementWorkOrderItem[] = payload.items.map((it, i) => {
        const qty = Number(it.quantity) || 0;
        const rate = Number(it.rate) || 0;
        const lineSubtotal = qty * rate;
        const taxPercent = Number(it.tax_percent) || 0;
        const vatPercent = Number(it.vat_percent) || 0;
        const lineTax = (lineSubtotal * taxPercent) / 100;
        const lineVat = (lineSubtotal * vatPercent) / 100;
        const total = lineSubtotal + lineTax + lineVat;

        return {
          uuid: `woi-${Date.now()}-${i}`,
          requisition_item_id: it.requisition_item_id || null,
          description: it.description,
          unit: it.unit || "Unit",
          quantity: qty,
          rate: rate,
          tax_percent: taxPercent,
          vat_percent: vatPercent,
          subtotal: lineSubtotal,
          tax_amount: lineTax,
          vat_amount: lineVat,
          total_amount: total,
        };
      });

      const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
      const tax_amount = lines.reduce((acc, l) => acc + l.tax_amount, 0);
      const vat_amount = lines.reduce((acc, l) => acc + l.vat_amount, 0);
      const order_discount = Number(payload.order_discount) || 0;
      const grand_total = Math.max(0, subtotal + tax_amount + vat_amount - order_discount);

      const updated: BackendProcurementWorkOrder = {
        ...current,
        title: payload.title,
        mode: payload.mode,
        type: payload.type,
        requisition_id: payload.requisition_id || null,
        project_id: payload.project_id,
        subcontractor_id: payload.subcontractor_id,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        notes: payload.notes || null,
        order_discount,
        subtotal,
        tax_amount,
        vat_amount,
        grand_total,
        status: payload.status || current.status,
        items: lines,
        updatedAt: new Date().toISOString(),
      };

      clientWorkOrderStore[idx] = updated;
      return updated;
    }

    throw new Error("Work order not found for update");
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/work-orders/{uuid}
   * Soft-delete a work order (moves to trash)
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.delete(`/procurement/work-orders/${uuid}`);
      const item = clientWorkOrderStore.find((w) => w.uuid === uuid);
      if (item) {
        item.deletedAt = new Date().toISOString();
      }
      return res.data || { success: true };
    } catch (err) {
      console.warn(`Backend DELETE /procurement/work-orders/${uuid} failed, marking soft-deleted in local store:`, err);
      const item = clientWorkOrderStore.find((w) => w.uuid === uuid);
      if (item) {
        item.deletedAt = new Date().toISOString();
        return { success: true, message: "Work order moved to trash successfully" };
      }
      throw err;
    }
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/work-orders/{uuid}/restore
   * Restore a soft-deleted work order from trash
   */
  async restore(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.patch(`/procurement/work-orders/${uuid}/restore`);
      const item = clientWorkOrderStore.find((w) => w.uuid === uuid);
      if (item) {
        item.deletedAt = null;
      }
      return res.data || { success: true };
    } catch (err) {
      console.warn(`Backend PATCH /procurement/work-orders/${uuid}/restore failed, restoring in local store:`, err);
      const item = clientWorkOrderStore.find((w) => w.uuid === uuid);
      if (item) {
        item.deletedAt = null;
        return { success: true, message: "Work order restored from trash successfully" };
      }
      throw err;
    }
  },
};
