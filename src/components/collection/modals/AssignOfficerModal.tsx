"use client";

import React, { useState } from "react";
import { X, UserCheck, CheckCircle2 } from "lucide-react";
import { mockBookings } from "@/data/collection/collection.mock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  preselectedBookingCodes?: string[];
}

export function AssignOfficerModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedBookingCodes = [],
}: Props) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>(
    preselectedBookingCodes.length ? preselectedBookingCodes : [mockBookings[0].code]
  );
  const [officerId, setOfficerId] = useState("off-1");
  const [targetAmount, setTargetAmount] = useState<number | "">(2500000);
  const [dueDate, setDueDate] = useState("2026-11-30");

  if (!isOpen) return null;

  const officers = [
    { id: "off-1", name: "Kabir Hossain" },
    { id: "off-2", name: "Faruk Ahmed" },
    { id: "off-3", name: "Mahmud Hasan" },
    { id: "off-4", name: "Sultana Razia" },
  ];

  const toggleBooking = (code: string) => {
    setSelectedBookings((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookings.length || !officerId) return;

    const officer = officers.find((o) => o.id === officerId);
    onSubmit({
      booking_ids: selectedBookings,
      officer_id: officerId,
      officer_name: officer?.name || "Recovery Officer",
      target_amount: Number(targetAmount || 0),
      due_date: dueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign Recovery Officer</h3>
              <p className="text-xs text-slate-500">Allocate delinquent customer accounts to field officers</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Bookings / Delinquent Accounts ({selectedBookings.length} selected) <span className="text-red-500">*</span>
            </label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1.5 bg-slate-50/40">
              {mockBookings.map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedBookings.includes(b.code)}
                    onChange={() => toggleBooking(b.code)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">{b.code}</span>
                  <span className="text-slate-500">— {b.party_name} ({b.project})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Designated Recovery Officer <span className="text-red-500">*</span>
            </label>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Collection Amount (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Realization Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
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
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
