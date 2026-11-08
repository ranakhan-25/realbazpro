"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  Receipt,
  Building,
} from "lucide-react";
import {
  SettlementRecord,
  SettlementPaymentSchedule,
  AcquisitionLead,
  LandOwner,
} from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { AddSettlementModal } from "./modals/AddSettlementModal";
import { SettlementPayModal } from "./modals/SettlementPayModal";

interface SettlementsViewProps {
  settlements: SettlementRecord[];
  acquisitionLeads: AcquisitionLead[];
  landOwners: LandOwner[];
  onAddSettlement?: (settlement: any) => void;
  onEditSettlement?: (uuid: string, settlement: any) => void;
  onDeleteSettlement?: (uuid: string) => void;
  onRecordPayment?: (payment: {
    settlement_id: string;
    amount: number;
    mode: string;
    txn_ref: string;
    paid_at: string;
  }) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead_code", label: "Lead Code / Property", visible: true },
  { key: "owner", label: "Land Owner", visible: true },
  { key: "agreed_amount", label: "Agreed Amount", visible: true },
  { key: "advance", label: "Advance", visible: true },
  { key: "paid", label: "Paid", visible: true },
  { key: "due", label: "Outstanding Due", visible: true },
  { key: "payment_mode", label: "Payment Mode", visible: true },
  { key: "scheduled_at", label: "Scheduled Date", visible: true },
  { key: "status", label: "Status", visible: true },
];

export function SettlementsView({
  settlements = [],
  acquisitionLeads = [],
  landOwners = [],
  onAddSettlement,
  onEditSettlement,
  onDeleteSettlement,
  onRecordPayment,
}: SettlementsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<SettlementRecord | null>(null);
  const [payModalSettlement, setPayModalSettlement] = useState<SettlementRecord | null>(null);
  const [viewScheduleSettlement, setViewScheduleSettlement] = useState<SettlementRecord | null>(null);

  const safeSettlements = Array.isArray(settlements) ? settlements : [];

  // Summary KPIs
  const kpis = useMemo(() => {
    let totalAgreed = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let settledCount = 0;

    safeSettlements.forEach((s) => {
      totalAgreed += s.agreed_amount || 0;
      totalPaid += s.paid || 0;
      totalDue += s.due ?? Math.max(0, (s.agreed_amount || 0) - (s.paid || 0));
      if (s.status === "Settled") settledCount += 1;
    });

    return { totalAgreed, totalPaid, totalDue, settledCount, totalCount: safeSettlements.length };
  }, [safeSettlements]);

  // Filtering
  const filteredSettlements = useMemo(() => {
    return safeSettlements.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.lead?.toLowerCase().includes(term) ||
        item.lead_code?.toLowerCase().includes(term) ||
        item.owner?.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term);

      const matchesLead = leadFilter === "ALL" || item.lead === leadFilter || item.lead_code === leadFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesMode = modeFilter === "ALL" || item.payment_mode === modeFilter;

      let matchesDate = true;
      if (fromDate && item.scheduled_at < fromDate) matchesDate = false;
      if (toDate && item.scheduled_at > toDate) matchesDate = false;

      return matchesSearch && matchesLead && matchesStatus && matchesMode && matchesDate;
    });
  }, [safeSettlements, searchTerm, leadFilter, statusFilter, modeFilter, fromDate, toDate]);

  const displayedSettlements = filteredSettlements.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedSettlements.map((s) => s.uuid || s.id));
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
    const headers = ["Lead Code", "Owner", "Agreed Amount", "Advance", "Paid", "Due", "Payment Mode", "Scheduled At", "Status", "Notes"];
    const rows = filteredSettlements.map((s) => [
      `"${s.lead_code || s.lead}"`,
      `"${s.owner}"`,
      s.agreed_amount,
      s.advance,
      s.paid,
      s.due,
      `"${s.payment_mode}"`,
      `"${s.scheduled_at}"`,
      `"${s.status}"`,
      `"${s.notes || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `land_settlements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-6">
      {/* 1. Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Agreed</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ৳ {kpis.totalAgreed.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across {kpis.totalCount} agreements</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid / Disbursed</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              ৳ {kpis.totalPaid.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {kpis.totalAgreed > 0 ? Math.round((kpis.totalPaid / kpis.totalAgreed) * 100) : 0}% settled
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Outstanding Due</p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
              ৳ {kpis.totalDue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Payable installments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Fully Settled</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
              {kpis.settledCount} / {kpis.totalCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">100% completed deeds</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Header and Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Land Purchase Settlements & Payment Agreements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage deed settlements, advances, remaining installments, and payment vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSettlement(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Settlement Agreement</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Lead filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Filter by Lead
            </label>
            <select
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Acquisition Leads</option>
              {acquisitionLeads.map((l) => (
                <option key={l.id || l.uuid} value={l.leadCode || l.code || l.id}>
                  {l.leadCode || l.code || l.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Settlement Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Settled">Settled</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Payment Mode
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Scheduled From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Scheduled To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Toolbar */}
        <LamsTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search lead code, owner, payment mode, notes..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={() => {
            setSearchTerm("");
            setLeadFilter("ALL");
            setStatusFilter("ALL");
            setModeFilter("ALL");
            setFromDate("");
            setToDate("");
          }}
          hasActiveFilters={
            Boolean(searchTerm) ||
            leadFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            modeFilter !== "ALL" ||
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
          if (confirm(`Are you sure you want to delete ${selectedIds.length} settlements?`)) {
            selectedIds.forEach((id) => onDeleteSettlement?.(id));
            setSelectedIds([]);
          }
        }}
        onBulkStatusChange={(newStatus) => {
          selectedIds.forEach((id) =>
            onEditSettlement?.(id, { status: newStatus as any })
          );
          setSelectedIds([]);
        }}
        statusOptions={[
          "Pending",
          "Partially Paid",
          "Settled",
          "Overdue",
        ]}
      />

      {/* 5. Settlements Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedSettlements.length === 0 ? (
          <LamsEmptyState
            title="No settlement agreements found"
            description="Create a settlement agreement or adjust filters to view purchase payment records."
            actionLabel="Create Settlement Agreement"
            onAction={() => {
              setEditingSettlement(null);
              setIsAddModalOpen(true);
            }}
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        displayedSettlements.length > 0 &&
                        selectedIds.length === displayedSettlements.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  {isColVisible("lead_code") && <th className="py-3 px-3.5">Lead / Property</th>}
                  {isColVisible("owner") && <th className="py-3 px-3.5">Land Owner</th>}
                  {isColVisible("agreed_amount") && <th className="py-3 px-3.5 text-right">Agreed Amount</th>}
                  {isColVisible("advance") && <th className="py-3 px-3.5 text-right">Advance Paid</th>}
                  {isColVisible("paid") && <th className="py-3 px-3.5 text-right">Total Paid</th>}
                  {isColVisible("due") && <th className="py-3 px-3.5 text-right">Outstanding Due</th>}
                  {isColVisible("payment_mode") && <th className="py-3 px-3.5 text-center">Payment Mode</th>}
                  {isColVisible("scheduled_at") && <th className="py-3 px-3.5">Scheduled Date</th>}
                  {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSettlements.map((item) => {
                  const itemId = item.uuid || item.id;
                  const isSelected = selectedIds.includes(itemId);
                  const due = item.due ?? Math.max(0, item.agreed_amount - item.paid);
                  const progressPct =
                    item.agreed_amount > 0
                      ? Math.min(100, Math.round((item.paid / item.agreed_amount) * 100))
                      : 0;

                  return (
                    <tr
                      key={itemId}
                      className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                        isSelected ? "bg-cyan-50/40 dark:bg-cyan-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                          className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>

                      {/* Lead */}
                      {isColVisible("lead_code") && (
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {item.lead_code || item.lead}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-slate-400 truncate block max-w-[160px]">
                              {item.notes}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Owner */}
                      {isColVisible("owner") && (
                        <td className="py-3 px-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {item.owner}
                        </td>
                      )}

                      {/* Agreed Amount */}
                      {isColVisible("agreed_amount") && (
                        <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                          ৳ {item.agreed_amount?.toLocaleString() || "0"}
                        </td>
                      )}

                      {/* Advance */}
                      {isColVisible("advance") && (
                        <td className="py-3 px-3.5 text-right text-slate-600 dark:text-slate-400">
                          ৳ {item.advance?.toLocaleString() || "0"}
                        </td>
                      )}

                      {/* Paid */}
                      {isColVisible("paid") && (
                        <td className="py-3 px-3.5 text-right">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ৳ {item.paid?.toLocaleString() || "0"}
                          </div>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </td>
                      )}

                      {/* Outstanding Due */}
                      {isColVisible("due") && (
                        <td className="py-3 px-3.5 text-right">
                          <span
                            className={`font-bold ${
                              due > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            ৳ {due.toLocaleString()}
                          </span>
                        </td>
                      )}

                      {/* Payment Mode */}
                      {isColVisible("payment_mode") && (
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.payment_mode}
                          </span>
                        </td>
                      )}

                      {/* Scheduled At */}
                      {isColVisible("scheduled_at") && (
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {item.scheduled_at}
                        </td>
                      )}

                      {/* Status */}
                      {isColVisible("status") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={item.status} />
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pay button */}
                          {due > 0 && (
                            <button
                              onClick={() => setPayModalSettlement(item)}
                              title="Record Installment Payment"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}

                          {/* View Schedule Modal */}
                          <button
                            onClick={() => setViewScheduleSettlement(item)}
                            title="View Payment Schedule"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingSettlement(item);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Settlement Agreement"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete settlement for "${item.lead_code || item.lead}"?`)) {
                                onDeleteSettlement?.(itemId);
                              }
                            }}
                            title="Delete Settlement"
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Payment Schedule Modal */}
      {viewScheduleSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Installment Schedule Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Lead: {viewScheduleSettlement.lead_code || viewScheduleSettlement.lead} • Owner: {viewScheduleSettlement.owner}
                </p>
              </div>
              <button
                onClick={() => setViewScheduleSettlement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-center text-xs">
              <div>
                <span className="text-slate-500 block">Total Agreed</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ৳ {viewScheduleSettlement.agreed_amount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Paid So Far</span>
                <span className="font-bold text-emerald-600">
                  ৳ {viewScheduleSettlement.paid?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Remaining Due</span>
                <span className="font-bold text-rose-600">
                  ৳ {(viewScheduleSettlement.due ?? (viewScheduleSettlement.agreed_amount - viewScheduleSettlement.paid)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-left">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {viewScheduleSettlement.payment_schedule && viewScheduleSettlement.payment_schedule.length > 0 ? (
                    viewScheduleSettlement.payment_schedule.map((sch) => (
                      <tr key={sch.installment_no}>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          Installment {sch.installment_no}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {sch.due_date}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          ৳ {sch.amount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sch.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        No scheduled installment breakdown defined for this agreement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setViewScheduleSettlement(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add / Edit Settlement Modal */}
      <AddSettlementModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSettlement(null);
        }}
        onSave={(data) => {
          if (editingSettlement) {
            onEditSettlement?.(editingSettlement.uuid || editingSettlement.id, data);
          } else {
            onAddSettlement?.(data);
          }
          setIsAddModalOpen(false);
          setEditingSettlement(null);
        }}
        acquisitionLeads={acquisitionLeads}
        landOwners={landOwners}
        initialData={editingSettlement}
      />

      {/* 8. Record Payment Modal */}
      <SettlementPayModal
        isOpen={Boolean(payModalSettlement)}
        onClose={() => setPayModalSettlement(null)}
        settlement={payModalSettlement}
        onPay={(payment) => {
          onRecordPayment?.(payment);
          setPayModalSettlement(null);
        }}
      />
    </div>
  );
}
