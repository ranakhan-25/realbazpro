"use client";

import React, { useState } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileCheck2,
  UserCheck,
  Building,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { ChangeRequest } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_REQUESTS: ChangeRequest[] = [
  {
    id: "CR-901",
    requestType: "Ownership Transfer",
    customerId: "CUST-001",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    reason: "Transferring deed rights to son (Engr. Salman Islam)",
    transferFee: 150000,
    newBuyerName: "Salman Islam",
    newBuyerNid: "20012698765432100",
    status: "Legal Verification",
    appliedDate: "2026-11-01",
  },
  {
    id: "CR-902",
    requestType: "Resale",
    customerId: "CUST-003",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    reason: "Secondary market resale to third-party buyer",
    transferFee: 300000,
    newBuyerName: "Kazi Nabil Ahmed",
    newBuyerNid: "19752690011223344",
    status: "HOD Approval",
    appliedDate: "2026-10-28",
  },
  {
    id: "CR-903",
    requestType: "Cancellation & Refund",
    customerId: "CUST-004",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green",
    project: "Uttara Green Park",
    reason: "Relocating abroad; requested contract cancellation and refund",
    transferFee: 0,
    status: "Accounts Clearance",
    appliedDate: "2026-10-15",
  },
];

export default function ChangeRequestsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<ChangeRequest[]>(INITIAL_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New request form
  const [customerName, setCustomerName] = useState("");
  const [unit, setUnit] = useState("");
  const [requestType, setRequestType] = useState<ChangeRequest["requestType"]>("Ownership Transfer");
  const [newBuyer, setNewBuyer] = useState("");
  const [transferFee, setTransferFee] = useState("100000");

  const filtered = requests.filter((r) => {
    if (activeTab === "pending") {
      return r.status === "Legal Verification" || r.status === "HOD Approval" || r.status === "Accounts Clearance";
    }
    if (activeTab === "completed") return r.status === "Completed";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !unit) {
      toast.error("Please fill in customer and unit");
      return;
    }

    const item: ChangeRequest = {
      id: `CR-${900 + requests.length + 1}`,
      requestType,
      customerId: "CUST-NEW",
      customerName,
      unit,
      project: "Assigned Project",
      reason: "Customer official application submitted",
      transferFee: Number(transferFee) || 0,
      newBuyerName: newBuyer || undefined,
      status: "Legal Verification",
      appliedDate: new Date().toISOString().split("T")[0],
    };

    setRequests([item, ...requests]);
    toast.success(`Change request ${item.id} logged for legal verification`);
    setIsModalOpen(false);
  };

  const handleAdvanceStatus = (req: ChangeRequest) => {
    let nextStatus: ChangeRequest["status"] = req.status;
    if (req.status === "Legal Verification") nextStatus = "HOD Approval";
    else if (req.status === "HOD Approval") nextStatus = "Accounts Clearance";
    else if (req.status === "Accounts Clearance") nextStatus = "Completed";

    setRequests(
      requests.map((r) => (r.id === req.id ? { ...r, status: nextStatus } : r))
    );
    toast.success(`Request ${req.id} advanced to ${nextStatus}`);
  };

  const columns: Column<ChangeRequest>[] = [
    {
      key: "id",
      header: "Request ID & Date",
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{r.id}</span>
          <div className="text-[11px] text-slate-400">{r.appliedDate}</div>
        </div>
      ),
    },
    {
      key: "requestType",
      header: "Type & Unit",
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800">{r.requestType}</span>
          <div className="text-[11px] text-blue-600 font-medium">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Existing Customer",
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900">{r.customerName}</div>
          <div className="text-[11px] text-slate-400">{r.reason}</div>
        </div>
      ),
    },
    {
      key: "newBuyerName",
      header: "Transferee / New Buyer",
      render: (r) => (
        <div>
          {r.newBuyerName ? (
            <>
              <div className="font-semibold text-slate-800">{r.newBuyerName}</div>
              {r.newBuyerNid && (
                <div className="text-[11px] font-mono text-slate-400">NID: {r.newBuyerNid}</div>
              )}
            </>
          ) : (
            <span className="text-slate-400 italic">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: "transferFee",
      header: "Transfer Fee",
      render: (r) => (
        <span className="font-bold text-slate-900">
          ৳ {r.transferFee.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Approval Workflow",
      render: (r) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              r.status === "Completed"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {r.status}
          </span>
          {r.status !== "Completed" && (
            <div>
              <button
                type="button"
                onClick={() => handleAdvanceStatus(r)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Approve Stage →
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      <CSPageHeader
        title="Transfer, Resale & Change Requests"
        subtitle="Manage flat ownership transfers, secondary resales, booking cancellations and customer profile amendments."
        badge="Legal & Approval Gate"
        breadcrumbs={[{ label: "Customers & Properties" }, { label: "Change Requests" }]}
        primaryAction={{
          label: "New Change Request",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Requests"
          value={requests.filter((r) => r.status !== "Completed").length.toString()}
          subtext="Under approval pipeline"
          icon={GitPullRequest}
        />
        <CSStatCard
          title="Transfer Fees Collected"
          value="৳ 4.50 Lac"
          subtext="Processing fee revenue"
          icon={Building}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <CSStatCard
          title="Completed Transfers"
          value={requests.filter((r) => r.status === "Completed").length.toString()}
          subtext="Deed endorsement done"
          icon={CheckCircle2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Requests", count: requests.length },
          {
            key: "pending",
            label: "Pending Approvals",
            count: requests.filter((r) => r.status !== "Completed").length,
            badgeVariant: "warning",
          },
          {
            key: "completed",
            label: "Completed",
            count: requests.filter((r) => r.status === "Completed").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by request ID, customer, unit or new buyer..."
        searchFields={["id", "customerName", "unit", "newBuyerName"]}
        emptyTitle="No change requests found"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Ownership Transfer / Resale Request"
        subtitle="Official customer request with legal verification and transfer fees"
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
              Submit Application
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Request Type *
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as any)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
            >
              <option value="Ownership Transfer">Ownership Transfer (Family / Blood-line)</option>
              <option value="Resale">Secondary Market Resale</option>
              <option value="Cancellation & Refund">Booking Cancellation & Refund</option>
              <option value="Unit Swap">Unit Swap / Floor Change</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mohammad Rafiqul Islam"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Number *
              </label>
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

          {requestType !== "Cancellation & Refund" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Transferee / Buyer Name
                </label>
                <input
                  type="text"
                  value={newBuyer}
                  onChange={(e) => setNewBuyer(e.target.value)}
                  placeholder="New purchaser name"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transfer Fee (BDT)
                </label>
                <input
                  type="number"
                  value={transferFee}
                  onChange={(e) => setTransferFee(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          )}
        </form>
      </CSModal>
    </div>
  );
}

