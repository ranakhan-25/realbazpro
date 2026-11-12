"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Handshake,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
  Minus,
  Pencil,
  PlusCircle,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { NegotiationRecord, AcquisitionLead, NegotiationStatus } from "@/types/lams";
import { AddNegotiationModal } from "./modals/AddNegotiationModal";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";

interface NegotiationProcessViewProps {
  negotiations: NegotiationRecord[];
  onEditNegotiation?: (uuid: string, data: any) => void;
  onAddNegotiation: (record: NegotiationRecord) => void;
  onDeleteNegotiation: (uuid: string) => void;
  acquisitionLeads: AcquisitionLead[];
  initialOpenCreate?: boolean;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead", label: "Lead / Parcel", visible: true },
  { key: "round_no", label: "Round #", visible: true },
  { key: "offer_amount", label: "Company Offer (৳)", visible: true },
  { key: "counter_amount", label: "Owner Counter (৳)", visible: true },
  { key: "gap", label: "Price Gap (৳)", visible: true },
  { key: "negotiator", label: "Negotiator", visible: true },
  { key: "date", label: "Meeting Date", visible: true },
  { key: "status", label: "Status", visible: true },
];

export function NegotiationProcessView({
  negotiations = [],
  onAddNegotiation,
  onEditNegotiation,
  onDeleteNegotiation,
  acquisitionLeads = [],
  initialOpenCreate = false,
}: NegotiationProcessViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(Boolean(initialOpenCreate));
  const [editingNegotiation, setEditingNegotiation] = useState<any>(null);

  React.useEffect(() => {
    if (initialOpenCreate) {
      setIsAddModalOpen(true);
    }
  }, [initialOpenCreate]);

  const safeNegotiations = Array.isArray(negotiations) ? negotiations : [];

  // KPIs
  const kpis = useMemo(() => {
    let totalOffered = 0;
    let totalCounter = 0;
    let agreedCount = 0;

    safeNegotiations.forEach((n) => {
      totalOffered += n.offeredTotalPrice || (n as any).offer_amount || 0;
      totalCounter += n.counterOfferByOwner || (n as any).counter_amount || 0;
      if (n.negotiationStatus === "Agreed" || (n as any).status === "Agreed") agreedCount += 1;
    });

    return {
      totalNegotiations: safeNegotiations.length,
      agreedCount,
      totalOffered,
      totalCounter,
    };
  }, [safeNegotiations]);

  // Filtering
  const filteredNegotiations = useMemo(() => {
    return safeNegotiations.filter((item: any) => {
      const title = item.leadTitle || item.lead || "";
      const mouza = item.mouza || "";
      const negotiator = item.attendedBy || item.negotiator || "";
      const status = item.negotiationStatus || item.status || "";
      const leadId = item.acquisitionLeadId || item.lead_id || "";
      const date = item.meetingDate || item.date || "";

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        title.toLowerCase().includes(term) ||
        mouza.toLowerCase().includes(term) ||
        negotiator.toLowerCase().includes(term);

      const matchesLead = leadFilter === "ALL" || leadId === leadFilter || title === leadFilter;
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      let matchesDate = true;
      if (fromDate && date < fromDate) matchesDate = false;
      if (toDate && date > toDate) matchesDate = false;

      return matchesSearch && matchesLead && matchesStatus && matchesDate;
    });
  }, [safeNegotiations, searchTerm, leadFilter, statusFilter, fromDate, toDate]);

  const displayedNegotiations = filteredNegotiations.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedNegotiations.map((n: any) => n.uuid || n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Lead Title",
      "Round #",
      "Offered Total (BDT)",
      "Counter Offer (BDT)",
      "Price Gap",
      "Attended By / Negotiator",
      "Meeting Date",
      "Status",
      "Remarks",
    ];
    const rows = filteredNegotiations.map((n: any) => [
      `"${n.leadTitle || n.lead || ""}"`,
      n.round_no || 1,
      n.offeredTotalPrice || n.offer_amount || 0,
      n.counterOfferByOwner || n.counter_amount || 0,
      (n.counterOfferByOwner || n.counter_amount || 0) - (n.offeredTotalPrice || n.offer_amount || 0),
      `"${n.attendedBy || n.negotiator || ""}"`,
      `"${n.meetingDate || n.date || ""}"`,
      `"${n.negotiationStatus || n.status || ""}"`,
      `"${n.remarks || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `negotiations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (uuid: string) => {
    setExpandedId((prev) => (prev === uuid ? null : uuid));
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-6">
      {/* 1. Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rounds</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {kpis.totalNegotiations} Rounds
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active parcel discussions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Handshake className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Deals Agreed</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {kpis.agreedCount} Agreed
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {kpis.totalNegotiations > 0 ? Math.round((kpis.agreedCount / kpis.totalNegotiations) * 100) : 0}% success rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Company Total Offered</p>
            <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300 mt-1">
              ৳ {(kpis.totalOffered / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Target acquisition cap</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Owner Total Counter</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
              ৳ {(kpis.totalCounter / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Seller expectations</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Header and Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Handshake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Land Price Negotiation & Counter-Offer Process
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log rounds of negotiation, company offers vs seller counter offers, and meeting minutes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingNegotiation(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Negotiation Round</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lead filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Acquisition Lead
            </label>
            <select
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">All Acquisition Leads</option>
              {acquisitionLeads.map((l) => (
                <option key={l.id || l.uuid} value={l.id || l.uuid}>
                  {l.leadCode || l.code || l.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Negotiation Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Agreed">Agreed</option>
              <option value="Revision Needed">Revision Needed</option>
              <option value="Declined">Declined</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Meeting From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Meeting To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Toolbar */}
        <LamsTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search lead title, mouza, officer, notes..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={() => {
            setSearchTerm("");
            setLeadFilter("ALL");
            setStatusFilter("ALL");
            setFromDate("");
            setToDate("");
          }}
          hasActiveFilters={
            Boolean(searchTerm) ||
            leadFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            Boolean(fromDate) ||
            Boolean(toDate)
          }
        />
      </div>

      {/* 4. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={() => {
          if (confirm(`Are you sure you want to delete ${selectedIds.length} negotiation records?`)) {
            selectedIds.forEach((id) => onDeleteNegotiation?.(id));
            setSelectedIds([]);
          }
        }}
        onBulkStatusChange={(newStatus) => {
          selectedIds.forEach((id) =>
            onEditNegotiation?.(id, { negotiationStatus: newStatus as any })
          );
          setSelectedIds([]);
        }}
        statusOptions={[
          "In Progress",
          "Agreed",
          "Revision Needed",
          "Declined",
        ]}
      />

      {/* 5. Negotiations Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedNegotiations.length === 0 ? (
          <LamsEmptyState
            title="No negotiation records found"
            description="Start a negotiation process or adjust filters to view historical offer rounds."
            actionLabel="Add Negotiation Round"
            onAction={() => {
              setEditingNegotiation(null);
              setIsAddModalOpen(true);
            }}
            icon={Handshake}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        displayedNegotiations.length > 0 &&
                        selectedIds.length === displayedNegotiations.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  {isColVisible("lead") && <th className="py-3 px-3.5">Lead / Parcel</th>}
                  {isColVisible("round_no") && <th className="py-3 px-3.5 text-center">Round</th>}
                  {isColVisible("offer_amount") && <th className="py-3 px-3.5 text-right">Company Offer</th>}
                  {isColVisible("counter_amount") && <th className="py-3 px-3.5 text-right">Owner Counter</th>}
                  {isColVisible("gap") && <th className="py-3 px-3.5 text-right">Price Gap</th>}
                  {isColVisible("negotiator") && <th className="py-3 px-3.5">Negotiator</th>}
                  {isColVisible("date") && <th className="py-3 px-3.5">Meeting Date</th>}
                  {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedNegotiations.map((item: any) => {
                  const itemId = item.uuid || item.id;
                  const isSelected = selectedIds.includes(itemId);
                  const isExpanded = expandedId === itemId;
                  const offered = item.offeredTotalPrice || item.offer_amount || 0;
                  const counter = item.counterOfferByOwner || item.counter_amount || 0;
                  const gap = counter - offered;
                  const statusKey = item.negotiationStatus || item.status || "In Progress";
                  const roundNo = item.round_no || 1;

                  return (
                    <React.Fragment key={itemId}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                          isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(itemId)}
                            className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
                          />
                        </td>

                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => toggleExpand(itemId)}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700 transition-all"
                            title={isExpanded ? "Collapse notes" : "Expand notes"}
                          >
                            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* Lead */}
                        {isColVisible("lead") && (
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {item.leadTitle || item.lead || "Acquisition Lead"}
                            </span>
                            {item.mouza && (
                              <span className="text-[10px] text-slate-400 block">
                                Mouza: {item.mouza} {item.dagNo ? `• Dag ${item.dagNo}` : ""}
                              </span>
                            )}
                          </td>
                        )}

                        {/* Round # */}
                        {isColVisible("round_no") && (
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {roundNo}
                            </span>
                          </td>
                        )}

                        {/* Offer Amount */}
                        {isColVisible("offer_amount") && (
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                            ৳ {Number(offered).toLocaleString()}
                          </td>
                        )}

                        {/* Counter Amount */}
                        {isColVisible("counter_amount") && (
                          <td className="py-3 px-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                            ৳ {Number(counter).toLocaleString()}
                          </td>
                        )}

                        {/* Price Gap */}
                        {isColVisible("gap") && (
                          <td className="py-3 px-3.5 text-right">
                            <span
                              className={`font-bold ${
                                gap > 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              ৳ {Math.abs(gap).toLocaleString()}
                            </span>
                          </td>
                        )}

                        {/* Negotiator */}
                        {isColVisible("negotiator") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                            {item.attendedBy || item.negotiator || "Negotiation Team"}
                          </td>
                        )}

                        {/* Date */}
                        {isColVisible("date") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {item.meetingDate || item.date || "Scheduled"}
                          </td>
                        )}

                        {/* Status */}
                        {isColVisible("status") && (
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                statusKey === "Agreed"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : statusKey === "Declined"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                  : statusKey === "Revision Needed"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {statusKey}
                            </span>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingNegotiation(item);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                              title="Edit Negotiation Round"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete negotiation record for "${item.leadTitle || item.lead}"?`)) {
                                  onDeleteNegotiation?.(itemId);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row: Remarks and Minutes */}
                      {isExpanded && (
                        <tr className="bg-amber-50/30 dark:bg-amber-950/10">
                          <td colSpan={11} className="p-4 text-xs space-y-2 border-b border-amber-100 dark:border-amber-900/40">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              Meeting Notes & Key Bargaining Factors:
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 pl-5">
                              {item.remarks || item.meeting_notes || "No detailed notes recorded for this round."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Add / Edit Modal */}
      <AddNegotiationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingNegotiation(null);
        }}
        onAddNegotiation={(rec) => {
          if (editingNegotiation && onEditNegotiation) {
            onEditNegotiation(editingNegotiation.uuid || editingNegotiation.id, rec);
          } else {
            onAddNegotiation(rec);
          }
          setIsAddModalOpen(false);
          setEditingNegotiation(null);
        }}
        editData={editingNegotiation}
        acquisitionLeads={acquisitionLeads}
      />
    </div>
  );
}
