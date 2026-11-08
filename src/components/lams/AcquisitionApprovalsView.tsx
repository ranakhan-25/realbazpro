"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Filter,
  CheckCheck,
  RotateCcw,
  Clock,
  UserCheck,
} from "lucide-react";
import { AcquisitionApproval } from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { ApprovalActionModal } from "./modals/ApprovalActionModal";

interface AcquisitionApprovalsViewProps {
  approvals: AcquisitionApproval[];
  onActionApproval?: (uuid: string, decision: "approved" | "rejected", comment?: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "lead", label: "Lead Code", visible: true },
  { key: "level", label: "Approval Level", visible: true },
  { key: "approver", label: "Approver", visible: true },
  { key: "decision", label: "Decision", visible: true },
  { key: "comment", label: "Comments", visible: true },
  { key: "decided_at", label: "Decided Date", visible: true },
];

export function AcquisitionApprovalsView({
  approvals = [],
  onActionApproval,
}: AcquisitionApprovalsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [approverFilter, setApproverFilter] = useState("ALL");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actioningApproval, setActioningApproval] = useState<AcquisitionApproval | null>(null);

  const safeApprovals = Array.isArray(approvals) ? approvals : [];

  const uniqueApprovers = useMemo(() => {
    return Array.from(new Set(safeApprovals.map((a) => a.approver).filter(Boolean)));
  }, [safeApprovals]);

  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(safeApprovals.map((a) => a.level).filter(Boolean)));
  }, [safeApprovals]);

  const filteredApprovals = useMemo(() => {
    return safeApprovals.filter((item) => {
      const term = searchTerm.toLowerCase();
      const leadKey = item.lead || item.lead_code || "";
      const matchesSearch =
        !term ||
        leadKey.toLowerCase().includes(term) ||
        item.approver.toLowerCase().includes(term) ||
        item.comment?.toLowerCase().includes(term);

      const matchesLevel = levelFilter === "ALL" || item.level === levelFilter;
      const matchesDecision = decisionFilter === "ALL" || item.decision === decisionFilter;
      const matchesApprover = approverFilter === "ALL" || item.approver === approverFilter;

      return matchesSearch && matchesLevel && matchesDecision && matchesApprover;
    });
  }, [safeApprovals, searchTerm, levelFilter, decisionFilter, approverFilter]);

  const displayedApprovals = filteredApprovals.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedApprovals.map((a) => a.uuid || a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-4">
      {/* 1. Filter Bar (Filters: level, decision, approver) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filter Approval Requests</span>
          </div>
          {(levelFilter !== "ALL" || decisionFilter !== "ALL" || approverFilter !== "ALL") && (
            <button
              onClick={() => {
                setLevelFilter("ALL");
                setDecisionFilter("ALL");
                setApproverFilter("ALL");
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Levels</option>
            {uniqueLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Decisions</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={approverFilter}
            onChange={(e) => setApproverFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">All Approvers</option>
            {uniqueApprovers.map((app) => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Table Toolbar */}
      <LamsTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search approvals by lead or comments..."
        entriesPerPage={entriesPerPage}
        onEntriesPerPageChange={setEntriesPerPage}
        columns={columns}
        onToggleColumn={handleToggleColumn}
      />

      {/* 3. Approvals Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={displayedApprovals.length > 0 && selectedIds.length === displayedApprovals.length}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
                {isColVisible("lead") && <th className="py-3 px-3.5">Lead</th>}
                {isColVisible("level") && <th className="py-3 px-3.5">Level</th>}
                {isColVisible("approver") && <th className="py-3 px-3.5">Approver</th>}
                {isColVisible("decision") && <th className="py-3 px-3.5 text-center">Decision</th>}
                {isColVisible("comment") && <th className="py-3 px-3.5">Comment</th>}
                {isColVisible("decided_at") && <th className="py-3 px-3.5">Decided Date</th>}
                <th className="py-3 px-3.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedApprovals.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <LamsEmptyState
                      icon={UserCheck}
                      title="No Approval Requests"
                      description="All acquisition sign-offs are up to date."
                    />
                  </td>
                </tr>
              ) : (
                displayedApprovals.map((app) => {
                  const id = app.uuid || app.id;
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

                      {isColVisible("lead") && (
                        <td className="py-3 px-3.5 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          {app.lead || app.lead_code}
                        </td>
                      )}

                      {isColVisible("level") && (
                        <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {app.level}
                        </td>
                      )}

                      {isColVisible("approver") && (
                        <td className="py-3 px-3.5 font-medium text-slate-600 dark:text-slate-300">
                          {app.approver}
                        </td>
                      )}

                      {isColVisible("decision") && (
                        <td className="py-3 px-3.5 text-center">
                          <LamsStatusBadge status={app.decision} />
                        </td>
                      )}

                      {isColVisible("comment") && (
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {app.comment || "-"}
                        </td>
                      )}

                      {isColVisible("decided_at") && (
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                          {app.decided_at}
                        </td>
                      )}

                      <td className="py-3 px-3.5 text-center">
                        {app.decision === "pending" ? (
                          <button
                            onClick={() => setActioningApproval(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Action</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actioningApproval && (
        <ApprovalActionModal
          isOpen={Boolean(actioningApproval)}
          onClose={() => setActioningApproval(null)}
          approval={actioningApproval}
          onAction={(uuid, decision, comment) => {
            onActionApproval?.(uuid, decision, comment);
            setActioningApproval(null);
          }}
        />
      )}
    </div>
  );
}
