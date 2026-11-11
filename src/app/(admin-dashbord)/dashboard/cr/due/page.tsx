/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  Phone,
  FileSpreadsheet,
} from "lucide-react";
import { crApi } from "@/lib/crApi";

// ─── Fallback Data ─────────────────────────────────────────────────────────────
const FALLBACK_DUES = [
  {
    id: "due-001",
    agreement_number: "AGR-2026-001",
    customer_name: "Dr. Tariqul Islam",
    customer_phone: "+880-1711-234567",
    unit_identifier: "Plot-A17, Sector-7",
    installment_no: 4,
    title: "4th Monthly Installment",
    due_date: "2026-11-01",
    payable_amount: 150000,
    due_amount: 150000,
    penalty_amount: 0,
    days_overdue: 10,
    status: "pending",
  },
  {
    id: "due-002",
    agreement_number: "AGR-2026-002",
    customer_name: "Engr. Nasrin Sultana",
    customer_phone: "+880-1812-345678",
    unit_identifier: "Flat-B8, Tower-C",
    installment_no: 2,
    title: "2nd Monthly Installment",
    due_date: "2026-10-15",
    payable_amount: 200000,
    due_amount: 200000,
    penalty_amount: 5000,
    days_overdue: 27,
    status: "overdue",
  },
  {
    id: "due-003",
    agreement_number: "AGR-2026-004",
    customer_name: "Alhaj Motiur Rahman",
    customer_phone: "+880-1912-456789",
    unit_identifier: "Plot-D12, Block-A",
    installment_no: 6,
    title: "6th Quarterly Installment",
    due_date: "2026-10-01",
    payable_amount: 450000,
    due_amount: 450000,
    penalty_amount: 22500,
    days_overdue: 41,
    status: "overdue",
  },
];

export default function CRDuePage() {
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [isFallback, setIsFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const overdue = await crApi.getOverdueInstallments?.() ?? [];
      const data = Array.isArray(overdue) ? overdue : [];
      if (data.length > 0) {
        setDues(data.map((p: any) => ({
          id: p?.id ?? p?.uuid ?? `due-${Math.random()}`,
          agreement_number: p?.sale_agreement?.agreement_number ?? p?.agreement_number ?? "—",
          customer_name: p?.sale_agreement?.customer_name ?? p?.customer_name ?? "Customer",
          customer_phone: p?.sale_agreement?.customer_phone ?? p?.customer_phone ?? "—",
          unit_identifier: p?.sale_agreement?.unit_identifier ?? p?.unit_identifier ?? "—",
          installment_no: p?.installment_no ?? 1,
          title: p?.title ?? `Installment #${p?.installment_no ?? 1}`,
          due_date: p?.due_date ?? "—",
          payable_amount: Number(p?.payable_amount ?? p?.amount ?? 0),
          due_amount: Number(p?.due_amount ?? p?.payable_amount ?? 0),
          penalty_amount: Number(p?.penalty_amount ?? p?.late_fee ?? 0),
          days_overdue: p?.days_overdue ?? 0,
          status: p?.status ?? "pending",
        })));
        setIsFallback(false);
      } else {
        setDues(FALLBACK_DUES);
        setIsFallback(true);
      }
    } catch {
      setDues(FALLBACK_DUES);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dues;
    return dues.filter((r) =>
      r.customer_name?.toLowerCase().includes(q) ||
      r.agreement_number?.toLowerCase().includes(q) ||
      r.unit_identifier?.toLowerCase().includes(q)
    );
  }, [dues, search]);

  const paged = filtered.slice(0, entries);
  const totalDue = filtered.reduce((s, r) => s + (r.due_amount ?? 0), 0);
  const totalPenalty = filtered.reduce((s, r) => s + (r.penalty_amount ?? 0), 0);
  const fmt = (n: number) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink">Customer Dues</h1>
            <p className="text-[12px] text-ink-muted">
              Credit Realization / Outstanding & Overdue Customer Installments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Debtors", value: String(filtered.length), color: "text-blue-600", suffix: "accounts" },
          { label: "Total Due Amount", value: fmt(totalDue), color: "text-amber-600", suffix: "BDT" },
          { label: "Total Penalty", value: fmt(totalPenalty), color: "text-rose-600", suffix: "BDT" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-surface p-3 shadow-xs">
            <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-ink-faint mt-0.5">{kpi.suffix}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <span>Show</span>
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} className="border border-border rounded px-2 py-1 bg-canvas text-ink text-[13px]">
              {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
            <input type="text" placeholder="Search customer, agreement..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 rounded-md border border-border bg-canvas text-ink text-[13px] w-56" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Agreement", "Customer", "Phone", "Unit", "Installment", "Due Date", "Due Amount", "Penalty", "Days Overdue", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={11} className="px-3 py-8 text-center text-ink-muted">No dues found.</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-canvas/50 transition-colors">
                    <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-primary">{r.agreement_number}</td>
                    <td className="px-3 py-2 font-medium">{r.customer_name}</td>
                    <td className="px-3 py-2 text-ink-muted">{r.customer_phone}</td>
                    <td className="px-3 py-2">{r.unit_identifier}</td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.due_date}</td>
                    <td className="px-3 py-2 text-right font-mono text-amber-600 font-semibold">{fmt(r.due_amount)}</td>
                    <td className="px-3 py-2 text-right font-mono text-rose-600">{fmt(r.penalty_amount)}</td>
                    <td className="px-3 py-2 text-center">
                      {r.days_overdue > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                          {r.days_overdue}d
                        </span>
                      ) : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium border border-border bg-canvas hover:bg-surface text-ink transition">
                        <Phone className="w-3 h-3" />
                        Contact
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-[12px] text-ink-muted">
          <span>Showing {paged.length} of {filtered.length} entries</span>
          {isFallback && <span className="text-amber-600 font-medium">⚠ Showing demo data — backend not connected</span>}
        </div>
      </div>
    </div>
  );
}
