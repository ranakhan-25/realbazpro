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
  X,
  RefreshCw,
  RotateCcw,
  Loader2,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import {
  procurementCategoryApi,
  BackendCategory,
  AccountTypeEnum,
  RealAccountOption,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/lib/procurement/procurementCategoryApi";

// Standard Account Groups matching the original UI dropdown options
const INVENTORY_GROUPS = [
  "Current Assets",
  "Material Stock",
  "Inventory Assets",
  "Direct Materials",
  "Raw Materials",
  "Finished Goods",
  "Site Inventory",
  "Consumables Stock",
  "Thai Inventory",
  "100-001-001",
];

const CONSUMPTION_GROUPS = [
  "Direct Project Cost",
  "Site Consumption",
  "Operating Costs",
  "Material Consumption Cost",
  "Reinforcement Cost",
  "Civil Works Expense",
  "MEP Works",
  "Finishing Expense",
  "Thai Consumption",
  "500-001-001",
];

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

export default function CategoryPage() {
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
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [realAccounts, setRealAccounts] = useState<RealAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAccountsLoading, setIsAccountsLoading] = useState<boolean>(false);
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
    "createdAt" | "name" | "code" | "type"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BackendCategory | null>(null);

  // Form Fields
  const [formCategoryCode, setFormCategoryCode] = useState("");
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formType, setFormType] = useState("Material");
  const [inventoryMode, setInventoryMode] =
    useState<AccountTypeEnum>("Create New");
  const [inventoryGroup, setInventoryGroup] = useState("");
  const [existingInventoryId, setExistingInventoryId] = useState("");

  const [consumptionMode, setConsumptionMode] =
    useState<AccountTypeEnum>("Create New");
  const [consumptionGroup, setConsumptionGroup] = useState("");
  const [existingConsumptionId, setExistingConsumptionId] = useState("");

  // -------------------------------------------------------------
  // Dialog & Notification States
  // -------------------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendCategory | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<BackendCategory | null>(
    null,
  );
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

  // -------------------------------------------------------------
  // Fetch Categories from Real Backend API
  // -------------------------------------------------------------
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (viewMode === "deleted") {
        // In Deleted Mode: query with withDeleted: true, filter strictly deleted
        const res = await procurementCategoryApi.getCategories({
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
          procurementCategoryApi.getCategories({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementCategoryApi.getCategories({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item with deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setCategories(activeOnly);
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
      const msg = parseApiError(err, "Failed to load categories");
      console.error("[CategoryPage] Error loading categories:", err);
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

  // Load Real Accounts from backend (for Existing Account selectors)
  const loadRealAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    try {
      const accounts = await procurementCategoryApi.getRealAccounts();
      setRealAccounts(accounts);
    } catch (err: unknown) {
      console.error("[CategoryPage] Error loading accounts:", err);
    } finally {
      setIsAccountsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRealAccounts();
  }, [loadRealAccounts]);

  // Quick account lookup map
  const accountLookup = useMemo(() => {
    const map = new Map<string, RealAccountOption>();
    realAccounts.forEach((acc) => {
      map.set(acc.uuid, acc);
    });
    return map;
  }, [realAccounts]);

  // Generate random category code matching pattern: e.g. C9016095
  const generateCategoryCode = () => {
    return `C${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

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
  // Modal Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormCategoryCode(generateCategoryCode());
    setFormCategoryName("");
    setFormType("Material");

    // Reset account mapping fields
    setInventoryMode("Create New");
    setInventoryGroup("");
    setExistingInventoryId(realAccounts[0]?.uuid || "");

    setConsumptionMode("Create New");
    setConsumptionGroup("");
    setExistingConsumptionId(realAccounts[0]?.uuid || "");

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: BackendCategory) => {
    setModalMode("edit");
    setSelectedCategory(cat);
    setFormCategoryCode(cat.code || "");
    setFormCategoryName(cat.name || "");
    setFormType(cat.type || "Material");

    const mapping = cat.accountMapping;
    if (mapping) {
      setInventoryMode(mapping.inventoryAccountType || "Create New");
      setInventoryGroup(mapping.inventoryAccountGroupCode || "");
      setExistingInventoryId(
        mapping.existingInventoryAccountId || realAccounts[0]?.uuid || "",
      );

      setConsumptionMode(mapping.consumptionAccountType || "Create New");
      setConsumptionGroup(mapping.consumptionAccountGroupCode || "");
      setExistingConsumptionId(
        mapping.existingConsumptionAccountId || realAccounts[0]?.uuid || "",
      );
    } else {
      setInventoryMode("Create New");
      setInventoryGroup("");
      setExistingInventoryId(realAccounts[0]?.uuid || "");

      setConsumptionMode("Create New");
      setConsumptionGroup("");
      setExistingConsumptionId(realAccounts[0]?.uuid || "");
    }

    setIsModalOpen(true);
  };

  // -------------------------------------------------------------
  // Form Submit (Create / Update)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCategoryCode.trim()) {
      showToast("Category Code is required", "error");
      return;
    }
    if (!formCategoryName.trim()) {
      showToast("Category Name is required", "error");
      return;
    }

    // Account Mapping conditional check
    if (inventoryMode === "Existing" && !existingInventoryId) {
      showToast("Please select an Existing Inventory Account", "error");
      return;
    }
    if (consumptionMode === "Existing" && !existingConsumptionId) {
      showToast("Please select an Existing Consumption Account", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCategoryPayload = {
        type: formType || "Material",
        code: formCategoryCode.trim(),
        name: formCategoryName.trim(),
        addedById: "user-uuid",
        accountMapping: {
          inventoryAccountType: inventoryMode,
          inventoryAccountGroupCode:
            inventoryMode === "Create New"
              ? inventoryGroup.trim() || "100-001-001"
              : undefined,
          existingInventoryAccountId:
            inventoryMode === "Existing" ? existingInventoryId : undefined,
          consumptionAccountType: consumptionMode,
          consumptionAccountGroupCode:
            consumptionMode === "Create New"
              ? consumptionGroup.trim() || "500-001-001"
              : undefined,
          existingConsumptionAccountId:
            consumptionMode === "Existing" ? existingConsumptionId : undefined,
        },
      };

      if (modalMode === "add") {
        await procurementCategoryApi.createCategory(payload);
        showToast(
          `Category "${formCategoryName}" created successfully!`,
          "success",
        );
      } else if (modalMode === "edit" && selectedCategory) {
        const updatePayload: UpdateCategoryPayload = { ...payload };
        await procurementCategoryApi.updateCategory(
          selectedCategory.uuid,
          updatePayload,
        );
        showToast(
          `Category "${formCategoryName}" updated successfully!`,
          "success",
        );
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save category");
      console.error("[CategoryPage] Submit error:", err);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Soft Delete
  // -------------------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementCategoryApi.deleteCategory(deleteTarget.uuid);
      showToast(
        `Category "${deleteTarget.name}" moved to deleted records`,
        "info",
      );
      setDeleteTarget(null);
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete category");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Restore
  // -------------------------------------------------------------
  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setIsActionLoading(true);
    try {
      await procurementCategoryApi.restoreCategory(restoreTarget.uuid);
      showToast(
        `Category "${restoreTarget.name}" restored to active list!`,
        "success",
      );
      setRestoreTarget(null);
      await loadCategories();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore category");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Sort Handler
  const handleSort = (field: "createdAt" | "name" | "code" | "type") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
  };

  // Pagination display values
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
              {viewMode === "deleted"
                ? "Deleted Category List"
                : "Category List"}
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* +Add Category Button (Visible in Active Mode) */}
            {viewMode === "active" && (
              <button
                id="add-category-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            )}

            {/* Dedicated Button for Deleted / Active Mode */}
            {viewMode === "active" ? (
              <button
                id="view-deleted-categories-btn"
                onClick={() => {
                  setViewMode("deleted");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="View all soft-deleted categories"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Deleted Categories</span>
                {deletedCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {deletedCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="view-active-categories-btn"
                onClick={() => {
                  setViewMode("active");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="Back to active categories"
              >
                <FolderTree className="w-4 h-4 stroke-[2.5]" />
                <span>Active Categories</span>
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
                categories ({totalEntries} records). Click the green{" "}
                <strong>Restore</strong> button on any row to return it to the
                active list.
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
        <div className="w-full bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
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
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
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
                onClick={() => loadCategories()}
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
                    className="w-40 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all pr-7"
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
          {/* CATEGORY TABLE                                            */}
          {/* ========================================================= */}
          <div className="overflow-x-auto relative min-h-[220px]">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex items-center justify-center backdrop-blur-2xs">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading categories...</span>
                </div>
              </div>
            )}

            <table className="w-full text-left border-collapse">
              {/* Table Header: Changes to Rose in Deleted Mode */}
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
                    className="py-2.5 px-3 w-[5%] min-w-[50px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>SL</span>
                  </th>

                  {/* TYPE Header */}
                  <th
                    onClick={() => handleSort("type")}
                    className="py-2.5 px-3 w-[10%] min-w-[90px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>TYPE</span>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-2.5 px-3 w-[12%] min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>CODE</span>
                  </th>

                  {/* NAME Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className="py-2.5 px-3 w-[25%] min-w-[180px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span>NAME</span>
                  </th>

                  {/* INVENTORY COA Header */}
                  <th className="py-2.5 px-3 w-[24%] min-w-[170px]">
                    <span>INVENTORY COA</span>
                  </th>

                  {/* CONSUMPTION COA Header */}
                  <th className="py-2.5 px-3 w-[24%] min-w-[170px]">
                    <span>CONSUMPTION COA</span>
                  </th>

                  {/* ACTION Header */}
                  <th className="py-2.5 px-2 w-[10%] min-w-[85px] text-center">
                    <span>ACTION</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12px] sm:text-[12.5px] text-slate-700 dark:text-slate-300">
                {fetchError ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-7 h-7 text-rose-500 stroke-[1.5]" />
                        <p className="text-sm text-rose-600 dark:text-rose-400">
                          {fetchError}
                        </p>
                        <button
                          onClick={() => loadCategories()}
                          className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded text-xs font-semibold hover:underline cursor-pointer"
                        >
                          Retry Request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const sl = (currentPage - 1) * entriesPerPage + index + 1;
                    const mapping = item.accountMapping;
                    const isDeleted = Boolean(item.deletedAt);

                    let inventoryText = "";
                    if (mapping) {
                      if (mapping.inventoryAccountType === "Create New") {
                        inventoryText = mapping.inventoryAccountGroupCode || "";
                      } else {
                        const acc = mapping.existingInventoryAccountId
                          ? accountLookup.get(
                              mapping.existingInventoryAccountId,
                            )
                          : null;
                        inventoryText = acc
                          ? `${acc.code} - ${acc.name}`
                          : mapping.existingInventoryAccountId || "";
                      }
                    }

                    let consumptionText = "";
                    if (mapping) {
                      if (mapping.consumptionAccountType === "Create New") {
                        consumptionText =
                          mapping.consumptionAccountGroupCode || "";
                      } else {
                        const acc = mapping.existingConsumptionAccountId
                          ? accountLookup.get(
                              mapping.existingConsumptionAccountId,
                            )
                          : null;
                        consumptionText = acc
                          ? `${acc.code} - ${acc.name}`
                          : mapping.existingConsumptionAccountId || "";
                      }
                    }

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
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-normal">
                          {sl}
                        </td>

                        {/* TYPE */}
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-normal">
                          {item.type || "Material"}
                        </td>

                        {/* CODE */}
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-normal">
                          {item.code || ""}
                        </td>

                        {/* NAME */}
                        <td className="py-2.5 px-3">
                          {!isDeleted ? (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-[#6366F1] dark:text-indigo-400 font-medium hover:underline text-left cursor-pointer"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-rose-600 font-medium px-1 rounded bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
                                Deleted
                              </span>
                            </div>
                          )}
                        </td>

                        {/* INVENTORY COA */}
                        <td
                          className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-normal"
                          title={inventoryText}
                        >
                          {inventoryText}
                        </td>

                        {/* CONSUMPTION COA */}
                        <td
                          className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-normal"
                          title={consumptionText}
                        >
                          {consumptionText}
                        </td>

                        {/* ACTION */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isDeleted ? (
                              <>
                                {/* Cyan Edit Button */}
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  title="Edit Category"
                                  className="w-7 h-7 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                                >
                                  <SquarePen className="w-3.5 h-3.5 stroke-[2]" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  title="Delete Category"
                                  className="w-7 h-7 rounded-md bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                                </button>
                              </>
                            ) : (
                              /* Restore Button */
                              <button
                                onClick={() => setRestoreTarget(item)}
                                title="Restore Category"
                                className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      <p className="text-sm">
                        {viewMode === "deleted"
                          ? "No deleted categories found"
                          : "No matching categories found"}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      )}
                      {viewMode === "deleted" && (
                        <button
                          onClick={() => setViewMode("active")}
                          className="mt-2 block mx-auto text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                        >
                          Go to Active Categories
                        </button>
                      )}
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
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
              {viewMode === "deleted" && " (Deleted Records)"}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 select-none">
              <button
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

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
      {/* MODAL: CATEGORY (ADD / EDIT)                              */}
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
                {modalMode === "edit" ? "Edit Category" : "Category"}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Row 1: Code, Name, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategoryCode}
                    onChange={(e) => setFormCategoryCode(e.target.value)}
                    placeholder="C9016095"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategoryName}
                    onChange={(e) => setFormCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="Material">Material</option>
                      <option value="Service">Service</option>
                      <option value="Asset">Asset</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Row 2: Inventory Mapping */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Inventory Account Mapping
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="inventoryMode"
                          checked={inventoryMode === "Create New"}
                          onChange={() => setInventoryMode("Create New")}
                          className="accent-[#6366F1]"
                        />
                        <span>Create New</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="inventoryMode"
                          checked={inventoryMode === "Existing"}
                          onChange={() => setInventoryMode("Existing")}
                          className="accent-[#6366F1]"
                        />
                        <span>Existing</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    {inventoryMode === "Create New" ? (
                      <>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Group Code / Name
                        </label>
                        <div className="relative">
                          <select
                            value={inventoryGroup}
                            onChange={(e) => setInventoryGroup(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="">Default (100-001-001)</option>
                            {INVENTORY_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Select Existing Account
                        </label>
                        <div className="relative">
                          <select
                            value={existingInventoryId}
                            onChange={(e) =>
                              setExistingInventoryId(e.target.value)
                            }
                            disabled={isAccountsLoading}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {realAccounts.map((acc) => (
                              <option key={acc.uuid} value={acc.uuid}>
                                {acc.code} - {acc.name} ({acc.sourceType})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Consumption Mapping */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Consumption Account Mapping
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="consumptionMode"
                          checked={consumptionMode === "Create New"}
                          onChange={() => setConsumptionMode("Create New")}
                          className="accent-[#6366F1]"
                        />
                        <span>Create New</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="consumptionMode"
                          checked={consumptionMode === "Existing"}
                          onChange={() => setConsumptionMode("Existing")}
                          className="accent-[#6366F1]"
                        />
                        <span>Existing</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    {consumptionMode === "Create New" ? (
                      <>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Group Code / Name
                        </label>
                        <div className="relative">
                          <select
                            value={consumptionGroup}
                            onChange={(e) =>
                              setConsumptionGroup(e.target.value)
                            }
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="">Default (500-001-001)</option>
                            {CONSUMPTION_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Select Existing Account
                        </label>
                        <div className="relative">
                          <select
                            value={existingConsumptionId}
                            onChange={(e) =>
                              setExistingConsumptionId(e.target.value)
                            }
                            disabled={isAccountsLoading}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {realAccounts.map((acc) => (
                              <option key={acc.uuid} value={acc.uuid}>
                                {acc.code} - {acc.name} ({acc.sourceType})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </>
                    )}
                  </div>
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
      {/* DELETE CONFIRMATION DIALOG                                */}
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
              ? You can restore it anytime from the{" "}
              <span className="text-rose-600 font-semibold">
                Deleted Categories
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

      {/* ========================================================= */}
      {/* RESTORE CONFIRMATION DIALOG                               */}
      {/* ========================================================= */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-500" />
              <span>Confirm Restoration</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to restore{" "}
              <strong className="text-slate-900 dark:text-white">
                {restoreTarget.name}
              </strong>
              ? This will return the category back to the active list.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleRestoreConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isActionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
