"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  SquarePen,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  X,
  RefreshCw,
  RotateCcw,
  Loader2,
  AlertCircle,
  Scale,
  CheckCircle2,
} from "lucide-react";
import {
  procurementUnitApi,
  BackendUnit,
  getAuthenticatedUserId,
} from "@/lib/procurement/procurementUnitApi";

function parseApiError(err: unknown, defaultMessage: string): string {
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
            : JSON.stringify(e),
        )
        .join(", ");
    }

    const backendMessage =
      errorObj.response?.data?.message ||
      errorObj.response?.data?.error ||
      errorObj.message;

    if (typeof backendMessage === "string") return backendMessage;
    if (Array.isArray(backendMessage)) {
      return backendMessage
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
  }
  return defaultMessage;
}

export default function UnitPage() {
  const router = useRouter();

  // -------------------------------------------------------------
  // View Mode: "active" | "deleted"
  // -------------------------------------------------------------
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // -------------------------------------------------------------
  // Data States
  // -------------------------------------------------------------
  const [units, setUnits] = useState<BackendUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Query & Pagination States
  // -------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<
    "createdAt" | "name" | "code" | "rate"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<BackendUnit | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formConversionUnit, setFormConversionUnit] = useState("");
  const [formRate, setFormRate] = useState("");

  // -------------------------------------------------------------
  // Dialog & Notification States
  // -------------------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendUnit | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackendUnit | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Toast Notification helper
  const showToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    [],
  );

  // Auto-generate code matching backend patterns: e.g. C4546919
  const generateUnitCode = () => {
    return `C${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  // -------------------------------------------------------------
  // Fetch Units from Real Backend API
  // -------------------------------------------------------------
  const loadUnits = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (viewMode === "deleted") {
        // In Deleted Mode: query with withDeleted: true, filter strictly deleted
        const res = await procurementUnitApi.getUnits({
          page: 1,
          limit: 100,
          search: debouncedSearch.trim() || undefined,
          sortBy: sortField,
          sortOrder: sortDirection,
          withDeleted: true,
        });

        const allItems = res.data || [];
        const onlyDeleted = allItems.filter((item) => Boolean(item.deletedAt));
        const onlyActive = allItems.filter((item) => !item.deletedAt);

        setDeletedCount(onlyDeleted.length);
        setActiveCount(onlyActive.length);
        setUnits(onlyDeleted);
        setTotalEntries(onlyDeleted.length);
        setTotalPages(
          Math.max(1, Math.ceil(onlyDeleted.length / entriesPerPage)),
        );
      } else {
        // In Active Mode: query active items + background check of deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementUnitApi.getUnits({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementUnitApi.getUnits({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item with deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setUnits(activeOnly);
          setTotalEntries(activeOnly.length);
          setTotalPages(
            Math.max(1, Math.ceil(activeOnly.length / entriesPerPage)),
          );
          setActiveCount(activeOnly.length);
        } else {
          throw activeRes.reason;
        }

        if (withDeletedRes.status === "fulfilled") {
          const all = withDeletedRes.value.data || [];
          const count = all.filter((i) => Boolean(i.deletedAt)).length;
          const activeInAll = all.filter((i) => !i.deletedAt).length;
          setDeletedCount(count);
          if (!debouncedSearch) {
            setActiveCount(activeInAll);
          }
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load units");
      console.error("[UnitPage] Error loading units:", err);
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    viewMode,
    currentPage,
    entriesPerPage,
    debouncedSearch,
    sortField,
    sortDirection,
    showToast,
  ]);

  // Initial load
  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // -------------------------------------------------------------
  // Displayed items calculation (strictly isolates active and deleted)
  // -------------------------------------------------------------
  const displayedItems = useMemo(() => {
    if (viewMode === "deleted") {
      const start = (currentPage - 1) * entriesPerPage;
      return units
        .filter((item) => Boolean(item.deletedAt))
        .slice(start, start + entriesPerPage);
    }
    // In active mode: strictly ONLY active items, never deleted
    return units.filter((item) => !item.deletedAt);
  }, [viewMode, units, currentPage, entriesPerPage]);

  // -------------------------------------------------------------
  // Modal Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedUnit(null);
    setFormCode(generateUnitCode());
    setFormName("");
    setFormConversionUnit("");
    setFormRate("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: BackendUnit) => {
    setModalMode("edit");
    setSelectedUnit(item);
    setFormCode(item.code || "");
    setFormName(item.name || "");
    setFormConversionUnit(item.conversionUnit || "");
    setFormRate(
      item.rate !== undefined && item.rate !== null
        ? String(parseFloat(String(item.rate)))
        : "",
    );
    setIsModalOpen(true);

    // Fetch fresh details from backend
    try {
      const fresh = await procurementUnitApi.getUnit(item.uuid);
      if (fresh) {
        setFormCode(fresh.code || "");
        setFormName(fresh.name || "");
        setFormConversionUnit(fresh.conversionUnit || "");
        setFormRate(
          fresh.rate !== undefined && fresh.rate !== null
            ? String(parseFloat(String(fresh.rate)))
            : "",
        );
      }
    } catch (err) {
      console.warn(
        "[UnitPage] Could not fetch fresh details, using item cache:",
        err,
      );
    }
  };

  // -------------------------------------------------------------
  // Form Submit (Create / Update Unit)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter a unit name", "error");
      return;
    }

    let parsedRate: number | undefined = undefined;
    if (formRate.trim()) {
      const num = Number(formRate.trim());
      if (isNaN(num) || num <= 0) {
        showToast("Conversion rate must be a positive number", "error");
        return;
      }
      parsedRate = num;
    }

    const codeToUse = formCode.trim() || generateUnitCode();
    const userId = getAuthenticatedUserId();

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await procurementUnitApi.createUnit({
          code: codeToUse,
          name: formName.trim(),
          conversionUnit: formConversionUnit.trim() || undefined,
          rate: parsedRate,
          createdBy: userId,
        });
        showToast(`Unit "${formName.trim()}" created successfully!`, "success");
      } else if (modalMode === "edit" && selectedUnit) {
        await procurementUnitApi.updateUnit(selectedUnit.uuid, {
          code: codeToUse,
          name: formName.trim(),
          conversionUnit: formConversionUnit.trim() || undefined,
          rate: parsedRate,
          updatedBy: userId,
        });
        showToast(`Unit "${formName.trim()}" updated successfully!`, "success");
      }

      setIsModalOpen(false);
      await loadUnits();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save unit");
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Soft Delete Handler
  // -------------------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementUnitApi.deleteUnit(deleteTarget.uuid);
      showToast(`Unit "${deleteTarget.name}" moved to Recycle Bin`, "info");
      setDeleteTarget(null);
      await loadUnits();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete unit");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Restore Handler
  // -------------------------------------------------------------
  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setIsActionLoading(true);
    try {
      await procurementUnitApi.restoreUnit(restoreTarget.uuid);
      showToast(
        `Unit "${restoreTarget.name}" restored successfully!`,
        "success",
      );
      setRestoreTarget(null);
      await loadUnits();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore unit");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Sorting Handler
  // -------------------------------------------------------------
  const handleSort = (field: "createdAt" | "name" | "code" | "rate") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setCurrentPage(1);
  };

  // Format rate nicely for display
  const formatRate = (rateVal: number | string | null | undefined): string => {
    if (rateVal === null || rateVal === undefined || rateVal === "") return "";
    const num = parseFloat(String(rateVal));
    if (isNaN(num)) return String(rateVal);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  // Pagination display indices
  const displayFrom =
    totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const displayTo = Math.min(currentPage * entriesPerPage, totalEntries);

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-400"
                : toast.type === "error"
                  ? "bg-rose-500"
                  : "bg-indigo-400"
            }`}
          />
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-700 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {/* ========================================================= */}
        {/* TOP BAR: Breadcrumbs + Action Buttons                     */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[13px] font-normal"
          >
            <Link
              href="/dashboard"
              className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>

            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer">
              <span>Procurement</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </div>

            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {viewMode === "deleted" ? "Deleted Unit List" : "Unit List"}
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* +Add Unit Button (Visible in Active Mode) */}
            {viewMode === "active" && (
              <button
                id="add-unit-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Unit</span>
              </button>
            )}

            {/* Dedicated Button for Deleted / Active Mode */}
            {viewMode === "active" ? (
              <button
                id="view-deleted-units-btn"
                onClick={() => {
                  setViewMode("deleted");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="View all soft-deleted units"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Deleted Units</span>
                {deletedCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {deletedCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="view-active-units-btn"
                onClick={() => {
                  setViewMode("active");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="Back to active units"
              >
                <Scale className="w-4 h-4 stroke-[2.5]" />
                <span>Active Units</span>
                {activeCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {activeCount}
                  </span>
                )}
              </button>
            )}

            {/* Back to Previous Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-[#253945] hover:bg-[#1b2c37] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Previous</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW MODE SEGMENTED TABS                                  */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg">
            <button
              onClick={() => {
                setViewMode("active");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "active"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Active List</span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setViewMode("deleted");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "deleted"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deleted List</span>
              {deletedCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    viewMode === "deleted"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {deletedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BANNER WHEN IN DELETED MODE                               */}
        {/* ========================================================= */}
        {viewMode === "deleted" && (
          <div className="flex items-center justify-between p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-md text-rose-800 dark:text-rose-300 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                Viewing soft-deleted units in <strong>Recycle Bin</strong>.
                Click <strong>Restore</strong> on any unit to reactivate it.
              </span>
            </div>
            <button
              onClick={() => {
                setViewMode("active");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold underline hover:no-underline text-rose-700 dark:text-rose-300 cursor-pointer"
            >
              Return to Active List
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD CONTAINER: Controls + Table + Pagination             */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Controls Header: Show entries & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800 text-sm">
            {/* Show entries dropdown */}
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
              <span>Show</span>
              <div className="relative inline-block">
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
              <span>entries</span>
            </div>

            {/* Quick Actions & Search Input */}
            <div className="flex items-center gap-3">
              <button
                onClick={loadUnits}
                disabled={isLoading}
                title="Refresh units list"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
                />
              </button>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
                <span>Search:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search unit..."
                    className="w-40 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* UNIT TABLE                                                */}
          {/* ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Vibrant Lavender/Purple Header for Active, Rose for Deleted */}
              <thead>
                <tr
                  className={`${
                    viewMode === "deleted"
                      ? "bg-rose-600 dark:bg-rose-700"
                      : "bg-[#6366F1] dark:bg-[#5558E6]"
                  } text-white text-[11px] font-bold uppercase tracking-wider select-none`}
                >
                  {/* ID Header */}
                  <th className="py-3 px-4 w-[8%]">
                    <span>ID</span>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-4 w-[16%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>CODE</span>
                      {sortField === "code" ? (
                        sortDirection === "ASC" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* NAME Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-4 w-[24%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NAME</span>
                      {sortField === "name" ? (
                        sortDirection === "ASC" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* CONVERSION UNIT Header */}
                  <th className="py-3 px-4 w-[22%]">
                    <span>CONVERSION UNIT</span>
                  </th>

                  {/* RATE Header */}
                  <th
                    onClick={() => handleSort("rate")}
                    className="py-3 px-4 w-[18%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>RATE</span>
                      {sortField === "rate" ? (
                        sortDirection === "ASC" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* ACTION Header */}
                  <th className="py-3 px-4 w-[12%] text-center">
                    <span>ACTION</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="w-7 h-7 animate-spin text-[#6366F1]" />
                        <span className="text-xs font-medium">
                          Loading units from backend...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2 text-rose-500">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          {fetchError}
                        </span>
                        <button
                          onClick={loadUnits}
                          className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline font-medium cursor-pointer"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const rowId =
                      viewMode === "deleted"
                        ? index + 1
                        : (currentPage - 1) * entriesPerPage + index + 1;

                    return (
                      <tr
                        key={item.uuid || item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150 ${
                          viewMode === "deleted"
                            ? "bg-rose-50/20 dark:bg-rose-950/10"
                            : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          {rowId}
                        </td>

                        {/* CODE */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {item.code || ""}
                        </td>

                        {/* NAME */}
                        <td className="py-3 px-4">
                          {viewMode === "active" ? (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-slate-800 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-indigo-400 font-medium hover:underline text-left cursor-pointer transition-colors"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                              {item.name}
                            </span>
                          )}
                        </td>

                        {/* CONVERSION UNIT */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.conversionUnit || "-"}
                        </td>

                        {/* RATE */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {formatRate(item.rate) || "-"}
                        </td>

                        {/* ACTION */}
                        <td className="py-2.5 px-4 text-center">
                          {viewMode === "active" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Violet/Purple Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Unit"
                                className="w-8 h-8 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <SquarePen className="w-4 h-4 stroke-[2]" />
                              </button>

                              {/* Coral/Red Delete Button */}
                              <button
                                onClick={() => setDeleteTarget(item)}
                                title="Delete Unit"
                                className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[2]" />
                              </button>
                            </div>
                          ) : (
                            /* Restore Action for Deleted Units */
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setRestoreTarget(item)}
                                title="Restore Unit"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Restore</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Scale className="w-7 h-7 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        <p className="text-sm">
                          {viewMode === "deleted"
                            ? "No deleted units found in Recycle Bin"
                            : "No matching units found"}
                        </p>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* TABLE FOOTER: Showing Entries + Numbered Pagination       */}
          {/* ========================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            {/* Showing X to Y of Z entries */}
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 select-none">
              {/* Previous Button */}
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded font-medium transition-all cursor-pointer ${
                        isActive
                          ? viewMode === "deleted"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-[#6366F1] text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}

              {/* Next Button */}
              <button
                disabled={currentPage >= totalPages || isLoading}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT UNIT                                    */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[620px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {modalMode === "edit" ? "Edit Unit" : "Unit"}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Code
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. C4546919"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                />
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kg, Bag, Sft"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Conversion Details (Conversion Unit & Rate) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Conversion Unit
                  </label>
                  <input
                    type="text"
                    value={formConversionUnit}
                    onChange={(e) => setFormConversionUnit(e.target.value)}
                    placeholder="e.g. Gram"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Conversion Rate
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-md bg-[#8A92A6] hover:bg-[#788094] text-white text-xs sm:text-[13px] font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold shadow-sm shadow-indigo-500/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{modalMode === "edit" ? "Update" : "Submit"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG (SOFT-DELETE)                  */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  Move unit to Recycle Bin
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to soft-delete{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name}
              </strong>
              ? You can restore it anytime from the{" "}
              <strong>Deleted Units</strong> section.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESTORE CONFIRMATION DIALOG                               */}
      {/* ========================================================= */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Restore Unit
                </h3>
                <p className="text-xs text-slate-500">
                  Reactivate soft-deleted record
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to restore{" "}
              <strong className="text-slate-900 dark:text-white">
                {restoreTarget.name}
              </strong>
              ? It will be moved back to the active unit list immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleRestoreConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Restore</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
