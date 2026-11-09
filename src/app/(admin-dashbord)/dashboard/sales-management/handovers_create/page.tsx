"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Key,
  Search,
  Building2,
  MapPin,
  User,
  FileText,
  Save,
  X,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Zap,
  Droplets,
  ShieldCheck,
  Camera,
  UploadCloud,
  Info,
} from "lucide-react";

// ============ STATIC DATA ============
const readyForHandover = [
  {
    id: "AGR-2024-001",
    property: "Gulshan Plot 12/A",
    propertyCode: "GUL-PLT-012",
    buyer: "Ayesha Rahman",
    buyerPhone: "+880 1712-345678",
    handoverDate: "2024-03-01",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "AGR-2024-003",
    property: "Dhanmondi Commercial Space",
    propertyCode: "DHN-COM-003",
    buyer: "Sadia Islam",
    buyerPhone: "+880 1812-987654",
    handoverDate: "2024-02-28",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
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

function CheckboxItem({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        checked
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
          checked
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
        }`}
      >
        {checked && <CheckSquare size={12} />}
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white select-none">
        {label}
      </span>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
    </label>
  );
}

// ============ MAIN PAGE ============

export default function HandoversCreatePage() {
  const [search, setSearch] = useState("");
  const [selectedHandover, setSelectedHandover] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    handoverDate: "",
    time: "",
    meterElectricity: "",
    meterWater: "",
    meterGas: "",
    notes: "",
  });

  const [checklist, setChecklist] = useState({
    keys: false,
    documents: false,
    inspection: false,
    utilities: false,
  });

  const filtered = readyForHandover.filter(
    (item) =>
      item.property.toLowerCase().includes(search.toLowerCase()) ||
      item.buyer.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeItem = readyForHandover.find((a) => a.id === selectedHandover);

  const handleSelect = (id: string) => {
    const item = readyForHandover.find((a) => a.id === id);
    if (!item) return;
    setSelectedHandover(id);
    
    setForm({
      handoverDate: item.handoverDate,
      time: "10:00",
      meterElectricity: "",
      meterWater: "",
      meterGas: "",
      notes: "",
    });

    setChecklist({
      keys: false,
      documents: false,
      inspection: false,
      utilities: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedHandover(null);
    }, 3000);
  };

  const isChecklistComplete = Object.values(checklist).every(Boolean);

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
        <span className="text-gray-900 dark:text-white font-medium">Create Handover</span>
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
            Property Handover
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Process the final physical handover of the property to the buyer.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Handover processed successfully!</span>
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
            placeholder="Search properties ready for handover…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputBase + " pl-11"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: PROPERTY PICKER */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                Ready for Handover ({filtered.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 && (
                <div className="p-8 text-center">
                  <Building2 size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No properties found</p>
                </div>
              )}
              {filtered.map((item) => {
                const active = item.id === selectedHandover;
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
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Scheduled: {new Date(item.handoverDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: HANDOVER FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Key size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select a property to hand over
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a property from the list on the left to process its final handover.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PROPERTY PREVIEW */}
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
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Contact</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {activeItem.buyerPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HANDOVER DETAILS */}
              <FormSection
                title="Handover Schedule"
                subtitle="Date and time of physical handover"
                icon={Calendar}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Handover Date" required htmlFor="ho-date" />
                    <input
                      id="ho-date"
                      type="date"
                      value={form.handoverDate}
                      onChange={(e) => setForm({ ...form, handoverDate: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Time" required htmlFor="ho-time" />
                    <input
                      id="ho-time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* UTILITY METERS */}
              <FormSection
                title="Utility Meter Readings"
                subtitle="Record current meter readings at handover"
                icon={Zap}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Electricity (kWh)" htmlFor="meter-elec" />
                    <div className="relative">
                      <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="meter-elec"
                        type="number"
                        placeholder="e.g. 1450"
                        value={form.meterElectricity}
                        onChange={(e) => setForm({ ...form, meterElectricity: e.target.value })}
                        className={inputBase + " pl-11"}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Water (m³)" htmlFor="meter-water" />
                    <div className="relative">
                      <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="meter-water"
                        type="number"
                        placeholder="e.g. 320"
                        value={form.meterWater}
                        onChange={(e) => setForm({ ...form, meterWater: e.target.value })}
                        className={inputBase + " pl-11"}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Gas (Unit)" htmlFor="meter-gas" />
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="meter-gas"
                        type="number"
                        placeholder="e.g. 85"
                        value={form.meterGas}
                        onChange={(e) => setForm({ ...form, meterGas: e.target.value })}
                        className={inputBase + " pl-11"}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* CHECKLIST */}
              <FormSection
                title="Handover Checklist"
                subtitle="Confirm all physical items and documents are handed over"
                icon={CheckSquare}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CheckboxItem
                    id="keys"
                    label="Main Door & Utility Keys"
                    checked={checklist.keys}
                    onChange={(c) => setChecklist({ ...checklist, keys: c })}
                  />
                  <CheckboxItem
                    id="docs"
                    label="Original Deed & NOC Copies"
                    checked={checklist.documents}
                    onChange={(c) => setChecklist({ ...checklist, documents: c })}
                  />
                  <CheckboxItem
                    id="inspection"
                    label="Physical Inspection Completed"
                    checked={checklist.inspection}
                    onChange={(c) => setChecklist({ ...checklist, inspection: c })}
                  />
                  <CheckboxItem
                    id="utilities"
                    label="Utility Bill Clearance"
                    checked={checklist.utilities}
                    onChange={(c) => setChecklist({ ...checklist, utilities: c })}
                  />
                </div>
                {!isChecklistComplete && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
                    <Info size={14} /> All checklist items must be confirmed before submitting.
                  </p>
                )}
              </FormSection>

              {/* PHOTOS & NOTES */}
              <FormSection
                title="Photos & Notes"
                subtitle="Upload handover photos and add remarks"
                icon={Camera}
              >
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Upload Handover Photos" htmlFor="upload" />
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <UploadCloud size={28} className="text-indigo-500 mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG or PNG (max. 5MB)
                      </p>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Handover Notes" htmlFor="notes" />
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Any observations from the buyer or staff during handover…"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputBase + " resize-none"}
                    />
                  </div>
                </div>
              </FormSection>

              {/* ACTIONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedHandover(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isChecklistComplete}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                    isChecklistComplete
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Save size={16} />
                  Complete Handover
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}