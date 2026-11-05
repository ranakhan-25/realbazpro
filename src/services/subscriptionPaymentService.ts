import api from "@/lib/api";

export interface SubscriptionPaymentRecord {
  id: number | string;
  uuid?: string;
  organizationId: number;
  planId: number;
  userId: number;
  tranId: string;
  valId?: string;
  amount: number;
  currency: string;
  billingCycle: string;
  durationDays: number;
  status: "PENDING" | "VALID" | "FAILED" | "CANCELLED" | "EXPIRED";
  bankTranId?: string;
  cardType?: string;
  cardBrand?: string;
  paymentInitiatedAt: string;
  paymentCompletedAt?: string;
  plan?: {
    id: number | string;
    name: string;
    code: string;
    monthlyPrice: number;
    yearlyPrice?: number;
  };
  organization?: {
    id: number | string;
    name: string;
    code: string;
    subscriptionStatus: string;
    subscriptionEndDate?: string;
  };
}

export interface InitiatePaymentPayload {
  planId: number | string;
  billingCycle: "monthly" | "quarterly" | "half_yearly" | "yearly";
  organizationId?: number | string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  gatewayUrl: string;
  tranId: string;
  amount: number;
  currency: string;
  planName: string;
  billingCycle: string;
}

export async function initiateSubscriptionPayment(
  payload: InitiatePaymentPayload,
): Promise<InitiatePaymentResponse> {
  const response = await api.post("/subscription-payments/initiate", payload);
  return response.data?.data ?? response.data;
}

export async function getSubscriptionPaymentHistory(params: {
  page?: number;
  limit?: number;
  status?: string;
  organizationId?: number | string;
  search?: string;
} = {}) {
  const response = await api.get("/subscription-payments/history", { params });
  return response.data?.data ?? response.data;
}

/**
 * Returns the backend URL for the invoice of a specific transaction.
 * Opens as a printable HTML page in the browser by default.
 * Pass format="pdf" to trigger a direct PDF download.
 */
export function getInvoiceUrl(
  tranId: string,
  format: "html" | "pdf" = "html",
): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    "http://localhost:5002/realbizpro/api/v1";
  return `${base}/subscription-payments/${encodeURIComponent(tranId)}/invoice?format=${format}`;
}
