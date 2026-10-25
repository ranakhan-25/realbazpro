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
  Eye,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  procurementAssetCategoryApi,
  BackendAssetCategory,
  CreateAssetCategoryPayload,
  UpdateAssetCategoryPayload,
  getAuthenticatedUserId,
} from "@/lib/procurement/procurementAssetCategoryApi";

// ------------------------------------------------------------------
// API Error Parser Helper
// ------------------------------------------------------------------
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

export default function AssetCategoryPage() {
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
  const [categories, setCategories] = useState<BackendAssetCategory[]>([]);
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

  // -------------------------------------------------------------
  // Sorting State
  // -------------------------------------------------------------
  const [sortField, setSortField] = useState<
    "createdAt" | "name" | "code" | "type"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States (Add / Edit)
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BackendAssetCategory | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Asset");

  // -------------------------------------------------------------
  // Details Modal States
  // -------------------------------------------------------------
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsItem, setDetailsItem] =
    useState<BackendAssetCategory | null>(null);

  // -------------------------------------------------------------
  // Dialog & Notification States
  // -------------------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<BackendAssetCategory | null>(null);
  const [restoreTarget, setRestoreTarget] =
    useState<BackendAssetCategory | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Debounce search input for API queries
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

  // Auto-generate suggested category code: e.g. AC-001 or C1704062
  const generateCategoryCode = () => {
    return `AC-${Math.floor(100 + Math.random() * 900)}`;
  };

  // -------------------------------------------------------------
  // Fetch Asset Categories from Real Backend API
  // -------------------------------------------------------------
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (viewMode === "deleted") {
        // In Deleted Mode: query with withDeleted: true and filter strictly deleted records
        const res = await procurementAssetCategoryApi.getAssetCategories({
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
        setCategories(onlyDeleted);
        setTotalEntries(onlyDeleted.length);
        setTotalPages(
          Math.max(1, Math.ceil(onlyDeleted.length / entriesPerPage)),
        );
      } else {
        // In Active Mode: query active items + background check of deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementAssetCategoryApi.getAssetCategories({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementAssetCategoryApi.getAssetCategories({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item that has deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setCategories(activeOnly);

          const serverMeta = activeRes.value.meta;
          const totalFromMeta =
            serverMeta?.total !== undefined ? serverMeta.total : activeOnly.length;
          setTotalEntries(totalFromMeta);
          setTotalPages(
            serverMeta?.totalPages !== undefined
              ? serverMeta.totalPages
              : Math.max(1, Math.ceil(totalFromMeta / entriesPerPage)),
          );
          setActiveCount(totalFromMeta);
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
      const msg = parseApiError(err, "Failed to load asset categories");
      console.error("[AssetCategoryPage] Error loading categories:", err);
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

  // Load when dependencies change
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // -------------------------------------------------------------
  // Displayed items calculation (strictly isolates active and deleted)
  // -------------------------------------------------------------
  const displayedItems = useMemo(() => {
    if (viewMode === "deleted") {
      const start = (currentPage - 1) * entriesPerPage;
      return categories
        .filter((item) => Boolean(item.deletedAt))
        .slice(start, start + entriesPerPage);
    }
    // In active mode: strictly ONLY active items, never deleted
    return categories.filter((item) => !item.deletedAt);
  }, [viewMode, categories, currentPage, entriesPerPage]);

  // -------------------------------------------------------------
  // Sorting Handler
  // -------------------------------------------------------------
  const handleSort = (field: "createdAt" | "name" | "code" | "type") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // View Details Modal Handler (GET /procurement/asset-category/:uuid)
  // -------------------------------------------------------------
  const handleOpenDetailsModal = async (item: BackendAssetCategory) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    setDetailsItem(item); // Optimistic preliminary display
    try {
      const freshData = await procurementAssetCategoryApi.getAssetCategory(
        item.uuid,
      );
      setDetailsItem(freshData);
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to fetch category details");
      showToast(msg, "error");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Modal Handlers (Add / Edit)
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormCode(generateCategoryCode());
    setFormName("");
    setFormType("Asset");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BackendAssetCategory) => {
    setModalMode("edit");
    setSelectedCategory(item);
    setFormCode(item.code || "");
    setFormName(item.name || "");
    setFormType(item.type || "Asset");
    setIsModalOpen(true);
  };

  // -------------------------------------------------------------
  // Form Submit (POST / or PATCH /:uuid)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      showToast("Please enter a category code", "error");
      return;
    }
    if (!formName.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const authUserId = getAuthenticatedUserId();

      if (modalMode === "add") {
        const payload: CreateAssetCategoryPayload = {
          type: formType.trim() || "Asset",
          code: formCode.trim(),
          name: formName.trim(),
          createdBy: authUserId,
        };

        await procurementAssetCategoryApi.createAssetCategory(payload);
        showToast(
          `Asset category "${formName.trim()}" created successfully!`,
          "success",
        );
      } else if (modalMode === "edit" && selectedCategory) {
        const payload: UpdateAssetCategoryPayload = {
          type: formType.trim() || "Asset",
          code: formCode.trim(),
          name: formName.trim(),
          createdBy: authUserId,
        };

        await procurementAssetCategoryApi.updateAssetCategory(
          selectedCategory.uuid,
          payload,
        );
        showToast(
          `Asset category "${formName.trim()}" updated successfully!`,
          "success",
        );
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save asset category");
      console.error("[AssetCategoryPage] Submit error:", err);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Soft Delete Handler (DELETE /:uuid)
  // -------------------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementAssetCategoryApi.deleteAssetCategory(deleteTarget.uuid);
      showToast(
        `Asset category "${deleteTarget.name}" moved to deleted records`,
        "info",
      );
      setDeleteTarget(null);
      if (isDetailsOpen && detailsItem?.uuid === deleteTarget.uuid) {
        setIsDetailsOpen(false);
      }
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete asset category");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Restore Handler (PATCH /:uuid/restore)
  // -------------------------------------------------------------
  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setIsActionLoading(true);
    try {
      await procurementAssetCategoryApi.restoreAssetCategory(
        restoreTarget.uuid,
      );
      showToast(
        `Asset category "${restoreTarget.name}" restored to active list!`,
        "success",
      );
      setRestoreTarget(null);
      if (isDetailsOpen && detailsItem?.uuid === restoreTarget.uuid) {
        setIsDetailsOpen(false);
      }
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore asset category");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Pagination calculation
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
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
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

            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
              <span>Procurement</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </div>

            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Asset Category
            </span>
          </nav>

          {/* Action Buttons (+Add Category, Back to Previous) */}
          <div className="flex items-center gap-3">
            {viewMode === "active" && (
              <button
                id="add-asset-category-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Category</span>
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
        {/* VIEW MODE SEGMENTED TABS (Active vs Deleted)              */}
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
              <Layers className="w-3.5 h-3.5" />
              <span>Active List</span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
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
                Viewing soft-deleted asset categories in <strong>Recycle Bin</strong>.
                Click <strong>Restore</strong> on any category to reactivate it.
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
                onClick={loadCategories}
                disabled={isLoading}
                title="Refresh categories list"
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
                    placeholder="Search category..."
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

          {/* Error Banner with Retry */}
          {fetchError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs sm:text-[13px] text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={loadCategories}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* ASSET CATEGORY TABLE                                      */}
          {/* ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Vibrant Lavender/Purple Table Header */}
              <thead>
                <tr className="bg-[#6366F1] dark:bg-[#5558E6] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                  {/* SL Header */}
                  <th className="py-3 px-4 w-[8%]">
                    <div className="flex items-center gap-1.5">
                      <span>SL</span>
                    </div>
                  </th>

                  {/* TYPE Header */}
                  <th
                    onClick={() => handleSort("type")}
                    className="py-3 px-4 w-[18%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>TYPE</span>
                      {sortField === "type" ? (
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

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-4 w-[24%] cursor-pointer hover:bg-white/10 transition-colors"
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
                    className="py-3 px-4 w-[35%] cursor-pointer hover:bg-white/10 transition-colors"
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
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* ACTION Header */}
                  <th className="py-3 px-4 w-[15%] text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>ACTION</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Loading asset categories...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const slNumber =
                      (currentPage - 1) * entriesPerPage + index + 1;
                    const isDeleted = Boolean(item.deletedAt);

                    return (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                      >
                        {/* SL */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          {slNumber}
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.type || "Asset"}
                          </span>
                        </td>

                        {/* CODE */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {item.code || "—"}
                        </td>

                        {/* NAME (Clickable to view details) */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenDetailsModal(item)}
                            title="Click to view details"
                            className="text-[#6366F1] dark:text-indigo-400 font-normal hover:underline text-left cursor-pointer transition-colors"
                          >
                            {item.name}
                          </button>
                        </td>

                        {/* ACTION */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details Eye Button */}
                            <button
                              onClick={() => handleOpenDetailsModal(item)}
                              title="View Details"
                              className="w-8 h-8 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 stroke-[2]" />
                            </button>

                            {!isDeleted ? (
                              <>
                                {/* Cyan Edit Button */}
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  title="Edit Category"
                                  className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <SquarePen className="w-4 h-4 stroke-[2]" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  title="Soft Delete Category"
                                  className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 stroke-[2]" />
                                </button>
                              </>
                            ) : (
                              /* Restore Button in Deleted Mode */
                              <button
                                onClick={() => setRestoreTarget(item)}
                                title="Restore Category"
                                className="w-8 h-8 rounded-md bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* Empty state */
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-500 dark:text-slate-400 text-[13px] font-normal"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {viewMode === "active"
                            ? "No asset categories found"
                            : "No deleted asset categories"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {viewMode === "active"
                            ? debouncedSearch
                              ? "Try adjusting your search query"
                              : "Click '+ Add Category' above to create your first asset category."
                            : "Deleted categories moved to the recycle bin will appear here."}
                        </span>
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
                disabled={currentPage <= 1 || totalEntries === 0}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page Number Buttons */}
              {totalPages > 0 &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#6366F1] text-white shadow-xs"
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
                disabled={currentPage >= totalPages || totalEntries === 0}
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
      {/* MODAL: CATEGORY (Add / Edit)                              */}
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
                {modalMode === "edit"
                  ? "Edit Asset Category"
                  : "Add Asset Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row: Category Code & Category Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category Code <span className="text-rose-500">*</span>
                    </label>
                    {modalMode === "add" && (
                      <button
                        type="button"
                        onClick={() => setFormCode(generateCategoryCode())}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Generate Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. AC-001"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vehicle"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row: Category Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Type
                </label>
                <input
                  type="text"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  placeholder="Asset"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Modal Footer (Close & Submit Buttons) */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-7 py-2.5 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold shadow-sm shadow-indigo-500/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : modalMode === "edit"
                        ? "Update"
                        : "Submit"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAILS VIEW MODAL (GET /:uuid)                           */}
      {/* ========================================================= */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[560px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Asset Category Details
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Information fetched directly from backend
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            <div className="p-6">
              {isDetailsLoading && !detailsItem ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-400">
                    Loading details...
                  </span>
                </div>
              ) : detailsItem ? (
                <div className="space-y-4 text-xs sm:text-[13px]">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Category Name
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {detailsItem.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Category Code
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {detailsItem.code || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Type
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {detailsItem.type || "Asset"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Status
                      </span>
                      {detailsItem.deletedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <Trash2 className="w-3 h-3" />
                          Soft-Deleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        UUID
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 break-all select-all">
                        {detailsItem.uuid}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Internal ID / Created By
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        ID: {detailsItem.id} • By:{" "}
                        {detailsItem.createdBy || "system"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[12px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Created At
                      </span>
                      <span>
                        {detailsItem.createdAt
                          ? new Date(detailsItem.createdAt).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        Updated At
                      </span>
                      <span>
                        {detailsItem.updatedAt
                          ? new Date(detailsItem.updatedAt).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {detailsItem.deletedAt && (
                    <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 text-[12px] text-rose-600 dark:text-rose-400">
                      <span>
                        Deleted At:{" "}
                        {new Date(detailsItem.deletedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-5">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SOFT DELETE CONFIRMATION DIALOG                           */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Confirm Soft Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to soft-delete{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name}
              </strong>
              ? It will be moved to the <strong>Deleted List</strong> where it can
              be restored at any time.
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
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isActionLoading && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                <span>{isActionLoading ? "Deleting..." : "Delete"}</span>
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Confirm Category Restoration
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to restore{" "}
              <strong className="text-slate-900 dark:text-white">
                {restoreTarget.name}
              </strong>{" "}
              back to the <strong>Active List</strong>?
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
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isActionLoading && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                <span>{isActionLoading ? "Restoring..." : "Restore"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
