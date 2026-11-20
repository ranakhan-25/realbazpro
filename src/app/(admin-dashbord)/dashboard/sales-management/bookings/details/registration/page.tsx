"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, FileCheck, Building2, MapPin, User, Hash,
  Calendar, FileText, Download, Printer, Landmark, ShieldCheck,
  CheckCircle2, Stamp, DollarSign, Loader2, Plus,
} from "lucide-react";

// ============ TYPES ============
interface RegistrationData {
  uuid: string;
  registrationId: string;
  status: string;
  deedNo: string;
  registrationDate: string;
  subRegistry: string;
  propertyValue: string;
  stampDuty: string;
  registrationFee: string;
  totalPaid: string;
  
  mutationStatus: string;
  mutationKhatiyanNo: string;
  mutationUpdatedDate: string;
  
  propertyName: string;
  propertyCode: string;
  propertyType: string;
  propertyArea: string;
  propertyImage: string | null;
  propertyLocation: string;
  
  buyerName: string;
  buyerNid: string;
  sellerName: string;
  sellerRep: string;
}

// ✅ ফেক ডাটা (Permanent)
const MOCK_REGISTRATION: RegistrationData = {
  uuid: "mock-reg-uuid",
  registrationId: "REG-2024-045",
  status: "Completed",
  deedNo: "1234/2024",
  registrationDate: "2024-02-25",
  subRegistry: "Sub-Registry Office, Gulshan",
  propertyValue: "12000000",
  stampDuty: "180000",
  registrationFee: "1200000",
  totalPaid: "1380000",
  
  mutationStatus: "Completed",
  mutationKhatiyanNo: "KH-8829-2024",
  mutationUpdatedDate: "2024-03-10",
  
  propertyName: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyType: "Residential Land",
  propertyArea: "5 katha",
  propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  propertyLocation: "Gulshan-2, Dhaka",
  
  buyerName: "Ayesha Rahman",
  buyerNid: "1990123456789",
  sellerName: "Rahman Properties Ltd.",
  sellerRep: "Md. Abdul Rahman",
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

function InfoRow({
  icon: Icon, label, value, isHighlight = false,
}: {
  icon: any; label: string; value: string | null; isHighlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className={`p-2 rounded-lg shrink-0 ${isHighlight ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${isHighlight ? "text-indigo-700 dark:text-indigo-400 font-bold" : "text-gray-900 dark:text-white"}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function RegistrationDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ ডাটা ফেচ (ডাটা না থাকলে MOCK ডাটা দেখাবে)
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/registration`
        );
        
        if (response.ok) {
          const result = await response.json();
          const regData = result?.data || result;
          if (regData && regData.uuid) {
            setData(regData);
            return;
          }
        }
      } catch (err) {
        console.log("API error, using mock data");
      } finally {
        setLoading(false);
      }
      // ডাটা না পেলে ডেমো ডাটা সেট হবে
      setData(MOCK_REGISTRATION);
    };
    fetchRegistration();
  }, [bookingUuid]);

  // ✅ Create Function (API POST Call)
  const handleCreateRegistration = async () => {
    try {
      setIsCreating(true);
      const payload = {
        registrationId: `REG-${Date.now()}`,
        status: "Pending",
        deedNo: "NEW/2024",
        registrationDate: new Date().toISOString().split("T")[0],
        subRegistry: "New Sub-Registry",
        propertyValue: 5000000,
        stampDuty: 75000,
        registrationFee: 500000,
        totalPaid: 575000,
        mutationStatus: "Pending",
        mutationKhatiyanNo: "KH-NEW-2024",
        mutationUpdatedDate: new Date().toISOString().split("T")[0],
        propertyName: "New Property",
        propertyCode: "NEW-001",
        propertyType: "Apartment",
        propertyArea: "1200 sqft",
        propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
        propertyLocation: "Banani, Dhaka",
        buyerName: "New Buyer",
        buyerNid: "1990123456789",
        sellerName: "New Seller Ltd.",
        sellerRep: "Md. New Seller",
      };
      
      const response = await fetch(
        `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) throw new Error("Failed to create");
      toast.success("Registration created successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create registration");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ✅ MOCK ডাটা ব্যবহার করা হচ্ছে, তাই কোনো এরর পেজ নেই
  const displayData = data || MOCK_REGISTRATION;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Legal Registration
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {displayData.status || "Active"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Registration ID: {displayData.registrationId || "N/A"} • Deed No: {displayData.deedNo || "N/A"}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCreateRegistration} 
              disabled={isCreating}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16}/> {isCreating ? "Creating..." : "Create Registration"}
            </button>
            <button onClick={() => toast("Preparing document for print...", { icon: "🖨️" })} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={() => toast.success("Downloading Deed...")} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Download Deed
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href={`/dashboard/sales-management/bookings/details/overview?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">Overview</Link>
          <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">Installments</Link>
          <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">Agreement</Link>
          <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">Registration</Link>
          <Link href={`/dashboard/sales-management/bookings/details/cancellation?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">Cancellation</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
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
                <InfoRow icon={FileCheck} label="Deed Number" value={displayData.deedNo} isHighlight />
                <InfoRow icon={Calendar} label="Registration Date" value={formatDate(displayData.registrationDate)} />
                <div className="md:col-span-2">
                  <InfoRow icon={Building2} label="Sub-Registry Office" value={displayData.subRegistry} />
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
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(displayData.propertyValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Stamp size={14}/> Stamp Duty</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(displayData.stampDuty)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Registration Fee</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(displayData.registrationFee)}</span>
                </div>
              </div>
              
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Govt. Fees Paid</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(displayData.totalPaid)}</p>
                </div>
                <ShieldCheck size={28} className="text-indigo-200 dark:text-indigo-800" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* MUTATION STATUS */}
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-5">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} /> Mutation Update
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Status:</span>
                <span className="font-bold">{displayData.mutationStatus || "N/A"}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Khatiyan No:</span>
                <span className="font-medium">{displayData.mutationKhatiyanNo || "N/A"}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Updated:</span>
                <span className="font-medium">{formatDate(displayData.mutationUpdatedDate)}</span>
              </div>
            </div>
          </div>

          {/* PROPERTY */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property Details
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {displayData.propertyImage ? (
                <img src={displayData.propertyImage} alt="Property" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <Building2 size={24} />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{displayData.propertyName || "N/A"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {displayData.propertyLocation || "N/A"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Code</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{displayData.propertyCode || "N/A"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-500">Area</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{displayData.propertyArea || "N/A"}</p>
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayData.buyerName || "N/A"}</p>
                <p className="text-xs text-gray-500">NID: {displayData.buyerNid || "N/A"}</p>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Seller</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayData.sellerName || "N/A"}</p>
                <p className="text-xs text-gray-500">Rep: {displayData.sellerRep || "N/A"}</p>
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