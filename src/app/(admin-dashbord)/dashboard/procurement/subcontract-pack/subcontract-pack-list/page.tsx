"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  SquarePen,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  ChevronRight,
  PackageCheck,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import {
  procurementSubcontractPackageApi,
  BackendSubcontractPackage,
} from "@/lib/procurement";

// Table Header Configuration
interface TableHeaderConfig {
  key: "sl" | "name" | "unit" | "status" | "action";
  label: string;
  sortable: boolean;
}

const TABLE_HEADERS: TableHeaderConfig[] = [
  { key: "sl", label: "SL", sortable: false },
  { key: "name", label: "TYPE", sortable: true },
  { key: "unit", label: "UNIT", sortable: true },
  { key: "status", label: "STATUS", sortable: false },
  { key: "action", label: "ACTIONS", sortable: false },
];

export default function SubcontractPackListPage() {
  // Active vs Deleted Tab State
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");

  // Tab Badge Counts
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // Table Data State
  const [packages, setPackages] = useState<BackendSubcontractPackage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  // Dropdown options fetched from GET /procurement/subcontract-packages/dropdowns
  const [dropdownOptions, setDropdownOptions] = useState<
    Array<{ uuid: string; name: string; unit: string }>
  >([]);

  // Sorting
  const [sortField, setSortField] = useState<"name" | "unit" | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Server Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [viewTarget, setViewTarget] = useState<BackendSubcontractPackage | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<BackendSubcontractPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendSubcontractPackage | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackendSubcontractPackage | null>(null);

  // Form State matching screenshot 2
  const [formName, setFormName] = useState<string>("");
  const [formUnit, setFormUnit] = useState<string>("Lot");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Request race condition guard
  const latestRequestIdRef = useRef<number>(0);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    },
    []
  );

  // 1. Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 2. Fetch dropdown options via GET /dropdowns on mount
  const fetchDropdowns = useCallback(async () => {
    try {
      const items = await procurementSubcontractPackageApi.getDropdowns();
      setDropdownOptions(items);
    } catch (err) {
      console.warn("Failed to load subcontract package dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 3. Fetch tab badge counts (Active count and Deleted count)
  const refreshBadgeCounts = useCallback(async () => {
    try {
      const activeRes = await procurementSubcontractPackageApi.getSubcontractPackages({
        limit: 1,
      });
      setActiveCount(activeRes.meta.total);

      const deletedRes = await procurementSubcontractPackageApi.getSubcontractPackages({
        limit: 1,
        deleted_only: true,
      });
      setDeletedCount(deletedRes.meta.total);
    } catch (err) {
      console.warn("Failed to refresh badge counts:", err);
    }
  }, []);

  // 4. Fetch main table data based on recordsTab, search, status, and pagination
  const fetchPackages = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await procurementSubcontractPackageApi.getSubcontractPackages({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: pageSize,
        deleted_only: recordsTab === "deleted" ? true : undefined,
      });

      // Prevent stale asynchronous responses from overwriting newer results
      if (requestId !== latestRequestIdRef.current) return;

      setPackages(res.data);
      setTotalCount(res.meta.total);

      // Update badge count for current tab
      if (recordsTab === "active" && !debouncedSearch && !statusFilter) {
        setActiveCount(res.meta.total);
      } else if (recordsTab === "deleted" && !debouncedSearch && !statusFilter) {
        setDeletedCount(res.meta.total);
      }
    } catch (err: unknown) {
      if (requestId !== latestRequestIdRef.current) return;
      console.error("Failed to load subcontract packages:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Failed to load subcontract packages");
      setFetchError(errMsg);
      setPackages([]);
      setTotalCount(0);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, statusFilter, currentPage, pageSize, recordsTab]);

  useEffect(() => {
    fetchPackages();
    refreshBadgeCounts();
  }, [fetchPackages, refreshBadgeCounts]);

  // Handle Tab Switch
  const handleSwitchTab = (tab: "active" | "deleted") => {
    if (tab === recordsTab) return;
    setRecordsTab(tab);
    setCurrentPage(1);
    setSortField(null);
    setSortOrder("ASC");
  };

  // Sort handler (client-side sort of current page or field toggle)
  const handleSort = (field: "name" | "unit") => {
    if (sortField === field) {
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      } else {
        setSortField(null);
        setSortOrder("ASC");
      }
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  // Sorted items for current page
  const displayedItems = React.useMemo(() => {
    if (!sortField) return packages;
    const sorted = [...packages];
    sorted.sort((a, b) => {
      const valA = (a[sortField] || "").toLowerCase();
      const valB = (b[sortField] || "").toLowerCase();
      if (sortOrder === "ASC") {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });
    return sorted;
  }, [packages, sortField, sortOrder]);

  // Handle View Details (Calls GET /{uuid} to fetch fresh entity details)
  const handleOpenViewModal = async (item: BackendSubcontractPackage) => {
    setViewTarget(item);
    setIsLoadingDetails(true);
    try {
      const freshData = await procurementSubcontractPackageApi.getSubcontractPackage(
        item.uuid
      );
      setViewTarget(freshData);
    } catch (err) {
      console.warn("Could not load fresh details for uuid:", item.uuid, err);
      setViewTarget(item);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle Create Modal Open
  const handleOpenCreate = () => {
    setFormName("");
    setFormUnit("Lot");
    setFormStatus("active");
    setFormError(null);
    setShowCreateModal(true);
  };

  // Handle Edit Modal Open
  const handleOpenEdit = async (item: BackendSubcontractPackage) => {
    setEditTarget(item);
    setFormName(item.name);
    setFormUnit(item.unit);
    setFormStatus(item.status);
    setFormError(null);
    try {
      const fresh = await procurementSubcontractPackageApi.getSubcontractPackage(item.uuid);
      if (fresh) {
        setEditTarget(fresh);
        setFormName(fresh.name);
        setFormUnit(fresh.unit);
        setFormStatus(fresh.status);
      }
    } catch (err) {
      console.warn("Could not fetch fresh details for edit:", err);
    }
  };

  // Handle Create Submit (POST /)
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Package name is required");
      return;
    }
    if (!formUnit.trim()) {
      setFormError("Unit is required (e.g. Lot, SFT, RFT)");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await procurementSubcontractPackageApi.createSubcontractPackage({
        name: formName.trim(),
        unit: formUnit.trim(),
        status: formStatus,
      });

      setShowCreateModal(false);
      showToast(`Package "${created.name}" created successfully`, "success");
      fetchPackages();
      refreshBadgeCounts();
      fetchDropdowns();
    } catch (err: unknown) {
      console.error("Create subcontract package failed:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Failed to create subcontract package");
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit (PATCH /{uuid})
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!formName.trim()) {
      setFormError("Package name is required");
      return;
    }
    if (!formUnit.trim()) {
      setFormError("Unit is required (e.g. Lot, SFT, RFT)");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updated = await procurementSubcontractPackageApi.updateSubcontractPackage(
        editTarget.uuid,
        {
          name: formName.trim(),
          unit: formUnit.trim(),
          status: formStatus,
        }
      );

      setEditTarget(null);
      showToast(`Package "${updated.name}" updated successfully`, "success");
      fetchPackages();
      refreshBadgeCounts();
      fetchDropdowns();
    } catch (err: unknown) {
      console.error("Update subcontract package failed:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Failed to update subcontract package");
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete (DELETE /{uuid})
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await procurementSubcontractPackageApi.deleteSubcontractPackage(deleteTarget.uuid);
      setDeleteTarget(null);
      showToast(`Package "${deleteTarget.name}" deleted successfully`, "success");
      fetchPackages();
      refreshBadgeCounts();
      fetchDropdowns();
    } catch (err: unknown) {
      console.error("Delete subcontract package failed:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Failed to delete subcontract package");
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Restore (PATCH /{uuid}/restore)
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsSubmitting(true);
    try {
      await procurementSubcontractPackageApi.restoreSubcontractPackage(
        restoreTarget.uuid
      );
      setRestoreTarget(null);
      showToast(`Package "${restoreTarget.name}" restored successfully`, "success");
      fetchPackages();
      refreshBadgeCounts();
      fetchDropdowns();
    } catch (err: unknown) {
      console.error("Restore subcontract package failed:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Failed to restore subcontract package");
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper date formatter
  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 font-sans text-[#374151] dark:text-slate-200 transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor:
              toast.type === "success"
                ? "#ECFDF3"
                : toast.type === "error"
                ? "#FEF3F2"
                : "#EFF8FF",
            borderColor:
              toast.type === "success"
                ? "#A6F4C5"
                : toast.type === "error"
                ? "#FECDCA"
                : "#B2DDFF",
            color:
              toast.type === "success"
                ? "#027A48"
                : toast.type === "error"
                ? "#B42318"
                : "#175CD3",
          }}
        >
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-[#F04438]" />}
          {toast.type === "info" && <AlertCircle className="w-4 h-4 text-[#2E90FA]" />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 cursor-pointer text-inherit"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PAGE SHELL: Padding 24px desktop / 16px mobile, pb-28 for floating widget clear */}
      <main className="w-full max-w-7xl mx-auto p-4 lg:p-6 pb-28 space-y-6">
        {/* =========================================================================
            HEADER ROW: Title + Description on left, Breadcrumb + Tabs on right
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[#111827] dark:text-white tracking-[-0.01em]">
              Subcontract Packages
            </h1>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-0.5">
              Manage trade packages, measurement units, and subcontractor work scopes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quiet Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400"
            >
              <Link
                href="/dashboard"
                className="hover:text-[#111827] dark:hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
              <Link
                href="/dashboard/procurement"
                className="hover:text-[#111827] dark:hover:text-slate-200 transition-colors"
              >
                Procurement
              </Link>
              <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
              <span className="font-medium text-[#2E1A87] dark:text-violet-300">
                Subcontract Packages
              </span>
            </nav>

            {/* Compact Segmented Control (32px) */}
            <div className="inline-flex items-center bg-[#F1F2F4] dark:bg-slate-800 p-0.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 h-8">
              <button
                type="button"
                onClick={() => handleSwitchTab("active")}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-all duration-140 flex items-center gap-1.5 cursor-pointer ${
                  recordsTab === "active"
                    ? "bg-white dark:bg-slate-900 text-[#111827] dark:text-white shadow-xs font-semibold"
                    : "text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
                }`}
              >
                <span>Active</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans tabular-nums ${
                    recordsTab === "active"
                      ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                      : "bg-[#E5E7EB] dark:bg-slate-700 text-[#6B7280] dark:text-slate-300"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab("deleted")}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-all duration-140 flex items-center gap-1.5 cursor-pointer ${
                  recordsTab === "deleted"
                    ? "bg-white dark:bg-slate-900 text-[#B42318] dark:text-rose-400 shadow-xs font-semibold"
                    : "text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
                }`}
              >
                <span>Deleted</span>
                {deletedCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-sans tabular-nums bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    {deletedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTER CARD (Responsive CSS Grid, 36px uniform controls)
            ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* 1. + Add New Button (Primary Purple #6D4AFF) */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                className="w-full h-9 px-4 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 active:translate-y-[0.5px] flex items-center justify-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Add New Package</span>
              </button>
            </div>

            {/* 2. Quick Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Quick Search..."
                className="w-full h-9 pl-8 pr-7 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-colors duration-140"
              />
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3. Status Filter */}
            <div className="relative w-full">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "active" | "inactive");
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] appearance-none transition-colors duration-140 cursor-pointer"
              >
                <option value="">-- All Statuses --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
            </div>

            {/* 4. Reset & Refresh Button */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("");
                  setSortField(null);
                  setSortOrder("ASC");
                  setCurrentPage(1);
                }}
                title="Reset filters"
                className="flex-1 h-9 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-[#4B5563] dark:text-slate-300 hover:text-[#111827] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-slate-700/60 transition-colors duration-140 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>Reset Filters</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchPackages();
                  refreshBadgeCounts();
                  fetchDropdowns();
                }}
                disabled={isLoading}
                title="Refresh Table"
                className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-[#4B5563] dark:text-slate-300 hover:text-[#111827] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-slate-700/60 transition-colors duration-140 cursor-pointer disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 stroke-[1.75] ${isLoading ? "animate-spin text-violet-600" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TABLE CARD (Solid Lavender Header, Unclipped Colored Actions)
            ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden transition-colors">
          {/* Top Bar: "Show [10] entries" */}
          <div className="h-14 px-4 border-b border-[#F1F2F4] dark:border-slate-800 flex items-center justify-between text-xs text-[#6B7280] dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1 cursor-pointer"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-slate-400">
              <span className="font-sans tabular-nums">
                Showing {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} Subcontract{" "}
                {recordsTab === "deleted" ? "Deleted Packages" : "Packages"}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="p-3.5 bg-[#FEF3F2] dark:bg-rose-950/40 border-b border-[#FECDCA] dark:border-rose-900 text-[#B42318] dark:text-rose-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchPackages()}
                className="px-3 py-1 rounded-lg bg-[#D92D20] text-white hover:bg-[#B42318] text-xs font-medium cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container: Internal horizontal scroll, no page overflow */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#E9E5FF] dark:bg-slate-800 border-b-2 border-[#C9BFFF] dark:border-slate-700 select-none h-[46px]">
                  {TABLE_HEADERS.map((h) => {
                    const isSorted = sortField === h.key;
                    const isAction = h.key === "action";
                    return (
                      <th
                        key={h.key}
                        onClick={() => h.sortable && handleSort(h.key as "name" | "unit")}
                        onKeyDown={(e) => {
                          if (h.sortable && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            handleSort(h.key as "name" | "unit");
                          }
                        }}
                        tabIndex={h.sortable ? 0 : undefined}
                        aria-sort={
                          h.sortable
                            ? isSorted
                              ? sortOrder === "ASC"
                                ? "ascending"
                                : "descending"
                              : "none"
                            : undefined
                        }
                        className={`h-[46px] py-2.5 px-4 ${
                          h.sortable
                            ? `cursor-pointer group/th transition-colors duration-140 ${
                                isSorted
                                  ? "bg-[#D2C9FF] dark:bg-violet-950/70 text-[#3B1FA8] dark:text-violet-200 border-b-[3px] border-b-[#6D4AFF]"
                                  : "hover:bg-[#DFD9FF] dark:hover:bg-slate-700/60 text-[#2E1A87] dark:text-slate-200"
                              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset`
                            : "cursor-default text-[#2E1A87] dark:text-slate-200"
                        } ${isAction ? "text-right min-w-[144px] pr-4" : "text-left"}`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            isAction ? "justify-end w-full" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[11.5px] uppercase tracking-[0.06em] font-bold whitespace-nowrap transition-colors duration-140 ${
                              isSorted
                                ? "text-[#3B1FA8] dark:text-violet-200"
                                : "text-[#2E1A87] dark:text-slate-200 group-hover/th:text-[#111827] dark:group-hover/th:text-white"
                            }`}
                          >
                            {h.label}
                          </span>
                          {h.sortable && (
                            <span
                              className={`transition-colors duration-140 inline-flex items-center justify-center ${
                                isSorted
                                  ? "text-[#6D4AFF] dark:text-violet-400"
                                  : "text-[#7C6BD6] dark:text-slate-400 group-hover/th:text-[#2E1A87] dark:group-hover/th:text-slate-200"
                              }`}
                            >
                              {isSorted ? (
                                sortOrder === "ASC" ? (
                                  <ArrowUp className="w-3.5 h-3.5 stroke-[2]" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 stroke-[2]" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 stroke-[1.75]" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800">
                {isLoading ? (
                  // Skeleton Loading Rows
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="h-14 animate-pulse">
                      <td className="px-4 py-2.5">
                        <div className="h-4 w-6 bg-[#E5E7EB] dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="h-4 w-32 bg-[#E5E7EB] dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="h-4 w-20 bg-[#E5E7EB] dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="h-5 w-16 bg-[#E5E7EB] dark:bg-slate-700 rounded-full" />
                      </td>
                      <td className="px-4 py-2.5 text-right pr-4">
                        <div className="inline-flex gap-2">
                          <div className="h-8 w-8 bg-[#E5E7EB] dark:bg-slate-700 rounded-lg" />
                          <div className="h-8 w-8 bg-[#E5E7EB] dark:bg-slate-700 rounded-lg" />
                          <div className="h-8 w-8 bg-[#E5E7EB] dark:bg-slate-700 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : displayedItems.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#F4F1FF] dark:bg-slate-800 flex items-center justify-center text-[#6D4AFF] dark:text-violet-400">
                          <PackageCheck className="w-6 h-6 stroke-[1.75]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[#111827] dark:text-slate-200">
                            {recordsTab === "deleted"
                              ? "No deleted subcontract packages found"
                              : "No subcontract packages found"}
                          </p>
                          <p className="text-xs text-[#6B7280] dark:text-slate-400 max-w-sm mx-auto">
                            {recordsTab === "deleted"
                              ? "Archived packages will appear here and can be restored anytime."
                              : searchInput || statusFilter
                              ? "Try adjusting your search query or reset the filters."
                              : "Click '+ Add New Package' to register your first subcontract trade package."}
                          </p>
                          {recordsTab === "active" && !searchInput && !statusFilter && (
                            <button
                              type="button"
                              onClick={handleOpenCreate}
                              style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                              className="mt-2.5 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-all cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>+ Add New Package</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item, index) => (
                    <tr
                      key={item.uuid}
                      className="h-14 hover:bg-[#FAFAFF] dark:hover:bg-slate-800/40 transition-colors duration-140 group align-middle"
                    >
                      {/* SL (Serial Number) */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle text-xs font-normal text-[#374151] dark:text-slate-300 font-sans tabular-nums w-16">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Type (Package Name) */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[220px]">
                        <span className="text-[13.5px] font-medium text-[#111827] dark:text-slate-100 group-hover:text-[#6D4AFF] transition-colors duration-140">
                          {item.name}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle text-[13px] font-normal text-[#374151] dark:text-slate-300 font-sans tabular-nums min-w-[150px]">
                        {item.unit}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[120px]">
                        <span
                          className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium border ${
                            item.status === "active"
                              ? "bg-[#ECFDF3] dark:bg-emerald-950/40 text-[#027A48] dark:text-emerald-300 border-[#A6F4C5] dark:border-emerald-800/40"
                              : "bg-[#F2F4F7] dark:bg-slate-800/60 text-[#344054] dark:text-slate-400 border-[#E4E7EC] dark:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === "active" ? "bg-[#12B76A]" : "bg-[#98A2B3]"
                            }`}
                          />
                          <span>{item.status === "active" ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Actions Column (Unclipped, min-w-[144px], padding-right 16px) */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap align-middle min-w-[144px] pr-4">
                        <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                          {/* 1. View Details (Blue tint at rest: bg #EFF6FF, border #BFDBFE, icon #2563EB) */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(item)}
                            title="View Details"
                            aria-label="View Details"
                            className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#BFDBFE] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                          >
                            <Eye className="w-4 h-4 stroke-[1.75]" />
                          </button>

                          {recordsTab === "deleted" ? (
                            /* Restore Button (Green tint at rest: bg #ECFDF3, border #A6F4C5, icon #039855) */
                            <button
                              type="button"
                              onClick={() => setRestoreTarget(item)}
                              title="Restore Package"
                              aria-label="Restore Package"
                              className="w-8 h-8 rounded-lg bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] flex items-center justify-center hover:bg-[#D1FADF] hover:text-[#027A48] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#A6F4C5] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                              <RotateCcw className="w-4 h-4 stroke-[1.75]" />
                            </button>
                          ) : (
                            <>
                              {/* Edit Button (Purple tint at rest: bg #F4F1FF, border #DDD6FE, icon #6D4AFF) */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Package"
                                aria-label="Edit Package"
                                className="w-8 h-8 rounded-lg bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] flex items-center justify-center hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#DDD6FE] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                              >
                                <SquarePen className="w-4 h-4 stroke-[1.75]" />
                              </button>

                              {/* Delete Button (Red tint at rest: bg #FEF2F2, border #FECACA, icon #DC2626) */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                title="Delete Package"
                                aria-label="Delete Package"
                                className="w-8 h-8 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#B91C1C] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#FECACA] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="h-14 px-4 border-t border-[#F1F2F4] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] dark:text-slate-400">
            <div>
              <span>
                Showing {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} Subcontract{" "}
                {recordsTab === "deleted" ? "Deleted Packages" : "Packages"}
              </span>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-[#374151] dark:text-slate-200 hover:bg-[#F4F1FF] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous
              </button>

              <span className="px-3 h-8 flex items-center justify-center rounded-lg bg-[#6D4AFF] text-white font-medium text-xs shadow-xs">
                {currentPage}
              </span>

              <button
                type="button"
                disabled={currentPage * pageSize >= totalCount || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-[#374151] dark:text-slate-200 hover:bg-[#F4F1FF] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          VIEW DETAILS MODAL (GET /{uuid})
          ========================================================================= */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F2F4] dark:border-slate-800 bg-[#FAFAFF] dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <Eye className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Subcontract Package Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingDetails ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[#6D4AFF]">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs text-[#6B7280]">Loading details...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="p-3 bg-[#F9FAFB] dark:bg-slate-800/60 rounded-lg border border-[#E5E7EB] dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider block">
                        Package Name
                      </span>
                      <span className="text-sm font-semibold text-[#111827] dark:text-white mt-1 block">
                        {viewTarget.name}
                      </span>
                    </div>

                    {/* Unit */}
                    <div className="p-3 bg-[#F9FAFB] dark:bg-slate-800/60 rounded-lg border border-[#E5E7EB] dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider block">
                        Billing Unit
                      </span>
                      <span className="text-sm font-semibold text-[#111827] dark:text-white mt-1 block">
                        {viewTarget.unit}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="p-3 bg-[#F9FAFB] dark:bg-slate-800/60 rounded-lg border border-[#E5E7EB] dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider block">
                        Status
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium border ${
                          viewTarget.status === "active"
                            ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                            : "bg-[#F2F4F7] text-[#344054] border-[#E4E7EC]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            viewTarget.status === "active" ? "bg-[#12B76A]" : "bg-[#98A2B3]"
                          }`}
                        />
                        <span>{viewTarget.status === "active" ? "Active" : "Inactive"}</span>
                      </span>
                    </div>

                    {/* ID */}
                    <div className="p-3 bg-[#F9FAFB] dark:bg-slate-800/60 rounded-lg border border-[#E5E7EB] dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider block">
                        Database ID
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#374151] dark:text-slate-300 mt-1 block">
                        #{viewTarget.id}
                      </span>
                    </div>
                  </div>

                  {/* UUID */}
                  <div className="p-3 bg-[#F9FAFB] dark:bg-slate-800/60 rounded-lg border border-[#E5E7EB] dark:border-slate-700/60">
                    <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 uppercase tracking-wider block">
                      Record UUID
                    </span>
                    <span className="text-xs font-mono tabular-nums text-[#6D4AFF] dark:text-violet-300 mt-1 block select-all break-all">
                      {viewTarget.uuid}
                    </span>
                  </div>

                  {/* Audit Timestamps */}
                  <div className="space-y-1.5 pt-2 text-xs text-[#6B7280] dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Created At:</span>
                      <span className="font-sans tabular-nums text-[#374151] dark:text-slate-200">
                        {formatTimestamp(viewTarget.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Updated At:</span>
                      <span className="font-sans tabular-nums text-[#374151] dark:text-slate-200">
                        {formatTimestamp(viewTarget.updatedAt)}
                      </span>
                    </div>
                    {viewTarget.deletedAt && (
                      <div className="flex items-center justify-between text-[#B42318] dark:text-rose-400">
                        <span>Deleted At:</span>
                        <span className="font-sans tabular-nums">
                          {formatTimestamp(viewTarget.deletedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-[#F1F2F4] dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewTarget(null)}
                  className="h-9 px-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-xs font-medium text-[#374151] dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE SUBCONTRACT PACKAGE MODAL (POST /)
          Matching Screenshot 2: Name (*), Unit (*), Status (*) Radio Buttons
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F2F4] dark:border-slate-800 bg-[#FAFAFF] dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Add New Subcontract Package
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name (*) */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300">
                  Name <span className="text-[#D92D20]">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Piling / Electrical Work / Plumbing Work"
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                />
              </div>

              {/* Unit (*) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300">
                    Unit <span className="text-[#D92D20]">(*)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {["Lot", "SFT", "RFT", "CFT", "Item"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormUnit(u)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          formUnit === u
                            ? "bg-[#F4F1FF] text-[#6D4AFF] border-[#DDD6FE]"
                            : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Lot"
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                />
              </div>

              {/* Status (*) Radio Group matching Screenshot 2 */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300 block">
                  Status <span className="text-[#D92D20]">(*)</span>
                </label>
                <div className="flex items-center gap-5 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#374151] dark:text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formStatus === "active"}
                      onChange={() => setFormStatus("active")}
                      className="w-4 h-4 text-[#6D4AFF] border-[#E5E7EB] focus:ring-[#6D4AFF] cursor-pointer"
                    />
                    <span>Active</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#374151] dark:text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formStatus === "inactive"}
                      onChange={() => setFormStatus("inactive")}
                      className="w-4 h-4 text-[#6D4AFF] border-[#E5E7EB] focus:ring-[#6D4AFF] cursor-pointer"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions matching Screenshot 2: Close and Save changes */}
              <div className="pt-4 border-t border-[#F1F2F4] dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 px-5 rounded-lg bg-[#FF5C38] hover:bg-[#E04826] active:bg-[#C9381A] text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                  className="h-9 px-5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT SUBCONTRACT PACKAGE MODAL (PATCH /{uuid})
          ========================================================================= */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F2F4] dark:border-slate-800 bg-[#FAFAFF] dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] flex items-center justify-center">
                  <SquarePen className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Edit Subcontract Package
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name (*) */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300">
                  Name <span className="text-[#D92D20]">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                />
              </div>

              {/* Unit (*) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300">
                    Unit <span className="text-[#D92D20]">(*)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {["Lot", "SFT", "RFT", "CFT", "Item"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormUnit(u)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          formUnit === u
                            ? "bg-[#F4F1FF] text-[#6D4AFF] border-[#DDD6FE]"
                            : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                />
              </div>

              {/* Status (*) Radio Group */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#374151] dark:text-slate-300 block">
                  Status <span className="text-[#D92D20]">(*)</span>
                </label>
                <div className="flex items-center gap-5 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#374151] dark:text-slate-300">
                    <input
                      type="radio"
                      name="editStatus"
                      value="active"
                      checked={formStatus === "active"}
                      onChange={() => setFormStatus("active")}
                      className="w-4 h-4 text-[#6D4AFF] border-[#E5E7EB] focus:ring-[#6D4AFF] cursor-pointer"
                    />
                    <span>Active</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#374151] dark:text-slate-300">
                    <input
                      type="radio"
                      name="editStatus"
                      value="inactive"
                      checked={formStatus === "inactive"}
                      onChange={() => setFormStatus("inactive")}
                      className="w-4 h-4 text-[#6D4AFF] border-[#E5E7EB] focus:ring-[#6D4AFF] cursor-pointer"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1F2F4] dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="h-9 px-5 rounded-lg bg-[#FF5C38] hover:bg-[#E04826] active:bg-[#C9381A] text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                  className="h-9 px-5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL (DELETE /{uuid})
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#FEF3F2] dark:bg-rose-950/50 text-[#B42318] dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5 stroke-[1.75]" />
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Delete Subcontract Package?
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#111827] dark:text-slate-200">
                  &quot;{deleteTarget.name}&quot;
                </span>
                ? It will be soft-deleted and moved to the Deleted tab where you can restore it anytime.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-xs font-medium text-[#374151] dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="h-9 px-4 rounded-lg bg-[#D92D20] text-white hover:bg-[#B42318] active:bg-[#912018] text-xs font-medium cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESTORE CONFIRMATION MODAL (PATCH /{uuid}/restore)
          ========================================================================= */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF3] text-[#039855] flex items-center justify-center">
              <RotateCcw className="w-5 h-5 stroke-[1.75]" />
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Restore Subcontract Package?
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
                Restore{" "}
                <span className="font-semibold text-[#111827] dark:text-slate-200">
                  &quot;{restoreTarget.name}&quot;
                </span>{" "}
                back to active subcontract trade packages?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="h-9 px-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-xs font-medium text-[#374151] dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRestore}
                style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                className="h-9 px-4 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-xs font-medium cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
