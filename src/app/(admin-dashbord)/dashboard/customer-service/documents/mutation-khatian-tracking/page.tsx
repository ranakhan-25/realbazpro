"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { MutationRecord } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_MUTATIONS: MutationRecord[] = [
  {
    id: "MUT-701",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    mutationAppNo: "MUT-2026-DH-88419",
    acLandOffice: "AC (Land) Office, Gulshan Circle, Dhaka",
    currentStage: "Hearing Scheduled",
    hearingDate: "2026-11-22",
    dcrFeeAmount: 1170,
    dcrPaid: false,
    lastUpdated: "2026-11-02",
  },
  {
    id: "MUT-702",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    mutationAppNo: "MUT-2026-DH-55192",
    acLandOffice: "AC (Land) Office, Mohammadpur Circle, Dhaka",
    currentStage: "Khatian Approved",
    dcrNumber: "DCR-2026-77881",
    dcrFeeAmount: 1170,
    dcrPaid: true,
    khatianNumber: "Khatian No. 12904 (Namjari)",
    lastUpdated: "2026-10-14",
  },
  {
    id: "MUT-703",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    mutationAppNo: "MUT-2026-DH-12004",
    acLandOffice: "AC (Land) Office, Badda Circle, Dhaka",
    currentStage: "Kanungo/Surveyor Inquiry",
    dcrFeeAmount: 1170,
    dcrPaid: false,
    lastUpdated: "2026-10-28",
  },
];

export default function MutationKhatianTrackingPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [mutations, setMutations] = useState<MutationRecord[]>(INITIAL_MUTATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [appNo, setAppNo] = useState("");
  const [office, setOffice] = useState("AC (Land) Office, Gulshan Circle, Dhaka");

  const filtered = mutations.filter((m) => {
    if (activeTab === "approved") return m.currentStage === "Khatian Approved";
    if (activeTab === "hearing") return m.currentStage === "Hearing Scheduled";
    if (activeTab === "inquiry") return m.currentStage === "Kanungo/Surveyor Inquiry";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !appNo) {
      toast.error("Please fill in customer name and e-Mutation Application No");
      return;
    }

    const created: MutationRecord = {
      id: `MUT-${700 + mutations.length + 1}`,
      customerName: customer,
      unit: unit || "Unit Allotment",
      project: "Assigned Project",
      mutationAppNo: appNo.trim(),
      acLandOffice: office,
      currentStage: "Kanungo/Surveyor Inquiry",
      dcrFeeAmount: 1170,
      dcrPaid: false,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    setMutations([created, ...mutations]);
    toast.success(`e-Mutation application ${created.mutationAppNo} registered for tracking`);
    setIsModalOpen(false);
  };

  const columns: Column<MutationRecord>[] = [
    {
      key: "mutationAppNo",
      header: "E-MUTATION APP NO & OFFICE",
      sortable: true,
      minWidth: "240px",
      render: (m) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] tabular-nums text-xs">{m.mutationAppNo}</span>
          <div className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{m.acLandOffice}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER & UNIT",
      minWidth: "190px",
      render: (m) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{m.customerName}</div>
          <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">{m.unit}</div>
        </div>
      ),
    },
    {
      key: "currentStage",
      header: "CURRENT STAGE IN LAND OFFICE",
      minWidth: "220px",
      render: (m) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              m.currentStage === "Khatian Approved"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : m.currentStage === "Hearing Scheduled"
                  ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                  : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
            }`}
          >
            {m.currentStage}
          </span>
          {m.hearingDate && (
            <div className="text-[11px] text-[#DC6803] font-semibold tabular-nums">
              Hearing Date: {m.hearingDate}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dcrNumber",
      header: "DCR FEE & KHATIAN NO",
      minWidth: "200px",
      render: (m) => (
        <div className="space-y-1">
          {m.khatianNumber ? (
            <span className="font-semibold text-[#039855] block text-xs">
              {m.khatianNumber}
            </span>
          ) : (
            <span className="text-[11px] text-[#9CA3AF] italic">Khatian Pending</span>
          )}
          <span
            className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${
              m.dcrPaid
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
            }`}
          >
            {m.dcrPaid ? `DCR ৳ ${m.dcrFeeAmount} Paid` : `DCR ৳ ${m.dcrFeeAmount} Unpaid`}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "140px",
      render: (m) => (
        <div className="flex items-center justify-end">
          <a
            href="https://mutation.land.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Bangladesh Land Ministry e-Mutation Portal"
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Verify Portal
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="e-Mutation & Khatian Tracking (ই-নামজারি)"
        subtitle="Track Bangladesh Land Ministry e-Mutation application numbers, inquiry stages, hearing slots, DCR fees, and approved khatian numbers."
        badge="Land Records Service"
        breadcrumbs={[{ label: "Documents & Land Records" }, { label: "e-Mutation Tracking" }]}
        primaryAction={{
          label: "Register e-Mutation Case",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active e-Mutation Cases"
          value={mutations.length.toString()}
          subtext="Under AC Land office processing"
          icon={FileCheck2}
        />
        <CSStatCard
          title="Hearings Scheduled"
          value={mutations.filter((m) => m.currentStage === "Hearing Scheduled").length.toString()}
          subtext="Customer appearance required"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Khatian Generated & Approved"
          value={mutations.filter((m) => m.currentStage === "Khatian Approved").length.toString()}
          subtext="Separated mutated ownership"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Cases", count: mutations.length },
          {
            key: "hearing",
            label: "Hearing Scheduled",
            count: mutations.filter((m) => m.currentStage === "Hearing Scheduled").length,
            badgeVariant: "warning",
          },
          {
            key: "inquiry",
            label: "Kanungo / Field Inquiry",
            count: mutations.filter((m) => m.currentStage === "Kanungo/Surveyor Inquiry").length,
          },
          {
            key: "approved",
            label: "Khatian Approved & Completed",
            count: mutations.filter((m) => m.currentStage === "Khatian Approved").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search e-Mutation App No, customer name, unit or AC Land Office..."
        searchFields={["mutationAppNo", "customerName", "unit", "acLandOffice"]}
        emptyTitle="No e-Mutation cases found"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register e-Mutation Application"
        subtitle="Record the official Land Ministry tracking number and assigned circle office"
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
              Save Application
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              e-Mutation Application No *
            </label>
            <input
              type="text"
              required
              value={appNo}
              onChange={(e) => setAppNo(e.target.value)}
              placeholder="e.g. MUT-2026-DH-XXXXX"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums font-semibold outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit Number</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Assistant Commissioner (Land) Office
            </label>
            <input
              type="text"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
