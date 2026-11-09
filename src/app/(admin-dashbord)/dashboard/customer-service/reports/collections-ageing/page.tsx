"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  FileSpreadsheet,
  PieChart,
  Eye,
  CheckCircle2,
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

interface AgeingReportRow {
  id: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  totalAgreementValue: string;
  totalCollected: string;
  overdueAmount: string;
  overdueDays: number;
  ageingBracket: "Current (0-30 d)" | "31-60 Days" | "61-90 Days" | "90+ Days Critical";
  delaySurcharge: string;
  noticeStage: "1st Reminder" | "2nd Notice" | "Final Statutory Notice" | "On Track";
  recoveryOfficer: string;
}

const INITIAL_AGEING_DATA: AgeingReportRow[] = [
  {
    id: "AGE-01",
    customerName: "Mrs. Anowara Begum",
    phone: "+880 1715-334455",
    unit: "B-2, Meghna Ocean Pearl",
    project: "Meghna Ocean Pearl",
    totalAgreementValue: "৳ 1,45,00,000",
    totalCollected: "৳ 95,00,000",
    overdueAmount: "৳ 12,00,000",
    overdueDays: 62,
    ageingBracket: "61-90 Days",
    delaySurcharge: "৳ 36,000",
    noticeStage: "2nd Notice",
    recoveryOfficer: "Tariqul Alam",
  },
  {
    id: "AGE-02",
    customerName: "Sultana Razia",
    phone: "+880 1678-112233",
    unit: "F-5, Padma Riverside",
    project: "Padma Riverside",
    totalAgreementValue: "৳ 1,10,00,000",
    totalCollected: "৳ 65,00,000",
    overdueAmount: "৳ 15,50,000",
    overdueDays: 104,
    ageingBracket: "90+ Days Critical",
    delaySurcharge: "৳ 69,750",
    noticeStage: "Final Statutory Notice",
    recoveryOfficer: "Advocate Rezaul Karim",
  },
  {
    id: "AGE-03",
    customerName: "Mohammad Rafiqul Islam",
    phone: "+880 1711-223344",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    totalAgreementValue: "৳ 2,10,00,000",
    totalCollected: "৳ 1,65,00,000",
    overdueAmount: "৳ 8,50,000",
    overdueDays: 14,
    ageingBracket: "Current (0-30 d)",
    delaySurcharge: "৳ 0",
    noticeStage: "1st Reminder",
    recoveryOfficer: "Nusrat Jahan",
  },
  {
    id: "AGE-04",
    customerName: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    totalAgreementValue: "৳ 1,75,00,000",
    totalCollected: "৳ 1,75,00,000",
    overdueAmount: "৳ 0",
    overdueDays: 0,
    ageingBracket: "Current (0-30 d)",
    delaySurcharge: "৳ 0",
    noticeStage: "On Track",
    recoveryOfficer: "Nusrat Jahan",
  },
];

export default function CollectionsAgeingReportPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, isLoading: isProjectLoading } = useSelectedProject();

  const [rows, setRows] = useState<AgeingReportRow[]>(INITIAL_AGEING_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AgeingReportRow | null>(null);

    const scopedRows = rows.filter((r) => {
      if (!project?.name) return true;
      return (
        r.project.toLowerCase().includes(project.name.toLowerCase()) ||
        project.name.toLowerCase().includes(r.project.toLowerCase())
      );
    });

    const displayRows = scopedRows.length > 0 ? scopedRows : rows;

    const filteredData = displayRows.filter((row) => {
      if (activeTab === "critical") return row.ageingBracket === "90+ Days Critical";
      if (activeTab === "61to90") return row.ageingBracket === "61-90 Days";
      if (activeTab === "31to60") return row.ageingBracket === "31-60 Days";
      if (activeTab === "current") return row.ageingBracket === "Current (0-30 d)";
      if (activeTab === "notices") return row.noticeStage !== "On Track";
      return true;
    });

    const counts = {
      all: displayRows.length,
      critical: displayRows.filter((r) => r.ageingBracket === "90+ Days Critical").length,
      "61to90": displayRows.filter((r) => r.ageingBracket === "61-90 Days").length,
      "31to60": displayRows.filter((r) => r.ageingBracket === "31-60 Days").length,
      current: displayRows.filter((r) => r.ageingBracket === "Current (0-30 d)").length,
      notices: displayRows.filter((r) => r.noticeStage !== "On Track").length,
    };

    const columns: Column<AgeingReportRow>[] = [
      {
        key: "customerName",
        header: "CUSTOMER & UNIT",
        sortable: true,
        minWidth: "220px",
        render: (row) => (
          <div>
            <div className="font-semibold text-[#111827] text-xs">{row.customerName}</div>
            <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{row.unit}</div>
            <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">{row.phone}</div>
          </div>
        ),
      },
      {
        key: "totalAgreementValue",
        header: "AGREEMENT & COLLECTED",
        minWidth: "190px",
        render: (row) => (
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-[#111827] tabular-nums">{row.totalAgreementValue}</div>
            <div className="text-[11px] text-[#039855] font-medium tabular-nums">Paid: {row.totalCollected}</div>
          </div>
        ),
      },
      {
        key: "overdueAmount",
        header: "OVERDUE PRINCIPAL",
        sortable: true,
        minWidth: "160px",
        render: (row) => (
          <span className={`text-xs font-semibold tabular-nums ${row.overdueAmount === "৳ 0" ? "text-[#039855]" : "text-[#DC2626]"}`}>
            {row.overdueAmount}
          </span>
        ),
      },
      {
        key: "ageingBracket",
        header: "AGEING BRACKET",
        minWidth: "180px",
        render: (row) => {
          const colors = {
            "Current (0-30 d)": "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
            "31-60 Days": "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
            "61-90 Days": "bg-[#FFF4ED] text-[#D92D20] border border-[#FECDCA]",
            "90+ Days Critical": "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
          };
          return (
            <div className="space-y-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colors[row.ageingBracket]}`}>
                {row.ageingBracket}
              </span>
              <div className="text-[11px] text-[#6B7280] tabular-nums pl-1">{row.overdueDays} days past due</div>
            </div>
          );
        },
      },
      {
        key: "delaySurcharge",
        header: "ACCRUED SURCHARGE",
        minWidth: "160px",
        render: (row) => (
          <span className="text-xs font-semibold text-[#111827] tabular-nums">
            {row.delaySurcharge}
          </span>
        ),
      },
      {
        key: "noticeStage",
        header: "RECOVERY NOTICE STAGE",
        minWidth: "180px",
        render: (row) => {
          const badges = {
            "On Track": "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
            "1st Reminder": "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
            "2nd Notice": "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
            "Final Statutory Notice": "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
          };
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.noticeStage]}`}>
              {row.noticeStage}
            </span>
          );
        },
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
              title="View Ledger Breakdown"
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
            title="Collections Ageing & Defaulter Analysis"
            description="Track overdue recovery intervals, aging brackets, interest surcharges and statutory recovery notices."
          />
          <CSSelectProjectEmptyState
            title="Collections Ageing & Defaulter Analysis"
            description="Select a project from the top bar to inspect ageing arrears and recovery notices."
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
        <CSPageHeader
          title="Collections & Dues Ageing Analytics"
          subtitle="Comprehensive portfolio-level financial ageing report, 30/60/90+ days overdue analysis, delay surcharges, and legal notice triggers."
          badge="Financial Recovery Hub"
          breadcrumbs={[{ label: "Reports & Analytics" }, { label: "Collections Ageing" }]}
          primaryAction={{
            label: "Export Statement (Excel)",
            icon: Download,
            onClick: () => toast.success("Dues Ageing Master Spreadsheet exported."),
          }}
          secondaryActions={[
            {
              label: "Surcharge Recalculation",
              icon: Clock,
              onClick: () => toast.success("Accrued delay surcharges refreshed per agreement policy."),
            },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CSStatCard
            title="Total Overdue Receivables"
            value="৳ 4.82 Cr"
            subtext="Across 6 active projects"
            icon={DollarSign}
            iconBg="bg-[#FEF2F2]"
            iconColor="text-[#DC2626]"
          />
          <CSStatCard
            title="Critical Default (90+ Days)"
            value="৳ 1.12 Cr"
            subtext="Statutory cancellation notice zone"
            icon={AlertTriangle}
            iconBg="bg-[#FEF2F2]"
            iconColor="text-[#DC2626]"
          />
          <CSStatCard
            title="Realized Collections (MTD)"
            value="৳ 1.95 Cr"
            subtext="Target: ৳ 2.20 Cr"
            icon={TrendingUp}
            trend={{ value: "+8.8%", isPositive: true }}
          />
          <CSStatCard
            title="Collection Velocity %"
            value="93.4%"
            subtext="On-time installment clearance"
            icon={CheckCircle2}
            iconBg="bg-[#EFF6FF]"
            iconColor="text-[#2563EB]"
          />
        </div>

        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Accounts", count: counts.all },
            { key: "critical", label: "90+ Days Critical", count: counts.critical },
            { key: "61to90", label: "61-90 Days", count: counts["61to90"] },
            { key: "31to60", label: "31-60 Days", count: counts["31to60"] },
            { key: "current", label: "Current (0-30 d)", count: counts.current },
            { key: "notices", label: "Legal Notices Active", count: counts.notices },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <CSTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search by customer name, unit, project, or recovery officer..."
          exportFileName="RealBiz_Collections_Ageing_Report"
        />

        {/* Drawer */}
        <CSDetailDrawer
          isOpen={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          title={`Ageing Statement: ${selectedRow?.customerName}`}
          subtitle={`${selectedRow?.unit} • ${selectedRow?.project}`}
        >
          {selectedRow && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
                <div className="text-[11px] text-[#6B7280]">Financial Exposure Summary</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Agreement Price:</span>
                    <div className="text-sm font-semibold text-[#111827] tabular-nums">{selectedRow.totalAgreementValue}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Total Realized:</span>
                    <div className="text-sm font-semibold text-[#039855] tabular-nums">{selectedRow.totalCollected}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Overdue Installment:</span>
                    <div className="text-sm font-semibold text-[#DC2626] tabular-nums">{selectedRow.overdueAmount}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Delay Surcharge:</span>
                    <div className="text-sm font-semibold text-[#DC6803] tabular-nums">{selectedRow.delaySurcharge}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Delinquency Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Days Overdue:</span>
                    <div className="font-semibold text-[#111827] tabular-nums">{selectedRow.overdueDays} Days</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Ageing Category:</span>
                    <div className="font-semibold text-[#111827]">{selectedRow.ageingBracket}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Recovery Stage:</span>
                    <div className="font-semibold text-[#111827]">{selectedRow.noticeStage}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Assigned Recovery Officer:</span>
                    <div className="font-semibold text-[#111827]">{selectedRow.recoveryOfficer}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-2 text-xs">
                <div className="font-semibold text-[#111827]">Statutory Real Estate Act 2010 Clause:</div>
                <p className="text-[#6B7280] text-[11px] leading-relaxed">
                  As per Real Estate Development and Management Act 2010 Section 14, an allottee must be served two formal written notices with minimum 30 days remedy period prior to allotment cancellation proceedings.
                </p>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Demand Notice issued to ${selectedRow.customerName}`);
                    setSelectedRow(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg transition shadow-xs"
                >
                  Issue Formal Notice
                </button>
              </div>
            </div>
          )}
        </CSDetailDrawer>
      </div>
    );
  }
