"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Tag,
  Calculator,
  Save,
  X,
  LandPlot,
  Search,
  CheckCircle2,
  Info,
  TrendingUp,
  Receipt,
  Layers,
  MapPin,
  Building2,
  Ruler,
} from "lucide-react";

// ============ STATIC DATA ============
const properties = [
  {
    id: "PRP-1001",
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    area: "5 katha",
    basePrice: 11000000,
    currentPrice: 12000000,
    status: "Available",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "PRP-1002",
    name: "Bashundhara Apartment 7B",
    code: "BSH-APT-007",
    type: "Apartment",
    area: "1,850 sq ft",
    basePrice: 5800000,
    currentPrice: 6500000,
    status: "Available",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
    location: "Bashundhara R/A, Dhaka",
  },
  {
    id: "PRP-1003",
    name: "Dhanmondi Commercial Space",
    code: "DHN-COM-003",
    type: "Commercial",
    area: "2,400 sq ft",
    basePrice: 8000000,
    currentPrice: 9500000,
    status: "Available",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
  {
    id: "PRP-1004",
    name: "Uttara Villa 4C",
    code: "UTT-VIL-004",
    type: "Villa",
    area: "4,200 sq ft",
    basePrice: 13000000,
    currentPrice: 15000000,
    status: "Available",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop",
    location: "Sector 4, Uttara",
  },
  {
    id: "PRP-1005",
    name: "Mirpur Plot 22",
    code: "MRP-PLT-022",
    type: "Residential Land",
    area: "3 katha",
    basePrice: 6500000,
    currentPrice: 7200000,
    status: "Available",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Mirpur DOHS, Dhaka",
  },
];

const priceTiers = [
  { id: "retail", label: "Retail Price", desc: "Individual buyer price" },
  { id: "investor", label: "Investor Price", desc: "Bulk investor price" },
  { id: "vip", label: "VIP Price", desc: "Premium client price" },
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
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
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

export default function PropertyPricingPage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    basePrice: 0,
    retailPrice: 0,
    investorPrice: 0,
    vipPrice: 0,
    taxPercent: 5,
    discountPercent: 0,
    bookingFee: 0,
    effectiveDate: "",
    notes: "",
  });

  const filtered = properties.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  const activeItem = properties.find((i) => i.id === selectedItem);

  const handleSelect = (id: string) => {
    const item = properties.find((i) => i.id === id);
    if (!item) return;
    setSelectedItem(id);
    setForm({
      basePrice: item.basePrice,
      retailPrice: item.currentPrice,
      investorPrice: Math.round(item.currentPrice * 0.92),
      vipPrice: Math.round(item.currentPrice * 0.95),
      taxPercent: 5,
      discountPercent: 0,
      bookingFee: 500000,
      effectiveDate: "",
      notes: "",
    });
  };

  // ===== CALCULATIONS =====
  const taxAmount = Math.round((form.retailPrice * form.taxPercent) / 100);
  const discountAmount = Math.round((form.retailPrice * form.discountPercent) / 100);
  const finalPrice = form.retailPrice + taxAmount - discountAmount + form.bookingFee;
  const profit = form.retailPrice - form.basePrice;
  const margin = form.retailPrice > 0 ? ((profit / form.retailPrice) * 100).toFixed(1) : "0.0";
  const markup = form.basePrice > 0 ? ((profit / form.basePrice) * 100).toFixed(1) : "0.0";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
          href="/dashboard/sales-management/inventory"
          className="hover:text-indigo-600 transition-colors"
        >
          Properties
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Pricing</span>
      </nav>

      {/* HEADER */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard/sales-management/inventory"
          className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Update Property Pricing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a property and configure its pricing structure.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Pricing updated successfully!</span>
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
            placeholder="Search property by name, code, or location…"
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
                <LandPlot size={18} className="text-indigo-600" />
                Properties ({filtered.length})
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
                const active = item.id === selectedItem;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30 border-l-4 border-transparent"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          active
                            ? "text-indigo-700 dark:text-indigo-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatMoney(item.currentPrice)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.area}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Tag size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select a property to begin
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a property from the list on the left to configure pricing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PROPERTY PREVIEW */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <img
                  src={activeItem.image}
                  alt={activeItem.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {activeItem.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>{activeItem.id}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {activeItem.location}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{activeItem.area}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatMoney(activeItem.currentPrice)}
                  </p>
                </div>
              </div>

              {/* BASE & RETAIL */}
              <FormSection
                title="Base Pricing"
                subtitle="Set acquisition cost and retail price"
                icon={DollarSign}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Base / Acquisition Cost (৳)" required htmlFor="base" />
                    <input
                      id="base"
                      type="number"
                      min={0}
                      value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Retail Price (৳)" required htmlFor="retail" />
                    <input
                      id="retail"
                      type="number"
                      min={0}
                      value={form.retailPrice}
                      onChange={(e) => setForm({ ...form, retailPrice: Number(e.target.value) })}
                      className={inputBase}
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* PRICE TIERS */}
              <FormSection
                title="Price Tiers"
                subtitle="Different prices for buyer types"
                icon={Layers}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priceTiers.map((tier) => {
                    const key =
                      tier.id === "retail"
                        ? "retailPrice"
                        : tier.id === "investor"
                        ? "investorPrice"
                        : "vipPrice";
                    return (
                      <div key={tier.id}>
                        <FieldLabel label={tier.label} hint={tier.desc} htmlFor={tier.id} />
                        <input
                          id={tier.id}
                          type="number"
                          min={0}
                          value={(form as any)[key]}
                          onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                          className={inputBase}
                        />
                      </div>
                    );
                  })}
                </div>
              </FormSection>

              {/* TAX & FEES */}
              <FormSection
                title="Tax & Fees"
                subtitle="Applied on retail price"
                icon={Receipt}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Tax (%)" htmlFor="tax" />
                    <input
                      id="tax"
                      type="number"
                      min={0}
                      max={100}
                      value={form.taxPercent}
                      onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Discount (%)" htmlFor="discount" />
                    <input
                      id="discount"
                      type="number"
                      min={0}
                      max={100}
                      value={form.discountPercent}
                      onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Booking Fee (৳)" htmlFor="booking" />
                    <input
                      id="booking"
                      type="number"
                      min={0}
                      value={form.bookingFee}
                      onChange={(e) => setForm({ ...form, bookingFee: Number(e.target.value) })}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Effective Date" htmlFor="effective" />
                    <input
                      id="effective"
                      type="date"
                      value={form.effectiveDate}
                      onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </FormSection>

              {/* NOTES */}
              <FormSection title="Additional Notes" icon={Receipt}>
                <textarea
                  rows={3}
                  placeholder="Reason for price change, approval notes…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputBase + " resize-none"}
                />
              </FormSection>

              {/* LIVE SUMMARY */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={18} />
                  <h3 className="font-bold">Live Calculation</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs opacity-80 mb-1">Final Price</p>
                    <p className="text-xl font-bold">{formatMoney(finalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Profit</p>
                    <p className="text-xl font-bold">{formatMoney(profit)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Margin</p>
                    <p className="text-xl font-bold">{margin}%</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Markup</p>
                    <p className="text-xl font-bold">{markup}%</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                  <span className="opacity-80">
                    Tax: {formatMoney(taxAmount)} • Discount: -{formatMoney(discountAmount)} • Booking: {formatMoney(form.bookingFee)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    {Number(margin) > 15 ? "Healthy margin" : "Low margin"}
                  </span>
                </div>
              </div>

              {/* INFO ALERT */}
              <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Price changes apply to new bookings only. Existing contracts keep their original price.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Save size={16} />
                  Save Pricing
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}