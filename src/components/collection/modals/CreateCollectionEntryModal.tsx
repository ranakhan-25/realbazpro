"use client";

import React, { useState } from "react";
import { X, Receipt, CheckCircle2 } from "lucide-react";
import { mockBookings, mockPaymentSchedules } from "@/data/collection/collection.mock";
import { CollectionPaymentMode } from "@/types/collection";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  preselectedBookingId?: string;
  preselectedInstallmentId?: string;
}

export function CreateCollectionEntryModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedBookingId,
  preselectedInstallmentId,
}: Props) {
  const [bookingId, setBookingId] = useState(preselectedBookingId || mockBookings[0].id);
  const [installmentId, setInstallmentId] = useState(preselectedInstallmentId || "");
  const [amount, setAmount] = useState<number | "">(500000);
  const [mode, setMode] = useState<CollectionPaymentMode>("bank");
  const [txnRef, setTxnRef] = useState("");
  const [collectedAt, setCollectedAt] = useState(
    new Date().toISOString().replace("T", " ").substring(0, 16)
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedBooking = mockBookings.find((b) => b.id === bookingId);
  const availableInstallments = mockPaymentSchedules.filter(
    (s) => s.booking_code === selectedBooking?.code
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    const selectedInst = availableInstallments.find((i) => i.id === installmentId);
    onSubmit({
      booking_id: bookingId,
      booking_code: selectedBooking?.code || "BK-DHK-2026-001",
      party_name: selectedBooking?.party_name || "Valued Client",
      installment_id: installmentId || undefined,
      installment_label: selectedInst?.label || "General Installment",
      amount: Number(amount),
      mode,
      txn_ref: txnRef,
      collected_at: collectedAt,
      notes,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Collection Entry</h3>
              <p className="text-xs text-slate-500">Record customer payment & generate official money receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Booking <span className="text-red-500">*</span>
              </label>
              <select
                value={bookingId}
                onChange={(e) => {
                  setBookingId(e.target.value);
                  setInstallmentId("");
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {mockBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.party_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Linked Installment (Optional)
              </label>
              <select
                value={installmentId}
                onChange={(e) => setInstallmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">General Installment Account</option>
                {availableInstallments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    #{inst.installment_no} {inst.label} (Due: ৳{inst.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Collected Amount (BDT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">৳</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CollectionPaymentMode)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="bank">Bank Deposit / Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="mobile">bKash / Nagad Mobile Banking</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transaction / Cheque Reference
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. EBL-TXN-887711 or Cheque #442211"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Collection Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Narration / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional comments or bank deposit particulars..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Record Payment & Issue Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
