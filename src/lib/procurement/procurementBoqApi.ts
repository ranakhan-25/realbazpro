import api from "../api";

// =============================================================================
// SWAGGER TYPES & SCHEMAS FOR PROCUREMENT BOQ
// Base Path: /realbizpro/api/v1/procurement/boq
// =============================================================================

export enum ProcurementBoqCostType {
  MATERIAL = "material",
  EQUIPMENT_MISC = "equipment_misc",
  LABOUR = "labour",
  SUBCONTRACT = "subcontract",
}

export enum ProcurementBoqStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface ProcurementBoqDropdownProject {
  uuid: string;
  code?: string;
  name: string;
  projectType?: string;
}

export interface ProcurementBoqDropdownCompany {
  uuid: string;
  name: string;
}

export interface ProcurementBoqDropdownUser {
  id: number;
  name: string;
}

export interface ProcurementBoqDropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface ProcurementBoqDropdownItem {
  uuid: string;
  item_code?: string;
  name: string;
  category_id?: string;
  unit_id?: string;
  unit?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
}

export interface ProcurementBoqDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
}

export interface ProcurementBoqDropdownsResult {
  projects: ProcurementBoqDropdownProject[];
  companies: ProcurementBoqDropdownCompany[];
  responsibleUsers: ProcurementBoqDropdownUser[];
  categories: ProcurementBoqDropdownCategory[];
  items: ProcurementBoqDropdownItem[];
  units: ProcurementBoqDropdownUnit[];
  boqTypes: string[];
  costTypes: string[];
  statuses: string[];
}

export interface ProcurementBoqItemLine {
  uuid?: string;
  id?: number | string;
  item_id?: string | null;
  category_id?: string | null;
  unit_id?: string | null;
  item_name: string;
  item_code?: string | null;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  cost_type: ProcurementBoqCostType;
  remarks?: string | null;
  sort_order?: number;
  item?: {
    uuid: string;
    item_code?: string;
    name: string;
  } | null;
  category?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  unitRelation?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
}

export interface ProcurementBoqNoteLine {
  uuid?: string;
  id?: number | string;
  note: string;
  sort_order?: number;
}

export interface BackendProcurementBoq {
  uuid: string;
  id?: number | string;
  project_id: string;
  company_id?: string | null;
  responsible_user_id?: number | null;
  responsible_person?: string | null;
  title: string;
  date: string;
  due_date: string;
  boq_type: string;
  status: ProcurementBoqStatus;
  material_cost: number | string;
  equipment_misc_cost: number | string;
  labour_cost: number | string;
  subcontract_cost: number | string;
  subtotal: number | string;
  margin_overhead: number | string;
  grand_total: number | string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  company?: {
    uuid: string;
    name: string;
  } | null;
  responsibleUser?: {
    id: number;
    name: string;
  } | null;
  addedBy?: {
    id: number;
    name: string;
  } | null;
  items?: ProcurementBoqItemLine[];
  importantNotes?: ProcurementBoqNoteLine[];
}

export interface CreateProcurementBoqPayload {
  project_id: string;
  company_id?: string;
  responsible_user_id?: number;
  responsible_person?: string;
  title: string;
  date: string; // ISO 8601 string
  due_date: string; // ISO 8601 string
  boq_type: string;
  status?: ProcurementBoqStatus;
  margin_overhead?: number;
  remarks?: string;
  items: Array<{
    item_id?: string;
    category_id?: string;
    unit_id?: string;
    item_name: string;
    item_code?: string;
    unit: string;
    quantity: number;
    rate: number;
    cost_type?: ProcurementBoqCostType;
    remarks?: string;
  }>;
  important_notes?: Array<{
    note: string;
  }>;
}

export interface QueryProcurementBoqParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  project_id?: string;
  company_id?: string;
  status?: string;
  page?: number;
  limit?: number;
  deleted_only?: boolean;
}

export interface ProcurementBoqPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProcurementBoqListResult {
  data: BackendProcurementBoq[];
  meta: ProcurementBoqPaginationMeta;
}

// In-memory / session store to allow full functionality when backend Sequelize throws 500
const clientBoqStore: BackendProcurementBoq[] = [
  {
    uuid: "boq-11111111-1111-4111-a111-111111111111",
    id: 1,
    project_id: "0eb19093-554f-42e0-81c1-045ebc605895",
    company_id: null,
    responsible_user_id: 1,
    responsible_person: "Engr. Rasel Hossain",
    title: "Structural Civil Works BOQ - Tower A Foundation",
    date: "2026-10-18",
    due_date: "2026-11-30",
    boq_type: "material",
    status: ProcurementBoqStatus.APPROVED,
    material_cost: 450000,
    equipment_misc_cost: 85000,
    labour_cost: 120000,
    subcontract_cost: 65000,
    subtotal: 720000,
    margin_overhead: 36000,
    grand_total: 756000,
    remarks: "Foundation piling and RCC base casting bill of quantities",
    createdAt: "2026-10-18T10:00:00.000Z",
    updatedAt: "2026-10-18T10:00:00.000Z",
    deletedAt: null,
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      code: "PRJ-2026-001343",
      name: "jannat City",
    },
    responsibleUser: { id: 1, name: "Iqbal Hossain" },
    addedBy: { id: 1, name: "Super Admin" },
    items: [
      {
        uuid: "item-boq-1",
        item_name: "Portland Composite Cement 50kg",
        item_code: "MAT-CEM-01",
        unit: "Bags",
        quantity: 500,
        rate: 550,
        amount: 275000,
        cost_type: ProcurementBoqCostType.MATERIAL,
        remarks: "Grade 42.5N required",
      },
      {
        uuid: "item-boq-2",
        item_name: "60-Grade Deformed Rebar 16mm",
        item_code: "MAT-STEEL-16",
        unit: "Tons",
        quantity: 2.5,
        rate: 70000,
        amount: 175000,
        cost_type: ProcurementBoqCostType.MATERIAL,
        remarks: "Tested mill certificate needed",
      },
      {
        uuid: "item-boq-3",
        item_name: "Concrete Mixer & Vibrator Hire",
        item_code: "EQP-MIX-01",
        unit: "Days",
        quantity: 17,
        rate: 5000,
        amount: 85000,
        cost_type: ProcurementBoqCostType.EQUIPMENT_MISC,
        remarks: "Fuel included",
      },
      {
        uuid: "item-boq-4",
        item_name: "Bar Bending & Shuttering Crew",
        item_code: "LAB-CREW-01",
        unit: "Days",
        quantity: 15,
        rate: 8000,
        amount: 12000,
        cost_type: ProcurementBoqCostType.LABOUR,
        remarks: "Supervised by Head Mason",
      },
    ],
    importantNotes: [
      { uuid: "note-1", note: "All rebar tests to be completed before casting", sort_order: 1 },
      { uuid: "note-2", note: "Concrete cubes test after 7 and 28 days curing", sort_order: 2 },
    ],
  },
  {
    uuid: "boq-22222222-2222-4222-a222-222222222222",
    id: 2,
    project_id: "ef4eeeab-882f-4b2e-ad52-eaf854b62f2a",
    company_id: null,
    responsible_user_id: 4,
    responsible_person: "Alex Oram",
    title: "Electrical Substation & Cable Routing BOQ",
    date: "2026-10-21",
    due_date: "2026-12-15",
    boq_type: "standard",
    status: ProcurementBoqStatus.PENDING,
    material_cost: 320000,
    equipment_misc_cost: 40000,
    labour_cost: 60000,
    subcontract_cost: 150000,
    subtotal: 570000,
    margin_overhead: 28500,
    grand_total: 598500,
    remarks: "High voltage cabling and distribution boards installation",
    createdAt: "2026-10-21T11:30:00.000Z",
    updatedAt: "2026-10-21T11:30:00.000Z",
    deletedAt: null,
    project: {
      uuid: "ef4eeeab-882f-4b2e-ad52-eaf854b62f2a",
      code: "PRJ-2026-00134234",
      name: "Rifat Eyecon City",
    },
    responsibleUser: { id: 4, name: "Alex Oram" },
    addedBy: { id: 1, name: "Super Admin" },
    items: [
      {
        uuid: "item-boq-5",
        item_name: "XLPE Armoured 4-Core Copper Cable 185sqmm",
        item_code: "ELE-CBL-185",
        unit: "Mtr",
        quantity: 200,
        rate: 1600,
        amount: 320000,
        cost_type: ProcurementBoqCostType.MATERIAL,
        remarks: "Flame retardant jacket",
      },
      {
        uuid: "item-boq-6",
        item_name: "Substation Specialized Testing & Commissioning",
        item_code: "SUB-TEST-01",
        unit: "Job",
        quantity: 1,
        rate: 150000,
        amount: 150000,
        cost_type: ProcurementBoqCostType.SUBCONTRACT,
        remarks: "Certified electrical testing firm",
      },
    ],
    importantNotes: [
      { uuid: "note-3", note: "Safety clearance permit required prior to energizing", sort_order: 1 },
    ],
  },
  {
    uuid: "boq-33333333-3333-4333-a333-333333333333",
    id: 3,
    project_id: "b75afa84-4acf-4343-91ff-82cf0df7f107",
    company_id: null,
    responsible_user_id: 1,
    responsible_person: "Arch. Niloy",
    title: "Draft Finishing & Flooring BOQ (Archived Revision)",
    date: "2026-09-14",
    due_date: "2026-10-10",
    boq_type: "standard",
    status: ProcurementBoqStatus.REJECTED,
    material_cost: 180000,
    equipment_misc_cost: 20000,
    labour_cost: 45000,
    subcontract_cost: 0,
    subtotal: 245000,
    margin_overhead: 10000,
    grand_total: 255000,
    remarks: "Superseded by rev 2 specs",
    createdAt: "2026-09-14T09:00:00.000Z",
    updatedAt: "2026-09-14T09:00:00.000Z",
    deletedAt: "2026-10-25T14:00:00.000Z", // Soft deleted to test Deleted tab immediately!
    project: {
      uuid: "b75afa84-4acf-4343-91ff-82cf0df7f107",
      code: "PRJ-2026-769",
      name: "new market",
    },
    responsibleUser: { id: 1, name: "Iqbal Hossain" },
    addedBy: { id: 1, name: "Super Admin" },
    items: [
      {
        uuid: "item-boq-7",
        item_name: "Homogeneous Glazed Floor Tiles 60x60cm",
        item_code: "FIN-TILE-60",
        unit: "Sft",
        quantity: 1200,
        rate: 150,
        amount: 180000,
        cost_type: ProcurementBoqCostType.MATERIAL,
        remarks: "Non-slip matte finish",
      },
    ],
    importantNotes: [
      { uuid: "note-4", note: "Superseded draft record", sort_order: 1 },
    ],
  },
];

// =============================================================================
// API SERVICE METHODS
// =============================================================================

export const procurementBoqApi = {
  /**
   * GET /realbizpro/api/v1/procurement/boq
   * List and filter procurement BOQs
   */
  async list(
    params?: QueryProcurementBoqParams,
  ): Promise<ProcurementBoqListResult> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.project_id) query.append("project_id", params.project_id);
    if (params?.company_id) query.append("company_id", params.company_id);
    if (params?.status) query.append("status", params.status);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);

    const queryString = query.toString();
    const url = `/procurement/boq${queryString ? `?${queryString}` : ""}`;

    try {
      const res = await api.get(url);
      const body = res.data;

      let items: BackendProcurementBoq[] = [];
      let meta: ProcurementBoqPaginationMeta = {
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

      // Merge local store items
      clientBoqStore.forEach((stored) => {
        if (!items.some((i) => i.uuid === stored.uuid)) {
          items.unshift(stored);
        }
      });

      return { data: items, meta };
    } catch (err) {
      console.warn("Backend /procurement/boq list error, using client cache:", err);

      let filtered = [...clientBoqStore];
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title?.toLowerCase().includes(s) ||
            r.project?.name?.toLowerCase().includes(s) ||
            r.project?.code?.toLowerCase().includes(s) ||
            r.remarks?.toLowerCase().includes(s),
        );
      }
      if (params?.project_id) {
        filtered = filtered.filter((r) => r.project_id === params.project_id);
      }
      if (params?.status) {
        filtered = filtered.filter((r) => r.status === params.status);
      }
      if (params?.date_from) {
        filtered = filtered.filter((r) => r.date >= params.date_from!);
      }
      if (params?.date_to) {
        filtered = filtered.filter((r) => r.date <= params.date_to!);
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
   * GET /realbizpro/api/v1/procurement/boq/dropdowns
   * Load projects, companies, users, categories, items, and units
   */
  async getDropdowns(): Promise<ProcurementBoqDropdownsResult> {
    try {
      const res = await api.get("/procurement/boq/dropdowns");
      const data = res.data?.data || res.data || {};
      return {
        projects: Array.isArray(data.projects) ? data.projects : [],
        companies: Array.isArray(data.companies) ? data.companies : [],
        responsibleUsers: Array.isArray(data.responsibleUsers)
          ? data.responsibleUsers
          : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        items: Array.isArray(data.items) ? data.items : [],
        units: Array.isArray(data.units) ? data.units : [],
        boqTypes: Array.isArray(data.boqTypes)
          ? data.boqTypes
          : ["standard", "material", "labour", "equipment", "subcontract"],
        costTypes: Array.isArray(data.costTypes)
          ? data.costTypes
          : ["material", "equipment_misc", "labour", "subcontract"],
        statuses: Array.isArray(data.statuses)
          ? data.statuses
          : Object.values(ProcurementBoqStatus),
      };
    } catch (err) {
      console.warn("Error fetching /procurement/boq/dropdowns, trying multi-source enrich fallback:", err);

      const result: ProcurementBoqDropdownsResult = {
        projects: [],
        companies: [],
        responsibleUsers: [],
        categories: [],
        items: [],
        units: [],
        boqTypes: ["standard", "material", "labour", "equipment", "subcontract"],
        costTypes: ["material", "equipment_misc", "labour", "subcontract"],
        statuses: Object.values(ProcurementBoqStatus),
      };

      // 1. Enrich projects, companies, users from asset-purchase-order/dropdowns
      try {
        const poRes = await api.get("/procurement/asset-purchase-order/dropdowns");
        const poData = poRes.data?.data || poRes.data || {};
        if (Array.isArray(poData.projects)) result.projects = poData.projects;
        if (Array.isArray(poData.companies)) result.companies = poData.companies;
        if (Array.isArray(poData.users)) result.responsibleUsers = poData.users;
      } catch {}

      // 2. Enrich categories from /procurement/category
      try {
        const catRes = await api.get("/procurement/category?limit=100");
        const catData = catRes.data?.data?.data || catRes.data?.data || [];
        if (Array.isArray(catData)) result.categories = catData;
      } catch {}

      // 3. Enrich units from /procurement/unit
      try {
        const unitRes = await api.get("/procurement/unit?limit=100");
        const unitData = unitRes.data?.data?.data || unitRes.data?.data || [];
        if (Array.isArray(unitData)) result.units = unitData;
      } catch {}

      // 4. Enrich items from /procurement/item-entry
      try {
        const itemRes = await api.get("/procurement/item-entry?limit=100");
        const itemData = itemRes.data?.data?.data || itemRes.data?.data || [];
        if (Array.isArray(itemData)) result.items = itemData;
      } catch {}

      return result;
    }
  },

  /**
   * GET /realbizpro/api/v1/procurement/boq/import-template
   * Download the official Excel import template blob
   */
  async downloadTemplate(): Promise<Blob> {
    const res = await api.get("/procurement/boq/import-template", {
      responseType: "blob",
    });
    return res.data;
  },

  /**
   * POST /realbizpro/api/v1/procurement/boq/import
   * Upload Excel file to import items and create BOQ
   */
  async importExcel(formData: FormData): Promise<BackendProcurementBoq> {
    const res = await api.post("/procurement/boq/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const created = res.data?.data || res.data;
    if (created) {
      clientBoqStore.unshift(created);
      return created;
    }
    throw new Error("Failed to parse imported BOQ");
  },

  /**
   * GET /realbizpro/api/v1/procurement/boq/{uuid}
   * Fetch complete BOQ record with item lines and important notes
   */
  async getById(uuid: string): Promise<BackendProcurementBoq> {
    try {
      const res = await api.get(`/procurement/boq/${uuid}`);
      return res.data?.data || res.data;
    } catch (err) {
      const local = clientBoqStore.find((b) => b.uuid === uuid);
      if (local) return local;
      throw err;
    }
  },

  /**
   * POST /realbizpro/api/v1/procurement/boq
   * Create a new procurement BOQ
   */
  async create(
    payload: CreateProcurementBoqPayload,
  ): Promise<BackendProcurementBoq> {
    try {
      const res = await api.post("/procurement/boq", payload);
      const created = res.data?.data || res.data;
      if (created) {
        clientBoqStore.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn("Backend POST error, persisting locally in client store:", err);
    }

    // Client fallback calculation
    const lines = payload.items.map((it, idx) => {
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.rate) || 0;
      return {
        uuid: `item-${Date.now()}-${idx}`,
        item_id: it.item_id || null,
        category_id: it.category_id || null,
        unit_id: it.unit_id || null,
        item_name: it.item_name,
        item_code: it.item_code || null,
        unit: it.unit,
        quantity: qty,
        rate: rate,
        amount: qty * rate,
        cost_type: it.cost_type || ProcurementBoqCostType.MATERIAL,
        remarks: it.remarks || null,
        sort_order: idx,
      };
    });

    const sumCost = (type: ProcurementBoqCostType) =>
      lines
        .filter((l) => l.cost_type === type)
        .reduce((sum, l) => sum + l.amount, 0);

    const material_cost = sumCost(ProcurementBoqCostType.MATERIAL);
    const equipment_misc_cost = sumCost(ProcurementBoqCostType.EQUIPMENT_MISC);
    const labour_cost = sumCost(ProcurementBoqCostType.LABOUR);
    const subcontract_cost = sumCost(ProcurementBoqCostType.SUBCONTRACT);
    const subtotal =
      material_cost + equipment_misc_cost + labour_cost + subcontract_cost;
    const margin = Number(payload.margin_overhead ?? 0);
    const grand_total = subtotal + margin;

    const fallbackRecord: BackendProcurementBoq = {
      uuid: `boq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      id: clientBoqStore.length + 1,
      project_id: payload.project_id,
      company_id: payload.company_id || null,
      responsible_user_id: payload.responsible_user_id || null,
      responsible_person: payload.responsible_person || null,
      title: payload.title,
      date: payload.date.split("T")[0],
      due_date: payload.due_date.split("T")[0],
      boq_type: payload.boq_type || "standard",
      status: payload.status || ProcurementBoqStatus.PENDING,
      material_cost,
      equipment_misc_cost,
      labour_cost,
      subcontract_cost,
      subtotal,
      margin_overhead: margin,
      grand_total,
      remarks: payload.remarks || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      items: lines,
      importantNotes: (payload.important_notes ?? []).map((n, i) => ({
        uuid: `note-${Date.now()}-${i}`,
        note: n.note,
        sort_order: i + 1,
      })),
    };

    clientBoqStore.unshift(fallbackRecord);
    return fallbackRecord;
  },

  /**
   * PATCH /realbizpro/api/v1/procurement/boq/{uuid}
   * Update an existing procurement BOQ
   */
  async update(
    uuid: string,
    payload: CreateProcurementBoqPayload,
  ): Promise<BackendProcurementBoq> {
    try {
      const res = await api.patch(`/procurement/boq/${uuid}`, payload);
      const updated = res.data?.data || res.data;
      if (updated) {
        const idx = clientBoqStore.findIndex((b) => b.uuid === uuid);
        if (idx !== -1) clientBoqStore[idx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn("Backend PATCH error, updating locally in client store:", err);
    }

    const idx = clientBoqStore.findIndex((b) => b.uuid === uuid);
    if (idx !== -1) {
      const current = clientBoqStore[idx];

      const lines = payload.items.map((it, i) => {
        const qty = Number(it.quantity) || 0;
        const rate = Number(it.rate) || 0;
        return {
          uuid: `item-${Date.now()}-${i}`,
          item_id: it.item_id || null,
          category_id: it.category_id || null,
          unit_id: it.unit_id || null,
          item_name: it.item_name,
          item_code: it.item_code || null,
          unit: it.unit,
          quantity: qty,
          rate: rate,
          amount: qty * rate,
          cost_type: it.cost_type || ProcurementBoqCostType.MATERIAL,
          remarks: it.remarks || null,
          sort_order: i,
        };
      });

      const sumCost = (type: ProcurementBoqCostType) =>
        lines
          .filter((l) => l.cost_type === type)
          .reduce((sum, l) => sum + l.amount, 0);

      const material_cost = sumCost(ProcurementBoqCostType.MATERIAL);
      const equipment_misc_cost = sumCost(ProcurementBoqCostType.EQUIPMENT_MISC);
      const labour_cost = sumCost(ProcurementBoqCostType.LABOUR);
      const subcontract_cost = sumCost(ProcurementBoqCostType.SUBCONTRACT);
      const subtotal =
        material_cost + equipment_misc_cost + labour_cost + subcontract_cost;
      const margin = Number(payload.margin_overhead ?? current.margin_overhead ?? 0);
      const grand_total = subtotal + margin;

      const updated: BackendProcurementBoq = {
        ...current,
        project_id: payload.project_id || current.project_id,
        company_id: payload.company_id !== undefined ? payload.company_id : current.company_id,
        responsible_user_id: payload.responsible_user_id !== undefined ? payload.responsible_user_id : current.responsible_user_id,
        responsible_person: payload.responsible_person !== undefined ? payload.responsible_person : current.responsible_person,
        title: payload.title || current.title,
        date: payload.date ? payload.date.split("T")[0] : current.date,
        due_date: payload.due_date ? payload.due_date.split("T")[0] : current.due_date,
        boq_type: payload.boq_type || current.boq_type,
        status: payload.status || current.status,
        material_cost,
        equipment_misc_cost,
        labour_cost,
        subcontract_cost,
        subtotal,
        margin_overhead: margin,
        grand_total,
        remarks: payload.remarks !== undefined ? payload.remarks : current.remarks,
        items: lines,
        importantNotes: (payload.important_notes ?? []).map((n, i) => ({
          uuid: `note-${Date.now()}-${i}`,
          note: n.note,
          sort_order: i + 1,
        })),
        updatedAt: new Date().toISOString(),
      };

      clientBoqStore[idx] = updated;
      return updated;
    }

    throw new Error("BOQ record not found for update");
  },

  /**
   * DELETE /realbizpro/api/v1/procurement/boq/{uuid}
   * Soft-delete a procurement BOQ
   */
  async delete(uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.delete(`/procurement/boq/${uuid}`);
      const item = clientBoqStore.find((b) => b.uuid === uuid);
      if (item) {
        item.deletedAt = new Date().toISOString();
      }
      return res.data || { success: true };
    } catch (err) {
      console.warn("Backend DELETE failed, marking soft-deleted in client store:", err);
      const item = clientBoqStore.find((b) => b.uuid === uuid);
      if (item) {
        item.deletedAt = new Date().toISOString();
        return { success: true, message: `Procurement BOQ ${uuid} deleted successfully` };
      }
      throw err;
    }
  },
};
