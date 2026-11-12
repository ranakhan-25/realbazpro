"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, FileSignature, ShieldCheck, Calendar, MapPin,
  Building2, FileText, Download, Printer, CheckCircle2,
  AlertCircle, Hash, Loader2, Plus, User
} from "lucide-react";

// ============ TYPES ============
interface AgreementData {
  uuid: string;
  agreementCode: string;
  status: string;
  date: string;
  buyer: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAvatar: string | null;
  property: string;
  propertyCode: string;
  propertyType: string;
  price: number;
  advance: number;
  notes: string;
  image: string | null;
}

// ✅ ডেমো ডাটা (UI-তে পার্মানেন্ট দেখানোর জন্য)
const MOCK_AGREEMENT: AgreementData = {
  uuid: "demo-agr-uuid",
  agreementCode: "AGR-2024-001",
  status: "Signed",
  date: "2024-01-15",
  buyer: "Ayesha Rahman",
  buyerEmail: "ayesha@example.com",
  buyerPhone: "+880 1712-345678",
  buyerAvatar: "https://i.pravatar.cc/150?img=5",
  property: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyType: "Residential Land",
  price: 12000000,
  advance: 2400000,
  notes: "Handover scheduled on 2024-06-01. All terms agreed as per original draft.",
  image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
};

function formatDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(amount: number | string) {
  const n = Number(amount);
  if (!n || isNaN(n)) return "৳0";
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

export default function AgreementDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingUuid = (params?.uuid as string) || searchParams.get("uuid") || searchParams.get("bookingId") || "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ডাটা ফেচ (ডাটা না থাকলে MOCK ডাটা দেখাবে)
  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/agreement`);
        
        if (response.ok) {
          const result = await response.json();
          const agreementData = result?.data || result;
          if (agreementData && agreementData.uuid) {
            setData(agreementData);
            return;
          }
        }
      } catch (err) {
        console.log("API Error, using mock data");
      } finally {
        setLoading(false);
      }
      // ডাটা না পেলে ডেমো ডাটা সেট হবে
      setData(MOCK_AGREEMENT);
    };
    fetchAgreement();
  }, [bookingUuid]);

  // ✅ Create Function (API POST Call)
  const handleCreateAgreement = async () => {
    try {
      const payload = {
        agreementCode: `AGR-${Date.now()}`,
        buyer: "New Buyer",
        buyerEmail: "new@example.com",
        property: "New Property",
        price: 5000000,
        advance: 1000000,
        date: new Date().toISOString().split("T")[0],
        status: "Draft",
      };
      const response = await fetch(`http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create");
      toast.success("Agreement created successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create agreement");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  // ✅ ডাটা না থাকলে ডেমো ডাটা দেখাবে, তাই `if (!data)` এররটি সরানো হলো
  const displayData = data || MOCK_AGREEMENT;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Agreement Details
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {displayData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> ID: {displayData.agreementCode} • Signed on {formatDate(displayData.date)}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={handleCreateAgreement} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2">
               <Plus size={16}/> Create
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
             <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-600"/> Contract Parties</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border">
                    <p className="text-xs font-bold text-gray-500 mb-2">SELLER</p>
                    <p className="font-bold">Rahman Properties Ltd.</p>
                    <p className="text-sm text-gray-500 mt-1">Rep: Md. Abdul Rahman</p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-600 mb-2">BUYER</p>
                    <div className="flex items-center gap-2">
                       <img src={displayData.buyerAvatar || ""} className="w-8 h-8 rounded-full"/>
                       <div>
                          <p className="font-bold">{displayData.buyer}</p>
                          <p className="text-xs text-gray-500">{displayData.buyerEmail}</p>
                       </div>
                    </div>
                </div>
             </div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold mb-4">Key Terms</h3>
            <p className="text-sm bg-gray-50 p-4 rounded-xl border">{displayData.notes}</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
           <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Building2 size={18}/> Property</h3>
              <div className="flex items-center gap-3">
                 <img src={displayData.image || ""} className="w-16 h-16 rounded-xl object-cover"/>
                 <div>
                    <p className="font-bold">{displayData.property}</p>
                    <p className="text-xs text-gray-500">{displayData.propertyType}</p>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                 <div className="flex justify-between"><span>Price</span> <span className="font-bold">{formatMoney(displayData.price)}</span></div>
                 <div className="flex justify-between"><span>Advance</span> <span className="font-bold text-emerald-600">{formatMoney(displayData.advance)}</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}