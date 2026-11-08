"use client";

import React, { useState } from "react";
import { X, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface AdvanceStageRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadCode: string;
  currentStage: string;
  targetStage: string;
  isReject?: boolean;
  onConfirm: (remarks: string) => void;
}

export function AdvanceStageRemarksModal({
  isOpen,
  onClose,
  leadCode,
  currentStage,
  targetStage,
  isReject = false,
  onConfirm,
}: AdvanceStageRemarksModalProps) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError("Please provide remarks for this stage transition *");
      return;
    }
    onConfirm(remarks);
    setRemarks("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReject ? (
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isReject ? "Reject Acquisition Lead" : "Advance Acquisition Stage"}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{leadCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Current Stage</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{currentStage}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Next State</p>
              <p className={`font-bold ${isReject ? "text-rose-600" : "text-cyan-600 dark:text-cyan-400"}`}>
                {targetStage}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError("");
              }}
              rows={4}
              placeholder={
                isReject
                  ? "Specify reasons for rejecting this parcel (e.g. title dispute, unfeasible pricing)..."
                  : "Detail reasons and verification findings for stage progression..."
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            {error && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{error}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 ${
                isReject
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm {isReject ? "Rejection" : "Transition"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
