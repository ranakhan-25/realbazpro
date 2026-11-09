"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRightLeft,
  Search,
  Building2,
  MapPin,
  User,
  FileText,
  Save,
  X,
  CheckCircle2,
  Calendar,
  Hash,
  DollarSign,
  ShieldAlert,
  UploadCloud,
  Info,
  Users,
  Percent,
  TrendingUp,
} from "lucide-react";

// ============ STATIC DATA ============
const transferableAgreements = [
  {
    id: "AGR-2024-001",
    property: "Gulshan Plot 12/A",
    propertyCode: "GUL-PLT-012",
    currentBuyer: "Ayesha Rahman",
    currentBuyerPhone: "+880 1712-345678",
    totalPrice: 12000000,
    paidAmount: 4980000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "AGR-2024-003",
    property: "Dhanmondi Commercial Space",
    propertyCode: "DHN-COM-003",
    currentBuyer: "Sadia Islam",
    currentBuyerPhone: "+880 1812-987654",
    totalPrice: 9500000,
    paidAmount: 1900000,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
];

const transferReasons = [
  "Sale to New Buyer (Assignment)",
  "Family Transfer (Gift/Inheritance)",
  "Company Restructuring",
  "Financial Hardship",
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
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
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

export default function TransfersCreatePage() {
  const [search, setSearch] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const [form, setForm] = useState({
    newBuyerName: "",
    newBuyerEmail: "",
    newBuyerPhone: "",
    newBuyerNid: "",
    reason: "",
    transferDate: "",
    transferFee: 0,
    notes: "",
  });

  const filtered = transferableAgreements.filter(
    (item) =>
      item.property.toLowerCase().includes(search.toLowerCase()) ||
      item.currentBuyer.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeItem = transferableAgreements.find((a) => a.id === selectedAgreement);

  const handleSelect = (id: string) => {
    const agreement = transferableAgreements.find((a) => a.id === id);
    if (!agreement) return;
    setSelectedAgreement(id);
    
    // Auto-calculate a default transfer fee (e.g., 1% of total price)
    setForm({
      newBuyerName: "",
      newBuyerEmail: "",
      newBuyerPhone: "",
      newBuyerNid: "",
      reason: "",
      transferDate: new Date().toISOString().split("T")[0],
      transferFee: Math.round(agreement.totalPrice * 0.01),
      notes: "",
    });
    setAcknowledged(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedAgreement(null);
      setAcknowledged(false);
    }, 3000);
  };

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
        <span className="text-gray-900 dark:text-white font-medium">Property Transfer</span>
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
            Transfer Property Ownership
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Assign an existing agreement to a new buyer or transfer ownership.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Ownership transfer initiated successfully!</span>
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
            placeholder="Search active agreements by property, current buyer, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputBase + " pl-11"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: AGREEMENT PICKER */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-indigo-600" />
                Active Agreements ({filtered.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 && (
                <div className="p-8 text-center">
                  <FileText size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No agreements found</p>
                </div>
              )}
              {filtered.map((item) => {
                const active = item.id === selectedAgreement;
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
                        {item.currentBuyer} • {item.id}
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

        {/* RIGHT: TRANSFER FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <ArrowRightLeft size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select an agreement to transfer
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose an active property agreement from the left to transfer its ownership.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TRANSFER FLOW PREVIEW */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* From (Current Buyer) */}
                  <div className="flex items-center gap-3 w-full sm:w-5/12">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">Current Buyer</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {activeItem.currentBuyer}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{activeItem.currentBuyerPhone}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center justify-center w-full sm:w-2/12 py-2 sm:py-0">
                    <div className="h-px w-full bg-gray-200 dark:bg-gray-700 hidden sm:block relative">
                       <ArrowRightLeft size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 bg-white dark:bg-gray-900 px-1" />
                    </div>
                    <div className="sm:hidden h-6 w-px bg-gray-200 dark:bg-gray-700 relative">
                       <ArrowRightLeft size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 bg-white dark:bg-gray-900 rotate-90 px-1" />
                    </div>
                  </div>

                  {/* To (New Buyer - Dynamic) */}
                  <div className="flex items-center gap-3 w-full sm:w-5/12">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">New Buyer</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {form.newBuyerName || "Enter Details Below"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{form.newBuyerPhone || "—"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Property Mini Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Building2 size={14} className="text-indigo-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">{activeItem.property}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{activeItem.propertyCode}</span>
                </div>
              </div>

              {/* NEW BUYER DETAILS */}
              <FormSection
                title="New Buyer Information"
                subtitle="Details of the person receiving the property"
                icon={Users}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Full Name" required htmlFor="new-name" />
                    <input
                      id="new-name"
                      type="text"
                      placeholder="e.g. Karim Ahmed"
                      value={form.newBuyerName}
                      onChange={(e) => setForm({ ...form, newBuyerName: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="NID / Passport No." required htmlFor="new-nid" />
                    <input
                      id="new-nid"
                      type="text"
                      placeholder="1990123456789"
                      value={form.newBuyerNid}
                      onChange={(e) => setForm({ ...form, newBuyerNid: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Email Address" required htmlFor="new-email" />
                    <input
                      id="new-email"
                      type="email"
                      placeholder="karim@example.com"
                      value={form.newBuyerEmail}
                      onChange={(e) => setForm({ ...form, newBuyerEmail: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Phone Number" required htmlFor="new-phone" />
                    <input
                      id="new-phone"
                      type="tel"
                      placeholder="+880 1912-345678"
                      value={form.newBuyerPhone}
                      onChange={(e) => setForm({ ...form, newBuyerPhone: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* TRANSFER DETAILS */}
              <FormSection
                title="Transfer Details"
                subtitle="Reason and financial settlement"
                icon={FileText}
                isDanger={true}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Transfer Reason" required htmlFor="transfer-reason" />
                      <select
                        id="transfer-reason"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        className={inputBase}
                        required
                      >
                        <option value="">Select a reason…</option>
                        {transferReasons.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Effective Date" required htmlFor="transfer-date" />
                      <input
                        id="transfer-date"
                        type="date"
                        value={form.transferDate}
                        onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
                        className={inputBase}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Transfer Processing Fee (৳)" htmlFor="transfer-fee" hint="Standard: 1%" />
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="transfer-fee"
                        type="number"
                        min={0}
                        value={form.transferFee || ""}
                        onChange={(e) => setForm({ ...form, transferFee: Number(e.target.value) || 0 })}
                        className={inputBase + " pl-11"}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* DOCUMENTS & NOTES */}
              <FormSection
                title="Documents & Notes"
                subtitle="Upload transfer deed and remarks"
                icon={UploadCloud}
              >
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Upload Transfer Deed / NOC" htmlFor="upload" />
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <UploadCloud size={28} className="text-indigo-500 mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PDF (max. 10MB)
                      </p>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Internal Notes" htmlFor="notes" />
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Add any specific remarks about this transfer…"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputBase + " resize-none"}
                    />
                  </div>
                </div>
              </FormSection>

              {/* DANGER ALERT & ACKNOWLEDGEMENT */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 border-b border-amber-200 dark:border-amber-800 flex items-start gap-3">
                  <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                      Legal Notice
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Transferring an agreement voids the current buyer's rights to the property. Ensure all parties have signed the transfer deed before proceeding.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="acknowledge"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label
                    htmlFor="acknowledge"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer"
                  >
                    I confirm that all legal requirements and signatures are in place.
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgreement(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acknowledged}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                    acknowledged
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <ArrowRightLeft size={16} />
                  Process Transfer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}