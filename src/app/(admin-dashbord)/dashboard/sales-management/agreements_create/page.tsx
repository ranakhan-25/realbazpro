"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  DollarSign,
  FileCheck,
  Loader2,
  Save,
  User,
  X,
} from "lucide-react";
import { formatApiErrorMessage } from "@/lib/api";
import { agreementService, AgreementPayload } from "@/services/agreementService";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          <Icon size={18} />
        </span>
        <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function CreateAgreementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AgreementPayload>({
    agreementCode: "",
    buyer: "",
    buyerAvatar: "",
    property: "",
    propertyCode: "",
    propertyType: "Residential Land",
    price: 0,
    advance: 0,
    date: new Date().toISOString().slice(0, 10),
    status: "Draft",
    image: "",
    buyerEmail: "",
    buyerPhone: "",
    notes: "",
  });

  const update = <K extends keyof AgreementPayload>(key: K, value: AgreementPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await agreementService.create({
        ...form,
        agreementCode: form.agreementCode.trim(),
        buyer: form.buyer.trim(),
        property: form.property.trim(),
        propertyCode: form.propertyCode.trim(),
        price: Number(form.price),
        advance: Number(form.advance),
      });
      router.push("/dashboard/sales-management/agreements_view");
    } catch (requestError) {
      setError(formatApiErrorMessage(requestError));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/agreements_view" className="hover:text-indigo-600">Agreements</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Create</span>
      </nav>

      <div className="flex items-start gap-4 mb-8">
        <Link href="/dashboard/sales-management/agreements_view" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Create Agreement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a property sale agreement and buyer details.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Agreement Details" icon={FileCheck}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Agreement Code" required><input className={inputClass} required value={form.agreementCode} onChange={(e) => update("agreementCode", e.target.value)} placeholder="AGR-2024-001" /></Field>
              <Field label="Agreement Date" required><div className="relative"><Calendar size={16} className="absolute left-4 top-3.5 text-gray-400" /><input className={`${inputClass} pl-10`} required type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></div></Field>
              <Field label="Status" required><select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value as AgreementPayload["status"])}><option>Draft</option><option>Pending</option><option>Signed</option></select></Field>
            </div>
          </Section>

          <Section title="Buyer Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Buyer Name" required><input className={inputClass} required value={form.buyer} onChange={(e) => update("buyer", e.target.value)} placeholder="Ayesha Rahman" /></Field>
              <Field label="Email"><input className={inputClass} type="email" value={form.buyerEmail} onChange={(e) => update("buyerEmail", e.target.value)} placeholder="buyer@example.com" /></Field>
              <Field label="Phone"><input className={inputClass} type="tel" value={form.buyerPhone} onChange={(e) => update("buyerPhone", e.target.value)} placeholder="+8801700000000" /></Field>
              <Field label="Buyer Avatar URL"><input className={inputClass} type="url" value={form.buyerAvatar} onChange={(e) => update("buyerAvatar", e.target.value)} placeholder="https://..." /></Field>
            </div>
          </Section>

          <Section title="Property & Financials" icon={Building2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property Name" required><input className={inputClass} required value={form.property} onChange={(e) => update("property", e.target.value)} placeholder="Gulshan Plot 12/A" /></Field>
              <Field label="Property Code" required><input className={inputClass} required value={form.propertyCode} onChange={(e) => update("propertyCode", e.target.value)} placeholder="GUL-PLT-012" /></Field>
              <Field label="Property Type" required><select className={inputClass} value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}><option>Residential Land</option><option>Apartment</option><option>Commercial</option><option>Villa</option></select></Field>
              <Field label="Property Image URL"><input className={inputClass} type="url" value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." /></Field>
              <Field label="Total Price" required><div className="relative"><DollarSign size={16} className="absolute left-4 top-3.5 text-gray-400" /><input className={`${inputClass} pl-10`} required min="0" type="number" value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} /></div></Field>
              <Field label="Advance" required><div className="relative"><DollarSign size={16} className="absolute left-4 top-3.5 text-gray-400" /><input className={`${inputClass} pl-10`} required min="0" type="number" value={form.advance || ""} onChange={(e) => update("advance", Number(e.target.value))} /></div></Field>
            </div>
          </Section>

          <Section title="Notes" icon={FileCheck}>
            <textarea className={`${inputClass} resize-none`} rows={5} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Handover date, special terms, or other notes..." />
          </Section>
        </div>

        <aside className="lg:sticky lg:top-6 h-fit rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white"><h2 className="font-bold flex items-center gap-2"><DollarSign size={18} /> Agreement Summary</h2></div>
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4"><span className="text-gray-500">Buyer</span><span className="font-semibold text-gray-900 dark:text-white text-right">{form.buyer || "—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Property</span><span className="font-semibold text-gray-900 dark:text-white text-right">{form.property || "—"}</span></div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-4"><span className="text-gray-500">Total Price</span><span className="font-bold text-indigo-600">৳{Number(form.price || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Advance</span><span className="font-bold text-gray-900 dark:text-white">৳{Number(form.advance || 0).toLocaleString()}</span></div>
            <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/20"><span>{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}</span>{isSubmitting ? "Creating..." : "Create Agreement"}</button>
            <Link href="/dashboard/sales-management/agreements_view" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"><X size={16} /> Cancel</Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
