"use client";

import React, { useState } from "react";
import { X, Navigation, CheckCircle2, Camera } from "lucide-react";
import { mockBookings } from "@/data/collection/collection.mock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateFieldVisitModal({ isOpen, onClose, onSubmit }: Props) {
  const [bookingId, setBookingId] = useState(mockBookings[0].id);
  const [officer, setOfficer] = useState("Kabir Hossain");
  const [visitedAt, setVisitedAt] = useState(
    new Date().toISOString().replace("T", " ").substring(0, 16)
  );
  const [outcome, setOutcome] = useState<"collected" | "promise" | "refused" | "not_home">("promise");
  const [geoCoords, setGeoCoords] = useState("23.7925° N, 90.4078° E (Auto-detected)");
  const [photos, setPhotos] = useState("client_office_visit.jpg");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const selectedBooking = mockBookings.find((b) => b.id === bookingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    onSubmit({
      booking_id: bookingId,
      booking_code: selectedBooking?.code || "BK-DHK-2026-001",
      party_name: selectedBooking?.party_name || "Valued Client",
      officer_id: "off-1",
      officer,
      visited_at: visitedAt,
      outcome,
      geo_coordinates: geoCoords,
      photos,
      note,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Field Recovery Visit</h3>
              <p className="text-xs text-slate-500">Log on-site client encounter with GPS and visit outcome</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Client / Booking <span className="text-red-500">*</span>
            </label>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {mockBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.party_name} ({b.project})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Visiting Officer
              </label>
              <select
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="Kabir Hossain">Kabir Hossain</option>
                <option value="Faruk Ahmed">Faruk Ahmed</option>
                <option value="Mahmud Hasan">Mahmud Hasan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Visit Outcome <span className="text-red-500">*</span>
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="promise">Written Promise to Pay</option>
                <option value="collected">Collected Cheque / Cash</option>
                <option value="not_home">Client Not Available</option>
                <option value="refused">Refused Settlement / Hostile</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Visited Timestamp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Geo Coordinates (GPS)
              </label>
              <input
                type="text"
                readOnly
                value={geoCoords}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Photo Evidence / Attachment
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-2.5 bg-slate-50/50 text-xs text-slate-600">
              <Camera className="h-4 w-4 text-slate-400" />
              <span>{photos} (Attached via device camera)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Officer Field Report & Observations
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record exact discussion points, client residence demeanor, or commitment details..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-500/20 hover:bg-teal-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Visit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
