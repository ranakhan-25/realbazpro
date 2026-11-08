"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { LegalVerification, LegalChecklistFinding, AcquisitionLead } from "@/types/lams";

interface AddLegalVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (verification: any) => void;
  acquisitionLeads: AcquisitionLead[];
  initialData?: LegalVerification | null;
}

const LAWYERS = [
  "Adv. K. M. Saifuddin (High Court)",
  "Adv. Nazmul Huda (Senior Title Advocate)",
  "Barrister Imran Ahmed & Associates",
  "Adv. Sultana Razia (Sub-Registry Specialist)",
];

const DEFAULT_FINDINGS: LegalChecklistFinding[] = [
  { checklist_item: "25-Year CS, SA, RS Parcha chain continuity", result: "pass", note: "Chain unbroken from original owner" },
  { checklist_item: "Mutation Khatian & DCR verification", result: "pass", note: "Verified on Land Ministry portal" },
  { checklist_item: "Land Development Tax (Khajna) up-to-date", result: "pass", note: "Current 1431 BS receipt attached" },
  { checklist_item: "12-Year Non-Encumbrance Certificate (NEC)", result: "conditional", note: "Awaiting final seal from Sub-Registry" },
  { checklist_item: "Court injunction or acquisition notice search", result: "pass", note: "No civil suits or gazetted acquisition" },
];

export function AddLegalVerificationModal({
  isOpen,
  onClose,
  onSave,
  acquisitionLeads,
  initialData,
}: AddLegalVerificationModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [lawyer, setLawyer] = useState(LAWYERS[0]);
  const [titleClear, setTitleClear] = useState(true);
  const [mutationOk, setMutationOk] = useState(true);
  const [taxClear, setTaxClear] = useState(true);
  const [findings, setFindings] = useState<LegalChecklistFinding[]>(DEFAULT_FINDINGS);
  const [reportFileName, setReportFileName] = useState("");
  const [opinion, setOpinion] = useState("");
  const [status, setStatus] = useState<"pending" | "cleared" | "flagged">("cleared");

  useEffect(() => {
    if (initialData) {
      setSelectedLeadId(initialData.lead_id || initialData.lead_code || "");
      setLawyer(initialData.lawyer || LAWYERS[0]);
      setTitleClear(initialData.title_clear);
      setMutationOk(initialData.mutation_ok);
      setTaxClear(initialData.tax_clear);
      setFindings(initialData.findings_json && initialData.findings_json.length > 0 ? initialData.findings_json : DEFAULT_FINDINGS);
      setReportFileName(initialData.report || "");
      setOpinion(initialData.opinion || "");
      setStatus(initialData.status || "cleared");
    } else {
      setSelectedLeadId(acquisitionLeads[0]?.id || acquisitionLeads[0]?.leadCode || "");
      setLawyer(LAWYERS[0]);
      setTitleClear(true);
      setMutationOk(true);
      setTaxClear(true);
      setFindings(DEFAULT_FINDINGS);
      setReportFileName("");
      setOpinion("");
      setStatus("cleared");
    }
  }, [initialData, acquisitionLeads, isOpen]);

  if (!isOpen) return null;

  const handleAddFinding = () => {
    setFindings([
      ...findings,
      { checklist_item: "", result: "pass", note: "" },
    ]);
  };

  const handleRemoveFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };

  const handleFindingChange = (index: number, field: keyof LegalChecklistFinding, value: any) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [field]: value };
    setFindings(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = acquisitionLeads.find(
      (l) => (l.id && l.id === selectedLeadId) || (l.leadCode && l.leadCode === selectedLeadId)
    );
    const leadCode = lead?.leadCode || lead?.code || selectedLeadId;

    onSave({
      id: initialData?.id || `LEG-${Date.now()}`,
      uuid: initialData?.uuid || `LEG-${Date.now()}`,
      lead_code: leadCode,
      lead_id: lead?.id || selectedLeadId,
      lawyer,
      title_clear: titleClear,
      mutation_ok: mutationOk,
      tax_clear: taxClear,
      findings_json: findings,
      report: reportFileName || "legal_opinion.pdf",
      opinion,
      status,
      verified_at: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Legal Title Verification" : "New Legal Title Verification"}
              </h2>
              <p className="text-xs text-slate-500">Feature 02.05 · Title Clear, Mutation, Tax & Advocate Findings</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Acquisition Lead <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {acquisitionLeads.map((l) => (
                  <option key={l.id || l.leadCode} value={l.id || l.leadCode}>
                    {l.leadCode || l.code} — {l.title || l.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Lawyer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Legal Counsel <span className="text-rose-500">*</span>
              </label>
              <select
                value={lawyer}
                onChange={(e) => setLawyer(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {LAWYERS.map((adv) => (
                  <option key={adv} value={adv}>{adv}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Three Mandatory Clearances (Checkboxes) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Statutory Land Clearances (Checkboxes)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <input
                  type="checkbox"
                  checked={titleClear}
                  onChange={(e) => setTitleClear(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Title Clear (মালিকানা সঠিক)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <input
                  type="checkbox"
                  checked={mutationOk}
                  onChange={(e) => setMutationOk(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Mutation OK (নামজারি সঠিক)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <input
                  type="checkbox"
                  checked={taxClear}
                  onChange={(e) => setTaxClear(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tax Clear (খাজনা পরিশোধ)</span>
              </label>
            </div>
          </div>

          {/* Findings Table (findings_json TBL) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Legal Verification Checklist (findings_json)
              </label>
              <button
                type="button"
                onClick={handleAddFinding}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Finding Item
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3">Checklist Item</th>
                    <th className="py-2 px-3 w-32">Result</th>
                    <th className="py-2 px-3">Observation Note</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {findings.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-slate-900">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.checklist_item}
                          onChange={(e) => handleFindingChange(idx, "checklist_item", e.target.value)}
                          placeholder="e.g. Heirship dispute check"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.result}
                          onChange={(e) => handleFindingChange(idx, "result", e.target.value as any)}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        >
                          <option value="pass">Pass</option>
                          <option value="conditional">Conditional</option>
                          <option value="fail">Fail</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => handleFindingChange(idx, "note", e.target.value)}
                          placeholder="Observations..."
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFinding(idx)}
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

          {/* Advocate Formal Opinion */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Advocate Legal Opinion & Vetting Certificate
            </label>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              rows={3}
              placeholder="Provide final professional legal recommendation on marketable title clearance..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status & Report File */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Legal Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cleared">Cleared (Green Light)</option>
                <option value="pending">Pending Additional Search</option>
                <option value="flagged">Flagged (Risk / Discrepancy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Signed Legal Certificate (PDF)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setReportFileName(f.name);
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
