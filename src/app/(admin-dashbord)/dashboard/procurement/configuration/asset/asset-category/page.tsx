"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  SquarePen,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  X,
  RefreshCw,
  FolderTree,
} from "lucide-react";

// ==========================================
// Types
// ==========================================
export interface AssetCategoryItem {
  id: string;
  sl: number;
  type: string;
  code: string;
  name: string;
}

// ==========================================
// Initial Sample Asset Categories
// ==========================================
const INITIAL_ASSET_CATEGORIES: AssetCategoryItem[] = [
  { id: "ac-1", sl: 1, type: "Asset", code: "C1704062", name: "Heavy Equipment & Machinery" },
  { id: "ac-2", sl: 2, type: "Asset", code: "C1704063", name: "Generators & Power Units" },
  { id: "ac-3", sl: 3, type: "Asset", code: "C1704064", name: "Vehicles & Site Transport" },
  { id: "ac-4", sl: 4, type: "Asset", code: "C1704065", name: "Surveying & Leveling Instruments" },
  { id: "ac-5", sl: 5, type: "Asset", code: "C1704066", name: "Power Tools & Cutting Units" },
  { id: "ac-6", sl: 6, type: "Asset", code: "C1704067", name: "Scaffolding & Temporary Structures" },
  { id: "ac-7", sl: 7, type: "Asset", code: "C1704068", name: "Office IT & Computer Equipment" },
  { id: "ac-8", sl: 8, type: "Asset", code: "C1704069", name: "Site Office Furniture & Fixtures" },
  { id: "ac-9", sl: 9, type: "Asset", code: "C1704070", name: "Safety & Emergency Equipment" },
  { id: "ac-10", sl: 10, type: "Asset", code: "C1704071", name: "Testing & Laboratory Apparatus" },
];

export default function AssetCategoryPage() {
  const router = useRouter();

  // Storage key
  const STORAGE_KEY = "realbiz_procurement_asset_categories_v1";

  // Data State
  const [categories, setCategories] = useState<AssetCategoryItem[]>([]);

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<keyof AssetCategoryItem | null>("sl");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Asset");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<AssetCategoryItem | null>(null);

  // Auto-generate code matching image: e.g. C1704062
  const generateCategoryCode = () => {
    return `C${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  // Load Initial Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setCategories(INITIAL_ASSET_CATEGORIES);
  }, []);

  // Save changes to localStorage
  const saveCategories = useCallback((updated: AssetCategoryItem[]) => {
    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Trigger Toast Notification
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setFormCode(generateCategoryCode());
    setFormName("");
    setFormType("Asset");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: AssetCategoryItem) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormCode(item.code || generateCategoryCode());
    setFormName(item.name || "");
    setFormType(item.type || "Asset");
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter category name", "error");
      return;
    }

    if (modalMode === "add") {
      const nextSl = categories.length > 0 ? Math.max(...categories.map((c) => c.sl)) + 1 : 1;
      const newItem: AssetCategoryItem = {
        id: `ac-${Date.now()}`,
        sl: nextSl,
        type: formType || "Asset",
        code: formCode.trim() || generateCategoryCode(),
        name: formName.trim(),
      };

      const updated = [newItem, ...categories].map((item, index) => ({
        ...item,
        sl: index + 1,
      }));
      saveCategories(updated);
      showToast(`Asset category "${newItem.name}" added successfully!`, "success");
    } else if (modalMode === "edit" && selectedId) {
      const updated = categories.map((item) => {
        if (item.id === selectedId) {
          return {
            ...item,
            code: formCode.trim() || item.code,
            name: formName.trim(),
            type: formType || item.type,
          };
        }
        return item;
      });
      saveCategories(updated);
      showToast(`Asset category "${formName}" updated successfully!`, "success");
    }

    setIsModalOpen(false);
  };

  // Delete Category
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const filtered = categories
      .filter((c) => c.id !== deleteTarget.id)
      .map((item, index) => ({
        ...item,
        sl: index + 1,
      }));
    saveCategories(filtered);
    showToast(`Asset category "${deleteTarget.name || `SL #${deleteTarget.sl}`}" removed`, "info");
    setDeleteTarget(null);
  };

  // Clear / Empty table (to replicate Screenshot 1 empty state if desired)
  const handleClearTable = () => {
    if (categories.length === 0) {
      saveCategories(INITIAL_ASSET_CATEGORIES);
      showToast("Restored sample asset categories", "info");
    } else {
      if (confirm("Clear all items to test empty table state?")) {
        saveCategories([]);
        showToast("Table cleared (showing empty state)", "info");
      }
    }
  };

  // Handle Sorting
  const handleSort = (field: keyof AssetCategoryItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...categories];

    // Filter by search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          String(item.sl).includes(q)
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = (valA || "").toString().toLowerCase();
        const strB = (valB || "").toString().toLowerCase();

        if (strA < strB) return sortDirection === "asc" ? -1 : 1;
        if (strA > strB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [categories, search, sortField, sortDirection]);

  // Pagination Logic
  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * entriesPerPage;
  const currentEntries = filteredAndSorted.slice(startIdx, startIdx + entriesPerPage);

  const displayFrom = totalEntries === 0 ? 0 : startIdx + 1;
  const displayTo = Math.min(startIdx + entriesPerPage, totalEntries);

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-400"
                : toast.type === "error"
                ? "bg-rose-500"
                : "bg-indigo-400"
            }`}
          />
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-700 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        
        {/* ========================================================= */}
        {/* TOP BAR: Breadcrumbs + Action Buttons (Matches Screenshot 1) */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[13px] font-normal"
          >
            <Link
              href="/dashboard"
              className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-400 dark:text-slate-600 font-light">›</span>
            
            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
              <span>Billing</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </div>

            <span className="text-slate-400 dark:text-slate-600 font-light">›</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Category List
            </span>
          </nav>

          {/* Action Buttons (+Add Category, Back to Previous) */}
          <div className="flex items-center gap-3">
            {/* +Add Category Button */}
            <button
              id="add-asset-category-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Category</span>
            </button>

            {/* Back to Previous Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-[#253945] hover:bg-[#1b2c37] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Previous</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD CONTAINER: Controls + Table + Pagination */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Table Controls Header: Show entries & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800 text-sm">
            
            {/* Show entries dropdown */}
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
              <span>Show</span>
              <div className="relative inline-block">
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
              <span>entries</span>
            </div>

            {/* Quick Actions & Search Input */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearTable}
                title={categories.length === 0 ? "Load sample asset categories" : "Toggle empty state"}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
                <span>Search:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    className="w-40 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ASSET CATEGORY TABLE (Exact Matching Header & Vibrant Styling) */}
          {/* ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Vibrant Lavender/Purple Table Header (Matches Screenshot 1) */}
              <thead>
                <tr className="bg-[#6366F1] dark:bg-[#5558E6] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                  {/* SL Header */}
                  <th
                    onClick={() => handleSort("sl")}
                    className="py-3 px-4 w-[8%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SL</span>
                      {sortField === "sl" ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* TYPE Header */}
                  <th
                    onClick={() => handleSort("type")}
                    className="py-3 px-4 w-[20%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>TYPE</span>
                      {sortField === "type" ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* CODE Header */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-4 w-[25%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>CODE</span>
                      {sortField === "code" ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* NAME Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-4 w-[35%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NAME</span>
                      {sortField === "name" ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* ACTION Header */}
                  <th className="py-3 px-4 w-[12%] text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>ACTION</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {currentEntries.length > 0 ? (
                  currentEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* SL */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {item.sl}
                      </td>

                      {/* TYPE */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {item.type || "Asset"}
                      </td>

                      {/* CODE */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {item.code || ""}
                      </td>

                      {/* NAME */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-[#6366F1] dark:text-indigo-400 font-normal hover:underline text-left cursor-pointer transition-colors"
                        >
                          {item.name}
                        </button>
                      </td>

                      {/* ACTION: Cyan Edit Button + Coral Delete Button */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cyan Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Category"
                            className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <SquarePen className="w-4 h-4 stroke-[2]" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Category"
                            className="w-8 h-8 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Empty state matching Screenshot 1 */
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-slate-500 dark:text-slate-400 text-[13px] font-normal"
                    >
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* TABLE FOOTER: Showing Entries + Numbered Pagination */}
          {/* ========================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            {/* Showing X to Y of Z entries */}
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 select-none">
              {/* Previous Button */}
              <button
                disabled={safeCurrentPage === 1 || totalEntries === 0}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page Number Buttons */}
              {totalPages > 0 &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#6366F1] text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

              {/* Next Button */}
              <button
                disabled={safeCurrentPage === totalPages || totalEntries === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CATEGORY (Exact Match With Screenshot 2) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[620px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Category
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row: Category Code & Category Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="C1704062"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Category Name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Modal Footer (Close & Submit Buttons aligned to right) */}
              <div className="flex items-center justify-end gap-3 pt-3">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-md bg-[#8A92A6] hover:bg-[#788094] text-white text-xs sm:text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold shadow-sm shadow-indigo-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  {modalMode === "edit" ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name || `SL #${deleteTarget.sl}`}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
