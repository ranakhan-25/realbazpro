"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSubscriptionPaymentHistory,
  getInvoiceUrl,
  type SubscriptionPaymentRecord,
} from "@/services/subscriptionPaymentService";

interface PaymentHistoryTableProps {
  /** If provided, only show payments for this org (org-admin view).
   *  If omitted, super-admin sees all and can filter by org. */
  organizationId?: number | string;
  /** Optional class name for outer wrapper */
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  VALID: {
    label: "Paid",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  PENDING: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PaymentHistoryTable({
  organizationId,
  className = "",
}: PaymentHistoryTableProps) {
  const [records, setRecords] = useState<SubscriptionPaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscriptionPaymentHistory({
        page,
        limit,
        organizationId,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      const list = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
      const count = typeof res?.total === "number" ? res.total : list.length;
      setRecords(list);
      setTotal(count);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [page, organizationId, search, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openInvoice = (tranId: string) => {
    const url = getInvoiceUrl(tranId, "html");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = (tranId: string) => {
    const url = getInvoiceUrl(tranId, "pdf");
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${tranId}.pdf`;
    a.click();
  };

  return (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Receipt className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Payment History
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              All subscription transactions with downloadable invoices
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by transaction ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
        >
          <option value="">All Statuses</option>
          <option value="VALID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading transactions…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <Receipt className="w-9 h-9 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">No payments found</p>
            <p className="text-xs">Try clearing your search or status filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Transaction ID</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Cycle</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr
                  key={rec.tranId}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs text-gray-700 font-semibold">
                      {rec.tranId}
                    </span>
                    {rec.bankTranId && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Bank: {rec.bankTranId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs font-semibold text-gray-900">
                      {rec.plan?.name ?? "—"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {rec.plan?.code}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-700 capitalize">
                      {rec.billingCycle.replace(/_/g, " ")}
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {rec.durationDays} days
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-gray-900">
                      {rec.currency} {Number(rec.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    {formatDate(rec.paymentCompletedAt ?? rec.paymentInitiatedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={rec.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      {/* View HTML invoice */}
                      <button
                        onClick={() => openInvoice(rec.tranId)}
                        title="View invoice"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View
                      </button>
                      {/* Download PDF invoice */}
                      <button
                        onClick={() => downloadPdf(rec.tranId)}
                        title="Download PDF"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/40">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
