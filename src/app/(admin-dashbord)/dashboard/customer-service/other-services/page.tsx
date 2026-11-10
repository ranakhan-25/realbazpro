"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface AmenityServiceItem {
  id: string;
  project: string;
  serviceCategory: "Waste Management" | "Pest Control" | "Gym & Fitness" | "Swimming Pool" | "Landscaping & Greenery";
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

  const filteredData = INITIAL_SERVICES.filter((item) => {
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
            <span className="font-semibold text-foreground text-xs">{item.serviceCategory}</span>
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
          <span className="font-medium text-xs text-foreground">{item.serviceProvider}</span>
          <p className="text-[11px] text-muted-foreground">Supervisor: {item.supervisorName}</p>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency & Next Schedule",
      render: (item) => (
        <div>
          <span className="font-medium text-xs text-foreground">{item.frequency}</span>
          <p className="text-[11px] text-muted-foreground">Due: {item.nextScheduledDate}</p>
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
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
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
          onClick: () => toast.info("Amenity Service Registration will be available soon."),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Active Service Contracts"
          value="14"
          change="Across all properties"
          icon={Layers}
          color="emerald"
        />
        <CSStatCard
          title="Upcoming Cleanings"
          value="6"
          change="Next 7 days"
          icon={Sparkles}
          color="blue"
        />
        <CSStatCard
          title="Amenity Facilities"
          value="8"
          change="Pools, gyms & gardens"
          icon={Building}
          color="purple"
        />
        <CSStatCard
          title="Active Vendor Partners"
          value="5"
          change="Verified contractors"
          icon={Users}
          color="teal"
        />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Services", count: INITIAL_SERVICES.length },
            { key: "active", label: "Active Contracts", count: 3 },
            { key: "scheduled", label: "Scheduled Visits", count: 1 },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <CSTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search service category, vendor or project..."
          searchFields={["serviceCategory", "serviceProvider", "project", "supervisorName"]}
        />
      </div>
    </div>
  );
}
