"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Award,
  Users,
  Target,
  BarChart2,
  DollarSign,
} from "lucide-react";
import {
  OfficerPerformanceMetric,
  CollectionSummaryKPIs,
  OverdueCollectionItem,
} from "@/types/collection";

interface Props {
  kpis: CollectionSummaryKPIs;
  officers: OfficerPerformanceMetric[];
  overdueList: OverdueCollectionItem[];
  defaultView?: "dashboard" | "perf";
}

export function CollectionDashboardsView({
  kpis,
  officers,
  overdueList,
  defaultView = "dashboard",
}: Props) {
  const [activeView, setActiveView] = useState<"dashboard" | "perf">(defaultView);

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeView === "dashboard"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Executive Collection Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView("perf")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeView === "perf"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Officer Performance & Target KPI</span>
          </button>
        </div>
      </div>

      {activeView === "dashboard" ? (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Collection</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900">
                ৳{kpis.todayCollection.toLocaleString()}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+12.4% vs daily target</span>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Month-to-Date (MTD)</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900">
                ৳{kpis.mtdCollection.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-500">
                85.2% realization rate
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Overdue Pool</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-rose-600">
                ৳{kpis.totalOverduePool.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] font-medium text-rose-500">
                Active delinquent installments
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Follow-ups</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900">
                {kpis.activeFollowups} Cases
              </div>
              <div className="mt-1 text-[11px] font-medium text-purple-600">
                Field recoveries in progress
              </div>
            </div>
          </div>

          {/* Dual Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Defaulters Table */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <h4 className="text-sm font-bold text-slate-900">Top Delinquent Accounts</h4>
                </div>
                <span className="text-xs text-slate-500">Sorted by days overdue</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                      <th className="pb-2">Booking Code</th>
                      <th className="pb-2">Customer Party</th>
                      <th className="pb-2 text-center">Overdue Days</th>
                      <th className="pb-2 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueList.slice(0, 4).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono font-bold text-slate-800">{item.booking_code}</td>
                        <td className="py-2.5 font-semibold text-slate-900">{item.party_name}</td>
                        <td className="py-2.5 text-center">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                            {item.days_overdue}d
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-rose-600">
                          ৳{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Officer Leaderboard Panel */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-900">Officer Collection Leaderboard</h4>
                </div>
                <span className="text-xs text-slate-500">Current Month Achievement</span>
              </div>

              <div className="space-y-3">
                {officers.map((officer, idx) => (
                  <div key={officer.officer_id} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                          #{idx + 1}
                        </span>
                        <span className="text-slate-900 font-bold">{officer.officer}</span>
                      </div>
                      <span className="font-mono text-emerald-600 font-bold">
                        {officer.achievement_percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(officer.achievement_percentage, 100)}%` }}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Collected: ৳{(officer.collected_amount / 100000).toFixed(1)}L</span>
                      <span>Target: ৳{(officer.target_amount / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Performance Dashboard View */
        <div className="space-y-6">
          {/* Target vs Achieved Visual Chart Bar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-base font-bold text-slate-900">Target vs Achieved Collection Comparison</h4>
                <p className="text-xs text-slate-500">Comparative visual analysis of individual field recovery portfolios</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-slate-300" />
                  <span className="text-slate-600">Target Amount</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-indigo-600" />
                  <span className="text-slate-900 font-bold">Collected Amount</span>
                </div>
              </div>
            </div>

            {/* Simulated CSS Bar Chart */}
            <div className="space-y-6 pt-2">
              {officers.map((off) => {
                const maxVal = Math.max(...officers.map((o) => o.target_amount));
                const targetPct = (off.target_amount / maxVal) * 100;
                const collectedPct = (off.collected_amount / maxVal) * 100;

                return (
                  <div key={off.officer_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{off.officer}</span>
                      <span className="font-mono text-indigo-700 font-bold">
                        ৳{off.collected_amount.toLocaleString()} / ৳{off.target_amount.toLocaleString()} ({off.achievement_percentage}%)
                      </span>
                    </div>
                    <div className="space-y-1">
                      {/* Target bar */}
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-300"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                      {/* Collected bar */}
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${collectedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
              Recovery Officer Detailed Performance Metrics
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Recovery Officer</th>
                    <th className="px-4 py-3 text-center">Accounts Assigned</th>
                    <th className="px-4 py-3 text-right">Target Amount (BDT)</th>
                    <th className="px-4 py-3 text-right">Collected Amount (BDT)</th>
                    <th className="px-4 py-3 text-center">Achievement %</th>
                    <th className="px-4 py-3 text-center">Efficiency Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {officers.map((row) => (
                    <tr key={row.officer_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{row.officer}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {row.leads_assigned} accounts
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-700">
                        ৳{row.target_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 text-sm">
                        ৳{row.collected_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-indigo-700 text-sm">
                        {row.achievement_percentage}%
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            row.achievement_percentage >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : row.achievement_percentage >= 80
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.achievement_percentage >= 90
                            ? "Star Performer"
                            : row.achievement_percentage >= 80
                            ? "On Track"
                            : "Needs Acceleration"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
