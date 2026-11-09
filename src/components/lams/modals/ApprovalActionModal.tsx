"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { AcquisitionApproval } from "@/types/lams";

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: AcquisitionApproval | null;
  onAction: (uuid: string, decision: "approved" | "rejected", comment?: string) => void;
}

export function ApprovalActionModal({
  isOpen,
  onClose,
  approval,
  onAction,
}: ApprovalActionModalProps) {
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !approval) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "rejected" && !comment.trim()) {
      setError("Comment is required when rejecting an approval request *");
      return;
    }

    onAction(approval.uuid || approval.id, decision, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Acquisition Approval Decision
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Lead: {approval.lead_code || approval.lead} · {approval.level}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Decision <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                  decision === "approved"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="approved"
                  checked={decision === "approved"}
                  onChange={() => {
                    setDecision("approved");
                    setError("");
                  }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approve Deal</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                  decision === "rejected"
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="rejected"
                  checked={decision === "rejected"}
                  onChange={() => setDecision("rejected")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Deal</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Comments / Remarks {decision === "rejected" && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              placeholder={
                decision === "rejected"
                  ? "Required: Specify reasons for rejecting this acquisition deal..."
                  : "Optional approval remarks or conditions precedent..."
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500"
              required={decision === "rejected"}
            />
            {error && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm ${
                decision === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              Submit Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
