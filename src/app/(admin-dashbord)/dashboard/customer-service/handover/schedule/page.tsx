"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  AlertCircle,
  Plus,
  ArrowRight,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { HandoverItem } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_HANDOVERS: HandoverItem[] = [
  {
    id: "HO-301",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    targetHandoverDate: "2026-11-20",
    readinessPercentage: 98,
    jointInspectionDone: true,
    snagsIdentified: 4,
    snagsResolved: 4,
    possessionCertIssued: true,
    handoverStatus: "Ready for Key Delivery",
  },
  {
    id: "HO-302",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    targetHandoverDate: "2026-12-05",
    readinessPercentage: 92,
    jointInspectionDone: true,
    snagsIdentified: 7,
    snagsResolved: 5,
    possessionCertIssued: false,
    handoverStatus: "Snag Rectification",
  },
  {
    id: "HO-303",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    targetHandoverDate: "2026-10-15",
    readinessPercentage: 100,
    jointInspectionDone: true,
    snagsIdentified: 3,
    snagsResolved: 3,
    keyRegisterNo: "KEY-2026-00412",
    possessionCertIssued: true,
    handoverStatus: "Possession Taken",
  },
];

export default function HandoverSchedulePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [handovers, setHandovers] = useState<HandoverItem[]>(INITIAL_HANDOVERS);

  const filtered = handovers.filter((h) => {
    if (activeTab === "ready") return h.handoverStatus === "Ready for Key Delivery";
    if (activeTab === "snags") return h.handoverStatus === "Snag Rectification";
    if (activeTab === "completed") return h.handoverStatus === "Possession Taken";
    return true;
  });

  const columns: Column<HandoverItem>[] = [
    {
      key: "id",
      header: "HANDOVER ID & PROJECT",
      sortable: true,
      minWidth: "180px",
      render: (h) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{h.id}</span>
          <div className="text-[11px] text-[#6B7280] mt-0.5">{h.project}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "PURCHASER & ALLOTMENT",
      minWidth: "200px",
      render: (h) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{h.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{h.unit}</div>
        </div>
      ),
    },
    {
      key: "readinessPercentage",
      header: "CIVIL & MEP READINESS",
      sortable: true,
      minWidth: "170px",
      render: (h) => (
        <div className="space-y-1.5 w-36">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-[#6B7280]">Readiness</span>
            <span className={`tabular-nums ${h.readinessPercentage >= 95 ? "text-[#039855]" : "text-[#DC6803]"}`}>
              {h.readinessPercentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                h.readinessPercentage >= 95 ? "bg-[#039855]" : "bg-[#F79009]"
              }`}
              style={{ width: `${h.readinessPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "targetHandoverDate",
      header: "TARGET POSSESSION DATE",
      minWidth: "180px",
      render: (h) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827] tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" /> {h.targetHandoverDate}
        </div>
      ),
    },
    {
      key: "snagsIdentified",
      header: "SNAGS RECTIFIED",
      minWidth: "160px",
      render: (h) => (
        <div>
          <span className="text-xs font-semibold text-[#111827] tabular-nums">
            {h.snagsResolved} / {h.snagsIdentified} Snags
          </span>
          {h.snagsIdentified > h.snagsResolved ? (
            <div className="text-[10px] text-[#DC6803] font-medium mt-0.5">Rectification in progress</div>
          ) : (
            <div className="text-[10px] text-[#039855] font-semibold mt-0.5">100% Cleared</div>
          )}
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "STATUS",
      minWidth: "180px",
      render: (h) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            h.handoverStatus === "Possession Taken"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : h.handoverStatus === "Ready for Key Delivery"
                ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
          }`}
        >
          {h.handoverStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "90px",
      render: (h) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => toast.info(`Viewing handover schedule details for ${h.unit}`)}
            title="View Handover Details"
            aria-label="View Handover Details"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Handover & Possession Schedule"
        subtitle="Manage project completion timelines, joint client inspections, snag clearances and formal possession dates."
        badge="Possession Management"
        breadcrumbs={[{ label: "Handover & Possession" }, { label: "Handover Schedule" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Scheduled Handovers"
          value={handovers.length.toString()}
          subtext="Under active transition pipeline"
          icon={KeyRound}
        />
        <CSStatCard
          title="Ready for Key Delivery"
          value={handovers.filter((h) => h.handoverStatus === "Ready for Key Delivery").length.toString()}
          subtext="100% snag rectification cleared"
          icon={CheckCircle2}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Handed Over This Quarter"
          value="42 Flats"
          subtext="Possession certificates signed"
          icon={Building}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Scheduled Flats", count: handovers.length },
          {
            key: "ready",
            label: "Ready for Key Delivery",
            count: handovers.filter((h) => h.handoverStatus === "Ready for Key Delivery").length,
          },
          {
            key: "snags",
            label: "Snag Rectification Active",
            count: handovers.filter((h) => h.handoverStatus === "Snag Rectification").length,
            badgeVariant: "warning",
          },
          {
            key: "completed",
            label: "Possession Completed",
            count: handovers.filter((h) => h.handoverStatus === "Possession Taken").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search handover ID, customer name, project or unit..."
        searchFields={["id", "customerName", "project", "unit"]}
        emptyTitle="No handover schedules found"
      />
    </div>
  );
}
