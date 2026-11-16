/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
  User,
  X,
  Loader2,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import { showAlert } from "@/lib/swal";

export default function CrWaiversPage() {
  const [loading, setLoading] = useState(true);
  const [waivers, setWaivers] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Waiver Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    sale_agreement_id: "",
    installment_plan_id: "",
    requested_amount: "",
    reason: "",
    attachment_url: "",
  });

  // Action (Approve / Reject) Modal
  const [selectedWaiver, setSelectedWaiver] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [actionAmount, setActionAmount] = useState("");
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [waiversRes, overdueRes] = await Promise.all([
        crApi.getWaivers(),
        crApi.getOverdueInstallments(),
      ]);
      setWaivers(Array.isArray(waiversRes) ? waiversRes : []);
      setOverdueList(Array.isArray(overdueRes) ? overdueRes : []);
    } catch (err) {
      console.error("Failed to load waiver data:", err);
      setWaivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredWaivers = useMemo(() => {
    return waivers.filter((w) => {
      const matchesStatus =
        statusFilter === "all" || w.approval_status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        w.sale_agreement?.customer_name?.toLowerCase().includes(q) ||
        w.sale_agreement?.agreement_number?.toLowerCase().includes(q) ||
        w.reason?.toLowerCase().includes(q) ||
        w.approver_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [waivers, statusFilter, search]);

  const summary = useMemo(() => {
    const totalRequests = waivers.length;
    const pendingCount = waivers.filter((w) => w.approval_status === "pending").length;
    const totalWaivedBDT = waivers
      .filter((w) => w.approval_status === "approved")
      .reduce((acc, w) => acc + Number(w.approved_amount || 0), 0);
    return { totalRequests, pendingCount, totalWaivedBDT };
  }, [waivers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.installment_plan_id) {
      showAlert.warning("Required", "Please select an overdue installment.");
      return;
    }
    const num = Number(createForm.requested_amount);
    if (!createForm.requested_amount || isNaN(num) || num <= 0) {
      showAlert.warning("Invalid Amount", "Please specify a positive waiver amount.");
      return;
    }
    if (!createForm.reason.trim()) {
      showAlert.warning("Reason Required", "Please provide a detailed justification for this waiver.");
      return;
    }

    setCreateSubmitting(true);
    try {
      await crApi.createWaiver({
        sale_agreement_id: Number(createForm.sale_agreement_id),
        installment_plan_id: Number(createForm.installment_plan_id),
        requested_amount: num,
        reason: createForm.reason.trim(),
        attachment_url: createForm.attachment_url.trim() || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({
        sale_agreement_id: "",
        installment_plan_id: "",
        requested_amount: "",
        reason: "",
        attachment_url: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openActionModal = (waiver: any, type: "approved" | "rejected") => {
    setSelectedWaiver(waiver);
    setActionType(type);
    setActionAmount(String(waiver.requested_amount || ""));
    setActionRemarks("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaiver) return;

    if (actionType === "approved") {
      const num = Number(actionAmount);
      if (!actionAmount || isNaN(num) || num <= 0) {
        showAlert.warning("Invalid Amount", "Please specify a valid approved amount.");
        return;
      }
    }

    setActionSubmitting(true);
    try {
      await crApi.updateWaiverStatus(selectedWaiver.uuid, {
        approval_status: actionType,
        approved_amount: actionType === "approved" ? Number(actionAmount) : 0,
        approval_remarks: actionRemarks.trim(),
      });
      setSelectedWaiver(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0000F2]" />
            Delay Penalty Waiver Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Formal approval hierarchy and ledger adjustments for customer late installment penalties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Waiver Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Requests</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {summary.totalRequests}
          </div>
          <p className="text-xs text-gray-400 mt-1">Submitted waiver applications</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Authorization</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {summary.pendingCount}
          </div>
          <p className="text-xs text-gray-400 mt-1">Awaiting management approval</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Approved Waivers</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
            BDT {summary.totalWaivedBDT.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Adjusted against penalty balance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, agreement, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0000F2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? "bg-[#0000F2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0000F2]" />
            <p className="text-sm">Loading waiver applications...</p>
          </div>
        ) : filteredWaivers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No penalty waiver applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer & Agreement</th>
                  <th className="py-3 px-4">Installment</th>
                  <th className="py-3 px-4">Penalty Balance</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWaivers.map((item) => {
                  const reqAmt = Number(item.requested_amount || 0);
                  const appAmt = Number(item.approved_amount || 0);
                  const planPenalty = Number(item.installment_plan?.penalty_amount || 0);
                  return (
                    <tr key={item.uuid} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">
                          {item.sale_agreement?.customer_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.sale_agreement?.agreement_number || "Agreement #"} | Unit:{" "}
                          {item.sale_agreement?.unit_number || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">
                          {item.installment_plan?.title || `Installment #${item.installment_plan?.installment_no || "N/A"}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          Due: {item.installment_plan?.due_date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-rose-600">
                        BDT {planPenalty.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">
                        BDT {reqAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {item.approval_status === "approved"
                          ? `BDT ${appAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {item.reason}
                        </p>
                        {item.approval_remarks && (
                          <p className="text-[11px] text-blue-700 mt-1 italic">
                            Approver: {item.approval_remarks}
                          </p>
                        )}
                        {item.attachment_url && (
                          <a
                            href={item.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[11px] text-[#0000F2] hover:underline mt-1"
                          >
                            <FileText className="w-3 h-3 mr-1" /> View Attachment
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            item.approval_status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.approval_status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.approval_status === "approved" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {item.approval_status === "rejected" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {item.approval_status === "pending" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {item.approval_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.approval_status === "pending" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openActionModal(item, "approved")}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(item, "rejected")}
                              className="px-2.5 py-1 text-xs font-semibold border border-rose-300 text-rose-700 rounded hover:bg-rose-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Actioned by {item.approver_name || "Manager"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Waiver Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                New Penalty Waiver Request
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Overdue Installment *
                </label>
                <select
                  required
                  value={createForm.installment_plan_id}
                  onChange={(e) => {
                    const planId = e.target.value;
                    const selected = overdueList.find((p) => String(p.id) === planId);
                    setCreateForm({
                      ...createForm,
                      installment_plan_id: planId,
                      sale_agreement_id: selected?.sale_agreement_id || "",
                      requested_amount: selected?.penalty_amount || "",
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                >
                  <option value="">Choose Overdue Installment...</option>
                  {overdueList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sale_agreement?.customer_name} - {p.title} (Penalty: BDT {p.penalty_amount || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Requested Waiver Amount (BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={createForm.requested_amount}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, requested_amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Justification / Cause of Delay *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer hospitalized during due window; medical report attached for consideration."
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supporting Document URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={createForm.attachment_url}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      attachment_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve / Reject Decision Modal */}
      {selectedWaiver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {actionType} Penalty Waiver
              </h3>
              <button
                onClick={() => setSelectedWaiver(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div>
                  <span className="font-semibold text-gray-600">Customer:</span>{" "}
                  {selectedWaiver.sale_agreement?.customer_name}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Requested:</span>{" "}
                  BDT {Number(selectedWaiver.requested_amount || 0).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Reason:</span>{" "}
                  {selectedWaiver.reason}
                </div>
              </div>

              {actionType === "approved" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Approved Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={actionAmount}
                    onChange={(e) => setActionAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    You can approve full or partial waiver of late penalty.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Authorizer Remarks *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Approved per exception policy #12"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedWaiver(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md disabled:opacity-50 ${
                    actionType === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm {actionType === "approved" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
