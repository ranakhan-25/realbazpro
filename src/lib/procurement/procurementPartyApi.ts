import api from "../api";

export enum PartyType {
  VENDOR = "Vendor",
  CUSTOMER = "Customer",
  CONTRACTOR = "Contractor",
  SUBCONTRACTOR = "Subcontractor",
  OTHER = "Other",
}

export enum PartyBusinessType {
  INDIVIDUAL = "Individual",
  PROPRIETORSHIP = "Proprietorship",
  PARTNERSHIP = "Partnership",
  PRIVATE_LIMITED = "Private Limited",
  PUBLIC_LIMITED = "Public Limited",
  NGO = "NGO",
  OTHER = "Other",
}

export enum PartyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface BackendPartyDocument {
  uuid?: string;
  id?: number | string;
  partyId?: string;
  title: string;
  file: string;
  createdAt?: string;
}

export interface BackendParty {
  id?: number;
  uuid: string;
  code: string;
  name: string;
  type: PartyType | string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  whatsapp?: string | null;
  tradeLicenseNo?: string | null;
  tradeLicenseExpiry?: string | null;
  nidNo?: string | null;
  tinNo?: string | null;
  binNo?: string | null;
  ownerName?: string | null;
  businessType?: PartyBusinessType | string | null;
  bankName?: string | null;
  accountNo?: string | null;
  branch?: string | null;
  accountingGroup?: string | null;
  payableAccount?: string | null;
  notes?: string | null;
  status: PartyStatus | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  documents?: BackendPartyDocument[];
}

export interface PartyPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PartyListResult {
  data: BackendParty[];
  meta: PartyPaginationMeta;
}

export interface PartyDropdownsResult {
  types: string[];
  businessTypes: string[];
  statuses: string[];
  accountingGroups: string[];
  payableAccounts: string[];
}

export interface QueryPartyParams {
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean | string;
  deleted_only?: boolean | string;
}

export interface CreatePartyPayload {
  name: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  whatsapp?: string;
  tradeLicenseNo?: string;
  tradeLicenseExpiry?: string;
  nidNo?: string;
  tinNo?: string;
  binNo?: string;
  ownerName?: string;
  businessType?: string;
  bankName?: string;
  accountNo?: string;
  branch?: string;
  accountingGroup?: string;
  payableAccount?: string;
  notes?: string;
  status?: string;
  documents?: Array<{ title: string; file: string }>;
}

export interface UpdatePartyPayload extends Partial<CreatePartyPayload> {}

function cleanPartyPayload<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === "" || value === null || value === undefined) {
      continue;
    }
    if (key === "documents" && Array.isArray(value)) {
      result[key] = value
        .filter((d) => d && d.title && d.file)
        .map((d) => ({ title: String(d.title).trim(), file: String(d.file).trim() }));
      continue;
    }
    result[key] = value;
  }
  return result;
}

export const procurementPartyApi = {
  /**
   * List parties with search, filter, and pagination
   */
  async list(params?: QueryPartyParams): Promise<PartyListResult> {
    const cleanParams: Record<string, any> = { ...params };
    Object.keys(cleanParams).forEach((k) => {
      if (
        cleanParams[k] === undefined ||
        cleanParams[k] === null ||
        cleanParams[k] === ""
      ) {
        delete cleanParams[k];
      }
    });

    const res = await api.get("/parties", { params: cleanParams });
    const rootData = res.data?.data || res.data;
    const items = Array.isArray(rootData?.data)
      ? rootData.data
      : Array.isArray(rootData)
      ? rootData
      : [];
    const meta: PartyPaginationMeta = rootData?.meta || {
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
   * Get party dropdown choices (types, business types, statuses)
   */
  async getDropdowns(): Promise<PartyDropdownsResult> {
    const res = await api.get("/parties/dropdowns");
    const data = res.data?.data || res.data || {};
    return {
      types: Array.isArray(data.types) ? data.types : Object.values(PartyType),
      businessTypes: Array.isArray(data.businessTypes)
        ? data.businessTypes
        : Object.values(PartyBusinessType),
      statuses: Array.isArray(data.statuses)
        ? data.statuses
        : Object.values(PartyStatus),
      accountingGroups: Array.isArray(data.accountingGroups)
        ? data.accountingGroups
        : [],
      payableAccounts: Array.isArray(data.payableAccounts)
        ? data.payableAccounts
        : [],
    };
  },

  /**
   * Get single party details by uuid
   */
  async getById(uuid: string): Promise<BackendParty> {
    const res = await api.get(`/parties/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Create a new party
   */
  async create(payload: CreatePartyPayload): Promise<BackendParty> {
    const cleaned = cleanPartyPayload(payload);
    const res = await api.post("/parties", cleaned);
    return res.data?.data || res.data;
  },

  /**
   * Update an existing party
   */
  async update(uuid: string, payload: UpdatePartyPayload): Promise<BackendParty> {
    const cleaned = cleanPartyPayload(payload);
    const res = await api.patch(`/parties/${uuid}`, cleaned);
    return res.data?.data || res.data;
  },

  /**
   * Soft delete party
   */
  async delete(uuid: string): Promise<{ message: string; uuid: string }> {
    const res = await api.delete(`/parties/${uuid}`);
    return res.data?.data || res.data;
  },

  /**
   * Restore soft-deleted party
   */
  async restore(uuid: string): Promise<BackendParty> {
    const res = await api.patch(`/parties/${uuid}/restore`);
    return res.data?.data || res.data;
  },
};
