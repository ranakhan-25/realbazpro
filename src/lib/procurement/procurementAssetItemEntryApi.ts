import api from "../api";

export interface AssetItemDropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetItemDropdownBrand {
  uuid: string;
  code?: string;
  name: string;
}

export interface AssetItemDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
  conversionUnit?: string;
  rate?: string | number;
}

export interface AssetItemDropdownChartOfGroup {
  id?: number;
  uuid?: string;
  code?: string;
  name: string;
}

export interface AssetItemDropdownsResult {
  categories: AssetItemDropdownCategory[];
  brands: AssetItemDropdownBrand[];
  units: AssetItemDropdownUnit[];
  chartOfGroups: AssetItemDropdownChartOfGroup[];
}

export interface BackendAssetItemEntry {
  id: string | number;
  uuid: string;
  item_code: string;
  name: string;
  category_id: string;
  unit_id: string;
  brand_id?: string | null;
  purchase_price: number | string;
  chart_of_group_id?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  category?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  unit?: {
    uuid: string;
    code?: string;
    name: string;
    conversionUnit?: string;
    rate?: string | number;
  } | null;
  brand?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
}

export interface AssetItemPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface AssetItemListResult {
  data: BackendAssetItemEntry[];
  meta: AssetItemPaginationMeta;
}

export interface CreateAssetItemPayload {
  item_code?: string;
  name: string;
  category_id: string;
  unit_id: string;
  brand_id?: string;
  purchase_price?: number;
  chart_of_group_id?: number;
  createdBy?: string;
}

export interface UpdateAssetItemPayload {
  item_code?: string;
  name?: string;
  category_id?: string;
  unit_id?: string;
  brand_id?: string;
  purchase_price?: number;
  chart_of_group_id?: number;
  createdBy?: string;
}

export interface QueryAssetItemParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  category_id?: string;
  brand_id?: string;
  sortBy?: "createdAt" | "updatedAt" | "item_code" | "name" | "purchase_price";
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
 * Procurement Asset Item Entry API Service
 * Interacts with /realbizpro/api/v1/procurement/asset-item-entry
 */
export const procurementAssetItemEntryApi = {
  /**
   * Fetch category, brand, and unit dropdown options from real API
   */
  async getDropdowns(): Promise<AssetItemDropdownsResult> {
    const res = await api.get("/procurement/asset-item-entry/dropdowns");
    const d = res.data?.data || res.data;
    return {
      categories: Array.isArray(d?.categories) ? d.categories : [],
      brands: Array.isArray(d?.brands) ? d.brands : [],
      units: Array.isArray(d?.units) ? d.units : [],
      chartOfGroups: Array.isArray(d?.chartOfGroups) ? d.chartOfGroups : [],
    };
  },

  /**
   * Fetch paginated asset items with search, category, brand, sorting, and withDeleted filters
   */
  async getItems(params?: QueryAssetItemParams): Promise<AssetItemListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    if (!params?.category_id) {
      delete cleanParams.category_id;
    }
    if (!params?.brand_id) {
      delete cleanParams.brand_id;
    }

    const res = await api.get("/procurement/asset-item-entry", {
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
   * Fetch details of a single asset item by uuid
   */
  async getItem(uuid: string): Promise<BackendAssetItemEntry> {
    const res = await api.get(`/procurement/asset-item-entry/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new asset item entry
   */
  async createItem(
    payload: CreateAssetItemPayload,
  ): Promise<BackendAssetItemEntry> {
    const res = await api.post("/procurement/asset-item-entry", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing asset item entry by uuid
   */
  async updateItem(
    uuid: string,
    payload: UpdateAssetItemPayload,
  ): Promise<BackendAssetItemEntry> {
    const res = await api.patch(
      `/procurement/asset-item-entry/${uuid}`,
      payload,
    );
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete an asset item entry by uuid
   */
  async deleteItem(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/asset-item-entry/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted asset item entry by uuid
   */
  async restoreItem(uuid: string): Promise<BackendAssetItemEntry> {
    const res = await api.patch(
      `/procurement/asset-item-entry/${uuid}/restore`,
    );
    return res.data?.data || res.data;
  },
};
