"use client";

import React from "react";
import { X, Trash2, Download, CheckCircle, ShieldCheck } from "lucide-react";

interface LamsBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: (status: string) => void;
  statusOptions?: string[];
}

export function LamsBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkStatusChange,
  statusOptions,
}: LamsBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center bg-cyan-500 text-white font-bold text-xs px-2 py-0.5 rounded-md">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-slate-200">
          item{selectedCount > 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        {statusOptions && onBulkStatusChange && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkStatusChange(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="" disabled>Change Status...</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        )}

        {onBulkExport && (
          <button
            onClick={onBulkExport}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>
        )}

        {onBulkDelete && (
          <button
            onClick={onBulkDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}

        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors ml-1"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
