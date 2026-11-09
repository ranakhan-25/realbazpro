"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Percent,
  DollarSign,
  Users,
  Building2,
  LandPlot,
  Save,
  X,
  CheckCircle2,
  Info,
  Calculator,
  TrendingUp,
  Briefcase,
  Layers,
  Award,
  FileText,
} from "lucide-react";

// ============ STATIC DATA ============
const agents = [
  { id: "agt-1", name: "Rashed Karim", role: "Senior Consultant", deals: 24, avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "agt-2", name: "Farhana Ahmed", role: "Property Advisor", deals: 19, avatar: "https://i.pravatar.cc/150?img=9" },
  { id: "agt-3", name: "Tanvir Hasan", role: "Land Specialist", deals: 16, avatar: "https://i.pravatar.cc/150?img=11" },
  { id: "agt-4", name: "Nusrat Jahan", role: "Rental Agent", deals: 14, avatar: "https://i.pravatar.cc/150?img=20" },
];

const propertyTypes = ["Residential Land", "Apartment", "Commercial", "Villa", "Rental"];

// ============ COMPONENTS ============
function FieldLabel({ label, required = false, htmlFor, hint }: { label: string; required?: boolean; htmlFor?: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
  );
}

function FormSection({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
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
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============
export default function CommissionFormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    agentId: "",
    propertyType: "",
    commissionType: "percentage", // percentage | flat
    baseAmount: 0, // For flat fee
    percentage: 0, // For percentage
    minCommission: 0,
    notes: "",
  });

  const selectedAgent = agents.find((a) => a.id === form.agentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // Example calculation for preview (Assuming a 1 Cr property)
  const examplePropertyValue = 10000000;
  const calculatedCommission = form.commissionType === "percentage" 
    ? (examplePropertyValue * form.percentage) / 100 
    : form.baseAmount;
    
  const finalCommission = Math.max(calculatedCommission, form.minCommission);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/commissions" className="hover:text-indigo-600 transition-colors">Commissions</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Setup Rule</span>
      </nav>

      {/* HEADER */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/dashboard/sales-management/commissions" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Commission Structure</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure commission rules for agents based on property types.</p>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Commission rule saved!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT FORM */}
          <div className="lg:col-span-2 space-y-6">
            <FormSection title="Agent & Property" subtitle="Who gets the commission and for what?" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Select Agent" required htmlFor="agent" />
                  <select id="agent" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} className={inputBase} required>
                    <option value="">Choose an agent…</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Property Type" required htmlFor="prop-type" />
                  <select id="prop-type" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className={inputBase} required>
                    <option value="">Select property type…</option>
                    {propertyTypes.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Commission Rate" subtitle="How is the commission calculated?" icon={Percent}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, commissionType: "percentage" })}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${form.commissionType === "percentage" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}>
                    <div className={`p-2 rounded-lg ${form.commissionType === "percentage" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}><Percent size={16} /></div>
                    <div>
                      <p className={`text-sm font-semibold ${form.commissionType === "percentage" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Percentage</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">% of property value</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, commissionType: "flat" })}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${form.commissionType === "flat" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}>
                    <div className={`p-2 rounded-lg ${form.commissionType === "flat" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}><DollarSign size={16} /></div>
                    <div>
                      <p className={`text-sm font-semibold ${form.commissionType === "flat" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Flat Fee</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fixed amount per deal</p>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.commissionType === "percentage" ? (
                    <div>
                      <FieldLabel label="Commission Rate (%)" required htmlFor="rate-percent" />
                      <div className="relative">
                        <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="rate-percent" type="number" step="0.1" min={0} max={100} placeholder="e.g. 2.5" value={form.percentage || ""} onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) || 0 })} className={inputBase} required />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FieldLabel label="Flat Fee Amount (৳)" required htmlFor="rate-flat" />
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="rate-flat" type="number" min={0} placeholder="e.g. 50000" value={form.baseAmount || ""} onChange={(e) => setForm({ ...form, baseAmount: Number(e.target.value) || 0 })} className={inputBase + " pl-11"} required />
                      </div>
                    </div>
                  )}
                  <div>
                    <FieldLabel label="Minimum Commission (৳)" htmlFor="min-comm" hint="Optional floor" />
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="min-comm" type="number" min={0} placeholder="e.g. 25000" value={form.minCommission || ""} onChange={(e) => setForm({ ...form, minCommission: Number(e.target.value) || 0 })} className={inputBase + " pl-11"} />
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Notes" icon={FileText}>
              <textarea rows={3} placeholder="Any specific conditions for this commission structure…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputBase + " resize-none"} />
            </FormSection>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <h3 className="font-bold text-white flex items-center gap-2"><Calculator size={18} /> Rule Preview</h3>
                </div>
                <div className="p-6 space-y-4">
                  {selectedAgent ? (
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                      <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedAgent.name}</p>
                        <p className="text-xs text-gray-500">{selectedAgent.role} • {selectedAgent.deals} deals</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 pb-4 border-b border-gray-100 dark:border-gray-800">Select an agent to see preview</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Property Type</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.propertyType || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Rule Type</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{form.commissionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {form.commissionType === "percentage" ? `${form.percentage}%` : formatMoney(form.baseAmount)}
                      </span>
                    </div>
                    {form.minCommission > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Min. Floor</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatMoney(form.minCommission)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Example: On a ৳1.00 Cr property</p>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Agent Gets</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(finalCommission)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-2">
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20">
                    <Save size={16} /> Save Rule
                  </button>
                  <Link href="/dashboard/sales-management/commissions" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    <X size={16} /> Cancel
                  </Link>
                </div>
              </div>
              
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Commission Rules</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                      <li>Rules apply to all future deals assigned to the agent.</li>
                      <li>Min. floor ensures agents don't get too little on small deals.</li>
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