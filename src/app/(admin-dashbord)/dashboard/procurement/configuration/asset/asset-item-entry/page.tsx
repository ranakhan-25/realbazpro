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
  Box,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import {
  procurementAssetItemEntryApi,
  BackendAssetItemEntry,
  AssetItemDropdownCategory,
  AssetItemDropdownBrand,
  AssetItemDropdownUnit,
  AssetItemDropdownChartOfGroup,
  CreateAssetItemPayload,
  UpdateAssetItemPayload,
  getAuthenticatedUserId,
} from "@/lib/procurement/procurementAssetItemEntryApi";
import { procurementBrandApi } from "@/lib/procurement/procurementBrandApi";

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

// Fallback Chart of Groups options if backend chartOfGroups is empty
const FALLBACK_CHART_OF_GROUPS: Array<{ id: number; name: string }> = [
  { id: 101, name: "Fixed Assets" },
  { id: 201, name: "Plant & Machinery" },
  { id: 301, name: "Vehicles & Transport" },
  { id: 401, name: "Office Equipment" },
  { id: 501, name: "IT Assets" },
  { id: 601, name: "Tools & Implements" },
  { id: 701, name: "Safety & Security" },
  { id: 801, name: "Capital Work In Progress" },
];

export default function AssetItemEntryPage() {
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
  const [items, setItems] = useState<BackendAssetItemEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Dropdown Options States (From Real API)
  // -------------------------------------------------------------
  const [categoryOptions, setCategoryOptions] = useState<
    AssetItemDropdownCategory[]
  >([]);
  const [brandOptions, setBrandOptions] = useState<AssetItemDropdownBrand[]>(
    [],
  );
  const [unitOptions, setUnitOptions] = useState<AssetItemDropdownUnit[]>([]);
  const [chartOfGroupOptions, setChartOfGroupOptions] = useState<
    Array<{ id: number; name: string }>
  >(FALLBACK_CHART_OF_GROUPS);

  // -------------------------------------------------------------
  // Query, Filter & Pagination States
  // -------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<
    "createdAt" | "name" | "item_code" | "purchase_price"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // -------------------------------------------------------------
  // Modal & Form States (Add / Edit)
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<BackendAssetItemEntry | null>(null);

  // Form Fields
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formName, setFormName] = useState("");
  const [formUnitId, setFormUnitId] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState<string>("");
  const [formChartOfGroupId, setFormChartOfGroupId] = useState<string>("");
  const [formCode, setFormCode] = useState("");

  // Quick Brand Add Modal
  const [showQuickBrandModal, setShowQuickBrandModal] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");
  const [isQuickBrandLoading, setIsQuickBrandLoading] = useState(false);

  // -------------------------------------------------------------
  // Details Modal States
  // -------------------------------------------------------------
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsItem, setDetailsItem] =
    useState<BackendAssetItemEntry | null>(null);

  // -------------------------------------------------------------
  // Dialog & Notification States
  // -------------------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<BackendAssetItemEntry | null>(null);
  const [restoreTarget, setRestoreTarget] =
    useState<BackendAssetItemEntry | null>(null);
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

  // Auto-generate suggested item code: e.g. AST-1001
  const generateAssetCode = () => {
    return `AST-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // -------------------------------------------------------------
  // Load Dropdown Options from Real API
  // -------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const data = await procurementAssetItemEntryApi.getDropdowns();
      setCategoryOptions(data.categories || []);
      setBrandOptions(data.brands || []);
      setUnitOptions(data.units || []);

      if (data.chartOfGroups && data.chartOfGroups.length > 0) {
        const mapped = data.chartOfGroups.map((cg, idx) => ({
          id: cg.id || idx + 1,
          name: cg.name,
        }));
        setChartOfGroupOptions(mapped);
      }
    } catch (err: unknown) {
      console.warn("Could not load asset item dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // -------------------------------------------------------------
  // Fetch Asset Items from Real Backend API
  // -------------------------------------------------------------
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const categoryFilterParam =
        selectedCategoryFilter !== "all" ? selectedCategoryFilter : undefined;
      const brandFilterParam =
        selectedBrandFilter !== "all" ? selectedBrandFilter : undefined;

      if (viewMode === "deleted") {
        // In Deleted Mode: query with withDeleted: true and filter strictly deleted records
        const res = await procurementAssetItemEntryApi.getItems({
          page: 1,
          limit: 100,
          search: debouncedSearch.trim() || undefined,
          category_id: categoryFilterParam,
          brand_id: brandFilterParam,
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
          procurementAssetItemEntryApi.getItems({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            category_id: categoryFilterParam,
            brand_id: brandFilterParam,
            sortBy: sortField,
            sortOrder: sortDirection,
          }),
          procurementAssetItemEntryApi.getItems({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item that has deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setItems(activeOnly);

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
          if (!debouncedSearch && selectedCategoryFilter === "all" && selectedBrandFilter === "all") {
            setActiveCount(activeInAll);
          }
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load asset items");
      console.error("[AssetItemEntryPage] Error loading items:", err);
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
    selectedBrandFilter,
    sortField,
    sortDirection,
    showToast,
  ]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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
  // Sorting Handler
  // -------------------------------------------------------------
  const handleSort = (
    field: "createdAt" | "name" | "item_code" | "purchase_price",
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
  // View Details Modal Handler (GET /procurement/asset-item-entry/:uuid)
  // -------------------------------------------------------------
  const handleOpenDetailsModal = async (item: BackendAssetItemEntry) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    setDetailsItem(item); // Optimistic preliminary display
    try {
      const freshData = await procurementAssetItemEntryApi.getItem(item.uuid);
      setDetailsItem(freshData);
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to fetch item details");
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
    setSelectedItem(null);
    setFormCode(generateAssetCode());
    setFormName("");
    setFormCategoryId(
      categoryOptions.length > 0 ? categoryOptions[0].uuid : "",
    );
    setFormUnitId(unitOptions.length > 0 ? unitOptions[0].uuid : "");
    setFormBrandId(brandOptions.length > 0 ? brandOptions[0].uuid : "");
    setFormPurchasePrice("");
    setFormChartOfGroupId("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: BackendAssetItemEntry) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormCode(item.item_code || "");
    setFormName(item.name || "");
    setFormCategoryId(item.category_id || item.category?.uuid || "");
    setFormUnitId(item.unit_id || item.unit?.uuid || "");
    setFormBrandId(item.brand_id || item.brand?.uuid || "");
    setFormPurchasePrice(
      item.purchase_price !== null && item.purchase_price !== undefined
        ? String(item.purchase_price)
        : "",
    );
    setFormChartOfGroupId(
      item.chart_of_group_id !== null && item.chart_of_group_id !== undefined
        ? String(item.chart_of_group_id)
        : "",
    );
    setIsModalOpen(true);
  };

  // -------------------------------------------------------------
  // Quick Add Brand (Real API POST /procurement/brand)
  // -------------------------------------------------------------
  const handleQuickAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) {
      showToast("Please enter brand name", "error");
      return;
    }

    setIsQuickBrandLoading(true);
    try {
      const newBrandCode = `BR${Math.floor(100000000 + Math.random() * 900000000)}`;
      const newBrand = await procurementBrandApi.createBrand({
        code: newBrandCode,
        name: quickBrandName.trim(),
        createdBy: getAuthenticatedUserId(),
      });

      showToast(`Brand "${newBrand.name}" added successfully!`, "success");
      await loadDropdowns();
      setFormBrandId(newBrand.uuid);
      setQuickBrandName("");
      setShowQuickBrandModal(false);
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to create brand");
      showToast(msg, "error");
    } finally {
      setIsQuickBrandLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Form Submit (POST / or PATCH /:uuid)
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast("Please enter an item name", "error");
      return;
    }
    if (!formCategoryId.trim()) {
      showToast("Please select a category", "error");
      return;
    }
    if (!formUnitId.trim()) {
      showToast("Please select a unit", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const authUserId = getAuthenticatedUserId();
      const numericPrice = formPurchasePrice ? Number(formPurchasePrice) : 0;
      const numericChartOfGroup = formChartOfGroupId
        ? Number(formChartOfGroupId)
        : undefined;

      if (modalMode === "add") {
        const payload: CreateAssetItemPayload = {
          item_code: formCode.trim() || undefined,
          name: formName.trim(),
          category_id: formCategoryId.trim(),
          unit_id: formUnitId.trim(),
          brand_id: formBrandId.trim() || undefined,
          purchase_price: isNaN(numericPrice) ? 0 : numericPrice,
          chart_of_group_id: numericChartOfGroup,
          createdBy: authUserId,
        };

        await procurementAssetItemEntryApi.createItem(payload);
        showToast(
          `Asset item "${formName.trim()}" created successfully!`,
          "success",
        );
      } else if (modalMode === "edit" && selectedItem) {
        const payload: UpdateAssetItemPayload = {
          item_code: formCode.trim() || undefined,
          name: formName.trim(),
          category_id: formCategoryId.trim(),
          unit_id: formUnitId.trim(),
          brand_id: formBrandId.trim() || undefined,
          purchase_price: isNaN(numericPrice) ? 0 : numericPrice,
          chart_of_group_id: numericChartOfGroup,
          createdBy: authUserId,
        };

        await procurementAssetItemEntryApi.updateItem(
          selectedItem.uuid,
          payload,
        );
        showToast(
          `Asset item "${formName.trim()}" updated successfully!`,
          "success",
        );
      }

      setIsModalOpen(false);
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to save asset item");
      console.error("[AssetItemEntryPage] Submit error:", err);
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
      await procurementAssetItemEntryApi.deleteItem(deleteTarget.uuid);
      showToast(
        `Asset item "${deleteTarget.name}" moved to deleted records`,
        "info",
      );
      setDeleteTarget(null);
      if (isDetailsOpen && detailsItem?.uuid === deleteTarget.uuid) {
        setIsDetailsOpen(false);
      }
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete asset item");
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
      await procurementAssetItemEntryApi.restoreItem(restoreTarget.uuid);
      showToast(
        `Asset item "${restoreTarget.name}" restored to active list!`,
        "success",
      );
      setRestoreTarget(null);
      if (isDetailsOpen && detailsItem?.uuid === restoreTarget.uuid) {
        setIsDetailsOpen(false);
      }
      await loadItems();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore asset item");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Export CSV & Print
  // -------------------------------------------------------------
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (displayedItems.length === 0) {
      showToast("No data to export", "info");
      return;
    }
    const headers = [
      "ID",
      "CODE",
      "NAME",
      "CATEGORY",
      "UNIT",
      "BRAND",
      "PURCHASE PRICE",
    ];
    const rows = displayedItems.map((it, idx) => [
      (currentPage - 1) * entriesPerPage + idx + 1,
      `"${it.item_code || ""}"`,
      `"${it.name || ""}"`,
      `"${it.category?.name || ""}"`,
      `"${it.unit?.name || ""}"`,
      `"${it.brand?.name || ""}"`,
      it.purchase_price,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `asset_items_${viewMode}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export generated successfully!", "success");
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
              Asset Item Entry
            </span>
          </nav>

          {/* Action Buttons (+Item Add, PDF, Excel, Print, Back) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {viewMode === "active" && (
              <button
                id="add-asset-item-btn"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Item Add</span>
              </button>
            )}

            {/* PDF Button (Coral/Red) */}
            <button
              onClick={handlePrint}
              title="Print to PDF"
              className="flex items-center gap-1 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>PDF</span>
            </button>

            {/* Excel Button */}
            <button
              onClick={handleExportCSV}
              title="Export as CSV"
              className="flex items-center gap-1 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>Excel</span>
            </button>

            {/* Quick Export/Print Icon Button (Cyan) */}
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
              <span>Back</span>
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
              <Box className="w-3.5 h-3.5" />
              <span>Active Items</span>
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
              <span>Deleted Items</span>
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
                Viewing soft-deleted asset items in <strong>Recycle Bin</strong>.
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
              Return to Active Items
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD CONTAINER: Controls + Table + Pagination             */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Controls Header: Show entries, Filters, & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800 text-sm">
            {/* Show entries & Filters */}
            <div className="flex items-center gap-3 flex-wrap">
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

              {/* Category Filter */}
              <div className="relative inline-block">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>

              {/* Brand Filter */}
              <div className="relative inline-block">
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => {
                    setSelectedBrandFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">All Brands</option>
                  {brandOptions.map((b) => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
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
                    placeholder="Search asset item..."
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
                onClick={loadItems}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* ASSET ITEM TABLE                                          */}
          {/* ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Vibrant Lavender/Purple Table Header */}
              <thead>
                <tr className="bg-[#6366F1] dark:bg-[#5558E6] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                  {/* ID Header */}
                  <th className="py-3 px-4 w-[6%]">
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                    </div>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("item_code")}
                    className="py-3 px-4 w-[12%] cursor-pointer hover:bg-white/10 transition-colors"
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
                    className="py-3 px-4 w-[24%] cursor-pointer hover:bg-white/10 transition-colors"
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
                  <th className="py-3 px-4 w-[16%]">
                    <div className="flex items-center gap-1">
                      <span>CATEGORY</span>
                    </div>
                  </th>

                  {/* UNIT Header */}
                  <th className="py-3 px-4 w-[10%]">
                    <div className="flex items-center gap-1">
                      <span>UNIT</span>
                    </div>
                  </th>

                  {/* BRAND Header */}
                  <th className="py-3 px-4 w-[10%]">
                    <div className="flex items-center gap-1">
                      <span>BRAND</span>
                    </div>
                  </th>

                  {/* PURCHASE PRICE Header */}
                  <th
                    onClick={() => handleSort("purchase_price")}
                    className="py-3 px-4 w-[10%] cursor-pointer hover:bg-white/10 transition-colors text-right"
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

                  {/* ACTION Header */}
                  <th className="py-3 px-4 w-[12%] text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>ACTION</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Loading asset items...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const idNumber =
                      (currentPage - 1) * entriesPerPage + index + 1;
                    const isDeleted = Boolean(item.deletedAt);
                    const parsedPrice = Number(item.purchase_price) || 0;

                    return (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                      >
                        {/* ID */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          {idNumber}
                        </td>

                        {/* CODE */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {item.item_code || "—"}
                        </td>

                        {/* NAME (Clickable to view details) */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenDetailsModal(item)}
                            title="Click to view details"
                            className="text-slate-800 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-indigo-400 font-normal hover:underline text-left cursor-pointer transition-colors"
                          >
                            {item.name}
                          </button>
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.category?.name || "—"}
                        </td>

                        {/* UNIT */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.unit?.name || "—"}
                        </td>

                        {/* BRAND */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                          {item.brand?.name || "—"}
                        </td>

                        {/* PURCHASE PRICE */}
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {parsedPrice.toLocaleString()}
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
                                  title="Edit Asset Item"
                                  className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <SquarePen className="w-4 h-4 stroke-[2]" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  title="Soft Delete Asset Item"
                                  className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 stroke-[2]" />
                                </button>
                              </>
                            ) : (
                              /* Restore Button in Deleted Mode */
                              <button
                                onClick={() => setRestoreTarget(item)}
                                title="Restore Asset Item"
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
                      colSpan={8}
                      className="text-center py-12 text-slate-500 dark:text-slate-400 text-[13px] font-normal"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Box className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {viewMode === "active"
                            ? "No asset items found"
                            : "No deleted asset items"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {viewMode === "active"
                            ? debouncedSearch || selectedCategoryFilter !== "all" || selectedBrandFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "Click '+ Item Add' above to create your first asset item."
                            : "Deleted items moved to the recycle bin will appear here."}
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
      {/* MODAL: NEW ITEM / EDIT ITEM                               */}
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
                {modalMode === "edit"
                  ? "Update Asset Item"
                  : "New Asset Item"}
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
              {/* Row 1: Category, Brand, Item Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((c) => (
                        <option key={c.uuid} value={c.uuid}>
                          {c.name} {c.code ? `(${c.code})` : ""}
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
                        value={formBrandId}
                        onChange={(e) => setFormBrandId(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                      >
                        <option value="">Select Brand</option>
                        {brandOptions.map((b) => (
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
                    placeholder="e.g. Office Generator"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Unit, Purchase Price, Chart Of Groups */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formUnitId}
                      onChange={(e) => setFormUnitId(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Unit</option>
                      {unitOptions.map((u) => (
                        <option key={u.uuid} value={u.uuid}>
                          {u.name} {u.code ? `(${u.code})` : ""}
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
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Chart Of Groups */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chart Of Groups
                  </label>
                  <div className="relative">
                    <select
                      value={formChartOfGroupId}
                      onChange={(e) => setFormChartOfGroupId(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Option</option>
                      {chartOfGroupOptions.map((cg) => (
                        <option key={cg.id} value={cg.id}>
                          {cg.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Row 3: Item Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Item Code
                    </label>
                    {modalMode === "add" && (
                      <button
                        type="button"
                        onClick={() => setFormCode(generateAssetCode())}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Generate Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. AST-0001 (auto-generated if omitted)"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>
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
      {/* QUICK BRAND ADD MODAL                                     */}
      {/* ========================================================= */}
      {showQuickBrandModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Quick Add Brand
            </h3>
            <form onSubmit={handleQuickAddBrand} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={quickBrandName}
                onChange={(e) => setQuickBrandName(e.target.value)}
                placeholder="Enter Brand Name"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isQuickBrandLoading}
                  onClick={() => setShowQuickBrandModal(false)}
                  className="px-3 py-1.5 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQuickBrandLoading}
                  className="px-4 py-1.5 text-xs rounded bg-[#6366F1] text-white font-medium shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isQuickBrandLoading && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  <span>Add Brand</span>
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
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[620px] overflow-hidden animate-in zoom-in-95 duration-150"
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
                    Asset Item Details
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
                        Item Name
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {detailsItem.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Item Code
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {detailsItem.item_code || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Category
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {detailsItem.category?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Unit
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {detailsItem.unit?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Brand
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {detailsItem.brand?.name || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">
                        Purchase Price
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {Number(detailsItem.purchase_price || 0).toLocaleString()}
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
              ? It will be moved to the <strong>Deleted Items</strong> list where it
              can be restored at any time.
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
              Confirm Item Restoration
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to restore{" "}
              <strong className="text-slate-900 dark:text-white">
                {restoreTarget.name}
              </strong>{" "}
              back to the <strong>Active Items</strong> list?
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
