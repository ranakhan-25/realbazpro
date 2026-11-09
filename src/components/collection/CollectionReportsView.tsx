"use client";

import React, { useState } from "react";
import { Search, Calendar, FileSpreadsheet, ArrowDownUp, AlertTriangle } from "lucide-react";
import {
  OutstandingReceivable,
  AgingAnalysisRow,
  OverdueCollectionItem,
} from "@/types/collection";

interface Props {
  receivables: OutstandingReceivable[];
  agingRows: AgingAnalysisRow[];
  overdueList: OverdueCollectionItem[];
}

export function CollectionReportsView({ receivables, agingRows, overdueList }: Props) {
  const [reportType, setReportType] = useState<"outstanding" | "aging" | "overdue">("outstanding");
  const [asOfDate, setAsOfDate] = useState("2026-11-10");
  const [search, setSearch] = useState("");

  const filteredReceivables = receivables.filter(
    (r) =>
      r.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      r.party_name.toLowerCase().includes(search.toLowerCase()) ||
      r.project.toLowerCase().includes(search.toLowerCase()) ||
      r.officer.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAging = agingRows.filter(
    (a) =>
      a.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      a.party_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOverdue = overdueList.filter(
    (o) =>
      o.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      o.party_name.toLowerCase().includes(search.toLowerCase()) ||
      o.officer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Switcher & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportType("outstanding")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              reportType === "outstanding"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Outstanding Receivables
          </button>
          <button
            onClick={() => setReportType("aging")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              reportType === "aging"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Aging Analysis Matrix
          </button>
          <button
            onClick={() => setReportType("overdue")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              reportType === "overdue"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Overdue Priority List
          </button>
        </div>

        <div className="flex items-center gap-2">
          {reportType === "aging" && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold">As-of:</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="bg-transparent font-mono text-slate-800 focus:outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in report..."
              className="w-48 rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Report 1: Outstanding Receivables */}
      {reportType === "outstanding" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Customer Party</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3 text-right">Agreed Value</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding Balance</th>
                  <th className="px-4 py-3 text-center">Aging %</th>
                  <th className="px-4 py-3 text-center">Bucket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredReceivables.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.project}</td>
                    <td className="px-4 py-3.5 text-slate-700">{row.officer}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                      ৳{row.total_agreed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-emerald-600 font-semibold">
                      ৳{row.total_paid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 text-sm">
                      ৳{row.outstanding_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                      {row.aging_percentage}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                        {row.aging_bucket}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Aging Analysis Matrix */}
      {reportType === "aging" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3 text-right">0–30 Days (BDT)</th>
                  <th className="px-4 py-3 text-right">31–60 Days (BDT)</th>
                  <th className="px-4 py-3 text-right">61–90 Days (BDT)</th>
                  <th className="px-4 py-3 text-right">90+ Days (BDT)</th>
                  <th className="px-4 py-3 text-right font-black">Total Due Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAging.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-blue-700 font-semibold">
                      {row.bucket_0_30 ? `৳${row.bucket_0_30.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-amber-700 font-semibold">
                      {row.bucket_31_60 ? `৳${row.bucket_31_60.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-orange-700 font-semibold">
                      {row.bucket_61_90 ? `৳${row.bucket_61_90.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-rose-700 font-bold">
                      {row.bucket_90_plus ? `৳${row.bucket_90_plus.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-sm">
                      ৳{row.total_due.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Overdue Collection Priority List */}
      {reportType === "overdue" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3">Assigned Officer</th>
                  <th className="px-4 py-3 text-center">Days Overdue</th>
                  <th className="px-4 py-3 text-right">Overdue Amount (BDT)</th>
                  <th className="px-4 py-3">Last Follow-up Date</th>
                  <th className="px-4 py-3 text-center">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOverdue.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{row.booking_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                    <td className="px-4 py-3.5 text-slate-800">{row.officer}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                        <AlertTriangle className="h-3 w-3" />
                        {row.days_overdue} days
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 text-sm">
                      ৳{row.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{row.last_followup_date}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px]">
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
    </div>
  );
}
