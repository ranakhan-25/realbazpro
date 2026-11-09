"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building,
  Search,
  Eye,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  XCircle,
  FileText,
  User,
  MapPin,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Hash,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import {
  getChangeRequests,
  getChangeRequestStats,
  getChangeRequestDropdownMeta,
  getChangeRequestByUuid,
  createChangeRequest,
  updateChangeRequest,
  advanceChangeRequest,
  updateChangeRequestStatus,
  deleteChangeRequest,
  ChangeRequestListItem,
  ChangeRequestStats,
  ChangeRequestDropdownMeta,
  ChangeRequestType,
  ChangeRequestStatus,
  CreateChangeRequestPayload,
  UpdateChangeRequestPayload,
} from "@/services/customerChangeRequestsService";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { formatApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const WORKFLOW_STEPS: ChangeRequestStatus[] = [
  "Draft",
  "Legal Verification",
  "HOD Approval",
  "Accounts Clearance",
  "Completed",
];

const NEXT_WORKFLOW_MAP: Record<string, ChangeRequestStatus | null> = {
  Draft: "Legal Verification",
  "Legal Verification": "HOD Approval",
  "HOD Approval": "Accounts Clearance",
  "Accounts Clearance": "Completed",
  Completed: null,
  Rejected: null,
};

export default function ChangeRequestsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  // Tab & Record Mode States
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Data States
  const [requests, setRequests] = useState<ChangeRequestListItem[]>([]);
  const [stats, setStats] = useState<ChangeRequestStats>({
    active_requests: 0,
    completed_transfers: 0,
    transfer_fees_collected: 0,
    transfer_fees_collected_formatted: "৳ 0.00",
    all_count: 0,
    pending_count: 0,
    completed_count: 0,
    deleted_count: 0,
  });
  const [dropdownMeta, setDropdownMeta] = useState<ChangeRequestDropdownMeta>({
    request_types: [
      "Ownership Transfer",
      "Resale",
      "Cancellation & Refund",
      "Unit Swap",
    ],
    statuses: [
      "Draft",
      "Legal Verification",
      "HOD Approval",
      "Accounts Clearance",
      "Completed",
      "Rejected",
    ],
    workflow_pipeline: [
      "Draft",
      "Legal Verification",
      "HOD Approval",
      "Accounts Clearance",
      "Completed",
    ],
    tab_filters: ["all", "pending", "completed", "deleted"],
  });

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchReqIdRef = useRef(0);

  // Modals & Drawers States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] =
    useState<ChangeRequestListItem | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<ChangeRequestListItem | null>(null);

  // Form States
  const [formRequestType, setFormRequestType] =
    useState<ChangeRequestType>("Ownership Transfer");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formTransferFee, setFormTransferFee] = useState("100000");
  const [formNewBuyerName, setFormNewBuyerName] = useState("");
  const [formNewBuyerNid, setFormNewBuyerNid] = useState("");
  const [formNewBuyerPhone, setFormNewBuyerPhone] = useState("");
  const [formAppliedDate, setFormAppliedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action Form States
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 350ms Debounced Server Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Dropdown Metadata from API
  const loadDropdownMeta = useCallback(async () => {
    try {
      const meta = await getChangeRequestDropdownMeta();
      setDropdownMeta(meta);
    } catch (err) {
      console.warn("Failed to load change request dropdown meta:", err);
    }
  }, []);

  // Load KPI Statistics from API
  const loadOverviewStats = useCallback(async () => {
    try {
      const statsRes = await getChangeRequestStats(projectId || undefined);
      setStats(statsRes);
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      console.error("Change request stats error:", msg);
    }
}, [projectId]);

// Load Paginated Requests List from API
const loadRequestsList = useCallback(
  async (
    searchQuery?: string,
    tabFilter?: string,
    mode?: "active" | "deleted",
    typeFilter?: string,
  ) => {
    const currentReqId = ++searchReqIdRef.current;
    setIsTableLoading(true);

    try {
      const isDeleted = (mode ?? recordsTab) === "deleted";
      const currentTab = isDeleted ? "deleted" : (tabFilter ?? activeTab);
      const currentSearch =
        searchQuery !== undefined ? searchQuery : debouncedSearch;
      const currentType =
        typeFilter !== undefined ? typeFilter : selectedType;

      const res = await getChangeRequests({
        search: currentSearch || undefined,
        tab: currentTab,
        request_type: currentType !== "all" ? currentType : undefined,
        is_deleted: isDeleted,
        project_id: projectId || undefined,
        limit: 100,
      });

      // Discard stale responses if a newer request was dispatched
      if (currentReqId !== searchReqIdRef.current) return;

      setRequests(res.items || []);
      setLoadError(null);
    } catch (err: unknown) {
      if (currentReqId !== searchReqIdRef.current) return;
      const msg = formatApiErrorMessage(err);
      setLoadError(msg);
      console.error("Failed to load change requests:", msg);
    } finally {
      if (currentReqId === searchReqIdRef.current) {
        setIsTableLoading(false);
        setIsLoading(false);
      }
    }
  },
  [activeTab, debouncedSearch, recordsTab, selectedType, projectId],
);

// Manual Refresh Handler
const handleRefresh = useCallback(async () => {
  setIsRefreshing(true);
  try {
    await Promise.all([
      loadOverviewStats(),
      loadRequestsList(debouncedSearch, activeTab, recordsTab, selectedType),
    ]);
    toast.success("Change requests updated");
  } catch {
    toast.error("Failed to refresh records");
  } finally {
    setIsRefreshing(false);
  }
}, [
  activeTab,
  debouncedSearch,
  loadOverviewStats,
  loadRequestsList,
  recordsTab,
  selectedType,
]);

// Initial Load
useEffect(() => {
  loadDropdownMeta();
  loadOverviewStats();
}, [loadDropdownMeta, loadOverviewStats]);

// Trigger list load when filters, search, or selected project change
useEffect(() => {
  loadRequestsList(debouncedSearch, activeTab, recordsTab, selectedType);
}, [activeTab, debouncedSearch, loadRequestsList, recordsTab, selectedType, projectId]);

// Open Create Modal
const handleOpenCreateModal = () => {
  setFormRequestType(dropdownMeta.request_types[0] || "Ownership Transfer");
  setFormCustomerName("");
  setFormUnit("");
  setFormProject("");
  setFormReason("");
  setFormTransferFee("100000");
  setFormNewBuyerName("");
  setFormNewBuyerNid("");
  setFormNewBuyerPhone("");
  setFormAppliedDate(new Date().toISOString().split("T")[0]);
  setIsCreateModalOpen(true);
};

// Submit Create Change Request
const handleCreateSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formCustomerName.trim() || !formUnit.trim()) {
    toast.error("Please enter both customer name and unit number");
    return;
  }

  setIsSubmitting(true);
  try {
    const payload: CreateChangeRequestPayload = {
      request_type: formRequestType,
      customer_name: formCustomerName.trim(),
      unit: formUnit.trim(),
      project: formProject.trim() || project?.name || undefined,
      project_id: projectId || undefined,
      reason: formReason.trim() || undefined,
      transfer_fee:
        formRequestType !== "Cancellation & Refund"
          ? Number(formTransferFee) || 0
          : 0,
      new_buyer_name:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerName.trim() || undefined
          : undefined,
      new_buyer_nid:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerNid.trim() || undefined
          : undefined,
      new_buyer_phone:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerPhone.trim() || undefined
          : undefined,
      applied_date: formAppliedDate || undefined,
      status: "Legal Verification",
    };

    const created = await createChangeRequest(payload);
    toast.success(
      `Change request ${created.request_code || created.id} logged for legal verification`,
    );
    setIsCreateModalOpen(false);
    await Promise.all([loadOverviewStats(), loadRequestsList()]);
  } catch (err: unknown) {
    toast.error(formatApiErrorMessage(err));
  } finally {
    setIsSubmitting(false);
  }
};

// Open View Details Drawer
const handleViewDetails = async (item: ChangeRequestListItem) => {
  setSelectedItem(item);
  setIsDetailDrawerOpen(true);
  try {
    const full = await getChangeRequestByUuid(item.uuid);
    setSelectedItem(full);
  } catch {
    // Graceful fallback to table item
  }
};

// Open Edit Modal
const handleOpenEditModal = (item: ChangeRequestListItem) => {
  setSelectedItem(item);
  setFormRequestType(item.request_type);
  setFormCustomerName(item.customer_name);
  setFormUnit(item.unit);
  setFormProject(item.project || "");
  setFormReason(item.reason || "");
  setFormTransferFee(String(item.transfer_fee || 0));
  setFormNewBuyerName(item.new_buyer_name || "");
  setFormNewBuyerNid(item.new_buyer_nid || "");
  setFormNewBuyerPhone(item.new_buyer_phone || "");
  setFormAppliedDate(item.applied_date || "");
  setIsEditModalOpen(true);
};

// Submit Edit Change Request
const handleEditSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedItem) return;
  if (!formCustomerName.trim() || !formUnit.trim()) {
    toast.error("Please enter both customer name and unit number");
    return;
  }

  setIsSubmitting(true);
  try {
    const payload: UpdateChangeRequestPayload = {
      request_type: formRequestType,
      customer_name: formCustomerName.trim(),
      unit: formUnit.trim(),
      project: formProject.trim() || undefined,
      reason: formReason.trim() || undefined,
      transfer_fee:
        formRequestType !== "Cancellation & Refund"
          ? Number(formTransferFee) || 0
          : 0,
      new_buyer_name:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerName.trim() || undefined
          : undefined,
      new_buyer_nid:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerNid.trim() || undefined
          : undefined,
      new_buyer_phone:
        formRequestType !== "Cancellation & Refund"
          ? formNewBuyerPhone.trim() || undefined
          : undefined,
      applied_date: formAppliedDate || undefined,
    };

    const updated = await updateChangeRequest(selectedItem.uuid, payload);
    toast.success(
      `Change request ${updated.request_code || updated.id} updated successfully`,
    );
    setIsEditModalOpen(false);
    setSelectedItem(updated);
    await Promise.all([loadOverviewStats(), loadRequestsList()]);
  } catch (err: unknown) {
    toast.error(formatApiErrorMessage(err));
  } finally {
    setIsSubmitting(false);
  }
};

// Open Advance Stage Prompt
const handleOpenAdvanceModal = (item: ChangeRequestListItem) => {
  setSelectedItem(item);
  setAdvanceNotes("");
  setIsAdvanceModalOpen(true);
};

// Execute Stage Advance
const handleAdvanceSubmit = async () => {
  if (!selectedItem) return;
  setIsActionLoading(true);
  try {
    const res = await advanceChangeRequest(selectedItem.uuid, {
      notes: advanceNotes.trim() || undefined,
    });
    toast.success(res.message || "Stage advanced successfully");
    setIsAdvanceModalOpen(false);
    if (selectedItem.uuid === res.data?.uuid) {
      setSelectedItem(res.data);
    }
    await Promise.all([loadOverviewStats(), loadRequestsList()]);
  } catch (err: unknown) {
    toast.error(formatApiErrorMessage(err));
  } finally {
    setIsActionLoading(false);
  }
};

// Open Reject Prompt
const handleOpenRejectModal = (item: ChangeRequestListItem) => {
  setSelectedItem(item);
  setRejectRemarks("");
  setIsRejectModalOpen(true);
};

// Execute Rejection
const handleRejectSubmit = async () => {
  if (!selectedItem) return;
  if (!rejectRemarks.trim()) {
    toast.error("Please provide remarks for rejecting this change request");
    return;
  }
  setIsActionLoading(true);
  try {
    const res = await updateChangeRequestStatus(selectedItem.uuid, {
      status: "Rejected",
      remarks: rejectRemarks.trim(),
    });
    toast.success(res.message || "Request status updated to Rejected");
    setIsRejectModalOpen(false);
    if (selectedItem.uuid === res.data?.uuid) {
      setSelectedItem(res.data);
    }
    await Promise.all([loadOverviewStats(), loadRequestsList()]);
  } catch (err: unknown) {
    toast.error(formatApiErrorMessage(err));
  } finally {
    setIsActionLoading(false);
  }
};

// Open Delete Confirmation
const handleOpenDeleteModal = (item: ChangeRequestListItem) => {
  setItemToDelete(item);
  setIsDeleteModalOpen(true);
};

// Execute Soft Delete
const handleDeleteSubmit = async () => {
  if (!itemToDelete) return;
  setIsActionLoading(true);
  try {
    await deleteChangeRequest(itemToDelete.uuid);
    toast.success(
      `Change request ${itemToDelete.request_code || itemToDelete.id} soft-deleted successfully`,
    );
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    if (selectedItem?.uuid === itemToDelete.uuid) {
      setIsDetailDrawerOpen(false);
    }
    await Promise.all([loadOverviewStats(), loadRequestsList()]);
  } catch (err: unknown) {
    toast.error(formatApiErrorMessage(err));
  } finally {
    setIsActionLoading(false);
  }
};

// Table Columns Definition
const columns: Column<ChangeRequestListItem>[] = [
  {
    key: "id",
    header: "REQUEST ID & DATE",
    sortable: true,
    minWidth: "180px",
    render: (r) => (
      <div>
        <span className="font-semibold text-[#111827] tabular-nums text-xs">
          {r.request_code || r.id}
        </span>
        <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
          {r.applied_date}
        </div>
      </div>
    ),
  },
  {
    key: "request_type",
    header: "TYPE & UNIT",
    minWidth: "190px",
    render: (r) => (
      <div>
        <span className="font-semibold text-[#111827] text-xs">
          {r.request_type}
        </span>
        <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
          {r.unit}
        </div>
      </div>
    ),
  },
  {
    key: "customer_name",
    header: "EXISTING CUSTOMER",
    minWidth: "200px",
    render: (r) => (
      <div>
        <div className="font-semibold text-[#111827] text-xs">
          {r.customer_name}
        </div>
        <div className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
          {r.reason || "Official application submitted"}
        </div>
      </div>
    ),
  },
  {
    key: "new_buyer_name",
    header: "TRANSFEREE / NEW BUYER",
    minWidth: "200px",
    render: (r) => (
      <div>
        {r.new_buyer_name ? (
          <>
            <div className="font-semibold text-[#111827] text-xs">
              {r.new_buyer_name}
            </div>
            {r.new_buyer_nid ? (
              <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
                NID: {r.new_buyer_nid}
              </div>
            ) : r.new_buyer_phone ? (
              <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
                {r.new_buyer_phone}
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-[#9CA3AF] italic text-xs">N/A</span>
        )}
      </div>
    ),
  },
  {
    key: "transfer_fee",
    header: "TRANSFER FEE",
    minWidth: "140px",
    render: (r) => (
      <span className="font-semibold text-[#111827] tabular-nums text-xs">
        ৳ {Number(r.transfer_fee || 0).toLocaleString()}
      </span>
    ),
  },
  {
    key: "status",
    header: "WORKFLOW STATUS",
    minWidth: "160px",
    render: (r) => {
      let badgeClass = "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
      if (r.status === "Completed") {
        badgeClass = "bg-[#ECFDF3] text-[#039855] border-[#A6F4C5]";
      } else if (r.status === "Rejected") {
        badgeClass = "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
      }

      return (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badgeClass}`}
        >
          {r.status}
        </span>
      );
    },
  },
  {
    key: "actions",
    header: "ACTION",
    align: "right",
    minWidth: "180px",
    render: (r) => (
      <div className="flex items-center justify-end gap-1.5">
        {/* View Details Action */}
        <button
          type="button"
          onClick={() => handleViewDetails(r)}
          title="View Application Details"
          aria-label="View Application Details"
          className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition shadow-xs cursor-pointer"
        >
          <Eye className="h-4 w-4" />
        </button>

        {recordsTab === "active" ? (
          <>
            {/* Edit Action (if not completed) */}
            {r.status !== "Completed" && r.status !== "Rejected" && (
              <button
                type="button"
                onClick={() => handleOpenEditModal(r)}
                title="Edit Change Request"
                aria-label="Edit Change Request"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] transition shadow-xs cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Advance Action */}
            {r.status !== "Completed" && r.status !== "Rejected" ? (
              <button
                type="button"
                onClick={() => handleOpenAdvanceModal(r)}
                title="Advance to next approval stage"
                aria-label="Advance Approval Stage"
                className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:text-[#027A48] text-xs font-semibold transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#039855]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Advance
              </button>
            ) : r.status === "Completed" ? (
              <span className="text-xs text-[#039855] font-semibold inline-flex items-center gap-1 px-1.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Endorsed
              </span>
            ) : (
              <span className="text-xs text-[#B42318] font-semibold inline-flex items-center gap-1 px-1.5 py-1">
                <XCircle className="h-3.5 w-3.5" /> Rejected
              </span>
            )}

            {/* Soft Delete Action */}
            <button
              type="button"
              onClick={() => handleOpenDeleteModal(r)}
              title="Delete Change Request (Soft Delete)"
              aria-label="Delete Change Request"
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] transition shadow-xs cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          /* Strict Soft Delete UI Rule — Replaces every Restore action in this module with static plain text */
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
            Soft Delete
          </span>
        )}
      </div>
    ),
  },
];

return (
  <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
    {/* Header */}
    <CSPageHeader
      title="Transfer, Resale & Change Requests"
      subtitle="Manage flat ownership transfers, secondary resales, booking cancellations and customer profile amendments."
      badge="Legal & Approval Gate"
      breadcrumbs={[
        { label: "Customers & Properties" },
        { label: "Change Requests" },
      ]}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      primaryAction={{
        label: "New Change Request",
        onClick: handleOpenCreateModal,
        icon: Plus,
      }}
    />

    {/* KPI Stat Cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <CSStatCard
        title="Active Requests"
        value={String(stats.active_requests)}
        subtext="Under approval pipeline"
        icon={GitPullRequest}
      />
      <CSStatCard
        title="Transfer Fees Collected"
        value={stats.transfer_fees_collected_formatted}
        subtext="Processing fee revenue"
        icon={Building}
        iconBg="bg-[#ECFDF3]"
        iconColor="text-[#039855]"
      />
      <CSStatCard
        title="Completed Transfers"
        value={String(stats.completed_transfers)}
        subtext="Deed endorsement done"
        icon={CheckCircle2}
        iconBg="bg-[#EFF6FF]"
        iconColor="text-[#2563EB]"
      />
    </div>

    {/* Records Mode Switcher (Active Records vs Deleted Records) & Search */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl w-fit border border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setRecordsTab("active")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${recordsTab === "active"
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
            {stats.all_count}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRecordsTab("deleted")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${recordsTab === "deleted"
            ? "bg-white text-[#DC2626] shadow-xs"
            : "text-[#6B7280] hover:text-[#DC2626]"
            }`}
        >
          <span>Deleted Records</span>
          {stats.deleted_count > 0 && (
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

      {/* 350ms Debounced Server Search Control */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by request ID, customer, unit or new buyer..."
          className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs text-[#111827] placeholder-[#9CA3AF] shadow-xs outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
        />
      </div>
    </div>

    {/* Filter Tabs (Shown in Active Records mode) */}
    {recordsTab === "active" && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CSFilterTabs
          tabs={[
            {
              key: "all",
              label: "All Requests",
              count: stats.all_count,
            },
            {
              key: "pending",
              label: "Pending Approvals",
              count: stats.pending_count,
              badgeVariant: "warning",
            },
            {
              key: "completed",
              label: "Completed",
              count: stats.completed_count,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Type Filter Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280] font-medium hidden sm:inline">
            Filter Type:
          </span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#374151] font-medium outline-none focus:border-[#6D4AFF]"
          >
            <option value="all">All Request Types</option>
            {dropdownMeta.request_types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    )}

    {/* Table Section with Loading Skeleton, Error State, & CSTable */}
    {isLoading ? (
      <div className="w-full h-72 rounded-[12px] border border-[#E5E7EB] bg-white p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D4AFF]" />
        <p className="text-xs text-[#6B7280]">
          Loading Change Requests & Portfolio Transfers...
        </p>
      </div>
    ) : loadError && requests.length === 0 ? (
      <div className="w-full rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-8 flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-[#DC2626]" />
        <h3 className="text-sm font-semibold text-[#991B1B]">
          Failed to Load Change Requests
        </h3>
        <p className="text-xs text-[#7F1D1D] max-w-md">{loadError}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-2 h-8 px-4 rounded-lg bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] transition shadow-xs cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    ) : (
      <div className="relative">
        {isTableLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-[12px]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-md border border-[#E5E7EB] text-xs font-medium text-[#6D4AFF]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating records...</span>
            </div>
          </div>
        )}
        <div className="[&_.w-64.sm\\:w-72]:hidden [&_.relative.w-64]:hidden">
          <CSTable
            data={requests}
            columns={columns}
            searchFields={[]}
            emptyTitle={
              recordsTab === "deleted"
                ? "No deleted change requests found"
                : "No change requests match this filter"
            }
            emptySubtitle={
              recordsTab === "deleted"
                ? "Soft-deleted change requests will appear here."
                : "Try adjusting your search criteria or switch tabs to see other applications."
            }
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>
    )}

    {/* ─── Detail Drawer ──────────────────────────────────────────────── */}
    <CSDetailDrawer
      isOpen={isDetailDrawerOpen}
      onClose={() => setIsDetailDrawerOpen(false)}
      title={
        selectedItem?.request_code || selectedItem?.id || "Change Request"
      }
      subtitle={
        selectedItem?.request_type || "Ownership Transfer Application"
      }
      badge={selectedItem?.status}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setIsDetailDrawerOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {recordsTab === "active" &&
              selectedItem &&
              selectedItem.status !== "Completed" &&
              selectedItem.status !== "Rejected" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleOpenRejectModal(selectedItem);
                    }}
                    className="h-9 px-3 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] rounded-lg transition cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleOpenAdvanceModal(selectedItem);
                    }}
                    className="h-9 px-4 text-xs font-semibold text-white bg-[#039855] hover:bg-[#027A48] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Advance Stage
                  </button>
                </>
              )}
          </div>
        </div>
      }
    >
      {selectedItem && (
        <div className="space-y-6 text-xs text-[#374151]">
          {/* Visual Workflow Pipeline Stepper */}
          <div>
            <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">
              Approval Gate & Workflow Pipeline
            </h4>
            <div className="space-y-2 border border-[#E5E7EB] rounded-xl p-3.5 bg-[#F9FAFB]">
              {WORKFLOW_STEPS.map((step, idx) => {
                const currentIdx = WORKFLOW_STEPS.indexOf(
                  selectedItem.status,
                );
                const isDone =
                  currentIdx > idx || selectedItem.status === "Completed";
                const isCurrent =
                  selectedItem.status === step &&
                  selectedItem.status !== "Completed";

                return (
                  <div
                    key={step}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone
                          ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                          : isCurrent
                            ? "bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD] ring-2 ring-[#BFDBFE]"
                            : "bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB]"
                          }`}
                      >
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-[#039855]" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`font-medium ${isDone
                          ? "text-[#039855]"
                          : isCurrent
                            ? "text-[#2563EB] font-bold"
                            : "text-[#6B7280]"
                          }`}
                      >
                        {step}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                        Current Stage
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-semibold text-[#039855]">
                        Passed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Overview */}
          <div className="grid grid-cols-2 gap-4 border border-[#E5E7EB] rounded-xl p-4 bg-white">
            <div>
              <span className="text-[#6B7280] block text-[11px]">
                Request Code
              </span>
              <span className="font-semibold text-[#111827] text-sm tabular-nums">
                {selectedItem.request_code || selectedItem.id}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">
                Application Date
              </span>
              <span className="font-medium text-[#111827] tabular-nums">
                {selectedItem.applied_date}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">
                Unit Number
              </span>
              <span className="font-semibold text-[#6D4AFF]">
                {selectedItem.unit}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">
                Assigned Project
              </span>
              <span className="font-medium text-[#111827]">
                {selectedItem.project || "Assigned Project"}
              </span>
            </div>
          </div>

          {/* Existing Customer Information */}
          <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white space-y-2">
            <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Current Registered Customer
            </h4>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#6B7280]" />
              <span className="font-semibold text-[#111827] text-sm">
                {selectedItem.customer_name}
              </span>
              {selectedItem.customer_id && (
                <span className="text-[11px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-md font-mono">
                  {selectedItem.customer_id}
                </span>
              )}
            </div>
            <div>
              <span className="text-[#6B7280] text-[11px] block mt-2">
                Application Reason / Grounds
              </span>
              <p className="text-xs text-[#374151] mt-0.5 bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB]">
                {selectedItem.reason || "Official application submitted"}
              </p>
            </div>
          </div>

          {/* Transferee / New Buyer Details */}
          {selectedItem.request_type !== "Cancellation & Refund" && (
            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Transferee / Proposed Purchaser
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Buyer Full Name
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {selectedItem.new_buyer_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    National ID (NID)
                  </span>
                  <span className="font-medium text-[#111827] tabular-nums">
                    {selectedItem.new_buyer_nid || "N/A"}
                  </span>
                </div>
                {selectedItem.new_buyer_phone && (
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">
                      Contact Phone
                    </span>
                    <span className="font-medium text-[#111827] tabular-nums">
                      {selectedItem.new_buyer_phone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Transfer Processing Fee
                  </span>
                  <span className="font-bold text-[#039855] text-sm tabular-nums">
                    ৳{" "}
                    {Number(selectedItem.transfer_fee || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail & Notes */}
          {selectedItem.approval_notes && (
            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white space-y-2">
              <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Processing & Audit Notes
              </h4>
              <pre className="text-[11px] text-[#4B5563] bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] font-sans whitespace-pre-wrap">
                {selectedItem.approval_notes}
              </pre>
            </div>
          )}
        </div>
      )}
    </CSDetailDrawer>

    {/* ─── Create Change Request Modal ────────────────────────────────── */}
    <CSModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title="Initiate Ownership Transfer / Resale Request"
      subtitle="Official customer request with legal verification and transfer fees"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCreateSubmit}
            className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Submit Application</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Request Type *
          </label>
          <select
            value={formRequestType}
            onChange={(e) =>
              setFormRequestType(e.target.value as ChangeRequestType)
            }
            className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
          >
            {dropdownMeta.request_types.map((t) => (
              <option key={t} value={t}>
                {t === "Ownership Transfer"
                  ? "Ownership Transfer (Family / Blood-line)"
                  : t === "Resale"
                    ? "Secondary Market Resale"
                    : t === "Cancellation & Refund"
                      ? "Booking Cancellation & Refund"
                      : "Unit Swap / Floor Change"}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Current Customer Name *
            </label>
            <input
              type="text"
              required
              value={formCustomerName}
              onChange={(e) => setFormCustomerName(e.target.value)}
              placeholder="e.g. Mohammad Rafiqul Islam"
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
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              placeholder="e.g. A-7, Hena Heights"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              placeholder="e.g. Hena Heights, Gulshan"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Application Date
            </label>
            <input
              type="date"
              value={formAppliedDate}
              onChange={(e) => setFormAppliedDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Reason / Ground for Request
          </label>
          <textarea
            rows={2}
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            placeholder="e.g. Transferring deed rights to son (Engr. Salman Islam)"
            className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
          />
        </div>

        {formRequestType !== "Cancellation & Refund" && (
          <div className="border-t border-[#E5E7EB] pt-3 space-y-3">
            <span className="font-bold text-[#4B5563] text-[11px] uppercase tracking-wider block">
              Transferee / Proposed Purchaser Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  New Transferee / Buyer Name
                </label>
                <input
                  type="text"
                  value={formNewBuyerName}
                  onChange={(e) => setFormNewBuyerName(e.target.value)}
                  placeholder="New purchaser name"
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Transfer Fee (BDT)
                </label>
                <input
                  type="number"
                  value={formTransferFee}
                  onChange={(e) => setFormTransferFee(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Transferee NID Number
                </label>
                <input
                  type="text"
                  value={formNewBuyerNid}
                  onChange={(e) => setFormNewBuyerNid(e.target.value)}
                  placeholder="e.g. 19902691234567890"
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Transferee Phone Number
                </label>
                <input
                  type="text"
                  value={formNewBuyerPhone}
                  onChange={(e) => setFormNewBuyerPhone(e.target.value)}
                  placeholder="+880 1711-XXXXXX"
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </CSModal>

    {/* ─── Edit Change Request Modal ──────────────────────────────────── */}
    <CSModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      title={`Edit Application: ${selectedItem?.request_code || selectedItem?.id}`}
      subtitle="Update application parameters, unit details, or new buyer information"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleEditSubmit}
            className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save Changes</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Request Type
          </label>
          <select
            value={formRequestType}
            onChange={(e) =>
              setFormRequestType(e.target.value as ChangeRequestType)
            }
            className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
          >
            {dropdownMeta.request_types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Current Customer Name *
            </label>
            <input
              type="text"
              required
              value={formCustomerName}
              onChange={(e) => setFormCustomerName(e.target.value)}
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
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Transfer Fee (BDT)
            </label>
            <input
              type="number"
              value={formTransferFee}
              onChange={(e) => setFormTransferFee(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Reason / Ground for Request
          </label>
          <textarea
            rows={2}
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
          />
        </div>

        <div className="border-t border-[#E5E7EB] pt-3 space-y-3">
          <span className="font-bold text-[#4B5563] text-[11px] uppercase tracking-wider block">
            Transferee / Proposed Purchaser Information
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                New Transferee / Buyer Name
              </label>
              <input
                type="text"
                value={formNewBuyerName}
                onChange={(e) => setFormNewBuyerName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Transferee NID Number
              </label>
              <input
                type="text"
                value={formNewBuyerNid}
                onChange={(e) => setFormNewBuyerNid(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>
        </div>
      </form>
    </CSModal>

    {/* ─── Advance Stage Modal ────────────────────────────────────────── */}
    <CSModal
      isOpen={isAdvanceModalOpen}
      onClose={() => setIsAdvanceModalOpen(false)}
      title="Advance Approval Stage"
      subtitle={`Application: ${selectedItem?.request_code || selectedItem?.id}`}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => setIsAdvanceModalOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={handleAdvanceSubmit}
            className="h-9 px-4 text-xs font-semibold text-white bg-[#039855] hover:bg-[#027A48] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isActionLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <span>Confirm & Advance</span>
          </button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs text-[#374151]">
        <div className="bg-[#ECFDF3] border border-[#A6F4C5] p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#027A48] block">
              Current Stage
            </span>
            <span className="font-bold text-[#027A48] text-sm">
              {selectedItem?.status}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-[#039855]" />
          <div>
            <span className="text-[11px] text-[#027A48] block">
              Next Stage
            </span>
            <span className="font-bold text-[#027A48] text-sm">
              {selectedItem && NEXT_WORKFLOW_MAP[selectedItem.status]}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Approval / Auditor Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={advanceNotes}
            onChange={(e) => setAdvanceNotes(e.target.value)}
            placeholder="e.g. Title deeds and transfer fee clearance vetted; forwarded for executive sign-off."
            className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition text-xs"
          />
        </div>
      </div>
    </CSModal>

    {/* ─── Reject Stage Modal ─────────────────────────────────────────── */}
    <CSModal
      isOpen={isRejectModalOpen}
      onClose={() => setIsRejectModalOpen(false)}
      title="Reject Change Request"
      subtitle={`Application: ${selectedItem?.request_code || selectedItem?.id}`}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => setIsRejectModalOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={handleRejectSubmit}
            className="h-9 px-4 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isActionLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <span>Confirm Rejection</span>
          </button>
        </>
      }
    >
      <div className="space-y-3 text-xs text-[#374151]">
        <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-lg">
          This action will mark the change request application as{" "}
          <strong>Rejected</strong> and halt further pipeline advancement.
        </p>
        <div>
          <label className="block font-semibold text-[#374151] mb-1">
            Reason / Remarks for Rejection *
          </label>
          <textarea
            rows={3}
            required
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="e.g. Transferee NID records could not be verified by land sub-registry."
            className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition text-xs"
          />
        </div>
      </div>
    </CSModal>

    {/* ─── Delete Confirmation Modal ──────────────────────────────────── */}
    <CSModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      title="Delete Change Request"
      subtitle={`Are you sure you want to soft-delete request ${itemToDelete?.request_code || itemToDelete?.id}?`}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={handleDeleteSubmit}
            className="h-9 px-4 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isActionLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <span>Soft Delete Request</span>
          </button>
        </>
      }
    >
      <div className="space-y-2 text-xs text-[#4B5563]">
        <p>
          The change request for unit <strong>{itemToDelete?.unit}</strong> (
          {itemToDelete?.customer_name}) will be soft-deleted.
        </p>
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-[11px]">
          This record will be moved to the <strong>Deleted Records</strong>{" "}
          view, completely separate from active requests.
        </div>
      </div>
    </CSModal>
  </div>
);
}
