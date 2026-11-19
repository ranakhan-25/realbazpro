"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Eye,
  Phone,
  Mail,
  Shield,
  Plus,
  UserCheck,
  Building,
  Loader2,
  Trash2,
  AlertTriangle,
  Search,
  Pencil,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { CSModal } from "@/components/customer-service/CSModal";
import {
  getCustomers,
  getCustomerStats,
  getCustomer360ById,
  createCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfile,
  getCustomerDropdownMeta,
  CustomerListItem,
  CustomerStats,
  CustomerDetail,
  CustomerDropdownMeta,
} from "@/services/customerService";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useUserAccess } from "@/context/UserAccessContext";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function Customer360Page() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId } = useSelectedProject();
  const { hasAccessToRoute } = useUserAccess();
  const canWrite = hasAccessToRoute("customer-service", "customers");

  // Tab & search states
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Data states (100% snake_case)
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_clients: 0,
    vip_clients: 0,
    total_lifetime_collections: 0,
    total_lifetime_collections_formatted: "৳ 0.00",
  });
  const [dropdownMeta, setDropdownMeta] = useState<CustomerDropdownMeta>({
    customer_statuses: [],
    nominee_relations: [],
  });

  // UI interaction states
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [customer360Data, setCustomer360Data] = useState<CustomerDetail | null>(
    null,
  );
  const [customerToDelete, setCustomerToDelete] =
    useState<CustomerListItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerListItem | null>(null);
  const searchReqIdRef = useRef(0);

  // Form states (snake_case mappings)
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNid, setFormNid] = useState("");
  const [formTin, setFormTin] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNomineeName, setFormNomineeName] = useState("");
  const [formNomineeRelation, setFormNomineeRelation] = useState("Spouse");
  const [formNomineeNid, setFormNomineeNid] = useState("");
  const [formStatus, setFormStatus] = useState<
    "active" | "vip" | "disputed" | "closed"
  >("active");

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load dropdown options dynamically from backend API (no hardcoding)
  const loadDropdownMeta = useCallback(async () => {
    try {
      const meta = await getCustomerDropdownMeta();
      setDropdownMeta(meta);
      if (meta.nominee_relations.length > 0 && !formNomineeRelation) {
        setFormNomineeRelation(meta.nominee_relations[0].value);
      }
      if (meta.customer_statuses.length > 0 && !formStatus) {
        setFormStatus(
          meta.customer_statuses[0].value as
          "active" | "vip" | "disputed" | "closed",
        );
      }
    } catch (err) {
      console.warn("Failed to load customer dropdown meta:", err);
    }
  }, [formNomineeRelation, formStatus]);

  // Independent fetch: Overview KPI Statistics (single SQL aggregation with deleted count)
  const loadOverviewStats = useCallback(async () => {
    try {
      const statsRes = await getCustomerStats(projectId || undefined);
      setStats(statsRes);
      if (statsRes.deleted_clients !== undefined) {
        setDeletedCount(statsRes.deleted_clients);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to load customer stats";
      console.error("Customer stats error:", msg);
    }
  }, [projectId]);

  // Independent fetch: Customer Profiles List with sequence-guarded race condition prevention
  const loadCustomersList = useCallback(
    async (
      searchQuery?: string,
      statusFilter?: string,
      mode?: "active" | "deleted",
    ) => {
      const currentReqId = ++searchReqIdRef.current;
      setIsTableLoading(true);

      try {
        const isDeleted = (mode ?? recordsTab) === "deleted";
        const currentStatus =
          !isDeleted && (statusFilter ?? activeTab) !== "all"
            ? (statusFilter ?? activeTab)
            : undefined;

        const res = await getCustomers({
          search:
            (searchQuery !== undefined ? searchQuery : debouncedSearch) ||
            undefined,
          status: currentStatus,
          is_deleted: isDeleted,
          project_id:
            projectId && projectId !== "all" ? projectId : undefined,
        });

        // Discard stale responses if a newer request was dispatched
        if (currentReqId !== searchReqIdRef.current) return;

        setCustomers(res.items || []);
        setLoadError(null);
      } catch (err: unknown) {
        if (currentReqId !== searchReqIdRef.current) return;

        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as Error)?.message ||
          "Failed to load customer profiles";
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
    [activeTab, debouncedSearch, recordsTab, projectId],
  );

  // Initial load: Fetch overview KPI stats and dropdown metadata once
  useEffect(() => {
    loadOverviewStats();
    loadDropdownMeta();
  }, [loadOverviewStats, loadDropdownMeta]);

  // Tab, search, or project changes: Fetch customer list
  useEffect(() => {
    loadCustomersList(debouncedSearch, activeTab, recordsTab);
  }, [debouncedSearch, activeTab, recordsTab, projectId, loadCustomersList]);

  // Manual refresh: reload customer list, KPI stats, and metadata concurrently
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadCustomersList(debouncedSearch, activeTab, recordsTab),
        loadOverviewStats(),
        loadDropdownMeta(),
      ]);
      toast.success("Customer profiles synchronized");
    } catch {
      toast.error("Failed to refresh records");
    } finally {
      setIsRefreshing(false);
    }
  };

  // View Customer 360 Drawer
  const handleViewCustomer = async (c: CustomerListItem) => {
    setSelectedCustomer(c);
    setCustomer360Data(null);

    if (c.uuid) {
      setIsDrawerLoading(true);
      try {
        const details = await getCustomer360ById(c.uuid);
        setCustomer360Data(details);
      } catch (err) {
        console.warn(
          "Could not load deep 360 ledger details, falling back to row summary",
          err,
        );
      } finally {
        setIsDrawerLoading(false);
      }
    }
  };

  // Create new customer profile using snake_case payload
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formNid.trim()) {
      toast.error("Please enter Name, Phone and NID");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCustomerProfile({
        customer_name: formName.trim(),
        phone_number: formPhone.trim(),
        nid_number: formNid.trim(),
        email: formEmail.trim() || undefined,
        tin_number: formTin.trim() || undefined,
        address: formAddress.trim() || undefined,
        nominee_name: formNomineeName.trim() || undefined,
        nominee_relation: formNomineeRelation,
        nominee_nid: formNomineeNid.trim() || undefined,
        customer_status: formStatus,
        project_id:
          projectId && projectId !== "all" ? projectId : undefined,
      });

      toast.success(
        `Customer profile for ${created.customer_name} created successfully`,
      );
      setIsCreateOpen(false);

      // Reset form fields
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormNid("");
      setFormTin("");
      setFormAddress("");
      setFormNomineeName("");
      setFormNomineeRelation(
        dropdownMeta.nominee_relations[0]?.value || "Spouse",
      );
      setFormNomineeNid("");
      setFormStatus("active");

      // Reload dataset and KPI stats concurrently
      await Promise.all([
        loadCustomersList(debouncedSearch, activeTab, recordsTab),
        loadOverviewStats(),
      ]);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to create customer profile";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal and populate existing values
  const handleOpenEdit = (customer: CustomerListItem) => {
    setEditingCustomer(customer);
    setFormName(customer.customer_name || "");
    setFormPhone(customer.phone_number || "");
    setFormEmail(
      customer.email && customer.email !== "N/A" ? customer.email : "",
    );
    setFormNid(customer.nid_number || "");
    setFormTin(customer.tin_number || "");
    setFormAddress(customer.address || "");
    setFormNomineeName(customer.nominee_name || "");
    setFormNomineeRelation(customer.nominee_relation || "Spouse");
    setFormNomineeNid(customer.nominee_nid || "");
    setFormStatus(
      (customer.customer_status || "active") as
      "active" | "vip" | "disputed" | "closed",
    );
  };

  // Update existing customer profile
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.uuid) return;
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Customer Name and Phone Number are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCustomerProfile(editingCustomer.uuid, {
        customer_name: formName.trim(),
        phone_number: formPhone.trim(),
        email: formEmail.trim() || undefined,
        nid_number: formNid.trim() || undefined,
        tin_number: formTin.trim() || undefined,
        address: formAddress.trim() || undefined,
        nominee_name: formNomineeName.trim() || undefined,
        nominee_relation: formNomineeRelation || undefined,
        nominee_nid: formNomineeNid.trim() || undefined,
        customer_status: formStatus,
      });
      toast.success(`Customer profile for ${formName} updated successfully`);
      setEditingCustomer(null);
      await Promise.all([
        loadCustomersList(debouncedSearch, activeTab, recordsTab),
        loadOverviewStats(),
      ]);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to update customer profile";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft delete confirmation & execution
  const handleDeleteCustomer = async () => {
    if (!customerToDelete?.uuid) return;
    setIsDeleting(true);
    try {
      await deleteCustomerProfile(customerToDelete.uuid);
      toast.success(
        `Customer profile for ${customerToDelete.customer_name} deleted`,
      );
      setCustomerToDelete(null);
      // Reload dataset and KPI stats concurrently
      await Promise.all([
        loadCustomersList(debouncedSearch, activeTab, recordsTab),
        loadOverviewStats(),
      ]);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to delete customer profile";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Table columns definition with snake_case fields
  const columns: Column<CustomerListItem>[] = [
    {
      key: "customer_name",
      header: "CUSTOMER NAME & CODE",
      sortable: true,
      minWidth: "220px",
      render: (c) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">
            {c.customer_name}
          </div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {c.customer_code || c.id}
          </div>
        </div>
      ),
    },
    {
      key: "phone_number",
      header: "CONTACT",
      minWidth: "190px",
      render: (c) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#374151] tabular-nums font-medium">
            <Phone className="h-3 w-3 text-[#9CA3AF]" /> {c.phone_number}
          </div>
          {c.email && c.email !== "N/A" && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Mail className="h-3 w-3 text-[#9CA3AF]" /> {c.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "nid_number",
      header: "NID / TIN",
      minWidth: "160px",
      render: (c) => (
        <div>
          <div className="tabular-nums text-xs font-medium text-[#111827]">
            {c.nid_number}
          </div>
          {c.tin_number && (
            <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
              TIN: {c.tin_number}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "nominee_name",
      header: "NOMINEE",
      minWidth: "160px",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-[#111827]">
            {c.nominee_name}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            ({c.nominee_relation})
          </div>
        </div>
      ),
    },
    {
      key: "total_paid_amount",
      header: "FINANCIALS",
      sortable: true,
      minWidth: "180px",
      render: (c) => (
        <div className="space-y-1 tabular-nums">
          <div className="text-xs font-semibold text-[#039855]">
            Paid: ৳ {(Number(c.total_paid_amount) / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Due: ৳ {(Number(c.total_due_amount) / 100000).toFixed(1)} Lac
          </div>
        </div>
      ),
    },
    {
      key: "customer_status",
      header: "STATUS",
      minWidth: "120px",
      render: (c) => {
        if (c.deleted_at || recordsTab === "deleted") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border bg-red-50 text-red-700 border-red-200">
              Soft Deleted
            </span>
          );
        }
        const s = (c.customer_status || "active").toLowerCase();
        let badgeStyle = "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]";
        if (s === "vip")
          badgeStyle = "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
        else if (s === "disputed")
          badgeStyle = "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
        else if (s === "closed")
          badgeStyle = "bg-[#F8F9FC] text-[#344054] border-[#D0D5DD]";

        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${badgeStyle}`}
          >
            {s}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "130px",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleViewCustomer(c)}
            title="View Customer Profile"
            aria-label="View Customer Profile"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition shadow-xs cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          {recordsTab === "active" ? (
            <>
              <button
                type="button"
                onClick={() => handleOpenEdit(c)}
                title="Edit Customer Profile"
                aria-label="Edit Customer Profile"
                disabled={!canWrite}
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] hover:bg-[#EDE9FE] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCustomerToDelete(c)}
                title="Delete Customer Profile (Soft Delete)"
                aria-label="Delete Customer Profile"
                disabled={!canWrite}
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Soft Deleted
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Customer Entry"
        subtitle="Master customer directory, nominee KYC, property holdings, and live collections ledger."
        badge="Post-Sales CRM"
        breadcrumbs={[
          { label: "Customers & Properties" },
          { label: "Customer Entry" },
        ]}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Add Customer Profile",
          onClick: () => setIsCreateOpen(true),
          icon: Plus,
        }}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Registered Clients"
          value={stats.total_clients.toString()}
          subtext="With active apartment / plot bookings"
          icon={Users}
        />
        <CSStatCard
          title="VIP Clients"
          value={stats.vip_clients.toString()}
          subtext="High-value multi-unit portfolios"
          icon={UserCheck}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Total Lifetime Collections"
          value={stats.total_lifetime_collections_formatted}
          subtext="Verified money receipts ledger"
          icon={Building}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Records Mode Switcher: Active Records vs Deleted Records */}
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
              {stats.total_clients}
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
            {deletedCount > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${recordsTab === "deleted"
                    ? "bg-[#FEF2F2] text-[#DC2626]"
                    : "bg-[#E5E7EB] text-[#4B5563]"
                  }`}
              >
                {deletedCount}
              </span>
            )}
          </button>
        </div>

        {/* 400ms Debounced Server Search Control */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, NID, code..."
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs text-[#111827] placeholder-[#9CA3AF] shadow-xs outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
          />
        </div>
      </div>

      {/* Active Sub-filter Tabs (Shown only on Active Records) */}
      {recordsTab === "active" && (
        <CSFilterTabs
          tabs={[
            { key: "all", label: "All Customers", count: stats.total_clients },
            {
              key: "vip",
              label: "VIP Clients",
              count: stats.vip_clients,
            },
            {
              key: "active",
              label: "Active Regular",
              count:
                stats.active_clients ??
                Math.max(0, stats.total_clients - stats.vip_clients),
            },
            {
              key: "disputed",
              label: "Flagged / Disputed",
              count: stats.disputed_clients ?? 0,
              badgeVariant: "danger",
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Table Section with Loading Skeleton, Error State, & CSTable */}
      {isLoading ? (
        <div className="w-full h-72 rounded-[12px] border border-[#E5E7EB] bg-white p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D4AFF]" />
          <p className="text-xs text-[#6B7280]">Loading Customer Profiles...</p>
        </div>
      ) : loadError && customers.length === 0 ? (
        <div className="w-full rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-[#DC2626]" />
          <h3 className="text-sm font-semibold text-[#991B1B]">
            Failed to Load Customer Profiles
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
          <div className="[&_.w-64.sm\\:w-72]:hidden [&_.relative.w-64]:hidden">
            <CSTable
              data={customers}
              columns={columns}
              searchFields={[]}
              emptyTitle={
                recordsTab === "deleted"
                  ? "No deleted customer records found"
                  : "No customers match this filter"
              }
              emptySubtitle={
                recordsTab === "deleted"
                  ? "Soft-deleted customer profiles will appear here."
                  : "Try adjusting your search criteria or switch tabs to see other customer records."
              }
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      )}

      {/* Slide-over Customer Profile Drawer */}
      <CSDetailDrawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => {
          setSelectedCustomer(null);
          setCustomer360Data(null);
        }}
        title={selectedCustomer?.customer_name || "Customer Profile"}
        badge={selectedCustomer?.customer_status?.toUpperCase()}
        subtitle={`Code: ${selectedCustomer?.customer_code || selectedCustomer?.id} | Enrolled: ${selectedCustomer?.joined_date}`}
        width="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 text-xs">
            {isDrawerLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Synchronizing live property ledger and bookings...</span>
              </div>
            )}

            {/* Contact & KYC Details */}
            <div className="rounded-[12px] border border-[#E5E7EB] p-4 space-y-3 bg-[#F9FAFB]">
              <h4 className="font-semibold text-[#111827] text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#6D4AFF]" /> Verified KYC &
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-[#374151]">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Primary Phone
                  </span>
                  <span className="font-semibold tabular-nums text-[#111827]">
                    {customer360Data?.kyc.primary_phone ||
                      selectedCustomer.phone_number}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Email Address
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {customer360Data?.kyc.email ||
                      selectedCustomer.email ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    National ID (NID)
                  </span>
                  <span className="font-semibold tabular-nums text-[#111827]">
                    {customer360Data?.kyc.nid_number ||
                      selectedCustomer.nid_number}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    e-TIN Number
                  </span>
                  <span className="font-semibold tabular-nums text-[#111827]">
                    {customer360Data?.kyc.tin_number ||
                      selectedCustomer.tin_number ||
                      "Not Provided"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6B7280] block text-[11px]">
                    Mailing Address
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {customer360Data?.kyc.mailing_address ||
                      selectedCustomer.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Nominee Details */}
            <div className="rounded-[12px] border border-[#E5E7EB] p-4 space-y-3 bg-[#F9FAFB]">
              <h4 className="font-semibold text-[#111827] text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#6D4AFF]" /> Registered Nominee
                Record
              </h4>
              <div className="grid grid-cols-3 gap-3 text-[#374151]">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Nominee Name
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {customer360Data?.nominee.nominee_name ||
                      selectedCustomer.nominee_name}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Relation
                  </span>
                  <span className="font-semibold text-[#111827]">
                    {customer360Data?.nominee.nominee_relation ||
                      selectedCustomer.nominee_relation}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">
                    Nominee NID
                  </span>
                  <span className="font-semibold tabular-nums text-[#111827]">
                    {customer360Data?.nominee.nominee_nid ||
                      selectedCustomer.nominee_nid}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-[12px] bg-[#ECFDF3] border border-[#A6F4C5] text-center">
                <span className="text-[11px] font-medium text-[#027A48] block">
                  Total Paid
                </span>
                <span className="text-sm font-bold text-[#027A48] tabular-nums mt-0.5 block">
                  ৳{" "}
                  {(
                    Number(
                      customer360Data?.financial_summary.total_paid_amount ||
                      selectedCustomer.total_paid_amount,
                    ) / 100000
                  ).toFixed(2)}{" "}
                  Lac
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#FEF3F2] border border-[#FECDCA] text-center">
                <span className="text-[11px] font-medium text-[#B42318] block">
                  Total Due
                </span>
                <span className="text-sm font-bold text-[#B42318] tabular-nums mt-0.5 block">
                  ৳{" "}
                  {(
                    Number(
                      customer360Data?.financial_summary.total_due_amount ||
                      selectedCustomer.total_due_amount,
                    ) / 100000
                  ).toFixed(2)}{" "}
                  Lac
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#F4F1FF] border border-[#DDD6FE] text-center">
                <span className="text-[11px] font-medium text-[#6D4AFF] block">
                  Property Holdings
                </span>
                <span className="text-sm font-bold text-[#6D4AFF] tabular-nums mt-0.5 block">
                  {customer360Data?.financial_summary.total_bookings ??
                    selectedCustomer.total_bookings}{" "}
                  Units
                </span>
              </div>
            </div>

            {/* Associated Property Bookings List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-[#111827] text-sm flex items-center gap-2">
                <Building className="h-4 w-4 text-[#6D4AFF]" /> Apartment & Plot
                Bookings
              </h4>
              {customer360Data?.bookings &&
                customer360Data.bookings.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customer360Data.bookings.map((b) => (
                    <div
                      key={b.uuid}
                      className="p-3 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#111827] text-xs">
                          {b.project_name}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          Booking Ref: {b.booking_id} | Date: {b.booking_date}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="font-semibold text-xs text-[#111827]">
                          ৳ {(b.grand_total / 100000).toFixed(2)} Lac
                        </div>
                        <div className="text-[11px] text-[#039855]">
                          Paid: ৳ {(b.paid_amount / 100000).toFixed(2)} Lac
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-[#D1D5DB] text-center text-[#6B7280] text-xs">
                  No linked apartment or plot agreements found for this profile.
                </div>
              )}
            </div>
          </div>
        )}
      </CSDetailDrawer>

      {/* Add Customer Modal Form */}
      <CSModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Customer Entry"
        subtitle="Create an official customer master record with KYC and nominee data."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mohammad Rafiqul Islam"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Primary Phone Number *
              </label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+880 1711-234567"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                National ID (NID) *
              </label>
              <input
                type="text"
                required
                value={formNid}
                onChange={(e) => setFormNid(e.target.value)}
                placeholder="NID or Smart Card number"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                e-TIN Reference
              </label>
              <input
                type="text"
                value={formTin}
                onChange={(e) => setFormTin(e.target.value)}
                placeholder="Optional e-TIN"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Customer Status
              </label>
              <select
                value={formStatus}
                onChange={(e) =>
                  setFormStatus(
                    e.target.value as "active" | "vip" | "disputed" | "closed",
                  )
                }
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none bg-white"
              >
                {dropdownMeta.customer_statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Mailing Address
            </label>
            <textarea
              rows={2}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Full mailing or present address..."
              className="w-full rounded-lg border border-[#E5E7EB] p-2.5 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
            <h5 className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#6D4AFF]" /> Nominee / Next of
              Kin Information
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Nominee Full Name
                </label>
                <input
                  type="text"
                  value={formNomineeName}
                  onChange={(e) => setFormNomineeName(e.target.value)}
                  placeholder="Nominee Name"
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Relationship
                </label>
                <select
                  value={formNomineeRelation}
                  onChange={(e) => setFormNomineeRelation(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                >
                  {dropdownMeta.nominee_relations.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Nominee NID / Birth Cert
                </label>
                <input
                  type="text"
                  value={formNomineeNid}
                  onChange={(e) => setFormNomineeNid(e.target.value)}
                  placeholder="Nominee NID"
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-[#6D4AFF] text-white text-xs font-semibold hover:bg-[#5B3CE0] transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Customer Record</span>
            </button>
          </div>
        </form>
      </CSModal>

      {/* Delete Confirmation Modal */}
      <CSModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        title="Delete Customer Profile"
        subtitle="This action will soft-delete the profile. You can view it under Deleted Records."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-[#374151]">
          <p>
            Are you sure you want to delete the customer profile for{" "}
            <span className="font-semibold text-[#111827]">
              {customerToDelete?.customer_name}
            </span>{" "}
            ({customerToDelete?.customer_code || customerToDelete?.id})?
          </p>
          <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-[11px]">
            The customer will be removed from Active Records. In accordance with
            audit compliance, records are preserved via soft delete. No hard
            delete is performed.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCustomerToDelete(null)}
              className="h-8 px-3.5 rounded-lg border border-[#E5E7EB] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteCustomer}
              className="h-8 px-4 rounded-lg bg-[#DC2626] text-white font-semibold hover:bg-[#B91C1C] transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm Delete</span>
            </button>
          </div>
        </div>
      </CSModal>

      {/* Edit Customer Profile Modal */}
      <CSModal
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        title="Edit Customer Profile"
        subtitle="Update resident details, nominee KYC, contact info, and status"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mohammad Rafiqul Islam"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Primary Phone Number *
              </label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+880 1711-234567"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                National ID (NID)
              </label>
              <input
                type="text"
                value={formNid}
                onChange={(e) => setFormNid(e.target.value)}
                placeholder="NID or Smart Card number"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                e-TIN Reference
              </label>
              <input
                type="text"
                value={formTin}
                onChange={(e) => setFormTin(e.target.value)}
                placeholder="Optional e-TIN"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Customer Status
              </label>
              <select
                value={formStatus}
                onChange={(e) =>
                  setFormStatus(
                    e.target.value as "active" | "vip" | "disputed" | "closed",
                  )
                }
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none bg-white"
              >
                {dropdownMeta.customer_statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Mailing Address
            </label>
            <textarea
              rows={2}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Full mailing or present address..."
              className="w-full rounded-lg border border-[#E5E7EB] p-2.5 text-xs text-[#111827] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
            <h5 className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#6D4AFF]" /> Nominee / Next of
              Kin Information
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Nominee Full Name
                </label>
                <input
                  type="text"
                  value={formNomineeName}
                  onChange={(e) => setFormNomineeName(e.target.value)}
                  placeholder="Nominee Name"
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Relationship
                </label>
                <select
                  value={formNomineeRelation}
                  onChange={(e) => setFormNomineeRelation(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                >
                  {dropdownMeta.nominee_relations.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Nominee NID / Birth Cert
                </label>
                <input
                  type="text"
                  value={formNomineeNid}
                  onChange={(e) => setFormNomineeNid(e.target.value)}
                  placeholder="Nominee NID"
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#111827] bg-white outline-none focus:border-[#6D4AFF]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-[#6D4AFF] text-white text-xs font-semibold hover:bg-[#5B3CE0] transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
