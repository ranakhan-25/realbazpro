"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building,
  Wrench,
  HelpCircle,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { WarrantyDlpClaim } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const INITIAL_CLAIMS: WarrantyDlpClaim[] = [
  {
    id: "DLP-201",
    claimNo: "DLP-2026-0012",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    possessionDate: "2026-08-20",
    dlpExpiryDate: "2028-08-19",
    defectCategory: "Water Seepage",
    severity: "Critical Structural",
    assignedEngineer: "Engr. Monirul Islam (Structural QA)",
    status: "Site Inspected",
  },
  {
    id: "DLP-202",
    claimNo: "DLP-2026-0008",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    possessionDate: "2026-10-15",
    dlpExpiryDate: "2028-10-14",
    defectCategory: "Drainage Backflow",
    severity: "Major",
    assignedEngineer: "Apex Sanitary Maintenance",
    status: "Resolved & Signed Off",
  },
  {
    id: "DLP-203",
    claimNo: "DLP-2026-0015",
    customerName: "Kazi Nabil Ahmed",
    unit: "C-9, Sheba Green",
    project: "Sheba Green Valley",
    possessionDate: "2026-09-01",
    dlpExpiryDate: "2028-08-31",
    defectCategory: "Window Sealant",
    severity: "Minor",
    assignedEngineer: "Alumex Fitting Crew",
    status: "Rectification in Progress",
  },
];

export default function WarrantyDlpPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [claims, setClaims] = useState<WarrantyDlpClaim[]>(INITIAL_CLAIMS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<WarrantyDlpClaim["defectCategory"]>("Water Seepage");
  const [severity, setSeverity] = useState<WarrantyDlpClaim["severity"]>("Major");
  const [engineer, setEngineer] = useState("Engr. Monirul Islam");

  const filtered = claims.filter((c) => {
    if (activeTab === "active") return c.status !== "Resolved & Signed Off";
    if (activeTab === "resolved") return c.status === "Resolved & Signed Off";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !unit) {
      toast.error("Please fill in customer and unit");
      return;
    }

    const created: WarrantyDlpClaim = {
      id: `DLP-${200 + claims.length + 1}`,
      claimNo: `DLP-2026-00${20 + claims.length + 1}`,
      customerName: customer,
      unit,
      project: "Assigned Project",
      possessionDate: "2026-10-01",
      dlpExpiryDate: "2028-09-30",
      defectCategory: category,
      severity,
      assignedEngineer: engineer,
      status: "Claim Logged",
    };

    setClaims([created, ...claims]);
    toast.success(`DLP Warranty Claim ${created.claimNo} registered under statutory warranty`);
    setIsModalOpen(false);
  };

  const handleAdvance = (item: WarrantyDlpClaim) => {
    let next: WarrantyDlpClaim["status"] = item.status;
    if (item.status === "Claim Logged") next = "Site Inspected";
    else if (item.status === "Site Inspected") next = "Rectification in Progress";
    else if (item.status === "Rectification in Progress") next = "Resolved & Signed Off";

    setClaims(claims.map((c) => (c.id === item.id ? { ...c, status: next } : c)));
    toast.success(`Claim ${item.claimNo} advanced to: ${next}`);
  };

  const columns: Column<WarrantyDlpClaim>[] = [
    {
      key: "claimNo",
      header: "CLAIM NO & UNIT",
      sortable: true,
      minWidth: "180px",
      render: (c) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{c.claimNo}</span>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{c.unit}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "PURCHASER & PROJECT",
      minWidth: "190px",
      render: (c) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{c.customerName}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">{c.project}</div>
        </div>
      ),
    },
    {
      key: "defectCategory",
      header: "DEFECT & SEVERITY",
      minWidth: "190px",
      render: (c) => (
        <div className="space-y-1">
          <span className="font-semibold text-[#111827] text-xs block">{c.defectCategory}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
              c.severity === "Critical Structural"
                ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                : c.severity === "Major"
                  ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                  : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
            }`}
          >
            {c.severity}
          </span>
        </div>
      ),
    },
    {
      key: "dlpExpiryDate",
      header: "2-YEAR STATUTORY TIMER",
      minWidth: "190px",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-[#6D4AFF] tabular-nums">Expires: {c.dlpExpiryDate}</div>
          <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">Possession: {c.possessionDate}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "RECTIFICATION STATUS",
      minWidth: "190px",
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            c.status === "Resolved & Signed Off"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : c.status === "Rectification in Progress"
                ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
          }`}
        >
          {c.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "120px",
      render: (c) => (
        <div className="flex items-center justify-end">
          {c.status !== "Resolved & Signed Off" ? (
            <button
              type="button"
              onClick={() => handleAdvance(c)}
              title="Advance claim rectification stage"
              aria-label="Advance Claim Stage"
              className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Advance
            </button>
          ) : (
            <span className="text-xs text-[#039855] font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Signed Off
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Warranty & Statutory DLP Claims (২ বছরের নির্মাণ ত্রুটি ওয়ারেন্টি)"
        subtitle="Manage Defect Liability Period (DLP) obligations under Section 11(2)(c) of the Real Estate Act 2010."
        badge="Statutory Warranty"
        breadcrumbs={[{ label: "Warranty & Property Care" }, { label: "Warranty & DLP Claims" }]}
        primaryAction={{
          label: "Log DLP Claim",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active DLP Warranty Claims"
          value={claims.length.toString()}
          subtext="Under builder warranty repair"
          icon={ShieldCheck}
        />
        <CSStatCard
          title="Critical Structural Repairs"
          value={claims.filter((c) => c.severity === "Critical Structural").length.toString()}
          subtext="High-priority engineer dispatch"
          icon={AlertTriangle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="Resolved Warranty Cases"
          value={claims.filter((c) => c.status === "Resolved & Signed Off").length.toString()}
          subtext="Client satisfaction sign-off"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All DLP Claims", count: claims.length },
          {
            key: "active",
            label: "Active & In Progress",
            count: claims.filter((c) => c.status !== "Resolved & Signed Off").length,
            badgeVariant: "warning",
          },
          {
            key: "resolved",
            label: "Resolved & Closed",
            count: claims.filter((c) => c.status === "Resolved & Signed Off").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search claim no, customer name, unit or defect category..."
        searchFields={["claimNo", "customerName", "unit", "defectCategory", "assignedEngineer"]}
        emptyTitle="No DLP warranty claims logged"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Statutory DLP Warranty Claim"
        subtitle="Builder Defect Liability Period (Real Estate Act 2010)"
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
              Register Claim
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
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit Number *</label>
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
              <label className="block font-semibold text-[#374151] mb-1">Defect Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Water Seepage">Water Seepage / Dampness</option>
                <option value="Plaster & Structural Crack">Plaster & Structural Crack</option>
                <option value="Drainage Backflow">Drainage & Plumbing Defect</option>
                <option value="Window Sealant">Aluminium Window Leakage</option>
                <option value="Tile Debonding">Hollow Tile / Debonding</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Minor">Minor (Non-structural)</option>
                <option value="Major">Major (Inhabitant Inconvenience)</option>
                <option value="Critical Structural">Critical Structural / Safety</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Assigned Engineer / Contractor
            </label>
            <input
              type="text"
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
