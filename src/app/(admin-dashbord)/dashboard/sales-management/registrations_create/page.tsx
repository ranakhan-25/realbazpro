"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  FileCheck,
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
  ShieldCheck,
  Landmark,
  Stamp,
  Info,
  UploadCloud,
  ChevronDown,
} from "lucide-react";

// ============ STATIC DATA ============
const signedAgreements = [
  {
    id: "AGR-2024-001",
    property: "Gulshan Plot 12/A",
    propertyCode: "GUL-PLT-012",
    buyer: "Ayesha Rahman",
    buyerNid: "1990123456789",
    seller: "Rahman Properties Ltd.",
    totalPrice: 12000000,
    agreementDate: "2024-01-15",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "AGR-2024-003",
    property: "Dhanmondi Commercial Space",
    propertyCode: "DHN-COM-003",
    buyer: "Sadia Islam",
    buyerNid: "1985987654321",
    seller: "Dhanmondi Holdings",
    totalPrice: 9500000,
    agreementDate: "2024-01-20",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
  {
    id: "AGR-2024-005",
    property: "Mirpur Plot 22",
    propertyCode: "MRP-PLT-022",
    buyer: "Mim Akter",
    buyerNid: "1992555544444",
    seller: "Mirpur Developers",
    totalPrice: 7200000,
    agreementDate: "2024-01-25",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Mirpur DOHS, Dhaka",
  },
];

const subRegistries = [
  "Sub-Registry Office, Gulshan",
  "Sub-Registry Office, Dhanmondi",
  "Sub-Registry Office, Mirpur",
  "Sub-Registry Office, Uttara",
  "Sub-Registry Office, Sadar, Dhaka",
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
}: {
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
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

export default function RegistrationsCreatePage() {
  const [search, setSearch] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    deedNo: "",
    subRegistry: subRegistries[0],
    registrationDate: "",
    stampDuty: 0,
    registrationFee: 0,
    mutationStatus: "Pending",
    notes: "",
  });

  const filtered = signedAgreements.filter(
    (item) =>
      item.property.toLowerCase().includes(search.toLowerCase()) ||
      item.buyer.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeItem = signedAgreements.find((a) => a.id === selectedAgreement);

  const handleSelect = (id: string) => {
    const agreement = signedAgreements.find((a) => a.id === id);
    if (!agreement) return;
    setSelectedAgreement(id);
    
    // Auto-calculate typical Bangladesh registration fees (approx 10-12% total)
    const stamp = Math.round(agreement.totalPrice * 0.015); // 1.5% Stamp
    const fee = Math.round(agreement.totalPrice * 0.10);   // 10% Registration
    
    setForm({
      deedNo: "",
      subRegistry: subRegistries[0],
      registrationDate: new Date().toISOString().split("T")[0],
      stampDuty: stamp,
      registrationFee: fee,
      mutationStatus: "Pending",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedAgreement(null);
    }, 3000);
  };

  const totalGovtFees = form.stampDuty + form.registrationFee;

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
        <span className="text-gray-900 dark:text-white font-medium">New Registration</span>
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
            Property Registration
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record deed registration details, stamp duty, and mutation status.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Registration recorded successfully!</span>
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
            placeholder="Search signed agreements by buyer, property, or ID…"
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
                <FileCheck size={18} className="text-indigo-600" />
                Signed Agreements ({filtered.length})
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
                        {item.buyer} • {item.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Value: {formatMoney(item.totalPrice)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: REGISTRATION FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select an agreement to proceed
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a signed agreement from the left to record its legal registration.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AGREEMENT PREVIEW */}
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
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Buyer & NID</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {activeItem.buyer} <span className="text-gray-400 font-normal">({activeItem.buyerNid})</span>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {activeItem.seller}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LEGAL DETAILS */}
              <FormSection
                title="Registration Details"
                subtitle="Deed and Sub-Registry information"
                icon={Landmark}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Deed Number" required htmlFor="deed-no" />
                    <input
                      id="deed-no"
                      type="text"
                      placeholder="e.g. 1234/2024"
                      value={form.deedNo}
                      onChange={(e) => setForm({ ...form, deedNo: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Registration Date" required htmlFor="reg-date" />
                    <input
                      id="reg-date"
                      type="date"
                      value={form.registrationDate}
                      onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Sub-Registry Office" required htmlFor="sub-registry" />
                    <select
                      id="sub-registry"
                      value={form.subRegistry}
                      onChange={(e) => setForm({ ...form, subRegistry: e.target.value })}
                      className={inputBase}
                      required
                    >
                      {subRegistries.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              {/* GOVT FEES */}
              <FormSection
                title="Government Fees"
                subtitle="Stamp duty and registration charges"
                icon={Stamp}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Stamp Duty (৳)" htmlFor="stamp" hint="Usually 1.5%" />
                      <input
                        id="stamp"
                        type="number"
                        min={0}
                        value={form.stampDuty || ""}
                        onChange={(e) => setForm({ ...form, stampDuty: Number(e.target.value) || 0 })}
                        className={inputBase}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Registration Fee (৳)" htmlFor="reg-fee" hint="Usually 10%" />
                      <input
                        id="reg-fee"
                        type="number"
                        min={0}
                        value={form.registrationFee || ""}
                        onChange={(e) => setForm({ ...form, registrationFee: Number(e.target.value) || 0 })}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Govt. Fees</p>
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatMoney(totalGovtFees)}
                      </p>
                    </div>
                    <Info size={24} className="text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
              </FormSection>

              {/* MUTATION & UPLOADS */}
              <FormSection
                title="Mutation & Documents"
                subtitle="Land record update and deed upload"
                icon={FileText}
              >
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Mutation Status" htmlFor="mutation" />
                    <select
                      id="mutation"
                      value={form.mutationStatus}
                      onChange={(e) => setForm({ ...form, mutationStatus: e.target.value })}
                      className={inputBase}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </div>

                  {/* Mock File Upload */}
                  <div>
                    <FieldLabel label="Upload Deed Copy (PDF)" htmlFor="upload" />
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <UploadCloud size={28} className="text-indigo-500 mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PDF, JPG or PNG (max. 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* NOTES */}
              <FormSection title="Internal Notes" icon={FileText}>
                <textarea
                  rows={3}
                  placeholder="Any specific remarks about the registry office or timeline…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputBase + " resize-none"}
                />
              </FormSection>

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
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Save size={16} />
                  Save Registration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}