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
  {
    id: "AGE-05",
    customerName: "Dr. Nazmul Huda",
    phone: "+880 1819-876543",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    totalAgreementValue: "৳ 1,60,00,000",
    totalCollected: "৳ 1,30,00,000",
    overdueAmount: "৳ 7,20,000",
    overdueDays: 42,
    ageingBracket: "31-60 Days",
    delaySurcharge: "৳ 14,400",
    noticeStage: "1st Reminder",
    recoveryOfficer: "Tariqul Alam",
  },
  {
    id: "AGE-06",
    customerName: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    totalAgreementValue: "৳ 1,35,00,000",
    totalCollected: "৳ 1,15,00,000",
    overdueAmount: "৳ 5,00,000",
    overdueDays: 22,
    ageingBracket: "Current (0-30 d)",
    delaySurcharge: "৳ 0",
    noticeStage: "1st Reminder",
    recoveryOfficer: "Nusrat Jahan",
  },
];

export default function CollectionsAgeingReportPage() {
  const { primaryColor } = useTheme();
  const [data, setData] = useState<AgeingReportRow[]>(INITIAL_AGEING_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AgeingReportRow | null>(null);

  const filteredData = data.filter((row) => {
    if (activeTab === "critical") return row.ageingBracket === "90+ Days Critical";
    if (activeTab === "61to90") return row.ageingBracket === "61-90 Days";
    if (activeTab === "31to60") return row.ageingBracket === "31-60 Days";
    if (activeTab === "current") return row.ageingBracket === "Current (0-30 d)";
    if (activeTab === "notices") return row.noticeStage === "Final Statutory Notice" || row.noticeStage === "2nd Notice";
    return true;
  });

  const counts = {
    all: data.length,
    critical: data.filter((d) => d.ageingBracket === "90+ Days Critical").length,
    "61to90": data.filter((d) => d.ageingBracket === "61-90 Days").length,
    "31to60": data.filter((d) => d.ageingBracket === "31-60 Days").length,
    current: data.filter((d) => d.ageingBracket === "Current (0-30 d)").length,
    notices: data.filter((d) => d.noticeStage === "Final Statutory Notice" || d.noticeStage === "2nd Notice").length,
  };

  const columns: Column<AgeingReportRow>[] = [
    {
      header: "Customer & Allotted Unit",
      accessorKey: "customerName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.unit} • {row.project}</div>
        </div>
      ),
    },
    {
      header: "Agreement Value & Paid",
      accessorKey: "totalAgreementValue",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground font-medium">{row.totalAgreementValue}</div>
          <div className="text-emerald-600 text-[11px]">Paid: {row.totalCollected}</div>
        </div>
      ),
    },
    {
      header: "Overdue Amount",
      accessorKey: "overdueAmount",
      cell: (row) => (
        <div className="font-bold text-xs text-rose-600">
          {row.overdueAmount}
        </div>
      ),
    },
    {
      header: "Ageing Bracket & Days",
      accessorKey: "overdueDays",
      cell: (row) => {
        const colors = {
          "Current (0-30 d)": "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
          "31-60 Days": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
          "61-90 Days": "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
          "90+ Days Critical": "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
        };
        return (
          <div className="space-y-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[row.ageingBracket]}`}>
              {row.ageingBracket}
            </span>
            <div className="text-[11px] text-muted-foreground pl-1">{row.overdueDays} days past due</div>
          </div>
        );
      },
    },
    {
      header: "Accrued Surcharge",
      accessorKey: "delaySurcharge",
      cell: (row) => (
        <span className="text-xs font-mono font-medium text-foreground">
          {row.delaySurcharge}
        </span>
      ),
    },
    {
      header: "Recovery Notice Stage",
      accessorKey: "noticeStage",
      cell: (row) => {
        const badges = {
          "On Track": "bg-emerald-50 text-emerald-700 border border-emerald-200",
          "1st Reminder": "bg-blue-50 text-blue-700 border border-blue-200",
          "2nd Notice": "bg-amber-50 text-amber-700 border border-amber-200",
          "Final Statutory Notice": "bg-rose-50 text-rose-700 border border-rose-200",
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${badges[row.noticeStage]}`}>
            {row.noticeStage}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <button
          onClick={() => setSelectedRow(row)}
          className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
          title="View Ledger Breakdown"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CSPageHeader
        title="Collections & Dues Ageing Analytics"
        description="Comprehensive portfolio-level financial ageing report, 30/60/90+ days overdue analysis, delay surcharges, and legal notice triggers."
        badgeText="Financial Recovery Hub"
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
          subtitle="Across 6 active projects"
          icon={DollarSign}
          color="rose"
        />
        <CSStatCard
          title="Critical Default (90+ Days)"
          value="৳ 1.12 Cr"
          subtitle="Statutory cancellation notice zone"
          icon={AlertTriangle}
          color="rose"
        />
        <CSStatCard
          title="Realized Collections (MTD)"
          value="৳ 1.95 Cr"
          subtitle="Target: ৳ 2.20 Cr"
          icon={TrendingUp}
          color="emerald"
          trend={{ value: 8.8, isPositive: true }}
        />
        <CSStatCard
          title="Collection Velocity %"
          value="93.4%"
          subtitle="On-time installment clearance"
          icon={CheckCircle2}
          color="blue"
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
        onChange={setActiveTab}
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
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-3">
              <div className="text-xs text-muted-foreground">Financial Exposure Summary</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Agreement Price:</span>
                  <div className="text-sm font-bold text-foreground">{selectedRow.totalAgreementValue}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Realized:</span>
                  <div className="text-sm font-bold text-emerald-600">{selectedRow.totalCollected}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Overdue Installment:</span>
                  <div className="text-sm font-bold text-rose-600">{selectedRow.overdueAmount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Delay Surcharge:</span>
                  <div className="text-sm font-bold text-amber-600">{selectedRow.delaySurcharge}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delinquency Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Days Overdue:</span>
                  <div className="font-semibold text-foreground">{selectedRow.overdueDays} Days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ageing Category:</span>
                  <div className="font-semibold text-foreground">{selectedRow.ageingBracket}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recovery Stage:</span>
                  <div className="font-semibold text-foreground">{selectedRow.noticeStage}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Recovery Officer:</span>
                  <div className="font-semibold text-foreground">{selectedRow.recoveryOfficer}</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-foreground/[0.01] space-y-2 text-xs">
              <div className="font-semibold text-foreground">Statutory Real Estate Act 2010 Clause:</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                As per Real Estate Development and Management Act 2010 Section 14, an allottee must be served two formal written notices with minimum 30 days remedy period prior to allotment cancellation proceedings.
              </p>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  toast.success(`Demand Notice issued to ${selectedRow.customerName}`);
                  setSelectedRow(null);
                }}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
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

