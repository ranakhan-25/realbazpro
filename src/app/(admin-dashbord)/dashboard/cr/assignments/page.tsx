/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import { showAlert } from "@/lib/swal";

export default function CrAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Assignment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    officer_id: "",
    officer_name: "",
    sale_agreement_id: "",
    target_amount: "",
    due_date: "",
    assignment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, agreeRes] = await Promise.all([
        crApi.getAssignments(),
        crApi.getAgreements(),
      ]);
      setAssignments(Array.isArray(assignRes) ? assignRes : []);
      setAgreements(Array.isArray(agreeRes) ? agreeRes : []);
    } catch (err) {
      console.error("Failed to load assignments data:", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = useMemo(() => {
    return assignments.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.officer_name?.toLowerCase().includes(q) ||
        item.officer_id?.toLowerCase().includes(q) ||
        item.sale_agreement?.customer_name?.toLowerCase().includes(q) ||
        item.sale_agreement?.agreement_number?.toLowerCase().includes(q) ||
        item.sale_agreement?.unit_number?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [assignments, statusFilter, search]);

  const summary = useMemo(() => {
    const totalAssigned = assignments.length;
    const totalTarget = assignments.reduce(
      (acc, a) => acc + Number(a.target_amount || 0),
      0
    );
    const totalCollected = assignments.reduce(
      (acc, a) => acc + Number(a.collected_amount || 0),
      0
    );
    const rate = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;
    return { totalAssigned, totalTarget, totalCollected, rate };
  }, [assignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.officer_id.trim() || !formData.officer_name.trim()) {
      showAlert.warning("Required", "Please provide officer ID and name.");
      return;
    }
    if (!formData.sale_agreement_id) {
      showAlert.warning("Required", "Please select a sale agreement.");
      return;
    }
    if (!formData.due_date) {
      showAlert.warning("Required", "Please specify target collection due date.");
      return;
    }

    setSubmitting(true);
    try {
      await crApi.createAssignment({
        officer_id: formData.officer_id.trim(),
        officer_name: formData.officer_name.trim(),
        sale_agreement_id: Number(formData.sale_agreement_id),
        target_amount: Number(formData.target_amount || 0),
        due_date: formData.due_date,
        assignment_date: formData.assignment_date,
        notes: formData.notes,
        status: "assigned",
      });
      setIsModalOpen(false);
      setFormData({
        officer_id: "",
        officer_name: "",
        sale_agreement_id: "",
        target_amount: "",
        due_date: "",
        assignment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncProgress = async (uuid: string) => {
    try {
      await crApi.syncAssignmentProgress(uuid);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this officer assignment?"))
      return;
    try {
      await crApi.deleteAssignment(uuid);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-[#0000F2]" />
            Recovery Officer Assignments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Delegate overdue and scheduled accounts to field recovery officers with measurable collection quotas.
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Assign Officer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Assignments</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {summary.totalAssigned}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active collection targets</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Target Assigned</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            BDT {summary.totalTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Total assigned quotas</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Realized Collection</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            BDT {summary.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Actual collected to date</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Achievement Rate</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">
            {summary.rate.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, summary.rate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officer, client, agreement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0000F2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          {["all", "assigned", "in_progress", "completed", "overdue"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-[#0000F2] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0000F2]" />
            <p className="text-sm">Loading officer assignments...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No recovery officer assignments found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Agreement & Client</th>
                  <th className="py-3 px-4">Target Amount</th>
                  <th className="py-3 px-4">Collected</th>
                  <th className="py-3 px-4">Achievement</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item) => {
                  const target = Number(item.target_amount || 0);
                  const collected = Number(item.collected_amount || 0);
                  const pct = target > 0 ? (collected / target) * 100 : 0;
                  return (
                    <tr key={item.uuid} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">
                          {item.officer_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {item.officer_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">
                          {item.sale_agreement?.customer_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.sale_agreement?.agreement_number || "Agreement #"} | Unit:{" "}
                          {item.sale_agreement?.unit_number || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                        BDT {target.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">
                        BDT {collected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {item.due_date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            item.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "overdue"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            title="Sync Collected Progress"
                            onClick={() => handleSyncProgress(item.uuid)}
                            className="p-1.5 text-gray-500 hover:text-[#0000F2] hover:bg-blue-50 rounded"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Assignment"
                            onClick={() => handleDelete(item.uuid)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                New Officer Assignment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Officer Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OFF-042"
                    value={formData.officer_id}
                    onChange={(e) =>
                      setFormData({ ...formData, officer_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Officer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={formData.officer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, officer_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sale Agreement *
                </label>
                <select
                  required
                  value={formData.sale_agreement_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sale_agreement_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                >
                  <option value="">Select Customer / Agreement...</option>
                  {agreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number || `ID ${a.id}`} - {a.customer_name} ({a.project_name || "Project"} {a.unit_number || ""})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Target Quota (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 250000"
                    value={formData.target_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, target_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Target Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Assignment Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Follow up on overdue installment #3, client requested phone call after 3 PM"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
