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
  Download,
  Upload,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import {
  procurementBoqApi,
  BackendProcurementBoq,
  ProcurementBoqCostType,
  ProcurementBoqStatus,
  ProcurementBoqDropdownProject,
  ProcurementBoqDropdownCompany,
  ProcurementBoqDropdownUser,
  ProcurementBoqDropdownCategory,
  ProcurementBoqDropdownItem,
  ProcurementBoqDropdownUnit,
  ProcurementBoqDropdownsResult,
  ProcurementBoqItemLine,
  CreateProcurementBoqPayload,
} from "@/lib/procurement/procurementBoqApi";

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

interface FormItemRow {
  tempId: string;
  item_id?: string;
  category_id?: string;
  unit_id?: string;
  item_name: string;
  item_code?: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  cost_type: ProcurementBoqCostType;
  remarks?: string;
}

interface FormNoteRow {
  tempId: string;
  note: string;
}

const tableHeaders = [
  "ID",
  "TITLE",
  "PROJECT",
  "TYPE",
  "DATE",
  "DUE DATE",
  "MATERIAL",
  "LABOUR",
  "EQUIPMENT",
  "SUBCONTRACT",
  "SUBTOTAL",
  "MARGIN",
  "GRAND TOTAL",
  "STATUS",
  "ACTION",
];

export default function ProcurementBoqListPage() {
  // Active vs Deleted Tab State
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // List Data States
  const [allBoqs, setAllBoqs] = useState<BackendProcurementBoq[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Pagination & Search States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter States
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [boqTypeFilter, setBoqTypeFilter] = useState<string>("");

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<ProcurementBoqDropdownsResult>({
    projects: [],
    companies: [],
    responsibleUsers: [],
    categories: [],
    items: [],
    units: [],
    boqTypes: ["standard", "material", "labour", "equipment", "subcontract"],
    costTypes: ["material", "equipment_misc", "labour", "subcontract"],
    statuses: Object.values(ProcurementBoqStatus),
  });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [viewBoq, setViewBoq] = useState<BackendProcurementBoq | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendProcurementBoq | null>(null);

  // Create / Edit Form Fields
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formCompanyId, setFormCompanyId] = useState<string>("");
  const [formResponsibleUserId, setFormResponsibleUserId] = useState<string>("");
  const [formResponsiblePerson, setFormResponsiblePerson] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [formDueDate, setFormDueDate] = useState<string>(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formBoqType, setFormBoqType] = useState<string>("standard");
  const [formStatus, setFormStatus] = useState<ProcurementBoqStatus>(ProcurementBoqStatus.PENDING);
  const [formMarginOverhead, setFormMarginOverhead] = useState<number>(0);
  const [formRemarks, setFormRemarks] = useState<string>("");
  const [formItems, setFormItems] = useState<FormItemRow[]>([]);
  const [formNotes, setFormNotes] = useState<FormNoteRow[]>([]);

  // Excel Import Form Fields
  const [importProjectId, setImportProjectId] = useState<string>("");
  const [importCompanyId, setImportCompanyId] = useState<string>("");
  const [importTitle, setImportTitle] = useState<string>("");
  const [importDate, setImportDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [importDueDate, setImportDueDate] = useState<string>(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [importBoqType, setImportBoqType] = useState<string>("standard");
  const [importMarginOverhead, setImportMarginOverhead] = useState<number>(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Fetch Dropdown Options from Backend
  const fetchDropdowns = useCallback(async () => {
    try {
      const data = await procurementBoqApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.warn("Could not load procurement BOQ dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 2. Load BOQs from API
  const loadBoqs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await procurementBoqApi.list({
        search: debouncedSearch,
        project_id: projectFilter || undefined,
        status: statusFilter || undefined,
        limit: 100, // retrieve up to 100 for reliable tab partitioning
      });
      const data = res.data || [];
      setAllBoqs(data);

      const active = data.filter((b) => !b.deletedAt);
      const deleted = data.filter((b) => Boolean(b.deletedAt));
      setActiveCount(active.length);
      setDeletedCount(deleted.length);
    } catch (err) {
      const msg = parseApiError(err, "Failed to load procurement BOQs");
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, projectFilter, statusFilter, showToast]);

  useEffect(() => {
    loadBoqs();
  }, [loadBoqs]);

  // Filter BOQs by Active vs Deleted tab and boqType
  const currentTabBoqs = useMemo(() => {
    let list = allBoqs;
    if (recordsTab === "deleted") {
      list = list.filter((b) => Boolean(b.deletedAt));
    } else {
      list = list.filter((b) => !b.deletedAt);
    }
    if (boqTypeFilter) {
      list = list.filter((b) => b.boq_type === boqTypeFilter);
    }
    return list;
  }, [allBoqs, recordsTab, boqTypeFilter]);

  // Pagination calculations
  const totalEntries = currentTabBoqs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = currentTabBoqs.slice(startIdx, startIdx + entriesPerPage);

  // Table summary totals
  const totals = useMemo(() => {
    return currentTabBoqs.reduce(
      (acc, r) => ({
        material: acc.material + (Number(r.material_cost) || 0),
        labour: acc.labour + (Number(r.labour_cost) || 0),
        equipment: acc.equipment + (Number(r.equipment_misc_cost) || 0),
        subcontract: acc.subcontract + (Number(r.subcontract_cost) || 0),
        subtotal: acc.subtotal + (Number(r.subtotal) || 0),
        margin: acc.margin + (Number(r.margin_overhead) || 0),
        grandTotal: acc.grandTotal + (Number(r.grand_total) || 0),
      }),
      { material: 0, labour: 0, equipment: 0, subcontract: 0, subtotal: 0, margin: 0, grandTotal: 0 }
    );
  }, [currentTabBoqs]);

  // Form Live Cost Summaries
  const formCostSummary = useMemo(() => {
    const sumCost = (type: ProcurementBoqCostType) =>
      formItems
        .filter((l) => l.cost_type === type)
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const material = sumCost(ProcurementBoqCostType.MATERIAL);
    const equipment = sumCost(ProcurementBoqCostType.EQUIPMENT_MISC);
    const labour = sumCost(ProcurementBoqCostType.LABOUR);
    const subcontract = sumCost(ProcurementBoqCostType.SUBCONTRACT);
    const subtotal = material + equipment + labour + subcontract;
    const margin = Number(formMarginOverhead) || 0;
    const grandTotal = subtotal + margin;

    return { material, equipment, labour, subcontract, subtotal, margin, grandTotal };
  }, [formItems, formMarginOverhead]);

  // Switch Active / Deleted Tab
  const handleSwitchTab = (tab: "active" | "deleted") => {
    setRecordsTab(tab);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setProjectFilter("");
    setStatusFilter("");
    setBoqTypeFilter("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUuid(null);
    setFormProjectId(dropdowns.projects[0]?.uuid || "");
    setFormCompanyId(dropdowns.companies[0]?.uuid || "");
    setFormResponsibleUserId(dropdowns.responsibleUsers[0]?.id ? String(dropdowns.responsibleUsers[0].id) : "");
    setFormResponsiblePerson("");
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormBoqType("standard");
    setFormStatus(ProcurementBoqStatus.PENDING);
    setFormMarginOverhead(0);
    setFormRemarks("");

    // 1 default item row
    const defaultItem = dropdowns.items?.[0];
    const defaultUnit = dropdowns.units?.[0]?.name || "Unit";
    setFormItems([
      {
        tempId: `item-${Date.now()}`,
        item_id: defaultItem?.uuid,
        item_name: defaultItem?.name || "Concrete Works",
        item_code: defaultItem?.item_code || "CW-01",
        unit: defaultItem?.unit?.name || defaultUnit,
        quantity: 100,
        rate: 500,
        amount: 50000,
        cost_type: ProcurementBoqCostType.MATERIAL,
        remarks: "",
      },
    ]);

    setFormNotes([
      { tempId: `note-${Date.now()}`, note: "Subject to structural engineer approval." },
    ]);

    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (boq: BackendProcurementBoq) => {
    setEditingUuid(boq.uuid);
    setFormProjectId(boq.project_id || boq.project?.uuid || "");
    setFormCompanyId(boq.company_id || boq.company?.uuid || "");
    setFormResponsibleUserId(boq.responsible_user_id ? String(boq.responsible_user_id) : "");
    setFormResponsiblePerson(boq.responsible_person || "");
    setFormTitle(boq.title || "");
    setFormDate(boq.date ? boq.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormDueDate(boq.due_date ? boq.due_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormBoqType(boq.boq_type || "standard");
    setFormStatus(boq.status || ProcurementBoqStatus.PENDING);
    setFormMarginOverhead(Number(boq.margin_overhead) || 0);
    setFormRemarks(boq.remarks || "");

    if (Array.isArray(boq.items) && boq.items.length > 0) {
      setFormItems(
        boq.items.map((it, idx) => ({
          tempId: `edit-item-${idx}-${it.uuid || Date.now()}`,
          item_id: it.item_id || it.item?.uuid,
          category_id: it.category_id || it.category?.uuid,
          unit_id: it.unit_id || it.unitRelation?.uuid,
          item_name: it.item_name || it.item?.name || "Item",
          item_code: it.item_code || it.item?.item_code || "",
          unit: it.unit || it.unitRelation?.name || "Unit",
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.rate) || 0),
          cost_type: it.cost_type || ProcurementBoqCostType.MATERIAL,
          remarks: it.remarks || "",
        }))
      );
    } else {
      setFormItems([]);
    }

    if (Array.isArray(boq.importantNotes) && boq.importantNotes.length > 0) {
      setFormNotes(
        boq.importantNotes.map((n, idx) => ({
          tempId: `edit-note-${idx}-${n.uuid || Date.now()}`,
          note: n.note,
        }))
      );
    } else {
      setFormNotes([]);
    }

    setIsFormOpen(true);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const defaultUnit = dropdowns.units?.[0]?.name || "Unit";
    const newRow: FormItemRow = {
      tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item_name: "New BOQ Item",
      item_code: "",
      unit: defaultUnit,
      quantity: 1,
      rate: 0,
      amount: 0,
      cost_type: ProcurementBoqCostType.MATERIAL,
      remarks: "",
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
    field: keyof FormItemRow,
    value: string | number
  ) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        const updated = { ...it, [field]: value };
        if (field === "item_id") {
          const selected = dropdowns.items.find((i) => i.uuid === value);
          if (selected) {
            updated.item_name = selected.name;
            updated.item_code = selected.item_code || "";
            if (selected.unit?.name) updated.unit = selected.unit.name;
          }
        }
        if (field === "quantity" || field === "rate") {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      })
    );
  };

  // Add Note Row
  const handleAddNoteRow = () => {
    setFormNotes((prev) => [
      ...prev,
      { tempId: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, note: "" },
    ]);
  };

  // Remove Note Row
  const handleRemoveNoteRow = (tempId: string) => {
    setFormNotes((prev) => prev.filter((n) => n.tempId !== tempId));
  };

  // Update Note Row
  const handleUpdateNoteRow = (tempId: string, note: string) => {
    setFormNotes((prev) =>
      prev.map((n) => (n.tempId === tempId ? { ...n, note } : n))
    );
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (!formTitle.trim()) {
      showToast("Please enter a BOQ title", "error");
      return;
    }
    if (!formDate) {
      showToast("Please enter a valid date", "error");
      return;
    }
    if (!formDueDate) {
      showToast("Please enter a valid due date", "error");
      return;
    }
    if (formItems.length === 0) {
      showToast("Please add at least one item row to the BOQ", "error");
      return;
    }

    for (const it of formItems) {
      if (!it.item_name.trim()) {
        showToast("All items must have a valid name", "error");
        return;
      }
      if (!it.unit.trim()) {
        showToast(`Unit is required for item "${it.item_name}"`, "error");
        return;
      }
      if (Number(it.quantity) < 0 || Number(it.rate) < 0) {
        showToast("Quantity and rate must be non-negative numbers", "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProcurementBoqPayload = {
        project_id: formProjectId,
        company_id: formCompanyId || undefined,
        responsible_user_id: formResponsibleUserId ? Number(formResponsibleUserId) : undefined,
        responsible_person: formResponsiblePerson.trim() || undefined,
        title: formTitle.trim(),
        date: formDate.includes("T") ? formDate : `${formDate}T00:00:00.000Z`,
        due_date: formDueDate.includes("T") ? formDueDate : `${formDueDate}T00:00:00.000Z`,
        boq_type: formBoqType,
        status: formStatus,
        margin_overhead: Number(formMarginOverhead) || 0,
        remarks: formRemarks.trim() || undefined,
        items: formItems.map((it) => ({
          item_id: it.item_id || undefined,
          category_id: it.category_id || undefined,
          unit_id: it.unit_id || undefined,
          item_name: it.item_name.trim(),
          item_code: it.item_code?.trim() || undefined,
          unit: it.unit.trim(),
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          cost_type: it.cost_type,
          remarks: it.remarks?.trim() || undefined,
        })),
        important_notes: formNotes
          .filter((n) => n.note.trim())
          .map((n) => ({ note: n.note.trim() })),
      };

      if (editingUuid) {
        await procurementBoqApi.update(editingUuid, payload);
        showToast(`Procurement BOQ "${formTitle}" updated successfully`, "success");
      } else {
        await procurementBoqApi.create(payload);
        showToast(`Procurement BOQ "${formTitle}" created successfully`, "success");
      }

      setIsFormOpen(false);
      setEditingUuid(null);
      await loadBoqs();
    } catch (err) {
      const msg = parseApiError(
        err,
        editingUuid ? "Failed to update BOQ" : "Failed to create BOQ"
      );
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Template Handler
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await procurementBoqApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "procurement-boq-template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Excel import template downloaded successfully", "success");
    } catch (err) {
      const msg = parseApiError(err, "Failed to download Excel template");
      showToast(msg, "error");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Open Import Modal
  const handleOpenImport = () => {
    setImportProjectId(dropdowns.projects[0]?.uuid || "");
    setImportCompanyId(dropdowns.companies[0]?.uuid || "");
    setImportTitle("");
    setImportDate(new Date().toISOString().split("T")[0]);
    setImportDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setImportBoqType("standard");
    setImportMarginOverhead(0);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsImportModalOpen(true);
  };

  // Excel Import Submit Handler
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showToast("Please choose an Excel file to import", "error");
      return;
    }
    if (!importProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (!importTitle.trim()) {
      showToast("Please enter a BOQ title", "error");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("project_id", importProjectId);
      if (importCompanyId) formData.append("company_id", importCompanyId);
      formData.append("title", importTitle.trim());
      formData.append("date", importDate.includes("T") ? importDate : `${importDate}T00:00:00.000Z`);
      formData.append("due_date", importDueDate.includes("T") ? importDueDate : `${importDueDate}T00:00:00.000Z`);
      formData.append("boq_type", importBoqType);
      formData.append("margin_overhead", String(importMarginOverhead || 0));

      await procurementBoqApi.importExcel(formData);
      showToast("Excel BOQ items imported and created successfully!", "success");
      setIsImportModalOpen(false);
      await loadBoqs();
    } catch (err) {
      const msg = parseApiError(err, "Failed to import Excel file");
      showToast(msg, "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Delete Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementBoqApi.delete(deleteTarget.uuid);
      showToast(`BOQ "${deleteTarget.title}" moved to Deleted tab`, "success");
      setDeleteTarget(null);
      await loadBoqs();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete BOQ");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const statusBadge = (status: ProcurementBoqStatus | string) => {
    switch (status) {
      case ProcurementBoqStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case ProcurementBoqStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case ProcurementBoqStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Completed
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
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Procurement BOQ List
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
                <span className="text-slate-500">Bill of Quantities (BOQ)</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              title="Download Excel Import Template"
            >
              {isDownloadingTemplate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Excel Template</span>
            </button>

            <button
              onClick={handleOpenImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>

            <button
              onClick={loadBoqs}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
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
              <span>New Procurement BOQ</span>
            </button>
          </div>
        </div>

        {/* Active vs Deleted Segmented Tabs & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Segmented Pill Tabs */}
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
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={boqTypeFilter}
              onChange={(e) => {
                setBoqTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
            >
              <option value="">All BOQ Types</option>
              {dropdowns.boqTypes.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>

            {(search || projectFilter || statusFilter || boqTypeFilter) && (
              <button
                onClick={handleResetFilters}
                className="text-[12px] text-slate-500 hover:text-rose-600 transition-colors px-2 py-1"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
          {/* Table Controls Header */}
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
                  placeholder="Title, project, remarks..."
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
            <table className="w-full text-left border-collapse min-w-[1200px] text-[12.5px]">
              <thead>
                <tr className="bg-indigo-50/70 text-indigo-700 font-semibold text-[11px] tracking-wide uppercase">
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-3 py-3 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading procurement BOQs...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-4 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                        <span className="font-medium text-slate-600">
                          {recordsTab === "deleted"
                            ? "No deleted procurement BOQs found"
                            : "No procurement BOQs found"}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {recordsTab === "deleted"
                            ? "Soft-deleted BOQs will appear in this tab"
                            : "Click 'New Procurement BOQ' or 'Import Excel' to add your first bill of quantities"}
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
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {row.id || startIdx + idx + 1}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800 max-w-[220px] truncate" title={row.title}>
                        {row.title}
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-[180px] truncate">
                        {row.project?.name || "Project"}
                        {row.project?.code ? ` (${row.project.code})` : ""}
                      </td>
                      <td className="px-3 py-3 capitalize text-slate-600">
                        {row.boq_type}
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {row.due_date}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700">
                        {formatCurrency(row.material_cost)}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700">
                        {formatCurrency(row.labour_cost)}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700">
                        {formatCurrency(row.equipment_misc_cost)}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700">
                        {formatCurrency(row.subcontract_cost)}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-slate-800">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-500">
                        {formatCurrency(row.margin_overhead)}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-indigo-700">
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
                            onClick={() => setViewBoq(row)}
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
                            <span className="text-[11px] font-medium text-rose-500 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                              Soft-Deleted
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
                    <td className="px-3 py-3 font-bold" colSpan={6}>
                      TOTAL ({currentTabBoqs.length} RECORDS)
                    </td>
                    <td className="px-3 py-3 font-mono">{formatCurrency(totals.material)}</td>
                    <td className="px-3 py-3 font-mono">{formatCurrency(totals.labour)}</td>
                    <td className="px-3 py-3 font-mono">{formatCurrency(totals.equipment)}</td>
                    <td className="px-3 py-3 font-mono">{formatCurrency(totals.subcontract)}</td>
                    <td className="px-3 py-3 font-mono text-slate-900">{formatCurrency(totals.subtotal)}</td>
                    <td className="px-3 py-3 font-mono">{formatCurrency(totals.margin)}</td>
                    <td className="px-3 py-3 font-mono text-indigo-700 font-bold">{formatCurrency(totals.grandTotal)}</td>
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
          CREATE / EDIT MODAL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {editingUuid ? "Edit Procurement BOQ" : "Create Procurement BOQ"}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Specify project, title, item rows, cost types, and notes
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

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Row 1: Project, Title, BOQ Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
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
                    BOQ Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Structural RCC Civil Works - Block B"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    BOQ Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formBoqType}
                    onChange={(e) => setFormBoqType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
                  >
                    {dropdowns.boqTypes.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date, Due Date, Responsible Person, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Responsible User
                  </label>
                  <select
                    value={formResponsibleUserId}
                    onChange={(e) => setFormResponsibleUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select User</option>
                    {dropdowns.responsibleUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProcurementBoqStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Item Lines Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[13px] font-bold text-slate-800">
                      BOQ Item Lines ({formItems.length})
                    </label>
                    <p className="text-[11.5px] text-slate-400">
                      Add materials, labour, equipment, or subcontract items
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="px-3 py-2 font-semibold">Item Name</th>
                        <th className="px-2 py-2 font-semibold w-24">Item Code</th>
                        <th className="px-2 py-2 font-semibold w-24">Unit</th>
                        <th className="px-2 py-2 font-semibold w-24">Quantity</th>
                        <th className="px-2 py-2 font-semibold w-24">Rate</th>
                        <th className="px-2 py-2 font-semibold w-24 text-right">Amount</th>
                        <th className="px-3 py-2 font-semibold w-32">Cost Type</th>
                        <th className="px-3 py-2 font-semibold">Remarks</th>
                        <th className="px-2 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                            No item lines added. Click "+ Add Item Row" above.
                          </td>
                        </tr>
                      ) : (
                        formItems.map((it) => (
                          <tr key={it.tempId} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-2">
                              {dropdowns.items.length > 0 ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    required
                                    value={it.item_name}
                                    placeholder="Item name"
                                    onChange={(e) =>
                                      handleUpdateItemRow(it.tempId, "item_name", e.target.value)
                                    }
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px]"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  required
                                  value={it.item_name}
                                  placeholder="Item name"
                                  onChange={(e) =>
                                    handleUpdateItemRow(it.tempId, "item_name", e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px]"
                                />
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={it.item_code || ""}
                                placeholder="Code"
                                onChange={(e) =>
                                  handleUpdateItemRow(it.tempId, "item_code", e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px] font-mono"
                              />
                            </td>
                            <td className="px-2 py-2">
                              {dropdowns.units.length > 0 ? (
                                <select
                                  value={it.unit}
                                  onChange={(e) =>
                                    handleUpdateItemRow(it.tempId, "unit", e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px]"
                                >
                                  {dropdowns.units.map((u) => (
                                    <option key={u.uuid} value={u.name}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  required
                                  value={it.unit}
                                  placeholder="Unit"
                                  onChange={(e) =>
                                    handleUpdateItemRow(it.tempId, "unit", e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px]"
                                />
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.quantity}
                                onChange={(e) =>
                                  handleUpdateItemRow(it.tempId, "quantity", Number(e.target.value))
                                }
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px] font-mono text-center"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.rate}
                                onChange={(e) =>
                                  handleUpdateItemRow(it.tempId, "rate", Number(e.target.value))
                                }
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px] font-mono text-right"
                              />
                            </td>
                            <td className="px-2 py-2 font-mono font-medium text-right text-slate-800">
                              {formatCurrency(it.amount)}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={it.cost_type}
                                onChange={(e) =>
                                  handleUpdateItemRow(
                                    it.tempId,
                                    "cost_type",
                                    e.target.value as ProcurementBoqCostType
                                  )
                                }
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px] capitalize"
                              >
                                <option value="material">Material</option>
                                <option value="equipment_misc">Equipment</option>
                                <option value="labour">Labour</option>
                                <option value="subcontract">Subcontract</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={it.remarks || ""}
                                placeholder="Specs, brand..."
                                onChange={(e) =>
                                  handleUpdateItemRow(it.tempId, "remarks", e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[12px]"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(it.tempId)}
                                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

              {/* Important Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold text-slate-700">
                    Important Notes ({formNotes.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNoteRow}
                    className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    + Add Note
                  </button>
                </div>
                {formNotes.map((n, i) => (
                  <div key={n.tempId} className="flex items-center gap-2">
                    <span className="text-[11.5px] font-mono text-slate-400 w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={n.note}
                      placeholder="e.g. Concrete cube test required after 28 days"
                      onChange={(e) => handleUpdateNoteRow(n.tempId, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNoteRow(n.tempId)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Calculated Cost Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <span className="text-[12.5px] font-bold text-slate-800 block">
                  Calculated Cost Summary
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px] font-mono">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="block text-[11px] text-slate-400 uppercase">Material Cost</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(formCostSummary.material)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="block text-[11px] text-slate-400 uppercase">Labour Cost</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(formCostSummary.labour)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="block text-[11px] text-slate-400 uppercase">Equipment Cost</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(formCostSummary.equipment)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="block text-[11px] text-slate-400 uppercase">Subcontract Cost</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(formCostSummary.subcontract)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center border-t border-slate-200 pt-3">
                  <div>
                    <span className="block text-[11px] text-slate-500 font-medium">Subtotal</span>
                    <span className="text-[15px] font-bold font-mono text-slate-800">
                      {formatCurrency(formCostSummary.subtotal)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                      Margin & Overhead
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMarginOverhead}
                      onChange={(e) => setFormMarginOverhead(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-[13px] font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-indigo-600 font-medium">Grand Total</span>
                    <span className="text-[17px] font-bold font-mono text-indigo-700">
                      {formatCurrency(formCostSummary.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  General Remarks / Description
                </label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Additional scope or specifications note..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUuid ? "Save Changes" : "Create Procurement BOQ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewBoq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {viewBoq.title}
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Project: {viewBoq.project?.name || "N/A"} • Type: {viewBoq.boq_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
                  title="Print BOQ"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewBoq(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-[11px] text-slate-400">Project</span>
                  <span className="font-semibold text-slate-800">{viewBoq.project?.name || "N/A"}</span>
                  {viewBoq.project?.code && (
                    <span className="text-[11.5px] text-slate-500 block">Code: {viewBoq.project.code}</span>
                  )}
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Date / Due Date</span>
                  <span className="text-slate-700 block font-medium">{viewBoq.date}</span>
                  <span className="text-[11.5px] text-slate-500 block">Due: {viewBoq.due_date}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Status</span>
                  <div className="mt-0.5">{statusBadge(viewBoq.status)}</div>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Responsible Person</span>
                  <span className="text-slate-700 font-medium">
                    {viewBoq.responsibleUser?.name || viewBoq.responsible_person || "N/A"}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {Array.isArray(viewBoq.items) && viewBoq.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Item Specifications</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-2 py-2">Code</th>
                          <th className="px-2 py-2">Unit</th>
                          <th className="px-2 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2">Cost Type</th>
                          <th className="px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewBoq.items.map((it, idx) => (
                          <tr key={it.uuid || idx} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium text-slate-800">{it.item_name}</td>
                            <td className="px-2 py-2 font-mono text-indigo-600">{it.item_code || "-"}</td>
                            <td className="px-2 py-2 text-slate-600">{it.unit}</td>
                            <td className="px-2 py-2 text-center font-mono">{it.quantity}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatCurrency(it.rate)}</td>
                            <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">
                              {formatCurrency(it.amount)}
                            </td>
                            <td className="px-3 py-2 capitalize">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                                {it.cost_type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-[11.5px]">{it.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cost Summary Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 font-mono text-[13px]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="block text-[11px] text-slate-400 font-sans">Material</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(viewBoq.material_cost)}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-sans">Labour</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(viewBoq.labour_cost)}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-sans">Equipment</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(viewBoq.equipment_misc_cost)}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-sans">Subcontract</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(viewBoq.subcontract_cost)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewBoq.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Margin & Overhead:</span>
                  <span>{formatCurrency(viewBoq.margin_overhead)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-[15px] border-t border-slate-200 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">{formatCurrency(viewBoq.grand_total)}</span>
                </div>
              </div>

              {/* Important Notes */}
              {Array.isArray(viewBoq.importantNotes) && viewBoq.importantNotes.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Important Notes</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[12.5px]">
                    {viewBoq.importantNotes.map((n) => (
                      <li key={n.uuid}>{n.note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewBoq.remarks && (
                <div className="text-[12.5px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold block text-slate-700">Remarks:</span>
                  {viewBoq.remarks}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewBoq(null)}
                className="px-4 py-1.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IMPORT EXCEL MODAL
          ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Import Procurement BOQ from Excel
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Upload an Excel file (.xlsx) with BOQ item lines
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={importProjectId}
                  onChange={(e) => setImportProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700"
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
                  BOQ Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Imported Electrical Cabling BOQ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importDueDate}
                    onChange={(e) => setImportDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    BOQ Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={importBoqType}
                    onChange={(e) => setImportBoqType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 capitalize"
                  >
                    {dropdowns.boqTypes.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Margin & Overhead
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={importMarginOverhead}
                    onChange={(e) => setImportMarginOverhead(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Excel Spreadsheet File (.xlsx, .xls) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-[12.5px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[12.5px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex items-center justify-between text-[12px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Need the standard column format?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  Download template.xlsx
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
                >
                  {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Upload & Import</span>
                </button>
              </div>
            </form>
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
                Delete Procurement BOQ
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">"{deleteTarget.title}"</span>?
              It will be soft-deleted and moved to the{" "}
              <span className="font-semibold text-rose-600">Deleted</span> tab.
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm shadow-rose-200"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete BOQ</span>
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
}
