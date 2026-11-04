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
      header: "Association Name & Project",
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.associationName}</span>
          <div className="text-[11px] text-blue-600 font-medium">{a.project}</div>
        </div>
      ),
    },
    {
      key: "presidentName",
      header: "President / Society Leadership",
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">{a.presidentName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{a.contactPhone}</div>
        </div>
      ),
    },
    {
      key: "handedOverCount",
      header: "Occupancy Ratio",
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-900">
            {a.handedOverCount} / {a.totalFlats} Flats
          </span>
          <div className="text-[11px] text-slate-400">
            {Math.round((a.handedOverCount / a.totalFlats) * 100)}% possession completed
          </div>
        </div>
      ),
    },
    {
      key: "monthlyServiceChargePerFlat",
      header: "Service Charge (Tk/mo)",
      render: (a) => (
        <div>
          <span className="font-bold text-emerald-700 text-xs">
            ৳ {a.monthlyServiceChargePerFlat.toLocaleString()} / flat
          </span>
          <div className="text-[10px] text-slate-400 font-mono">{a.associationBankAcc}</div>
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "Governance Status",
      render: (a) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            a.handoverStatus === "Formally Handed Over to OA"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : a.handoverStatus === "Ad-hoc Committee"
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {a.handoverStatus}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <CSStatCard
          title="Avg Monthly Service Charge"
          value="৳ 6,166"
          subtext="Per apartment unit"
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
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

