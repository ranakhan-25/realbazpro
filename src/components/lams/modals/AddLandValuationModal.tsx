"use client";

import React, { useState, useEffect } from "react";
import { X, DollarSign, Calculator, FileText, CheckCircle2 } from "lucide-react";
import { LandValuation, ValuationMethod, AcquisitionLead } from "@/types/lams";

interface AddLandValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (valuation: any) => void;
  acquisitionLeads: AcquisitionLead[];
  initialData?: LandValuation | null;
}

const VALUERS = [
  "Engr. Zahidul Haque (Certified Valuer)",
  "Apex Survey & Valuation Ltd",
  "Surveyor Rafiqul Islam",
  "National Real Estate Appraisal Firm",
  "Deloitte Real Estate Advisory",
];

const METHODS: { id: ValuationMethod; label: string }[] = [
  { id: "comparative", label: "Comparative Market Analysis (CMA)" },
  { id: "income", label: "Income Capitalization Method" },
  { id: "cost", label: "Replacement Cost Method" },
  { id: "residual", label: "Development Residual Land Method" },
];

export function AddLandValuationModal({
  isOpen,
  onClose,
  onSave,
  acquisitionLeads,
  initialData,
}: AddLandValuationModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [valuer, setValuer] = useState(VALUERS[0]);
  const [marketRate, setMarketRate] = useState<number | "">("");
  const [govtRate, setGovtRate] = useState<number | "">("");
  const [totalValue, setTotalValue] = useState<number | "">("");
  const [isManualTotal, setIsManualTotal] = useState(false);
  const [method, setMethod] = useState<ValuationMethod>("comparative");
  const [valuedAt, setValuedAt] = useState(new Date().toISOString().split("T")[0]);
  const [reportFileName, setReportFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Draft" | "Pending" | "Verified" | "Approved">("Pending");

  useEffect(() => {
    if (initialData) {
      setSelectedLeadId(initialData.lead_id || initialData.lead_code || "");
      setValuer(initialData.valuer || VALUERS[0]);
      setMarketRate(initialData.market_rate || "");
      setGovtRate(initialData.govt_rate || "");
      setTotalValue(initialData.total_value || "");
      setIsManualTotal(true);
      setMethod(initialData.method || "comparative");
      setValuedAt(initialData.valued_at || new Date().toISOString().split("T")[0]);
      setReportFileName(initialData.report || "");
      setNotes(initialData.notes || "");
      setStatus(initialData.status || "Pending");
    } else {
      setSelectedLeadId(acquisitionLeads[0]?.id || acquisitionLeads[0]?.leadCode || "");
      setValuer(VALUERS[0]);
      setMarketRate("");
      setGovtRate("");
      setTotalValue("");
      setIsManualTotal(false);
      setMethod("comparative");
      setValuedAt(new Date().toISOString().split("T")[0]);
      setReportFileName("");
      setNotes("");
      setStatus("Pending");
    }
  }, [initialData, acquisitionLeads, isOpen]);

  // Auto-calculate total value when market rate changes and lead area is known
  useEffect(() => {
    if (!isManualTotal && marketRate !== "") {
      const lead = acquisitionLeads.find(
        (l) => (l.id && l.id === selectedLeadId) || (l.leadCode && l.leadCode === selectedLeadId)
      );
      const area = lead?.area_katha || lead?.landArea || 1;
      const calculated = Number(marketRate) * Number(area);
      setTotalValue(calculated);
    }
  }, [marketRate, selectedLeadId, isManualTotal, acquisitionLeads]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = acquisitionLeads.find(
      (l) => (l.id && l.id === selectedLeadId) || (l.leadCode && l.leadCode === selectedLeadId)
    );
    const leadCode = lead?.leadCode || lead?.code || selectedLeadId;

    onSave({
      id: initialData?.id || `VAL-${Date.now()}`,
      uuid: initialData?.uuid || `VAL-${Date.now()}`,
      lead_code: leadCode,
      lead_id: lead?.id || selectedLeadId,
      valuer,
      market_rate: Number(marketRate) || 0,
      govt_rate: Number(govtRate) || 0,
      total_value: Number(totalValue) || 0,
      method,
      report: reportFileName || "valuation_assessment.pdf",
      valued_at: valuedAt,
      notes,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Land Valuation" : "Record Land Valuation"}
              </h2>
              <p className="text-xs text-slate-500">Feature 02.04 · Market Appraisal & Govt Rate Assessment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Acquisition Lead <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-cyan-500"
              >
                {acquisitionLeads.map((l) => (
                  <option key={l.id || l.leadCode} value={l.id || l.leadCode}>
                    {l.leadCode || l.code} — {l.title || l.location} ({l.area_katha || l.landArea || 0} Katha)
                  </option>
                ))}
              </select>
            </div>

            {/* Valuer Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Appraiser / Valuer <span className="text-rose-500">*</span>
              </label>
              <select
                value={valuer}
                onChange={(e) => setValuer(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-cyan-500"
              >
                {VALUERS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Valuation Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valuation Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as ValuationMethod)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-cyan-500"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Valued Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valuation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={valuedAt}
                onChange={(e) => setValuedAt(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Market Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Market Rate (BDT / Katha) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  placeholder="e.g. 1850000"
                  value={marketRate}
                  onChange={(e) => setMarketRate(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min={0}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Govt Rate (Mouza Rate) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Govt Rate / Mouza Deed Rate (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  placeholder="e.g. 1100000"
                  value={govtRate}
                  onChange={(e) => setGovtRate(e.target.value === "" ? "" : Number(e.target.value))}
                  min={0}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Total Value (Auto calculated, editable) */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Assessed Value (BDT) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  (Auto-calculated: Rate × Area, or enter manually)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">৳</span>
                <input
                  type="number"
                  value={totalValue}
                  onChange={(e) => {
                    setIsManualTotal(true);
                    setTotalValue(e.target.value === "" ? "" : Number(e.target.value));
                  }}
                  required
                  min={0}
                  className="w-full pl-8 pr-3 py-2.5 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 text-sm font-extrabold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* PDF Report File Upload simulation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valuation Report (PDF)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setReportFileName(f.name);
                  }}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
                {reportFileName && (
                  <span className="text-[11px] font-mono text-slate-600 truncate max-w-[150px]">{reportFileName}</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Approval Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                <option value="Verified">Verified by Head</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            {/* Notes */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valuation Notes & Observations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Details on frontage, elevation, soil condition, or market survey comparison points..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Valuation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
