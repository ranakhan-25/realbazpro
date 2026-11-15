"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  PlusCircle,
  Eye,
  Trash2,
  Filter,
  RotateCcw,
  Pencil,
  X,
  Check,
  ArrowRight,
  CheckCircle,
  XCircle,
  Compass,
  FileSpreadsheet,
  Layers,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  AcquisitionLead,
  LandOwner,
  LandValuation,
  LegalVerification,
  DueDiligenceRecord,
  NegotiationRecord,
  AcquisitionApproval,
  SettlementRecord,
  LegalDocument,
} from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { LeadDetailModal } from "./LeadDetailModal";
import { AdvanceStageRemarksModal } from "./modals/AdvanceStageRemarksModal";

interface AcquisitionLeadsViewProps {
  leads: AcquisitionLead[];
  landOwners?: LandOwner[];
  valuations?: LandValuation[];
  legalVerifications?: LegalVerification[];
  dueDiligenceRecords?: DueDiligenceRecord[];
  negotiations?: NegotiationRecord[];
  approvals?: AcquisitionApproval[];
  settlements?: SettlementRecord[];
  documents?: LegalDocument[];
  initialOpenCreate?: boolean;
  selectedLeadId?: string;
  initialDetailTab?: string;
  onAddLead?: (lead: any) => void;
  onEditLead?: (uuid: string, data: any) => void;
  onDeleteLead?: (uuid: string) => void;
  onAdvanceStage?: (leadId: string, nextStage: string, remarks: string) => void;
  onQualifyLead?: (leadId: string) => void;
  onRejectLead?: (leadId: string, remarks: string) => void;
  onPaySettlement?: (payment: any) => void;
}

const STATUSES = [
  "Draft",
  "Submitted",
  "Qualified",
  "In Negotiation",
  "Approved",
  "Rejected",
  "Purchased",
];

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "code", label: "Lead Code", visible: true },
  { key: "location", label: "Location / Mouza", visible: true },
  { key: "area_katha", label: "Area (Katha / Dec)", visible: true },
  { key: "owner_name", label: "Owner Info", visible: true },
  { key: "asking_price", label: "Asking Price", visible: true },
  { key: "source", label: "Source", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "assignee", label: "Assignee", visible: true },
  { key: "created_at", label: "Created Date", visible: true },
];

export function AcquisitionLeadsView({
  leads = [],
  landOwners = [],
  valuations = [],
  legalVerifications = [],
  dueDiligenceRecords = [],
  negotiations = [],
  approvals = [],
  settlements = [],
  documents = [],
  initialOpenCreate = false,
  selectedLeadId,
  initialDetailTab,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onAdvanceStage,
  onQualifyLead,
  onRejectLead,
  onPaySettlement,
}: AcquisitionLeadsViewProps) {
  // Filter & Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form Wizard Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(Boolean(initialOpenCreate));
  const [editingLead, setEditingLead] = useState<any>(null);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    mouza: "",
    khatian_no: "",
    dag_no: "",
    area_katha: "",
    area_sqft: "",
    source: "",
    owner_name: "",
    owner_phone: "",
    owner_nid: "",
    owner_email: "",
    owner_address: "",
    owner_bank_name: "",
    owner_bank_account: "",
    asking_price: "",
    notes: "",
    owner_id: "",
    assigned_to: "",
    priority: "",
  });

  React.useEffect(() => {
    if (initialOpenCreate) {
      setIsFormModalOpen(true);
    }
  }, [initialOpenCreate]);

  const safeLeads = Array.isArray(leads) ? leads : [];
  const sourceOptions = useMemo(
    () => Array.from(new Set(safeLeads.map((lead) => lead?.source ?? lead?.leadSource).filter(Boolean))),
    [safeLeads],
  );
  const userOptions = useMemo(
    () => Array.from(new Set(safeLeads.map((lead) => lead?.assignee ?? lead?.assignedUser).filter(Boolean))),
    [safeLeads],
  );

  // Comprehensive Detail Modal State
  const [detailModalLead, setDetailModalLead] = useState<AcquisitionLead | null>(null);

  React.useEffect(() => {
    if (selectedLeadId && safeLeads.length > 0) {
      const found = safeLeads.find(
        (l: any) =>
          (l.uuid || l.id) === selectedLeadId ||
          l.leadCode === selectedLeadId ||
          l.code === selectedLeadId
      );
      if (found) {
        setDetailModalLead(found);
      }
    }
  }, [selectedLeadId, safeLeads]);

  // Advance / Reject Remarks Modal State
  const [remarksModalLead, setRemarksModalLead] = useState<AcquisitionLead | null>(null);
  const [remarksModalAction, setRemarksModalAction] = useState<"advance" | "reject">("advance");

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
    setUserFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  const filteredLeads = useMemo(() => {
    return safeLeads.filter((lead) => {
      const l = lead as any;
      const codeStr = l.code || l.leadCode || l.lead_code || "";
      const locStr = l.location || l.mouza || "";
      const ownerStr = l.owner_name || l.ownerName || l.owner || "";

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        codeStr.toLowerCase().includes(term) ||
        locStr.toLowerCase().includes(term) ||
        ownerStr.toLowerCase().includes(term);

      const statusVal = l.status || l.leadStage || "Draft";
      const matchesStatus = statusFilter === "ALL" || statusVal === statusFilter;

      const sourceVal = l.source || "";
      const matchesSource = sourceFilter === "ALL" || sourceVal === sourceFilter;

      const userVal = l.assignee || l.assignedUser || l.assigned_to || "";
      const matchesUser = userFilter === "ALL" || userVal === userFilter;

      let matchesDate = true;
      if (fromDate && l.created_at && l.created_at < fromDate) matchesDate = false;
      if (toDate && l.created_at && l.created_at > toDate) matchesDate = false;

      return matchesSearch && matchesStatus && matchesSource && matchesUser && matchesDate;
    });
  }, [safeLeads, searchTerm, statusFilter, sourceFilter, userFilter, fromDate, toDate]);

  const displayedLeads = filteredLeads.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedLeads.map((l: any) => l.uuid || l.id));
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
      "Code",
      "Title / Location",
      "Mouza",
      "Khatian No",
      "Dag No",
      "Area (Katha)",
      "Owner",
      "Owner Phone",
      "Asking Price (BDT)",
      "Source",
      "Status",
      "Assignee",
    ];
    const rows = filteredLeads.map((l: any) => [
      `"${l.code || l.leadCode || l.lead_code || ""}"`,
      `"${l.location || l.title || ""}"`,
      `"${l.mouza || ""}"`,
      `"${l.khatian_no || ""}"`,
      `"${l.dag_no || ""}"`,
      l.area_katha || l.landArea || "",
      `"${l.owner_name || l.ownerName || l.owner || ""}"`,
      `"${l.owner_phone || l.ownerPhone || ""}"`,
      l.asking_price || l.expectedPrice || "",
      `"${l.source || ""}"`,
      `"${l.status || l.leadStage || ""}"`,
      `"${l.assignee || l.assignedUser || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `acquisition_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Form
  const openForm = (lead?: any) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        title: lead.title || lead.lead_code || "",
        location: lead.location || "",
        mouza: lead.mouza || "",
        khatian_no: lead.khatian_no || "",
        dag_no: lead.dag_no || "",
        area_katha: String(lead.area_katha || lead.landArea || ""),
        area_sqft: String(lead.area_sqft || ""),
        source: lead.source || "",
        owner_name: lead.owner_name || lead.ownerName || lead.owner || "",
        owner_phone: lead.owner_phone || lead.ownerPhone || "",
        owner_nid: lead.owner_nid || "",
        owner_email: lead.owner_email || lead.email || "",
        owner_address: lead.owner_address || lead.address || "",
        owner_bank_name: lead.owner_bank_name || lead.bank_name || "",
        owner_bank_account: lead.owner_bank_account || lead.bank_account || "",
        asking_price: String(lead.asking_price || lead.expectedPrice || ""),
        notes: lead.notes || "",
        owner_id: lead.owner_id || "",
        assigned_to: lead.assignee || lead.assignedUser || "",
        priority: lead.priority || "",
      });
    } else {
      setEditingLead(null);
      setFormData({
        title: "",
        location: "",
        mouza: "",
        khatian_no: "",
        dag_no: "",
        area_katha: "",
        area_sqft: "",
        source: "",
        owner_name: "",
        owner_phone: "",
        owner_nid: "",
        owner_email: "",
        owner_address: "",
        owner_bank_name: "",
        owner_bank_account: "",
        asking_price: "",
        notes: "",
        owner_id: "",
        assigned_to: "",
        priority: "",
      });
    }
    setFormStep(1);
    setIsFormModalOpen(true);
  };

  // Submit Form
  const handleFormSubmit = (status: "Draft" | "Submitted") => {
    const payload = {
      ...formData,
      status,
      landArea: Number(formData.area_katha) || 0,
      asking_price: Number(formData.asking_price) || 0,
    };
    if (editingLead && onEditLead) {
      onEditLead(editingLead.uuid || editingLead.id, payload);
    } else if (onAddLead) {
      onAddLead(payload);
    }
    setIsFormModalOpen(false);
    setEditingLead(null);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-6">
      {/* 1. Header with Main CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Land Acquisition Leads
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sourced land leads, landowner references, mouza/khatian info, and valuation transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Acquisition Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Lead Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Source filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Lead Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Sources</option>
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Assigned Officer
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All Assignees</option>
              {userOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Created From
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
              Created To
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
          searchPlaceholder="Search lead code, mouza, landowner name..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={resetFilters}
          hasActiveFilters={
            Boolean(searchTerm) ||
            statusFilter !== "ALL" ||
            sourceFilter !== "ALL" ||
            userFilter !== "ALL" ||
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
          if (confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) {
            selectedIds.forEach((id) => onDeleteLead?.(id));
            setSelectedIds([]);
          }
        }}
        onBulkStatusChange={(newStatus) => {
          selectedIds.forEach((id) =>
            onEditLead?.(id, { status: newStatus as any })
          );
          setSelectedIds([]);
        }}
        statusOptions={[
          "Draft",
          "Submitted",
          "Qualified",
          "In Negotiation",
          "Approved",
          "Rejected",
        ]}
      />

      {/* 4. Leads Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedLeads.length === 0 ? (
          <LamsEmptyState
            title="No acquisition leads found"
            description="Create your first land lead or modify filter criteria to view properties."
            actionLabel="Create Acquisition Lead"
            onAction={() => openForm()}
            icon={Compass}
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
                        displayedLeads.length > 0 &&
                        selectedIds.length === displayedLeads.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  {isColVisible("code") && <th className="py-3 px-3.5">Code</th>}
                  {isColVisible("location") && <th className="py-3 px-3.5">Location / Mouza</th>}
                  {isColVisible("area_katha") && <th className="py-3 px-3.5 text-right">Area</th>}
                  {isColVisible("owner_name") && <th className="py-3 px-3.5">Owner Info</th>}
                  {isColVisible("asking_price") && <th className="py-3 px-3.5 text-right">Asking Price</th>}
                  {isColVisible("source") && <th className="py-3 px-3.5">Source</th>}
                  {isColVisible("status") && <th className="py-3 px-3.5 text-center">Status</th>}
                  {isColVisible("assignee") && <th className="py-3 px-3.5">Assignee</th>}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedLeads.map((lead: any, idx: number) => {
                  const leadId = lead.uuid || lead.id || `lead-${idx}`;
                  const isSelected = selectedIds.includes(leadId);
                  const statusKey = lead.lead_status || lead.status || lead.leadStage || "Draft";
                  const code = lead.lead_code || lead.leadCode || lead.code || lead.title || `AL-${idx + 1}`;
                  const area = lead.area_katha || lead.areaKatha || lead.landArea || 0;
                  const asking = lead.asking_price || lead.askingPrice || lead.expectedPrice || 0;
                  return (
                    <tr
                      key={leadId}
                      className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                        isSelected ? "bg-cyan-50/40 dark:bg-cyan-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(leadId)}
                          className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>

                      {/* Code */}
                      {isColVisible("code") && (
                        <td className="py-3 px-3.5">
                          <button
                            onClick={() => setDetailModalLead(lead)}
                            className="font-mono font-bold text-cyan-700 dark:text-cyan-400 hover:underline"
                          >
                            {code}
                          </button>
                        </td>
                      )}

                      {/* Location */}
                      {isColVisible("location") && (
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                            {lead.location || lead.mouza || "—"}
                          </span>
                          {lead.khatian_no && (
                            <span className="text-[10px] text-slate-400 block">
                              Kh: {lead.khatian_no || "—"} • Dag: {lead.dag_no || "—"}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Area */}
                      {isColVisible("area_katha") && (
                        <td className="py-3 px-3.5 text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {area} Katha
                          </span>
                        </td>
                      )}

                      {/* Owner */}
                      {isColVisible("owner_name") && (
                        <td className="py-3 px-3.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {lead.owner_name || lead.ownerName || lead.owner || "—"}
                          </span>
                          {(lead.owner_phone || lead.ownerPhone) && (
                            <span className="text-[10px] text-slate-400">
                              {lead.owner_phone || lead.ownerPhone}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Asking Price */}
                      {isColVisible("asking_price") && (
                        <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                          ৳ {Number(asking).toLocaleString()}
                        </td>
                      )}

                      {/* Source */}
                      {isColVisible("source") && (
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                          {lead.source || "—"}
                        </td>
                      )}

                      {/* Status */}
                      {isColVisible("status") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={statusKey} />
                        </td>
                      )}

                      {/* Assignee */}
                      {isColVisible("assignee") && (
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {lead.assignee || lead.assignedUser || "—"}
                        </td>
                      )}

                      {/* Created Date */}
                      {isColVisible("created_at") && (
                        <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {lead.created_at || (lead as any).createdAt || "Not found"}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModalLead(lead)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 transition-all"
                            title="View Complete Lead Details & Tabs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openForm(lead)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                            title="Edit Lead"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {statusKey === "Suspended" ? (
                            <button
                              onClick={() => onEditLead?.(leadId, { status: "Active" })}
                              className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 transition-all"
                              title="Activate Lead"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onEditLead?.(leadId, { status: "Suspended" })}
                              className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-600 transition-all"
                              title="Suspend Lead"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {statusKey !== "Qualified" && statusKey !== "Purchased" && (
                            <button
                              onClick={() => onQualifyLead?.(leadId)}
                              className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 transition-all"
                              title="Qualify Lead"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setRemarksModalLead(lead);
                              setRemarksModalAction("advance");
                            }}
                            className="p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-cyan-600 transition-all"
                            title="Advance Workflow Stage"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete lead "${code}"?`)) {
                                onDeleteLead?.(leadId);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all"
                            title="Delete Lead"
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

      {/* 5. Create / Edit 3-Step Wizard Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-600" />
                {editingLead ? "Edit Acquisition Lead" : "Create New Acquisition Lead"}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Step Indicator */}
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                {[
                  { s: 1, title: "Property & Land" },
                  { s: 2, title: "Landowner Info" },
                  { s: 3, title: "Assignment & Submission" },
                ].map(({ s, title }) => (
                  <div
                    key={s}
                    className={`flex items-center gap-2 font-bold text-xs ${
                      formStep === s
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        formStep === s
                          ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {formStep > s ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                    <span>{title}</span>
                  </div>
                ))}
              </div>

              {/* Step 1: Property & Land Info */}
              {formStep === 1 && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Lead Title / Reference *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttara Sector 18 Commercial Plot"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Location / Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttara Sector 18, Dhaka"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Mouza Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Badda / Uttara"
                      value={formData.mouza}
                      onChange={(e) => setFormData({ ...formData, mouza: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Khatian No
                    </label>
                    <input
                      type="text"
                      placeholder="CS/SA/RS/City Khatian"
                      value={formData.khatian_no}
                      onChange={(e) => setFormData({ ...formData, khatian_no: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Dag No (Plot)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 504 / 889"
                      value={formData.dag_no}
                      onChange={(e) => setFormData({ ...formData, dag_no: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Area (Katha) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.5"
                      value={formData.area_katha}
                      onChange={(e) => {
                        const val = e.target.value;
                        const katha = parseFloat(val) || 0;
                        setFormData({
                          ...formData,
                          area_katha: val,
                          area_sqft: katha ? (katha * 720).toFixed(0) : formData.area_sqft,
                        });
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Area (SqFt)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 11160"
                      value={formData.area_sqft}
                      onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Asking Price (BDT)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50000000"
                      value={formData.asking_price}
                      onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Source *
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Select Sourcing Channel</option>
                      {sourceOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Landowner Info */}
              {formStep === 2 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Link Existing Landowner
                    </label>
                    <select
                      value={formData.owner_id}
                      onChange={(e) => {
                        const owner = landOwners.find((o) => (o.uuid || o.id) === e.target.value);
                        if (owner) {
                          setFormData({
                            ...formData,
                            owner_id: owner.uuid || owner.id,
                            owner_name: owner.name || owner.ownerName || "",
                            owner_phone: owner.phone,
                            owner_nid: owner.nid || "",
                          });
                        } else {
                          setFormData({ ...formData, owner_id: e.target.value });
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Select Existing Landowner Profile</option>
                      {landOwners.map((o) => (
                        <option key={o.uuid || o.id} value={o.uuid || o.id}>
                          {o.name} ({o.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-center text-slate-400 font-bold text-[11px]">
                    -- OR CREATE NEW OWNER DETAILS --
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Landowner Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Owner Full Name"
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Contact Phone *
                      </label>
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={formData.owner_phone}
                        onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        NID (10-17 Digits)
                      </label>
                      <input
                        type="text"
                        placeholder="National ID"
                        value={formData.owner_nid}
                        onChange={(e) => setFormData({ ...formData, owner_nid: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="owner@example.com"
                        value={formData.owner_email}
                        onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Owner Address
                      </label>
                      <textarea
                        rows={2}
                        placeholder="House, Road, Area, District"
                        value={formData.owner_address}
                        onChange={(e) => setFormData({ ...formData, owner_address: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. City Bank Ltd."
                        value={formData.owner_bank_name}
                        onChange={(e) => setFormData({ ...formData, owner_bank_name: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1102938481001"
                        value={formData.owner_bank_account}
                        onChange={(e) => setFormData({ ...formData, owner_bank_account: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Assignment & Submission */}
              {formStep === 3 && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Assign To Officer
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Select Assignee</option>
                      {userOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Critical">Critical Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Notes & Observations
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Add any initial observations or inspection notes..."
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
              <button
                disabled={formStep === 1}
                onClick={() => setFormStep(formStep - 1)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {formStep < 3 ? (
                  <button
                    onClick={() => setFormStep(formStep + 1)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20"
                  >
                    Next Step
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleFormSubmit("Draft")}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleFormSubmit("Submitted")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                    >
                      Submit Lead
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Comprehensive 10-Tab Detail Modal */}
      <LeadDetailModal
        isOpen={Boolean(detailModalLead)}
        onClose={() => setDetailModalLead(null)}
        lead={detailModalLead}
        initialTab={initialDetailTab}
        valuations={valuations}
        legalVerifications={legalVerifications}
        dueDiligenceRecords={dueDiligenceRecords}
        negotiations={negotiations}
        approvals={approvals}
        settlements={settlements}
        documents={documents}
        onQualify={(id) => {
          onQualifyLead?.(id);
          setDetailModalLead(null);
        }}
        onReject={(id, remarks) => {
          onRejectLead?.(id, remarks);
          setDetailModalLead(null);
        }}
        onAdvance={(id, nextStage, remarks) => {
          onAdvanceStage?.(id, nextStage, remarks);
          setDetailModalLead(null);
        }}
        onPaySettlement={onPaySettlement}
      />

      {/* 7. Advance / Reject Remarks Modal */}
      {remarksModalLead && (
        <AdvanceStageRemarksModal
          isOpen={Boolean(remarksModalLead)}
          onClose={() => setRemarksModalLead(null)}
          leadCode={remarksModalLead.leadCode || remarksModalLead.code || remarksModalLead.title || "LEAD"}
          currentStage={remarksModalLead.status || remarksModalLead.leadStage || "Draft"}
          targetStage={remarksModalAction === "reject" ? "Rejected" : "Qualified"}
          isReject={remarksModalAction === "reject"}
          onConfirm={(remarks: string) => {
            if (remarksModalAction === "advance") {
              onAdvanceStage?.(remarksModalLead.uuid || remarksModalLead.id, "Qualified", remarks);
            } else {
              onRejectLead?.(remarksModalLead.uuid || remarksModalLead.id, remarks);
            }
            setRemarksModalLead(null);
          }}
        />
      )}
    </div>
  );
}
