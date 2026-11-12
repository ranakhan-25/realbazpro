"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Users,
  TrendingUp,
  Flame,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface TicketSlaRow {
  id: string;
  ticketNo: string;
  customerName: string;
  unit: string;
  project: string;
  category: "Plumbing & Sanitary" | "Finishing & Tiles" | "Electrical & MEP" | "Accounts & Billing" | "Legal & Handover";
  priority: "Urgent" | "High" | "Medium" | "Low";
  targetHours: number;
  actualHours: number;
  firstResponseMinutes: number;
  slaStatus: "Within SLA" | "Breached" | "Approaching Breach" | "Pending Resolution";
  assignedAgent: string;
  csatRating?: number;
}

const INITIAL_SLA_DATA: TicketSlaRow[] = [
  {
    id: "SLA-01",
    ticketNo: "TKT-2026-0301",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    category: "Plumbing & Sanitary",
    priority: "Urgent",
    targetHours: 24,
    actualHours: 20,
    firstResponseMinutes: 25,
    slaStatus: "Within SLA",
    assignedAgent: "Engr. Monirul Islam",
    csatRating: 5,
  },
  {
    id: "SLA-02",
    ticketNo: "TKT-2026-0302",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    category: "Finishing & Tiles",
    priority: "Medium",
    targetHours: 48,
    actualHours: 54,
    firstResponseMinutes: 45,
    slaStatus: "Breached",
    assignedAgent: "Kazi Farhad",
    csatRating: 3,
  },
  {
    id: "SLA-03",
    ticketNo: "TKT-2026-0303",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    category: "Electrical & MEP",
    priority: "High",
    targetHours: 24,
    actualHours: 18,
    firstResponseMinutes: 15,
    slaStatus: "Within SLA",
    assignedAgent: "Md. Tariqul Hasan",
    csatRating: 5,
  },
  {
    id: "SLA-04",
    ticketNo: "TKT-2026-0304",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    category: "Electrical & MEP",
    priority: "Urgent",
    targetHours: 24,
    actualHours: 23,
    firstResponseMinutes: 20,
    slaStatus: "Approaching Breach",
    assignedAgent: "Engr. Monirul Islam",
  },
];

export default function TicketSlaPerformancePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, isLoading: isProjectLoading } = useSelectedProject();

  const [rows, setRows] = useState<TicketSlaRow[]>(INITIAL_SLA_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRow, setSelectedRow] = useState<TicketSlaRow | null>(null);

    const scopedRows = rows.filter((r) => {
      if (!project?.name) return true;
      return (
        r.project.toLowerCase().includes(project.name.toLowerCase()) ||
        project.name.toLowerCase().includes(r.project.toLowerCase())
      );
    });

    const displayRows = scopedRows.length > 0 ? scopedRows : rows;

    const filteredData = displayRows.filter((row) => {
      if (activeTab === "within") return row.slaStatus === "Within SLA";
      if (activeTab === "breached") return row.slaStatus === "Breached";
      if (activeTab === "approaching") return row.slaStatus === "Approaching Breach";
      if (activeTab === "urgent") return row.priority === "Urgent";
      return true;
    });

    const counts = {
      all: displayRows.length,
      within: displayRows.filter((r) => r.slaStatus === "Within SLA").length,
      breached: displayRows.filter((r) => r.slaStatus === "Breached").length,
      approaching: displayRows.filter((r) => r.slaStatus === "Approaching Breach").length,
      urgent: displayRows.filter((r) => r.priority === "Urgent").length,
    };

    const columns: Column<TicketSlaRow>[] = [
      {
        key: "ticketNo",
        header: "TICKET NO & CUSTOMER",
        sortable: true,
        minWidth: "220px",
        render: (row) => (
          <div>
            <div className="font-semibold text-[#111827] text-xs">{row.customerName}</div>
            <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{row.ticketNo} • {row.unit}</div>
          </div>
        ),
      },
      {
        key: "category",
        header: "CATEGORY & PRIORITY",
        minWidth: "210px",
        render: (row) => (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#111827]">{row.category}</div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${row.priority === "Urgent"
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : row.priority === "High"
                    ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                    : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                }`}
            >
              {row.priority} Priority
            </span>
          </div>
        ),
      },
      {
        key: "firstResponseMinutes",
        header: "FIRST RESPONSE",
        minWidth: "150px",
        render: (row) => (
          <div className="text-xs font-semibold text-[#111827] tabular-nums">
            {row.firstResponseMinutes} mins
          </div>
        ),
      },
      {
        key: "actualHours",
        header: "TURNAROUND / TARGET",
        minWidth: "180px",
        render: (row) => (
          <div className="text-xs">
            <span className="font-semibold text-[#111827] tabular-nums">{row.actualHours} hrs</span>
            <span className="text-[#6B7280] text-[11px] tabular-nums"> / target {row.targetHours}h</span>
          </div>
        ),
      },
      {
        key: "slaStatus",
        header: "SLA STATUS",
        minWidth: "160px",
        render: (row) => {
          const badges = {
            "Within SLA": "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
            Breached: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
            "Approaching Breach": "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
            "Pending Resolution": "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
          };
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.slaStatus]}`}>
              {row.slaStatus}
            </span>
          );
        },
      },
      {
        key: "assignedAgent",
        header: "ASSIGNED AGENT & CSAT",
        minWidth: "190px",
        render: (row) => (
          <div className="text-xs">
            <div className="text-[#111827] font-semibold">{row.assignedAgent}</div>
            {row.csatRating ? (
              <div className="text-[#F59E0B] font-semibold text-[11px] mt-0.5 tabular-nums">
                ★ {row.csatRating}.0 Rating
              </div>
            ) : (
              <div className="text-[#9CA3AF] text-[11px] mt-0.5">No rating yet</div>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "ACTION",
        align: "right",
        minWidth: "90px",
        render: (row) => (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setSelectedRow(row)}
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              title="View SLA Metrics"
              aria-label="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ];

    if (!isProjectLoading && !projectId) {
      return (
        <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
          <CSPageHeader
            title="Ticket & SLA Performance Reports"
            description="Monitor service level adherence, mean time to first response, resolution velocity, overdue breach investigations, and customer satisfaction."
          />
          <CSSelectProjectEmptyState
            title="Ticket & SLA Performance Reports"
            description="Select a project from the top bar to inspect ticket resolution velocity and SLA compliance metrics."
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
        <CSPageHeader
          title="Ticket & SLA Performance Reports"
          subtitle="Monitor service level adherence, mean time to first response, resolution velocity, overdue breach investigations, and customer satisfaction."
          badge="Service Governance"
          breadcrumbs={[{ label: "Reports & Analytics" }, { label: "Ticket SLA Reports" }]}
          primaryAction={{
            label: "Export SLA Report",
            icon: Download,
            onClick: () => toast.success("SLA Compliance Report exported."),
          }}
          secondaryActions={[
            {
              label: "Refresh SLA Calculation",
              icon: Clock,
              onClick: () => toast.success("Ticket response and resolution metrics updated."),
            },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CSStatCard
            title="Overall SLA Adherence"
            value="94.2%"
            subtext="Target: 90% benchmark"
            icon={CheckCircle2}
            trend={{ value: "+2.1%", isPositive: true }}
          />
          <CSStatCard
            title="Avg Resolution Time"
            value="18.6 hrs"
            subtext="Target under 24 hrs"
            icon={Clock}
            iconBg="bg-[#EFF6FF]"
            iconColor="text-[#2563EB]"
          />
          <CSStatCard
            title="First Contact Resolution"
            value="78.4%"
            subtext="Solved on initial visit"
            icon={TrendingUp}
            iconBg="bg-[#F4F1FF]"
            iconColor="text-[#6D4AFF]"
          />
          <CSStatCard
            title="SLA Breaches This Month"
            value="4"
            subtext="Promptly escalated to QA Lead"
            icon={AlertTriangle}
            iconBg="bg-[#FEF2F2]"
            iconColor="text-[#DC2626]"
          />
        </div>

        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Tickets Monitored", count: counts.all },
            { key: "within", label: "Within SLA", count: counts.within },
            { key: "breached", label: "SLA Breaches", count: counts.breached },
            { key: "approaching", label: "Approaching SLA Deadline", count: counts.approaching },
            { key: "urgent", label: "Urgent Priority", count: counts.urgent },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <CSTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search by ticket no, customer, category, or assigned agent..."
          exportFileName="RealBiz_Ticket_SLA_Performance"
        />

        {/* Drawer */}
        <CSDetailDrawer
          isOpen={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          title={`SLA Audit: ${selectedRow?.ticketNo}`}
          subtitle={`${selectedRow?.customerName} • ${selectedRow?.category}`}
        >
          {selectedRow && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
                <div className="text-[11px] text-[#6B7280]">SLA Compliance Verdict</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#111827]">{selectedRow.category} ({selectedRow.priority})</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${selectedRow.slaStatus === "Within SLA"
                      ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                      : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    }`}>
                    {selectedRow.slaStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Turnaround Metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">First Response Time:</span>
                    <div className="font-semibold text-[#111827] tabular-nums">{selectedRow.firstResponseMinutes} Minutes</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Total Turnaround:</span>
                    <div className="font-semibold text-[#111827] tabular-nums">{selectedRow.actualHours} Hours</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Target SLA Limit:</span>
                    <div className="font-semibold text-[#111827] tabular-nums">{selectedRow.targetHours} Hours</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Assigned Engineer:</span>
                    <div className="font-semibold text-[#111827]">{selectedRow.assignedAgent}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] border border-[#E5E7EB] bg-white text-xs space-y-1">
                <span className="font-semibold text-[#111827]">SLA Governance Rule Applied:</span>
                <p className="text-[#6B7280] text-[11px]">
                  Urgent Structural & MEP incidents mandate initial response within 1 hour and site mobilization within 4 hours under customer charter 2026.
                </p>
              </div>
            </div>
          )}
        </CSDetailDrawer>
      </div>
    );
  }
