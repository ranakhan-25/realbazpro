"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
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
  Briefcase,
  UserCheck,
  RotateCcw,
  Hammer,
  ClipboardList,
} from "lucide-react";
import {
  procurementWorkOrdersApi,
  BackendProcurementWorkOrder,
  BackendProcurementWorkOrderItem,
  ProcurementWorkOrderMode,
  ProcurementWorkOrderType,
  ProcurementWorkOrderStatus,
  ProcurementWorkOrderDropdownProject,
  ProcurementWorkOrderDropdownSubcontractor,
  ProcurementWorkOrderDropdownRequisition,
  ProcurementWorkOrderDropdownsResult,
  CreateProcurementWorkOrderPayload,
  ProcurementWorkOrderItemPayload,
} from "@/lib/procurement/procurementWorkOrdersApi";

// =============================================================================
// ERROR PARSER HELPER
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
            : JSON.stringify(e)
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
  requisition_item_id?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  tax_percent: number;
  vat_percent: number;
  amount: number;
}

const tableHeaders = [
  "ID",
  "WO NO",
  "TITLE",
  "PROJECT",
  "SUBCONTRACTOR",
  "TYPE",
  "MODE",
  "START DATE",
  "END DATE",
  "ITEMS",
  "TOTAL AMOUNT",
  "STATUS",
  "ACTION",
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProcurementWorkOrdersListPage() {
  // Active vs Trash Tab State
  const [recordsTab, setRecordsTab] = useState<"active" | "trash">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [trashCount, setTrashCount] = useState<number>(0);

  // List Data States
  const [workOrders, setWorkOrders] = useState<BackendProcurementWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Pagination & Search States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter States
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<ProcurementWorkOrderDropdownsResult>({
    projects: [],
    subcontractors: [],
    approvedRequisitions: [],
    modes: ["requisition_based", "free"],
    types: ["subcontract", "labour"],
    statuses: ["pending", "active", "completed", "cancelled"],
  });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<BackendProcurementWorkOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendProcurementWorkOrder | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackendProcurementWorkOrder | null>(null);

  // Create / Edit Form Fields
  const [formTitle, setFormTitle] = useState<string>("");
  const [formMode, setFormMode] = useState<ProcurementWorkOrderMode>("free");
  const [formType, setFormType] = useState<ProcurementWorkOrderType>("subcontract");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formSubcontractorId, setFormSubcontractorId] = useState<string>("");
  const [formRequisitionId, setFormRequisitionId] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [formEndDate, setFormEndDate] = useState<string>(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formStatus, setFormStatus] = useState<ProcurementWorkOrderStatus>("pending");
  const [formOrderDiscount, setFormOrderDiscount] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>("");
  const [formItems, setFormItems] = useState<FormItemLine[]>([]);

  // Toast State
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
      const data = await procurementWorkOrdersApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.warn("Could not load work-orders dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 2. Load Work Orders List based on Active vs Trash Tab
  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      if (recordsTab === "trash") {
        const res = await procurementWorkOrdersApi.getTrash({
          search: debouncedSearch,
          type: typeFilter || undefined,
          limit: 100,
        });
        setWorkOrders(res.data || []);
      } else {
        const res = await procurementWorkOrdersApi.list({
          search: debouncedSearch,
          project_id: projectFilter || undefined,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          limit: 100,
        });
        setWorkOrders(res.data || []);
      }

      // Refresh Counts
      try {
        const [activeRes, trashRes] = await Promise.all([
          procurementWorkOrdersApi.list({ limit: 1 }),
          procurementWorkOrdersApi.getTrash({ limit: 1 }),
        ]);
        setActiveCount(activeRes.meta?.total ?? 0);
        setTrashCount(trashRes.meta?.total ?? 0);
      } catch {
        // Counts handled gracefully
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to load work orders");
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [recordsTab, debouncedSearch, projectFilter, typeFilter, statusFilter, showToast]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Switch Tab
  const handleSwitchTab = (tab: "active" | "trash") => {
    setRecordsTab(tab);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setProjectFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Pagination Calculations
  const totalEntries = workOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = workOrders.slice(startIdx, startIdx + entriesPerPage);

  // Table summary totals for current view
  const totals = useMemo(() => {
    return workOrders.reduce(
      (acc, r) => ({
        subtotal: acc.subtotal + (Number(r.subtotal) || 0),
        tax: acc.tax + (Number(r.tax_amount) || 0),
        vat: acc.vat + (Number(r.vat_amount) || 0),
        discount: acc.discount + (Number(r.order_discount) || 0),
        grandTotal: acc.grandTotal + (Number(r.grand_total) || 0),
      }),
      { subtotal: 0, tax: 0, vat: 0, discount: 0, grandTotal: 0 }
    );
  }, [workOrders]);

  // Form Live Calculations
  const formCalculations = useMemo(() => {
    const lines = formItems.map((it) => {
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.rate) || 0;
      const sub = qty * rate;
      const tax = (sub * (Number(it.tax_percent) || 0)) / 100;
      const vat = (sub * (Number(it.vat_percent) || 0)) / 100;
      return { sub, tax, vat, total: sub + tax + vat };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.sub, 0);
    const tax_amount = lines.reduce((sum, l) => sum + l.tax, 0);
    const vat_amount = lines.reduce((sum, l) => sum + l.vat, 0);
    const discount = Number(formOrderDiscount) || 0;
    const grand_total = Math.max(0, subtotal + tax_amount + vat_amount - discount);

    return { subtotal, tax_amount, vat_amount, discount, grand_total };
  }, [formItems, formOrderDiscount]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUuid(null);
    setFormTitle("");
    setFormMode("free");
    setFormType("subcontract");
    setFormProjectId(dropdowns.projects[0]?.uuid || "");
    setFormSubcontractorId(dropdowns.subcontractors[0]?.uuid || "");
    setFormRequisitionId("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setFormStatus("pending");
    setFormOrderDiscount(0);
    setFormNotes("");

    // Initialize with 1 default item row
    setFormItems([
      {
        tempId: `item-${Date.now()}`,
        description: "General execution & construction work",
        unit: "Sft",
        quantity: 100,
        rate: 150,
        tax_percent: 5,
        vat_percent: 7.5,
        amount: 100 * 150,
      },
    ]);

    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (order: BackendProcurementWorkOrder) => {
    setEditingUuid(order.uuid);
    setFormTitle(order.title || "");
    setFormMode(order.mode || "free");
    setFormType(order.type || "subcontract");
    setFormProjectId(order.project_id || order.project?.uuid || "");
    setFormSubcontractorId(order.subcontractor_id || order.subcontractor?.uuid || "");
    setFormRequisitionId(order.requisition_id || order.requisition?.uuid || "");
    setFormStartDate(
      order.start_date ? order.start_date.split("T")[0] : new Date().toISOString().split("T")[0]
    );
    setFormEndDate(
      order.end_date
        ? order.end_date.split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setFormStatus(order.status || "pending");
    setFormOrderDiscount(Number(order.order_discount) || 0);
    setFormNotes(order.notes || "");

    if (Array.isArray(order.items) && order.items.length > 0) {
      setFormItems(
        order.items.map((it, idx) => ({
          tempId: `edit-item-${idx}-${it.uuid || Date.now()}`,
          requisition_item_id: it.requisition_item_id || undefined,
          description: it.description || "",
          unit: it.unit || "Unit",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          tax_percent: Number(it.tax_percent) || 0,
          vat_percent: Number(it.vat_percent) || 0,
          amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0),
        }))
      );
    } else {
      setFormItems([]);
    }

    setIsFormOpen(true);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const newRow: FormItemLine = {
      tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: "",
      unit: "Unit",
      quantity: 1,
      rate: 0,
      tax_percent: 5,
      vat_percent: 7.5,
      amount: 0,
    };
    setFormItems((prev) => [...prev, newRow]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (tempId: string) => {
    setFormItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // Update Item Row
  const handleUpdateItemRow = (
    tempId: string,
    field: keyof FormItemLine,
    value: string | number
  ) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        const updated = { ...it, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      })
    );
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast("Please enter a work order title", "error");
      return;
    }
    if (!formProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (!formSubcontractorId) {
      showToast("Please select a subcontractor / contractor party", "error");
      return;
    }
    if (formItems.length === 0) {
      showToast("Please add at least one line item to the work order", "error");
      return;
    }

    for (const it of formItems) {
      if (!it.description.trim()) {
        showToast("All items must have a valid description of work", "error");
        return;
      }
      if (Number(it.quantity) <= 0) {
        showToast(`Quantity for "${it.description}" must be greater than 0`, "error");
        return;
      }
      if (Number(it.rate) < 0) {
        showToast(`Rate for "${it.description}" must be non-negative`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProcurementWorkOrderPayload = {
        title: formTitle.trim(),
        mode: formMode,
        type: formType,
        project_id: formProjectId,
        subcontractor_id: formSubcontractorId,
        requisition_id: formMode === "requisition_based" && formRequisitionId ? formRequisitionId : undefined,
        start_date: formStartDate ? `${formStartDate}T00:00:00.000Z` : undefined,
        end_date: formEndDate ? `${formEndDate}T00:00:00.000Z` : undefined,
        notes: formNotes.trim() || undefined,
        order_discount: Number(formOrderDiscount) || 0,
        status: formStatus,
        items: formItems.map((it) => ({
          requisition_item_id: it.requisition_item_id || undefined,
          description: it.description.trim(),
          unit: it.unit.trim() || "Unit",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          tax_percent: Number(it.tax_percent) || 0,
          vat_percent: Number(it.vat_percent) || 0,
        })),
      };

      if (editingUuid) {
        await procurementWorkOrdersApi.update(editingUuid, payload);
        showToast(`Work Order "${formTitle}" updated successfully`, "success");
      } else {
        await procurementWorkOrdersApi.create(payload);
        showToast(`Work Order "${formTitle}" created successfully`, "success");
      }

      setIsFormOpen(false);
      setEditingUuid(null);
      await loadWorkOrders();
    } catch (err) {
      const msg = parseApiError(
        err,
        editingUuid ? "Failed to update work order" : "Failed to create work order"
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
      await procurementWorkOrdersApi.delete(deleteTarget.uuid);
      showToast(
        `Work Order #${deleteTarget.work_order_no} moved to Trash`,
        "success"
      );
      setDeleteTarget(null);
      await loadWorkOrders();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete work order");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Restore
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsActionLoading(true);
    try {
      await procurementWorkOrdersApi.restore(restoreTarget.uuid);
      showToast(
        `Work Order #${restoreTarget.work_order_no} restored to Active`,
        "success"
      );
      setRestoreTarget(null);
      await loadWorkOrders();
    } catch (err) {
      const msg = parseApiError(err, "Failed to restore work order");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status Badge
  const statusBadge = (status: ProcurementWorkOrderStatus | string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-700">
      {/* Toast Notification */}
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
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-200">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Work Orders List
              </h1>
              <nav className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">
                  Procurement
                </span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-500">Work Orders</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadWorkOrders}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work Order</span>
            </button>
          </div>
        </div>

        {/* Active vs Trash Segmented Tabs & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Segmented Pill Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab("active")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
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
              onClick={() => handleSwitchTab("trash")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                recordsTab === "trash"
                  ? "bg-white text-rose-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Trash / Deleted</span>
              {trashCount > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                    recordsTab === "trash"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {trashCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
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
                  {p.name} ({p.code || "PRJ"})
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
            >
              <option value="">All Types</option>
              <option value="subcontract">Subcontract</option>
              <option value="labour">Labour</option>
            </select>

            {recordsTab === "active" && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            {(search || projectFilter || typeFilter || statusFilter) && (
              <button
                onClick={handleResetFilters}
                className="text-[12px] text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
          {/* Controls Header */}
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

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search work orders, code..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-slate-100 bg-[#EFEFFD] text-[#374151] font-semibold tracking-wide text-[11px] uppercase">
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-3 py-3 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-3 py-10 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading work orders from server...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-3 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <ClipboardList className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="font-medium text-slate-600">
                          {recordsTab === "trash"
                            ? "No deleted work orders in trash"
                            : "No work orders found"}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {recordsTab === "trash"
                            ? "Deleted work orders will appear here for review and restoration"
                            : "Create a work order or adjust your search filter"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3 py-3 text-slate-400 font-mono text-[11.5px]">
                        {row.id || "—"}
                      </td>
                      <td className="px-3 py-3 font-semibold text-indigo-600 whitespace-nowrap">
                        {row.work_order_no}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800 min-w-[200px]">
                        {row.title}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {row.project?.name || "N/A"}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {row.subcontractor?.name || "N/A"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap capitalize">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            row.type === "subcontract"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap capitalize">
                        <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          {row.mode === "requisition_based"
                            ? "Req Based"
                            : "Free Mode"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {row.start_date ? row.start_date.split("T")[0] : "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {row.end_date ? row.end_date.split("T")[0] : "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-center font-semibold">
                        {row.items?.length || 0}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(row.grand_total)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {statusBadge(row.status)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewOrder(row)}
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
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                aria-label="Delete"
                                title="Delete record"
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            /* Restore Button */
                            <button
                              type="button"
                              onClick={() => setRestoreTarget(row)}
                              aria-label="Restore"
                              title="Restore to active list"
                              className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {/* Table Summary Footer */}
                {visibleRows.length > 0 && (
                  <tr className="border-t-2 border-slate-200 font-semibold text-slate-800 bg-slate-50/80">
                    <td className="px-3 py-3 font-bold" colSpan={9}>
                      TOTAL ({workOrders.length} RECORDS)
                    </td>
                    <td className="px-3 py-3 text-center text-slate-500 text-[11px]">
                      {workOrders.reduce((sum, r) => sum + (r.items?.length || 0), 0)} items
                    </td>
                    <td className="px-3 py-3 font-mono text-indigo-700 font-bold">
                      {formatCurrency(totals.grandTotal)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT WORK ORDER MODAL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {editingUuid ? "Edit Work Order" : "Create New Work Order"}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Configure labor/subcontract work order header and line items
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* Header Fields Section */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1.5">
                  1. Work Order Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Work Order Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Structural Reinforcement & Casting Work"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Order Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formMode}
                      onChange={(e) =>
                        setFormMode(e.target.value as ProcurementWorkOrderMode)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
                    >
                      <option value="free">Free Mode (Independent)</option>
                      <option value="requisition_based">
                        Requisition Based
                      </option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Work Order Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) =>
                        setFormType(e.target.value as ProcurementWorkOrderType)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
                    >
                      <option value="subcontract">Subcontract</option>
                      <option value="labour">Labour</option>
                    </select>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Project <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Select Project</option>
                      {dropdowns.projects.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name} {p.code ? `(${p.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcontractor */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Subcontractor / Party <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formSubcontractorId}
                      onChange={(e) => setFormSubcontractorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Select Subcontractor</option>
                      {dropdowns.subcontractors.map((s) => (
                        <option key={s.uuid} value={s.uuid}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Requisition (only if requisition_based) */}
                  {formMode === "requisition_based" && (
                    <div className="sm:col-span-3">
                      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                        Approved Requisition (Optional Link)
                      </label>
                      <select
                        value={formRequisitionId}
                        onChange={(e) => setFormRequisitionId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">Select Requisition</option>
                        {dropdowns.approvedRequisitions.map((r) => (
                          <option key={r.uuid} value={r.uuid}>
                            {r.requisition_no ? `[${r.requisition_no}] ` : ""}
                            {r.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Start Date */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) =>
                        setFormStatus(e.target.value as ProcurementWorkOrderStatus)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Special Instructions / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Enter scope of work details, safety regulations, milestone terms..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                      2. Work Order Line Items ({formItems.length})
                    </h4>
                    <p className="text-[11.5px] text-slate-400">
                      Define scope of tasks, quantities, rates, and applicable tax percentages
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2.5">Description of Work</th>
                        <th className="px-3 py-2.5 w-24">Unit</th>
                        <th className="px-3 py-2.5 w-28">Quantity</th>
                        <th className="px-3 py-2.5 w-28">Rate</th>
                        <th className="px-3 py-2.5 w-24">Tax %</th>
                        <th className="px-3 py-2.5 w-24">VAT %</th>
                        <th className="px-3 py-2.5 w-32 text-right">Amount</th>
                        <th className="px-3 py-2.5 w-12 text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {formItems.map((item, idx) => (
                        <tr key={item.tempId} className="hover:bg-slate-50/60">
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Raft binding labor"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "unit",
                                  e.target.value
                                )
                              }
                              placeholder="Sft"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "rate",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.tax_percent}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "tax_percent",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.vat_percent}
                              onChange={(e) =>
                                handleUpdateItemRow(
                                  item.tempId,
                                  "vat_percent",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12.5px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(item.tempId)}
                              disabled={formItems.length === 1}
                              className="text-slate-300 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-[12.5px] font-semibold text-slate-700">
                      Order Discount:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formOrderDiscount}
                      onChange={(e) => setFormOrderDiscount(Number(e.target.value) || 0)}
                      className="w-32 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-[13px]">
                    <div>
                      <span className="text-slate-400">Subtotal: </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(formCalculations.subtotal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tax & VAT: </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(formCalculations.tax_amount + formCalculations.vat_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Grand Total: </span>
                      <span className="font-mono font-bold text-[15px] text-indigo-700">
                        {formatCurrency(formCalculations.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUuid ? "Save Changes" : "Create Work Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW WORK ORDER DETAILS MODAL
          ========================================================================= */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-slate-800">
                      {viewOrder.work_order_no}
                    </h3>
                    {statusBadge(viewOrder.status)}
                  </div>
                  <p className="text-[12.5px] text-slate-500 font-medium">
                    {viewOrder.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setViewOrder(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Project
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5 truncate">
                    {viewOrder.project?.name || "N/A"}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {viewOrder.project?.code}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Subcontractor
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5 truncate">
                    {viewOrder.subcontractor?.name || "N/A"}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {viewOrder.subcontractor?.phone || "No phone"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Type & Mode
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5 capitalize">
                    {viewOrder.type}
                  </p>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {viewOrder.mode?.replace("_", " ")}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Execution Window
                  </span>
                  <p className="text-[12.5px] font-bold text-slate-800 mt-0.5">
                    {viewOrder.start_date ? viewOrder.start_date.split("T")[0] : "—"}{" "}
                    to {viewOrder.end_date ? viewOrder.end_date.split("T")[0] : "—"}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                  Scope of Work & Line Items
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="px-3.5 py-2.5">Description</th>
                        <th className="px-3.5 py-2.5 w-20 text-center">Unit</th>
                        <th className="px-3.5 py-2.5 w-24 text-right">Quantity</th>
                        <th className="px-3.5 py-2.5 w-24 text-right">Rate</th>
                        <th className="px-3.5 py-2.5 w-20 text-right">Tax%</th>
                        <th className="px-3.5 py-2.5 w-20 text-right">VAT%</th>
                        <th className="px-3.5 py-2.5 w-32 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-800">
                              {it.description}
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">
                              {it.unit || "Unit"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono">
                              {it.quantity}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono">
                              {formatCurrency(it.rate)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-slate-500">
                              {it.tax_percent || 0}%
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-slate-500">
                              {it.vat_percent || 0}%
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(it.total_amount || it.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                            No item breakdown records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(viewOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax Amount:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(viewOrder.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT Amount:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(viewOrder.vat_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Order Discount:</span>
                    <span className="font-mono font-medium text-rose-600">
                      -{formatCurrency(viewOrder.order_discount)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-[15px] text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-700">
                      {formatCurrency(viewOrder.grand_total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewOrder.notes && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[12.5px] text-amber-900">
                  <span className="font-bold">Instructions & Notes:</span>
                  <p className="mt-1 leading-relaxed opacity-90">{viewOrder.notes}</p>
                </div>
              )}
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
                Move Work Order to Trash
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to soft-delete work order{" "}
              <span className="font-bold text-slate-800">
                #{deleteTarget.work_order_no}
              </span>
              ? It will be moved to the{" "}
              <span className="font-semibold text-rose-600">Trash / Deleted</span>{" "}
              tab where it can be restored anytime.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESTORE CONFIRMATION MODAL
          ========================================================================= */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                Restore Work Order
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Restore work order{" "}
              <span className="font-bold text-slate-800">
                #{restoreTarget.work_order_no}
              </span>{" "}
              back to the Active work orders list?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmRestore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Restore Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
