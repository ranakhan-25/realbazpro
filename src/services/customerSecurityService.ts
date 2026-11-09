import api from "@/lib/api";

export type SecurityCompanyStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "TERMINATED";

export type GuardSource = "IN_HOUSE" | "COMPANY";

export type GuardStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE" | "TERMINATED";

export type ShiftName = "Morning" | "Evening" | "Night" | "Custom";

export type RosterStatus =
  | "SCHEDULED"
  | "ON_DUTY"
  | "COMPLETED"
  | "ABSENT"
  | "RELIEVED";

export type VisitorPurpose =
  | "Delivery"
  | "Guest / Personal"
  | "Contractor / Maintenance"
  | "Official / Courier"
  | "Other";

export type VisitorStatus = "CHECKED_IN" | "CHECKED_OUT";

// =========================================================================
// 1. DOMAIN INTERFACES
// =========================================================================

export interface SecurityCompanyItem {
  id: number;
  uuid: string;
  project_id?: string | null;
  project_name?: string | null;
  name: string;
  contact_person: string;
  phone: string;
  email?: string | null;
  contract_start: string;
  contract_end: string;
  monthly_cost: number;
  monthly_cost_formatted: string;
  liability_note: string;
  status: SecurityCompanyStatus;
  is_expiring_soon: boolean;
  is_expired: boolean;
  days_until_expiry: number;
  created_at?: string;
  updated_at?: string;
}

export interface SecurityGuardItem {
  id: number;
  uuid: string;
  project_id?: string | null;
  project_name?: string | null;
  name: string;
  phone: string;
  national_id: string;
  source: GuardSource;
  company_id?: number | null;
  company?: {
    id: number;
    uuid: string;
    name: string;
    contact_person?: string;
    phone?: string;
    status?: string;
  } | null;
  badge_number?: string | null;
  status: GuardStatus;
  joined_date: string;
  emergency_contact?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SecurityRosterItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  guard_id: number;
  guard?: {
    id: number;
    uuid: string;
    name: string;
    phone: string;
    source: GuardSource;
    badge_number?: string | null;
    company_name?: string | null;
  } | null;
  duty_date: string;
  shift_name: ShiftName;
  shift_start: string;
  shift_end: string;
  shift_timing: string;
  post_location: string;
  status: RosterStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyRosterDay {
  date: string;
  dayName: string;
}

export interface WeeklyRosterGuardRow {
  guard_id: number;
  guard_name: string;
  guard_phone: string;
  guard_source: string;
  company_name: string | null;
  shifts: Record<string, SecurityRosterItem[]>;
}

export interface WeeklyRosterData {
  start_date: string;
  end_date: string;
  days: WeeklyRosterDay[];
  matrix: WeeklyRosterGuardRow[];
}

export interface SecurityVisitorLogItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  visitor_name: string;
  phone: string;
  flat_visited: string;
  purpose: VisitorPurpose;
  in_time: string;
  out_time?: string | null;
  guard_on_duty_id?: number | null;
  guard_on_duty?: {
    id: number;
    uuid: string;
    name: string;
    badge_number?: string | null;
  } | null;
  vehicle_number?: string | null;
  national_id_or_badge?: string | null;
  status: VisitorStatus;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SecurityStatsData {
  total_guards: number;
  in_house_guards: number;
  company_guards: number;
  active_companies: number;
  expiring_contracts_count: number;
  on_duty_today: number;
  active_visitors_inside: number;
  monthly_cost: number;
  monthly_cost_formatted: string;
}

export interface MonthlySecurityCostContract {
  id: number;
  name: string;
  monthly_cost: number;
  monthly_cost_formatted: string;
}

export interface MonthlySecurityCostData {
  project_id?: string | null;
  month: string;
  year: number;
  company_contracts_total: number;
  active_companies_count: number;
  in_house_guards_count: number;
  company_guards_count: number;
  total_active_guards: number;
  grand_monthly_cost: number;
  formatted_monthly_cost: string;
  contracts: MonthlySecurityCostContract[];
}

export interface SecurityDropdownMeta {
  companies: Array<{
    id: number;
    uuid: string;
    name: string;
    contact_person: string;
    phone: string;
  }>;
  guards: Array<{
    id: number;
    uuid: string;
    name: string;
    phone: string;
    source: GuardSource;
    badge_number?: string | null;
  }>;
  sources: GuardSource[];
  guard_statuses: GuardStatus[];
  shift_names: ShiftName[];
  roster_statuses: RosterStatus[];
  purposes: VisitorPurpose[];
}

// =========================================================================
// 2. REQUEST PAYLOADS
// =========================================================================

export interface CreateSecurityCompanyPayload {
  name: string;
  contact_person: string;
  phone: string;
  email?: string;
  contract_start: string;
  contract_end: string;
  monthly_cost: number;
  liability_note?: string;
  status?: SecurityCompanyStatus;
  project_id?: string;
}

export interface UpdateSecurityCompanyPayload {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  contract_start?: string;
  contract_end?: string;
  monthly_cost?: number;
  liability_note?: string;
  status?: SecurityCompanyStatus;
  project_id?: string;
}

export interface CreateSecurityGuardPayload {
  name: string;
  phone: string;
  national_id: string;
  source: GuardSource;
  company_id?: number;
  badge_number?: string;
  status?: GuardStatus;
  joined_date: string;
  emergency_contact?: string;
  project_id?: string;
}

export interface UpdateSecurityGuardPayload {
  name?: string;
  phone?: string;
  national_id?: string;
  source?: GuardSource;
  company_id?: number;
  badge_number?: string;
  status?: GuardStatus;
  joined_date?: string;
  emergency_contact?: string;
  project_id?: string;
}

export interface CreateSecurityRosterPayload {
  project_id: string;
  guard_id: number;
  duty_date: string;
  shift_name: ShiftName;
  shift_start: string;
  shift_end: string;
  post_location: string;
  status?: RosterStatus;
  notes?: string;
}

export interface UpdateSecurityRosterPayload {
  project_id?: string;
  guard_id?: number;
  duty_date?: string;
  shift_name?: ShiftName;
  shift_start?: string;
  shift_end?: string;
  post_location?: string;
  status?: RosterStatus;
  notes?: string;
}

export interface UpdateRosterStatusPayload {
  status: RosterStatus;
  notes?: string;
}

export interface CheckInVisitorPayload {
  project_id: string;
  visitor_name: string;
  phone: string;
  flat_visited: string;
  purpose: VisitorPurpose;
  in_time?: string;
  guard_on_duty_id?: number;
  vehicle_number?: string;
  national_id_or_badge?: string;
  remarks?: string;
}

export interface CheckOutVisitorPayload {
  out_time?: string;
  remarks?: string;
}

// =========================================================================
// 3. API METHODS
// =========================================================================

// --- Stats & Financials ---
export async function getSecurityStats(
  projectId?: string,
): Promise<SecurityStatsData> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/security/stats", { params });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    total_guards: Number(raw?.total_guards || 0),
    in_house_guards: Number(raw?.in_house_guards || 0),
    company_guards: Number(raw?.company_guards || 0),
    active_companies: Number(raw?.active_companies || 0),
    expiring_contracts_count: Number(raw?.expiring_contracts_count || 0),
    on_duty_today: Number(raw?.on_duty_today || 0),
    active_visitors_inside: Number(raw?.active_visitors_inside || 0),
    monthly_cost: Number(raw?.monthly_cost || 0),
    monthly_cost_formatted: raw?.monthly_cost_formatted || "৳ 0",
  };
}

export async function getMonthlySecurityCost(
  projectId?: string,
): Promise<MonthlySecurityCostData> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/security/monthly-cost", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    project_id: raw?.project_id || null,
    month: raw?.month || "",
    year: Number(raw?.year || new Date().getFullYear()),
    company_contracts_total: Number(raw?.company_contracts_total || 0),
    active_companies_count: Number(raw?.active_companies_count || 0),
    in_house_guards_count: Number(raw?.in_house_guards_count || 0),
    company_guards_count: Number(raw?.company_guards_count || 0),
    total_active_guards: Number(raw?.total_active_guards || 0),
    grand_monthly_cost: Number(raw?.grand_monthly_cost || 0),
    formatted_monthly_cost: raw?.formatted_monthly_cost || "৳ 0",
    contracts: Array.isArray(raw?.contracts) ? raw.contracts : [],
  };
}

export async function getSecurityDropdownMeta(
  projectId?: string,
): Promise<SecurityDropdownMeta> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/security/dropdown/meta", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    companies: Array.isArray(raw?.companies) ? raw.companies : [],
    guards: Array.isArray(raw?.guards) ? raw.guards : [],
    sources: Array.isArray(raw?.sources) ? raw.sources : ["IN_HOUSE", "COMPANY"],
    guard_statuses: Array.isArray(raw?.guard_statuses)
      ? raw.guard_statuses
      : ["ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"],
    shift_names: Array.isArray(raw?.shift_names)
      ? raw.shift_names
      : ["Morning", "Evening", "Night", "Custom"],
    roster_statuses: Array.isArray(raw?.roster_statuses)
      ? raw.roster_statuses
      : ["SCHEDULED", "ON_DUTY", "COMPLETED", "ABSENT", "RELIEVED"],
    purposes: Array.isArray(raw?.purposes)
      ? raw.purposes
      : [
          "Delivery",
          "Guest / Personal",
          "Contractor / Maintenance",
          "Official / Courier",
          "Other",
        ],
  };
}

// --- 1. Security Companies ---
export async function getSecurityCompanies(params?: {
  project_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: SecurityCompanyItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.status === "all") delete queryParams.status;

  const res = await api.get("/customer-service/security/companies", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function getExpiringCompanies(
  projectId?: string,
): Promise<{ items: SecurityCompanyItem[]; count: number }> {
  const params: Record<string, string> = {};
  if (projectId && projectId !== "all") {
    params.project_id = projectId;
  }
  const res = await api.get("/customer-service/security/companies/expiring", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    count: Number(raw?.count || 0),
  };
}

export async function getCompanyByUuid(uuid: string): Promise<SecurityCompanyItem> {
  const res = await api.get(`/customer-service/security/companies/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createSecurityCompany(
  payload: CreateSecurityCompanyPayload,
): Promise<SecurityCompanyItem> {
  const res = await api.post("/customer-service/security/companies", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateSecurityCompany(
  uuid: string,
  payload: UpdateSecurityCompanyPayload,
): Promise<SecurityCompanyItem> {
  const res = await api.patch(
    `/customer-service/security/companies/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteSecurityCompany(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/security/companies/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// --- 2. Security Guards ---
export async function getSecurityGuards(params?: {
  project_id?: string;
  source?: string;
  company_id?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: SecurityGuardItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.source === "all") delete queryParams.source;
  if (queryParams.status === "all") delete queryParams.status;

  const res = await api.get("/customer-service/security/guards", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function getGuardByUuid(uuid: string): Promise<SecurityGuardItem> {
  const res = await api.get(`/customer-service/security/guards/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createSecurityGuard(
  payload: CreateSecurityGuardPayload,
): Promise<SecurityGuardItem> {
  const res = await api.post("/customer-service/security/guards", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateSecurityGuard(
  uuid: string,
  payload: UpdateSecurityGuardPayload,
): Promise<SecurityGuardItem> {
  const res = await api.patch(
    `/customer-service/security/guards/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteSecurityGuard(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/security/guards/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// --- 3. Duty Roster & Shifts ---
export async function getSecurityRosters(params?: {
  project_id?: string;
  guard_id?: number;
  duty_date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  shift_name?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: SecurityRosterItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.status === "all") delete queryParams.status;
  if (queryParams.shift_name === "all") delete queryParams.shift_name;

  const res = await api.get("/customer-service/security/rosters", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 50),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function getWeeklySecurityRoster(
  projectId: string,
  startDate?: string,
): Promise<WeeklyRosterData> {
  const params: Record<string, string> = { project_id: projectId };
  if (startDate) {
    params.start_date = startDate;
  }
  const res = await api.get("/customer-service/security/rosters/weekly", {
    params,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    start_date: raw?.start_date || "",
    end_date: raw?.end_date || "",
    days: Array.isArray(raw?.days) ? raw.days : [],
    matrix: Array.isArray(raw?.matrix) ? raw.matrix : [],
  };
}

export async function createSecurityRoster(
  payload: CreateSecurityRosterPayload,
): Promise<SecurityRosterItem> {
  const res = await api.post("/customer-service/security/rosters", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateSecurityRosterStatus(
  uuid: string,
  payload: UpdateRosterStatusPayload,
): Promise<SecurityRosterItem> {
  const res = await api.patch(
    `/customer-service/security/rosters/${uuid}/status`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateSecurityRoster(
  uuid: string,
  payload: UpdateSecurityRosterPayload,
): Promise<SecurityRosterItem> {
  const res = await api.patch(
    `/customer-service/security/rosters/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteSecurityRoster(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/security/rosters/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

// --- 4. Visitor Log ---
export async function getSecurityVisitorLogs(params?: {
  project_id?: string;
  status?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: SecurityVisitorLogItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const queryParams: Record<string, unknown> = { ...(params || {}) };
  if (queryParams.project_id === "all") delete queryParams.project_id;
  if (queryParams.status === "all") delete queryParams.status;

  const res = await api.get("/customer-service/security/visitors", {
    params: queryParams,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 20),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function getVisitorLogByUuid(
  uuid: string,
): Promise<SecurityVisitorLogItem> {
  const res = await api.get(`/customer-service/security/visitors/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function checkInVisitor(
  payload: CheckInVisitorPayload,
): Promise<SecurityVisitorLogItem> {
  const res = await api.post(
    "/customer-service/security/visitors/check-in",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function checkOutVisitor(
  uuid: string,
  payload?: CheckOutVisitorPayload,
): Promise<SecurityVisitorLogItem> {
  const res = await api.patch(
    `/customer-service/security/visitors/${uuid}/check-out`,
    payload || {},
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteSecurityVisitorLog(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/security/visitors/${uuid}`);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

