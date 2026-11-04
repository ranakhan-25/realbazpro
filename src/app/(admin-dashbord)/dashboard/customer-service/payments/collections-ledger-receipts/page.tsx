"use client";

import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  DollarSign,
  FileText,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CollectionReceipt } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_RECEIPTS: CollectionReceipt[] = [
  {
    id: "MR-5001",
    moneyReceiptNo: "MR-2026-0501",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    amount: 1500000,
    paymentMethod: "Bank Deposit",
    bankName: "Standard Chartered Bank (Gulshan)",
    chequeOrTxnId: "TXN-88419203",
    receiptDate: "2026-11-02",
    makerStatus: "Verified by Post-Sales",
    checkerStatus: "Posted to Accounts Ledger",
  },
  {
    id: "MR-5002",
    moneyReceiptNo: "MR-2026-0502",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    amount: 800000,
    paymentMethod: "Cheque",
    bankName: "City Bank (Dhanmondi Br)",
    chequeOrTxnId: "CHQ-551240",
    receiptDate: "2026-11-03",
    makerStatus: "Verified by Post-Sales",
    checkerStatus: "Pending Accounts Clearance",
  },
  {
    id: "MR-5003",
    moneyReceiptNo: "MR-2026-0503",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    amount: 500000,
    paymentMethod: "Pay Order",
    bankName: "BRAC Bank (Satmasjid Road)",
    chequeOrTxnId: "PO-772190",
    receiptDate: "2026-10-25",
    makerStatus: "Verified by Post-Sales",
    checkerStatus: "Posted to Accounts Ledger",
  },
];

export default function CollectionsLedgerReceiptsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [receipts, setReceipts] = useState<CollectionReceipt[]>(INITIAL_RECEIPTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CollectionReceipt | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [unit, setUnit] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<CollectionReceipt["paymentMethod"]>("Bank Deposit");
  const [bankName, setBankName] = useState("City Bank Ltd");
  const [refNo, setRefNo] = useState("");

  const filtered = receipts.filter((r) => {
    if (activeTab === "pending") return r.checkerStatus === "Pending Accounts Clearance";
    if (activeTab === "posted") return r.checkerStatus === "Posted to Accounts Ledger";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) {
      toast.error("Please fill in customer and amount");
      return;
    }

    const created: CollectionReceipt = {
      id: `MR-${5000 + receipts.length + 1}`,
      moneyReceiptNo: `MR-2026-0${500 + receipts.length + 1}`,
      customerName,
      unit,
      project: "Assigned Project",
      amount: Number(amount) || 0,
      paymentMethod: method,
      bankName,
      chequeOrTxnId: refNo || "TXN-DIRECT",
      receiptDate: new Date().toISOString().split("T")[0],
      makerStatus: "Verified by Post-Sales",
      checkerStatus: "Pending Accounts Clearance",
    };

    setReceipts([created, ...receipts]);
    toast.success(`Money Receipt ${created.moneyReceiptNo} created. Sent to Accounts for Ledger posting.`);
    setIsModalOpen(false);
  };

  const columns: Column<CollectionReceipt>[] = [
    {
      key: "moneyReceiptNo",
      header: "RECEIPT NO & DATE",
      sortable: true,
      minWidth: "180px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{r.moneyReceiptNo}</span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{r.receiptDate}</div>
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
      key: "amount",
      header: "AMOUNT (BDT)",
      sortable: true,
      minWidth: "160px",
      render: (r) => (
        <span className="font-semibold text-[#039855] text-sm tabular-nums">
          ৳ {r.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "METHOD & INSTRUMENT",
      minWidth: "210px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{r.paymentMethod}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {r.bankName ? `${r.bankName} • ` : ""}{r.chequeOrTxnId}
          </div>
        </div>
      ),
    },
    {
      key: "checkerStatus",
      header: "MAKER-CHECKER APPROVAL",
      minWidth: "220px",
      render: (r) => (
        <div className="space-y-1">
          <div className="text-[11px] text-[#6B7280] font-medium">{r.makerStatus}</div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              r.checkerStatus === "Posted to Accounts Ledger"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
            }`}
          >
            {r.checkerStatus === "Posted to Accounts Ledger" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {r.checkerStatus}
          </span>
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
            onClick={() => setSelectedReceipt(r)}
            title="Print Money Receipt Slip"
            aria-label="Print Money Receipt Slip"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Collections, Receipts & Customer Ledger"
        subtitle="Post-sales collection register, payment verification and money receipt issuance synchronized with Accounts."
        badge="Financial Follow-up"
        breadcrumbs={[{ label: "Payments & Collections" }, { label: "Collections & Receipts" }]}
        primaryAction={{
          label: "Log Money Receipt",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Collections MTD"
          value="৳ 2.80 Cr"
          subtext="Processed by Post-Sales"
          icon={Receipt}
        />
        <CSStatCard
          title="Pending Accounts Verification"
          value="৳ 8.00 Lac"
          subtext="Cheques under bank clearing"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Posted to Ledger"
          value="98.2%"
          subtext="Reconciliation completion rate"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Receipts", count: receipts.length },
          {
            key: "posted",
            label: "Posted to Ledger",
            count: receipts.filter((r) => r.checkerStatus === "Posted to Accounts Ledger").length,
          },
          {
            key: "pending",
            label: "Pending Accounts Clearance",
            count: receipts.filter((r) => r.checkerStatus === "Pending Accounts Clearance").length,
            badgeVariant: "warning",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by receipt no, customer name, unit or cheque ID..."
        searchFields={["moneyReceiptNo", "customerName", "unit", "chequeOrTxnId"]}
        emptyTitle="No money receipts recorded"
      />

      {/* Log Receipt Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Collection Money Receipt"
        subtitle="Enter customer installment instrument for verification"
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
              Generate Receipt
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
                placeholder="Purchaser name"
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
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Amount (BDT) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="BDT"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums font-semibold outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Bank Deposit">Bank Deposit / EFT</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Pay Order">Bank Pay Order</option>
                <option value="bKash">bKash Merchant</option>
                <option value="Nagad">Nagad</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Standard Chartered"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Cheque / Txn ID</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="Instrument Ref"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>
        </form>
      </CSModal>

      {/* Money Receipt Slip Modal */}
      <CSModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official Money Receipt Slip"
        subtitle={`Receipt No: ${selectedReceipt?.moneyReceiptNo}`}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5" /> Print Receipt
            </button>
          </>
        }
      >
        {selectedReceipt && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 space-y-4 text-xs font-sans text-[#374151]">
            <div className="border-b border-[#E5E7EB] pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#111827] text-sm">REALBIZ PRO REAL ESTATE LTD.</h3>
                <p className="text-[11px] text-[#6B7280]">Official Money Receipt</p>
              </div>
              <div className="text-right tabular-nums font-semibold text-[#6D4AFF]">
                {selectedReceipt.moneyReceiptNo}
              </div>
            </div>

            <div className="space-y-2 py-1">
              <div className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Received From:</span>
                <span className="font-semibold text-[#111827]">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Against Unit Allotment:</span>
                <span className="font-semibold text-[#6D4AFF]">{selectedReceipt.unit}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Payment Instrument:</span>
                <span className="font-medium text-[#111827] tabular-nums">
                  {selectedReceipt.paymentMethod} ({selectedReceipt.bankName || "Direct"}) • {selectedReceipt.chequeOrTxnId}
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#A6F4C5] bg-[#ECFDF3]/60 px-3.5 rounded-[10px]">
                <span className="font-semibold text-[#027A48]">Amount Received:</span>
                <span className="font-bold text-[#039855] text-sm tabular-nums">
                  BDT {selectedReceipt.amount.toLocaleString()} /-
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-between items-end">
              <div>
                <p className="text-[10px] text-[#9CA3AF]">Post-Sales Officer</p>
                <p className="font-semibold text-[#4B5563]">Prepared & Verified</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#9CA3AF]">Accounts Department</p>
                <p className="font-semibold text-[#039855]">{selectedReceipt.checkerStatus}</p>
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}
