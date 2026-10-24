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
  Box,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

// ==========================================
// Types
// ==========================================
export interface AssetItemEntry {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  brand: string;
  purchasePrice: number;
  chartOfGroup?: string;
}

// ==========================================
// Initial Sample Asset Items
// ==========================================
const INITIAL_ASSET_ITEMS: AssetItemEntry[] = [
  {
    id: 1,
    code: "AST-1001",
    name: "Caterpillar Excavator 320D",
    category: "Heavy Equipment & Machinery",
    unit: "Unit",
    brand: "CAT",
    purchasePrice: 12500000,
    chartOfGroup: "Plant & Machinery",
  },
  {
    id: 2,
    code: "AST-1002",
    name: "Perkins 100kVA Soundproof Generator",
    category: "Generators & Power Units",
    unit: "Unit",
    brand: "Perkins",
    purchasePrice: 1850000,
    chartOfGroup: "Plant & Machinery",
  },
  {
    id: 3,
    code: "AST-1003",
    name: "Toyota Hilux 4x4 Double Cabin Site Vehicle",
    category: "Vehicles & Site Transport",
    unit: "Unit",
    brand: "Toyota",
    purchasePrice: 6500000,
    chartOfGroup: "Vehicles & Transport",
  },
  {
    id: 4,
    code: "AST-1004",
    name: "Leica TS07 Total Station Survey Unit",
    category: "Surveying & Leveling Instruments",
    unit: "Set",
    brand: "Leica",
    purchasePrice: 850000,
    chartOfGroup: "Tools & Implements",
  },
  {
    id: 5,
    code: "AST-1005",
    name: "Concrete Mixer Machine (10/7 CFT Diesel)",
    category: "Heavy Equipment & Machinery",
    unit: "Unit",
    brand: "Standard",
    purchasePrice: 320000,
    chartOfGroup: "Plant & Machinery",
  },
  {
    id: 6,
    code: "AST-1006",
    name: "Bosch Professional GBH 8-45 D Rotary Hammer",
    category: "Power Tools & Cutting Units",
    unit: "Pcs",
    brand: "Bosch",
    purchasePrice: 75000,
    chartOfGroup: "Tools & Implements",
  },
  {
    id: 7,
    code: "AST-1007",
    name: "Heavy Duty Scaffolding Pipe & Coupler Set",
    category: "Scaffolding & Temporary Structures",
    unit: "Set",
    brand: "Standard",
    purchasePrice: 450000,
    chartOfGroup: "Fixed Assets",
  },
  {
    id: 8,
    code: "AST-1008",
    name: "HP ProLiant DL380 Rack Server",
    category: "Office IT & Computer Equipment",
    unit: "Unit",
    brand: "HP",
    purchasePrice: 520000,
    chartOfGroup: "IT Assets",
  },
  {
    id: 9,
    code: "AST-1009",
    name: "Multi-Gas Detector & Calibration Station",
    category: "Safety & Emergency Equipment",
    unit: "Set",
    brand: "Honeywell",
    purchasePrice: 145000,
    chartOfGroup: "Safety & Security",
  },
  {
    id: 10,
    code: "AST-1010",
    name: "Executive Mahogany Conference Table (14 Person)",
    category: "Site Office Furniture & Fixtures",
    unit: "Unit",
    brand: "Hatil",
    purchasePrice: 180000,
    chartOfGroup: "Office Equipment",
  },
];

const DEFAULT_ASSET_CATEGORIES = [
  "Heavy Equipment & Machinery",
  "Generators & Power Units",
  "Vehicles & Site Transport",
  "Surveying & Leveling Instruments",
  "Power Tools & Cutting Units",
  "Scaffolding & Temporary Structures",
  "Office IT & Computer Equipment",
  "Site Office Furniture & Fixtures",
  "Safety & Emergency Equipment",
  "Testing & Laboratory Apparatus",
];

const DEFAULT_BRANDS = [
  "CAT",
  "Perkins",
  "Toyota",
  "Leica",
  "Bosch",
  "HP",
  "Honeywell",
  "Hatil",
  "Standard",
  "Komatsu",
  "JCB",
  "Hitachi",
];

const DEFAULT_UNITS = [
  "Unit",
  "Set",
  "Pcs",
  "Nos",
  "Pack",
];

const CHART_OF_GROUPS = [
  "Fixed Assets",
  "Plant & Machinery",
  "Vehicles & Transport",
  "Office Equipment",
  "IT Assets",
  "Tools & Implements",
  "Safety & Security",
  "Capital Work In Progress",
];

export default function AssetItemEntryPage() {
  const router = useRouter();

  // Storage key
  const STORAGE_KEY = "realbiz_procurement_asset_items_v1";

  // Data State
  const [items, setItems] = useState<AssetItemEntry[]>([]);

  // Options State
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_ASSET_CATEGORIES);
  const [brandOptions, setBrandOptions] = useState<string[]>(DEFAULT_BRANDS);
  const [unitOptions, setUnitOptions] = useState<string[]>(DEFAULT_UNITS);

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<keyof AssetItemEntry | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form State (Matching Screenshot 2 exactly: Category, Brand, Item Name, Unit, Purchase Price, Chart of Groups)
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState<string>("");
  const [formChartOfGroup, setFormChartOfGroup] = useState("");
  const [formCode, setFormCode] = useState("");

  // Quick Brand Add Modal
  const [showQuickBrandModal, setShowQuickBrandModal] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState("");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<AssetItemEntry | null>(null);

  // Auto-generate item code
  const generateAssetCode = () => {
    return `AST-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Load Initial Data & Sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          setItems(INITIAL_ASSET_ITEMS);
        }
      } else {
        setItems(INITIAL_ASSET_ITEMS);
      }

      // Sync categories from asset-category page
      const savedCats = localStorage.getItem("realbiz_procurement_asset_categories_v1");
      if (savedCats) {
        const parsedCats = JSON.parse(savedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          const names = parsedCats.map((c: any) => c.name).filter(Boolean);
          if (names.length > 0) {
            setCategoryOptions(Array.from(new Set([...names, ...DEFAULT_ASSET_CATEGORIES])));
          }
        }
      }

      // Sync brands
      const savedBrands = localStorage.getItem("realbiz_procurement_brands_v1");
      if (savedBrands) {
        const parsedBrands = JSON.parse(savedBrands);
        if (Array.isArray(parsedBrands) && parsedBrands.length > 0) {
          const names = parsedBrands.map((b: any) => b.name).filter(Boolean);
          if (names.length > 0) {
            setBrandOptions(Array.from(new Set([...names, ...DEFAULT_BRANDS])));
          }
        }
      }
    } catch {
      setItems(INITIAL_ASSET_ITEMS);
    }
  }, []);

  // Save changes to localStorage
  const saveItems = useCallback((updated: AssetItemEntry[]) => {
    setItems(updated);
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
    setFormCategory("");
    setFormBrand("");
    setFormName("");
    setFormUnit("");
    setFormPurchasePrice("");
    setFormChartOfGroup("");
    setFormCode(generateAssetCode());
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: AssetItemEntry) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormCategory(item.category || "");
    setFormBrand(item.brand || "");
    setFormName(item.name || "");
    setFormUnit(item.unit || "");
    setFormPurchasePrice(item.purchasePrice !== undefined ? String(item.purchasePrice) : "");
    setFormChartOfGroup(item.chartOfGroup || "");
    setFormCode(item.code || generateAssetCode());
    setIsModalOpen(true);
  };

  // Handle Quick Add Brand
  const handleQuickAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) return;
    const newBrand = quickBrandName.trim();
    setBrandOptions((prev) => [newBrand, ...prev]);
    setFormBrand(newBrand);
    setQuickBrandName("");
    setShowQuickBrandModal(false);
    showToast(`Brand "${newBrand}" added!`, "success");
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter item name", "error");
      return;
    }

    if (modalMode === "add") {
      const nextId = items.length > 0 ? Math.max(...items.map((it) => it.id)) + 1 : 1;
      const newItem: AssetItemEntry = {
        id: nextId,
        code: formCode.trim() || generateAssetCode(),
        name: formName.trim(),
        category: formCategory.trim() || "Heavy Equipment",
        unit: formUnit.trim() || "Unit",
        brand: formBrand.trim(),
        purchasePrice: Number(formPurchasePrice) || 0,
        chartOfGroup: formChartOfGroup.trim(),
      };

      const updated = [newItem, ...items].map((item, index) => ({
        ...item,
        id: index + 1,
      }));
      saveItems(updated);
      showToast(`Asset item "${newItem.name}" added successfully!`, "success");
    } else if (modalMode === "edit" && selectedId !== null) {
      const updated = items.map((item) => {
        if (item.id === selectedId) {
          return {
            ...item,
            code: formCode.trim() || item.code,
            name: formName.trim(),
            category: formCategory.trim() || item.category,
            unit: formUnit.trim() || item.unit,
            brand: formBrand.trim(),
            purchasePrice: Number(formPurchasePrice) || 0,
            chartOfGroup: formChartOfGroup.trim(),
          };
        }
        return item;
      });
      saveItems(updated);
      showToast(`Asset item "${formName}" updated successfully!`, "success");
    }

    setIsModalOpen(false);
  };

  // Delete Item
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const filtered = items
      .filter((it) => it.id !== deleteTarget.id)
      .map((item, index) => ({
        ...item,
        id: index + 1,
      }));
    saveItems(filtered);
    showToast(`Asset item "${deleteTarget.name}" deleted`, "info");
    setDeleteTarget(null);
  };

  // Toggle between populated and empty table state (to test Screenshot 1 empty view)
  const handleToggleTableState = () => {
    if (items.length === 0) {
      saveItems(INITIAL_ASSET_ITEMS);
      showToast("Restored sample asset items", "info");
    } else {
      if (confirm("Clear table to test empty state?")) {
        saveItems([]);
        showToast("Table cleared (showing empty state)", "info");
      }
    }
  };

  // Export / Print
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "CODE", "NAME", "CATEGORY", "UNIT", "BRAND", "PURCHASE PRICE", "CHART OF GROUP"];
    const rows = filteredAndSorted.map((it) => [
      it.id,
      `"${it.code}"`,
      `"${it.name}"`,
      `"${it.category}"`,
      `"${it.unit}"`,
      `"${it.brand}"`,
      it.purchasePrice,
      `"${it.chartOfGroup || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asset_items_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export generated!", "success");
  };

  // Handle Sorting
  const handleSort = (field: keyof AssetItemEntry) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...items];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.unit.toLowerCase().includes(q) ||
          it.brand.toLowerCase().includes(q) ||
          String(it.purchasePrice).includes(q) ||
          String(it.id).includes(q)
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
  }, [items, search, sortField, sortDirection]);

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
              <span>Inventory</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </div>

            <span className="text-slate-400 dark:text-slate-600 font-light">›</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Asset Item
            </span>
          </nav>

          {/* Action Buttons (+Item Add, PDF, Print) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* +Item Add Button */}
            <button
              id="add-asset-item-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Item Add</span>
            </button>

            {/* PDF Button (Coral/Red) */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>PDF</span>
            </button>

            {/* Excel Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>Excel</span>
            </button>

            {/* Quick Export/Print Icon Button (Cyan) */}
            <button
              onClick={handlePrint}
              title="Print Table"
              className="w-9 h-9 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-sm transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2]" />
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
                onClick={handleToggleTableState}
                title={items.length === 0 ? "Load sample asset items" : "Toggle empty state (Screenshot 1)"}
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
          {/* ASSET ITEM TABLE (Exact Matching Header & Vibrant Styling) */}
          {/* ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Vibrant Lavender/Purple Table Header (Matches Screenshot 1) */}
              <thead>
                <tr className="bg-[#6366F1] dark:bg-[#5558E6] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                  {/* ID Header */}
                  <th
                    onClick={() => handleSort("id")}
                    className="py-3 px-4 w-[6%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      {sortField === "id" ? (
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
                    className="py-3 px-4 w-[12%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
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
                    className="py-3 px-4 w-[28%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
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

                  {/* CATEGORY Header */}
                  <th
                    onClick={() => handleSort("category")}
                    className="py-3 px-4 w-[16%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>CATEGORY</span>
                      {sortField === "category" ? (
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

                  {/* UNIT Header */}
                  <th
                    onClick={() => handleSort("unit")}
                    className="py-3 px-4 w-[10%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>UNIT</span>
                      {sortField === "unit" ? (
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

                  {/* BRAND Header */}
                  <th
                    onClick={() => handleSort("brand")}
                    className="py-3 px-4 w-[10%] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>BRAND</span>
                      {sortField === "brand" ? (
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

                  {/* PURCHASE PRICE Header */}
                  <th
                    onClick={() => handleSort("purchasePrice")}
                    className="py-3 px-4 w-[10%] cursor-pointer hover:bg-white/10 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>PURCHASE PRICE</span>
                      {sortField === "purchasePrice" ? (
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
                  <th className="py-3 px-4 w-[8%] text-center">
                    <div className="flex items-center justify-center gap-1">
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
                      {/* ID */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {item.id}
                      </td>

                      {/* CODE */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {item.code || ""}
                      </td>

                      {/* NAME */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-slate-800 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-indigo-400 font-normal hover:underline text-left cursor-pointer transition-colors"
                        >
                          {item.name}
                        </button>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                        {item.category || ""}
                      </td>

                      {/* UNIT */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                        {item.unit || ""}
                      </td>

                      {/* BRAND */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-normal">
                        {item.brand || ""}
                      </td>

                      {/* PURCHASE PRICE */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {item.purchasePrice ? item.purchasePrice.toLocaleString() : "0"}
                      </td>

                      {/* ACTION: Cyan Edit Button + Coral Delete Button */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cyan Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Asset Item"
                            className="w-8 h-8 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white flex items-center justify-center shadow-xs transition-transform duration-100 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <SquarePen className="w-4 h-4 stroke-[2]" />
                          </button>

                          {/* Coral/Red Delete Button */}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Asset Item"
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
                      colSpan={8}
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
      {/* MODAL: NEW ITEM (Exact Match With Screenshot 2) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-[840px] overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {modalMode === "edit" ? "Update Item" : "New Item"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Form (Matching Screenshot 2 exactly: Category, Brand, Item Name / Unit, Purchase Price, Chart of Groups) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row 1: Category, Brand, Item Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Brand with Inline "+" Button */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Brand
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                      >
                        <option value="">Select Brand</option>
                        {brandOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                    {/* Inline Quick Add Brand Button */}
                    <button
                      type="button"
                      onClick={() => setShowQuickBrandModal(true)}
                      title="Add New Brand"
                      className="w-8 h-8 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Item Name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Unit, Purchase Price, Chart Of Groups* */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Unit</option>
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="Enter Purchase Price"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Chart Of Groups* */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chart Of Groups<span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formChartOfGroup}
                      onChange={(e) => setFormChartOfGroup(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select One Option</option>
                      {CHART_OF_GROUPS.map((cg) => (
                        <option key={cg} value={cg}>
                          {cg}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
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
      {/* QUICK BRAND ADD MODAL */}
      {/* ========================================================= */}
      {showQuickBrandModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Quick Add Brand
            </h3>
            <form onSubmit={handleQuickAddBrand} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={quickBrandName}
                onChange={(e) => setQuickBrandName(e.target.value)}
                placeholder="Enter Brand Name"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickBrandModal(false)}
                  className="px-3 py-1.5 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded bg-[#6366F1] text-white font-medium shadow-xs"
                >
                  Add Brand
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
                {deleteTarget.name}
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
