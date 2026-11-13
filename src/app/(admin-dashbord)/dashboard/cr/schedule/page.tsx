/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  ChevronDown,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { crApi } from "@/lib/crApi";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300", icon: AlertTriangle },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
  upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Calendar },
};

export default function CRSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Try fetching from agreements and flatten installment plans
      const agreements = await crApi.getAgreements?.() ?? [];
      const rows: any[] = [];
      (Array.isArray(agreements) ? agreements : []).forEach((agr: any) => {
        (agr?.installment_plans ?? agr?.schedule ?? []).forEach((plan: any) => {
          rows.push({
            id: String(plan?.id ?? plan?.uuid ?? ""),
            agreement_number: agr?.agreement_number ?? "—",
            customer_name: agr?.customer_name ?? "—",
            unit_identifier: agr?.unit_identifier ?? "—",
            installment_no: plan?.installment_no ?? "",
            title: plan?.title ?? "",
            due_date: plan?.due_date ?? "—",
            payable_amount: Number(plan?.payable_amount ?? plan?.amount ?? 0),
            paid_amount: Number(plan?.paid_amount ?? 0),
            due_amount: Number(plan?.due_amount ?? 0),
            penalty_amount: Number(plan?.penalty_amount ?? 0),
            status: plan?.status ?? "",
          });
        });
      });
      setSchedules(rows);
    } catch (error) {
      console.error("Failed to load installment schedule:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return schedules.filter((r) => {
      const matchSearch = !q ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.agreement_number?.toLowerCase().includes(q) ||
        r.unit_identifier?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schedules, search, statusFilter]);

  const paged = filtered.slice(0, entries);
  const totals = useMemo(() => ({
    payable: filtered.reduce((s, r) => s + (r.payable_amount ?? 0), 0),
    paid: filtered.reduce((s, r) => s + (r.paid_amount ?? 0), 0),
    due: filtered.reduce((s, r) => s + (r.due_amount ?? 0), 0),
    penalty: filtered.reduce((s, r) => s + (r.penalty_amount ?? 0), 0),
  }), [filtered]);

  const fmt = (n: number) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink">Installment Schedule</h1>
            <p className="text-[12px] text-ink-muted">
              Credit Realization / Full Amortization Timeline & Payment Status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Payable", value: fmt(totals.payable), color: "text-blue-600" },
          { label: "Total Collected", value: fmt(totals.paid), color: "text-emerald-600" },
          { label: "Total Due", value: fmt(totals.due), color: "text-amber-600" },
          { label: "Total Penalty", value: fmt(totals.penalty), color: "text-rose-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-surface p-3 shadow-xs">
            <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-ink-faint mt-0.5">BDT</p>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="rounded-lg border border-border bg-surface shadow-xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="border border-border rounded px-2 py-1 bg-canvas text-ink text-[13px]"
            >
              {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded px-3 py-1.5 bg-canvas text-ink text-[13px]"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
              <input
                type="text"
                placeholder="Search customer, agreement..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md border border-border bg-canvas text-ink text-[13px] w-56"
              />
            </div>
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
                  {["#", "Agreement", "Customer", "Unit", "Installment", "Due Date", "Payable", "Paid", "Due", "Penalty", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-ink-muted">
                      No installment schedules found.
                    </td>
                  </tr>
                ) : paged.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-canvas/50 transition-colors">
                      <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-primary">{r.agreement_number}</td>
                      <td className="px-3 py-2">{r.customer_name}</td>
                      <td className="px-3 py-2 text-ink-muted">{r.unit_identifier}</td>
                      <td className="px-3 py-2">{r.title}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.due_date}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(r.payable_amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">{fmt(r.paid_amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">{fmt(r.due_amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-600">{fmt(r.penalty_amount)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-[12px] text-ink-muted">
          <span>Showing {Math.min(paged.length, filtered.length)} of {filtered.length} entries</span>
        </div>
      </div>
    </div>
  );
}
