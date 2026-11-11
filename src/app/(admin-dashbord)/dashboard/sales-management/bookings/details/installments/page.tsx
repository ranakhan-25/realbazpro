"use client";

import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
  FileText,
  Hash,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// ============ STATIC DATA ============
const installmentData = {
  id: "PLN-2024-0021",
  totalPrice: 12000000,
  totalPaid: 4980000,
  totalRemaining: 7020000,
  progressPercent: 41.5,
  nextDueDate: "2024-08-01",
  nextDueAmount: 830000,
  installments: [
    { no: 1, date: "2024-02-01", amount: 830000, status: "Paid", paidOn: "2024-01-28", txn: "TXN-CB-8A2F" },
    { no: 2, date: "2024-03-01", amount: 830000, status: "Paid", paidOn: "2024-02-26", txn: "TXN-CB-8B3F" },
    { no: 3, date: "2024-04-01", amount: 830000, status: "Paid", paidOn: "2024-03-29", txn: "TXN-CB-8C4F" },
    { no: 4, date: "2024-05-01", amount: 830000, status: "Paid", paidOn: "2024-04-30", txn: "TXN-CB-8D5F" },
    { no: 5, date: "2024-06-01", amount: 830000, status: "Paid", paidOn: "2024-05-28", txn: "TXN-CB-8E6F" },
    { no: 6, date: "2024-07-01", amount: 830000, status: "Paid", paidOn: "2024-06-29", txn: "TXN-CB-8F7F" },
    { no: 7, date: "2024-08-01", amount: 830000, status: "Due", paidOn: null, txn: null },
    { no: 8, date: "2024-09-01", amount: 830000, status: "Upcoming", paidOn: null, txn: null },
    { no: 9, date: "2024-10-01", amount: 830000, status: "Upcoming", paidOn: null, txn: null },
    { no: 10, date: "2024-11-01", amount: 830000, status: "Upcoming", paidOn: null, txn: null },
    { no: 11, date: "2024-12-01", amount: 830000, status: "Upcoming", paidOn: null, txn: null },
    { no: 12, date: "2025-01-01", amount: 830000, status: "Upcoming", paidOn: null, txn: null },
  ],
};

const statusConfig: any = {
  Paid: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  Due: {
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    icon: AlertCircle,
  },
  Upcoming: {
    bg: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
    icon: Clock,
  },
};

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============ MAIN PAGE ============
export default function InstallmentsDetailsPage() {
  const data = installmentData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">
          Bookings
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">BK-2024-7845</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Installment Schedule
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Active Plan
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Plan ID: {data.id} • 12 Months Plan
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href="/dashboard/sales-management/bookings/details/overview" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Overview
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/installments" className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
            Installments
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/agreement" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Agreement
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/registration" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Registration
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/handover" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Handover
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/documents" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Documents
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Payment Timeline
              </h3>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {data.installments.length} Installments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">#</th>
                    <th className="px-6 py-4 font-medium">Due Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Paid On</th>
                    <th className="px-6 py-4 font-medium text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.installments.map((inst) => {
                    const cfg = statusConfig[inst.status];
                    const Icon = cfg.icon;
                    return (
                      <tr key={inst.no} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {inst.no}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                          {formatDate(inst.date)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {formatMoney(inst.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                            <Icon size={12} />
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {inst.paidOn ? formatDate(inst.paidOn) : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inst.status === "Paid" ? (
                            <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs flex items-center gap-1 justify-end ml-auto transition-colors">
                              <FileText size={14} /> View
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Summary */}
        <div className="space-y-6">
          
          {/* Financial Summary Card */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Financial Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500">Total Price</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(data.totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Total Paid</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(data.totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-amber-600 dark:text-amber-400">Remaining Balance</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatMoney(data.totalRemaining)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-4">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Payment Progress</span>
                <span>{data.progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Due Card */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/20">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Next Payment Due</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatMoney(data.nextDueAmount)}</p>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <Calendar size={14} /> Due on {formatDate(data.nextDueDate)}
            </p>
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition-colors border border-white/20">
              <DollarSign size={16} /> Pay Now
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}