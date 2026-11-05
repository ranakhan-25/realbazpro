"use client";

import React, { useState } from "react";
import {
  Users,
  Building,
  FileText,
  DollarSign,
  Plus,
  CheckCircle2,
  Bell,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface AssociationRecord {
  id: string;
  project: string;
  associationName: string;
  presidentName: string;
  contactPhone: string;
  totalFlats: number;
  handedOverCount: number;
  monthlyServiceChargePerFlat: number;
  associationBankAcc: string;
  handoverStatus: "Developer Managing" | "Ad-hoc Committee" | "Formally Handed Over to OA";
}

const INITIAL_ASSOCIATIONS: AssociationRecord[] = [
  {
    id: "OA-01",
    project: "Hena Heights, Gulshan",
    associationName: "Hena Heights Flat Owners Welfare Association",
    presidentName: "Dr. Kazi Mostafa",
    contactPhone: "+880 1711-889900",
    totalFlats: 16,
    handedOverCount: 14,
    monthlyServiceChargePerFlat: 7500,
    associationBankAcc: "City Bank (Gulshan) A/C: 1102998811",
    handoverStatus: "Formally Handed Over to OA",
  },
  {
    id: "OA-02",
    project: "Eastern Lakeview, Dhanmondi",
    associationName: "Eastern Lakeview Apartment Owners Society",
    presidentName: "Engr. Rezaul Karim",
    contactPhone: "+880 1819-334455",
    totalFlats: 24,
    handedOverCount: 20,
    monthlyServiceChargePerFlat: 6000,
    associationBankAcc: "BRAC Bank A/C: 2201994400",
    handoverStatus: "Ad-hoc Committee",
  },
  {
    id: "OA-03",
    project: "Sheba Green Valley, Bashundhara",
    associationName: "Sheba Green Valley Residents Society",
    presidentName: "Under Formation (Developer Custody)",
    contactPhone: "+880 1914-001122",
    totalFlats: 48,
    handedOverCount: 18,
    monthlyServiceChargePerFlat: 5000,
    associationBankAcc: "Pending Formation",
    handoverStatus: "Developer Managing",
  },
];

export default function WorkOrdersAssociationPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [associations, setAssociations] = useState<AssociationRecord[]>(INITIAL_ASSOCIATIONS);

  const filtered = associations.filter((a) => {
    if (activeTab === "handedover") return a.handoverStatus === "Formally Handed Over to OA";
    if (activeTab === "developer") return a.handoverStatus === "Developer Managing";
    return true;
  });

  const columns: Column<AssociationRecord>[] = [
    {
      key: "associationName",
      header: "ASSOCIATION NAME & PROJECT",
      sortable: true,
      minWidth: "250px",
      render: (a) => (
        <div>
          <span className="font-semibold text-[#111827] block text-xs">{a.associationName}</span>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{a.project}</div>
        </div>
      ),
    },
    {
      key: "presidentName",
      header: "PRESIDENT / SOCIETY LEADERSHIP",
      minWidth: "220px",
      render: (a) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{a.presidentName}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{a.contactPhone}</div>
        </div>
      ),
    },
    {
      key: "handedOverCount",
      header: "OCCUPANCY RATIO",
      minWidth: "170px",
      render: (a) => (
        <div>
          <span className="text-xs font-semibold text-[#111827] tabular-nums">
            {a.handedOverCount} / {a.totalFlats} Flats
          </span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {Math.round((a.handedOverCount / a.totalFlats) * 100)}% possession completed
          </div>
        </div>
      ),
    },
    {
      key: "monthlyServiceChargePerFlat",
      header: "SERVICE CHARGE (TK/MO)",
      minWidth: "200px",
      render: (a) => (
        <div>
          <span className="font-semibold text-[#039855] text-xs tabular-nums">
            ৳ {a.monthlyServiceChargePerFlat.toLocaleString()} / flat
          </span>
          <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">{a.associationBankAcc}</div>
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "GOVERNANCE STATUS",
      minWidth: "210px",
      render: (a) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            a.handoverStatus === "Formally Handed Over to OA"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : a.handoverStatus === "Ad-hoc Committee"
                ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
          }`}
        >
          {a.handoverStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "90px",
      render: (a) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => toast.info(`Viewing society details: ${a.associationName}`)}
            title="View Association Details"
            aria-label="View Association Details"
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
        title="Work Orders & Flat Owners Association (OA)"
        subtitle="Manage Flat Owners Welfare Association formation, common service charge budgets, and common area governance transfer."
        badge="Society Transition"
        breadcrumbs={[{ label: "Warranty & Property Care" }, { label: "Owners Association" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Residential Societies"
          value={associations.length.toString()}
          subtext="Managed under ERP transition"
          icon={Building}
        />
        <CSStatCard
          title="Handed Over to OA"
          value={associations.filter((a) => a.handoverStatus === "Formally Handed Over to OA").length.toString()}
          subtext="Elected committee managing"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
        <CSStatCard
          title="Avg Monthly Service Charge"
          value="৳ 6,166"
          subtext="Per apartment unit"
          icon={DollarSign}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Projects", count: associations.length },
          {
            key: "handedover",
            label: "Handed Over to OA",
            count: associations.filter((a) => a.handoverStatus === "Formally Handed Over to OA").length,
          },
          {
            key: "developer",
            label: "Developer Managing",
            count: associations.filter((a) => a.handoverStatus === "Developer Managing").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search project, association name or president..."
        searchFields={["project", "associationName", "presidentName"]}
        emptyTitle="No owners associations found"
      />
    </div>
  );
}
