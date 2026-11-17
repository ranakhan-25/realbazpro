"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  FileText,
  Plus,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  CommitteeMemberType,
  CommitteeDesignation,
  CommitteeMemberStatus,
  DecisionStatus,
  CommitteeMemberItem,
  CommitteeDecisionItem,
  CommitteeOverviewStats,
  createCommitteeMember,
  getCommitteeMembers,
  updateCommitteeMember,
  deleteCommitteeMember,
  createCommitteeDecision,
  getCommitteeDecisions,
  updateCommitteeDecision,
  deleteCommitteeDecision,
  getCommitteeOverviewStats,
} from "@/services/customerBuildingCommitteeService";

const TABS = [
  { id: "members", label: "Committee Members" },
  { id: "roles", label: "Roles & Governance" },
  { id: "decisions", label: "Meeting Decisions" },
];

export default function BuildingCommitteePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const {
    projectId,
    project,
    isLoading: isProjectLoading,
  } = useSelectedProject();

  const [activeTab, setActiveTab] = useState("members");

  // ---------------------------------------------------------------------------
  // TAB 1: MEMBERS STATE
  // ---------------------------------------------------------------------------
  const [members, setMembers] = useState<CommitteeMemberItem[]>([]);
  const [membersStats, setMembersStats] = useState({
    total_members: 0,
    active_members: 0,
    developer_reps_count: 0,
    flat_owners_count: 0,
  });
  const [memberTypeFilter, setMemberTypeFilter] = useState("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 3: DECISIONS STATE
  // ---------------------------------------------------------------------------
  const [decisions, setDecisions] = useState<CommitteeDecisionItem[]>([]);
  const [decisionsStats, setDecisionsStats] = useState({
    total_decisions: 0,
    approved_count: 0,
    in_progress_count: 0,
    implemented_count: 0,
  });
  const [decisionStatusFilter, setDecisionStatusFilter] = useState("all");
  const [decisionSearch, setDecisionSearch] = useState("");
  const [isDecisionsLoading, setIsDecisionsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // MODALS STATE
  // ---------------------------------------------------------------------------
  // 1. Member Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] =
    useState<CommitteeMemberItem | null>(null);
  const [memberForm, setMemberForm] = useState({
    member_type: "FLAT_OWNER" as CommitteeMemberType,
    flat_number: "",
    name: "",
    designation: "Member" as CommitteeDesignation,
    responsibility: "",
    phone: "",
    email: "",
    term_start: new Date().toISOString().slice(0, 10),
    term_end: "",
    status: "ACTIVE" as CommitteeMemberStatus,
    notes: "",
  });

  // 2. Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] =
    useState<CommitteeDecisionItem | null>(null);
  const [decisionForm, setDecisionForm] = useState({
    title: "",
    meeting_date: new Date().toISOString().slice(0, 10),
    agenda_category: "General Body",
    resolution_notes: "",
    status: "APPROVED" as DecisionStatus,
  });

  // ---------------------------------------------------------------------------
  // DATA LOADERS
  // ---------------------------------------------------------------------------

  const loadMembers = useCallback(async () => {
    if (!projectId) return;
    setIsMembersLoading(true);
    try {
      const res = await getCommitteeMembers({
        project_id: projectId,
        member_type: memberTypeFilter !== "all" ? memberTypeFilter : undefined,
        status: memberStatusFilter !== "all" ? memberStatusFilter : undefined,
        search: memberSearch.trim() || undefined,
        limit: 100,
      });
      setMembers(res.items);
      setMembersStats(res.stats);
    } catch (err) {
      console.error("Failed to load members:", err);
      toast.error("Failed to load committee members");
    } finally {
      setIsMembersLoading(false);
    }
  }, [projectId, memberTypeFilter, memberStatusFilter, memberSearch]);

  const loadDecisions = useCallback(async () => {
    if (!projectId) return;
    setIsDecisionsLoading(true);
    try {
      const res = await getCommitteeDecisions({
        project_id: projectId,
        status:
          decisionStatusFilter !== "all" ? decisionStatusFilter : undefined,
        search: decisionSearch.trim() || undefined,
        limit: 100,
      });
      setDecisions(res.items);
      setDecisionsStats(res.stats);
    } catch (err) {
      console.error("Failed to load decisions:", err);
      toast.error("Failed to load committee meeting decisions");
    } finally {
      setIsDecisionsLoading(false);
    }
  }, [projectId, decisionStatusFilter, decisionSearch]);

  useEffect(() => {
    if (projectId) {
      if (activeTab === "members" || activeTab === "roles") loadMembers();
      else if (activeTab === "decisions") loadDecisions();
    }
  }, [projectId, activeTab, loadMembers, loadDecisions]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      if (editingMember) {
        await updateCommitteeMember(editingMember.uuid, {
          member_type: memberForm.member_type,
          flat_number:
            memberForm.member_type === "FLAT_OWNER"
              ? memberForm.flat_number
              : undefined,
          name: memberForm.name.trim(),
          designation: memberForm.designation,
          responsibility: memberForm.responsibility.trim() || undefined,
          phone: memberForm.phone.trim(),
          email: memberForm.email.trim() || undefined,
          term_start: memberForm.term_start,
          term_end: memberForm.term_end || undefined,
          status: memberForm.status,
          notes: memberForm.notes.trim() || undefined,
        });
        toast.success("Committee member updated");
      } else {
        await createCommitteeMember({
          project_id: projectId,
          member_type: memberForm.member_type,
          flat_number:
            memberForm.member_type === "FLAT_OWNER"
              ? memberForm.flat_number
              : undefined,
          name: memberForm.name.trim(),
          designation: memberForm.designation,
          responsibility: memberForm.responsibility.trim() || undefined,
          phone: memberForm.phone.trim(),
          email: memberForm.email.trim() || undefined,
          term_start: memberForm.term_start,
          term_end: memberForm.term_end || undefined,
          status: memberForm.status,
          notes: memberForm.notes.trim() || undefined,
        });
        toast.success("Committee member registered");
      }
      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save committee member",
      );
    }
  };

  const handleDeleteMember = async (item: CommitteeMemberItem) => {
    if (!confirm(`Remove ${item.name} from the committee?`)) return;
    try {
      await deleteCommitteeMember(item.uuid);
      toast.success("Committee member removed");
      loadMembers();
    } catch {
      toast.error("Failed to delete committee member");
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      if (editingDecision) {
        await updateCommitteeDecision(editingDecision.uuid, {
          title: decisionForm.title.trim(),
          meeting_date: decisionForm.meeting_date,
          agenda_category: decisionForm.agenda_category,
          resolution_notes: decisionForm.resolution_notes.trim(),
          status: decisionForm.status,
        });
        toast.success("Meeting resolution updated");
      } else {
        await createCommitteeDecision({
          project_id: projectId,
          title: decisionForm.title.trim(),
          meeting_date: decisionForm.meeting_date,
          agenda_category: decisionForm.agenda_category,
          resolution_notes: decisionForm.resolution_notes.trim(),
          status: decisionForm.status,
        });
        toast.success("Meeting decision logged");
      }
      setIsDecisionModalOpen(false);
      loadDecisions();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save decision",
      );
    }
  };

  const handleDeleteDecision = async (item: CommitteeDecisionItem) => {
    if (!confirm(`Delete resolution "${item.title}"?`)) return;
    try {
      await deleteCommitteeDecision(item.uuid);
      toast.success("Resolution deleted");
      loadDecisions();
    } catch {
      toast.error("Failed to delete resolution");
    }
  };

  const handleUpdateDecisionStatus = async (
    item: CommitteeDecisionItem,
    newStatus: DecisionStatus,
  ) => {
    try {
      await updateCommitteeDecision(item.uuid, { status: newStatus });
      toast.success(`Resolution status updated to ${newStatus}`);
      loadDecisions();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ---------------------------------------------------------------------------
  // EMPTY STATE / PROJECT REQUIRED
  // ---------------------------------------------------------------------------
  if (!isProjectLoading && !projectId) {
    return (
      <div className="space-y-6">
        <CSPageHeader
          title="Building Committee & Society"
          subtitle="Developer & Flat Owner Governance, Executive Portfolios & Meeting Resolutions"
          badge="Building Management"
          breadcrumbs={[
            { label: "Building Management" },
            { label: "Building Committee" },
          ]}
        />
        <CSSelectProjectEmptyState />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TABLE COLUMNS CONFIGURATION
  // ---------------------------------------------------------------------------

  const memberColumns: Column<CommitteeMemberItem>[] = [
    {
      header: "Member & Representation",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            {item.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {item.name}
              {item.member_type === "DEVELOPER_REP" ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  <Building2 className="w-2.5 h-2.5" /> Developer Rep
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Flat {item.flat_number || "Owner"}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {item.email || "No email listed"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Designation",
      render: (item) => {
        const colors: Record<string, string> = {
          President: "bg-purple-50 text-purple-700 border-purple-200",
          Secretary: "bg-indigo-50 text-indigo-700 border-indigo-200",
          Treasurer: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Advisor: "bg-amber-50 text-amber-700 border-amber-200",
          Member: "bg-slate-50 text-slate-700 border-slate-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colors[item.designation] || "bg-slate-50 text-slate-700"
              }`}
          >
            {item.designation}
          </span>
        );
      },
    },
    {
      header: "Portfolio / Responsibility",
      render: (item) => (
        <div className="text-xs text-slate-700 font-medium max-w-xs">
          {item.responsibility || "General Committee Member"}
        </div>
      ),
    },
    {
      header: "Phone",
      render: (item) => (
        <div className="text-xs font-mono text-slate-700 flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          {item.phone}
        </div>
      ),
    },
    {
      header: "Term Period",
      render: (item) => (
        <div className="text-xs text-slate-600">
          <div>{item.term_start}</div>
          <div className="text-[11px] text-slate-400">
            to {item.term_end || "Ongoing"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : item.status === "TERM_EXPIRED"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-600"
            }`}
        >
          {item.status === "ACTIVE"
            ? "Active Term"
            : item.status === "TERM_EXPIRED"
              ? "Term Expired"
              : "Resigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingMember(item);
              setMemberForm({
                member_type: item.member_type,
                flat_number: item.flat_number || "",
                name: item.name,
                designation: item.designation,
                responsibility: item.responsibility || "",
                phone: item.phone,
                email: item.email || "",
                term_start: item.term_start,
                term_end: item.term_end || "",
                status: item.status,
                notes: item.notes || "",
              });
              setIsMemberModalOpen(true);
            }}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteMember(item)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const decisionColumns: Column<CommitteeDecisionItem>[] = [
    {
      header: "Meeting Date",
      render: (item) => (
        <div className="text-sm font-medium text-slate-700 font-mono">
          {item.meeting_date}
        </div>
      ),
    },
    {
      header: "Agenda Category",
      render: (item) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
          style={{ backgroundColor: `${brand}15`, color: brand }}
        >
          {item.agenda_category}
        </span>
      ),
    },
    {
      header: "Resolution Title & Notes",
      render: (item) => (
        <div className="max-w-md">
          <div className="text-sm font-semibold text-slate-900">
            {item.title}
          </div>
          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">
            {item.resolution_notes}
          </div>
        </div>
      ),
    },
    {
      header: "Implementation Status",
      render: (item) => {
        const colors = {
          APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
          IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
          IMPLEMENTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[item.status] || "bg-slate-50 text-slate-700"
              }`}
          >
            {item.status === "IMPLEMENTED" && (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            {item.status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status !== "IMPLEMENTED" && (
            <button
              onClick={() => handleUpdateDecisionStatus(item, "IMPLEMENTED")}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Mark Done
            </button>
          )}
          <button
            onClick={() => {
              setEditingDecision(item);
              setDecisionForm({
                title: item.title,
                meeting_date: item.meeting_date,
                agenda_category: item.agenda_category,
                resolution_notes: item.resolution_notes,
                status: item.status,
              });
              setIsDecisionModalOpen(true);
            }}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteDecision(item)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <CSPageHeader
        title="Building Committee & Society"
        subtitle={`Building Management • Developer & Flat Owner Executive Committee (${project?.name || "Selected Project"})`}
        badge="Building Management"
        breadcrumbs={[
          { label: "Building Management" },
          { label: "Building Committee" },
        ]}
      >
        <div className="flex items-center gap-2">
          {activeTab === "members" && (
            <button
              onClick={() => {
                setEditingMember(null);
                setMemberForm({
                  member_type: "FLAT_OWNER",
                  flat_number: "",
                  name: "",
                  designation: "Member",
                  responsibility: "",
                  phone: "",
                  email: "",
                  term_start: new Date().toISOString().slice(0, 10),
                  term_end: "",
                  status: "ACTIVE",
                  notes: "",
                });
                setIsMemberModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 shadow-xs transition-all hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Committee Member
            </button>
          )}

          {activeTab === "decisions" && (
            <button
              onClick={() => {
                setEditingDecision(null);
                setDecisionForm({
                  title: "",
                  meeting_date: new Date().toISOString().slice(0, 10),
                  agenda_category: "General Body",
                  resolution_notes: "",
                  status: "APPROVED",
                });
                setIsDecisionModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 shadow-xs transition-all hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Log Meeting Decision
            </button>
          )}
        </div>
      </CSPageHeader>

      {/* 2. Top Navigation Tabs */}
      <div className="flex border-b border-[#E5E7EB] bg-white px-2 rounded-t-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === tab.id
                ? "border-current text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
              }`}
            style={{
              borderColor: activeTab === tab.id ? brand : "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMMITTEE MEMBERS */}
      {/* ========================================================================= */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Committee Members"
              value={membersStats.total_members}
              subtitle="Registered representatives"
              icon={Users}
              color="purple"
            />
            <CSStatCard
              title="Active Term Members"
              value={membersStats.active_members}
              subtitle="Currently holding executive office"
              icon={Award}
              isPositive={true}
              color="emerald"
            />
            <CSStatCard
              title="Flat Owners"
              value={membersStats.flat_owners_count}
              subtitle="Resident apartment owners"
              icon={Building}
              color="blue"
            />
            <CSStatCard
              title="Developer Representatives"
              value={membersStats.developer_reps_count}
              subtitle="Real estate developer delegates"
              icon={Building2}
              color="amber"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
            <CSFilterTabs
              tabs={[
                {
                  key: "all",
                  label: "All Members",
                  count: membersStats.total_members,
                },
                {
                  key: "FLAT_OWNER",
                  label: "Flat Owners",
                  count: membersStats.flat_owners_count,
                },
                {
                  key: "DEVELOPER_REP",
                  label: "Developer Reps",
                  count: membersStats.developer_reps_count,
                },
              ]}
              activeTab={memberTypeFilter}
              onChange={setMemberTypeFilter}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member, flat, designation..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          <CSTable
            columns={memberColumns}
            data={members}
            emptyTitle="No committee members found"
            emptySubtitle={`No committee members listed for this project. Click "Add Committee Member" to form the society executive.`}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLES & GOVERNANCE PORTFOLIOS */}
      {/* ========================================================================= */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-white">
            <h3 className="text-sm font-bold text-slate-900">
              Building Society Governance Structure
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cooperative oversight between developer representatives and flat
              owners to ensure long-term building maintenance, security
              standards, and financial solvency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* President */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      President
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Chief Executive Officer
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  Executive
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Presides over AGM and monthly committee meetings, liaises with
                municipal authorities, and holds executive signing authority.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned Member:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find((m) => m.designation === "President")?.name || (
                    <span className="text-slate-400 italic font-normal">
                      Vacant / Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* General Secretary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      General Secretary
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Operational Head
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                  Executive
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Maintains society registers, oversees daily facility operations,
                records minutes of meetings, and coordinates notices to flat
                owners.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned Member:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find((m) => m.designation === "Secretary")?.name || (
                    <span className="text-slate-400 italic font-normal">
                      Vacant / Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Treasurer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Treasurer
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Finance & Accounts
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Executive
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Monitors monthly service charge collections, reviews facility
                expense vouchers, manages bank accounts, and prepares quarterly
                budget audits.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned Member:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find((m) => m.designation === "Treasurer")?.name || (
                    <span className="text-slate-400 italic font-normal">
                      Vacant / Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Security & Access Portfolio */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Security & Access Portfolio
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Guard Supervision
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Monitors guard agency contracts, daily visitor registers, gate
                barrier operations, and CCTV surveillance health.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned In-charge:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find((m) =>
                    m.responsibility?.toLowerCase().includes("security"),
                  )?.name || (
                      <span className="text-slate-400 italic font-normal">
                        Committee Member
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Civil & Utility Maintenance */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Civil & Maintenance Portfolio
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Lift, Generator & Plumbing
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Audits lift AMC servicing, WASA water pump operation, generator
                diesel logs, rooftop waterproofing, and common civil repairs.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned In-charge:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find(
                    (m) =>
                      m.responsibility?.toLowerCase().includes("maintenance") ||
                      m.responsibility?.toLowerCase().includes("civil"),
                  )?.name || (
                      <span className="text-slate-400 italic font-normal">
                        Committee Member
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Resident Relations & Legal */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Resident Liaison & Advisory
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Dispute Mediation
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Assists with neighbor mediation, parking disputes, common
                amenity booking approvals, and bylaws updates.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Assigned Advisor:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {members.find((m) => m.designation === "Advisor")?.name || (
                    <span className="text-slate-400 italic font-normal">
                      Committee Advisor
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MEETING DECISIONS & RESOLUTIONS */}
      {/* ========================================================================= */}
      {activeTab === "decisions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Resolutions"
              value={decisionsStats.total_decisions}
              subtitle="Recorded meeting decisions"
              icon={FileText}
              color="purple"
            />
            <CSStatCard
              title="Implemented"
              value={decisionsStats.implemented_count}
              subtitle="Completed action points"
              icon={CheckCircle2}
              isPositive={true}
              color="emerald"
            />
            <CSStatCard
              title="In Progress"
              value={decisionsStats.in_progress_count}
              subtitle="Action being executed"
              icon={Clock}
              isPositive={true}
              color="amber"
            />
            <CSStatCard
              title="Approved / Pending"
              value={decisionsStats.approved_count}
              subtitle="Awaiting implementation start"
              icon={Award}
              color="blue"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
            <CSFilterTabs
              tabs={[
                {
                  key: "all",
                  label: "All Resolutions",
                  count: decisionsStats.total_decisions,
                },
                {
                  key: "APPROVED",
                  label: "Approved",
                  count: decisionsStats.approved_count,
                },
                {
                  key: "IN_PROGRESS",
                  label: "In Progress",
                  count: decisionsStats.in_progress_count,
                },
                {
                  key: "IMPLEMENTED",
                  label: "Implemented",
                  count: decisionsStats.implemented_count,
                },
              ]}
              activeTab={decisionStatusFilter}
              onChange={setDecisionStatusFilter}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={decisionSearch}
                onChange={(e) => setDecisionSearch(e.target.value)}
                placeholder="Search title, resolution..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          <CSTable
            columns={decisionColumns}
            data={decisions}
            emptyTitle="No meeting decisions recorded"
            emptySubtitle={`No meeting decisions recorded for this project yet. Click "Log Meeting Decision" to add committee minutes.`}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT COMMITTEE MEMBER */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={editingMember ? "Edit Committee Member" : "Add Committee Member"}
        subtitle="Developer Representative or Flat Owner representation in building society"
      >
        <form onSubmit={handleSaveMember} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Representation Type *
              </label>
              <select
                value={memberForm.member_type}
                onChange={(e) =>
                  setMemberForm((p) => ({
                    ...p,
                    member_type: e.target.value as CommitteeMemberType,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="FLAT_OWNER">Flat Owner (Resident)</option>
                <option value="DEVELOPER_REP">Developer Representative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation *
              </label>
              <select
                value={memberForm.designation}
                onChange={(e) =>
                  setMemberForm((p) => ({
                    ...p,
                    designation: e.target.value as CommitteeDesignation,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="President">President</option>
                <option value="Secretary">General Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Member">Executive Member</option>
                <option value="Advisor">Advisor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Member Full Name *
              </label>
              <input
                type="text"
                required
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Engr. Rafiqul Islam"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Flat Number{" "}
                {memberForm.member_type === "FLAT_OWNER" ? "*" : "(Optional)"}
              </label>
              <input
                type="text"
                required={memberForm.member_type === "FLAT_OWNER"}
                value={memberForm.flat_number}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, flat_number: e.target.value }))
                }
                placeholder="e.g. Flat 7-B"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Portfolio / Specific Responsibility
            </label>
            <input
              type="text"
              value={memberForm.responsibility}
              onChange={(e) =>
                setMemberForm((p) => ({ ...p, responsibility: e.target.value }))
              }
              placeholder="e.g. Security & CCTV Oversight, Finance & Audit"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                value={memberForm.phone}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="e.g. +880 1711-000000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="e.g. member@example.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Term Start Date *
              </label>
              <input
                type="date"
                required
                value={memberForm.term_start}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, term_start: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Term End Date
              </label>
              <input
                type="date"
                value={memberForm.term_end}
                onChange={(e) =>
                  setMemberForm((p) => ({ ...p, term_end: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Membership Status *
            </label>
            <select
              value={memberForm.status}
              onChange={(e) =>
                setMemberForm((p) => ({
                  ...p,
                  status: e.target.value as CommitteeMemberStatus,
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
            >
              <option value="ACTIVE">Active Term</option>
              <option value="TERM_EXPIRED">Term Expired</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              {editingMember ? "Update Member" : "Save Member"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT DECISION */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={
          editingDecision ? "Edit Meeting Resolution" : "Log Committee Decision"
        }
        subtitle="Minutes of meeting resolution and action point for after-sales management"
      >
        <form onSubmit={handleSaveDecision} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meeting Date *
              </label>
              <input
                type="date"
                required
                value={decisionForm.meeting_date}
                onChange={(e) =>
                  setDecisionForm((p) => ({
                    ...p,
                    meeting_date: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agenda Category *
              </label>
              <select
                value={decisionForm.agenda_category}
                onChange={(e) =>
                  setDecisionForm((p) => ({
                    ...p,
                    agenda_category: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="Service Charge">Service Charge & Billing</option>
                <option value="Security & Access">
                  Security & Gate Access
                </option>
                <option value="Maintenance">Lift & Utility Maintenance</option>
                <option value="General Body">General Body (AGM / EGM)</option>
                <option value="Civic Liaison">
                  Civic / WASA / DESCO Liaison
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Title *
            </label>
            <input
              type="text"
              required
              value={decisionForm.title}
              onChange={(e) =>
                setDecisionForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g. Approval of new security guard agency contract"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Notes & Action Points *
            </label>
            <textarea
              rows={4}
              required
              value={decisionForm.resolution_notes}
              onChange={(e) =>
                setDecisionForm((p) => ({
                  ...p,
                  resolution_notes: e.target.value,
                }))
              }
              placeholder="Detailed description of the decision, responsible officer, budget approved, and deadlines..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Implementation Status *
            </label>
            <select
              value={decisionForm.status}
              onChange={(e) =>
                setDecisionForm((p) => ({
                  ...p,
                  status: e.target.value as DecisionStatus,
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
            >
              <option value="APPROVED">Approved (Pending Execution)</option>
              <option value="IN_PROGRESS">In Progress (Underway)</option>
              <option value="IMPLEMENTED">Implemented (Completed)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              {editingDecision ? "Update Resolution" : "Save Decision"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
