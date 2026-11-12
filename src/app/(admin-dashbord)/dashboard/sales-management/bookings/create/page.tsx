"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, User, Mail, Phone, Calendar, Clock,
  MapPin, Building2, CreditCard, Plus, Save, X, Users, Tag,
  DollarSign, MessageSquare, AlertCircle, CheckCircle2, LandPlot,
  FileText, Ruler, Loader2
} from "lucide-react";

// ============ API CONFIG ============
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

// ============ STATIC OPTIONS ============
const properties = [
  { id: "prp-1", name: "Gulshan Plot 12/A (5 katha)", price: 12000000, type: "Land" },
  { id: "prp-2", name: "Bashundhara Apartment 7B", price: 6500000, type: "Apartment" },
  { id: "prp-3", name: "Dhanmondi Commercial Space", price: 9500000, type: "Commercial" },
  { id: "prp-4", name: "Uttara Villa 4C", price: 15000000, type: "Villa" },
  { id: "prp-5", name: "Mirpur Plot 22 (3 katha)", price: 7200000, type: "Land" },
];

const agents = [
  { id: "agt-1", name: "Rashed Karim", role: "Senior Property Consultant" },
  { id: "agt-2", name: "Farhana Ahmed", role: "Property Advisor" },
  { id: "agt-3", name: "Tanvir Hasan", role: "Land Specialist" },
  { id: "agt-4", name: "Nusrat Jahan", role: "Rental Agent" },
];

const addons = [
  { id: "add-1", name: "Legal Verification", price: 50000 },
  { id: "add-2", name: "RAJUK Mutation Fee", price: 400000 },
  { id: "add-3", name: "Registration & Stamp Duty", price: 600000 },
  { id: "add-4", name: "Site Survey", price: 25000 },
];

const paymentMethods = [
  "Bank Transfer",
  "Cheque",
  "Cash",
  "Credit Card",
  "Installment Plan",
];

// ============ COMPONENTS ============

function FieldLabel({ label, required = false, htmlFor }: { label: string; required?: boolean; htmlFor?: string; }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FormSection({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: any; children: React.ReactNode; }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============

export default function CreateBookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", nid: "" });
  const [property, setProperty] = useState({ propertyId: "", date: "", startTime: "", endTime: "", agent: "" });
  const [location, setLocation] = useState({ area: "", address: "", city: "Dhaka", country: "Bangladesh" });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const selectedProperty = properties.find((p) => p.id === property.propertyId);
  const propertyPrice = selectedProperty?.price || 0;
  
  // Calculate Addons Total
  const selectedAddonsObjects = selectedAddons.map(id => addons.find(a => a.id === id)).filter(Boolean) as {id: string, name: string, price: number}[];
  const addonsTotal = selectedAddonsObjects.reduce((sum, addon) => sum + addon.price, 0);

  const subtotal = propertyPrice + addonsTotal;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      buyerNid: buyer.nid || null,
      propertyId: property.propertyId,
      propertyName: selectedProperty?.name || "Unknown Property",
      propertyPrice: propertyPrice,
      visitDate: property.date ? new Date(property.date).toISOString() : new Date().toISOString(),
      startTime: property.startTime,
      endTime: property.endTime,
      agentId: property.agent || null,
      agentName: agents.find(a => a.id === property.agent)?.name || null,
      area: location.area,
      address: location.address,
      city: location.city,
      country: location.country,
      selectedAddons: selectedAddonsObjects,
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      totalAmount: total,
      paymentMethod: paymentMethod,
      notes: notes,
      addedBy: "Admin",
      addedById: "admin-uuid"
    };

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      // Success Redirect
      router.push('/dashboard/sales-management/bookings');
      
    } catch (error: any) {
      setErrorMsg(error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Create</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/sales-management/bookings" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Create New Booking</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the details below to book a property.</p>
          </div>
        </div>
      </div>

      {/* ERROR TOAST */}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - FORM */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* BUYER INFO */}
            <FormSection title="Buyer Information" subtitle="Who is booking this property?" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Full Name" required htmlFor="cust-name" />
                  <input id="cust-name" type="text" placeholder="e.g. Ayesha Rahman" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} className={inputBase} required />
                </div>
                <div>
                  <FieldLabel label="Email Address" required htmlFor="cust-email" />
                  <input id="cust-email" type="email" placeholder="ayesha@example.com" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} className={inputBase} required />
                </div>
                <div>
                  <FieldLabel label="Phone Number" required htmlFor="cust-phone" />
                  <input id="cust-phone" type="tel" placeholder="+880 1712-345678" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} className={inputBase} required />
                </div>
                <div>
                  <FieldLabel label="NID / Passport No." htmlFor="cust-nid" />
                  <input id="cust-nid" type="text" placeholder="1990123456789" value={buyer.nid} onChange={(e) => setBuyer({ ...buyer, nid: e.target.value })} className={inputBase} />
                </div>
              </div>
            </FormSection>

            {/* PROPERTY & SCHEDULE */}
            <FormSection title="Property & Schedule" subtitle="Select property and set site visit" icon={Building2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel label="Property" required htmlFor="prp-select" />
                  <select id="prp-select" value={property.propertyId} onChange={(e) => setProperty({ ...property, propertyId: e.target.value })} className={inputBase} required>
                    <option value="">Select a property…</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.price)} ({p.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Visit Date" required htmlFor="prp-date" />
                  <input id="prp-date" type="date" value={property.date} onChange={(e) => setProperty({ ...property, date: e.target.value })} className={inputBase} required />
                </div>
                <div>
                  <FieldLabel label="Assign Agent (optional)" htmlFor="prp-agent" />
                  <select id="prp-agent" value={property.agent} onChange={(e) => setProperty({ ...property, agent: e.target.value })} className={inputBase}>
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Start Time" required htmlFor="prp-start" />
                  <input id="prp-start" type="time" value={property.startTime} onChange={(e) => setProperty({ ...property, startTime: e.target.value })} className={inputBase} required />
                </div>
                <div>
                  <FieldLabel label="End Time" required htmlFor="prp-end" />
                  <input id="prp-end" type="time" value={property.endTime} onChange={(e) => setProperty({ ...property, endTime: e.target.value })} className={inputBase} required />
                </div>
              </div>
            </FormSection>

            {/* LOCATION */}
            <FormSection title="Property Location" subtitle="Where is the property located?" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel label="Area / Neighborhood" htmlFor="loc-area" />
                  <input id="loc-area" type="text" placeholder="e.g. Gulshan-2" value={location.area} onChange={(e) => setLocation({ ...location, area: e.target.value })} className={inputBase} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel label="Full Address" htmlFor="loc-address" />
                  <input id="loc-address" type="text" placeholder="Road, Plot number, Block" value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })} className={inputBase} />
                </div>
                <div>
                  <FieldLabel label="City" htmlFor="loc-city" />
                  <input id="loc-city" type="text" placeholder="e.g. Dhaka" value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} className={inputBase} />
                </div>
                <div>
                  <FieldLabel label="Country" htmlFor="loc-country" />
                  <select id="loc-country" value={location.country} onChange={(e) => setLocation({ ...location, country: e.target.value })} className={inputBase}>
                    <option>Bangladesh</option>
                    <option>India</option>
                    <option>Pakistan</option>
                    <option>Nepal</option>
                  </select>
                </div>
              </div>
            </FormSection>

            {/* ADD-ONS */}
            <FormSection title="Additional Services" subtitle="Optional fees for this booking" icon={Tag}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addons.map((addon) => {
                  const checked = selectedAddons.includes(addon.id);
                  return (
                    <button
                      type="button"
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        checked ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                          {checked && <CheckCircle2 size={12} />}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{addon.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">+{formatMoney(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>

            {/* PAYMENT & NOTES */}
            <FormSection title="Payment & Notes" icon={CreditCard}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Payment Method" htmlFor="pay-method" />
                    <select id="pay-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputBase}>
                      {paymentMethods.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Discount (৳)" htmlFor="pay-discount" />
                    <input id="pay-discount" type="number" min={0} placeholder="0" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className={inputBase} />
                  </div>
                </div>
                <div>
                  <FieldLabel label="Notes" htmlFor="notes" />
                  <textarea id="notes" rows={4} placeholder="Special requirements, buyer preferences…" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputBase + " resize-none"} />
                </div>
              </div>
            </FormSection>
          </div>

          {/* RIGHT - SUMMARY */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <h3 className="font-bold text-white flex items-center gap-2"><DollarSign size={18} />Booking Summary</h3>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Property</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{selectedProperty?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Property Price</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatMoney(propertyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Services ({selectedAddons.length})</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatMoney(addonsTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tax (5%)</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatMoney(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatMoney(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{formatMoney(total)}</span>
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSubmitting ? "Creating..." : "Create Booking"}
                  </button>
                  <Link
                    href="/dashboard/sales-management/bookings"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <X size={16} /> Cancel
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Before you create</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                      <li>Verify buyer NID and contact details</li>
                      <li>Confirm property availability</li>
                      <li>Check title & mutation status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}