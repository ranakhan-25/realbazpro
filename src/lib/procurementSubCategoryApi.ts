import api from "./api";

export interface BackendSubCategoryCategory {
  uuid: string;
  code?: string;
  name?: string;
}

export interface BackendSubCategory {
  id: string | number;
  uuid: string;
  categoryId: string;
  code: string;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  category?: BackendSubCategoryCategory | null;
}

export interface SubCategoryPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface SubCategoryListResult {
  data: BackendSubCategory[];
  meta: SubCategoryPaginationMeta;
}

export interface CreateSubCategoryPayload {
  categoryId: string;
  code: string;
  name: string;
  createdBy?: string;
}

export interface UpdateSubCategoryPayload {
  categoryId?: string;
  code?: string;
  name?: string;
  updatedBy?: string;
}

export interface QuerySubCategoryParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  categoryId?: string;
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
 * Procurement Sub Category API Service
 * Interacts with /realbizpro/api/v1/procurement/sub-category
 */
export const procurementSubCategoryApi = {
  /**
   * Fetch paginated sub-categories with search, categoryId, and withDeleted filters
   */
  async getSubCategories(
    params?: QuerySubCategoryParams,
  ): Promise<SubCategoryListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    const res = await api.get("/procurement/sub-category", {
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
   * Fetch a single sub-category's details by uuid
   */
  async getSubCategory(uuid: string): Promise<BackendSubCategory> {
    const res = await api.get(`/procurement/sub-category/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new sub-category
   */
  async createSubCategory(
    payload: CreateSubCategoryPayload,
  ): Promise<BackendSubCategory> {
    const res = await api.post("/procurement/sub-category", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing sub-category by uuid
   */
  async updateSubCategory(
    uuid: string,
    payload: UpdateSubCategoryPayload,
  ): Promise<BackendSubCategory> {
    const res = await api.patch(`/procurement/sub-category/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete a sub-category by uuid
   */
  async deleteSubCategory(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/sub-category/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted sub-category by uuid
   */
  async restoreSubCategory(uuid: string): Promise<BackendSubCategory> {
    const res = await api.patch(`/procurement/sub-category/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
