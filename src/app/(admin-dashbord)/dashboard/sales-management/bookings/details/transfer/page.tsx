"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, ArrowRightLeft, Building2, MapPin, User,
  FileText, Download, Printer, Hash, CheckCircle2,
  Calendar, ShieldAlert, Loader2, Plus, X
} from "lucide-react";

// ============ TYPES ============
interface TransferData {
  uuid: string;
  transferId: string;
  status: string;
  transferDate: string;
  reason: string;
  propertyName: string;
  propertyCode: string;
  propertyImage: string | null;
  propertyLocation: string;
  fromBuyerName: string;
  fromBuyerNid: string;
  toBuyerName: string;
  toBuyerNid: string;
  toBuyerPhone: string;
}

// ============ MOCK DATA ============
const MOCK_TRANSFER: TransferData = {
  uuid: "mock-trf-uuid",
  transferId: "TRF-2024-008",
  status: "Approved",
  transferDate: "2024-04-10",
  reason: "Sale to New Buyer (Assignment)",
  propertyName: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  propertyLocation: "Gulshan-2, Dhaka",
  fromBuyerName: "Ayesha Rahman",
  fromBuyerNid: "1990123456789",
  toBuyerName: "Karim Ahmed",
  toBuyerNid: "1988987654321",
  toBuyerPhone: "+880 1912-345678",
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
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || "N/A"}</p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function TransferDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Modal Form State
  const [formData, setFormData] = useState({
    transferId: "",
    transferDate: new Date().toISOString().split("T")[0],
    reason: "",
    fromBuyerName: "",
    fromBuyerNid: "",
    toBuyerName: "",
    toBuyerNid: "",
    toBuyerPhone: "",
  });

  // ✅ Fetch Data
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/transfer`
        );
        if (response.ok) {
          const result = await response.json();
          const transferData = result?.data || result;
          if (transferData && transferData.uuid) {
            setData(transferData);
            return;
          }
        }
      } catch (err) {
        console.log("API error, using mock data");
      } finally {
        setLoading(false);
      }
      setData(MOCK_TRANSFER);
    };
    fetchTransfer();
  }, [bookingUuid]);

  // ✅ Save Function
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        transferId: formData.transferId || `TRF-${Date.now()}`,
        transferDate: formData.transferDate,
        reason: formData.reason || "Ownership Transfer",
        fromBuyerName: formData.fromBuyerName || "N/A",
        fromBuyerNid: formData.fromBuyerNid || "N/A",
        toBuyerName: formData.toBuyerName || "N/A",
        toBuyerNid: formData.toBuyerNid || "N/A",
        toBuyerPhone: formData.toBuyerPhone || "N/A",
      };

      const response = await fetch(
        `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/transfer`,
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

      toast.success("Transfer saved successfully!");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save transfer");
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

  const displayData = data || MOCK_TRANSFER;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* ===== CREATE MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Transfer</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Transfer Date
                  <input type="date" value={formData.transferDate} onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Reason
                  <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Sale to New Buyer" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  From Buyer Name
                  <input type="text" value={formData.fromBuyerName} onChange={(e) => setFormData({ ...formData, fromBuyerName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Ayesha Rahman" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  From Buyer NID
                  <input type="text" value={formData.fromBuyerNid} onChange={(e) => setFormData({ ...formData, fromBuyerNid: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="1990123456789" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  To Buyer Name
                  <input type="text" value={formData.toBuyerName} onChange={(e) => setFormData({ ...formData, toBuyerName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Karim Ahmed" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  To Buyer NID
                  <input type="text" value={formData.toBuyerNid} onChange={(e) => setFormData({ ...formData, toBuyerNid: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="1988987654321" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300 col-span-2">
                  To Buyer Phone
                  <input type="text" value={formData.toBuyerPhone} onChange={(e) => setFormData({ ...formData, toBuyerPhone: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="+880 1912-345678" />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : "Save Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Ownership Transfer
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {displayData.status || "Approved"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Transfer ID: {displayData.transferId || "N/A"} • {formatDate(displayData.transferDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Create Transfer
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
           <Link href={`/dashboard/sales-management/bookings/details/handover?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Handover</Link>
           <Link href={`/dashboard/sales-management/bookings/details/transfer?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Transfer</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* TRANSFER PARTIES */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-indigo-600" /> Transfer Parties
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative">
              <div className="w-full sm:w-5/12 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border text-center sm:text-left">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Transferor (From)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{displayData.fromBuyerName || "N/A"}</p>
                <p className="text-sm text-gray-500 mt-1">NID: {displayData.fromBuyerNid || "N/A"}</p>
              </div>
              <div className="w-full sm:w-2/12 flex justify-center py-2 sm:py-0">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                  <ArrowRightLeft size={24} className="rotate-90 sm:rotate-0" />
                </div>
              </div>
              <div className="w-full sm:w-5/12 p-5 rounded-xl bg-indigo-50 border border-indigo-200 text-center sm:text-left">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Transferee (To)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{displayData.toBuyerName || "N/A"}</p>
                <p className="text-sm text-gray-500 mt-1">NID: {displayData.toBuyerNid || "N/A"}</p>
                <p className="text-sm text-gray-500 mt-0.5">{displayData.toBuyerPhone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* TRANSFER DETAILS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Transfer Details
            </h3>
            <div className="space-y-1">
              <InfoRow icon={ShieldAlert} label="Reason for Transfer" value={displayData.reason} />
              <InfoRow icon={Calendar} label="Effective Date" value={formatDate(displayData.transferDate)} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
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

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Transfer Documents
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText size={16} className="text-red-500" /> Transfer Deed.pdf</span>
                <Download size={16} className="text-gray-400 group-hover:text-indigo-600" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText size={16} className="text-red-500" /> NOC Document.pdf</span>
                <Download size={16} className="text-gray-400 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}