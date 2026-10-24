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
  Package,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import {
  procurementItemEntryApi,
  BackendItemEntry,
  ItemEntryDropdownCategory,
  ItemEntryDropdownSubCategory,
  ItemEntryDropdownBrand,
  ItemEntryDropdownUnit,
  getAuthenticatedUserId,
} from "@/lib/procurementItemEntryApi";
import { procurementBrandApi } from "@/lib/procurementBrandApi";

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

export default function ItemEntryPage() {
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
  const [items, setItems] = useState<BackendItemEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dropdown States
  const [categories, setCategories] = useState<ItemEntryDropdownCategory[]>([]);
  const [subCategories, setSubCategories] = useState<
    ItemEntryDropdownSubCategory[]
  >([]);
  const [brands, setBrands] = useState<ItemEntryDropdownBrand[]>([]);
  const [units, setUnits] = useState<ItemEntryDropdownUnit[]>([]);

  // Top Filter Bar State
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");

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
    "createdAt" | "name" | "item_code" | "purchase_price" | "sale_price"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BackendItemEntry | null>(
    null,
  );

  // Form Fields
  const [formCategory, setFormCategory] = useState("");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formCode, setFormCode] = useState("");

  // Quick Brand Add State (When clicking "+" next to Brand in Modal)
  const [showQuickBrandModal, setShowQuickBrandModal] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");
  const [isQuickBrandSubmitting, setIsQuickBrandSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Dialog & Notification States
  // -------------------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendItemEntry | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<BackendItemEntry | null>(
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

  // Auto-generate code: e.g. Item 1447 or ITM48921
  const generateItemCode = () => {
    return `Item ${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // -------------------------------------------------------------
  // Load Dropdowns from Backend API
  // -------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const data = await procurementItemEntryApi.getDropdowns();
      setCategories(data.categories || []);
      setSubCategories(data.subCategories || []);
      setBrands(data.brands || []);
      setUnits(data.units || []);
    } catch (err: unknown) {
      console.error("[ItemEntryPage] Error loading dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // -------------------------------------------------------------
  // Fetch Items from Real Backend API
  // -------------------------------------------------------------
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (viewMode === "deleted") {
        // In Deleted Mode: query with withDeleted: true, filter strictly deleted
        const res = await procurementItemEntryApi.getItems({
          page: 1,
          limit: 100,
          search: debouncedSearch.trim() || undefined,
          categoryId: filterCategory || undefined,
          subCategoryId: filterSubCategory || undefined,
          sortBy: sortField,
          sortOrder: sortDirection,
          withDeleted: true,
        });

        const allItems = res.data || [];
        const onlyDeleted = allItems.filter((item) => Boolean(item.deletedAt));
        const onlyActive = allItems.filter((item) => !item.deletedAt);

        setDeletedCount(onlyDeleted.length);
        setActiveCount(onlyActive.length);
        setItems(onlyDeleted);
        setTotalEntries(onlyDeleted.length);
        setTotalPages(
          Math.max(1, Math.ceil(onlyDeleted.length / entriesPerPage)),
        );
      } else {
        // In Active Mode: query active items + background check of deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementItemEntryApi.getItems({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            categoryId: filterCategory || undefined,
            subCategoryId: filterSubCategory || undefined,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementItemEntryApi.getItems({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item with deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setItems(activeOnly);
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
          if (!debouncedSearch && !filterCategory && !filterSubCategory) {
            setActiveCount(activeInAll);
          }
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load items");
      console.error("[ItemEntryPage] Error loading items:", err);
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
    filterCategory,
    filterSubCategory,
    sortField,
    sortDirection,
    showToast,
  ]);

  // Initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // -------------------------------------------------------------
  // Filtered sub-categories based on selected category in form & filter
  // -------------------------------------------------------------
  const availableFormSubCategories = useMemo(() => {
    if (!formCategory) return subCategories;
    return subCategories.filter((sc) => sc.categoryId === formCategory);
  }, [formCategory, subCategories]);

  const availableFilterSubCategories = useMemo(() => {
    if (!filterCategory) return subCategories;
    return subCategories.filter((sc) => sc.categoryId === filterCategory);
  }, [filterCategory, subCategories]);

  // -------------------------------------------------------------
  // Displayed items calculation (strictly isolates active and deleted)
  // -------------------------------------------------------------
  const displayedItems = useMemo(() => {
    if (viewMode === "deleted") {
      const start = (currentPage - 1) * entriesPerPage;
      return items
        .filter((item) => Boolean(item.deletedAt))
        .slice(start, start + entriesPerPage);
    }
    // In active mode: strictly ONLY active items, never deleted
    return items.filter((item) => !item.deletedAt);
  }, [viewMode, items, currentPage, entriesPerPage]);

  // -------------------------------------------------------------
  // Modal Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedItem(null);
    setFormCategory(filterCategory || (categories[0]?.uuid ?? ""));
    setFormSubCategory(filterSubCategory || "");
    setFormBrand(brands[0]?.uuid ?? "");
    setFormUnit(units[0]?.uuid ?? "");
    setFormName("");
    setFormPurchasePrice("");
    setFormSalePrice("");
    setFormCode(generateItemCode());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: BackendItemEntry) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormCategory(item.category_id || item.category?.uuid || "");
    setFormSubCategory(item.sub_category_id || item.sub_category?.uuid || "");
    setFormBrand(item.brand_id || item.brand?.uuid || "");
    setFormUnit(item.unit_id || item.unit?.uuid || "");
    setFormName(item.name || "");
    setFormPurchasePrice(
      item.purchase_price !== undefined && item.purchase_price !== null
        ? String(parseFloat(String(item.purchase_price)))
        : "",
    );
    setFormSalePrice(
      item.sale_price !== undefined && item.sale_price !== null
        ? String(parseFloat(String(item.sale_price)))
        : "",
    );
    setFormCode(item.item_code || "");
    setIsModalOpen(true);

    // Fetch fresh details from backend
    try {
      const fresh = await procurementItemEntryApi.getItem(item.uuid);
      if (fresh) {
        setFormCategory(fresh.category_id || fresh.category?.uuid || "");
        setFormSubCategory(
          fresh.sub_category_id || fresh.sub_category?.uuid || "",
        );
        setFormBrand(fresh.brand_id || fresh.brand?.uuid || "");
        setFormUnit(fresh.unit_id || fresh.unit?.uuid || "");
        setFormName(fresh.name || "");
        setFormPurchasePrice(
          fresh.purchase_price !== undefined && fresh.purchase_price !== null
            ? String(parseFloat(String(fresh.purchase_price)))
            : "",
        );
        setFormSalePrice(
          fresh.sale_price !== undefined && fresh.sale_price !== null
            ? String(parseFloat(String(fresh.sale_price)))
            : "",
        );
        setFormCode(fresh.item_code || "");
      }
    } catch (err) {
      console.warn(
        "[ItemEntryPage] Could not fetch fresh details, using cache:",
        err,
      );
    }
  };

  // -------------------------------------------------------------
  // Quick Brand Add Handler (Creates real brand in backend)
  // -------------------------------------------------------------
  const handleQuickAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) return;

    setIsQuickBrandSubmitting(true);
    try {
      const newBrandCode = `BR${Math.floor(100000000 + Math.random() * 900000000)}`;
      const createdBrand = await procurementBrandApi.createBrand({
        code: newBrandCode,
        name: quickBrandName.trim(),
        createdBy: getAuthenticatedUserId(),
      });

      // Refresh dropdowns & select newly created brand
      await loadDropdowns();
      setFormBrand(createdBrand.uuid);
      setQuickBrandName("");
      setShowQuickBrandModal(false);
      showToast(
        `Brand "${createdBrand.name}" created and selected!`,
        "success",
      );
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to create brand");
      showToast(msg, "error");
    } finally {
      setIsQuickBrandSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Form Submit (Create / Update Item Entry)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter an item name", "error");
      return;
    }

    const pPrice = parseFloat(formPurchasePrice || "0");
    const sPrice = parseFloat(formSalePrice || "0");

    if (isNaN(pPrice) || pPrice < 0) {
      showToast("Purchase price must be a valid positive number", "error");
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      showToast("Sale price must be a valid positive number", "error");
      return;
    }

    const codeToUse = formCode.trim() || generateItemCode();
    const userId = getAuthenticatedUserId();

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await procurementItemEntryApi.createItem({
          item_code: codeToUse,
          name: formName.trim(),
          purchase_price: pPrice,
          sale_price: sPrice,
          category_id: formCategory || undefined,
          sub_category_id: formSubCategory || undefined,
          brand_id: formBrand || undefined,
          unit_id: formUnit || undefined,
          createdBy: userId,
        });
        showToast(`Item "${formName.trim()}" created successfully!`, "success");
      } else if (modalMode === "edit" && selectedItem) {
        await procurementItemEntryApi.updateItem(selectedItem.uuid, {
          item_code: codeToUse,
          name: formName.trim(),
          purchase_price: pPrice,
          sale_price: sPrice,
          category_id: formCategory || undefined,
          sub_category_id: formSubCategory || undefined,
          brand_id: formBrand || undefined,
          unit_id: formUnit || undefined,
        });
        showToast(`Item "${formName.trim()}" updated successfully!`, "success");
      }

      setIsModalOpen(false);
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save item");
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
      await procurementItemEntryApi.deleteItem(deleteTarget.uuid);
      showToast(`Item "${deleteTarget.name}" moved to Recycle Bin`, "info");
      setDeleteTarget(null);
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete item");
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
      await procurementItemEntryApi.restoreItem(restoreTarget.uuid);
      showToast(
        `Item "${restoreTarget.name}" restored successfully!`,
        "success",
      );
      setRestoreTarget(null);
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore item");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Sorting Handler
  // -------------------------------------------------------------
  const handleSort = (
    field: "createdAt" | "name" | "item_code" | "purchase_price" | "sale_price",
  ) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // Export CSV
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "CODE",
      "NAME",
      "CATEGORY",
      "SUB CATEGORY",
      "UNIT",
      "BRAND",
      "PURCHASE PRICE",
      "SALE PRICE",
    ];
    const rows = displayedItems.map((it, idx) => [
      idx + 1,
      `"${it.item_code || ""}"`,
      `"${it.name || ""}"`,
      `"${it.category?.name || ""}"`,
      `"${it.sub_category?.name || ""}"`,
      `"${it.unit?.name || ""}"`,
      `"${it.brand?.name || ""}"`,
      it.purchase_price,
      it.sale_price,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `item_list_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export generated!", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  // Format price helper
  const formatPrice = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === "") return "0.00";
    const num = parseFloat(String(val));
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
              {viewMode === "deleted" ? "Deleted Item List" : "Item List"}
            </span>
          </nav>

          {/* Action Buttons (+Item Add, PDF, Excel, Print, Deleted Button, Back) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* +Item Add Button (Visible in Active Mode) */}
            {viewMode === "active" && (
              <button
                id="add-item-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Item Add</span>
              </button>
            )}

            {/* Dedicated Button for Deleted / Active Mode */}
            {viewMode === "active" ? (
              <button
                id="view-deleted-items-btn"
                onClick={() => {
                  setViewMode("deleted");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="View all soft-deleted items"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Deleted Items</span>
                {deletedCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {deletedCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="view-active-items-btn"
                onClick={() => {
                  setViewMode("active");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                title="Back to active items"
              >
                <Package className="w-4 h-4 stroke-[2.5]" />
                <span>Active Items</span>
                {activeCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/25 text-white rounded-full text-[11px] font-bold leading-none">
                    {activeCount}
                  </span>
                )}
              </button>
            )}

            {/* PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>PDF</span>
            </button>

            {/* Excel Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              title="Print Table"
              className="w-9 h-9 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-sm transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2]" />
            </button>

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
              <Package className="w-3.5 h-3.5" />
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
                Viewing soft-deleted items in <strong>Recycle Bin</strong>.
                Click <strong>Restore</strong> on any item to reactivate it.
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
        {/* TOP FILTER SECTION (Real API Category & Sub-Category)     */}
        {/* ========================================================= */}
        <div className="bg-[#EDEDFA]/60 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterSubCategory("");
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.uuid} value={c.uuid}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Sub Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sub Category
              </label>
              <div className="relative">
                <select
                  value={filterSubCategory}
                  onChange={(e) => {
                    setFilterSubCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                >
                  <option value="">All Sub Categories</option>
                  {availableFilterSubCategories.map((sc) => (
                    <option key={sc.uuid} value={sc.uuid}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>
        </div>

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
                onClick={loadItems}
                disabled={isLoading}
                title="Refresh items list"
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
                    placeholder="Search items..."
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
          {/* ITEM TABLE                                                */}
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
                  <th className="py-3 px-4 w-[5%]">
                    <span>ID</span>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("item_code")}
                    className="py-3 px-4 w-[11%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>CODE</span>
                      {sortField === "item_code" ? (
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
                    className="py-3 px-4 w-[19%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
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

                  {/* CATEGORY Header */}
                  <th className="py-3 px-4 w-[13%]">
                    <span>CATEGORY</span>
                  </th>

                  {/* SUB CATEGORY Header */}
                  <th className="py-3 px-4 w-[13%]">
                    <span>SUB CATEGORY</span>
                  </th>

                  {/* UNIT Header */}
                  <th className="py-3 px-4 w-[8%]">
                    <span>UNIT</span>
                  </th>

                  {/* BRAND Header */}
                  <th className="py-3 px-4 w-[9%]">
                    <span>BRAND</span>
                  </th>

                  {/* PURCHASE PRICE Header */}
                  <th
                    onClick={() => handleSort("purchase_price")}
                    className="py-3 px-4 w-[11%] cursor-pointer hover:bg-white/10 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>PURCHASE PRICE</span>
                      {sortField === "purchase_price" ? (
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

                  {/* SALE PRICE Header */}
                  <th
                    onClick={() => handleSort("sale_price")}
                    className="py-3 px-4 w-[10%] cursor-pointer hover:bg-white/10 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>SALE PRICE</span>
                      {sortField === "sale_price" ? (
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
                  <th className="py-3 px-4 w-[9%] text-center">
                    <span>ACTION</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="w-7 h-7 animate-spin text-[#6366F1]" />
                        <span className="text-xs font-medium">
                          Loading items from backend...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2 text-rose-500">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          {fetchError}
                        </span>
                        <button
                          onClick={loadItems}
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
                          {item.item_code || ""}
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

                        {/* CATEGORY */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.category?.name || "-"}
                        </td>

                        {/* SUB CATEGORY */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.sub_category?.name || "-"}
                        </td>

                        {/* UNIT */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.unit?.name || "-"}
                        </td>

                        {/* BRAND */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.brand?.name || "-"}
                        </td>

                        {/* PURCHASE PRICE */}
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {formatPrice(item.purchase_price)}
                        </td>

                        {/* SALE PRICE */}
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {formatPrice(item.sale_price)}
                        </td>

                        {/* ACTION */}
                        <td className="py-2.5 px-4 text-center">
                          {viewMode === "active" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Cyan Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Item"
                                className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <SquarePen className="w-4 h-4 stroke-[2]" />
                              </button>

                              {/* Coral/Red Delete Button */}
                              <button
                                onClick={() => setDeleteTarget(item)}
                                title="Delete Item"
                                className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[2]" />
                              </button>
                            </div>
                          ) : (
                            /* Restore Action for Deleted Items */
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setRestoreTarget(item)}
                                title="Restore Item"
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
                      colSpan={10}
                      className="text-center py-12 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-7 h-7 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        <p className="text-sm">
                          {viewMode === "deleted"
                            ? "No deleted items found in Recycle Bin"
                            : "No matching items found"}
                        </p>
                        {(search || filterCategory || filterSubCategory) && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setFilterCategory("");
                              setFilterSubCategory("");
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Clear all filters
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
      {/* MODAL: ADD / EDIT ITEM                                    */}
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
                {modalMode === "edit" ? "Update Item" : "New Item"}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row 1: Category, Sub Category, Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setFormSubCategory("");
                      }}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.uuid} value={c.uuid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sub Category
                  </label>
                  <div className="relative">
                    <select
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Sub Category</option>
                      {availableFormSubCategories.map((sc) => (
                        <option key={sc.uuid} value={sc.uuid}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Brand with Inline "+" Button */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Brand
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                      >
                        <option value="">Select Brand</option>
                        {brands.map((b) => (
                          <option key={b.uuid} value={b.uuid}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                    {/* Inline Quick Add Brand Button */}
                    <button
                      type="button"
                      onClick={() => setShowQuickBrandModal(true)}
                      title="Add New Brand"
                      className="w-8 h-8 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Item Name, Unit, Purchase Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Item Name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Unit</option>
                      {units.map((u) => (
                        <option key={u.uuid} value={u.uuid}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="Enter Purchase Price"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Sale Price, Item Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="Sale Price"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                {/* Item Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. Item 1447"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
      {/* QUICK BRAND ADD MODAL                                     */}
      {/* ========================================================= */}
      {showQuickBrandModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Add New Brand
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickBrandModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddBrand} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  placeholder="e.g. Holcim Cement"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isQuickBrandSubmitting}
                  onClick={() => setShowQuickBrandModal(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQuickBrandSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isQuickBrandSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add Brand</span>
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
                  Move item to Recycle Bin
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to soft-delete{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name}
              </strong>
              ? You can restore it anytime from the{" "}
              <strong>Deleted Items</strong> section.
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
                  Restore Item
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
              ? It will be moved back to the active item list immediately.
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
