"use client";

import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  Calculator,
  Download,
  Filter,
  DollarSign,
  FileText,
} from "lucide-react";
import { LandValuation, AcquisitionLead } from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { AddLandValuationModal } from "./modals/AddLandValuationModal";

interface LandValuationsViewProps {
  valuations: LandValuation[];
  acquisitionLeads: AcquisitionLead[];
  onAddValuation?: (val: any) => void;
  onEditValuation?: (uuid: string, val: any) => void;
  onDeleteValuation?: (uuid: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead_code", label: "Lead Code", visible: true },
  { key: "valuer", label: "Valuer / Appraiser", visible: true },
  { key: "market_rate", label: "Market Rate", visible: true },
  { key: "govt_rate", label: "Govt Rate", visible: true },
  { key: "total_value", label: "Total Value", visible: true },
  { key: "method", label: "Method", visible: true },
  { key: "valued_at", label: "Valued Date", visible: true },
  { key: "status", label: "Status", visible: true },
];

export function LandValuationsView({
  valuations = [],
  acquisitionLeads = [],
  onAddValuation,
  onEditValuation,
  onDeleteValuation,
}: LandValuationsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [valuerFilter, setValuerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<LandValuation | null>(null);

  const safeValuations = Array.isArray(valuations) ? valuations : [];

  // Unique valuers for filter
  const uniqueValuers = useMemo(() => {
    return Array.from(new Set(safeValuations.map((v) => v.valuer).filter(Boolean)));
  }, [safeValuations]);

  const filteredValuations = useMemo(() => {
    return safeValuations.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.lead_code?.toLowerCase().includes(term) ||
        item.valuer?.toLowerCase().includes(term) ||
        item.method?.toLowerCase().includes(term);

      const matchesLead = leadFilter === "ALL" || item.lead_code === leadFilter;
      const matchesValuer = valuerFilter === "ALL" || item.valuer === valuerFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

      let matchesDate = true;
      if (fromDate && item.valued_at < fromDate) matchesDate = false;
      if (toDate && item.valued_at > toDate) matchesDate = false;

      return matchesSearch && matchesLead && matchesValuer && matchesStatus && matchesDate;
    });
  }, [safeValuations, searchTerm, leadFilter, valuerFilter, statusFilter, fromDate, toDate]);

  const displayedValuations = filteredValuations.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedValuations.map((v) => v.uuid || v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ["Lead Code", "Valuer", "Market Rate", "Govt Rate", "Total Value", "Method", "Valued Date", "Status"];
    const rows = filteredValuations.map((v) => [
      v.lead_code,
      `"${v.valuer}"`,
      v.market_rate,
      v.govt_rate || 0,
      v.total_value,
      v.method,
      v.valued_at,
      v.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `land_valuations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-4">
      {/* 1. Filter Bar (Filters: lead, valuer, status, from, to) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filter Valuations</span>
          </div>
          {(leadFilter !== "ALL" || valuerFilter !== "ALL" || statusFilter !== "ALL" || fromDate || toDate) && (
            <button
              onClick={() => {
                setLeadFilter("ALL");
                setValuerFilter("ALL");
                setStatusFilter("ALL");
                setFromDate("");
                setToDate("");
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Lead Filter */}
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Leads</option>
            {acquisitionLeads.map((l) => (
              <option key={l.id || l.leadCode} value={l.leadCode || l.code}>
                {l.leadCode || l.code}
              </option>
            ))}
          </select>

          {/* Valuer Filter */}
          <select
            value={valuerFilter}
            onChange={(e) => setValuerFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Valuers</option>
            {uniqueValuers.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending Review</option>
            <option value="Verified">Verified</option>
            <option value="Approved">Approved</option>
          </select>

          {/* From Date */}
          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="From Date"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            />
          </div>

          {/* To Date */}
          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="To Date"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <LamsTableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by lead, valuer, or method..."
            entriesPerPage={entriesPerPage}
            onEntriesPerPageChange={setEntriesPerPage}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onExportCSV={handleExportCSV}
          />
        </div>

        <button
          onClick={() => {
            setEditingValuation(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shrink-0 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Valuation</span>
        </button>
      </div>

      {/* 3. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkExport={handleExportCSV}
        onBulkDelete={() => {
          if (confirm(`Delete ${selectedIds.length} selected valuation(s)?`)) {
            selectedIds.forEach((id) => onDeleteValuation?.(id));
            setSelectedIds([]);
          }
        }}
      />

      {/* 4. Valuations Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={displayedValuations.length > 0 && selectedIds.length === displayedValuations.length}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
                {isColVisible("lead_code") && <th className="py-3 px-3.5">Lead Code</th>}
                {isColVisible("valuer") && <th className="py-3 px-3.5">Valuer</th>}
                {isColVisible("market_rate") && <th className="py-3 px-3.5">Market Rate</th>}
                {isColVisible("govt_rate") && <th className="py-3 px-3.5">Govt Rate</th>}
                {isColVisible("total_value") && <th className="py-3 px-3.5">Total Value</th>}
                {isColVisible("method") && <th className="py-3 px-3.5">Method</th>}
                {isColVisible("valued_at") && <th className="py-3 px-3.5">Valued At</th>}
                {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                <th className="py-3 px-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedValuations.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <LamsEmptyState
                      icon={Calculator}
                      title="No Land Valuations Found"
                      description="Create an expert property appraisal with market and government rate comparisons."
                      actionLabel="Create First Valuation"
                      onAction={() => {
                        setEditingValuation(null);
                        setIsModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                displayedValuations.map((val) => {
                  const id = val.uuid || val.id;
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? "bg-cyan-50/40 dark:bg-cyan-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>

                      {isColVisible("lead_code") && (
                        <td className="py-3 px-3.5 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          {val.lead_code}
                        </td>
                      )}

                      {isColVisible("valuer") && (
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {val.valuer}
                        </td>
                      )}

                      {isColVisible("market_rate") && (
                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                          ৳ {val.market_rate.toLocaleString()}
                        </td>
                      )}

                      {isColVisible("govt_rate") && (
                        <td className="py-3 px-3.5 font-medium text-slate-500">
                          ৳ {(val.govt_rate || 0).toLocaleString()}
                        </td>
                      )}

                      {isColVisible("total_value") && (
                        <td className="py-3 px-3.5 font-extrabold text-emerald-600">
                          ৳ {val.total_value.toLocaleString()}
                        </td>
                      )}

                      {isColVisible("method") && (
                        <td className="py-3 px-3.5 capitalize font-medium text-slate-600 dark:text-slate-400">
                          {val.method}
                        </td>
                      )}

                      {isColVisible("valued_at") && (
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                          {val.valued_at}
                        </td>
                      )}

                      {isColVisible("status") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={val.status} />
                        </td>
                      )}

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingValuation(val);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Valuation"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete valuation for ${val.lead_code}?`)) {
                                onDeleteValuation?.(id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Valuation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valuation Modal */}
      <AddLandValuationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingValuation(null);
        }}
        onSave={(data) => {
          if (editingValuation) {
            onEditValuation?.(editingValuation.uuid || editingValuation.id, data);
          } else {
            onAddValuation?.(data);
          }
        }}
        acquisitionLeads={acquisitionLeads}
        initialData={editingValuation}
      />
    </div>
  );
}
