"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { SettlementRecord, SettlementPaymentSchedule, AcquisitionLead, LandOwner } from "@/types/lams";

interface AddSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settlement: any) => void;
  acquisitionLeads: AcquisitionLead[];
  landOwners: LandOwner[];
  initialData?: SettlementRecord | null;
}

const DEFAULT_SCHEDULE: SettlementPaymentSchedule[] = [
  { installment_no: 1, due_date: "2026-09-20", amount: 10000000, status: "Pending" },
  { installment_no: 2, due_date: "2026-10-20", amount: 15000000, status: "Pending" },
  { installment_no: 3, due_date: "2026-11-20", amount: 14500000, status: "Pending" },
];

export function AddSettlementModal({
  isOpen,
  onClose,
  onSave,
  acquisitionLeads,
  landOwners,
  initialData,
}: AddSettlementModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [agreedAmount, setAgreedAmount] = useState<number | "">("");
  const [advance, setAdvance] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "cheque">("bank");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().split("T")[0]);
  const [schedules, setSchedules] = useState<SettlementPaymentSchedule[]>(DEFAULT_SCHEDULE);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setSelectedLeadId(initialData.lead_id || initialData.lead_code || initialData.lead || "");
      setSelectedOwner(initialData.owner || "");
      setAgreedAmount(initialData.agreed_amount || "");
      setAdvance(initialData.advance || "");
      setPaymentMode(initialData.payment_mode || "bank");
      setScheduledAt(initialData.scheduled_at || new Date().toISOString().split("T")[0]);
      setSchedules(initialData.payment_schedule && initialData.payment_schedule.length > 0 ? initialData.payment_schedule : DEFAULT_SCHEDULE);
      setNotes(initialData.notes || "");
    } else {
      setSelectedLeadId(acquisitionLeads[0]?.id || acquisitionLeads[0]?.leadCode || "");
      setSelectedOwner(landOwners[0]?.name || landOwners[0]?.ownerName || "Primary Owner");
      setAgreedAmount(40000000);
      setAdvance(10000000);
      setPaymentMode("bank");
      setScheduledAt(new Date().toISOString().split("T")[0]);
      setSchedules(DEFAULT_SCHEDULE);
      setNotes("");
    }
  }, [initialData, acquisitionLeads, landOwners, isOpen]);

  // When lead changes, sync owner if available
  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = acquisitionLeads.find((l) => (l.id && l.id === leadId) || (l.leadCode && l.leadCode === leadId));
    if (lead?.owner_name || lead?.ownerName) {
      setSelectedOwner(lead.owner_name || lead.ownerName || "");
    }
    if (lead?.expectedPrice || lead?.asking_price) {
      setAgreedAmount(lead.offeredPrice || lead.asking_price || 0);
    }
  };

  const handleAddScheduleRow = () => {
    const nextNo = schedules.length + 1;
    setSchedules([
      ...schedules,
      { installment_no: nextNo, due_date: "", amount: 0, status: "Pending" },
    ]);
  };

  const handleRemoveScheduleRow = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, field: keyof SettlementPaymentSchedule, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = acquisitionLeads.find(
      (l) => (l.id && l.id === selectedLeadId) || (l.leadCode && l.leadCode === selectedLeadId)
    );
    const leadCode = lead?.leadCode || lead?.code || selectedLeadId;

    const totalAgreed = Number(agreedAmount) || 0;
    const adv = Number(advance) || 0;
    const dueAmount = totalAgreed - adv;

    onSave({
      id: initialData?.id || `SET-${Date.now()}`,
      uuid: initialData?.uuid || `SET-${Date.now()}`,
      lead: leadCode,
      lead_code: leadCode,
      lead_id: lead?.id || selectedLeadId,
      owner: selectedOwner,
      agreed_amount: totalAgreed,
      advance: adv,
      paid: adv,
      due: dueAmount,
      payment_mode: paymentMode,
      scheduled_at: scheduledAt,
      status: dueAmount === 0 ? "Settled" : adv > 0 ? "Partially Paid" : "Pending",
      payment_schedule: schedules,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Land Settlement Plan" : "Create Land Settlement & Schedule"}
              </h2>
              <p className="text-xs text-slate-500">Feature 02.10 · Deed Payment Mode, Advance & Installments Schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Acquisition Lead <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {acquisitionLeads.map((l) => (
                  <option key={l.id || l.leadCode} value={l.id || l.leadCode}>
                    {l.leadCode || l.code} — {l.title || l.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner Select / Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Beneficiary Landowner <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                required
                placeholder="Owner full name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Agreed Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Agreed Total Amount (BDT) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  value={agreedAmount}
                  onChange={(e) => setAgreedAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min={0}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Advance Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Advance / Bainanama Disbursed (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value === "" ? "" : Number(e.target.value))}
                  min={0}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="bank">Bank Transfer (RTGS / BEFTN / Pay Order)</option>
                <option value="cheque">Account Payee Cheque</option>
                <option value="cash">Cash / Notary Handover</option>
              </select>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Execution Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Schedule Table (payment_schedule TBL) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payment Installment Schedule (payment_schedule)
              </label>
              <button
                type="button"
                onClick={handleAddScheduleRow}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Installment
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3 w-16">#</th>
                    <th className="py-2 px-3">Due Date</th>
                    <th className="py-2 px-3">Amount (BDT)</th>
                    <th className="py-2 px-3 w-28">Status</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {schedules.map((row, idx) => (
                    <tr key={idx} className="bg-white dark:bg-slate-900">
                      <td className="p-2 font-mono font-bold text-slate-500">#{row.installment_no}</td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.due_date}
                          onChange={(e) => handleScheduleChange(idx, "due_date", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => handleScheduleChange(idx, "amount", Number(e.target.value))}
                          placeholder="Amount"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                          required
                          min={0}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.status || "Pending"}
                          onChange={(e) => handleScheduleChange(idx, "status", e.target.value as any)}
                          className={`w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${
                            row.status === "Paid" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleRow(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Settlement Agreement Notes & Bank Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Bank routing, A/C payee conditions, or registry fees breakdown..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
