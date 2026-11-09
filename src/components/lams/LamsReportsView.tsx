"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Landmark,
  Layers,
} from "lucide-react";
import {
  AcquisitionLead,
  LandOwner,
  LandValuation,
  LegalVerification,
  DueDiligenceRecord,
  SettlementRecord,
} from "@/types/lams";
import { LamsStatusBadge } from "./common/LamsStatusBadge";

interface LamsReportsViewProps {
  leads: AcquisitionLead[];
  owners: LandOwner[];
  valuations?: LandValuation[];
  legalRecords?: LegalVerification[];
  dueDiligenceRecords?: DueDiligenceRecord[];
  settlements?: SettlementRecord[];
}

export function LamsReportsView({
  leads = [],
  owners = [],
  valuations = [],
  legalRecords = [],
  dueDiligenceRecords = [],
  settlements = [],
}: LamsReportsViewProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
      let matchesDate = true;
      if (fromDate && l.created_at && l.created_at < fromDate) matchesDate = false;
      if (toDate && l.created_at && l.created_at > toDate) matchesDate = false;
      return matchesStatus && matchesDate;
    });
  }, [leads, statusFilter, fromDate, toDate]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const settledLeads = filteredLeads.filter(
      (l) => l.status === "Purchased" || l.status === "Settled" || l.status === "Finalized"
    ).length;

    const conversionRate = totalLeads > 0 ? Math.round((settledLeads / totalLeads) * 100) : 0;

    // Total Land Area (sum of land_area or estimate)
    let totalAreaDecimals = 0;
    filteredLeads.forEach((l) => {
      const area = parseFloat(l.land_area as any) || 0;
      totalAreaDecimals += area;
    });

    // Pipeline Commitments from Settlements
    let totalAgreed = 0;
    let totalDisbursed = 0;
    let totalDue = 0;
    settlements.forEach((s) => {
      totalAgreed += s.agreed_amount || 0;
      totalDisbursed += s.paid || 0;
      totalDue += s.due ?? Math.max(0, (s.agreed_amount || 0) - (s.paid || 0));
    });

    // Mouza Breakdown
    const mouzaMap: Record<string, { count: number; totalArea: number }> = {};
    filteredLeads.forEach((l) => {
      const mouza = l.mouza || l.location || "Unspecified";
      if (!mouzaMap[mouza]) mouzaMap[mouza] = { count: 0, totalArea: 0 };
      mouzaMap[mouza].count += 1;
      mouzaMap[mouza].totalArea += parseFloat(l.land_area as any) || 0;
    });

    // Funnel Counts
    const funnel = [
      {
        stage: "Sourced / New Lead",
        count: filteredLeads.filter((l) => l.status === "Lead" || l.status === "Contacted").length,
        color: "bg-cyan-500",
        barColor: "bg-cyan-500/80",
      },
      {
        stage: "Valuation & Survey",
        count: filteredLeads.filter((l) => l.status === "Valuation").length + valuations.length,
        color: "bg-indigo-500",
        barColor: "bg-indigo-500/80",
      },
      {
        stage: "Legal & Due Diligence",
        count:
          filteredLeads.filter((l) => l.status === "Vetting" || l.status === "Due Diligence").length +
          legalRecords.length,
        color: "bg-purple-500",
        barColor: "bg-purple-500/80",
      },
      {
        stage: "Negotiation Process",
        count: filteredLeads.filter((l) => l.status === "Negotiation").length,
        color: "bg-amber-500",
        barColor: "bg-amber-500/80",
      },
      {
        stage: "Approvals & Deed Agreement",
        count: filteredLeads.filter((l) => l.status === "Approved" || l.status === "Agreement").length,
        color: "bg-teal-500",
        barColor: "bg-teal-500/80",
      },
      {
        stage: "Settled / Land Acquired",
        count: settledLeads || settlements.length,
        color: "bg-emerald-500",
        barColor: "bg-emerald-500/80",
      },
      {
        stage: "Rejected / Dropped",
        count: filteredLeads.filter((l) => l.status === "Rejected" || l.status === "Dropped").length,
        color: "bg-rose-500",
        barColor: "bg-rose-500/80",
      },
    ];

    const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

    return {
      totalLeads,
      settledLeads,
      conversionRate,
      totalAreaDecimals,
      totalAgreed,
      totalDisbursed,
      totalDue,
      mouzaBreakdown: Object.entries(mouzaMap).map(([mouza, data]) => ({
        mouza,
        count: data.count,
        totalArea: data.totalArea,
      })),
      funnel,
      maxFunnel,
    };
  }, [filteredLeads, settlements, valuations, legalRecords]);

  // Export Summary Report CSV
  const handleExportSummaryCSV = () => {
    const headers = [
      "Metric",
      "Value",
    ];
    const rows = [
      ["Total Acquisition Leads", analytics.totalLeads],
      ["Fully Acquired / Settled Deeds", analytics.settledLeads],
      ["Lead-to-Acquisition Conversion Rate", `${analytics.conversionRate}%`],
      ["Total Land Secured (Decimals)", analytics.totalAreaDecimals.toFixed(2)],
      ["Total Committed Capital (BDT)", analytics.totalAgreed],
      ["Total Capital Disbursed (BDT)", analytics.totalDisbursed],
      ["Pending Installment Dues (BDT)", analytics.totalDue],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lams_executive_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Land Acquisition Analytics & Executive Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pipeline velocity, stage conversion, mouza allocation, and capital outlay tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportSummaryCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Print Executive Summary</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filter Period:
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="Lead">Lead Sourced</option>
            <option value="Valuation">Under Valuation</option>
            <option value="Vetting">Legal Vetting</option>
            <option value="Negotiation">In Negotiation</option>
            <option value="Purchased">Purchased & Settled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {(fromDate || toDate || statusFilter !== "ALL") && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              setStatusFilter("ALL");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 3. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversion Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acquisition Rate
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.conversionRate}%
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {analytics.settledLeads} of {analytics.totalLeads} deeds
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${analytics.conversionRate}%` }}
            />
          </div>
        </div>

        {/* Total Land Secured */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Land Secured
            </span>
            <span className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics.totalAreaDecimals.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-bold">Decimals</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            ≈ {(analytics.totalAreaDecimals / 100).toFixed(2)} Acres secured
          </p>
        </div>

        {/* Capital Disbursed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capital Disbursed
            </span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ৳ {(analytics.totalDisbursed / 10000000).toFixed(2)} Cr
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Out of ৳ {(analytics.totalAgreed / 10000000).toFixed(2)} Cr committed
          </p>
        </div>

        {/* Pending Payables Due */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Installments Due
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              ৳ {(analytics.totalDue / 10000000).toFixed(2)} Cr
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Scheduled payable vouchers</p>
        </div>
      </div>

      {/* 4. Pipeline Funnel & Mouza Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Pipeline Funnel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              Pipeline Velocity & Stage Distribution
            </h3>
            <span className="text-xs text-slate-400">Leads per stage</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.funnel.map((item, idx) => {
              const pct = Math.max(8, Math.round((item.count / analytics.maxFunnel) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.stage}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count} leads
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${item.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mouza-wise Land Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-600" />
              Mouza & Location Concentration
            </h3>
            <span className="text-xs text-slate-400">Area by region</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[310px] overflow-y-auto">
            {analytics.mouzaBreakdown.length > 0 ? (
              analytics.mouzaBreakdown.map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">
                      {m.mouza}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {m.count} parcels registered
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                      {m.totalArea.toFixed(1)} Decimals
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ≈ {(m.totalArea / 100).toFixed(2)} Acres
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No mouza location records recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Upcoming Installment Disbursements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Upcoming Settlement Installments & Projected Cash Outlay
          </h3>
          <span className="text-xs text-slate-400">Next scheduled disbursements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Lead / Parcel</th>
                <th className="py-2.5 px-3">Landowner</th>
                <th className="py-2.5 px-3 text-right">Agreed Value</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Remaining Due</th>
                <th className="py-2.5 px-3 text-center">Payment Mode</th>
                <th className="py-2.5 px-3">Scheduled At</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {settlements.slice(0, 5).map((s) => {
                const due = s.due ?? Math.max(0, s.agreed_amount - s.paid);
                return (
                  <tr key={s.id || s.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      {s.lead_code || s.lead}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.owner}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      ৳ {s.agreed_amount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                      ৳ {s.paid?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      ৳ {due.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase text-[11px] font-semibold text-slate-500">
                      {s.payment_mode}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{s.scheduled_at}</td>
                    <td className="py-2.5 px-3 text-center">
                      <LamsStatusBadge status={s.status} type="settlement" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
