"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Percent,
  Tag,
  Save,
  X,
  Search,
  CheckCircle2,
  Info,
  Calculator,
  Building2,
  LandPlot,
  MapPin,
  Calendar,
  Clock,
  Users,
  Sparkles,
  TrendingDown,
  DollarSign,
  Layers,
  Gift,
  BadgePercent,
} from "lucide-react";

// ============ STATIC DATA ============
const properties = [
  {
    id: "PRP-1001",
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    area: "5 katha",
    price: 12000000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "PRP-1002",
    name: "Bashundhara Apartment 7B",
    code: "BSH-APT-007",
    type: "Apartment",
    area: "1,850 sq ft",
    price: 6500000,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
    location: "Bashundhara R/A, Dhaka",
  },
  {
    id: "PRP-1003",
    name: "Dhanmondi Commercial Space",
    code: "DHN-COM-003",
    type: "Commercial",
    area: "2,400 sq ft",
    price: 9500000,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
  {
    id: "PRP-1004",
    name: "Uttara Villa 4C",
    code: "UTT-VIL-004",
    type: "Villa",
    area: "4,200 sq ft",
    price: 15000000,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop",
    location: "Sector 4, Uttara",
  },
  {
    id: "PRP-1005",
    name: "Mirpur Plot 22",
    code: "MRP-PLT-022",
    type: "Residential Land",
    area: "3 katha",
    price: 7200000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Mirpur DOHS, Dhaka",
  },
];

const discountTypes = [
  { id: "percent", label: "Percentage", icon: Percent, desc: "e.g. 10% off" },
  { id: "flat", label: "Flat Amount", icon: DollarSign, desc: "e.g. ৳5,00,000 off" },
];

const discountReasons = [
  "Early Bird Offer",
  "Bulk Buyer Discount",
  "Loyalty / VIP Client",
  "Festive Season Sale",
  "Clearance / Quick Sale",
  "Referral Discount",
  "Negotiated Deal",
  "Other",
];

const audience = [
  { id: "all", label: "All Buyers" },
  { id: "new", label: "New Buyers" },
  { id: "returning", label: "Returning Investors" },
  { id: "vip", label: "VIP Clients" },
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

export default function DiscountFormPage() {
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [audienceId, setAudienceId] = useState("all");
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    discountValue: 0,
    reason: "",
    startDate: "",
    endDate: "",
    maxUses: 0,
    minPurchase: 0,
    code: "",
    notes: "",
  });

  const filtered = properties.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  const activeProperty = properties.find((p) => p.id === selectedProperty);

  const handleSelect = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;
    setSelectedProperty(id);
    setForm({
      discountValue: 0,
      reason: "",
      startDate: "",
      endDate: "",
      maxUses: 0,
      minPurchase: 0,
      code: "",
      notes: "",
    });
  };

  // ===== CALCULATIONS =====
  const basePrice = activeProperty?.price || 0;
  const discountAmount =
    discountType === "percent"
      ? Math.round((basePrice * form.discountValue) / 100)
      : form.discountValue;
  const finalPrice = Math.max(basePrice - discountAmount, 0);
  const savingsPercent = basePrice > 0 ? ((discountAmount / basePrice) * 100).toFixed(1) : "0.0";

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
        <span className="text-gray-900 dark:text-white font-medium">Discounts</span>
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
            Create Discount
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set up a discount campaign for a property.
          </p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Discount created successfully!</span>
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
                const active = item.id === selectedProperty;
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
                        {formatMoney(item.price)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.area}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="lg:col-span-2 space-y-6">
          {!activeProperty ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Percent size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Select a property to begin
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a property from the list on the left to add a discount.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PROPERTY PREVIEW */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <img
                  src={activeProperty.image}
                  alt={activeProperty.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {activeProperty.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>{activeProperty.id}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {activeProperty.location}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{activeProperty.area}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">List Price</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatMoney(activeProperty.price)}
                  </p>
                </div>
              </div>

              {/* DISCOUNT TYPE */}
              <FormSection
                title="Discount Type"
                subtitle="Choose how the discount is applied"
                icon={BadgePercent}
              >
                <div className="grid grid-cols-2 gap-3">
                  {discountTypes.map((d) => {
                    const Icon = d.icon;
                    const active = discountType === d.id;
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => setDiscountType(d.id as any)}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                          active
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            active
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              active
                                ? "text-indigo-700 dark:text-indigo-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {d.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {d.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      label={discountType === "percent" ? "Discount (%)" : "Discount Amount (৳)"}
                      required
                      htmlFor="discount-value"
                    />
                    <input
                      id="discount-value"
                      type="number"
                      min={0}
                      max={discountType === "percent" ? 100 : basePrice}
                      value={form.discountValue || ""}
                      onChange={(e) =>
                        setForm({ ...form, discountValue: Number(e.target.value) || 0 })
                      }
                      className={inputBase}
                      placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 500000"}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Reason" required htmlFor="discount-reason" />
                    <select
                      id="discount-reason"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className={inputBase}
                      required
                    >
                      <option value="">Select a reason…</option>
                      {discountReasons.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              {/* AUDIENCE & LIMITS */}
              <FormSection
                title="Audience & Limits"
                subtitle="Who can use this discount"
                icon={Users}
              >
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Target Audience" htmlFor="audience" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {audience.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => setAudienceId(a.id)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            audienceId === a.id
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                              : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Max Uses" htmlFor="max-uses" hint="0 = unlimited" />
                      <input
                        id="max-uses"
                        type="number"
                        min={0}
                        value={form.maxUses || ""}
                        onChange={(e) =>
                          setForm({ ...form, maxUses: Number(e.target.value) || 0 })
                        }
                        className={inputBase}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Min Purchase (৳)" htmlFor="min-purchase" />
                      <input
                        id="min-purchase"
                        type="number"
                        min={0}
                        value={form.minPurchase || ""}
                        onChange={(e) =>
                          setForm({ ...form, minPurchase: Number(e.target.value) || 0 })
                        }
                        className={inputBase}
                        placeholder="e.g. 5000000"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* VALIDITY */}
              <FormSection
                title="Validity Period"
                subtitle="When this discount can be used"
                icon={Calendar}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Start Date" required htmlFor="start-date" />
                    <input
                      id="start-date"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="End Date" required htmlFor="end-date" />
                    <input
                      id="end-date"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* COUPON CODE & NOTES */}
              <FormSection
                title="Coupon Code & Notes"
                subtitle="Optional promo code"
                icon={Gift}
              >
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Coupon Code" htmlFor="coupon" hint="Optional" />
                    <input
                      id="coupon"
                      type="text"
                      placeholder="e.g. GULSHAN10"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value.toUpperCase() })
                      }
                      className={inputBase + " uppercase"}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Notes" htmlFor="notes" />
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Internal notes about this discount…"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputBase + " resize-none"}
                    />
                  </div>
                </div>
              </FormSection>

              {/* LIVE PREVIEW */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={18} />
                  <h3 className="font-bold">Live Discount Preview</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs opacity-80 mb-1">List Price</p>
                    <p className="text-xl font-bold">{formatMoney(basePrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">You Save</p>
                    <p className="text-xl font-bold">-{formatMoney(discountAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Final Price</p>
                    <p className="text-xl font-bold">{formatMoney(finalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Savings</p>
                    <p className="text-xl font-bold flex items-center gap-1">
                      <TrendingDown size={16} /> {savingsPercent}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                  <span className="opacity-80 flex items-center gap-1">
                    <Sparkles size={14} />
                    {form.reason || "Select a reason"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {audience.find((a) => a.id === audienceId)?.label}
                  </span>
                </div>
              </div>

              {/* INFO ALERT */}
              <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Discounts apply to new bookings only during the validity period. Existing contracts are not affected.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProperty(null)}
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
                  Create Discount
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}