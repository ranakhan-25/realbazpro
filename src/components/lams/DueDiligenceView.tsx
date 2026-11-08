"use client";

import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  ClipboardCheck,
  Download,
  FileText,
  CheckCircle,
} from "lucide-react";
import { DueDiligenceRecord, AcquisitionLead } from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { AddDueDiligenceModal } from "./modals/AddDueDiligenceModal";

interface DueDiligenceViewProps {
  records: DueDiligenceRecord[];
  acquisitionLeads: AcquisitionLead[];
  onAddRecord?: (rec: any) => void;
  onEditRecord?: (uuid: string, rec: any) => void;
  onDeleteRecord?: (uuid: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead", label: "Lead Code", visible: true },
  { key: "checklist_items", label: "Checklist Items #", visible: true },
  { key: "completed", label: "Completed #", visible: true },
  { key: "score", label: "Due Diligence Score", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "report", label: "Survey Report", visible: true },
];

export function DueDiligenceView({
  records = [],
  acquisitionLeads = [],
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
}: DueDiligenceViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DueDiligenceRecord | null>(null);

  const safeRecords = Array.isArray(records) ? records : [];

  const filteredRecords = useMemo(() => {
    return safeRecords.filter((rec) => {
      const term = searchTerm.toLowerCase();
      const leadKey = rec.lead || rec.lead_code || "";
      const matchesSearch = !term || leadKey.toLowerCase().includes(term) || rec.status?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeRecords, searchTerm, statusFilter]);

  const displayedRecords = filteredRecords.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedRecords.map((r) => r.uuid || r.id));
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
    const headers = ["Lead", "Checklist Items", "Completed", "Score (%)", "Status", "Report"];
    const rows = filteredRecords.map((r) => [
      r.lead || r.lead_code,
      r.checklist_items_count,
      r.completed_count,
      `${r.score}%`,
      r.status,
      r.report || "N/A",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `due_diligence_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-4">
      {/* 1. Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <LamsTableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search due diligence surveys by lead..."
            entriesPerPage={entriesPerPage}
            onEntriesPerPageChange={setEntriesPerPage}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onExportCSV={handleExportCSV}
          />
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shrink-0 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Due Diligence</span>
        </button>
      </div>

      {/* 2. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkExport={handleExportCSV}
        onBulkDelete={() => {
          if (confirm(`Delete ${selectedIds.length} selected survey record(s)?`)) {
            selectedIds.forEach((id) => onDeleteRecord?.(id));
            setSelectedIds([]);
          }
        }}
      />

      {/* 3. Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={displayedRecords.length > 0 && selectedIds.length === displayedRecords.length}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                </th>
                {isColVisible("lead") && <th className="py-3 px-3.5">Lead</th>}
                {isColVisible("checklist_items") && <th className="py-3 px-3.5">Checklist Items #</th>}
                {isColVisible("completed") && <th className="py-3 px-3.5">Completed #</th>}
                {isColVisible("score") && <th className="py-3 px-3.5">Score</th>}
                {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                {isColVisible("report") && <th className="py-3 px-3.5">Report</th>}
                <th className="py-3 px-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <LamsEmptyState
                      icon={ClipboardCheck}
                      title="No Technical Due Diligence Records"
                      description="Create a survey assessment covering physical road access, soil testing, utility feasibility, and boundary pillars."
                      actionLabel="New Due Diligence"
                      onAction={() => {
                        setEditingRecord(null);
                        setIsModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                displayedRecords.map((item) => {
                  const id = item.uuid || item.id;
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? "bg-teal-50/40 dark:bg-teal-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                      </td>

                      {isColVisible("lead") && (
                        <td className="py-3 px-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">
                          {item.lead || item.lead_code}
                        </td>
                      )}

                      {isColVisible("checklist_items") && (
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {item.checklist_items_count} checks
                        </td>
                      )}

                      {isColVisible("completed") && (
                        <td className="py-3 px-3.5 font-semibold text-emerald-600">
                          {item.completed_count} verified
                        </td>
                      )}

                      {isColVisible("score") && (
                        <td className="py-3 px-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs ${
                              item.score >= 80
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : item.score >= 50
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {item.score}%
                          </span>
                        </td>
                      )}

                      {isColVisible("status") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={item.status} />
                        </td>
                      )}

                      {isColVisible("report") && (
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            {item.report || "survey_sheet.pdf"}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRecord(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit Survey Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete survey record for ${item.lead}?`)) {
                                onDeleteRecord?.(id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Survey"
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

      {/* Modal */}
      <AddDueDiligenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={(data) => {
          if (editingRecord) {
            onEditRecord?.(editingRecord.uuid || editingRecord.id, data);
          } else {
            onAddRecord?.(data);
          }
        }}
        acquisitionLeads={acquisitionLeads}
        initialData={editingRecord}
      />
    </div>
  );
}
