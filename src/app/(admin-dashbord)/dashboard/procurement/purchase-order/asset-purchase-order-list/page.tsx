/* eslint-disable prettier/prettier */
"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  Paperclip,
  RotateCcw,
  X,
  Upload,
  Trash2,
  Eye,
  Edit2,
  Loader2,
  AlertCircle,
  ArchiveRestore,
  ExternalLink,
  Printer,
  RefreshCw,
  PackageCheck,
} from "lucide-react";
import {
  procurementAssetPurchaseOrderApi,
  BackendAssetPurchaseOrder,
  BackendAssetPurchaseOrderItem,
  AssetPurchaseOrderDropdownsResult,
  AssetPODropdownItem,
  ProcurementAssetPurchaseOrderApprovalLayer,
  ProcurementAssetPurchaseOrderStatus,
  CreateAssetPurchaseOrderPayload,
  UpdateAssetPurchaseOrderPayload,
} from "@/lib/procurement/procurementAssetPurchaseOrderApi";
import { procurementAssetItemEntryApi } from "@/lib/procurement/procurementAssetItemEntryApi";

// -------------------------------------------------------------
// Helper: Error Parser
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Helper: Currency Formatter
// -------------------------------------------------------------
const formatCurrency = (amount: number | string | undefined | null) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// -------------------------------------------------------------
// Form Line Item Interface
// -------------------------------------------------------------
export interface AssetItemLineRow {
  tempId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function AssetPurchaseOrderPage() {
  // View mode: "list" vs "create" vs "edit"
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  // Active vs Deleted records tab
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // Orders Data States
  const [orders, setOrders] = useState<BackendAssetPurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pagination & Search States
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Sort State
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });

  // Action Menu Dropdown state
  const [activeActionUuid, setActiveActionUuid] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown Options State (Populated exclusively from Real API)
  const [dropdowns, setDropdowns] = useState<AssetPurchaseOrderDropdownsResult>(
    {
      companies: [],
      suppliers: [],
      projectTypes: [],
      projects: [],
      titleOfWorks: [],
      tasks: [],
      sites: [],
      categories: [],
      items: [],
      units: [],
      assetRequisitions: [],
      users: [],
    },
  );

  // Filter Bar State
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    companyId: "",
    supplierId: "",
    projectId: "",
    titleOfWorkId: "",
  });

  // Create / Edit Form State
  const [formDate, setFormDate] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );
  const [formSupplierId, setFormSupplierId] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formCompanyId, setFormCompanyId] = useState<string>("");
  const [formProjectTypeId, setFormProjectTypeId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formTitleOfWorkId, setFormTitleOfWorkId] = useState<string>("");
  const [formTaskId, setFormTaskId] = useState<string>("");
  const [formSiteId, setFormSiteId] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formRequisitionId, setFormRequisitionId] = useState<string>("");
  const [formReference, setFormReference] = useState<string>("");
  const [formAttachment, setFormAttachment] = useState<string>("");
  const [formApprovalLayer, setFormApprovalLayer] =
    useState<ProcurementAssetPurchaseOrderApprovalLayer>(
      ProcurementAssetPurchaseOrderApprovalLayer.PENDING,
    );
  const [formStatus, setFormStatus] =
    useState<ProcurementAssetPurchaseOrderStatus>(
      ProcurementAssetPurchaseOrderStatus.PENDING,
    );
  const [formSelectedItemUuid, setFormSelectedItemUuid] = useState<string>("");
  const [formAssetItems, setFormAssetItems] = useState<AssetItemLineRow[]>([]);

  // Modals
  const [viewOrder, setViewOrder] = useState<BackendAssetPurchaseOrder | null>(
    null,
  );
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] =
    useState<BackendAssetPurchaseOrder | null>(null);
  const [restoreTarget, setRestoreTarget] =
    useState<BackendAssetPurchaseOrder | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Quick Add Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCode, setNewSupplierCode] = useState("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newAssetData, setNewAssetData] = useState({
    code: "",
    name: "",
    categoryId: "",
    unitId: "",
    rate: "",
  });

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setActiveActionUuid(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------------------------------------------------------------
  // Load Dropdown Options from Real API
  // -------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const data = await procurementAssetPurchaseOrderApi.getDropdowns(
        formProjectId || undefined,
        formCategoryId || undefined,
      );
      setDropdowns(data);
    } catch (err) {
      console.warn("Could not load asset purchase order dropdowns:", err);
    }
  }, [formProjectId, formCategoryId]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // -------------------------------------------------------------
  // Fetch Orders from Real Backend API
  // -------------------------------------------------------------
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (recordsTab === "deleted") {
        // Query with withDeleted: true and filter strictly deleted records
        const res = await procurementAssetPurchaseOrderApi.getOrders({
          page: 1,
          limit: 100,
          search: debouncedSearch.trim() || undefined,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
          company_id: filters.companyId || undefined,
          supplier_id: filters.supplierId || undefined,
          project_id: filters.projectId || undefined,
          title_of_work_id: filters.titleOfWorkId || undefined,
          withDeleted: true,
        });

        const allRows = res.data || [];
        const onlyDeleted = allRows.filter((r) => Boolean(r.deletedAt));
        const onlyActive = allRows.filter((r) => !r.deletedAt);

        setDeletedCount(onlyDeleted.length);
        setActiveCount(onlyActive.length);
        setOrders(onlyDeleted);
        setTotalEntries(onlyDeleted.length);
        setTotalPages(
          Math.max(1, Math.ceil(onlyDeleted.length / entriesPerPage)),
        );
      } else {
        // In Active Mode: query active items + background check of deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementAssetPurchaseOrderApi.getOrders({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            date_from: filters.dateFrom || undefined,
            date_to: filters.dateTo || undefined,
            company_id: filters.companyId || undefined,
            supplier_id: filters.supplierId || undefined,
            project_id: filters.projectId || undefined,
            title_of_work_id: filters.titleOfWorkId || undefined,
          }),
          procurementAssetPurchaseOrderApi.getOrders({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item that has deletedAt
          const activeOnly = rawItems.filter((item) => !item.deletedAt);
          setOrders(activeOnly);

          const serverMeta = activeRes.value.meta;
          const totalFromMeta =
            serverMeta?.total !== undefined
              ? serverMeta.total
              : activeOnly.length;
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
          const allWithDeleted = withDeletedRes.value.data || [];
          const delCount = allWithDeleted.filter((r) =>
            Boolean(r.deletedAt),
          ).length;
          setDeletedCount(delCount);
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to load asset purchase orders from server",
      );
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    recordsTab,
    currentPage,
    entriesPerPage,
    debouncedSearch,
    filters,
    showToast,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filtered sites based on selected project
  const availableSites = useMemo(() => {
    if (!formProjectId) return dropdowns.sites;
    return dropdowns.sites.filter(
      (s) => !s.projectId || s.projectId === formProjectId,
    );
  }, [dropdowns.sites, formProjectId]);

  // Filtered asset items based on selected category
  const availableAssetItems = useMemo(() => {
    if (!formCategoryId) return dropdowns.items;
    return dropdowns.items.filter(
      (it) => !it.category_id || it.category_id === formCategoryId,
    );
  }, [dropdowns.items, formCategoryId]);

  // -------------------------------------------------------------
  // Add Asset Item to Form Lines
  // -------------------------------------------------------------
  const handleAddAssetItem = (itemUuid: string) => {
    const item = dropdowns.items.find((i) => i.uuid === itemUuid);
    if (!item) return;

    const existingIndex = formAssetItems.findIndex(
      (it) => it.itemId === item.uuid,
    );
    if (existingIndex >= 0) {
      setFormAssetItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? {
                ...it,
                quantity: it.quantity + 1,
                amount: (it.quantity + 1) * it.rate,
              }
            : it,
        ),
      );
      showToast(`Updated quantity for ${item.name}`, "info");
    } else {
      const defaultRate = Number(item.purchase_price) || 0;
      const unitName = item.unit?.name || "Unit";
      const newLine: AssetItemLineRow = {
        tempId: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        itemId: item.uuid,
        itemCode: item.item_code,
        itemName: item.name,
        details: item.name,
        unit: unitName,
        quantity: 1,
        rate: defaultRate,
        amount: defaultRate * 1,
      };
      setFormAssetItems((prev) => [...prev, newLine]);
      showToast(`Added ${item.name} to order lines`, "success");
    }
    setFormSelectedItemUuid("");
  };

  const handleUpdateItemLine = (
    tempId: string,
    field: "quantity" | "rate" | "details",
    value: string | number,
  ) => {
    setFormAssetItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        const updated = { ...it, [field]: value };
        if (field === "quantity" || field === "rate") {
          const qty =
            Number(field === "quantity" ? value : updated.quantity) || 0;
          const rate = Number(field === "rate" ? value : updated.rate) || 0;
          updated.amount = Number((qty * rate).toFixed(2));
        }
        return updated;
      }),
    );
  };

  const handleRemoveItemLine = (tempId: string) => {
    setFormAssetItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // Calculations
  const formSubTotal = useMemo(
    () => formAssetItems.reduce((acc, it) => acc + (it.amount || 0), 0),
    [formAssetItems],
  );
  const formGrandTotal = formSubTotal;

  // Reset form to clean state
  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormSupplierId("");
    setFormCode(`PUR${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormCompanyId("");
    setFormProjectTypeId("");
    setFormProjectId("");
    setFormTitleOfWorkId("");
    setFormTaskId("");
    setFormSiteId("");
    setFormCategoryId("");
    setFormRequisitionId("");
    setFormReference("");
    setFormAttachment("");
    setFormApprovalLayer(ProcurementAssetPurchaseOrderApprovalLayer.PENDING);
    setFormStatus(ProcurementAssetPurchaseOrderStatus.PENDING);
    setFormSelectedItemUuid("");
    setFormAssetItems([]);
    setEditingUuid(null);
  };

  // -------------------------------------------------------------
  // Open Edit Mode
  // -------------------------------------------------------------
  const handleOpenEdit = async (order: BackendAssetPurchaseOrder) => {
    setIsDetailLoading(true);
    try {
      const fullOrder = await procurementAssetPurchaseOrderApi.getOrder(
        order.uuid,
      );
      setEditingUuid(fullOrder.uuid);
      setFormDate(
        fullOrder.date ||
          (fullOrder.createdAt
            ? fullOrder.createdAt.split("T")[0]
            : new Date().toISOString().split("T")[0]),
      );
      setFormSupplierId(
        fullOrder.supplier_id || fullOrder.supplier?.uuid || "",
      );
      setFormCode(fullOrder.code || "");
      setFormCompanyId(fullOrder.company_id || fullOrder.company?.uuid || "");
      setFormProjectTypeId(
        fullOrder.project_type_id || fullOrder.projectType?.uuid || "",
      );
      setFormProjectId(fullOrder.project_id || fullOrder.project?.uuid || "");
      setFormTitleOfWorkId(
        fullOrder.title_of_work_id || fullOrder.titleOfWork?.uuid || "",
      );
      setFormTaskId(fullOrder.task_id || fullOrder.task?.uuid || "");
      setFormSiteId(fullOrder.site_id || fullOrder.site?.uuid || "");
      setFormCategoryId(
        fullOrder.category_id || fullOrder.category?.uuid || "",
      );
      setFormRequisitionId(
        fullOrder.requisition_id || fullOrder.requisition?.uuid || "",
      );
      setFormReference(fullOrder.reference || "");
      setFormAttachment(fullOrder.attachment || "");
      setFormApprovalLayer(
        (fullOrder.approval_layer as ProcurementAssetPurchaseOrderApprovalLayer) ||
          ProcurementAssetPurchaseOrderApprovalLayer.PENDING,
      );
      setFormStatus(
        (fullOrder.status as ProcurementAssetPurchaseOrderStatus) ||
          ProcurementAssetPurchaseOrderStatus.PENDING,
      );

      // Populate item lines
      if (Array.isArray(fullOrder.items) && fullOrder.items.length > 0) {
        const lines: AssetItemLineRow[] = fullOrder.items.map((line, idx) => ({
          tempId: `line-${idx}-${line.uuid || line.id || Date.now()}`,
          itemId: line.item_id || line.item?.uuid || "",
          itemCode: line.item_code || line.item?.item_code || "",
          itemName: line.item_name || line.item?.name || "Asset Item",
          details: line.details || "",
          unit: line.unit || line.unitRelation?.name || "Unit",
          quantity: Number(line.quantity) || 1,
          rate: Number(line.rate) || 0,
          amount: Number(line.amount) || 0,
        }));
        setFormAssetItems(lines);
      } else {
        setFormAssetItems([]);
      }

      setViewMode("edit");
      showToast(`Loaded details for order #${fullOrder.code}`, "info");
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to load order details for editing",
      );
      showToast(msg, "error");
    } finally {
      setIsDetailLoading(false);
      setActiveActionUuid(null);
    }
  };

  // -------------------------------------------------------------
  // Open Detail View Modal
  // -------------------------------------------------------------
  const handleOpenDetailView = async (order: BackendAssetPurchaseOrder) => {
    setIsDetailLoading(true);
    setViewOrder(order);
    try {
      const fullOrder = await procurementAssetPurchaseOrderApi.getOrder(
        order.uuid,
      );
      setViewOrder(fullOrder);
    } catch (err) {
      console.warn("Could not load fresh order details:", err);
    } finally {
      setIsDetailLoading(false);
      setActiveActionUuid(null);
    }
  };

  // -------------------------------------------------------------
  // Form Submit Handler (Create / Update)
  // -------------------------------------------------------------
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSupplierId) {
      showToast("Please select a Supplier", "error");
      return;
    }

    if (formAssetItems.length === 0) {
      showToast(
        "Please add at least one asset item line to the purchase order",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = formAssetItems.map((it) => ({
        item_id: it.itemId,
        quantity: Number(it.quantity) || 1,
        rate: Number(it.rate) || 0,
        details: it.details || undefined,
      }));

      if (viewMode === "edit" && editingUuid) {
        const updatePayload: UpdateAssetPurchaseOrderPayload = {
          date: formDate,
          supplier_id: formSupplierId,
          code: formCode || undefined,
          company_id: formCompanyId || undefined,
          project_type_id: formProjectTypeId || undefined,
          project_id: formProjectId || undefined,
          title_of_work_id: formTitleOfWorkId || undefined,
          task_id: formTaskId || undefined,
          site_id: formSiteId || undefined,
          category_id: formCategoryId || undefined,
          requisition_id: formRequisitionId || undefined,
          reference: formReference || undefined,
          attachment: formAttachment || undefined,
          approval_layer: formApprovalLayer,
          status: formStatus,
          items: itemsPayload,
        };

        const updated = await procurementAssetPurchaseOrderApi.updateOrder(
          editingUuid,
          updatePayload,
        );
        showToast(
          `Asset Purchase Order #${updated.code} updated successfully`,
          "success",
        );
      } else {
        const createPayload: CreateAssetPurchaseOrderPayload = {
          date: formDate,
          supplier_id: formSupplierId,
          code: formCode || undefined,
          company_id: formCompanyId || undefined,
          project_type_id: formProjectTypeId || undefined,
          project_id: formProjectId || undefined,
          title_of_work_id: formTitleOfWorkId || undefined,
          task_id: formTaskId || undefined,
          site_id: formSiteId || undefined,
          category_id: formCategoryId || undefined,
          requisition_id: formRequisitionId || undefined,
          reference: formReference || undefined,
          attachment: formAttachment || undefined,
          approval_layer: formApprovalLayer,
          status: formStatus,
          items: itemsPayload,
        };

        const created =
          await procurementAssetPurchaseOrderApi.createOrder(createPayload);
        showToast(
          `Asset Purchase Order #${created.code} created successfully`,
          "success",
        );
      }

      resetForm();
      setViewMode("list");
      loadOrders();
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        viewMode === "edit"
          ? "Failed to update asset purchase order"
          : "Failed to create asset purchase order",
      );
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Delete Handler
  // -------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementAssetPurchaseOrderApi.deleteOrder(deleteTarget.uuid);
      showToast(
        `Asset Purchase Order #${deleteTarget.code} deleted successfully`,
        "success",
      );
      setDeleteTarget(null);
      loadOrders();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to delete asset purchase order");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Restore Handler
  // -------------------------------------------------------------
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsActionLoading(true);
    try {
      const restored = await procurementAssetPurchaseOrderApi.restoreOrder(
        restoreTarget.uuid,
      );
      showToast(
        `Asset Purchase Order #${restored.code} restored successfully`,
        "success",
      );
      setRestoreTarget(null);
      loadOrders();
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to restore asset purchase order");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Quick Create Asset Item Modal Handler
  // -------------------------------------------------------------
  const handleQuickCreateAssetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetData.name.trim()) {
      showToast("Please enter Asset Item Name", "error");
      return;
    }
    if (!newAssetData.categoryId) {
      showToast("Please select a Category", "error");
      return;
    }
    if (!newAssetData.unitId) {
      showToast("Please select a Unit", "error");
      return;
    }

    try {
      const created = await procurementAssetItemEntryApi.createItem({
        name: newAssetData.name.trim(),
        item_code: newAssetData.code.trim() || undefined,
        category_id: newAssetData.categoryId,
        unit_id: newAssetData.unitId,
        purchase_price: Number(newAssetData.rate) || 0,
      });

      showToast(`Asset item "${created.name}" created!`, "success");
      setIsAddItemModalOpen(false);
      setNewAssetData({
        code: "",
        name: "",
        categoryId: "",
        unitId: "",
        rate: "",
      });

      // Reload dropdowns and auto-add new item to lines
      await loadDropdowns();
      handleAddAssetItem(created.uuid);
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to create asset item");
      showToast(msg, "error");
    }
  };

  // -------------------------------------------------------------
  // Reset Filters Handler
  // -------------------------------------------------------------
  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      companyId: "",
      supplierId: "",
      projectId: "",
      titleOfWorkId: "",
    });
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // -------------------------------------------------------------
  // Excel Export Handler
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    if (orders.length === 0) {
      showToast("No data to export", "info");
      return;
    }

    try {
      const headers = [
        "Code",
        "Date",
        "Supplier",
        "Project",
        "Project Type",
        "Title of Work",
        "Reference",
        "Subtotal",
        "Grand Total",
        "Status",
        "Approval Layer",
      ];

      const csvRows = [
        headers.join(","),
        ...orders.map((o) =>
          [
            `"${o.code || ""}"`,
            `"${o.date || ""}"`,
            `"${o.supplier?.supplierName || ""}"`,
            `"${o.project?.name || ""}"`,
            `"${o.projectType?.name || ""}"`,
            `"${o.titleOfWork?.name || ""}"`,
            `"${o.reference || ""}"`,
            `"${o.subtotal || 0}"`,
            `"${o.grand_total || 0}"`,
            `"${o.status || ""}"`,
            `"${o.approval_layer || ""}"`,
          ].join(","),
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Asset_Purchase_Orders_${recordsTab}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Exported orders successfully", "success");
    } catch {
      showToast("Failed to export data", "error");
    }
  };

  // -------------------------------------------------------------
  // PDF Export / Print Handler
  // -------------------------------------------------------------
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900"
              : toast.type === "error"
                ? "bg-rose-900 text-white border-rose-700"
                : "bg-indigo-900 text-white border-indigo-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-indigo-300 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-7 space-y-5">
        {/* =========================================================================
            VIEW 1: LISTING VIEW
            ========================================================================= */}
        {viewMode === "list" && (
          <>
            {/* Header & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link
                  href="/dashboard"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                >
                  Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <div className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium">
                  <span>Procurement</span>
                  <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Asset Purchase Order List
                </span>
              </nav>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("create");
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+Create New Asset Purchase Order</span>
              </button>
            </div>

            {/* Filter Section (Populated with Real Dropdown API Data) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                {/* Date From */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Date From
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => {
                        setFilters({ ...filters, dateFrom: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Date To
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => {
                        setFilters({ ...filters, dateTo: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Company
                  </label>
                  <div className="relative">
                    <select
                      value={filters.companyId}
                      onChange={(e) => {
                        setFilters({ ...filters, companyId: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                    >
                      <option value="">All Companies</option>
                      {dropdowns.companies.map((c) => (
                        <option key={c.uuid} value={c.uuid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Supplier Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Supplier
                  </label>
                  <div className="relative">
                    <select
                      value={filters.supplierId}
                      onChange={(e) => {
                        setFilters({ ...filters, supplierId: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                    >
                      <option value="">All Suppliers</option>
                      {dropdowns.suppliers.map((s) => (
                        <option key={s.uuid} value={s.uuid}>
                          {s.supplierName}{" "}
                          {s.supplierCode ? `(${s.supplierCode})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={filters.projectId}
                      onChange={(e) => {
                        setFilters({ ...filters, projectId: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                    >
                      <option value="">All Projects</option>
                      {dropdowns.projects.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name} {p.code ? `(${p.code})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Title / Name of Work Filter & Reset */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Title/Name of Work
                    </label>
                    <select
                      value={filters.titleOfWorkId}
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          titleOfWorkId: e.target.value,
                        });
                        setCurrentPage(1);
                      }}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                    >
                      <option value="">All Titles</option>
                      {dropdowns.titleOfWorks.map((t) => (
                        <option key={t.uuid} value={t.uuid}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-8 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    title="Reset Filters"
                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active / Deleted Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
              <button
                type="button"
                onClick={() => {
                  setRecordsTab("active");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  recordsTab === "active"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Active Orders</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    recordsTab === "active"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecordsTab("deleted");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  recordsTab === "deleted"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deleted Orders</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    recordsTab === "deleted"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {deletedCount}
                </span>
              </button>
            </div>

            {/* Table Container Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2">
                    <span>Show</span>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span>entries</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Search:
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search code, ref..."
                      className="w-48 sm:w-60 h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => loadOrders()}
                    title="Reload data"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto relative min-h-[200px]">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>Loading records from API...</span>
                    </div>
                  </div>
                )}

                <table className="w-full text-left border-collapse min-w-[1280px]">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-[11px] font-semibold uppercase tracking-wider">
                      <th className="px-3.5 py-3 text-left">#</th>
                      <th className="px-3.5 py-3 text-left">PROJECT TYPE</th>
                      <th className="px-3.5 py-3 text-left">PROJECT</th>
                      <th className="px-3.5 py-3 text-left">
                        TITLE/NAME OF WORK
                      </th>
                      <th className="px-3.5 py-3 text-left">SUPPLIER NAME</th>
                      <th className="px-3.5 py-3 text-left">CODE</th>
                      <th className="px-3.5 py-3 text-left">REFERENCE</th>
                      <th className="px-3.5 py-3 text-left">DATE</th>
                      <th className="px-3.5 py-3 text-right">SUB TOTAL</th>
                      <th className="px-3.5 py-3 text-right">GRAND TOTAL</th>
                      <th className="px-3.5 py-3 text-left">ADDED BY</th>
                      <th className="px-3.5 py-3 text-left">APPROVAL LAYER</th>
                      <th className="px-3.5 py-3 text-center">ATTACHMENT</th>
                      <th className="px-3.5 py-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                    {orders.map((order, idx) => (
                      <tr
                        key={order.uuid}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-3.5 py-3 font-medium text-slate-700 dark:text-slate-300">
                          {(currentPage - 1) * entriesPerPage + idx + 1}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {order.projectType?.name || "—"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                          {order.project?.name || "—"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {order.titleOfWork?.name || "—"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {order.supplier?.supplierName || "—"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                            {order.code}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {order.reference || "—"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {order.date ||
                            (order.createdAt
                              ? order.createdAt.split("T")[0]
                              : "—")}
                        </td>
                        <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-300">
                          {formatCurrency(order.subtotal)}
                        </td>
                        <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(order.grand_total)}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {order.addedBy?.name || order.createdBy || "Admin"}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              order.approval_layer === "all_approvals_completed"
                                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                                : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {order.approval_layer ===
                              "all_approvals_completed"
                                ? "All Approvals Completed"
                                : order.approval_layer || "Pending"}
                            </span>
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {order.attachment ? (
                            <span
                              title={order.attachment}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center relative whitespace-nowrap">
                          {recordsTab === "active" ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenDetailView(order)}
                                title="View Details"
                                className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(order)}
                                title="Edit Order"
                                className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(order)}
                                title="Delete Order"
                                className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDetailView(order)}
                                title="View Details"
                                className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setRestoreTarget(order)}
                                title="Restore Order"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                              >
                                <ArchiveRestore className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Empty State */}
                    {orders.length === 0 && !isLoading && (
                      <tr>
                        <td
                          colSpan={14}
                          className="px-4 py-12 text-center text-xs text-slate-500 dark:text-slate-400 select-none"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                            <p className="font-medium text-slate-600 dark:text-slate-300">
                              {recordsTab === "active"
                                ? "No active asset purchase orders found"
                                : "No deleted asset purchase orders found"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {searchTerm ||
                              filters.supplierId ||
                              filters.projectId
                                ? "Try clearing filters or search term to see more results."
                                : recordsTab === "active"
                                  ? "Click '+Create New Asset Purchase Order' to add the first order."
                                  : "Any deleted orders will appear here for restoration."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing{" "}
                  {orders.length === 0
                    ? 0
                    : (currentPage - 1) * entriesPerPage + 1}{" "}
                  to {Math.min(currentPage * entriesPerPage, totalEntries)} of{" "}
                  {totalEntries} entries
                </span>

                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        disabled={isLoading}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          page === currentPage
                            ? "bg-[#5D5FEF] text-white font-semibold shadow-2xs"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            VIEW 2: CREATE / EDIT ASSET PURCHASE ORDER FORM
            ========================================================================= */}
        {(viewMode === "create" || viewMode === "edit") && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Header & Back Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link
                  href="/dashboard"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                >
                  Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <div className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium">
                  <span>Procurement</span>
                  <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewMode === "edit"
                    ? "Edit Asset Purchase Order"
                    : "Asset Purchase Order"}
                </span>
              </nav>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("list");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] shadow-sm transition-all cursor-pointer shrink-0"
              >
                <span>« Asset Purchase Order List</span>
              </button>
            </div>

            {/* Form Card Grid */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
                {/* Row 1: Date, Supplier*, Code, Project Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Supplier* with + button */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Supplier <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <select
                          value={formSupplierId}
                          onChange={(e) => setFormSupplierId(e.target.value)}
                          required
                          className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Supplier</option>
                          {dropdowns.suppliers.map((s) => (
                            <option key={s.uuid} value={s.uuid}>
                              {s.supplierName}{" "}
                              {s.supplierCode ? `(${s.supplierCode})` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddSupplierModalOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-[#5D5FEF] hover:bg-[#4E50E0] text-white shrink-0 cursor-pointer shadow-2xs"
                        title="Add Supplier"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. PUR2627916"
                      className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Company
                    </label>
                    <div className="relative">
                      <select
                        value={formCompanyId}
                        onChange={(e) => setFormCompanyId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Company</option>
                        {dropdowns.companies.map((c) => (
                          <option key={c.uuid} value={c.uuid}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Project Type, Project, Title/Name of Work, If Task */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Project Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Project Type
                    </label>
                    <div className="relative">
                      <select
                        value={formProjectTypeId}
                        onChange={(e) => setFormProjectTypeId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Project Type</option>
                        {dropdowns.projectTypes.map((pt) => (
                          <option key={pt.uuid} value={pt.uuid}>
                            {pt.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Project
                    </label>
                    <div className="relative">
                      <select
                        value={formProjectId}
                        onChange={(e) => {
                          setFormProjectId(e.target.value);
                          setFormSiteId(""); // reset site when project changes
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Project</option>
                        {dropdowns.projects.map((p) => (
                          <option key={p.uuid} value={p.uuid}>
                            {p.name} {p.code ? `(${p.code})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Title / Name of Work */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Title/Name of Work
                    </label>
                    <div className="relative">
                      <select
                        value={formTitleOfWorkId}
                        onChange={(e) => setFormTitleOfWorkId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Title/Name of Work</option>
                        {dropdowns.titleOfWorks.map((t) => (
                          <option key={t.uuid} value={t.uuid}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* If Task */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      If Task
                    </label>
                    <div className="relative">
                      <select
                        value={formTaskId}
                        onChange={(e) => setFormTaskId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Task</option>
                        {dropdowns.tasks.map((task) => (
                          <option key={task.uuid} value={task.uuid}>
                            {task.taskName} {task.uid ? `(${task.uid})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 3: Site, Category, Requisition, Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Site */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Site
                    </label>
                    <div className="relative">
                      <select
                        value={formSiteId}
                        onChange={(e) => setFormSiteId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Site</option>
                        {availableSites.map((site) => (
                          <option key={site.uuid} value={site.uuid}>
                            {site.name} {site.code ? `(${site.code})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={formCategoryId}
                        onChange={(e) => setFormCategoryId(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Category</option>
                        {dropdowns.categories.map((cat) => (
                          <option key={cat.uuid} value={cat.uuid}>
                            {cat.name} {cat.code ? `(${cat.code})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Requisition */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Asset Requisition
                    </label>
                    <div className="relative">
                      <select
                        value={formRequisitionId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormRequisitionId(val);
                          const req = dropdowns.assetRequisitions.find(
                            (r) => r.uuid === val,
                          );
                          if (req && !formReference) {
                            setFormReference(req.code);
                          }
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select Requisition</option>
                        {dropdowns.assetRequisitions.map((req) => (
                          <option key={req.uuid} value={req.uuid}>
                            {req.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={formReference}
                      onChange={(e) => setFormReference(e.target.value)}
                      placeholder="e.g. REF-AST-101"
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 4: Approval Layer, Status, Select Item */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                  {/* Approval Layer */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Approval Layer
                    </label>
                    <div className="relative">
                      <select
                        value={formApprovalLayer}
                        onChange={(e) =>
                          setFormApprovalLayer(
                            e.target
                              .value as ProcurementAssetPurchaseOrderApprovalLayer,
                          )
                        }
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option
                          value={
                            ProcurementAssetPurchaseOrderApprovalLayer.PENDING
                          }
                        >
                          Pending
                        </option>
                        <option
                          value={
                            ProcurementAssetPurchaseOrderApprovalLayer.ALL_APPROVALS_COMPLETED
                          }
                        >
                          All Approvals Completed
                        </option>
                        <option
                          value={
                            ProcurementAssetPurchaseOrderApprovalLayer.ADMIN
                          }
                        >
                          Admin
                        </option>
                        <option
                          value={
                            ProcurementAssetPurchaseOrderApprovalLayer.RASEL_HOSAIN
                          }
                        >
                          Rasel Hosain
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={formStatus}
                        onChange={(e) =>
                          setFormStatus(
                            e.target
                              .value as ProcurementAssetPurchaseOrderStatus,
                          )
                        }
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option
                          value={ProcurementAssetPurchaseOrderStatus.PENDING}
                        >
                          Pending
                        </option>
                        <option
                          value={ProcurementAssetPurchaseOrderStatus.APPROVED}
                        >
                          Approved
                        </option>
                        <option
                          value={ProcurementAssetPurchaseOrderStatus.REJECTED}
                        >
                          Rejected
                        </option>
                        <option
                          value={ProcurementAssetPurchaseOrderStatus.COMPLETED}
                        >
                          Completed
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Select Item with + button */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Asset Item to Add Line
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <select
                          value={formSelectedItemUuid}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormSelectedItemUuid(val);
                            if (val) handleAddAssetItem(val);
                          }}
                          className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Asset Item...</option>
                          {availableAssetItems.map((item) => (
                            <option key={item.uuid} value={item.uuid}>
                              {item.item_code} - {item.name}{" "}
                              {item.purchase_price
                                ? `(৳${formatCurrency(item.purchase_price)})`
                                : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAssetData({
                            code: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
                            name: "",
                            categoryId:
                              formCategoryId ||
                              dropdowns.categories[0]?.uuid ||
                              "",
                            unitId: dropdowns.units[0]?.uuid || "",
                            rate: "",
                          });
                          setIsAddItemModalOpen(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-[#5D5FEF] hover:bg-[#4E50E0] text-white shrink-0 cursor-pointer shadow-2xs"
                        title="Create New Asset Item"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Asset Item Lines Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Purchase Order Item Lines ({formAssetItems.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    At least one asset item line is required
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-[#5D5FEF] text-white text-[11px] font-semibold uppercase tracking-wider">
                        <th className="px-3.5 py-2.5">ITEM CODE</th>
                        <th className="px-3.5 py-2.5">ITEM NAME</th>
                        <th className="px-3.5 py-2.5">DETAILS</th>
                        <th className="px-3.5 py-2.5">UNIT</th>
                        <th className="px-3.5 py-2.5 text-right w-28">
                          QUANTITY
                        </th>
                        <th className="px-3.5 py-2.5 text-right w-36">
                          RATE (BDT)
                        </th>
                        <th className="px-3.5 py-2.5 text-right">
                          AMOUNT (BDT)
                        </th>
                        <th className="px-3.5 py-2.5 text-center w-20">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {formAssetItems.map((item) => (
                        <tr
                          key={item.tempId}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3.5 py-2.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {item.itemCode}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                            {item.itemName}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <input
                              type="text"
                              value={item.details}
                              onChange={(e) =>
                                handleUpdateItemLine(
                                  item.tempId,
                                  "details",
                                  e.target.value,
                                )
                              }
                              placeholder="Specifications / remarks"
                              className="w-full h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                            {item.unit}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemLine(
                                  item.tempId,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 h-8 px-2 text-right text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItemLine(
                                  item.tempId,
                                  "rate",
                                  Number(e.target.value),
                                )
                              }
                              className="w-32 h-8 px-2 text-right text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            ৳{formatCurrency(item.amount)}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(item.tempId)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {formAssetItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500"
                          >
                            No asset items added yet. Select an item from the
                            dropdown above to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subtotal, Grand Total, Attachment Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      SUBTOTAL
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`৳${formatCurrency(formSubTotal)}`}
                      className="w-full h-9 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      GRAND TOTAL
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`৳${formatCurrency(formGrandTotal)}`}
                      className="w-full h-9 px-3 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      ATTACHMENT
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-between h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer hover:border-slate-300 transition-colors">
                        <span className="truncate">
                          {formAttachment || "Choose File"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formAttachment ? "" : "No file chosen"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormAttachment(file.name);
                              showToast(`Attached file: ${file.name}`, "info");
                            }
                          }}
                        />
                      </label>
                      {formAttachment && (
                        <button
                          type="button"
                          onClick={() => setFormAttachment("")}
                          className="p-2 text-slate-400 hover:text-rose-500"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setViewMode("list");
                    }}
                    className="px-6 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-2 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {viewMode === "edit"
                        ? "Update Purchase Order"
                        : "Submit Purchase Order"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: VIEW DETAILS MODAL
            ========================================================================= */}
        {viewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Asset Purchase Order Details
                    </h3>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      #{viewOrder.code}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Header Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Supplier
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewOrder.supplier?.supplierName || "—"}
                  </span>
                  {viewOrder.supplier?.supplierCode && (
                    <span className="block text-[11px] text-slate-400 font-mono">
                      {viewOrder.supplier.supplierCode}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Project
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewOrder.project?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Project Type
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewOrder.projectType?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Site
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewOrder.site?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Title of Work
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewOrder.titleOfWork?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Task
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewOrder.task?.taskName || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Date
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {viewOrder.date ||
                      (viewOrder.createdAt
                        ? viewOrder.createdAt.split("T")[0]
                        : "—")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Reference
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {viewOrder.reference || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Category
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {viewOrder.category?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Status
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                    {viewOrder.status || "Pending"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Approval Layer
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {viewOrder.approval_layer === "all_approvals_completed"
                      ? "All Approvals Completed"
                      : viewOrder.approval_layer || "Pending"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Attachment
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {viewOrder.attachment || "None"}
                  </span>
                </div>
              </div>

              {/* Item Lines Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Order Items Breakdown
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                        <th className="px-3.5 py-2">Item Code</th>
                        <th className="px-3.5 py-2">Item Name</th>
                        <th className="px-3.5 py-2">Details</th>
                        <th className="px-3.5 py-2">Unit</th>
                        <th className="px-3.5 py-2 text-right">Quantity</th>
                        <th className="px-3.5 py-2 text-right">Rate</th>
                        <th className="px-3.5 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((line, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-3.5 py-2 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {line.item_code || line.item?.item_code || "—"}
                            </td>
                            <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-slate-100">
                              {line.item_name || line.item?.name || "Asset"}
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400">
                              {line.details || "—"}
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400">
                              {line.unit || line.unitRelation?.name || "Unit"}
                            </td>
                            <td className="px-3.5 py-2 text-right font-semibold">
                              {line.quantity}
                            </td>
                            <td className="px-3.5 py-2 text-right tabular-nums">
                              ৳{formatCurrency(line.rate)}
                            </td>
                            <td className="px-3.5 py-2 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              ৳{formatCurrency(line.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-slate-400"
                          >
                            No items recorded in this order
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                        <td
                          colSpan={6}
                          className="px-3.5 py-2.5 text-right uppercase text-[11px] text-slate-600 dark:text-slate-300"
                        >
                          Grand Total:
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-indigo-600 dark:text-indigo-400 tabular-nums">
                          ৳{formatCurrency(viewOrder.grand_total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: CONFIRM DELETE MODAL
            ========================================================================= */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Confirm Deletion
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This order will be moved to Deleted Orders
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                Are you sure you want to delete Asset Purchase Order{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  #{deleteTarget.code}
                </span>{" "}
                with total amount{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ৳{formatCurrency(deleteTarget.grand_total)}
                </span>
                ? You can restore it later from the Deleted Orders tab.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {isActionLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Delete Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: CONFIRM RESTORE MODAL
            ========================================================================= */}
        {restoreTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60">
                  <ArchiveRestore className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Confirm Restoration
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This order will be restored to Active Orders
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                Restore Asset Purchase Order{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  #{restoreTarget.code}
                </span>{" "}
                back to active status?
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setRestoreTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleConfirmRestore}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isActionLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Restore Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: QUICK ADD ASSET ITEM MODAL
            ========================================================================= */}
        {isAddItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Create New Asset Item
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCreateAssetItem} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Asset Code
                    </label>
                    <input
                      type="text"
                      value={newAssetData.code}
                      onChange={(e) =>
                        setNewAssetData({
                          ...newAssetData,
                          code: e.target.value,
                        })
                      }
                      placeholder="e.g. AST-1001"
                      className="w-full h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Unit <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newAssetData.unitId}
                      onChange={(e) =>
                        setNewAssetData({
                          ...newAssetData,
                          unitId: e.target.value,
                        })
                      }
                      required
                      className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="">Select Unit</option>
                      {dropdowns.units.map((u) => (
                        <option key={u.uuid} value={u.uuid}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Asset Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAssetData.name}
                      onChange={(e) =>
                        setNewAssetData({
                          ...newAssetData,
                          name: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g. CAT 320D Excavator"
                      className="w-full h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newAssetData.categoryId}
                      onChange={(e) =>
                        setNewAssetData({
                          ...newAssetData,
                          categoryId: e.target.value,
                        })
                      }
                      required
                      className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="">Select Category</option>
                      {dropdowns.categories.map((c) => (
                        <option key={c.uuid} value={c.uuid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rate / Price (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newAssetData.rate}
                      onChange={(e) =>
                        setNewAssetData({
                          ...newAssetData,
                          rate: e.target.value,
                        })
                      }
                      placeholder="e.g. 450000"
                      className="w-full h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#5D5FEF] hover:bg-[#4E50E0]"
                  >
                    Create & Add Line
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 5: QUICK ADD SUPPLIER MODAL
            ========================================================================= */}
        {isAddSupplierModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Supplier Quick Selection
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Existing Supplier
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormSupplierId(e.target.value);
                        setIsAddSupplierModalOpen(false);
                      }
                    }}
                    value={formSupplierId}
                    className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Select Supplier</option>
                    {dropdowns.suppliers.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.supplierName} ({s.supplierCode || "No code"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center text-slate-400 py-1">
                  <span>— or navigate to —</span>
                </div>

                <Link
                  href="/dashboard/projects/contract/supplier-accounts"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Supplier Accounts Master</span>
                </Link>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
