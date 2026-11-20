"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, XCircle, Calendar, Clock, User, Mail, Phone,
  FileText, Download, Printer, DollarSign, TrendingDown,
  CheckCircle2, Building2, MapPin, Hash, ShieldAlert, Loader2, Plus, X
} from "lucide-react";

// ============ TYPES ============
interface CancellationData {
  uuid: string;
  cancellationId: string;
  status: string;
  bookingId: string;
  cancellationDate: string;
  processedBy: string;
  reason: string;
  notes: string;
  totalPaid: string;
  cancellationFee: string;
  refundAmount: string;
  refundMethod: string | null;
  refundTxnId: string | null;
  refundDate: string | null;
  refundStatus: string | null;
  propertyName: string;
  propertyCode: string | null;
  propertyType: string | null;
  propertyArea: string | null;
  propertyImage: string | null;
  propertyLocation: string | null;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerAvatar: string | null;
  buyerNid: string | null;
}

// ============ MOCK DATA ============
const MOCK_CANCELLATION: CancellationData = {
  uuid: "mock-cxl-uuid",
  cancellationId: "CAN-2024-012",
  status: "Refund Processed",
  bookingId: "8266761a-5943-4eb0-9d9e-e2cfc858473a",
  cancellationDate: "2024-03-15",
  processedBy: "Farhana Ahmed (Property Advisor)",
  reason: "Failed to Secure Financing",
  notes: "Buyer was unable to secure the final 30% bank loan. Initiated mutual cancellation as per Clause 4.2 of the agreement.",
  totalPaid: "4980000",
  cancellationFee: "498000",
  refundAmount: "4482000",
  refundMethod: "Bank Transfer (City Bank)",
  refundTxnId: "REF-CB-9F8E7D6C",
  refundDate: "2024-03-18",
  refundStatus: "Completed",
  propertyName: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyType: "Residential Land",
  propertyArea: "5 katha",
  propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  propertyLocation: "Gulshan-2, Dhaka",
  buyerName: "Ayesha Rahman",
  buyerEmail: "ayesha.rahman@example.com",
  buyerPhone: "+880 1712-345678",
  buyerAvatar: "https://i.pravatar.cc/150?img=5",
  buyerNid: "1990123456789",
};

// ============ HELPERS ============
function formatMoney(n: string | number) {
  const num = Number(n);
  if (!num || isNaN(num)) return "৳0";
  if (num >= 10_000_000) return `৳${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `৳${(num / 100_000).toFixed(2)} L`;
  return `৳${num.toLocaleString()}`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  "Refund Processed": { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  Completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  Pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || "N/A"}</p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function CancellationDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<CancellationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Modal Form State
  const [formData, setFormData] = useState({
    reason: "",
    cancellationDate: new Date().toISOString().split("T")[0],
    refundAmount: "",
    penaltyFee: "",
    notes: "",
    status: "Pending",
    processedBy: "Admin",
  });

  // ✅ Fetch Data
  useEffect(() => {
    const fetchCancellation = async () => {
      try {
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/cancellation`
        );
        if (response.ok) {
          const result = await response.json();
          const cancellationData = result?.data || result;
          if (cancellationData && cancellationData.uuid) {
            setData(cancellationData);
            return;
          }
        }
      } catch (err) {
        console.log("API error, using mock data");
      } finally {
        setLoading(false);
      }
      setData(MOCK_CANCELLATION);
    };
    fetchCancellation();
  }, [bookingUuid]);

  // ✅ Save Function (API Call)
  const handleCreateCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        reason: formData.reason || "Buyer Changed Mind",
        cancellationDate: formData.cancellationDate,
        refundAmount: Number(formData.refundAmount) || 0,
        penaltyFee: Number(formData.penaltyFee) || 0,
        notes: formData.notes,
        status: formData.status,
        processedBy: formData.processedBy,
      };

      const response = await fetch(
        `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/cancellation`,
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

      toast.success("Cancellation saved successfully!");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save cancellation");
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

  const displayData = data || MOCK_CANCELLATION;
  const statusCfg = statusConfig[displayData.status] || statusConfig["Pending"];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* ===== CREATE MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Cancellation</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCancellation} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Reason
                  <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Buyer Changed Mind" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Date
                  <input type="date" value={formData.cancellationDate} onChange={(e) => setFormData({ ...formData, cancellationDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Refund Amount (৳)
                  <input type="number" value={formData.refundAmount} onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Penalty Fee (৳)
                  <input type="number" value={formData.penaltyFee} onChange={(e) => setFormData({ ...formData, penaltyFee: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0" />
                </label>
              </div>
              <label className="text-sm text-gray-600 dark:text-gray-300 block">
                Notes
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Enter notes..." />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : "Save Cancellation"}
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
              Cancellation Details
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <XCircle size={12} /> Cancelled
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon size={12} /> {displayData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> ID: {displayData.cancellationId} • Processed on {formatDate(displayData.cancellationDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Create Cancellation
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
          <Link href={`/dashboard/sales-management/bookings/details/cancellation?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Cancellation</Link>
          <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
          <Link href={`/dashboard/sales-management/bookings/details/handover?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Handover</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* FINANCIAL SETTLEMENT */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-indigo-600" /> Financial Settlement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Total Paid by Buyer</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(displayData.totalPaid)}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1"><TrendingDown size={12}/> Cancellation Fee</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatMoney(displayData.cancellationFee)}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Refunded</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(displayData.refundAmount)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow icon={Building2} label="Refund Method" value={displayData.refundMethod} />
              <InfoRow icon={Hash} label="Refund Transaction ID" value={displayData.refundTxnId} />
              <InfoRow icon={Calendar} label="Refund Date" value={formatDate(displayData.refundDate)} />
              <InfoRow icon={CheckCircle2} label="Refund Status" value={displayData.refundStatus} />
            </div>
          </div>

          {/* REASON & NOTES */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Reason & Notes
            </h3>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Primary Reason</p>
              <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border">{displayData.reason || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">{displayData.notes || "No additional notes provided."}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* PROPERTY */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property Details
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
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-gray-50"><p className="text-[10px] text-gray-500">Code</p><p className="text-xs font-semibold">{displayData.propertyCode || "N/A"}</p></div>
              <div className="p-2.5 rounded-lg bg-gray-50"><p className="text-[10px] text-gray-500">Area</p><p className="text-xs font-semibold">{displayData.propertyArea || "N/A"}</p></div>
            </div>
          </div>

          {/* BUYER */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Buyer Details
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {displayData.buyerAvatar ? (
                <img src={displayData.buyerAvatar} alt="Buyer" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={24} /></div>
              )}
              <div>
                <p className="font-bold text-sm">{displayData.buyerName || "N/A"}</p>
                <p className="text-xs text-gray-500">NID: {displayData.buyerNid || "N/A"}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {displayData.buyerEmail || "N/A"}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {displayData.buyerPhone || "N/A"}</div>
            </div>
          </div>

          {/* AUDIT */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-indigo-600" /> Audit Info
            </h3>
            <div className="space-y-1">
              <InfoRow icon={Calendar} label="Cancelled On" value={formatDate(displayData.cancellationDate)} />
              <InfoRow icon={User} label="Processed By" value={displayData.processedBy} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}