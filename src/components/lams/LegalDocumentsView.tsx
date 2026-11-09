"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  FileUp,
  FileText,
  FileCheck2,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  Pencil,
  PlusCircle,
  FolderOpen,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { LegalDocument, AcquisitionLead, VerificationStatus } from "@/types/lams";
import { AddLegalDocumentModal } from "./modals/AddLegalDocumentModal";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";

interface LegalDocumentsViewProps {
  documents: LegalDocument[];
  onEditDocument?: (uuid: string, data: any) => void;
  onAddDocument: (doc: LegalDocument) => void;
  onDeleteDocument: (uuid: string) => void;
  acquisitionLeads: AcquisitionLead[];
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead", label: "Lead / Parcel", visible: true },
  { key: "category", label: "Document Category", visible: true },
  { key: "title", label: "Document Title / File", visible: true },
  { key: "version", label: "Version", visible: true },
  { key: "verified_by", label: "Verified By", visible: true },
  { key: "uploaded_at", label: "Verification Date", visible: true },
  { key: "status", label: "Vetting Status", visible: true },
];

export function LegalDocumentsView({
  documents = [],
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  acquisitionLeads = [],
}: LegalDocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);

  const safeDocs = Array.isArray(documents) ? documents : [];

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(safeDocs.map((d: any) => d.documentType || d.category).filter(Boolean)));
  }, [safeDocs]);

  // Filtering
  const filteredDocs = useMemo(() => {
    return safeDocs.filter((doc: any) => {
      const term = searchTerm.toLowerCase();
      const title = doc.leadTitle || doc.lead || "";
      const docType = doc.documentType || doc.category || "";
      const fileName = doc.documentFileName || doc.title || doc.file_name || "";
      const verifier = doc.verifiedBy || doc.uploaded_by || "";
      const leadId = doc.acquisitionLeadId || doc.lead_id || "";
      const status = doc.verificationStatus || doc.status || "";

      const matchesSearch =
        !term ||
        title.toLowerCase().includes(term) ||
        docType.toLowerCase().includes(term) ||
        fileName.toLowerCase().includes(term) ||
        verifier.toLowerCase().includes(term);

      const matchesLead = leadFilter === "ALL" || leadId === leadFilter || title === leadFilter;
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || docType === categoryFilter;

      return matchesSearch && matchesLead && matchesStatus && matchesCategory;
    });
  }, [safeDocs, searchTerm, leadFilter, statusFilter, categoryFilter]);

  const displayedDocs = filteredDocs.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedDocs.map((d: any) => d.uuid || d.id));
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
      "Lead Parcel",
      "Document Category",
      "File / Document Name",
      "Version",
      "Verified By",
      "Date",
      "Vetting Status",
      "Remarks",
    ];
    const rows = filteredDocs.map((d: any) => [
      `"${d.leadTitle || d.lead || ""}"`,
      `"${d.documentType || d.category || ""}"`,
      `"${d.documentFileName || d.title || ""}"`,
      d.version || "v1.0",
      `"${d.verifiedBy || d.uploaded_by || ""}"`,
      `"${d.verificationDate || d.uploaded_at || ""}"`,
      `"${d.verificationStatus || d.status || ""}"`,
      `"${d.remarks || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `legal_documents_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <FolderOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Land Legal Documents & Title Deeds Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            CS/SA/RS Parcha, Mutation DCRs, Baya Deeds, Non-Encumbrance Certs (NEC), and Lawyer Vetting Notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingDocument(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Title Document</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option key={l.id || l.uuid} value={l.id || l.uuid}>
                  {l.lead_code || l.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Document Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Vetting Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Discrepancy Found">Discrepancy Found</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Universal Toolbar */}
        <LamsTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search document category, file name, lawyer, lead..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={() => {
            setSearchTerm("");
            setLeadFilter("ALL");
            setStatusFilter("ALL");
            setCategoryFilter("ALL");
          }}
          hasActiveFilters={
            Boolean(searchTerm) ||
            leadFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            categoryFilter !== "ALL"
          }
        />
      </div>

      {/* 3. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={() => {
          if (confirm(`Are you sure you want to delete ${selectedIds.length} legal documents?`)) {
            selectedIds.forEach((id) => onDeleteDocument?.(id));
            setSelectedIds([]);
          }
        }}
        onBulkStatusChange={(newStatus) => {
          selectedIds.forEach((id) =>
            onEditDocument?.(id, { verificationStatus: newStatus as any })
          );
          setSelectedIds([]);
        }}
        statusOptions={[
          { label: "Verified", value: "Verified" },
          { label: "Under Review", value: "Under Review" },
          { label: "Discrepancy Found", value: "Discrepancy Found" },
          { label: "Pending", value: "Pending" },
        ]}
      />

      {/* 4. Documents Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedDocs.length === 0 ? (
          <LamsEmptyState
            title="No title documents found"
            subtitle="Upload deeds, khatian copies, or NEC certificates to establish legal chain of title."
            buttonText="Upload Title Document"
            onAction={() => {
              setEditingDocument(null);
              setIsAddModalOpen(true);
            }}
            icon={FolderOpen}
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
                        displayedDocs.length > 0 &&
                        selectedIds.length === displayedDocs.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  {isColVisible("lead") && <th className="py-3 px-3.5">Lead / Parcel</th>}
                  {isColVisible("category") && <th className="py-3 px-3.5">Document Category</th>}
                  {isColVisible("title") && <th className="py-3 px-3.5">File & Name</th>}
                  {isColVisible("version") && <th className="py-3 px-3.5 text-center">Version</th>}
                  {isColVisible("verified_by") && <th className="py-3 px-3.5">Verified By</th>}
                  {isColVisible("uploaded_at") && <th className="py-3 px-3.5">Vetting Date</th>}
                  {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              ) : (
                displayedDocs.map((doc, idx) => {
                  const docId = doc.uuid || doc.id || `doc-${idx}`;
                  const isExpanded = expandedId === docId;
                  const statusInfo = STATUS_BADGES[doc.verificationStatus as VerificationStatus] || { bg: "bg-slate-100 text-slate-800", text: "text-slate-700", icon: AlertCircle };
                  const StatusIcon = statusInfo.icon;

                  return (
                    <React.Fragment key={docId}>
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
                            onClick={() => toggleExpand(docId)}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-all font-bold"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* Lead */}
                        {isColVisible("lead") && (
                          <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-100">
                            {item.leadTitle || item.lead || "Acquisition Lead"}
                          </td>
                        )}

                        {/* Category */}
                        {isColVisible("category") && (
                          <td className="py-3 px-3.5 font-semibold text-slate-700 dark:text-slate-300">
                            {item.documentType || item.category || "Deed / Parcha"}
                          </td>
                        )}

                        {/* Title / File */}
                        {isColVisible("title") && (
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 font-medium text-cyan-700 dark:text-cyan-400">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{fileName}</span>
                            </div>
                          </td>
                        )}

                        {/* Version */}
                        {isColVisible("version") && (
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                              {version}
                            </span>
                          </td>
                        )}

                        {/* Verified By */}
                        {isColVisible("verified_by") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                            {item.verifiedBy || item.uploaded_by || "Legal Panel"}
                          </td>
                        )}

                        {/* Uploaded At */}
                        {isColVisible("uploaded_at") && (
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {item.verificationDate || item.uploaded_at || "Recent"}
                          </td>
                        )}

                        {/* Status */}
                        {isColVisible("status") && (
                          <td className="py-3 px-3.5 text-center">
                            <LamsStatusBadge status={statusKey} type="legal" />
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingDocument(item);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                              title="Edit Document Info"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteDocument(docId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable remarks */}
                      {isExpanded && (
                        <tr className="bg-cyan-50/20 dark:bg-cyan-950/10">
                          <td colSpan={10} className="p-4 text-xs space-y-2 border-b border-cyan-100 dark:border-cyan-900/40">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                              Lawyer Vetting Notes & Remarks:
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 pl-5">
                              {item.remarks || "All legal checks verified against Sub-Registry records. Clean chain of title."}
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
      <AddLegalDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDocument(null);
        }}
        onAddDocument={(doc) => {
          if (editingDocument && onEditDocument) {
            onEditDocument(editingDocument.uuid || editingDocument.id, doc);
          } else {
            onAddDocument(doc);
          }
          setIsAddModalOpen(false);
          setEditingDocument(null);
        }}
        editData={editingDocument}
        acquisitionLeads={acquisitionLeads}
      />
    </div>
  );
}
