"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FileBarChart2,
  LoaderCircle,
  Printer,
  Search,
} from "lucide-react";
import { hrmFetch } from "@/app/(admin-dashbord)/dashboard/hrm/hrm-fetch";

type Row = Record<string, unknown>;
type EmployeeOption = { uuid: string; name: string; employeeCode?: string };
type Payload = {
  title?: string;
  data?: unknown;
  rows?: unknown;
  items?: unknown;
  summary?: Record<string, unknown>;
  message?: string;
  error?: string;
};
const rowArray = (value: unknown): Row[] => {
  if (Array.isArray(value))
    return value.filter(
      (item): item is Row =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["data", "rows", "items", "records", "results"]) {
    if (object[key] !== undefined) {
      const rows = rowArray(object[key]);
      if (rows.length || Array.isArray(object[key])) return rows;
    }
  }
  return [];
};
const labels: Record<string, string> = {
  employeeCode: "Employee ID",
  employeeName: "Employee name",
  employeeId: "Employee ID",
  attendanceType: "Day type",
  isPresent: "Present",
  inTime: "Check in",
  outTime: "Check out",
  grossSalary: "Gross salary",
  absentDays: "Absent days",
  absentAmount: "Absent deduction",
  deduction: "Deduction",
  netSalary: "Net salary",
  bankPayableAmount: "Bank payable",
  cashPayableAmount: "Cash payable",
  dueAmount: "Due amount",
  workingDays: "Working days",
  attendanceRate: "Attendance %",
  leaveTypeId: "Leave type",
  fromDate: "From",
  toDate: "To",
  allocatedDays: "Allocated days",
  balanceDays: "Balance days",
};
const titleCase = (key: string) =>
  labels[key] ||
  key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
const format = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    /(salary|deduction|amount|payable|due)/i.test(key) &&
    Number.isFinite(Number(value))
  )
    return new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  return String(value);
};

export default function HrmReportViewer({
  title,
  endpoint,
}: {
  title: string;
  endpoint: string;
}) {
  const [payload, setPayload] = useState<Payload>({ data: [], summary: {} });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, { bank: string; cash: string }>>({});
  const [savingUuid, setSavingUuid] = useState("");
  const [allocationError, setAllocationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    async (
      filters: { fromDate?: string; toDate?: string; search?: string; month?: string; year?: string; employeeId?: string } = {},
    ) => {
      setLoading(true);
      setError("");
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      try {
        const response = await hrmFetch(
          `/api/backend/${endpoint}${query.size ? `?${query}` : ""}`,
          { cache: "no-store", headers: { accept: "application/json" } },
        );
        const result = (await response.json()) as Payload;
        if (!response.ok)
          throw new Error(
            result.message ||
              result.error ||
              `Report request failed (${response.status})`,
          );
        const nested =
          result.data &&
          !Array.isArray(result.data) &&
          typeof result.data === "object"
            ? (result.data as Payload)
            : result;
        setPayload({
          title: nested.title || result.title,
          data: rowArray(nested.data ?? nested.rows ?? nested.items),
          summary: nested.summary || result.summary || {},
        });
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load report",
        );
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let active = true;
    void hrmFetch("/api/backend/employee-list?page=1&limit=500&status=active&withDeleted=false", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        const options = rowArray(result).flatMap((row) => {
          const uuid = String(row.uuid || "");
          const name = String(row.name || row.employeeName || "");
          return uuid && name ? [{ uuid, name, employeeCode: String(row.employeeCode || "") }] : [];
        });
        if (active) setEmployees(options);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const columns = useMemo(
    () =>
      [...new Set(rows.flatMap((row) => Object.keys(row)))].filter(
        (key) => !["uuid", "id", "orgId", "projectId"].includes(key),
      ),
    [rows],
  );
  const summary = payload.summary || {};
  const summaryEntries = Object.entries(summary)
    .filter(([key, value]) => key !== "records" && typeof value === "number")
    .slice(0, 3);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    void load({ fromDate, toDate, search, month, year, employeeId });
  };
  const saveAllocation = async (row: Row) => {
    const uuid = String(row.uuid || "");
    if (!uuid) return;
    const draft = allocationDrafts[uuid] || {
      bank: String(row.bankPayableAmount ?? 0),
      cash: String(row.cashPayableAmount ?? 0),
    };
    setSavingUuid(uuid);
    setAllocationError("");
    try {
      const response = await hrmFetch(`/api/backend/pay-slip/${uuid}/payment-split`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bankPayableAmount: Number(draft.bank), cashPayableAmount: Number(draft.cash) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save payment allocation");
      setPayload((current) => ({ ...current, data: rows.map((item) => item.uuid === uuid ? {
        ...item,
        bankPayableAmount: Number(draft.bank),
        cashPayableAmount: Number(draft.cash),
        status: "Allocated",
      } : item) }));
      setAllocationDrafts((current) => { const next = { ...current }; delete next[uuid]; return next; });
    } catch (cause) {
      setAllocationError(cause instanceof Error ? cause.message : "Could not save payment allocation");
    } finally {
      setSavingUuid("");
    }
  };
  const exportCsv = () => {
    const csv = [
      columns.map(titleCase),
      ...rows.map((row) => columns.map((key) => row[key] ?? "")),
    ]
      .map((cells) =>
        cells
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${endpoint.split("/").pop() || "hrm-report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-4 text-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <FileBarChart2 size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {payload.title || title}
            </h1>
            <p className="text-xs text-slate-500">Live HRM data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </header>
      <form
        onSubmit={apply}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="grid gap-1 text-xs text-slate-500">
          Month
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 dark:border-slate-700">
            <option value="">All months</option>
            { ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((value) => <option key={value}>{value}</option>) }
          </select>
        </label>
        <label className="grid gap-1 text-xs text-slate-500">
          Year
          <select value={year} onChange={(event) => setYear(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 dark:border-slate-700">
            <option value="">All years</option>
            {Array.from({ length: 11 }, (_, index) => String(new Date().getFullYear() - 5 + index)).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid min-w-52 gap-1 text-xs text-slate-500">
          Employee
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 dark:border-slate-700">
            <option value="">All employees</option>
            {employees.map((employee) => <option key={employee.uuid} value={employee.uuid}>{employee.name}{employee.employeeCode ? ` (${employee.employeeCode})` : ""}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-slate-500">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 dark:border-slate-700"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-500">
          To
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 dark:border-slate-700"
          />
        </label>
        <label className="relative min-w-48 flex-1 text-xs text-slate-500">
          <span>Search</span>
          <Search className="absolute bottom-2.5 left-2.5" size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Employee, status, date…"
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-transparent pl-8 pr-2 dark:border-slate-700"
          />
        </label>
        <button className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white">
          Apply filters
        </button>
      </form>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
        >
          {error}
        </div>
      )}
      {allocationError && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{allocationError}</div>}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Records</p>
          <p className="mt-1 text-lg font-bold">
            {rows.length.toLocaleString()}
          </p>
        </div>
        {summaryEntries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500">{titleCase(key)}</p>
            <p className="mt-1 text-lg font-bold">{format(key, value)}</p>
          </div>
        ))}
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-slate-500">
              {rows.length.toLocaleString()} records
            </p>
          </div>
          {loading && (
            <LoaderCircle className="animate-spin text-indigo-500" size={18} />
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-indigo-600 text-[10px] uppercase tracking-wide text-white">
              <tr>
                {columns.map((key) => (
                  <th key={key} className="whitespace-nowrap px-3 py-2.5">
                    {titleCase(key)}
                  </th>
                ))}
                {endpoint === "pay-slip/bank" && <th className="whitespace-nowrap px-3 py-2.5">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, index) => (
                <tr
                  key={String(
                    row.uuid ||
                      row.id ||
                      `${row.employeeId || row.date || "row"}-${index}`,
                  )}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  {columns.map((key) => (
                    <td key={key} className="whitespace-nowrap px-3 py-2.5">
                      {endpoint === "pay-slip/bank" && ["bankPayableAmount", "cashPayableAmount"].includes(key) ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={`${titleCase(key)} for ${String(row.employeeName || "employee")}`}
                          value={allocationDrafts[String(row.uuid)]?.[key === "bankPayableAmount" ? "bank" : "cash"] ?? String(row[key] ?? 0)}
                          onChange={(event) => setAllocationDrafts((current) => ({
                            ...current,
                            [String(row.uuid)]: {
                              bank: current[String(row.uuid)]?.bank ?? String(row.bankPayableAmount ?? 0),
                              cash: current[String(row.uuid)]?.cash ?? String(row.cashPayableAmount ?? 0),
                              [key === "bankPayableAmount" ? "bank" : "cash"]: event.target.value,
                            },
                          }))}
                          className="w-32 rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-700"
                        />
                      ) : format(key, row[key])}
                    </td>
                  ))}
                  {endpoint === "pay-slip/bank" && <td className="px-3 py-2.5"><button type="button" onClick={() => void saveAllocation(row)} disabled={savingUuid === String(row.uuid)} className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white disabled:opacity-50">{savingUuid === String(row.uuid) ? "Saving…" : "Save"}</button></td>}
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    className="px-3 py-12 text-center text-slate-500"
                  >
                    No HRM records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
