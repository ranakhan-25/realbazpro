import api from "../api";

export type AccountTypeEnum = "Create New" | "Existing";

export interface BackendCategoryAccountMapping {
  id?: string;
  uuid?: string;
  categoryId?: string;
  inventoryAccountType: AccountTypeEnum;
  inventoryAccountGroupCode?: string | null;
  existingInventoryAccountId?: string | null;
  consumptionAccountType: AccountTypeEnum;
  consumptionAccountGroupCode?: string | null;
  existingConsumptionAccountId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BackendCategory {
  id: string;
  uuid: string;
  code: string;
  name: string;
  type: string;
  addedById?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  accountMapping?: BackendCategoryAccountMapping | null;
}

export interface CategoryPaginationMeta {
  page: number;
  pageNo?: number;
  nextPage?: number | null;
  previousPage?: number | null;
  limit: number;
  skip?: number;
  total: number;
  totalPages: number;
}

export interface CategoryListResult {
  data: BackendCategory[];
  meta: CategoryPaginationMeta;
}

export interface CreateCategoryPayload {
  type: string;
  code: string;
  name: string;
  addedById?: string;
  accountMapping?: {
    inventoryAccountType: AccountTypeEnum;
    inventoryAccountGroupCode?: string;
    existingInventoryAccountId?: string;
    consumptionAccountType: AccountTypeEnum;
    consumptionAccountGroupCode?: string;
    existingConsumptionAccountId?: string;
  };
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface QueryCategoryParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  type?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "code" | "type";
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
}

export interface RealAccountOption {
  uuid: string;
  code: string;
  name: string;
  group?: string;
  sourceType: "Supplier" | "Customer";
}

/**
 * Procurement Category API service
 * Interacts with /realbizpro/api/v1/procurement/category
 */
export const procurementCategoryApi = {
  /**
   * Fetch paginated categories with search, type, and withDeleted filters
   */
  async getCategories(
    params?: QueryCategoryParams,
  ): Promise<CategoryListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    const res = await api.get("/procurement/category", { params: cleanParams });
    // Backend wraps response in { success: true, data: { data: [...], meta: {...} } }
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
   * Fetch single category details with its account mapping
   */
  async getCategory(uuid: string): Promise<BackendCategory> {
    const res = await api.get(`/procurement/category/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new category with account mapping
   */
  async createCategory(
    payload: CreateCategoryPayload,
  ): Promise<BackendCategory> {
    const res = await api.post("/procurement/category", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update category and its account mapping
   */
  async updateCategory(
    uuid: string,
    payload: UpdateCategoryPayload,
  ): Promise<BackendCategory> {
    const res = await api.patch(`/procurement/category/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft-delete a category
   */
  async deleteCategory(uuid: string): Promise<{ message: string }> {
    const res = await api.delete(`/procurement/category/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted category
   */
  async restoreCategory(uuid: string): Promise<BackendCategory> {
    const res = await api.patch(`/procurement/category/${uuid}/restore`);
    return res.data?.data || res.data;
  },

  /**
   * Fetch real accounts from backend to populate Existing Account selectors
   */
  async getRealAccounts(): Promise<RealAccountOption[]> {
    const options: RealAccountOption[] = [];

    try {
      const [suppliersRes, customersRes] = await Promise.allSettled([
        api.get("/supplier-accounts", { params: { limit: 100 } }),
        api.get("/customer-account", { params: { limit: 100 } }),
      ]);

      if (suppliersRes.status === "fulfilled") {
        const supData =
          suppliersRes.value.data?.data?.data ||
          suppliersRes.value.data?.data ||
          [];
        if (Array.isArray(supData)) {
          supData.forEach((s: Record<string, unknown>) => {
            if (s.uuid && typeof s.uuid === "string") {
              options.push({
                uuid: s.uuid,
                code: (s.supplierCode as string) || "",
                name:
                  (s.supplierName as string) ||
                  (s.businessName as string) ||
                  "Supplier",
                group: (s.underGroup as string) || "Supplier Account",
                sourceType: "Supplier",
              });
            }
          });
        }
      }

      if (customersRes.status === "fulfilled") {
        const cusData =
          customersRes.value.data?.data?.data ||
          customersRes.value.data?.data ||
          [];
        if (Array.isArray(cusData)) {
          cusData.forEach((c: Record<string, unknown>) => {
            if (c.uuid && typeof c.uuid === "string") {
              options.push({
                uuid: c.uuid,
                code: (c.customerCode as string) || "",
                name:
                  (c.customerName as string) ||
                  (c.businessName as string) ||
                  "Customer",
                group: (c.underGroup as string) || "Customer Account",
                sourceType: "Customer",
              });
            }
          });
        }
      }
    } catch (e) {
      console.error(
        "[procurementCategoryApi] Error fetching real accounts:",
        e,
      );
    }

    return options;
  },
};
