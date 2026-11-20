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
  ChevronUp,
  FileSpreadsheet,
  FileText,
  ListFilter,
  Search,
  Calendar,
  ChevronRight,
  Home,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  procurementGrnVsInvoiceApi,
  type GrnVsInvoiceDropdownsData,
  type GrnVsInvoiceRow,
  type GrnVsInvoiceTotals,
} from "@/lib/procurement";

const numberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function GrnVsInvoiceReportPage() {
  // Dropdowns data from API
  const [dropdowns, setDropdowns] = useState<GrnVsInvoiceDropdownsData>({
    bills: [],
    grns: [],
    categories: [],
    items: [],
    suppliers: [],
    projects: [],
    projectTypes: [],
  });
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Filter States
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination & Sorting States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof GrnVsInvoiceRow>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Report Data States
  const [rows, setRows] = useState<GrnVsInvoiceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState<GrnVsInvoiceTotals>({
    grn_qty: 0,
    already_bill_qty: 0,
    grn_total: 0,
    bill_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll detection for sticky header shadow
  const [isScrolled, setIsScrolled] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 0);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Dropdown Options on initial mount
  useEffect(() => {
    let isMounted = true;
    async function loadDropdowns() {
      try {
        setDropdownsLoading(true);
        const data = await procurementGrnVsInvoiceApi.getDropdowns();
        if (isMounted && data) {
          setDropdowns({
            bills: data.bills || [],
            grns: data.grns || [],
            categories: data.categories || [],
            items: data.items || [],
            suppliers: data.suppliers || [],
            projects: data.projects || [],
            projectTypes: data.projectTypes || [],
          });
        }
      } catch (err: unknown) {
        console.error("Failed to load filter dropdowns:", err);
      } finally {
        if (isMounted) setDropdownsLoading(false);
      }
    }
    loadDropdowns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items by category if selected
  const availableItems = useMemo(() => {
    if (!selectedCategoryId) return dropdowns.items;
    return dropdowns.items.filter(
      (item) => item.category_id === selectedCategoryId,
    );
  }, [dropdowns.items, selectedCategoryId]);

  // Fetch Report Data from API
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        bill_id: selectedBillId || undefined,
        category_id: selectedCategoryId || undefined,
        item_id: selectedItemId || undefined,
        supplier_id: selectedSupplierId || undefined,
        project_id: selectedProjectId || undefined,
        search: debouncedSearch.trim() || undefined,
        page: currentPage,
        limit: entriesPerPage,
      };

      const result = await procurementGrnVsInvoiceApi.getReport(params);

      setRows(result.data || []);
      setTotalCount(result.total || 0);
      setTotalPages(result.totalPages || 1);
      setTotals(
        result.totals || {
          grn_qty: 0,
          already_bill_qty: 0,
          grn_total: 0,
          bill_total: 0,
        },
      );
    } catch (err: unknown) {
      console.error("Failed to fetch GRN vs Invoice report:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load report data from server.";
      setError(msg);
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    dateFrom,
    dateTo,
    selectedBillId,
    selectedCategoryId,
    selectedItemId,
    selectedSupplierId,
    selectedProjectId,
    debouncedSearch,
    currentPage,
    entriesPerPage,
  ]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Sort
  const handleSort = (key: keyof GrnVsInvoiceRow) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Sort rows locally if needed
  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();
      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortKey, sortDirection]);

  // Handle Reset Filters
  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedBillId("");
    setSelectedCategoryId("");
    setSelectedItemId("");
    setSelectedSupplierId("");
    setSelectedProjectId("");
    setSearch("");
    setCurrentPage(1);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (rows.length === 0) {
      alert("No report data available to export.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "PO No",
      "GRN No",
      "Bill No",
      "Supplier Name",
      "Item Name",
      "GRN Qty",
      "Already Bill Qty",
      "GRN Total",
      "Bill Total",
    ];

    const csvRows = [
      headers.join(","),
      ...sortedRows.map((r) =>
        [
          r.id,
          `"${r.date || ""}"`,
          `"${r.purchase_order_no || ""}"`,
          `"${r.grn_no || ""}"`,
          `"${r.bill_no || ""}"`,
          `"${(r.supplier?.supplierName || "").replace(/"/g, '""')}"`,
          `"${(r.item_name || "").replace(/"/g, '""')}"`,
          r.grn_qty,
          r.already_bill_qty,
          r.grn_total,
          r.bill_total,
        ].join(","),
      ),
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "Summary Total",
        totals.grn_qty,
        totals.already_bill_qty,
        totals.grn_total,
        totals.bill_total,
      ].join(","),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `GRN_vs_Invoice_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startIdx = (currentPage - 1) * entriesPerPage;

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#111827] dark:text-slate-100 transition-colors">
      {/* Page Container: 24px desktop / 16px mobile padding, 112px bottom padding for floating widget */}
      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 pb-28 sm:pb-32 space-y-5">
        {/* ========================================================= */}
        {/* Breadcrumb & Page Header */}
        {/* ========================================================= */}
        <div className="space-y-1">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 hover:text-[#6D4AFF] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <Link
              href="/dashboard/procurement"
              className="hover:text-[#6D4AFF] transition-colors"
            >
              Procurement
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="font-medium text-[#111827] dark:text-slate-200">
              GRN vs Invoice Report
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div>
              <h1 className="text-[22px] font-semibold text-[#111827] dark:text-white tracking-[-0.01em]">
                GRN vs Invoice Report
              </h1>
              <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                Reconcile Goods Receipt Notes with billed vendor invoices and
                track billing variances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                title="Refresh report data"
                className="h-9 px-3 rounded-lg text-[13px] font-medium border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-200 hover:bg-[#F9FAFB] dark:hover:bg-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Filter Card: Responsive Grid (1 col mobile, 2 tablet, 4 desktop) */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-[12px] border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 sm:p-5 space-y-3.5">
          {/* Row 1: Date Range, GRN/Bill, Category, Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date Range: From / To */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    title="From Date"
                    aria-label="From Date"
                    className="w-full h-9 px-2 text-[12px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    title="To Date"
                    aria-label="To Date"
                    className="w-full h-9 px-2 text-[12px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Invoice / GRN Filter */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Invoice / Bill
              </label>
              <div className="relative">
                <select
                  value={selectedBillId}
                  onChange={(e) => {
                    setSelectedBillId(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={dropdownsLoading}
                  className="w-full h-9 appearance-none pl-3 pr-8 text-[13px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Invoices / Bills</option>
                  {dropdowns.bills.map((b) => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.code} {b.date ? `(${b.date})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedItemId("");
                    setCurrentPage(1);
                  }}
                  disabled={dropdownsLoading}
                  className="w-full h-9 appearance-none pl-3 pr-8 text-[13px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Categories</option>
                  {dropdowns.categories.map((c) => (
                    <option key={c.uuid} value={c.uuid}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Item Dropdown */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Select Item
              </label>
              <div className="relative">
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={dropdownsLoading}
                  className="w-full h-9 appearance-none pl-3 pr-8 text-[13px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Items</option>
                  {availableItems.map((item) => (
                    <option key={item.uuid} value={item.uuid}>
                      {item.name} ({item.item_code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Supplier, Project, and Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Supplier Dropdown */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Supplier
              </label>
              <div className="relative">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={dropdownsLoading}
                  className="w-full h-9 appearance-none pl-3 pr-8 text-[13px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Suppliers</option>
                  {dropdowns.suppliers.map((s) => (
                    <option key={s.uuid} value={s.uuid}>
                      {s.supplierName} ({s.supplierCode || "SUP"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Project Dropdown */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1.5">
                Project
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={dropdownsLoading}
                  className="w-full h-9 appearance-none pl-3 pr-8 text-[13px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Projects</option>
                  {dropdowns.projects.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name} ({p.code || "PRJ"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block" />

            {/* Action Buttons: Excel, PDF, Reset */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading || rows.length === 0}
                className="h-9 px-3.5 rounded-lg text-[13px] font-medium text-white bg-[#039855] hover:bg-[#027A48] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 stroke-[2]" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                disabled={loading || rows.length === 0}
                className="h-9 px-3.5 rounded-lg text-[13px] font-medium text-white bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4 stroke-[2]" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset filters"
                aria-label="Reset filters"
                className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6B7280] hover:text-[#111827] dark:hover:text-slate-200 hover:bg-[#F9FAFB] dark:hover:bg-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="bg-[#FEF3F2] dark:bg-rose-950/40 border border-[#FECDCA] dark:border-rose-900 rounded-[12px] p-4 flex items-center justify-between text-[#B42318] dark:text-rose-300 text-xs sm:text-[13px]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchReport}
              className="font-semibold underline hover:no-underline ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* Table Card per Linear/Stripe Enterprise Spec */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-[12px] border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {/* Top Bar: 56px, entries selector & search */}
          <div className="h-14 px-4 border-b border-[#F1F2F4] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-slate-400">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg px-2.5 text-[13px] text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] cursor-pointer"
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
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[#6B7280] dark:text-slate-400 hidden sm:inline">
                Search:
              </span>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search item, GRN, supplier..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg pl-9 pr-3 text-[13px] text-[#111827] dark:text-slate-200 placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition-colors"
                />
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Inner Scroll Wrapper: handles all horizontal scroll */}
          <div
            ref={tableContainerRef}
            className="w-full overflow-x-auto max-h-[660px] relative scrollbar-thin"
          >
            <table className="w-full border-collapse min-w-[1240px] text-left">
              {/* Sticky Lavender Table Header */}
              <thead
                className={`sticky top-0 z-10 transition-shadow duration-140 ${
                  isScrolled
                    ? "shadow-[0_4px_8px_-4px_rgba(46,26,135,0.18)]"
                    : ""
                }`}
              >
                <tr className="h-[46px] bg-[#E9E5FF] dark:bg-indigo-950/80 border-b-2 border-[#C9BFFF] dark:border-indigo-900">
                  {/* ID */}
                  <th
                    scope="col"
                    style={{ minWidth: "70px" }}
                    onClick={() => handleSort("id")}
                    className={`h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-center select-none cursor-pointer hover:bg-[#DFD9FF] dark:hover:bg-indigo-900/60 rounded-tl-[12px] transition-colors ${
                      sortKey === "id"
                        ? "bg-[#D2C9FF] text-[#3B1FA8] border-b-[3px] border-[#6D4AFF]"
                        : "text-[#2E1A87]"
                    }`}
                  >
                    <div className="inline-flex items-center justify-center gap-1 w-full">
                      <span>ID</span>
                      {sortKey === "id" ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        )
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#7C6BD6] opacity-70" />
                      )}
                    </div>
                  </th>

                  {/* DATE */}
                  <th
                    scope="col"
                    style={{ minWidth: "115px" }}
                    onClick={() => handleSort("date")}
                    className={`h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left select-none cursor-pointer hover:bg-[#DFD9FF] dark:hover:bg-indigo-900/60 transition-colors ${
                      sortKey === "date"
                        ? "bg-[#D2C9FF] text-[#3B1FA8] border-b-[3px] border-[#6D4AFF]"
                        : "text-[#2E1A87]"
                    }`}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>DATE</span>
                      {sortKey === "date" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        ))}
                    </div>
                  </th>

                  {/* PO NO */}
                  <th
                    scope="col"
                    style={{ minWidth: "125px" }}
                    onClick={() => handleSort("purchase_order_no")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    PO NO
                  </th>

                  {/* GRN NO */}
                  <th
                    scope="col"
                    style={{ minWidth: "125px" }}
                    onClick={() => handleSort("grn_no")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    GRN NO
                  </th>

                  {/* BILL NO */}
                  <th
                    scope="col"
                    style={{ minWidth: "135px" }}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left text-[#2E1A87] select-none cursor-default"
                  >
                    BILL NO
                  </th>

                  {/* SUPPLIER NAME */}
                  <th
                    scope="col"
                    style={{ minWidth: "220px" }}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left text-[#2E1A87] select-none cursor-default"
                  >
                    SUPPLIER NAME
                  </th>

                  {/* ITEM NAME */}
                  <th
                    scope="col"
                    style={{ minWidth: "200px" }}
                    onClick={() => handleSort("item_name")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-left text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    ITEM NAME
                  </th>

                  {/* GRN QTY */}
                  <th
                    scope="col"
                    style={{ minWidth: "110px" }}
                    onClick={() => handleSort("grn_qty")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-right text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    GRN QTY
                  </th>

                  {/* ALREADY BILL QTY */}
                  <th
                    scope="col"
                    style={{ minWidth: "140px" }}
                    onClick={() => handleSort("already_bill_qty")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-right text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    ALREADY BILL QTY
                  </th>

                  {/* GRN TOTAL */}
                  <th
                    scope="col"
                    style={{ minWidth: "130px" }}
                    onClick={() => handleSort("grn_total")}
                    className="h-[46px] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-right text-[#2E1A87] select-none cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    GRN TOTAL
                  </th>

                  {/* BILL TOTAL */}
                  <th
                    scope="col"
                    style={{ minWidth: "130px" }}
                    onClick={() => handleSort("bill_total")}
                    className="h-[46px] px-3.5 pr-4 text-[11.5px] font-bold uppercase tracking-[0.06em] text-right text-[#2E1A87] select-none rounded-tr-[12px] cursor-pointer hover:bg-[#DFD9FF]"
                  >
                    BILL TOTAL
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800 text-[13px]">
                {loading ? (
                  // Skeleton Rows while loading
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="h-11 animate-pulse">
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="h-4 w-6 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                      </td>
                      <td className="px-3.5 py-2.5 pr-4 text-right">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : sortedRows.length > 0 ? (
                  sortedRows.map((row) => {
                    const hasDiscrepancy =
                      row.already_bill_qty < row.grn_qty ||
                      row.bill_total < row.grn_total;

                    return (
                      <tr
                        key={row.id}
                        className="h-11 hover:bg-[#FAFAFF] dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        {/* ID */}
                        <td className="px-3.5 py-2 text-center font-sans tabular-nums text-[#6B7280] dark:text-slate-400 font-medium">
                          {row.id}
                        </td>

                        {/* Date */}
                        <td className="px-3.5 py-2 font-sans tabular-nums text-[#374151] dark:text-slate-300 whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* PO No */}
                        <td className="px-3.5 py-2 font-sans tabular-nums font-medium text-[#111827] dark:text-slate-100 whitespace-nowrap">
                          {row.purchase_order_no || "—"}
                        </td>

                        {/* GRN No */}
                        <td className="px-3.5 py-2 font-sans tabular-nums font-medium text-[#111827] dark:text-slate-100 whitespace-nowrap">
                          {row.grn_no}
                        </td>

                        {/* Bill No */}
                        <td className="px-3.5 py-2 whitespace-nowrap font-sans tabular-nums">
                          {row.bill_no ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#ECFDF3] dark:bg-emerald-950/50 text-[#027A48] dark:text-emerald-300 text-[11px] font-medium border border-[#A6F4C5] dark:border-emerald-800">
                              {row.bill_no}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] dark:text-slate-600">
                              —
                            </span>
                          )}
                        </td>

                        {/* Supplier Name */}
                        <td
                          className="px-3.5 py-2 text-[#374151] dark:text-slate-300 truncate max-w-[240px]"
                          title={row.supplier?.supplierName || "—"}
                        >
                          {row.supplier?.supplierName
                            ? row.supplier.supplierName.replace(/__.*$/, "")
                            : "—"}
                        </td>

                        {/* Item Name */}
                        <td
                          className="px-3.5 py-2 font-medium text-[#111827] dark:text-slate-100 truncate max-w-[220px]"
                          title={row.item_name}
                        >
                          {row.item_name}
                        </td>

                        {/* GRN Qty */}
                        <td className="px-3.5 py-2 text-right font-sans tabular-nums text-[#111827] dark:text-slate-100 font-medium">
                          {numberFormat.format(row.grn_qty)}
                        </td>

                        {/* Already Bill Qty */}
                        <td className="px-3.5 py-2 text-right font-sans tabular-nums">
                          <span
                            className={
                              hasDiscrepancy
                                ? "text-[#B54708] font-medium"
                                : "text-[#6B7280] dark:text-slate-400"
                            }
                          >
                            {numberFormat.format(row.already_bill_qty)}
                          </span>
                        </td>

                        {/* GRN Total */}
                        <td className="px-3.5 py-2 text-right font-sans tabular-nums font-semibold text-[#111827] dark:text-slate-100">
                          {currencyFormat.format(row.grn_total)}
                        </td>

                        {/* Bill Total */}
                        <td className="px-3.5 py-2 pr-4 text-right font-sans tabular-nums text-[#374151] dark:text-slate-300">
                          <span
                            className={
                              hasDiscrepancy
                                ? "text-[#B42318] font-medium"
                                : "text-[#374151] dark:text-slate-300"
                            }
                          >
                            {currencyFormat.format(row.bill_total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Empty State
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#F4F1FF] text-[#6D4AFF]">
                          <ListFilter className="w-5 h-5 stroke-[2]" />
                        </div>
                        <p className="text-[14px] font-semibold text-[#111827] dark:text-slate-200">
                          No matching report records found
                        </p>
                        <p className="text-[13px] text-[#6B7280] dark:text-slate-400 max-w-sm">
                          Try adjusting your date range, invoice, supplier, item
                          filter, or search query.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-semibold text-[#6D4AFF] hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Table Footer Summary Row */}
              {!loading && sortedRows.length > 0 && (
                <tfoot>
                  <tr className="h-12 bg-[#FAFAFF] dark:bg-slate-800/60 border-t-2 border-[#C9BFFF] dark:border-indigo-900 font-semibold text-[13px] text-[#111827] dark:text-slate-100">
                    <td
                      className="px-3.5 py-2 text-right font-bold text-[#2E1A87] dark:text-indigo-200 uppercase tracking-wide text-xs"
                      colSpan={7}
                    >
                      Summary Total:
                    </td>
                    <td className="px-3.5 py-2 text-right font-sans tabular-nums text-[#6D4AFF] font-bold">
                      {numberFormat.format(totals.grn_qty)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-sans tabular-nums font-bold">
                      {numberFormat.format(totals.already_bill_qty)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-sans tabular-nums text-[#6D4AFF] font-bold">
                      {currencyFormat.format(totals.grn_total)}
                    </td>
                    <td className="px-3.5 py-2 pr-4 text-right font-sans tabular-nums font-bold">
                      {currencyFormat.format(totals.bill_total)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ========================================================= */}
          {/* Pagination Footer: 56px, range text + page buttons */}
          {/* ========================================================= */}
          <div className="h-14 px-4 border-t border-[#F1F2F4] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-[#6B7280] dark:text-slate-400">
              Showing {totalCount === 0 ? 0 : startIdx + 1} to{" "}
              {Math.min(startIdx + entriesPerPage, totalCount)} of {totalCount}{" "}
              entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg text-xs font-medium text-[#374151] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      page === currentPage
                        ? "bg-[#6D4AFF] text-white shadow-xs font-semibold"
                        : "text-[#374151] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F4F1FF] hover:text-[#4F32C7] hover:border-[#DDD6FE]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-8 px-3 rounded-lg text-xs font-medium text-[#374151] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Brand Footer: 100% RealBiz Pro */}
        {/* ========================================================= */}
        <footer className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#E5E7EB] dark:border-slate-800 text-xs text-[#6B7280] dark:text-slate-400">
          <span>2026 © RealBiz Pro</span>
          <span>Design &amp; Developed by RealBiz Pro</span>
        </footer>
      </div>
    </div>
  );
}
