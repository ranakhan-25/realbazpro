"use client";

import React, { useState, useEffect } from "react";
import { accountsFetch } from "@/app/(admin-dashbord)/dashboard/accounts/accounts-fetch";
import Link from "next/link";
import { ChevronDown, Copy, FileText, ArrowUpDown } from "lucide-react";

export interface ChequeItem {
  id: number;
  instrumentNumber: string;
  chequeStatus: string;
  instrumentDate: string;
  favouringName: string;
  amount: string;
  chequeRange: string;
  cashBank: string;
}

export default function ListOfChequePage() {
  // Main Data State (API Ready)
  const [items, setItems] = useState<ChequeItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; name: string; value: string }>>([
    { id: "fallback-cash", name: "Cash Account", value: "Cash" },
    { id: "fallback-bank", name: "Bank Account", value: "Bank" },
  ]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [cashBankFilter, setCashBankFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    const loadAccounts = async () => {
      try {
        const response = await accountsFetch("/api/backend/chart-of-accounts?limit=500", { cache: "no-store" });
        const json = await response.json();
        const data = json?.data?.data ?? json?.data ?? json;
        const rows = Array.isArray(data) ? data : [];
        const options = rows.map((row: Record<string, unknown>) => ({ id: String(row.uuid ?? row.id ?? ""), name: String(row.name ?? row.accountName ?? ""), value: String(row.name ?? row.accountName ?? "") })).filter((row: { id: string; name: string; value: string }) => row.id && row.name && /cash|bank/i.test(row.name));
        if (active && options.length) setBankAccounts(options);
      } catch { /* Keep the previous Cash/Bank choices when the API is unavailable. */ }
    };
    void loadAccounts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCheques = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", limit: "500" });
        if (cashBankFilter) params.set("cashBank", cashBankFilter);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        const response = await accountsFetch(`/api/backend/cheques?${params.toString()}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || json?.success === false) throw new Error(json?.message || `Cheque request failed (${response.status})`);
        const data = json?.data?.data ?? json?.data ?? json;
        const records = Array.isArray(data) ? data : [];
        if (active) setItems(records.map((record: Record<string, unknown>, index: number) => {
          const range = (record.chequeRange ?? {}) as Record<string, unknown>;
          const from = Number(range.fromNumber ?? 0);
          const to = Number(range.toNumber ?? 0);
          return {
            id: index + 1,
            instrumentNumber: String(record.instrumentNumber ?? ""),
            chequeStatus: String(record.chequeStatus ?? ""),
            instrumentDate: record.instrumentDate ? String(record.instrumentDate).slice(0, 10) : "-",
            favouringName: String(record.favouringName ?? "-"),
            amount: record.amount === null || record.amount === undefined ? "-" : String(record.amount),
            chequeRange: String(range.name ?? (from || to ? `${from} - ${to}` : "-")),
            cashBank: String(range.cashBank ?? ""),
          };
        }));
      } catch (error) {
        console.error("Failed to load cheques", error);
        if (active) setItems([]);
      } finally { if (active) setLoading(false); }
    };
    void loadCheques();
    return () => { active = false; };
  }, [cashBankFilter, searchQuery]);

  // Filter logic
  const filteredItems = items.filter((item) => !cashBankFilter || item.cashBank === cashBankFilter);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleItems = filteredItems.slice((safePage - 1) * entriesPerPage, safePage * entriesPerPage);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-3 text-xs flex flex-col justify-between">
      <div>
        {/* Navigation Breadcrumb */}
        <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mb-3">
          <Link
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
            Accounts Module <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal truncate">
            List of Cheque
          </span>
        </nav>

        {/* Cash/Bank Filter Dropdown */}
        <div className="mb-4 max-w-xs">
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Cash/Bank
          </label>
          <select
            value={cashBankFilter}
            onChange={(e) => { setCashBankFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="">Select value</option>
            {bankAccounts.map((account) => <option key={account.id} value={account.value}>{account.name}</option>)}
          </select>
        </div>

        {/* Export & Table Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-t border border-b-0 border-slate-200 dark:border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#00A3C4] hover:bg-cyan-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>

            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#E65100] hover:bg-orange-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" /> CSV
            </button>

            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 ml-2">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-0.5 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-0.5 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-[6%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    ID <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[20%] px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    INSTRUMENT NUMBER{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[16%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    CHEQUE STATUS{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[16%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    INSTRUMENT DATE{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[18%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    FAVOURING NAME{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    AMOUNT <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    CHEQUE RANGE{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredItems.length > 0 ? (
                visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                      {item.id}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300 font-medium">
                      {item.instrumentNumber}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[#00B5D8] font-medium cursor-pointer hover:underline">
                        {item.chequeStatus}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.instrumentDate}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.favouringName}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.amount}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300">
                      {item.chequeRange}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-slate-400 italic"
                  >
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-white dark:bg-slate-900 rounded-b border border-t-0 border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between text-slate-500 dark:text-slate-400 mb-4">
          <div>{loading ? "Loading cheques..." : `Showing ${filteredItems.length ? (safePage - 1) * entriesPerPage + 1 : 0} to ${Math.min(safePage * entriesPerPage, filteredItems.length)} of ${filteredItems.length} entries`}</div>

          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50">Previous</button>
            <span className="px-2 py-1 rounded bg-[#635BFF] text-white font-medium">{safePage} / {totalPages}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}
