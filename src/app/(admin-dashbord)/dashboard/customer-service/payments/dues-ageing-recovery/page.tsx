"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Send,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  FileText,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { AgeingDueItem } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_AGEING: AgeingDueItem[] = [
  {
    id: "DUE-101",
    customerName: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    unit: "D-2, Uttara Green",
    project: "Uttara Green Park",
    totalDue: 3500000,
    bucket30Days: 0,
    bucket60Days: 1000000,
    bucket90PlusDays: 2500000,
    lateFeeApplied: 125000,
    waiverRequested: true,
    lastReminderSent: "2026-10-29",
    riskLevel: "Legal Notice Stage",
  },
  {
    id: "DUE-102",
    customerName: "Mohammad Rafiqul Islam",
    phone: "+880 1711-234567",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    totalDue: 1500000,
    bucket30Days: 1500000,
    bucket60Days: 0,
    bucket90PlusDays: 0,
    lateFeeApplied: 0,
    waiverRequested: false,
    lastReminderSent: "2026-11-01",
    riskLevel: "Low",
  },
  {
    id: "DUE-103",
    customerName: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    totalDue: 1200000,
    bucket30Days: 0,
    bucket60Days: 1200000,
    bucket90PlusDays: 0,
    lateFeeApplied: 36000,
    waiverRequested: false,
    lastReminderSent: "2026-10-20",
    riskLevel: "Medium",
  },
];

export default function DuesAgeingRecoveryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [dues, setDues] = useState<AgeingDueItem[]>(INITIAL_AGEING);

  const filtered = dues.filter((d) => {
    if (activeTab === "critical") return d.riskLevel === "Legal Notice Stage" || d.bucket90PlusDays > 0;
    if (activeTab === "waiver") return d.waiverRequested;
    return true;
  });

  const handleSendReminder = (item: AgeingDueItem) => {
    toast.success(`Automated SMS & WhatsApp reminder dispatched to ${item.phone}`);
  };

  const columns: Column<AgeingDueItem>[] = [
    {
      key: "customerName",
      header: "CUSTOMER & UNIT",
      sortable: true,
      minWidth: "200px",
      render: (d) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{d.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{d.unit}</div>
          <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">{d.phone}</div>
        </div>
      ),
    },
    {
      key: "totalDue",
      header: "TOTAL OVERDUE",
      sortable: true,
      minWidth: "160px",
      render: (d) => (
        <span className="font-semibold text-[#111827] text-sm tabular-nums">
          ৳ {d.totalDue.toLocaleString()}
        </span>
      ),
    },
    {
      key: "bucket30Days",
      header: "1-30 DAYS",
      minWidth: "130px",
      render: (d) => (
        <span className={`tabular-nums text-xs ${d.bucket30Days > 0 ? "font-medium text-[#374151]" : "text-[#9CA3AF]"}`}>
          {d.bucket30Days > 0 ? `৳ ${d.bucket30Days.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "bucket60Days",
      header: "31-60 DAYS",
      minWidth: "130px",
      render: (d) => (
        <span className={`tabular-nums text-xs ${d.bucket60Days > 0 ? "font-semibold text-[#DC6803]" : "text-[#9CA3AF]"}`}>
          {d.bucket60Days > 0 ? `৳ ${d.bucket60Days.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "bucket90PlusDays",
      header: "90+ DAYS (CRITICAL)",
      minWidth: "170px",
      render: (d) => (
        <span className={`tabular-nums text-xs ${d.bucket90PlusDays > 0 ? "font-bold text-[#DC2626]" : "text-[#9CA3AF]"}`}>
          {d.bucket90PlusDays > 0 ? `৳ ${d.bucket90PlusDays.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "lateFeeApplied",
      header: "LATE SURCHARGE",
      minWidth: "150px",
      render: (d) => (
        <div>
          <span className="font-medium text-[#374151] tabular-nums text-xs">
            ৳ {d.lateFeeApplied.toLocaleString()}
          </span>
          {d.waiverRequested && (
            <div className="text-[10px] font-semibold text-[#DC6803] bg-[#FFFAEB] border border-[#FEDF89] rounded-md px-1.5 py-0.5 inline-block mt-1">
              Waiver Requested
            </div>
          )}
        </div>
      ),
    },
    {
      key: "riskLevel",
      header: "RECOVERY STAGE",
      minWidth: "160px",
      render: (d) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            d.riskLevel === "Legal Notice Stage"
              ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
              : d.riskLevel === "Medium"
                ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                : "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
          }`}
        >
          {d.riskLevel}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "110px",
      render: (d) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleSendReminder(d)}
            title="Dispatch payment reminder"
            aria-label="Dispatch payment reminder"
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Send className="h-3.5 w-3.5" /> Remind
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Dues, Ageing & Recovery Analysis"
        subtitle="Track outstanding installment aging (30/60/90+ days), calculate late surcharges, and manage recovery reminders."
        badge="Collections Recovery"
        breadcrumbs={[{ label: "Payments & Collections" }, { label: "Dues & Recovery" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Overdue Amount"
          value="৳ 62.0 Lac"
          subtext="Across active property contracts"
          icon={AlertTriangle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="90+ Days Critical Overdue"
          value="৳ 25.0 Lac"
          subtext="Eligible for contract legal warning"
          icon={ShieldAlert}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="Waiver Requests Pending"
          value="1 Case"
          subtext="Late surcharge waiver submitted"
          icon={DollarSign}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Overdues", count: dues.length },
          {
            key: "critical",
            label: "Critical (90+ Days / Legal)",
            count: dues.filter((d) => d.riskLevel === "Legal Notice Stage" || d.bucket90PlusDays > 0).length,
            badgeVariant: "danger",
          },
          {
            key: "waiver",
            label: "Waiver Inquiries",
            count: dues.filter((d) => d.waiverRequested).length,
            badgeVariant: "warning",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by customer name, phone or unit allotment..."
        searchFields={["customerName", "phone", "unit", "project"]}
        emptyTitle="No overdue items found"
      />
    </div>
  );
}
