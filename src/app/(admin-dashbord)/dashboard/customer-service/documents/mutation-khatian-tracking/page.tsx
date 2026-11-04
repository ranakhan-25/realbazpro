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
  const brand = primaryColor || "#0000F2";

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
      header: "e-Mutation App No & Office",
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{m.mutationAppNo}</span>
          <div className="text-[11px] text-slate-500 line-clamp-1">{m.acLandOffice}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (m) => (
        <div>
          <div className="font-bold text-slate-900">{m.customerName}</div>
          <div className="text-[11px] text-slate-500 font-medium">{m.unit}</div>
        </div>
      ),
    },
    {
      key: "currentStage",
      header: "Current Stage in Land Office",
      render: (m) => (
        <div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              m.currentStage === "Khatian Approved"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : m.currentStage === "Hearing Scheduled"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {m.currentStage}
          </span>
          {m.hearingDate && (
            <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
              Hearing Date: {m.hearingDate}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dcrNumber",
      header: "DCR Fee & Khatian No",
      render: (m) => (
        <div className="space-y-0.5">
          {m.khatianNumber ? (
            <span className="font-bold text-emerald-700 block text-xs">
              {m.khatianNumber}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Khatian Pending</span>
          )}
          <span
            className={`inline-block text-[10px] font-bold rounded px-1.5 py-0.2 ${
              m.dcrPaid
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {m.dcrPaid ? `DCR ৳ ${m.dcrFeeAmount} Paid` : `DCR ৳ ${m.dcrFeeAmount} Unpaid`}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Govt Portal",
      render: (m) => (
        <a
          href="https://mutation.land.gov.bd"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <ExternalLink className="h-3 w-3 text-blue-600" /> Verify Portal
        </a>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Khatian Generated & Approved"
          value={mutations.filter((m) => m.currentStage === "Khatian Approved").length.toString()}
          subtext="Separated mutated ownership"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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
              Save Application
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              e-Mutation Application No *
            </label>
            <input
              type="text"
              required
              value={appNo}
              onChange={(e) => setAppNo(e.target.value)}
              placeholder="e.g. MUT-2026-DH-XXXXX"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Number</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assistant Commissioner (Land) Office
            </label>
            <input
              type="text"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}

