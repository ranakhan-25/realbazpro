"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CalendarCheck2,
  FileSpreadsheet,
  FileText,
  Calendar,
  Phone,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  AlertCircle,
  XCircle,
  Pencil,
  PlusCircle,
  User,
} from "lucide-react";
import { FollowUpItem, AcquisitionLead, FollowUpStatus } from "@/types/lams";
import { AddFollowUpModal } from "./modals/AddFollowUpModal";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";

interface FollowUpViewProps {
  followUps: FollowUpItem[];
  onEditFollowUp?: (uuid: string, data: any) => void;
  onAddFollowUp: (item: FollowUpItem) => void;
  onDeleteFollowUp: (uuid: string) => void;
  onToggleComplete: (uuid: string) => void;
  acquisitionLeads: AcquisitionLead[];
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "land", label: "Land Details / Mouza", visible: true },
  { key: "owner", label: "Owner & Contact", visible: true },
  { key: "date", label: "Meeting Schedule", visible: true },
  { key: "assigned", label: "Assigned To", visible: true },
  { key: "notes", label: "Notes & Agenda", visible: true },
  { key: "status", label: "Status", visible: true },
];

export function FollowUpView({
  followUps = [],
  onAddFollowUp,
  onEditFollowUp,
  onDeleteFollowUp,
  onToggleComplete,
  acquisitionLeads = [],
}: FollowUpViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<any>(null);

  const safeFollowUps = Array.isArray(followUps) ? followUps : [];

  const filteredFollowUps = useMemo(() => {
    return safeFollowUps.filter((item: any) => {
      const term = searchTerm.toLowerCase();
      const land = (item.landDetails || item.leadTitle || "").toLowerCase();
      const owner = (item.ownerDetails || item.owner || "").toLowerCase();
      const contact = (item.contact || item.phone || "").toLowerCase();
      const note = (item.note || item.notes || "").toLowerCase();
      const assigned = (item.assignedTo || item.assignee || "").toLowerCase();
      const date = item.followUpDate || item.date || "";

      const matchesSearch =
        !term ||
        land.includes(term) ||
        owner.includes(term) ||
        contact.includes(term) ||
        note.includes(term) ||
        assigned.includes(term);

      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

      let matchesDate = true;
      if (fromDate && date < fromDate) matchesDate = false;
      if (toDate && date > toDate) matchesDate = false;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [safeFollowUps, searchTerm, statusFilter, fromDate, toDate]);

  const displayedFollowUps = filteredFollowUps.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedFollowUps.map((f: any) => f.uuid || f.id));
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
      "Land Details",
      "Owner Details",
      "Contact",
      "Scheduled Date",
      "Assigned To",
      "Status",
      "Note / Agenda",
    ];
    const rows = filteredFollowUps.map((f: any) => [
      `"${f.landDetails || f.leadTitle || ""}"`,
      `"${f.ownerDetails || f.owner || ""}"`,
      `"${f.contact || f.phone || ""}"`,
      `"${f.followUpDate || f.date || ""}"`,
      `"${f.assignedTo || f.assignee || ""}"`,
      `"${f.status || ""}"`,
      `"${f.note || f.notes || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `follow_ups_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* 1. Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Landowner Follow-Ups & Meeting Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Field visits, landowner appointments, document collection reminders, and task completion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingFollowUp(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Follow-Up Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Date From
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
              Date To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Universal Toolbar */}
        <LamsTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search parcel, landowner, phone, officer, agenda..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={() => {
            setSearchTerm("");
            setStatusFilter("ALL");
            setFromDate("");
            setToDate("");
          }}
          hasActiveFilters={
            Boolean(searchTerm) ||
            statusFilter !== "ALL" ||
            Boolean(fromDate) ||
            Boolean(toDate)
          }
        />
      </div>

      {/* 3. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={() => {
          if (confirm(`Are you sure you want to delete ${selectedIds.length} follow-up appointments?`)) {
            selectedIds.forEach((id) => onDeleteFollowUp?.(id));
            setSelectedIds([]);
          }
        }}
        onBulkStatusChange={(newStatus) => {
          selectedIds.forEach((id) =>
            onEditFollowUp?.(id, { status: newStatus as any })
          );
          setSelectedIds([]);
        }}
        statusOptions={[
          { label: "Pending", value: "Pending" },
          { label: "Completed", value: "Completed" },
          { label: "Rescheduled", value: "Rescheduled" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />

      {/* 4. Follow-Up Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedFollowUps.length === 0 ? (
          <LamsEmptyState
            title="No scheduled follow-up meetings"
            subtitle="Add a follow-up appointment or adjust filters to review scheduled dates."
            buttonText="Schedule Follow-Up"
            onAction={() => {
              setEditingFollowUp(null);
              setIsAddModalOpen(true);
            }}
            icon={CalendarCheck2}
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
                        displayedFollowUps.length > 0 &&
                        selectedIds.length === displayedFollowUps.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  {isColVisible("land") && <th className="py-3 px-3.5">Land Details</th>}
                  {isColVisible("owner") && <th className="py-3 px-3.5">Owner & Contact</th>}
                  {isColVisible("date") && <th className="py-3 px-3.5">Scheduled Date</th>}
                  {isColVisible("assigned") && <th className="py-3 px-3.5">Assigned Officer</th>}
                  {isColVisible("notes") && <th className="py-3 px-3.5">Agenda / Notes</th>}
                  {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedFollowUps.map((item: any) => {
                  const itemId = item.uuid || item.id;
                  const isSelected = selectedIds.includes(itemId);
                  const isExpanded = expandedId === itemId;
                  const isCompleted = item.status === "Completed";

                  return (
                    <React.Fragment key={itemId}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                          isSelected ? "bg-cyan-50/40 dark:bg-cyan-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(itemId)}
                            className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                          />
                        </td>

                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => toggleExpand(itemId)}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-100 hover:text-cyan-700 transition-all"
                            title={isExpanded ? "Collapse notes" : "Expand notes"}
                          >
                            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* Land Details */}
                        {isColVisible("land") && (
                          <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-100">
                            {item.landDetails || item.leadTitle || "Land Parcel"}
                          </td>
                        )}

                        {/* Owner & Contact */}
                        {isColVisible("owner") && (
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {item.ownerDetails || item.owner || "Landowner"}
                            </span>
                            {(item.contact || item.phone) && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {item.contact || item.phone}
                              </span>
                            )}
                          </td>
                        )}

                        {/* Date */}
                        {isColVisible("date") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                            {item.followUpDate || item.date}
                          </td>
                        )}

                        {/* Assigned */}
                        {isColVisible("assigned") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                            {item.assignedTo || item.assignee || "Field Team"}
                          </td>
                        )}

                        {/* Notes */}
                        {isColVisible("notes") && (
                          <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {item.note || item.notes || "N/A"}
                          </td>
                        )}

                        {/* Status */}
                        {isColVisible("status") && (
                          <td className="py-3 px-3.5 text-center">
                            <button
                              onClick={() => onToggleComplete?.(itemId)}
                              title="Click to toggle Complete/Pending"
                              className="inline-block"
                            >
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:ring-2 hover:ring-emerald-400"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-amber-600" />
                                )}
                                {item.status}
                              </span>
                            </button>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingFollowUp(item);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                              title="Edit Follow-Up"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm("Delete this follow-up appointment?")) {
                                  onDeleteFollowUp?.(itemId);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all"
                              title="Delete Appointment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row: Full Notes & Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                          <td colSpan={9} className="p-4 text-xs space-y-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                              Detailed Agenda & Minutes:
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 pl-5">
                              {item.note || item.notes || "No detailed agenda provided."}
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

      {/* 5. Add / Edit Modal */}
      <AddFollowUpModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingFollowUp(null);
        }}
        onAddFollowUp={(item) => {
          if (editingFollowUp && onEditFollowUp) {
            onEditFollowUp(editingFollowUp.uuid || editingFollowUp.id, item);
          } else {
            onAddFollowUp(item);
          }
          setIsAddModalOpen(false);
          setEditingFollowUp(null);
        }}
        editData={editingFollowUp}
        acquisitionLeads={acquisitionLeads}
      />
    </div>
  );
}
