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
      header: "Customer & Unit",
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-bold text-slate-900">{d.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{d.unit}</div>
          <div className="text-[10px] text-slate-400 font-mono">{d.phone}</div>
        </div>
      ),
    },
    {
      key: "totalDue",
      header: "Total Overdue",
      sortable: true,
      render: (d) => (
        <span className="font-bold text-slate-900 text-sm">
          ৳ {d.totalDue.toLocaleString()}
        </span>
      ),
    },
    {
      key: "bucket30Days",
      header: "1-30 Days",
      render: (d) => (
        <span className={d.bucket30Days > 0 ? "font-semibold text-slate-700" : "text-slate-300"}>
          {d.bucket30Days > 0 ? `৳ ${d.bucket30Days.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "bucket60Days",
      header: "31-60 Days",
      render: (d) => (
        <span className={d.bucket60Days > 0 ? "font-semibold text-amber-700" : "text-slate-300"}>
          {d.bucket60Days > 0 ? `৳ ${d.bucket60Days.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "bucket90PlusDays",
      header: "90+ Days (Critical)",
      render: (d) => (
        <span className={d.bucket90PlusDays > 0 ? "font-bold text-rose-700 animate-pulse" : "text-slate-300"}>
          {d.bucket90PlusDays > 0 ? `৳ ${d.bucket90PlusDays.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "lateFeeApplied",
      header: "Late Surcharge",
      render: (d) => (
        <div>
          <span className="font-medium text-slate-700">
            ৳ {d.lateFeeApplied.toLocaleString()}
          </span>
          {d.waiverRequested && (
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 inline-block mt-0.5">
              Waiver Requested
            </div>
          )}
        </div>
      ),
    },
    {
      key: "riskLevel",
      header: "Recovery Stage",
      render: (d) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            d.riskLevel === "Legal Notice Stage"
              ? "bg-rose-100 text-rose-800 font-bold border border-rose-300"
              : d.riskLevel === "Medium"
                ? "bg-amber-50 text-amber-800"
                : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {d.riskLevel}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Follow-up",
      render: (d) => (
        <button
          type="button"
          onClick={() => handleSendReminder(d)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Send className="h-3 w-3 text-blue-600" /> Remind
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <CSStatCard
          title="90+ Days Critical Overdue"
          value="৳ 25.0 Lac"
          subtext="Eligible for contract legal warning"
          icon={ShieldAlert}
          iconBg="bg-rose-100"
          iconColor="text-rose-700"
        />
        <CSStatCard
          title="Waiver Requests Pending"
          value="1 Case"
          subtext="Late surcharge waiver submitted"
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
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

