/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  Phone,
  UserPlus,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  X,
  CheckCircle,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import { showAlert } from "@/lib/swal";
import Link from "next/link";

export default function CRDuePage() {
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);

  // Quick Officer Assignment Modal
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [officerId, setOfficerId] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [targetDueDate, setTargetDueDate] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Quick Financial Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"credit_note" | "debit_note" | "rounding">("credit_note");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustRef, setAdjustRef] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const overdue = await crApi.getOverdueInstallments?.() ?? [];
      const data = Array.isArray(overdue) ? overdue : [];
      setDues(
        data.map((p: any) => ({
          id: p?.id,
          uuid: p?.uuid,
          sale_agreement_id: p?.sale_agreement_id ?? p?.sale_agreement?.id,
          agreement_number: p?.sale_agreement?.agreement_number ?? p?.agreement_number ?? "—",
          customer_name: p?.sale_agreement?.customer_name ?? p?.customer_name ?? "—",
          customer_phone: p?.sale_agreement?.customer_phone ?? p?.customer_phone ?? "—",
          unit_identifier: p?.sale_agreement?.unit_identifier ?? p?.unit_identifier ?? "—",
          installment_no: p?.installment_no ?? "",
          title: p?.title ?? "",
          due_date: p?.due_date ?? "—",
          payable_amount: Number(p?.payable_amount ?? p?.amount ?? 0),
          due_amount: Number(p?.due_amount ?? p?.payable_amount ?? 0),
          penalty_amount: Number(p?.penalty_amount ?? p?.late_fee ?? 0),
          days_overdue: p?.delay_days ?? p?.days_overdue ?? 0,
          status: p?.status ?? "",
        }))
      );
    } catch (error) {
      console.error("Failed to load customer dues:", error);
      setDues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    if (!officerId.trim() || !officerName.trim()) {
      showAlert.warning("Required", "Please provide officer ID and name.");
      return;
    }
    if (!targetDueDate) {
      showAlert.warning("Required", "Please provide a target due date.");
      return;
    }

    setAssignSubmitting(true);
    try {
      await crApi.createAssignment({
        officer_id: officerId.trim(),
        officer_name: officerName.trim(),
        sale_agreement_id: assignTarget.sale_agreement_id,
        target_amount: assignTarget.due_amount,
        due_date: targetDueDate,
        notes: `Assigned from dues list for installment: ${assignTarget.title}`,
      });
      setAssignTarget(null);
      setOfficerId("");
      setOfficerName("");
      setTargetDueDate("");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const num = Number(adjustAmount);
    if (!adjustAmount || isNaN(num) || num <= 0) {
      showAlert.warning("Invalid Amount", "Please enter a valid positive adjustment amount.");
      return;
    }
    if (!adjustReason.trim()) {
      showAlert.warning("Reason Required", "Please provide an auditable justification for this adjustment.");
      return;
    }

    setAdjustSubmitting(true);
    try {
      await crApi.createAdjustment({
        sale_agreement_id: adjustTarget.sale_agreement_id,
        installment_plan_id: adjustTarget.id,
        adjustment_type: adjustType,
        amount: num,
        reason: adjustReason.trim(),
        reference_no: adjustRef.trim() || undefined,
      });
      setAdjustTarget(null);
      setAdjustAmount("");
      setAdjustReason("");
      setAdjustRef("");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dues;
    return dues.filter(
      (r) =>
        r.customer_name?.toLowerCase().includes(q) ||
        r.agreement_number?.toLowerCase().includes(q) ||
        r.unit_identifier?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q)
    );
  }, [dues, search]);

  const paged = filtered.slice(0, entries);
  const totalDue = filtered.reduce((s, r) => s + (r.due_amount ?? 0), 0);
  const totalPenalty = filtered.reduce((s, r) => s + (r.penalty_amount ?? 0), 0);
  const fmt = (n: number) =>
    Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink">Customer Dues & Overdue Management</h1>
            <p className="text-[12px] text-ink-muted">
              Credit Realization / Outstanding Receivables, Officer Delegations & Adjustments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/cr/assignments"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0000F2] text-white text-[12.5px] font-medium hover:bg-blue-700 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Officer Quotas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Debtors", value: String(filtered.length), color: "text-blue-600", suffix: "accounts" },
          { label: "Total Due Amount", value: fmt(totalDue), color: "text-amber-600", suffix: "BDT" },
          { label: "Total Penalty", value: fmt(totalPenalty), color: "text-rose-600", suffix: "BDT" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-surface p-3 shadow-xs">
            <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-ink-faint mt-0.5">{kpi.suffix}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="border border-border rounded px-2 py-1 bg-canvas text-ink text-[13px]"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
            <input
              type="text"
              placeholder="Search customer, agreement, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md border border-border bg-canvas text-ink text-[13px] w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "#",
                    "Agreement",
                    "Customer",
                    "Phone",
                    "Unit",
                    "Installment",
                    "Due Date",
                    "Due Amount",
                    "Penalty",
                    "Days Overdue",
                    "Quick Actions",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-ink-muted">
                      No customer dues found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, i) => (
                    <tr key={r.uuid || r.id || i} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-3 py-2 text-ink-muted font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-primary font-mono">{r.agreement_number}</td>
                      <td className="px-3 py-2 font-semibold text-ink">{r.customer_name}</td>
                      <td className="px-3 py-2 text-ink-muted">{r.customer_phone}</td>
                      <td className="px-3 py-2">{r.unit_identifier}</td>
                      <td className="px-3 py-2 font-medium">{r.title}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{r.due_date}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600 font-bold">{fmt(r.due_amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-600 font-semibold">{fmt(r.penalty_amount)}</td>
                      <td className="px-3 py-2 text-center">
                        {r.days_overdue > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            {r.days_overdue}d
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Assign to Recovery Officer"
                            onClick={() => {
                              setAssignTarget(r);
                              setTargetDueDate(r.due_date);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-[#0000F2] hover:bg-blue-100 text-[11px] font-semibold"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign
                          </button>
                          <button
                            title="Apply Financial Adjustment"
                            onClick={() => {
                              setAdjustTarget(r);
                              setAdjustAmount(String(r.due_amount));
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold"
                          >
                            <Sliders className="w-3 h-3" />
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-[12px] text-ink-muted">
          <span>
            Showing {paged.length} of {filtered.length} entries
          </span>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Assign Recovery Officer
              </h3>
              <button onClick={() => setAssignTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                <div><span className="font-semibold text-gray-600">Customer:</span> {assignTarget.customer_name}</div>
                <div><span className="font-semibold text-gray-600">Agreement:</span> {assignTarget.agreement_number}</div>
                <div><span className="font-semibold text-gray-600">Overdue Installment:</span> {assignTarget.title}</div>
                <div><span className="font-semibold text-gray-600">Target Amount:</span> BDT {fmt(assignTarget.due_amount)}</div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Officer Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OFF-012"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Officer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hossain"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Target Due Date *</label>
                <input
                  type="date"
                  required
                  value={targetDueDate}
                  onChange={(e) => setTargetDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-3 py-1.5 bg-[#0000F2] text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignSubmitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Apply Financial Adjustment
              </h3>
              <button onClick={() => setAdjustTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-lg space-y-1">
                <div><span className="font-semibold text-gray-600">Customer:</span> {adjustTarget.customer_name}</div>
                <div><span className="font-semibold text-gray-600">Installment:</span> {adjustTarget.title}</div>
                <div><span className="font-semibold text-gray-600">Current Due:</span> BDT {fmt(adjustTarget.due_amount)}</div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                >
                  <option value="credit_note">Credit Note (Reduces Due Balance)</option>
                  <option value="debit_note">Debit Note (Increases Due Balance)</option>
                  <option value="rounding">Rounding Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Adjustment Amount (BDT) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Auditable Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Special executive management discount applied on installment"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Reference No (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CN-2026-0042"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0000F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-3 py-1.5 bg-[#0000F2] text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {adjustSubmitting ? "Applying..." : "Post Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
