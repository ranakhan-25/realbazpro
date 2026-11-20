import api from "../api";

export type ProcurementDashboardPeriod =
  | "today"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all";

export interface QueryProcurementDashboardParams {
  period?: ProcurementDashboardPeriod;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
}

export interface DashboardMetricItem {
  count: number;
  previousCount: number;
  changePercent: number | null;
}

export interface DashboardDateRange {
  start: string;
  end: string;
}

export interface DashboardOverflowMaterial {
  requisition: {
    uuid: string;
    code: string;
  };
  itemCode: string;
  description: string;
  unit: string;
  budgetQty: number;
  budgetAmount: number;
  issueQty: number;
  issueAmount: number;
  status: "completed" | "issued" | "pending";
}

export interface DashboardPendingVoucherProject {
  uuid: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  contactPhone?: string | null;
}

export interface DashboardPendingVoucherSupplier {
  uuid: string;
  name: string;
  phone?: string | null;
}

export interface DashboardPendingVoucherCreator {
  id: number | string;
  name: string;
}

export interface DashboardPendingVoucher {
  uuid: string;
  reference: string;
  date: string;
  amount: number;
  project: DashboardPendingVoucherProject | null;
  supplier: DashboardPendingVoucherSupplier | null;
  addedBy: DashboardPendingVoucherCreator | null;
  approvalLayer: string;
}

export interface DashboardPendingVouchersData {
  count: number;
  data: DashboardPendingVoucher[];
}

export interface ProcurementDashboardData {
  period: string;
  dateRange: DashboardDateRange | null;
  metrics: {
    pendingRequisition: DashboardMetricItem;
    requisition: DashboardMetricItem;
    pendingPurchaseOrder: DashboardMetricItem;
    purchaseOrder: DashboardMetricItem;
    pendingGrn: DashboardMetricItem;
    pendingPurchaseBill: DashboardMetricItem;
  };
  overflowMaterial: DashboardOverflowMaterial[];
  pendingVouchers: DashboardPendingVouchersData;
}

/**
 * Procurement Dashboard API Service
 * Endpoint: GET /realbizpro/api/v1/procurement/dashboard
 */
export const procurementDashboardApi = {
  /**
   * Fetches procurement dashboard statistics, overflow materials, and pending purchase bills.
   */
  async getDashboard(
    params?: QueryProcurementDashboardParams
  ): Promise<ProcurementDashboardData> {
    const cleanParams: Record<string, unknown> = {};

    if (params?.period) {
      cleanParams.period = params.period;
    }
    if (params?.startDate) {
      cleanParams.startDate = params.startDate;
    }
    if (params?.endDate) {
      cleanParams.endDate = params.endDate;
    }
    if (params?.search && params.search.trim().length > 0) {
      cleanParams.search = params.search.trim();
    }
    if (params?.limit && params.limit > 0) {
      cleanParams.limit = params.limit;
    }

    const res = await api.get("/procurement/dashboard", {
      params: cleanParams,
    });

    const rootData = res.data?.data || res.data;
    return rootData as ProcurementDashboardData;
  },
};
