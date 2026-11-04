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
  const brand = primaryColor || "#0000F2";

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
      header: "Claim No & Unit",
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{c.claimNo}</span>
          <div className="text-[11px] text-blue-600 font-semibold">{c.unit}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Purchaser & Project",
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900">{c.customerName}</div>
          <div className="text-[11px] text-slate-400">{c.project}</div>
        </div>
      ),
    },
    {
      key: "defectCategory",
      header: "Defect & Severity",
      render: (c) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-800 text-xs block">{c.defectCategory}</span>
          <span
            className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
              c.severity === "Critical Structural"
                ? "bg-rose-100 text-rose-800"
                : c.severity === "Major"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {c.severity}
          </span>
        </div>
      ),
    },
    {
      key: "dlpExpiryDate",
      header: "2-Year Statutory Timer",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-indigo-700">Expires: {c.dlpExpiryDate}</div>
          <div className="text-[10px] text-slate-400">Possession: {c.possessionDate}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Rectification Status",
      render: (c) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              c.status === "Resolved & Signed Off"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : c.status === "Rectification in Progress"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {c.status}
          </span>
          {c.status !== "Resolved & Signed Off" && (
            <div>
              <button
                type="button"
                onClick={() => handleAdvance(c)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Advance Stage →
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

      {/* Statutory Act Notice Card */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white p-5 space-y-2">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Real Estate Development & Management Act, 2010 (ধারা ১১(২)(গ))</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
          হস্তান্তরের তারিখ থেকে ন্যূনতম <strong>২ (দুই) বছর পর্যন্ত</strong> নির্মাণজনিত যে কোনো কাঠামোগত ত্রুটি
          (যেমন: ছাদ/দেওয়াল লিকেজ, প্লাস্টার ক্র্যাক, ড্রেনেজ স্লথ, ইত্যাদি) ডেভেলপার নিজ খরচে মেরামত করতে আইনত বাধ্য।
          প্রতিটি ফ্ল্যাটের জন্য হস্তান্তরের তারিখ থেকে সিস্টেম অটোমেটিক DLP টাইমার কাউন্টডাউন বজায় রাখে।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active DLP Warranty Contracts"
          value="142 Flats"
          subtext="Under active 2-year warranty"
          icon={ShieldCheck}
        />
        <CSStatCard
          title="Active Claims in Rectification"
          value={claims.filter((c) => c.status !== "Resolved & Signed Off").length.toString()}
          subtext="Assigned to structural engineers"
          icon={Wrench}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Claims Resolved & Signed Off"
          value={claims.filter((c) => c.status === "Resolved & Signed Off").length.toString()}
          subtext="Client satisfaction confirmed"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Warranty Claims", count: claims.length },
          {
            key: "active",
            label: "Active In Progress",
            count: claims.filter((c) => c.status !== "Resolved & Signed Off").length,
            badgeVariant: "warning",
          },
          {
            key: "resolved",
            label: "Resolved & Signed Off",
            count: claims.filter((c) => c.status === "Resolved & Signed Off").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search claim no, customer, unit or defect category..."
        searchFields={["claimNo", "customerName", "unit", "defectCategory"]}
        emptyTitle="No DLP warranty claims logged"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Statutory DLP Warranty Claim"
        subtitle="Record defect under Section 11(2)(c) builder repair obligation"
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
              Register Claim
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
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Full name"
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
              <label className="block font-semibold text-slate-700 mb-1">Defect Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Water Seepage">Water Seepage / Dampness</option>
                <option value="Wall Cracks">Wall / Plaster Hairline Cracks</option>
                <option value="Drainage Backflow">Drainage Backflow / Sanitary</option>
                <option value="Electrical Sub-Line">Electrical Sub-Line Fluctuation</option>
                <option value="Window Sealant">Window / Balcony Silicone Sealant</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Major">Major</option>
                <option value="Critical Structural">Critical Structural</option>
                <option value="Minor">Minor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned QA Engineer</label>
            <input
              type="text"
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}

