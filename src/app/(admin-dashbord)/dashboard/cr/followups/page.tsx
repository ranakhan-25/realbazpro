/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CalendarCheck2, Search, Loader2, RefreshCw, Phone, Mail } from "lucide-react";
import { crApi } from "@/lib/crApi";

export default function CRFollowupsPage() {
  const [loading, setLoading] = useState(true);
  const [followups, setFollowups] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crApi.getRecoveryLogs?.() ?? [];
      const rows = Array.isArray(data) ? data : [];
      setFollowups(rows.map((r: any) => ({
          id: r?.id ?? r?.uuid,
          customer_name: r?.sale_agreement?.customer_name ?? r?.customer_name ?? "—",
          agreement_number: r?.sale_agreement?.agreement_number ?? "—",
          unit_identifier: r?.sale_agreement?.unit_identifier ?? "—",
          action_type: r?.action_type ?? "",
          scheduled_date: r?.action_date ? String(r.action_date).slice(0, 10) : "—",
          officer: r?.officer_name ?? "—",
          notes: r?.customer_response ?? r?.remarks ?? "—",
          outcome: r?.outcome_status ?? r?.outcome ?? "",
          next_date: r?.next_followup_date ? String(r.next_followup_date).slice(0, 10) : "—",
        })));
    } catch (error) {
      console.error("Failed to load recovery follow-ups:", error);
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return followups;
    return followups.filter((r) =>
      r.customer_name?.toLowerCase().includes(q) ||
      r.agreement_number?.toLowerCase().includes(q) ||
      r.officer?.toLowerCase().includes(q)
    );
  }, [followups, search]);

  const ACTION_LABEL: Record<string, string> = {
    phone_call: "📞 Phone Call", in_person_visit: "🏠 Field Visit",
    reminder_letter_1: "✉ 1st Reminder", reminder_letter_2: "✉ 2nd Reminder", legal_notice: "⚖ Legal Notice",
  };
  const OUTCOME_COLOR: Record<string, string> = {
    promised: "bg-blue-100 text-blue-800", resolved: "bg-emerald-100 text-emerald-800",
    in_progress: "bg-amber-100 text-amber-800", disputed: "bg-rose-100 text-rose-800", unreachable: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink">Field Follow-Ups</h1>
            <p className="text-[12px] text-ink-muted">Credit Realization / Recovery Follow-Up Schedule & Logs</p>
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
                  {["#", "Customer", "Agreement", "Unit", "Action Type", "Scheduled Date", "Officer", "Outcome", "Next Date", "Notes"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-3 py-8 text-center text-ink-muted">No follow-ups found.</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-canvas/50 transition-colors">
                    <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.customer_name}</td>
                    <td className="px-3 py-2 text-primary">{r.agreement_number}</td>
                    <td className="px-3 py-2 text-ink-muted">{r.unit_identifier}</td>
                    <td className="px-3 py-2">{ACTION_LABEL[r.action_type] ?? r.action_type}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.scheduled_date}</td>
                    <td className="px-3 py-2">{r.officer}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${OUTCOME_COLOR[r.outcome] ?? "bg-gray-100 text-gray-800"}`}>
                        {r.outcome?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.next_date}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate text-ink-muted" title={r.notes}>{r.notes}</td>
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
