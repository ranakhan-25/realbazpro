"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
  FileText,
  Hash,
  DollarSign,
  TrendingUp,
  Loader2,
  Plus,
} from "lucide-react";

// ============ TYPES ============
interface Installment {
  uuid: string;
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  bookingId: string;
}

// ============ HELPERS ============
function formatMoney(amount: string | number) {
  const n = Number(amount);
  if (!n || isNaN(n)) return "৳0";
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig: Record<string, { bg: string; icon: any }> = {
  Paid: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  Due: {
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    icon: AlertCircle,
  },
  Upcoming: {
    bg: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
    icon: Clock,
  },
};

// ============ MAIN PAGE ============
export default function InstallmentsDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId");

  // ✅ শুরুতে ডিফল্ট হিসেবে খালি অ্যারে সেট করা হলো
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingUuid) {
      setError("Booking UUID not found in URL. Please select a booking first.");
      setLoading(false);
      return;
    }

    const fetchInstallments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/installments`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch installments data.");
        }

        const result = await response.json();
        
        // ✅ ডাটা এক্সট্রাক্ট করার নিরাপদ উপায়
        let finalData: any[] = [];
        
        if (Array.isArray(result)) {
          finalData = result;
        } else if (result && Array.isArray(result.data)) {
          finalData = result.data;
        } else if (result && result.data && Array.isArray(result.data.installments)) {
          finalData = result.data.installments;
        } else if (result && Array.isArray(result.installments)) {
          finalData = result.installments;
        }

        // ✅ কড়াকড়িভাবে চেক করা হচ্ছে যাতে ডাটা সবসময় অ্যারে হয়
        setInstallments(finalData);
        
        if (finalData.length > 0) {
          toast.success("Installments loaded successfully!");
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Something went wrong while fetching installments.");
        toast.error(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchInstallments();
  }, [bookingUuid]);

  // ===== CALCULATE SUMMARIES DYNAMICALLY =====
  // ✅ এখন যেহেতু installments সবসময় অ্যারে হবে, তাই reduce কোনো এরর দেবে না
  const totalAmount = installments.reduce(
    (sum, inst) => sum + Number(inst.amount || 0),
    0
  );

  const totalPaid = installments
    .filter((inst) => inst.status === "Paid")
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

  const totalRemaining = totalAmount - totalPaid;

  const progressPercent =
    totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const nextDue = installments.find(
    (inst) => inst.status === "Due" || inst.status === "Upcoming"
  );

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading Installments...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR / EMPTY STATE =====
  if (error || !bookingUuid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 max-w-md w-full">
          <p className="text-red-500 font-bold mb-2">Oops! Data not found.</p>
          <p className="text-sm text-gray-500 mb-4">
            {error || "Booking UUID not found in URL."}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/sales-management/bookings"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Go to Bookings
            </Link>
            {bookingUuid && (
              <button
                onClick={() =>
                  toast.success("Redirecting to create installment plan...")
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Create Plan
              </button>
            )}
          </div>
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
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Installment Schedule
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Active Plan
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Booking ID: {bookingUuid}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast("Preparing document for print...", { icon: "🖨️" })}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={() => toast.success("Export initiated!")}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href={`/dashboard/sales-management/bookings/details/overview?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Overview
          </Link>
          <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 whitespace-nowrap">
            Installments
          </Link>
          <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Agreement
          </Link>
          <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Registration
          </Link>
          <Link href={`/dashboard/sales-management/bookings/details/handover?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Handover
          </Link>
          <Link href={`/dashboard/sales-management/bookings/details/documents?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap transition-colors">
            Documents
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Payment Timeline
              </h3>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {installments.length} Installments
              </span>
            </div>

            <div className="overflow-x-auto">
              {installments.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No installments found for this booking.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">#</th>
                      <th className="px-6 py-4 font-medium">Title</th>
                      <th className="px-6 py-4 font-medium">Due Date</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Paid On</th>
                      <th className="px-6 py-4 font-medium text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {installments.map((inst, index) => {
                      const cfg = statusConfig[inst.status] || statusConfig["Upcoming"];
                      const Icon = cfg.icon;
                      return (
                        <tr key={inst.uuid || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{index + 1}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{inst.title || "Installment"}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{formatDate(inst.dueDate)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{formatMoney(inst.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                              <Icon size={12} /> {inst.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inst.paidDate ? formatDate(inst.paidDate) : "—"}</td>
                          <td className="px-6 py-4 text-right">
                            {inst.status === "Paid" ? (
                              <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs flex items-center gap-1 justify-end ml-auto transition-colors">
                                <FileText size={14} /> View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Financial Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Total Paid</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-amber-600 dark:text-amber-400">Remaining Balance</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatMoney(totalRemaining)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Payment Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {nextDue && (
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/20">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">Next Payment Due</span>
              </div>
              <p className="text-3xl font-bold mb-1">{formatMoney(nextDue.amount)}</p>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Calendar size={14} /> Due on {formatDate(nextDue.dueDate)}
              </p>
              <button onClick={() => toast.success("Redirecting to payment gateway...")} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition-colors border border-white/20">
                <DollarSign size={16} /> Pay Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}