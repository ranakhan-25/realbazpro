"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  KeyRound,
  Layers,
  Search,
  Eye,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
  Copy,
  User,
  Home,
  Phone,
  Mail,
  RefreshCw,
  GitCommit,
  XCircle,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { CSModal } from "@/components/customer-service/CSModal";
import {
  getPropertiesBookings,
  getPropertiesBookingStats,
  getPropertiesBookingDropdownMeta,
  getPropertiesBooking360,
  getPropertiesBookingDemandLetterPreview,
  updatePropertiesBookingHandoverStatus,
  BookingListItem,
  BookingStatsData,
  BookingTabCounts,
  BookingDropdownMeta,
  Booking360Detail,
  DemandLetterPreview,
  HandoverStatus,
  BookingTabKey,
} from "@/services/customerBookingService";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

const ALLOWED_NEXT_STATUS: Record<HandoverStatus, HandoverStatus | null> = {
  "Under Construction": "Ready for Snagging",
  "Ready for Snagging": "DLP Active",
  "DLP Active": "Handed Over",
  "Handed Over": null,
};

export default function PropertiesBookingsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, setProject } = useSelectedProject();

  // Tab, Filter, & Search States
  const [activeTab, setActiveTab] = useState<BookingTabKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  // Sync workspace scoped project into local filter state
  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Data States
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [tabCounts, setTabCounts] = useState<BookingTabCounts>({
    all: 0,
    under_construction: 0,
    snagging: 0,
    dlp: 0,
    handedover: 0,
  });
  const [stats, setStats] = useState<BookingStatsData>({
    total_booked_units: 0,
    ready_for_snagging: 0,
    dlp_active: 0,
    handed_over: 0,
    under_construction: 0,
    total_portfolio_valuation: 0,
    total_portfolio_valuation_formatted: "৳ 0.00",
    total_collected_amount: 0,
    total_collected_amount_formatted: "৳ 0.00",
    total_outstanding_due: 0,
    total_outstanding_due_formatted: "৳ 0.00",
  });
  const [dropdownMeta, setDropdownMeta] = useState<BookingDropdownMeta>({
    projects: [],
    handover_statuses: [],
    unit_types: [],
  });

  // UI & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchReqIdRef = useRef(0);

  // Booking 360 Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingUuid, setSelectedBookingUuid] = useState<string | null>(
    null,
  );
  const [booking360Data, setBooking360Data] = useState<Booking360Detail | null>(
    null,
  );
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // Handover Status Transition Modal State
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetBooking, setTargetBooking] = useState<BookingListItem | null>(
    null,
  );
  const [targetNextStatus, setTargetNextStatus] = useState<HandoverStatus | "">(
    "",
  );
  const [transitionPossessionDate, setTransitionPossessionDate] = useState("");
  const [transitionDlpExpiryDate, setTransitionDlpExpiryDate] = useState("");
  const [transitionKeyRegister, setTransitionKeyRegister] = useState("");
  const [transitionPossessionCert, setTransitionPossessionCert] = useState("");
  const [transitionSnagsReported, setTransitionSnagsReported] =
    useState<number>(0);
  const [transitionSnagsResolved, setTransitionSnagsResolved] =
    useState<number>(0);
  const [transitionRemarks, setTransitionRemarks] = useState("");
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Demand Letter Preview Modal State
  const [isDemandLetterOpen, setIsDemandLetterOpen] = useState(false);
  const [demandLetterData, setDemandLetterData] =
    useState<DemandLetterPreview | null>(null);
  const [isDemandLetterLoading, setIsDemandLetterLoading] = useState(false);
  const [isRefCopied, setIsRefCopied] = useState(false);

  // 400ms Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load KPI Stats
  const loadOverviewStats = useCallback(async () => {
    try {
      const statsRes = await getPropertiesBookingStats(projectId || undefined);
      setStats(statsRes);
    } catch (err: unknown) {
      console.warn("Could not load portfolio stats:", err);
    }
  }, [projectId]);

  // Load Dropdown Metadata
  const loadDropdownMeta = useCallback(async () => {
    try {
      const meta = await getPropertiesBookingDropdownMeta();
      setDropdownMeta(meta);
    } catch (err: unknown) {
      console.warn("Could not load dropdown meta:", err);
    }
  }, []);

  // Load Bookings List with Sequence Guard against Race Conditions
  const loadBookingsList = useCallback(
    async (
      searchQuery?: string,
      tabFilter?: BookingTabKey,
      projectId?: string,
    ) => {
      const currentReqId = ++searchReqIdRef.current;
      setIsTableLoading(true);

      try {
        const isDeleted = recordsTab === "deleted";
        const activeTabKey = tabFilter ?? activeTab;
        const activeSearch =
          searchQuery !== undefined ? searchQuery : debouncedSearch;
        const activeProject = projectId ?? selectedProjectId;

        const res = await getPropertiesBookings({
          search: activeSearch || undefined,
          tab: isDeleted ? undefined : activeTabKey,
          project_id: activeProject !== "all" ? activeProject : undefined,
          is_deleted: isDeleted,
          limit: 100,
        });

        // Discard stale responses if a newer request was dispatched
        if (currentReqId !== searchReqIdRef.current) return;

        setBookings(res.items || []);
        if (res.tab_counts) {
          setTabCounts(res.tab_counts);
        }
        setLoadError(null);
      } catch (err: unknown) {
        if (currentReqId !== searchReqIdRef.current) return;

        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as Error)?.message ||
          "Failed to load property bookings";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (currentReqId === searchReqIdRef.current) {
          setIsTableLoading(false);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeTab, debouncedSearch, selectedProjectId, recordsTab],
  );

  // Initial Load: KPI stats and Dropdown Meta once
  useEffect(() => {
    loadOverviewStats();
    loadDropdownMeta();
  }, [loadOverviewStats, loadDropdownMeta]);

  // Tab, Search, or Project filter changes: Reload List
  useEffect(() => {
    loadBookingsList(debouncedSearch, activeTab, selectedProjectId);
  }, [debouncedSearch, activeTab, selectedProjectId, loadBookingsList]);

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadBookingsList(debouncedSearch, activeTab, selectedProjectId),
        loadOverviewStats(),
        loadDropdownMeta(),
      ]);
      toast.success("Property bookings synchronized");
    } catch {
      toast.error("Failed to refresh records");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Booking 360 Drawer
  const handleOpen360Drawer = async (booking: BookingListItem) => {
    setSelectedBookingUuid(booking.uuid);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    setBooking360Data(null);

    try {
      const details = await getPropertiesBooking360(booking.uuid);
      setBooking360Data(details);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load Booking 360 ledger details";
      toast.error(msg);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Open Handover Status Transition Modal
  const handleOpenTransitionModal = (booking: BookingListItem) => {
    setTargetBooking(booking);
    const nextStatus = ALLOWED_NEXT_STATUS[booking.handover_status];
    setTargetNextStatus(nextStatus || "");
    setTransitionPossessionDate(
      booking.possession_date || new Date().toISOString().slice(0, 10),
    );
    setTransitionDlpExpiryDate(booking.dlp_expiry_date || "");
    setTransitionKeyRegister(booking.key_register_no || "");
    setTransitionPossessionCert(booking.possession_cert_no || "");
    setTransitionSnagsReported(booking.total_snags_reported || 0);
    setTransitionSnagsResolved(booking.total_snags_resolved || 0);
    setTransitionRemarks("");
    setIsTransitionModalOpen(true);
  };

  // Submit Handover Transition
  const handleSubmitTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBooking?.uuid || !targetNextStatus) return;

    if (targetNextStatus === "DLP Active" && !transitionPossessionDate) {
      toast.error("Possession date is required for DLP Active transition");
      return;
    }

    if (
      targetNextStatus === "DLP Active" &&
      transitionSnagsReported > transitionSnagsResolved
    ) {
      toast.error(
        `Cannot activate DLP: ${
          transitionSnagsReported - transitionSnagsResolved
        } snags are still unresolved. All snags must be resolved first.`,
      );
      return;
    }

    setIsSubmittingTransition(true);
    try {
      await updatePropertiesBookingHandoverStatus(targetBooking.uuid, {
        handover_status: targetNextStatus,
        possession_date: transitionPossessionDate || undefined,
        dlp_expiry_date: transitionDlpExpiryDate || undefined,
        key_register_no: transitionKeyRegister.trim() || undefined,
        possession_cert_no: transitionPossessionCert.trim() || undefined,
        total_snags_reported: Number(transitionSnagsReported) || 0,
        total_snags_resolved: Number(transitionSnagsResolved) || 0,
        remarks: transitionRemarks.trim() || undefined,
      });

      toast.success(
        `Booking ${targetBooking.code} transitioned to "${targetNextStatus}"`,
      );
      setIsTransitionModalOpen(false);

      // Refresh list and stats concurrently
      await Promise.all([
        loadBookingsList(debouncedSearch, activeTab, selectedProjectId),
        loadOverviewStats(),
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to update handover status";
      toast.error(msg);
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  // Open Demand Letter Preview Modal
  const handleOpenDemandLetter = async (booking: BookingListItem) => {
    setIsDemandLetterOpen(true);
    setIsDemandLetterLoading(true);
    setDemandLetterData(null);
    setIsRefCopied(false);

    try {
      const preview = await getPropertiesBookingDemandLetterPreview(
        booking.uuid,
      );
      setDemandLetterData(preview);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load demand letter preview";
      toast.error(msg);
    } finally {
      setIsDemandLetterLoading(false);
    }
  };

  // Copy Demand Reference
  const handleCopyReference = (ref: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(ref);
    setIsRefCopied(true);
    toast.success("Reference number copied to clipboard");
    setTimeout(() => setIsRefCopied(false), 2000);
  };

  // Table Columns Definition
  const columns: Column<BookingListItem>[] = [
    {
      key: "code",
      header: "BOOKING ID & DATE",
      sortable: true,
      minWidth: "170px",
      render: (b) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">
            {b.code || b.id}
          </span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#9CA3AF]" />
            <span>{b.booking_date}</span>
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "CUSTOMER",
      minWidth: "190px",
      render: (b) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {b.customer_name}
          </div>
          {b.customer_phone && (
            <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5 flex items-center gap-1">
              <Phone className="h-3 w-3 text-[#9CA3AF]" />
              <span>{b.customer_phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "project_name",
      header: "PROJECT & UNIT",
      minWidth: "220px",
      render: (b) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {b.project_name || "Assigned Project"}
          </div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5 flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-[#6D4AFF]" />
            <span>Unit: {b.unit_number || "TBD"}</span>
            {b.size_sqft ? <span>({b.size_sqft} sft)</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: "total_price",
      header: "VALUATION & LEDGER",
      sortable: true,
      minWidth: "190px",
      render: (b) => (
        <div className="space-y-0.5 tabular-nums">
          <div className="text-xs font-semibold text-[#111827]">
            ৳ {(Number(b.total_price) / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] text-[#039855] font-medium">
            Paid: ৳ {(Number(b.paid_amount) / 100000).toFixed(1)} Lac
          </div>
          {Number(b.due_amount) > 0 ? (
            <div className="text-[10px] text-[#DC6803] font-medium">
              Due: ৳ {(Number(b.due_amount) / 100000).toFixed(1)} Lac
            </div>
          ) : (
            <div className="text-[10px] text-[#039855] font-semibold">
              Paid in Full
            </div>
          )}
        </div>
      ),
    },
    {
      key: "handover_status",
      header: "HANDOVER & DLP",
      minWidth: "170px",
      render: (b) => {
        let badgeStyle = "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
        if (b.handover_status === "Ready for Snagging") {
          badgeStyle = "bg-[#FFFAEB] text-[#DC6803] border-[#FEDF89]";
        } else if (b.handover_status === "DLP Active") {
          badgeStyle = "bg-[#F4F1FF] text-[#6D4AFF] border-[#DDD6FE]";
        } else if (b.handover_status === "Handed Over") {
          badgeStyle = "bg-[#ECFDF3] text-[#039855] border-[#A6F4C5]";
        }

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle}`}
            >
              {b.handover_status}
            </span>
            {b.handover_status === "DLP Active" && b.dlp_expiry_date && (
              <div className="text-[10px] text-[#6B7280] tabular-nums">
                Exp: {b.dlp_expiry_date}
              </div>
            )}
            {b.open_snags > 0 && (
              <div className="text-[10px] text-[#DC2626] font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{b.open_snags} open snags</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "160px",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Booking Profile View */}
          <button
            type="button"
            onClick={() => handleOpen360Drawer(b)}
            title="View Booking Portfolio"
            aria-label="View Booking Portfolio"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition shadow-xs cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>

          {recordsTab === "deleted" ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
              Soft Deleted
            </span>
          ) : (
            <>
              {/* Update Handover Status Transition */}
              <button
                type="button"
                onClick={() => handleOpenTransitionModal(b)}
                title={
                  ALLOWED_NEXT_STATUS[b.handover_status]
                    ? `Transition to: ${ALLOWED_NEXT_STATUS[b.handover_status]}`
                    : "Lifecycle Completed (Handed Over)"
                }
                aria-label="Update Handover Lifecycle Status"
                className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] hover:bg-[#ECE7FE] transition shadow-xs text-xs font-semibold cursor-pointer"
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Status</span>
              </button>

              {/* Demand Letter Quick Preview */}
              <button
                type="button"
                onClick={() => handleOpenDemandLetter(b)}
                title="Preview Milestone Demand Letter & Bank Details"
                aria-label="Preview Milestone Demand Letter"
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827] transition shadow-xs cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-[#6B7280]" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <CSPageHeader
        title="Bookings & Property Portfolio"
        subtitle="Customer apartment allotments, commercial spaces, plots, parking bays, and milestone payment status."
        badge="Asset Inventory"
        breadcrumbs={[
          { label: "Customers & Properties" },
          { label: "Bookings Portfolio" },
        ]}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Booked Units"
          value={`${stats.total_booked_units} Units`}
          subtext={`Valuation: ${stats.total_portfolio_valuation_formatted}`}
          icon={Building2}
        />
        <CSStatCard
          title="Ready for Joint Snagging"
          value={`${stats.ready_for_snagging} Units`}
          subtext="Pending pre-possession inspection"
          icon={KeyRound}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Active 2-Year DLP Coverage"
          value={`${stats.dlp_active} Units`}
          subtext="Statutory warranty active"
          icon={Layers}
          iconBg="bg-[#F4F1FF]"
          iconColor="text-[#6D4AFF]"
        />
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-3">
        {/* Active vs Deleted Records Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setRecordsTab("active")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                recordsTab === "active"
                  ? "bg-[#6D4AFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>Active Records</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  recordsTab === "active"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {stats.total_booked_units}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRecordsTab("deleted")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                recordsTab === "deleted"
                  ? "bg-[#DC2626] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>Deleted Records</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  recordsTab === "deleted"
                    ? "bg-white/20 text-white"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {stats.deleted_count || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-filter Tabs with Real Counts */}
        {recordsTab === "active" && (
          <CSFilterTabs
            tabs={[
              {
                key: "all",
                label: "All Bookings",
                count: tabCounts.all,
              },
              {
                key: "under_construction",
                label: "Under Construction",
                count: tabCounts.under_construction,
              },
              {
                key: "snagging",
                label: "Ready for Snagging",
                count: tabCounts.snagging,
                badgeVariant: "warning",
              },
              {
                key: "dlp",
                label: "DLP Active (2-Year)",
                count: tabCounts.dlp,
              },
              {
                key: "handedover",
                label: "Fully Handed Over",
                count: tabCounts.handedover,
                badgeVariant: "success",
              },
            ]}
            activeTab={activeTab}
            onTabChange={(tabKey) => setActiveTab(tabKey as BookingTabKey)}
          />
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Debounced Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by code, customer, project or unit..."
              className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs text-[#111827] placeholder-[#9CA3AF] shadow-xs outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
            />
          </div>

          {/* Project Dropdown Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
              Project:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs text-[#111827] shadow-xs outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
            >
              <option value="all">
                All Projects ({dropdownMeta.projects.length})
              </option>
              {dropdownMeta.projects.map((p) => (
                <option key={p.uuid || p.id} value={p.uuid || String(p.id)}>
                  {p.name} ({p.code || "PRJ"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="w-full h-72 rounded-[12px] border border-[#E5E7EB] bg-white p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D4AFF]" />
          <p className="text-xs text-[#6B7280]">
            Loading Property Bookings & Portfolio...
          </p>
        </div>
      ) : loadError && bookings.length === 0 ? (
        <div className="w-full rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-[#DC2626]" />
          <h3 className="text-sm font-semibold text-[#991B1B]">
            Failed to Load Bookings Portfolio
          </h3>
          <p className="text-xs text-[#7F1D1D] max-w-md">{loadError}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-2 h-8 px-4 rounded-lg bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] transition shadow-xs"
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
          <div className="[&_.relative.w-64]:hidden">
            <CSTable
              data={bookings}
              columns={columns}
              searchFields={[]}
              emptyTitle="No property bookings found"
              emptySubtitle="Try adjusting your search criteria or switch tabs to see other property bookings."
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      )}

      {/* Booking 360 Detail Drawer */}
      {/* Booking Detail Drawer */}
      <CSDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Booking Portfolio View"
        badge={booking360Data?.booking?.code || "Booking"}
        subtitle={
          booking360Data
            ? `${booking360Data.project?.name || "Project"} · Unit ${
                booking360Data.unit?.unit_number || "TBD"
              }`
            : "Property Allotment & Customer Ledger"
        }
        width="xl"
      >
        {isDrawerLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-[#6D4AFF]" />
            <p className="text-xs text-[#6B7280]">
              Fetching Booking ledger and snag records...
            </p>
          </div>
        ) : booking360Data ? (
          <div className="space-y-5 text-xs text-[#374151]">
            {/* Customer & Unit Hero Card */}
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-gradient-to-br from-[#FAFAFF] to-white space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#111827]">
                    {booking360Data.customer?.customer_name}
                  </h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    ID: {booking360Data.customer?.customer_id || "CUST"} ·
                    Booking Code:{" "}
                    <span className="font-semibold text-[#111827]">
                      {booking360Data.booking?.code}
                    </span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    booking360Data.handover?.handover_status === "DLP Active"
                      ? "bg-[#F4F1FF] text-[#6D4AFF] border-[#DDD6FE]"
                      : booking360Data.handover?.handover_status ===
                          "Ready for Snagging"
                        ? "bg-[#FFFAEB] text-[#DC6803] border-[#FEDF89]"
                        : booking360Data.handover?.handover_status ===
                            "Handed Over"
                          ? "bg-[#ECFDF3] text-[#039855] border-[#A6F4C5]"
                          : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
                  }`}
                >
                  {booking360Data.handover?.handover_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E7EB] text-[11px]">
                <div className="flex items-center gap-1.5 text-[#4B5563]">
                  <Phone className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  <span>
                    {booking360Data.customer?.customer_phone || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#4B5563]">
                  <Mail className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  <span>
                    {booking360Data.customer?.customer_email || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Unit Specs */}
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2.5">
              <h5 className="font-semibold text-[#111827] flex items-center gap-1.5">
                <Home className="h-4 w-4 text-[#6D4AFF]" /> Property & Allotment
                Specifications
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
                <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Unit Number</span>
                  <span className="font-semibold text-[#111827]">
                    {booking360Data.unit?.unit_number || "TBD"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Size (Sq Ft)</span>
                  <span className="font-semibold text-[#111827]">
                    {booking360Data.unit?.size_sqft || "N/A"} sft
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Floor</span>
                  <span className="font-semibold text-[#111827]">
                    {booking360Data.unit?.floor || "N/A"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Bed / Bath</span>
                  <span className="font-semibold text-[#111827]">
                    {booking360Data.unit?.bedroom || "-"} Bed ·{" "}
                    {booking360Data.unit?.bathroom || "-"} Bath
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Cost Breakdown */}
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
              <h5 className="font-semibold text-[#111827] flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#039855]" /> Financial
                Ledger & Cost Breakdown
              </h5>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[11px] text-[#6B7280] block">
                    Grand Total
                  </span>
                  <span className="text-xs font-semibold text-[#111827] tabular-nums">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.grand_total || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#ECFDF3] border border-[#A6F4C5]">
                  <span className="text-[11px] text-[#027A48] block">
                    Total Paid
                  </span>
                  <span className="text-xs font-semibold text-[#039855] tabular-nums">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.paid_amount || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FFFAEB] border border-[#FEDF89]">
                  <span className="text-[11px] text-[#B54708] block">
                    Total Due
                  </span>
                  <span className="text-xs font-semibold text-[#DC6803] tabular-nums">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.due_amount || 0,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Minor Cost Breakdown Table */}
              <div className="pt-2 text-[11px] space-y-1 text-[#4B5563]">
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span>Base Rate / Unit Cost</span>
                  <span className="font-medium text-[#111827]">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.subtotal || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span>Parking Bay Charge</span>
                  <span className="font-medium text-[#111827]">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.parking || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                  <span>Utility Connection Charge</span>
                  <span className="font-medium text-[#111827]">
                    ৳{" "}
                    {Number(
                      booking360Data.cost_breakdown?.utility_charge || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                {Number(booking360Data.cost_breakdown?.discount || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-[#F3F4F6] text-[#DC2626]">
                    <span>Discount Allowed</span>
                    <span className="font-medium">
                      - ৳{" "}
                      {Number(
                        booking360Data.cost_breakdown?.discount || 0,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Handover & DLP Statutory Details */}
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2.5">
              <h5 className="font-semibold text-[#111827] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#6D4AFF]" /> Handover &
                DLP Warranty Details
              </h5>
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Possession Date</span>
                  <span className="font-medium text-[#111827]">
                    {booking360Data.handover?.possession_date ||
                      "Pending Handover"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">DLP Expiry Date</span>
                  <span className="font-medium text-[#111827]">
                    {booking360Data.handover?.dlp_expiry_date ||
                      "Pending Activation"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">Key Register No</span>
                  <span className="font-medium text-[#111827]">
                    {booking360Data.handover?.key_register_no || "Unregistered"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[#6B7280] block">
                    Possession Cert No
                  </span>
                  <span className="font-medium text-[#111827]">
                    {booking360Data.handover?.possession_cert_no || "Unissued"}
                  </span>
                </div>
              </div>

              {/* Snags Alert Box */}
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between text-[11px]">
                <span>
                  Reported Snags:{" "}
                  <strong className="text-[#111827]">
                    {booking360Data.snag_summary?.total_snags_reported || 0}
                  </strong>
                </span>
                <span>
                  Resolved:{" "}
                  <strong className="text-[#039855]">
                    {booking360Data.snag_summary?.total_snags_resolved || 0}
                  </strong>
                </span>
                <span className="font-semibold text-[#DC2626]">
                  Open: {booking360Data.snag_summary?.open_snags || 0}
                </span>
              </div>
            </div>

            {/* Milestone Payment Schedule Table */}
            {booking360Data.milestone_history &&
              booking360Data.milestone_history.length > 0 && (
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2.5">
                  <h5 className="font-semibold text-[#111827] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#6D4AFF]" /> Milestone
                    Payment Schedule
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] border-b border-[#E5E7EB]">
                        <tr>
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-2">Milestone</th>
                          <th className="py-2 px-2">Due Date</th>
                          <th className="py-2 px-2">Payable</th>
                          <th className="py-2 px-2">Paid</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {booking360Data.milestone_history.map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 font-medium">
                              {m.installment_no}
                            </td>
                            <td className="py-2 px-2 font-semibold text-[#111827]">
                              {m.title}
                            </td>
                            <td className="py-2 px-2 tabular-nums">
                              {m.due_date || "N/A"}
                            </td>
                            <td className="py-2 px-2 tabular-nums">
                              ৳ {m.payable_amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 tabular-nums text-[#039855]">
                              ৳ {m.paid_amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  m.status === "Paid"
                                    ? "bg-[#ECFDF3] text-[#027A48]"
                                    : "bg-[#FFFAEB] text-[#B54708]"
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#6B7280]">
            No detailed ledger available for this booking.
          </div>
        )}
      </CSDetailDrawer>

      {/* Handover Status Transition Modal */}
      <CSModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Transition Handover Lifecycle"
        subtitle={`Booking ${targetBooking?.code || ""} · Current Status: ${
          targetBooking?.handover_status || ""
        }`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitTransition} className="space-y-4 text-xs">
          {/* Transition Visualizer */}
          <div className="p-3.5 rounded-xl border border-[#DDD6FE] bg-[#F4F1FF] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block">
                Current Stage
              </span>
              <strong className="text-xs text-[#374151]">
                {targetBooking?.handover_status}
              </strong>
            </div>
            <ArrowRight className="h-4 w-4 text-[#6D4AFF]" />
            <div>
              <span className="text-[11px] text-[#6D4AFF] block font-medium">
                Target Next Stage
              </span>
              <strong className="text-xs text-[#6D4AFF]">
                {targetNextStatus || "Completed (Terminal)"}
              </strong>
            </div>
          </div>

          {!targetNextStatus ? (
            <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#039855]" />
              <span>
                This property has reached the final lifecycle state (
                <strong>Handed Over</strong>). No further transitions available.
              </span>
            </div>
          ) : (
            <>
              {/* Possession Date & DLP Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Possession Date{" "}
                    {targetNextStatus === "DLP Active" && (
                      <span className="text-[#DC2626]">*</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={transitionPossessionDate}
                    onChange={(e) =>
                      setTransitionPossessionDate(e.target.value)
                    }
                    required={targetNextStatus === "DLP Active"}
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                    {targetNextStatus === "DLP Active"
                      ? "Sets DLP start date"
                      : "Official unit handover date"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    DLP Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={transitionDlpExpiryDate}
                    onChange={(e) => setTransitionDlpExpiryDate(e.target.value)}
                    placeholder="Auto: 2 years from possession"
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                    Leave blank to auto-compute (Possession + 2 Yrs - 1 Day)
                  </span>
                </div>
              </div>

              {/* Key Register & Possession Cert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Key Register Number
                  </label>
                  <input
                    type="text"
                    value={transitionKeyRegister}
                    onChange={(e) => setTransitionKeyRegister(e.target.value)}
                    placeholder="e.g. KEY-GUL-A7"
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Possession Certificate Number
                  </label>
                  <input
                    type="text"
                    value={transitionPossessionCert}
                    onChange={(e) =>
                      setTransitionPossessionCert(e.target.value)
                    }
                    placeholder="e.g. CERT-POSS-2026-88"
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                  />
                </div>
              </div>

              {/* Snag Counts */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5">
                <span className="font-semibold text-xs text-[#111827] block">
                  Joint Inspection & Snag Rectification
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#6B7280] mb-1">
                      Total Snags Reported
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={transitionSnagsReported}
                      onChange={(e) =>
                        setTransitionSnagsReported(Number(e.target.value))
                      }
                      className="h-8 w-full rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6B7280] mb-1">
                      Total Snags Resolved
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={transitionSnagsResolved}
                      onChange={(e) =>
                        setTransitionSnagsResolved(Number(e.target.value))
                      }
                      className="h-8 w-full rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                    />
                  </div>
                </div>

                {targetNextStatus === "DLP Active" &&
                  transitionSnagsReported > transitionSnagsResolved && (
                    <div className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        Requirement: All reported snags must be resolved before
                        transitioning to DLP Active (Current open:{" "}
                        {transitionSnagsReported - transitionSnagsResolved}).
                      </span>
                    </div>
                  )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Transition Remarks / Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={transitionRemarks}
                  onChange={(e) => setTransitionRemarks(e.target.value)}
                  placeholder="Official handover notes, inspection sign-off notes..."
                  className="w-full rounded-lg border border-[#E5E7EB] p-2 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransitionModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingTransition ||
                    (targetNextStatus === "DLP Active" &&
                      transitionSnagsReported > transitionSnagsResolved)
                  }
                  className="h-9 px-5 rounded-lg bg-[#6D4AFF] text-white text-xs font-semibold hover:bg-[#5B3CE0] transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingTransition && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Confirm Status Update</span>
                </button>
              </div>
            </>
          )}
        </form>
      </CSModal>

      {/* Demand Letter Preview Modal */}
      <CSModal
        isOpen={isDemandLetterOpen}
        onClose={() => setIsDemandLetterOpen(false)}
        title="Milestone Demand Letter Preview"
        subtitle={
          demandLetterData
            ? `${demandLetterData.customer_name} · ${demandLetterData.project_name || "Project"}`
            : "Official Payment Notice & Routing Details"
        }
        maxWidth="lg"
      >
        {isDemandLetterLoading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#6D4AFF]" />
            <p className="text-xs text-[#6B7280]">
              Generating milestone demand notice...
            </p>
          </div>
        ) : demandLetterData ? (
          <div className="space-y-4 text-xs text-[#374151]">
            {/* Reference Header Card */}
            <div className="p-3.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#1E40AF] block">
                  Demand Letter Reference
                </span>
                <strong className="text-xs font-mono text-[#1E3A8A]">
                  {demandLetterData.demand_letter_reference}
                </strong>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyReference(demandLetterData.demand_letter_reference)
                }
                className="h-8 px-2.5 rounded-lg bg-white border border-[#93C5FD] text-[#1D4ED8] hover:bg-[#DBEAFE] transition text-[11px] font-semibold flex items-center gap-1.5"
              >
                {isRefCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#039855]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Ref</span>
                  </>
                )}
              </button>
            </div>

            {/* Current Milestone Payment Box */}
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#111827]">
                  {demandLetterData.current_milestone?.title ||
                    "Next Scheduled Milestone"}
                </span>
                {demandLetterData.current_milestone?.is_overdue && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                    Overdue Notice
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F3F4F6] text-[11px]">
                <div>
                  <span className="text-[#6B7280] block">Due Date</span>
                  <span className="font-medium text-[#111827]">
                    {demandLetterData.current_milestone?.due_date ||
                      "On Call / Due Immediately"}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Payable Amount</span>
                  <span className="text-xs font-semibold text-[#DC2626] tabular-nums">
                    ৳{" "}
                    {Number(
                      demandLetterData.current_milestone?.due_amount || 0,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Bank Deposit Instructions */}
            {demandLetterData.bank_instructions && (
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5">
                <h5 className="font-semibold text-xs text-[#111827] flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#6D4AFF]" /> Official Bank
                  Payment Instructions
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#6B7280] block">Bank Name</span>
                    <span className="font-medium text-[#111827]">
                      {demandLetterData.bank_instructions.bank_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Account Name</span>
                    <span className="font-medium text-[#111827]">
                      {demandLetterData.bank_instructions.account_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Account Number</span>
                    <span className="font-mono font-medium text-[#111827]">
                      {demandLetterData.bank_instructions.account_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">
                      Branch & Routing
                    </span>
                    <span className="font-medium text-[#111827]">
                      {demandLetterData.bank_instructions.branch_name} (Routing:{" "}
                      {demandLetterData.bank_instructions.routing_number})
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-[#6B7280]">
                  Accepted Channels:{" "}
                  {demandLetterData.bank_instructions.payment_methods?.join(
                    ", ",
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDemandLetterOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#6D4AFF] text-white text-xs font-semibold hover:bg-[#5B3CE0] transition shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#6B7280]">
            Could not generate demand letter preview.
          </div>
        )}
      </CSModal>
    </div>
  );
}
