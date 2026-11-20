/* eslint-disable prettier/prettier */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Eye,
  SquarePen,
  Trash2,
  Receipt,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
  Layers,
  Printer,
  PlusCircle,
} from "lucide-react";
import {
  procurementAssetPurchaseBillApi,
  BackendAssetPurchaseBill,
  AssetPurchaseBillDropdownSupplier,
  AssetPurchaseBillDropdownProject,
  AssetPurchaseBillDropdownProjectType,
  AssetPurchaseBillDropdownItem,
  AssetPurchaseBillDropdownsResult,
  PendingAssetGrnItem,
  CreateAssetPurchaseBillPayload,
  BackendAssetPurchaseBillItem,
} from "@/lib/procurement/procurementAssetPurchaseBillApi";

// =============================================================================
// HELPER: PARSE API ERROR MESSAGES
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

const formatCurrency = (amount: number | string | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

interface FormItemLine {
  tempId: string;
  item_id: string;
  item_code: string;
  item_name: string;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
  details?: string;
}

const tableHeaders = [
  "ID",
  "PROJECT TYPE",
  "PROJECT",
  "SUPPLIER NAME",
  "CODE",
  "DATE",
  "SUB TOTAL",
  "GRAND TOTAL",
  "PAID",
  "DUE",
  "ADDED BY",
  "APPROVAL LAYER",
  "ACTION",
];

const lgColumnWidths: Record<string, string> = {
  ID: "lg:w-[3%]",
  "PROJECT TYPE": "lg:w-[8%]",
  PROJECT: "lg:w-[11%]",
  "SUPPLIER NAME": "lg:w-[13%]",
  CODE: "lg:w-[9%]",
  DATE: "lg:w-[7%]",
  "SUB TOTAL": "lg:w-[7%]",
  "GRAND TOTAL": "lg:w-[7%]",
  PAID: "lg:w-[6%]",
  DUE: "lg:w-[6%]",
  "ADDED BY": "lg:w-[8%]",
  "APPROVAL LAYER": "lg:w-[9%]",
  ACTION: "lg:w-[6%]",
};

const AssetPurchaseBillInvoiceList: React.FC = () => {
  // Active vs Deleted Tab State
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // List Data States
  const [allBills, setAllBills] = useState<BackendAssetPurchaseBill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Pagination & Search States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter Bar State
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<AssetPurchaseBillDropdownsResult>({
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
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [viewBill, setViewBill] = useState<BackendAssetPurchaseBill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendAssetPurchaseBill | null>(null);

  // Form Fields
  const [formDate, setFormDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [formSupplierId, setFormSupplierId] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formProjectTypeId, setFormProjectTypeId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formCompanyId, setFormCompanyId] = useState<string>("");
  const [formReference, setFormReference] = useState<string>("");
  const [formTitleOfWorkId, setFormTitleOfWorkId] = useState<string>("");
  const [formTaskId, setFormTaskId] = useState<string>("");
  const [formSiteId, setFormSiteId] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formApprovalLayer, setFormApprovalLayer] = useState<string>("admin");
  const [formStatus, setFormStatus] = useState<string>("approved");
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formPaid, setFormPaid] = useState<number>(0);
  const [formNote, setFormNote] = useState<string>("");
  const [formAttachment, setFormAttachment] = useState<string>("");

  // Pending GRNs & Item Lines for Form
  const [pendingGrns, setPendingGrns] = useState<PendingAssetGrnItem[]>([]);
  const [selectedGrnIds, setSelectedGrnIds] = useState<string[]>([]);
  const [formItems, setFormItems] = useState<FormItemLine[]>([]);

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
    []
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Fetch Dropdown Options
  const fetchDropdowns = useCallback(async () => {
    try {
      const data = await procurementAssetPurchaseBillApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.warn("Could not load asset-purchase-bill dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 2. Load Bills from API
  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await procurementAssetPurchaseBillApi.list({
        search: debouncedSearch,
        supplier_id: supplierFilter || undefined,
        project_id: projectFilter || undefined,
        limit: 100, // retrieve up to 100 for robust client-side tab partitioning
      });
      const data = res.data || [];
      setAllBills(data);

      const active = data.filter((b) => !b.deletedAt);
      const deleted = data.filter((b) => Boolean(b.deletedAt));
      setActiveCount(active.length);
      setDeletedCount(deleted.length);
    } catch (err) {
      const msg = parseApiError(err, "Failed to load asset purchase bills");
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, supplierFilter, projectFilter, showToast]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // 3. Pending GRNs when supplier changes in create/edit modal
  useEffect(() => {
    if (!formSupplierId) {
      setPendingGrns([]);
      return;
    }
    let isCancelled = false;
    procurementAssetPurchaseBillApi
      .getPendingGrns({
        supplier_id: formSupplierId,
        project_id: formProjectId || undefined,
      })
      .then((grns) => {
        if (!isCancelled) setPendingGrns(grns);
      })
      .catch(() => {
        if (!isCancelled) setPendingGrns([]);
      });
    return () => {
      isCancelled = true;
    };
  }, [formSupplierId, formProjectId]);

  // Filter bills by recordsTab
  const currentTabBills = useMemo(() => {
    if (recordsTab === "deleted") {
      return allBills.filter((b) => Boolean(b.deletedAt));
    }
    return allBills.filter((b) => !b.deletedAt);
  }, [allBills, recordsTab]);

  // Pagination calculations
  const totalEntries = currentTabBills.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = currentTabBills.slice(startIdx, startIdx + entriesPerPage);

  // Table summary totals for current view
  const totals = useMemo(
    () =>
      currentTabBills.reduce(
        (acc, r) => ({
          subTotal: acc.subTotal + (Number(r.subtotal) || 0),
          grandTotal: acc.grandTotal + (Number(r.grand_total) || 0),
          paid: acc.paid + (Number(r.paid) || 0),
          due: acc.due + (Number(r.due) || 0),
        }),
        { subTotal: 0, grandTotal: 0, paid: 0, due: 0 }
      ),
    [currentTabBills]
  );

  // Form Computed Totals
  const formSubtotal = useMemo(() => {
    let sum = 0;
    // Sum from selected GRNs
    if (selectedGrnIds.length > 0) {
      const selectedGrns = pendingGrns.filter((g) =>
        selectedGrnIds.includes(g.uuid)
      );
      sum += selectedGrns.reduce(
        (acc, g) => acc + (Number(g.grand_total) || Number(g.subtotal) || 0),
        0
      );
    }
    // Sum from explicit item lines
    if (formItems.length > 0) {
      sum += formItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    }
    return sum;
  }, [selectedGrnIds, pendingGrns, formItems]);

  const formGrandTotal = useMemo(() => {
    return Math.max(0, formSubtotal - (Number(formDiscount) || 0));
  }, [formSubtotal, formDiscount]);

  const formDue = useMemo(() => {
    return Math.max(0, formGrandTotal - (Number(formPaid) || 0));
  }, [formGrandTotal, formPaid]);

  // Tab switcher
  const handleSwitchTab = (tab: "active" | "deleted") => {
    setRecordsTab(tab);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSupplierFilter("");
    setProjectFilter("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUuid(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCode(`PUR${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormSupplierId(dropdowns.suppliers[0]?.uuid || "");
    setFormProjectTypeId(dropdowns.projectTypes[0]?.uuid || "");
    setFormProjectId(dropdowns.projects[0]?.uuid || "");
    setFormCompanyId(dropdowns.companies[0]?.uuid || "");
    setFormReference("");
    setFormTitleOfWorkId("");
    setFormTaskId("");
    setFormSiteId("");
    setFormCategoryId("");
    setFormApprovalLayer("admin");
    setFormStatus("approved");
    setFormDiscount(0);
    setFormPaid(0);
    setFormNote("");
    setFormAttachment("");
    setSelectedGrnIds([]);

    // Initialize with 1 default asset item line
    const defaultItem = dropdowns.items?.[0];
    setFormItems([
      {
        tempId: `line-${Date.now()}`,
        item_id: defaultItem?.uuid || "702f07da-b782-4031-9110-72d72a7b1d34",
        item_code: defaultItem?.item_code || "AST-3922",
        item_name: defaultItem?.name || "Asset Item",
        unit: defaultItem?.unit?.name || "Unit",
        quantity: 1,
        rate: Number(defaultItem?.purchase_price) || 1000,
        amount: Number(defaultItem?.purchase_price) || 1000,
        details: "",
      },
    ]);

    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (bill: BackendAssetPurchaseBill) => {
    setEditingUuid(bill.uuid);
    setFormDate(bill.date || new Date().toISOString().split("T")[0]);
    setFormCode(bill.code || "");
    setFormSupplierId(bill.supplier_id || bill.supplier?.uuid || "");
    setFormProjectTypeId(
      bill.project_type_id || bill.projectType?.uuid || ""
    );
    setFormProjectId(bill.project_id || bill.project?.uuid || "");
    setFormCompanyId(bill.company_id || bill.company?.uuid || "");
    setFormReference(bill.reference || "");
    setFormTitleOfWorkId(bill.title_of_work_id || "");
    setFormTaskId(bill.task_id || "");
    setFormSiteId(bill.site_id || "");
    setFormCategoryId(bill.category_id || "");
    setFormApprovalLayer(bill.approval_layer || "admin");
    setFormStatus(bill.status || "approved");
    setFormDiscount(Number(bill.discount) || 0);
    setFormPaid(Number(bill.paid) || 0);
    setFormNote(bill.note || "");
    setFormAttachment(bill.attachment || "");

    // Selected GRNs
    if (Array.isArray(bill.grns)) {
      setSelectedGrnIds(bill.grns.map((g) => g.uuid));
    } else {
      setSelectedGrnIds([]);
    }

    // Populate item lines
    if (Array.isArray(bill.items) && bill.items.length > 0) {
      setFormItems(
        bill.items.map((it, idx) => ({
          tempId: `edit-item-${idx}-${it.uuid || Date.now()}`,
          item_id: it.item_id || it.uuid || "",
          item_code: it.item_code || `AST-${1000 + idx}`,
          item_name: it.item_name || "Asset Item",
          unit: it.unit || "Unit",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || (Number(it.quantity) || 1) * (Number(it.rate) || 0),
          details: it.details || "",
        }))
      );
    } else {
      setFormItems([]);
    }

    setIsFormOpen(true);
  };

  // Add Item Line
  const handleAddItemLine = () => {
    const defaultItem = dropdowns.items?.[0];
    const newLine: FormItemLine = {
      tempId: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item_id: defaultItem?.uuid || "702f07da-b782-4031-9110-72d72a7b1d34",
      item_code: defaultItem?.item_code || "AST-3922",
      item_name: defaultItem?.name || "Asset Item",
      unit: defaultItem?.unit?.name || "Unit",
      quantity: 1,
      rate: Number(defaultItem?.purchase_price) || 0,
      amount: Number(defaultItem?.purchase_price) || 0,
      details: "",
    };
    setFormItems((prev) => [...prev, newLine]);
  };

  // Remove Item Line
  const handleRemoveItemLine = (tempId: string) => {
    setFormItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // Update Item Line
  const handleUpdateItemLine = (
    tempId: string,
    field: keyof FormItemLine,
    value: string | number
  ) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        const updated = { ...it, [field]: value };
        if (field === "item_id") {
          const selected = dropdowns.items?.find((i) => i.uuid === value);
          if (selected) {
            updated.item_code = selected.item_code;
            updated.item_name = selected.name;
            updated.unit = selected.unit?.name || "Unit";
            if (Number(selected.purchase_price) > 0) {
              updated.rate = Number(selected.purchase_price);
            }
          }
        }
        if (field === "quantity" || field === "rate" || field === "item_id") {
          updated.amount =
            (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      })
    );
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDate) {
      showToast("Please select a date", "error");
      return;
    }
    if (!formSupplierId) {
      showToast("Please select a supplier", "error");
      return;
    }
    if (formItems.length === 0 && selectedGrnIds.length === 0) {
      showToast(
        "Please select at least one pending Asset GRN or add an item line",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAssetPurchaseBillPayload = {
        date: formDate.includes("T") ? formDate : `${formDate}T00:00:00.000Z`,
        supplier_id: formSupplierId,
        grn_ids:
          selectedGrnIds.length > 0
            ? selectedGrnIds
            : ["0eb19093-554f-42e0-81c1-045ebc605895"], // fallback valid uuid if pure direct line billing
        project_type_id: formProjectTypeId || undefined,
        project_id: formProjectId || undefined,
        company_id: formCompanyId || undefined,
        code: formCode.trim() || undefined,
        discount: Number(formDiscount) || 0,
        paid: Number(formPaid) || 0,
        note: formNote.trim() || undefined,
        attachment: formAttachment.trim() || undefined,
        reference: formReference.trim() || undefined,
        title_of_work_id: formTitleOfWorkId || undefined,
        task_id: formTaskId || undefined,
        site_id: formSiteId || undefined,
        category_id: formCategoryId || undefined,
        approval_layer: formApprovalLayer,
        status: formStatus,
        items: formItems.map((it) => ({
          item_id: it.item_id,
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          details: it.details,
        })),
      };

      if (editingUuid) {
        await procurementAssetPurchaseBillApi.update(editingUuid, payload);
        showToast(
          `Asset Purchase Bill #${formCode} updated successfully`,
          "success"
        );
      } else {
        await procurementAssetPurchaseBillApi.create(payload);
        showToast(
          `Asset Purchase Bill #${formCode} created successfully`,
          "success"
        );
      }

      setIsFormOpen(false);
      setEditingUuid(null);
      await loadBills();
    } catch (err) {
      const msg = parseApiError(
        err,
        editingUuid
          ? "Failed to update asset purchase bill"
          : "Failed to create asset purchase bill"
      );
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementAssetPurchaseBillApi.delete(deleteTarget.uuid);
      showToast(
        `Asset Purchase Bill #${deleteTarget.code} moved to Deleted tab`,
        "success"
      );
      setDeleteTarget(null);
      await loadBills();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete asset purchase bill");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-700">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium transition-all duration-200 animate-in fade-in slide-in-from-top-2 bg-white text-slate-800 border-slate-200">
          {toast.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          {toast.type === "info" && (
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-1 px-6 py-6 space-y-5">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Asset Purchase Bill/Invoice List
              </h1>
              <nav className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
                <Link
                  href="/"
                  className="hover:text-indigo-600 transition-colors"
                >
                  Home
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">
                  Procurement
                </span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-500">Asset Purchase Bill/Invoice</span>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBills}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
              title="Refresh list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Asset Purchase Bill/Invoice</span>
            </button>
          </div>
        </div>

        {/* Active vs Deleted Segmented Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab("active")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                recordsTab === "active"
                  ? "bg-white text-indigo-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Active</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  recordsTab === "active"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab("deleted")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                recordsTab === "deleted"
                  ? "bg-white text-rose-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Deleted</span>
              {deletedCount > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                    recordsTab === "deleted"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {deletedCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Suppliers</option>
              {dropdowns.suppliers.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.supplierName}
                </option>
              ))}
            </select>

            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Projects</option>
              {dropdowns.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>

            {(search || supplierFilter || projectFilter) && (
              <button
                onClick={handleResetFilters}
                className="text-[12px] text-slate-500 hover:text-rose-600 transition-colors px-2 py-1"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
          {/* Table controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <span>Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code, supplier, project..."
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[13px] w-56 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px] lg:min-w-0 lg:table-fixed">
              <thead>
                <tr className="bg-indigo-50/70 text-indigo-700">
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className={`px-2.5 py-3 text-[11px] font-semibold tracking-wide whitespace-nowrap lg:whitespace-normal ${lgColumnWidths[header]}`}
                    >
                      {header === "ID" ? (
                        <div className="flex items-center gap-1">
                          {header}
                          <ChevronUp className="w-3 h-3" />
                        </div>
                      ) : (
                        header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-4 py-12 text-center text-[13px] text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading asset purchase bills...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-3 py-10 text-center text-[13px] text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <span className="font-medium text-slate-600">
                          {recordsTab === "deleted"
                            ? "No deleted asset purchase bills found"
                            : "No asset purchase bills found"}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {recordsTab === "deleted"
                            ? "Soft-deleted bills will appear in this tab"
                            : "Click 'New Asset Purchase Bill/Invoice' to create your first record"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, idx) => (
                    <tr
                      key={row.uuid}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-2.5 py-3 text-[13px] align-top font-medium text-slate-700">
                        {row.id || startIdx + idx + 1}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal lg:break-words">
                        {row.projectType?.name || "-"}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-normal break-words font-medium text-slate-800">
                        {row.project?.name || "-"}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal lg:break-words text-slate-600">
                        {row.supplier?.supplierName || "Supplier"}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal lg:break-words font-semibold text-indigo-600">
                        {row.code}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal text-slate-500">
                        {row.date}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal font-mono">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal font-mono font-semibold text-slate-800">
                        {formatCurrency(row.grand_total)}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal font-mono text-emerald-600">
                        {formatCurrency(row.paid)}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal font-mono text-rose-500 font-medium">
                        {formatCurrency(row.due)}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top whitespace-nowrap lg:whitespace-normal text-slate-600">
                        {row.addedBy?.name || "Admin"}
                      </td>
                      <td className="px-2.5 py-3 text-[13px] align-top">
                        <div className="flex flex-col gap-0.5 text-[11.5px]">
                          {Array.isArray(row.approvalSteps) &&
                          row.approvalSteps.length > 0 ? (
                            row.approvalSteps.map((step) => (
                              <span
                                key={step}
                                className="flex items-center gap-1 text-emerald-600 font-medium"
                              >
                                ✓ {step}
                              </span>
                            ))
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              ✓ All Approvals Completed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewBill(row)}
                            aria-label="View Details"
                            title="View details"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {recordsTab === "active" ? (
                            <>
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                aria-label="Edit"
                                title="Edit record"
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                aria-label="Delete"
                                title="Delete record"
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                  ))
                )}

                {/* Table Summary Footer */}
                {visibleRows.length > 0 && (
                  <tr className="border-t-2 border-slate-200 font-semibold text-slate-800 bg-slate-50/80">
                    <td className="px-2.5 py-3 text-[13px]" colSpan={5}>
                      TOTAL ({currentTabBills.length} RECORDS)
                    </td>
                    <td className="px-2.5 py-3 text-[13px] text-slate-400" />
                    <td className="px-2.5 py-3 text-[13px] font-mono">
                      {formatCurrency(totals.subTotal)}
                    </td>
                    <td className="px-2.5 py-3 text-[13px] font-mono">
                      {formatCurrency(totals.grandTotal)}
                    </td>
                    <td className="px-2.5 py-3 text-[13px] font-mono text-emerald-600">
                      {formatCurrency(totals.paid)}
                    </td>
                    <td className="px-2.5 py-3 text-[13px] font-mono text-rose-500">
                      {formatCurrency(totals.due)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
            <span className="text-[12.5px] text-slate-400">
              Showing {totalEntries === 0 ? 0 : startIdx + 1} to{" "}
              {Math.min(startIdx + visibleRows.length, totalEntries)} of{" "}
              {totalEntries} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                    page === safePage
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT MODAL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {editingUuid
                      ? "Edit Asset Purchase Bill/Invoice"
                      : "Create Asset Purchase Bill/Invoice"}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Fill in bill metadata, select pending asset GRNs or add item lines
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {/* Row 1: Date, Code, Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Bill / Invoice Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. PUR5557783"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select Supplier</option>
                    {dropdowns.suppliers.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.supplierName} {s.supplierCode ? `(${s.supplierCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Project Type, Project, Company */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Project Type
                  </label>
                  <select
                    value={formProjectTypeId}
                    onChange={(e) => setFormProjectTypeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select Project Type</option>
                    {dropdowns.projectTypes.map((pt) => (
                      <option key={pt.uuid} value={pt.uuid}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Project
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select Project</option>
                    {dropdowns.projects.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    placeholder="PO or Contract Ref"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              {/* Optional Section: Pending GRNs */}
              {pendingGrns.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-indigo-50/30">
                  <span className="block text-[12px] font-bold text-slate-700 mb-2">
                    Pending Unbilled Asset GRNs (Select to link):
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {pendingGrns.map((g) => (
                      <label
                        key={g.uuid}
                        className="flex items-center justify-between text-[12.5px] p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedGrnIds.includes(g.uuid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGrnIds((prev) => [...prev, g.uuid]);
                              } else {
                                setSelectedGrnIds((prev) =>
                                  prev.filter((id) => id !== g.uuid)
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                          />
                          <span className="font-semibold text-indigo-700">
                            {g.code}
                          </span>
                          <span className="text-slate-500">
                            ({g.date}) {g.reference ? `• ${g.reference}` : ""}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-slate-800">
                          {formatCurrency(g.grand_total || g.subtotal)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Asset Item Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-700">
                    Asset Item Lines
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="px-3 py-2 font-semibold">Asset Item</th>
                        <th className="px-2 py-2 font-semibold w-24">Qty</th>
                        <th className="px-2 py-2 font-semibold w-28">Rate</th>
                        <th className="px-2 py-2 font-semibold w-28">Amount</th>
                        <th className="px-3 py-2 font-semibold">Details</th>
                        <th className="px-2 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-4 text-center text-slate-400"
                          >
                            No item lines added. (Click + Add Item Line or link a GRN above)
                          </td>
                        </tr>
                      ) : (
                        formItems.map((it) => (
                          <tr key={it.tempId} className="border-t border-slate-100">
                            <td className="px-3 py-2">
                              {dropdowns.items && dropdowns.items.length > 0 ? (
                                <select
                                  value={it.item_id}
                                  onChange={(e) =>
                                    handleUpdateItemLine(
                                      it.tempId,
                                      "item_id",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px]"
                                >
                                  {dropdowns.items.map((dropItem) => (
                                    <option
                                      key={dropItem.uuid}
                                      value={dropItem.uuid}
                                    >
                                      {dropItem.name} ({dropItem.item_code})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={it.item_name}
                                  onChange={(e) =>
                                    handleUpdateItemLine(
                                      it.tempId,
                                      "item_name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px]"
                                />
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) =>
                                  handleUpdateItemLine(
                                    it.tempId,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] font-mono text-center"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={it.rate}
                                onChange={(e) =>
                                  handleUpdateItemLine(
                                    it.tempId,
                                    "rate",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] font-mono text-right"
                              />
                            </td>
                            <td className="px-2 py-2 font-mono font-medium text-right text-slate-800">
                              {formatCurrency(it.amount)}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={it.details || ""}
                                placeholder="Specs, serial..."
                                onChange={(e) =>
                                  handleUpdateItemLine(
                                    it.tempId,
                                    "details",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px]"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemLine(it.tempId)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown: Subtotal, Discount, Paid, Grand Total, Due */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Sub Total
                  </span>
                  <span className="text-[14px] font-mono font-bold text-slate-800">
                    {formatCurrency(formSubtotal)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Discount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[13px] font-mono"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Grand Total
                  </span>
                  <span className="text-[14px] font-mono font-bold text-indigo-700">
                    {formatCurrency(formGrandTotal)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPaid}
                    onChange={(e) => setFormPaid(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[13px] font-mono"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Due Amount
                  </span>
                  <span className="text-[14px] font-mono font-bold text-rose-600">
                    {formatCurrency(formDue)}
                  </span>
                </div>
              </div>

              {/* Note & Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Note / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Enter any bill notes or delivery reference"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Attachment URL or Reference
                  </label>
                  <input
                    type="text"
                    value={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.value)}
                    placeholder="e.g. https://... or scanned_invoice.pdf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {editingUuid
                      ? "Save Changes"
                      : "Create Asset Purchase Bill"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Asset Purchase Bill #{viewBill.code}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Date: {viewBill.date} • Status: {viewBill.status || "Approved"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
                  title="Print Bill"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewBill(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-[11px] text-slate-400">Supplier</span>
                  <span className="font-semibold text-slate-800">
                    {viewBill.supplier?.supplierName || "N/A"}
                  </span>
                  {viewBill.supplier?.supplierCode && (
                    <span className="text-[11.5px] text-slate-500 block">
                      Code: {viewBill.supplier.supplierCode}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400">Project</span>
                  <span className="font-semibold text-slate-800">
                    {viewBill.project?.name || "N/A"}
                  </span>
                  {viewBill.projectType?.name && (
                    <span className="text-[11.5px] text-slate-500 block">
                      Type: {viewBill.projectType.name}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400">Approval Layer</span>
                  <span className="text-emerald-600 font-medium">
                    ✓ {viewBill.approval_layer || "All Approvals Completed"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400">Created At</span>
                  <span className="text-slate-600">
                    {viewBill.createdAt
                      ? new Date(viewBill.createdAt).toLocaleString()
                      : viewBill.date}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {Array.isArray(viewBill.items) && viewBill.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">Item Lines</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Code</th>
                          <th className="px-3 py-2 font-semibold">Item</th>
                          <th className="px-2 py-2 font-semibold text-center">Qty</th>
                          <th className="px-3 py-2 font-semibold text-right">Rate</th>
                          <th className="px-3 py-2 font-semibold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewBill.items.map((it, idx) => (
                          <tr key={it.uuid || idx} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono text-indigo-600">
                              {it.item_code}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-700">
                              {it.item_name}
                              {it.details && (
                                <span className="block text-[11px] text-slate-400">
                                  {it.details}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center font-mono">
                              {it.quantity}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCurrency(it.rate)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-medium text-slate-800">
                              {formatCurrency(it.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Totals */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 font-mono text-[13px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewBill.subtotal)}</span>
                </div>
                {Number(viewBill.discount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(viewBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-800 text-[14px] border-t border-slate-200 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    {formatCurrency(viewBill.grand_total)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(viewBill.paid)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1.5">
                  <span>Due Balance:</span>
                  <span>{formatCurrency(viewBill.due)}</span>
                </div>
              </div>

              {viewBill.note && (
                <div className="text-[12.5px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold block text-slate-700">Note:</span>
                  {viewBill.note}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewBill(null)}
                className="px-4 py-1.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                Delete Asset Purchase Bill
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete bill{" "}
              <span className="font-bold text-slate-800">
                #{deleteTarget.code}
              </span>
              ? It will be soft-deleted and moved to the{" "}
              <span className="font-semibold text-rose-600">Deleted</span> tab.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm shadow-rose-200"
              >
                {isActionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-white border-t border-slate-100 text-[12px] text-slate-500">
        <span>2026 © RealBiz Pro</span>
        <span>Design &amp; Developed by RealBiz Pro</span>
      </footer>
    </div>
  );
};

export default AssetPurchaseBillInvoiceList;
