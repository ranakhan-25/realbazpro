"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building,
  CheckCircle2,
  DollarSign,
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
  AssociationRecord,
  AssociationStatsResult,
  getOwnersAssociations,
  getOwnersAssociationStats,
  createOwnersAssociation,
} from "@/services/customerPropertyCareService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function WorkOrdersAssociationPage() {
  const { projectId, project } = useSelectedProject();

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

    // Form states
    const [associationName, setAssociationName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [presidentName, setPresidentName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [totalFlats, setTotalFlats] = useState("20");
    const [handedOverCount, setHandedOverCount] = useState("15");
    const [serviceCharge, setServiceCharge] = useState("6500");
    const [bankAcc, setBankAcc] = useState("");
    const [governanceStatus, setGovernanceStatus] = useState<AssociationRecord["handoverStatus"]>("Developer Managing");

    const loadData = useCallback(async () => {
      try {
        setIsLoading(true);
        const [listRes, statsRes] = await Promise.all([
          getOwnersAssociations({
            project_id: projectId || undefined,
            tab: activeTab !== "all" ? activeTab : undefined,
            limit: 100,
          }),
          getOwnersAssociationStats({ project_id: projectId || undefined }),
        ]);

        setAssociations(listRes?.items ?? []);
        if (statsRes) {
          setStats(statsRes);
        }
      } catch (err: any) {
        console.error("Error loading associations:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load owners associations");
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
      if (!associationName || !presidentName) {
        toast.error("Please fill in association name and president name");
        return;
      }

      try {
        setIsSubmitting(true);
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

        toast.success(`Owners Association ${created.associationCode || created.association_code || created.id} registered`);
        setIsModalOpen(false);
        setAssociationName("");
        setPresidentName("");
        setContactPhone("");
        setBankAcc("");
        loadData();
      } catch (err: any) {
        console.error("Error creating association:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to register owners association");
      } finally {
        setIsSubmitting(false);
      }
    };

    const filtered = associations.filter((a) => {
      if (activeTab === "handedover") return (a.handoverStatus || a.handover_status) === "Formally Handed Over to OA";
      if (activeTab === "developer") return (a.handoverStatus || a.handover_status) === "Developer Managing";
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
            <div className="font-semibold text-[#111827] text-xs">{a.presidentName || a.president_name}</div>
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
        const charge = a.monthlyServiceChargePerFlat ?? a.monthly_service_charge_per_flat ?? 0;
            return (
            <div>
              <span className="font-semibold text-[#039855] text-xs tabular-nums">
                ৳ {charge.toLocaleString()} / flat
              </span>
              <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">
                {a.associationBankAcc || a.association_bank_acc || "Account pending"}
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
            minWidth: "90px",
      render: (a) => (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => toast.info(`Viewing society details: ${a.associationName || a.association_name}`)}
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
                primaryAction={{
                  label: "Register Society",
                  onClick: () => setIsModalOpen(true),
                  icon: Plus,
                }}
              />

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
                searchFields={["project", "project_name", "associationName", "association_name", "presidentName", "president_name"]}
                emptyTitle="No owners associations found"
              />

              {/* Modal */}
              <CSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register Flat Owners Association (OA)"
                subtitle="Form residential welfare association under Bangladesh Flat Owners Welfare Act"
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
                      Register Society
                    </button>
                  </>
                }
              >
                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Association / Society Name *</label>
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
                      <label className="block font-semibold text-[#374151] mb-1">Project Name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={project?.name || "Project Name"}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Governance Status</label>
                      <select
                        value={governanceStatus}
                        onChange={(e) => setGovernanceStatus(e.target.value as any)}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
                      >
                        <option value="Developer Managing">Developer Managing</option>
                        <option value="Ad-hoc Committee">Ad-hoc Committee</option>
                        <option value="Formally Handed Over to OA">Formally Handed Over to OA</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">President / Leadership Name *</label>
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
                      <label className="block font-semibold text-[#374151] mb-1">Contact Phone</label>
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
                      <label className="block font-semibold text-[#374151] mb-1">Total Flats</label>
                      <input
                        type="number"
                        value={totalFlats}
                        onChange={(e) => setTotalFlats(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Handed Over</label>
                      <input
                        type="number"
                        value={handedOverCount}
                        onChange={(e) => setHandedOverCount(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#374151] mb-1">Service Charge (Tk/mo)</label>
                      <input
                        type="number"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Bank Account Info</label>
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
