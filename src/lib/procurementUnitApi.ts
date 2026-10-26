import api from "./api";

export interface BackendUnit {
  id: string | number;
  uuid: string;
  code: string;
  name: string;
  conversionUnit?: string | null;
  rate?: number | string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UnitPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface UnitListResult {
  data: BackendUnit[];
  meta: UnitPaginationMeta;
}

export interface CreateUnitPayload {
  code: string;
  name: string;
  conversionUnit?: string;
  rate?: number;
  createdBy?: string;
}

export interface UpdateUnitPayload {
  code?: string;
  name?: string;
  conversionUnit?: string;
  rate?: number;
  updatedBy?: string;
}

export interface QueryUnitParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "code" | "rate";
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

/**
 * Helper to retrieve currently authenticated user ID/UUID from localStorage / session / token.
 * Defaults to "user-uuid" if no session exists, following the backend contract.
 */
export function getAuthenticatedUserId(): string {
  if (typeof window === "undefined") return "user-uuid";
  try {
    // 1. Direct user id/uuid keys
    const directUuid =
      localStorage.getItem("user_uuid") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("admin_id") ||
      localStorage.getItem("admin_uuid");
    if (directUuid && directUuid.trim()) return directUuid.trim();

    // 2. Serialized user objects
    const userKeys = [
      "user",
      "admin_user",
      "auth_user",
      "profile",
      "currentUser",
      "realbiz-session",
    ];
    for (const key of userKeys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          const found =
            parsed.uuid ||
            parsed.id ||
            parsed.userId ||
            parsed.userUuid ||
            parsed.sub;
          if (found) return String(found);
        } catch {
          // not JSON
        }
      }
    }

    // 3. JWT token payload
    const tokenKeys = ["admin_access_token", "access_token", "token"];
    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token && token.includes(".")) {
        try {
          const parts = token.split(".");
          if (parts.length >= 2) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
            );
            const decoded = JSON.parse(jsonPayload);
            const found =
              decoded.uuid || decoded.id || decoded.sub || decoded.userId;
            if (found) return String(found);
          }
        } catch {
          // not valid JWT
        }
      }
    }
  } catch (err) {
    console.warn("Could not read auth user id from storage:", err);
  }

  // Fallback to existing backend contract convention
  return "user-uuid";
}

/**
 * Procurement Unit API Service
 * Interacts with /realbizpro/api/v1/procurement/unit
 */
export const procurementUnitApi = {
  /**
   * Fetch paginated units with search, sorting, and withDeleted filters
   */
  async getUnits(params?: QueryUnitParams): Promise<UnitListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    const res = await api.get("/procurement/unit", {
      params: cleanParams,
    });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data)
      ? rootData.data
      : Array.isArray(rootData)
        ? rootData
        : [];
    const meta = rootData?.meta || {
      page: params?.page || 1,
      pageNo: params?.page || 1,
      nextPage: null,
      previousPage: null,
      limit: params?.limit || 10,
      skip: 0,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return {
      data: items,
      meta,
    };
  },

  /**
   * Fetch a single unit's details by uuid
   */
  async getUnit(uuid: string): Promise<BackendUnit> {
    const res = await api.get(`/procurement/unit/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new unit
   */
  async createUnit(payload: CreateUnitPayload): Promise<BackendUnit> {
    const res = await api.post("/procurement/unit", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing unit by uuid
   */
  async updateUnit(
    uuid: string,
    payload: UpdateUnitPayload,
  ): Promise<BackendUnit> {
    const res = await api.patch(`/procurement/unit/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete a unit by uuid
   */
  async deleteUnit(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/unit/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted unit by uuid
   */
  async restoreUnit(uuid: string): Promise<BackendUnit> {
    const res = await api.patch(`/procurement/unit/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
