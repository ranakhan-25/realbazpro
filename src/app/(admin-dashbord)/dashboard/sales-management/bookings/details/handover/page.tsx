"use client";

import Link from "next/link";
import {
  ChevronRight,
  Key,
  Building2,
  MapPin,
  User,
  Calendar,
  Clock,
  Zap,
  Droplets,
  CheckCircle2,
  FileText,
  Download,
  Printer,
  Hash,
  ShieldCheck,
  Camera,
} from "lucide-react";

const handoverData = {
  id: "HND-2024-012",
  status: "Completed",
  handoverDate: "2024-03-01",
  handoverTime: "10:30 AM",
  property: {
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  buyer: {
    name: "Ayesha Rahman",
    avatar: "https://i.pravatar.cc/150?img=5",
    phone: "+880 1712-345678",
  },
  meters: {
    electricity: "1450 kWh",
    water: "320 m³",
    gas: "85 Units",
  },
  checklist: [
    { label: "Main Door & Utility Keys", done: true },
    { label: "Original Deed & NOC Copies", done: true },
    { label: "Physical Inspection Completed", done: true },
    { label: "Utility Bill Clearance", done: true },
  ],
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

export default function HandoverDetailsPage() {
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
              Property Handover
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {handoverData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Handover ID: {handoverData.id}
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
          <Link href=".../handover" className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Handover</Link>
          <Link href=".../transfer" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Transfer</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule & Meters */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> Handover Schedule & Utilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <InfoRow icon={Calendar} label="Date" value={handoverData.handoverDate} />
                <InfoRow icon={Clock} label="Time" value={handoverData.handoverTime} />
              </div>
              <div className="space-y-1">
                <InfoRow icon={Zap} label="Electricity Reading" value={handoverData.meters.electricity} />
                <InfoRow icon={Droplets} label="Water Reading" value={handoverData.meters.water} />
                <InfoRow icon={ShieldCheck} label="Gas Reading" value={handoverData.meters.gas} />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-600" /> Handover Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {handoverData.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={handoverData.property.image} alt="Property" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{handoverData.property.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {handoverData.property.location}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Received By
            </h3>
            <div className="flex items-center gap-3">
              <img src={handoverData.buyer.avatar} alt="Buyer" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{handoverData.buyer.name}</p>
                <p className="text-xs text-gray-500">{handoverData.buyer.phone}</p>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Camera size={18} /> View Handover Photos
          </button>
        </div>
      </div>
    </div>
  );
}