import api from "@/lib/api";

export interface ApiRecord {
  [key: string]: unknown;
}

export interface BookingProperty {
  uuid: string;
  id: string;
  name: string;
  type: string;
  price: number;
  projectId: string;
  raw: ApiRecord;
}

const unwrap = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  const record = value as ApiRecord;
  const nested = record.data;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as ApiRecord;
    if (
      Array.isArray(nested) ||
      Array.isArray(nestedRecord.data) ||
      Array.isArray(nestedRecord.items)
    ) {
      return nested;
    }
  }
  return value;
};

export const rowsFrom = (value: unknown): ApiRecord[] => {
  const unwrapped = unwrap(value);
  if (Array.isArray(unwrapped)) return unwrapped as ApiRecord[];
  if (!unwrapped || typeof unwrapped !== "object") return [];
  const record = unwrapped as ApiRecord;
  for (const key of ["data", "items", "rows", "results"]) {
    if (Array.isArray(record[key])) return record[key] as ApiRecord[];
  }
  return [];
};

const firstValue = (...values: unknown[]) =>
  values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== "",
  );

export const salesBookingService = {
  async getBookingResource(resource: string, uuid: string, resourceUuid?: string) {
    if (resource === "overview") return this.getOverview(uuid, resourceUuid);
    const path = resourceUuid ? `/bookings/${uuid}/${resource}/${resourceUuid}` : `/bookings/${uuid}/${resource}`;
    const response = await api.get(path);
    return resource === "documents" ? rowsFrom(response.data) : ((unwrap(response.data) as ApiRecord) || {});
  },

  async upsertBookingResource(resource: string, uuid: string, payload: ApiRecord) {
    const response = await api.post(`/bookings/${uuid}/${resource}`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async updateBookingResource(resource: string, uuid: string, resourceUuid: string, payload: ApiRecord) {
    const response = await api.patch(`/bookings/${uuid}/${resource}/${resourceUuid}`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async deleteBookingResource(resource: string, uuid: string, resourceUuid: string) {
    await api.delete(`/bookings/${uuid}/${resource}/${resourceUuid}`);
  },

  async getOverview(uuid: string, overviewUuid?: string) {
    const response = overviewUuid
      ? await api.get(`/bookings/${uuid}/overview/${overviewUuid}`)
      : await api.get(`/bookings/${uuid}`);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async upsertOverview(uuid: string, payload: ApiRecord) {
    const response = await api.post(`/bookings/${uuid}/overview`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async getInstallments(uuid: string, params?: Record<string, unknown>) {
    const response = await api.get(`/bookings/${uuid}/installments`, { params });
    return rowsFrom(response.data);
  },

  async createInstallment(uuid: string, payload: ApiRecord) {
    const response = await api.post(`/bookings/${uuid}/installments`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async updateInstallment(uuid: string, installmentUuid: string, payload: ApiRecord) {
    const response = await api.patch(`/bookings/${uuid}/installments/${installmentUuid}`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async deleteInstallment(uuid: string, installmentUuid: string) {
    await api.delete(`/bookings/${uuid}/installments/${installmentUuid}`);
  },

  async getAgreement(uuid: string, agreementUuid: string) {
    const response = await api.get(`/bookings/${uuid}/agreement/${agreementUuid}`);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async upsertAgreement(uuid: string, payload: ApiRecord) {
    const response = await api.post(`/bookings/${uuid}/agreement`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async updateAgreement(uuid: string, agreementUuid: string, payload: ApiRecord) {
    const response = await api.patch(`/bookings/${uuid}/agreement/${agreementUuid}`, payload);
    return (unwrap(response.data) as ApiRecord) || {};
  },

  async deleteAgreement(uuid: string, agreementUuid: string) {
    await api.delete(`/bookings/${uuid}/agreement/${agreementUuid}`);
  },

  async properties(): Promise<BookingProperty[]> {
    const response = await api.get("/flat-land", {
      params: { page: 1, limit: 100 },
    });
    return rowsFrom(response.data).map((row) => {
      const priceValue = firstValue(
        row.rate,
        row.price,
        row.totalPrice,
        row.bookingAmount,
        0,
      );
      const project =
        row.project && typeof row.project === "object"
          ? (row.project as ApiRecord)
          : {};
      const id = String(firstValue(row.uuid, row.id, "") ?? "");
      return {
        uuid: id,
        id,
        name: String(
          firstValue(
            row.flatLandNo,
            row.name,
            row.title,
            row.code,
            `Property ${id}`,
          ) ?? "",
        ),
        type: String(
          firstValue(row.propertyType, row.type, project.type, "Property") ??
            "Property",
        ),
        price: Number(priceValue) || 0,
        projectId: String(firstValue(row.projectId, project.uuid, project.id, "") ?? ""),
        raw: row,
      };
    });
  },

  async create(payload: ApiRecord) {
    const response = await api.post("/flat-land-bookings", payload);
    return unwrap(response.data);
  },
};
