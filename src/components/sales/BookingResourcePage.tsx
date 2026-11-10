"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Loader2, Save, Trash2 } from "lucide-react";
import { formatApiErrorMessage } from "@/lib/api";
import { salesBookingService, type ApiRecord } from "@/services/salesBookingService";

type Props = { resource: string; title: string; recordParam: string; list?: boolean; initialUuid?: string };
const pretty = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const toForm = (value: ApiRecord) => ({ code: String(value.code ?? value.number ?? ""), date: String(value.date ?? value[`${Object.keys(value).find((key) => key.toLowerCase().includes("date")) || "date"}`] ?? "").slice(0, 10), status: String(value.status ?? "Pending"), notes: String(value.notes ?? value.description ?? ""), filePath: String(value.filePath ?? value.documentUrl ?? "") });

export default function BookingResourcePage({ resource, title, recordParam, list = false, initialUuid = "" }: Props) {
  const params = useSearchParams();
  const uuid = params.get("uuid") || params.get("bookingUuid") || params.get("bookingId") || params.get("id") || initialUuid;
  const recordUuid = params.get(recordParam) || "";
  const query = uuid ? `?uuid=${encodeURIComponent(uuid)}${recordUuid ? `&${recordParam}=${encodeURIComponent(recordUuid)}` : ""}` : "";
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [form, setForm] = useState({ code: "", date: "", status: "Pending", notes: "", filePath: "" });
  const shouldLoad = resource === "overview" || list || Boolean(recordUuid);
  const [loading, setLoading] = useState(Boolean(uuid && shouldLoad));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!uuid || !shouldLoad) { setLoading(false); return; }
    setLoading(true); setError("");
    try { const value = await salesBookingService.getBookingResource(resource, uuid, list ? undefined : recordUuid); if (list) setRows(Array.isArray(value) ? value : []); else setForm(toForm(value as ApiRecord)); }
    catch (err) { setError(formatApiErrorMessage(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [uuid, recordUuid, resource, list]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!uuid) return setError("Booking UUID is missing. Use ?uuid=<valid booking UUID>.");
    setSaving(true); setError("");
    try { if (recordUuid) await salesBookingService.updateBookingResource(resource, uuid, recordUuid, form); else await salesBookingService.upsertBookingResource(resource, uuid, form); await load(); }
    catch (err) { setError(formatApiErrorMessage(err)); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!uuid || !window.confirm("Delete this record?")) return; try { await salesBookingService.deleteBookingResource(resource, uuid, id); await load(); } catch (err) { setError(formatApiErrorMessage(err)); } };
  const tabs = ["overview", "installments", "agreement"];

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8"><nav className="flex items-center gap-2 text-sm mb-6 text-gray-500"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14}/><Link href="/dashboard/sales-management/bookings">Bookings</Link><ChevronRight size={14}/><span className="text-gray-900 dark:text-white">{uuid || "Booking"}</span></nav><div className="mb-8"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1><p className="text-sm text-gray-500 mt-1">Booking UUID: {uuid || "—"}</p><div className="flex gap-2 border-b border-gray-200 mt-6 overflow-x-auto">{tabs.map((tab) => <Link key={tab} href={`/dashboard/sales-management/bookings/details/${tab}${query}`} className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{pretty(tab)}</Link>)}</div></div><div className="max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">{loading ? <Loader2 className="animate-spin text-indigo-600"/> : error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : !uuid ? <p className="text-sm text-gray-500">Open this page with <code>?uuid=&lt;valid booking UUID&gt;</code>.</p> : list ? <><div className="flex items-center justify-between mb-4"><h2 className="font-bold">{title} records</h2><Link href={`/dashboard/sales-management/bookings/details/${resource}?uuid=${encodeURIComponent(uuid)}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Create new</Link></div><div className="space-y-2">{rows.length ? rows.map((row) => { const id = String(row.uuid ?? row.id ?? ""); return <div key={id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-medium">{String(row.name ?? row.title ?? row.documentName ?? row.code ?? id)}</p><p className="text-xs text-gray-500">{String(row.status ?? row.date ?? "")}</p></div><button onClick={() => remove(id)} className="text-red-600"><Trash2 size={16}/></button></div>; }) : <p className="text-sm text-gray-500">No records found.</p>}</div></> : <form onSubmit={save} className="space-y-4"><label className="block"><span className="text-xs text-gray-500">Reference / number</span><input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="block"><span className="text-xs text-gray-500">Date</span><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="block"><span className="text-xs text-gray-500">Status</span><input value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="block"><span className="text-xs text-gray-500">Notes</span><textarea rows={4} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>{resource === "documents" && <label className="block"><span className="text-xs text-gray-500">File path</span><input value={form.filePath} onChange={(e) => setForm({...form, filePath: e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>}<button disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white disabled:opacity-50"><Save size={16}/>{saving ? "Saving…" : "Save"}</button></form>}</div></div>;
}
