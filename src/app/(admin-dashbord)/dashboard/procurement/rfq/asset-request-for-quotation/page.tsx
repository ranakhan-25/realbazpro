"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ArrowLeftRight,
  Plus,
  ChevronUp,
  FileSearch,
  Search,
  X,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  FolderKanban,
  FileText,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { procurementAssetRfqApi, BackendAssetRfq } from "@/lib/procurement";

interface RfqRow {
  id: number;
  uuid?: string;
  projectType: string;
  project: string;
  supplierName: string;
  code: string;
  reference: string;
  date: string;
  subTotal: number | null;
  grandTotal: number;
  addedBy: string;
  attachmentCount?: number;
}

const tableHeaders = [
  "ID",
  "SELECT",
  "PROJECT TYPE",
  "PROJECT",
  "SUPPLIER NAME",
  "CODE",
  "REFERENCE",
  "DATE",
  "SUB TOTAL",
  "GRAND TOTAL",
  "ADDED BY",
  "ATTACHMENT",
  "ACTION",
];

const lgColumnWidths: Record<string, string> = {
  ID: "lg:w-[4%]",
  SELECT: "lg:w-[4%]",
  "PROJECT TYPE": "lg:w-[8%]",
  PROJECT: "lg:w-[10%]",
  "SUPPLIER NAME": "lg:w-[13%]",
  CODE: "lg:w-[7%]",
  REFERENCE: "lg:w-[8%]",
  DATE: "lg:w-[8%]",
  "SUB TOTAL": "lg:w-[8%]",
  "GRAND TOTAL": "lg:w-[8%]",
  "ADDED BY": "lg:w-[8%]",
  ATTACHMENT: "lg:w-[7%]",
  ACTION: "lg:w-[7%]",
};

const RequestForQuotationList = () => {
  const [rows, setRows] = useState<RfqRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ uuid: string; name: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ uuid: string; name: string }[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load Dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const dd = await procurementAssetRfqApi.getDropdowns();
        if (dd?.projects) {
          setProjectOptions(dd.projects.map((p: any) => ({ uuid: p.uuid, name: p.name })));
        }
        if (dd?.suppliers) {
          setSupplierOptions(dd.suppliers.map((s: any) => ({ uuid: s.uuid, name: s.supplierName })));
        }
      } catch (err) {
        console.error("Failed to load asset RFQ dropdowns:", err);
      }
    }
    loadDropdowns();
  }, []);

  // Fetch RFQs from Real Backend API
  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const res = await procurementAssetRfqApi.getRfqs({
        page: currentPage,
        limit: entriesPerPage,
        search: search.trim() || undefined,
        project_id: selectedProject || undefined,
        supplier_id: selectedSupplier || undefined,
      });

      const mapped: RfqRow[] = (res.data || []).map((r, idx) => ({
        id: (currentPage - 1) * entriesPerPage + idx + 1,
        uuid: r.uuid,
        projectType: r.projectType?.name || "Asset",
        project: r.project?.name || "—",
        supplierName: r.supplier?.supplierName || "—",
        code: r.code || "—",
        reference: r.reference || "—",
        date: r.date ? new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        subTotal: r.subtotal ? Number(r.subtotal) : null,
        grandTotal: Number(r.grand_total || 0),
        addedBy: r.addedBy?.name || "Admin",
        attachmentCount: r.attachment ? 1 : 0,
      }));

      setRows(mapped);
      if (res.meta) {
        setTotalRecords(res.meta.total || mapped.length);
        setTotalPages(res.meta.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch asset RFQs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [currentPage, entriesPerPage, search, selectedProject, selectedSupplier]);

  const handleDelete = async (row: RfqRow) => {
    if (!row.uuid) return;
    if (!confirm(`Are you sure you want to delete RFQ #${row.code}?`)) return;
    try {
      await procurementAssetRfqApi.deleteRfq(row.uuid);
      fetchRfqs();
    } catch (err) {
      console.error("Error deleting RFQ:", err);
      alert("Failed to delete RFQ.");
    }
  };

  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selectedRows.includes(r.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((r) => r.id === id)));
    } else {
      setSelectedRows((prev) => [
        ...prev,
        ...rows.map((r) => r.id).filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const startIdx = (currentPage - 1) * entriesPerPage;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
        <h1 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
          Request for Quotation (RFQ)
        </h1>
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
          <Link
            href="/dashboard"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Procurement
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            RFQ
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Asset Request For Quotation
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4">
        {/* Filter Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs p-5 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 text-[12.5px] rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">All Projects</option>
                {projectOptions.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 text-[12.5px] rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">All Suppliers</option>
                {supplierOptions.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Code, supplier, reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 pl-9 pr-3 text-[12.5px] rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 text-[12.5px] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRfqs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className={`px-3 py-3 ${lgColumnWidths[header] || ""} whitespace-nowrap`}
                    >
                      {header === "SELECT" ? (
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      ) : (
                        header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-3 py-16 text-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                      <span className="text-xs text-slate-400">Loading Asset RFQs...</span>
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors"
                  >
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 align-middle">
                      {row.id}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-700 dark:text-slate-200 align-middle">
                      {row.projectType}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] font-medium text-slate-800 dark:text-slate-100 align-middle">
                      {row.project}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 align-middle">
                      {row.supplierName}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] font-semibold text-indigo-600 dark:text-indigo-400 align-middle">
                      {row.code}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-500 dark:text-slate-400 align-middle">
                      {row.reference}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 align-middle">
                      {row.date}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 align-middle">
                      {row.subTotal !== null ? `৳${row.subTotal.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] font-bold text-slate-800 dark:text-slate-100 align-middle">
                      ৳{row.grandTotal.toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 align-middle">
                      {row.addedBy}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px] text-slate-500 dark:text-slate-400 align-middle text-center">
                      {row.attachmentCount ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                          {row.attachmentCount} files
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 align-middle relative">
                      <button
                        onClick={() =>
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id)
                        }
                        className="flex items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeActionMenu === row.id && (
                        <div className="absolute right-4 top-10 w-36 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none py-1.5 z-20 text-[12.5px]">
                          <button
                            onClick={() => {
                              alert(`Asset RFQ Code: ${row.code}\nProject: ${row.project}\nSupplier: ${row.supplierName}\nGrand Total: ৳${row.grandTotal}`);
                              setActiveActionMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            View
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          <button
                            onClick={() => {
                              handleDelete(row);
                              setActiveActionMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-3 py-12 text-center text-[13px] text-slate-400 dark:text-slate-500"
                    >
                      <FileSearch className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      No RFQ records match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[12.5px] text-slate-500 dark:text-slate-400">
              Showing {rows.length === 0 ? 0 : startIdx + 1} to{" "}
              {startIdx + rows.length} of {totalRecords} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                      page === currentPage
                        ? "bg-indigo-600 text-white dark:bg-indigo-600"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 text-[12px] text-slate-500 dark:text-slate-400 transition-colors">
        <span>2026 © Somikoron IT LTD</span>
        <span>Design &amp; Developed by Somikoron IT LTD</span>
      </footer>
    </div>
  );
};

export default RequestForQuotationList;
