"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  AlertCircle,
  Plus,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { RegistrationRecord } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: "REG-801",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    subRegistrarOffice: "Sub-Registrar Office, Gulshan (Dhaka)",
    deedDraftStatus: "Vetting Complete",
    registrationDateScheduled: "2026-11-18",
    totalGovtFees: 850000,
    feeReceiptCollected: true,
    registeredDeedNo: "Pending Registry",
    status: "Appointment Booked",
  },
  {
    id: "REG-802",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    subRegistrarOffice: "Sub-Registrar Office, Mohammadpur (Dhaka)",
    deedDraftStatus: "Vetting Complete",
    registrationDateScheduled: "2026-10-10",
    totalGovtFees: 620000,
    feeReceiptCollected: true,
    registeredDeedNo: "DEED-2026-99120",
    status: "Original Deed Delivered",
  },
  {
    id: "REG-803",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    subRegistrarOffice: "Sub-Registrar Office, Badda (Dhaka)",
    deedDraftStatus: "Draft Ready",
    totalGovtFees: 740000,
    feeReceiptCollected: false,
    status: "Documents Gathering",
  },
];

export default function RegistrationTrackingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [records, setRecords] = useState<RegistrationRecord[]>(INITIAL_REGISTRATIONS);

  const filtered = records.filter((r) => {
    if (activeTab === "pending") return r.status === "Documents Gathering" || r.status === "Appointment Booked";
    if (activeTab === "delivered") return r.status === "Original Deed Delivered";
    return true;
  });

  const columns: Column<RegistrationRecord>[] = [
    {
      key: "id",
      header: "RECORD ID & PROJECT",
      sortable: true,
      minWidth: "180px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{r.id}</span>
          <div className="text-[11px] text-[#6B7280] mt-0.5">{r.project}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER & UNIT",
      minWidth: "190px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{r.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "subRegistrarOffice",
      header: "SUB-REGISTRAR OFFICE",
      minWidth: "240px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{r.subRegistrarOffice}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            Registry Slot: {r.registrationDateScheduled || "Not Scheduled Yet"}
          </div>
        </div>
      ),
    },
    {
      key: "totalGovtFees",
      header: "GOVT REGISTRATION FEES",
      minWidth: "190px",
      render: (r) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#111827] tabular-nums">
            ৳ {r.totalGovtFees.toLocaleString()}
          </div>
          <span
            className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${
              r.feeReceiptCollected
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
            }`}
          >
            {r.feeReceiptCollected ? "Fee Deposited" : "Fee Unpaid"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "REGISTRATION STAGE",
      minWidth: "190px",
      render: (r) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              r.status === "Original Deed Delivered"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : r.status === "Appointment Booked"
                  ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                  : "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]"
            }`}
          >
            {r.status}
          </span>
          {r.registeredDeedNo && (
            <div className="text-[10px] tabular-nums text-[#6B7280]">{r.registeredDeedNo}</div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "90px",
      render: (r) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => toast.info(`Registry record details: ${r.customerName} (${r.subRegistrarOffice})`)}
            title="View Registration Record"
            aria-label="View Registration Record"
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
        title="Sub-Registrar Registration Tracking"
        subtitle="Track deed drafting, Sub-Registrar appointments, government fee deposits, and delivery of registered original deeds."
        badge="Legal Department Coordination"
        breadcrumbs={[{ label: "Documents & Land Records" }, { label: "Registration Tracking" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Deeds in Pipeline"
          value={records.length.toString()}
          subtext="Under registry coordination"
          icon={FileCheck2}
        />
        <CSStatCard
          title="Appointments Scheduled"
          value={records.filter((r) => r.status === "Appointment Booked").length.toString()}
          subtext="With Sub-Registrar Office"
          icon={Calendar}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Original Deeds Delivered"
          value={records.filter((r) => r.status === "Original Deed Delivered").length.toString()}
          subtext="Handed over to purchasers"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Registration Files", count: records.length },
          {
            key: "pending",
            label: "In Progress / Scheduled",
            count: records.filter((r) => r.status !== "Original Deed Delivered").length,
            badgeVariant: "warning",
          },
          {
            key: "delivered",
            label: "Deed Delivered to Buyer",
            count: records.filter((r) => r.status === "Original Deed Delivered").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by customer name, unit, project or sub-registrar office..."
        searchFields={["customerName", "unit", "project", "subRegistrarOffice"]}
        emptyTitle="No registration tracking files found"
      />
    </div>
  );
}
