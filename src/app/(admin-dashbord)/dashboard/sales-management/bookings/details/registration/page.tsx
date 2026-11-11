"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileCheck,
  Building2,
  MapPin,
  User,
  Hash,
  Calendar,
  FileText,
  Download,
  Printer,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Stamp,
  DollarSign,
  Info,
} from "lucide-react";

// ============ STATIC DATA ============
const registrationData = {
  id: "REG-2024-045",
  status: "Completed",
  deedNo: "1234/2024",
  registrationDate: "2024-02-25",
  subRegistry: "Sub-Registry Office, Gulshan",
  
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
    nid: "1990123456789",
  },
  seller: {
    name: "Rahman Properties Ltd.",
    rep: "Md. Abdul Rahman",
  },

  financials: {
    propertyValue: 12000000,
    stampDuty: 180000,      // 1.5%
    registrationFee: 1200000, // 10%
    totalPaid: 1380000,
  },

  mutation: {
    status: "Completed",
    khatiyanNo: "KH-8829-2024",
    updatedDate: "2024-03-10",
  }
};

// ============ COMPONENTS ============

function InfoRow({
  icon: Icon,
  label,
  value,
  isHighlight = false,
}: {
  icon: any;
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className={`p-2 rounded-lg shrink-0 ${isHighlight ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${isHighlight ? "text-indigo-700 dark:text-indigo-400 font-bold" : "text-gray-900 dark:text-white"}`}>
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

export default function RegistrationDetailsPage() {
  const data = registrationData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">BK-2024-7845</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Legal Registration
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Registration ID: {data.id} • Deed No: {data.deedNo}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Download Deed
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
          <Link href="/dashboard/sales-management/bookings/details/registration" className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
            Registration
          </Link>
          <Link href="/dashboard/sales-management/bookings/details/cancellation" className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Cancellation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Legal & Financials */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* REGISTRY DETAILS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Landmark size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Registration Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <InfoRow icon={FileCheck} label="Deed Number" value={data.deedNo} isHighlight />
                <InfoRow icon={Calendar} label="Registration Date" value={data.registrationDate} />
                <div className="md:col-span-2">
                  <InfoRow icon={Building2} label="Sub-Registry Office" value={data.subRegistry} />
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL SETTLEMENT */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <DollarSign size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Government Fees Paid</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Property Value</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(data.financials.propertyValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Stamp size={14}/> Stamp Duty (1.5%)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(data.financials.stampDuty)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Registration Fee (10%)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(data.financials.registrationFee)}</span>
                </div>
              </div>
              
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Govt. Fees Paid</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(data.financials.totalPaid)}</p>
                </div>
                <ShieldCheck size={28} className="text-indigo-200 dark:text-indigo-800" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Mutation, Property & Parties */}
        <div className="space-y-6">
          
          {/* MUTATION STATUS */}
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-5">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} /> Mutation Update
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Status:</span>
                <span className="font-bold">{data.mutation.status}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Khatiyan No:</span>
                <span className="font-medium">{data.mutation.khatiyanNo}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Updated:</span>
                <span className="font-medium">{data.mutation.updatedDate}</span>
              </div>
            </div>
          </div>

          {/* PROPERTY */}
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

          {/* PARTIES */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Registered Parties
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Buyer</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.buyer.name}</p>
                <p className="text-xs text-gray-500">NID: {data.buyer.nid}</p>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Seller</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.seller.name}</p>
                <p className="text-xs text-gray-500">Rep: {data.seller.rep}</p>
              </div>
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Registry Documents
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText size={16} className="text-red-500" /> Registered Deed.pdf
                </span>
                <Download size={16} className="text-gray-400 group-hover:text-indigo-600" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText size={16} className="text-red-500" /> Mutation Khatiyan.pdf
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