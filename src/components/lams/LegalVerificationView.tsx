"use client";

import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Filter,
  FileText,
} from "lucide-react";
import { LegalVerification, AcquisitionLead } from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { AddLegalVerificationModal } from "./modals/AddLegalVerificationModal";

interface LegalVerificationViewProps {
  verifications: LegalVerification[];
  acquisitionLeads: AcquisitionLead[];
  initialOpenCreate?: boolean;
  onAddVerification?: (ver: any) => void;
  onEditVerification?: (uuid: string, ver: any) => void;
  onDeleteVerification?: (uuid: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead_code", label: "Lead Code", visible: true },
  { key: "lawyer", label: "Legal Counsel", visible: true },
  { key: "title_clear", label: "Title Clear", visible: true },
  { key: "mutation_ok", label: "Mutation OK", visible: true },
  { key: "tax_clear", label: "Tax Clear", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "verified_at", label: "Verified Date", visible: true },
];

export function LegalVerificationView({
  verifications = [],
  acquisitionLeads = [],
  initialOpenCreate = false,
  onAddVerification,
  onEditVerification,
  onDeleteVerification,
}: LegalVerificationViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [lawyerFilter, setLawyerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialOpenCreate));
  const [editingVerification, setEditingVerification] = useState<LegalVerification | null>(null);

  React.useEffect(() => {
    if (initialOpenCreate) {
      setIsModalOpen(true);
    }
  }, [initialOpenCreate]);

  const safeVerifications = Array.isArray(verifications) ? verifications : [];

  const uniqueLawyers = useMemo(() => {
    return Array.from(new Set(safeVerifications.map((v) => v.lawyer).filter(Boolean)));
  }, [safeVerifications]);

  const filteredVerifications = useMemo(() => {
    return safeVerifications.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.lead_code?.toLowerCase().includes(term) ||
        item.lawyer?.toLowerCase().includes(term) ||
        item.opinion?.toLowerCase().includes(term);

      const matchesLead = leadFilter === "ALL" || item.lead_code === leadFilter;
      const matchesLawyer = lawyerFilter === "ALL" || item.lawyer === lawyerFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesLead && matchesLawyer && matchesStatus;
    });
  }, [safeVerifications, searchTerm, leadFilter, lawyerFilter, statusFilter]);

  const displayedVerifications = filteredVerifications.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedVerifications.map((v) => v.uuid || v.id));
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
    const headers = ["Lead Code", "Lawyer", "Title Clear", "Mutation OK", "Tax Clear", "Status", "Verified At"];
    const rows = filteredVerifications.map((v) => [
      v.lead_code,
      `"${v.lawyer}"`,
      v.title_clear ? "Yes" : "No",
      v.mutation_ok ? "Yes" : "No",
      v.tax_clear ? "Yes" : "No",
      v.status,
      v.verified_at,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `legal_verifications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-4">
      {/* 1. Filter Bar (Filters: lead, status, lawyer) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Legal Verifications</span>
          </div>
          {(leadFilter !== "ALL" || lawyerFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setLeadFilter("ALL");
                setLawyerFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

          <select
            value={lawyerFilter}
            onChange={(e) => setLawyerFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Lawyers</option>
            {uniqueLawyers.map((adv) => (
              <option key={adv} value={adv}>{adv}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* 2. Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <LamsTableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search legal reports, lawyer, opinion..."
            entriesPerPage={entriesPerPage}
            onEntriesPerPageChange={setEntriesPerPage}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onExportCSV={handleExportCSV}
          />
        </div>

        <button
          onClick={() => {
            setEditingVerification(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Legal Title Check</span>
        </button>
      </div>

      {/* 3. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkExport={handleExportCSV}
        onBulkDelete={() => {
          if (confirm(`Delete ${selectedIds.length} selected legal check(s)?`)) {
            selectedIds.forEach((id) => onDeleteVerification?.(id));
            setSelectedIds([]);
          }
        }}
      />

      {/* 4. Legal Verification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={displayedVerifications.length > 0 && selectedIds.length === displayedVerifications.length}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {isColVisible("lead_code") && <th className="py-3 px-3.5">Lead Code</th>}
                {isColVisible("lawyer") && <th className="py-3 px-3.5">Lawyer</th>}
                {isColVisible("title_clear") && <th className="py-3 px-3.5 text-center">Title Clear</th>}
                {isColVisible("mutation_ok") && <th className="py-3 px-3.5 text-center">Mutation OK</th>}
                {isColVisible("tax_clear") && <th className="py-3 px-3.5 text-center">Tax Clear</th>}
                {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                {isColVisible("verified_at") && <th className="py-3 px-3.5">Verified Date</th>}
                <th className="py-3 px-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedVerifications.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <LamsEmptyState
                      icon={ShieldCheck}
                      title="No Legal Title Records Found"
                      description="Record advocate title search vetting, mutation verification, and Khajna clearance."
                      actionLabel="New Title Clearance"
                      onAction={() => {
                        setEditingVerification(null);
                        setIsModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                displayedVerifications.map((item) => {
                  const id = item.uuid || item.id;
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {isColVisible("lead_code") && (
                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {item.lead_code}
                        </td>
                      )}

                      {isColVisible("lawyer") && (
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {item.lawyer}
                        </td>
                      )}

                      {isColVisible("title_clear") && (
                        <td className="py-3 px-3.5 text-center">
                          {item.title_clear ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                              <XCircle className="w-4 h-4" /> No
                            </span>
                          )}
                        </td>
                      )}

                      {isColVisible("mutation_ok") && (
                        <td className="py-3 px-3.5 text-center">
                          {item.mutation_ok ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                              <XCircle className="w-4 h-4" /> No
                            </span>
                          )}
                        </td>
                      )}

                      {isColVisible("tax_clear") && (
                        <td className="py-3 px-3.5 text-center">
                          {item.tax_clear ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                              <XCircle className="w-4 h-4" /> No
                            </span>
                          )}
                        </td>
                      )}

                      {isColVisible("status") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={item.status} />
                        </td>
                      )}

                      {isColVisible("verified_at") && (
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                          {item.verified_at}
                        </td>
                      )}

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingVerification(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Legal Verification"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete legal vetting record for ${item.lead_code}?`)) {
                                onDeleteVerification?.(id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Record"
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
      <AddLegalVerificationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVerification(null);
        }}
        onSave={(data) => {
          if (editingVerification) {
            onEditVerification?.(editingVerification.uuid || editingVerification.id, data);
          } else {
            onAddVerification?.(data);
          }
        }}
        acquisitionLeads={acquisitionLeads}
        initialData={editingVerification}
      />
    </div>
  );
}
