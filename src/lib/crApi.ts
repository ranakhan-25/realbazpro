import axios from "axios";
import { showAlert } from "./swal";
import { formatApiErrorMessage } from "./api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

const crClient = axios.create({
  baseURL: `${API_BASE}/credit-realization`,
  headers: {
    "Content-Type": "application/json",
  },
});

import { adminAuthStorage } from "./admin-auth/adminAuthStorage";

crClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      adminAuthStorage.getAccessToken() ||
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");
    if (token) {
      if (config.headers?.set) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return config;
});

crClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.data) {
      const formatted = formatApiErrorMessage(error);
      if (formatted) {
        error.response.data.message = formatted;
      }
    }
    return Promise.reject(error);
  },
);

export const crApi = {
  // Setups & Policies
  async getSetups() {
    try {
      const res = await crClient.get("/setups");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching CR setups:", err);
      showAlert.error(
        "Failed to load policies",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createSetup(dto: any) {
    try {
      const res = await crClient.post("/setups", dto);
      showAlert.success(
        "Installment Setup Created",
        "Policy has been configured successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Setup Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateSetup(uuid: string, dto: any) {
    try {
      const res = await crClient.put(`/setups/${uuid}`, dto);
      showAlert.success("Setup Updated", "Policy plan updated successfully.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async deleteSetup(uuid: string) {
    try {
      const res = await crClient.delete(`/setups/${uuid}`);
      showAlert.success("Setup Deleted", "Policy plan deleted successfully.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Delete Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Sale Agreements & Amortization
  async getAgreements() {
    try {
      const res = await crClient.get("/agreements");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching CR agreements:", err);
      showAlert.error(
        "Failed to load agreements",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async getAgreementDetails(uuid: string) {
    try {
      const res = await crClient.get(`/agreements/${uuid}`);
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Failed to load agreement details",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async createAgreement(dto: any) {
    try {
      const res = await crClient.post("/agreements", dto);
      showAlert.success(
        "Sale Agreement Created",
        "Agreement and amortization schedule generated.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Agreement Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateAgreement(uuid: string, dto: any) {
    try {
      const res = await crClient.put(`/agreements/${uuid}`, dto);
      showAlert.success(
        "Agreement Updated",
        "Sale agreement updated successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async deleteAgreement(uuid: string) {
    try {
      const res = await crClient.delete(`/agreements/${uuid}`);
      showAlert.success(
        "Agreement Deleted",
        "Sale agreement deleted successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Delete Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async addPlotDistribution(uuid: string, dto: any) {
    try {
      const res = await crClient.post(
        `/agreements/${uuid}/plot-distribution`,
        dto,
      );
      showAlert.success(
        "Plot Allocated",
        "Plot allotment attached to agreement.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Plot Allocation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Installments, Overdue & Payments
  async getOverdueInstallments() {
    try {
      const res = await crClient.get("/installments/overdue");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching overdue installments:", err);
      showAlert.error(
        "Failed to load overdue list",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async recordPayment(installmentUuid: string, dto: any) {
    try {
      const res = await crClient.post(
        `/installments/${installmentUuid}/payments`,
        dto,
      );
      showAlert.success(
        "Payment Recorded",
        `Voucher ${dto.payment_voucher_no || ""} logged successfully.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Payment Recording Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async waivePenalty(
    installmentUuid: string,
    dto: { amount_to_waive: number; reason: string },
  ) {
    try {
      const res = await crClient.post(
        `/installments/${installmentUuid}/waive-penalty`,
        dto,
      );
      showAlert.success(
        "Penalty Waived",
        `Amount waived: ${dto.amount_to_waive} BDT.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Waiver Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Recovery Logs
  async getRecoveryLogs() {
    try {
      const res = await crClient.get("/recovery");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching recovery logs:", err);
      showAlert.error(
        "Failed to load recovery logs",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createRecoveryLog(dto: any) {
    try {
      const res = await crClient.post("/recovery", dto);
      showAlert.success(
        "Recovery Action Logged",
        "Follow-up record saved successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Recovery Logging Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateRecoveryLog(uuid: string, dto: any) {
    try {
      const res = await crClient.put(`/recovery/${uuid}`, dto);
      showAlert.success(
        "Recovery Log Updated",
        "Action record updated successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Reports
  async getAgingAnalysis() {
    try {
      const res = await crClient.get("/reports/aging-analysis");
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error("Error fetching aging report:", err);
      showAlert.error(
        "Failed to load aging matrix",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async getOverdueSummary() {
    try {
      const res = await crClient.get("/reports/overdue-summary");
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error("Error fetching overdue summary:", err);
      showAlert.error(
        "Failed to load summary",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async getRealizationSummary() {
    return this.getOverdueSummary();
  },

  async getCollectionSummary() {
    try {
      const res = await crClient.get("/reports/collection-summary");
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error("Error fetching collection summary:", err);
      showAlert.error(
        "Failed to load collection summary",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async getOfficerPerformance() {
    try {
      const res = await crClient.get("/reports/officer-performance");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching officer performance:", err);
      showAlert.error(
        "Failed to load officer performance",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async getDefaultersLeaderboard(limit: number = 10) {
    try {
      const res = await crClient.get(`/reports/defaulters-leaderboard?limit=${limit}`);
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching defaulters leaderboard:", err);
      showAlert.error(
        "Failed to load defaulters leaderboard",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  // Officer Assignments
  async getAssignments(params?: { officer_id?: string; status?: string; sale_agreement_id?: number }) {
    try {
      const res = await crClient.get("/assignments", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      showAlert.error(
        "Failed to load assignments",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async getAssignmentDetails(uuid: string) {
    try {
      const res = await crClient.get(`/assignments/${uuid}`);
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Failed to load assignment details",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async createAssignment(dto: any) {
    try {
      const res = await crClient.post("/assignments", dto);
      showAlert.success(
        "Assignment Created",
        "Officer assigned to target successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Assignment Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async bulkAssign(dto: {
    officer_id: string;
    officer_name: string;
    sale_agreement_ids: number[];
    due_date: string;
    notes?: string;
  }) {
    try {
      const res = await crClient.post("/assignments/bulk", dto);
      showAlert.success(
        "Bulk Assignment Successful",
        `${dto.sale_agreement_ids.length} accounts assigned to ${dto.officer_name}.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Bulk Assignment Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateAssignment(uuid: string, dto: any) {
    try {
      const res = await crClient.put(`/assignments/${uuid}`, dto);
      showAlert.success("Assignment Updated", "Assignment details saved.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async syncAssignmentProgress(uuid: string) {
    try {
      const res = await crClient.post(`/assignments/${uuid}/sync-progress`);
      showAlert.success("Progress Synced", "Target collection progress updated against payments.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Sync Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async deleteAssignment(uuid: string) {
    try {
      const res = await crClient.delete(`/assignments/${uuid}`);
      showAlert.success("Assignment Removed", "Officer assignment deleted.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Delete Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Financial Adjustments
  async getAdjustments(params?: { sale_agreement_id?: number; adjustment_type?: string; status?: string }) {
    try {
      const res = await crClient.get("/adjustments", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching adjustments:", err);
      showAlert.error(
        "Failed to load adjustments",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createAdjustment(dto: any) {
    try {
      const res = await crClient.post("/adjustments", dto);
      showAlert.success(
        "Adjustment Applied",
        "Financial adjustment recorded and installment balances updated.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Adjustment Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async reverseAdjustment(uuid: string, reason: string) {
    try {
      const res = await crClient.post(`/adjustments/${uuid}/reverse`, { reason });
      showAlert.success(
        "Adjustment Reversed",
        "Adjustment marked reversed and installment balances restored.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Reversal Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async deleteAdjustment(uuid: string) {
    try {
      const res = await crClient.delete(`/adjustments/${uuid}`);
      showAlert.success("Adjustment Removed", "Adjustment record deleted.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Delete Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Delay Penalty Waiver Requests
  async getWaivers(params?: { sale_agreement_id?: number; approval_status?: string }) {
    try {
      const res = await crClient.get("/waivers", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error("Error fetching waivers:", err);
      showAlert.error(
        "Failed to load waivers",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createWaiver(dto: any) {
    try {
      const res = await crClient.post("/waivers", dto);
      showAlert.success(
        "Waiver Request Submitted",
        "Request queued for management authorization.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Submission Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateWaiverStatus(uuid: string, dto: {
    approval_status: string;
    approved_amount?: number;
    approval_remarks?: string;
  }) {
    try {
      const res = await crClient.patch(`/waivers/${uuid}/status`, dto);
      showAlert.success(
        `Waiver ${dto.approval_status === "approved" ? "Approved" : "Rejected"}`,
        `Waiver request updated successfully.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Action Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async deleteWaiver(uuid: string) {
    try {
      const res = await crClient.delete(`/waivers/${uuid}`);
      showAlert.success("Waiver Request Removed", "Waiver request deleted.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Delete Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },
};

