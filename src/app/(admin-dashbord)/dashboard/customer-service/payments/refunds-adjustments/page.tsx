"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  FileCheck2,
  Receipt,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { RefundRequestItem } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_REFUNDS: RefundRequestItem[] = [
  {
    id: "REF-401",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green",
    project: "Uttara Green Park",
    totalPaid: 4500000,
    deductionPercentage: 10,
    deductionAmount: 450000,
    netRefundAmount: 4050000,
    reason: "Relocating overseas; customer unable to continue installments.",
    approvalStage: "Management Approval",
    requestedDate: "2026-10-18",
  },
  {
    id: "REF-402",
    customerName: "Kazi Moniruzzaman",
    unit: "B-2, Sheba Valley",
    project: "Sheba Green Valley",
    totalPaid: 1000000,
    deductionPercentage: 5,
    deductionAmount: 50000,
    netRefundAmount: 950000,
    reason: "Booking money refund request within 30-day grace period.",
    approvalStage: "Accounts Cheque Preparation",
    requestedDate: "2026-10-25",
  },
];

export default function RefundsAdjustmentsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [refunds, setRefunds] = useState<RefundRequestItem[]>(INITIAL_REFUNDS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [unit, setUnit] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [deductionPct, setDeductionPct] = useState("10");
  const [reason, setReason] = useState("");

  const filtered = refunds.filter((r) => {
    if (activeTab === "pending") {
      return r.approvalStage === "Customer Service" || r.approvalStage === "Management Approval";
    }
    if (activeTab === "accounts") return r.approvalStage === "Accounts Cheque Preparation";
    if (activeTab === "disbursed") return r.approvalStage === "Disbursed";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const paid = Number(totalPaid) || 0;
    const pct = Number(deductionPct) || 0;
    const deduction = (paid * pct) / 100;
    const net = paid - deduction;

    const created: RefundRequestItem = {
      id: `REF-${400 + refunds.length + 1}`,
      customerName,
      unit,
      project: "Assigned Project",
      totalPaid: paid,
      deductionPercentage: pct,
      deductionAmount: deduction,
      netRefundAmount: net,
      reason,
      approvalStage: "Management Approval",
      requestedDate: new Date().toISOString().split("T")[0],
    };

    setRefunds([created, ...refunds]);
    toast.success(`Refund request ${created.id} submitted for Management Approval`);
    setIsModalOpen(false);
  };

  const handleAdvance = (item: RefundRequestItem) => {
    let nextStage: RefundRequestItem["approvalStage"] = item.approvalStage;
    if (item.approvalStage === "Customer Service") nextStage = "Management Approval";
    else if (item.approvalStage === "Management Approval") nextStage = "Accounts Cheque Preparation";
    else if (item.approvalStage === "Accounts Cheque Preparation") nextStage = "Disbursed";

    setRefunds(
      refunds.map((r) => (r.id === item.id ? { ...r, approvalStage: nextStage } : r))
    );
    toast.success(`Refund ${item.id} moved to: ${nextStage}`);
  };

  const columns: Column<RefundRequestItem>[] = [
    {
      key: "id",
      header: "REFUND ID & DATE",
      sortable: true,
      minWidth: "170px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{r.id}</span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{r.requestedDate}</div>
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
      key: "totalPaid",
      header: "PAID & DEDUCTIONS",
      minWidth: "190px",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#111827] tabular-nums">
            Paid: ৳ {r.totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#DC2626] tabular-nums">
            Deduction ({r.deductionPercentage}%): -৳ {r.deductionAmount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "netRefundAmount",
      header: "NET APPROVED REFUND",
      sortable: true,
      minWidth: "180px",
      render: (r) => (
        <span className="font-semibold text-[#039855] text-sm tabular-nums">
          ৳ {r.netRefundAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "approvalStage",
      header: "APPROVAL STAGE",
      minWidth: "190px",
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            r.approvalStage === "Disbursed"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : r.approvalStage === "Accounts Cheque Preparation"
                ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
          }`}
        >
          {r.approvalStage}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "120px",
      render: (r) => (
        <div className="flex items-center justify-end">
          {r.approvalStage !== "Disbursed" ? (
            <button
              type="button"
              onClick={() => handleAdvance(r)}
              title="Advance to next approval stage"
              aria-label="Advance Approval Stage"
              className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Advance
            </button>
          ) : (
            <span className="text-xs text-[#039855] font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Disbursed
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Refunds & Contract Adjustments"
        subtitle="Manage booking cancellation refunds, contractual deductions, and cross-departmental cheque clearances."
        badge="Post-Sales Governance"
        breadcrumbs={[{ label: "Payments & Collections" }, { label: "Refunds & Adjustments" }]}
        primaryAction={{
          label: "New Refund Request",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Refund Applications"
          value={refunds.length.toString()}
          subtext="Under validation & cheque prep"
          icon={DollarSign}
        />
        <CSStatCard
          title="Net Refund Payable"
          value="৳ 50.0 Lac"
          subtext="Approved liability in pipeline"
          icon={Building}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Contractual Deductions Retained"
          value="৳ 5.00 Lac"
          subtext="Per standard Sale Agreement terms"
          icon={Receipt}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Refund Files", count: refunds.length },
          {
            key: "pending",
            label: "Management Approval",
            count: refunds.filter((r) => r.approvalStage === "Management Approval").length,
            badgeVariant: "warning",
          },
          {
            key: "accounts",
            label: "Accounts Cheque Preparation",
            count: refunds.filter((r) => r.approvalStage === "Accounts Cheque Preparation").length,
          },
          {
            key: "disbursed",
            label: "Disbursed & Closed",
            count: refunds.filter((r) => r.approvalStage === "Disbursed").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search refund ID, customer name or unit allotment..."
        searchFields={["id", "customerName", "unit", "reason"]}
        emptyTitle="No refund requests found"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Customer Refund Application"
        subtitle="Verify payments and specify contractual deduction percentage"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Submit Application
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit Allotment *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. D-2, Uttara Green"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Total Paid (BDT) *</label>
              <input
                type="number"
                required
                value={totalPaid}
                onChange={(e) => setTotalPaid(e.target.value)}
                placeholder="Amount"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums font-semibold outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Deduction %</label>
              <select
                value={deductionPct}
                onChange={(e) => setDeductionPct(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="5">5% (Grace Period)</option>
                <option value="10">10% (Standard Agreement)</option>
                <option value="15">15% (Construction Commenced)</option>
                <option value="0">0% (Special Waiver)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Reason for Cancellation</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State customer justification..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] text-xs transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
