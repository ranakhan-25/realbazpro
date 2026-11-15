"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  Clock,
  ShieldCheck,
  Plus,
  RefreshCw,
  ArrowRight,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  WorkflowRuleItem,
  WorkflowRuleStats,
  getWorkflowRules,
  getWorkflowRuleStats,
  createWorkflowRule,
  toggleWorkflowRuleStatus,
  reloadWorkflowEngine,
} from "@/services/customerWorkflowRulesService";

export default function ServiceWorkflowRulesPage() {
  const { primaryColor } = useTheme();
  const { selectedProjectId } = useSelectedProject();
  const [rules, setRules] = useState<WorkflowRuleItem[]>([]);
  const [stats, setStats] = useState<WorkflowRuleStats>({
    total_rules: 0,
    sla_policies: 0,
    auto_routing: 0,
    escalation_matrix: 0,
    statutory_rules: 0,
    active_rules: 0,
    disabled_rules: 0,
    all: 0,
    sla: 0,
    routing: 0,
    escalation: 0,
    statutory: 0,
    active: 0,
    disabled: 0,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRule, setSelectedRule] = useState<WorkflowRuleItem | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] =
    useState<WorkflowRuleItem["ruleType"]>("SLA Policy");
  const [categoryOrTrigger, setCategoryOrTrigger] = useState("");
  const [firstResponseTarget, setFirstResponseTarget] = useState("2 Hours");
  const [resolutionTarget, setResolutionTarget] = useState("24 Hours");
  const [escalationTarget, setEscalationTarget] = useState(
    "QA Lead after 12 Hours",
  );
  const [assignedDepartment, setAssignedDepartment] = useState(
    "Site Engineering & QA",
  );
  const [operatingHours, setOperatingHours] = useState(
    "Office Hours (Sat-Thu 9am-6pm)",
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, rulesData] = await Promise.all([
        getWorkflowRuleStats(selectedProjectId || undefined),
        getWorkflowRules({
          project_id: selectedProjectId || undefined,
          tab: activeTab !== "all" ? activeTab : undefined,
          limit: 100,
        }),
      ]);
      setStats(statsData);
      setRules(rulesData.items);
    } catch (err: unknown) {
      console.error("Error loading workflow rules:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to load workflow rules";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (rule: WorkflowRuleItem) => {
    try {
      const updated = await toggleWorkflowRuleStatus(rule.uuid);
      setRules((prev) =>
        prev.map((r) =>
          r.uuid === rule.uuid ? { ...r, status: updated.status } : r,
        ),
      );
      if (selectedRule && selectedRule.uuid === rule.uuid) {
        setSelectedRule((prev) =>
          prev ? { ...prev, status: updated.status } : null,
        );
      }
      toast.success(
        `Rule ${rule.ruleCode} status changed to ${updated.status}.`,
      );
      getWorkflowRuleStats(selectedProjectId || undefined)
        .then(setStats)
        .catch(() => { });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to toggle rule status";
      toast.error(errorMsg);
    }
  };

  const handleReloadEngine = async () => {
    setIsReloading(true);
    try {
      const res = await reloadWorkflowEngine();
      toast.success(
        res.message || "Workflow routing engine rules refreshed successfully.",
      );
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to reload engine";
      toast.error(errorMsg);
    } finally {
      setIsReloading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !categoryOrTrigger.trim()) {
      toast.error("Please fill in rule name and trigger condition.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkflowRule({
        project_id: selectedProjectId || undefined,
        rule_name: ruleName.trim(),
        rule_type: ruleType,
        category_or_trigger: categoryOrTrigger.trim(),
        first_response_target: firstResponseTarget,
        resolution_target: resolutionTarget,
        escalation_target: escalationTarget.trim() || undefined,
        assigned_department: assignedDepartment,
        operating_hours: operatingHours,
        status: "Active",
      });

      toast.success(`Workflow rule "${ruleName}" successfully created.`);
      setIsModalOpen(false);
      setRuleName("");
      setCategoryOrTrigger("");
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to create workflow rule";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<WorkflowRuleItem>[] = [
    {
      header: "RULE NAME & CODE",
      accessorKey: "ruleName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[#111827]">{row.ruleName}</div>
          <div className="text-xs text-[#6B7280]">
            <span className="font-semibold text-[#4B5563] tabular-nums">
              {row.ruleCode}
            </span>{" "}
            • {row.ruleType}
          </div>
        </div>
      ),
    },
    {
      header: "TRIGGER CONDITION / SCOPE",
      accessorKey: "categoryOrTrigger",
      cell: (row) => (
        <p className="text-xs text-[#374151] max-w-xs font-medium">
          {row.categoryOrTrigger}
        </p>
      ),
    },
    {
      header: "SLA TARGETS",
      accessorKey: "resolutionTarget",
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[#111827]">
            Resolution:{" "}
            <span className="font-semibold text-[#027A48] tabular-nums">
              {row.resolutionTarget}
            </span>
          </div>
          <div className="text-[#6B7280] text-[11px] tabular-nums">
            1st Response: {row.firstResponseTarget}
          </div>
        </div>
      ),
    },
    {
      header: "ASSIGNED DEPARTMENT",
      accessorKey: "assignedDepartment",
      cell: (row) => (
        <div className="text-xs font-semibold text-[#111827]">
          {row.assignedDepartment}
        </div>
      ),
    },
    {
      header: "OPERATING SCHEDULE",
      accessorKey: "operatingHours",
      cell: (row) => (
        <span className="text-xs text-[#6B7280]">{row.operatingHours}</span>
      ),
    },
    {
      header: "STATUS",
      accessorKey: "status",
      cell: (row) => (
        <button
          onClick={() => handleToggle(row)}
          className={`h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition shadow-2xs ${row.status === "Active"
              ? "bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] hover:bg-[#D1FADF]"
              : "bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          title="Click to toggle status"
          aria-label="Toggle rule status"
        >
          {row.status === "Active" ? (
            <ToggleRight className="h-4 w-4 text-[#027A48]" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-[#9CA3AF]" />
          )}
          <span>{row.status}</span>
        </button>
      ),
    },
    {
      header: "ACTION",
      accessorKey: "id",
      align: "right",
      minWidth: "90px",
      cell: (row) => (
        <div className="flex items-center justify-end pr-2">
          <button
            onClick={() => setSelectedRule(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title="View Details"
            aria-label="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Service & Workflow Rules Configuration"
        description="Configure automated SLA resolution thresholds, intelligent ticket routing policies, multi-tier escalation triggers, and statutory DLP compliance policies."
        badgeText="Workflow Engine"
        primaryAction={{
          label: "Create Workflow Rule",
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
        secondaryActions={[
          {
            label: isReloading ? "Reloading..." : "Reload Engine",
            icon: RefreshCw,
            onClick: handleReloadEngine,
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Active SLA Policies"
          value={`${stats.sla || 0} Policies`}
          subtitle="Governing service resolution targets"
          icon={Clock}
          color="blue"
        />
        <CSStatCard
          title="Intelligent Routing Rules"
          value={`${stats.routing || 0} Rules`}
          subtitle="Auto-dispatch to site engineers"
          icon={Sliders}
          color="purple"
        />
        <CSStatCard
          title="Escalation Tiers"
          value={`${stats.escalation || 0} Rules`}
          subtitle="Lead Engr -> QA -> Director"
          icon={ArrowRight}
          color="amber"
        />
        <CSStatCard
          title="Statutory Act 2010 Policy"
          value={`${stats.statutory || 0} Enforced`}
          subtitle="Mandatory 2-yr warranty active"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Rules", count: stats.all || 0 },
          { key: "sla", label: "SLA Policies", count: stats.sla || 0 },
          { key: "routing", label: "Auto-Routing", count: stats.routing || 0 },
          {
            key: "escalation",
            label: "Escalation Matrix",
            count: stats.escalation || 0,
          },
          {
            key: "statutory",
            label: "Statutory Policies",
            count: stats.statutory || 0,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        searchPlaceholder="Search by rule name, trigger, department, or rule code..."
        exportFileName="RealBiz_Workflow_Rules"
      />

      {/* Modal */}
      <CSModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Service & Workflow Rule"
        description="Define automatic routing, response thresholds, and escalations."
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Rule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sanitary & Water Leakage Immediate Dispatch"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Rule Type *
              </label>
              <select
                value={ruleType}
                onChange={(e) =>
                  setRuleType(e.target.value as WorkflowRuleItem["ruleType"])
                }
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="SLA Policy">SLA Policy</option>
                <option value="Auto-Routing">Auto-Routing Rule</option>
                <option value="Escalation Matrix">Escalation Matrix</option>
                <option value="Statutory Rule">
                  Statutory Real Estate Act Rule
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Assigned Department *
              </label>
              <select
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="Site Engineering & QA">
                  Site Engineering & QA
                </option>
                <option value="Finishing Sub-contractor Care">
                  Finishing Sub-contractor Care
                </option>
                <option value="Post-Sales Accounts Team">
                  Post-Sales Accounts Team
                </option>
                <option value="Legal & Land Affairs">
                  Legal & Land Affairs
                </option>
                <option value="CX Leadership">CX Leadership</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Category or Trigger Condition *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Water Seepage, Bathroom backflow, Pipe leakage"
              value={categoryOrTrigger}
              onChange={(e) => setCategoryOrTrigger(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                1st Response Target
              </label>
              <select
                value={firstResponseTarget}
                onChange={(e) => setFirstResponseTarget(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="30 Minutes">30 Minutes</option>
                <option value="1 Hour">1 Hour</option>
                <option value="2 Hours">2 Hours</option>
                <option value="4 Hours">4 Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Target Resolution Time
              </label>
              <select
                value={resolutionTarget}
                onChange={(e) => setResolutionTarget(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="12 Hours">12 Hours</option>
                <option value="24 Hours">24 Hours</option>
                <option value="48 Hours">48 Hours</option>
                <option value="72 Hours">72 Hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Escalation Protocol
              </label>
              <input
                type="text"
                placeholder="e.g. QA Lead after 12 Hours"
                value={escalationTarget}
                onChange={(e) => setEscalationTarget(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Operating Schedule
              </label>
              <select
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="Office Hours (Sat-Thu 9am-6pm)">
                  Office Hours (Sat-Thu 9am-6pm)
                </option>
                <option value="24/7 Priority">24/7 Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 text-xs font-medium rounded-lg border border-[#D0D5DD] hover:bg-[#F9FAFB] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-medium text-white rounded-lg transition shadow-xs hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: primaryColor || "#6D4AFF" }}
            >
              {isSubmitting ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* Drawer */}
      <CSDetailDrawer
        isOpen={!!selectedRule}
        onClose={() => setSelectedRule(null)}
        title={`Workflow Rule: ${selectedRule?.ruleCode || ""}`}
        subtitle={`${selectedRule?.ruleName || ""} • ${selectedRule?.ruleType || ""}`}
      >
        {selectedRule && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] space-y-2">
              <div className="text-xs font-semibold text-[#6B7280]">
                Rule Classification
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#111827]">
                  {selectedRule.ruleType}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${selectedRule.status === "Active"
                      ? "bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48]"
                      : "bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563]"
                    }`}
                >
                  {selectedRule.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Scope & Thresholds
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">First Response:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">
                    {selectedRule.firstResponseTarget}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Resolution Target:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">
                    {selectedRule.resolutionTarget}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Operating Schedule:</span>
                  <div className="font-semibold text-[#111827]">
                    {selectedRule.operatingHours}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Assigned Team:</span>
                  <div className="font-semibold text-[#111827]">
                    {selectedRule.assignedDepartment}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Escalation Protocol
              </h4>
              <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#111827] font-medium leading-relaxed">
                {selectedRule.escalationTarget ||
                  "Standard tiered escalation applies"}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleToggle(selectedRule);
                }}
                className="flex-1 h-9 text-xs font-medium text-white rounded-lg transition shadow-xs hover:opacity-95"
                style={{ backgroundColor: primaryColor || "#6D4AFF" }}
              >
                {selectedRule.status === "Active"
                  ? "Disable Rule"
                  : "Activate Rule"}
              </button>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
