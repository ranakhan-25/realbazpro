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
  Plus,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  Boxes,
  Ban,
  ArrowUpDown,
  Calendar,
  FileText,
  User,
  Building2,
  RotateCcw,
} from "lucide-react";
import {
  procurementMaterialIssuesApi,
  BackendMaterialIssue,
  MaterialIssueDropdownGrn,
  MaterialIssueDropdownUser,
  MaterialIssueDropdownsResult,
  MaterialIssueGrnItem,
  CreateMaterialIssuePayload,
  MaterialIssueItemPayload,
} from "@/lib/procurement/procurementMaterialIssuesApi";

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

const tableHeaders = [
  "ID",
  "ISSUE NO / UUID",
  "GRN NO",
  "PROJECT",
  "PURPOSE",
  "DATE",
  "ISSUED BY",
  "ITEMS COUNT",
  "STATUS",
  "ACTION",
];

interface FormItemRow {
  grn_item_id: string;
  item_code: string;
  item_name: string;
  unit: string;
  available_qty: number;
  issue_qty: number;
  selected: boolean;
}

export default function ProcurementMaterialIssueListPage() {
  // Active vs Deleted / Trash Tab
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // List Data
  const [materialIssues, setMaterialIssues] = useState<BackendMaterialIssue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Pagination & Search States
  const [searchGrnNo, setSearchGrnNo] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortByDate, setSortByDate] = useState<"DESC" | "ASC">("DESC");

  // Dropdowns from API
  const [dropdowns, setDropdowns] = useState<MaterialIssueDropdownsResult>({
    grns: [],
    users: [],
    statuses: ["issued", "cancelled"],
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [viewIssue, setViewIssue] = useState<BackendMaterialIssue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendMaterialIssue | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BackendMaterialIssue | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackendMaterialIssue | null>(null);

  // Create Form Fields
  const [formGrnId, setFormGrnId] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [formPurpose, setFormPurpose] = useState<string>("");
  const [formIssuedById, setFormIssuedById] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formItemRows, setFormItemRows] = useState<FormItemRow[]>([]);

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
      setDebouncedSearch(searchGrnNo);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchGrnNo]);

  // 1. Fetch Dropdown Options
  const fetchDropdowns = useCallback(async () => {
    try {
      const data = await procurementMaterialIssuesApi.getDropdowns();
      setDropdowns(data);
    } catch (err) {
      console.warn("Could not load material-issues dropdowns:", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 2. Load Material Issues List based on Active vs Deleted
  const loadMaterialIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = {
        grn_no: debouncedSearch || undefined,
        status: statusFilter || undefined,
        sort_by_date: sortByDate,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: currentPage,
        limit: entriesPerPage,
      };

      if (recordsTab === "deleted") {
        const res = await procurementMaterialIssuesApi.getTrash(queryParams);
        setMaterialIssues(res.data || []);
      } else {
        const res = await procurementMaterialIssuesApi.list(queryParams);
        setMaterialIssues(res.data || []);
      }

      // Update Tab Counts
      try {
        const [activeRes, trashRes] = await Promise.all([
          procurementMaterialIssuesApi.list({ limit: 1 }),
          procurementMaterialIssuesApi.getTrash({ limit: 1 }),
        ]);
        setActiveCount(activeRes.meta?.total ?? 0);
        setDeletedCount(trashRes.meta?.total ?? 0);
      } catch {
        // Ignored
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to load material issues");
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    recordsTab,
    debouncedSearch,
    statusFilter,
    sortByDate,
    dateFrom,
    dateTo,
    currentPage,
    entriesPerPage,
    showToast,
  ]);

  useEffect(() => {
    loadMaterialIssues();
  }, [loadMaterialIssues]);

  // Tab switcher
  const handleSwitchTab = (tab: "active" | "deleted") => {
    setRecordsTab(tab);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchGrnNo("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSortByDate("DESC");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPurpose("");
    setFormIssuedById(dropdowns.users[0]?.id ? String(dropdowns.users[0].id) : "");
    setFormNotes("");

    // Set first GRN if available
    const firstGrn = dropdowns.grns[0];
    if (firstGrn) {
      setFormGrnId(firstGrn.uuid);
      populateGrnItems(firstGrn);
    } else {
      setFormGrnId("");
      setFormItemRows([]);
    }

    setIsCreateOpen(true);
  };

  // Populate items when selected GRN changes
  const populateGrnItems = (grn: MaterialIssueDropdownGrn) => {
    if (Array.isArray(grn.items) && grn.items.length > 0) {
      const rows: FormItemRow[] = grn.items.map((it) => {
        const avail = Number(it.available_qty) || 0;
        return {
          grn_item_id: it.uuid,
          item_code: it.item_code || "",
          item_name: it.item_name || "Material Item",
          unit: it.unit || "Unit",
          available_qty: avail,
          issue_qty: avail > 0 ? avail : 0,
          selected: avail > 0,
        };
      });
      setFormItemRows(rows);
    } else {
      setFormItemRows([]);
    }
  };

  const handleGrnChange = (grnUuid: string) => {
    setFormGrnId(grnUuid);
    const selectedGrn = dropdowns.grns.find((g) => g.uuid === grnUuid);
    if (selectedGrn) {
      populateGrnItems(selectedGrn);
    } else {
      setFormItemRows([]);
    }
  };

  // Toggle item row selection
  const handleToggleItem = (grn_item_id: string) => {
    setFormItemRows((prev) =>
      prev.map((r) =>
        r.grn_item_id === grn_item_id ? { ...r, selected: !r.selected } : r
      )
    );
  };

  // Update item issue qty
  const handleItemQtyChange = (grn_item_id: string, qty: number) => {
    setFormItemRows((prev) =>
      prev.map((r) => {
        if (r.grn_item_id !== grn_item_id) return r;
        return { ...r, issue_qty: qty };
      })
    );
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formGrnId) {
      showToast("Please select an approved GRN", "error");
      return;
    }
    if (!formPurpose.trim()) {
      showToast("Please enter the issue purpose", "error");
      return;
    }

    const selectedRows = formItemRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      showToast("Please select at least one material item to issue", "error");
      return;
    }

    for (const r of selectedRows) {
      if (r.issue_qty <= 0) {
        showToast(
          `Quantity for "${r.item_name}" must be greater than zero`,
          "error"
        );
        return;
      }
      if (r.issue_qty > r.available_qty) {
        showToast(
          `Quantity for "${r.item_name}" cannot exceed available quantity (${r.available_qty} ${r.unit})`,
          "error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateMaterialIssuePayload = {
        grn_id: formGrnId,
        date: formDate.includes("T") ? formDate : `${formDate}T00:00:00.000Z`,
        purpose: formPurpose.trim(),
        issued_by_id: formIssuedById ? Number(formIssuedById) : undefined,
        notes: formNotes.trim() || undefined,
        items: selectedRows.map((r) => ({
          grn_item_id: r.grn_item_id,
          quantity: Number(r.issue_qty),
        })),
      };

      await procurementMaterialIssuesApi.create(payload);
      showToast("Material issue created successfully", "success");
      setIsCreateOpen(false);
      await loadMaterialIssues();
      await fetchDropdowns(); // Refresh remaining available quantities
    } catch (err) {
      const msg = parseApiError(err, "Failed to create material issue");
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsActionLoading(true);
    try {
      await procurementMaterialIssuesApi.cancel(cancelTarget.uuid);
      showToast(
        `Material issue #${cancelTarget.issue_no || cancelTarget.uuid.substring(0, 8)} cancelled successfully`,
        "success"
      );
      setCancelTarget(null);
      await loadMaterialIssues();
    } catch (err) {
      const msg = parseApiError(err, "Failed to cancel material issue");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      await procurementMaterialIssuesApi.delete(deleteTarget.uuid);
      showToast(
        `Material issue #${deleteTarget.issue_no || deleteTarget.uuid.substring(0, 8)} moved to Deleted`,
        "success"
      );
      setDeleteTarget(null);
      await loadMaterialIssues();
    } catch (err) {
      const msg = parseApiError(err, "Failed to delete material issue");
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
      await procurementMaterialIssuesApi.restore(restoreTarget.uuid);
      showToast(
        `Material issue #${restoreTarget.issue_no || restoreTarget.uuid.substring(0, 8)} restored successfully`,
        "success"
      );
      setRestoreTarget(null);
      await loadMaterialIssues();
    } catch (err) {
      const msg = parseApiError(err, "Failed to restore material issue");
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status Badge
  const statusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      case "issued":
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Issued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status || "Active"}
          </span>
        );
    }
  };

  const selectedGrn = dropdowns.grns.find((g) => g.uuid === formGrnId);

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
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">
                Material Issue List
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
                <span className="text-slate-500">Material Issue</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadMaterialIssues}
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
              <span>New Material Issue</span>
            </button>
          </div>
        </div>

        {/* Segmented Pill Tabs & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Segmented Tabs */}
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
              onClick={() => handleSwitchTab("deleted")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                recordsTab === "deleted"
                  ? "bg-white text-rose-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Deleted / Trash</span>
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 capitalize"
            >
              <option value="">All Statuses</option>
              {dropdowns.statuses.map((st) => (
                <option key={st} value={st} className="capitalize">
                  {st}
                </option>
              ))}
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              title="Date from"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              title="Date to"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {/* Sort Order */}
            <button
              onClick={() =>
                setSortByDate((prev) => (prev === "DESC" ? "ASC" : "DESC"))
              }
              className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle date sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortByDate === "DESC" ? "Newest" : "Oldest"}</span>
            </button>

            {(searchGrnNo || statusFilter || dateFrom || dateTo) && (
              <button
                onClick={handleResetFilters}
                className="text-[12px] text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
          {/* Table Controls */}
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

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchGrnNo}
                onChange={(e) => setSearchGrnNo(e.target.value)}
                placeholder="Search by GRN number..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-slate-100 bg-[#EFEFFD] text-[#374151] font-semibold tracking-wide text-[11px] uppercase">
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-3.5 py-3 whitespace-nowrap">
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
                        <span>Loading material issues from server...</span>
                      </div>
                    </td>
                  </tr>
                ) : materialIssues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-3 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Boxes className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="font-medium text-slate-600">
                          {recordsTab === "deleted"
                            ? "No deleted material issues found"
                            : "No material issues found"}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {recordsTab === "deleted"
                            ? "Deleted material issues will appear here"
                            : "Click 'New Material Issue' to issue materials against approved GRNs"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  materialIssues.map((row, idx) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3.5 py-3 text-slate-400 font-mono text-[11.5px]">
                        {row.id || idx + 1}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-indigo-600 whitespace-nowrap font-mono">
                        {row.issue_no || row.uuid.substring(0, 8)}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {row.grn?.code || "GRN"}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                        {row.grn?.project?.name || "N/A"}
                      </td>
                      <td className="px-3.5 py-3 font-medium text-slate-800 max-w-[220px] truncate">
                        {row.purpose}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 whitespace-nowrap">
                        {row.date ? row.date.split("T")[0] : "—"}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                        {row.issuedBy?.name || "Admin"}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 text-center font-semibold">
                        {row.items?.length || 0}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {statusBadge(row.status)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewIssue(row)}
                            aria-label="View Details"
                            title="View details"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {recordsTab === "active" ? (
                            <>
                              {/* Cancel Button (if not already cancelled) */}
                              {row.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => setCancelTarget(row)}
                                  aria-label="Cancel Issue"
                                  title="Cancel material issue"
                                  className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}

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
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
            <span className="text-[12.5px] text-slate-400">
              Showing {materialIssues.length === 0 ? 0 : 1} to{" "}
              {materialIssues.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                className="w-8 h-8 rounded-lg text-[13px] font-medium bg-indigo-600 text-white"
              >
                {currentPage}
              </button>
              <button
                disabled={materialIssues.length < entriesPerPage}
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
          CREATE MATERIAL ISSUE MODAL
          ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Create Material Issue
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    Issue materials against fully approved GRNs with remaining quantities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {/* Row 1: Approved GRN selection */}
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Select Approved GRN <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formGrnId}
                  onChange={(e) => handleGrnChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select Approved GRN</option>
                  {dropdowns.grns.map((g) => (
                    <option key={g.uuid} value={g.uuid}>
                      GRN #{g.code} — {g.project?.name || "Project"} ({g.supplier?.supplierName || "Supplier"}) [Date: {g.date}]
                    </option>
                  ))}
                </select>
                {selectedGrn && (
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Reference: {selectedGrn.reference || "N/A"} | Project: {selectedGrn.project?.name || "N/A"}
                  </p>
                )}
              </div>

              {/* Row 2: Date, Purpose, Issued By */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Issue Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Purpose of Issue <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="e.g. Slab casting, Brickwork"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Issued By (User)
                  </label>
                  <select
                    value={formIssuedById}
                    onChange={(e) => setFormIssuedById(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select Issuer</option>
                    {dropdowns.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Notes */}
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Enter remarks, vehicle info, or site location..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[12.5px] font-bold text-slate-700 uppercase tracking-wide">
                    Materials Available in GRN ({formItemRows.length})
                  </label>
                  <span className="text-[11.5px] text-slate-400">
                    Check the boxes for items to issue and specify quantities
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2.5 w-10 text-center">Select</th>
                        <th className="px-3 py-2.5">Item Code & Name</th>
                        <th className="px-3 py-2.5 w-20 text-center">Unit</th>
                        <th className="px-3 py-2.5 w-32 text-right">Available Qty</th>
                        <th className="px-3 py-2.5 w-40 text-right">Quantity to Issue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {formItemRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                            {formGrnId
                              ? "No items with remaining quantities available in this GRN."
                              : "Please select an approved GRN above to load items."}
                          </td>
                        </tr>
                      ) : (
                        formItemRows.map((item) => (
                          <tr
                            key={item.grn_item_id}
                            className={`hover:bg-slate-50/70 ${item.selected ? "bg-indigo-50/30" : ""}`}
                          >
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                disabled={item.available_qty <= 0}
                                onChange={() => handleToggleItem(item.grn_item_id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-slate-800">
                                {item.item_name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {item.item_code}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-600">
                              {item.unit}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-700">
                              <span
                                className={`px-2 py-0.5 rounded text-[12px] ${
                                  item.available_qty > 0
                                    ? "bg-emerald-50 text-emerald-700 font-bold"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {item.available_qty} {item.unit}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="number"
                                min="0.001"
                                max={item.available_qty}
                                step="any"
                                disabled={!item.selected || item.available_qty <= 0}
                                value={item.issue_qty}
                                onChange={(e) =>
                                  handleItemQtyChange(
                                    item.grn_item_id,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-32 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formItemRows.filter((r) => r.selected).length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Material Issue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MATERIAL ISSUE MODAL
          ========================================================================= */}
      {viewIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-slate-800 font-mono">
                      {viewIssue.issue_no || viewIssue.uuid.substring(0, 8)}
                    </h3>
                    {statusBadge(viewIssue.status)}
                  </div>
                  <p className="text-[12.5px] text-slate-500 font-medium">
                    Purpose: {viewIssue.purpose}
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
                  onClick={() => setViewIssue(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    GRN Number
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5 font-mono">
                    {viewIssue.grn?.code || "GRN"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Project
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5 truncate">
                    {viewIssue.grn?.project?.name || "N/A"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Issue Date
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5">
                    {viewIssue.date ? viewIssue.date.split("T")[0] : "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Issued By
                  </span>
                  <p className="text-[13px] font-bold text-slate-800 mt-0.5">
                    {viewIssue.issuedBy?.name || "Admin"}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                  Issued Materials Breakdown
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="px-3.5 py-2.5">Item Description</th>
                        <th className="px-3.5 py-2.5 w-24 text-center">Unit</th>
                        <th className="px-3.5 py-2.5 w-32 text-right">Quantity Issued</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {viewIssue.items && viewIssue.items.length > 0 ? (
                        viewIssue.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5">
                              <span className="font-medium text-slate-800">
                                {it.grnItem?.item_name || "Material Item"}
                              </span>
                              {it.grnItem?.item_code && (
                                <span className="text-[11px] text-slate-400 font-mono ml-2">
                                  ({it.grnItem.item_code})
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">
                              {it.grnItem?.unit || "Unit"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                              {it.quantity}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                            No line item details found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {viewIssue.notes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-600">
                  <span className="font-bold text-slate-700">Remarks: </span>
                  <span>{viewIssue.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CANCEL CONFIRMATION MODAL
          ========================================================================= */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                Cancel Material Issue
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to cancel material issue{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{cancelTarget.issue_no || cancelTarget.uuid.substring(0, 8)}
              </span>
              ? The issue status will be updated to{" "}
              <span className="font-semibold text-rose-600">Cancelled</span>.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
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
                Delete Material Issue
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete material issue{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{deleteTarget.issue_no || deleteTarget.uuid.substring(0, 8)}
              </span>
              ? It will be soft-deleted and moved to the{" "}
              <span className="font-semibold text-rose-600">Deleted / Trash</span> tab.
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
                <span>Delete Issue</span>
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
                Restore Material Issue
              </h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              Restore material issue{" "}
              <span className="font-bold text-slate-800 font-mono">
                #{restoreTarget.issue_no || restoreTarget.uuid.substring(0, 8)}
              </span>{" "}
              back to the Active list?
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
                <span>Restore Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
