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
    assignedAgent: "Md. Tariqul Hasan",
    csatRating: 5,
  },
  {
    id: "SLA-02",
    ticketNo: "TKT-2026-0304",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    category: "Electrical & MEP",
    priority: "Urgent",
    targetHours: 24,
    actualHours: 30,
    firstResponseMinutes: 45,
    slaStatus: "Breached",
    assignedAgent: "Engr. Mahmudul Karim",
    csatRating: 2,
  },
  {
    id: "SLA-03",
    ticketNo: "TKT-2026-0302",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    category: "Finishing & Tiles",
    priority: "High",
    targetHours: 48,
    actualHours: 36,
    firstResponseMinutes: 30,
    slaStatus: "Within SLA",
    assignedAgent: "Kazi Farhad",
    csatRating: 5,
  },
  {
    id: "SLA-04",
    ticketNo: "TKT-2026-0303",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    category: "Accounts & Billing",
    priority: "Medium",
    targetHours: 48,
    actualHours: 28,
    firstResponseMinutes: 15,
    slaStatus: "Within SLA",
    assignedAgent: "Nusrat Jahan",
    csatRating: 4,
  },
  {
    id: "SLA-05",
    ticketNo: "TKT-2026-0305",
    customerName: "Mrs. Anowara Begum",
    unit: "B-2, Meghna Ocean Pearl",
    project: "Meghna Ocean Pearl",
    category: "Legal & Handover",
    priority: "High",
    targetHours: 72,
    actualHours: 68,
    firstResponseMinutes: 50,
    slaStatus: "Approaching Breach",
    assignedAgent: "Advocate Rezaul Karim",
  },
];

export default function ServiceTicketSlaReportPage() {
  const { primaryColor } = useTheme();
  const [data, setData] = useState<TicketSlaRow[]>(INITIAL_SLA_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRow, setSelectedRow] = useState<TicketSlaRow | null>(null);

  const filteredData = data.filter((row) => {
    if (activeTab === "breached") return row.slaStatus === "Breached";
    if (activeTab === "within") return row.slaStatus === "Within SLA";
    if (activeTab === "urgent") return row.priority === "Urgent";
    if (activeTab === "approaching") return row.slaStatus === "Approaching Breach";
    return true;
  });

  const counts = {
    all: data.length,
    breached: data.filter((d) => d.slaStatus === "Breached").length,
    within: data.filter((d) => d.slaStatus === "Within SLA").length,
    urgent: data.filter((d) => d.priority === "Urgent").length,
    approaching: data.filter((d) => d.slaStatus === "Approaching Breach").length,
  };

  const columns: Column<TicketSlaRow>[] = [
    {
      header: "Ticket Ref & Customer",
      accessorKey: "ticketNo",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.ticketNo}</div>
          <div className="text-xs text-muted-foreground">{row.customerName} • {row.unit}</div>
        </div>
      ),
    },
    {
      header: "Category & Priority",
      accessorKey: "category",
      cell: (row) => {
        const priorityColors = {
          Urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
          High: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
          Medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
          Low: "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
        };
        return (
          <div className="space-y-1">
            <div className="text-xs font-medium text-foreground">{row.category}</div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${priorityColors[row.priority]}`}>
              {row.priority}
            </span>
          </div>
        );
      },
    },
    {
      header: "Response & Resolution Time",
      accessorKey: "actualHours",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground">
            Resolution: <span className="font-bold">{row.actualHours} hrs</span> / Target {row.targetHours}h
          </div>
          <div className="text-muted-foreground text-[11px]">
            1st Response: {row.firstResponseMinutes} mins
          </div>
        </div>
      ),
    },
    {
      header: "SLA Status",
      accessorKey: "slaStatus",
      cell: (row) => {
        const badges = {
          "Within SLA": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
          "Breached": "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
          "Approaching Breach": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
          "Pending Resolution": "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.slaStatus]}`}>
            {row.slaStatus}
          </span>
        );
      },
    },
    {
      header: "Assigned Agent & CSAT",
      accessorKey: "assignedAgent",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground font-medium">{row.assignedAgent}</div>
          {row.csatRating ? (
            <div className="text-amber-500 font-semibold text-[11px]">
              ★ {row.csatRating}.0 Rating
            </div>
          ) : (
            <div className="text-muted-foreground text-[11px]">No rating yet</div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <button
          onClick={() => setSelectedRow(row)}
          className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
          title="View SLA Metrics"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CSPageHeader
        title="Ticket & SLA Performance Reports"
        description="Monitor service level adherence, mean time to first response, resolution velocity, overdue breach investigations, and customer satisfaction."
        badgeText="Service Governance"
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
          subtitle="Target: 90% benchmark"
          icon={CheckCircle2}
          color="emerald"
          trend={{ value: 2.1, isPositive: true }}
        />
        <CSStatCard
          title="Avg Resolution Time"
          value="18.6 hrs"
          subtitle="Target under 24 hrs"
          icon={Clock}
          color="blue"
        />
        <CSStatCard
          title="First Contact Resolution"
          value="78.4%"
          subtitle="Solved on initial visit"
          icon={TrendingUp}
          color="purple"
        />
        <CSStatCard
          title="SLA Breaches This Month"
          value="4"
          subtitle="Promptly escalated to QA Lead"
          icon={AlertTriangle}
          color="rose"
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
        onChange={setActiveTab}
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
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-3">
              <div className="text-xs text-muted-foreground">SLA Compliance Verdict</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{selectedRow.category} ({selectedRow.priority})</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  selectedRow.slaStatus === "Within SLA" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {selectedRow.slaStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Turnaround Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">First Response Time:</span>
                  <div className="font-semibold text-foreground">{selectedRow.firstResponseMinutes} Minutes</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Turnaround:</span>
                  <div className="font-semibold text-foreground">{selectedRow.actualHours} Hours</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Target SLA Limit:</span>
                  <div className="font-semibold text-foreground">{selectedRow.targetHours} Hours</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Engineer:</span>
                  <div className="font-semibold text-foreground">{selectedRow.assignedAgent}</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-foreground/[0.01] text-xs space-y-1">
              <span className="font-semibold text-foreground">SLA Governance Rule Applied:</span>
              <p className="text-muted-foreground text-[11px]">
                Urgent Structural & MEP incidents mandate initial response within 1 hour and site mobilization within 4 hours under customer charter 2026.
              </p>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}

