"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck2,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Eye,
  Trash2,
  Loader2,
  Edit,
  Check,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  getMutationTrackings,
  getMutationTrackingStats,
  createMutationTracking,
  updateMutationTracking,
  deleteMutationTracking,
  MutationTrackingItem,
  MutationTrackingStats,
  MutationStage,
} from "@/services/customerDocumentsService";

export default function MutationKhatianTrackingPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState("all");
  const [mutations, setMutations] = useState<MutationTrackingItem[]>([]);
  const [stats, setStats] = useState<MutationTrackingStats>({
    active_cases: 0,
    hearings_scheduled: 0,
    khatian_approved: 0,
    kanungo_inquiry: 0,
    all_count: 0,
    hearing_count: 0,
    inquiry_count: 0,
    approved_count: 0,
    deleted_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMut, setEditingMut] = useState<MutationTrackingItem | null>(
    null,
  );

  // Form states (Create)
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [projectName, setProjectName] = useState("");
  const [appNo, setAppNo] = useState("");
  const [office, setOffice] = useState(
    "AC (Land) Office, Gulshan Circle, Dhaka",
  );
  const [stage, setStage] = useState<MutationStage>("Kanungo/Surveyor Inquiry");
  const [hearingDate, setHearingDate] = useState("");
  const [dcrNumber, setDcrNumber] = useState("");
  const [dcrFee, setDcrFee] = useState(1170);
  const [dcrPaid, setDcrPaid] = useState(false);
  const [khatianNo, setKhatianNo] = useState("");
  const [remarks, setRemarks] = useState("");

  // Form states (Edit)
  const [editCustomer, setEditCustomer] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editAppNo, setEditAppNo] = useState("");
  const [editOffice, setEditOffice] = useState("");
  const [editStage, setEditStage] = useState<MutationStage>(
    "Kanungo/Surveyor Inquiry",
  );
  const [editHearingDate, setEditHearingDate] = useState("");
  const [editDcrNumber, setEditDcrNumber] = useState("");
  const [editDcrFee, setEditDcrFee] = useState(1170);
  const [editDcrPaid, setEditDcrPaid] = useState(false);
  const [editKhatianNo, setEditKhatianNo] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isDeleted = recordsTab === "deleted";
      const [statsRes, listRes] = await Promise.all([
        getMutationTrackingStats(projectId || undefined),
        getMutationTrackings({
          project_id: projectId || undefined,
          tab: !isDeleted && activeTab !== "all" ? activeTab : undefined,
          is_deleted: isDeleted,
          limit: 100,
        }),
      ]);
      setStats(statsRes);
      setMutations(listRes.items);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
        "Failed to load e-Mutation tracking records",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (m: MutationTrackingItem) => {
    setEditingMut(m);
    setEditCustomer(m.customer_name || "");
    setEditUnit(m.unit_name || "");
    setEditAppNo(m.mutation_app_no || "");
    setEditOffice(
      m.ac_land_office || "AC (Land) Office, Gulshan Circle, Dhaka",
    );
    setEditStage(
      (m.current_stage as MutationStage) || "Kanungo/Surveyor Inquiry",
    );
    setEditHearingDate(m.hearing_date ? m.hearing_date.slice(0, 10) : "");
    setEditDcrNumber(m.dcr_number || "");
    setEditDcrFee(Number(m.dcr_fee_amount) || 1170);
    setEditDcrPaid(Boolean(m.dcr_paid));
    setEditKhatianNo(m.khatian_number || "");
    setEditRemarks(m.remarks || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMut) return;
    if (!editCustomer.trim() || !editAppNo.trim()) {
      toast.error("Please fill in customer name and e-Mutation Application No");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMutationTracking(editingMut.uuid, {
        customer_name: editCustomer.trim(),
        unit_name: editUnit.trim() || undefined,
        mutation_app_no: editAppNo.trim(),
        ac_land_office: editOffice.trim(),
        current_stage: editStage,
        hearing_date: editHearingDate || undefined,
        dcr_number: editDcrNumber.trim() || undefined,
        dcr_fee_amount: Number(editDcrFee) || 1170,
        dcr_paid: editDcrPaid,
        khatian_number: editKhatianNo.trim() || undefined,
        remarks: editRemarks.trim() || undefined,
      });

      toast.success(`e-Mutation case ${editAppNo} updated successfully`);
      setIsEditOpen(false);
      setEditingMut(null);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update e-Mutation case",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !appNo.trim()) {
      toast.error("Please fill in customer name and e-Mutation Application No");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutationTracking({
        customer_name: customer.trim(),
        unit_name: unit.trim() || undefined,
        project_name: projectName.trim() || undefined,
        project_id: projectId || undefined,
        mutation_app_no: appNo.trim(),
        ac_land_office: office.trim(),
        current_stage: stage,
        hearing_date: hearingDate || undefined,
        dcr_number: dcrNumber.trim() || undefined,
        dcr_fee_amount: Number(dcrFee) || 1170,
        dcr_paid: dcrPaid,
        khatian_number: khatianNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      toast.success(`e-Mutation application ${appNo} registered for tracking`);
      setIsModalOpen(false);
      setCustomer("");
      setUnit("");
      setProjectName("");
      setAppNo("");
      setHearingDate("");
      setDcrNumber("");
      setDcrPaid(false);
      setKhatianNo("");
      setRemarks("");
      loadData();
    } catch (err: unknown) {
      toast.error(
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to register e-Mutation case",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveKhatian = async (record: MutationTrackingItem) => {
    const khatian = prompt(
      "Enter Approved Khatian Number:",
      record.khatian_number || "Khatian No. ",
    );
    if (khatian === null) return;

    try {
      await updateMutationTracking(record.uuid, {
        current_stage: "Khatian Approved",
        khatian_number: khatian.trim() || "Khatian Approved",
        dcr_paid: true,
      });
      toast.success(
        `Khatian approved and recorded for ${record.customer_name}`,
      );
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to update record",
      );
    }
  };

  const handleDelete = async (record: MutationTrackingItem) => {
    if (
      !confirm(
        `Are you sure you want to delete ${record.mut_code} (${record.mutation_app_no})?`,
      )
    )
      return;
    try {
      await deleteMutationTracking(record.uuid);
      toast.success(`e-Mutation record ${record.mut_code} deleted`);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to delete record",
      );
    }
  };

  const columns: Column<MutationTrackingItem>[] = [
    {
      key: "mutation_app_no",
      header: "E-MUTATION APP NO & OFFICE",
      sortable: true,
      minWidth: "240px",
      render: (m) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] tabular-nums text-xs">
            {m.mutation_app_no}
          </span>
          <div className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
            {m.ac_land_office}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "CUSTOMER & UNIT",
      minWidth: "190px",
      render: (m) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {m.customer_name}
          </div>
          <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">
            {m.unit_name || "Unit Allotment"}
          </div>
        </div>
      ),
    },
    {
      key: "current_stage",
      header: "CURRENT STAGE IN LAND OFFICE",
      minWidth: "220px",
      render: (m) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.current_stage === "Khatian Approved"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : m.current_stage === "Hearing Scheduled"
                  ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                  : m.current_stage === "Rejected"
                    ? "bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]"
                    : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              }`}
          >
            {m.current_stage}
          </span>
          {m.hearing_date && (
            <div className="text-[11px] text-[#DC6803] font-semibold tabular-nums">
              Hearing Date: {m.hearing_date}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dcr_number",
      header: "DCR FEE & KHATIAN NO",
      minWidth: "200px",
      render: (m) => (
        <div className="space-y-1">
          {m.khatian_number ? (
            <span className="font-semibold text-[#039855] block text-xs">
              {m.khatian_number}
            </span>
          ) : (
            <span className="text-[11px] text-[#9CA3AF] italic">
              Khatian Pending
            </span>
          )}
          <span
            className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${m.dcr_paid
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
              }`}
          >
            {m.dcr_paid
              ? `DCR ৳ ${m.dcr_fee_amount} Paid`
              : `DCR ৳ ${m.dcr_fee_amount} Unpaid`}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "200px",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          {recordsTab === "deleted" ? (
            <>
              <a
                href="https://mutation.land.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Bangladesh Land Ministry e-Mutation Portal"
                className="h-8 px-2 rounded-lg inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] text-xs font-semibold transition shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Portal
              </a>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
                Soft Deleted
              </span>
            </>
          ) : (
            <>
              {m.current_stage !== "Khatian Approved" && (
                <button
                  type="button"
                  onClick={() => handleApproveKhatian(m)}
                  title="Record Approved Khatian"
                  aria-label="Record Approved Khatian"
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenEdit(m)}
                title="Edit e-Mutation Case"
                aria-label="Edit e-Mutation Case"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] hover:bg-[#E5E7EB] hover:text-[#111827] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
              >
                <Edit className="h-4 w-4" />
              </button>
              <a
                href="https://mutation.land.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Bangladesh Land Ministry e-Mutation Portal"
                className="h-8 px-2 rounded-lg inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] text-xs font-semibold transition shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Portal
              </a>
              <button
                type="button"
                onClick={() => handleDelete(m)}
                title="Delete Case"
                aria-label="Delete Case"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] hover:bg-[#FEE4E2] transition shadow-xs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="e-Mutation & Khatian Tracking (ই-নামজারি)"
        subtitle="Track Bangladesh Land Ministry e-Mutation application numbers, inquiry stages, hearing slots, DCR fees, and approved khatian numbers."
        badge="Land Records Service"
        breadcrumbs={[
          { label: "Documents & Land Records" },
          { label: "e-Mutation Tracking" },
        ]}
        primaryAction={{
          label: "Register e-Mutation Case",
          onClick: () => setIsModalOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active e-Mutation Cases"
          value={stats.active_cases.toString()}
          subtext="Under AC Land office processing"
          icon={FileCheck2}
        />
        <CSStatCard
          title="Hearings Scheduled"
          value={stats.hearings_scheduled.toString()}
          subtext="Customer appearance required"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Khatian Generated & Approved"
          value={stats.khatian_approved.toString()}
          subtext="Separated mutated ownership"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Active vs Deleted Records Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setRecordsTab("active")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${recordsTab === "active"
                ? "bg-[#6D4AFF] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <span>Active Records</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${recordsTab === "active"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
                }`}
            >
              {stats.all_count}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRecordsTab("deleted")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${recordsTab === "deleted"
                ? "bg-[#DC2626] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <span>Deleted Records</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${recordsTab === "deleted"
                  ? "bg-white/20 text-white"
                  : "bg-red-50 text-red-700"
                }`}
            >
              {stats.deleted_count || 0}
            </span>
          </button>
        </div>
      </div>

      {recordsTab === "active" && (
        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Cases", count: stats.all_count },
            {
              key: "hearing",
              label: "Hearing Scheduled",
              count: stats.hearing_count,
              badgeVariant: "warning",
            },
            {
              key: "inquiry",
              label: "Kanungo / Field Inquiry",
              count: stats.inquiry_count,
            },
            {
              key: "approved",
              label: "Khatian Approved & Completed",
              count: stats.approved_count,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D4AFF]" />
        </div>
      ) : (
        <CSTable
          data={mutations}
          columns={columns}
          searchPlaceholder="Search e-Mutation App No, customer name, unit or AC Land Office..."
          searchFields={[
            "mutation_app_no",
            "customer_name",
            "unit_name",
            "ac_land_office",
            "mut_code",
            "khatian_number",
          ]}
          emptyTitle="No e-Mutation cases found"
        />
      )}

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Register e-Mutation Application"
        subtitle="Record the official Land Ministry tracking number and assigned circle office"
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
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Application
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              e-Mutation Application No *
            </label>
            <input
              type="text"
              required
              value={appNo}
              onChange={(e) => setAppNo(e.target.value)}
              placeholder="e.g. MUT-2026-DH-XXXXX"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums font-semibold outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

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
                Unit Number
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Assistant Commissioner (Land) Office *
            </label>
            <input
              type="text"
              required
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="e.g. AC (Land) Office, Gulshan Circle, Dhaka"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Land Office Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as MutationStage)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Application Submitted">
                  Application Submitted
                </option>
                <option value="Kanungo/Surveyor Inquiry">
                  Kanungo/Surveyor Inquiry
                </option>
                <option value="Hearing Scheduled">Hearing Scheduled</option>
                <option value="DCR Payment Pending">DCR Payment Pending</option>
                <option value="Khatian Approved">Khatian Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                DCR Fee Amount (৳)
              </label>
              <input
                type="number"
                min="0"
                value={dcrFee}
                onChange={(e) => setDcrFee(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={dcrPaid}
                  onChange={(e) => setDcrPaid(e.target.checked)}
                  className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
                />
                DCR Fee Deposited to Land Ministry
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                DCR Number
              </label>
              <input
                type="text"
                value={dcrNumber}
                onChange={(e) => setDcrNumber(e.target.value)}
                placeholder="e.g. DCR-2026-77881"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Approved Khatian Number
              </label>
              <input
                type="text"
                value={khatianNo}
                onChange={(e) => setKhatianNo(e.target.value)}
                placeholder="e.g. Khatian No. 12904"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Land surveyor notes or hearing appearance guidelines..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>

      {/* Edit Mutation Modal */}
      <CSModal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit e-Mutation & Khatian Record"
        subtitle={
          editingMut
            ? `Modify case details for ${editingMut.mut_code}`
            : "Update details"
        }
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsEditOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveEdit}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Unit / Flat Code
              </label>
              <input
                type="text"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                e-Mutation Application No *
              </label>
              <input
                type="text"
                required
                value={editAppNo}
                onChange={(e) => setEditAppNo(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                value={editHearingDate}
                onChange={(e) => setEditHearingDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              AC (Land) Office *
            </label>
            <input
              type="text"
              required
              value={editOffice}
              onChange={(e) => setEditOffice(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Current Land Office Stage
            </label>
            <select
              value={editStage}
              onChange={(e) => setEditStage(e.target.value as MutationStage)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
            >
              <option value="Application Submitted">
                Application Submitted
              </option>
              <option value="Assistant Commissioner Review">
                Assistant Commissioner Review
              </option>
              <option value="Kanungo/Surveyor Inquiry">
                Kanungo/Surveyor Inquiry
              </option>
              <option value="Union Land Office Report">
                Union Land Office Report
              </option>
              <option value="Hearing Scheduled">Hearing Scheduled</option>
              <option value="DCR Fee Payment Pending">
                DCR Fee Payment Pending
              </option>
              <option value="Khatian Approved">Khatian Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                DCR Fee Amount (৳)
              </label>
              <input
                type="number"
                min="0"
                value={editDcrFee}
                onChange={(e) => setEditDcrFee(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={editDcrPaid}
                  onChange={(e) => setEditDcrPaid(e.target.checked)}
                  className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
                />
                DCR Fee Deposited to Land Ministry
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                DCR Number
              </label>
              <input
                type="text"
                value={editDcrNumber}
                onChange={(e) => setEditDcrNumber(e.target.value)}
                placeholder="e.g. DCR-2026-77881"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Approved Khatian Number
              </label>
              <input
                type="text"
                value={editKhatianNo}
                onChange={(e) => setEditKhatianNo(e.target.value)}
                placeholder="e.g. Khatian No. 12904"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder="Land surveyor notes or hearing appearance guidelines..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
