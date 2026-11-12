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
