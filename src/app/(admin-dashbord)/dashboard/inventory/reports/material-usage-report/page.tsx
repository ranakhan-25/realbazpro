"use client";

import type { MaterialUsageItem } from "@/components/inventory/MaterialUsageReportTable";
import MaterialUsageReportTable from "@/components/inventory/MaterialUsageReportTable";
import React, { useState, useEffect, useMemo } from "react";


import { materialUsageApi } from "@/lib/inventoryApi";
import { toast } from "sonner";

export default function MaterialUsageReportContainer() {
  const [data, setData] = useState<MaterialUsageItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const raw = await materialUsageApi.getAll();
        if (!Array.isArray(raw)) {
          setData([]);
          return;
        }
        const list = raw.map((u: any) => ({
          id: u.id ?? u.uuid ?? u.usage_no ?? u.code ?? "",
          invoiceNo: u.usage_no || u.code || "Not found",
          date: u.date ? new Date(u.date).toLocaleDateString() : "Not found",
          project: u.project?.name || u.project_name || "Not found",
          titleOfWork: u.title_of_work || "Not found",
          task: u.task || "Not found",
          site: u.site?.name || u.site_name || "Not found",
          workerName: u.worker_staff_name || "Not found",
          category: u.category || "Not found",
          itemCode: u.item_code || "Not found",
          itemName: u.item_name || "Not found",
          quantity: Number(u.quantity ?? u.items?.[0]?.quantity ?? 0),
          unit: u.unit || "Not found",
        }));
        setData(list);
      } catch (err) {
        console.error("Could not load material usage report.", err);
        toast.error("Material usage data could not be loaded.");
        setData([]);
      }
    }
    loadData();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [selectedDateRange, setSelectedDateRange] = useState(
    "",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTitleOfWork, setSelectedTitleOfWork] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.invoiceNo.toLowerCase().includes(query) ||
        item.project.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.workerName.toLowerCase().includes(query);

      const matchesProject = selectedProject
        ? item.project === selectedProject
        : true;
      const matchesCategory = selectedCategory
        ? item.category === selectedCategory
        : true;
      const matchesItem = selectedItem ? item.itemName === selectedItem : true;
      const matchesTitle = selectedTitleOfWork
        ? item.titleOfWork === selectedTitleOfWork
        : true;
      const matchesTask = selectedTask ? item.task === selectedTask : true;
      const matchesSite = selectedSite ? item.site === selectedSite : true;
      const matchesWorker = selectedWorker
        ? item.workerName === selectedWorker
        : true;

      return (
        matchesSearch &&
        matchesProject &&
        matchesCategory &&
        matchesItem &&
        matchesTitle &&
        matchesTask &&
        matchesSite &&
        matchesWorker
      );
    });
  }, [data, searchQuery, selectedProject, selectedCategory, selectedItem]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(start, start + entriesPerPage);
  }, [filteredData, currentPage, entriesPerPage]);

  // Total Quantity Calculation
  const totalQuantity = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [filteredData]);

  return (
    <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto space-y-4 p-4 md:p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen transition-colors">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">
        <span className="hover:underline cursor-pointer">Home</span>
        <span className="text-gray-400 dark:text-gray-600">›</span>
        <div className="flex items-center gap-1 hover:underline cursor-pointer">
          <span>Inventory</span>
          <span className="text-[10px]">˅</span>
        </div>
        <span className="text-gray-400 dark:text-gray-600">›</span>
        <span className="text-gray-600 dark:text-gray-300 font-normal">
          Material Usage Report
        </span>
      </div>

      {/* Filter Card Container */}
      <div className="bg-[#f8f9fa] dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-3">
        {/* Row 1: Select Date, Category, Select Item, Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Select Date */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Select Date
            </label>
            <input
              type="text"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-200 shadow-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Categories</option>
              {Array.from(new Set(data.map((item) => item.category)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          {/* Select Item */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Select Item
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Items</option>
              {Array.from(new Set(data.map((item) => item.itemName)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Projects</option>
              {Array.from(new Set(data.map((item) => item.project)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Title/Name of Work, If Task, Site, Worker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Title/Name of Work */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Title/Name of Work
            </label>
            <select
              value={selectedTitleOfWork}
              onChange={(e) => setSelectedTitleOfWork(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Works</option>
              {Array.from(new Set(data.map((item) => item.titleOfWork)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          {/* If Task */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Tasks</option>
              {Array.from(new Set(data.map((item) => item.task)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          {/* Site */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Sites</option>
              {Array.from(new Set(data.map((item) => item.site)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          {/* Worker */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 dark:text-gray-300 block">
              Worker
            </label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              <option value="">All Workers</option>
              {Array.from(new Set(data.map((item) => item.workerName)))
                .filter((value) => value && value !== "Not found")
                .map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar (Excel, PDF, Entries, Search) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <button className="bg-[#0f9f59] hover:bg-[#0b8247] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm">
            Excel
          </button>
          <button className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm">
            PDF
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 ml-2">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-200 text-xs focus:outline-none shadow-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Search:
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-48 text-gray-800 dark:text-gray-100 shadow-sm"
          />
        </div>
      </div>

      {/* Child Component (Table & Pagination) */}
      <MaterialUsageReportTable
        data={filteredData}
        paginatedData={paginatedData}
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
        totalQuantity={totalQuantity}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
