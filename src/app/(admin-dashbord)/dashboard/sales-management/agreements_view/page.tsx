"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  LandPlot,
  MapPin,
  User,
  Mail,
  Phone,
  Download,
  Printer,
  Eye,
  MoreVertical,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  FileCheck,
} from "lucide-react";

// ============ STATIC DATA ============
const agreements = [
  {
    id: "AGR-2024-001",
    buyer: "Ayesha Rahman",
    buyerAvatar: "https://i.pravatar.cc/150?img=5",
    property: "Gulshan Plot 12/A",
    propertyCode: "GUL-PLT-012",
    propertyType: "Residential Land",
    price: 12000000,
    advance: 2400000,
    date: "2024-01-15",
    status: "Signed",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
  },
  {
    id: "AGR-2024-002",
    buyer: "Arif Hossain",
    buyerAvatar: "https://i.pravatar.cc/150?img=12",
    property: "Bashundhara Apartment 7B",
    propertyCode: "BSH-APT-007",
    propertyType: "Apartment",
    price: 6500000,
    advance: 1300000,
    date: "2024-01-18",
    status: "Pending",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
  },
  {
    id: "AGR-2024-003",
    buyer: "Sadia Islam",
    buyerAvatar: "https://i.pravatar.cc/150?img=9",
    property: "Dhanmondi Commercial Space",
    propertyCode: "DHN-COM-003",
    propertyType: "Commercial",
    price: 9500000,
    advance: 1900000,
    date: "2024-01-20",
    status: "Signed",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
  },
  {
    id: "AGR-2024-004",
    buyer: "Rakib Khan",
    buyerAvatar: "https://i.pravatar.cc/150?img=11",
    property: "Uttara Villa 4C",
    propertyCode: "UTT-VIL-004",
    propertyType: "Villa",
    price: 15000000,
    advance: 3000000,
    date: "2024-01-22",
    status: "Draft",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop",
  },
  {
    id: "AGR-2024-005",
    buyer: "Mim Akter",
    buyerAvatar: "https://i.pravatar.cc/150?img=20",
    property: "Mirpur Plot 22",
    propertyCode: "MRP-PLT-022",
    propertyType: "Residential Land",
    price: 7200000,
    advance: 1440000,
    date: "2024-01-25",
    status: "Signed",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
  },
];

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  Signed: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  Draft: {
    bg: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    icon: FileText,
  },
};

// ============ COMPONENTS ============

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

export default function AgreementsViewPage() {
  const [search, setSearch] = useState("");

  const filtered = agreements.filter(
    (item) =>
      item.buyer.toLowerCase().includes(search.toLowerCase()) ||
      item.property.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate top stats based on static list
  const totalValue = agreements.reduce((sum, item) => sum + item.price, 0);
  const signedCount = agreements.filter((a) => a.status === "Signed").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/dashboard/sales-management/payment-plans"
          className="hover:text-indigo-600 transition-colors"
        >
          Payment Plans
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Agreements</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Agreements View
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage property sale agreements, contracts, and buyer details.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <Download size={16} /> Export
          </button>
          <Link href="/dashboard/sales-management/agreements_create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> New Agreement
          </Link>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <FileCheck size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Agreements
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {agreements.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle2 size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Signed Contracts
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {signedCount}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Clock size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Pending Action
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {agreements.filter((a) => a.status !== "Signed").length}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(totalValue)}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 mb-6 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by buyer, property, or Agreement ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors shrink-0">
          <Filter size={16} /> Filter Status
        </button>
      </div>

      {/* AGREEMENTS LIST */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No agreements found matching your search.</p>
          </div>
        )}

        {filtered.map((agreement) => {
          const cfg = statusConfig[agreement.status];
          const StatusIcon = cfg.icon;

          return (
            <div
              key={agreement.id}
              className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                {/* Property & ID */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img
                    src={agreement.image}
                    alt={agreement.property}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                        {agreement.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text}`}
                      >
                        <StatusIcon size={10} />
                        {agreement.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {agreement.property}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} /> {agreement.propertyCode} • {agreement.propertyType}
                    </p>
                  </div>
                </div>

                {/* Buyer */}
                <div className="flex items-center gap-3 lg:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                  <img
                    src={agreement.buyerAvatar}
                    alt={agreement.buyer}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {agreement.buyer}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Buyer
                    </p>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-2 gap-4 lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold mb-0.5">
                      Total Price
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatMoney(agreement.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold mb-0.5">
                      Advance
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatMoney(agreement.advance)}
                    </p>
                  </div>
                </div>

                {/* Date & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-48 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar size={14} />
                    {formatDate(agreement.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      title="View Agreement"
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      title="Download PDF"
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      title="More Options"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
