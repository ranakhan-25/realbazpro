"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, Download, RotateCcw, Check } from "lucide-react";

export interface ColumnDefinition {
  key: string;
  label: string;
  visible: boolean;
}

interface LamsTableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  entriesPerPage: number;
  onEntriesPerPageChange: (entries: number) => void;
  columns?: ColumnDefinition[];
  onToggleColumn?: (key: string) => void;
  onExportCSV?: () => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function LamsTableToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search records...",
  entriesPerPage,
  onEntriesPerPageChange,
  columns,
  onToggleColumn,
  onExportCSV,
  onResetFilters,
  hasActiveFilters,
}: LamsTableToolbarProps) {
  const [showColumnChooser, setShowColumnChooser] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
      {/* Left: Entries per page & Reset */}
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => onEntriesPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        {hasActiveFilters && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Right: Search + Column Chooser + Export */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Column Chooser Popover */}
        {columns && onToggleColumn && (
          <div className="relative">
            <button
              onClick={() => setShowColumnChooser(!showColumnChooser)}
              title="Customize columns"
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showColumnChooser && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnChooser(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Toggle Columns
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {columns.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => onToggleColumn(col.key)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
                      >
                        <span>{col.label}</span>
                        {col.visible && (
                          <Check className="w-3.5 h-3.5 text-cyan-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Export CSV button */}
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            title="Export CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
}
