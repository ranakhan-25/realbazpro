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
  csatScore: number; // 1 to 5
  npsScore: number; // 0 to 10
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
    comments: "Monthly drone video progress updates and WhatsApp milestone alerts are very reassuring for overseas and busy doctors like me.",
    followUpStatus: "Satisfied - Closed",
    assignedOfficer: "Md. Tariqul Hasan",
    submittedAt: "2026-11-01 02:00 PM",
  },
  {
    id: "FB-104",
    feedbackNo: "CSAT-2026-084",
    customerName: "Mrs. Anowara Begum",
    unit: "B-2, Meghna Ocean Pearl",
    project: "Meghna Ocean Pearl",
    surveyType: "Pre-Sales to Post-Sales",
    csatScore: 4,
    npsScore: 8,
    npsCategory: "Passive",
    comments: "Overall good transition from sales to customer care. Payment ledger portal could have easier bKash/Nagad instant receipt generation.",
    followUpStatus: "Action Taken",
    assignedOfficer: "Kazi Farhad",
    submittedAt: "2026-10-29 05:20 PM",
  },
  {
    id: "FB-105",
    feedbackNo: "CSAT-2026-085",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    surveyType: "DLP Resolution",
    csatScore: 2,
    npsScore: 5,
    npsCategory: "Detractor",
    comments: "Sub-station earthing fluctuation tripped my sensitive equipment. Requires immediate electrical team verification.",
    followUpStatus: "Pending Review",
    assignedOfficer: "Engr. Mahmudul Karim",
    submittedAt: "2026-11-04 08:15 AM",
  },
];

export default function FeedbackSurveysPage() {
  const { primaryColor } = useTheme();
  const [feedbacks, setFeedbacks] = useState<FeedbackSurvey[]>(INITIAL_FEEDBACK);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSurvey | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  // Survey Campaign state
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignType, setCampaignType] = useState<FeedbackSurvey["surveyType"]>("Handover CSAT");
  const [targetProject, setTargetProject] = useState("All Projects");

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (activeTab === "promoters") return fb.npsCategory === "Promoter";
    if (activeTab === "passives") return fb.npsCategory === "Passive";
    if (activeTab === "detractors") return fb.npsCategory === "Detractor";
    if (activeTab === "handover") return fb.surveyType === "Handover CSAT";
    if (activeTab === "dlp") return fb.surveyType === "DLP Resolution";
    if (activeTab === "escalated") return fb.followUpStatus === "Escalated to CX Head" || fb.followUpStatus === "Pending Review";
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
    toast.success(`Survey campaign "${campaignTitle || campaignType}" dispatched to ${targetProject}`);
    setIsSurveyModalOpen(false);
    setCampaignTitle("");
  };

  const handleStatusUpdate = (id: string, newStatus: FeedbackSurvey["followUpStatus"]) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, followUpStatus: newStatus } : f))
    );
    toast.success(`Feedback status updated to: ${newStatus}`);
  };

  const columns: Column<FeedbackSurvey>[] = [
    {
      header: "Survey Ref & Customer",
      accessorKey: "feedbackNo",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.feedbackNo} • {row.unit}</div>
        </div>
      ),
    },
    {
      header: "Touchpoint / Category",
      accessorKey: "surveyType",
      cell: (row) => (
        <span className="text-xs font-medium text-foreground bg-foreground/5 px-2.5 py-1 rounded-md">
          {row.surveyType}
        </span>
      ),
    },
    {
      header: "CSAT & NPS",
      accessorKey: "csatScore",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < row.csatScore ? "fill-amber-400 text-amber-400" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-foreground ml-1">{row.csatScore}.0</span>
          </div>
          <div className="text-[11px] font-semibold flex items-center gap-1">
            {row.npsCategory === "Promoter" && <Smile className="h-3 w-3 text-emerald-500" />}
            {row.npsCategory === "Passive" && <Meh className="h-3 w-3 text-amber-500" />}
            {row.npsCategory === "Detractor" && <Frown className="h-3 w-3 text-rose-500" />}
            <span className={
              row.npsCategory === "Promoter" ? "text-emerald-600" :
              row.npsCategory === "Passive" ? "text-amber-600" : "text-rose-600"
            }>
              NPS {row.npsScore}/10 ({row.npsCategory})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Customer Voice / Comments",
      accessorKey: "comments",
      cell: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm" title={row.comments}>
          {row.comments}
        </p>
      ),
    },
    {
      header: "Follow-up Status",
      accessorKey: "followUpStatus",
      cell: (row) => {
        const badges = {
          "Satisfied - Closed": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
          "Pending Review": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
          "Escalated to CX Head": "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
          "Action Taken": "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.followUpStatus]}`}>
            {row.followUpStatus}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFeedback(row)}
            className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
            title="View Survey"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.npsCategory === "Detractor" && row.followUpStatus !== "Action Taken" && (
            <button
              onClick={() => handleStatusUpdate(row.id, "Escalated to CX Head")}
              className="px-2 py-1 text-xs rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition"
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
    <div className="space-y-6">
      <CSPageHeader
        title="Feedback, Surveys & NPS"
        description="Monitor buyer sentiment across key touchpoints: booking confirmation, construction progress, handover possession, and 2-year DLP property care."
        badgeText="Voice of Customer"
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
          subtitle="Industry benchmark: +35"
          icon={TrendingUp}
          color="emerald"
          trend={{ value: 8, isPositive: true }}
        />
        <CSStatCard
          title="Average CSAT Rating"
          value="4.6 / 5.0"
          subtitle="Based on 248 reviews"
          icon={Star}
          color="amber"
        />
        <CSStatCard
          title="Brand Promoters (9-10)"
          value="78%"
          subtitle="Advocates & Referral Drivers"
          icon={Smile}
          color="blue"
        />
        <CSStatCard
          title="Active Detractors"
          value="2"
          subtitle="Requiring CX Management Follow-up"
          icon={Frown}
          color="rose"
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
        onChange={setActiveTab}
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
        description="Dispatch automated SMS and email survey links to allottees at specific milestone touchpoints."
      >
        <form onSubmit={handleLaunchCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Campaign Title</label>
            <input
              type="text"
              placeholder="e.g. Q4 2026 Handover Allottee CSAT"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Survey Touchpoint *</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Handover CSAT">Handover & Key Possession CSAT</option>
                <option value="Construction Update">Construction Progress Transparency</option>
                <option value="DLP Resolution">DLP Rectification Satisfaction</option>
                <option value="Pre-Sales to Post-Sales">Sales to Post-Sales Transition</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Project *</label>
              <select
                value={targetProject}
                onChange={(e) => setTargetProject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All Projects">All Active Projects</option>
                <option value="Hena Heights, Gulshan">Hena Heights, Gulshan</option>
                <option value="Sheba Green Valley">Sheba Green Valley</option>
                <option value="Eastern Lakeview">Eastern Lakeview</option>
                <option value="Uttara Green Park">Uttara Green Park</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-foreground/[0.02] space-y-2 text-xs">
            <span className="font-semibold text-foreground">Standard 3-Question Survey Template:</span>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>How satisfied are you with the finishing quality and handover timeline? (1-5 Stars)</li>
              <li>How likely are you to recommend RealBiz Pro developments to friends and family? (NPS 0-10)</li>
              <li>Any suggestions or unresolved concerns for our site engineering team? (Open text)</li>
            </ol>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsSurveyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-foreground/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Dispatch Survey Link
            </button>
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
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-2">
              <div className="text-xs text-muted-foreground">NPS Category & CSAT</div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">
                  {selectedFeedback.npsCategory} ({selectedFeedback.npsScore}/10)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {selectedFeedback.csatScore} / 5 Stars
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer & Unit</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit & Project:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.unit}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Touchpoint:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.surveyType}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted At:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.submittedAt}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buyer's Written Remarks</h4>
              <p className="text-xs text-foreground bg-background p-3 rounded-lg border border-border leading-relaxed">
                "{selectedFeedback.comments}"
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up Workflow</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Current Status:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.followUpStatus}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Officer:</span>
                  <div className="font-semibold text-foreground">{selectedFeedback.assignedOfficer}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleStatusUpdate(selectedFeedback.id, "Action Taken");
                  setSelectedFeedback(null);
                }}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
              >
                Mark Action Taken & Closed
              </button>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}

