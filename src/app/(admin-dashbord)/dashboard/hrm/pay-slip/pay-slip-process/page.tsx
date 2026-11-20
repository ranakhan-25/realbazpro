"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmFetch } from "@/app/(admin-dashbord)/dashboard/hrm/hrm-fetch";

type Slip = { uuid: string; employeeCode?: string; employeeId: string; employeeName: string; month: string; year: number; grossSalary: number; absentAmount: number; deduction: number; netSalary: number };
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - 5 + i));
const money = (value: number) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getRows = (payload: unknown): Slip[] => {
  if (Array.isArray(payload)) return payload as Slip[];
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  for (const key of ["data", "rows", "items", "results"]) {
    if (data[key] !== undefined) {
      const rows = getRows(data[key]);
      if (rows.length || Array.isArray(data[key])) return rows;
    }
  }
  return [];
};

export default function PaySlipProcessPage() {
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [rows, setRows] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await hrmFetch(`/api/backend/pay-slip?month=${encodeURIComponent(month)}&year=${year}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load pay slips");
      setRows(getRows(result));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load pay slips"); }
    finally { setLoading(false); }
  }, [month, year]);
  useEffect(() => { void load(); }, [load]);
  const generate = async () => {
    setLoading(true); setError("");
    try {
      const response = await hrmFetch("/api/backend/pay-slip/process", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ month, year: Number(year) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not generate pay slips");
      setRows(getRows(result));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate pay slips"); }
    finally { setLoading(false); }
  };
  return <main className="min-h-screen space-y-4 bg-canvas p-4 text-ink">
    <header><h1 className="text-xl font-semibold">Pay Slip Process</h1><p className="text-sm text-ink-muted">Generate and review monthly employee pay slips.</p></header>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void generate(); }}>
      <label className="grid gap-1 text-sm">Month<select className="rounded border border-border bg-surface px-3 py-2" value={month} onChange={e => setMonth(e.target.value)}>{months.map(m => <option key={m}>{m}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Year<select className="rounded border border-border bg-surface px-3 py-2" value={year} onChange={e => setYear(e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
      <button disabled={loading} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? "Loading…" : "Generate Pay Slip"}</button>
    </form>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    <div className="overflow-x-auto rounded-lg border border-border bg-surface"><table className="w-full text-left text-sm"><thead className="bg-indigo-600 text-white"><tr>{["SL", "EMPLOYEE ID", "EMPLOYEE NAME", "MONTH", "GROSS SALARY", "ABSENT AMOUNT", "DEDUCTION", "NET SALARY"].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.uuid} className="border-t border-border"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{row.employeeCode || row.employeeId}</td><td className="px-3 py-2">{row.employeeName}</td><td className="px-3 py-2">{row.month} {row.year}</td><td className="px-3 py-2">{money(row.grossSalary)}</td><td className="px-3 py-2">{money(row.absentAmount)}</td><td className="px-3 py-2">{money(row.deduction)}</td><td className="px-3 py-2">{money(row.netSalary)}</td></tr>)}{!rows.length && <tr><td colSpan={8} className="px-3 py-10 text-center text-ink-muted">{loading ? "Loading pay slips…" : "No pay slips for this period. Generate to calculate them from employee and attendance records."}</td></tr>}</tbody></table></div>
  </main>;
}
