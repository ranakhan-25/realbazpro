"use client";

import React, { useState } from "react";
import { Search, Filter, Send, Receipt, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { PaymentScheduleItem } from "@/types/collection";
import { toast } from "sonner";

interface Props {
  schedules: PaymentScheduleItem[];
  onGenerateReceipt: (schedule: PaymentScheduleItem) => void;
}

export function PaymentScheduleView({ schedules, onGenerateReceipt }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = schedules.filter((item) => {
    const matchesSearch =
      item.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReminder = (item: PaymentScheduleItem, mode: "sms" | "email") => {
    toast.success(`Reminder ${mode.toUpperCase()} sent to ${item.party_name} for installment #${item.installment_no}`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking code, customer name, installment label..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Upcoming / Pending</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Booking Code</th>
                <th className="px-4 py-3">Customer & Project</th>
                <th className="px-4 py-3 text-center">Inst #</th>
                <th className="px-4 py-3">Installment Label</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3 text-right">Paid (BDT)</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Overdue</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      {row.booking_code}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{row.party_name}</div>
                    <div className="text-[10px] text-slate-500">{row.project_name} • Unit {row.unit_name}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                    #{row.installment_no}
                  </td>
                  <td className="px-4 py-3.5 text-slate-800">{row.label}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">{row.due_date}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                    ৳{row.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-emerald-600 font-semibold">
                    ৳{row.paid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-rose-600 font-bold">
                    ৳{row.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {row.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> Paid
                      </span>
                    ) : row.status === "overdue" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                        <AlertCircle className="h-3 w-3" /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {row.days_overdue > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                        {row.days_overdue} days
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.balance > 0 && (
                        <button
                          onClick={() => onGenerateReceipt(row)}
                          title="Generate Receipt / Record Collection"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}
                      {row.status === "overdue" && (
                        <button
                          onClick={() => handleSendReminder(row, "sms")}
                          title="Send SMS / Email Reminder"
                          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
