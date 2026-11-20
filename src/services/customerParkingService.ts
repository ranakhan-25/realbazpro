import api from "@/lib/api";

export type ParkingSlotStatus = "FREE" | "OCCUPIED" | "RENTED_EXTERNAL";

export type ParkingVehicleType =
  "Car" | "SUV" | "Motorcycle" | "Van / Micro" | "Any";

export type RentalPaymentStatus = "PAID" | "PARTIAL" | "DUE" | "OVERDUE";

export type ExternalRentalStatus = "ACTIVE" | "TERMINATED" | "EXPIRED";

// =========================================================================
// 1. DOMAIN INTERFACES
// =========================================================================

export interface SlotCurrentOccupant {
  type: "RESIDENT" | "EXTERNAL_RENTER";
  assignment_id?: number;
  assignment_uuid?: string;
  flat_number?: string;
  resident_name?: string;
  resident_phone?: string | null;
  rental_id?: number;
  rental_uuid?: string;
  renter_name?: string;
  renter_phone?: string;
  vehicle_number: string;
  vehicle_type: string;
  rfid_tag?: string | null;
  monthly_rent?: number;
  monthly_rent_formatted?: string;
  payment_status?: string;
  start_date: string;
}

export interface ParkingSlotItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  slot_number: string;
  floor_zone: string;
  allowed_vehicle_type: ParkingVehicleType;
  status: ParkingSlotStatus;
  notes?: string | null;
  current_occupant?: SlotCurrentOccupant | null;
  created_at?: string;
  updated_at?: string;
}

export interface ParkingAssignmentItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  slot_id: number;
  slot_number?: string | null;
  floor_zone?: string | null;
  flat_number: string;
  resident_name: string;
  resident_phone?: string | null;
  vehicle_number: string;
  vehicle_type: ParkingVehicleType;
  rfid_tag?: string | null;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  release_date?: string | null;
  release_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ParkingExternalRentalItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  slot_id: number;
  slot_number?: string | null;
  floor_zone?: string | null;
  renter_name: string;
  renter_phone: string;
  renter_nid?: string | null;
  vehicle_number: string;
  vehicle_type: ParkingVehicleType;
  monthly_rent: number;
  monthly_rent_formatted: string;
  deposit_amount: number;
  deposit_amount_formatted: string;
  start_date: string;
  end_date?: string | null;
  payment_status: RentalPaymentStatus;
  amount_collected: number;
  amount_collected_formatted: string;
  balance_due: number;
  balance_due_formatted: string;
  last_payment_date?: string | null;
  status: ExternalRentalStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ParkingIncomeSummary {
  project_id: string | null;
  month: string;
  year: number;
  total_slots: number;
  free_slots: number;
  occupied_slots: number;
  rented_external_slots: number;
  occupancy_rate_percent: number;
  active_external_rentals_count: number;
  monthly_rent_receivable: number;
  monthly_rent_receivable_formatted: string;
  total_rent_collected: number;
  total_rent_collected_formatted: string;
  total_rent_due: number;
  total_rent_due_formatted: string;
  collection_rate_percent: number;
  rentals_breakdown: ParkingExternalRentalItem[];
}

export interface FreeSlotOption {
  id: number;
  uuid: string;
  slot_number: string;
  floor_zone: string;
  allowed_vehicle_type: string;
  project_id: string;
}

export interface ParkingDropdownMeta {
  vehicle_types: string[];
  slot_statuses: string[];
  rental_payment_statuses: string[];
  external_rental_statuses: string[];
  floors_zones: string[];
  free_slots: FreeSlotOption[];
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// =========================================================================
// 2. API REQUEST PAYLOADS
// =========================================================================

export interface CreateParkingSlotPayload {
  project_id: string;
  slot_number: string;
  floor_zone?: string;
  allowed_vehicle_type?: ParkingVehicleType;
  status?: ParkingSlotStatus;
  notes?: string;
}

export interface UpdateParkingSlotPayload {
  slot_number?: string;
  floor_zone?: string;
  allowed_vehicle_type?: ParkingVehicleType;
  status?: ParkingSlotStatus;
  notes?: string;
}

export interface QueryParkingSlotParams {
  project_id?: string;
  floor_zone?: string;
  status?: string;
  allowed_vehicle_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateParkingAssignmentPayload {
  project_id: string;
  slot_id: number;
  flat_number: string;
  resident_name: string;
  resident_phone?: string;
  vehicle_number: string;
  vehicle_type?: ParkingVehicleType;
  rfid_tag?: string;
  start_date: string;
  end_date?: string;
}

export interface ReleaseParkingAssignmentPayload {
  release_date?: string;
  release_reason?: string;
}

export interface QueryParkingAssignmentParams {
  project_id?: string;
  slot_id?: number;
  is_active?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateExternalRentalPayload {
  project_id: string;
  slot_id: number;
  renter_name: string;
  renter_phone: string;
  renter_nid?: string;
  vehicle_number: string;
  vehicle_type?: ParkingVehicleType;
  monthly_rent: number;
  deposit_amount?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface CollectRentalPaymentPayload {
  amount: number;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

export interface TerminateExternalRentalPayload {
  end_date?: string;
  notes?: string;
}

export interface QueryExternalRentalParams {
  project_id?: string;
  slot_id?: number;
  payment_status?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// =========================================================================
// 3. API METHODS
// =========================================================================

export async function getParkingSlots(
  params?: QueryParkingSlotParams,
): Promise<PaginatedResponse<ParkingSlotItem>> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.status === "all") delete queryParams.status;
  if (queryParams.floor_zone === "all") delete queryParams.floor_zone;
  if (queryParams.allowed_vehicle_type === "all")
    delete queryParams.allowed_vehicle_type;

  const res = await api.get("/customer-service/parking/slots", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: raw?.items || [],
    meta: raw?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 },
  };
}

export async function getParkingSlotByUuid(
  uuid: string,
): Promise<ParkingSlotItem> {
  const res = await api.get(`/customer-service/parking/slots/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createParkingSlot(
  payload: CreateParkingSlotPayload,
): Promise<ParkingSlotItem> {
  const res = await api.post("/customer-service/parking/slots", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateParkingSlot(
  uuid: string,
  payload: UpdateParkingSlotPayload,
): Promise<ParkingSlotItem> {
  const res = await api.put(`/customer-service/parking/slots/${uuid}`, payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteParkingSlot(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/parking/slots/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getParkingAssignments(
  params?: QueryParkingAssignmentParams,
): Promise<PaginatedResponse<ParkingAssignmentItem>> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.is_active === "all") delete queryParams.is_active;

  const res = await api.get("/customer-service/parking/assignments", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: raw?.items || [],
    meta: raw?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 },
  };
}

export async function getParkingAssignmentByUuid(
  uuid: string,
): Promise<ParkingAssignmentItem> {
  const res = await api.get(`/customer-service/parking/assignments/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createParkingAssignment(
  payload: CreateParkingAssignmentPayload,
): Promise<ParkingAssignmentItem> {
  const res = await api.post("/customer-service/parking/assignments", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function releaseParkingAssignment(
  uuid: string,
  payload?: ReleaseParkingAssignmentPayload,
): Promise<ParkingAssignmentItem> {
  const res = await api.patch(
    `/customer-service/parking/assignments/${uuid}/release`,
    payload || {},
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getParkingExternalRentals(
  params?: QueryExternalRentalParams,
): Promise<PaginatedResponse<ParkingExternalRentalItem>> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.payment_status === "all") delete queryParams.payment_status;
  if (queryParams.status === "all") delete queryParams.status;

  const res = await api.get("/customer-service/parking/rentals", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: raw?.items || [],
    meta: raw?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 },
  };
}

export async function getParkingExternalRentalByUuid(
  uuid: string,
): Promise<ParkingExternalRentalItem> {
  const res = await api.get(`/customer-service/parking/rentals/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createParkingExternalRental(
  payload: CreateExternalRentalPayload,
): Promise<ParkingExternalRentalItem> {
  const res = await api.post("/customer-service/parking/rentals", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function collectRentalPayment(
  uuid: string,
  payload: CollectRentalPaymentPayload,
): Promise<ParkingExternalRentalItem> {
  const res = await api.patch(
    `/customer-service/parking/rentals/${uuid}/payment`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function terminateExternalRental(
  uuid: string,
  payload?: TerminateExternalRentalPayload,
): Promise<ParkingExternalRentalItem> {
  const res = await api.patch(
    `/customer-service/parking/rentals/${uuid}/terminate`,
    payload || {},
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getParkingIncomeSummary(
  projectId?: string,
): Promise<ParkingIncomeSummary> {
  const params: Record<string, unknown> = {};
  if (projectId && projectId !== "all") params.project_id = projectId;

  const res = await api.get("/customer-service/parking/income-summary", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    project_id: raw?.project_id || null,
    month: raw?.month || "",
    year: raw?.year || new Date().getFullYear(),
    total_slots: Number(raw?.total_slots || 0),
    free_slots: Number(raw?.free_slots || 0),
    occupied_slots: Number(raw?.occupied_slots || 0),
    rented_external_slots: Number(raw?.rented_external_slots || 0),
    occupancy_rate_percent: Number(raw?.occupancy_rate_percent || 0),
    active_external_rentals_count: Number(
      raw?.active_external_rentals_count || 0,
    ),
    monthly_rent_receivable: Number(raw?.monthly_rent_receivable || 0),
    monthly_rent_receivable_formatted:
      raw?.monthly_rent_receivable_formatted || "৳ 0",
    total_rent_collected: Number(raw?.total_rent_collected || 0),
    total_rent_collected_formatted:
      raw?.total_rent_collected_formatted || "৳ 0",
    total_rent_due: Number(raw?.total_rent_due || 0),
    total_rent_due_formatted: raw?.total_rent_due_formatted || "৳ 0",
    collection_rate_percent: Number(raw?.collection_rate_percent || 0),
    rentals_breakdown: raw?.rentals_breakdown || [],
  };
}

export async function getParkingDropdownMeta(
  projectId?: string,
): Promise<ParkingDropdownMeta> {
  const params: Record<string, unknown> = {};
  if (projectId && projectId !== "all") params.project_id = projectId;

  const res = await api.get("/customer-service/parking/dropdown/meta", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    vehicle_types: raw?.vehicle_types || [
      "Car",
      "SUV",
      "Motorcycle",
      "Van / Micro",
      "Any",
    ],
    slot_statuses: raw?.slot_statuses || [
      "FREE",
      "OCCUPIED",
      "RENTED_EXTERNAL",
    ],
    rental_payment_statuses: raw?.rental_payment_statuses || [
      "PAID",
      "PARTIAL",
      "DUE",
      "OVERDUE",
    ],
    external_rental_statuses: raw?.external_rental_statuses || [
      "ACTIVE",
      "TERMINATED",
      "EXPIRED",
    ],
    floors_zones: raw?.floors_zones || [
      "Basement 1 (B1)",
      "Basement 2 (B2)",
      "Ground Floor (GF)",
      "1st Floor (1F)",
      "Outdoor Open Bay",
    ],
    free_slots: raw?.free_slots || [],
  };
}
