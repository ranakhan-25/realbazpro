"use client";

import type { PurchaseItem } from "@/components/inventory/PurchaseDetailsTable";
import PurchaseDetailsTable from "@/components/inventory/PurchaseDetailsTable";
import React, { useState, useEffect, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { purchasesApi } from "@/lib/inventoryApi";
import { toast } from "sonner";


export default function PurchaseDetailsContainer() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    async function loadPurchases() {
      try {
        const raw = await purchasesApi.getAll();
        const list = (Array.isArray(raw) ? raw : []).map((item: any) => ({
          id: item.id ?? item.uuid ?? item.purchase_no ?? "",
          date: item.date ? new Date(item.date).toLocaleDateString() : "Not found",
          invoiceNo: item.purchase_no || item.code || "Not found",
          supplierName: item.supplier?.name || item.supplier_name || item.supplier || "Not found",
          category: item.category || "Not found",
          itemName: item.item_name || item.items?.[0]?.name || "Not found",
          quantity: Number(item.total_quantity ?? item.items?.[0]?.quantity ?? 0),
          price: Number(item.rate ?? item.items?.[0]?.rate ?? 0),
          subTotal: Number(item.subtotal ?? item.grand_total ?? 0),
          project: item.project?.name || item.project_name || item.project || "Not found",
        }));
        setPurchases(list);
      } catch (err) {
        console.error("Could not load purchase details.", err);
        toast.error("Purchase details could not be loaded.");
        setPurchases([]);
      }
    }
    loadPurchases();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState(
    "",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const categories = useMemo(() => {
    const fromData = purchases.map((p) => p.category).filter(Boolean);
    return Array.from(new Set(fromData));
  }, [purchases]);

  const items = useMemo(() => {
    const fromData = purchases.map((p) => p.itemName).filter(Boolean);
    return Array.from(new Set(fromData));
  }, [purchases]);

  const suppliers = useMemo(() => {
    const fromData = purchases.map((p) => p.supplierName).filter(Boolean);
    return Array.from(new Set(fromData));
  }, [purchases]);

  const projects = useMemo(() => {
    const fromData = purchases.map((purchase) => purchase.project).filter(Boolean);
    return Array.from(new Set(fromData));
  }, [purchases]);

  // Filtering Logic
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.invoiceNo.toLowerCase().includes(query) ||
        item.supplierName.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesItem = selectedItem ? item.itemName === selectedItem : true;
      const matchesSupplier = selectedSupplier ? item.supplierName === selectedSupplier : true;
      const matchesProject = selectedProject ? item.project === selectedProject : true;

      return matchesSearch && matchesCategory && matchesItem && matchesSupplier && matchesProject;
    });
  }, [purchases, searchQuery, selectedCategory, selectedItem, selectedSupplier, selectedProject]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPurchases.length / entriesPerPage) || 1;
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredPurchases.slice(start, start + entriesPerPage);
  }, [filteredPurchases, currentPage, entriesPerPage]);

  // Totals Calculation
  const totalQuantity = useMemo(() => {
    return filteredPurchases.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [filteredPurchases]);

  const totalSubTotal = useMemo(() => {
    return filteredPurchases.reduce((acc, curr) => acc + curr.subTotal, 0);
  }, [filteredPurchases]);

  return (
    <div className="space-y-4 p-6 bg-background text-foreground min-h-screen">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="hover:underline cursor-pointer">Home</span>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Inventory</span>
        <span>›</span>
        <span className="text-foreground font-medium">Purchase Details</span>
      </div>

      {/* Filter Section */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Select Date */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Select Date</label>
          <input
            type="text"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Select Item */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Select Item</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Select Item</option>
            {items.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Supplier</label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Select Project */}
        <div className="space-y-1 lg:col-span-4">
          <label className="text-xs text-muted-foreground block">
            Select Project <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Select Project</option>
            {projects
              .filter((value) => value !== "Not found")
              .map((value) => <option key={value} value={value}>{value}</option>)}
            <option value="Estern 19">Estern 19</option>
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
          <span className="text-xs text-muted-foreground whitespace-nowrap">Search:</span>
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
      <PurchaseDetailsTable
        purchases={filteredPurchases}
        paginatedPurchases={paginatedPurchases}
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalQuantity={totalQuantity}
        totalSubTotal={totalSubTotal}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
