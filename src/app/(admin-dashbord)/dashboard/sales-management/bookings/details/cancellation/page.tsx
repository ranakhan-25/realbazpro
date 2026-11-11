"use client";

import Link from "next/link";
import {
  ChevronRight,
  XCircle,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  Download,
  Printer,
  DollarSign,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Building2,
  MapPin,
  Hash,
  ShieldAlert,
} from "lucide-react";

// ============ STATIC DATA ============
const cancellationData = {
  id: "CAN-2024-012",
  status: "Refund Processed",
  bookingId: "BK-2024-7845",
  cancellationDate: "2024-03-15",
  processedBy: "Farhana Ahmed (Property Advisor)",
  reason: "Failed to Secure Financing",
  notes: "Buyer was unable to secure the final 30% bank loan. Initiated mutual cancellation as per Clause 4.2 of the agreement.",
  
  property: {
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    area: "5 katha",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  
  buyer: {
    name: "Ayesha Rahman",
    email: "ayesha.rahman@example.com",
    phone: "+880 1712-345678",
    avatar: "https://i.pravatar.cc/150?img=5",
    nid: "1990123456789",
  },

  financials: {
    totalPrice: 12000000,
    totalPaid: 4980000,
    cancellationFee: 498000, // 10% penalty
    refundAmount: 4482000,
    refundMethod: "Bank Transfer (City Bank)",
    refundTxnId: "REF-CB-9F8E7D6C",
    refundDate: "2024-03-18",
    refundStatus: "Completed",
  },
};

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  "Refund Processed": {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
};

// ============ COMPONENTS ============

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============

export default function CancellationDetailsPage() {
  const data = cancellationData;
  const StatusIcon = statusConfig[data.status].icon;

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
        <span className="text-gray-900 dark:text-white font-medium">{data.bookingId}</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Cancellation Details
              <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <XCircle size={12} /> Cancelled
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border ${statusConfig[data.status].bg} ${statusConfig[data.status].text}`}>
                <StatusIcon size={12} /> {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Cancellation ID: {data.id} • Processed on {data.cancellationDate}
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
          <Link href="/dashboard/sales-management/bookings/details/installments" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Installments
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/agreement" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Agreement
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/cancellation" className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
            Cancellation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Financials & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FINANCIAL SETTLEMENT */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <DollarSign size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Financial Settlement</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Total Paid by Buyer</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(data.financials.totalPaid)}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1"><TrendingDown size={12}/> Cancellation Fee</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatMoney(data.financials.cancellationFee)}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Refunded</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(data.financials.refundAmount)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <InfoRow icon={Building2} label="Refund Method" value={data.financials.refundMethod} />
                <InfoRow icon={Hash} label="Refund Transaction ID" value={data.financials.refundTxnId} />
                <InfoRow icon={Calendar} label="Refund Date" value={data.financials.refundDate} />
                <InfoRow icon={CheckCircle2} label="Refund Status" value={data.financials.refundStatus} />
              </div>
            </div>
          </div>

          {/* CANCELLATION REASON & NOTES */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                <FileText size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Reason & Notes</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Primary Reason</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  {data.reason}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                  {data.notes}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Property & Buyer Info */}
        <div className="space-y-6">
          
          {/* PROPERTY CARD */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property Details
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={data.property.image} alt="Property" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{data.property.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {data.property.location}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Code</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{data.property.code}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Area</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{data.property.area}</p>
              </div>
            </div>
          </div>

          {/* BUYER CARD */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Buyer Details
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={data.buyer.avatar} alt="Buyer" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{data.buyer.name}</p>
                <p className="text-xs text-gray-500">NID: {data.buyer.nid}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {data.buyer.email}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {data.buyer.phone}</div>
            </div>
          </div>

          {/* AUDIT INFO */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-indigo-600" /> Audit Info
            </h3>
            <div className="space-y-1">
              <InfoRow icon={Calendar} label="Cancelled On" value={data.cancellationDate} />
              <InfoRow icon={User} label="Processed By" value={data.processedBy} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}