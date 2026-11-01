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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Search,
  Calendar,
  RotateCcw,
  X,
  Eye,
  SquarePen,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  PackageCheck,
  Upload,
} from "lucide-react";
import {
  procurementAssetGrnApi,
  BackendAssetGrn,
  BackendAssetGrnItem,
  AssetGrnDropdownsResult,
  CreateAssetGrnPayload,
  UpdateAssetGrnPayload,
  AssetGrnItemPayload,
} from "@/lib/procurement/procurementAssetGrnApi";

// -----------------------------------------------------------------------------
// Helper: API Error Message Parser
// -----------------------------------------------------------------------------
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
            : JSON.stringify(e),
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

// -----------------------------------------------------------------------------
// Form Line Item Interface
// -----------------------------------------------------------------------------
export interface FormAssetItemLine {
  tempId: string;
  item_id?: string;
  item_code: string;
  item_name: string;
  details: string;
  unit_id?: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Table Header Columns Specification
const TABLE_COLUMNS = [
  { key: "id", label: "ID", sortable: true, align: "left" },
  { key: "projectType", label: "PROJECT TYPE", sortable: true, align: "left" },
  { key: "project", label: "PROJECT", sortable: true, align: "left" },
  {
    key: "titleOfWork",
    label: "TITLE/NAME OF WORK",
    sortable: true,
    align: "left",
  },
  {
    key: "supplierName",
    label: "SUPPLIER NAME",
    sortable: true,
    align: "left",
  },
  { key: "code", label: "CODE", sortable: true, align: "left" },
  { key: "reference", label: "REFERENCE", sortable: true, align: "left" },
  { key: "date", label: "DATE", sortable: true, align: "left" },
  { key: "subTotal", label: "SUB TOTAL", sortable: true, align: "right" },
  { key: "grandTotal", label: "GRAND TOTAL", sortable: true, align: "right" },
  { key: "addedBy", label: "ADDED BY", sortable: true, align: "left" },
  { key: "attachment", label: "ATTACHMENT", sortable: false, align: "center" },
  { key: "approval", label: "APPROVAL", sortable: false, align: "left" },
  { key: "action", label: "ACTION", sortable: false, align: "right" },
];

export default function AssetGoodsReceiptNotePage() {
  // ---------------------------------------------------------------------------
  // View Modes & Tab States
  // ---------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");

  // Server Data States
  const [grns, setGrns] = useState<BackendAssetGrn[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Server Filter States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filters, setFilters] = useState({
    dateRange: "",
    supplierId: "",
    projectId: "",
    titleOfWorkId: "",
  });

  // Sorting Config (Server & Client fallback)
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });

  // Dropdown Options State (Loaded from Real Backend API)
  const [dropdowns, setDropdowns] = useState<AssetGrnDropdownsResult>({
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
    users: [],
  });

  // Table Sticky Header Scroll Shadow Detection
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 2);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ---------------------------------------------------------------------------
  // Load Dropdown Options from Real Backend API
  // ---------------------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const data = await procurementAssetGrnApi.getDropdowns(
        filters.projectId || undefined,
      );
      setDropdowns(data);
    } catch (err: unknown) {
      console.warn("Could not fetch Asset GRN dropdowns:", err);
    }
  }, [filters.projectId]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // ---------------------------------------------------------------------------
  // Fetch Asset Goods Receipt Notes from Real API
  // ---------------------------------------------------------------------------
  const loadGrns = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    // Parse dateRange if provided: "YYYY-MM-DD - YYYY-MM-DD"
    let date_from: string | undefined = undefined;
    let date_to: string | undefined = undefined;
    if (filters.dateRange && filters.dateRange.includes("-")) {
      const parts = filters.dateRange.split("-").map((p) => p.trim());
      if (parts[0]) date_from = parts[0];
      if (parts[1]) date_to = parts[1];
    }

    try {
      if (recordsTab === "deleted") {
        // Strict Deleted Tab: Query with withDeleted: true
        const res = await procurementAssetGrnApi.list({
          page: currentPage,
          limit: entriesPerPage,
          search: debouncedSearch.trim() || undefined,
          date_from,
          date_to,
          supplier_id: filters.supplierId || undefined,
          project_id: filters.projectId || undefined,
          title_of_work_id: filters.titleOfWorkId || undefined,
          withDeleted: true,
        });

        const allItems = res.data || [];
        // Strict guarantee: Only display records that are soft-deleted
        const deletedOnly = allItems.filter((r) => Boolean(r.deletedAt));
        setGrns(deletedOnly);
        setTotalEntries(deletedOnly.length);
        setTotalPages(
          Math.max(1, Math.ceil(deletedOnly.length / entriesPerPage)),
        );
        setDeletedCount(deletedOnly.length);
      } else {
        // Strict Active Tab: Query active records + background check for deleted count
        const [activeRes, withDeletedRes] = await Promise.allSettled([
          procurementAssetGrnApi.list({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            date_from,
            date_to,
            supplier_id: filters.supplierId || undefined,
            project_id: filters.projectId || undefined,
            title_of_work_id: filters.titleOfWorkId || undefined,
          }),
          procurementAssetGrnApi.list({
            limit: 100,
            withDeleted: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          const rawItems = activeRes.value.data || [];
          // Strict guarantee: Exclude any item that has deletedAt set
          const activeOnly = rawItems.filter((r) => !r.deletedAt);
          setGrns(activeOnly);

          const meta = activeRes.value.meta;
          const total =
            meta?.total !== undefined ? meta.total : activeOnly.length;
          setTotalEntries(total);
          setTotalPages(
            meta?.totalPages !== undefined
              ? meta.totalPages
              : Math.max(1, Math.ceil(total / entriesPerPage)),
          );
          setActiveCount(total);
        } else {
          throw activeRes.reason;
        }

        if (withDeletedRes.status === "fulfilled") {
          const allItems = withDeletedRes.value.data || [];
          const count = allItems.filter((r) => Boolean(r.deletedAt)).length;
          setDeletedCount(count);
        }
      }
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to load Asset Goods Receipt Notes from server.",
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
    filters.dateRange,
    filters.supplierId,
    filters.projectId,
    filters.titleOfWorkId,
    showToast,
  ]);

  useEffect(() => {
    loadGrns();
  }, [loadGrns]);

  // Client-side Sorting of loaded rows
  const sortedRows = useMemo(() => {
    const list = [...grns];
    list.sort((a, b) => {
      let aVal: unknown = "";
      let bVal: unknown = "";

      switch (sortConfig.key) {
        case "id":
          aVal = a.id || a.code || "";
          bVal = b.id || b.code || "";
          break;
        case "projectType":
          aVal = a.projectType?.name || "";
          bVal = b.projectType?.name || "";
          break;
        case "project":
          aVal = a.project?.name || "";
          bVal = b.project?.name || "";
          break;
        case "titleOfWork":
          aVal = a.titleOfWork?.name || "";
          bVal = b.titleOfWork?.name || "";
          break;
        case "supplierName":
          aVal = a.supplier?.supplierName || "";
          bVal = b.supplier?.supplierName || "";
          break;
        case "code":
          aVal = a.code || "";
          bVal = b.code || "";
          break;
        case "reference":
          aVal = a.reference || "";
          bVal = b.reference || "";
          break;
        case "date":
          aVal = a.date || "";
          bVal = b.date || "";
          break;
        case "subTotal":
          aVal = Number(a.subtotal) || 0;
          bVal = Number(b.subtotal) || 0;
          break;
        case "grandTotal":
          aVal = Number(a.grand_total) || 0;
          bVal = Number(b.grand_total) || 0;
          break;
        case "addedBy":
          aVal = a.addedBy?.name || "";
          bVal = b.addedBy?.name || "";
          break;
        default:
          return 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [grns, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: "",
      supplierId: "",
      projectId: "",
      titleOfWorkId: "",
    });
    setSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default values", "info");
  };

  // ---------------------------------------------------------------------------
  // Modals & Detail States
  // ---------------------------------------------------------------------------
  const [viewItem, setViewItem] = useState<BackendAssetGrn | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<BackendAssetGrn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // View Details Modal Handler (Fetches Complete Record via Real API)
  const handleOpenViewModal = async (row: BackendAssetGrn) => {
    setViewItem(row);
    setIsDetailLoading(true);
    try {
      const fullDetails = await procurementAssetGrnApi.getById(row.uuid);
      if (fullDetails) {
        setViewItem(fullDetails);
      }
    } catch (err: unknown) {
      console.warn("Could not fetch full details, showing loaded data:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Create / Edit Form State & Handlers
  // ---------------------------------------------------------------------------
  const [formUuid, setFormUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    ledger_id: "1010",
    ledger_name: "1010 - Capital Assets / Machinery",
    code: "",
    reference: "",
    project_type_id: "",
    project_id: "",
    title_of_work_id: "",
    task_id: "",
    site_id: "",
    category_id: "",
    discount: 0,
    paid: 0,
    note: "",
    attachment: "",
    selectedItemUuid: "",
    subTotal: 0,
    grandTotal: 0,
    due: 0,
    items: [] as FormAssetItemLine[],
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Open Create Mode
  const handleOpenCreate = () => {
    const nextCode = `PUR${Math.floor(7900000 + Math.random() * 99999)}`;
    setFormUuid(null);
    setFormError(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplier_id: dropdowns.suppliers[0]?.uuid || "",
      ledger_id: "1010",
      ledger_name: "1010 - Capital Assets / Machinery",
      code: nextCode,
      reference: "",
      project_type_id: dropdowns.projectTypes[0]?.uuid || "",
      project_id: dropdowns.projects[0]?.uuid || "",
      title_of_work_id: dropdowns.titleOfWorks[0]?.uuid || "",
      task_id: dropdowns.tasks[0]?.uuid || "",
      site_id: dropdowns.sites[0]?.uuid || "",
      category_id: dropdowns.categories[0]?.uuid || "",
      discount: 0,
      paid: 0,
      note: "",
      attachment: "",
      selectedItemUuid: "",
      subTotal: 0,
      grandTotal: 0,
      due: 0,
      items: [],
    });
    setViewMode("create");
  };

  // Open Edit Mode (Loads complete record from backend first)
  const handleOpenEdit = async (row: BackendAssetGrn) => {
    setFormUuid(row.uuid);
    setFormError(null);
    setIsLoading(true);

    try {
      const fullRecord = await procurementAssetGrnApi.getById(row.uuid);
      const activeRecord = fullRecord || row;

      const loadedItems: FormAssetItemLine[] = (activeRecord.items || []).map(
        (itm, idx) => ({
          tempId: itm.uuid || `item-${idx}-${Date.now()}`,
          item_id: itm.item_id || undefined,
          item_code: itm.item_code || "",
          item_name: itm.item_name || "",
          details: itm.details || "",
          unit_id: itm.unit_id || undefined,
          unit: itm.unit || "Pcs",
          quantity: Number(itm.quantity) || 1,
          rate: Number(itm.rate) || 0,
          amount: (Number(itm.quantity) || 1) * (Number(itm.rate) || 0),
        }),
      );

      const sub = Number(activeRecord.subtotal) || 0;
      const disc = Number(activeRecord.discount) || 0;
      const grand = Number(activeRecord.grand_total) || sub - disc;
      const paid = Number(activeRecord.paid) || 0;
      const due = Number(activeRecord.due) || grand - paid;

      setFormData({
        date: activeRecord.date || new Date().toISOString().split("T")[0],
        supplier_id: activeRecord.supplier_id || "",
        ledger_id: activeRecord.ledger_id || "1010",
        ledger_name:
          activeRecord.ledger_name || "1010 - Capital Assets / Machinery",
        code: activeRecord.code || "",
        reference: activeRecord.reference || "",
        project_type_id: activeRecord.project_type_id || "",
        project_id: activeRecord.project_id || "",
        title_of_work_id: activeRecord.title_of_work_id || "",
        task_id: activeRecord.task_id || "",
        site_id: activeRecord.site_id || "",
        category_id: activeRecord.category_id || "",
        discount: disc,
        paid: paid,
        note: activeRecord.note || "",
        attachment: activeRecord.attachment || "",
        selectedItemUuid: "",
        subTotal: sub,
        grandTotal: grand,
        due: due,
        items: loadedItems,
      });

      setViewMode("edit");
    } catch (err: unknown) {
      showToast(
        parseApiError(err, "Could not load complete record for editing."),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate Form Financials
  const updateFormTotals = (
    itemsList: FormAssetItemLine[],
    discountVal: number,
    paidVal: number,
  ) => {
    const sub = itemsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const grand = Math.max(0, sub - (discountVal || 0));
    const due = Math.max(0, grand - (paidVal || 0));
    setFormData((prev) => ({
      ...prev,
      subTotal: sub,
      grandTotal: grand,
      due: due,
    }));
  };

  // Add Item to Line Table
  const handleAddItemToForm = () => {
    if (!formData.selectedItemUuid) {
      showToast("Please select an item from the dropdown first.", "info");
      return;
    }
    const selected = dropdowns.items.find(
      (i) => i.uuid === formData.selectedItemUuid,
    );
    if (!selected) return;

    const rateNum = Number(selected.purchase_price) || 0;
    const newItem: FormAssetItemLine = {
      tempId: `item-${Date.now()}`,
      item_id: selected.uuid,
      item_code: selected.item_code,
      item_name: selected.name,
      details: "Asset delivery verified",
      unit_id: selected.unit?.uuid,
      unit: selected.unit?.name || "Pcs",
      quantity: 1,
      rate: rateNum,
      amount: rateNum,
    };

    const nextItems = [...formData.items, newItem];
    setFormData((prev) => ({
      ...prev,
      items: nextItems,
      selectedItemUuid: "",
    }));
    updateFormTotals(nextItems, formData.discount, formData.paid);
    showToast(`Added ${selected.name} to line items`, "success");
  };

  // Change Item Fields
  const handleItemFieldChange = (
    tempId: string,
    field: "quantity" | "rate" | "details",
    val: string | number,
  ) => {
    const updated = formData.items.map((item) => {
      if (item.tempId !== tempId) return item;
      const updatedItem = { ...item, [field]: val };
      if (field === "quantity" || field === "rate") {
        const q = field === "quantity" ? Number(val) || 0 : item.quantity;
        const r = field === "rate" ? Number(val) || 0 : item.rate;
        updatedItem.amount = q * r;
      }
      return updatedItem;
    });
    setFormData((prev) => ({ ...prev, items: updated }));
    updateFormTotals(updated, formData.discount, formData.paid);
  };

  // Remove Item from Line Table
  const handleRemoveItem = (tempId: string) => {
    const filtered = formData.items.filter((item) => item.tempId !== tempId);
    setFormData((prev) => ({ ...prev, items: filtered }));
    updateFormTotals(filtered, formData.discount, formData.paid);
  };

  // Submit Form (Real POST / PATCH API Call)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.supplier_id) {
      setFormError("Please select a Supplier.");
      showToast("Supplier is required.", "error");
      return;
    }
    if (formData.items.length === 0) {
      setFormError(
        "At least one line item is required in the breakdown table.",
      );
      showToast("Please add at least one line item.", "error");
      return;
    }

    setIsSubmitting(true);

    const payloadItems: AssetGrnItemPayload[] = formData.items.map((itm) => ({
      item_id: itm.item_id,
      item_code: itm.item_code,
      item_name: itm.item_name,
      details: itm.details,
      unit_id: itm.unit_id,
      unit: itm.unit,
      quantity: Number(itm.quantity) || 1,
      rate: Number(itm.rate) || 0,
    }));

    try {
      if (viewMode === "edit" && formUuid) {
        const updatePayload: UpdateAssetGrnPayload = {
          date: formData.date,
          supplier_id: formData.supplier_id,
          code: formData.code || undefined,
          reference: formData.reference || undefined,
          ledger_id: formData.ledger_id || undefined,
          ledger_name: formData.ledger_name || undefined,
          project_type_id: formData.project_type_id || undefined,
          project_id: formData.project_id || undefined,
          title_of_work_id: formData.title_of_work_id || undefined,
          task_id: formData.task_id || undefined,
          site_id: formData.site_id || undefined,
          category_id: formData.category_id || undefined,
          discount: Number(formData.discount) || 0,
          paid: Number(formData.paid) || 0,
          note: formData.note || undefined,
          attachment: formData.attachment || undefined,
          items: payloadItems,
        };

        await procurementAssetGrnApi.update(formUuid, updatePayload);
        showToast("Asset Goods Receipt Note updated successfully!", "success");
      } else {
        const createPayload: CreateAssetGrnPayload = {
          date: formData.date,
          supplier_id: formData.supplier_id,
          code: formData.code || undefined,
          reference: formData.reference || undefined,
          ledger_id: formData.ledger_id || undefined,
          ledger_name: formData.ledger_name || undefined,
          project_type_id: formData.project_type_id || undefined,
          project_id: formData.project_id || undefined,
          title_of_work_id: formData.title_of_work_id || undefined,
          task_id: formData.task_id || undefined,
          site_id: formData.site_id || undefined,
          category_id: formData.category_id || undefined,
          discount: Number(formData.discount) || 0,
          paid: Number(formData.paid) || 0,
          note: formData.note || undefined,
          attachment: formData.attachment || undefined,
          items: payloadItems,
        };

        await procurementAssetGrnApi.create(createPayload);
        showToast("Asset Goods Receipt Note created successfully!", "success");
      }

      setViewMode("list");
      loadGrns();
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to submit Asset Goods Receipt Note.",
      );
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Operation (Real DELETE API Call)
  // ---------------------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await procurementAssetGrnApi.delete(deleteTarget.uuid);
      showToast(
        `Asset GRN ${deleteTarget.code || deleteTarget.uuid} soft-deleted successfully.`,
        "success",
      );
      setDeleteTarget(null);
      loadGrns();
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to delete Asset Goods Receipt Note.",
      );
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#374151] dark:text-slate-300 font-sans transition-colors duration-140">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-[0_8px_24px_rgba(16,24,40,0.08)] border text-[13px] font-medium backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-140 ${
            toast.type === "success"
              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
              : toast.type === "error"
                ? "bg-[#FEF2F2] text-[#B42318] border-[#FECACA]"
                : "bg-[#F4F1FF] text-[#4F32C7] border-[#DDD6FE]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
          ) : toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#027A48]" />
          ) : (
            <PackageCheck className="w-4 h-4 shrink-0 text-[#6D4AFF]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container: Shell Padding & 112px Bottom Clearance for Floating Widgets */}
      <div className="p-4 sm:p-6 pb-28 max-w-[1600px] w-full mx-auto space-y-5">
        {/* =================================================================== */}
        {/* HEADER BAR & BREADCRUMB                                             */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[13px] text-[#6B7280]">
              <Link
                href="/dashboard"
                className="hover:text-[#6D4AFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] rounded"
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <div className="inline-flex items-center gap-0.5 text-[#6B7280] hover:text-[#6D4AFF] cursor-pointer transition-colors">
                <span>Accounts</span>
                <ChevronDown className="w-3 h-3 stroke-[2]" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="font-semibold text-[#111827] dark:text-white">
                {viewMode === "list"
                  ? "Asset Goods Receipt Note(GRN) List"
                  : "Asset Goods Receipt Note(GRN)"}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-[22px] font-semibold text-[#111827] dark:text-white tracking-[-0.01em]">
                {viewMode === "list"
                  ? "Asset Goods Receipt Note(GRN) List"
                  : viewMode === "create"
                    ? "New Asset Goods Receipt Note(GRN)"
                    : `Edit Asset Goods Receipt Note (${formData.code})`}
              </h1>
            </div>
            <p className="text-[14px] text-[#6B7280]">
              {viewMode === "list"
                ? "Manage procurement asset goods receipts, physical deliveries, and ledger accounting vouchers."
                : "Record verified asset deliveries with multi-line items, rates, and accounting ledgers."}
            </p>
          </div>

          {/* Right Action Button & Active/Deleted Tabs */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {viewMode === "list" ? (
              <>
                {/* 32px Segmented Active / Deleted Tabs */}
                <div className="h-8 inline-flex p-0.5 rounded-lg bg-[#E5E7EB] dark:bg-slate-800 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRecordsTab("active");
                      setCurrentPage(1);
                    }}
                    className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                      recordsTab === "active"
                        ? "bg-white dark:bg-slate-900 text-[#111827] dark:text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                        : "text-[#6B7280] hover:text-[#111827] dark:hover:text-white"
                    }`}
                  >
                    <span>Active</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        recordsTab === "active"
                          ? "bg-[#F4F1FF] text-[#6D4AFF]"
                          : "bg-slate-200 text-[#6B7280]"
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
                    className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                      recordsTab === "deleted"
                        ? "bg-white dark:bg-slate-900 text-[#B42318] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                        : "text-[#6B7280] hover:text-[#B42318]"
                    }`}
                  >
                    <Trash2 className="w-3 h-3 text-[#DC2626]" />
                    <span>Deleted</span>
                    {deletedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#B42318]">
                        {deletedCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* +New Goods Receipt Note(GRN) Button */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#039855] hover:bg-[#027A48] active:bg-[#05603A] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#039855] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.25]" />
                  <span>+New Goods Receipt Note(GRN)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] active:bg-[#4F32C7] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2 cursor-pointer"
              >
                <span>«Asset Goods Receipt Note(GRN) List</span>
              </button>
            )}
          </div>
        </div>

        {/* Server Fetch Error Alert Banner */}
        {fetchError && viewMode === "list" && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-center justify-between text-[13px] text-[#B42318]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>
                <strong>Backend Notification:</strong> {fetchError}
              </span>
            </div>
            <button
              type="button"
              onClick={loadGrns}
              className="px-3 py-1 bg-white border border-[#FECACA] text-[#B42318] hover:bg-[#FEE2E2] rounded-lg font-medium transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* LIST VIEW                                                           */}
        {/* =================================================================== */}
        {viewMode === "list" && (
          <div className="space-y-5">
            {/* Filter Card: Responsive Grid (1 col mobile, 2 tablet, 4 desktop, gap 12px, 36px controls) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Select Date */}
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                    Select Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: e.target.value,
                        }))
                      }
                      placeholder="e.g. 2026-10-01 - 2026-10-31"
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 tabular-nums"
                    />
                    <Calendar className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Company */}
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                    Company
                  </label>
                  <div className="relative">
                    <select
                      defaultValue="Somikoron IT Ltd"
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="Somikoron IT Ltd">Somikoron IT Ltd</option>
                      {dropdowns.companies.map((c) => (
                        <option key={c.uuid} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 3. Supplier */}
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                    Supplier
                  </label>
                  <div className="relative">
                    <select
                      value={filters.supplierId}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          supplierId: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="">Select an option</option>
                      {dropdowns.suppliers.map((s) => (
                        <option key={s.uuid} value={s.uuid}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 4. Project */}
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={filters.projectId}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          projectId: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="">Select value</option>
                      {dropdowns.projects.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 5. Title/Name of Work (Spans 3 cols on desktop) */}
                <div className="lg:col-span-3">
                  <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                    Title/Name of Work
                  </label>
                  <div className="relative">
                    <select
                      value={filters.titleOfWorkId}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          titleOfWorkId: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="">Select Title/Name of Work</option>
                      {dropdowns.titleOfWorks.map((tow) => (
                        <option key={tow.uuid} value={tow.uuid}>
                          {tow.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 6. Reset Filters Button (36px aligned to grid) */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    title="Reset all filters"
                    aria-label="Reset all filters"
                    className="h-9 px-3 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6B7280] dark:text-slate-300 hover:text-[#6D4AFF] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] text-[13px] font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[1.75]" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* TABLE CARD                                                      */}
            {/* =============================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              {/* Top Controls Bar (56px) */}
              <div className="h-14 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#F1F2F4] dark:border-slate-800">
                <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-slate-400">
                  <span>Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] cursor-pointer"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>entries</span>

                  <button
                    type="button"
                    onClick={loadGrns}
                    title="Refresh data from server"
                    aria-label="Refresh data"
                    className="w-8 h-8 ml-2 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6B7280] hover:text-[#6D4AFF] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {/* Server Search Input */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label
                    htmlFor="table-search"
                    className="text-[13px] text-[#6B7280] dark:text-slate-400 font-normal shrink-0"
                  >
                    Search:
                  </label>
                  <div className="relative w-full sm:w-56">
                    <input
                      id="table-search"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search records..."
                      className="h-8 w-full pl-3 pr-8 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 text-[13px] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* Inner Scroll Wrapper */}
              <div
                ref={tableContainerRef}
                className="w-full overflow-x-auto max-h-[640px] relative scrollbar-thin"
              >
                <table className="w-full border-collapse min-w-[1280px] text-left">
                  {/* Lavender Sticky Table Header */}
                  <thead
                    className={`sticky top-0 z-10 transition-shadow duration-140 ${
                      isScrolled
                        ? "shadow-[0_4px_8px_-4px_rgba(46,26,135,0.18)]"
                        : ""
                    }`}
                  >
                    <tr className="h-[46px] bg-[#E9E5FF] dark:bg-indigo-950/80 border-b-2 border-[#C9BFFF] dark:border-indigo-900">
                      {TABLE_COLUMNS.map((col, idx) => {
                        const isSorted = sortConfig.key === col.key;
                        const isFirst = idx === 0;
                        const isLast = idx === TABLE_COLUMNS.length - 1;

                        return (
                          <th
                            key={col.key}
                            scope="col"
                            aria-sort={
                              col.sortable
                                ? isSorted
                                  ? sortConfig.direction === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                                : undefined
                            }
                            onClick={() => col.sortable && handleSort(col.key)}
                            className={`h-[46px] px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap select-none transition-colors duration-140 ${
                              isFirst ? "rounded-tl-[12px]" : ""
                            } ${isLast ? "rounded-tr-[12px] pr-4 text-right" : ""} ${
                              col.align === "right" ? "text-right" : ""
                            } ${col.align === "center" ? "text-center" : ""} ${
                              col.sortable
                                ? "cursor-pointer hover:bg-[#DFD9FF] dark:hover:bg-indigo-900/60"
                                : "cursor-default"
                            } ${
                              isSorted
                                ? "bg-[#D2C9FF] dark:bg-indigo-900 text-[#3B1FA8] dark:text-indigo-200 border-b-[3px] border-[#6D4AFF]"
                                : "text-[#2E1A87] dark:text-indigo-200"
                            }`}
                          >
                            <div
                              className={`inline-flex items-center gap-1.5 ${
                                col.align === "right"
                                  ? "justify-end w-full"
                                  : col.align === "center"
                                    ? "justify-center w-full"
                                    : ""
                              }`}
                            >
                              <span>{col.label}</span>
                              {col.sortable && (
                                <span className="inline-flex shrink-0">
                                  {isSorted ? (
                                    sortConfig.direction === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#6D4AFF] stroke-[2.25]" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#6D4AFF] stroke-[2.25]" />
                                    )
                                  ) : (
                                    <ChevronUp className="w-3.5 h-3.5 text-[#7C6BD6] hover:text-[#2E1A87] stroke-[1.75] opacity-70" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800/80 text-[13px] text-[#374151] dark:text-slate-300">
                    {/* Rows */}
                    {sortedRows.map((row, idx) => (
                      <tr
                        key={row.uuid || row.id || idx}
                        className="h-14 hover:bg-[#FAFAFF] dark:hover:bg-slate-800/50 transition-colors duration-140"
                      >
                        {/* ID (Tabular Sans) */}
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white tabular-nums font-sans">
                          #{row.id || idx + 1}
                        </td>

                        {/* PROJECT TYPE */}
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#F2F4F7] text-[#344054] border border-[#E4E7EC] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {row.projectType?.name || "General"}
                          </span>
                        </td>

                        {/* PROJECT */}
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {row.project?.name || "—"}
                        </td>

                        {/* TITLE/NAME OF WORK */}
                        <td className="px-4 py-2 text-[#374151] dark:text-slate-300">
                          {row.titleOfWork?.name || "—"}
                        </td>

                        {/* SUPPLIER NAME */}
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {row.supplier?.supplierName || "—"}
                        </td>

                        {/* CODE (Tabular-nums sans) */}
                        <td className="px-4 py-2 font-sans font-medium text-[#111827] dark:text-slate-200 tabular-nums">
                          {row.code || "—"}
                        </td>

                        {/* REFERENCE */}
                        <td className="px-4 py-2 text-[#6B7280] dark:text-slate-400 font-sans tabular-nums">
                          {row.reference || "—"}
                        </td>

                        {/* DATE */}
                        <td className="px-4 py-2 text-[#6B7280] dark:text-slate-400 whitespace-nowrap font-sans tabular-nums">
                          {row.date || "—"}
                        </td>

                        {/* SUB TOTAL */}
                        <td className="px-4 py-2 text-right font-medium text-[#111827] dark:text-slate-200 tabular-nums">
                          ৳{Number(row.subtotal || 0).toLocaleString()}
                        </td>

                        {/* GRAND TOTAL */}
                        <td className="px-4 py-2 text-right font-semibold text-[#111827] dark:text-white tabular-nums">
                          ৳{Number(row.grand_total || 0).toLocaleString()}
                        </td>

                        {/* ADDED BY */}
                        <td className="px-4 py-2 text-[#6B7280] dark:text-slate-400">
                          {row.addedBy?.name || "System"}
                        </td>

                        {/* ATTACHMENT */}
                        <td className="px-4 py-2 text-center">
                          {row.attachment ? (
                            <button
                              type="button"
                              onClick={() =>
                                showToast(
                                  `Opening attachment: ${row.attachment}`,
                                  "info",
                                )
                              }
                              title="Download Attachment"
                              aria-label={`Download attachment for ${row.code}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#6D4AFF] bg-[#F4F1FF] border border-[#DDD6FE] hover:bg-[#E9E5FF] transition-colors"
                            >
                              <Paperclip className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>

                        {/* APPROVAL (Soft Pill) */}
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                              row.status === "approved"
                                ? "bg-[#ECFDF3] text-[#027A48]"
                                : row.status === "rejected"
                                  ? "bg-[#FEF3F2] text-[#B42318]"
                                  : "bg-[#FFFAEB] text-[#B54708]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                row.status === "approved"
                                  ? "bg-[#12B76A]"
                                  : row.status === "rejected"
                                    ? "bg-[#F04438]"
                                    : "bg-[#F79009]"
                              }`}
                            />
                            <span className="capitalize">
                              {row.status || "Pending"}
                            </span>
                          </span>
                        </td>

                        {/* Action Buttons (Tinted at rest, never clipped) */}
                        <td className="px-4 py-2 text-right min-w-[144px] whitespace-nowrap pr-4">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/* View Action (Blue Tint) */}
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(row)}
                              title="View Details"
                              aria-label={`View details of ${row.code}`}
                              className="w-8 h-8 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#BFDBFE] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 stroke-[1.75]" />
                            </button>

                            {/* Edit Action (Purple Tint) */}
                            {recordsTab === "active" && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                title="Edit Record"
                                aria-label={`Edit ${row.code}`}
                                className="w-8 h-8 rounded-lg border border-[#DDD6FE] bg-[#F4F1FF] text-[#6D4AFF] hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#DDD6FE] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2 cursor-pointer"
                              >
                                <SquarePen className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            )}

                            {/* Soft Delete Action (Red Tint) */}
                            {recordsTab === "active" ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                title="Soft-delete Record"
                                aria-label={`Soft-delete ${row.code}`}
                                className="w-8 h-8 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#B91C1C] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#FECACA] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
                                Soft Delete
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Empty State: Lavender Header Remains Visible */}
                    {sortedRows.length === 0 && !isLoading && (
                      <tr>
                        <td
                          colSpan={TABLE_COLUMNS.length}
                          className="px-4 py-16 text-center"
                        >
                          <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-full bg-[#F4F1FF] dark:bg-slate-800 flex items-center justify-center text-[#6D4AFF]">
                              <PackageCheck className="w-6 h-6 stroke-[1.75]" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                              {recordsTab === "active"
                                ? "No Active Goods Receipt Notes"
                                : "No Deleted Goods Receipt Notes"}
                            </h3>
                            <p className="text-[13px] text-[#6B7280] dark:text-slate-400">
                              {search || filters.supplierId || filters.projectId
                                ? "No matching records found for your active filters. Try clearing filters to see all entries."
                                : recordsTab === "active"
                                  ? "No active asset goods receipt notes recorded yet. Click below to add an entry."
                                  : "There are currently no soft-deleted asset goods receipt notes."}
                            </p>
                            {recordsTab === "active" && (
                              <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="mt-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
                              >
                                +New Goods Receipt Note
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Loading State Skeleton */}
                    {isLoading && (
                      <tr>
                        <td
                          colSpan={TABLE_COLUMNS.length}
                          className="px-4 py-12 text-center"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[#6D4AFF]" />
                            <span className="text-[13px] text-[#6B7280]">
                              Loading Asset Goods Receipt Notes...
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer (56px) */}
              <div className="h-14 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F1F2F4] dark:border-slate-800 text-[13px] text-[#6B7280] dark:text-slate-400">
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-[#111827] dark:text-slate-200">
                    {sortedRows.length === 0
                      ? 0
                      : (currentPage - 1) * entriesPerPage + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="font-semibold text-[#111827] dark:text-slate-200">
                    {Math.min(currentPage * entriesPerPage, totalEntries)}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-[#111827] dark:text-slate-200">
                    {totalEntries}
                  </strong>{" "}
                  entries
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-[#F4F1FF] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>

                  <div className="h-8 px-3 rounded-lg bg-[#6D4AFF] text-white text-[13px] font-semibold flex items-center justify-center">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-[#F4F1FF] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* CREATE / EDIT FORM VIEW (Documented Schema & Swagger Compliant)      */}
        {/* =================================================================== */}
        {viewMode !== "list" && (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {formError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-center gap-2.5 text-[13px] text-[#B42318]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Header Card with 2px #E9E5FF top anchor */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              <div className="h-1 bg-[#E9E5FF] w-full" />
              <div className="p-5 space-y-4">
                <h2 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Header Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Row 1: Date */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Date <span className="text-[#D92D20]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 tabular-nums cursor-pointer"
                    />
                  </div>

                  {/* Row 1: Supplier* */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Supplier <span className="text-[#D92D20]">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <select
                          required
                          value={formData.supplier_id}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              supplier_id: e.target.value,
                            }))
                          }
                          className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                        >
                          <option value="">Select Supplier</option>
                          {dropdowns.suppliers.map((s) => (
                            <option key={s.uuid} value={s.uuid}>
                              {s.supplierName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                      </div>
                    </div>
                  </div>

                  {/* Row 1: Ledger* */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Ledger <span className="text-[#D92D20]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.ledger_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            ledger_id: val,
                            ledger_name:
                              val === "1010"
                                ? "1010 - Capital Assets / Machinery"
                                : val === "1020"
                                  ? "1020 - IoT & Automation Assets"
                                  : val === "1015"
                                    ? "1015 - HVAC Systems & Plant"
                                    : "1030 - Computer & Office Equipment",
                          }));
                        }}
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="1010">
                          1010 - Capital Assets / Machinery
                        </option>
                        <option value="1020">
                          1020 - IoT &amp; Automation Assets
                        </option>
                        <option value="1015">
                          1015 - HVAC Systems &amp; Plant
                        </option>
                        <option value="1030">
                          1030 - Computer &amp; Office Equipment
                        </option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 1: Code */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="e.g. PUR7915599"
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 font-sans tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140"
                    />
                  </div>

                  {/* Row 2: Project Type */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Project Type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.project_type_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            project_type_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Project Type</option>
                        {dropdowns.projectTypes.map((pt) => (
                          <option key={pt.uuid} value={pt.uuid}>
                            {pt.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 2: Project */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Project
                    </label>
                    <div className="relative">
                      <select
                        value={formData.project_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            project_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Project</option>
                        {dropdowns.projects.map((p) => (
                          <option key={p.uuid} value={p.uuid}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 2: Title/Name of Work */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Title/Name of Work
                    </label>
                    <div className="relative">
                      <select
                        value={formData.title_of_work_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title_of_work_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Title/Name of Work</option>
                        {dropdowns.titleOfWorks.map((tow) => (
                          <option key={tow.uuid} value={tow.uuid}>
                            {tow.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 2: If Task */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      If Task
                    </label>
                    <div className="relative">
                      <select
                        value={formData.task_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            task_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Task</option>
                        {dropdowns.tasks.map((t) => (
                          <option key={t.uuid} value={t.uuid}>
                            {t.taskName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 3: Site */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Site
                    </label>
                    <div className="relative">
                      <select
                        value={formData.site_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            site_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Site</option>
                        {dropdowns.sites.map((s) => (
                          <option key={s.uuid} value={s.uuid}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 3: Category */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            category_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {dropdowns.categories.map((c) => (
                          <option key={c.uuid} value={c.uuid}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Row 3: Select Item with [+] button */}
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Select Item
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <select
                          value={formData.selectedItemUuid}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedItemUuid: e.target.value,
                            }))
                          }
                          className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                        >
                          <option value="">Select Item</option>
                          {dropdowns.items.map((itm) => (
                            <option key={itm.uuid} value={itm.uuid}>
                              {itm.item_code} - {itm.name} (৳
                              {Number(itm.purchase_price || 0).toLocaleString()}
                              )
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItemToForm}
                        title="Add Item to Breakdown Table"
                        aria-label="Add item"
                        className="w-9 h-9 rounded-lg bg-[#6D4AFF] text-white flex items-center justify-center hover:bg-[#5B3BE0] transition-colors shrink-0 shadow-sm"
                      >
                        <Plus className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Complex Item Table Section with Lavender Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              <div className="h-1 bg-[#E9E5FF] w-full" />
              <div className="p-4 border-b border-[#F1F2F4] dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#6D4AFF]" />
                  <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    Received Asset Items Breakdown
                  </h3>
                </div>
                <span className="text-[12px] text-[#6B7280]">
                  {formData.items.length} item(s) in delivery list
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px] text-left">
                  <thead>
                    <tr className="h-[46px] bg-[#E9E5FF] dark:bg-indigo-950/80 border-b-2 border-[#C9BFFF] dark:border-indigo-900 text-[#2E1A87] dark:text-indigo-200 text-[11.5px] font-bold uppercase tracking-[0.06em]">
                      <th className="px-4 py-2 w-[140px]">ITEM CODE</th>
                      <th className="px-4 py-2 w-[220px]">ITEM NAME</th>
                      <th className="px-4 py-2">DETAILS</th>
                      <th className="px-4 py-2 w-[90px]">UNIT</th>
                      <th className="px-4 py-2 w-[110px] text-right">
                        QUANTITY
                      </th>
                      <th className="px-4 py-2 w-[120px] text-right">RATE</th>
                      <th className="px-4 py-2 w-[130px] text-right">AMOUNT</th>
                      <th className="px-4 py-2 w-[80px] text-right pr-4">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800 text-[13px]">
                    {formData.items.map((item) => (
                      <tr
                        key={item.tempId}
                        className="hover:bg-[#FAFAFF] dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-2 font-medium font-sans tabular-nums text-[#111827] dark:text-slate-200">
                          {item.item_code}
                        </td>
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.details}
                            onChange={(e) =>
                              handleItemFieldChange(
                                item.tempId,
                                "details",
                                e.target.value,
                              )
                            }
                            placeholder="Specification details..."
                            className="h-8 w-full px-2 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#6D4AFF]"
                          />
                        </td>
                        <td className="px-4 py-2 text-[#6B7280]">
                          {item.unit}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                item.tempId,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="h-8 w-20 px-2 text-right text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-200 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#6D4AFF]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemFieldChange(
                                item.tempId,
                                "rate",
                                e.target.value,
                              )
                            }
                            className="h-8 w-24 px-2 text-right text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-200 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#6D4AFF]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-[#111827] dark:text-white tabular-nums">
                          ৳{item.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            title="Remove line item"
                            aria-label={`Remove ${item.item_name}`}
                            className="w-8 h-8 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.75]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {formData.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-[#9CA3AF]"
                        >
                          No line items added yet. Select an item in the Header
                          Card above and click &quot;+&quot; to populate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Summary & Financial Verification Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              <div className="h-1 bg-[#E9E5FF] w-full" />
              <div className="p-5 space-y-4">
                <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
                  Financial Settlement &amp; Verification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                  {/* SUBTOTAL */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Subtotal
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`৳${formData.subTotal.toLocaleString()}`}
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-[#111827] dark:text-white tabular-nums focus:outline-none"
                    />
                  </div>

                  {/* DISCOUNT */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discount || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, discount: val }));
                        updateFormTotals(formData.items, val, formData.paid);
                      }}
                      placeholder="0"
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF]"
                    />
                  </div>

                  {/* GRAND TOTAL (Dominant display 18/600 in #4F32C7) */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Grand Total
                    </label>
                    <div className="h-9 px-3 rounded-lg border border-[#DDD6FE] bg-[#F4F1FF] flex items-center">
                      <span className="text-[16px] font-bold text-[#4F32C7] tabular-nums">
                        ৳{formData.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* PAID */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Paid
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.paid || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, paid: val }));
                        updateFormTotals(
                          formData.items,
                          formData.discount,
                          val,
                        );
                      }}
                      placeholder="0"
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF]"
                    />
                  </div>

                  {/* DUE */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Due
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`৳${formData.due.toLocaleString()}`}
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-[#B42318] tabular-nums focus:outline-none"
                    />
                  </div>

                  {/* NOTE/COMMENTS */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Note / Comments
                    </label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      placeholder="Remarks..."
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF]"
                    />
                  </div>

                  {/* ATTACHMENT */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                      Attachment
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev) => ({
                              ...prev,
                              attachment: file.name,
                            }));
                            showToast(`Selected file: ${file.name}`, "info");
                          }
                        }}
                        className="sr-only"
                      />
                      <label
                        htmlFor="file-upload"
                        className="h-9 w-full px-2.5 rounded-lg border border-dashed border-[#C4B5FD] bg-[#F4F1FF] text-[#6D4AFF] hover:bg-[#E9E5FF] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer truncate"
                      >
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {formData.attachment || "Choose File"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="h-9 px-5 rounded-lg text-[13px] font-medium text-[#374151] dark:text-slate-300 border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F4F1FF] hover:border-[#DDD6FE] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-8 rounded-lg text-[13px] font-semibold text-white bg-[#039855] hover:bg-[#027A48] active:bg-[#05603A] shadow-sm inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#039855] focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW DETAILS MODAL                                                   */}
      {/* ===================================================================== */}
      {viewItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-140"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="h-1 bg-[#E9E5FF] w-full" />
            <div className="px-5 py-4 border-b border-[#F1F2F4] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] flex items-center justify-center font-bold">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                    Goods Receipt Note: {viewItem.code || viewItem.uuid}
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Verified physical inspection record
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F1FF] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-[13px]">
              {isDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#6B7280]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6D4AFF]" />
                  <span>Loading full details from server...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F7F8FA] dark:bg-slate-800/50 p-3 rounded-lg border border-[#E5E7EB] dark:border-slate-800">
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Supplier
                      </span>
                      <span className="font-semibold text-[#111827] dark:text-white">
                        {viewItem.supplier?.supplierName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Date
                      </span>
                      <span className="font-medium font-sans tabular-nums">
                        {viewItem.date}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Reference
                      </span>
                      <span className="font-medium font-sans tabular-nums">
                        {viewItem.reference || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Project
                      </span>
                      <span className="font-medium">
                        {viewItem.project?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Ledger
                      </span>
                      <span className="font-medium">
                        {viewItem.ledger_name || "General Capital Asset"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[11px] uppercase">
                        Status
                      </span>
                      <span className="font-semibold capitalize text-[#027A48]">
                        {viewItem.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Items Breakdown Table in Modal */}
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#111827] dark:text-white mb-2">
                      Received Items ({viewItem.items?.length || 0})
                    </h4>
                    <div className="border border-[#E5E7EB] dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-[#E9E5FF] text-[#2E1A87] font-bold">
                          <tr>
                            <th className="px-3 py-2">Code</th>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Rate</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800">
                          {viewItem.items && viewItem.items.length > 0 ? (
                            viewItem.items.map((itm, idx) => (
                              <tr key={itm.uuid || idx}>
                                <td className="px-3 py-2 font-sans tabular-nums">
                                  {itm.item_code}
                                </td>
                                <td className="px-3 py-2 font-medium text-[#111827] dark:text-white">
                                  {itm.item_name}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {itm.quantity} {itm.unit || "Pcs"}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  ৳{Number(itm.rate).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                  ৳
                                  {(
                                    Number(itm.quantity) * Number(itm.rate)
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-4 text-center text-[#9CA3AF]"
                              >
                                No line item breakdown available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Totals */}
                  <div className="flex justify-end pt-2">
                    <div className="w-56 space-y-1.5 text-right">
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Subtotal:</span>
                        <span className="tabular-nums font-medium text-[#111827] dark:text-white">
                          ৳{Number(viewItem.subtotal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Discount:</span>
                        <span className="tabular-nums">
                          ৳{Number(viewItem.discount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#E5E7EB] font-bold text-[14px] text-[#4F32C7]">
                        <span>Grand Total:</span>
                        <span className="tabular-nums">
                          ৳{Number(viewItem.grand_total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#F1F2F4] dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="h-8 px-4 rounded-lg text-[13px] font-medium text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION DIALOG                                           */}
      {/* ===================================================================== */}
      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-140"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#FECACA] dark:border-rose-900 shadow-[0_8px_24px_rgba(16,24,40,0.08)] max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Soft-delete Goods Receipt Note?
                </h3>
                <p className="text-[13px] text-[#6B7280]">
                  Are you sure you want to soft-delete{" "}
                  <strong className="text-[#111827] dark:text-white font-medium">
                    {deleteTarget.code || deleteTarget.uuid}
                  </strong>
                  ? The record will be moved to the Deleted tab.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="h-8 px-3.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-8 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
