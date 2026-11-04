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
      header: "Record ID & Project",
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{r.id}</span>
          <div className="text-[11px] text-slate-500">{r.project}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900">{r.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "subRegistrarOffice",
      header: "Sub-Registrar Office",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800">{r.subRegistrarOffice}</div>
          <div className="text-[11px] text-slate-400">
            Registry Slot: {r.registrationDateScheduled || "Not Scheduled Yet"}
          </div>
        </div>
      ),
    },
    {
      key: "totalGovtFees",
      header: "Govt Registration Fees",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900">
            ৳ {r.totalGovtFees.toLocaleString()}
          </div>
          <span
            className={`inline-block text-[10px] font-bold rounded px-1.5 py-0.2 ${
              r.feeReceiptCollected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {r.feeReceiptCollected ? "Fee Deposited" : "Fee Unpaid"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Registration Stage",
      render: (r) => (
        <div className="space-y-0.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              r.status === "Original Deed Delivered"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : r.status === "Appointment Booked"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {r.status}
          </span>
          {r.registeredDeedNo && (
            <div className="text-[10px] font-mono text-slate-500">{r.registeredDeedNo}</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <CSStatCard
          title="Original Deeds Delivered"
          value={records.filter((r) => r.status === "Original Deed Delivered").length.toString()}
          subtext="Handed over to purchasers"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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

