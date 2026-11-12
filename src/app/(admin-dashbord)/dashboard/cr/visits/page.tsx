/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2, RefreshCw } from "lucide-react";
import { crApi } from "@/lib/crApi";

export default function CRVisitsPage() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crApi.getRecoveryLogs?.() ?? [];
      const rows = (Array.isArray(data) ? data : []).filter((r: any) => r?.action_type === "in_person_visit");
      setVisits(rows.map((r: any) => ({
          id: r?.id ?? r?.uuid,
          customer_name: r?.sale_agreement?.customer_name ?? "—",
          agreement_number: r?.sale_agreement?.agreement_number ?? "—",
          unit_identifier: r?.sale_agreement?.unit_identifier ?? "—",
          visit_date: r?.action_date ? String(r.action_date).slice(0, 10) : "—",
          officer: r?.officer_name ?? "—",
          purpose: r?.customer_response ?? "—",
          outcome: r?.outcome_status ?? "",
          address: r?.address ?? "—",
        })));
    } catch (error) {
      console.error("Failed to load field visits:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return visits;
    return visits.filter((r) =>
      r.customer_name?.toLowerCase().includes(q) ||
      r.agreement_number?.toLowerCase().includes(q) ||
      r.officer?.toLowerCase().includes(q)
    );
  }, [visits, search]);

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink">Field Visits</h1>
            <p className="text-[12px] text-ink-muted">Credit Realization / In-Person Recovery Visit Logs</p>
          </div>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-canvas text-[12.5px] font-medium text-ink hover:bg-surface">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-xs p-4 space-y-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
          <input type="text" placeholder="Search customer, officer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 w-full rounded-md border border-border bg-canvas text-ink text-[13px]" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-ink-muted" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Customer", "Agreement", "Unit", "Visit Date", "Officer", "Purpose", "Outcome", "Address"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-ink-muted">No field visits found.</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-canvas/50 transition-colors">
                    <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.customer_name}</td>
                    <td className="px-3 py-2 text-primary">{r.agreement_number}</td>
                    <td className="px-3 py-2 text-ink-muted">{r.unit_identifier}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.visit_date}</td>
                    <td className="px-3 py-2">{r.officer}</td>
                    <td className="px-3 py-2">{r.purpose}</td>
                    <td className="px-3 py-2">{r.outcome}</td>
                    <td className="px-3 py-2 text-ink-muted max-w-[160px] truncate" title={r.address}>{r.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
