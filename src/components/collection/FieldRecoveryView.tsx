"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CalendarClock,
  Navigation,
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Camera,
} from "lucide-react";
import {
  RecoveryActionItem,
  FollowUpItem,
  FieldVisitItem,
} from "@/types/collection";

interface Props {
  recoveries: RecoveryActionItem[];
  followups: FollowUpItem[];
  visits: FieldVisitItem[];
  onOpenCreateRecovery: () => void;
  onOpenCreateFollowUp: () => void;
  onOpenCreateVisit: () => void;
  onOpenAssignOfficer: () => void;
}

export function FieldRecoveryView({
  recoveries,
  followups,
  visits,
  onOpenCreateRecovery,
  onOpenCreateFollowUp,
  onOpenCreateVisit,
  onOpenAssignOfficer,
}: Props) {
  const [activeTab, setActiveTab] = useState<"recovery" | "followups" | "visits">("recovery");
  const [search, setSearch] = useState("");

  const filteredRecoveries = recoveries.filter(
    (r) =>
      r.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      r.party_name.toLowerCase().includes(search.toLowerCase()) ||
      r.note.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFollowups = followups.filter(
    (f) =>
      f.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      f.officer.toLowerCase().includes(search.toLowerCase()) ||
      f.note.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVisits = visits.filter(
    (v) =>
      v.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      v.party_name.toLowerCase().includes(search.toLowerCase()) ||
      v.officer.toLowerCase().includes(search.toLowerCase()) ||
      (v.note && v.note.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("recovery")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "recovery"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Recovery Actions ({recoveries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("followups")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "followups"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            <span>Follow-up Logs ({followups.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("visits")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "visits"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Navigation className="h-4 w-4" />
            <span>Field Visits ({visits.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAssignOfficer}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Assign Officer</span>
          </button>

          {activeTab === "recovery" && (
            <button
              onClick={onOpenCreateRecovery}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Recovery</span>
            </button>
          )}

          {activeTab === "followups" && (
            <button
              onClick={onOpenCreateFollowUp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Follow-up</span>
            </button>
          )}

          {activeTab === "visits" && (
            <button
              onClick={onOpenCreateVisit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: 1. Recovery Actions */}
      {activeTab === "recovery" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3 text-center">Action Type</th>
                  <th className="px-4 py-3">Minutes / Action Note</th>
                  <th className="px-4 py-3">Next Action Due</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecoveries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-800">
                        {row.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-sm truncate">{row.note}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{row.next_action_at}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          row.priority === "critical"
                            ? "bg-rose-100 text-rose-800 font-bold"
                            : row.priority === "high"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: 2. Follow-up Logs */}
      {activeTab === "followups" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">Follow-up Notes & Promises</th>
                  <th className="px-4 py-3">Next Scheduled At</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFollowups.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{row.officer}</td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-md">{row.note}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{row.next_at}</td>
                    <td className="px-4 py-3.5 text-center">
                      {row.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                          <Clock className="h-3 w-3" /> Scheduled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: 3. Field Visits */}
      {activeTab === "visits" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">Visited Date & Time</th>
                  <th className="px-4 py-3 text-center">Outcome</th>
                  <th className="px-4 py-3">GPS Geo-Coordinates</th>
                  <th className="px-4 py-3">Photo Evidence</th>
                  <th className="px-4 py-3">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVisits.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-slate-800">{row.officer}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{row.visited_at}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          row.outcome === "collected"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.outcome === "promise"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {row.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{row.geo_coordinates}</td>
                    <td className="px-4 py-3.5">
                      {row.photos ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <Camera className="h-3 w-3 text-slate-400" />
                          <span>{row.photos}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate">{row.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
