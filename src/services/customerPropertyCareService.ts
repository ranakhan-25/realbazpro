import api from "@/lib/api";

// =============================================================
// 1. WARRANTY & DLP CLAIMS
// =============================================================
export type DlpDefectCategory =
  | "Water Seepage"
  | "Plumbing & Drainage"
  | "Structural Crack"
  | "Electrical & Wiring"
  | "Doors & Windows"
  | "Tiles & Finishing"
  | "Other";

export type DlpSeverity = "Critical Structural" | "Major" | "Minor";

export type DlpClaimStatus =
  | "Claim Logged"
  | "Site Inspected"
  | "Rectification in Progress"
  | "Resolved & Signed Off";

export interface WarrantyDlpClaim {
  id: string; // e.g. "DLP-2026-0001"
  uuid?: string;
  claimNo: string;
  claim_no?: string;
  customerName: string;
  customer_name?: string;
  unit: string;
  project: string;
  project_name?: string;
  project_id?: string | null;
  possessionDate: string;
  possession_date?: string;
  dlpExpiryDate: string;
  dlp_expiry_date?: string;
  defectCategory: DlpDefectCategory;
  defect_category?: DlpDefectCategory;
  severity: DlpSeverity;
  assignedEngineer?: string;
  assigned_engineer?: string;
  status: DlpClaimStatus;
  rectificationNotes?: string;
  rectification_notes?: string;
  signedOffAt?: string | null;
  signed_off_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DlpStatsResult {
  totalClaims: number;
  inProgressClaims: number;
  resolvedClaims: number;
  criticalClaims: number;
}

export interface QueryDlpClaimsParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: string;
  project_id?: string;
  defect_category?: string;
  severity?: string;
  status?: string;
}

export interface CreateDlpClaimPayload {
  customer_name: string;
  unit: string;
  project_id?: string;
  project_name?: string;
  booking_id?: string;
  customer_profile_id?: number;
  possession_date?: string;
  dlp_expiry_date?: string;
  defect_category?: DlpDefectCategory;
  severity?: DlpSeverity;
  assigned_engineer?: string;
  assigned_engineer_id?: number;
  rectification_notes?: string;
}

export interface UpdateDlpClaimPayload extends Partial<CreateDlpClaimPayload> {
  status?: DlpClaimStatus;
  signed_off_at?: string;
}

export async function getDlpClaimStats(params?: {
  project_id?: string;
}): Promise<DlpStatsResult> {
  const res = await api.get(
    "/customer-service/property-care/dlp-claims/stats",
    { params },
  );
  return res.data?.data ?? res.data;
}

export async function getDlpClaims(params?: QueryDlpClaimsParams): Promise<{
  items: WarrantyDlpClaim[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const res = await api.get("/customer-service/property-care/dlp-claims", {
    params,
  });
  return res.data?.data ?? res.data;
}

export async function getDlpClaimByUuid(
  uuid: string,
): Promise<WarrantyDlpClaim> {
  const res = await api.get(
    `/customer-service/property-care/dlp-claims/${uuid}`,
  );
  return res.data?.data ?? res.data;
}

export async function createDlpClaim(
  payload: CreateDlpClaimPayload,
): Promise<WarrantyDlpClaim> {
  const res = await api.post(
    "/customer-service/property-care/dlp-claims",
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function updateDlpClaim(
  uuid: string,
  payload: UpdateDlpClaimPayload,
): Promise<WarrantyDlpClaim> {
  const res = await api.patch(
    `/customer-service/property-care/dlp-claims/${uuid}`,
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function advanceDlpClaimStage(
  uuid: string,
): Promise<WarrantyDlpClaim> {
  const res = await api.patch(
    `/customer-service/property-care/dlp-claims/${uuid}/advance`,
  );
  return res.data?.data ?? res.data;
}

export async function deleteDlpClaim(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(
    `/customer-service/property-care/dlp-claims/${uuid}`,
  );
  return res.data?.data ?? res.data;
}

// =============================================================
// 2. MAINTENANCE REQUESTS
// =============================================================
export type MaintenanceType =
  "Preventive" | "Emergency Breakdown" | "Statutory Annual" | "Routine Service";

export type MaintenanceStatus =
  "Scheduled" | "In Progress" | "Completed" | "Pending Parts";

export interface MaintenanceItem {
  id: string; // e.g. "MNT-501"
  uuid?: string;
  facility: string;
  project: string;
  project_name?: string;
  project_id?: string | null;
  maintenanceType: MaintenanceType;
  maintenance_type?: MaintenanceType;
  scheduledDate: string;
  scheduled_date?: string;
  vendorName: string;
  vendor_name?: string;
  vendor_id?: number | null;
  costEstimate: number;
  cost_estimate?: number;
  actualCost?: number | null;
  actual_cost?: number | null;
  status: MaintenanceStatus;
  completionDate?: string | null;
  completion_date?: string | null;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceStatsResult {
  totalScheduled: number;
  inProgress: number;
  completed: number;
  totalCostEstimate: number;
}

export interface QueryMaintenanceParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: string;
  project_id?: string;
  maintenance_type?: string;
  status?: string;
}

export interface CreateMaintenancePayload {
  facility: string;
  project_id?: string;
  project_name?: string;
  maintenance_type?: MaintenanceType;
  scheduled_date?: string;
  vendor_name?: string;
  vendor_id?: number;
  cost_estimate?: number;
  actual_cost?: number;
  status?: MaintenanceStatus;
  remarks?: string;
}

export interface UpdateMaintenancePayload extends Partial<CreateMaintenancePayload> {
  completion_date?: string;
}

export async function getMaintenanceStats(params?: {
  project_id?: string;
}): Promise<MaintenanceStatsResult> {
  const res = await api.get(
    "/customer-service/property-care/maintenance-requests/stats",
    { params },
  );
  return res.data?.data ?? res.data;
}

export async function getMaintenanceRequests(
  params?: QueryMaintenanceParams,
): Promise<{
  items: MaintenanceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const res = await api.get(
    "/customer-service/property-care/maintenance-requests",
    { params },
  );
  return res.data?.data ?? res.data;
}

export async function getMaintenanceByUuid(
  uuid: string,
): Promise<MaintenanceItem> {
  const res = await api.get(
    `/customer-service/property-care/maintenance-requests/${uuid}`,
  );
  return res.data?.data ?? res.data;
}

export async function createMaintenanceRequest(
  payload: CreateMaintenancePayload,
): Promise<MaintenanceItem> {
  const res = await api.post(
    "/customer-service/property-care/maintenance-requests",
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function updateMaintenanceRequest(
  uuid: string,
  payload: UpdateMaintenancePayload,
): Promise<MaintenanceItem> {
  const res = await api.patch(
    `/customer-service/property-care/maintenance-requests/${uuid}`,
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function completeMaintenanceRequest(
  uuid: string,
  payload?: { actual_cost?: number; remarks?: string },
): Promise<MaintenanceItem> {
  const res = await api.patch(
    `/customer-service/property-care/maintenance-requests/${uuid}/complete`,
    payload ?? {},
  );
  return res.data?.data ?? res.data;
}

export async function deleteMaintenanceRequest(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(
    `/customer-service/property-care/maintenance-requests/${uuid}`,
  );
  return res.data?.data ?? res.data;
}

// =============================================================
// 3. FLAT OWNERS ASSOCIATIONS (OA)
// =============================================================
export type AssociationGovernanceStatus =
  "Developer Managing" | "Ad-hoc Committee" | "Formally Handed Over to OA";

export interface AssociationRecord {
  id: string; // e.g. "OA-01"
  uuid?: string;
  associationCode?: string;
  association_code?: string;
  project: string;
  project_name?: string;
  project_id?: string | null;
  associationName: string;
  association_name?: string;
  presidentName: string;
  president_name?: string;
  contactPhone?: string;
  contact_phone?: string;
  totalFlats: number;
  total_flats?: number;
  handedOverCount: number;
  handed_over_count?: number;
  monthlyServiceChargePerFlat: number;
  monthly_service_charge_per_flat?: number;
  associationBankAcc?: string;
  association_bank_acc?: string;
  handoverStatus: AssociationGovernanceStatus;
  handover_status?: AssociationGovernanceStatus;
  transitionDate?: string;
  transition_date?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssociationStatsResult {
  totalAssociations: number;
  handedOverCount: number;
  developerManagingCount: number;
  adHocCount: number;
  avgServiceCharge: number;
}

export interface QueryOwnersAssociationParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: string;
  project_id?: string;
  handover_status?: string;
}

export interface CreateOwnersAssociationPayload {
  project_name: string;
  project_id?: string;
  association_code?: string;
  association_name: string;
  president_name: string;
  contact_phone?: string;
  total_flats: number;
  handed_over_count: number;
  monthly_service_charge_per_flat: number;
  association_bank_acc?: string;
  handover_status?: AssociationGovernanceStatus;
  transition_date?: string;
  remarks?: string;
}

export type UpdateOwnersAssociationPayload =
  Partial<CreateOwnersAssociationPayload>;

export async function getOwnersAssociationStats(params?: {
  project_id?: string;
}): Promise<AssociationStatsResult> {
  const res = await api.get(
    "/customer-service/property-care/owners-associations/stats",
    { params },
  );
  return res.data?.data ?? res.data;
}

export async function getOwnersAssociations(
  params?: QueryOwnersAssociationParams,
): Promise<{
  items: AssociationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const res = await api.get(
    "/customer-service/property-care/owners-associations",
    { params },
  );
  return res.data?.data ?? res.data;
}

export async function getOwnersAssociationByUuid(
  uuid: string,
): Promise<AssociationRecord> {
  const res = await api.get(
    `/customer-service/property-care/owners-associations/${uuid}`,
  );
  return res.data?.data ?? res.data;
}

export async function createOwnersAssociation(
  payload: CreateOwnersAssociationPayload,
): Promise<AssociationRecord> {
  const res = await api.post(
    "/customer-service/property-care/owners-associations",
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function updateOwnersAssociation(
  uuid: string,
  payload: UpdateOwnersAssociationPayload,
): Promise<AssociationRecord> {
  const res = await api.patch(
    `/customer-service/property-care/owners-associations/${uuid}`,
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function deleteOwnersAssociation(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(
    `/customer-service/property-care/owners-associations/${uuid}`,
  );
  return res.data?.data ?? res.data;
}
