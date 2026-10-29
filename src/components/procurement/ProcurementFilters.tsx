"use client";

import { useState } from "react";
import { CalendarDays, Download, RefreshCw, X } from "lucide-react";
import {
  ProcurementDashboardPeriod,
  DashboardDateRange,
} from "@/lib/procurement";

interface Props {
  period: ProcurementDashboardPeriod;
  setPeriod: (period: ProcurementDashboardPeriod) => void;
  dateRange: DashboardDateRange | null;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

const periods: { label: string; value: ProcurementDashboardPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All", value: "all" },
];

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ProcurementFilters({
  period,
  setPeriod,
  dateRange,
  startDate,
  endDate,
  onCustomDateChange,
  isLoading,
  onRefresh,
  onExport,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || "");
  const [customEnd, setCustomEnd] = useState(endDate || "");

  const handleApplyCustomDate = () => {
    if (onCustomDateChange && customStart && customEnd) {
      onCustomDateChange(customStart, customEnd);
      setShowDatePicker(false);
    }
  };

  const handleResetCustomDate = () => {
    setCustomStart("");
    setCustomEnd("");
    if (onCustomDateChange) {
      onCustomDateChange("", "");
    }
    setShowDatePicker(false);
  };

  const formattedRange = dateRange
    ? `${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`
    : period === "all"
    ? "All Time"
    : "Select Date Range";

  return (
    <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Period Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {periods.map((item) => {
          const isActive = period === item.value && !startDate && !endDate;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setCustomStart("");
                setCustomEnd("");
                if (onCustomDateChange && (startDate || endDate)) {
                  onCustomDateChange("", "");
                }
                setPeriod(item.value);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Badge, Refresh, and Export Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium shadow-sm transition sm:text-sm ${
              startDate || endDate
                ? "border-blue-500 bg-blue-50/50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarDays size={16} className="text-slate-500 dark:text-slate-400" />
            <span>{formattedRange}</span>
          </button>

          {/* Custom Date Range Popover */}
          {showDatePicker && (
            <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custom Date Range
                </span>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetCustomDate}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={!customStart || !customEnd}
                    onClick={handleApplyCustomDate}
                    className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh dashboard data"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-sm"
        >
          <RefreshCw
            size={16}
            className={`text-slate-500 dark:text-slate-400 ${
              isLoading ? "animate-spin text-blue-600" : ""
            }`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          title="Export procurement overview as CSV"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 sm:text-sm"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
