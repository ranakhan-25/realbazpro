import api from "@/lib/api";

export interface CustomPermission {
  id: string | number;
  uuid?: string;
  name: string;
  key: string;
  action: string;
  featureId?: number;
  resource?: string;
  context?: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  feature?: {
    id: number | string;
    name: string;
    code?: string;
  };
}

export interface CustomPermissionResponse {
  data: CustomPermission[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious?: boolean;
  };
}

export interface CreateCustomPermissionPayload {
  name: string;
  action: string;
  key?: string;
  featureId?: number;
  resource?: string;
  description?: string;
}

export interface UserPermissionOverrideItem {
  id: string | number;
  uuid?: string;
  name: string;
  key: string;
  action: string;
  resource?: string;
  description?: string | null;
  featureId?: number;
  feature?: {
    id: number | string;
    name: string;
    code?: string;
  };
  override: {
    id: number | string;
    effect: "DENY" | "ALLOW";
    reason?: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface UserCustomPermissionsResponse {
  userId: number;
  totalCount: number;
  totalOverrides: number;
  totalDenied: number;
  totalAllowed: number;
  permissions: UserPermissionOverrideItem[];
}

export interface BulkOverridePayloadItem {
  customPermissionId: number | string;
  effect: "DENY" | "ALLOW" | "INHERIT";
  reason?: string;
}

export async function getCustomPermissions(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    featureId?: number;
  } = {},
): Promise<CustomPermissionResponse> {
  const response = await api.get("/custom-permissions", { params });
  const result = response.data?.data ?? response.data;
  return {
    data: Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [],
    meta: {
      page: Number(result?.meta?.page ?? params.page ?? 1),
      limit: Number(result?.meta?.limit ?? params.limit ?? 20),
      total: Number(result?.meta?.total ?? 0),
      totalPages: Math.max(Number(result?.meta?.totalPages ?? 1), 1),
      hasNext: Boolean(result?.meta?.hasNext ?? false),
      hasPrevious: Boolean(result?.meta?.hasPrevious ?? false),
    },
  };
}

export async function createCustomPermission(
  payload: CreateCustomPermissionPayload,
): Promise<CustomPermission> {
  const response = await api.post("/custom-permissions", payload);
  return response.data?.data ?? response.data;
}

export async function deleteCustomPermission(
  id: string | number,
): Promise<void> {
  await api.delete(`/custom-permissions/${id}`);
}

export async function getUserCustomPermissions(
  userId: string | number,
): Promise<UserCustomPermissionsResponse> {
  const response = await api.get(`/custom-permissions/users/${userId}`);
  return response.data?.data ?? response.data;
}

export async function setUserCustomPermissionOverride(
  userId: string | number,
  payload: {
    customPermissionId: number | string;
    effect: "DENY" | "ALLOW";
    reason?: string;
  },
) {
  const response = await api.post(
    `/custom-permissions/users/${userId}/override`,
    payload,
  );
  return response.data?.data ?? response.data;
}

export async function bulkSetUserCustomPermissionOverrides(
  userId: string | number,
  overrides: BulkOverridePayloadItem[],
): Promise<UserCustomPermissionsResponse> {
  const response = await api.post(`/custom-permissions/users/${userId}/bulk`, {
    overrides,
  });
  return response.data?.data ?? response.data;
}

export async function removeUserCustomPermissionOverride(
  userId: string | number,
  customPermissionId: number | string,
) {
  const response = await api.delete(
    `/custom-permissions/users/${userId}/override/${customPermissionId}`,
  );
  return response.data?.data ?? response.data;
}

export async function getUserOverrideSummaries(): Promise<
  Record<
    number | string,
    { totalOverrides: number; deniedCount: number; allowedCount: number }
  >
> {
  const response = await api.get("/custom-permissions/user-overrides-summary");
  return response.data?.data ?? response.data ?? {};
}

export async function checkUserPermissionAccess(
  userId: string | number,
  permissionKey: string,
): Promise<{
  granted: boolean;
  source: string;
  reason: string;
}> {
  const response = await api.post("/custom-permissions/check-access", {
    userId,
    permissionKey,
  });
  return response.data?.data ?? response.data;
}
