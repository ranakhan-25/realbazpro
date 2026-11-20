import api from "@/lib/api";

export type RateBasis = "PER_SQFT" | "FIXED_PER_FLAT";

export type ServiceChargePaymentStatus = "PAID" | "PARTIAL" | "DUE" | "OVERDUE";

export type BuildingIncomeType =
  | "COMMUNITY_HALL"
  | "ROOFTOP_RENT"
  | "PARKING"
  | "SWIMMING_POOL"
  | "MOSQUE"
  | "OTHER";

export type BuildingExpenseType =
  "SECURITY" | "LIFT" | "UTILITIES" | "CLEANING" | "MAINTENANCE" | "OTHER";

// =========================================================================
// 1. DOMAIN INTERFACES
// =========================================================================

export interface ServiceChargeRate {
  id: number | null;
  uuid: string | null;
  project_id: string;
  project_name?: string | null;
  rate_basis: RateBasis;
  rate_per_sqft: number;
  fixed_rate_per_flat: number;
  due_day_of_month: number;
  notes?: string | null;
  is_configured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FlatServiceChargeItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  flat_number: string;
  resident_name: string;
  resident_phone?: string | null;
  flat_size_sqft: number;
  billing_month: string;
  rate_applied: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: ServiceChargePaymentStatus;
  due_date: string;
  payment_date?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BuildingIncomeItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  income_type: BuildingIncomeType;
  title: string;
  amount: number;
  income_date: string;
  received_from?: string | null;
  source_reference?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BuildingExpenseItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  expense_type: BuildingExpenseType;
  title: string;
  vendor_name?: string | null;
  amount: number;
  expense_date: string;
  invoice_reference?: string | null;
  payment_status: "PAID" | "PENDING";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlySummaryData {
  project_id: string;
  billing_month: string;
  summary: {
    total_gross_income: number;
    total_expenses: number;
    net_balance: number;
    financial_status: "SURPLUS" | "DEFICIT";
  };
  service_charges: {
    total_receivable: number;
    collected: number;
    due: number;
    collection_rate_percent: number;
    flats_count: number;
  };
  extra_incomes: {
    total: number;
    breakdown: {
      COMMUNITY_HALL: number;
      ROOFTOP_RENT: number;
      PARKING: number;
      SWIMMING_POOL: number;
      MOSQUE: number;
      OTHER: number;
    };
  };
  expenses: {
    total: number;
    breakdown: {
      SECURITY: number;
      LIFT: number;
      UTILITIES: number;
      CLEANING: number;
      MAINTENANCE: number;
      OTHER: number;
    };
  };
  cross_module_feeds: {
    parking: {
      active_external_rentals_count: number;
      monthly_rent_expected: number;
      monthly_rent_collected: number;
      feed_included_in_income: boolean;
    };
    security: {
      active_companies_count: number;
      contracted_monthly_cost: number;
      feed_included_in_expense: boolean;
    };
  };
}

// =========================================================================
// 2. PAYLOADS
// =========================================================================

export interface UpsertRatePayload {
  project_id: string;
  rate_basis: RateBasis;
  rate_per_sqft?: number;
  fixed_rate_per_flat?: number;
  due_day_of_month?: number;
  notes?: string;
}

export interface GenerateChargesPayload {
  project_id: string;
  billing_month: string;
  due_date?: string;
  flats?: Array<{
    flat_number: string;
    resident_name: string;
    resident_phone?: string;
    flat_size_sqft?: number;
  }>;
}

export interface CreateFlatChargePayload {
  project_id: string;
  flat_number: string;
  resident_name: string;
  resident_phone?: string;
  flat_size_sqft?: number;
  billing_month: string;
  total_amount?: number;
  due_date?: string;
  notes?: string;
}

export interface CollectPaymentPayload {
  paid_amount: number;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

export interface CreateIncomePayload {
  project_id: string;
  income_type: BuildingIncomeType;
  title: string;
  amount: number;
  income_date: string;
  received_from?: string;
  source_reference?: string;
  notes?: string;
}

export interface UpdateIncomePayload {
  income_type?: BuildingIncomeType;
  title?: string;
  amount?: number;
  income_date?: string;
  received_from?: string;
  source_reference?: string;
  notes?: string;
}

export interface CreateExpensePayload {
  project_id: string;
  expense_type: BuildingExpenseType;
  title: string;
  vendor_name?: string;
  amount: number;
  expense_date: string;
  invoice_reference?: string;
  payment_status?: "PAID" | "PENDING";
  notes?: string;
}

export interface UpdateExpensePayload {
  expense_type?: BuildingExpenseType;
  title?: string;
  vendor_name?: string;
  amount?: number;
  expense_date?: string;
  invoice_reference?: string;
  payment_status?: "PAID" | "PENDING";
  notes?: string;
}

// =========================================================================
// 3. API FUNCTIONS
// =========================================================================

export async function getServiceChargeRate(
  projectId: string,
): Promise<ServiceChargeRate> {
  const res = await api.get("/customer-service/service-charge/rate", {
    params: { project_id: projectId },
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function upsertServiceChargeRate(
  payload: UpsertRatePayload,
): Promise<ServiceChargeRate> {
  const res = await api.put("/customer-service/service-charge/rate", payload);
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function generateMonthlyCharges(payload: GenerateChargesPayload) {
  const res = await api.post(
    "/customer-service/service-charge/generate",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createFlatCharge(
  payload: CreateFlatChargePayload,
): Promise<FlatServiceChargeItem> {
  const res = await api.post(
    "/customer-service/service-charge/charges",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getFlatServiceCharges(params: {
  project_id?: string;
  billing_month?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: FlatServiceChargeItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  stats: {
    total_flats: number;
    total_receivable: number;
    total_collected: number;
    total_due: number;
    collection_rate_percent: number;
    paid_count: number;
    due_count: number;
  };
}> {
  const q: Record<string, unknown> = { ...params };
  if (q.payment_status === "all") delete q.payment_status;
  const res = await api.get("/customer-service/service-charge/charges", {
    params: q,
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function collectChargePayment(
  uuid: string,
  payload: CollectPaymentPayload,
): Promise<FlatServiceChargeItem> {
  const res = await api.patch(
    `/customer-service/service-charge/charges/${uuid}/payment`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createBuildingIncome(
  payload: CreateIncomePayload,
): Promise<BuildingIncomeItem> {
  const res = await api.post(
    "/customer-service/service-charge/incomes",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getBuildingIncomes(params: {
  project_id?: string;
  income_type?: string;
  month?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: BuildingIncomeItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  stats: { total_income: number; by_category: Record<string, number> };
}> {
  const q: Record<string, unknown> = { ...params };
  if (q.income_type === "all") delete q.income_type;
  const res = await api.get("/customer-service/service-charge/incomes", {
    params: q,
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateBuildingIncome(
  uuid: string,
  payload: UpdateIncomePayload,
): Promise<BuildingIncomeItem> {
  const res = await api.patch(
    `/customer-service/service-charge/incomes/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteBuildingIncome(uuid: string): Promise<void> {
  await api.delete(`/customer-service/service-charge/incomes/${uuid}`);
}

export async function createBuildingExpense(
  payload: CreateExpensePayload,
): Promise<BuildingExpenseItem> {
  const res = await api.post(
    "/customer-service/service-charge/expenses",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getBuildingExpenses(params: {
  project_id?: string;
  expense_type?: string;
  month?: string;
  start_date?: string;
  end_date?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: BuildingExpenseItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  stats: { total_expense: number; by_category: Record<string, number> };
}> {
  const q: Record<string, unknown> = { ...params };
  if (q.expense_type === "all") delete q.expense_type;
  if (q.payment_status === "all") delete q.payment_status;
  const res = await api.get("/customer-service/service-charge/expenses", {
    params: q,
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateBuildingExpense(
  uuid: string,
  payload: UpdateExpensePayload,
): Promise<BuildingExpenseItem> {
  const res = await api.patch(
    `/customer-service/service-charge/expenses/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteBuildingExpense(uuid: string): Promise<void> {
  await api.delete(`/customer-service/service-charge/expenses/${uuid}`);
}

export async function getMonthlySummary(
  projectId: string,
  month?: string,
): Promise<MonthlySummaryData> {
  const res = await api.get("/customer-service/service-charge/summary", {
    params: { project_id: projectId, month },
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}
