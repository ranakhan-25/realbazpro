"use client";

import React, { useState } from "react";
import {
  KeyRound,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Wrench,
  Building,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface SnagItem {
  id: string;
  unit: string;
  customerName: string;
  defectLocation: string;
  description: string;
  severity: "Minor" | "Major" | "Critical";
  assignedContractor: string;
  targetRectificationDate: string;
  status: "Reported" | "In Rectification" | "Verified by Site Engr" | "Client Signed Off";
}

const INITIAL_SNAGS: SnagItem[] = [
  {
    id: "SNG-101",
    unit: "C-9, Sheba Green",
    customerName: "Barrister Shahed Chowdhury",
    defectLocation: "Dining Room Floor",
    description: "Hollow sound detected in 4 Italian tiles near south balcony entrance.",
    severity: "Minor",
    assignedContractor: "Mirpur Ceramic Works (Subcontractor)",
    targetRectificationDate: "2026-11-12",
    status: "In Rectification",
  },
  {
    id: "SNG-102",
    unit: "C-9, Sheba Green",
    customerName: "Barrister Shahed Chowdhury",
    defectLocation: "Master Bathroom",
    description: "Concealed shower mixer tap dripping intermittently.",
    severity: "Major",
    assignedContractor: "Apex Plumbing & Sanitary",
    targetRectificationDate: "2026-11-08",
    status: "Verified by Site Engr",
  },
  {
    id: "SNG-103",
    unit: "A-7, Hena Heights",
    customerName: "Mohammad Rafiqul Islam",
    defectLocation: "Drawing Room Ceiling",
    description: "Minor hairline plaster crack along western beam junction.",
    severity: "Minor",
    assignedContractor: "Gulshan Civil Finishing Crew",
    targetRectificationDate: "2026-11-05",
    status: "Client Signed Off",
  },
];

export default function InspectionSnagsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [activeTab, setActiveTab] = useState("all");
  const [snags, setSnags] = useState<SnagItem[]>(INITIAL_SNAGS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [unit, setUnit] = useState("");
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState<SnagItem["severity"]>("Minor");
  const [contractor, setContractor] = useState("");

  const filtered = snags.filter((s) => {
    if (activeTab === "pending") return s.status !== "Client Signed Off";
    if (activeTab === "resolved") return s.status === "Client Signed Off";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !desc) {
      toast.error("Please fill in unit and defect description");
      return;
    }

    const created: SnagItem = {
      id: `SNG-${100 + snags.length + 1}`,
      unit,
      customerName: customer || "Verified Purchaser",
      defectLocation: location || "General Area",
      description: desc,
      severity,
      assignedContractor: contractor || "In-house Finishing Team",
      targetRectificationDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      status: "Reported",
    };

    setSnags([created, ...snags]);
    toast.success(`Snag item ${created.id} logged for engineering rectification`);
    setIsModalOpen(false);
  };

  const handleAdvance = (item: SnagItem) => {
    let nextStatus: SnagItem["status"] = item.status;
    if (item.status === "Reported") nextStatus = "In Rectification";
    else if (item.status === "In Rectification") nextStatus = "Verified by Site Engr";
    else if (item.status === "Verified by Site Engr") nextStatus = "Client Signed Off";

    setSnags(snags.map((s) => (s.id === item.id ? { ...s, status: nextStatus } : s)));
    toast.success(`Snag ${item.id} updated to: ${nextStatus}`);
  };

  const columns: Column<SnagItem>[] = [
    {
      key: "id",
      header: "Snag ID & Unit",
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{s.id}</span>
          <div className="text-[11px] font-semibold text-blue-600">{s.unit}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Defect Description & Area",
      render: (s) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{s.defectLocation}</span>
          <p className="text-slate-600 text-[11px] line-clamp-1">{s.description}</p>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (s) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            s.severity === "Critical"
              ? "bg-rose-100 text-rose-800"
              : s.severity === "Major"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {s.severity}
        </span>
      ),
    },
    {
      key: "assignedContractor",
      header: "Contractor & Deadline",
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">{s.assignedContractor}</div>
          <div className="text-[11px] text-slate-400">Target: {s.targetRectificationDate}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Rectification Status",
      render: (s) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              s.status === "Client Signed Off"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : s.status === "Verified by Site Engr"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {s.status}
          </span>
          {s.status !== "Client Signed Off" && (
            <div>
              <button
                type="button"
                onClick={() => handleAdvance(s)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Advance Status →
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
        title="Joint Inspections & Snagging (হ্যান্ডওভার-পূর্ব ত্রুটি)"
        subtitle="Manage joint pre-handover walk-through defect lists, contractor assignments, and client rectification sign-offs."
        badge="Quality Assurance"
        breadcrumbs={[{ label: "Handover & Possession" }, { label: "Inspections & Snagging" }]}
        primaryAction={{
          label: "Log Snag Item",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Snags Logged"
          value={snags.length.toString()}
          subtext="Under quality rectification"
          icon={Wrench}
        />
        <CSStatCard
          title="Pending Contractor Fix"
          value={snags.filter((s) => s.status !== "Client Signed Off").length.toString()}
          subtext="Assigned to finishing crews"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Client Signed Off"
          value={snags.filter((s) => s.status === "Client Signed Off").length.toString()}
          subtext="Cleared for key possession"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Snag Items", count: snags.length },
          {
            key: "pending",
            label: "Pending Rectification",
            count: snags.filter((s) => s.status !== "Client Signed Off").length,
            badgeVariant: "warning",
          },
          {
            key: "resolved",
            label: "Client Signed Off",
            count: snags.filter((s) => s.status === "Client Signed Off").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search snag ID, unit, location, contractor or description..."
        searchFields={["id", "unit", "defectLocation", "assignedContractor", "description"]}
        emptyTitle="No inspection snags logged"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Joint Inspection Snag Item"
        subtitle="Record defect identified during customer walk-through"
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
              Save Snag Record
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Allotment *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. C-9, Sheba Green"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Defect Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Master Bedroom Ceiling"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Minor">Minor (Cosmetic / Paint)</option>
                <option value="Major">Major (Plumbing / Sanitary / Tiles)</option>
                <option value="Critical">Critical (Structural / Electrical Feed)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Contractor</label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="Finishing / MEP team"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Defect Description *</label>
            <textarea
              rows={3}
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe issue found during walk-through..."
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}

