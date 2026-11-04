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
      header: "Handover ID",
      sortable: true,
      render: (h) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{h.id}</span>
          <div className="text-[11px] text-slate-500">{h.project}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Purchaser & Allotment",
      render: (h) => (
        <div>
          <div className="font-bold text-slate-900">{h.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{h.unit}</div>
        </div>
      ),
    },
    {
      key: "readinessPercentage",
      header: "Civil & MEP Readiness",
      sortable: true,
      render: (h) => (
        <div className="space-y-1 w-36">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-700">Readiness</span>
            <span className={h.readinessPercentage >= 95 ? "text-emerald-700" : "text-amber-700"}>
              {h.readinessPercentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                h.readinessPercentage >= 95 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${h.readinessPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "targetHandoverDate",
      header: "Target Possession Date",
      render: (h) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {h.targetHandoverDate}
        </div>
      ),
    },
    {
      key: "snagsIdentified",
      header: "Snags Rectified",
      render: (h) => (
        <div>
          <span className="text-xs font-bold text-slate-800">
            {h.snagsResolved} / {h.snagsIdentified} Snags
          </span>
          {h.snagsIdentified > h.snagsResolved ? (
            <div className="text-[10px] text-amber-700 font-semibold">Rectification in progress</div>
          ) : (
            <div className="text-[10px] text-emerald-700 font-bold">100% Cleared</div>
          )}
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "Status",
      render: (h) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            h.handoverStatus === "Possession Taken"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : h.handoverStatus === "Ready for Key Delivery"
                ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {h.handoverStatus}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <CSStatCard
          title="Handed Over This Quarter"
          value="42 Flats"
          subtext="Possession certificates signed"
          icon={Building}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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

