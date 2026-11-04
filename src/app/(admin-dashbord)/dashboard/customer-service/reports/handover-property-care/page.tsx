"use client";

import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Building2,
  Download,
  Clock,
  TrendingUp,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface ProjectHandoverReport {
  id: string;
  projectName: string;
  location: string;
  totalUnits: number;
  handedOverUnits: number;
  pendingInspections: number;
  openSnags: number;
  activeDlpUnits: number;
  dlpClaimsResolved: number;
  totalDlpExpenditure: string;
  maintenanceCollectionRate: string;
  associationStatus: "Formed & Handed" | "In Formation" | "Developer Managed";
}

const INITIAL_PROJECT_REPORTS: ProjectHandoverReport[] = [
  {
    id: "PRJ-01",
    projectName: "Hena Heights",
    location: "Gulshan-2, Dhaka",
    totalUnits: 36,
    handedOverUnits: 28,
    pendingInspections: 4,
    openSnags: 6,
    activeDlpUnits: 28,
    dlpClaimsResolved: 14,
    totalDlpExpenditure: "৳ 4,85,000",
    maintenanceCollectionRate: "97.5%",
    associationStatus: "In Formation",
  },
  {
    id: "PRJ-02",
    projectName: "Sheba Green Valley",
    location: "Mirpur DOHS, Dhaka",
    totalUnits: 48,
    handedOverUnits: 48,
    pendingInspections: 0,
    openSnags: 0,
    activeDlpUnits: 48,
    dlpClaimsResolved: 26,
    totalDlpExpenditure: "৳ 7,20,000",
    maintenanceCollectionRate: "98.2%",
    associationStatus: "Formed & Handed",
  },
  {
    id: "PRJ-03",
    projectName: "Eastern Lakeview",
    location: "Bashundhara R/A, Dhaka",
    totalUnits: 40,
    handedOverUnits: 32,
    pendingInspections: 5,
    openSnags: 9,
    activeDlpUnits: 32,
    dlpClaimsResolved: 11,
    totalDlpExpenditure: "৳ 3,40,000",
    maintenanceCollectionRate: "95.0%",
    associationStatus: "Developer Managed",
  },
  {
    id: "PRJ-04",
    projectName: "Uttara Green Park",
    location: "Sector 11, Uttara, Dhaka",
    totalUnits: 50,
    handedOverUnits: 42,
    pendingInspections: 3,
    openSnags: 4,
    activeDlpUnits: 42,
    dlpClaimsResolved: 18,
    totalDlpExpenditure: "৳ 5,60,000",
    maintenanceCollectionRate: "96.8%",
    associationStatus: "In Formation",
  },
  {
    id: "PRJ-05",
    projectName: "Meghna Ocean Pearl",
    location: "Agrabad, Chattogram",
    totalUnits: 30,
    handedOverUnits: 18,
    pendingInspections: 8,
    openSnags: 12,
    activeDlpUnits: 18,
    dlpClaimsResolved: 7,
    totalDlpExpenditure: "৳ 2,15,000",
    maintenanceCollectionRate: "92.0%",
    associationStatus: "Developer Managed",
  },
];

export default function HandoverPropertyCareReportPage() {
  const { primaryColor } = useTheme();
  const [reports] = useState<ProjectHandoverReport[]>(INITIAL_PROJECT_REPORTS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<ProjectHandoverReport | null>(null);

  const filteredReports = reports.filter((r) => {
    if (activeTab === "handed") return r.handedOverUnits === r.totalUnits;
    if (activeTab === "ongoing") return r.handedOverUnits < r.totalUnits;
    if (activeTab === "association") return r.associationStatus === "Formed & Handed";
    return true;
  });

  const counts = {
    all: reports.length,
    handed: reports.filter((r) => r.handedOverUnits === r.totalUnits).length,
    ongoing: reports.filter((r) => r.handedOverUnits < r.totalUnits).length,
    association: reports.filter((r) => r.associationStatus === "Formed & Handed").length,
  };

  const columns: Column<ProjectHandoverReport>[] = [
    {
      header: "PROJECT & LOCATION",
      accessorKey: "projectName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[#111827]">{row.projectName}</div>
          <div className="text-xs text-[#6B7280]">{row.location}</div>
        </div>
      ),
    },
    {
      header: "HANDOVER PROGRESS",
      accessorKey: "handedOverUnits",
      cell: (row) => {
        const pct = Math.round((row.handedOverUnits / row.totalUnits) * 100);
        return (
          <div className="space-y-1.5 w-36">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#111827] tabular-nums">
                {row.handedOverUnits}/{row.totalUnits} Units
              </span>
              <span className="text-[#6B7280] font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: primaryColor || "#6D4AFF" }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "SNAGS & INSPECTIONS",
      accessorKey: "openSnags",
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[#374151]">
            Open Snags: <span className="font-semibold text-[#B54708] tabular-nums">{row.openSnags}</span>
          </div>
          <div className="text-[#6B7280] text-[11px] tabular-nums">
            {row.pendingInspections} Inspections Pending
          </div>
        </div>
      ),
    },
    {
      header: "2-YR STATUTORY DLP",
      accessorKey: "activeDlpUnits",
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[#111827] font-semibold tabular-nums">{row.activeDlpUnits} Units Covered</div>
          <div className="text-[#027A48] text-[11px] font-semibold tabular-nums">{row.dlpClaimsResolved} Claims Rectified</div>
        </div>
      ),
    },
    {
      header: "DLP RECTIFICATION COST",
      accessorKey: "totalDlpExpenditure",
      cell: (row) => (
        <span className="text-xs font-semibold text-[#111827] tabular-nums">
          {row.totalDlpExpenditure}
        </span>
      ),
    },
    {
      header: "OWNERS ASSOCIATION",
      accessorKey: "associationStatus",
      cell: (row) => {
        const badges = {
          "Formed & Handed": "bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48]",
          "In Formation": "bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3]",
          "Developer Managed": "bg-[#F4F3FF] border border-[#DDD6FE] text-[#5925DC]",
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold shadow-2xs ${badges[row.associationStatus]}`}>
            {row.associationStatus}
          </span>
        );
      },
    },
    {
      header: "ACTION",
      accessorKey: "id",
      align: "right",
      minWidth: "90px",
      cell: (row) => (
        <div className="flex items-center justify-end pr-2">
          <button
            onClick={() => setSelectedProject(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title="View Project Care Report"
            aria-label="View Project Care Report"
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
        title="Handover & Property Care Reports"
        description="Comprehensive audit of unit handover velocity, joint snag rectification velocity, statutory 2-year DLP expenditures, and Owners Association transitions."
        badgeText="After-Sales Audits"
        primaryAction={{
          label: "Export Handover Report",
          icon: Download,
          onClick: () => toast.success("Property Care & Handover Audit Report exported."),
        }}
        secondaryActions={[
          {
            label: "Sync Site Snag Logs",
            icon: Clock,
            onClick: () => toast.success("On-site engineering snag logs synchronized."),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Total Handed Over Units"
          value="168 / 204"
          subtitle="82.3% Portfolio Handover"
          icon={KeyRound}
          color="emerald"
        />
        <CSStatCard
          title="Avg Snag Rectification"
          value="3.8 Days"
          subtitle="Pre-possession punchlist speed"
          icon={Clock}
          color="blue"
        />
        <CSStatCard
          title="Active Statutory DLP Units"
          value="168 Units"
          subtitle="Real Estate Act 2010 Protected"
          icon={ShieldCheck}
          color="purple"
        />
        <CSStatCard
          title="Service Charge Recovery"
          value="96.2%"
          subtitle="Common area facility billing"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Projects", count: counts.all },
          { key: "ongoing", label: "Active Handover Ongoing", count: counts.ongoing },
          { key: "handed", label: "100% Handed Over", count: counts.handed },
          { key: "association", label: "OA Formed & Handed", count: counts.association },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={filteredReports}
        searchPlaceholder="Search by project name or location..."
        exportFileName="RealBiz_Handover_Property_Care_Report"
      />

      {/* Detail Drawer */}
      <CSDetailDrawer
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={`Handover & DLP Audit: ${selectedProject?.projectName || ""}`}
        subtitle={`${selectedProject?.location || ""} • ${selectedProject?.totalUnits || 0} Total Units`}
      >
        {selectedProject && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] space-y-3">
              <div className="text-xs font-semibold text-[#6B7280]">Handover & Delivery Completion</div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#111827] tabular-nums">
                  {selectedProject.handedOverUnits} of {selectedProject.totalUnits} Units Handed Over
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] tabular-nums">
                  {Math.round((selectedProject.handedOverUnits / selectedProject.totalUnits) * 100)}% Complete
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Defect & DLP Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Active DLP Warranties:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedProject.activeDlpUnits} Units</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Rectified DLP Claims:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedProject.dlpClaimsResolved} Claims</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Open Snags:</span>
                  <div className="font-semibold text-[#B54708] tabular-nums">{selectedProject.openSnags} Pending</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Total DLP Expenditure:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedProject.totalDlpExpenditure}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Owners Association & Facility</h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Association Status:</span>
                  <div className="font-semibold text-[#111827]">{selectedProject.associationStatus}</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Maintenance Collection:</span>
                  <div className="font-semibold text-[#027A48] tabular-nums">{selectedProject.maintenanceCollectionRate}</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] text-xs space-y-1.5">
              <span className="font-bold text-[#111827]">Statutory Real Estate Act 2010 Mandate:</span>
              <p className="text-[#6B7280] text-[11.5px] leading-relaxed">
                The developer shall maintain structural defects, concealed plumbing, and electrical installations at developer's own expense for a statutory period of 24 months from the date of physical key handover.
              </p>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
