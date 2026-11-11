"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation"; // useSearchParams অ্যাড করা হয়েছে
import {
  ChevronRight,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Hash,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ============ TYPES ============
interface BookingData {
  id: string;
  status: string;
  bookingDate: string;
  property: {
    name: string;
    code: string;
    type: string;
    area: string;
    price: number;
    location: string;
    image: string;
  };
  buyer: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    nid: string;
    address: string;
  };
  agent: {
    name: string;
    role: string;
    avatar: string;
  };
  financials: {
    totalPrice: number;
    paid: number;
    remaining: number;
    nextDue: string;
    nextAmount: number;
  };
  progress: number;
}

function formatMoney(n: number) {
  if (!n) return "৳0";
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

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

// ============ MAIN PAGE ============
export default function OverviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // 💡 ১. URL থেকে UUID বের করার চেষ্টা (Dynamic Route বা Query Param দুটোই চেক করবে)
  const bookingUuid = (params?.uuid as string) || searchParams.get("uuid") || "dummy-booking-uuid-123"; 
  // (নোট: "dummy-booking-uuid-123" শুধু টেস্টিংয়ের জন্য, আপনার ডাটাবেসে থাকা আসল uuid দিতে পারেন)

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // যদি UUID না থাকে
    if (!bookingUuid) {
      setError("Booking UUID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        // আপনার API-তে overviewUuid লাগবে, এখানে ডামি দেওয়া হলো।
        // আসল প্রজেক্টে overviewUuid আপনার বুকিং লিস্ট থেকে বা অন্য কোথা থেকে আসবে।
        const overviewUuid = "dummy-overview-uuid-456"; 

        const apiUrl = `/realbizpro/api/v1/bookings/${bookingUuid}/overview/${overviewUuid}`;
        
        const res = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const responseData = await res.json();
        console.log("API Response:", responseData); // ব্রাউজার কনসোলে ডেটা চেক করুন

        // 💡 ২. রেসপন্স ডেটা ফরম্যাট চেক করুন। যদি ডেটা সরাসরি থাকে তবে responseData, না হয় responseData.data
        const finalData = responseData.data || responseData;
        
        // ডেটা ভ্যালিড কি না চেক
        if (!finalData || !finalData.id) {
           throw new Error("Invalid data format received from API");
        }

        setData(finalData);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        // 💡 ৩. যেকোনো অবস্থাতেই লোডিং false হবে
        setLoading(false); 
      }
    };

    fetchOverview();
  }, [bookingUuid]);

  // যদি লোডিং অবস্থায় থাকে
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading Overview...</p>
        </div>
      </div>
    );
  }

  // যদি এরর হয় বা ডেটা না থাকে
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-red-500 font-bold mb-2">Oops! Data not found.</p>
          <p className="text-sm text-gray-500 mb-4">{error || "No overview data available."}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
        <span className="text-gray-900 dark:text-white font-medium">{data.id}</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Booking Overview
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> {data.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Booking ID: {data.id} • Created on {data.bookingDate}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
            Overview
          </Link>
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Installments
          </Link>
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Agreement
          </Link>
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Registration
          </Link>
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Handover
          </Link>
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Documents
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROPERTY DETAILS CARD */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property Details
            </h3>
            <div className="flex flex-col sm:flex-row gap-5">
              <img
                src={data.property?.image || "https://via.placeholder.com/150"}
                alt={data.property?.name}
                className="w-full sm:w-40 h-32 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{data.property?.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={14} /> {data.property?.location}
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{data.property?.type}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Area</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{data.property?.area}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Financial Summary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Total Price</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(data.financials?.totalPrice)}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(data.financials?.paid)}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Remaining Due</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatMoney(data.financials?.remaining)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Payment Progress</span>
                <span>{data.progress || 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                  style={{ width: `${data.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <Clock size={16} />
                Next Due: {formatMoney(data.financials?.nextAmount)} on {data.financials?.nextDue}
              </div>
              <Link href={`?uuid=${bookingUuid}`} className="text-sm text-indigo-600 hover:underline font-medium">
                View Schedule
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* BUYER CARD */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Buyer Profile
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={data.buyer?.avatar || "https://via.placeholder.com/150"} alt="Buyer" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{data.buyer?.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">NID: {data.buyer?.nid}</p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow icon={Mail} label="Email" value={data.buyer?.email} />
              <InfoRow icon={Phone} label="Phone" value={data.buyer?.phone} />
              <InfoRow icon={MapPin} label="Address" value={data.buyer?.address} />
            </div>
          </div>

          {/* AGENT CARD */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Assigned Agent
            </h3>
            <div className="flex items-center gap-3">
              <img src={data.agent?.avatar || "https://via.placeholder.com/150"} alt="Agent" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{data.agent?.name}</p>
                <p className="text-xs text-gray-500">{data.agent?.role}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}