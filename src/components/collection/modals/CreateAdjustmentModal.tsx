"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { mockBookings } from "@/data/collection/collection.mock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateAdjustmentModal({ isOpen, onClose, onSubmit }: Props) {
  const [bookingId, setBookingId] = useState(mockBookings[0].id);
  const [type, setType] = useState<"credit_note" | "debit_note" | "rounding">("credit_note");
  const [amount, setAmount] = useState<number | "">(10000);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  if (!isOpen) return null;

  const selectedBooking = mockBookings.find((b) => b.id === bookingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !amount || !reason) return;

    onSubmit({
      booking_id: bookingId,
      booking_code: selectedBooking?.code || "BK-DHK-2026-001",
      type,
      amount: Number(amount),
      reason,
      reference,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ledger Balance Adjustment</h3>
              <p className="text-xs text-slate-500">Post debit/credit note or round-off correction</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Booking <span className="text-red-500">*</span>
            </label>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {mockBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.party_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adjustment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="credit_note">Credit Note (Reduces Due)</option>
                <option value="debit_note">Debit Note (Increases Due)</option>
                <option value="rounding">Rounding Off Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount (+ / -) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">৳</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reference Code / Document No
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CRN-2026-104 or APPROVAL-REF-44"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Narration <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain reasons for credit/debit adjustment (e.g. spec change rebate, utility adjustment)..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

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
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
