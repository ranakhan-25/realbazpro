"use client";

import React, { useState } from "react";
import { X, CalendarClock, CheckCircle2 } from "lucide-react";
import { mockBookings } from "@/data/collection/collection.mock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateFollowUpModal({ isOpen, onClose, onSubmit }: Props) {
  const [bookingId, setBookingId] = useState(mockBookings[0].id);
  const [officer, setOfficer] = useState("Kabir Hossain");
  const [note, setNote] = useState("");
  const [nextAt, setNextAt] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().replace("T", " ").substring(0, 16)
  );

  if (!isOpen) return null;

  const selectedBooking = mockBookings.find((b) => b.id === bookingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !note) return;

    onSubmit({
      booking_id: bookingId,
      booking_code: selectedBooking?.code || "BK-DHK-2026-001",
      officer,
      note,
      next_at: nextAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Schedule Collection Follow-up</h3>
              <p className="text-xs text-slate-500">Record customer call log and promised settlement date</p>
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                Assigned Officer
              </label>
              <select
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="Kabir Hossain">Kabir Hossain</option>
                <option value="Faruk Ahmed">Faruk Ahmed</option>
                <option value="Mahmud Hasan">Mahmud Hasan</option>
                <option value="Sultana Razia">Sultana Razia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Next Follow-up Due <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nextAt}
                onChange={(e) => setNextAt(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Customer Conversation Notes & Commitments <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="State client commitment date, promised amount, or reason for delay..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Follow-up</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
