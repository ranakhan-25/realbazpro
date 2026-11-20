"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PackageSearch, AlertCircle, RefreshCw } from "lucide-react";

import ProcurementStats from "./ProcurementStats";
import ProcurementFilters from "./ProcurementFilters";
import OverflowMaterialTable from "./OverflowMaterialTable";
import PendingVoucherList from "./PendingVoucherList";

import {
  procurementDashboardApi,
  ProcurementDashboardData,
  ProcurementDashboardPeriod,
} from "@/lib/procurement";

export default function ProcurementDashboard() {
  const [period, setPeriod] = useState<ProcurementDashboardPeriod>("monthly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<ProcurementDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Request race-condition guard
  const activeRequestId = useRef(0);

  const fetchDashboard = useCallback(
    async (
      selectedPeriod: ProcurementDashboardPeriod,
      start?: string,
      end?: string,
      searchQuery?: string
    ) => {
      const requestId = ++activeRequestId.current;
      setIsLoading(true);
      setError(null);

      try {
        const result = await procurementDashboardApi.getDashboard({
          period: start || end ? undefined : selectedPeriod,
          startDate: start || undefined,
          endDate: end || undefined,
          search: searchQuery || undefined,
        });

        if (requestId === activeRequestId.current) {
          setData(result);
        }
      } catch (err: unknown) {
        if (requestId === activeRequestId.current) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            (err as Error)?.message ||
            "Failed to load procurement dashboard data";
          setError(message);
        }
      } finally {
        if (requestId === activeRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Initial and reactive fetch on period/custom date changes
  useEffect(() => {
    fetchDashboard(period, startDate, endDate, search);
  }, [fetchDashboard, period, startDate, endDate]);

  // Debounced search for pending vouchers
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchDashboard(period, startDate, endDate, val);
    }, 400);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = () => {
    fetchDashboard(period, startDate, endDate, search);
  };

  const handleExport = () => {
    if (!data) return;

    const rows = [
      ["Procurement Dashboard Summary"],
      ["Period", data.period],
      [
        "Date Range",
        data.dateRange
          ? `${data.dateRange.start} to ${data.dateRange.end}`
          : "All Time",
      ],
      [],
      ["Procurement Metrics", "Count", "Previous Count", "Change %"],
      [
        "Pending Requisition",
        data.metrics.pendingRequisition.count,
        data.metrics.pendingRequisition.previousCount,
        data.metrics.pendingRequisition.changePercent ?? "N/A",
      ],
      [
        "Requisition",
        data.metrics.requisition.count,
        data.metrics.requisition.previousCount,
        data.metrics.requisition.changePercent ?? "N/A",
      ],
      [
        "Pending Purchase Order",
        data.metrics.pendingPurchaseOrder.count,
        data.metrics.pendingPurchaseOrder.previousCount,
        data.metrics.pendingPurchaseOrder.changePercent ?? "N/A",
      ],
      [
        "Purchase Order",
        data.metrics.purchaseOrder.count,
        data.metrics.purchaseOrder.previousCount,
        data.metrics.purchaseOrder.changePercent ?? "N/A",
      ],
      [
        "Pending GRN",
        data.metrics.pendingGrn.count,
        data.metrics.pendingGrn.previousCount,
        data.metrics.pendingGrn.changePercent ?? "N/A",
      ],
      [
        "Pending Purchase Bill",
        data.metrics.pendingPurchaseBill.count,
        data.metrics.pendingPurchaseBill.previousCount,
        data.metrics.pendingPurchaseBill.changePercent ?? "N/A",
      ],
      [],
      ["Overflow Materials"],
      [
        "SL",
        "Item Code",
        "Description",
        "Requisition",
        "Budget Qty",
        "Budget Amount",
        "Issue Qty",
        "Issue Amount",
        "Status",
      ],
      ...(data.overflowMaterial || []).map((m, i) => [
        i + 1,
        m.itemCode,
        `"${(m.description || "").replace(/"/g, '""')}"`,
        m.requisition?.code || "",
        m.budgetQty,
        m.budgetAmount,
        m.issueQty,
        m.issueAmount,
        m.status,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `procurement_dashboard_${data.period}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors duration-200 dark:bg-slate-950 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <PackageSearch size={32} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                Procurement Dashboard
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage requisition, purchase orders, material overflow, and pending bills
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert with Retry */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold">Error Loading Dashboard</p>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <ProcurementFilters
          period={period}
          setPeriod={setPeriod}
          dateRange={data?.dateRange ?? null}
          startDate={startDate}
          endDate={endDate}
          onCustomDateChange={handleCustomDateChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {/* KPI Stats */}
        <ProcurementStats
          metrics={data?.metrics ?? null}
          isLoading={isLoading}
        />

        {/* Main Content: Overflow Materials & Pending Vouchers */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(350px,1fr)]">
          <div>
            <OverflowMaterialTable
              materials={data?.overflowMaterial || []}
              isLoading={isLoading}
            />
          </div>

          <div>
            <PendingVoucherList
              vouchers={data?.pendingVouchers ?? null}
              isLoading={isLoading}
              search={search}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
    </main>
  );
}