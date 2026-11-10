"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, FileText, Loader2, Save, Trash2 } from "lucide-react";
import { formatApiErrorMessage } from "@/lib/api";
import { salesBookingService, type ApiRecord } from "@/services/salesBookingService";

export default function AgreementPage() {
  const params = useSearchParams();
  const uuid = params.get("uuid") || params.get("bookingUuid") || "";
  const agreementUuid = params.get("agreementUuid") || "";
  const query = uuid ? `?uuid=${encodeURIComponent(uuid)}${agreementUuid ? `&agreementUuid=${encodeURIComponent(agreementUuid)}` : ""}` : "";
  const [form, setForm] = useState({ agreementNumber: "", agreementDate: "", documentUrl: "", notes: "" });
  const [loading, setLoading] = useState(Boolean(uuid && agreementUuid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uuid || !agreementUuid) return;
    salesBookingService.getAgreement(uuid, agreementUuid).then((value) => setForm({
      agreementNumber: String(value.agreementNumber ?? value.number ?? ""),
      agreementDate: String(value.agreementDate ?? value.date ?? "").slice(0, 10),
      documentUrl: String(value.documentUrl ?? value.fileUrl ?? ""),
      notes: String(value.notes ?? ""),
    })).catch((err) => setError(formatApiErrorMessage(err))).finally(() => setLoading(false));
  }, [uuid, agreementUuid]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uuid) return setError("Booking UUID is missing. Open this page with ?uuid=<valid booking UUID>.");
    setSaving(true); setError("");
    try {
      const saved = agreementUuid ? await salesBookingService.updateAgreement(uuid, agreementUuid, form) : await salesBookingService.upsertAgreement(uuid, form);
      if (!agreementUuid && saved.uuid) window.history.replaceState(null, "", `${window.location.pathname}${query}&agreementUuid=${encodeURIComponent(String(saved.uuid))}`);
    } catch (err) { setError(formatApiErrorMessage(err)); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!uuid || !agreementUuid || !window.confirm("Delete this agreement?")) return;
    try { await salesBookingService.deleteAgreement(uuid, agreementUuid); setForm({ agreementNumber: "", agreementDate: "", documentUrl: "", notes: "" }); } catch (err) { setError(formatApiErrorMessage(err)); }
  };
  const field = (key: keyof typeof form, label: string, type = "text") => <label className="block"><span className="text-xs font-medium text-gray-500">{label}</span><input type={type} value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 text-sm" /></label>;

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8"><nav className="flex items-center gap-2 text-sm mb-6 text-gray-500"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14}/><Link href="/dashboard/sales-management/bookings">Bookings</Link><ChevronRight size={14}/><span className="text-gray-900 dark:text-white">{uuid || "Booking"}</span></nav><div className="mb-8"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Agreement</h1><p className="text-sm text-gray-500 mt-1">ID: {uuid || "—"}</p><div className="flex gap-2 border-b border-gray-200 mt-6 overflow-x-auto"><Link href={`/dashboard/sales-management/bookings/details/overview${query}`} className="px-4 py-3 text-sm text-gray-500">Overview</Link><Link href={`/dashboard/sales-management/bookings/details/installments${query}`} className="px-4 py-3 text-sm text-gray-500">Installments</Link><Link href={`/dashboard/sales-management/bookings/details/agreement${query}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">Agreement</Link></div></div><div className="max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"><div className="flex items-center gap-3 mb-6"><FileText className="text-indigo-600"/><div><h2 className="font-bold text-gray-900 dark:text-white">Agreement details</h2><p className="text-sm text-gray-500">Create or update the booking agreement.</p></div></div>{loading ? <Loader2 className="animate-spin text-indigo-600"/> : <form onSubmit={save} className="space-y-4">{field("agreementNumber", "Agreement number")}{field("agreementDate", "Agreement date", "date")}{field("documentUrl", "Document URL", "url")}<label className="block"><span className="text-xs font-medium text-gray-500">Notes</span><textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 text-sm"/></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex gap-2"><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Save size={16}/>{saving ? "Saving…" : "Save agreement"}</button>{agreementUuid && <button type="button" onClick={remove} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-600"><Trash2 size={16}/>Delete</button>}</div></form>}</div></div>;
}
