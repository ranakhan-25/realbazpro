"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  XCircle,
  Search,
  Building2,
  LandPlot,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Save,
  X,
  DollarSign,
  TrendingDown,
  Info,
  CheckCircle2,
  ShieldAlert,
  Percent,
} from "lucide-react";

// ============ STATIC DATA ============
const activeBookings = [
  {
    id: "BK-2024-7845",
    property: "Gulshan Plot 12/A",
    propertyCode: "GUL-PLT-012",
    buyer: "Ayesha Rahman",
    buyerEmail: "ayesha.rahman@example.com",
    buyerPhone: "+880 1712-345678",
    totalPrice: 12000000,
    paidAmount: 4980000,
    bookingDate: "2024-01-15",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "BK-2024-7844",
    property: "Bashundhara Apartment 7B",
    propertyCode: "BSH-APT-007",
    buyer: "Arif Hossain",
    buyerEmail: "arif.h@example.com",
    buyerPhone: "+880 1812-987654",
    totalPrice: 6500000,
    paidAmount: 1300000,
    bookingDate: "2024-01-18",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
    location: "Bashundhara R/A, Dhaka",
  },
];

const cancellationReasons = [
  "Buyer Changed Mind",
  "Failed to Secure Financing",
  "Found Better Property",
  "Legal / Title Issues",
  "Delay in Handover",
  "Mutual Agreement",
  "Other",
];

// ============ COMPONENTS ============

function FieldLabel({
  label,
  required = false,
  htmlFor,
  hint,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
  );
}

function FormSection({
  title,
  subtitle,
  icon: Icon,
  children,
  isDanger = false,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
  isDanger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isDanger
              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          }`}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============

export default function CancellationsCreatePage() {
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const [form, setForm] = useState({
    reason: "",
    refundAmount: 0,
    penaltyFee: 0,
    cancellationDate: "",
    notes: "",
  });

  const filtered = activeBookings.filter(
    (item) =>
      item.property.toLowerCase().includes(search.toLowerCase()) ||
      item.buyer.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeItem = activeBookings.find((b) => b.id === selectedBooking);

  const handleSelect = (id: string) => {
    const booking = activeBookings.find((b) => b.id === id);
    if (!booking) return;
    setSelectedBooking(id);
    // Suggest a default refund (e.g., 90% of paid amount) and penalty (10%)
    const defaultPenalty = Math.round(booking.paidAmount * 0.1);
    setForm({
      reason: "",
      refundAmount: booking.paidAmount - defaultPenalty,
      penaltyFee: defaultPenalty,
      cancellationDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setAcknowledged(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return; // Prevent submit if not acknowledged
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedBooking(null);
      setAcknowledged(false);
    }, 3000);
  };

  // Math validation
  const maxRefund = activeItem
    ? activeItem.paidAmount - form.penaltyFee
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/dashboard/sales-management/payment-plans"
          className="hover:text-indigo-600 transition-colors"
        >
          Payment Plans
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Cancel Booking</span>
      </nav>

      {/* HEADER */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard/sales-management/payment-plans"
          className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Cancel Booking
            <span className="text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full mt-1">
              Action Required
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Process a cancellation for an active property booking and calculate refunds.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Booking cancelled successfully!</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search active bookings by buyer, property, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputBase + " pl-11"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: BOOKING PICKER */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                Active Bookings ({filtered.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 && (
                <div className="p-8 text-center">
                  <FileText size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No active bookings found</p>
                </div>
              )}
              {filtered.map((item) => {
                const active = item.id === selectedBooking;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30 border-l-4 border-transparent"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.property}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          active
                            ? "text-indigo-700 dark:text-indigo-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {item.property}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.id} • {item.buyer}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Paid: {formatMoney(item.paidAmount)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: CANCELLATION FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <ShieldAlert size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select a booking to cancel
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose an active booking from the list on the left to process a cancellation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* BOOKING PREVIEW */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col sm:flex-row gap-5">
                <img
                  src={activeItem.image}
                  alt={activeItem.property}
                  className="w-full sm:w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {activeItem.property}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <span>{activeItem.id}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {activeItem.location}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Buyer</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {activeItem.buyer}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Paid So Far</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(activeItem.paidAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CANCELLATION DETAILS */}
              <FormSection
                title="Cancellation Details"
                subtitle="Provide reason and process date"
                icon={XCircle}
                isDanger={true}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Cancellation Date" required htmlFor="cancel-date" />
                    <input
                      id="cancel-date"
                      type="date"
                      value={form.cancellationDate}
                      onChange={(e) =>
                        setForm({ ...form, cancellationDate: e.target.value })
                      }
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Primary Reason" required htmlFor="cancel-reason" />
                    <select
                      id="cancel-reason"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className={inputBase}
                      required
                    >
                      <option value="">Select a reason…</option>
                      {cancellationReasons.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              {/* FINANCIAL SETTLEMENT */}
              <FormSection
                title="Financial Settlement"
                subtitle="Calculate deductions and refund"
                icon={DollarSign}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Penalty Fee (৳)" htmlFor="penalty" hint="Deducted from paid amount" />
                      <input
                        id="penalty"
                        type="number"
                        min={0}
                        max={activeItem.paidAmount}
                        value={form.penaltyFee || ""}
                        onChange={(e) => {
                          const penalty = Number(e.target.value) || 0;
                          setForm({
                            ...form,
                            penaltyFee: penalty,
                            refundAmount: Math.max(activeItem.paidAmount - penalty, 0),
                          });
                        }}
                        className={inputBase}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Refund Amount (৳)" htmlFor="refund" hint="Amount to return to buyer" />
                      <input
                        id="refund"
                        type="number"
                        min={0}
                        max={maxRefund}
                        value={form.refundAmount || ""}
                        onChange={(e) => {
                          const refund = Number(e.target.value) || 0;
                          setForm({
                            ...form,
                            refundAmount: refund,
                            penaltyFee: Math.max(activeItem.paidAmount - refund, 0),
                          });
                        }}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Live Calculation Card */}
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatMoney(activeItem.paidAmount)}
                      </p>
                    </div>
                    <TrendingDown size={20} className="text-gray-400" />
                    <div className="text-right">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Refund to Buyer</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {formatMoney(form.refundAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* NOTES */}
              <FormSection title="Internal Notes" icon={FileText}>
                <textarea
                  rows={3}
                  placeholder="Add any additional context or remarks regarding this cancellation…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputBase + " resize-none"}
                />
              </FormSection>

              {/* DANGER ALERT & ACKNOWLEDGEMENT */}
              <div className="rounded-2xl border border-red-200 dark:border-red-800 overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-800 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-1">
                      Warning: Irreversible Action
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Cancelling this booking will release the property back to available inventory and process a refund of {formatMoney(form.refundAmount)}. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="acknowledge"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label
                    htmlFor="acknowledge"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer"
                  >
                    I understand the financial impact and authorize this cancellation.
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <X size={16} />
                  Cancel (Go Back)
                </button>
                <button
                  type="submit"
                  disabled={!acknowledged}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                    acknowledged
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <XCircle size={16} />
                  Confirm Cancellation
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}