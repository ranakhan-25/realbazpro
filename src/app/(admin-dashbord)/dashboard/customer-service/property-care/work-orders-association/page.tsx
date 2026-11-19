"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building,
  CheckCircle2,
  DollarSign,
  Plus,
  Eye,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  AssociationRecord,
  AssociationStatsResult,
  getOwnersAssociations,
  getOwnersAssociationStats,
  createOwnersAssociation,
  updateOwnersAssociation,
  deleteOwnersAssociation,
} from "@/services/customerPropertyCareService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function WorkOrdersAssociationPage() {
  const { projectId, project } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState("all");
  const [associations, setAssociations] = useState<AssociationRecord[]>([]);
  const [stats, setStats] = useState<AssociationStatsResult>({
    totalAssociations: 0,
    handedOverCount: 0,
    developerManagingCount: 0,
    adHocCount: 0,
    avgServiceCharge: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssociation, setEditingAssociation] =
    useState<AssociationRecord | null>(null);

  // Form states
  const [associationName, setAssociationName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [totalFlats, setTotalFlats] = useState("20");
  const [handedOverCount, setHandedOverCount] = useState("15");
  const [serviceCharge, setServiceCharge] = useState("6500");
  const [bankAcc, setBankAcc] = useState("");
  const [governanceStatus, setGovernanceStatus] =
    useState<AssociationRecord["handoverStatus"]>("Developer Managing");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listRes, statsRes] = await Promise.all([
        getOwnersAssociations({
          project_id: projectId || undefined,
          tab: activeTab !== "all" ? activeTab : undefined,
          is_deleted: recordsTab === "deleted",
          limit: 100,
        }),
        getOwnersAssociationStats({ project_id: projectId || undefined }),
      ]);

      setAssociations(listRes?.items ?? []);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: unknown) {
      console.error("Error loading associations:", err);
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to load owners associations",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (project?.name) {
      setProjectName(project.name);
    }
  }, [project]);

  const resetForm = () => {
    setEditingAssociation(null);
    setAssociationName("");
    setPresidentName("");
    setContactPhone("");
    setTotalFlats("20");
    setHandedOverCount("15");
    setServiceCharge("6500");
    setBankAcc("");
    setGovernanceStatus("Developer Managing");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (a: AssociationRecord) => {
    setEditingAssociation(a);
    setAssociationName(a.associationName || a.association_name || "");
    setProjectName(a.project || a.project_name || project?.name || "");
    setPresidentName(a.presidentName || a.president_name || "");
    setContactPhone(a.contactPhone || a.contact_phone || "");
    setTotalFlats(String(a.totalFlats ?? a.total_flats ?? 20));
    setHandedOverCount(String(a.handedOverCount ?? a.handed_over_count ?? 15));
    setServiceCharge(
      String(
        a.monthlyServiceChargePerFlat ??
        a.monthly_service_charge_per_flat ??
        6500,
      ),
    );
    setBankAcc(a.associationBankAcc || a.association_bank_acc || "");
    setGovernanceStatus(
      (a.handoverStatus ||
        a.handover_status ||
        "Developer Managing") as AssociationRecord["handoverStatus"],
    );
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!associationName || !presidentName) {
      toast.error("Please fill in association name and president name");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingAssociation) {
        const itemUuid = editingAssociation.uuid || editingAssociation.id;
        await updateOwnersAssociation(itemUuid, {
          association_name: associationName,
          project_name: projectName || project?.name || "Assigned Project",
          president_name: presidentName,
          contact_phone: contactPhone,
          total_flats: Number(totalFlats) || 0,
          handed_over_count: Number(handedOverCount) || 0,
          monthly_service_charge_per_flat: Number(serviceCharge) || 0,
          association_bank_acc: bankAcc,
          handover_status: governanceStatus,
        });
        toast.success(`Owners Association ${associationName} updated`);
      } else {
        const created = await createOwnersAssociation({
          association_name: associationName,
          project_name: projectName || project?.name || "Assigned Project",
          project_id: projectId || undefined,
          president_name: presidentName,
          contact_phone: contactPhone,
          total_flats: Number(totalFlats) || 0,
          handed_over_count: Number(handedOverCount) || 0,
          monthly_service_charge_per_flat: Number(serviceCharge) || 0,
          association_bank_acc: bankAcc,
          handover_status: governanceStatus,
        });
        toast.success(
          `Owners Association ${created.associationCode || created.association_code || created.id} registered`,
        );
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      console.error("Error saving association:", err);
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to save owners association",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (a: AssociationRecord) => {
    const itemUuid = a.uuid || a.id;
    if (
      !confirm(
        `Are you sure you want to remove ${a.associationName || a.association_name}?`,
      )
    )
      return;
    try {
      await deleteOwnersAssociation(itemUuid);
      toast.success("Owners Association record removed");
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
        "Failed to remove owners association",
      );
    }
  };

  const filtered = associations.filter((a) => {
    if (activeTab === "handedover")
      return (
        (a.handoverStatus || a.handover_status) === "Formally Handed Over to OA"
      );
    if (activeTab === "developer")
      return (a.handoverStatus || a.handover_status) === "Developer Managing";
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
          <span className="font-semibold text-[#111827] block text-xs">
            {a.associationName || a.association_name}
          </span>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {a.project || a.project_name || project?.name || "Assigned Project"}
          </div>
        </div>
      ),
    },
    {
      key: "presidentName",
      header: "PRESIDENT / SOCIETY LEADERSHIP",
      minWidth: "220px",
      render: (a) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {a.presidentName || a.president_name}
          </div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {a.contactPhone || a.contact_phone || "Contact not provided"}
          </div>
        </div>
      ),
    },
    {
      key: "handedOverCount",
      header: "OCCUPANCY RATIO",
      minWidth: "170px",
      render: (a) => {
        const handed = a.handedOverCount ?? a.handed_over_count ?? 0;
        const total = a.totalFlats ?? a.total_flats ?? 0;
        const ratio = total > 0 ? Math.round((handed / total) * 100) : 0;
        return (
          <div>
            <span className="text-xs font-semibold text-[#111827] tabular-nums">
              {handed} / {total} Flats
            </span>
            <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
              {ratio}% possession completed
            </div>
          </div>
        );
      },
    },
    {
      key: "monthlyServiceChargePerFlat",
      header: "SERVICE CHARGE (TK/MO)",
      minWidth: "200px",
      render: (a) => {
        const charge =
          a.monthlyServiceChargePerFlat ??
          a.monthly_service_charge_per_flat ??
          0;
        return (
          <div>
            <span className="font-semibold text-[#039855] text-xs tabular-nums">
              ৳ {charge.toLocaleString()} / flat
            </span>
            <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">
              {a.associationBankAcc ||
                a.association_bank_acc ||
                "Account pending"}
            </div>
          </div>
        );
      },
    },
    {
      key: "handoverStatus",
      header: "GOVERNANCE STATUS",
      minWidth: "210px",
      render: (a) => {
        const status = a.handoverStatus || a.handover_status;
        return (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status === "Formally Handed Over to OA"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : status === "Ad-hoc Committee"
                  ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                  : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "120px",
      render: (a) =>
        recordsTab === "deleted" ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() =>
                toast.info(
                  `Association: ${a.association_name || "Association"} - Project: ${a.project_name || "Project"} - Units: ${a.total_flats || a.totalFlats || 0}`,
                )
              }
              title="View Association Details"
              aria-label="View Association Details"
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] transition shadow-xs"
            >
              <Eye className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Soft Deleted
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openEditModal(a)}
              title="Edit Association Details"
              aria-label="Edit Association Details"
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] hover:bg-[#ECE8FF] transition shadow-xs"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(a)}
              title="Remove Association Record"
              aria-label="Remove Association Record"
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
        breadcrumbs={[
          { label: "Warranty & Property Care" },
          { label: "Owners Association" },
        ]}
        primaryAction={{
          label: "Register Society",
          onClick: openCreateModal,
          icon: Plus,
        }}
      />

      {/* Records Mode Switcher (Active vs Soft Deleted) */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setRecordsTab("active")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition ${recordsTab === "active"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            Active Societies
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">
              {stats.totalAssociations}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRecordsTab("deleted")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition ${recordsTab === "deleted"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-500 hover:text-rose-600"
              }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Deleted Records
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${recordsTab === "deleted"
                  ? "bg-rose-700 text-white"
                  : "bg-slate-200 text-slate-600"
                }`}
            >
              {stats.deleted_count ?? 0}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Residential Societies"
          value={stats.totalAssociations.toString()}
          subtext="Managed under ERP transition"
          icon={Building}
        />
        <CSStatCard
          title="Handed Over to OA"
          value={stats.handedOverCount.toString()}
          subtext="Elected committee managing"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
        <CSStatCard
          title="Avg Monthly Service Charge"
          value={`৳ ${stats.avgServiceCharge.toLocaleString()}`}
          subtext="Per apartment unit"
          icon={DollarSign}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Projects", count: stats.totalAssociations },
          {
            key: "handedover",
            label: "Handed Over to OA",
            count: stats.handedOverCount,
          },
          {
            key: "developer",
            label: "Developer Managing",
            count: stats.developerManagingCount,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search project, association name or president..."
        searchFields={[
          "project",
          "project_name",
          "associationName",
          "association_name",
          "presidentName",
          "president_name",
        ]}
        emptyTitle="No owners associations found"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingAssociation
            ? "Edit Flat Owners Association (OA)"
            : "Register Flat Owners Association (OA)"
        }
        subtitle={
          editingAssociation
            ? "Update society governance, leadership, and service charge"
            : "Form residential welfare association under Bangladesh Flat Owners Welfare Act"
        }
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
              onClick={handleCreateOrUpdate}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              )}
              {editingAssociation ? "Update Society" : "Register Society"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Association / Society Name *
            </label>
            <input
              type="text"
              required
              value={associationName}
              onChange={(e) => setAssociationName(e.target.value)}
              placeholder="e.g. Hena Heights Flat Owners Welfare Association"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={project?.name || "Project Name"}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Governance Status
              </label>
              <select
                value={governanceStatus}
                onChange={(e) =>
                  setGovernanceStatus(
                    e.target.value as AssociationRecord["handoverStatus"],
                  )
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Developer Managing">Developer Managing</option>
                <option value="Ad-hoc Committee">Ad-hoc Committee</option>
                <option value="Formally Handed Over to OA">
                  Formally Handed Over to OA
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                President / Leadership Name *
              </label>
              <input
                type="text"
                required
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+880 1711-xxxxxx"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Total Flats
              </label>
              <input
                type="number"
                value={totalFlats}
                onChange={(e) => setTotalFlats(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Handed Over
              </label>
              <input
                type="number"
                value={handedOverCount}
                onChange={(e) => setHandedOverCount(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Service Charge (Tk/mo)
              </label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Bank Account Info
            </label>
            <input
              type="text"
              value={bankAcc}
              onChange={(e) => setBankAcc(e.target.value)}
              placeholder="e.g. City Bank (Gulshan) A/C: 1102998811"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
