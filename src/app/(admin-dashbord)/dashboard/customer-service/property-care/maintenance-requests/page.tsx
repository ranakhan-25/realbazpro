"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  CheckCircle2,
  Building,
  Plus,
  Eye,
  RefreshCw,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  MaintenanceItem,
  MaintenanceStatsResult,
  getMaintenanceRequests,
  getMaintenanceStats,
  createMaintenanceRequest,
  completeMaintenanceRequest,
} from "@/services/customerPropertyCareService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function MaintenanceRequestsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [stats, setStats] = useState<MaintenanceStatsResult>({
    totalScheduled: 0,
    inProgress: 0,
    completed: 0,
    totalCostEstimate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [facility, setFacility] = useState("");
  const [projectName, setProjectName] = useState("");
  const [type, setType] = useState<MaintenanceItem["maintenanceType"]>("Preventive");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("25000");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listRes, statsRes] = await Promise.all([
        getMaintenanceRequests({
          project_id: projectId || undefined,
          tab: activeTab !== "all" ? activeTab : undefined,
          limit: 100,
        }),
        getMaintenanceStats({ project_id: projectId || undefined }),
      ]);

        setItems(listRes?.items ?? []);
        if (statsRes) {
          setStats(statsRes);
        }
      } catch (err: any) {
        console.error("Error loading maintenance requests:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load maintenance requests");
      } finally {
        setIsLoading(false);
      }
    }, [projectId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (project?.name) {
      setProjectName(project.name);
    }
  }, [project]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) {
      toast.error("Please specify facility or equipment");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createMaintenanceRequest({
        facility,
        project_id: projectId || undefined,
        project_name: projectName || project?.name || "Assigned Project",
        maintenance_type: type,
        vendor_name: vendor || "In-house Facility Care",
        cost_estimate: Number(cost) || 0,
      });

      toast.success(`Maintenance request ${created.requestNo || created.request_no || created.id} scheduled`);
      setIsModalOpen(false);
      setFacility("");
      setVendor("");
      setCost("25000");
      loadData();
    } catch (err: any) {
      console.error("Error creating maintenance request:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to schedule maintenance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (m: MaintenanceItem) => {
    const itemUuid = m.uuid || m.id;
    try {
      await completeMaintenanceRequest(itemUuid);
      toast.success(`Maintenance job for ${m.facility} marked as completed`);
      loadData();
    } catch (err: any) {
      console.error("Error completing maintenance:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to complete maintenance");
    }
  };

  const filtered = items.filter((i) => {
    if (activeTab === "active") return i.status !== "Completed";
    if (activeTab === "completed") return i.status === "Completed";
    return true;
  });

  const columns: Column<MaintenanceItem>[] = [
    {
      key: "facility",
      header: "EQUIPMENT / COMMON FACILITY",
      sortable: true,
      minWidth: "240px",
      render: (m) => (
        <div>
          <span className="font-semibold text-[#111827] block text-xs">{m.facility}</span>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {m.project || m.project_name || project?.name || "Assigned Project"}
          </div>
        </div>
      ),
    },
    {
      key: "maintenanceType",
      header: "TYPE & DATE",
      minWidth: "160px",
      render: (m) => (
        <div>
          <span className="font-semibold text-[#111827] text-xs">
            {m.maintenanceType || m.maintenance_type}
          </span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            Date: {m.scheduledDate || m.scheduled_date}
          </div>
        </div>
      ),
    },
    {
      key: "vendorName",
      header: "SERVICING VENDOR / AMC",
      minWidth: "220px",
      render: (m) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{m.vendorName || m.vendor_name}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            Est. Cost: ৳ {(m.costEstimate ?? m.cost_estimate ?? 0).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "140px",
      render: (m) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.status === "Completed"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : m.status === "In Progress"
                ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
            }`}
        >
          {m.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "110px",
      render: (m) => (
          <div className="flex items-center justify-end gap-1.5">
            {m.status !== "Completed" && (
              <button
                type="button"
                onClick={() => handleComplete(m)}
                title="Mark Job Completed"
                aria-label="Complete Job"
                className="h-8 px-2 rounded-lg inline-flex items-center gap-1 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </button>
            )}
            <button
              type="button"
              onClick={() => toast.info(`Viewing maintenance details: ${m.facility}`)}
              title="View Maintenance Job Details"
              aria-label="View Details"
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
                value={(stats.totalScheduled + stats.inProgress).toString()}
                subtext="Under active vendor servicing"
                icon={Wrench}
              />
              <CSStatCard
                title="Service Cost Estimate"
                value={`৳ ${(stats.totalCostEstimate || 0).toLocaleString()}`}
                subtext="Common area equipment AMC"
                icon={Building}
                iconBg="bg-[#EFF6FF]"
                iconColor="text-[#2563EB]"
              />
              <CSStatCard
                title="Completed Services"
                value={stats.completed.toString()}
                subtext="Inspections & servicing signed off"
                icon={CheckCircle2}
                iconBg="bg-[#ECFDF3]"
                iconColor="text-[#039855]"
              />
            </div>

            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Requests", count: items.length },
                {
                  key: "active",
                  label: "Active Jobs",
                  count: stats.totalScheduled + stats.inProgress,
                  badgeVariant: "warning",
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: stats.completed,
                },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <CSTable
              data={filtered}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search facility, project or servicing vendor..."
              searchFields={["facility", "project", "project_name", "vendorName", "vendor_name", "maintenanceType", "maintenance_type"]}
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
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCreate}
                    className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Save Schedule
                  </button>
                </>
              }
            >
              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Facility / Asset Equipment *</label>
                  <input
                    type="text"
                    required
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    placeholder="e.g. Passenger Lift 01 (Sigma)"
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Project Allotment</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder={project?.name || "Project Name"}
                      className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Maintenance Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
                    >
                      <option value="Preventive">Preventive AMC Servicing</option>
                      <option value="Emergency Breakdown">Emergency Breakdown</option>
                      <option value="Statutory Annual">Statutory Annual Inspection</option>
                      <option value="Routine Service">Routine Operational Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Servicing Vendor</label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="e.g. Sigma Elevator Ltd."
                      className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Estimated Cost (BDT)</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                    />
                  </div>
                </div>
              </form>
            </CSModal>
          </div>
          );
}
