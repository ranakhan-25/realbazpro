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
  const brand = primaryColor || "#0000F2";

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
      header: "Schedule ID",
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{s.id}</span>
          <div className="text-[11px] text-slate-400 font-mono">{s.bookingId}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (s) => (
        <div>
          <div className="font-bold text-slate-900">{s.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{s.unit}</div>
        </div>
      ),
    },
    {
      key: "milestoneTitle",
      header: "Construction Milestone & Due Date",
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-800">{s.milestoneTitle}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <Clock className="h-3 w-3 text-slate-400" /> Due: {s.dueDate}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Installment Amount",
      sortable: true,
      render: (s) => (
        <span className="font-bold text-slate-900">
          ৳ {s.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            s.status === "Paid"
              ? "bg-emerald-50 text-emerald-700"
              : s.status === "Overdue"
                ? "bg-rose-50 text-rose-700 font-bold"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "demandLetterIssued",
      header: "Demand Notice",
      render: (s) => (
        <div>
          {s.demandLetterIssued ? (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Issued ({s.demandLetterDate})
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedLetter(s)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" /> View Notice
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleIssueLetter(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <Send className="h-3 w-3" /> Issue Demand Letter
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <CSStatCard
          title="Upcoming Milestone Collections"
          value="৳ 2.15 Cr"
          subtext="Expected within next 30 days"
          icon={Receipt}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
          </>
        }
      >
        {selectedLetter && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs font-serif text-slate-800">
            {/* Letterhead */}
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  REALBIZ PRO REAL ESTATE LTD.
                </h2>
                <p className="text-[11px] text-slate-500 font-sans">
                  Customer Relations & Post-Sales Department | Corporate Office: Gulshan, Dhaka
                </p>
              </div>
              <div className="text-right text-[11px] font-sans text-slate-400">
                Date: {selectedLetter.demandLetterDate || "2026-11-04"}
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1 font-sans">
              <div className="text-slate-500 text-[11px]">To:</div>
              <div className="font-bold text-slate-900 text-sm">{selectedLetter.customerName}</div>
              <div className="text-slate-600">Allotment: {selectedLetter.unit}</div>
              <div className="text-slate-500 text-[11px]">Booking ID: {selectedLetter.bookingId}</div>
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
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 my-2 font-sans">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Milestone Due Amount:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    BDT {selectedLetter.amount.toLocaleString()} /-
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Payment Due Date:</span>
                  <span className="font-bold text-rose-700">{selectedLetter.dueDate}</span>
                </div>
              </div>
              <p>
                You are kindly requested to remit the installment amount on or before the due date via Cheque,
                Pay Order, or Direct Bank Transfer in favor of <strong>“RealBiz Pro Real Estate Ltd.”</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-end font-sans">
              <div>
                <p className="text-[11px] text-slate-400">Authorized Signatory</p>
                <p className="font-bold text-slate-800">Head of Post-Sales & Collections</p>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                System Generated Notice • RealBiz Pro ERP
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}

