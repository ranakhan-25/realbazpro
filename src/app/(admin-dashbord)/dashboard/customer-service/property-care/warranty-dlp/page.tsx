"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  WarrantyDlpClaim,
  DlpStatsResult,
  getDlpClaims,
  getDlpClaimStats,
  createDlpClaim,
  updateDlpClaim,
  deleteDlpClaim,
  advanceDlpClaimStage,
} from "@/services/customerPropertyCareService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function WarrantyDlpPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState("all");
  const [claims, setClaims] = useState<WarrantyDlpClaim[]>([]);
  const [stats, setStats] = useState<DlpStatsResult>({
    totalClaims: 0,
    inProgressClaims: 0,
    resolvedClaims: 0,
    criticalClaims: 0,
    deleted_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingClaim, setEditingClaim] = useState<WarrantyDlpClaim | null>(
    null,
  );
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] =
    useState<WarrantyDlpClaim["defectCategory"]>("Water Seepage");
  const [severity, setSeverity] =
    useState<WarrantyDlpClaim["severity"]>("Major");
  const [engineer, setEngineer] = useState("Engr. Monirul Islam");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listRes, statsRes] = await Promise.all([
        getDlpClaims({
          project_id: projectId || undefined,
          tab:
            recordsTab === "active" && activeTab !== "all"
              ? activeTab
              : undefined,
          is_deleted: recordsTab === "deleted",
          limit: 100,
        }),
        getDlpClaimStats({ project_id: projectId || undefined }),
      ]);

      setClaims(listRes?.items ?? []);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: unknown) {
      console.error("Error loading DLP claims:", err);
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to load DLP claims",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingClaim(null);
    setCustomer("");
    setUnit("");
    setCategory("Water Seepage");
    setSeverity("Major");
    setEngineer("Engr. Monirul Islam");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: WarrantyDlpClaim) => {
    setEditingClaim(item);
    setCustomer(item.customerName || item.customer_name || "");
    setUnit(item.unit || "");
    setCategory(
      (item.defectCategory ||
        item.defect_category ||
        "Water Seepage") as WarrantyDlpClaim["defectCategory"],
    );
    setSeverity((item.severity || "Major") as WarrantyDlpClaim["severity"]);
    setEngineer(
      item.assignedEngineer || item.assigned_engineer || "Engr. Monirul Islam",
    );
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !unit) {
      toast.error("Please fill in customer and unit");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClaim) {
        const claimUuid = editingClaim.uuid || editingClaim.id;
        await updateDlpClaim(claimUuid, {
          customer_name: customer,
          unit,
          defect_category: category,
          severity,
          assigned_engineer: engineer,
        });
        toast.success(
          `DLP Warranty Claim ${editingClaim.claimNo || editingClaim.claim_no} updated`,
        );
      } else {
        const created = await createDlpClaim({
          customer_name: customer,
          unit,
          project_id: projectId || undefined,
          project_name: project?.name,
          defect_category: category,
          severity,
          assigned_engineer: engineer,
        });
        toast.success(
          `DLP Warranty Claim ${created.claimNo || created.claim_no} registered under statutory warranty`,
        );
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      console.error("Error saving claim:", err);
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to save DLP claim",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: WarrantyDlpClaim) => {
    const claimUuid = item.uuid || item.id;
    if (
      !confirm(
        `Are you sure you want to remove claim ${item.claimNo || item.claim_no}?`,
      )
    )
      return;
    try {
      await deleteDlpClaim(claimUuid);
      toast.success(`Claim ${item.claimNo || item.claim_no} removed`);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to delete DLP claim",
      );
    }
  };

  const handleAdvance = async (item: WarrantyDlpClaim) => {
    const claimUuid = item.uuid || item.id;
    try {
      const updated = await advanceDlpClaimStage(claimUuid);
      toast.success(
        `Claim ${item.claimNo || item.claim_no} advanced to: ${updated.status}`,
      );
      loadData();
    } catch (err: unknown) {
      console.error("Error advancing claim stage:", err);
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to advance claim stage",
      );
    }
  };

  const filtered = claims.filter((c) => {
    if (activeTab === "active") return c.status !== "Resolved & Signed Off";
    if (activeTab === "resolved") return c.status === "Resolved & Signed Off";
    return true;
  });

  const columns: Column<WarrantyDlpClaim>[] = [
    {
      key: "claimNo",
      header: "CLAIM NO & UNIT",
      sortable: true,
      minWidth: "180px",
      render: (c) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">
            {c.claimNo || c.claim_no}
          </span>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {c.unit}
          </div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "PURCHASER & PROJECT",
      minWidth: "190px",
      render: (c) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {c.customerName || c.customer_name}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {c.project || c.project_name || project?.name || "Assigned Project"}
          </div>
        </div>
      ),
    },
    {
      key: "defectCategory",
      header: "DEFECT & SEVERITY",
      minWidth: "190px",
      render: (c) => (
        <div className="space-y-1">
          <span className="font-semibold text-[#111827] text-xs block">
            {c.defectCategory || c.defect_category}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${c.severity === "Critical Structural"
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
          <div className="text-xs font-semibold text-[#6D4AFF] tabular-nums">
            Expires: {c.dlpExpiryDate || c.dlp_expiry_date}
          </div>
          <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">
            Possession: {c.possessionDate || c.possession_date}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "RECTIFICATION STATUS",
      minWidth: "190px",
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.status === "Resolved & Signed Off"
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
      minWidth: "150px",
      render: (c) => {
        if (recordsTab === "deleted") {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    `Claim: ${c.claim_no || c.claimNo || "Claim"} - Unit ${c.unit || "Unit"} - Status: ${c.status}`,
                  )
                }
                title="View Claim Details"
                aria-label="View Claim Details"
                className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] transition cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                Soft Deleted
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            {c.status !== "Resolved & Signed Off" ? (
              <button
                type="button"
                onClick={() => handleAdvance(c)}
                title="Advance claim rectification stage"
                aria-label="Advance Claim Stage"
                className="h-7 px-2 rounded-md inline-flex items-center gap-1 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-[11px] font-semibold transition cursor-pointer"
              >
                <CheckCircle2 className="h-3 w-3" /> Advance
              </button>
            ) : (
              <span className="text-[11px] text-[#039855] font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Signed Off
              </span>
            )}
            <button
              type="button"
              onClick={() => openEditModal(c)}
              title="Edit Claim"
              aria-label="Edit Claim"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c)}
              title="Delete Claim"
              aria-label="Delete Claim"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Warranty & Statutory DLP Claims (২ বছরের নির্মাণ ত্রুটি ওয়ারেন্টি)"
        subtitle="Manage Defect Liability Period (DLP) obligations under Section 11(2)(c) of the Real Estate Act 2010."
        badge="Statutory Warranty"
        breadcrumbs={[
          { label: "Warranty & Property Care" },
          { label: "Warranty & DLP Claims" },
        ]}
        primaryAction={{
          label: "Log DLP Claim",
          onClick: openCreateModal,
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active DLP Warranty Claims"
          value={stats.totalClaims.toString()}
          subtext="Under builder warranty repair"
          icon={ShieldCheck}
        />
        <CSStatCard
          title="Critical Structural Repairs"
          value={stats.criticalClaims.toString()}
          subtext="High-priority engineer dispatch"
          icon={AlertTriangle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="Resolved Warranty Cases"
          value={stats.resolvedClaims.toString()}
          subtext="Client satisfaction sign-off"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Records Mode Switcher: Active Records vs Deleted Records */}
      <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl w-fit border border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setRecordsTab("active")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${recordsTab === "active"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
            }`}
        >
          <span>Active Records</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${recordsTab === "active"
                ? "bg-[#EEF2FF] text-[#6D4AFF]"
                : "bg-[#E5E7EB] text-[#4B5563]"
              }`}
          >
            {stats.totalClaims}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRecordsTab("deleted")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${recordsTab === "deleted"
              ? "bg-white text-[#DC2626] shadow-xs"
              : "text-[#6B7280] hover:text-[#DC2626]"
            }`}
        >
          <span>Deleted Records</span>
          {(stats.deleted_count ?? 0) > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${recordsTab === "deleted"
                  ? "bg-[#FEF2F2] text-[#DC2626]"
                  : "bg-[#E5E7EB] text-[#4B5563]"
                }`}
            >
              {stats.deleted_count}
            </span>
          )}
        </button>
      </div>

      {recordsTab === "active" && (
        <CSFilterTabs
          tabs={[
            { key: "all", label: "All DLP Claims", count: stats.totalClaims },
            {
              key: "active",
              label: "Active & In Progress",
              count: stats.inProgressClaims,
              badgeVariant: "warning",
            },
            {
              key: "resolved",
              label: "Resolved & Closed",
              count: stats.resolvedClaims,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      <CSTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search claim no, customer name, unit or defect category..."
        searchFields={[
          "claimNo",
          "claim_no",
          "customerName",
          "customer_name",
          "unit",
          "defectCategory",
          "defect_category",
          "assignedEngineer",
          "assigned_engineer",
        ]}
        emptyTitle="No DLP warranty claims logged"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingClaim
            ? `Edit DLP Claim: ${editingClaim.claimNo || editingClaim.claim_no}`
            : "Log Statutory DLP Warranty Claim"
        }
        subtitle="Builder Defect Liability Period (Real Estate Act 2010)"
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
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              )}
              {editingClaim ? "Update Claim" : "Register Claim"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Customer Name *
              </label>
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
              <label className="block font-semibold text-[#374151] mb-1">
                Unit Number *
              </label>
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
              <label className="block font-semibold text-[#374151] mb-1">
                Defect Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as WarrantyDlpClaim["defectCategory"],
                  )
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Water Seepage">Water Seepage / Dampness</option>
                <option value="Structural Crack">Structural Crack</option>
                <option value="Plumbing & Drainage">
                  Drainage & Plumbing Defect
                </option>
                <option value="Doors & Windows">
                  Aluminium Window Leakage
                </option>
                <option value="Tiles & Finishing">
                  Hollow Tile / Debonding
                </option>
                <option value="Electrical & Wiring">Electrical & Wiring</option>
                <option value="Other">Other Defect</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as WarrantyDlpClaim["severity"])
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Minor">Minor (Non-structural)</option>
                <option value="Major">Major (Inhabitant Inconvenience)</option>
                <option value="Critical Structural">
                  Critical Structural / Safety
                </option>
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
