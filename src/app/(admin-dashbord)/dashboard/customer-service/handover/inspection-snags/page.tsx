"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Wrench,
  Building,
  Trash2,
  Edit,
  ArrowRight,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  SnagItem,
  SnagStats,
  getSnagList,
  getSnagStats,
  createSnagItem,
  advanceSnagStatus,
  updateSnagItem,
  deleteSnagItem,
} from "@/services/customerHandoverService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function InspectionSnagsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId } = useSelectedProject();

  const [activeTab, setActiveTab] = useState("all");
  const [snags, setSnags] = useState<SnagItem[]>([]);
  const [stats, setStats] = useState<SnagStats>({
    active_snags: 0,
    pending_contractor: 0,
    quality_signed_off: 0,
    critical_count: 0,
    all_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<SnagItem | null>(null);
  const [unit, setUnit] = useState("");
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState<string>("Minor");
  const [contractor, setContractor] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        getSnagList({
          project_id: projectId || undefined,
          tab: activeTab !== "all" ? activeTab : undefined,
        }),
        getSnagStats(projectId || undefined),
      ]);
      setSnags(listRes.items);
      setStats(statsRes);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load defect snags");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab]);

    useEffect(() => {
      loadData();
    }, [loadData]);

    const resetForm = () => {
      setEditingItem(null);
      setUnit("");
      setCustomer("");
      setLocation("");
      setDesc("");
      setSeverity("Minor");
      setContractor("");
      setTargetDate("");
      setRemarks("");
    };

    const openCreateModal = () => {
      resetForm();
      setIsModalOpen(true);
    };

    const openEditModal = (item: SnagItem) => {
      setEditingItem(item);
      setUnit(item.unit_name);
      setCustomer(item.customer_name);
      setLocation(item.defect_location);
      setDesc(item.description);
      setSeverity(item.severity);
      setContractor(item.assigned_contractor);
      setTargetDate(item.target_rectification_date || "");
      setRemarks(item.remarks || "");
      setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
        if (!unit.trim() || !desc.trim() || !location.trim()) {
          toast.error("Please fill in unit, location, and defect description");
          return;
        }

        setIsSubmitting(true);
        try {
          if (editingItem) {
            await updateSnagItem(editingItem.uuid, {
              unit_name: unit.trim(),
              customer_name: customer.trim() || "Verified Purchaser",
              defect_location: location.trim(),
              description: desc.trim(),
              severity,
              assigned_contractor: contractor.trim() || undefined,
              target_rectification_date: targetDate || undefined,
              remarks: remarks.trim() || undefined,
            });
            toast.success(`Defect snag ${editingItem.snag_code} updated`);
          } else {
            await createSnagItem({
              unit_name: unit.trim(),
              customer_name: customer.trim() || "Verified Purchaser",
              defect_location: location.trim(),
              description: desc.trim(),
              severity,
              assigned_contractor: contractor.trim() || "In-house Finishing Team",
              target_rectification_date: targetDate || undefined,
              project_id: projectId || undefined,
              remarks: remarks.trim() || undefined,
            });
            toast.success(`Snag item logged for ${unit}`);
          }
          setIsModalOpen(false);
          resetForm();
          loadData();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to save snag record");
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleAdvance = async (item: SnagItem) => {
        try {
          const updated = await advanceSnagStatus(item.uuid);
          toast.success(`Snag ${item.snag_code} advanced to: ${updated.status}`);
          loadData();
        } catch (err: any) {
          toast.error(err?.message || "Failed to advance snag status");
        }
      };

        const handleDelete = async (item: SnagItem) => {
          if (!confirm(`Are you sure you want to remove snag ${item.snag_code}?`)) return;
          try {
            await deleteSnagItem(item.uuid);
            toast.success(`Snag ${item.snag_code} removed`);
            loadData();
          } catch (err: any) {
            toast.error(err?.message || "Failed to delete snag");
          }
        };

        const columns: Column<SnagItem>[] = [
          {
            key: "snag_code",
            header: "SNAG ID & UNIT",
            sortable: true,
            minWidth: "160px",
            render: (s) => (
              <div>
                <span className="font-semibold text-[#111827] tabular-nums text-xs">{s.snag_code}</span>
                <div className="text-[11px] font-medium text-[#6D4AFF] mt-0.5">{s.unit_name}</div>
              </div>
            ),
          },
          {
            key: "description",
            header: "DEFECT DESCRIPTION & AREA",
            minWidth: "260px",
            render: (s) => (
              <div>
                <span className="font-semibold text-[#111827] block text-xs">{s.defect_location}</span>
                <p className="text-[#6B7280] text-[11px] line-clamp-1 mt-0.5">{s.description}</p>
              </div>
            ),
          },
          {
            key: "severity",
            header: "SEVERITY",
            minWidth: "120px",
            render: (s) => (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${s.severity === "Critical"
                    ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    : s.severity === "Major"
                      ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                      : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                  }`}
              >
                {s.severity}
              </span>
            ),
          },
          {
            key: "assigned_contractor",
            header: "CONTRACTOR & DEADLINE",
            minWidth: "200px",
            render: (s) => (
              <div>
                <div className="font-semibold text-[#111827] text-xs">{s.assigned_contractor}</div>
                <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
                  Target: {s.target_rectification_date || "Pending Assignment"}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            header: "RECTIFICATION STATUS",
            minWidth: "190px",
            render: (s) => (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.status === "Client Signed Off"
                    ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                    : s.status === "Verified by Site Engr"
                      ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                      : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                  }`}
              >
                {s.status}
              </span>
            ),
          },
          {
            key: "actions",
            header: "ACTIONS",
            align: "right",
            minWidth: "160px",
            render: (s) => (
                <div className="flex items-center justify-end gap-1.5">
                  {s.status !== "Client Signed Off" ? (
                    <button
                      type="button"
                      onClick={() => handleAdvance(s)}
                      title="Advance snag rectification status"
                      aria-label="Advance Status"
                      className="h-7 px-2 rounded-md inline-flex items-center gap-1 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-[11px] font-semibold transition"
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
                        onClick={() => openEditModal(s)}
                        title="Edit Snag Item"
                        aria-label="Edit Snag"
                        className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        title="Delete Snag Item"
                        aria-label="Delete Snag"
                        className="h-7 w-7 rounded-md inline-flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition"
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
                      title="Joint Inspections & Snagging (হ্যান্ডওভার-পূর্ব ত্রুটি)"
                      subtitle="Manage joint pre-handover walk-through defect lists, contractor assignments, and client rectification sign-offs."
                      badge="Quality Assurance"
                      breadcrumbs={[{ label: "Handover & Possession" }, { label: "Inspections & Snagging" }]}
                      primaryAction={{
                        label: "Log Snag Item",
                        onClick: openCreateModal,
                        icon: Plus,
                      }}
                    />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <CSStatCard
                          title="Active Snags Logged"
                          value={stats.active_snags.toString()}
                          subtext="Under quality rectification"
                          icon={Wrench}
                        />
                        <CSStatCard
                          title="Pending Contractor Fix"
                          value={stats.pending_contractor.toString()}
                          subtext="Assigned to finishing crews"
                          icon={Clock}
                          iconBg="bg-[#FFFAEB]"
                          iconColor="text-[#DC6803]"
                        />
                        <CSStatCard
                          title="Critical Severity"
                          value={stats.critical_count.toString()}
                          subtext="High urgency rectification"
                          icon={AlertTriangle}
                          iconBg="bg-[#FEF2F2]"
                          iconColor="text-[#DC2626]"
                        />
                        <CSStatCard
                          title="Quality Signed Off"
                          value={stats.quality_signed_off.toString()}
                          subtext="Accepted by client & site engineer"
                          icon={CheckCircle2}
                          iconBg="bg-[#ECFDF3]"
                          iconColor="text-[#039855]"
                        />
                      </div>

                      <CSFilterTabs
                        tabs={[
                          { key: "all", label: "All Snags", count: stats.all_count },
                          {
                            key: "pending",
                            label: "Pending Rectification",
                            count: stats.pending_contractor,
                            badgeVariant: "warning",
                          },
                          {
                            key: "resolved",
                            label: "Client Signed Off",
                            count: stats.quality_signed_off,
                          },
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                      />

                      <CSTable
                        data={snags}
                        columns={columns}
                        searchPlaceholder="Search snag ID, unit, location, contractor or description..."
                        searchFields={["snag_code", "unit_name", "defect_location", "assigned_contractor", "description"]}
                        emptyTitle={isLoading ? "Loading defect snags..." : "No snag items recorded"}
                      />

                      <CSModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title={editingItem ? `Edit Snag: ${editingItem.snag_code}` : "Log Pre-Handover Defect Snag"}
                        description="Record architectural, civil, tile or MEP defects identified during joint inspection walk-through."
                      >
                          <form onSubmit={handleSubmit} className="space-y-4">
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
                                  placeholder="e.g. C-9, Sheba Green"
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#111827] mb-1">
                                  Purchaser Full Name
                                </label>
                                <input
                                  type="text"
                                  value={customer}
                                  onChange={(e) => setCustomer(e.target.value)}
                                  placeholder="e.g. Barrister Shahed Chowdhury"
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#111827] mb-1">
                                  Defect Location / Area *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                  placeholder="e.g. Dining Room Floor / Master Bath"
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#111827] mb-1">
                                  Severity Level
                                </label>
                                <select
                                  value={severity}
                                  onChange={(e) => setSeverity(e.target.value)}
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                >
                                  <option value="Minor">Minor (Aesthetic / Touchup)</option>
                                  <option value="Major">Major (Plumbing / Electrical / Tile)</option>
                                  <option value="Critical">Critical (Structural / Waterproofing)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#111827] mb-1">
                                  Assigned Subcontractor / Crew
                                </label>
                                <input
                                  type="text"
                                  value={contractor}
                                  onChange={(e) => setContractor(e.target.value)}
                                  placeholder="e.g. Mirpur Ceramic Works / Apex Plumbing"
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#111827] mb-1">
                                  Target Rectification Date
                                </label>
                                <input
                                  type="date"
                                  value={targetDate}
                                  onChange={(e) => setTargetDate(e.target.value)}
                                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs focus:ring-2 focus:ring-[#6D4AFF] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#111827] mb-1">
                                Defect Description & Remedial Requirement *
                              </label>
                              <textarea
                                required
                                rows={3}
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                placeholder="Detailed description of defect identified during walk-through..."
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
                                {isSubmitting ? "Saving..." : editingItem ? "Update Snag" : "Log Snag Item"}
                              </button>
                            </div>
                          </form>
                      </CSModal>
                    </div>
                    );
}
