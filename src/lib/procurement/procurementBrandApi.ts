import api from "../api";

export interface BackendBrand {
  id: string | number;
  uuid: string;
  code: string;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BrandPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface BrandListResult {
  data: BackendBrand[];
  meta: BrandPaginationMeta;
}

export interface CreateBrandPayload {
  code: string;
  name: string;
  createdBy?: string;
}

export interface UpdateBrandPayload {
  code?: string;
  name?: string;
  updatedBy?: string;
}

export interface QueryBrandParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "code";
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

/**
 * Helper to retrieve currently authenticated user ID/UUID from localStorage / session / token.
 * Defaults to "user-uuid" if no session exists, following the existing backend contract.
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
 * Procurement Brand API Service
 * Interacts with /realbizpro/api/v1/procurement/brand
 */
export const procurementBrandApi = {
  /**
   * Fetch paginated brands with search, sorting, and withDeleted filters
   */
  async getBrands(params?: QueryBrandParams): Promise<BrandListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    const res = await api.get("/procurement/brand", {
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
   * Fetch a single brand's details by uuid
   */
  async getBrand(uuid: string): Promise<BackendBrand> {
    const res = await api.get(`/procurement/brand/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new brand
   */
  async createBrand(payload: CreateBrandPayload): Promise<BackendBrand> {
    const res = await api.post("/procurement/brand", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing brand by uuid
   */
  async updateBrand(
    uuid: string,
    payload: UpdateBrandPayload,
  ): Promise<BackendBrand> {
    const res = await api.patch(`/procurement/brand/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete a brand by uuid
   */
  async deleteBrand(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/brand/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted brand by uuid
   */
  async restoreBrand(uuid: string): Promise<BackendBrand> {
    const res = await api.patch(`/procurement/brand/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
