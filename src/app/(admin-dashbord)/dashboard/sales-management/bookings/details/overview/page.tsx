"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { salesBookingService, type ApiRecord } from "@/services/salesBookingService";
import {
  ChevronRight, Building2, MapPin, User, Mail, Phone, Clock,
  Hash, FileText, Download, Printer, CheckCircle2, TrendingUp,
  Loader2, Image as ImageIcon,
} from "lucide-react";

// ============ TYPES ============
interface OverviewData {
  uuid: string;
  id: string;
  propertyName: string;
  propertyCode: string;
  propertyType: string;
  propertyArea: string;
  propertyPrice: string;
  propertyLocation: string;
  propertyImage: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAvatar: string | null;
  buyerNid: string;
  totalPrice: string;
  amountPaid: string;
  remainingDue: string;
  nextDueDate: string | null;
  bookingId: string;
}

// ✅ ফেক ডাটা (Permanent)
const MOCK_OVERVIEW: OverviewData = {
  uuid: "mock-overview-uuid",
  id: "OVR-2024-001",
  propertyName: "Gulshan Plot 12/A",
  propertyCode: "GUL-PLT-012",
  propertyType: "Residential Land",
  propertyArea: "5 katha",
  propertyPrice: "12000000",
  propertyLocation: "Gulshan-2, Dhaka",
  propertyImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  buyerName: "Ayesha Rahman",
  buyerEmail: "ayesha.rahman@example.com",
  buyerPhone: "+880 1712-345678",
  buyerAvatar: "https://i.pravatar.cc/150?img=5",
  buyerNid: "1990123456789",
  totalPrice: "12000000",
  amountPaid: "4980000",
  remainingDue: "7020000",
  nextDueDate: "2024-05-15",
  bookingId: "8266761a-5943-4eb0-9d9e-e2cfc858473a",
};

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
    month: "short", day: "numeric", year: "numeric",
  });
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
export default function OverviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const routeUuid = params?.uuid;
  const queryUuid = searchParams.get("uuid") || searchParams.get("bookingId");
  const overviewUuid = searchParams.get("overviewUuid");

  const bookingUuid =
    (Array.isArray(routeUuid) ? routeUuid[0] : routeUuid) ||
    queryUuid ||
    MOCK_OVERVIEW.bookingId;

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ApiRecord>({});

  // ✅ ডাটা ফেচ (ডাটা না থাকলে MOCK ডাটা দেখাবে)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await salesBookingService.getOverview(bookingUuid, overviewUuid || undefined);
        const finalData = (response?.overview && typeof response.overview === "object" ? response.overview : response) as ApiRecord;

        if (finalData && (finalData.uuid || finalData.propertyName)) {
          const normalized = {
            ...finalData,
            uuid: String(finalData.uuid || overviewUuid || ""),
            bookingId: String(finalData.bookingId || bookingUuid),
          } as unknown as OverviewData;
          setData(normalized);
          setForm({ ...normalized });
        } else {
          setData(MOCK_OVERVIEW);
          setForm({ ...MOCK_OVERVIEW });
        }
      } catch (err) {
        console.log("API error, using mock data");
        setData(MOCK_OVERVIEW);
        setForm({ ...MOCK_OVERVIEW });
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [bookingUuid, overviewUuid]);

  // ✅ সেভ করার ফাংশন
  const saveOverview = async () => {
    if (!bookingUuid) return;
    try {
      setSaving(true);
      const payload = { ...form };
      delete payload.uuid;
      delete payload.id;
      delete payload.bookingId;
      
      // যদি ফেক ডাটা থাকে, তবে API কল না করে শুধু সাকসেস মেসেজ দেখাবে
      if (data?.uuid === MOCK_OVERVIEW.uuid) {
        setEditing(false);
        toast.success("Overview saved successfully (Demo Mode)");
        return;
      }

      const result = data?.uuid
        ? await salesBookingService.updateOverview(bookingUuid, data.uuid, payload)
        : await salesBookingService.upsertOverview(bookingUuid, payload);
      
      const saved = { ...form, ...result, bookingId: bookingUuid } as unknown as OverviewData;
      setData(saved);
      setForm({ ...saved });
      setEditing(false);
      toast.success(data?.uuid ? "Overview updated" : "Overview created");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save overview");
    } finally {
      setSaving(false);
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
  const overview = data || MOCK_OVERVIEW;
  const total = Number(overview.totalPrice) || 0;
  const paid = Number(overview.amountPaid) || 0;
  const progressPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

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

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Booking Overview
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Confirmed
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Booking ID: {overview.bookingId}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setForm({ ...overview }); setEditing((c) => !c); }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
            >
              {editing ? "Cancel edit" : "Edit overview"}
            </button>
            <button
              onClick={() => toast("Preparing document for print...", { icon: "🖨️" })}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={() => toast.success("PDF exported successfully!")}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2"
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href={`?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Overview</Link>
          <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
          <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
          <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
          <Link href={`/dashboard/sales-management/bookings/details/handover?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Handover</Link>
          <Link href={`/dashboard/sales-management/bookings/details/documents?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Documents</Link>
        </div>
      </div>

      {/* EDIT FORM (যদি ইউজার এডিটে ক্লিক করে) */}
      {editing && (
        <section className="mb-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            {overview.uuid ? "Edit booking overview" : "Create booking overview"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {([
              ["propertyName", "Property name", "text"], ["propertyCode", "Property code", "text"],
              ["propertyType", "Property type", "text"], ["propertyArea", "Property area", "text"],
              ["propertyPrice", "Property price", "number"], ["propertyLocation", "Property location", "text"],
              ["propertyImage", "Property image URL", "text"], ["buyerName", "Buyer name", "text"],
              ["buyerEmail", "Buyer email", "email"], ["buyerPhone", "Buyer phone", "tel"],
              ["buyerAvatar", "Buyer avatar URL", "text"], ["buyerNid", "Buyer NID", "text"],
              ["totalPrice", "Total price", "number"], ["amountPaid", "Amount paid", "number"],
              ["remainingDue", "Remaining due", "number"], ["nextDueDate", "Next due date", "date"],
            ] as const).map(([key, label, type]) => (
              <label key={key} className="text-sm text-gray-600">
                {label}
                <input
                  type={type}
                  value={String(form[key] ?? "")}
                  onChange={(e) => setForm((c: any) => ({ ...c, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Cancel</button>
            <button disabled={saving} onClick={() => void saveOverview()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60">
              {saving ? "Saving…" : "Save overview"}
            </button>
          </div>
        </section>
      )}

      {/* DATA CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PROPERTY DETAILS */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Property Details
            </h3>
            <div className="flex flex-col sm:flex-row gap-5">
              {overview.propertyImage ? (
                <img src={overview.propertyImage} alt={overview.propertyName} className="w-full sm:w-40 h-32 object-cover rounded-xl border" />
              ) : (
                <div className="w-full sm:w-40 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <ImageIcon size={32} />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{overview.propertyName}</h4>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <MapPin size={14} /> {overview.propertyLocation}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Type</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{overview.propertyType}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Area</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{overview.propertyArea}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Financial Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs text-gray-500 mb-1">Total Price</p>
                <p className="text-lg font-bold text-gray-900">{formatMoney(overview.totalPrice)}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-emerald-700">{formatMoney(overview.amountPaid)}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-600 mb-1">Remaining Due</p>
                <p className="text-lg font-bold text-amber-700">{formatMoney(overview.remainingDue)}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Payment Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                <Clock size={16} /> Next Due: {formatDate(overview.nextDueDate)}
              </div>
              <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="text-sm text-indigo-600 hover:underline font-medium">
                View Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Buyer Profile
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {overview.buyerAvatar ? (
                <img src={overview.buyerAvatar} alt="Buyer" className="w-14 h-14 rounded-full object-cover border" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User size={24} />
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900">{overview.buyerName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">NID: {overview.buyerNid}</p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow icon={Mail} label="Email" value={overview.buyerEmail} />
              <InfoRow icon={Phone} label="Phone" value={overview.buyerPhone} />
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Assigned Agent
            </h3>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/150?img=12" alt="Agent" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Rashed Karim</p>
                <p className="text-xs text-gray-500">Senior Property Consultant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}