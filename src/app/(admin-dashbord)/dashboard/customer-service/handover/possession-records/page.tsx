"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  FileCheck2,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building,
  Zap,
  Droplets,
  Flame,
  Plus,
  Edit,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  PossessionRecordItem,
  PossessionStats,
  getPossessionList,
  getPossessionStats,
  createPossessionRecord,
  updatePossessionRecord,
} from "@/services/customerHandoverService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function PossessionRecordsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [records, setRecords] = useState<PossessionRecordItem[]>([]);
  const [stats, setStats] = useState<PossessionStats>({
    certs_issued: 0,
    active_dlp: 0,
    keys_signed: 0,
    all_count: 0,
    deleted_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] =
    useState<PossessionRecordItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<PossessionRecordItem | null>(
    null,
  );
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [possessionDate, setPossessionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dlpExpiryDate, setDlpExpiryDate] = useState("");
  const [keysCount, setKeysCount] = useState(8);
  const [electricMeter, setElectricMeter] = useState("");
  const [gasMeter, setGasMeter] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [signed, setSigned] = useState(true);
  const [remarks, setRemarks] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        getPossessionList({
          project_id: projectId || undefined,
          is_deleted: recordsTab === "deleted",
        }),
        getPossessionStats(projectId || undefined),
      ]);
      setRecords(listRes.items);
      setStats(statsRes);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
        "Failed to load possession records",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, recordsTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingItem(null);
    setCustomer("");
    setUnit("");
    const today = new Date().toISOString().slice(0, 10);
    setPossessionDate(today);
    const dlp = new Date();
    dlp.setFullYear(dlp.getFullYear() + 2);
    setDlpExpiryDate(dlp.toISOString().slice(0, 10));
    setKeysCount(8);
    setElectricMeter("");
    setGasMeter("");
    setWaterMeter("");
    setSigned(true);
    setRemarks("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: PossessionRecordItem) => {
    setEditingItem(item);
    setCustomer(item.customer_name);
    setUnit(item.unit_name);
    setPossessionDate(item.possession_date);
    setDlpExpiryDate(item.dlp_expiry_date || "");
    setKeysCount(item.keys_delivered_count || 8);
    setElectricMeter(item.electric_meter_reading || "");
    setGasMeter(item.gas_meter_reading || "");
    setWaterMeter(item.water_meter_reading || "");
    setSigned(item.signed_by_customer);
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
      if (editingItem) {
        await updatePossessionRecord(editingItem.uuid, {
          customer_name: customer.trim(),
          unit_name: unit.trim(),
          possession_date: possessionDate,
          dlp_expiry_date: dlpExpiryDate || undefined,
          keys_delivered_count: Number(keysCount),
          electric_meter_reading: electricMeter.trim() || undefined,
          gas_meter_reading: gasMeter.trim() || undefined,
          water_meter_reading: waterMeter.trim() || undefined,
          signed_by_customer: signed,
          remarks: remarks.trim() || undefined,
        });
        toast.success(`Possession record for ${unit} updated`);
      } else {
        await createPossessionRecord({
          customer_name: customer.trim(),
          unit_name: unit.trim(),
          project_name: project?.name || undefined,
          project_id: projectId || undefined,
          possession_date: possessionDate,
          dlp_expiry_date: dlpExpiryDate || undefined,
          keys_delivered_count: Number(keysCount),
          electric_meter_reading: electricMeter.trim() || undefined,
          gas_meter_reading: gasMeter.trim() || undefined,
          water_meter_reading: waterMeter.trim() || undefined,
          signed_by_customer: signed,
          remarks: remarks.trim() || undefined,
        });
        toast.success(`Possession certificate issued for ${unit}`);
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
        "Failed to save possession record",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const columns: Column<PossessionRecordItem>[] = [
    {
      key: "cert_no",
      header: "POSSESSION CERTIFICATE & UNIT",
      sortable: true,
      minWidth: "240px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] tabular-nums text-xs">
            {r.cert_no}
          </span>
          <div className="text-[11px] font-medium text-[#111827] mt-0.5">
            {r.unit_name}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "PURCHASER & PROJECT",
      minWidth: "200px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {r.customer_name}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {r.project_name}
          </div>
        </div>
      ),
    },
    {
      key: "possession_date",
      header: "POSSESSION TAKEN",
      minWidth: "150px",
      render: (r) => (
        <span className="text-xs font-semibold text-[#111827] tabular-nums">
          {r.possession_date}
        </span>
      ),
    },
    {
      key: "dlp_expiry_date",
      header: "STATUTORY 2-YEAR DLP TIMER",
      minWidth: "220px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] text-xs tabular-nums">
            Valid till {r.dlp_expiry_date || "N/A"}
          </span>
          <div className="text-[10px] text-[#6B7280]">
            Real Estate Act 2010 Sec 11(2)(c)
          </div>
        </div>
      ),
    },
    {
      key: "keys_delivered_count",
      header: "KEY REGISTER",
      minWidth: "190px",
      render: (r) => (
        <span className="rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#374151] tabular-nums">
          {r.key_register_no} ({r.keys_delivered_count} Keys)
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      align: "right",
      minWidth: "160px",
      render: (r) => {
        if (recordsTab === "deleted") {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRecord(r)}
                title="View Possession Certificate"
                aria-label="View Certificate"
                className="h-7 px-2 rounded-md inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] text-xs font-semibold transition cursor-pointer"
              >
                <Printer className="h-3 w-3" /> Certificate
              </button>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                Soft Deleted
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedRecord(r)}
              title="View & Print Possession Certificate"
              aria-label="View Certificate"
              className="h-7 px-2 rounded-md inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="h-3 w-3" /> Certificate
            </button>
            <button
              type="button"
              onClick={() => openEditModal(r)}
              title="Edit Possession Record"
              aria-label="Edit Record"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Possession & Handover Records (হস্তান্তরপত্র ও চাবি রেজিস্টার)"
        subtitle="Permanent digital archives of possession certificates, key handover registers, utility meter transfers and DLP timers."
        badge="Asset Handover Archive"
        breadcrumbs={[
          { label: "Handover & Possession" },
          { label: "Possession Records" },
        ]}
        primaryAction={{
          label: "Issue Possession Certificate",
          onClick: openCreateModal,
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Possession Records"
          value={stats.certs_issued.toString()}
          subtext="Signed & executed certificates"
          icon={KeyRound}
        />
        <CSStatCard
          title="Active DLP Warranties"
          value={stats.active_dlp.toString()}
          subtext="Covered under 2-year statutory warranty"
          icon={ShieldCheck}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Keys Registry Signed"
          value={stats.keys_signed.toString()}
          subtext="Acknowledged with utility transfer"
          icon={FileCheck2}
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
            {stats.certs_issued}
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

      <CSTable
        data={records}
        columns={columns}
        searchPlaceholder="Search certificate number, purchaser, project or unit..."
        searchFields={[
          "cert_no",
          "customer_name",
          "project_name",
          "unit_name",
          "key_register_no",
        ]}
        emptyTitle={
          isLoading
            ? "Loading possession records..."
            : "No possession records found"
        }
      />

      {/* CREATE / EDIT MODAL */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `Edit Possession: ${editingItem.cert_no}`
            : "Issue New Possession Certificate"
        }
        description="Formal certificate generation for key handover, utility meters handover, and 2-year DLP activation."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Purchaser Full Name *
              </label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Dr. Nazmul Huda"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Unit Designation *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. B-4, Eastern Lakeview"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Possession Date *
              </label>
              <input
                type="date"
                required
                value={possessionDate}
                onChange={(e) => setPossessionDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                DLP Expiry (2-Year Statutory)
              </label>
              <input
                type="date"
                value={dlpExpiryDate}
                onChange={(e) => setDlpExpiryDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Keys Delivered Count
              </label>
              <input
                type="number"
                min="1"
                value={keysCount}
                onChange={(e) => setKeysCount(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-[#F2F4F7] rounded-lg p-3 bg-[#FAFAFC] space-y-3">
            <span className="text-[11px] font-bold text-[#344054] uppercase tracking-wider block">
              Utility Meter Readings at Handover
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">
                  Electricity Meter / Card
                </label>
                <input
                  type="text"
                  value={electricMeter}
                  onChange={(e) => setElectricMeter(e.target.value)}
                  placeholder="e.g. 14,208 kWh (DESCO)"
                  className="w-full h-8 rounded border border-[#D0D5DD] bg-white px-2.5 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">
                  Gas Connection / System
                </label>
                <input
                  type="text"
                  value={gasMeter}
                  onChange={(e) => setGasMeter(e.target.value)}
                  placeholder="e.g. Reticulated LPG Active"
                  className="w-full h-8 rounded border border-[#D0D5DD] bg-white px-2.5 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">
                  Water Sub-Meter Reading
                </label>
                <input
                  type="text"
                  value={waterMeter}
                  onChange={(e) => setWaterMeter(e.target.value)}
                  placeholder="e.g. 00,124 m³"
                  className="w-full h-8 rounded border border-[#D0D5DD] bg-white px-2.5 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
              <input
                type="checkbox"
                checked={signed}
                onChange={(e) => setSigned(e.target.checked)}
                className="rounded border-[#D1D5DB] text-[#6D4AFF] focus:ring-[#6D4AFF] h-4 w-4"
              />
              Certificate Signed & Keys Formally Acknowledged by Customer
            </label>
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
                  ? "Update Certificate"
                  : "Issue Certificate"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* VIEW & PRINT CERTIFICATE MODAL */}
      <CSModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Official Possession & Key Handover Certificate"
        description="Formal legal certificate issued under Section 11 of Bangladesh Real Estate Development & Management Act 2010."
      >
        {selectedRecord && (
          <div className="space-y-6 pt-2">
            <div className="border border-[#E5E7EB] rounded-xl p-5 bg-white shadow-xs space-y-4">
              <div className="flex justify-between items-start border-b border-[#F2F4F7] pb-3">
                <div>
                  <h4 className="text-base font-bold text-[#111827]">
                    CERTIFICATE OF POSSESSION
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Official Handover Deed & Warranties Registration
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#6D4AFF] tabular-nums">
                    {selectedRecord.cert_no}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    Date: {selectedRecord.possession_date}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Allotment Holder / Purchaser:
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {selectedRecord.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Project & Unit Specification:
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {selectedRecord.unit_name} ({selectedRecord.project_name})
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[#F9FAFB] p-3 text-xs space-y-2 border border-[#EAECF0]">
                <div className="font-semibold text-[#344054] text-[11px] uppercase tracking-wider">
                  Handover Confirmation & Meter Transfer
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#F79009]" />
                    <span className="text-[#475467]">
                      {selectedRecord.electric_meter_reading}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-[#DC2626]" />
                    <span className="text-[#475467]">
                      {selectedRecord.gas_meter_reading}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span className="text-[#475467]">
                      {selectedRecord.water_meter_reading}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[#F4F1FF] p-3 text-xs border border-[#DDD6FE] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#6D4AFF]">
                    2-Year Statutory DLP Warranty Protection
                  </div>
                  <div className="text-[11px] text-[#5538EE]">
                    Defect Liability Period active until:{" "}
                    {selectedRecord.dlp_expiry_date ||
                      "2 Years Post-Possession"}
                  </div>
                </div>
                <ShieldCheck className="h-6 w-6 text-[#6D4AFF]" />
              </div>

              <div className="text-[11px] text-[#6B7280] leading-relaxed pt-2">
                Keys Handover Register:{" "}
                <strong className="text-[#111827]">
                  {selectedRecord.key_register_no}
                </strong>{" "}
                (Total {selectedRecord.keys_delivered_count} physical
                door/deadbolt keys delivered). Customer hereby acknowledges
                peaceful and complete physical possession.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print Certificate
              </button>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}
