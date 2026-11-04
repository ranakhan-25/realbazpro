"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Inbox, Eye } from "lucide-react";
import { useTheme } from "@/lib/theme";

export interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
}

export interface CSTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  extraHeaderActions?: React.ReactNode;
  exportFileName?: string;
}

export function CSTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchFields = [],
  onRowClick,
  pageSize = 10,
  emptyTitle = "No records found",
  emptySubtitle = "There are currently no items matching your criteria.",
  extraHeaderActions,
  exportFileName,
}: CSTableProps<T>) {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase().trim();
    return data.filter((row: any) => {
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = row[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      }
      return Object.values(row).some((val) => {
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, query, searchFields]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filtered, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {extraHeaderActions && (
          <div className="flex items-center gap-2">{extraHeaderActions}</div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                {columns.map((col, idx) => {
                  const colKey = col.key || col.accessorKey || `col_${idx}`;
                  return (
                    <th
                      key={colKey}
                      style={{ width: col.width }}
                      onClick={() => col.sortable && handleSort(colKey)}
                      className={`px-4 py-3 ${
                        col.sortable ? "cursor-pointer select-none hover:text-slate-800" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && sortKey === colKey && (
                          sortOrder === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                          )
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? (
                paginated.map((row, idx) => (
                  <tr
                    key={(row as any).id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition hover:bg-slate-50/80 ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col, cIdx) => {
                      const colKey = col.key || col.accessorKey || `col_${cIdx}`;
                      const renderer = col.render || col.cell;
                      return (
                        <td key={colKey} className="px-4 py-3 text-slate-700">
                          {renderer ? renderer(row, idx) : (row as any)[colKey]}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">{emptyTitle}</h4>
                      <p className="mt-1 text-xs text-slate-400 max-w-sm">{emptySubtitle}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sorted.length > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(page * pageSize, sorted.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{sorted.length}</span> results
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-semibold text-slate-700">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
