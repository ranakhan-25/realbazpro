"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Download,
  FileBarChart2,
  LoaderCircle,
  Printer,
  Search,
} from "lucide-react";
import { accountsFetch } from "@/app/(admin-dashbord)/dashboard/accounts/accounts-fetch";

type Row = Record<string, unknown>;
type ReportResponse = {
  title?: string;
  data?: unknown;
  summary?: Record<string, number>;
  error?: string;
};
const extractRows = (value: unknown): Row[] => {
  if (Array.isArray(value))
    return value.filter(
      (row): row is Row =>
        row !== null && typeof row === "object" && !Array.isArray(row),
    );
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["data", "rows", "items", "records", "results"]) {
    if (record[key] !== undefined) {
      const rows = extractRows(record[key]);
      if (rows.length || Array.isArray(record[key])) return rows;
    }
  }
  return [];
};
const normalizeResponse = (value: unknown): ReportResponse => {
  if (!value || typeof value !== "object") return { data: [], summary: {} };
  const outer = value as Record<string, unknown>;
  const nested =
    outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
      ? (outer.data as Record<string, unknown>)
      : outer;
  const summary =
    nested.summary && typeof nested.summary === "object"
      ? Object.fromEntries(
          Object.entries(nested.summary as Record<string, unknown>).map(
            ([key, item]) => [key, Number(item) || 0],
          ),
        )
      : {};
  return {
    title: typeof nested.title === "string" ? nested.title : undefined,
    data: extractRows(
      nested.data ?? nested.rows ?? nested.items ?? nested.records,
    ),
    summary,
    error: typeof nested.error === "string" ? nested.error : undefined,
  };
};
const columns = [
  "date",
  "voucher",
  "type",
  "account",
  "description",
  "project",
  "openingBalance",
  "debit",
  "credit",
  "closingDebit",
  "closingCredit",
  "balance",
  "receipts",
  "payments",
  "net",
  "amount",
  "status",
  "section",
  "group",
  "particulars",
  "supplierName",
  "plannedAmount",
  "revisedAmount",
  "actualExpense",
  "collection",
  "variance",
];
const labels: Record<string, string> = {
  date: "Date",
  voucher: "Voucher",
  type: "Type",
  account: "Account",
  description: "Description",
  project: "Project",
  openingBalance: "Opening",
  debit: "Debit",
  credit: "Credit",
  closingDebit: "Closing debit",
  closingCredit: "Closing credit",
  balance: "Balance",
  receipts: "Receipts",
  payments: "Payments",
  net: "Net",
  amount: "Amount",
  status: "Status",
  section: "Section",
  group: "Group",
  particulars: "Particulars",
  supplierName: "Supplier",
  plannedAmount: "Planned budget",
  revisedAmount: "Revised budget",
  actualExpense: "Actual expenses",
  collection: "Collection",
  variance: "Budget variance",
};
const moneyKeys = new Set([
  "openingBalance",
  "debit",
  "credit",
  "closingDebit",
  "closingCredit",
  "balance",
  "receipts",
  "payments",
  "net",
  "amount",
  "plannedAmount",
  "revisedAmount",
  "actualExpense",
  "collection",
  "variance",
]);
const labelize = (key: string) =>
  labels[key] ||
  key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

export default function AccountsReportViewer({
  reportKey,
  title,
}: {
  reportKey: string;
  title: string;
}) {
  const [report, setReport] = useState<ReportResponse>({
    data: [],
    summary: {},
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    async (
      filters: { fromDate?: string; toDate?: string; search?: string } = {},
    ) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      try {
        const response = await accountsFetch(
          `/api/backend/accounts/reports/${reportKey}${params.size ? `?${params}` : ""}`,
          { cache: "no-store", headers: { accept: "application/json" } },
        );
        const rawBody: unknown = await response.json();
        const body = normalizeResponse(rawBody);
        if (!response.ok)
          throw new Error(
            body.error || `Report request failed (${response.status})`,
          );
        setReport(body);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load report",
        );
      } finally {
        setLoading(false);
      }
    },
    [reportKey],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void load({ fromDate, toDate, search });
  };
  const rows = Array.isArray(report.data) ? report.data : [];
  const visibleColumns = rows.length
    ? columns.filter((key) =>
        rows.some((row) => row[key] !== undefined && row[key] !== null),
      )
    : [];
  const exportCsv = () => {
    const csv = [
      visibleColumns.map(labelize),
      ...rows.map((row) => visibleColumns.map((key) => row[key] ?? "")),
    ]
      .map((line) =>
        line
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const summary = report.summary || {};
  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-4 text-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <FileBarChart2 size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {report.title || title}
            </h1>
            <p className="text-xs text-slate-500">
              Generated from live voucher and chart of accounts data
            </p>
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
        onSubmit={submit}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="grid gap-1 text-xs text-slate-500">
          From date
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-500">
          To date
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </label>
        <label className="relative min-w-48 flex-1 text-xs text-slate-500">
          <span>Search records</span>
          <Search className="absolute bottom-2.5 left-2.5" size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Account, voucher, description…"
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-transparent pl-8 pr-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </label>
        <button className="h-9 rounded-lg bg-slate-800 px-4 text-xs font-semibold text-white dark:bg-indigo-600">
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
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(summary.plannedAmount !== undefined
          ? ([
              ["Records", summary.records],
              ["Budget", summary.plannedAmount],
              ["Actual expense", summary.actualExpense],
              ["Collection", summary.collection],
            ] as const)
          : ([
              ["Records", summary.records],
              ["Debit", summary.debit],
              ["Credit", summary.credit],
              ["Net movement", summary.net],
            ] as const)
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold">
              {value === undefined
                ? "—"
                : label === "Records"
                  ? value.toLocaleString()
                  : new Intl.NumberFormat("en-BD", {
                      style: "currency",
                      currency: "BDT",
                      maximumFractionDigits: 2,
                    }).format(value)}
            </p>
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
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
              <tr>
                {visibleColumns.map((key) => (
                  <th key={key} className="whitespace-nowrap px-3 py-2.5">
                    {labelize(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, index) => (
                <tr
                  key={String(
                    row.uuid ||
                      row.id ||
                      `${row.voucher || row.account || "row"}-${index}`,
                  )}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  {visibleColumns.map((key) => (
                    <td
                      key={key}
                      className={`max-w-64 whitespace-nowrap px-3 py-2.5 ${moneyKeys.has(key) ? "text-right font-mono" : ""}`}
                    >
                      {moneyKeys.has(key) && typeof row[key] === "number"
                        ? new Intl.NumberFormat("en-BD", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(row[key] as number)
                        : String(row[key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(visibleColumns.length, 1)}
                    className="px-3 py-12 text-center text-slate-500"
                  >
                    No report rows match the current filters.
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
