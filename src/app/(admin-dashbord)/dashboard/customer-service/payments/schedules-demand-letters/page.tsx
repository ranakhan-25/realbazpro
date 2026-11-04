"use client";

import React, { useState } from "react";
import {
  Receipt,
  FileText,
  Printer,
  Download,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { PaymentScheduleItem } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_SCHEDULES: PaymentScheduleItem[] = [
  {
    id: "SCH-101",
    bookingId: "BK-1082",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    milestoneTitle: "Roof Slab Casting Milestone (7th Floor)",
    dueDate: "2026-11-25",
    amount: 1500000,
    status: "Upcoming",
    demandLetterIssued: true,
    demandLetterDate: "2026-11-01",
  },
  {
    id: "SCH-102",
    bookingId: "BK-1082",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    milestoneTitle: "Internal Brickwork & Plastering",
    dueDate: "2026-12-30",
    amount: 2000000,
    status: "Upcoming",
    demandLetterIssued: false,
  },
  {
    id: "SCH-103",
    bookingId: "BK-1205",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    milestoneTitle: "9th Floor Column & Beam Concrete",
    dueDate: "2026-10-20",
    amount: 1200000,
    status: "Overdue",
    demandLetterIssued: true,
    demandLetterDate: "2026-10-05",
  },
  {
    id: "SCH-104",
    bookingId: "BK-1140",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    milestoneTitle: "Final Handover Balance Milestone",
    dueDate: "2026-09-15",
    amount: 1000000,
    status: "Paid",
    demandLetterIssued: true,
    demandLetterDate: "2026-09-01",
  },
];

export default function SchedulesDemandLettersPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>(INITIAL_SCHEDULES);
  const [selectedLetter, setSelectedLetter] = useState<PaymentScheduleItem | null>(null);

  const filtered = schedules.filter((s) => {
    if (activeTab === "overdue") return s.status === "Overdue";
    if (activeTab === "upcoming") return s.status === "Upcoming";
    if (activeTab === "paid") return s.status === "Paid";
    return true;
  });

  const handleIssueLetter = (sch: PaymentScheduleItem) => {
    setSchedules(
      schedules.map((s) =>
        s.id === sch.id
          ? {
              ...s,
              demandLetterIssued: true,
              demandLetterDate: new Date().toISOString().split("T")[0],
            }
          : s
      )
    );
    toast.success(`Demand Letter issued for ${sch.customerName} (৳ ${sch.amount.toLocaleString()})`);
  };

  const columns: Column<PaymentScheduleItem>[] = [
    {
      key: "id",
      header: "SCHEDULE ID",
      sortable: true,
      minWidth: "160px",
      render: (s) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{s.id}</span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{s.bookingId}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER & UNIT",
      minWidth: "190px",
      render: (s) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{s.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{s.unit}</div>
        </div>
      ),
    },
    {
      key: "milestoneTitle",
      header: "CONSTRUCTION MILESTONE & DUE DATE",
      minWidth: "250px",
      render: (s) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{s.milestoneTitle}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            <Clock className="h-3 w-3 text-[#9CA3AF]" /> Due: {s.dueDate}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "INSTALLMENT AMOUNT",
      sortable: true,
      minWidth: "180px",
      render: (s) => (
        <span className="font-semibold text-[#111827] tabular-nums text-xs">
          ৳ {s.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "120px",
      render: (s) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            s.status === "Paid"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : s.status === "Overdue"
                ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "demandLetterIssued",
      header: "ACTION",
      align: "right",
      minWidth: "160px",
      render: (s) => (
        <div className="flex items-center justify-end">
          {s.demandLetterIssued ? (
            <button
              type="button"
              onClick={() => setSelectedLetter(s)}
              title="View Demand Letter Notice"
              aria-label="View Demand Letter Notice"
              className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <FileText className="h-3.5 w-3.5" /> View Notice
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleIssueLetter(s)}
              title="Issue Official Demand Letter"
              aria-label="Issue Official Demand Letter"
              className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
            >
              <Send className="h-3.5 w-3.5" /> Issue Letter
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Payment Schedules & Demand Letters"
        subtitle="Manage construction milestone installments and dispatch automated demand notices to purchasers."
        badge="Post-Sales Collections"
        breadcrumbs={[{ label: "Payments & Collections" }, { label: "Schedules & Demand Letters" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Demand Notices Issued"
          value="42 Notices"
          subtext="Dispatched this month"
          icon={FileText}
        />
        <CSStatCard
          title="Installments Overdue"
          value="৳ 38.5 Lac"
          subtext="Awaiting recovery follow-up"
          icon={AlertCircle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="Upcoming Milestone Collections"
          value="৳ 2.15 Cr"
          subtext="Expected within next 30 days"
          icon={Receipt}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Schedules", count: schedules.length },
          {
            key: "overdue",
            label: "Overdue Milestones",
            count: schedules.filter((s) => s.status === "Overdue").length,
            badgeVariant: "danger",
          },
          {
            key: "upcoming",
            label: "Upcoming Milestones",
            count: schedules.filter((s) => s.status === "Upcoming").length,
          },
          {
            key: "paid",
            label: "Collected & Paid",
            count: schedules.filter((s) => s.status === "Paid").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by customer name, booking ID, milestone or unit..."
        searchFields={["customerName", "bookingId", "milestoneTitle", "unit"]}
        emptyTitle="No payment schedules found"
      />

      {/* Demand Letter Official Preview Modal */}
      <CSModal
        isOpen={Boolean(selectedLetter)}
        onClose={() => setSelectedLetter(null)}
        title="Official Demand Letter Notice"
        subtitle={`Milestone Payment Reference: ${selectedLetter?.id}`}
        maxWidth="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedLetter(null)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
          </>
        }
      >
        {selectedLetter && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 space-y-4 text-xs font-sans text-[#374151]">
            {/* Letterhead */}
            <div className="border-b border-[#E5E7EB] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111827] tracking-tight">
                  REALBIZ PRO REAL ESTATE LTD.
                </h2>
                <p className="text-[11px] text-[#6B7280]">
                  Customer Relations & Post-Sales Department | Corporate Office: Gulshan, Dhaka
                </p>
              </div>
              <div className="text-right text-[11px] text-[#6B7280] tabular-nums">
                Date: {selectedLetter.demandLetterDate || "2026-11-04"}
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <div className="text-[#6B7280] text-[11px]">To:</div>
              <div className="font-bold text-[#111827] text-sm">{selectedLetter.customerName}</div>
              <div className="text-[#4B5563]">Allotment: {selectedLetter.unit}</div>
              <div className="text-[#6B7280] text-[11px] tabular-nums">Booking ID: {selectedLetter.bookingId}</div>
            </div>

            {/* Body */}
            <div className="space-y-2 leading-relaxed text-justify">
              <p>
                <strong>Subject: Demand Notice for Construction Milestone Payment — {selectedLetter.milestoneTitle}</strong>
              </p>
              <p>
                Dear Sir / Madam,
              </p>
              <p>
                We are pleased to inform you that construction work of your property is progressing smoothly.
                As per the terms and payment schedule of your Sale Agreement, the milestone
                <strong> “{selectedLetter.milestoneTitle}”</strong> has matured for billing.
              </p>
              <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 my-2">
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Milestone Due Amount:</span>
                  <span className="font-semibold text-[#111827] text-sm tabular-nums">
                    BDT {selectedLetter.amount.toLocaleString()} /-
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 pt-2">
                  <span className="text-[#6B7280]">Payment Due Date:</span>
                  <span className="font-semibold text-[#DC2626] tabular-nums">{selectedLetter.dueDate}</span>
                </div>
              </div>
              <p>
                You are kindly requested to remit the installment amount on or before the due date via Cheque,
                Pay Order, or Direct Bank Transfer in favor of <strong>“RealBiz Pro Real Estate Ltd.”</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-between items-end">
              <div>
                <p className="text-[11px] text-[#6B7280]">Authorized Signatory</p>
                <p className="font-semibold text-[#111827]">Head of Post-Sales & Collections</p>
              </div>
              <div className="text-right text-[10px] text-[#9CA3AF]">
                System Generated Notice • RealBiz Pro ERP
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}
