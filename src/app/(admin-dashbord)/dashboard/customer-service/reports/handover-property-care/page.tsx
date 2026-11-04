"use client";

import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Wrench,
  Building2,
  Download,
  Clock,
  TrendingUp,
  CheckCircle2,
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
  const [reports, setReports] = useState<ProjectHandoverReport[]>(INITIAL_PROJECT_REPORTS);
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
      header: "Project & Location",
      accessorKey: "projectName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.projectName}</div>
          <div className="text-xs text-muted-foreground">{row.location}</div>
        </div>
      ),
    },
    {
      header: "Handover Progress",
      accessorKey: "handedOverUnits",
      cell: (row) => {
        const pct = Math.round((row.handedOverUnits / row.totalUnits) * 100);
        return (
          <div className="space-y-1 w-32">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-foreground">{row.handedOverUnits}/{row.totalUnits} Units</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Snags & Inspections",
      accessorKey: "openSnags",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground">
            Open Snags: <span className="font-semibold text-amber-600">{row.openSnags}</span>
          </div>
          <div className="text-muted-foreground text-[11px]">
            {row.pendingInspections} Inspections Pending
          </div>
        </div>
      ),
    },
    {
      header: "2-Yr Statutory DLP",
      accessorKey: "activeDlpUnits",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground font-medium">{row.activeDlpUnits} Units Covered</div>
          <div className="text-emerald-600 text-[11px] font-medium">{row.dlpClaimsResolved} Claims Rectified</div>
        </div>
      ),
    },
    {
      header: "DLP Rectification Cost",
      accessorKey: "totalDlpExpenditure",
      cell: (row) => (
        <span className="text-xs font-mono font-medium text-foreground">
          {row.totalDlpExpenditure}
        </span>
      ),
    },
    {
      header: "Owners Association Status",
      accessorKey: "associationStatus",
      cell: (row) => {
        const badges = {
          "Formed & Handed": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
          "In Formation": "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
          "Developer Managed": "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.associationStatus]}`}>
            {row.associationStatus}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <button
          onClick={() => setSelectedProject(row)}
          className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
          title="View Project Care Report"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
        onChange={setActiveTab}
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
        title={`Handover & DLP Audit: ${selectedProject?.projectName}`}
        subtitle={`${selectedProject?.location} • ${selectedProject?.totalUnits} Total Units`}
      >
        {selectedProject && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-3">
              <div className="text-xs text-muted-foreground">Handover & Delivery Completion</div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">
                  {selectedProject.handedOverUnits} of {selectedProject.totalUnits} Units Handed Over
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {Math.round((selectedProject.handedOverUnits / selectedProject.totalUnits) * 100)}% Complete
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Defect & DLP Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Active DLP Warranties:</span>
                  <div className="font-semibold text-foreground">{selectedProject.activeDlpUnits} Units</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rectified DLP Claims:</span>
                  <div className="font-semibold text-foreground">{selectedProject.dlpClaimsResolved} Claims</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Open Snags:</span>
                  <div className="font-semibold text-amber-600">{selectedProject.openSnags} Pending</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total DLP Expenditure:</span>
                  <div className="font-semibold text-foreground font-mono">{selectedProject.totalDlpExpenditure}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owners Association & Facility</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Association Status:</span>
                  <div className="font-semibold text-foreground">{selectedProject.associationStatus}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Maintenance Collection:</span>
                  <div className="font-semibold text-emerald-600">{selectedProject.maintenanceCollectionRate}</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-foreground/[0.01] text-xs space-y-1">
              <span className="font-semibold text-foreground">Statutory Real Estate Act 2010 Mandate:</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Developer shall maintain structural defects, concealed plumbing, and electrical installations at developer's own expense for a statutory period of 24 months from the date of physical key handover.
              </p>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}

