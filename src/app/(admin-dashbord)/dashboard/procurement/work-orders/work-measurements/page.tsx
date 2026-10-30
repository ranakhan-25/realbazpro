"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  RotateCcw,
  Ruler,
  Briefcase,
  DollarSign,
  Info,
} from "lucide-react";
import {
  procurementWorkOrderMeasurementsApi,
  BackendWorkOrderMeasurement,
  WorkOrderMeasurementDropdownsResult,
  QueryWorkOrderMeasurementParams,
} from "@/lib/procurement/procurementWorkOrderMeasurementsApi";

// =============================================================================
// ERROR PARSER HELPER
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
        .map((e) =>
          e.message
            ? `${e.field ? `${e.field}: ` : ""}${e.message}`
            : JSON.stringify(e)
        )
        .join(", ");
    }

    const backendMsg =
      errorObj.response?.data?.message ||
      errorObj.response?.data?.error ||
      errorObj.message;

    if (typeof backendMsg === "string") return backendMsg;
    if (Array.isArray(backendMsg)) {
      return backendMsg
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
  }
  return defaultMsg;
}

const formatCurrency = (amount: number | string | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function WorkOrderMeasurementsPage() {
  // Tab State: "active" | "deleted"
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");

  // List & State Data
  const [measurements, setMeasurements] = useState<BackendWorkOrderMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Counts
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // Pagination & Search States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filter States
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [workOrderFilter, setWorkOrderFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [billedFilter, setBilledFilter] = useState<string>(""); // "" | "true" | "false"
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<WorkOrderMeasurementDropdownsResult>({
    projects: [],
    workOrders: [],
    statuses: [],
  });
  const [isDropdownLoading, setIsDropdownLoading] = useState<boolean>(false);

  // Detail Modal State
  const [viewMeasurement, setViewMeasurement] = useState<BackendWorkOrderMeasurement | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<BackendWorkOrderMeasurement | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  // Search Debounce (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Dropdowns
  const loadDropdowns = useCallback(async () => {
    setIsDropdownLoading(true);
    try {
      const data = await procurementWorkOrderMeasurementsApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.error("Failed to load measurement dropdowns:", err);
    } finally {
      setIsDropdownLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // Filtered work orders based on selected project
  const filteredWorkOrders = useMemo(() => {
    if (!projectFilter) return dropdowns.workOrders;
    return dropdowns.workOrders.filter((wo) => wo.project_id === projectFilter);
  }, [dropdowns.workOrders, projectFilter]);

  // Load Measurements
  const loadMeasurements = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params: QueryWorkOrderMeasurementParams = {
        page: currentPage,
        limit: entriesPerPage,
      };

      if (debouncedSearch.trim()) {
        params.measurement_no = debouncedSearch.trim();
      }
      if (projectFilter) {
        params.project_id = projectFilter;
      }
      if (workOrderFilter) {
        params.work_order_id = workOrderFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (billedFilter === "true") {
        params.is_billed = true;
      } else if (billedFilter === "false") {
        params.is_billed = false;
      }
      if (dateFromFilter) {
        params.date_from = dateFromFilter;
      }
      if (dateToFilter) {
        params.date_to = dateToFilter;
      }

      const res = await procurementWorkOrderMeasurementsApi.list(params);
      const allRows = res.data || [];

      // Separate Active vs Deleted strictly
      const activeRows = allRows.filter((r) => !r.deletedAt);
      const deletedRows = allRows.filter((r) => Boolean(r.deletedAt));

      if (recordsTab === "active") {
        setMeasurements(activeRows);
        setTotalRecords(res.meta.total || activeRows.length);
        setTotalPages(res.meta.totalPages || 1);
        setActiveCount(res.meta.total || activeRows.length);
        setDeletedCount(deletedRows.length);
      } else {
        setMeasurements(deletedRows);
        setTotalRecords(deletedRows.length);
        setTotalPages(Math.max(1, Math.ceil(deletedRows.length / entriesPerPage)));
        setDeletedCount(deletedRows.length);
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to load work order measurements");
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    debouncedSearch,
    projectFilter,
    workOrderFilter,
    statusFilter,
    billedFilter,
    dateFromFilter,
    dateToFilter,
    recordsTab,
    showToast,
  ]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  // Handle Tab Switch
  const handleSwitchTab = (tab: "active" | "deleted") => {
    if (tab === recordsTab) return;
    setRecordsTab(tab);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setProjectFilter("");
    setWorkOrderFilter("");
    setStatusFilter("");
    setBilledFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setCurrentPage(1);
  };

  // Open Detail Modal
  const handleOpenDetail = async (row: BackendWorkOrderMeasurement) => {
    setViewMeasurement(row);
    setDetailData(row);
    setIsDetailLoading(true);
    try {
      const full = await procurementWorkOrderMeasurementsApi.getById(row.uuid);
      setDetailData(full || row);
    } catch {
      // Fallback to row data already set
    } finally {
      setIsDetailLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      projectFilter ||
      workOrderFilter ||
      statusFilter ||
      billedFilter ||
      dateFromFilter ||
      dateToFilter
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-6 space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xs">
            <Ruler className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Work Order Measurements
            </h1>
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="hover:text-indigo-600 transition-colors">
                Procurement
              </span>
              <ChevronRight className="w-3 h-3" />
              <Link
                href="/dashboard/procurement/work-orders/work-orders-list"
                className="hover:text-indigo-600 transition-colors"
              >
                Work Orders
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 font-medium">Measurements</span>
            </nav>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => {
              loadMeasurements();
              loadDropdowns();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Segmented Pill Tabs (Active vs Deleted) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleSwitchTab("active")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              recordsTab === "active"
                ? "bg-white text-indigo-600 shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Active</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                recordsTab === "active"
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("deleted")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              recordsTab === "deleted"
                ? "bg-white text-rose-600 shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Deleted</span>
            {deletedCount > 0 && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  recordsTab === "deleted"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {deletedCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{measurements.length}</span>{" "}
          {recordsTab === "active" ? "active" : "deleted"} record
          {measurements.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by Measurement No */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search measurement no..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setWorkOrderFilter(""); // reset work order when project changes
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all cursor-pointer"
            >
              <option value="">All Projects</option>
              {dropdowns.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Work Order Filter */}
          <div>
            <select
              value={workOrderFilter}
              onChange={(e) => {
                setWorkOrderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all cursor-pointer"
            >
              <option value="">All Work Orders</option>
              {filteredWorkOrders.map((wo) => (
                <option key={wo.uuid} value={wo.uuid}>
                  {wo.work_order_no} — {wo.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all capitalize cursor-pointer"
            >
              <option value="">All Statuses</option>
              {dropdowns.statuses.map((st) => (
                <option key={st} value={st} className="capitalize">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row Filters: Billed status, Date From, Date To, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Billed Status Filter */}
          <div>
            <select
              value={billedFilter}
              onChange={(e) => {
                setBilledFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all cursor-pointer"
            >
              <option value="">All Billing Statuses</option>
              <option value="true">Billed Only</option>
              <option value="false">Unbilled Only</option>
            </select>
          </div>

          {/* Date From */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              From:
            </span>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-14 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all cursor-pointer"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              To:
            </span>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-700 transition-all cursor-pointer"
            />
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-center">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer w-full justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-700">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Failed to retrieve measurements</p>
              <p className="text-xs text-rose-600 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadMeasurements}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-semibold text-rose-800 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">Measurement No</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount (৳)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Billed</th>
                <th className="py-3 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                      <span className="text-xs text-slate-400 font-medium">
                        Loading work order measurements...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : measurements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Ruler className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">
                        {recordsTab === "deleted"
                          ? "No deleted measurements found"
                          : "No measurements recorded yet"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {recordsTab === "deleted"
                          ? "Deleted measurement entries will appear here."
                          : hasActiveFilters
                          ? "Try adjusting or clearing your filters to see results."
                          : "Measurements associated with work orders will be listed here."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                measurements.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  return (
                    <tr
                      key={row.uuid || row.id || idx}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Serial Number */}
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                        {sl}
                      </td>

                      {/* Measurement No */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{row.measurement_no}</span>
                        </div>
                      </td>

                      {/* Work Order */}
                      <td className="py-3 px-4">
                        {row.workOrder ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {row.workOrder.work_order_no}
                            </span>
                            {row.workOrder.title && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {row.workOrder.title}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        {row.project ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {row.project.name}
                            </span>
                            {row.project.code && (
                              <span className="text-[11px] text-slate-400">
                                {row.project.code}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                        ৳ {formatCurrency(row.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            row.status?.toLowerCase() === "approved" ||
                            row.status?.toLowerCase() === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.status?.toLowerCase() === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : row.status?.toLowerCase() === "rejected" ||
                                row.status?.toLowerCase() === "cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {row.status || "pending"}
                        </span>
                      </td>

                      {/* Billed */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            row.is_billed
                              ? "bg-emerald-100/70 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.is_billed ? "Billed" : "Unbilled"}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {recordsTab === "active" ? (
                            /* Active Tab: View Details button */
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(row)}
                              aria-label="View Details"
                              title="View details"
                              className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            /* STRICT MANDATORY DISPLAY RULE: In Deleted tab, show ONLY the static non-interactive text label 'Soft Delete'. NO buttons, NO trash icons, NO restore, and NO onClick handlers! */
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none whitespace-nowrap">
                              Soft Delete
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2">
              Page <span className="font-semibold text-slate-800">{currentPage}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages || 1}</span> ({totalRecords} total)
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewMeasurement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Work Order Measurement Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Measurement No: {viewMeasurement.measurement_no}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMeasurement(null);
                  setDetailData(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {isDetailLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-400">Fetching full details...</span>
                </div>
              ) : (
                <>
                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Measurement No
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {detailData?.measurement_no || viewMeasurement.measurement_no}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Measurement Date
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDate(detailData?.date || viewMeasurement.date)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Amount
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        ৳ {formatCurrency(detailData?.amount || viewMeasurement.amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize mt-0.5 ${
                          detailData?.status?.toLowerCase() === "approved" ||
                          detailData?.status?.toLowerCase() === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : detailData?.status?.toLowerCase() === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {detailData?.status || viewMeasurement.status || "pending"}
                      </span>
                    </div>
                  </div>

                  {/* Associated Entities */}
                  <div className="space-y-3">
                    {/* Work Order Info */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Work Order</span>
                      </div>
                      {detailData?.workOrder || viewMeasurement.workOrder ? (
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.workOrder || viewMeasurement.workOrder)?.work_order_no}
                          </p>
                          <p className="text-slate-600">
                            {(detailData?.workOrder || viewMeasurement.workOrder)?.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                            <span>
                              Type:{" "}
                              <strong className="text-slate-600 capitalize">
                                {(detailData?.workOrder || viewMeasurement.workOrder)?.type || "—"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Status:{" "}
                              <strong className="text-slate-600 capitalize">
                                {(detailData?.workOrder || viewMeasurement.workOrder)?.status || "—"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No linked work order.</p>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Project</span>
                      </div>
                      {detailData?.project || viewMeasurement.project ? (
                        <div className="space-y-0.5 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.project || viewMeasurement.project)?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Code: {(detailData?.project || viewMeasurement.project)?.code || "—"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No linked project.</p>
                      )}
                    </div>

                    {/* Billing Info */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Billing Status</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span>Invoice Status:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                            detailData?.is_billed ?? viewMeasurement.is_billed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {detailData?.is_billed ?? viewMeasurement.is_billed ? "Billed" : "Unbilled"}
                        </span>
                      </div>
                      {detailData?.workBill && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                          Work Bill Ref:{" "}
                          <strong className="text-slate-700">
                            {detailData.workBill.bill_no || detailData.workBill.uuid}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {(detailData?.notes || viewMeasurement.notes) && (
                      <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Notes / Remarks
                        </span>
                        <p className="text-xs text-slate-700 whitespace-pre-line">
                          {detailData?.notes || viewMeasurement.notes}
                        </p>
                      </div>
                    )}

                    {/* Metadata Timestamps */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                      <span>
                        Created: {formatDate(detailData?.createdAt || viewMeasurement.createdAt)}
                      </span>
                      <span>
                        Updated: {formatDate(detailData?.updatedAt || viewMeasurement.updatedAt)}
                      </span>
                      {(detailData?.deletedAt || viewMeasurement.deletedAt) && (
                        <span className="text-rose-500 font-semibold">
                          Deleted: {formatDate(detailData?.deletedAt || viewMeasurement.deletedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setViewMeasurement(null);
                  setDetailData(null);
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

