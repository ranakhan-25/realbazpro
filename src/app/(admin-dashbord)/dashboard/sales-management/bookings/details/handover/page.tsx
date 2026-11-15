"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, Building2, MapPin, User, Calendar, Clock,
  Zap, Droplets, CheckCircle2, FileText, Download, Printer,
  Hash, ShieldCheck, Camera, Loader2, Plus, X
} from "lucide-react";

// ============ TYPES ============
interface ChecklistItem {
  label: string;
  done: boolean;
}

interface HandoverData {
  uuid: string;
  handoverId: string;
  status: string;
  handoverDate: string;
  handoverTime: string;
  electricityReading: string;
  waterReading: string;
  gasReading: string;
  checklist: ChecklistItem[];
  propertyName: string;
  propertyCode: string;
  propertyImage: string | null;
  propertyLocation: string;
  buyerName: string;
  buyerAvatar: string | null;
  buyerPhone: string;
}

// ============ MOCK DATA ============
const MOCK_HANDOVER: HandoverData = {
  uuid: "mock-hnd-uuid",
  handoverId: "HND-2024-012",
  status: "Completed",
  handoverDate: "2024-03-01",
  handoverTime: "10:30 AM",
  electricityReading: "1450 kWh",
  waterReading: "320 m³",
  gasReading: "85 Units",
  checklist: [
    { label: "Main Door & Utility Keys", done: true },
    { label: "Original Deed & NOC Copies", done: true },
    { label: "Physical Inspection Completed", done: true },
    { label: "Utility Bill Clearance", done: true },
  ],
  propertyName: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  propertyLocation: "Gulshan-2, Dhaka",
  buyerName: "Ayesha Rahman",
  buyerAvatar: "https://i.pravatar.cc/150?img=5",
  buyerPhone: "+880 1712-345678",
};

// ============ HELPERS ============
function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function HandoverDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<HandoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Modal Form State
  const [formData, setFormData] = useState({
    handoverId: "",
    handoverDate: new Date().toISOString().split("T")[0],
    handoverTime: "10:00 AM",
    electricityReading: "",
    waterReading: "",
    gasReading: "",
    status: "Pending",
  });

  // ✅ Fetch Data
  useEffect(() => {
    const fetchHandover = async () => {
      try {
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/handover`
        );
        if (response.ok) {
          const result = await response.json();
          const handoverData = result?.data || result;
          if (handoverData && handoverData.uuid) {
            if (!Array.isArray(handoverData.checklist)) {
              handoverData.checklist = [];
            }
            setData(handoverData);
            return;
          }
        }
      } catch (err) {
        console.log("API error, using mock data");
      } finally {
        setLoading(false);
      }
      setData(MOCK_HANDOVER);
    };
    fetchHandover();
  }, [bookingUuid]);

  // ✅ Save Function
  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        handoverId: formData.handoverId || `HND-${Date.now()}`,
        handoverDate: formData.handoverDate,
        handoverTime: formData.handoverTime,
        electricityReading: formData.electricityReading || "0",
        waterReading: formData.waterReading || "0",
        gasReading: formData.gasReading || "0",
        status: formData.status,
        checklist: [
          { label: "Main Door & Utility Keys", done: false },
          { label: "Original Deed & NOC Copies", done: false },
        ],
      };

      const response = await fetch(
        `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/handover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save");
      }

      toast.success("Handover saved successfully!");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save handover");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const displayData = data || MOCK_HANDOVER;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* ===== CREATE MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Handover</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateHandover} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Handover Date
                  <input type="date" value={formData.handoverDate} onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Handover Time
                  <input type="text" value={formData.handoverTime} onChange={(e) => setFormData({ ...formData, handoverTime: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="10:00 AM" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Electricity Reading
                  <input type="text" value={formData.electricityReading} onChange={(e) => setFormData({ ...formData, electricityReading: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. 1450 kWh" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Water Reading
                  <input type="text" value={formData.waterReading} onChange={(e) => setFormData({ ...formData, waterReading: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. 320 m³" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Gas Reading
                  <input type="text" value={formData.gasReading} onChange={(e) => setFormData({ ...formData, gasReading: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. 85 Units" />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : "Save Handover"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Property Handover
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {displayData.status || "Active"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Handover ID: {displayData.handoverId || "N/A"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Create Handover
            </button>
            <button onClick={() => toast("Preparing document for print...", { icon: "🖨️" })} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href={`/dashboard/sales-management/bookings/details/overview?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Overview</Link>
          <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
          <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
          <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
          <Link href={`/dashboard/sales-management/bookings/details/handover?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Handover</Link>
          <Link href={`/dashboard/sales-management/bookings/details/transfer?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Transfer</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule & Meters */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> Handover Schedule & Utilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <InfoRow icon={Calendar} label="Date" value={formatDate(displayData.handoverDate)} />
                <InfoRow icon={Clock} label="Time" value={displayData.handoverTime} />
              </div>
              <div className="space-y-1">
                <InfoRow icon={Zap} label="Electricity Reading" value={displayData.electricityReading} />
                <InfoRow icon={Droplets} label="Water Reading" value={displayData.waterReading} />
                <InfoRow icon={ShieldCheck} label="Gas Reading" value={displayData.gasReading} />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-600" /> Handover Checklist
            </h3>
            {displayData.checklist.length === 0 ? (
              <p className="text-sm text-gray-500">No checklist items available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayData.checklist.map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${item.done ? "border-emerald-100 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                    <CheckCircle2 size={18} className={`shrink-0 ${item.done ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${item.done ? "text-emerald-800" : "text-gray-600"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Property */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {displayData.propertyImage ? (
                <img src={displayData.propertyImage} alt="Property" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><Building2 size={24} /></div>
              )}
              <div>
                <p className="font-bold text-sm">{displayData.propertyName || "N/A"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {displayData.propertyLocation || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Received By */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Received By
            </h3>
            <div className="flex items-center gap-3">
              {displayData.buyerAvatar ? (
                <img src={displayData.buyerAvatar} alt="Buyer" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={24} /></div>
              )}
              <div>
                <p className="font-bold text-sm">{displayData.buyerName || "N/A"}</p>
                <p className="text-xs text-gray-500">{displayData.buyerPhone || "N/A"}</p>
              </div>
            </div>
          </div>

          <button onClick={() => toast.success("Opening handover photos...")} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">
            <Camera size={18} /> View Handover Photos
          </button>
        </div>
      </div>
    </div>
  );
}