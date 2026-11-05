"use client";

import React, { useState } from "react";
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

interface ServiceRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  ruleType: "SLA Policy" | "Auto-Routing" | "Escalation Matrix" | "Statutory Rule";
  categoryOrTrigger: string;
  firstResponseTarget: string;
  resolutionTarget: string;
  escalationTarget: string;
  assignedDepartment: string;
  operatingHours: "24/7 Priority" | "Office Hours (Sat-Thu 9am-6pm)";
  status: "Active" | "Disabled";
}

const INITIAL_RULES: ServiceRule[] = [
  {
    id: "RUL-01",
    ruleCode: "SLA-URG-01",
    ruleName: "Critical Structural & MEP Incident",
    ruleType: "SLA Policy",
    categoryOrTrigger: "Water Seepage, Elevator Fault, Sub-station Earthing",
    firstResponseTarget: "1 Hour",
    resolutionTarget: "24 Hours",
    escalationTarget: "Chief Project Engineer after 4 Hours",
    assignedDepartment: "Site Engineering & QA",
    operatingHours: "24/7 Priority",
    status: "Active",
  },
  {
    id: "RUL-02",
    ruleCode: "SLA-STD-02",
    ruleName: "Finishing & Cosmetic Snagging",
    ruleType: "SLA Policy",
    categoryOrTrigger: "Tiles, Paint Touchup, Window Sealant, Door Lock",
    firstResponseTarget: "4 Hours",
    resolutionTarget: "48 Hours",
    escalationTarget: "QA Supervisor after 24 Hours",
    assignedDepartment: "Finishing Sub-contractor Care",
    operatingHours: "Office Hours (Sat-Thu 9am-6pm)",
    status: "Active",
  },
  {
    id: "RUL-03",
    ruleCode: "RTG-ACC-01",
    ruleName: "Payment & Surcharge Inquiries Auto-Routing",
    ruleType: "Auto-Routing",
    categoryOrTrigger: "Installment clarification, Money receipt delay",
    firstResponseTarget: "2 Hours",
    resolutionTarget: "24 Hours",
    escalationTarget: "Head of Accounts after 12 Hours",
    assignedDepartment: "Post-Sales Accounts Team",
    operatingHours: "Office Hours (Sat-Thu 9am-6pm)",
    status: "Active",
  },
  {
    id: "RUL-04",
    ruleCode: "STAT-DLP-01",
    ruleName: "Statutory 2-Year DLP Governance Rule",
    ruleType: "Statutory Rule",
    categoryOrTrigger: "Real Estate Act 2010 Section 13 (Workmanship & Structural Defect)",
    firstResponseTarget: "2 Hours",
    resolutionTarget: "72 Hours",
    escalationTarget: "Managing Director / Project Director",
    assignedDepartment: "Executive Quality Assurance",
    operatingHours: "24/7 Priority",
    status: "Active",
  },
  {
    id: "RUL-05",
    ruleCode: "ESC-TIER-03",
    ruleName: "Customer Detractor Auto-Escalation",
    ruleType: "Escalation Matrix",
    categoryOrTrigger: "NPS Rating <= 6 or Unresolved Complaint > 48 Hours",
    firstResponseTarget: "30 Minutes",
    resolutionTarget: "12 Hours",
    escalationTarget: "Chief Customer Experience Officer",
    assignedDepartment: "CX Leadership",
    operatingHours: "Office Hours (Sat-Thu 9am-6pm)",
    status: "Active",
  },
];

export default function ServiceWorkflowRulesPage() {
  const { primaryColor } = useTheme();
  const [rules, setRules] = useState<ServiceRule[]>(INITIAL_RULES);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRule, setSelectedRule] = useState<ServiceRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState<ServiceRule["ruleType"]>("SLA Policy");
  const [categoryOrTrigger, setCategoryOrTrigger] = useState("");
  const [firstResponseTarget, setFirstResponseTarget] = useState("2 Hours");
  const [resolutionTarget, setResolutionTarget] = useState("24 Hours");
  const [assignedDepartment, setAssignedDepartment] = useState("Site Engineering & QA");

  const filteredRules = rules.filter((r) => {
    if (activeTab === "sla") return r.ruleType === "SLA Policy";
    if (activeTab === "routing") return r.ruleType === "Auto-Routing";
    if (activeTab === "escalation") return r.ruleType === "Escalation Matrix";
    if (activeTab === "statutory") return r.ruleType === "Statutory Rule";
    return true;
  });

  const counts = {
    all: rules.length,
    sla: rules.filter((r) => r.ruleType === "SLA Policy").length,
    routing: rules.filter((r) => r.ruleType === "Auto-Routing").length,
    escalation: rules.filter((r) => r.ruleType === "Escalation Matrix").length,
    statutory: rules.filter((r) => r.ruleType === "Statutory Rule").length,
  };

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Active" ? "Disabled" : "Active" } : r
      )
    );
    toast.success("Rule status updated.");
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !categoryOrTrigger) {
      toast.error("Please fill in rule name and trigger condition.");
      return;
    }

    const newRule: ServiceRule = {
      id: `RUL-${Date.now().toString().slice(-4)}`,
      ruleCode: `RUL-${Math.floor(100 + Math.random() * 900)}`,
      ruleName,
      ruleType,
      categoryOrTrigger,
      firstResponseTarget,
      resolutionTarget,
      escalationTarget: "Escalated to QA Lead after 12h",
      assignedDepartment,
      operatingHours: "Office Hours (Sat-Thu 9am-6pm)",
      status: "Active",
    };

    setRules([newRule, ...rules]);
    toast.success(`Workflow rule "${ruleName}" successfully created.`);
    setIsModalOpen(false);
    setRuleName("");
    setCategoryOrTrigger("");
  };

  const columns: Column<ServiceRule>[] = [
    {
      header: "RULE NAME & CODE",
      accessorKey: "ruleName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[#111827]">{row.ruleName}</div>
          <div className="text-xs text-[#6B7280]">
            <span className="font-semibold text-[#4B5563] tabular-nums">{row.ruleCode}</span> • {row.ruleType}
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
            Resolution: <span className="font-semibold text-[#027A48] tabular-nums">{row.resolutionTarget}</span>
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
        <span className="text-xs text-[#6B7280]">
          {row.operatingHours}
        </span>
      ),
    },
    {
      header: "STATUS",
      accessorKey: "status",
      cell: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={`h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition shadow-2xs ${
            row.status === "Active"
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
            label: "Reload Engine",
            icon: RefreshCw,
            onClick: () => toast.success("Workflow routing engine rules refreshed."),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Active SLA Policies"
          value="5 Policies"
          subtitle="Governing 6 project sites"
          icon={Clock}
          color="blue"
        />
        <CSStatCard
          title="Intelligent Routing Rules"
          value="8 Rules"
          subtitle="Auto-dispatch to site engineers"
          icon={Sliders}
          color="purple"
        />
        <CSStatCard
          title="Escalation Tiers"
          value="3 Levels"
          subtitle="Lead Engr -> QA -> Director"
          icon={ArrowRight}
          color="amber"
        />
        <CSStatCard
          title="Statutory Act 2010 Policy"
          value="Enforced"
          subtitle="Mandatory 2-yr warranty active"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Rules", count: counts.all },
          { key: "sla", label: "SLA Policies", count: counts.sla },
          { key: "routing", label: "Auto-Routing", count: counts.routing },
          { key: "escalation", label: "Escalation Matrix", count: counts.escalation },
          { key: "statutory", label: "Statutory Policies", count: counts.statutory },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={filteredRules}
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
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Rule Name *</label>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Rule Type *</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="SLA Policy">SLA Policy</option>
                <option value="Auto-Routing">Auto-Routing Rule</option>
                <option value="Escalation Matrix">Escalation Matrix</option>
                <option value="Statutory Rule">Statutory Real Estate Act Rule</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Assigned Department *</label>
              <select
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 focus:border-[#6D4AFF] transition"
              >
                <option value="Site Engineering & QA">Site Engineering & QA</option>
                <option value="Finishing Sub-contractor Care">Finishing Sub-contractor Care</option>
                <option value="Post-Sales Accounts Team">Post-Sales Accounts Team</option>
                <option value="Legal & Land Affairs">Legal & Land Affairs</option>
                <option value="CX Leadership">CX Leadership</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Category or Trigger Condition *</label>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">1st Response Target</label>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Target Resolution Time</label>
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

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 text-xs font-medium rounded-lg border border-[#D0D5DD] hover:bg-[#F9FAFB] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-xs font-medium text-white rounded-lg transition shadow-xs hover:opacity-95"
              style={{ backgroundColor: primaryColor || "#6D4AFF" }}
            >
              Save Rule
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
              <div className="text-xs font-semibold text-[#6B7280]">Rule Classification</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#111827]">{selectedRule.ruleType}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  selectedRule.status === "Active"
                    ? "bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48]"
                    : "bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563]"
                }`}>
                  {selectedRule.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Scope & Thresholds</h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">First Response:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedRule.firstResponseTarget}</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Resolution Target:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedRule.resolutionTarget}</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Operating Schedule:</span>
                  <div className="font-semibold text-[#111827]">{selectedRule.operatingHours}</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Assigned Team:</span>
                  <div className="font-semibold text-[#111827]">{selectedRule.assignedDepartment}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Escalation Protocol</h4>
              <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#111827] font-medium leading-relaxed">
                {selectedRule.escalationTarget}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleToggle(selectedRule.id);
                  setSelectedRule(null);
                }}
                className="flex-1 h-9 text-xs font-medium text-white rounded-lg transition shadow-xs hover:opacity-95"
                style={{ backgroundColor: primaryColor || "#6D4AFF" }}
              >
                {selectedRule.status === "Active" ? "Disable Rule" : "Activate Rule"}
              </button>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
