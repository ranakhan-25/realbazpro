"use client";

import React, { useState } from "react";
import {
  Smile,
  Frown,
  Meh,
  Star,
  TrendingUp,
  MessageSquare,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface FeedbackSurvey {
  id: string;
  feedbackNo: string;
  customerName: string;
  unit: string;
  project: string;
  surveyType: "Handover CSAT" | "Construction Update" | "DLP Resolution" | "Pre-Sales to Post-Sales";
  csatScore: number;
  npsScore: number;
  npsCategory: "Promoter" | "Passive" | "Detractor";
  comments: string;
  followUpStatus: "Satisfied - Closed" | "Pending Review" | "Escalated to CX Head" | "Action Taken";
  assignedOfficer: string;
  submittedAt: string;
}

const INITIAL_FEEDBACK: FeedbackSurvey[] = [
  {
    id: "FB-101",
    feedbackNo: "CSAT-2026-081",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    surveyType: "Handover CSAT",
    csatScore: 5,
    npsScore: 10,
    npsCategory: "Promoter",
    comments: "Exceptional handover experience! Finishing tiles and sanitary fittings matched the sales catalogue exactly. Handover kit and gift hamper were very courteous.",
    followUpStatus: "Satisfied - Closed",
    assignedOfficer: "Nusrat Jahan (CX Lead)",
    submittedAt: "2026-11-03 04:30 PM",
  },
  {
    id: "FB-102",
    feedbackNo: "CSAT-2026-082",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    surveyType: "DLP Resolution",
    csatScore: 3,
    npsScore: 6,
    npsCategory: "Detractor",
    comments: "Water seepage rectification took 10 days instead of the promised 48 hours. However, the site supervisor finally did a good waterproofing coating.",
    followUpStatus: "Escalated to CX Head",
    assignedOfficer: "Engr. Monirul Islam",
    submittedAt: "2026-11-02 11:15 AM",
  },
  {
    id: "FB-103",
    feedbackNo: "CSAT-2026-083",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    surveyType: "Construction Update",
    csatScore: 5,
    npsScore: 9,
    npsCategory: "Promoter",
    comments: "Regular milestone drone photos and timely demand letters made the payment planning very smooth. Great job by customer relations desk.",
    followUpStatus: "Satisfied - Closed",
    assignedOfficer: "Nusrat Jahan (CX Lead)",
    submittedAt: "2026-11-01 02:20 PM",
  },
];

export default function FeedbackSurveysPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [feedbacks, setFeedbacks] = useState<FeedbackSurvey[]>(INITIAL_FEEDBACK);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSurvey | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  // Form states
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignType, setCampaignType] = useState<FeedbackSurvey["surveyType"]>("Handover CSAT");
  const [targetProject, setTargetProject] = useState("All Projects");

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (activeTab === "promoters") return f.npsCategory === "Promoter";
    if (activeTab === "passives") return f.npsCategory === "Passive";
    if (activeTab === "detractors") return f.npsCategory === "Detractor";
    if (activeTab === "handover") return f.surveyType === "Handover CSAT";
    if (activeTab === "dlp") return f.surveyType === "DLP Resolution";
    if (activeTab === "escalated") return f.followUpStatus === "Escalated to CX Head" || f.followUpStatus === "Pending Review";
    return true;
  });

  const counts = {
    all: feedbacks.length,
    promoters: feedbacks.filter((f) => f.npsCategory === "Promoter").length,
    passives: feedbacks.filter((f) => f.npsCategory === "Passive").length,
    detractors: feedbacks.filter((f) => f.npsCategory === "Detractor").length,
    handover: feedbacks.filter((f) => f.surveyType === "Handover CSAT").length,
    dlp: feedbacks.filter((f) => f.surveyType === "DLP Resolution").length,
    escalated: feedbacks.filter((f) => f.followUpStatus === "Escalated to CX Head" || f.followUpStatus === "Pending Review").length,
  };

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Survey campaign "${campaignTitle || campaignType}" dispatched to ${targetProject} purchasers.`);
    setIsSurveyModalOpen(false);
    setCampaignTitle("");
  };

  const handleStatusUpdate = (id: string, newStatus: FeedbackSurvey["followUpStatus"]) => {
    setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, followUpStatus: newStatus } : f)));
    toast.success(`Feedback issue updated: ${newStatus}`);
  };

  const columns: Column<FeedbackSurvey>[] = [
    {
      key: "feedbackNo",
      header: "SURVEY NO & CUSTOMER",
      sortable: true,
      minWidth: "210px",
      render: (row) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{row.customerName}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{row.feedbackNo} • {row.unit}</div>
        </div>
      ),
    },
    {
      key: "surveyType",
      header: "TOUCHPOINT",
      minWidth: "170px",
      render: (row) => (
        <span className="text-[11px] font-medium text-[#374151] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
          {row.surveyType}
        </span>
      ),
    },
    {
      key: "npsScore",
      header: "CSAT & NPS SCORE",
      minWidth: "180px",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-[#111827]">
            <Star className="h-3.5 w-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="tabular-nums">{row.csatScore}.0</span>
          </div>
          <div className="text-[11px] font-semibold flex items-center gap-1">
            {row.npsCategory === "Promoter" && <Smile className="h-3.5 w-3.5 text-[#039855]" />}
            {row.npsCategory === "Passive" && <Meh className="h-3.5 w-3.5 text-[#DC6803]" />}
            {row.npsCategory === "Detractor" && <Frown className="h-3.5 w-3.5 text-[#DC2626]" />}
            <span className={`tabular-nums ${
              row.npsCategory === "Promoter" ? "text-[#039855]" :
              row.npsCategory === "Passive" ? "text-[#DC6803]" : "text-[#DC2626]"
            }`}>
              NPS {row.npsScore}/10 ({row.npsCategory})
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "comments",
      header: "CUSTOMER VOICE",
      minWidth: "250px",
      render: (row) => (
        <p className="text-xs text-[#6B7280] line-clamp-2 max-w-sm" title={row.comments}>
          {row.comments}
        </p>
      ),
    },
    {
      key: "followUpStatus",
      header: "FOLLOW-UP STATUS",
      minWidth: "170px",
      render: (row) => {
        const badges = {
          "Satisfied - Closed": "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
          "Pending Review": "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
          "Escalated to CX Head": "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
          "Action Taken": "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.followUpStatus]}`}>
            {row.followUpStatus}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "120px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFeedback(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title="View Survey"
            aria-label="View Survey"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.npsCategory === "Detractor" && row.followUpStatus !== "Action Taken" && (
            <button
              type="button"
              onClick={() => handleStatusUpdate(row.id, "Escalated to CX Head")}
              className="h-8 px-2.5 rounded-lg inline-flex items-center text-xs font-semibold bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition shadow-xs"
              title="Escalate Detractor"
            >
              Escalate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Feedback, Surveys & NPS"
        subtitle="Monitor buyer sentiment across key touchpoints: booking confirmation, construction progress, handover possession, and 2-year DLP property care."
        badge="Voice of Customer"
        breadcrumbs={[{ label: "Communication & Appointments" }, { label: "Feedback & NPS" }]}
        primaryAction={{
          label: "Launch Survey Campaign",
          icon: Plus,
          onClick: () => setIsSurveyModalOpen(true),
        }}
        secondaryActions={[
          {
            label: "Export Survey Analysis",
            icon: RefreshCw,
            onClick: () => toast.success("Feedback survey metrics exported."),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Net Promoter Score (NPS)"
          value="+54"
          subtext="Industry benchmark: +35"
          icon={TrendingUp}
          trend={{ value: "+8 pts", isPositive: true }}
        />
        <CSStatCard
          title="Average CSAT Rating"
          value="4.6 / 5.0"
          subtext="Based on 248 reviews"
          icon={Star}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Brand Promoters (9-10)"
          value="78%"
          subtext="Advocates & Referral Drivers"
          icon={Smile}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Active Detractors"
          value="2"
          subtext="Requiring CX Management Follow-up"
          icon={Frown}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Responses", count: counts.all },
          { key: "promoters", label: "Promoters (9-10)", count: counts.promoters },
          { key: "passives", label: "Passives (7-8)", count: counts.passives },
          { key: "detractors", label: "Detractors (0-6)", count: counts.detractors },
          { key: "handover", label: "Handover CSAT", count: counts.handover },
          { key: "dlp", label: "DLP Resolution", count: counts.dlp },
          { key: "escalated", label: "Action Needed", count: counts.escalated },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={filteredFeedbacks}
        searchPlaceholder="Search by customer, unit, project, or comments..."
        exportFileName="RealBiz_Customer_NPS_CSAT"
      />

      {/* Survey Modal */}
      <CSModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title="Launch Customer Feedback Campaign"
        subtitle="Dispatch automated SMS and email survey links to allottees at specific milestone touchpoints."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSurveyModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="launch-campaign-form"
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Dispatch Survey Link
            </button>
          </>
        }
      >
        <form id="launch-campaign-form" onSubmit={handleLaunchCampaign} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">Campaign Title</label>
            <input
              type="text"
              placeholder="e.g. Q4 2026 Handover Allottee CSAT"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Survey Touchpoint *</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Handover CSAT">Handover & Key Possession CSAT</option>
                <option value="Construction Update">Construction Progress Transparency</option>
                <option value="DLP Resolution">DLP Rectification Satisfaction</option>
                <option value="Pre-Sales to Post-Sales">Sales to Post-Sales Transition</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Target Project *</label>
              <select
                value={targetProject}
                onChange={(e) => setTargetProject(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="All Projects">All Active Projects</option>
                <option value="Hena Heights, Gulshan">Hena Heights, Gulshan</option>
                <option value="Sheba Green Valley">Sheba Green Valley</option>
                <option value="Eastern Lakeview">Eastern Lakeview</option>
                <option value="Uttara Green Park">Uttara Green Park</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-2 text-xs">
            <span className="font-semibold text-[#111827]">Standard 3-Question Survey Template:</span>
            <ol className="list-decimal list-inside space-y-1 text-[#6B7280]">
              <li>How satisfied are you with the finishing quality and handover timeline? (1-5 Stars)</li>
              <li>How likely are you to recommend RealBiz Pro developments to friends and family? (NPS 0-10)</li>
              <li>Any suggestions or unresolved concerns for our site engineering team? (Open text)</li>
            </ol>
          </div>
        </form>
      </CSModal>

      {/* Detail Drawer */}
      <CSDetailDrawer
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        title={`Feedback Survey: ${selectedFeedback?.feedbackNo}`}
        subtitle={`${selectedFeedback?.customerName} • ${selectedFeedback?.project}`}
      >
        {selectedFeedback && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-2">
              <div className="text-[11px] text-[#6B7280]">NPS Category & CSAT</div>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#111827] tabular-nums">
                  {selectedFeedback.npsCategory} ({selectedFeedback.npsScore}/10)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5] tabular-nums">
                  {selectedFeedback.csatScore} / 5 Stars
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Customer & Unit</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Customer:</span>
                  <div className="font-semibold text-[#111827]">{selectedFeedback.customerName}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Unit & Project:</span>
                  <div className="font-semibold text-[#6D4AFF]">{selectedFeedback.unit}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Touchpoint:</span>
                  <div className="font-medium text-[#111827]">{selectedFeedback.surveyType}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Date & Time:</span>
                  <div className="font-medium text-[#111827] tabular-nums">{selectedFeedback.submittedAt}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Customer Voice & Comments</h4>
              <div className="p-3.5 rounded-[12px] border border-[#E5E7EB] bg-white text-xs leading-relaxed text-[#374151]">
                "{selectedFeedback.comments}"
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E5E7EB] text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Assigned CX Officer:</span>
                <span className="font-medium text-[#111827]">{selectedFeedback.assignedOfficer}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Resolution Status:</span>
                <span className="font-semibold text-[#039855]">{selectedFeedback.followUpStatus}</span>
              </div>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
