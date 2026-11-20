"use client";

import React, { useState } from "react";
import { X, Percent, CheckCircle2 } from "lucide-react";
import { mockBookings } from "@/data/collection/collection.mock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateWaiverModal({ isOpen, onClose, onSubmit }: Props) {
  const [bookingId, setBookingId] = useState(mockBookings[0].id);
  const [amount, setAmount] = useState<number | "">(25000);
  const [reason, setReason] = useState("");
  const [approverId, setApproverId] = useState("usr-admin-1");

  if (!isOpen) return null;

  const selectedBooking = mockBookings.find((b) => b.id === bookingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !amount || Number(amount) <= 0 || !reason) return;

    onSubmit({
      booking_id: bookingId,
      booking_code: selectedBooking?.code || "BK-DHK-2026-001",
      party_name: selectedBooking?.party_name || "Valued Client",
      amount: Number(amount),
      reason,
      approver_id: approverId,
      approved_by: approverId === "usr-admin-1" ? "Managing Director" : "Head of Finance",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Penalty / Fee Waiver</h3>
              <p className="text-xs text-slate-500">Submit a formal waiver request for management sign-off</p>
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                Waiver Amount (BDT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">৳</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Designated Approver
              </label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="usr-admin-1">Managing Director</option>
                <option value="usr-finance-1">Head of Finance & Credit</option>
                <option value="usr-audit-1">Chief Internal Auditor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Justification & Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State customer circumstances, medical emergencies, construction delays, or board recommendations..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/20 hover:bg-amber-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Waiver Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
