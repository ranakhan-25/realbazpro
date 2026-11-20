"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  AlertCircle,
  Plus,
  Eye,
  Trash2,
  Loader2,
  Check,
  Pencil,
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
  getRegistrationTrackings,
  getRegistrationTrackingStats,
  createRegistrationTracking,
  updateRegistrationTracking,
  deleteRegistrationTracking,
  RegistrationTrackingItem,
  RegistrationTrackingStats,
  RegistrationStatus,
  DeedDraftStatus,
} from "@/services/customerDocumentsService";

export default function RegistrationTrackingPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState("all");
  const [records, setRecords] = useState<RegistrationTrackingItem[]>([]);
  const [stats, setStats] = useState<RegistrationTrackingStats>({
    active_pipeline: 0,
    appointments_scheduled: 0,
    deeds_delivered: 0,
    all_count: 0,
    pending_count: 0,
    delivered_count: 0,
    deleted_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<RegistrationTrackingItem | null>(
    null,
  );

  // Form states (Create)
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [projectName, setProjectName] = useState("");
  const [office, setOffice] = useState("Sub-Registrar Office, Gulshan (Dhaka)");
  const [deedStatus, setDeedStatus] = useState<DeedDraftStatus>("Draft Ready");
  const [scheduledDate, setScheduledDate] = useState("");
  const [govtFees, setGovtFees] = useState<number>(0);
  const [feeCollected, setFeeCollected] = useState(false);
  const [stage, setStage] = useState<RegistrationStatus>("Documents Gathering");
  const [remarks, setRemarks] = useState("");

  // Form states (Edit)
  const [editCustomer, setEditCustomer] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editOffice, setEditOffice] = useState("");
  const [editDeedStatus, setEditDeedStatus] =
    useState<DeedDraftStatus>("Draft Ready");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editGovtFees, setEditGovtFees] = useState<number>(0);
  const [editFeeCollected, setEditFeeCollected] = useState(false);
  const [editDeedNo, setEditDeedNo] = useState("");
  const [editStage, setEditStage] = useState<RegistrationStatus>(
    "Documents Gathering",
  );
  const [editDeliveredDate, setEditDeliveredDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isDeleted = recordsTab === "deleted";
      const [statsRes, listRes] = await Promise.all([
        getRegistrationTrackingStats(projectId || undefined),
        getRegistrationTrackings({
          project_id: projectId || undefined,
          tab: !isDeleted && activeTab !== "all" ? activeTab : undefined,
          is_deleted: isDeleted,
          limit: 100,
        }),
      ]);
      setStats(statsRes);
      setRecords(listRes.items);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
        "Failed to load registration tracking records",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (r: RegistrationTrackingItem) => {
    setEditingReg(r);
    setEditCustomer(r.customer_name || "");
    setEditUnit(r.unit_name || "");
    setEditOffice(
      r.sub_registrar_office || "Sub-Registrar Office, Gulshan (Dhaka)",
    );
    setEditDeedStatus(
      (r.deed_draft_status as DeedDraftStatus) || "Draft Ready",
    );
    setEditScheduledDate(
      r.registration_date_scheduled
        ? r.registration_date_scheduled.slice(0, 10)
        : "",
    );
    setEditGovtFees(Number(r.total_govt_fees) || 0);
    setEditFeeCollected(Boolean(r.fee_receipt_collected));
    setEditDeedNo(r.registered_deed_no || "");
    setEditStage((r.status as RegistrationStatus) || "Documents Gathering");
    setEditDeliveredDate(r.delivered_date ? r.delivered_date.slice(0, 10) : "");
    setEditRemarks(r.remarks || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    if (!editCustomer.trim() || !editOffice.trim()) {
      toast.error("Please provide customer name and Sub-Registrar Office");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRegistrationTracking(editingReg.uuid, {
        customer_name: editCustomer.trim(),
        unit_name: editUnit.trim() || undefined,
        sub_registrar_office: editOffice.trim(),
        deed_draft_status: editDeedStatus,
        registration_date_scheduled: editScheduledDate || undefined,
        total_govt_fees: Number(editGovtFees) || 0,
        fee_receipt_collected: editFeeCollected,
        registered_deed_no: editDeedNo.trim() || undefined,
        status: editStage,
        delivered_date: editDeliveredDate || undefined,
        remarks: editRemarks.trim() || undefined,
      });

      toast.success(
        `Registration tracking for "${editCustomer}" updated successfully`,
      );
      setIsEditOpen(false);
      setEditingReg(null);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
        "Failed to update registration record",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !office.trim()) {
      toast.error("Please provide customer name and Sub-Registrar Office");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRegistrationTracking({
        customer_name: customer.trim(),
        unit_name: unit.trim() || undefined,
        project_name: projectName.trim() || undefined,
        project_id: projectId || undefined,
        sub_registrar_office: office.trim(),
        deed_draft_status: deedStatus,
        registration_date_scheduled: scheduledDate || undefined,
        total_govt_fees: Number(govtFees) || 0,
        fee_receipt_collected: feeCollected,
        status: stage,
        remarks: remarks.trim() || undefined,
      });

      toast.success(`Registration tracking created for ${customer}`);
      setIsCreateOpen(false);
      setCustomer("");
      setUnit("");
      setProjectName("");
      setScheduledDate("");
      setGovtFees(0);
      setFeeCollected(false);
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
        "Failed to create registration record",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelivered = async (record: RegistrationTrackingItem) => {
    const deedNo = prompt(
      "Enter Registered Deed Number:",
      record.registered_deed_no === "Pending Registry"
        ? ""
        : record.registered_deed_no || "",
    );
    if (deedNo === null) return;

    try {
      await updateRegistrationTracking(record.uuid, {
        status: "Original Deed Delivered",
        registered_deed_no: deedNo || "DEED-DELIVERED",
        delivered_date: new Date().toISOString().slice(0, 10),
      });
      toast.success(
        `Original Deed marked delivered for ${record.customer_name}`,
      );
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to update record",
      );
    }
  };

  const handleDelete = async (record: RegistrationTrackingItem) => {
    if (
      !confirm(
        `Are you sure you want to delete ${record.reg_code} (${record.customer_name})?`,
      )
    )
      return;
    try {
      await deleteRegistrationTracking(record.uuid);
      toast.success(`Registration record ${record.reg_code} deleted`);
      loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to delete record",
      );
    }
  };

  const columns: Column<RegistrationTrackingItem>[] = [
    {
      key: "reg_code",
      header: "RECORD ID & PROJECT",
      sortable: true,
      minWidth: "180px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">
            {r.reg_code}
          </span>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {r.project_name || "Assigned Project"}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "CUSTOMER & UNIT",
      minWidth: "190px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {r.customer_name}
          </div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {r.unit_name || "Unit Allotment"}
          </div>
        </div>
      ),
    },
    {
      key: "sub_registrar_office",
      header: "SUB-REGISTRAR OFFICE",
      minWidth: "240px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {r.sub_registrar_office}
          </div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            Registry Slot:{" "}
            {r.registration_date_scheduled || "Not Scheduled Yet"}
          </div>
        </div>
      ),
    },
    {
      key: "total_govt_fees",
      header: "GOVT REGISTRATION FEES",
      minWidth: "190px",
      render: (r) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#111827] tabular-nums">
            ৳ {r.total_govt_fees.toLocaleString()}
          </div>
          <span
            className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${r.fee_receipt_collected
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
              }`}
          >
            {r.fee_receipt_collected ? "Fee Deposited" : "Fee Unpaid"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "REGISTRATION STAGE",
      minWidth: "190px",
      render: (r) => (
        <div className="space-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.status === "Original Deed Delivered"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : r.status === "Appointment Booked"
                  ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                  : "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]"
              }`}
          >
            {r.status}
          </span>
          {r.registered_deed_no &&
            r.registered_deed_no !== "Pending Registry" && (
              <div className="text-[10px] tabular-nums text-[#6B7280] font-medium">
                {r.registered_deed_no}
              </div>
            )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "150px",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {recordsTab === "deleted" ? (
            <>
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    `Registry Details: ${r.customer_name} | Status: ${r.status} | Office: ${r.sub_registrar_office}`,
                  )
                }
                title="View Registration Record"
                aria-label="View Registration Record"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Eye className="h-4 w-4" />
              </button>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
                Soft Deleted
              </span>
            </>
          ) : (
            <>
              {r.status !== "Original Deed Delivered" && (
                <button
                  type="button"
                  onClick={() => handleMarkDelivered(r)}
                  title="Mark Original Deed Delivered"
                  aria-label="Mark Original Deed Delivered"
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenEdit(r)}
                title="Edit Registration Record"
                aria-label="Edit Registration Record"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] hover:bg-[#E5E7EB] hover:text-[#111827] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    `Registry Details: ${r.customer_name} | Status: ${r.status} | Office: ${r.sub_registrar_office}`,
                  )
                }
                title="View Registration Record"
                aria-label="View Registration Record"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(r)}
                title="Delete Record"
                aria-label="Delete Record"
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
        title="Sub-Registrar Registration Tracking"
        subtitle="Track deed drafting, Sub-Registrar appointments, government fee deposits, and delivery of registered original deeds."
        badge="Legal Department Coordination"
        breadcrumbs={[
          { label: "Documents & Land Records" },
          { label: "Registration Tracking" },
        ]}
        primaryAction={{
          label: "New Registration File",
          onClick: () => setIsCreateOpen(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Active Deeds in Pipeline"
          value={stats.active_pipeline.toString()}
          subtext="Under registry coordination"
          icon={FileCheck2}
        />
        <CSStatCard
          title="Appointments Scheduled"
          value={stats.appointments_scheduled.toString()}
          subtext="With Sub-Registrar Office"
          icon={Calendar}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Original Deeds Delivered"
          value={stats.deeds_delivered.toString()}
          subtext="Handed over to purchasers"
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
            {
              key: "all",
              label: "All Registration Files",
              count: stats.all_count,
            },
            {
              key: "pending",
              label: "In Progress / Scheduled",
              count: stats.pending_count,
              badgeVariant: "warning",
            },
            {
              key: "delivered",
              label: "Deed Delivered to Buyer",
              count: stats.delivered_count,
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
          data={records}
          columns={columns}
          searchPlaceholder="Search by customer name, unit, project or sub-registrar office..."
          searchFields={[
            "customer_name",
            "unit_name",
            "project_name",
            "sub_registrar_office",
            "reg_code",
            "registered_deed_no",
          ]}
          emptyTitle="No registration tracking files found"
        />
      )}

      {/* Create Registration Modal */}
      <CSModal
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title="Create Registration Tracking File"
        subtitle="Record Sub-Registrar details, fees, and scheduled execution appointment"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateOpen(false)}
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
              Save Registration File
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
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
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Hena Heights, Gulshan"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Sub-Registrar Office *
            </label>
            <input
              type="text"
              required
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="e.g. Sub-Registrar Office, Gulshan (Dhaka)"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Deed Drafting Status
              </label>
              <select
                value={deedStatus}
                onChange={(e) =>
                  setDeedStatus(e.target.value as DeedDraftStatus)
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Draft Ready">Draft Ready</option>
                <option value="Vetting Complete">Vetting Complete</option>
                <option value="Revision Requested">Revision Requested</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Scheduled Appointment
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Total Govt Fees (৳)
              </label>
              <input
                type="number"
                min="0"
                value={govtFees}
                onChange={(e) => setGovtFees(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={feeCollected}
                  onChange={(e) => setFeeCollected(e.target.checked)}
                  className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
                />
                Fee Receipt Collected & Deposited
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Workflow Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as RegistrationStatus)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
            >
              <option value="Documents Gathering">Documents Gathering</option>
              <option value="Drafting & Vetting">Drafting & Vetting</option>
              <option value="Appointment Booked">Appointment Booked</option>
              <option value="Registry Executed">Registry Executed</option>
              <option value="Original Deed Delivered">
                Original Deed Delivered
              </option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Lawyer notes or registrar counter instructions..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>

      {/* Edit Registration Modal */}
      <CSModal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit Registration Tracking Record"
        subtitle={
          editingReg
            ? `Modify record details for ${editingReg.reg_code}`
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
                Purchaser Name *
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
                Flat / Unit Number
              </label>
              <input
                type="text"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Sub-Registrar Office *
            </label>
            <input
              type="text"
              required
              value={editOffice}
              onChange={(e) => setEditOffice(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Deed Draft Status
              </label>
              <select
                value={editDeedStatus}
                onChange={(e) =>
                  setEditDeedStatus(e.target.value as DeedDraftStatus)
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Not Started">Not Started</option>
                <option value="Draft Ready">Draft Ready</option>
                <option value="Approved by Legal">Approved by Legal</option>
                <option value="Customer Vetted">Customer Vetted</option>
                <option value="Printed on Stamp">Printed on Stamp</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Registry Appointment Date
              </label>
              <input
                type="date"
                value={editScheduledDate}
                onChange={(e) => setEditScheduledDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Total Govt Fees (৳)
              </label>
              <input
                type="number"
                min="0"
                value={editGovtFees}
                onChange={(e) => setEditGovtFees(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={editFeeCollected}
                  onChange={(e) => setEditFeeCollected(e.target.checked)}
                  className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
                />
                Fee Receipt Collected & Deposited
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Registered Deed Number
              </label>
              <input
                type="text"
                value={editDeedNo}
                onChange={(e) => setEditDeedNo(e.target.value)}
                placeholder="e.g. Deed #12948/2026"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Workflow Stage
              </label>
              <select
                value={editStage}
                onChange={(e) =>
                  setEditStage(e.target.value as RegistrationStatus)
                }
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Documents Gathering">Documents Gathering</option>
                <option value="Drafting & Vetting">Drafting & Vetting</option>
                <option value="Appointment Booked">Appointment Booked</option>
                <option value="Registry Executed">Registry Executed</option>
                <option value="Original Deed Delivered">
                  Original Deed Delivered
                </option>
              </select>
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
              placeholder="Notes or update log..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
