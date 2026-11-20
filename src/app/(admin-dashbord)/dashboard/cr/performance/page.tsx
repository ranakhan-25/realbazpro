/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Award,
  TrendingUp,
  Target,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import Link from "next/link";

export default function CrPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [officerStats, setOfficerStats] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [perfRes, defRes] = await Promise.all([
        crApi.getOfficerPerformance(),
        crApi.getDefaultersLeaderboard(15),
      ]);
      setOfficerStats(Array.isArray(perfRes) ? perfRes : []);
      setDefaulters(Array.isArray(defRes) ? defRes : []);
    } catch (err) {
      console.error("Failed to load performance analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalAssignedQuota = officerStats.reduce(
    (acc, o) => acc + Number(o.total_target || 0),
    0
  );
  const totalCollected = officerStats.reduce(
    (acc, o) => acc + Number(o.total_collected || 0),
    0
  );
  const overallRate =
    totalAssignedQuota > 0 ? (totalCollected / totalAssignedQuota) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-[#0000F2]" />
            Collection Performance & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time officer target realization rates, quota completion matrices, and top defaulters analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Analytics
          </button>
          <Link
            href="/dashboard/cr/assignments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000F2] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Users className="w-4 h-4" />
            Manage Assignments
          </Link>
        </div>
      </div>

      {/* High-Level Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Assigned Quotas</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            BDT {totalAssignedQuota.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Across all field recovery officers</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Realized Collection</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
            BDT {totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Verified bank & cash collections</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Overall Realization Rate</span>
            <TrendingUp className="w-4 h-4 text-[#0000F2]" />
          </div>
          <div className="text-2xl font-bold text-[#0000F2] mt-2">
            {overallRate.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className="bg-[#0000F2] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Officer Realization & Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Officer Performance Matrix */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0000F2]" />
                Recovery Officer Quota Realization
              </h2>
              <p className="text-xs text-gray-500">
                Performance breakdown by assigned field officers
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded">
              {officerStats.length} Officers
            </span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#0000F2]" />
                <p className="text-xs">Computing performance metrics...</p>
              </div>
            ) : officerStats.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No officer performance data recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {officerStats.map((item, idx) => {
                  const target = Number(item.total_target || 0);
                  const collected = Number(item.total_collected || 0);
                  const pct = Number(item.achievement_rate || 0);
                  return (
                    <div
                      key={item.officer_id || idx}
                      className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-gray-900">
                            {item.officer_name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            ({item.officer_id})
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            pct >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : pct >= 50
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {pct.toFixed(1)}% Realized
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            pct >= 90
                              ? "bg-emerald-500"
                              : pct >= 50
                              ? "bg-blue-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1">
                        <span>
                          Target: BDT {target.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          Collected: BDT {collected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Overdue Accounts / Defaulters Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Top Defaulters Leaderboard
              </h2>
              <p className="text-xs text-gray-500">
                Accounts with largest outstanding delay overdue
              </p>
            </div>
            <Link
              href="/dashboard/cr/due"
              className="text-xs font-medium text-[#0000F2] hover:underline flex items-center gap-1"
            >
              View All Dues <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#0000F2]" />
                <p className="text-xs">Analyzing overdue records...</p>
              </div>
            ) : defaulters.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No overdue accounts currently recorded.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Customer & Unit</th>
                    <th className="py-2.5 px-3">Overdue Dues</th>
                    <th className="py-2.5 px-3">Delay Days</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {defaulters.map((d, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-xs text-gray-500">
                        #{index + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900 text-xs">
                          {d.customer_name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {d.agreement_number || "Agreement"} | Unit: {d.unit_number || "N/A"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-xs text-rose-600">
                        BDT {Number(d.overdue_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
                          {d.max_delay_days || 0} days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/dashboard/cr/recovery?agreement=${d.agreement_id || ""}`}
                          className="inline-flex items-center text-xs font-semibold text-[#0000F2] hover:text-blue-800 hover:underline"
                        >
                          Follow Up
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
