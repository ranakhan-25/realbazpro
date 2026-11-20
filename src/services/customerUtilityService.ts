import api from "@/lib/api";

export type TechnicianSpecialty =
  | "Plumber"
  | "Electrician"
  | "Sanitary Specialist"
  | "HVAC / Generator"
  | "Multi-skilled";

export type TechnicianType = "In-house" | "Vendor";

export type UtilityTicketCategory =
  "Plumbing" | "Electrical" | "Sanitary" | "Other";

export type UtilityTicketPriority = "Low" | "Medium" | "High" | "Emergency";

export type UtilityTicketStatus =
  "Open" | "Assigned" | "In Progress" | "Resolved" | "Handed Over" | "Closed";

export type UtilityTicketCostType = "FREE" | "PAID";

export type WarrantyItemCategory =
  "Electrical" | "Plumbing" | "Sanitary" | "Water Fittings" | "Other";

export type WarrantyStatus = "Active" | "Expiring Soon" | "Expired";

// 1. Technician Interfaces
export interface UtilityTechnicianItem {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  specialty: TechnicianSpecialty;
  technician_type: TechnicianType;
  vendor_name?: string | null;
  is_active: boolean;
  project_id?: string | null;
  project_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTechnicianPayload {
  name: string;
  phone: string;
  specialty: TechnicianSpecialty;
  technician_type?: TechnicianType;
  vendor_name?: string;
  is_active?: boolean;
  project_id?: string;
}

// 2. Warranty Registry Interfaces
export interface WarrantyRegistryItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  unit: string;
  customer_name?: string | null;
  customer_profile_id?: number | null;
  item_name: string;
  category: WarrantyItemCategory;
  brand: string;
  model_no?: string | null;
  serial_number?: string | null;
  location: string;
  quantity: number;
  warranty_start_date: string;
  warranty_end_date: string;
  coverage_details?: string | null;
  warranty_status: WarrantyStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WarrantyStatsData {
  total_items: number;
  active_items: number;
  expiring_soon_items: number;
  expired_items: number;
}

export interface CreateWarrantyItemPayload {
  project_id: string;
  unit: string;
  customer_name?: string;
  item_name: string;
  category: WarrantyItemCategory;
  brand: string;
  model_no?: string;
  serial_number?: string;
  location: string;
  quantity?: number;
  warranty_start_date: string;
  warranty_end_date: string;
  coverage_details?: string;
}

// 3. Utility Ticket Interfaces
export interface UtilityTicketItem {
  id: number;
  uuid: string;
  ticket_number: string;
  queue_serial: number;
  project_id: string;
  project_name?: string | null;
  unit: string;
  customer_name: string;
  customer_phone?: string | null;
  category: UtilityTicketCategory;
  description: string;
  priority: UtilityTicketPriority;
  status: UtilityTicketStatus;
  technician_id?: number | null;
  technician?: {
    id: number;
    uuid: string;
    name: string;
    phone: string;
    specialty: string;
    technician_type: string;
  } | null;
  warranty_item_id?: number | null;
  warranty_item?: {
    id: number;
    uuid: string;
    item_name: string;
    brand: string;
    category: string;
    warranty_end_date: string;
  } | null;
  cost_type: UtilityTicketCostType;
  estimated_charge: number;
  estimated_charge_formatted: string;
  actual_charge?: number | null;
  assigned_at?: string | null;
  resolved_at?: string | null;
  handed_over_at?: string | null;
  closed_at?: string | null;
  resolution_notes?: string | null;
  customer_feedback?: string | null;
  customer_rating?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UtilityTicketStatsData {
  total_tickets: number;
  active_queue: number;
  open_count: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  handed_over_count: number;
  closed_count: number;
  free_count: number;
  paid_count: number;
  total_collected_charges: number;
  total_collected_charges_formatted: string;
}

export interface CreateUtilityTicketPayload {
  project_id: string;
  unit: string;
  customer_name: string;
  customer_phone?: string;
  category: UtilityTicketCategory;
  description: string;
  priority?: UtilityTicketPriority;
  technician_id?: number;
  warranty_item_id?: number;
  estimated_charge?: number;
}

export interface UpdateTicketStatusPayload {
  status: UtilityTicketStatus;
  resolution_notes?: string;
  actual_charge?: number;
  customer_feedback?: string;
  customer_rating?: number;
}

export interface UtilityDropdownMeta {
  categories: UtilityTicketCategory[];
  priorities: UtilityTicketPriority[];
  statuses: UtilityTicketStatus[];
  technicians: Array<{
    id: number;
    uuid: string;
    name: string;
    phone: string;
    specialty: string;
  }>;
  warranty_items: Array<{
    id: number;
    uuid: string;
    item_name: string;
    brand: string;
    unit: string;
    category: string;
    warranty_end_date: string;
    is_active_warranty: boolean;
  }>;
}

// ==========================================
// API Methods
// ==========================================

export async function getUtilityTicketStats(
  projectId?: string,
): Promise<UtilityTicketStatsData> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/utility/tickets/stats", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    total_tickets: Number(raw?.total_tickets || 0),
    active_queue: Number(raw?.active_queue || 0),
    open_count: Number(raw?.open_count || 0),
    assigned_count: Number(raw?.assigned_count || 0),
    in_progress_count: Number(raw?.in_progress_count || 0),
    resolved_count: Number(raw?.resolved_count || 0),
    handed_over_count: Number(raw?.handed_over_count || 0),
    closed_count: Number(raw?.closed_count || 0),
    free_count: Number(raw?.free_count || 0),
    paid_count: Number(raw?.paid_count || 0),
    total_collected_charges: Number(raw?.total_collected_charges || 0),
    total_collected_charges_formatted:
      raw?.total_collected_charges_formatted || "৳ 0",
  };
}

export async function getUtilityTickets(params?: {
  project_id?: string;
  tab?: string;
  status?: string;
  category?: string;
  priority?: string;
  cost_type?: string;
  technician_id?: number;
  search?: string;
  is_deleted?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<{
  items: UtilityTicketItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.is_deleted === false) delete queryParams.is_deleted;
  if (queryParams.tab === "all") delete queryParams.tab;
  if (queryParams.status === "all") delete queryParams.status;
  if (queryParams.category === "all") delete queryParams.category;
  if (queryParams.cost_type === "all") delete queryParams.cost_type;

  const res = await api.get("/customer-service/utility/tickets", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: raw?.meta || {
      total: 0,
      page: 1,
      limit: 10,
      total_pages: 1,
    },
  };
}

export async function getUtilityTicketDropdownMeta(
  projectId?: string,
): Promise<UtilityDropdownMeta> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/utility/tickets/dropdown/meta", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    categories: raw?.categories || [
      "Plumbing",
      "Electrical",
      "Sanitary",
      "Other",
    ],
    priorities: raw?.priorities || ["Low", "Medium", "High", "Emergency"],
    statuses: raw?.statuses || [
      "Open",
      "Assigned",
      "In Progress",
      "Resolved",
      "Handed Over",
      "Closed",
    ],
    technicians: Array.isArray(raw?.technicians) ? raw.technicians : [],
    warranty_items: Array.isArray(raw?.warranty_items)
      ? raw.warranty_items
      : [],
  };
}

export async function createUtilityTicket(
  payload: CreateUtilityTicketPayload,
): Promise<UtilityTicketItem> {
  const res = await api.post("/customer-service/utility/tickets", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function assignUtilityTicketTechnician(
  uuid: string,
  technician_id: number,
): Promise<UtilityTicketItem> {
  const res = await api.patch(
    `/customer-service/utility/tickets/${uuid}/assign`,
    { technician_id },
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateUtilityTicketStatus(
  uuid: string,
  payload: UpdateTicketStatusPayload,
): Promise<UtilityTicketItem> {
  const res = await api.patch(
    `/customer-service/utility/tickets/${uuid}/status`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteUtilityTicket(uuid: string): Promise<void> {
  await api.delete(`/customer-service/utility/tickets/${uuid}`);
}

// ------------------------------------------
// Technicians API
// ------------------------------------------

export async function getUtilityTechnicians(params?: {
  project_id?: string;
  specialty?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: UtilityTechnicianItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const res = await api.get("/customer-service/utility/technicians", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: raw?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 },
  };
}

export async function createUtilityTechnician(
  payload: CreateTechnicianPayload,
): Promise<UtilityTechnicianItem> {
  const res = await api.post("/customer-service/utility/technicians", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteUtilityTechnician(uuid: string): Promise<void> {
  await api.delete(`/customer-service/utility/technicians/${uuid}`);
}

// ------------------------------------------
// Warranty Registry API
// ------------------------------------------

export async function getWarrantyStats(
  projectId?: string,
): Promise<WarrantyStatsData> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/utility/warranty-items/stats", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    total_items: Number(raw?.total_items || 0),
    active_items: Number(raw?.active_items || 0),
    expiring_soon_items: Number(raw?.expiring_soon_items || 0),
    expired_items: Number(raw?.expired_items || 0),
  };
}

export async function getWarrantyItems(params?: {
  project_id?: string;
  category?: string;
  status?: string;
  search?: string;
  unit?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: WarrantyRegistryItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const res = await api.get("/customer-service/utility/warranty-items", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: raw?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 },
  };
}

export async function createWarrantyItem(
  payload: CreateWarrantyItemPayload,
): Promise<WarrantyRegistryItem> {
  const res = await api.post(
    "/customer-service/utility/warranty-items",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteWarrantyItem(uuid: string): Promise<void> {
  await api.delete(`/customer-service/utility/warranty-items/${uuid}`);
}
