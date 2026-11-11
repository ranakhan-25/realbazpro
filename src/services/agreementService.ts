import api from "@/lib/api";

export interface AgreementPayload {
  agreementCode: string;
  buyer: string;
  buyerAvatar?: string;
  property: string;
  propertyCode: string;
  propertyType: string;
  price: number;
  advance: number;
  date: string;
  status: "Draft" | "Pending" | "Signed";
  image?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  notes?: string;
}

const unwrap = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const record = value as { data?: unknown };
  return record.data ?? value;
};

export const agreementService = {
  async create(payload: AgreementPayload) {
    const response = await api.post("/agreements", payload);
    return unwrap(response.data);
  },
};
