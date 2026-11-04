"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
} from "lucide-react";

export interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: string;
  width?: string;
  minWidth?: string;
  align?: "left" | "center" | "right";
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
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  onRefresh,
  isRefreshing = false,
}: CSTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [page, setPage] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollWrapperRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 2);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

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
  const totalPages = Math.max(1, Math.ceil(sorted.length / currentPageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * currentPageSize;
    return sorted.slice(start, start + currentPageSize);
  }, [sorted, page, currentPageSize]);

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

  const isActionCol = (header: string, key?: string) => {
    const h = header.toLowerCase();
    const k = (key || "").toLowerCase();
    return h.includes("action") || h.includes("view") || k.includes("action");
  };

  return (
    <div className="w-full space-y-0 rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden transition-shadow">
      {/* Top Bar Spec: 56px, padding 0 16px, border-bottom #E5E7EB */}
      <div className="flex h-14 min-h-[56px] items-center justify-between border-b border-[#E5E7EB] px-4 gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <span>Show</span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#111827] outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] shadow-xs hover:bg-[#F9FAFB] hover:text-[#111827] transition active:scale-95 disabled:opacity-50"
              title="Refresh table data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#6D4AFF]" : ""}`} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Control: 36px tall */}
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-[13px] text-[#111827] placeholder-[#9CA3AF] shadow-xs outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
            />
          </div>

          {extraHeaderActions && (
            <div className="flex items-center gap-2">{extraHeaderActions}</div>
          )}
        </div>
      </div>

      {/* Inner Horizontal Scroll Wrapper */}
      <div
        ref={scrollWrapperRef}
        className="relative max-h-[640px] w-full overflow-x-auto overflow-y-auto"
      >
        <table className="w-full min-w-[760px] text-left border-collapse">
          {/* Table Header Spec: Lavender #E9E5FF, 46px height, bottom border 2px #C9BFFF */}
          <thead
            className={`sticky top-0 z-10 h-[46px] bg-[#E9E5FF] border-b-2 border-[#C9BFFF] transition-shadow ${
              isScrolled ? "shadow-[0_4px_8px_-4px_rgba(46,26,135,0.18)]" : ""
            }`}
          >
            <tr>
              {columns.map((col, idx) => {
                const colKey = col.key || col.accessorKey || `col_${idx}`;
                const isAction = isActionCol(col.header, colKey);
                const isSorted = sortKey === colKey;
                const isFirst = idx === 0;
                const isLast = idx === columns.length - 1;

                const alignmentClass =
                  col.align === "right" || isAction
                    ? "text-right justify-end"
                    : col.align === "center"
                    ? "text-center justify-center"
                    : "text-left justify-start";

                const minColWidth = isAction ? col.minWidth || "120px" : col.minWidth || "140px";

                return (
                  <th
                    key={colKey}
                    style={{
                      width: col.width,
                      minWidth: minColWidth,
                    }}
                    onClick={() => col.sortable && handleSort(colKey)}
                    className={`h-[46px] px-4 py-0 text-[11.5px] font-bold uppercase tracking-[0.06em] select-none transition-colors ${
                      isSorted
                        ? "bg-[#D2C9FF] text-[#3B1FA8] shadow-[inset_0_-3px_0_0_#6D4AFF]"
                        : "text-[#2E1A87]"
                    } ${
                      col.sortable
                        ? "cursor-pointer hover:bg-[#DFD9FF]"
                        : "cursor-default"
                    } ${isFirst ? "rounded-tl-[12px]" : ""} ${
                      isLast ? "rounded-tr-[12px] pr-4" : ""
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 ${alignmentClass} leading-none`}>
                      <span className="truncate">{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0 text-[#7C6BD6]">
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5 text-[#6D4AFF] stroke-[2.2]" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-[#6D4AFF] stroke-[2.2]" />
                            )
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 opacity-60 hover:opacity-100 hover:text-[#2E1A87] stroke-[1.75]" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Rows and Cells Spec */}
          <tbody className="divide-y divide-[#F1F2F4] bg-white">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => (
                <tr
                  key={(row as any).id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors duration-140 hover:bg-[#FAFAFF] ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col, cIdx) => {
                    const colKey = col.key || col.accessorKey || `col_${cIdx}`;
                    const renderer = col.render || col.cell;
                    const isSortedCol = sortKey === colKey;
                    const isAction = isActionCol(col.header, colKey);
                    const isLast = cIdx === columns.length - 1;

                    const alignClass =
                      col.align === "right" || isAction
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left";

                    return (
                      <td
                        key={colKey}
                        className={`px-4 py-3 text-[13px] text-[#374151] align-middle ${alignClass} ${
                          isSortedCol ? "bg-[#FCFBFF]" : ""
                        } ${isLast ? "pr-4" : ""}`}
                      >
                        {renderer
                          ? renderer(row, idx)
                          : (
                            <span className="tabular-nums font-sans text-[#374151]">
                              {(row as any)[colKey] !== undefined && (row as any)[colKey] !== null
                                ? String((row as any)[colKey])
                                : "—"}
                            </span>
                          )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center bg-white">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F1FF] text-[#6D4AFF] mb-3">
                      <Inbox className="h-6 w-6 stroke-[1.75]" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#111827]">{emptyTitle}</h4>
                    <p className="mt-1 text-xs text-[#6B7280] max-w-sm">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Spec: 56px, border-top #E5E7EB, range text 13px #6B7280, page button 32px */}
      <div className="flex h-14 min-h-[56px] items-center justify-between border-t border-[#E5E7EB] bg-white px-4">
        <span className="text-[13px] text-[#6B7280]">
          Showing{" "}
          <span className="font-semibold text-[#111827] tabular-nums">
            {sorted.length === 0 ? 0 : (page - 1) * currentPageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-[#111827] tabular-nums">
            {Math.min(page * currentPageSize, sorted.length)}
          </span>{" "}
          of <span className="font-semibold text-[#111827] tabular-nums">{sorted.length}</span> entries
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] shadow-xs hover:bg-[#F9FAFB] hover:text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2.5 text-xs font-semibold text-[#111827] tabular-nums">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] shadow-xs hover:bg-[#F9FAFB] hover:text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
