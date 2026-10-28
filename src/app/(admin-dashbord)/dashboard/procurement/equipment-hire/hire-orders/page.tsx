"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  RotateCcw,
  Truck,
  Plus,
  Edit2,
  FileText,
  Calendar,
  Building2,
  Info,
} from "lucide-react";
import {
  procurementHireOrdersApi,
  BackendHireOrder,
  BackendHireOrderItem,
  CreateHireOrderPayload,
  CreateHireOrderItemPayload,
  HireOrderDropdownsResult,
  HireOrderDropdownProject,
  HireOrderDropdownVendor,
  HireOrderDropdownSite,
  HireOrderDropdownRequisition,
  HireOrderMode,
  HireOrderStatus,
} from "@/lib/procurement/procurementHireOrdersApi";

// =============================================================================
// ERROR PARSING UTILITY
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
        .map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)))
        .join(", ");
    }

    const backendMsg =
      errorObj.response?.data?.message ||
      errorObj.response?.data?.error ||
      errorObj.message;

    if (typeof backendMsg === "string" && backendMsg.trim()) return backendMsg;
    if (Array.isArray(backendMsg)) {
      return backendMsg
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
  }
  return defaultMsg;
}

// Table columns
const tableHeaders = [
  "SL",
  "HIRE ORDER NO",
  "MODE",
  "PROJECT",
  "VENDOR",
  "PERIOD",
  "GRAND TOTAL",
  "STATUS",
  "ACTION",
];

interface FormLineItem extends CreateHireOrderItemPayload {
  tempId: string;
}

export default function HireOrdersPage() {
  // Tabs: Active vs Deleted / Trash
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  // Data States
  const [orders, setOrders] = useState<BackendHireOrder[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Search & Filter States
  const [searchHireNo, setSearchHireNo] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Dropdowns State
  const [dropdowns, setDropdowns] = useState<HireOrderDropdownsResult>({
    projects: [],
    vendors: [],
    sites: [],
    equipment: [],
    units: [],
    approvedEquipmentRequisitions: [],
    hireModes: ["requisition_based", "free_hire"],
    orderStatuses: ["draft", "active", "closed", "cancelled"],
    chargedBy: ["hour", "day", "week", "month", "shift", "fixed"],
    users: [],
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<BackendHireOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<BackendHireOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendHireOrder | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackendHireOrder | null>(null);

  // Form Fields
  const [formHireNo, setFormHireNo] = useState<string>("");
  const [formHireMode, setFormHireMode] = useState<HireOrderMode>("requisition_based");
  const [formRequisitionId, setFormRequisitionId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formSiteId, setFormSiteId] = useState<string>("");
  const [formVendorId, setFormVendorId] = useState<string>("");
  const [formHireFrom, setFormHireFrom] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [formHireTo, setFormHireTo] = useState<string>("");
  const [formShippingCost, setFormShippingCost] = useState<number>(0);
  const [formOrderDiscount, setFormOrderDiscount] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<HireOrderStatus>("active");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formLines, setFormLines] = useState<FormLineItem[]>([]);

  // Notification Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    },
    []
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchHireNo);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchHireNo]);

  // Load Dropdowns
  const loadDropdowns = useCallback(async (projId?: string) => {
    try {
      const data = await procurementHireOrdersApi.getDropdowns(projId);
      setDropdowns(data);
    } catch (err) {
      console.warn("Failed to load dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // Fetch Orders based on active tab
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        hire_no: debouncedSearch.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        project_id: projectFilter !== "all" ? projectFilter : undefined,
        page: currentPage,
        limit: entriesPerPage,
      };

      if (activeTab === "active") {
        const res = await procurementHireOrdersApi.list(params);
        setOrders(res.data);
        setTotalRecords(res.meta.total);
        setTotalPages(res.meta.totalPages);
        setActiveCount(res.meta.total);
        if (res.isFallback) setIsFallbackActive(true);
      } else {
        const res = await procurementHireOrdersApi.getTrash(params);
        setOrders(res.data);
        setTotalRecords(res.meta.total);
        setTotalPages(res.meta.totalPages);
        setDeletedCount(res.meta.total);
        if (res.isFallback) setIsFallbackActive(true);
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to load hire orders");
      showToast(msg, "error");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    debouncedSearch,
    statusFilter,
    projectFilter,
    currentPage,
    entriesPerPage,
    showToast,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Switch Tab
  const handleSwitchTab = (tab: "active" | "deleted") => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingOrder(null);
    setFormHireNo("");
    setFormHireMode("requisition_based");
    setFormRequisitionId("");
    setFormProjectId(dropdowns.projects[0]?.uuid || "");
    setFormSiteId("");
    setFormVendorId(dropdowns.vendors[0]?.uuid || "");
    setFormHireFrom(new Date().toISOString().split("T")[0]);
    setFormHireTo("");
    setFormShippingCost(0);
    setFormOrderDiscount(0);
    setFormStatus("active");
    setFormNotes("");
    setFormLines([
      {
        tempId: `line-${Date.now()}-0`,
        equipment_description: "",
        unit: "Day",
        quantity: 1,
        charged_by: "day",
        rate: 0,
        tax_percent: 5,
        vat_percent: 7.5,
      },
    ]);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (order: BackendHireOrder) => {
    setEditingOrder(order);
    setFormHireNo(order.hire_no);
    setFormHireMode(order.hire_mode || "requisition_based");
    setFormRequisitionId(order.requisition_id || "");
    setFormProjectId(order.project_id || "");
    setFormSiteId(order.site_id || "");
    setFormVendorId(order.vendor_id || "");
    setFormHireFrom(order.hire_from || new Date().toISOString().split("T")[0]);
    setFormHireTo(order.hire_to || "");
    setFormShippingCost(Number(order.shipping_cost) || 0);
    setFormOrderDiscount(Number(order.order_discount) || 0);
    setFormStatus(order.status || "active");
    setFormNotes(order.notes || "");
    setFormLines(
      order.items && order.items.length > 0
        ? order.items.map((it, idx) => ({
            tempId: it.uuid || `line-${Date.now()}-${idx}`,
            equipment_id: it.equipment_id || undefined,
            requisition_item_id: it.requisition_item_id || undefined,
            unit_id: it.unit_id || undefined,
            equipment_description: it.equipment_description,
            unit: it.unit || "Day",
            quantity: Number(it.quantity) || 1,
            charged_by: it.charged_by || "day",
            rate: Number(it.rate) || 0,
            tax_percent: Number(it.tax_percent) || 0,
            vat_percent: Number(it.vat_percent) || 0,
          }))
        : [
            {
              tempId: `line-${Date.now()}-0`,
              equipment_description: "",
              unit: "Day",
              quantity: 1,
              charged_by: "day",
              rate: 0,
              tax_percent: 5,
              vat_percent: 7.5,
            },
          ]
    );
    setIsFormOpen(true);
  };

  // When Requisition is selected in Form, populate lines automatically
  const handleRequisitionChange = (reqId: string) => {
    setFormRequisitionId(reqId);
    if (!reqId) return;

    const selectedReq = dropdowns.approvedEquipmentRequisitions.find(
      (r) => r.uuid === reqId
    );
    if (selectedReq && selectedReq.items && selectedReq.items.length > 0) {
      const mappedLines: FormLineItem[] = selectedReq.items.map((item, idx) => ({
        tempId: `req-line-${Date.now()}-${idx}`,
        requisition_item_id: item.uuid,
        equipment_id: item.item_id || undefined,
        unit_id: item.unit_id || undefined,
        equipment_description: item.item_name || item.item_code || "Equipment",
        unit: item.unit || "Day",
        quantity: item.open_qty || item.demand_qty || 1,
        charged_by: "day",
        rate: item.rate || 0,
        tax_percent: 5,
        vat_percent: 7.5,
      }));
      setFormLines(mappedLines);
    }
  };

  // Add line item
  const handleAddLine = () => {
    setFormLines((prev) => [
      ...prev,
      {
        tempId: `line-${Date.now()}-${prev.length}`,
        equipment_description: "",
        unit: "Day",
        quantity: 1,
        charged_by: "day",
        rate: 0,
        tax_percent: 5,
        vat_percent: 7.5,
      },
    ]);
  };

  // Remove line item
  const handleRemoveLine = (idx: number) => {
    setFormLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Update line item
  const handleUpdateLine = (
    idx: number,
    field: keyof CreateHireOrderItemPayload,
    value: string | number
  ) => {
    setFormLines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Calculate live form financial totals
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    let vat_total = 0;
    let ait_tds_total = 0;

    formLines.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const base = qty * rate;
      const taxP = Number(item.tax_percent) || 0;
      const vatP = Number(item.vat_percent) || 0;

      subtotal += base;
      vat_total += (base * vatP) / 100;
      ait_tds_total += (base * taxP) / 100;
    });

    const grand_total = Math.max(
      0,
      subtotal + vat_total - ait_tds_total - (Number(formOrderDiscount) || 0) + (Number(formShippingCost) || 0)
    );

    return { subtotal, vat_total, ait_tds_total, grand_total };
  }, [formLines, formShippingCost, formOrderDiscount]);

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (!formVendorId) {
      showToast("Please select a vendor", "error");
      return;
    }
    if (formHireMode === "requisition_based" && !formRequisitionId) {
      showToast("Please select an approved equipment requisition", "error");
      return;
    }
    if (formLines.length === 0) {
      showToast("At least one equipment line is required", "error");
      return;
    }

    // Validate lines
    for (let i = 0; i < formLines.length; i++) {
      const line = formLines[i];
      if (!line.equipment_description.trim()) {
        showToast(`Line ${i + 1}: Equipment description is required`, "error");
        return;
      }
      if (Number(line.quantity) <= 0) {
        showToast(`Line ${i + 1}: Quantity must be greater than zero`, "error");
        return;
      }
      if (Number(line.rate) < 0) {
        showToast(`Line ${i + 1}: Rate cannot be negative`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateHireOrderPayload = {
        hire_no: formHireNo.trim() || undefined,
        hire_mode: formHireMode,
        requisition_id: formHireMode === "requisition_based" ? formRequisitionId : undefined,
        project_id: formProjectId,
        site_id: formSiteId || undefined,
        vendor_id: formVendorId,
        hire_from: formHireFrom,
        hire_to: formHireTo || undefined,
        shipping_cost: Number(formShippingCost) || 0,
        order_discount: Number(formOrderDiscount) || 0,
        status: formStatus,
        notes: formNotes.trim() || undefined,
        items: formLines.map((line) => ({
          equipment_id: line.equipment_id || undefined,
          requisition_item_id: line.requisition_item_id || undefined,
          unit_id: line.unit_id || undefined,
          equipment_description: line.equipment_description.trim(),
          unit: line.unit.trim() || "Day",
          quantity: Number(line.quantity),
          charged_by: line.charged_by || "day",
          rate: Number(line.rate),
          tax_percent: Number(line.tax_percent) || 0,
          vat_percent: Number(line.vat_percent) || 0,
        })),
      };

      if (editingOrder) {
        await procurementHireOrdersApi.update(editingOrder.uuid, payload);
        showToast(`Hire order #${editingOrder.hire_no} updated successfully`, "success");
      } else {
        const created = await procurementHireOrdersApi.create(payload);
        showToast(`Hire order #${created.hire_no} created successfully`, "success");
      }

      setIsFormOpen(false);
      await fetchOrders();
    } catch (err) {
      const msg = parseApiError(err, "Failed to save hire order");
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Soft-Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementHireOrdersApi.delete(deleteTarget.uuid);
      showToast(
        `Hire order #${deleteTarget.hire_no} moved to Deleted`,
        "success"
      );
      setDeleteTarget(null);
      await fetchOrders();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete hire order");
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
      await procurementHireOrdersApi.restore(restoreTarget.uuid);
      showToast(
        `Hire order #${restoreTarget.hire_no} restored to Active`,
        "success"
      );
      setRestoreTarget(null);
      await fetchOrders();
    } catch (err) {
      const msg = parseApiError(err, "Failed to restore hire order");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "draft";
    switch (s) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Closed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  // Format currency
  const formatMoney = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "৳0.00";
    return `৳${Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-indigo-50 text-indigo-800 border-indigo-200"
          }`}
        >
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
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Hire Orders
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
                <span className="text-slate-500">Equipment Hire</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-600 font-medium">Hire Orders</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh order list"
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
              <span>New Hire Order</span>
            </button>
          </div>
        </div>

        {/* Informative Backend Sequelize Warning Banner if applicable */}
        {isFallbackActive && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12.5px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-900">
                Backend Service Notification:
              </span>{" "}
              The live backend endpoint for hire orders responded with a Sequelize model registration error (<code>Project / ProcurementUnit</code>). The interface is safely operating with local store persistence; create, edit, view, delete, and restore are fully active and testable.
            </div>
          </div>
        )}

        {/* Segmented Pill Tabs & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Segmented Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab("active")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-white text-indigo-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Active</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  activeTab === "active"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeTab === "active" ? totalRecords : activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("deleted")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "deleted"
                  ? "bg-white text-rose-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Deleted</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                  activeTab === "deleted"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeTab === "deleted" ? totalRecords : deletedCount}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] text-slate-600 bg-white hover:border-slate-300 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Projects</option>
              {dropdowns.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] text-slate-600 bg-white hover:border-slate-300 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {dropdowns.orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search hire order # or vendor..."
                value={searchHireNo}
                onChange={(e) => setSearchHireNo(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors w-52 md:w-60"
              />
              {searchHireNo && (
                <button
                  type="button"
                  onClick={() => setSearchHireNo("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
              <span>Show:</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 text-[12.5px] bg-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">
                  {tableHeaders.map((head, idx) => (
                    <th
                      key={head}
                      className={`px-4 py-3.5 ${
                        idx === 0
                          ? "w-12 text-center"
                          : idx === tableHeaders.length - 1
                            ? "text-center w-32"
                            : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        <span className="text-[13px] text-slate-400">
                          Loading hire orders...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <Truck className="w-6 h-6" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-700">
                          {activeTab === "active"
                            ? "No Active Hire Orders"
                            : "No Deleted Orders Found"}
                        </p>
                        <p className="text-[12.5px] text-slate-400 leading-normal">
                          {activeTab === "active"
                            ? "There are currently no active hire orders matching your filters."
                            : "Trash is clean. Any soft-deleted hire orders will appear here and can be restored."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((row, idx) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* SL */}
                      <td className="px-4 py-3.5 text-center text-slate-400 text-[12px] tabular-nums">
                        {(currentPage - 1) * entriesPerPage + idx + 1}
                      </td>

                      {/* Hire Order Number */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 font-mono text-[13px]">
                          {row.hire_no}
                        </span>
                      </td>

                      {/* Mode Badge */}
                      <td className="px-4 py-3.5">
                        {row.hire_mode === "requisition_based" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Requisition
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Free Hire
                          </span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700">
                          {row.project?.name || "General Project"}
                        </div>
                        {row.site?.name && (
                          <div className="text-[11px] text-slate-400">
                            Site: {row.site.name}
                          </div>
                        )}
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-700 font-medium">
                          {row.vendor?.supplierName || "—"}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="px-4 py-3.5">
                        <div className="text-[12.5px] text-slate-600">
                          {row.hire_from || "—"} {row.hire_to ? `~ ${row.hire_to}` : ""}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {formatMoney(row.grand_total || row.subtotal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{renderStatusBadge(row.status)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewOrder(row)}
                            aria-label="View Details"
                            title="View details"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {activeTab === "active" ? (
                            <>
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                aria-label="Edit Order"
                                title="Edit hire order"
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                aria-label="Delete"
                                title="Delete order"
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
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
            <span className="text-[12.5px] text-slate-400">
              Showing {orders.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
              {Math.min(currentPage * entriesPerPage, totalRecords)} of {totalRecords} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button className="w-8 h-8 rounded-lg text-[13px] font-medium bg-indigo-600 text-white">
                {currentPage}
              </button>
              <button
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT HIRE ORDER MODAL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {editingOrder ? "Edit Hire Order" : "New Equipment Hire Order"}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    {editingOrder ? `Updating #${editingOrder.hire_no}` : "Create requisition-based or free-hire order"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Hire Mode Selector */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase mb-2">
                    Hire Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setFormHireMode("requisition_based")}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formHireMode === "requisition_based"
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <span className="font-semibold text-[13px]">Requisition-Based</span>
                      <span className="text-[11.5px] text-slate-400 mt-0.5">
                        Link to approved equipment requisition
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormHireMode("free_hire")}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formHireMode === "free_hire"
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <span className="font-semibold text-[13px]">Free Hire</span>
                      <span className="text-[11.5px] text-slate-400 mt-0.5">
                        Direct equipment hire without requisition
                      </span>
                    </button>
                  </div>
                </div>

                {/* Primary Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Requisition Dropdown (Visible if requisition_based) */}
                  {formHireMode === "requisition_based" && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                        Approved Equipment Requisition <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formRequisitionId}
                        onChange={(e) => handleRequisitionChange(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select Approved Requisition --</option>
                        {dropdowns.approvedEquipmentRequisitions.map((r) => (
                          <option key={r.uuid} value={r.uuid}>
                            {r.code || r.name || r.uuid} ({r.items?.length || 0} items)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Project */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Project <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formProjectId}
                      onChange={(e) => {
                        setFormProjectId(e.target.value);
                        setFormSiteId("");
                      }}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Select Project --</option>
                      {dropdowns.projects.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Site */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Site / Location
                    </label>
                    <select
                      value={formSiteId}
                      onChange={(e) => setFormSiteId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Select Site (Optional) --</option>
                      {dropdowns.sites
                        .filter((s) => !formProjectId || s.projectId === formProjectId)
                        .map((s) => (
                          <option key={s.uuid} value={s.uuid}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Equipment Vendor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formVendorId}
                      onChange={(e) => setFormVendorId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Select Vendor --</option>
                      {dropdowns.vendors.map((v) => (
                        <option key={v.uuid} value={v.uuid}>
                          {v.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hire From */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Hire From Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formHireFrom}
                      onChange={(e) => setFormHireFrom(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Hire To */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Hire To Date
                    </label>
                    <input
                      type="date"
                      value={formHireTo}
                      onChange={(e) => setFormHireTo(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Order Status */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Order Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as HireOrderStatus)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      {dropdowns.orderStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Equipment Lines Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-800">
                        Equipment Line Items
                      </h4>
                      <p className="text-[12px] text-slate-400">
                        Specify equipment description, quantity, rate, unit, and charge type
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Equipment Line</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
                          <th className="px-3 py-2.5">Equipment / Description *</th>
                          <th className="px-2.5 py-2.5 w-24">Unit</th>
                          <th className="px-2.5 py-2.5 w-28">Charged By</th>
                          <th className="px-2.5 py-2.5 w-20 text-center">Qty *</th>
                          <th className="px-2.5 py-2.5 w-28 text-right">Rate *</th>
                          <th className="px-2.5 py-2.5 w-20 text-center">VAT %</th>
                          <th className="px-3 py-2.5 w-28 text-right">Amount</th>
                          <th className="px-2.5 py-2.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formLines.map((line, idx) => {
                          const lineAmt = (Number(line.quantity) || 0) * (Number(line.rate) || 0);
                          return (
                            <tr key={line.tempId} className="hover:bg-slate-50/50">
                              {/* Equipment Description */}
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  placeholder="e.g. 50-Ton Mobile Hydraulic Crane"
                                  value={line.equipment_description}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, "equipment_description", e.target.value)
                                  }
                                  required
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-hidden focus:border-indigo-500"
                                />
                              </td>

                              {/* Unit */}
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  placeholder="Day"
                                  value={line.unit}
                                  onChange={(e) => handleUpdateLine(idx, "unit", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-hidden focus:border-indigo-500"
                                />
                              </td>

                              {/* Charged By */}
                              <td className="px-2.5 py-2">
                                <select
                                  value={line.charged_by || "day"}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, "charged_by", e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white cursor-pointer"
                                >
                                  {dropdowns.chargedBy.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Quantity */}
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  value={line.quantity}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, "quantity", Number(e.target.value))
                                  }
                                  required
                                  className="w-full px-2 py-1.5 text-center rounded-lg border border-slate-200 text-[12.5px] font-mono focus:outline-hidden focus:border-indigo-500"
                                />
                              </td>

                              {/* Rate */}
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={line.rate}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, "rate", Number(e.target.value))
                                  }
                                  required
                                  className="w-full px-2 py-1.5 text-right rounded-lg border border-slate-200 text-[12.5px] font-mono focus:outline-hidden focus:border-indigo-500"
                                />
                              </td>

                              {/* VAT % */}
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={line.vat_percent}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, "vat_percent", Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1.5 text-center rounded-lg border border-slate-200 text-[12px] font-mono focus:outline-hidden focus:border-indigo-500"
                                />
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2 text-right font-semibold font-mono text-slate-800">
                                {formatMoney(lineAmt)}
                              </td>

                              {/* Remove */}
                              <td className="px-2.5 py-2 text-center">
                                <button
                                  type="button"
                                  disabled={formLines.length <= 1}
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Costs & Live Financial Totals */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-3 w-full sm:w-1/2">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                        Notes / Terms
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add special terms, operator details, fuel policy..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[12.5px] bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-72 space-y-2 text-[12.5px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-semibold text-slate-700">
                        {formatMoney(formCalculations.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">VAT Total:</span>
                      <span className="text-slate-700">
                        +{formatMoney(formCalculations.vat_total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">AIT / TDS Total:</span>
                      <span className="text-slate-700">
                        -{formatMoney(formCalculations.ait_tds_total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[12px]">Shipping / Mob:</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formShippingCost}
                        onChange={(e) => setFormShippingCost(Number(e.target.value))}
                        className="w-28 px-2 py-1 text-right rounded border border-slate-200 text-[12px]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[12px]">Order Discount:</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formOrderDiscount}
                        onChange={(e) => setFormOrderDiscount(Number(e.target.value))}
                        className="w-28 px-2 py-1 text-right rounded border border-slate-200 text-[12px]"
                      />
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-800 text-[14px]">
                      <span>Grand Total:</span>
                      <span className="text-emerald-600">
                        {formatMoney(formCalculations.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingOrder ? "Save Changes" : "Create Hire Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Hire Order Details
                  </h3>
                  <span className="text-[12px] font-mono text-indigo-600 font-semibold">
                    {viewOrder.hire_no}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-[12.5px]">
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Hire Mode
                  </span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {viewOrder.hire_mode?.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Project
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewOrder.project?.name || "General"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Site
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewOrder.site?.name || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Vendor
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewOrder.vendor?.supplierName || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Hire Period
                  </span>
                  <span className="font-medium text-slate-700">
                    {viewOrder.hire_from} {viewOrder.hire_to ? `~ ${viewOrder.hire_to}` : ""}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Status
                  </span>
                  <div className="mt-0.5">{renderStatusBadge(viewOrder.status)}</div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-[13.5px] font-bold text-slate-800 mb-2.5">
                  Ordered Equipment Lines
                </h4>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-100">
                        <th className="px-3.5 py-2.5">Equipment / Description</th>
                        <th className="px-3.5 py-2.5 text-center">Unit</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Rate</th>
                        <th className="px-3.5 py-2.5 text-right">Tax / VAT</th>
                        <th className="px-3.5 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((item, idx) => (
                          <tr key={item.uuid || idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-800">
                              {item.equipment?.name || item.equipment_description}
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-600">
                              {item.unit} ({item.charged_by})
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-mono">
                              {item.quantity}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono">
                              {formatMoney(item.rate)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right text-slate-500 font-mono text-[11.5px]">
                              {formatMoney(
                                (Number(item.tax_amount) || 0) +
                                  (Number(item.vat_amount) || 0)
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800 font-mono">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 text-[12px]">
                            No equipment lines attached.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals Summary */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-1 text-[12.5px] max-w-sm">
                  <span className="font-semibold text-slate-700">Remarks / Terms:</span>
                  <p className="text-slate-500 leading-relaxed italic">
                    {viewOrder.notes || "No special remarks recorded."}
                  </p>
                </div>
                <div className="w-full sm:w-64 space-y-1.5 text-[12.5px] font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatMoney(viewOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT Total:</span>
                    <span>+{formatMoney(viewOrder.vat_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>AIT / TDS:</span>
                    <span>-{formatMoney(viewOrder.ait_tds_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span>-{formatMoney(viewOrder.order_discount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping / Mob:</span>
                    <span>+{formatMoney(viewOrder.shipping_cost)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800 text-[14px]">
                    <span>Grand Total:</span>
                    <span className="text-emerald-600">
                      {formatMoney(viewOrder.grand_total || viewOrder.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
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
                Delete Hire Order
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to soft-delete hire order{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{deleteTarget.hire_no}
              </span>
              ? It will be moved to the{" "}
              <span className="font-semibold text-rose-600">Deleted</span> tab where
              it can be restored anytime.
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
                <span>Delete Order</span>
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
                Restore Hire Order
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Restore hire order{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{restoreTarget.hire_no}
              </span>{" "}
              back to the Active hire orders list?
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
