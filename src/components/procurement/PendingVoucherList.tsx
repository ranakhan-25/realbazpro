"use client";

import Link from "next/link";
import { Eye, Search, FileCheck2, CheckCircle2, X } from "lucide-react";
import { DashboardPendingVouchersData } from "@/lib/procurement";

interface Props {
  vouchers: DashboardPendingVouchersData | null;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PendingVoucherList({
  vouchers,
  isLoading,
  search,
  onSearchChange,
}: Props) {
  const items = vouchers?.data || [];
  const totalCount = vouchers?.count ?? items.length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-cyan-100 p-2 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
            <FileCheck2 size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                Pending Purchase Bills
              </h3>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                {totalCount}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vouchers awaiting approval
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/procurement/purchase-bill/purchase-bill-invoice"
          className="text-xs font-semibold text-blue-600 transition hover:underline dark:text-blue-400"
        >
          View All
        </Link>
      </div>

      {/* Quick Search */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search voucher, project, supplier..."
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-8 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-100 p-3 dark:border-slate-800"
            >
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {search ? "No matching bills found" : "No Pending Bills"}
          </h4>
          <p className="mt-1 max-w-[220px] text-[11px] text-slate-500 dark:text-slate-400">
            {search
              ? "Try adjusting your search criteria."
              : "All purchase bills and vouchers have been reviewed."}
          </p>
        </div>
      ) : (
        /* Voucher List */
        <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
          {items.map((voucher) => (
            <div
              key={voucher.uuid}
              className="rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-800"
            >
              {/* Reference & Amount Header */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {voucher.reference}
                </span>

                <span className="tabular-nums text-xs font-bold text-slate-900 dark:text-slate-100">
                  ৳ {voucher.amount.toLocaleString()}
                </span>
              </div>

              {/* Voucher Content */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1 text-xs">
                  {voucher.project && (
                    <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                      Project:{" "}
                      <span className="font-normal text-slate-600 dark:text-slate-400">
                        {voucher.project.name}
                      </span>
                    </p>
                  )}

                  {voucher.supplier && (
                    <p className="truncate text-slate-600 dark:text-slate-400">
                      Supplier:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {voucher.supplier.name}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{formatDate(voucher.date)}</span>
                    {voucher.addedBy && (
                      <span>By: {voucher.addedBy.name}</span>
                    )}
                  </div>
                </div>

                {/* View Bill Invoice Link */}
                <Link
                  href={`/dashboard/procurement/purchase-bill/purchase-bill-invoice?search=${encodeURIComponent(
                    voucher.reference
                  )}`}
                  title="View Purchase Bill"
                  className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                >
                  <Eye size={16} />
                </Link>
              </div>

              {/* Status Badge */}
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/80">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  Approval: {voucher.approvalLayer || "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}