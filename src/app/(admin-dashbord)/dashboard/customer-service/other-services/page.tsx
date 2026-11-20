"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Building,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Users,
  X,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import {
  getMaintenanceRequests,
  getMaintenanceStats,
  createMaintenanceRequest,
  MaintenanceItem,
} from "@/services/customerPropertyCareService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface AmenityServiceItem {
  id: string;
  project: string;
  serviceCategory:
  | "Waste Management"
  | "Pest Control"
  | "Gym & Fitness"
  | "Swimming Pool"
  | "Landscaping & Greenery";
  serviceProvider: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "Bi-Monthly";
  nextScheduledDate: string;
  supervisorName: string;
  status: "Active" | "Scheduled" | "Under Review";
}

const INITIAL_SERVICES: AmenityServiceItem[] = [
  {
    id: "SRV-401",
    project: "Hena Heights, Gulshan",
    serviceCategory: "Waste Management",
    serviceProvider: "Dhaka North City Corp (DNCC Contracted)",
    frequency: "Daily",
    nextScheduledDate: "2026-11-08",
    supervisorName: "Md. Shafiqur Rahman",
    status: "Active",
  },
  {
    id: "SRV-402",
    project: "Hena Heights, Gulshan",
    serviceCategory: "Pest Control",
    serviceProvider: "Terminator Pest Control Ltd.",
    frequency: "Bi-Monthly",
    nextScheduledDate: "2026-11-20",
    supervisorName: "Farid Ahmed",
    status: "Scheduled",
  },
  {
    id: "SRV-403",
    project: "Eastern Lakeview, Dhanmondi",
    serviceCategory: "Swimming Pool",
    serviceProvider: "Aqua Clean Water Solutions",
    frequency: "Weekly",
    nextScheduledDate: "2026-11-10",
    supervisorName: "Tanvir Hasan",
    status: "Active",
  },
  {
    id: "SRV-404",
    project: "Sheba Green Valley",
    serviceCategory: "Landscaping & Greenery",
    serviceProvider: "Green Living Horticultural Services",
    frequency: "Weekly",
    nextScheduledDate: "2026-11-12",
    supervisorName: "Abul Bashar",
    status: "Active",
  },
];

export default function OtherServicesPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, isLoading } = useSelectedProject();
  const [activeTab, setActiveTab] = useState("all");
  const [services, setServices] =
    useState<AmenityServiceItem[]>(INITIAL_SERVICES);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCategory, setFormCategory] =
    useState<AmenityServiceItem["serviceCategory"]>("Waste Management");
  const [formVendor, setFormVendor] = useState("");
  const [formSupervisor, setFormSupervisor] = useState("");
  const [formFrequency, setFormFrequency] =
    useState<AmenityServiceItem["frequency"]>("Weekly");
  const [formDate, setFormDate] = useState("");
  const [formCost, setFormCost] = useState("0");

  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await getMaintenanceRequests({
        project_id: projectId || undefined,
        limit: 100,
      });
      if (res && res.items && res.items.length > 0) {
        const mapped: AmenityServiceItem[] = res.items.map(
          (m: MaintenanceItem) => {
            let cat: AmenityServiceItem["serviceCategory"] = "Waste Management";
            const facility = (m.facility || "").toLowerCase();
            if (facility.includes("pest")) cat = "Pest Control";
            else if (facility.includes("pool") || facility.includes("swim"))
              cat = "Swimming Pool";
            else if (facility.includes("land") || facility.includes("green"))
              cat = "Landscaping & Greenery";
            else if (facility.includes("gym") || facility.includes("fit"))
              cat = "Gym & Fitness";

            return {
              id: m.id,
              project:
                m.project_name ||
                m.project ||
                project?.name ||
                "Selected Project",
              serviceCategory: cat,
              serviceProvider:
                m.vendorName || m.vendor_name || "Contracted Facility Vendor",
              frequency: "Monthly",
              nextScheduledDate:
                m.scheduledDate || m.scheduled_date || "Scheduled",
              supervisorName: "Facility Supervisor",
              status:
                m.status === "Completed"
                  ? "Active"
                  : m.status === "In Progress"
                    ? "Scheduled"
                    : "Active",
            };
          },
        );
        setServices(mapped);
      }
    } catch (err) {
      console.warn(
        "Could not fetch remote maintenance contracts, using cache.",
        err,
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [projectId, project]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor.trim() || !formSupervisor.trim()) {
      toast.error("Please fill in Vendor Name and Supervisor Name.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createMaintenanceRequest({
        facility: `${formCategory} - ${project?.name || "Project Facility"}`,
        project_id: projectId || undefined,
        project_name: project?.name || "Selected Project",
        maintenance_type: "Routine Service",
        vendor_name: formVendor.trim(),
        cost_estimate: Number(formCost) || 0,
        scheduled_date: formDate || new Date().toISOString().slice(0, 10),
        remarks: `Supervisor: ${formSupervisor.trim()}. Frequency: ${formFrequency}. Communal amenity contract.`,
      });

      toast.success(
        `Service contract for ${formCategory} registered successfully.`,
      );
      setIsModalOpen(false);
      setFormVendor("");
      setFormSupervisor("");
      setFormCost("0");
      setFormDate("");
      await loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to register service contract.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !projectId) {
    return (
      <div className="space-y-6">
        <CSPageHeader
          title="Facility & Amenity Services"
          subtitle="Building Services • Waste, Pest Control, Landscaping, Swimming Pool & Fitness"
          badge="Building Services"
          breadcrumbs={[
            { label: "Building Services" },
            { label: "Other Services" },
          ]}
        />
        <CSSelectProjectEmptyState
          featureTitle="Facility & Amenity Services"
          description="Please select an active project from the top workspace selector to track vendor contracts, maintenance schedules, and amenity service frequencies."
        />
      </div>
    );
  }

  const filteredData = services.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return item.status === "Active";
    if (activeTab === "scheduled") return item.status === "Scheduled";
    return true;
  });

  const columns: Column<AmenityServiceItem>[] = [
    {
      key: "serviceCategory",
      header: "Service & Category",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-xs">
              {item.serviceCategory}
            </span>
            <p className="text-[11px] text-muted-foreground">{item.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project Location",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
          <Building className="h-3 w-3 text-muted-foreground" />
          {item.project}
        </div>
      ),
    },
    {
      key: "serviceProvider",
      header: "Vendor / Provider",
      render: (item) => (
        <div>
          <span className="font-medium text-xs text-foreground">
            {item.serviceProvider}
          </span>
          <p className="text-[11px] text-muted-foreground">
            Supervisor: {item.supervisorName}
          </p>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency & Next Schedule",
      render: (item) => (
        <div>
          <span className="font-medium text-xs text-foreground">
            {item.frequency}
          </span>
          <p className="text-[11px] text-muted-foreground">
            Due: {item.nextScheduledDate}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const isActive = item.status === "Active";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              }`}
          >
            {isActive ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {item.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <CSPageHeader
        title="Other Services"
        subtitle="Manage communal building amenities, waste handling, pest control, landscaping, and specialized maintenance contracts."
        badgeText="Building Services"
        primaryAction={{
          label: "Register Service Contract",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Active Service Contracts"
          value={String(services.filter((s) => s.status === "Active").length)}
          change="Across all properties"
          icon={Layers}
          color="emerald"
        />
        <CSStatCard
          title="Upcoming Cleanings"
          value={String(
            services.filter((s) => s.status === "Scheduled").length,
          )}
          change="Next 7 days"
          icon={Sparkles}
          color="blue"
        />
        <CSStatCard
          title="Amenity Facilities"
          value={String(services.length)}
          change="Pools, gyms & gardens"
          icon={Building}
          color="purple"
        />
        <CSStatCard
          title="Active Vendor Partners"
          value={String(new Set(services.map((s) => s.serviceProvider)).size)}
          change="Verified contractors"
          icon={Users}
          color="teal"
        />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Services", count: services.length },
            {
              key: "active",
              label: "Active Contracts",
              count: services.filter((s) => s.status === "Active").length,
            },
            {
              key: "scheduled",
              label: "Scheduled Visits",
              count: services.filter((s) => s.status === "Scheduled").length,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <CSTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search service category, vendor or project..."
          searchFields={[
            "serviceCategory",
            "serviceProvider",
            "project",
            "supervisorName",
          ]}
        />
      </div>

      {/* Register Service Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                Register Facility Service Contract
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterService} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Service Category
                </label>
                <select
                  className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(
                      e.target.value as AmenityServiceItem["serviceCategory"],
                    )
                  }
                >
                  <option value="Waste Management">Waste Management</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Gym & Fitness">Gym & Fitness</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Landscaping & Greenery">
                    Landscaping & Greenery
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Service Provider / Vendor
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka Clean Waste Solutions Ltd."
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Supervisor Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Md. Shafiqur Rahman"
                    value={formSupervisor}
                    onChange={(e) => setFormSupervisor(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Frequency
                  </label>
                  <select
                    className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formFrequency}
                    onChange={(e) =>
                      setFormFrequency(
                        e.target.value as AmenityServiceItem["frequency"],
                      )
                    }
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Monthly">Bi-Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Next Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Contract / Estimated Cost (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-input px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: brand }}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
