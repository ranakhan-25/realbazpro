"use client";

import Link from "next/link";
import {
  ChevronRight,
  ArrowRightLeft,
  Building2,
  MapPin,
  User,
  FileText,
  Download,
  Printer,
  Hash,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  Users,
} from "lucide-react";

const transferData = {
  id: "TRF-2024-008",
  status: "Approved",
  transferDate: "2024-04-10",
  reason: "Sale to New Buyer (Assignment)",
  property: {
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  fromBuyer: {
    name: "Ayesha Rahman",
    nid: "1990123456789",
  },
  toBuyer: {
    name: "Karim Ahmed",
    nid: "1988987654321",
    phone: "+880 1912-345678",
  },
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export default function TransferDetailsPage() {
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
              Ownership Transfer
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {transferData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Transfer ID: {transferData.id} • {transferData.transferDate}
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
          <Link href=".../overview" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Overview</Link>
          <Link href=".../installments" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
          <Link href=".../agreement" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
          <Link href=".../registration" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
          <Link href=".../handover" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Handover</Link>
          <Link href=".../transfer" className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Transfer</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-indigo-600" /> Transfer Parties
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 relative">
              {/* From */}
              <div className="w-full sm:w-5/12 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center sm:text-left">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Transferor (From)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{transferData.fromBuyer.name}</p>
                <p className="text-sm text-gray-500 mt-1">NID: {transferData.fromBuyer.nid}</p>
              </div>

              {/* Arrow */}
              <div className="w-full sm:w-2/12 flex justify-center py-2 sm:py-0">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
                  <ArrowRightLeft size={24} className="rotate-90 sm:rotate-0" />
                </div>
              </div>

              {/* To */}
              <div className="w-full sm:w-5/12 p-5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center sm:text-left">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Transferee (To)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{transferData.toBuyer.name}</p>
                <p className="text-sm text-gray-500 mt-1">NID: {transferData.toBuyer.nid}</p>
                <p className="text-sm text-gray-500 mt-0.5">{transferData.toBuyer.phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Transfer Details
            </h3>
            <div className="space-y-1">
              <InfoRow icon={ShieldAlert} label="Reason for Transfer" value={transferData.reason} />
              <InfoRow icon={Calendar} label="Effective Date" value={transferData.transferDate} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={transferData.property.image} alt="Property" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{transferData.property.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {transferData.property.location}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Transfer Documents
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText size={16} className="text-red-500" /> Transfer Deed.pdf
                </span>
                <Download size={16} className="text-gray-400 group-hover:text-indigo-600" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText size={16} className="text-red-500" /> NOC Document.pdf
                </span>
                <Download size={16} className="text-gray-400 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}