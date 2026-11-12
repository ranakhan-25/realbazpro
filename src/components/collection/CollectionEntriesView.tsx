"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, Receipt, Eye, CheckCircle2 } from "lucide-react";
import { CollectionEntry, CollectionPaymentMode } from "@/types/collection";

interface Props {
  entries: CollectionEntry[];
  onOpenCreate: () => void;
  onViewReceipt: (entry: CollectionEntry) => void;
}

export function CollectionEntriesView({ entries, onOpenCreate, onViewReceipt }: Props) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

  const filtered = entries.filter((item) => {
    const matchesSearch =
      item.receipt_no.toLowerCase().includes(search.toLowerCase()) ||
      item.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name.toLowerCase().includes(search.toLowerCase()) ||
      item.collected_by.toLowerCase().includes(search.toLowerCase());
    const matchesMode = modeFilter === "all" || item.mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const getModeBadge = (mode: CollectionPaymentMode) => {
    switch (mode) {
      case "bank":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cheque":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "cash":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "card":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "mobile":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt no, customer party name, booking code..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Payment Modes</option>
            <option value="bank">Bank Deposit / Online</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">bKash / Mobile</option>
          </select>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Collection Entry</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Booking Code</th>
                <th className="px-4 py-3">Party Name</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3 text-center">Payment Mode</th>
                <th className="px-4 py-3">Txn Reference</th>
                <th className="px-4 py-3">Collected By</th>
                <th className="px-4 py-3">Collected Date</th>
                <th className="px-4 py-3 text-center">Journal Entry</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {row.receipt_no}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-700">{row.booking_code}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600 text-sm">
                    ৳{row.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border uppercase tracking-wider ${getModeBadge(row.mode)}`}>
                      {row.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                    {row.txn_ref || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{row.collected_by}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">{row.collected_at}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {row.journal_entry_no || "Auto-Posted"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onViewReceipt(row)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Print Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
