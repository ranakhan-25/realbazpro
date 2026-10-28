"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  SquarePen,
  Trash2,
  PackageCheck,
  Search,
  CheckCircle2,
  Calendar,
  X,
  RotateCcw,
  Paperclip,
  Check,
  AlertCircle,
  ArrowUpDown,
  Loader2,
  Lock,
  Archive,
  RefreshCw,
} from "lucide-react";
import {
  procurementGrnApi,
  BackendGrn,
  BackendGrnItem,
  GrnDropdownsResult,
  ProcurementGrnApprovalLayer,
  ProcurementGrnStatus,
  UpdateGrnPayload,
} from "@/lib/procurement";

// Table Headers Definition (All 13 columns matching ERP screenshot)
const TABLE_HEADERS = [
  { key: "id", label: "ID", sortable: true },
  { key: "projectType", label: "PROJECT TYPE", sortable: true },
  { key: "project", label: "PROJECT", sortable: true },
  { key: "task", label: "TASK", sortable: true },
  { key: "supplierName", label: "SUPPLIER NAME", sortable: true },
  { key: "code", label: "CODE", sortable: true },
  { key: "reference", label: "REFERENCE", sortable: true },
  { key: "date", label: "DATE", sortable: true },
  { key: "addedBy", label: "ADDED BY", sortable: true },
  { key: "approval", label: "APPROVAL", sortable: false },
  { key: "note", label: "NOTE", sortable: false },
  { key: "attachment", label: "ATTACHMENT", sortable: false },
  { key: "action", label: "ACTION", sortable: false },
];

export default function GoodsReceiptNoteList() {
  // ---------------------------------------------------------------------------
  // Data States
  // ---------------------------------------------------------------------------
  const [grns, setGrns] = useState<BackendGrn[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tab State: Separate Active & Deleted Records
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  // Sorting Config
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "asc" });

  // Search & Debounce
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Filters State
  const [filters, setFilters] = useState({
    dateRange: "",
    companyId: "",
    supplierId: "",
    projectId: "",
    titleOfWorkId: "",
    taskId: "",
    alreadyBilled: "",
  });

  // Dropdown Data from API
  const [dropdowns, setDropdowns] = useState<GrnDropdownsResult>({
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
    purchaseOrders: [],
    requisitions: [],
    users: [],
  });

  // Modal & Feedback States
  const [viewItem, setViewItem] = useState<BackendGrn | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [editItem, setEditItem] = useState<BackendGrn | null>(null);
  const [editForm, setEditForm] = useState({
    company_id: "",
    supplier_id: "",
    project_type_id: "",
    project_id: "",
    title_of_work_id: "",
    task_id: "",
    site_id: "",
    date: "",
    code: "",
    reference: "",
    discount: 0,
    paid: 0,
    note: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BackendGrn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Keyboard accessibility: dismiss modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewItem(null);
        setEditItem(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Load Dropdowns Options from Real Backend API
  // ---------------------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const data = await procurementGrnApi.getDropdowns(
        filters.projectId || undefined
      );
      setDropdowns(data);
    } catch (err: any) {
      console.warn("Could not load GRN dropdowns from API:", err);
    }
  }, [filters.projectId]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // ---------------------------------------------------------------------------
  // Fetch Goods Receipt Notes from Real API
  // ---------------------------------------------------------------------------
  const loadGrns = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    // Parse dateRange if provided in format: "YYYY-MM-DD - YYYY-MM-DD"
    let date_from: string | undefined = undefined;
    let date_to: string | undefined = undefined;
    if (filters.dateRange && filters.dateRange.includes("-")) {
      const parts = filters.dateRange.split("-").map((p) => p.trim());
      if (parts[0]) date_from = parts[0];
      if (parts[1]) date_to = parts[1];
    }

    try {
      if (recordsTab === "deleted") {
        // Query strictly soft-deleted records from backend
        const res = await procurementGrnApi.list({
          page: currentPage,
          limit: entriesPerPage,
          search: debouncedSearch.trim() || undefined,
          date_from,
          date_to,
          company_id: filters.companyId || undefined,
          supplier_id: filters.supplierId || undefined,
          project_id: filters.projectId || undefined,
          title_of_work_id: filters.titleOfWorkId || undefined,
          task_id: filters.taskId || undefined,
          deleted_only: true,
        });

        setGrns(res.data);
        setTotalEntries(res.meta.total);
        setTotalPages(res.meta.totalPages);
        setDeletedCount(res.meta.total);
      } else {
        // Query Active records + run quick count query for Deleted records
        const [activeRes, deletedRes] = await Promise.allSettled([
          procurementGrnApi.list({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            date_from,
            date_to,
            company_id: filters.companyId || undefined,
            supplier_id: filters.supplierId || undefined,
            project_id: filters.projectId || undefined,
            title_of_work_id: filters.titleOfWorkId || undefined,
            task_id: filters.taskId || undefined,
            already_billed: filters.alreadyBilled || undefined,
          }),
          procurementGrnApi.list({
            limit: 1,
            deleted_only: true,
          }),
        ]);

        if (activeRes.status === "fulfilled") {
          setGrns(activeRes.value.data);
          setTotalEntries(activeRes.value.meta.total);
          setTotalPages(activeRes.value.meta.totalPages);
          setActiveCount(activeRes.value.meta.total);
        } else {
          throw activeRes.reason;
        }

        if (deletedRes.status === "fulfilled") {
          setDeletedCount(deletedRes.value.meta.total);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load Goods Receipt Notes from server.";
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
    filters.companyId,
    filters.supplierId,
    filters.projectId,
    filters.titleOfWorkId,
    filters.taskId,
    filters.alreadyBilled,
  ]);

  useEffect(() => {
    loadGrns();
  }, [loadGrns]);

  // Client-side Sorting for active page rows
  const sortedRows = useMemo(() => {
    const list = [...grns];
    list.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "id":
          aVal = a.code;
          bVal = b.code;
          break;
        case "projectType":
          aVal = a.projectType?.name || "";
          bVal = b.projectType?.name || "";
          break;
        case "project":
          aVal = a.project?.name || "";
          bVal = b.project?.name || "";
          break;
        case "task":
          aVal = a.task?.taskName || "";
          bVal = b.task?.taskName || "";
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
        case "addedBy":
          aVal = a.addedBy?.name || "";
          bVal = b.addedBy?.name || "";
          break;
        default:
          return 0;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
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

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
      dateRange: "",
      companyId: "",
      supplierId: "",
      projectId: "",
      titleOfWorkId: "",
      taskId: "",
      alreadyBilled: "",
    });
    setSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // ---------------------------------------------------------------------------
  // View Details Modal Handler
  // ---------------------------------------------------------------------------
  const handleOpenViewModal = async (row: BackendGrn) => {
    setIsViewLoading(true);
    setViewItem(row);
    try {
      const details = await procurementGrnApi.getById(row.uuid);
      setViewItem(details);
    } catch (err: any) {
      console.warn("Could not fetch full details, showing loaded data:", err);
    } finally {
      setIsViewLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit GRN Modal Handlers
  // ---------------------------------------------------------------------------
  const handleOpenEditModal = (row: BackendGrn) => {
    if (row.already_billed) {
      showToast("Locked: This GRN is already billed and cannot be edited.", "error");
      return;
    }
    setEditItem(row);
    setEditError(null);
    setEditForm({
      company_id: row.company_id || "",
      supplier_id: row.supplier_id || "",
      project_type_id: row.project_type_id || "",
      project_id: row.project_id || "",
      title_of_work_id: row.title_of_work_id || "",
      task_id: row.task_id || "",
      site_id: row.site_id || "",
      date: row.date || new Date().toISOString().slice(0, 10),
      code: row.code || "",
      reference: row.reference || "",
      discount: Number(row.discount) || 0,
      paid: Number(row.paid) || 0,
      note: row.note || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    if (editItem.already_billed) {
      setEditError("This GRN is already billed and locked against editing.");
      return;
    }

    if (!editForm.supplier_id) {
      setEditError("Please select a Supplier.");
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    const payload: UpdateGrnPayload = {
      company_id: editForm.company_id || undefined,
      supplier_id: editForm.supplier_id,
      project_type_id: editForm.project_type_id || undefined,
      project_id: editForm.project_id || undefined,
      title_of_work_id: editForm.title_of_work_id || undefined,
      task_id: editForm.task_id || undefined,
      site_id: editForm.site_id || undefined,
      date: editForm.date,
      code: editForm.code,
      reference: editForm.reference || undefined,
      discount: editForm.discount,
      paid: editForm.paid,
      note: editForm.note || undefined,
    };

    try {
      await procurementGrnApi.update(editItem.uuid, payload);
      showToast(`GRN #${editItem.code} updated successfully`, "success");
      setEditItem(null);
      await loadGrns();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update Goods Receipt Note.";
      setEditError(msg);
      showToast(msg, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete GRN Confirmation & Execution
  // ---------------------------------------------------------------------------
  const handleOpenDeleteDialog = (row: BackendGrn) => {
    if (row.already_billed) {
      showToast("Locked: This GRN is already billed and cannot be deleted.", "error");
      return;
    }
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.already_billed) {
      setDeleteError("This GRN is already billed and cannot be deleted.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await procurementGrnApi.delete(deleteTarget.uuid);
      showToast(`GRN #${deleteTarget.code} deleted successfully`, "success");
      setDeleteTarget(null);
      await loadGrns();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete Goods Receipt Note.";
      setDeleteError(msg);
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination calculation
  const startIdx = (currentPage - 1) * entriesPerPage;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Feedback */}
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
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-7 space-y-5">
        {/* --- Top Breadcrumb Navigation & Active/Deleted Tabs --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href="/dashboard"
              className="text-[#5D5FEF] hover:text-[#4E50E0] font-medium transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="inline-flex items-center gap-0.5 text-[#5D5FEF] hover:text-[#4E50E0] cursor-pointer font-medium">
              <span>Inventory</span>
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Goods Receipt Note(GRN) List
            </span>
          </nav>

          {/* Separate Active and Deleted Tabs (Requirement 3) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setRecordsTab("active");
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                recordsTab === "active"
                  ? "bg-[#5D5FEF] text-white shadow-2xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
            >
              <span>Active GRNs</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  recordsTab === "active"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
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
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                recordsTab === "deleted"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deleted GRNs</span>
              {deletedCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    recordsTab === "deleted"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {deletedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => loadGrns()}
              disabled={isLoading}
              title="Refresh list from server"
              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[#5D5FEF] hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#5D5FEF]" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* --- Filter Section (Linear & Stripe Inspired Grid) --- */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
          <div className="space-y-3.5">
            {/* Filter Row 1: Select Date, Company, Supplier, Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Select Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.dateRange}
                    onChange={(e) => {
                      setFilters({ ...filters, dateRange: e.target.value });
                      setCurrentPage(1);
                    }}
                    placeholder="YYYY-MM-DD - YYYY-MM-DD"
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-colors"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Company with Clearable (x) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Company
                </label>
                <div className="relative flex items-center">
                  <select
                    value={filters.companyId}
                    onChange={(e) => {
                      setFilters({ ...filters, companyId: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-12 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
                  >
                    <option value="">Select Company</option>
                    {dropdowns.companies.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {filters.companyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters({ ...filters, companyId: "" });
                        setCurrentPage(1);
                      }}
                      className="absolute right-6 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Clear company"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Supplier
                </label>
                <div className="relative">
                  <select
                    value={filters.supplierId}
                    onChange={(e) => {
                      setFilters({ ...filters, supplierId: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
                  >
                    <option value="">Select an option</option>
                    {dropdowns.suppliers.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.supplierName} {s.supplierCode ? `(${s.supplierCode})` : ""}
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
                    value={filters.projectId}
                    onChange={(e) => {
                      setFilters({ ...filters, projectId: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
                  >
                    <option value="">Select value</option>
                    {dropdowns.projects.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Row 2: Title/Name of Work, Task, Billing Status & Reset Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
              {/* Title / Name of Work */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Title/Name of Work
                </label>
                <div className="relative">
                  <select
                    value={filters.titleOfWorkId}
                    onChange={(e) => {
                      setFilters({ ...filters, titleOfWorkId: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
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

              {/* Task */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Task
                </label>
                <div className="relative">
                  <select
                    value={filters.taskId}
                    onChange={(e) => {
                      setFilters({ ...filters, taskId: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
                  >
                    <option value="">Select Task</option>
                    {dropdowns.tasks.map((t) => (
                      <option key={t.uuid} value={t.uuid}>
                        {t.taskName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Billing Status Filter (Optional filter) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Billing Status
                </label>
                <div className="relative">
                  <select
                    value={filters.alreadyBilled}
                    onChange={(e) => {
                      setFilters({ ...filters, alreadyBilled: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] appearance-none transition-colors"
                  >
                    <option value="">All Billing Statuses</option>
                    <option value="true">Already Billed (Locked)</option>
                    <option value="false">Pending Bill (Editable)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Reset Filters Button */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs hover:border-slate-300"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Table Card (Linear / Stripe Style) --- */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {/* Table Controls Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
            {/* Show Entries */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Search:
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search code, ref, supplier..."
                  className="w-52 sm:w-64 h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadGrns()}
                className="px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1260px]">
              <thead>
                <tr className="bg-[#5D5FEF] text-white text-[11px] font-semibold uppercase tracking-wider select-none">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h.key}
                      onClick={() => h.sortable && handleSort(h.key)}
                      className={`px-3.5 py-3 ${
                        h.sortable
                          ? "cursor-pointer hover:bg-[#4E50E0] transition-colors"
                          : ""
                      } ${
                        h.key === "action" || h.key === "attachment"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          h.key === "action" || h.key === "attachment"
                            ? "justify-center w-full"
                            : "justify-start"
                        }`}
                      >
                        <span>{h.label}</span>
                        {h.sortable && (
                          <span className="text-white/80">
                            {sortConfig.key === h.key ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-white/50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="px-4 py-12 text-center text-xs text-slate-500 dark:text-slate-400 select-none"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 text-[#5D5FEF] animate-spin" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Loading Goods Receipt Notes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="px-4 py-12 text-center text-xs text-slate-500 dark:text-slate-400 select-none"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        {recordsTab === "deleted" ? (
                          <Archive className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        ) : (
                          <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        )}
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {recordsTab === "deleted"
                            ? "No deleted Goods Receipt Notes found"
                            : "No matching Goods Receipt Notes found"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {recordsTab === "deleted"
                            ? "Deleted GRNs will appear here."
                            : "Try adjusting your search query or reset the filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-3.5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {startIdx + idx + 1}
                      </td>

                      {/* PROJECT TYPE */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {row.projectType?.name || "—"}
                      </td>

                      {/* PROJECT */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                        {row.project?.name || "—"}
                      </td>

                      {/* TASK */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {row.task?.taskName || "—"}
                      </td>

                      {/* SUPPLIER NAME */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {row.supplier?.supplierName || "—"}
                      </td>

                      {/* CODE */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                          {row.code}
                        </span>
                      </td>

                      {/* REFERENCE */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {row.reference || row.purchaseOrder?.reference || "—"}
                      </td>

                      {/* DATE */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {row.date}
                      </td>

                      {/* ADDED BY */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {row.addedBy?.name || "Admin"}
                      </td>

                      {/* APPROVAL */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3 stroke-[2.5] text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              {row.approval_layer ===
                              ProcurementGrnApprovalLayer.ALL_APPROVALS_COMPLETED
                                ? "All Approvals Completed"
                                : row.approval_layer ===
                                  ProcurementGrnApprovalLayer.ADMIN
                                ? "Admin Approved"
                                : "Pending Approval"}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3 stroke-[2.5] text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Admin</span>
                          </span>
                        </div>
                      </td>

                      {/* NOTE */}
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[140px] truncate" title={row.note || undefined}>
                        {row.note || "—"}
                      </td>

                      {/* ATTACHMENT */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        {row.attachment ? (
                          <span className="inline-flex items-center justify-center p-1 rounded-md text-[#5D5FEF] hover:bg-[#5D5FEF]/10">
                            <Paperclip className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* Eye / View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(row)}
                            title="View Details"
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Deleted Mode Badge */}
                          {recordsTab === "deleted" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold text-white bg-rose-500 shadow-2xs select-none">
                              Deleted
                            </span>
                          ) : row.already_billed ? (
                            /* Already Billed / Locked */
                            <span
                              title="Locked: This Goods Receipt Note has already been billed and cannot be edited or deleted."
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide text-white bg-[#FF9800] shadow-2xs select-none cursor-not-allowed"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Already Billed</span>
                            </span>
                          ) : (
                            /* Editable & Deletable */
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(row)}
                                title="Edit GRN"
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteDialog(row)}
                                title="Delete GRN"
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-[#F44336] hover:bg-[#e53935] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {totalEntries === 0 ? 0 : startIdx + 1} to{" "}
              {Math.min(startIdx + entriesPerPage, totalEntries)} of {totalEntries} entries
            </span>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    page === currentPage
                      ? "bg-[#5D5FEF] text-white font-semibold shadow-2xs"
                      : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- View Details Modal (Linear / Stripe Style) --- */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5D5FEF]/10 text-[#5D5FEF] flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Goods Receipt Note Details
                  </h3>
                  <span className="font-mono text-xs text-[#5D5FEF] font-semibold">
                    #{viewItem.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isViewLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#5D5FEF]" />
                <span className="text-xs text-slate-500">Loading details...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Supplier Name
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {viewItem.supplier?.supplierName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Project
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {viewItem.project?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Project Type
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewItem.projectType?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Reference
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {viewItem.reference || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Date
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewItem.date}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Added By
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewItem.addedBy?.name || "Admin"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Billing Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        viewItem.already_billed
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {viewItem.already_billed ? "Already Billed (Locked)" : "Pending Bill"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Total Amount
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      ৳{Number(viewItem.grand_total || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                      Note
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewItem.note || "No note recorded"}
                    </span>
                  </div>
                </div>

                {/* Items Line Table if present */}
                {viewItem.items && viewItem.items.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Received Line Items
                    </span>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-3 py-2">Item Code</th>
                            <th className="px-3 py-2">Item Name</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Rate</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {viewItem.items.map((line, lIdx) => (
                            <tr key={line.uuid || lIdx}>
                              <td className="px-3 py-2 font-mono font-medium">
                                {line.item_code}
                              </td>
                              <td className="px-3 py-2">{line.item_name}</td>
                              <td className="px-3 py-2 text-right">
                                {line.quantity} {line.unit || ""}
                              </td>
                              <td className="px-3 py-2 text-right">
                                ৳{Number(line.rate).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                ৳{Number(line.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Approval Steps */}
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-1.5">
                    Approval Hierarchy
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {viewItem.approval_layer ===
                        ProcurementGrnApprovalLayer.ALL_APPROVALS_COMPLETED
                          ? "All Approvals Completed"
                          : "Admin Approved"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Admin</span>
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Edit Goods Receipt Note #{editItem.code}
              </h3>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Supplier */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.supplier_id}
                    onChange={(e) =>
                      setEditForm({ ...editForm, supplier_id: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {dropdowns.suppliers.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.supplierName} {s.supplierCode ? `(${s.supplierCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Project
                  </label>
                  <select
                    value={editForm.project_id}
                    onChange={(e) =>
                      setEditForm({ ...editForm, project_id: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                  >
                    <option value="">Select Project</option>
                    {dropdowns.projects.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Project Type
                  </label>
                  <select
                    value={editForm.project_type_id}
                    onChange={(e) =>
                      setEditForm({ ...editForm, project_type_id: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                  >
                    <option value="">Select Project Type</option>
                    {dropdowns.projectTypes.map((pt) => (
                      <option key={pt.uuid} value={pt.uuid}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={editForm.reference}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reference: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                  />
                </div>

                {/* Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Note
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.note}
                    onChange={(e) =>
                      setEditForm({ ...editForm, note: e.target.value })
                    }
                    placeholder="Add remarks or note"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5D5FEF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update GRN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Delete Goods Receipt Note
                </h4>
                <p className="text-xs text-slate-500">
                  This action will soft-delete this record.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete GRN{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                #{deleteTarget.code}
              </span>
              ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#F44336] hover:bg-[#e53935] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Footer matching ERP --- */}
      <footer className="mt-auto px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap justify-between items-center gap-2">
        <span>2026 © Somikoron IT LTD</span>
        <span>Design &amp; Developed by Somikoron IT LTD</span>
      </footer>
    </div>
  );
}