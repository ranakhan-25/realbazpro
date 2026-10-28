import api from "../api";

export interface ItemEntryDropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface ItemEntryDropdownSubCategory {
  uuid: string;
  categoryId?: string;
  code?: string;
  name: string;
}

export interface ItemEntryDropdownBrand {
  uuid: string;
  code?: string;
  name: string;
}

export interface ItemEntryDropdownUnit {
  uuid: string;
  code?: string;
  name: string;
  conversionUnit?: string;
  rate?: string | number;
}

export interface ItemEntryDropdownsResult {
  categories: ItemEntryDropdownCategory[];
  subCategories: ItemEntryDropdownSubCategory[];
  brands: ItemEntryDropdownBrand[];
  units: ItemEntryDropdownUnit[];
}

export interface BackendItemEntry {
  id: string | number;
  uuid: string;
  item_code: string;
  name: string;
  purchase_price: number | string;
  sale_price: number | string;
  category_id?: string | null;
  sub_category_id?: string | null;
  brand_id?: string | null;
  unit_id?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  category?: ItemEntryDropdownCategory | null;
  sub_category?: ItemEntryDropdownSubCategory | null;
  brand?: ItemEntryDropdownBrand | null;
  unit?: ItemEntryDropdownUnit | null;
}

export interface ItemEntryPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface ItemEntryListResult {
  data: BackendItemEntry[];
  meta: ItemEntryPaginationMeta;
}

export interface CreateItemEntryPayload {
  item_code: string;
  name: string;
  purchase_price: number;
  sale_price: number;
  category_id?: string;
  sub_category_id?: string;
  brand_id?: string;
  unit_id?: string;
  createdBy?: string;
}

export interface UpdateItemEntryPayload {
  item_code?: string;
  name?: string;
  purchase_price?: number;
  sale_price?: number;
  category_id?: string;
  sub_category_id?: string;
  brand_id?: string;
  unit_id?: string;
}

export interface QueryItemEntryParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  unitId?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "name"
    | "item_code"
    | "purchase_price"
    | "sale_price";
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
 * Procurement Item Entry API Service
 * Interacts with /realbizpro/api/v1/procurement/item-entry
 */
export const procurementItemEntryApi = {
  /**
   * Fetch paginated items with search, category, and withDeleted filters
   */
  async getItems(params?: QueryItemEntryParams): Promise<ItemEntryListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    const res = await api.get("/procurement/item-entry", {
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
   * Fetch dropdown datasets (categories, sub-categories, brands, units)
   */
  async getDropdowns(): Promise<ItemEntryDropdownsResult> {
    const res = await api.get("/procurement/item-entry/dropdowns");
    const data = res.data?.data || res.data || {};
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      subCategories: Array.isArray(data.subCategories)
        ? data.subCategories
        : [],
      brands: Array.isArray(data.brands) ? data.brands : [],
      units: Array.isArray(data.units) ? data.units : [],
    };
  },

  /**
   * Fetch single item details by uuid
   */
  async getItem(uuid: string): Promise<BackendItemEntry> {
    const res = await api.get(`/procurement/item-entry/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new item
   */
  async createItem(payload: CreateItemEntryPayload): Promise<BackendItemEntry> {
    const res = await api.post("/procurement/item-entry", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing item by uuid
   */
  async updateItem(
    uuid: string,
    payload: UpdateItemEntryPayload,
  ): Promise<BackendItemEntry> {
    const res = await api.patch(`/procurement/item-entry/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete an item by uuid
   */
  async deleteItem(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/item-entry/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted item by uuid
   */
  async restoreItem(uuid: string): Promise<BackendItemEntry> {
    const res = await api.patch(`/procurement/item-entry/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
