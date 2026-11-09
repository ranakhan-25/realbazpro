"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  ArrowRight,
  MapPin,
  Compass,
  FileText,
  DollarSign,
  ShieldCheck,
  ClipboardCheck,
  Handshake,
  Workflow,
  CreditCard,
  FolderOpen,
  Calendar,
  User,
  Phone,
  ExternalLink,
  ChevronRight,
  Upload,
} from "lucide-react";
import {
  AcquisitionLead,
  LandValuation,
  LegalVerification,
  DueDiligenceRecord,
  NegotiationRecord,
  AcquisitionApproval,
  SettlementRecord,
  LegalDocument,
} from "@/types/lams";
import { LamsStatusBadge } from "./common/LamsStatusBadge";
import { AdvanceStageRemarksModal } from "./modals/AdvanceStageRemarksModal";
import { SettlementPayModal } from "./modals/SettlementPayModal";

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: AcquisitionLead | null;
  valuations?: LandValuation[];
  legalVerifications?: LegalVerification[];
  dueDiligenceRecords?: DueDiligenceRecord[];
  negotiations?: NegotiationRecord[];
  approvals?: AcquisitionApproval[];
  settlements?: SettlementRecord[];
  documents?: LegalDocument[];
  initialTab?: string;
  onQualify?: (leadId: string) => void;
  onReject?: (leadId: string, remarks: string) => void;
  onAdvance?: (leadId: string, nextStage: string, remarks: string) => void;
  onPaySettlement?: (payment: any) => void;
}

const DETAIL_TABS = [
  { id: "Overview", label: "Overview", icon: Compass },
  { id: "Info", label: "Land Info & Records", icon: MapPin },
  { id: "Valuations", label: "Valuations", icon: DollarSign },
  { id: "Legal", label: "Legal Verification", icon: ShieldCheck },
  { id: "Due Diligence", label: "Due Diligence", icon: ClipboardCheck },
  { id: "Negotiations", label: "Negotiations", icon: Handshake },
  { id: "Workflow", label: "Workflow Stage", icon: Workflow },
  { id: "Approvals", label: "Approvals", icon: CheckCircle },
  { id: "Settlements", label: "Settlement", icon: CreditCard },
  { id: "Documents", label: "Documents", icon: FolderOpen },
];

const WORKFLOW_STAGES = [
  "lead",
  "negotiation",
  "approval",
  "agreement",
  "payment",
];

const STAGE_LABELS: Record<string, string> = {
  lead: "1. Lead Inception & Qualification",
  negotiation: "2. Commercial Price Negotiation",
  approval: "3. Management & Board Approval",
  agreement: "4. Bainanama / JV Agreement",
  payment: "5. Deed Registration & Settlement Payment",
};

export function LeadDetailModal({
  isOpen,
  onClose,
  lead,
  valuations = [],
  legalVerifications = [],
  dueDiligenceRecords = [],
  negotiations = [],
  approvals = [],
  settlements = [],
  documents = [],
  initialTab = "Overview",
  onQualify,
  onReject,
  onAdvance,
  onPaySettlement,
}: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "Overview");

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [payingSettlement, setPayingSettlement] = useState<SettlementRecord | null>(null);

  if (!isOpen || !lead) return null;

  const leadCode = lead.code || lead.leadCode || lead.id;
  const leadId = lead.id || lead.uuid || leadCode;

  // Filter related records matching this lead
  const leadValuations = valuations.filter(
    (v) => v.lead_code === leadCode || v.lead_id === leadId
  );
  const leadLegal = legalVerifications.filter(
    (l) => l.lead_code === leadCode || l.lead_id === leadId
  );
  const leadDD = dueDiligenceRecords.filter(
    (d) => d.lead === leadCode || d.lead_code === leadCode || d.lead_id === leadId
  );
  const leadNegotiations = negotiations.filter(
    (n) => n.lead === leadCode || n.lead_code === leadCode || n.acquisitionLeadId === leadId
  );
  const leadApprovals = approvals.filter(
    (a) => a.lead === leadCode || a.lead_code === leadCode || a.lead_id === leadId
  );
  const leadSettlements = settlements.filter(
    (s) => s.lead === leadCode || s.lead_code === leadCode || s.lead_id === leadId
  );
  const leadDocs = documents.filter(
    (doc) => doc.lead_code === leadCode || doc.acquisitionLeadId === leadId
  );

  // Workflow current stage resolution
  const currentStatus = (lead.status || lead.leadStage || "Draft").toLowerCase();
  let currentStageIndex = 0;
  if (currentStatus.includes("negotiat")) currentStageIndex = 1;
  else if (currentStatus.includes("approv") || currentStatus.includes("legal")) currentStageIndex = 2;
  else if (currentStatus.includes("agreement") || currentStatus.includes("qualified")) currentStageIndex = 3;
  else if (currentStatus.includes("acquired") || currentStatus.includes("settl")) currentStageIndex = 4;

  const nextStage = WORKFLOW_STAGES[Math.min(currentStageIndex + 1, WORKFLOW_STAGES.length - 1)];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 shadow-2xs">
              {leadCode}
            </span>
            <LamsStatusBadge status={lead.status || lead.leadStage || "Draft"} size="md" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
              {lead.title || lead.location || "Land Acquisition Lead"}
            </h2>
          </div>

          {/* Action Buttons: Qualify, Reject, Advance */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQualify?.(leadId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Qualify</span>
            </button>

            <button
              onClick={() => setIsRejectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors"
            >
              <span>Advance Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {DETAIL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-cyan-600 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Land Area</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {lead.area_katha || lead.landArea || 0} Katha
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ≈ {(lead.area_sqft || (Number(lead.area_katha || lead.landArea || 0) * 720)).toLocaleString()} sq.ft
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Asking Price</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    ৳ {(lead.asking_price || lead.expectedPrice || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Offered: ৳ {(lead.offeredPrice || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Lead Source</p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                    {lead.source || lead.leadSource || "Direct Owner"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Priority: <span className="font-bold text-cyan-600">{lead.priority || "Medium"}</span>
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Officer</p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {lead.assignee || lead.assignedUser || "Sakib Al Hasan"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Created: {lead.createdAt || "2026-08-20"}
                  </p>
                </div>
              </div>

              {/* Main Information Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Location & Property Details */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Location & Territory Details
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Location / Address:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{lead.location || lead.address || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Mouza & Upazila:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{lead.mouza || "Baghber"}, {lead.upazila || "Rupganj"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">District:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{lead.district || "Dhaka"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Land Type Classification:</span>
                      <span className="font-bold capitalize text-cyan-700 dark:text-cyan-300">{lead.land_type || lead.landType || "Residential"}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    Primary Landowner Contact
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Owner Name:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{lead.owner_name || lead.ownerName || "Alhaj M. A. Latif"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-bold font-mono text-cyan-600">{lead.owner_phone || lead.ownerPhone || "+880 1711-000000"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Owner Address:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{lead.ownerAddress || "Uttara, Dhaka"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Notes / Remarks:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400 text-right max-w-xs">{lead.notes || lead.remarks || "No additional remarks."}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAND INFO & RECORDS (Feature 02.03) */}
          {activeTab === "Info" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cadastral & Land Record Specifics
                  </h3>
                  <p className="text-xs text-slate-500">Feature 02.03 · Mouza, Khatian, Dag, Land Type, Co-owners & Map</p>
                </div>
                {lead.map_url && (
                  <a
                    href={lead.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Map Coordinates</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Mouza</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{lead.mouza || "Baghber"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Khatian No</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{lead.khatian_no || lead.khatianNo || "RS-892, BS-1204"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Dag No</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{lead.dag_no || lead.dagNo || "1405, 1406"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Land Type</p>
                  <p className="font-extrabold capitalize text-cyan-600 mt-0.5">{lead.land_type || lead.landType || "Residential"}</p>
                </div>
              </div>

              {/* Co-Owners Table (co_owners_json TBL) */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Co-Sharers & Ownership Allocation (co_owners_json)
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 border-b">
                      <tr>
                        <th className="py-2.5 px-3">Owner / Sharer Name</th>
                        <th className="py-2.5 px-3">Share Percentage (%)</th>
                        <th className="py-2.5 px-3">Calculated Katha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lead.co_owners_json && lead.co_owners_json.length > 0 ? (
                        lead.co_owners_json.map((co, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{co.name}</td>
                            <td className="py-2.5 px-3 font-bold text-cyan-600">{co.share_pct}%</td>
                            <td className="py-2.5 px-3 font-medium text-slate-600">
                              {((Number(lead.area_katha || lead.landArea || 0) * co.share_pct) / 100).toFixed(2)} Katha
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{lead.owner_name || "Sole Owner"}</td>
                          <td className="py-2.5 px-3 font-bold text-cyan-600">100%</td>
                          <td className="py-2.5 px-3 font-medium text-slate-600">{lead.area_katha || lead.landArea || 0} Katha</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VALUATIONS (Feature 02.04) */}
          {activeTab === "Valuations" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Land Valuations & Rate Appraisals
                  </h3>
                  <p className="text-xs text-slate-500">Market comparisons, Govt rates, and expert assessment</p>
                </div>
              </div>

              {leadValuations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No valuation records filed yet for this parcel.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Valuer</th>
                        <th className="py-2.5 px-3">Market Rate</th>
                        <th className="py-2.5 px-3">Govt Rate</th>
                        <th className="py-2.5 px-3">Total Value</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Valued At</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {leadValuations.map((val) => (
                        <tr key={val.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold">{val.valuer}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">৳ {val.market_rate.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-slate-500">৳ {(val.govt_rate || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600">৳ {val.total_value.toLocaleString()}</td>
                          <td className="py-2.5 px-3 capitalize font-medium">{val.method}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{val.valued_at}</td>
                          <td className="py-2.5 px-3 text-center">
                            <LamsStatusBadge status={val.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEGAL (Feature 02.05) */}
          {activeTab === "Legal" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Legal Verification & Title Clearance
                </h3>
                <p className="text-xs text-slate-500">Feature 02.05 · Title Clear, Mutation OK, Tax Clear & Findings</p>
              </div>

              {leadLegal.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No legal title vetting filed yet for this parcel.
                </div>
              ) : (
                leadLegal.map((leg) => (
                  <div key={leg.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{leg.lawyer}</p>
                        <p className="text-[11px] text-slate-500">Verified at: {leg.verified_at}</p>
                      </div>
                      <LamsStatusBadge status={leg.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl font-bold">
                      <div className="flex items-center gap-2">
                        {leg.title_clear ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                        <span>Title Clear: {leg.title_clear ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {leg.mutation_ok ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                        <span>Mutation OK: {leg.mutation_ok ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {leg.tax_clear ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                        <span>Tax Clear: {leg.tax_clear ? "Yes" : "No"}</span>
                      </div>
                    </div>

                    {leg.opinion && (
                      <div className="text-xs p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                        <p className="font-bold text-indigo-700 dark:text-indigo-300 mb-1">Advocate Legal Opinion:</p>
                        <p className="text-slate-700 dark:text-slate-300 italic">{leg.opinion}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: DUE DILIGENCE (Feature 02.06) */}
          {activeTab === "Due Diligence" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Technical Due Diligence & Site Survey
                </h3>
                <p className="text-xs text-slate-500">Feature 02.06 · Checklist items, issues & auto score</p>
              </div>

              {leadDD.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No technical due diligence recorded yet.
                </div>
              ) : (
                leadDD.map((dd) => (
                  <div key={dd.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-teal-600">{dd.score}% Score</span>
                        <span className="text-xs text-slate-500">({dd.completed_count}/{dd.checklist_items_count} items OK)</span>
                      </div>
                      <LamsStatusBadge status={dd.status} />
                    </div>

                    {dd.checklist_json && dd.checklist_json.length > 0 && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b">
                            <tr>
                              <th className="p-2">Area</th>
                              <th className="p-2">Checklist Item</th>
                              <th className="p-2">Result</th>
                              <th className="p-2">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {dd.checklist_json.map((item, i) => (
                              <tr key={i}>
                                <td className="p-2 font-semibold text-slate-600">{item.area}</td>
                                <td className="p-2">{item.item}</td>
                                <td className="p-2 font-bold capitalize">
                                  <span className={item.status === "ok" ? "text-emerald-600" : "text-amber-600"}>{item.status}</span>
                                </td>
                                <td className="p-2 text-slate-500">{item.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: NEGOTIATIONS (Feature 02.07) */}
          {activeTab === "Negotiations" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Price Negotiation Rounds & Meetings
                </h3>
                <p className="text-xs text-slate-500">Feature 02.07 · Round tracking, owner counter offers & final consensus</p>
              </div>

              {leadNegotiations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No negotiation rounds recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Round</th>
                        <th className="py-2.5 px-3">Our Offer</th>
                        <th className="py-2.5 px-3">Counter Offer</th>
                        <th className="py-2.5 px-3">Final Agreed</th>
                        <th className="py-2.5 px-3">Negotiator</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {leadNegotiations.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-600">Round #{n.round_no || 1}</td>
                          <td className="py-2.5 px-3 font-semibold">৳ {(n.offer_amount || n.offeredTotalPrice || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-semibold text-amber-600">৳ {(n.counter_amount || n.counterOfferByOwner || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600">৳ {(n.final_amount || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-medium">{n.negotiator || n.attendedBy}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{n.date || n.meetingDate}</td>
                          <td className="py-2.5 px-3 text-center">
                            <LamsStatusBadge status={n.status || n.negotiationStatus || "ongoing"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: WORKFLOW (Feature 02.08) */}
          {activeTab === "Workflow" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acquisition Lifecycle Stages & Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Feature 02.08 · Timeline: lead → negotiation → approval → agreement → payment
                </p>
              </div>

              {/* Visual Interactive Timeline */}
              <div className="space-y-4">
                {WORKFLOW_STAGES.map((st, idx) => {
                  const isCurrent = idx === currentStageIndex;
                  const isPast = idx < currentStageIndex;
                  return (
                    <div
                      key={st}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? "bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/20"
                          : isPast
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-slate-700"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCurrent
                              ? "bg-cyan-600 text-white"
                              : isPast
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          {isPast ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isCurrent ? "text-cyan-950 dark:text-cyan-100" : ""}`}>
                            {STAGE_LABELS[st]}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {isCurrent ? "Current Active Stage" : isPast ? "Completed" : "Pending Stage"}
                          </p>
                        </div>
                      </div>

                      {isCurrent && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsAdvanceModalOpen(true)}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                          >
                            <span>Advance to Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: APPROVALS (Feature 02.09) */}
          {activeTab === "Approvals" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acquisition Approval Hierarchy
                </h3>
                <p className="text-xs text-slate-500">Feature 02.09 · Multi-level sign-offs & executive audit</p>
              </div>

              {leadApprovals.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No approval requests queued yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Approval Level</th>
                        <th className="py-2.5 px-3">Approver</th>
                        <th className="py-2.5 px-3">Decision</th>
                        <th className="py-2.5 px-3">Comment / Remarks</th>
                        <th className="py-2.5 px-3">Decided At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {leadApprovals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{app.level}</td>
                          <td className="py-2.5 px-3 font-medium">{app.approver}</td>
                          <td className="py-2.5 px-3">
                            <LamsStatusBadge status={app.decision} />
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs">{app.comment || "-"}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{app.decided_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SETTLEMENTS (Feature 02.10) */}
          {activeTab === "Settlements" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Financial Settlement & Deed Payment
                </h3>
                <p className="text-xs text-slate-500">Feature 02.10 · Installment disbursement schedule & Pay Action</p>
              </div>

              {leadSettlements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No settlement disbursement record created yet.
                </div>
              ) : (
                leadSettlements.map((set) => (
                  <div key={set.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{set.owner}</p>
                        <p className="text-xs text-slate-500">Scheduled: {set.scheduled_at} · Mode: {set.payment_mode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <LamsStatusBadge status={set.status} />
                        <button
                          onClick={() => setPayingSettlement(set)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Installment</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-bold">
                      <div>Agreed: ৳ {set.agreed_amount.toLocaleString()}</div>
                      <div className="text-emerald-600">Paid: ৳ {set.paid.toLocaleString()}</div>
                      <div className="text-rose-600 text-right">Due: ৳ {set.due.toLocaleString()}</div>
                    </div>

                    {set.payment_schedule && set.payment_schedule.length > 0 && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b">
                            <tr>
                              <th className="p-2 w-12">#</th>
                              <th className="p-2">Due Date</th>
                              <th className="p-2">Amount (BDT)</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {set.payment_schedule.map((sch) => (
                              <tr key={sch.installment_no}>
                                <td className="p-2 font-mono">#{sch.installment_no}</td>
                                <td className="p-2 font-mono">{sch.due_date}</td>
                                <td className="p-2 font-bold">৳ {sch.amount.toLocaleString()}</td>
                                <td className="p-2">
                                  <LamsStatusBadge status={sch.status || "Pending"} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 10: DOCUMENTS (Feature 02.11) */}
          {activeTab === "Documents" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acquisition Deeds & Registry Documents
                </h3>
                <p className="text-xs text-slate-500">Feature 02.11 · Baya deeds, Khatians, DCR, and NEC uploads</p>
              </div>

              {leadDocs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No documents linked to this lead yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {leadDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {doc.title || doc.documentType}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {doc.category || doc.documentType} · v{doc.version || "1.0"} · {doc.size || doc.fileSize}
                          </p>
                        </div>
                      </div>
                      <LamsStatusBadge status={doc.verificationStatus || "Verified"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advance Stage Remarks Modal */}
      <AdvanceStageRemarksModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        leadCode={leadCode}
        currentStage={lead.status || lead.leadStage || "Draft"}
        targetStage={nextStage}
        isReject={false}
        onConfirm={(remarks) => onAdvance?.(leadId, nextStage, remarks)}
      />

      {/* Reject Remarks Modal */}
      <AdvanceStageRemarksModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        leadCode={leadCode}
        currentStage={lead.status || lead.leadStage || "Draft"}
        targetStage="Rejected"
        isReject={true}
        onConfirm={(remarks) => onReject?.(leadId, remarks)}
      />

      {/* Settlement Pay Modal */}
      {payingSettlement && (
        <SettlementPayModal
          isOpen={Boolean(payingSettlement)}
          onClose={() => setPayingSettlement(null)}
          settlement={payingSettlement}
          onPay={(payment) => {
            onPaySettlement?.(payment);
            setPayingSettlement(null);
          }}
        />
      )}
    </div>
  );
}
