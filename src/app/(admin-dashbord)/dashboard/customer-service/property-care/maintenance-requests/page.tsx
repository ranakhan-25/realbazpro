"use client";

import React, { useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building,
  Zap,
  Droplets,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface MaintenanceItem {
  id: string;
  facility: string;
  project: string;
  maintenanceType: "Preventive" | "Emergency Breakdown" | "Statutory Annual" | "Routine Service";
  scheduledDate: string;
  vendorName: string;
  costEstimate: number;
  status: "Scheduled" | "In Progress" | "Completed" | "Pending Parts";
}

const INITIAL_MAINTENANCE: MaintenanceItem[] = [
  {
    id: "MNT-501",
    facility: "Passenger Lift 01 & 02 (Sigma 10-Passenger)",
    project: "Hena Heights, Gulshan",
    maintenanceType: "Preventive",
    scheduledDate: "2026-11-15",
    vendorName: "Sigma Elevator Bangladesh Ltd.",
    costEstimate: 28000,
    status: "Scheduled",
  },
  {
    id: "MNT-502",
    facility: "Standby Diesel Generator (Cummins 150 kVA)",
    project: "Eastern Lakeview, Dhanmondi",
    maintenanceType: "Routine Service",
    scheduledDate: "2026-11-08",
    vendorName: "Energypac Power Generation",
    costEstimate: 35000,
    status: "In Progress",
  },
  {
    id: "MNT-503",
    facility: "Deep Tube-well Submersible Water Pump",
    project: "Sheba Green Valley",
    maintenanceType: "Emergency Breakdown",
    scheduledDate: "2026-11-03",
    vendorName: "Pedrollo Pumps Bangladesh",
    costEstimate: 45000,
    status: "Completed",
  },
];

export default function MaintenanceRequestsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState<MaintenanceItem[]>(INITIAL_MAINTENANCE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [facility, setFacility] = useState("");
  const [project, setProject] = useState("Hena Heights, Gulshan");
  const [type, setType] = useState<MaintenanceItem["maintenanceType"]>("Preventive");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("25000");

  const filtered = items.filter((i) => {
    if (activeTab === "active") return i.status !== "Completed";
    if (activeTab === "completed") return i.status === "Completed";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) {
      toast.error("Please specify facility or equipment");
      return;
    }

    const created: MaintenanceItem = {
      id: `MNT-${500 + items.length + 1}`,
      facility,
      project,
      maintenanceType: type,
      scheduledDate: new Date().toISOString().split("T")[0],
      vendorName: vendor || "In-house Facility Care",
      costEstimate: Number(cost) || 0,
      status: "Scheduled",
    };

    setItems([created, ...items]);
    toast.success(`Maintenance request ${created.id} scheduled`);
    setIsModalOpen(false);
  };

  const columns: Column<MaintenanceItem>[] = [
    {
      key: "facility",
      header: "Equipment / Common Facility",
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{m.facility}</span>
          <div className="text-[11px] text-blue-600 font-medium">{m.project}</div>
        </div>
      ),
    },
    {
      key: "maintenanceType",
      header: "Type & Date",
      render: (m) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">{m.maintenanceType}</span>
          <div className="text-[11px] text-slate-400">Date: {m.scheduledDate}</div>
        </div>
      ),
    },
    {
      key: "vendorName",
      header: "Servicing Vendor / AMC",
      render: (m) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">{m.vendorName}</div>
          <div className="text-[11px] font-mono text-slate-500">Est. Cost: ৳ {m.costEstimate.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            m.status === "Completed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : m.status === "In Progress"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {m.status}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      <CSPageHeader
        title="Post-Handover Maintenance Requests"
        subtitle="Manage common area equipment servicing (lifts, generators, pumps, fire safety) under Section 11(3) builder maintenance."
        badge="Facility Care"
        breadcrumbs={[{ label: "Warranty & Property Care" }, { label: "Maintenance Requests" }]}
        primaryAction={{
          label: "Schedule Service",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Maintenance Jobs"
          value={items.filter((i) => i.status !== "Completed").length.toString()}
          subtext="Under active vendor servicing"
          icon={Wrench}
        />
        <CSStatCard
          title="Monthly Service Budget"
          value="৳ 1.08 Lac"
          subtext="Common area equipment AMC"
          icon={Building}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <CSStatCard
          title="Completed This Month"
          value={items.filter((i) => i.status === "Completed").length.toString()}
          subtext="Preventive inspections signed off"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Requests", count: items.length },
          {
            key: "active",
            label: "Active Jobs",
            count: items.filter((i) => i.status !== "Completed").length,
            badgeVariant: "warning",
          },
          {
            key: "completed",
            label: "Completed",
            count: items.filter((i) => i.status === "Completed").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search facility, project or servicing vendor..."
        searchFields={["facility", "project", "vendorName", "maintenanceType"]}
        emptyTitle="No maintenance requests found"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Equipment Maintenance Service"
        subtitle="Log preventive maintenance or breakdown servicing for common building assets"
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
              Save Schedule
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Equipment / Facility *</label>
            <input
              type="text"
              required
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              placeholder="e.g. Passenger Lift 01"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Preventive">Preventive Maintenance (AMC)</option>
                <option value="Emergency Breakdown">Emergency Breakdown</option>
                <option value="Routine Service">Routine Service</option>
                <option value="Statutory Annual">Statutory Annual Inspection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Servicing Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="AMC Vendor"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (BDT)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}

