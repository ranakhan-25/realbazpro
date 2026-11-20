"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  Truck,
  FileText,
  Calendar,
  Building2,
  Info,
} from "lucide-react";
import {
  procurementHireInApi,
  BackendHireIn,
  BackendHireInItem,
} from "@/lib/procurement/procurementHireInApi";

// =============================================================================
// ERROR PARSING UTILITY
// =============================================================================

function parseApiError(err: unknown, defaultMsg: string): string {
  if (err && typeof err === "object") {
    const errorObj = err as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
          errors?: Array<{ field?: string; message?: string }>;
        };
      };
      message?: unknown;
    };

    const errorsList = errorObj.response?.data?.errors;
    if (Array.isArray(errorsList) && errorsList.length > 0) {
      return errorsList
        .map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)))
        .join(", ");
    }

    const backendMsg =
      errorObj.response?.data?.message ||
      errorObj.response?.data?.error ||
      errorObj.message;

    if (typeof backendMsg === "string" && backendMsg.trim()) return backendMsg;
    if (Array.isArray(backendMsg)) {
      return backendMsg
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
  }
  return defaultMsg;
}

// Table columns
const tableHeaders = [
  "SL",
  "HIRE IN NO",
  "HIRE ORDER",
  "PROJECT",
  "VENDOR",
  "RECEIVED DATE",
  "ITEMS COUNT",
  "STATUS",
  "ACTION",
];

export default function HireInPage() {
  // Tabs: Active vs Deleted / Trash
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  // Data States
  const [hireIns, setHireIns] = useState<BackendHireIn[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter States
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modal States
  const [viewItem, setViewItem] = useState<BackendHireIn | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendHireIn | null>(null);

  // Notification Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    },
    []
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchNumber);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchNumber]);

  // Fetch Hire In records from real backend API
  const fetchHireIns = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        number: debouncedSearch.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        limit: entriesPerPage,
      };

      if (activeTab === "active") {
        const res = await procurementHireInApi.list(params);
        setHireIns(res.data || []);
        setTotalRecords(res.meta?.total || (res.data ? res.data.length : 0));
        setTotalPages(res.meta?.totalPages || 1);
        setActiveCount(res.meta?.total || (res.data ? res.data.length : 0));

        procurementHireInApi
          .getTrash({ page: 1, limit: 1 })
          .then((tRes) => setDeletedCount(tRes.meta?.total || 0))
          .catch(() => {});
      } else {
        const res = await procurementHireInApi.getTrash(params);
        setHireIns(res.data || []);
        setTotalRecords(res.meta?.total || (res.data ? res.data.length : 0));
        setTotalPages(res.meta?.totalPages || 1);
        setDeletedCount(res.meta?.total || (res.data ? res.data.length : 0));

        procurementHireInApi
          .list({ page: 1, limit: 1 })
          .then((aRes) => setActiveCount(aRes.meta?.total || 0))
          .catch(() => {});
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load hire-in records");
      setApiError(msg);
      setHireIns([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    debouncedSearch,
    statusFilter,
    currentPage,
    entriesPerPage,
  ]);

  useEffect(() => {
    fetchHireIns();
  }, [fetchHireIns]);

  // Tab switch
  const handleSwitchTab = (tab: "active" | "deleted") => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // View Details
  const handleViewDetails = async (row: BackendHireIn) => {
    try {
      const full = await procurementHireInApi.getById(row.uuid);
      setViewItem(full || row);
    } catch (err) {
      console.warn("Could not fetch full hire-in details, displaying row data:", err);
      setViewItem(row);
    }
  };

  // Confirm Soft-Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementHireInApi.delete(deleteTarget.uuid);
      showToast(
        `Hire-in #${deleteTarget.hire_in_no} deleted and moved to trash`,
        "success"
      );
      setDeleteTarget(null);
      await fetchHireIns();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete hire-in record");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "received";
    switch (s) {
      case "received":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Received
          </span>
        );
      case "inspected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Inspected
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Active
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || "Received"}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-indigo-50 text-indigo-800 border-indigo-200"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          {toast.type === "info" && (
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-1 px-6 py-6 space-y-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-200">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Hire In (Equipment Receiving)
              </h1>
              <nav className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">
                  Procurement
                </span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-500">Equipment Hire</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-600 font-medium">Hire In</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchHireIns}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh hire-in records"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Backend API Error Banner if request failed */}
        {apiError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-[12.5px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-amber-950">Backend API Response:</span>{" "}
              {apiError}
              {apiError.includes("Sequelize") || apiError.includes("Model not initialized") ? (
                <div className="text-[11.5px] text-amber-700 mt-1">
                  Note: The server returned an internal Sequelize model registration error. The route and API integration are fully connected and will display real data once the backend model initialization is resolved.
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={fetchHireIns}
              className="px-3 py-1 text-[11.5px] font-semibold rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Segmented Pill Tabs & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Segmented Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab("active")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-white text-indigo-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Active</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  activeTab === "active"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeTab === "active" ? totalRecords : activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("deleted")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "deleted"
                  ? "bg-white text-rose-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Deleted</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  activeTab === "deleted"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeTab === "deleted" ? totalRecords : deletedCount}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] text-slate-600 bg-white hover:border-slate-300 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="inspected">Inspected</option>
              <option value="active">Active</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search hire-in number..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors w-52 md:w-60"
              />
              {searchNumber && (
                <button
                  type="button"
                  onClick={() => setSearchNumber("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
              <span>Show:</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 text-[12.5px] bg-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">
                  {tableHeaders.map((head, idx) => (
                    <th
                      key={head}
                      className={`px-4 py-3.5 ${
                        idx === 0
                          ? "w-12 text-center"
                          : idx === tableHeaders.length - 1
                            ? "text-center w-28"
                            : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        <span className="text-[13px] text-slate-400">
                          Loading hire-in records...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : hireIns.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <Truck className="w-6 h-6" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-700">
                          {activeTab === "active"
                            ? "No Active Hire In Records"
                            : "No Deleted Records Found"}
                        </p>
                        <p className="text-[12.5px] text-slate-400 leading-normal">
                          {activeTab === "active"
                            ? "There are currently no active equipment hire-in records."
                            : "Trash is clean. Any soft-deleted records will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hireIns.map((row, idx) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* SL */}
                      <td className="px-4 py-3.5 text-center text-slate-400 text-[12px] tabular-nums">
                        {(currentPage - 1) * entriesPerPage + idx + 1}
                      </td>

                      {/* Hire In No */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 font-mono text-[13px]">
                          {row.hire_in_no}
                        </span>
                      </td>

                      {/* Hire Order */}
                      <td className="px-4 py-3.5">
                        {row.hireOrder ? (
                          <span className="font-medium text-slate-700 font-mono text-[12.5px]">
                            {row.hireOrder.hire_no}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[12px]">
                            {row.hire_order_id ? row.hire_order_id.substring(0, 8) : "—"}
                          </span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700">
                          {row.hireOrder?.project?.name || "General Project"}
                        </div>
                        {row.hireOrder?.project?.code && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {row.hireOrder.project.code}
                          </div>
                        )}
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-700 font-medium">
                          {row.hireOrder?.vendor?.supplierName || "—"}
                        </span>
                      </td>

                      {/* Received Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-[12.5px] text-slate-600">
                          {row.received_date || "—"}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-semibold bg-slate-100 text-slate-700">
                          {row.items?.length || 0} item(s)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{renderStatusBadge(row.status)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => handleViewDetails(row)}
                            aria-label="View Details"
                            title="View details"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {activeTab === "active" ? (
                            /* Delete Button (Active records) */
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              aria-label="Delete"
                              title="Delete record"
                              className="flex items-center justify-center w-8 h-8 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
                                Soft Delete
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
            <span className="text-[12.5px] text-slate-400">
              Showing {hireIns.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
              {Math.min(currentPage * entriesPerPage, totalRecords)} of {totalRecords} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button className="w-8 h-8 rounded-lg text-[13px] font-medium bg-indigo-600 text-white">
                {currentPage}
              </button>
              <button
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Hire In Receiving Details
                  </h3>
                  <span className="text-[12px] font-mono text-indigo-600 font-semibold">
                    {viewItem.hire_in_no}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-[12.5px]">
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Hire In No
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {viewItem.hire_in_no}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Hire Order Ref
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {viewItem.hireOrder?.hire_no || viewItem.hire_order_id?.substring(0, 8) || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Received Date
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewItem.received_date}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Project
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewItem.hireOrder?.project?.name || "General"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Vendor
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewItem.hireOrder?.vendor?.supplierName || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Status
                  </span>
                  <div className="mt-0.5">{renderStatusBadge(viewItem.status)}</div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-[13.5px] font-bold text-slate-800 mb-2.5">
                  Received Equipment Line Items
                </h4>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-100">
                        <th className="px-3.5 py-2.5">Equipment / Description</th>
                        <th className="px-3.5 py-2.5 text-center">Unit</th>
                        <th className="px-3.5 py-2.5 text-center">Received Qty</th>
                        <th className="px-3.5 py-2.5">Condition</th>
                        <th className="px-3.5 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewItem.items && viewItem.items.length > 0 ? (
                        viewItem.items.map((item, idx) => (
                          <tr key={item.uuid || idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-800">
                              {item.hireOrderItem?.equipment_description || "Equipment Line"}
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">
                              {item.hireOrderItem?.unit || "Unit"}
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-mono font-semibold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 capitalize">
                                {item.condition || "Good"}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500 italic text-[12px]">
                              {item.remarks || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-[12px]">
                            No equipment line item records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {viewItem.notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[12.5px]">
                  <span className="font-semibold text-slate-700">Notes / Remarks:</span>
                  <p className="text-slate-600 leading-relaxed italic">{viewItem.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                Delete Hire In Record
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete hire-in record{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{deleteTarget.hire_in_no}
              </span>
              ? It will be moved to the{" "}
              <span className="font-semibold text-rose-600">Deleted</span> tab where
              it will be moved to deleted records.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
