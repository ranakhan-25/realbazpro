"use client";

import React, { useState, useEffect } from "react";
import { X, ClipboardCheck, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { DueDiligenceRecord, DueDiligenceItem, AcquisitionLead } from "@/types/lams";

interface AddDueDiligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dd: any) => void;
  acquisitionLeads: AcquisitionLead[];
  initialData?: DueDiligenceRecord | null;
}

const DEFAULT_ITEMS: DueDiligenceItem[] = [
  { area: "Physical Access", item: "Frontage road width > 40ft and legal access", status: "ok", note: "Road verified on site" },
  { area: "Soil & Topography", item: "Soil bearing capacity test > 1.5 tsf", status: "ok", note: "Borehole sample taken" },
  { area: "Demarcation", item: "Boundary demarcation pillars agreed by neighbors", status: "ok", note: "Demarcation sheet signed" },
  { area: "Environmental", item: "Distance from wetland or water reserve", status: "ok", note: "Adequate buffer confirmed" },
  { area: "Utility Feasibility", item: "Power line & water line proximity", status: "pending", note: "DESCO substation 100m away" },
  { area: "Flood Plain", item: "Highest historical water level clearance", status: "issue", note: "Earth filling of 2ft needed" },
];

export function AddDueDiligenceModal({
  isOpen,
  onClose,
  onSave,
  acquisitionLeads,
  initialData,
}: AddDueDiligenceModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [items, setItems] = useState<DueDiligenceItem[]>(DEFAULT_ITEMS);
  const [reportFileName, setReportFileName] = useState("");

  useEffect(() => {
    if (initialData) {
      setSelectedLeadId(initialData.lead_id || initialData.lead_code || initialData.lead || "");
      setItems(initialData.checklist_json && initialData.checklist_json.length > 0 ? initialData.checklist_json : DEFAULT_ITEMS);
      setReportFileName(initialData.report || "");
    } else {
      setSelectedLeadId(acquisitionLeads[0]?.id || acquisitionLeads[0]?.leadCode || "");
      setItems(DEFAULT_ITEMS);
      setReportFileName("");
    }
  }, [initialData, acquisitionLeads, isOpen]);

  // Score auto-calculated from % of "ok" items
  const okCount = items.filter((i) => i.status === "ok").length;
  const totalCount = items.length;
  const score = totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { area: "General", item: "", status: "ok", note: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DueDiligenceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = acquisitionLeads.find(
      (l) => (l.id && l.id === selectedLeadId) || (l.leadCode && l.leadCode === selectedLeadId)
    );
    const leadCode = lead?.leadCode || lead?.code || selectedLeadId;

    const statusVal = score >= 80 ? "completed" : score >= 50 ? "ok" : "issues_found";

    onSave({
      id: initialData?.id || `DD-${Date.now()}`,
      uuid: initialData?.uuid || `DD-${Date.now()}`,
      lead: leadCode,
      lead_code: leadCode,
      lead_id: lead?.id || selectedLeadId,
      checklist_items_count: totalCount,
      completed_count: okCount,
      score,
      status: statusVal,
      report: reportFileName || "due_diligence_report.pdf",
      checklist_json: items,
      created_at: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Due Diligence Survey" : "Record Due Diligence Survey"}
              </h2>
              <p className="text-xs text-slate-500">Feature 02.06 · Comprehensive Checklist & Auto-Score Calculation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Lead */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Acquisition Lead <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500"
              >
                {acquisitionLeads.map((l) => (
                  <option key={l.id || l.leadCode} value={l.id || l.leadCode}>
                    {l.leadCode || l.code} — {l.title || l.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Score Badge */}
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  Auto Score
                </p>
                <p className="text-xs text-slate-500">
                  {okCount} of {totalCount} passed
                </p>
              </div>
              <span className={`text-xl font-extrabold ${score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                {score}%
              </span>
            </div>
          </div>

          {/* Checklist Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Survey & Technical Due Diligence Items (checklist_json)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Survey Check
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3 w-36">Area</th>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 w-32">Status</th>
                    <th className="py-2 px-3">Note</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-slate-900">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.area}
                          onChange={(e) => handleItemChange(idx, "area", e.target.value)}
                          placeholder="e.g. Access, Soil"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => handleItemChange(idx, "item", e.target.value)}
                          placeholder="Checklist point..."
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleItemChange(idx, "status", e.target.value as any)}
                          className={`w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${
                            item.status === "ok" ? "text-emerald-600" : item.status === "issue" ? "text-rose-600" : "text-amber-600"
                          }`}
                        >
                          <option value="ok">OK (Pass)</option>
                          <option value="pending">Pending</option>
                          <option value="issue">Issue</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => handleItemChange(idx, "note", e.target.value)}
                          placeholder="Note..."
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Field Survey & Geo-Technical Report (PDF / Image)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setReportFileName(f.name);
              }}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {reportFileName && <span className="text-[11px] font-mono text-slate-600 ml-2">{reportFileName}</span>}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Due Diligence</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
