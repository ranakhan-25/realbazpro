"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileSignature,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Building2,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Hash,
  ChevronDown,
} from "lucide-react";

// ============ STATIC DATA ============
const agreementData = {
  id: "AGR-2024-001",
  status: "Signed",
  signedDate: "2024-01-15",
  expiryDate: "2024-12-31",
  property: {
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  seller: {
    name: "Rahman Properties Ltd.",
    signatory: "Md. Abdul Rahman",
    nid: "1980123456789",
    address: "House 12, Road 5, Gulshan-1, Dhaka",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  buyer: {
    name: "Ayesha Rahman",
    nid: "1990123456789",
    address: "House 42, Road 11, Banani, Dhaka",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  terms: [
    "The Buyer agrees to pay the total consideration amount as per the mutually agreed installment schedule.",
    "The Seller guarantees that the property is free from all legal disputes, mortgages, and encumbrances.",
    "Transfer of ownership will be executed only upon the successful registration of the deed at the Sub-Registry office.",
    "In the event of a default in payment by the Buyer for more than 60 days, the Seller reserves the right to cancel the agreement with a written notice.",
  ],
  documents: [
    { name: "Main Sale Agreement.pdf", size: "2.4 MB", date: "2024-01-15" },
    { name: "Addendum_1.pdf", size: "1.1 MB", date: "2024-01-20" },
    { name: "NOC_Document.pdf", size: "850 KB", date: "2024-01-10" },
  ],
};

// ============ COMPONENTS ============

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============ MAIN PAGE ============

export default function AgreementDetailsPage() {
  const data = agreementData;

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
              Agreement Details
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Agreement ID: {data.id} • Signed on {formatDate(data.signedDate)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Download PDF
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
          <Link href="/dashboard/sales-management/bookings/details/agreement" className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
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
        
        {/* LEFT COLUMN - Parties & Terms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CONTRACT PARTIES */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Contract Parties</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                
                {/* Seller */}
                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Seller / Developer</p>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={data.seller.avatar} alt="Seller" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{data.seller.name}</p>
                      <p className="text-xs text-gray-500">Rep: {data.seller.signatory}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <p>NID: {data.seller.nid}</p>
                    <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {data.seller.address}</p>
                  </div>
                </div>
                
                {/* Buyer */}
                <div className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Buyer</p>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={data.buyer.avatar} alt="Buyer" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{data.buyer.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <p>NID: {data.buyer.nid}</p>
                    <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {data.buyer.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <FileSignature size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Key Terms & Conditions</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {data.terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Meta & Documents */}
        <div className="space-y-6">
          
          {/* PROPERTY INFO */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property
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
            
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} /> Signed Date
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(data.signedDate)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertCircle size={14} className="text-amber-500" /> Expiry Date
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(data.expiryDate)}</p>
              </div>
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Attached Documents
            </h3>
            <div className="space-y-2">
              {data.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate max-w-[150px] sm:max-w-xs">{doc.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{doc.size} • {formatDate(doc.date)}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Documents are legally binding and securely encrypted. Downloading them generates an audit log.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}