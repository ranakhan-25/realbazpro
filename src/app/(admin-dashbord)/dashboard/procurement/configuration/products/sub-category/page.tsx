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
  FolderTree,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  procurementSubCategoryApi,
  BackendSubCategory,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload,
  getAuthenticatedUserId,
} from "@/lib/procurement/procurementSubCategoryApi";
import {
  procurementCategoryApi,
  BackendCategory,
} from "@/lib/procurement/procurementCategoryApi";

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

export default function SubCategoryPage() {
  const router = useRouter();

  // -------------------------------------------------------------
  // View Mode: "active" | "deleted"
  // -------------------------------------------------------------
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);

  // -------------------------------------------------------------
  // Data States
  // -------------------------------------------------------------
  const [subCategories, setSubCategories] = useState<BackendSubCategory[]>([]);
  const [parentCategories, setParentCategories] = useState<BackendCategory[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCategoriesLoading, setIsCategoriesLoading] =
    useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Query & Filter States
  // -------------------------------------------------------------
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<"createdAt" | "name" | "code">(
    "createdAt",
  );
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<BackendSubCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");

  // Details Modal State (GET /:uuid)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<BackendSubCategory | null>(
    null,
  );
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<BackendSubCategory | null>(
    null,
  );
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Quick lookup map for parent categories
  const categoryLookup = useMemo(() => {
    const map = new Map<string, BackendCategory>();
    parentCategories.forEach((cat) => {
      map.set(cat.uuid, cat);
      if (cat.id) map.set(String(cat.id), cat);
    });
    return map;
  }, [parentCategories]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Toast Notification Trigger
  const showToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast(null);
      }, 4000);
    },
    [],
  );

  // Auto-generate code matching pattern: e.g. SC0923950
  const generateSubCategoryCode = () => {
    return `SC${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  // -------------------------------------------------------------
  // Fetch Parent Categories from Category API
  // -------------------------------------------------------------
  const loadParentCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await procurementCategoryApi.getCategories({
        limit: 100,
        sortBy: "name",
        sortOrder: "ASC",
      });
      setParentCategories(res.data || []);
    } catch (err: unknown) {
      console.error("[SubCategoryPage] Error loading parent categories:", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // -------------------------------------------------------------
  // Fetch Sub Categories from Procurement Sub Category API
  // -------------------------------------------------------------
  const loadSubCategories = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (viewMode === "deleted") {
        // In Deleted Mode: query all records with withDeleted: true
        const res = await procurementSubCategoryApi.getSubCategories({
          page: 1,
          limit: 100,
          search: debouncedSearch.trim() || undefined,
          categoryId:
            selectedCategoryFilter !== "all"
              ? selectedCategoryFilter
              : undefined,
          sortBy: sortField,
          sortOrder: sortDirection,
          withDeleted: true,
        });

        const allItems = res.data || [];
        const onlyDeleted = allItems.filter((item) => Boolean(item.deletedAt));
        const onlyActive = allItems.filter((item) => !item.deletedAt);

        setDeletedCount(onlyDeleted.length);
        setActiveCount(onlyActive.length);
        setSubCategories(onlyDeleted);
        setTotalEntries(onlyDeleted.length);
        setTotalPages(
          Math.max(1, Math.ceil(onlyDeleted.length / entriesPerPage)),
        );
      } else {
        // In Active Mode: query active items + background check of deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementSubCategoryApi.getSubCategories({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            categoryId:
              selectedCategoryFilter !== "all"
                ? selectedCategoryFilter
                : undefined,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementSubCategoryApi.getSubCategories({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item that has deletedAt from active list
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setSubCategories(activeOnly);
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
          if (!debouncedSearch && selectedCategoryFilter === "all") {
            setActiveCount(activeInAll);
          }
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load sub categories");
      console.error("[SubCategoryPage] Error loading sub categories:", err);
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
    selectedCategoryFilter,
    sortField,
    sortDirection,
    showToast,
  ]);

  // Initial Load
  useEffect(() => {
    loadParentCategories();
  }, [loadParentCategories]);

  useEffect(() => {
    loadSubCategories();
  }, [loadSubCategories]);

  // -------------------------------------------------------------
  // Displayed items calculation (strictly isolates active and deleted)
  // -------------------------------------------------------------
  const displayedItems = useMemo(() => {
    if (viewMode === "deleted") {
      const start = (currentPage - 1) * entriesPerPage;
      return subCategories
        .filter((item) => Boolean(item.deletedAt))
        .slice(start, start + entriesPerPage);
    }
    // In active mode: strictly ONLY active items, never deleted
    return subCategories.filter((item) => !item.deletedAt);
  }, [viewMode, subCategories, currentPage, entriesPerPage]);

  // -------------------------------------------------------------
  // Sorting Handler
  // -------------------------------------------------------------
  const handleSort = (field: "createdAt" | "name" | "code") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // View Details Modal Handler (GET /:uuid)
  // -------------------------------------------------------------
  const handleOpenDetailsModal = async (item: BackendSubCategory) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    setDetailsItem(item); // Optimistic preliminary display
    try {
      const freshData = await procurementSubCategoryApi.getSubCategory(
        item.uuid,
      );
      setDetailsItem(freshData);
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to fetch sub-category details");
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
    setSelectedSubCategory(null);
    setFormCategoryId(
      selectedCategoryFilter !== "all"
        ? selectedCategoryFilter
        : parentCategories[0]?.uuid || "",
    );
    setFormCode(generateSubCategoryCode());
    setFormName("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BackendSubCategory) => {
    setModalMode("edit");
    setSelectedSubCategory(item);
    setFormCategoryId(item.categoryId || item.category?.uuid || "");
    setFormCode(item.code || "");
    setFormName(item.name || "");
    setIsModalOpen(true);
  };

  // -------------------------------------------------------------
  // Form Submit (POST / or PATCH /:uuid)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCategoryId.trim()) {
      showToast("Please select a parent category", "error");
      return;
    }
    if (!formCode.trim()) {
      showToast("Please enter a sub category code", "error");
      return;
    }
    if (!formName.trim()) {
      showToast("Please enter a sub category name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        const payload: CreateSubCategoryPayload = {
          categoryId: formCategoryId.trim(),
          code: formCode.trim(),
          name: formName.trim(),
          createdBy: getAuthenticatedUserId(),
        };

        await procurementSubCategoryApi.createSubCategory(payload);
        showToast(
          `Sub category "${formName.trim()}" created successfully!`,
          "success",
        );
      } else if (modalMode === "edit" && selectedSubCategory) {
        const payload: UpdateSubCategoryPayload = {
          categoryId: formCategoryId.trim(),
          code: formCode.trim(),
          name: formName.trim(),
          updatedBy: getAuthenticatedUserId(),
        };

        await procurementSubCategoryApi.updateSubCategory(
          selectedSubCategory.uuid,
          payload,
        );
        showToast(
          `Sub category "${formName.trim()}" updated successfully!`,
          "success",
        );
      }

      setIsModalOpen(false);
      await loadSubCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save sub category");
      console.error("[SubCategoryPage] Submit error:", err);
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
      await procurementSubCategoryApi.deleteSubCategory(deleteTarget.uuid);
      showToast(
        `Sub category "${deleteTarget.name}" moved to deleted records`,
        "info",
      );
      setDeleteTarget(null);
      if (isDetailsOpen && detailsItem?.uuid === deleteTarget.uuid) {
        setIsDetailsOpen(false);
      }
      await loadSubCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete sub category");
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

            <Link
              href="/dashboard/procurement/configuration/products/category"
              className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline"
            >
              <span>Procurement</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </Link>

            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {viewMode === "deleted"
                ? "Deleted Sub Category List"
                : "Sub Category List"}
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* +Add Sub Category Button (Visible in Active Mode) */}
            {viewMode === "active" && (
              <button
                id="add-sub-category-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Sub Category</span>
              </button>
            )}

            {/* Dedicated Button for Deleted / Active Mode */}
            {viewMode === "active" ? (
              <button
                id="view-deleted-btn"
                onClick={() => {
                  setViewMode("deleted");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="View all soft-deleted sub-categories"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Deleted Sub Categories</span>
                {deletedCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {deletedCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="view-active-btn"
                onClick={() => {
                  setViewMode("active");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="Back to active sub-categories"
              >
                <FolderTree className="w-4 h-4 stroke-[2.5]" />
                <span>Active Sub Categories</span>
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
        {/* CATEGORY FILTER & VIEW MODE SEGMENTED TABS                */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 w-full sm:max-w-sm">
            <label className="block text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <div className="relative">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isCategoriesLoading}
                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-9 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal disabled:opacity-60"
              >
                <option value="all">All Categories</option>
                {parentCategories.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid}>
                    {cat.name} {cat.code ? `(${cat.code})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>

          {/* Active / Deleted Mode Segmented Tabs */}
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
              <FolderTree className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between p-3.5 px-4 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                <strong>Deleted Mode:</strong> Showing all soft-deleted
                sub-categories ({totalEntries} records).
              </span>
            </div>
            <button
              onClick={() => {
                setViewMode("active");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer shrink-0 ml-3"
            >
              Back to Active List
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
                onClick={() => {
                  loadSubCategories();
                  loadParentCategories();
                }}
                disabled={isLoading}
                title="Refresh from server"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`}
                />
              </button>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
                <span>Search:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, code..."
                    className="w-44 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all pr-7"
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
          {/* SUB CATEGORY TABLE                                       */}
          {/* ========================================================= */}
          <div className="overflow-x-auto relative min-h-[220px]">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex items-center justify-center backdrop-blur-2xs">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading sub-categories...</span>
                </div>
              </div>
            )}

            <table className="w-full text-left border-collapse">
              {/* Table Header: Changes to Rose when viewing Deleted Mode */}
              <thead>
                <tr
                  className={`${
                    viewMode === "deleted"
                      ? "bg-rose-600 dark:bg-rose-700"
                      : "bg-[#6366F1] dark:bg-[#5558E6]"
                  } text-white text-[11px] font-bold uppercase tracking-wider select-none`}
                >
                  {/* SL Header */}
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="py-3 px-4 w-[8%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SL</span>
                      {sortField === "createdAt" ? (
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

                  {/* CATEGORY Header */}
                  <th className="py-3 px-4 w-[25%]">
                    <span>CATEGORY</span>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-4 w-[22%] cursor-pointer hover:bg-white/10 transition-colors"
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
                        <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* NAME Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-4 w-[31%] cursor-pointer hover:bg-white/10 transition-colors"
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

                  {/* ACTION Header */}
                  <th className="py-3 px-4 w-[14%] text-center">
                    <span>ACTION</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {fetchError ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-7 h-7 text-rose-500 stroke-[1.5]" />
                        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                          {fetchError}
                        </p>
                        <button
                          onClick={() => loadSubCategories()}
                          className="mt-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-md text-xs font-semibold hover:underline cursor-pointer border border-indigo-200 dark:border-indigo-800"
                        >
                          Retry Request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const sl = (currentPage - 1) * entriesPerPage + index + 1;
                    const isDeleted = Boolean(item.deletedAt);
                    const categoryName =
                      item.category?.name ||
                      categoryLookup.get(item.categoryId)?.name ||
                      item.categoryId ||
                      "—";

                    return (
                      <tr
                        key={item.uuid}
                        className={`transition-colors duration-150 ${
                          isDeleted
                            ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* SL */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          {sl}
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {categoryName}
                        </td>

                        {/* CODE */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {item.code || "—"}
                        </td>

                        {/* NAME */}
                        <td className="py-3 px-4">
                          {!isDeleted ? (
                            <button
                              onClick={() => handleOpenDetailsModal(item)}
                              title="Click to view details"
                              className="text-slate-800 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-indigo-400 font-normal hover:underline text-left cursor-pointer transition-colors"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-rose-600 font-medium px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
                                Deleted
                              </span>
                            </div>
                          )}
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
                                  title="Edit Sub Category"
                                  className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <SquarePen className="w-4 h-4 stroke-[2]" />
                                </button>

                                {/* Coral/Red Delete Button */}
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  title="Delete Sub Category"
                                  className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 stroke-[2]" />
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
                                Soft Delete
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderTree className="w-7 h-7 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        <p className="text-sm">
                          {viewMode === "deleted"
                            ? "No deleted sub-categories found"
                            : "No matching sub categories found"}
                        </p>
                        {(search || selectedCategoryFilter !== "all") && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setSelectedCategoryFilter("all");
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )}
                        {viewMode === "deleted" && (
                          <button
                            onClick={() => setViewMode("active")}
                            className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                          >
                            Go to Active Sub Categories
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
              {viewMode === "deleted" && " (Deleted Records)"}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 select-none">
              {/* Previous Button */}
              <button
                disabled={currentPage <= 1 || isLoading}
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
                      disabled={isLoading}
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
      {/* MODAL: CREATE / EDIT SUB CATEGORY                         */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[840px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {modalMode === "edit" ? "Edit Sub Category" : "Sub Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Form (3 Columns Row) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Column 1: Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Category</option>
                      {parentCategories.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.name} {cat.code ? `(${cat.code})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Column 2: Sub Category Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sub Category Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SC6699769"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                {/* Column 3: Sub Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sub Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Sub Category Name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-md bg-[#8A92A6] hover:bg-[#788094] text-white text-xs sm:text-[13px] font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-7 py-2 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold shadow-sm shadow-indigo-500/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === "edit" ? "Update" : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW DETAILS (GET /:uuid)                          */}
      {/* ========================================================= */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[620px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Sub-Category Details
                </h2>
                {detailsItem?.deletedAt ? (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded">
                    Deleted
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 relative">
              {isDetailsLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              )}

              {detailsItem && (
                <div className="space-y-4 text-xs sm:text-[13px]">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Sub Category Name
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {detailsItem.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Sub Category Code
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {detailsItem.code || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Parent Category
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {detailsItem.category?.name ||
                          categoryLookup.get(detailsItem.categoryId)?.name ||
                          detailsItem.categoryId ||
                          "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Parent Category Code
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {detailsItem.category?.code ||
                          categoryLookup.get(detailsItem.categoryId)?.code ||
                          "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        UUID
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 break-all">
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
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                      Deleted At:{" "}
                      {new Date(detailsItem.deletedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Actions inside Details */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="flex items-center gap-2">
                  {detailsItem && !detailsItem.deletedAt ? (
                    <>
                      <button
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleOpenEditModal(detailsItem);
                        }}
                        className="px-3.5 py-1.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <SquarePen className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget(detailsItem);
                        }}
                        className="px-3.5 py-1.5 bg-[#EF4444] hover:bg-[#dc2626] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : detailsItem?.deletedAt ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
                                Soft Delete
                              </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG: CONFIRM DELETE (DELETE /:uuid)                    */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to soft-delete{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name}
              </strong>
              ? This will move it to the{" "}
              <span className="text-rose-600 font-semibold">
                Deleted Sub Categories
              </span>{" "}
              section.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isActionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
