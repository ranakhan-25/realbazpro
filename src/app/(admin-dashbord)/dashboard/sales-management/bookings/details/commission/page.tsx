"use client";

import Link from "next/link";
import {
  ChevronRight,
  Wallet,
  Building2,
  User,
  Hash,
  CheckCircle2,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Calendar,
  Percent,
} from "lucide-react";

const commissionData = {
  id: "COM-2024-085",
  status: "Paid",
  dealValue: 12000000,
  commissionRate: 2.5, // %
  grossCommission: 300000,
  deductions: 15000, // TDS/Tax
  netCommission: 285000,
  paidDate: "2024-03-05",
  txnId: "TXN-CB-9F8E7D6C",
  agent: {
    name: "Rashed Karim",
    role: "Senior Property Consultant",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
};

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

export default function CommissionDetailsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">BK-2024-7845</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Agent Commission
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {commissionData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Commission ID: {commissionData.id}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
           <Link href="/dashboard/sales-management/bookings/details/overview" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Overview</Link>
           <Link href="/dashboard/sales-management/bookings/details/installments" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
           <Link href="/dashboard/sales-management/bookings/details/agreement" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
           <Link href="/dashboard/sales-management/bookings/details/registration" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
           <Link href="/dashboard/sales-management/bookings/details/commission" className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Commission</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <DollarSign size={18} />
              <span className="text-sm font-medium">Net Commission Earned</span>
            </div>
            <p className="text-4xl font-extrabold">{formatMoney(commissionData.netCommission)}</p>
            <p className="text-sm mt-2 opacity-80 flex items-center gap-1">
              <Calendar size={14} /> Paid on {commissionData.paidDate}
            </p>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Calculation Breakdown
            </h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">Property Deal Value</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(commissionData.dealValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Percent size={14}/> Commission Rate
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{commissionData.commissionRate}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">Gross Commission</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(commissionData.grossCommission)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-red-500 dark:text-red-400">Deductions (TDS/Tax)</span>
                <span className="text-sm font-semibold text-red-500 dark:text-red-400">-{formatMoney(commissionData.deductions)}</span>
              </div>
            </div>
            <div className="flex justify-between py-3 bg-gray-50 dark:bg-gray-800/50 px-4 rounded-xl mt-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Net Payout</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(commissionData.netCommission)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Agent Details
            </h3>
            <div className="flex items-center gap-3">
              <img src={commissionData.agent.avatar} alt="Agent" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{commissionData.agent.name}</p>
                <p className="text-xs text-gray-500">{commissionData.agent.role}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-indigo-600" /> Payment Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{commissionData.txnId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{commissionData.paidDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
