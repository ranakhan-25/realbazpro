"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Shield,
  Building,
  Users,
  UserCheck,
  Clock,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserX,
  FileText,
  DollarSign,
  Car,
  KeyRound,
  CheckCircle2,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import {
  getSecurityStats,
  getMonthlySecurityCost,
  getSecurityDropdownMeta,
  getSecurityCompanies,
  getExpiringCompanies,
  createSecurityCompany,
  updateSecurityCompany,
  deleteSecurityCompany,
  getSecurityGuards,
  createSecurityGuard,
  updateSecurityGuard,
  deleteSecurityGuard,
  getSecurityRosters,
  getWeeklySecurityRoster,
  createSecurityRoster,
  updateSecurityRosterStatus,
  deleteSecurityRoster,
  getSecurityVisitorLogs,
  checkInVisitor,
  checkOutVisitor,
  deleteSecurityVisitorLog,
  SecurityCompanyItem,
  SecurityGuardItem,
  SecurityRosterItem,
  WeeklyRosterData,
  SecurityVisitorLogItem,
  SecurityStatsData,
  SecurityDropdownMeta,
  GuardSource,
  GuardStatus,
  ShiftName,
  RosterStatus,
  VisitorPurpose,
  VisitorStatus,
  MonthlySecurityCostData,
} from "@/services/customerSecurityService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function SecurityServicePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, isLoading: isProjectLoading } = useSelectedProject();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "guards" | "companies" | "roster" | "visitors"
  >("guards");

  // Global KPI Stats
  const [stats, setStats] = useState<SecurityStatsData>({
    total_guards: 0,
    in_house_guards: 0,
    company_guards: 0,
    active_companies: 0,
    expiring_contracts_count: 0,
    on_duty_today: 0,
    active_visitors_inside: 0,
    monthly_cost: 0,
    monthly_cost_formatted: "৳ 0",
  });
  const [monthlyCostData, setMonthlyCostData] =
    useState<MonthlySecurityCostData | null>(null);

  // Dropdown Metadata
  const [meta, setMeta] = useState<SecurityDropdownMeta>({
    companies: [],
    guards: [],
    sources: ["IN_HOUSE", "COMPANY"],
    guard_statuses: ["ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"],
    shift_names: ["Morning", "Evening", "Night", "Custom"],
    roster_statuses: [
      "SCHEDULED",
      "ON_DUTY",
      "COMPLETED",
      "ABSENT",
      "RELIEVED",
    ],
    purposes: [
      "Delivery",
      "Guest / Personal",
      "Contractor / Maintenance",
      "Official / Courier",
      "Other",
    ],
  });

  // =========================================================================
  // 1. GUARDS STATE
  // =========================================================================
  const [guards, setGuards] = useState<SecurityGuardItem[]>([]);
  const [isGuardsLoading, setIsGuardsLoading] = useState(false);
  const [guardFilter, setGuardFilter] = useState("all");
  const [guardSearch, setGuardSearch] = useState("");

  // Guard Modals
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<SecurityGuardItem | null>(
    null,
  );
  const [guardFormName, setGuardFormName] = useState("");
  const [guardFormPhone, setGuardFormPhone] = useState("");
  const [guardFormNid, setGuardFormNid] = useState("");
  const [guardFormSource, setGuardFormSource] =
    useState<GuardSource>("IN_HOUSE");
  const [guardFormCompanyId, setGuardFormCompanyId] = useState<
    number | undefined
  >(undefined);
  const [guardFormBadge, setGuardFormBadge] = useState("");
  const [guardFormStatus, setGuardFormStatus] = useState<GuardStatus>("ACTIVE");
  const [guardFormJoinedDate, setGuardFormJoinedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [guardFormEmergency, setGuardFormEmergency] = useState("");
  const [isSubmittingGuard, setIsSubmittingGuard] = useState(false);

  // =========================================================================
  // 2. COMPANIES STATE
  // =========================================================================
  const [companies, setCompanies] = useState<SecurityCompanyItem[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [companySearch, setCompanySearch] = useState("");
  const [expiringCompaniesList, setExpiringCompaniesList] = useState<
    SecurityCompanyItem[]
  >([]);

  // Company Modals
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<SecurityCompanyItem | null>(null);
  const [compFormName, setCompFormName] = useState("");
  const [compFormContact, setCompFormContact] = useState("");
  const [compFormPhone, setCompFormPhone] = useState("");
  const [compFormEmail, setCompFormEmail] = useState("");
  const [compFormStart, setCompFormStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [compFormEnd, setCompFormEnd] = useState("");
  const [compFormCost, setCompFormCost] = useState<number>(0);
  const [compFormLiability, setCompFormLiability] = useState("");
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);

  // =========================================================================
  // 3. DUTY ROSTER STATE
  // =========================================================================
  const [rosterViewMode, setRosterViewMode] = useState<"weekly" | "list">(
    "weekly",
  );
  const [weeklyRoster, setWeeklyRoster] = useState<WeeklyRosterData | null>(
    null,
  );
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().slice(0, 10);
  });
  const [rostersList, setRostersList] = useState<SecurityRosterItem[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");

  // Roster Modal
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterFormGuardId, setRosterFormGuardId] = useState<
    number | undefined
  >(undefined);
  const [rosterFormDate, setRosterFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [rosterFormShiftName, setRosterFormShiftName] =
    useState<ShiftName>("Morning");
  const [rosterFormStart, setRosterFormStart] = useState("06:00");
  const [rosterFormEnd, setRosterFormEnd] = useState("14:00");
  const [rosterFormPost, setRosterFormPost] = useState("Main Entrance Gate 01");
  const [rosterFormNotes, setRosterFormNotes] = useState("");
  const [isSubmittingRoster, setIsSubmittingRoster] = useState(false);
  const [rosterOverlapError, setRosterOverlapError] = useState<string | null>(
    null,
  );

  // Quick Status Update Modal for Roster
  const [statusUpdateRoster, setStatusUpdateRoster] =
    useState<SecurityRosterItem | null>(null);
  const [newRosterStatus, setNewRosterStatus] =
    useState<RosterStatus>("ON_DUTY");
  const [statusUpdateNotes, setStatusUpdateNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // =========================================================================
  // 4. VISITOR LOG STATE
  // =========================================================================
  const [visitorLogs, setVisitorLogs] = useState<SecurityVisitorLogItem[]>([]);
  const [isVisitorsLoading, setIsVisitorsLoading] = useState(false);
  const [visitorStatusFilter, setVisitorStatusFilter] = useState("all");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorDateFilter, setVisitorDateFilter] = useState<string>("");

  // Check-in Visitor Modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [vFormName, setVFormName] = useState("");
  const [vFormPhone, setVFormPhone] = useState("");
  const [vFormFlat, setVFormFlat] = useState("");
  const [vFormPurpose, setVFormPurpose] =
    useState<VisitorPurpose>("Guest / Personal");
  const [vFormVehicle, setVFormVehicle] = useState("");
  const [vFormBadgeNid, setVFormBadgeNid] = useState("");
  const [vFormGuardId, setVFormGuardId] = useState<number | undefined>(
    undefined,
  );
  const [vFormRemarks, setVFormRemarks] = useState("");
  const [isSubmittingVisitor, setIsSubmittingVisitor] = useState(false);

  // =========================================================================
  // DATA FETCHING HOOKS
  // =========================================================================

  const loadStatsAndMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const [sRes, mRes, cRes, expRes] = await Promise.all([
        getSecurityStats(projectId),
        getSecurityDropdownMeta(projectId),
        getMonthlySecurityCost(projectId),
        getExpiringCompanies(projectId),
      ]);
      setStats(sRes);
      setMeta(mRes);
      setMonthlyCostData(cRes);
      setExpiringCompaniesList(expRes.items);
    } catch (err: unknown) {
      console.error("Failed to load security statistics:", err);
    }
  }, [projectId]);

  const loadGuards = useCallback(async () => {
    if (!projectId) return;
    setIsGuardsLoading(true);
    try {
      const res = await getSecurityGuards({
        project_id: projectId,
        source:
          guardFilter !== "all" && ["IN_HOUSE", "COMPANY"].includes(guardFilter)
            ? guardFilter
            : undefined,
        status:
          guardFilter !== "all" &&
          !["IN_HOUSE", "COMPANY"].includes(guardFilter)
            ? guardFilter
            : undefined,
        search: guardSearch || undefined,
        limit: 100,
      });
      setGuards(res.items);
    } catch (err: unknown) {
      console.error("Failed to fetch guards:", err);
      toast.error("Failed to load guards list");
    } finally {
      setIsGuardsLoading(false);
    }
  }, [projectId, guardFilter, guardSearch]);

  const loadCompanies = useCallback(async () => {
    if (!projectId) return;
    setIsCompaniesLoading(true);
    try {
      const res = await getSecurityCompanies({
        project_id: projectId,
        status: companyFilter !== "all" ? companyFilter : undefined,
        search: companySearch || undefined,
        limit: 100,
      });
      setCompanies(res.items);
    } catch (err: unknown) {
      console.error("Failed to fetch security companies:", err);
      toast.error("Failed to load security companies");
    } finally {
      setIsCompaniesLoading(false);
    }
  }, [projectId, companyFilter, companySearch]);

  const loadWeeklyRoster = useCallback(async () => {
    if (!projectId) return;
    setIsRosterLoading(true);
    try {
      if (rosterViewMode === "weekly") {
        const res = await getWeeklySecurityRoster(projectId, currentWeekStart);
        setWeeklyRoster(res);
      } else {
        const res = await getSecurityRosters({
          project_id: projectId,
          status: rosterStatusFilter !== "all" ? rosterStatusFilter : undefined,
          limit: 100,
        });
        setRostersList(res.items);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch duty roster:", err);
      toast.error("Failed to load duty roster");
    } finally {
      setIsRosterLoading(false);
    }
  }, [projectId, rosterViewMode, currentWeekStart, rosterStatusFilter]);

  const loadVisitorLogs = useCallback(async () => {
    if (!projectId) return;
    setIsVisitorsLoading(true);
    try {
      const res = await getSecurityVisitorLogs({
        project_id: projectId,
        status: visitorStatusFilter !== "all" ? visitorStatusFilter : undefined,
        date: visitorDateFilter || undefined,
        search: visitorSearch || undefined,
        limit: 100,
      });
      setVisitorLogs(res.items);
    } catch (err: unknown) {
      console.error("Failed to fetch visitor logs:", err);
      toast.error("Failed to load visitor log entries");
    } finally {
      setIsVisitorsLoading(false);
    }
  }, [projectId, visitorStatusFilter, visitorDateFilter, visitorSearch]);

  // Initial and Project change load
  useEffect(() => {
    if (projectId) {
      loadStatsAndMeta();
      if (activeTab === "guards") loadGuards();
      if (activeTab === "companies") loadCompanies();
      if (activeTab === "roster") loadWeeklyRoster();
      if (activeTab === "visitors") loadVisitorLogs();
    }
  }, [
    projectId,
    activeTab,
    loadStatsAndMeta,
    loadGuards,
    loadCompanies,
    loadWeeklyRoster,
    loadVisitorLogs,
  ]);

  // Shift Timing Presets Handler
  const handleShiftPresetChange = (name: ShiftName) => {
    setRosterFormShiftName(name);
    if (name === "Morning") {
      setRosterFormStart("06:00");
      setRosterFormEnd("14:00");
    } else if (name === "Evening") {
      setRosterFormStart("14:00");
      setRosterFormEnd("22:00");
    } else if (name === "Night") {
      setRosterFormStart("22:00");
      setRosterFormEnd("06:00");
    }
  };

  // Week Navigation handlers
  const handlePrevWeek = () => {
    const cur = new Date(currentWeekStart);
    cur.setDate(cur.getDate() - 7);
    setCurrentWeekStart(cur.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const cur = new Date(currentWeekStart);
    cur.setDate(cur.getDate() + 7);
    setCurrentWeekStart(cur.toISOString().slice(0, 10));
  };

  const handleThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    setCurrentWeekStart(mon.toISOString().slice(0, 10));
  };

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  // --- Guard Handlers ---
  const handleOpenAddGuard = () => {
    setEditingGuard(null);
    setGuardFormName("");
    setGuardFormPhone("");
    setGuardFormNid("");
    setGuardFormSource("IN_HOUSE");
    setGuardFormCompanyId(undefined);
    setGuardFormBadge("");
    setGuardFormStatus("ACTIVE");
    setGuardFormJoinedDate(new Date().toISOString().slice(0, 10));
    setGuardFormEmergency("");
    setIsGuardModalOpen(true);
  };

  const handleEditGuard = (guard: SecurityGuardItem) => {
    setEditingGuard(guard);
    setGuardFormName(guard.name);
    setGuardFormPhone(guard.phone);
    setGuardFormNid(guard.national_id);
    setGuardFormSource(guard.source);
    setGuardFormCompanyId(guard.company_id ?? undefined);
    setGuardFormBadge(guard.badge_number || "");
    setGuardFormStatus(guard.status);
    setGuardFormJoinedDate(guard.joined_date);
    setGuardFormEmergency(guard.emergency_contact || "");
    setIsGuardModalOpen(true);
  };

  const handleSubmitGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !guardFormName.trim() ||
      !guardFormPhone.trim() ||
      !guardFormNid.trim()
    ) {
      toast.error("Please enter guard name, phone, and national ID.");
      return;
    }
    if (guardFormSource === "COMPANY" && !guardFormCompanyId) {
      toast.error("Security company is required when guard source is Company.");
      return;
    }

    setIsSubmittingGuard(true);
    try {
      if (editingGuard) {
        await updateSecurityGuard(editingGuard.uuid, {
          name: guardFormName.trim(),
          phone: guardFormPhone.trim(),
          national_id: guardFormNid.trim(),
          source: guardFormSource,
          company_id:
            guardFormSource === "COMPANY" ? guardFormCompanyId : undefined,
          badge_number: guardFormBadge.trim() || undefined,
          status: guardFormStatus,
          joined_date: guardFormJoinedDate,
          emergency_contact: guardFormEmergency.trim() || undefined,
          project_id: projectId || undefined,
        });
        toast.success("Security guard updated successfully");
      } else {
        await createSecurityGuard({
          name: guardFormName.trim(),
          phone: guardFormPhone.trim(),
          national_id: guardFormNid.trim(),
          source: guardFormSource,
          company_id:
            guardFormSource === "COMPANY" ? guardFormCompanyId : undefined,
          badge_number: guardFormBadge.trim() || undefined,
          status: guardFormStatus,
          joined_date: guardFormJoinedDate,
          emergency_contact: guardFormEmergency.trim() || undefined,
          project_id: projectId || undefined,
        });
        toast.success("Security guard registered successfully");
      }
      setIsGuardModalOpen(false);
      loadGuards();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save security guard",
      );
    } finally {
      setIsSubmittingGuard(false);
    }
  };

  const handleDeleteGuard = async (guard: SecurityGuardItem) => {
    if (!confirm(`Are you sure you want to remove guard "${guard.name}"?`))
      return;
    try {
      await deleteSecurityGuard(guard.uuid);
      toast.success("Guard removed successfully");
      loadGuards();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete guard",
      );
    }
  };

  // --- Company Handlers ---
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompFormName("");
    setCompFormContact("");
    setCompFormPhone("");
    setCompFormEmail("");
    setCompFormStart(new Date().toISOString().slice(0, 10));
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setCompFormEnd(nextYear.toISOString().slice(0, 10));
    setCompFormCost(0);
    setCompFormLiability(
      "Agency provides 24/7 guard replacement guarantee and assumes full theft/property liability as per master agreement.",
    );
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: SecurityCompanyItem) => {
    setEditingCompany(company);
    setCompFormName(company.name);
    setCompFormContact(company.contact_person);
    setCompFormPhone(company.phone);
    setCompFormEmail(company.email || "");
    setCompFormStart(company.contract_start);
    setCompFormEnd(company.contract_end);
    setCompFormCost(company.monthly_cost);
    setCompFormLiability(company.liability_note || "");
    setIsCompanyModalOpen(true);
  };

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !compFormName.trim() ||
      !compFormContact.trim() ||
      !compFormPhone.trim() ||
      !compFormEnd
    ) {
      toast.error(
        "Please fill in company name, contact person, phone, and contract end date.",
      );
      return;
    }

    setIsSubmittingCompany(true);
    try {
      if (editingCompany) {
        await updateSecurityCompany(editingCompany.uuid, {
          name: compFormName.trim(),
          contact_person: compFormContact.trim(),
          phone: compFormPhone.trim(),
          email: compFormEmail.trim() || undefined,
          contract_start: compFormStart,
          contract_end: compFormEnd,
          monthly_cost: Number(compFormCost || 0),
          liability_note: compFormLiability.trim(),
          project_id: projectId || undefined,
        });
        toast.success("Security company updated successfully");
      } else {
        await createSecurityCompany({
          name: compFormName.trim(),
          contact_person: compFormContact.trim(),
          phone: compFormPhone.trim(),
          email: compFormEmail.trim() || undefined,
          contract_start: compFormStart,
          contract_end: compFormEnd,
          monthly_cost: Number(compFormCost || 0),
          liability_note: compFormLiability.trim(),
          project_id: projectId || undefined,
        });
        toast.success("Security company registered successfully");
      }
      setIsCompanyModalOpen(false);
      loadCompanies();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save security company",
      );
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  const handleDeleteCompany = async (company: SecurityCompanyItem) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) return;
    try {
      await deleteSecurityCompany(company.uuid);
      toast.success("Security company deleted successfully");
      loadCompanies();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete company",
      );
    }
  };

  // --- Roster Handlers ---
  const handleOpenAddRoster = (
    defaultGuardId?: number,
    defaultDate?: string,
  ) => {
    setRosterOverlapError(null);
    setRosterFormGuardId(defaultGuardId ?? (meta.guards[0]?.id || undefined));
    setRosterFormDate(defaultDate || new Date().toISOString().slice(0, 10));
    handleShiftPresetChange("Morning");
    setRosterFormPost("Main Entrance Gate 01");
    setRosterFormNotes("");
    setIsRosterModalOpen(true);
  };

  const handleSubmitRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !rosterFormGuardId ||
      !rosterFormDate ||
      !rosterFormStart ||
      !rosterFormEnd ||
      !rosterFormPost
    ) {
      toast.error(
        "Please fill in guard, date, shift timings, and post location.",
      );
      return;
    }
    if (!projectId) {
      toast.error("Please select a project first.");
      return;
    }

    setRosterOverlapError(null);
    setIsSubmittingRoster(true);
    try {
      await createSecurityRoster({
        project_id: projectId,
        guard_id: rosterFormGuardId,
        duty_date: rosterFormDate,
        shift_name: rosterFormShiftName,
        shift_start: rosterFormStart,
        shift_end: rosterFormEnd,
        post_location: rosterFormPost.trim(),
        status: "SCHEDULED",
        notes: rosterFormNotes.trim() || undefined,
      });
      toast.success("Shift scheduled successfully");
      setIsRosterModalOpen(false);
      loadWeeklyRoster();
      loadStatsAndMeta();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to schedule shift";
      setRosterOverlapError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingRoster(false);
    }
  };

  const handleOpenStatusUpdate = (roster: SecurityRosterItem) => {
    setStatusUpdateRoster(roster);
    setNewRosterStatus(roster.status);
    setStatusUpdateNotes(roster.notes || "");
  };

  const handleUpdateRosterStatus = async () => {
    if (!statusUpdateRoster) return;
    setIsUpdatingStatus(true);
    try {
      await updateSecurityRosterStatus(statusUpdateRoster.uuid, {
        status: newRosterStatus,
        notes: statusUpdateNotes.trim() || undefined,
      });
      toast.success(`Shift status changed to ${newRosterStatus}`);
      setStatusUpdateRoster(null);
      loadWeeklyRoster();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update shift status",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteRoster = async (roster: SecurityRosterItem) => {
    if (
      !confirm(
        `Delete shift for ${roster.guard?.name || "guard"} on ${roster.duty_date}?`,
      )
    )
      return;
    try {
      await deleteSecurityRoster(roster.uuid);
      toast.success("Shift cancelled and deleted");
      loadWeeklyRoster();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete shift",
      );
    }
  };

  // --- Visitor Log Handlers ---
  const handleOpenCheckIn = () => {
    setVFormName("");
    setVFormPhone("");
    setVFormFlat("");
    setVFormPurpose("Guest / Personal");
    setVFormVehicle("");
    setVFormBadgeNid("");
    setVFormGuardId(meta.guards[0]?.id || undefined);
    setVFormRemarks("");
    setIsCheckInModalOpen(true);
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vFormName.trim() || !vFormPhone.trim() || !vFormFlat.trim()) {
      toast.error("Please enter visitor name, phone, and flat/unit visited.");
      return;
    }
    if (!projectId) {
      toast.error("Please select a project first.");
      return;
    }

    setIsSubmittingVisitor(true);
    try {
      await checkInVisitor({
        project_id: projectId,
        visitor_name: vFormName.trim(),
        phone: vFormPhone.trim(),
        flat_visited: vFormFlat.trim(),
        purpose: vFormPurpose,
        vehicle_number: vFormVehicle.trim() || undefined,
        national_id_or_badge: vFormBadgeNid.trim() || undefined,
        guard_on_duty_id: vFormGuardId,
        remarks: vFormRemarks.trim() || undefined,
      });
      toast.success(`Checked in ${vFormName.trim()}`);
      setIsCheckInModalOpen(false);
      loadVisitorLogs();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to check in visitor",
      );
    } finally {
      setIsSubmittingVisitor(false);
    }
  };

  const handleCheckOut = async (log: SecurityVisitorLogItem) => {
    try {
      await checkOutVisitor(log.uuid, {
        out_time: new Date().toISOString(),
      });
      toast.success(`${log.visitor_name} checked out`);
      loadVisitorLogs();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to check out visitor",
      );
    }
  };

  const handleDeleteVisitorLog = async (log: SecurityVisitorLogItem) => {
    if (!confirm(`Delete visitor log for ${log.visitor_name}?`)) return;
    try {
      await deleteSecurityVisitorLog(log.uuid);
      toast.success("Visitor log deleted");
      loadVisitorLogs();
      loadStatsAndMeta();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete entry",
      );
    }
  };

  // =========================================================================
  // RENDER GUARD COLUMNS
  // =========================================================================
  const guardColumns: Column<SecurityGuardItem>[] = [
    {
      key: "name",
      header: "Guard Name & Badge",
      render: (guard) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg font-semibold text-xs"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            {guard.badge_number ? (
              guard.badge_number.slice(0, 4)
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="font-semibold text-foreground text-xs">
              {guard.name}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {guard.badge_number ? `Badge #${guard.badge_number}` : "No badge"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source / Agency",
      render: (guard) => (
        <div>
          {guard.source === "IN_HOUSE" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <Users className="h-3 w-3" />
              In-House Guard
            </span>
          ) : (
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <Building className="h-3 w-3" />
                {guard.company?.name || "Contract Agency"}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone & Emergency",
      render: (guard) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 font-medium text-foreground">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {guard.phone}
          </div>
          {guard.emergency_contact && (
            <p className="text-[11px] text-muted-foreground">
              Emerg: {guard.emergency_contact}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "national_id",
      header: "National ID (NID)",
      render: (guard) => (
        <span className="font-mono text-xs text-muted-foreground">
          {guard.national_id}
        </span>
      ),
    },
    {
      key: "status",
      header: "Duty Status",
      render: (guard) => {
        const isActive = guard.status === "ACTIVE";
        const isOnLeave = guard.status === "ON_LEAVE";
        const isTerminated = guard.status === "TERMINATED";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isOnLeave
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : isTerminated
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {guard.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "joined_date",
      header: "Joined Date",
      render: (guard) => (
        <span className="text-xs text-muted-foreground">
          {guard.joined_date}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (guard) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEditGuard(guard)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit Guard"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDeleteGuard(guard)}
            className="rounded p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
            title="Remove Guard"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =========================================================================
  // RENDER COMPANY COLUMNS
  // =========================================================================
  const companyColumns: Column<SecurityCompanyItem>[] = [
    {
      key: "name",
      header: "Security Agency / Company",
      render: (comp) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg font-semibold text-xs"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            <Building className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-xs">
              {comp.name}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Contact: {comp.contact_person}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact Info",
      render: (comp) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 font-medium text-foreground">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {comp.phone}
          </div>
          {comp.email && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3" />
              {comp.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contract_end",
      header: "Contract Validity",
      render: (comp) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {comp.contract_start} → {comp.contract_end}
          </div>
          <div>
            {comp.is_expired ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-2.5 w-2.5" />
                EXPIRED
              </span>
            ) : comp.is_expiring_soon ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" />
                Expires in {comp.days_until_expiry} days
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Active ({comp.days_until_expiry}d left)
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "monthly_cost",
      header: "Monthly Cost",
      render: (comp) => (
        <div className="font-semibold text-xs text-foreground">
          {comp.monthly_cost_formatted}
          <span className="block text-[10px] font-normal text-muted-foreground">
            per month
          </span>
        </div>
      ),
    },
    {
      key: "liability_note",
      header: "Liability & Replacement Terms",
      render: (comp) => (
        <div
          className="max-w-xs truncate text-[11px] text-muted-foreground"
          title={comp.liability_note}
        >
          {comp.liability_note || "Standard terms apply"}
        </div>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (comp) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEditCompany(comp)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit Company"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDeleteCompany(comp)}
            className="rounded p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
            title="Delete Company"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =========================================================================
  // RENDER VISITOR LOG COLUMNS
  // =========================================================================
  const visitorColumns: Column<SecurityVisitorLogItem>[] = [
    {
      key: "visitor_name",
      header: "Visitor Details",
      render: (v) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg font-semibold text-xs"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-xs">
              {v.visitor_name}
            </span>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-2.5 w-2.5" />
              {v.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "flat_visited",
      header: "Flat Visited",
      render: (v) => (
        <div className="flex items-center gap-1 font-semibold text-xs text-foreground">
          <Building className="h-3 w-3 text-muted-foreground" />
          {v.flat_visited}
        </div>
      ),
    },
    {
      key: "purpose",
      header: "Purpose & Vehicle",
      render: (v) => (
        <div className="space-y-0.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
            {v.purpose}
          </span>
          {v.vehicle_number && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Car className="h-2.5 w-2.5" />
              {v.vehicle_number}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "in_time",
      header: "Entry & Exit Time",
      render: (v) => {
        const inTimeStr = new Date(v.in_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const outTimeStr = v.out_time
          ? new Date(v.out_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null;
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Clock className="h-3 w-3" />
              In: {inTimeStr}
            </div>
            {outTimeStr ? (
              <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                <LogOut className="h-3 w-3" />
                Out: {outTimeStr}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                • Inside Premises
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (v) => {
        const isInside = v.status === "CHECKED_IN";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isInside
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isInside ? (
              <Clock className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {isInside ? "Checked In" : "Checked Out"}
          </span>
        );
      },
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          {v.status === "CHECKED_IN" && (
            <button
              onClick={() => handleCheckOut(v)}
              className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition"
            >
              <LogOut className="h-3 w-3" />
              Check Out
            </button>
          )}
          <button
            onClick={() => handleDeleteVisitorLog(v)}
            className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
            title="Delete Log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Roster List View Columns
  const rosterListColumns: Column<SecurityRosterItem>[] = [
    {
      key: "duty_date",
      header: "Date & Shift",
      render: (r) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-foreground">{r.duty_date}</span>
          <p className="text-[11px] text-muted-foreground">
            {r.shift_name} ({r.shift_timing})
          </p>
        </div>
      ),
    },
    {
      key: "guard_id",
      header: "Guard Name & Post",
      render: (r) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">
            {r.guard?.name || "Assigned Guard"}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {r.post_location}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Shift Status",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            r.status === "ON_DUTY"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : r.status === "COMPLETED"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : r.status === "ABSENT"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{r.notes || "—"}</span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenStatusUpdate(r)}
            className="rounded p-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Update Status"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDeleteRoster(r)}
            className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
            title="Delete Shift"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =========================================================================
  // CONDITIONAL RENDER: NO PROJECT SELECTED
  // =========================================================================
  if (!isProjectLoading && !projectId) {
    return (
      <div className="space-y-6">
        <CSPageHeader
          title="Security Service"
          subtitle="Building Services • Post Security, Guards Roster, Shifts & Incidents"
          badgeText="Building Services"
          breadcrumbs={[
            { label: "Building Services" },
            { label: "Security Service" },
          ]}
        />
        <CSSelectProjectEmptyState
          featureTitle="Security Rosters, Guards & Visitor Access"
          description="Security contracts, shift assignments, and visitor logs are scoped per project. Please select an active project from the top workspace selector to inspect security operations."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with dynamic Primary Action based on Tab */}
      <CSPageHeader
        title="Security Service"
        subtitle="Manage security agency contracts, guard duty rosters, shift schedules, and access control points."
        badgeText="Building Services"
        breadcrumbs={[
          { label: "Customer Service", href: "/dashboard/customer-service" },
          { label: "Building Services" },
          { label: "Security Service" },
        ]}
        primaryAction={{
          label:
            activeTab === "guards"
              ? "Add Guard"
              : activeTab === "companies"
                ? "Add Security Agency"
                : activeTab === "roster"
                  ? "Schedule Shift"
                  : "Check-in Visitor",
          icon: Plus,
          onClick:
            activeTab === "guards"
              ? handleOpenAddGuard
              : activeTab === "companies"
                ? handleOpenAddCompany
                : activeTab === "roster"
                  ? () => handleOpenAddRoster()
                  : handleOpenCheckIn,
        }}
      />

      {/* 2. Top KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Guards On Duty"
          value={stats.on_duty_today}
          change={`${stats.total_guards} total (${stats.in_house_guards} in-house, ${stats.company_guards} agency)`}
          icon={ShieldCheck}
          color="emerald"
        />
        <CSStatCard
          title="Contracted Agencies"
          value={stats.active_companies}
          change={
            stats.expiring_contracts_count > 0
              ? `${stats.expiring_contracts_count} contract(s) expiring within 30 days`
              : "All agency contracts active"
          }
          icon={Building}
          color={stats.expiring_contracts_count > 0 ? "amber" : "purple"}
        />
        <CSStatCard
          title="Visitors Inside"
          value={stats.active_visitors_inside}
          change="Currently checked in on premises"
          icon={UserCheck}
          color="indigo"
        />
        <CSStatCard
          title="Monthly Security Cost"
          value={stats.monthly_cost_formatted}
          change="Feeds project service charge expenses"
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* 3. Expiring Contract 30-Day Alert Banner */}
      {expiringCompaniesList.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-sm">
                Attention: {expiringCompaniesList.length} Security Agency
                Contract(s) Expiring Soon!
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Contracts for{" "}
                <span className="font-medium text-foreground">
                  {expiringCompaniesList
                    .map((c) => `${c.name} (${c.days_until_expiry}d left)`)
                    .join(", ")}
                </span>{" "}
                will expire within 30 days. Please initiate contract renewals or
                replacement guarantees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Navigation Bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("guards")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "guards"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="h-4 w-4" />
          Guards Roster ({stats.total_guards})
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "companies"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building className="h-4 w-4" />
          Security Agencies ({stats.active_companies})
          {stats.expiring_contracts_count > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "roster"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Duty Roster (Weekly Schedule)
        </button>
        <button
          onClick={() => setActiveTab("visitors")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "visitors"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Visitor Log
          {stats.active_visitors_inside > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {stats.active_visitors_inside} inside
            </span>
          )}
        </button>
      </div>

      {/* =====================================================================
          TAB 1: GUARDS ROSTER
      ====================================================================== */}
      {activeTab === "guards" && (
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Guards", count: guards.length },
                {
                  key: "IN_HOUSE",
                  label: "In-House",
                  count: guards.filter((g) => g.source === "IN_HOUSE").length,
                },
                {
                  key: "COMPANY",
                  label: "Contract Agency",
                  count: guards.filter((g) => g.source === "COMPANY").length,
                },
                {
                  key: "ACTIVE",
                  label: "Active",
                  count: guards.filter((g) => g.status === "ACTIVE").length,
                },
                {
                  key: "ON_LEAVE",
                  label: "On Leave",
                  count: guards.filter((g) => g.status === "ON_LEAVE").length,
                },
              ]}
              activeTab={guardFilter}
              onTabChange={setGuardFilter}
            />
          </div>

          <CSTable
            columns={guardColumns}
            data={guards}
            searchPlaceholder="Search guard name, phone, NID or badge..."
            searchFields={["name", "phone", "national_id", "badge_number"]}
          />
        </div>
      )}

      {/* =====================================================================
          TAB 2: SECURITY AGENCIES (COMPANIES)
      ====================================================================== */}
      {activeTab === "companies" && (
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Agencies", count: companies.length },
                {
                  key: "ACTIVE",
                  label: "Active Contracts",
                  count: companies.filter((c) => c.status === "ACTIVE").length,
                },
                {
                  key: "EXPIRING_SOON",
                  label: "Expiring in 30 Days",
                  count: companies.filter((c) => c.is_expiring_soon).length,
                },
                {
                  key: "EXPIRED",
                  label: "Expired",
                  count: companies.filter((c) => c.is_expired).length,
                },
              ]}
              activeTab={companyFilter}
              onTabChange={setCompanyFilter}
            />
          </div>

          <CSTable
            columns={companyColumns}
            data={companies}
            searchPlaceholder="Search agency name, contact person or phone..."
            searchFields={["name", "contact_person", "phone"]}
          />
        </div>
      )}

      {/* =====================================================================
          TAB 3: DUTY ROSTER (WEEKLY GRID)
      ====================================================================== */}
      {activeTab === "roster" && (
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          {/* View Mode Toggle and Week Navigator */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="rounded-lg border p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Previous Week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleThisWeek}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
              >
                Today / Current Week
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-lg border p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Next Week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="font-semibold text-xs text-foreground ml-2">
                Week: {weeklyRoster?.start_date} → {weeklyRoster?.end_date}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRosterViewMode("weekly")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  rosterViewMode === "weekly"
                    ? "bg-primary text-primary-foreground shadow"
                    : "border text-muted-foreground hover:bg-muted"
                }`}
              >
                Weekly Matrix
              </button>
              <button
                onClick={() => setRosterViewMode("list")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  rosterViewMode === "list"
                    ? "bg-primary text-primary-foreground shadow"
                    : "border text-muted-foreground hover:bg-muted"
                }`}
              >
                Shift List
              </button>
            </div>
          </div>

          {/* Roster Weekly Grid View */}
          {rosterViewMode === "weekly" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 font-semibold text-foreground w-56">
                      Guard
                    </th>
                    {weeklyRoster?.days.map((d) => (
                      <th
                        key={d.date}
                        className="p-3 font-semibold text-foreground text-center"
                      >
                        <div>{d.dayName}</div>
                        <span className="text-[10px] font-normal text-muted-foreground font-mono">
                          {d.date.slice(5)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {weeklyRoster?.matrix.map((row) => (
                    <tr
                      key={row.guard_id}
                      className="hover:bg-muted/20 transition"
                    >
                      <td className="p-3 align-top">
                        <div className="font-semibold text-foreground">
                          {row.guard_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.guard_source === "IN_HOUSE"
                            ? "In-House"
                            : row.company_name || "Agency"}
                        </div>
                      </td>
                      {weeklyRoster.days.map((d) => {
                        const dayShifts = row.shifts[d.date] || [];
                        return (
                          <td
                            key={d.date}
                            className="p-2 align-top text-center min-w-[120px]"
                          >
                            {dayShifts.length > 0 ? (
                              <div className="space-y-1.5">
                                {dayShifts.map((s) => (
                                  <div
                                    key={s.id}
                                    onClick={() => handleOpenStatusUpdate(s)}
                                    className={`cursor-pointer rounded-lg border p-2 text-left shadow-xs transition hover:ring-2 hover:ring-primary/40 ${
                                      s.shift_name === "Morning"
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
                                        : s.shift_name === "Evening"
                                          ? "bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200"
                                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-900 dark:text-indigo-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-semibold text-[11px]">
                                      <span>{s.shift_name}</span>
                                      <span
                                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                          s.status === "ON_DUTY"
                                            ? "bg-emerald-600 text-white"
                                            : s.status === "ABSENT"
                                              ? "bg-rose-600 text-white"
                                              : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {s.status}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                                      {s.shift_timing}
                                    </div>
                                    <div
                                      className="text-[10px] font-medium truncate mt-0.5"
                                      title={s.post_location}
                                    >
                                      {s.post_location}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleOpenAddRoster(row.guard_id, d.date)
                                }
                                className="group flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/40 transition"
                                title="Add Shift for this Day"
                              >
                                <Plus className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {weeklyRoster?.matrix.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-muted-foreground text-xs"
                      >
                        No active guards or shifts scheduled for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <CSTable
              columns={rosterListColumns}
              data={rostersList}
              searchPlaceholder="Search guard name, post or shift..."
              searchFields={["duty_date", "shift_name", "post_location"]}
            />
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: VISITOR LOG
      ====================================================================== */}
      {activeTab === "visitors" && (
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CSFilterTabs
              tabs={[
                {
                  key: "all",
                  label: "All Visitors",
                  count: visitorLogs.length,
                },
                {
                  key: "CHECKED_IN",
                  label: "Currently Inside",
                  count: visitorLogs.filter((v) => v.status === "CHECKED_IN")
                    .length,
                },
                {
                  key: "CHECKED_OUT",
                  label: "Checked Out",
                  count: visitorLogs.filter((v) => v.status === "CHECKED_OUT")
                    .length,
                },
              ]}
              activeTab={visitorStatusFilter}
              onTabChange={setVisitorStatusFilter}
            />

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={visitorDateFilter}
                onChange={(e) => setVisitorDateFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {visitorDateFilter && (
                <button
                  onClick={() => setVisitorDateFilter("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          <CSTable
            columns={visitorColumns}
            data={visitorLogs}
            searchPlaceholder="Search visitor name, flat visited, phone, vehicle..."
            searchFields={[
              "visitor_name",
              "flat_visited",
              "phone",
              "vehicle_number",
            ]}
          />
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ADD / EDIT SECURITY GUARD
      ====================================================================== */}
      <CSModal
        isOpen={isGuardModalOpen}
        onClose={() => setIsGuardModalOpen(false)}
        title={editingGuard ? "Edit Security Guard" : "Register Security Guard"}
        description="Register in-house guards or contract agency personnel with identification and assignment details."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitGuard} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Guard Full Name *
            </label>
            <input
              type="text"
              required
              value={guardFormName}
              onChange={(e) => setGuardFormName(e.target.value)}
              placeholder="e.g. Md. Jahangir Alam"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={guardFormPhone}
                onChange={(e) => setGuardFormPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                National ID (NID) *
              </label>
              <input
                type="text"
                required
                value={guardFormNid}
                onChange={(e) => setGuardFormNid(e.target.value)}
                placeholder="1990123456789"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Guard Source: IN_HOUSE vs COMPANY */}
          <div>
            <label className="block font-medium text-foreground mb-1">
              Guard Source / Deployment *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 cursor-pointer rounded-lg border p-2.5 transition ${
                  guardFormSource === "IN_HOUSE"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="guardSource"
                  value="IN_HOUSE"
                  checked={guardFormSource === "IN_HOUSE"}
                  onChange={() => setGuardFormSource("IN_HOUSE")}
                  className="sr-only"
                />
                <Users className="h-4 w-4" />
                In-House Guard
              </label>

              <label
                className={`flex items-center gap-2 cursor-pointer rounded-lg border p-2.5 transition ${
                  guardFormSource === "COMPANY"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="guardSource"
                  value="COMPANY"
                  checked={guardFormSource === "COMPANY"}
                  onChange={() => setGuardFormSource("COMPANY")}
                  className="sr-only"
                />
                <Building className="h-4 w-4" />
                Security Agency
              </label>
            </div>
          </div>

          {/* Conditional Company Dropdown (Required if COMPANY) */}
          {guardFormSource === "COMPANY" && (
            <div>
              <label className="block font-medium text-foreground mb-1">
                Security Company (Agency) *
              </label>
              <select
                required
                value={guardFormCompanyId || ""}
                onChange={(e) =>
                  setGuardFormCompanyId(Number(e.target.value) || undefined)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Security Agency</option>
                {meta.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Contact: {c.contact_person})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Badge / Serial Number
              </label>
              <input
                type="text"
                value={guardFormBadge}
                onChange={(e) => setGuardFormBadge(e.target.value)}
                placeholder="e.g. GRD-201"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Joined Date
              </label>
              <input
                type="date"
                value={guardFormJoinedDate}
                onChange={(e) => setGuardFormJoinedDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Emergency Contact (Name & Phone)
              </label>
              <input
                type="text"
                value={guardFormEmergency}
                onChange={(e) => setGuardFormEmergency(e.target.value)}
                placeholder="e.g. Brother: 01800000000"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={guardFormStatus}
                onChange={(e) =>
                  setGuardFormStatus(e.target.value as GuardStatus)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {meta.guard_statuses.map((st) => (
                  <option key={st} value={st}>
                    {st.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGuardModalOpen(false)}
              className="rounded-lg border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingGuard}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingGuard
                ? "Saving..."
                : editingGuard
                  ? "Save Changes"
                  : "Register Guard"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* =====================================================================
          MODAL 2: ADD / EDIT SECURITY COMPANY
      ====================================================================== */}
      <CSModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title={
          editingCompany ? "Edit Security Agency" : "Register Security Agency"
        }
        description="Record security service provider agreements, monthly contract costs, and liability covenants."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCompany} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Agency Name *
            </label>
            <input
              type="text"
              required
              value={compFormName}
              onChange={(e) => setCompFormName(e.target.value)}
              placeholder="e.g. Elite Security Services Ltd."
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={compFormContact}
                onChange={(e) => setCompFormContact(e.target.value)}
                placeholder="e.g. Major (Retd.) Tariqul Islam"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={compFormPhone}
                onChange={(e) => setCompFormPhone(e.target.value)}
                placeholder="+880 1711-238491"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={compFormEmail}
                onChange={(e) => setCompFormEmail(e.target.value)}
                placeholder="contact@elitesecurity.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Monthly Contract Cost (BDT) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={compFormCost}
                onChange={(e) => setCompFormCost(Number(e.target.value))}
                placeholder="45000"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Contract Start Date *
              </label>
              <input
                type="date"
                required
                value={compFormStart}
                onChange={(e) => setCompFormStart(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Contract End Date *
              </label>
              <input
                type="date"
                required
                value={compFormEnd}
                onChange={(e) => setCompFormEnd(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Liability & Replacement Guarantee Notes *
            </label>
            <textarea
              rows={3}
              required
              value={compFormLiability}
              onChange={(e) => setCompFormLiability(e.target.value)}
              placeholder="e.g. In case a guard quits, agency provides replacement within 4 hours and assumes full theft/property liability."
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(false)}
              className="rounded-lg border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCompany}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingCompany
                ? "Saving..."
                : editingCompany
                  ? "Save Changes"
                  : "Register Agency"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* =====================================================================
          MODAL 3: SCHEDULE DUTY SHIFT (WITH OVERLAP ERROR DISPLAY)
      ====================================================================== */}
      <CSModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title="Schedule Guard Shift"
        description="Assign a security post and shift hours to a guard. Shifts must not overlap for the same guard."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitRoster} className="space-y-4 text-xs">
          {rosterOverlapError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">
                    Shift Scheduling Conflict
                  </p>
                  <p className="text-[11px] mt-0.5">{rosterOverlapError}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-foreground mb-1">
              Select Guard *
            </label>
            <select
              required
              value={rosterFormGuardId || ""}
              onChange={(e) =>
                setRosterFormGuardId(Number(e.target.value) || undefined)
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose Guard</option>
              {meta.guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.source === "IN_HOUSE" ? "In-House" : "Agency"} -{" "}
                  {g.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Duty Date *
              </label>
              <input
                type="date"
                required
                value={rosterFormDate}
                onChange={(e) => setRosterFormDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Shift Preset *
              </label>
              <select
                value={rosterFormShiftName}
                onChange={(e) =>
                  handleShiftPresetChange(e.target.value as ShiftName)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {meta.shift_names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Shift Start (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={rosterFormStart}
                onChange={(e) => setRosterFormStart(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Shift End (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={rosterFormEnd}
                onChange={(e) => setRosterFormEnd(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Post Location *
            </label>
            <input
              type="text"
              required
              value={rosterFormPost}
              onChange={(e) => setRosterFormPost(e.target.value)}
              placeholder="e.g. Main Entrance Gate 01, Basement Parking B1"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={rosterFormNotes}
              onChange={(e) => setRosterFormNotes(e.target.value)}
              placeholder="Special instructions or relieving details"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRosterModalOpen(false)}
              className="rounded-lg border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRoster}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingRoster ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* =====================================================================
          MODAL 4: QUICK STATUS UPDATE (ROSTER SHIFT)
      ====================================================================== */}
      <CSModal
        isOpen={Boolean(statusUpdateRoster)}
        onClose={() => setStatusUpdateRoster(null)}
        title="Update Shift Status"
        description={`Modify status for ${statusUpdateRoster?.guard?.name || "guard"} on ${statusUpdateRoster?.duty_date} (${statusUpdateRoster?.shift_name}).`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Duty Status
            </label>
            <select
              value={newRosterStatus}
              onChange={(e) =>
                setNewRosterStatus(e.target.value as RosterStatus)
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {meta.roster_statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Status Notes
            </label>
            <textarea
              rows={2}
              value={statusUpdateNotes}
              onChange={(e) => setStatusUpdateNotes(e.target.value)}
              placeholder="e.g. Guard reported 10m early, post handed over smoothly."
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => {
                if (statusUpdateRoster) {
                  handleDeleteRoster(statusUpdateRoster);
                  setStatusUpdateRoster(null);
                }
              }}
              className="rounded-lg border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 px-3 py-2 text-xs font-semibold"
            >
              Delete Shift
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatusUpdateRoster(null)}
                className="rounded-lg border px-3 py-2 font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRosterStatus}
                disabled={isUpdatingStatus}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      </CSModal>

      {/* =====================================================================
          MODAL 5: VISITOR CHECK-IN
      ====================================================================== */}
      <CSModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Visitor Check-In"
        description="Register an outside visitor entering the building premises with vehicle and flat details."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCheckIn} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              value={vFormName}
              onChange={(e) => setVFormName(e.target.value)}
              placeholder="e.g. Kamal Uddin"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={vFormPhone}
                onChange={(e) => setVFormPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Flat / Unit Visited *
              </label>
              <input
                type="text"
                required
                value={vFormFlat}
                onChange={(e) => setVFormFlat(e.target.value)}
                placeholder="e.g. Flat 4-B, Apt 102"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Purpose of Visit *
              </label>
              <select
                value={vFormPurpose}
                onChange={(e) =>
                  setVFormPurpose(e.target.value as VisitorPurpose)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {meta.purposes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Vehicle Number (Optional)
              </label>
              <input
                type="text"
                value={vFormVehicle}
                onChange={(e) => setVFormVehicle(e.target.value)}
                placeholder="e.g. Dhaka Metro GA-11-2233"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                National ID / Token Badge #
              </label>
              <input
                type="text"
                value={vFormBadgeNid}
                onChange={(e) => setVFormBadgeNid(e.target.value)}
                placeholder="e.g. Pass #042 or NID"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Guard On Duty
              </label>
              <select
                value={vFormGuardId || ""}
                onChange={(e) =>
                  setVFormGuardId(Number(e.target.value) || undefined)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Logging Guard</option>
                {meta.guards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={vFormRemarks}
              onChange={(e) => setVFormRemarks(e.target.value)}
              placeholder="e.g. Carrying parcel box for owner"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(false)}
              className="rounded-lg border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingVisitor}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingVisitor ? "Checking In..." : "Confirm Check-In"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
