"use client";

import React, { useState } from "react";
import { Search, Filter, Phone, UserCheck, ShieldAlert } from "lucide-react";
import { CustomerDueItem } from "@/types/collection";

interface Props {
  dues: CustomerDueItem[];
  onAssignOfficer?: (due: CustomerDueItem) => void;
}

export function CustomerDueView({ dues, onAssignOfficer }: Props) {
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState("all");

  const filtered = dues.filter((item) => {
    const matchesSearch =
      item.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name.toLowerCase().includes(search.toLowerCase()) ||
      item.officer_name.toLowerCase().includes(search.toLowerCase());
    const matchesBucket = bucketFilter === "all" || item.aging_bucket === bucketFilter;
    return matchesSearch && matchesBucket;
  });

  const getBucketBadge = (bucket: string) => {
    switch (bucket) {
      case "0-30":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "31-60":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "61-90":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "90+":
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
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
            placeholder="Search booking code, customer party name, or recovery officer..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Aging Buckets</option>
            <option value="0-30">0-30 Days</option>
            <option value="31-60">31-60 Days</option>
            <option value="61-90">61-90 Days</option>
            <option value="90+">90+ Days (Critical Default)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Booking Code</th>
                <th className="px-4 py-3">Party Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Total Due Amount</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-center">Aging Days</th>
                <th className="px-4 py-3 text-center">Aging Bucket</th>
                <th className="px-4 py-3">Assigned Officer</th>
                <th className="px-4 py-3 text-center">Status</th>
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
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{row.party_name}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <a href={`tel:${row.phone}`} className="inline-flex items-center gap-1 hover:text-emerald-600">
                      <Phone className="h-3 w-3" />
                      <span>{row.phone}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-rose-600 text-sm">
                    ৳{row.due_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">{row.due_date}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                    {row.aging_days} days
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getBucketBadge(row.aging_bucket)}`}>
                      {row.aging_bucket} days
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>{row.officer_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {row.status === "legal_notice" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                        <ShieldAlert className="h-3 w-3" /> Legal Notice
                      </span>
                    ) : row.status === "critical" ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                        Critical
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        Active
                      </span>
                    )}
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
