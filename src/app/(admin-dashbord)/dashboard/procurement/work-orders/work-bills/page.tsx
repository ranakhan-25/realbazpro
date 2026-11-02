"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Search,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
  FileText,
  RotateCcw,
  Briefcase,
  UserCheck,
  DollarSign,
  Info,
  SlidersHorizontal,
  CheckSquare,
  Receipt,
  ArrowRight,
} from "lucide-react";
import {
  procurementWorkBillsApi,
  BackendWorkBill,
  WorkBillDropdownsResult,
  WorkBillDropdownMeasurement,
  ProcurementWorkBillStatus,
  QueryWorkBillParams,
} from "@/lib/procurement/procurementWorkBillsApi";

// =============================================================================
// HELPER FUNCTIONS
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

const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "partially_paid":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "rejected":
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

export default function WorkBillsPage() {
  // List State
  const [bills, setBills] = useState<BackendWorkBill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pagination & Search States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<WorkBillDropdownsResult>({
    eligibleMeasurements: [],
    projects: [],
    workOrders: [],
    vendors: [],
    statuses: ["pending", "approved", "rejected", "partially_paid", "paid", "cancelled"],
  });
  const [isDropdownLoading, setIsDropdownLoading] = useState<boolean>(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string>("");

  const [viewBill, setViewBill] = useState<BackendWorkBill | null>(null);
  const [detailData, setDetailData] = useState<BackendWorkBill | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  const [statusTarget, setStatusTarget] = useState<BackendWorkBill | null>(null);
  const [newStatus, setNewStatus] = useState<ProcurementWorkBillStatus>("pending");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Toast Notification
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
      const data = await procurementWorkBillsApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.error("Failed to load work bill dropdowns:", err);
    } finally {
      setIsDropdownLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // Load Work Bills List
  const loadBills = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params: QueryWorkBillParams = {
        page: currentPage,
        limit: entriesPerPage,
      };

      if (debouncedSearch.trim()) {
        params.bill_no = debouncedSearch.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await procurementWorkBillsApi.list(params);
      setBills(res.data || []);
      setTotalRecords(res.meta.total || 0);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err) {
      const msg = parseApiError(err, "Failed to load work bills");
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearch, statusFilter, showToast]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Selected Measurement Preview in Create Modal
  const selectedMeasurement: WorkBillDropdownMeasurement | undefined = useMemo(() => {
    return dropdowns.eligibleMeasurements.find(
      (m) => m.uuid === selectedMeasurementId
    );
  }, [dropdowns.eligibleMeasurements, selectedMeasurementId]);

  // Handle Create Work Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeasurementId) {
      showToast("Please select an approved measurement to bill", "error");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await procurementWorkBillsApi.create({
        measurement_id: selectedMeasurementId,
      });
      showToast("Work bill created successfully!", "success");
      setIsCreateOpen(false);
      setSelectedMeasurementId("");
      // Refresh list and dropdowns
      loadBills();
      loadDropdowns();
    } catch (err) {
      const msg = parseApiError(err, "Failed to create work bill");
      showToast(msg, "error");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (row: BackendWorkBill) => {
    setViewBill(row);
    setDetailData(row);
    setIsDetailLoading(true);
    try {
      const full = await procurementWorkBillsApi.getById(row.uuid);
      setDetailData(full || row);
    } catch {
      // Keep row fallback
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Open Status Update Modal
  const handleOpenStatusModal = (row: BackendWorkBill) => {
    setStatusTarget(row);
    setNewStatus(row.status || "pending");
  };

  // Submit Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await procurementWorkBillsApi.updateStatus(statusTarget.uuid, {
        status: newStatus,
      });
      showToast(`Work bill status updated to "${newStatus}"`, "success");
      setStatusTarget(null);

      // Update in current list
      setBills((prev) =>
        prev.map((b) => (b.uuid === updated.uuid ? { ...b, ...updated } : b))
      );

      // Also update detail view if open
      if (detailData && detailData.uuid === updated.uuid) {
        setDetailData(updated);
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to update work bill status");
      showToast(msg, "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch || statusFilter);

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
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Work Bills
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
              <span className="text-slate-600 font-medium">Work Bills</span>
            </nav>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => {
              loadBills();
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

          <button
            type="button"
            onClick={() => {
              setSelectedMeasurementId("");
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Bill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search by Bill No */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill No (e.g. WB-2026)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="min-w-[170px]">
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
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 whitespace-nowrap">
          Total Work Bills:{" "}
          <span className="font-semibold text-slate-700">{totalRecords}</span>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-700">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Failed to retrieve work bills</p>
              <p className="text-xs text-rose-600 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadBills}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-semibold text-rose-800 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Vendor / Contractor</th>
                <th className="py-3 px-4">Measurement Ref</th>
                <th className="py-3 px-4 text-right">Net Amount (৳)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                      <span className="text-xs text-slate-400 font-medium">
                        Loading work bills...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Receipt className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">
                        No work bills found
                      </p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? "Try adjusting or clearing your filters to see results."
                          : "Create a work bill by converting an approved measurement."}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMeasurementId("");
                            setIsCreateOpen(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Work Bill</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  return (
                    <tr
                      key={row.uuid || row.id || idx}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Serial */}
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                        {sl}
                      </td>

                      {/* Bill No */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{row.bill_no}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(row.createdAt)}
                        </span>
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

                      {/* Vendor / Contractor */}
                      <td className="py-3 px-4">
                        {row.vendor ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {row.vendor.businessName || row.vendor.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {row.vendor.code}
                              {row.vendor.name && row.vendor.businessName
                                ? ` • ${row.vendor.name}`
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Measurement Ref */}
                      <td className="py-3 px-4">
                        {row.measurement ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {row.measurement.measurement_no}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(row.measurement.date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Net Amount */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                        ৳ {formatCurrency(row.net_amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getStatusBadgeStyle(
                            row.status
                          )}`}
                        >
                          {(row.status || "pending").replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(row)}
                            aria-label="View Details"
                            title="View details"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Update Status */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(row)}
                            aria-label="Update Status"
                            title="Update status"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
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

      {/* =========================================================================
          MODAL 1: CREATE WORK BILL
         ========================================================================= */}
      {isCreateOpen && (
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
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Generate Work Bill
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create a new bill from an approved, unbilled measurement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingCreate) setIsCreateOpen(false);
                }}
                disabled={isSubmittingCreate}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateBill}>
              <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Measurement Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Approved Measurement <span className="text-rose-500">*</span>
                  </label>

                  {isDropdownLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading eligible measurements...</span>
                    </div>
                  ) : dropdowns.eligibleMeasurements.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-800 text-xs">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>No eligible measurements available</span>
                      </div>
                      <p>
                        A work bill requires an approved measurement that has not yet been billed. Currently, all recorded measurements are either unapproved or already billed.
                      </p>
                      <Link
                        href="/dashboard/procurement/work-orders/work-measurements"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline pt-1"
                      >
                        <span>Go to Work Order Measurements</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedMeasurementId}
                      onChange={(e) => setSelectedMeasurementId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="">-- Choose an Approved Measurement --</option>
                      {dropdowns.eligibleMeasurements.map((m) => (
                        <option key={m.uuid} value={m.uuid}>
                          {m.measurement_no} • {formatDate(m.date)} • ৳{formatCurrency(m.amount)}{" "}
                          {m.workOrder ? `(${m.workOrder.work_order_no})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Measurement Detail Card */}
                {selectedMeasurement && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Linked Record Details</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Measurement No</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMeasurement.measurement_no}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Measurement Date</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedMeasurement.date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Work Order</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMeasurement.workOrder?.work_order_no || "—"}
                        </span>
                        {selectedMeasurement.workOrder?.title && (
                          <span className="text-[11px] text-slate-500 block">
                            {selectedMeasurement.workOrder.title}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Project</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMeasurement.project?.name || "—"}
                        </span>
                        {selectedMeasurement.project?.code && (
                          <span className="text-[11px] text-slate-500 block">
                            Code: {selectedMeasurement.project.code}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Subcontractor / Vendor</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMeasurement.workOrder?.subcontractor?.businessName ||
                            selectedMeasurement.workOrder?.subcontractor?.name ||
                            "—"}
                        </span>
                        {selectedMeasurement.workOrder?.subcontractor?.code && (
                          <span className="text-[11px] text-slate-500 block">
                            Code: {selectedMeasurement.workOrder.subcontractor.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Total Bill Net Amount:
                      </span>
                      <span className="text-base font-bold text-emerald-600">
                        ৳ {formatCurrency(selectedMeasurement.amount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-white/70 p-2 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Upon creating the bill, the measurement will be marked as <strong>Billed</strong> and initial bill status will be set to <strong>Pending</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCreate || !selectedMeasurementId}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Bill...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      <span>Generate Work Bill</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VIEW WORK BILL DETAILS
         ========================================================================= */}
      {viewBill && (
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
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Work Bill Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bill No: {viewBill.bill_no}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewBill(null);
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
                  <span className="text-xs text-slate-400">Fetching bill details...</span>
                </div>
              ) : (
                <>
                  {/* Summary Card */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Bill No
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {detailData?.bill_no || viewBill.bill_no}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Bill Date
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDate(detailData?.createdAt || viewBill.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Net Amount
                      </span>
                      <span className="text-base font-bold text-emerald-600">
                        ৳ {formatCurrency(detailData?.net_amount || viewBill.net_amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Status
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${getStatusBadgeStyle(
                            detailData?.status || viewBill.status
                          )}`}
                        >
                          {(detailData?.status || viewBill.status || "pending").replace(/_/g, " ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenStatusModal(detailData || viewBill);
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Associated Entities */}
                  <div className="space-y-3">
                    {/* Measurement Information */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Billed Measurement</span>
                      </div>
                      {detailData?.measurement || viewBill.measurement ? (
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.measurement || viewBill.measurement)?.measurement_no}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>
                              Date: {formatDate((detailData?.measurement || viewBill.measurement)?.date)}
                            </span>
                            <span>•</span>
                            <span>
                              Amount: ৳
                              {formatCurrency((detailData?.measurement || viewBill.measurement)?.amount)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              Status: {(detailData?.measurement || viewBill.measurement)?.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Measurement reference unavailable.</p>
                      )}
                    </div>

                    {/* Work Order Information */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Work Order</span>
                      </div>
                      {detailData?.workOrder || viewBill.workOrder ? (
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.workOrder || viewBill.workOrder)?.work_order_no}
                          </p>
                          <p className="text-slate-600">
                            {(detailData?.workOrder || viewBill.workOrder)?.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                            <span className="capitalize">
                              Type: {(detailData?.workOrder || viewBill.workOrder)?.type || "—"}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              Status: {(detailData?.workOrder || viewBill.workOrder)?.status || "—"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No linked work order.</p>
                      )}
                    </div>

                    {/* Project Information */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Project</span>
                      </div>
                      {detailData?.project || viewBill.project ? (
                        <div className="space-y-0.5 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.project || viewBill.project)?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Code: {(detailData?.project || viewBill.project)?.code || "—"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No linked project.</p>
                      )}
                    </div>

                    {/* Vendor / Contractor Information */}
                    <div className="p-3.5 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Vendor / Contractor</span>
                      </div>
                      {detailData?.vendor || viewBill.vendor ? (
                        <div className="space-y-0.5 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800">
                            {(detailData?.vendor || viewBill.vendor)?.businessName ||
                              (detailData?.vendor || viewBill.vendor)?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Code: {(detailData?.vendor || viewBill.vendor)?.code || "—"}
                            {(detailData?.vendor || viewBill.vendor)?.mobileNo &&
                              ` • Mobile: ${(detailData?.vendor || viewBill.vendor)?.mobileNo}`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No linked contractor / vendor.</p>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                      <span>Created: {formatDate(detailData?.createdAt || viewBill.createdAt)}</span>
                      <span>Updated: {formatDate(detailData?.updatedAt || viewBill.updatedAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleOpenStatusModal(detailData || viewBill);
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Update Status
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewBill(null);
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

      {/* =========================================================================
          MODAL 3: UPDATE STATUS
         ========================================================================= */}
      {statusTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Update Work Bill Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bill No: {statusTarget.bill_no}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUpdatingStatus) setStatusTarget(null);
                }}
                disabled={isUpdatingStatus}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateStatus}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select New Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProcurementWorkBillStatus)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-slate-800 capitalize cursor-pointer"
                  >
                    {dropdowns.statuses.map((st) => (
                      <option key={st} value={st} className="capitalize">
                        {st.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Current Status:</span>
                    <span className="font-semibold text-slate-700 capitalize">
                      {(statusTarget.status || "pending").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span className="font-semibold text-emerald-600">
                      ৳ {formatCurrency(statusTarget.net_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Status</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

