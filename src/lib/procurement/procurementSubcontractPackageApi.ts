import api from "../api";

export interface BackendSubcontractPackage {
  id: string | number;
  uuid: string;
  name: string;
  unit: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SubcontractPackagePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SubcontractPackageListResult {
  data: BackendSubcontractPackage[];
  meta: SubcontractPackagePaginationMeta;
}

export interface CreateSubcontractPackagePayload {
  name: string;
  unit: string;
  status?: "active" | "inactive";
}

export interface UpdateSubcontractPackagePayload {
  name?: string;
  unit?: string;
  status?: "active" | "inactive";
}

export interface QuerySubcontractPackageParams {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  withDeleted?: boolean;
  deleted_only?: boolean;
}

/**
 * Procurement Subcontract Package API Client
 * Interacts with /realbizpro/api/v1/procurement/subcontract-packages
 */
export const procurementSubcontractPackageApi = {
  /**
   * Fetch paginated subcontract packages with search, status, and deleted_only filters
   */
  async getSubcontractPackages(
    params?: QuerySubcontractPackageParams,
  ): Promise<SubcontractPackageListResult> {
    const cleanParams: Record<string, unknown> = { ...(params || {}) };
    if (!params?.withDeleted) {
      delete cleanParams.withDeleted;
    }
    if (!params?.deleted_only) {
      delete cleanParams.deleted_only;
    }
    const res = await api.get("/procurement/subcontract-packages", {
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
   * Fetch active subcontract packages for dropdown selection
   */
  async getDropdowns(): Promise<
    Array<{ uuid: string; name: string; unit: string }>
  > {
    const res = await api.get("/procurement/subcontract-packages/dropdowns");
    const rootData = res.data?.data || res.data;
    return Array.isArray(rootData) ? rootData : [];
  },

  /**
   * Fetch single subcontract package details by UUID
   */
  async getSubcontractPackage(uuid: string): Promise<BackendSubcontractPackage> {
    const res = await api.get(`/procurement/subcontract-packages/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new subcontract package
   */
  async createSubcontractPackage(
    payload: CreateSubcontractPackagePayload,
  ): Promise<BackendSubcontractPackage> {
    const res = await api.post("/procurement/subcontract-packages", payload);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing subcontract package
   */
  async updateSubcontractPackage(
    uuid: string,
    payload: UpdateSubcontractPackagePayload,
  ): Promise<BackendSubcontractPackage> {
    const res = await api.patch(
      `/procurement/subcontract-packages/${uuid}`,
      payload,
    );
    return res.data?.data || res.data;
  },

  /**
   * Soft delete a subcontract package
   */
  async deleteSubcontractPackage(
    uuid: string,
  ): Promise<{ message: string; uuid: string }> {
    const res = await api.delete(`/procurement/subcontract-packages/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore a soft-deleted subcontract package
   */
  async restoreSubcontractPackage(
    uuid: string,
  ): Promise<BackendSubcontractPackage> {
    const res = await api.patch(
      `/procurement/subcontract-packages/${uuid}/restore`,
    );
    return res.data?.data || res.data;
  },
};
