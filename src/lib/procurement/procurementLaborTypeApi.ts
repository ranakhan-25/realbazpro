import api from "../api";

export interface BackendLaborType {
  id: string | number;
  uuid: string;
  name: string;
  unit: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface LaborTypePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LaborTypeListResult {
  data: BackendLaborType[];
  meta: LaborTypePaginationMeta;
}

export interface CreateLaborTypePayload {
  name: string;
  unit: string;
  status?: "active" | "inactive";
}

export interface UpdateLaborTypePayload {
  name?: string;
  unit?: string;
  status?: "active" | "inactive";
}

export interface QueryLaborTypeParams {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  withDeleted?: boolean;
  deleted_only?: boolean;
}

/**
 * Procurement Labor Type API Client
 * Interacts with /realbizpro/api/v1/procurement/labor-types
 */
export const procurementLaborTypeApi = {
  /**
   * Fetch paginated labor types with search, status, and deleted_only filters
   */
  async getLaborTypes(params?: QueryLaborTypeParams): Promise<LaborTypeListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    if (!params?.deleted_only) {
      delete cleanParams.deleted_only;
    }
    const res = await api.get("/procurement/labor-types", {
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
      limit: params?.limit || 10,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / (params?.limit || 10))),
    };

    return {
      data: items,
      meta,
    };
  },

  /**
   * Fetch active labor types for dropdown selection
   */
  async getDropdowns(): Promise<Array<{ uuid: string; name: string; unit: string }>> {
    const res = await api.get("/procurement/labor-types/dropdowns");
    const rootData = res.data?.data || res.data;
    return Array.isArray(rootData) ? rootData : [];
  },

  /**
   * Fetch single labor type by UUID
   */
  async getLaborType(uuid: string): Promise<BackendLaborType> {
    const res = await api.get(`/procurement/labor-types/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new labor type
   */
  async createLaborType(payload: CreateLaborTypePayload): Promise<BackendLaborType> {
    const res = await api.post("/procurement/labor-types", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing labor type
   */
  async updateLaborType(
    uuid: string,
    payload: UpdateLaborTypePayload,
  ): Promise<BackendLaborType> {
    const res = await api.patch(`/procurement/labor-types/${uuid}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Soft delete a labor type
   */
  async deleteLaborType(uuid: string): Promise<{ message: string; uuid: string }> {
    const res = await api.delete(`/procurement/labor-types/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted labor type
   */
  async restoreLaborType(uuid: string): Promise<BackendLaborType> {
    const res = await api.patch(`/procurement/labor-types/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
