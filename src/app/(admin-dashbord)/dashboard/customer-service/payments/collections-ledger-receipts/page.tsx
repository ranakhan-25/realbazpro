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
  const brand = primaryColor || "#0000F2";

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
      header: "Receipt No & Date",
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{r.moneyReceiptNo}</span>
          <div className="text-[11px] text-slate-400">{r.receiptDate}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (r) => (
        <div>
          <div className="font-bold text-slate-800">{r.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount (BDT)",
      sortable: true,
      render: (r) => (
        <span className="font-bold text-emerald-700 text-sm">
          ৳ {r.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Method & Instrument",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800">{r.paymentMethod}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            {r.bankName ? `${r.bankName} • ` : ""}{r.chequeOrTxnId}
          </div>
        </div>
      ),
    },
    {
      key: "checkerStatus",
      header: "Maker-Checker Approval",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500 font-medium">{r.makerStatus}</div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
              r.checkerStatus === "Posted to Accounts Ledger"
                ? "text-emerald-700"
                : "text-amber-700"
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
      header: "Receipt",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedReceipt(r)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Printer className="h-3.5 w-3.5 text-blue-600" /> Print Slip
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Posted to Ledger"
          value="98.2%"
          subtext="Reconciliation completion rate"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              Generate Receipt
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Purchaser name"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Allotment *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (BDT) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="BDT"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Bank Deposit">Bank Deposit / EFT</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Pay Order">Bank Pay Order</option>
                <option value="bKash">bKash Merchant</option>
                <option value="Nagad">Nagad</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Standard Chartered"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cheque / Txn ID</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="Instrument Ref"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Printer className="h-3.5 w-3.5" /> Print Receipt
            </button>
          </>
        }
      >
        {selectedReceipt && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs font-sans">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">REALBIZ PRO REAL ESTATE LTD.</h3>
                <p className="text-[11px] text-slate-400">Official Money Receipt</p>
              </div>
              <div className="text-right font-mono font-bold text-blue-700">
                {selectedReceipt.moneyReceiptNo}
              </div>
            </div>

            <div className="space-y-2 py-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Received From:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Against Unit Allotment:</span>
                <span className="font-semibold text-blue-700">{selectedReceipt.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Instrument:</span>
                <span className="font-medium text-slate-800">
                  {selectedReceipt.paymentMethod} ({selectedReceipt.bankName || "Direct"}) • {selectedReceipt.chequeOrTxnId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 bg-emerald-50/60 px-3 rounded-lg">
                <span className="font-bold text-emerald-950">Amount Received:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  BDT {selectedReceipt.amount.toLocaleString()} /-
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400">Post-Sales Officer</p>
                <p className="font-semibold text-slate-700">Prepared & Verified</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Accounts Department</p>
                <p className="font-semibold text-emerald-700">{selectedReceipt.checkerStatus}</p>
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}

