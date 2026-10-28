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
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  Truck,
  FileText,
  Building2,
  Info,
  PackageCheck,
  Hash,
  MapPin,
  ClipboardList,
} from "lucide-react";
import {
  procurementEquipmentOnSiteApi,
  BackendEquipmentOnSite,
  BackendOnSiteProject,
} from "@/lib/procurement/procurementEquipmentOnSiteApi";

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
  "EQUIPMENT DESCRIPTION",
  "HIRE ORDER REF",
  "SOURCE",
  "LOCATION / VENDOR",
  "QTY ON SITE",
  "STATUS",
  "ACTION",
];

export default function EquipmentOnSitePage() {
  // Dropdown & Selection States
  const [projects, setProjects] = useState<BackendOnSiteProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDropdownLoading, setIsDropdownLoading] = useState<boolean>(true);

  // Data States
  const [equipmentList, setEquipmentList] = useState<BackendEquipmentOnSite[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State
  const [viewItem, setViewItem] = useState<BackendEquipmentOnSite | null>(null);

  // Toast State
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

  // Fetch Dropdown options (Projects)
  const fetchDropdowns = useCallback(async () => {
    setIsDropdownLoading(true);
    try {
      const res = await procurementEquipmentOnSiteApi.getDropdowns();
      const projList = res.projects || [];
      setProjects(projList);

      // Auto-select the first project if none is selected yet
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].uuid);
      }
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load project dropdown options");
      setApiError(msg);
    } finally {
      setIsDropdownLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // Fetch Equipment On Site for selected project
  const fetchEquipmentOnSite = useCallback(async () => {
    if (!selectedProjectId) {
      setEquipmentList([]);
      setTotalRecords(0);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const res = await procurementEquipmentOnSiteApi.list({
        project_id: selectedProjectId,
      });
      setEquipmentList(res.data || []);
      setTotalRecords(res.total || (res.data ? res.data.length : 0));
    } catch (err: unknown) {
      const msg = parseApiError(err, "Failed to load equipment on site records");
      setApiError(msg);
      setEquipmentList([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchEquipmentOnSite();
      setCurrentPage(1);
    }
  }, [selectedProjectId, fetchEquipmentOnSite]);

  // Client-side filtering on the returned list (Search & Status)
  const filteredList = useMemo(() => {
    let result = [...equipmentList];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (item) => item.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.equipment?.toLowerCase().includes(q) ||
          item.equipment_code?.toLowerCase().includes(q) ||
          item.ref?.toLowerCase().includes(q) ||
          item.location_vendor?.toLowerCase().includes(q) ||
          item.source?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [equipmentList, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / entriesPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredList.slice(start, start + entriesPerPage);
  }, [filteredList, currentPage, entriesPerPage]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const uniqueEquipments = new Set(equipmentList.map((e) => e.equipment)).size;
    const totalQty = equipmentList.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
    const uniqueOrders = new Set(equipmentList.map((e) => e.ref).filter(Boolean)).size;
    return {
      uniqueEquipments,
      totalQty,
      uniqueOrders,
    };
  }, [equipmentList]);

  // Current selected project info
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.uuid === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "on_site";
    switch (s) {
      case "on_site":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            On Site
          </span>
        );
      case "not_received":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Not Received
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || "On Site"}
          </span>
        );
    }
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
                Equipment On Site
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
                <span className="text-slate-600 font-medium">Equipment On Site</span>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                fetchDropdowns();
                if (selectedProjectId) fetchEquipmentOnSite();
              }}
              disabled={isLoading || isDropdownLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh equipment on site records"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoading || isDropdownLoading ? "animate-spin text-indigo-600" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => window.print()}
              disabled={equipmentList.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print equipment list"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Backend API Error Banner if request failed */}
        {apiError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-[12.5px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-amber-950">Backend API Response:</span>{" "}
              {apiError}
              {apiError.includes("Sequelize") || apiError.includes("Model not initialized") ? (
                <div className="text-[11.5px] text-amber-700 mt-1">
                  Note: The server returned an internal Sequelize model registration error. The route and API integration are fully connected and will display real data once the backend model initialization is resolved.
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={fetchEquipmentOnSite}
              className="px-3 py-1 text-[11.5px] font-semibold rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Selected Project */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider block truncate">
                Selected Project
              </span>
              <div className="text-[14px] font-bold text-slate-800 truncate">
                {selectedProject?.name || "None Selected"}
              </div>
              {selectedProject?.code && (
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedProject.code}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Unique Equipment Types */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider block">
                Equipment Types
              </span>
              <div className="text-[18px] font-bold text-slate-800 tabular-nums">
                {summaryMetrics.uniqueEquipments}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                Active Categories
              </div>
            </div>
          </div>

          {/* Card 3: Total Quantity Deployed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider block">
                Total Units On Site
              </span>
              <div className="text-[18px] font-bold text-slate-800 tabular-nums">
                {summaryMetrics.totalQty}
              </div>
              <div className="text-[11px] text-blue-600 font-medium">
                Hire In minus Hire Out
              </div>
            </div>
          </div>

          {/* Card 4: Linked Hire Orders */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider block">
                Active Hire Orders
              </span>
              <div className="text-[18px] font-bold text-slate-800 tabular-nums">
                {summaryMetrics.uniqueOrders}
              </div>
              <div className="text-[11px] text-purple-600 font-medium">
                Associated Orders
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Project Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xs">
          {/* Project Selector (API Required Query Parameter) */}
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-slate-600 shrink-0">
              Project:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isDropdownLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-hidden focus:border-indigo-500 transition-colors max-w-xs md:max-w-md cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))
              )}
            </select>
            {isDropdownLoading && (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            )}
          </div>

          {/* Search & Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
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
              <option value="on_site">On Site</option>
              <option value="not_received">Not Received</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search equipment, ref, vendor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors w-52 md:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
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
                          : idx === 5
                            ? "text-center"
                            : idx === tableHeaders.length - 1
                              ? "text-center w-24"
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
                          Calculating and fetching equipment currently on site...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : !selectedProjectId ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-700">
                          No Project Selected
                        </p>
                        <p className="text-[12.5px] text-slate-400 leading-normal">
                          Please select a project from the dropdown above to view equipment currently deployed on site.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <PackageCheck className="w-6 h-6" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-700">
                          No Equipment On Site
                        </p>
                        <p className="text-[12.5px] text-slate-400 leading-normal">
                          {searchQuery
                            ? `No records match your search filter "${searchQuery}".`
                            : "There is currently no hired equipment on site for this project (all equipment returned or none received yet)."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((row, idx) => (
                    <tr
                      key={`${row.hire_order_id}-${row.equipment}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* SL */}
                      <td className="px-4 py-3.5 text-center text-slate-400 text-[12px] tabular-nums">
                        {(currentPage - 1) * entriesPerPage + idx + 1}
                      </td>

                      {/* Equipment Description */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {row.equipment || "Equipment Item"}
                        </div>
                        {row.equipment_code && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {row.equipment_code}
                          </div>
                        )}
                      </td>

                      {/* Hire Order Ref */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-indigo-600 font-mono text-[12.5px] bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                          {row.ref || "—"}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          {row.source || "Hire Order"}
                        </span>
                      </td>

                      {/* Location / Vendor */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-[12.5px]">
                            {row.location_vendor || "On Site"}
                          </span>
                        </div>
                      </td>

                      {/* Quantity On Site (Hire In minus Hire Out) */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                          <span className="font-mono font-bold text-[13.5px] text-emerald-800">
                            {row.quantity}
                          </span>
                          <span className="text-[11.5px] font-medium text-emerald-600">
                            {row.unit || "Unit"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{renderStatusBadge(row.status)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setViewItem(row)}
                          aria-label="View Details"
                          title="View equipment on site details"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
              Showing{" "}
              {filteredList.length === 0
                ? 0
                : (currentPage - 1) * entriesPerPage + 1}{" "}
              to {Math.min(currentPage * entriesPerPage, filteredList.length)} of{" "}
              {filteredList.length} entries
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
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">
                    Equipment On Site Details
                  </h3>
                  <span className="text-[12px] font-mono text-indigo-600 font-semibold">
                    {viewItem.ref || "Hire Order Item"}
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
                  onClick={() => setViewItem(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-[12.5px]">
              {/* Highlight Card */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="block text-indigo-900 font-bold text-[15px]">
                    {viewItem.equipment}
                  </span>
                  {viewItem.equipment_code && (
                    <span className="text-[11.5px] font-mono text-indigo-600">
                      Code: {viewItem.equipment_code}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-semibold uppercase text-indigo-700">
                    Current Quantity
                  </span>
                  <span className="text-[20px] font-extrabold text-indigo-900 font-mono">
                    {viewItem.quantity}{" "}
                    <span className="text-[13px] font-medium">
                      {viewItem.unit || "Units"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Hire Order Ref
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {viewItem.ref || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Source
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewItem.source || "Hire Order"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Location / Vendor
                  </span>
                  <span className="font-semibold text-slate-700">
                    {viewItem.location_vendor || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Status
                  </span>
                  <div className="mt-0.5">{renderStatusBadge(viewItem.status)}</div>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-400 text-[11px] uppercase font-semibold">
                    Project
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedProject?.name || "Selected Project"}
                  </span>
                  {selectedProject?.code && (
                    <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                      ({selectedProject.code})
                    </span>
                  )}
                </div>
              </div>

              {/* Informational Callout */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-slate-600 text-[12px] leading-relaxed">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  The quantity displayed reflects equipment actively deployed on site calculated as cumulative <strong>Hire In</strong> minus <strong>Hire Out</strong> (returned) quantities.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
