"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  Plus,
  ArrowRight,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  HandoverScheduleItem,
  HandoverScheduleStats,
  getHandoverScheduleList,
  getHandoverScheduleStats,
  createHandoverSchedule,
  updateHandoverSchedule,
  deleteHandoverSchedule,
} from "@/services/customerHandoverService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function HandoverSchedulePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, projects } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState("all");
  const [handovers, setHandovers] = useState<HandoverScheduleItem[]>([]);
  const [stats, setStats] = useState<HandoverScheduleStats>({
    scheduled_count: 0,
    ready_count: 0,
    snags_count: 0,
    completed_count: 0,
    all_count: 0,
    deleted_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<HandoverScheduleItem | null>(
    null,
  );
  const [modalProjectId, setModalProjectId] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [readiness, setReadiness] = useState(90);
  const [jointInspection, setJointInspection] = useState(false);
  const [status, setStatus] = useState("Scheduled");
  const [remarks, setRemarks] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeProjId =
        projectId && projectId !== "all" ? projectId : undefined;
      const [listRes, statsRes] = await Promise.all([
        getHandoverScheduleList({
          project_id: activeProjId,
          tab:
            recordsTab === "active" && activeTab !== "all"
              ? activeTab
              : undefined,
          is_deleted: recordsTab === "deleted" ? true : undefined,
        }),
        getHandoverScheduleStats(activeProjId),
      ]);
      setHandovers(listRes.items);
      setStats(statsRes);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to load handover schedule",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingItem(null);
    setModalProjectId(projectId && projectId !== "all" ? projectId : "");
    setCustomer("");
    setUnit("");
    setTargetDate("");
    setReadiness(90);
    setJointInspection(false);
    setStatus("Scheduled");
    setRemarks("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalProjectId(
      projectId && projectId !== "all"
        ? projectId
        : projects[0]?.id
          ? String(projects[0].id)
          : "",
    );
    setIsModalOpen(true);
  };

  const openEditModal = (item: HandoverScheduleItem) => {
    setEditingItem(item);
    setModalProjectId(
      item.project_id || (projectId && projectId !== "all" ? projectId : ""),
    );
    setCustomer(item.customer_name);
    setUnit(item.unit_name);
    setTargetDate(item.target_handover_date || "");
    setReadiness(item.readiness_percentage || 0);
    setJointInspection(item.joint_inspection_done);
    setStatus(item.handover_status);
    setRemarks(item.remarks || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !unit.trim()) {
      toast.error("Please provide both purchaser name and unit designation");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProj =
        projects.find(
          (p) =>
            String(p.id) === modalProjectId ||
            String(p.uuid) === modalProjectId,
        ) || project;

      const activeProjId =
        modalProjectId ||
        (projectId && projectId !== "all" ? projectId : undefined);
      const activeProjName =
        selectedProj?.name || (activeProjId ? undefined : "General");

      if (editingItem) {
        await updateHandoverSchedule(editingItem.uuid, {
          customer_name: customer.trim(),
          unit_name: unit.trim(),
          project_id: activeProjId,
          target_handover_date: targetDate || undefined,
          readiness_percentage: Number(readiness),
          joint_inspection_done: jointInspection,
          handover_status: status,
          remarks: remarks.trim() || undefined,
        });
        toast.success(`Handover record for ${unit} updated successfully`);
      } else {
        await createHandoverSchedule({
          customer_name: customer.trim(),
          unit_name: unit.trim(),
          project_name: activeProjName,
          project_id: activeProjId,
          target_handover_date: targetDate || undefined,
          readiness_percentage: Number(readiness),
          joint_inspection_done: jointInspection,
          handover_status: status,
          remarks: remarks.trim() || undefined,
        });
        toast.success(`Handover schedule created for ${unit}`);
      }
      setIsModalOpen(false);
      resetForm();
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
          "Failed to save handover schedule",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: HandoverScheduleItem) => {
    if (
      !confirm(
        `Are you sure you want to remove handover record ${item.handover_code} (${item.unit_name})?`,
      )
    )
      return;
    try {
      await deleteHandoverSchedule(item.uuid);
      toast.success(`Handover record ${item.handover_code} removed`);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to delete handover schedule",
      );
    }
  };

  const handleQuickAdvance = async (item: HandoverScheduleItem) => {
    let nextSt = "Ready for Key Delivery";
    if (item.handover_status === "Scheduled") nextSt = "Ready for Snagging";
    else if (item.handover_status === "Ready for Snagging")
      nextSt = "Snag Rectification";
    else if (item.handover_status === "Snag Rectification")
      nextSt = "Ready for Key Delivery";
    else if (item.handover_status === "Ready for Key Delivery")
      nextSt = "Possession Taken";

    try {
      await updateHandoverSchedule(item.uuid, {
        handover_status: nextSt,
        readiness_percentage:
          nextSt === "Ready for Key Delivery" || nextSt === "Possession Taken"
            ? 100
            : item.readiness_percentage,
      });
      toast.success(`Unit ${item.unit_name} status updated to "${nextSt}"`);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to advance handover status",
      );
    }
  };

  const columns: Column<HandoverScheduleItem>[] = [
    {
      key: "handover_code",
      header: "HANDOVER ID & PROJECT",
      sortable: true,
      minWidth: "180px",
      render: (h) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">
            {h.handover_code}
          </span>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {h.project_name}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "PURCHASER & ALLOTMENT",
      minWidth: "200px",
      render: (h) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {h.customer_name}
          </div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {h.unit_name}
          </div>
        </div>
      ),
    },
    {
      key: "readiness_percentage",
      header: "CIVIL & MEP READINESS",
      sortable: true,
      minWidth: "170px",
      render: (h) => (
        <div className="space-y-1.5 w-36">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-[#6B7280]">Readiness</span>
            <span
              className={`tabular-nums ${
                h.readiness_percentage >= 95
                  ? "text-[#039855]"
                  : "text-[#DC6803]"
              }`}
            >
              {h.readiness_percentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                h.readiness_percentage >= 95 ? "bg-[#039855]" : "bg-[#F79009]"
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, h.readiness_percentage))}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "target_handover_date",
      header: "TARGET POSSESSION DATE",
      minWidth: "180px",
      render: (h) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827] tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />{" "}
          {h.target_handover_date || "Pending Schedule"}
        </div>
      ),
    },
    {
      key: "snags_identified",
      header: "SNAGS RECTIFIED",
      minWidth: "160px",
      render: (h) => (
        <div>
          <span className="text-xs font-semibold text-[#111827] tabular-nums">
            {h.snags_resolved} / {h.snags_identified} Snags
          </span>
          {h.snags_identified > h.snags_resolved ? (
            <div className="text-[10px] text-[#DC6803] font-medium mt-0.5">
              Rectification in progress
            </div>
          ) : (
            <div className="text-[10px] text-[#039855] font-semibold mt-0.5">
              {h.snags_identified === 0 ? "No snags recorded" : "100% Cleared"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "handover_status",
      header: "STATUS",
      minWidth: "180px",
      render: (h) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            h.handover_status === "Possession Taken" ||
            h.handover_status === "Handed Over"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : h.handover_status === "Ready for Key Delivery"
                ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
          }`}
        >
          {h.handover_status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      align: "right",
      minWidth: "130px",
      render: (h) => {
        if (recordsTab === "deleted") {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    `Handover Schedule: ${h.customer_name || "Customer"} - Unit ${h.unit_name || "Unit"} - Status: ${h.handover_status}`,
                  )
                }
                title="View Handover Details"
                aria-label="View Handover Details"
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
            {h.handover_status !== "Possession Taken" && (
              <button
                type="button"
                onClick={() => handleQuickAdvance(h)}
                title="Advance handover status"
                aria-label="Advance Status"
                className="h-7 px-2 rounded-md inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] text-[11px] font-semibold transition cursor-pointer"
              >
                Advance <ArrowRight className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => openEditModal(h)}
              title="Edit Handover Record"
              aria-label="Edit Handover Record"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(h)}
              title="Delete Handover Record"
              aria-label="Delete Handover Record"
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
        title="Handover & Possession Schedule"
        subtitle="Manage project completion timelines, joint client inspections, snag clearances and formal possession dates."
        badge="Possession Management"
        breadcrumbs={[
          { label: "Handover & Possession" },
          { label: "Handover Schedule" },
        ]}
        primaryAction={{
          label: "Schedule Handover",
          onClick: openCreateModal,
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <CSStatCard
          title="Scheduled Handovers"
          value={stats.scheduled_count.toString()}
          subtext="Under active transition pipeline"
          icon={KeyRound}
        />
        <CSStatCard
          title="Ready for Key Delivery"
          value={stats.ready_count.toString()}
          subtext="100% snag rectification cleared"
          icon={CheckCircle2}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Snagging Underway"
          value={stats.snags_count.toString()}
          subtext="Engineering fixes in progress"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Possession Completed"
          value={stats.completed_count.toString()}
          subtext="Possession certificates executed"
          icon={Building}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Records Mode Switcher: Active Records vs Deleted Records */}
      <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl w-fit border border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setRecordsTab("active")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            recordsTab === "active"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <span>Active Records</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
              recordsTab === "active"
                ? "bg-[#EEF2FF] text-[#6D4AFF]"
                : "bg-[#E5E7EB] text-[#4B5563]"
            }`}
          >
            {stats.all_count}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRecordsTab("deleted")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            recordsTab === "deleted"
              ? "bg-white text-[#DC2626] shadow-xs"
              : "text-[#6B7280] hover:text-[#DC2626]"
          }`}
        >
          <span>Deleted Records</span>
          {(stats.deleted_count ?? 0) > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                recordsTab === "deleted"
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
            {
              key: "all",
              label: "All Scheduled Flats",
              count: stats.all_count,
            },
            {
              key: "ready",
              label: "Ready for Key Delivery",
              count: stats.ready_count,
            },
            {
              key: "snags",
              label: "Snag Rectification Active",
              count: stats.snags_count,
              badgeVariant: "warning",
            },
            {
              key: "completed",
              label: "Possession Completed",
              count: stats.completed_count,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      <CSTable
        data={handovers}
        columns={columns}
        searchPlaceholder="Search handover ID, customer name, project or unit..."
        searchFields={[
          "handover_code",
          "customer_name",
          "project_name",
          "unit_name",
        ]}
        emptyTitle={
          isLoading
            ? "Loading handover schedules..."
            : "No handover schedules found"
        }
      />

      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `Edit Handover: ${editingItem.handover_code}`
            : "Schedule New Unit Handover"
        }
        description="Register a sold allotment into the official Handover & Defect Inspection workflow."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Associated Project
              </label>
              <select
                value={modalProjectId}
                onChange={(e) => setModalProjectId(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              >
                <option value="">-- All / General Project --</option>
                {projects.map((p) => (
                  <option key={p.id || p.uuid} value={p.id || p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Purchaser Full Name *
              </label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Mohammad Rafiqul Islam"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Unit Designation *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Target Possession Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Civil & Finishing Readiness ({readiness}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={readiness}
                onChange={(e) => setReadiness(Number(e.target.value))}
                className="w-full mt-2 accent-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Handover Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Ready for Snagging">Ready for Snagging</option>
                <option value="Snag Rectification">Snag Rectification</option>
                <option value="Ready for Key Delivery">
                  Ready for Key Delivery
                </option>
                <option value="Possession Taken">Possession Taken</option>
                <option value="DLP Active">DLP Active</option>
                <option value="Handed Over">Handed Over</option>
              </select>
            </div>
          </div>

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
              <input
                type="checkbox"
                checked={jointInspection}
                onChange={(e) => setJointInspection(e.target.checked)}
                className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
              />
              Joint Inspection / Walkthrough Complete
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Remarks & Coordination Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Client requested evening inspection; master bedroom key handover scheduled."
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#F2F4F7]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-[#6D4AFF] text-white text-xs font-semibold hover:bg-[#5B3EE0] disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingItem
                  ? "Update Schedule"
                  : "Schedule Handover"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
