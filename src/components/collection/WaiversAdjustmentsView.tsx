"use client";

import React, { useState } from "react";
import { Search, Plus, Percent, SlidersHorizontal, CheckCircle2, Clock, XCircle } from "lucide-react";
import { WaiverItem, AdjustmentItem } from "@/types/collection";

interface Props {
  waivers: WaiverItem[];
  adjustments: AdjustmentItem[];
  onOpenCreateWaiver: () => void;
  onOpenCreateAdjustment: () => void;
}

export function WaiversAdjustmentsView({
  waivers,
  adjustments,
  onOpenCreateWaiver,
  onOpenCreateAdjustment,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"waivers" | "adjustments">("waivers");
  const [search, setSearch] = useState("");

  const filteredWaivers = waivers.filter(
    (w) =>
      w.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      w.party_name.toLowerCase().includes(search.toLowerCase()) ||
      w.reason.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      (a.reference && a.reference.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Sub Tabs & Action Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("waivers")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "waivers"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Percent className="h-4 w-4" />
            <span>Penalty Waivers ({waivers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("adjustments")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "adjustments"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Ledger Adjustments ({adjustments.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or client..."
              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {activeSubTab === "waivers" ? (
            <button
              onClick={onOpenCreateWaiver}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Request Waiver</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreateAdjustment}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Adjustment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables */}
      {activeSubTab === "waivers" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Customer Party</th>
                  <th className="px-4 py-3 text-right">Waiver Amount (BDT)</th>
                  <th className="px-4 py-3">Reason / Justification</th>
                  <th className="px-4 py-3">Designated Approver</th>
                  <th className="px-4 py-3">Submitted Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredWaivers.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {row.booking_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-600">
                      ৳{row.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{row.reason}</td>
                    <td className="px-4 py-3.5 text-slate-800">{row.approved_by || "Pending"}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{row.created_at}</td>
                    <td className="px-4 py-3.5 text-center">
                      {row.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : row.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" /> Pending Sign-off
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-right">Adjustment Amount</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Date Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAdjustments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {row.booking_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          row.type === "credit_note"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.type === "debit_note"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {row.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {row.amount > 0 ? `+৳${row.amount.toLocaleString()}` : `-৳${Math.abs(row.amount).toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{row.reference || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-700">{row.reason}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{row.created_at}</td>
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
