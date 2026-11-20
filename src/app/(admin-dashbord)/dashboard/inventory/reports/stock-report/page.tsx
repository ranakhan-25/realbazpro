"use client";

import type { StockItem } from "@/components/inventory/StockReportTable";
import StockReportTable from "@/components/inventory/StockReportTable";
import React, { useState, useEffect, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { reportsApi, categoriesApi, brandsApi } from "@/lib/inventoryApi";


export default function StockReportContainer() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadStockReport() {
      try {
        const [reportRes, catsRes, brandsRes] = await Promise.allSettled([
          reportsApi.getStockReport(),
          categoriesApi.getAll(),
          brandsApi.getAll(),
        ]);

        let raw: any[] = [];
        if (reportRes.status === "fulfilled") {
          const res = reportRes.value;
          const apiRaw = res?.data || res;
          if (Array.isArray(apiRaw)) {
            raw = apiRaw;
          }
        }

        const list = raw.map((r: any, idx: number) => ({
          id: r.item_id || idx + 1,
          name: r.item_name || r.name || "Not found",
          opening: Number(r.opening ?? 0),
          in: Number(r.total_purchased ?? r.in ?? 0),
          out: Number(r.total_issued ?? r.out ?? 0),
          unit: r.unit || "Not found",
          closing: Number(r.current_stock ?? r.closing ?? 0),
          closingAmount: Number(r.closing_amount ?? r.closingAmount ?? 0),
          category: r.category || "Not found",
          brand: r.brand || "Not found",
          company: r.company?.name || r.company_name || r.company || "Not found",
          project: r.project?.name || r.project_name || r.project || "Not found",
          site: r.site?.name || r.site_name || r.site || "Not found",
        }));
        setStocks(list);

        if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value)) {
          setCategoryOptions(catsRes.value.map((c: any) => c.name || c.category_name || c));
        }

        if (brandsRes.status === "fulfilled" && Array.isArray(brandsRes.value)) {
          setBrandOptions(brandsRes.value.map((b: any) => b.name || b.brand_name || b));
        }
      } catch (err) {
        console.warn("Could not load stock report or dropdowns from API:", err);
      }
    }
    loadStockReport();
  }, []);

  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState(
    "",
  );
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const availableCategories = useMemo(() => {
    const fromStocks = stocks.map((s) => s.category).filter(Boolean);
    return Array.from(new Set([...categoryOptions, ...fromStocks]));
  }, [categoryOptions, stocks]);

  const availableBrands = useMemo(() => {
    const fromStocks = stocks.map((s) => s.brand).filter(Boolean);
    return Array.from(new Set([...brandOptions, ...fromStocks]));
  }, [brandOptions, stocks]);

  // Filtering Logic
  const filteredStocks = useMemo(() => {
    return stocks.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.unit.toLowerCase().includes(query);

      const matchesCategory = selectedCategory
        ? item.category === selectedCategory
        : true;
      const matchesBrand = selectedBrand ? item.brand === selectedBrand : true;
      const matchesCompany = selectedCompany
        ? item.company?.toLowerCase().includes(selectedCompany.toLowerCase())
        : true;
      const matchesProject = selectedProject
        ? item.project?.toLowerCase().includes(selectedProject.toLowerCase())
        : true;
      const matchesSite = selectedSite
        ? item.site?.toLowerCase().includes(selectedSite.toLowerCase())
        : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesCompany &&
        matchesProject &&
        matchesSite
      );
    });
  }, [
    stocks,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedCompany,
    selectedProject,
    selectedSite,
  ]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStocks.length / entriesPerPage) || 1;
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredStocks.slice(start, start + entriesPerPage);
  }, [filteredStocks, currentPage, entriesPerPage]);

  // Totals Calculation
  const totalOpening = useMemo(
    () => filteredStocks.reduce((acc, curr) => acc + curr.opening, 0),
    [filteredStocks],
  );
  const totalIn = useMemo(
    () => filteredStocks.reduce((acc, curr) => acc + curr.in, 0),
    [filteredStocks],
  );
  const totalOut = useMemo(
    () => filteredStocks.reduce((acc, curr) => acc + curr.out, 0),
    [filteredStocks],
  );
  const totalClosing = useMemo(
    () => filteredStocks.reduce((acc, curr) => acc + curr.closing, 0),
    [filteredStocks],
  );
  const totalClosingAmount = useMemo(
    () => filteredStocks.reduce((acc, curr) => acc + curr.closingAmount, 0),
    [filteredStocks],
  );

  return (
    <div className="space-y-4 p-6 bg-background text-foreground min-h-screen">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="hover:underline cursor-pointer">Home</span>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Inventory</span>
        <span>›</span>
        <span className="text-foreground font-medium">Stock Report</span>
      </div>

      {/* Filter Section */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Select Date */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">
            Select Date
          </label>
          <input
            type="text"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          />
        </div>

        {/* Company */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Company</label>
          <input
            type="text"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
            placeholder="Company"
          />
        </div>

        {/* Project */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Project</label>
          <input
            type="text"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
            placeholder="Project"
          />
        </div>

        {/* Site */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Site</label>
          <input
            type="text"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
            placeholder="Site"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">All Brands</option>
            {availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm">
            Excel
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm">
            PDF
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-card border border-input rounded px-2 py-1 text-foreground text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Search:
          </span>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <FiSearch size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="w-full bg-background border border-input rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Child Component Rendering */}
      <StockReportTable
        stocks={filteredStocks}
        paginatedStocks={paginatedStocks}
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalOpening={totalOpening}
        totalIn={totalIn}
        totalOut={totalOut}
        totalClosing={totalClosing}
        totalClosingAmount={totalClosingAmount}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
