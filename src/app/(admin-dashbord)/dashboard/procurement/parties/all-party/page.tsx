"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Home,
  Plus,
  Search,
  Eye,
  SquarePen,
  Trash2,
  Calendar,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Phone,
  Mail,
  Building2,
  FileText,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Archive,
  MapPin,
  ShieldCheck,
  CreditCard,
  Paperclip,
  Upload,
  ExternalLink,
} from "lucide-react";
import {
  procurementPartyApi,
  BackendParty,
  PartyType,
  PartyBusinessType,
  PartyStatus,
  CreatePartyPayload,
  PartyDropdownsResult,
} from "@/lib/procurement";

// Table Headers Definition matching ERP specification
const TABLE_HEADERS = [
  { key: "code", label: "Code", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "phone", label: "Phone", sortable: true },
  { key: "tradeLicense", label: "Trade License", sortable: false },
  { key: "nid", label: "NID", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "action", label: "Action", sortable: false },
];

const INITIAL_FORM_DATA: CreatePartyPayload = {
  name: "",
  type: PartyType.CONTRACTOR,
  contactPerson: "",
  phone: "",
  email: "",
  whatsapp: "",
  isActive: true,
  address: "",
  city: "",
  state: "",
  country: "",
  tradeLicenseNo: "",
  tradeLicenseExpiry: "",
  nidNo: "",
  tinNo: "",
  binNo: "",
  ownerName: "",
  businessType: "",
  bankName: "",
  accountNo: "",
  branch: "",
  accountingGroup: "",
  payableAccount: "",
  notes: "",
  status: PartyStatus.ACTIVE,
  documents: [],
};

export default function AllPartyPage() {
  // ---------------------------------------------------------------------------
  // Data States
  // ---------------------------------------------------------------------------
  const [parties, setParties] = useState<BackendParty[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Stale request race-condition guard
  const requestIdRef = useRef(0);

  // Separate Active and Deleted Tabs
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");
  const [activeCount, setActiveCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Filter States matching the screenshot
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSortOrder, setSelectedSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dropdown options from backend
  const [dropdowns, setDropdowns] = useState<PartyDropdownsResult>({
    types: Object.values(PartyType),
    businessTypes: Object.values(PartyBusinessType),
    statuses: Object.values(PartyStatus),
    accountingGroups: [],
    payableAccounts: [],
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewParty, setViewParty] = useState<BackendParty | null>(null);
  const [editParty, setEditParty] = useState<BackendParty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendParty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Tab State: "general" | "address" | "legal" | "banking" | "documents"
  const [formActiveTab, setFormActiveTab] = useState<
    "general" | "address" | "legal" | "banking" | "documents"
  >("general");

  // View Modal Tab State
  const [viewActiveTab, setViewActiveTab] = useState<
    "general" | "address" | "legal" | "banking" | "documents"
  >("general");

  // Form Data State
  const [formData, setFormData] = useState<CreatePartyPayload>(INITIAL_FORM_DATA);

  // Attachment upload helper state
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocFile, setNewDocFile] = useState("");
  const [newDocFileName, setNewDocFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Keyboard accessibility: Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCreateModal(false);
        setViewParty(null);
        setEditParty(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search Debounce (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Dropdowns from real API
  useEffect(() => {
    (async () => {
      try {
        const data = await procurementPartyApi.getDropdowns();
        setDropdowns(data);
      } catch (err) {
        console.warn("Could not load party dropdowns:", err);
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Load Parties from Backend API
  // ---------------------------------------------------------------------------
  const loadParties = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      if (recordsTab === "deleted") {
        const res = await procurementPartyApi.list({
          page: currentPage,
          limit: entriesPerPage,
          search: debouncedSearch.trim() || undefined,
          type: selectedType || undefined,
          status: selectedStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sortOrder: selectedSortOrder,
          deleted_only: true,
        });

        if (currentRequestId !== requestIdRef.current) return;

        setParties(res.data);
        setTotalEntries(res.meta.total);
        setTotalPages(res.meta.totalPages);
        setDeletedCount(res.meta.total);
      } else {
        const [activeRes, deletedRes] = await Promise.allSettled([
          procurementPartyApi.list({
            page: currentPage,
            limit: entriesPerPage,
            search: debouncedSearch.trim() || undefined,
            type: selectedType || undefined,
            status: selectedStatus || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sortOrder: selectedSortOrder,
          }),
          procurementPartyApi.list({
            limit: 1,
            deleted_only: true,
          }),
        ]);

        if (currentRequestId !== requestIdRef.current) return;

        if (activeRes.status === "fulfilled") {
          setParties(activeRes.value.data);
          setTotalEntries(activeRes.value.meta.total);
          setTotalPages(activeRes.value.meta.totalPages);
          setActiveCount(activeRes.value.meta.total);
        } else {
          throw activeRes.reason;
        }

        if (deletedRes.status === "fulfilled") {
          setDeletedCount(deletedRes.value.meta.total);
        }
      }
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load parties from server.";
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    recordsTab,
    currentPage,
    entriesPerPage,
    debouncedSearch,
    selectedType,
    selectedStatus,
    selectedSortOrder,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // Client sort handling
  const handleSort = (key: string) => {
    if (key === sortField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(key);
      setSortOrder("ASC");
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedType("");
    setSelectedStatus("");
    setSelectedSortOrder("DESC");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // ---------------------------------------------------------------------------
  // Create / Edit Party Handlers
  // ---------------------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setNewDocTitle("");
    setNewDocFile("");
    setNewDocFileName("");
    setFormActiveTab("general");
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = async (party: BackendParty) => {
    setEditParty(party);
    setFormActiveTab("general");
    setFormError(null);
    setNewDocTitle("");
    setNewDocFile("");
    setNewDocFileName("");

    // Populate initial form data from row
    setFormData({
      name: party.name || "",
      type: party.type || PartyType.CONTRACTOR,
      contactPerson: party.contactPerson || "",
      phone: party.phone || "",
      email: party.email || "",
      whatsapp: party.whatsapp || "",
      isActive: party.isActive ?? true,
      address: party.address || "",
      city: party.city || "",
      state: party.state || "",
      country: party.country || "",
      tradeLicenseNo: party.tradeLicenseNo || "",
      tradeLicenseExpiry: party.tradeLicenseExpiry || "",
      nidNo: party.nidNo || "",
      tinNo: party.tinNo || "",
      binNo: party.binNo || "",
      ownerName: party.ownerName || "",
      businessType: party.businessType || "",
      bankName: party.bankName || "",
      accountNo: party.accountNo || "",
      branch: party.branch || "",
      accountingGroup: party.accountingGroup || "",
      payableAccount: party.payableAccount || "",
      notes: party.notes || "",
      status: (party.status as PartyStatus) || PartyStatus.ACTIVE,
      documents: party.documents
        ? party.documents.map((d) => ({
            title: d.title,
            file: d.file,
            id: String(d.id || ""),
            uuid: d.uuid,
          }))
        : [],
    });

    // Fetch fresh complete details from backend (including documents)
    try {
      const full = await procurementPartyApi.getById(party.uuid);
      if (full) {
        setFormData({
          name: full.name || "",
          type: full.type || PartyType.CONTRACTOR,
          contactPerson: full.contactPerson || "",
          phone: full.phone || "",
          email: full.email || "",
          whatsapp: full.whatsapp || "",
          isActive: full.isActive ?? true,
          address: full.address || "",
          city: full.city || "",
          state: full.state || "",
          country: full.country || "",
          tradeLicenseNo: full.tradeLicenseNo || "",
          tradeLicenseExpiry: full.tradeLicenseExpiry || "",
          nidNo: full.nidNo || "",
          tinNo: full.tinNo || "",
          binNo: full.binNo || "",
          ownerName: full.ownerName || "",
          businessType: full.businessType || "",
          bankName: full.bankName || "",
          accountNo: full.accountNo || "",
          branch: full.branch || "",
          accountingGroup: full.accountingGroup || "",
          payableAccount: full.payableAccount || "",
          notes: full.notes || "",
          status: (full.status as PartyStatus) || PartyStatus.ACTIVE,
          documents: full.documents
            ? full.documents.map((d) => ({
                title: d.title,
                file: d.file,
                id: String(d.id || ""),
                uuid: d.uuid,
              }))
            : [],
        });
      }
    } catch (err) {
      console.warn("Could not fetch full party details for edit:", err);
    }
  };

  const handleOpenViewModal = async (party: BackendParty) => {
    setViewParty(party);
    setViewActiveTab("general");
    try {
      const full = await procurementPartyApi.getById(party.uuid);
      if (full) {
        setViewParty(full);
      }
    } catch (err) {
      console.warn("Could not fetch complete party details for view:", err);
    }
  };

  // Document Attachment Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDocFileName(file.name);
    if (!newDocTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setNewDocTitle(cleanName);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewDocFile(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = () => {
    if (!newDocTitle.trim()) {
      showToast("Document title is required.", "error");
      return;
    }
    if (!newDocFile.trim()) {
      showToast("Please choose a file or enter a valid file URL.", "error");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      documents: [
        ...(prev.documents || []),
        { title: newDocTitle.trim(), file: newDocFile.trim() },
      ],
    }));

    setNewDocTitle("");
    setNewDocFile("");
    setNewDocFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Document attached to list", "info");
  };

  const handleRemoveDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError("Party Name is required.");
      setFormActiveTab("general");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editParty) {
        await procurementPartyApi.update(editParty.uuid, formData);
        showToast(`Party #${editParty.code} updated successfully`, "success");
        setEditParty(null);
      } else {
        const created = await procurementPartyApi.create(formData);
        showToast(`Party #${created.code} created successfully`, "success");
        setShowCreateModal(false);
      }
      await loadParties();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save party profile.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Handler
  // ---------------------------------------------------------------------------
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await procurementPartyApi.delete(deleteTarget.uuid);
      showToast(`Party #${deleteTarget.code} deleted successfully`, "success");
      setDeleteTarget(null);
      await loadParties();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete party.";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper date formatter
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const startIdx = (currentPage - 1) * entriesPerPage;

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#374151] dark:text-slate-100 font-sans transition-colors duration-140 overflow-x-hidden flex flex-col justify-between">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-[6px] shadow-[0_8px_24px_rgba(16,24,40,0.12)] border text-[13px] font-medium backdrop-blur-xs transition-all duration-150 animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900"
              : toast.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Page Container: 24px desktop, 16px mobile padding, unified alignment, 112px bottom padding clearing chat widget */}
      <div className="w-full max-w-[1680px] mx-auto px-4 py-6 sm:px-6 space-y-6 pb-28">
        {/* =========================================================================
            HEADER & TOP BAR: Title, Description, Breadcrumbs & Active/Deleted Switch
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#111827] dark:text-slate-100">
              Parties
            </h1>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-0.5">
              Directory of contractors, suppliers, vendors, and clients with attached documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Breadcrumb: Home / Default / Parties */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-slate-400"
            >
              <Link
                href="/dashboard"
                className="text-[#6B7280] hover:text-[#6D4AFF] dark:hover:text-violet-400 transition-colors duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] rounded-sm"
                title="Dashboard Home"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[#9CA3AF] dark:text-slate-600">/</span>
              <span>Default</span>
              <span className="text-[#9CA3AF] dark:text-slate-600">/</span>
              <span className="font-medium text-[#111827] dark:text-slate-200">
                Parties
              </span>
            </nav>

            {/* Separate Active / Deleted Segmented Control */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F2F4F7] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setRecordsTab("active");
                  setCurrentPage(1);
                }}
                className={`h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                  recordsTab === "active"
                    ? "bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 shadow-[0_1px_2px_rgba(16,24,40,0.06)] font-semibold"
                    : "text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
                }`}
              >
                <span>Active</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${
                    recordsTab === "active"
                      ? "bg-[#E5E7EB] text-[#344054] dark:bg-slate-700 dark:text-slate-200"
                      : "bg-[#E5E7EB]/70 text-[#6B7280] dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecordsTab("deleted");
                  setCurrentPage(1);
                }}
                className={`h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                  recordsTab === "deleted"
                    ? "bg-white dark:bg-slate-900 text-[#B42318] dark:text-rose-400 shadow-[0_1px_2px_rgba(16,24,40,0.06)] font-semibold"
                    : "text-[#6B7280] dark:text-slate-400 hover:text-[#B42318] dark:hover:text-rose-400"
                }`}
              >
                <Trash2 className="w-3 h-3" />
                <span>Deleted</span>
                {deletedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60">
                    {deletedCount}
                  </span>
                )}
              </button>
            </div>

            {/* Primary Action Button: + Create New Party (Prominently visible in Header) */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
              className="h-8 sm:h-9 px-3.5 rounded-lg text-xs sm:text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 active:translate-y-[0.5px] flex items-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 shadow-xs shrink-0"
              title="Create New Party"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Create New Party</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            FILTER CARD: Uniform 36px Controls in One Responsive CSS Grid (1/2/4 cols, gap 12px)
            ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* 1. + Create New Party Button (Tactile Deep Electric Violet #6D4AFF) */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                className="w-full h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 active:translate-y-[0.5px] flex items-center justify-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Create New Party</span>
              </button>
            </div>

            {/* 2. Search by name | phone | code */}
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name | phone | code..."
                className="w-full h-9 pl-8 pr-7 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-colors duration-140"
              />
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3. Stat By Type */}
            <div className="relative w-full">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] appearance-none transition-colors duration-140 cursor-pointer"
              >
                <option value="">-- Stat By Type --</option>
                {dropdowns.types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
            </div>

            {/* 4. Status */}
            <div className="relative w-full">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] appearance-none transition-colors duration-140 cursor-pointer"
              >
                <option value="">-- Status --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
            </div>

            {/* 5. Sort By Date */}
            <div className="relative w-full">
              <select
                value={selectedSortOrder}
                onChange={(e) => {
                  setSelectedSortOrder(e.target.value as "ASC" | "DESC");
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] appearance-none transition-colors duration-140 cursor-pointer"
              >
                <option value="DESC">-- Sort By Date (Newest) --</option>
                <option value="ASC">-- Sort By Date (Oldest) --</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
            </div>

            {/* 6. Start Date */}
            <div className="relative w-full">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Start Date"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-colors duration-140"
              />
            </div>

            {/* 7. End Date */}
            <div className="relative w-full">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="End Date"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-colors duration-140"
              />
            </div>

            {/* 8. Filter & Reset Buttons */}
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => loadParties()}
                style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                className="flex-1 h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 active:translate-y-[0.5px] flex items-center justify-center gap-1.5 transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 shadow-xs"
              >
                <Search className="w-3.5 h-3.5 stroke-[2]" />
                <span>Filter</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Filters"
                aria-label="Reset Filters"
                className="h-9 w-9 min-w-[36px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white hover:bg-[#F9FAFB] dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-center text-[#4B5563] hover:text-[#111827] dark:hover:text-slate-100 active:translate-y-[0.5px] transition-all duration-140 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DATA TABLE CARD: High-density, calm, and readable per Table Spec
            ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden transition-colors">
          {/* Controls Bar: 56px high, select 32px tall, refresh button 32x32 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 h-14 px-4 border-b border-[#E5E7EB] dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-slate-400">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#374151] dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1 cursor-pointer"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadParties()}
                disabled={isLoading}
                title="Refresh table"
                className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-[#4B5563] hover:text-[#111827] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:text-white transition-colors duration-140 cursor-pointer disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-violet-600" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="p-3.5 bg-[#FEF3F2] dark:bg-rose-950/40 border-b border-[#FECDCA] dark:border-rose-900 text-[#B42318] dark:text-rose-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadParties()}
                className="px-3 py-1 rounded-lg bg-[#D92D20] text-white hover:bg-[#B42318] text-xs font-medium cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container (Internal horizontal scroll, no page overflow) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#E9E5FF] dark:bg-slate-800 border-b-2 border-[#C9BFFF] dark:border-slate-700 select-none h-[46px]">
                  {TABLE_HEADERS.map((h) => {
                    const isSorted = sortField === h.key;
                    const isAction = h.key === "action";
                    return (
                      <th
                        key={h.key}
                        onClick={() => h.sortable && handleSort(h.key)}
                        onKeyDown={(e) => {
                          if (h.sortable && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            handleSort(h.key);
                          }
                        }}
                        tabIndex={h.sortable ? 0 : undefined}
                        aria-sort={
                          h.sortable
                            ? isSorted
                              ? sortOrder === "ASC"
                                ? "ascending"
                                : "descending"
                              : "none"
                            : undefined
                        }
                        className={`h-[46px] py-2.5 px-4 ${
                          h.sortable
                            ? `cursor-pointer group/th transition-colors duration-140 ${
                                isSorted
                                  ? "bg-[#D2C9FF] dark:bg-violet-950/70 text-[#3B1FA8] dark:text-violet-200 border-b-[3px] border-b-[#6D4AFF]"
                                  : "hover:bg-[#DFD9FF] dark:hover:bg-slate-700/60 text-[#2E1A87] dark:text-slate-200"
                              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset`
                            : "cursor-default text-[#2E1A87] dark:text-slate-200"
                        } ${isAction ? "text-right min-w-[144px]" : "text-left"}`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            isAction ? "justify-end w-full" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[11.5px] uppercase tracking-[0.06em] font-bold whitespace-nowrap transition-colors duration-140 ${
                              isSorted
                                ? "text-[#3B1FA8] dark:text-violet-200"
                                : "text-[#2E1A87] dark:text-slate-200 group-hover/th:text-[#111827] dark:group-hover/th:text-white"
                            }`}
                          >
                            {h.label}
                          </span>
                          {h.sortable && (
                            <span
                              className={`transition-colors duration-140 inline-flex items-center justify-center ${
                                isSorted
                                  ? "text-[#6D4AFF] dark:text-violet-300"
                                  : "text-[#7C6BD6] group-hover/th:text-[#2E1A87] dark:group-hover/th:text-white"
                              }`}
                            >
                              {isSorted ? (
                                sortOrder === "ASC" ? (
                                  <ChevronUp className="w-3.5 h-3.5 stroke-[1.75]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 stroke-[1.75]" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5 stroke-[1.75]" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800/70 text-[13px]">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="px-4 py-12 text-center text-xs text-[#6B7280] dark:text-slate-400 select-none"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                        <p className="font-medium text-[#111827] dark:text-slate-300">
                          Loading parties...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : parties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="px-4 py-12 text-center text-xs text-[#6B7280] dark:text-slate-400 select-none"
                    >
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#F2F4F7] dark:bg-slate-800 flex items-center justify-center text-[#9CA3AF]">
                          {recordsTab === "deleted" ? (
                            <Archive className="w-5 h-5 stroke-[1.75]" />
                          ) : (
                            <AlertCircle className="w-5 h-5 stroke-[1.75]" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[14px] font-medium text-[#111827] dark:text-slate-100">
                            {recordsTab === "deleted"
                              ? "No deleted parties found"
                              : search || selectedType || selectedStatus
                              ? "No matching parties found"
                              : "No parties found"}
                          </p>
                          <p className="text-[13px] text-[#6B7280] dark:text-slate-400">
                            {recordsTab === "deleted"
                              ? "Deleted parties will appear here."
                              : search || selectedType || selectedStatus
                              ? "Try adjusting your search query or reset the filters."
                              : "Click '+ Create New Party' to add your first party record."}
                          </p>
                          {recordsTab === "active" && !search && !selectedType && !selectedStatus && (
                            <button
                              type="button"
                              onClick={handleOpenCreateModal}
                              style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                              className="mt-2.5 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-all cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>+ Create New Party</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parties.map((party) => (
                    <tr
                      key={party.uuid}
                      className="h-14 hover:bg-[#FAFAFB] dark:hover:bg-slate-800/40 transition-colors duration-140 group align-middle"
                    >
                      {/* Code */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[150px]">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums group-hover:text-[#6D4AFF] transition-colors duration-140">
                            #{party.code}
                          </span>
                          <span className="text-xs text-[#6B7280] dark:text-slate-400 font-sans tabular-nums">
                            {formatTimestamp(party.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[240px]">
                        <div className="flex flex-col">
                          <span className="text-[13.5px] font-medium text-[#111827] dark:text-slate-100">
                            {party.name}
                          </span>
                          <span
                            className="text-xs text-[#6B7280] dark:text-slate-400 max-w-[220px] truncate"
                            title={party.notes || undefined}
                          >
                            {party.notes || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Type (Neutral Pill Badge: 24px, 12/500, bg #F2F4F7, text #344054, border 1px #E4E7EC) */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[130px]">
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-[#F2F4F7] text-[#344054] dark:bg-slate-800 dark:text-slate-300 border border-[#E4E7EC] dark:border-slate-700">
                          {party.type}
                        </span>
                      </td>

                      {/* Phone (13/400 #374151 sans, tabular-nums) */}
                      <td
                        className="px-4 py-2.5 whitespace-nowrap align-middle text-[13px] font-normal text-[#374151] dark:text-slate-300 font-sans tabular-nums min-w-[150px] truncate max-w-[160px]"
                        title={party.phone || undefined}
                      >
                        {party.phone || <span className="text-[#9CA3AF]">—</span>}
                      </td>

                      {/* Trade License (13/400 #374151 sans, tabular-nums) */}
                      <td
                        className="px-4 py-2.5 whitespace-nowrap align-middle text-[13px] font-normal text-[#374151] dark:text-slate-300 font-sans tabular-nums min-w-[160px] truncate max-w-[160px]"
                        title={party.tradeLicenseNo || undefined}
                      >
                        {party.tradeLicenseNo || <span className="text-[#9CA3AF]">—</span>}
                      </td>

                      {/* NID (13/400 #374151 sans, tabular-nums) */}
                      <td
                        className="px-4 py-2.5 whitespace-nowrap align-middle text-[13px] font-normal text-[#374151] dark:text-slate-300 font-sans tabular-nums min-w-[160px] truncate max-w-[160px]"
                        title={party.nidNo || undefined}
                      >
                        {party.nidNo || <span className="text-[#9CA3AF]">—</span>}
                      </td>

                      {/* Status (Semantic Soft Pill: 24px, 12/500, 6px dot) */}
                      <td className="px-4 py-2.5 whitespace-nowrap align-middle min-w-[120px]">
                        <span
                          className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium border ${
                            party.status === "active"
                              ? "bg-[#ECFDF3] dark:bg-emerald-950/40 text-[#027A48] dark:text-emerald-300 border-[#A6F4C5] dark:border-emerald-800/40"
                              : "bg-[#F2F4F7] dark:bg-slate-800/60 text-[#344054] dark:text-slate-400 border-[#E4E7EC] dark:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              party.status === "active"
                                ? "bg-[#12B76A]"
                                : "bg-[#98A2B3]"
                            }`}
                          />
                          <span>
                            {party.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </span>
                      </td>

                      {/* Action Column: Row Action Spec 32x32 tinted buttons, unclipped with 16px right padding */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap align-middle min-w-[144px]">
                        <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                          {/* Eye / View Details (Blue tint at rest) */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(party)}
                            title="View Details"
                            aria-label="View Details"
                            className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#BFDBFE] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                          >
                            <Eye className="w-4 h-4 stroke-[1.75]" />
                          </button>

                          {/* Actions */}
                          {recordsTab === "deleted" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
                                Soft Delete
                              </span>
                            ) : (
                            <>
                              {/* Edit (Purple tint at rest) */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(party)}
                                title="Edit Party"
                                aria-label="Edit Party"
                                className="w-8 h-8 rounded-lg bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] flex items-center justify-center hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#DDD6FE] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                              >
                                <SquarePen className="w-4 h-4 stroke-[1.75]" />
                              </button>

                              {/* Delete (Red tint at rest) */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(party)}
                                title="Delete Party"
                                aria-label="Delete Party"
                                className="w-8 h-8 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#B91C1C] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#FECACA] transition-all duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer: Bar 56px, padding 0 16px, top border #E5E7EB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 h-14 px-4 border-t border-[#E5E7EB] dark:border-slate-800 text-[13px] text-[#6B7280] dark:text-slate-400 bg-white dark:bg-slate-900">
            <span className="tabular-nums font-normal">
              Showing {totalEntries === 0 ? 0 : startIdx + 1}–
              {Math.min(startIdx + entriesPerPage, totalEntries)} of {totalEntries} entries
            </span>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] disabled:opacity-45 disabled:cursor-not-allowed active:bg-slate-100 transition-colors duration-140 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium tabular-nums transition-colors duration-140 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1 ${
                    page === currentPage
                      ? "bg-[#F4F1FF] text-[#5B3BE0] border border-[#DDD6FE] dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 font-semibold"
                      : "border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] text-[#374151] dark:text-slate-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] disabled:opacity-45 disabled:cursor-not-allowed active:bg-slate-100 transition-colors duration-140 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-1"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT PARTY MODAL
          ========================================================================= */}
      {(showCreateModal || editParty) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 flex items-center justify-center border border-violet-200/50 dark:border-violet-800/40">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {editParty ? `Edit Party #${editParty.code}` : "Create New Party"}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    {editParty
                      ? "Update party details, documents, and banking information."
                      : "Fill in the profile details to register a new party."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditParty(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[4px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 rounded-[6px] bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Navigation Tabs: cleanly hidden scrollbars, vibrant active states */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFormActiveTab("general")}
                style={formActiveTab === "general" ? { backgroundColor: "#6D4AFF", color: "#FFFFFF" } : {}}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${
                  formActiveTab === "general"
                    ? "bg-violet-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>General &amp; Contact</span>
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("address")}
                style={formActiveTab === "address" ? { backgroundColor: "#6D4AFF", color: "#FFFFFF" } : {}}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${
                  formActiveTab === "address"
                    ? "bg-violet-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Address</span>
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("legal")}
                style={formActiveTab === "legal" ? { backgroundColor: "#6D4AFF", color: "#FFFFFF" } : {}}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${
                  formActiveTab === "legal"
                    ? "bg-violet-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Legal &amp; Business</span>
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("banking")}
                style={formActiveTab === "banking" ? { backgroundColor: "#6D4AFF", color: "#FFFFFF" } : {}}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${
                  formActiveTab === "banking"
                    ? "bg-violet-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Banking &amp; Accounts</span>
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("documents")}
                style={formActiveTab === "documents" ? { backgroundColor: "#6D4AFF", color: "#FFFFFF" } : {}}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 ${
                  formActiveTab === "documents"
                    ? "bg-violet-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Documents &amp; Notes</span>
                {Boolean(formData.documents?.length) && (
                  <span
                    style={
                      formActiveTab === "documents"
                        ? { backgroundColor: "#FFFFFF", color: "#6D4AFF" }
                        : { backgroundColor: "#F4F1FF", color: "#6D4AFF" }
                    }
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums"
                  >
                    {formData.documents?.length}
                  </span>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4 text-xs">
              {/* TAB 1: General & Contact Information */}
              {formActiveTab === "general" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Party Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Ridoy Enterprise"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Party Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150 cursor-pointer"
                    >
                      {dropdowns.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          status: val,
                          isActive: val === "active",
                        });
                      }}
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:border-violet-500 transition-all duration-150 cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                      placeholder="e.g. John Doe"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:border-violet-500 transition-all duration-150"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (835) 993-8208"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:border-violet-500 transition-all duration-150"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contact@enterprise.com"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:border-violet-500 transition-all duration-150"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      placeholder="+1 (835) 993-8208"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:border-violet-500 transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Address & Location */}
              {formActiveTab === "address" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="e.g. 120 Gulshan Avenue, Suite 402"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="e.g. Dhaka"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={formData.state || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="e.g. Dhaka Division"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="e.g. Bangladesh"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Legal & Business Identification */}
              {formActiveTab === "legal" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerName: e.target.value })
                      }
                      placeholder="e.g. Mr. Ridoy Ahmed"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Business Type
                    </label>
                    <select
                      value={formData.businessType || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, businessType: e.target.value })
                      }
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150 cursor-pointer"
                    >
                      <option value="">-- Select Business Type --</option>
                      {dropdowns.businessTypes.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Trade License No
                    </label>
                    <input
                      type="text"
                      value={formData.tradeLicenseNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, tradeLicenseNo: e.target.value })
                      }
                      placeholder="e.g. TL-2026-9988"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Trade License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.tradeLicenseExpiry || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, tradeLicenseExpiry: e.target.value })
                      }
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      National ID (NID)
                    </label>
                    <input
                      type="text"
                      value={formData.nidNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nidNo: e.target.value })
                      }
                      placeholder="e.g. 1990269123456"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      value={formData.tinNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, tinNo: e.target.value })
                      }
                      placeholder="e.g. TIN-44556677"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      BIN / VAT Number
                    </label>
                    <input
                      type="text"
                      value={formData.binNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, binNo: e.target.value })
                      }
                      placeholder="e.g. BIN-0011223344"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Banking & Financial Accounts */}
              {formActiveTab === "banking" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="e.g. Eastern Bank Limited"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.accountNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, accountNo: e.target.value })
                      }
                      placeholder="e.g. 1041060012345"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={formData.branch || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      placeholder="e.g. Principal Branch, Dhaka"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Accounting Group
                    </label>
                    <input
                      type="text"
                      list="accountingGroupsList"
                      value={formData.accountingGroup || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, accountingGroup: e.target.value })
                      }
                      placeholder="e.g. Sundry Creditors"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                    <datalist id="accountingGroupsList">
                      {dropdowns.accountingGroups.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Payable Account
                    </label>
                    <input
                      type="text"
                      list="payableAccountsList"
                      value={formData.payableAccount || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, payableAccount: e.target.value })
                      }
                      placeholder="e.g. Accounts Payable - Vendors"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-150"
                    />
                    <datalist id="payableAccountsList">
                      {dropdowns.payableAccounts.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* TAB 5: Documents & Notes */}
              {formActiveTab === "documents" && (
                <div className="space-y-4">
                  {/* Notes / Subtitle */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1">
                      Notes / Remarks (displayed below party name in list)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="e.g. Mollitia exercitatio"
                      className="w-full min-h-[96px] p-3 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF] transition-all duration-140 resize-y"
                    />
                  </div>

                  {/* Attached Documents Section */}
                  <div className="p-3.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#F9FAFB] dark:bg-slate-850/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        <span>Attached Documents ({formData.documents?.length || 0})</span>
                      </span>
                    </div>

                    {/* New Document Uploader: dashed border, 12px radius */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white dark:bg-slate-900 p-3 rounded-xl border border-dashed border-[#D1D5DB] dark:border-slate-700 hover:border-[#6D4AFF] transition-colors">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-medium text-[#6B7280] dark:text-slate-400 mb-1">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Trade License Copy"
                          className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-medium text-[#6B7280] dark:text-slate-400 mb-1">
                          File or Document URL
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newDocFileName || newDocFile}
                            onChange={(e) => {
                              setNewDocFile(e.target.value);
                              setNewDocFileName("");
                            }}
                            placeholder="Upload file or enter URL..."
                            className="flex-1 h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/35 focus-visible:border-[#6D4AFF]"
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Browse local file"
                            className="h-8 px-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800 hover:bg-[#F2F4F7] text-[#4B5563] dark:text-slate-300 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddDocument}
                          style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                          className="w-full h-8 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium flex items-center justify-center gap-1 transition-all duration-140 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach</span>
                        </button>
                      </div>
                    </div>

                    {/* Document List */}
                    {formData.documents && formData.documents.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {formData.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-[6px] bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                  {doc.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  {doc.file.startsWith("data:")
                                    ? "[Base64 Embedded Document]"
                                    : doc.file}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {doc.file && (
                                <a
                                  href={doc.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View file"
                                  className="p-1 rounded text-slate-400 hover:text-[#6D4AFF] cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(idx)}
                                title="Remove document"
                                className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-2 text-[11px] text-slate-400">
                        No documents attached. You can attach Trade License, TIN, NID, or agreement copies.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[12px] text-slate-400">
                  <span className="text-red-500">*</span> Required fields
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditParty(null);
                    }}
                    className="h-9 px-4 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-[0_1px_2px_rgba(16,24,40,0.04)] active:translate-y-[0.5px] cursor-pointer transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#6D4AFF", color: "#FFFFFF" }}
                    className="h-9 px-5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 active:translate-y-[0.5px] disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editParty ? "Update Party" : "Save Party"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
          ========================================================================= */}
      {viewParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40 flex items-center justify-center font-bold text-base">
                  {viewParty.name?.charAt(0) || "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {viewParty.name}
                    </h3>
                    <span className="font-mono text-xs text-violet-600 dark:text-violet-300 font-semibold bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/40 px-2 py-0.5 rounded-[4px] tabular-nums">
                      #{viewParty.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="capitalize">{viewParty.type}</span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        viewParty.status === "active"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewParty.status === "active"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {viewParty.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewParty(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[4px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setViewActiveTab("general")}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors duration-150 cursor-pointer ${
                  viewActiveTab === "general"
                    ? "bg-[#6D4AFF] text-white font-semibold shadow-[0_1px_2px_rgba(109,74,255,0.2)]"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Overview &amp; Contact
              </button>
              <button
                type="button"
                onClick={() => setViewActiveTab("address")}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors duration-150 cursor-pointer ${
                  viewActiveTab === "address"
                    ? "bg-[#6D4AFF] text-white font-semibold shadow-[0_1px_2px_rgba(109,74,255,0.2)]"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Address &amp; Location
              </button>
              <button
                type="button"
                onClick={() => setViewActiveTab("legal")}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors duration-150 cursor-pointer ${
                  viewActiveTab === "legal"
                    ? "bg-[#6D4AFF] text-white font-semibold shadow-[0_1px_2px_rgba(109,74,255,0.2)]"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Legal &amp; Tax ID
              </button>
              <button
                type="button"
                onClick={() => setViewActiveTab("banking")}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors duration-150 cursor-pointer ${
                  viewActiveTab === "banking"
                    ? "bg-[#6D4AFF] text-white font-semibold shadow-[0_1px_2px_rgba(109,74,255,0.2)]"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Banking &amp; Accounts
              </button>
              <button
                type="button"
                onClick={() => setViewActiveTab("documents")}
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors duration-150 cursor-pointer ${
                  viewActiveTab === "documents"
                    ? "bg-[#6D4AFF] text-white font-semibold shadow-[0_1px_2px_rgba(109,74,255,0.2)]"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Documents ({viewParty.documents?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT */}
            {viewActiveTab === "general" && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Party Type
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewParty.type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Contact Person
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.contactPerson || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Phone Number
                  </span>
                  <span className="font-sans text-slate-800 dark:text-slate-200 tabular-nums">
                    {viewParty.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Email Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    WhatsApp Number
                  </span>
                  <span className="font-sans text-slate-800 dark:text-slate-200 tabular-nums">
                    {viewParty.whatsapp || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Created On
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 tabular-nums font-sans">
                    {formatTimestamp(viewParty.createdAt)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Notes / Remarks
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {viewParty.notes || "No notes"}
                  </span>
                </div>
              </div>
            )}

            {viewActiveTab === "address" && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Street Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.address || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    City
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.city || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    State / Province
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.state || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Country
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.country || "—"}
                  </span>
                </div>
              </div>
            )}

            {viewActiveTab === "legal" && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Owner Name
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.ownerName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Business Type
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.businessType || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Trade License No
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                    {viewParty.tradeLicenseNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Trade License Expiry
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 tabular-nums font-sans">
                    {viewParty.tradeLicenseExpiry || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    National ID (NID)
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                    {viewParty.nidNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    TIN Number
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                    {viewParty.tinNo || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    BIN / VAT Number
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                    {viewParty.binNo || "—"}
                  </span>
                </div>
              </div>
            )}

            {viewActiveTab === "banking" && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Bank Name
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {viewParty.bankName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Account Number
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                    {viewParty.accountNo || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Branch Name
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.branch || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Accounting Group
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.accountingGroup || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Payable Account
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewParty.payableAccount || "—"}
                  </span>
                </div>
              </div>
            )}

            {viewActiveTab === "documents" && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                {viewParty.documents && viewParty.documents.length > 0 ? (
                  <div className="space-y-2">
                    {viewParty.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {doc.file?.startsWith("data:")
                                ? "[Embedded File Attachment]"
                                : doc.file}
                            </span>
                          </div>
                        </div>

                        {doc.file && (
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-slate-400">
                    No documents attached to this party.
                  </p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewParty(null)}
                className="px-4 py-2 rounded-[6px] text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3EE6] active:bg-[#4E34C7] transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(109,74,255,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Delete Party
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action will soft-delete this record.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deleteTarget.name}
              </span>{" "}
              (
              <span className="font-mono text-xs font-semibold tabular-nums">
                #{deleteTarget.code}
              </span>
              )?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-[0_1px_2px_rgba(16,24,40,0.04)] active:translate-y-[0.5px] cursor-pointer transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmDelete}
                className="h-9 px-4 rounded-lg text-xs font-medium text-white bg-red-600 border border-red-700 hover:bg-red-700 hover:border-red-800 active:bg-red-800 active:translate-y-[0.5px] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_1px_2px_0_rgba(239,68,68,0.20)] hover:shadow-[0_2px_4px_rgba(239,68,68,0.25)] transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-1"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
