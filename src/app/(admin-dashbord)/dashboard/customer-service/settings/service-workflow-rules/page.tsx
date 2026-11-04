"use client";

import React, { useState } from "react";
import {
  Sliders,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
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
      header: "Rule Name & Code",
      accessorKey: "ruleName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.ruleName}</div>
          <div className="text-xs text-muted-foreground">{row.ruleCode} • {row.ruleType}</div>
        </div>
      ),
    },
    {
      header: "Trigger Condition / Scope",
      accessorKey: "categoryOrTrigger",
      cell: (row) => (
        <p className="text-xs text-foreground/90 max-w-xs font-medium">
          {row.categoryOrTrigger}
        </p>
      ),
    },
    {
      header: "SLA Targets",
      accessorKey: "resolutionTarget",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground">
            Resolution: <span className="font-semibold">{row.resolutionTarget}</span>
          </div>
          <div className="text-muted-foreground text-[11px]">
            1st Response: {row.firstResponseTarget}
          </div>
        </div>
      ),
    },
    {
      header: "Assigned Department",
      accessorKey: "assignedDepartment",
      cell: (row) => (
        <div className="text-xs font-medium text-foreground">
          {row.assignedDepartment}
        </div>
      ),
    },
    {
      header: "Operating Schedule",
      accessorKey: "operatingHours",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.operatingHours}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            row.status === "Active"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {row.status === "Active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          {row.status}
        </button>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedRule(row)}
            className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
        onChange={setActiveTab}
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
            <label className="block text-xs font-medium text-foreground mb-1">Rule Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sanitary & Water Leakage Immediate Dispatch"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Rule Type *</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="SLA Policy">SLA Policy</option>
                <option value="Auto-Routing">Auto-Routing Rule</option>
                <option value="Escalation Matrix">Escalation Matrix</option>
                <option value="Statutory Rule">Statutory Real Estate Act Rule</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Assigned Department *</label>
              <select
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <label className="block text-xs font-medium text-foreground mb-1">Category or Trigger Condition *</label>
            <input
              type="text"
              required
              placeholder="e.g. Water Seepage, Bathroom backflow, Pipe leakage"
              value={categoryOrTrigger}
              onChange={(e) => setCategoryOrTrigger(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">1st Response Target</label>
              <select
                value={firstResponseTarget}
                onChange={(e) => setFirstResponseTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="30 Minutes">30 Minutes</option>
                <option value="1 Hour">1 Hour</option>
                <option value="2 Hours">2 Hours</option>
                <option value="4 Hours">4 Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Resolution Time</label>
              <select
                value={resolutionTarget}
                onChange={(e) => setResolutionTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="12 Hours">12 Hours</option>
                <option value="24 Hours">24 Hours</option>
                <option value="48 Hours">48 Hours</option>
                <option value="72 Hours">72 Hours</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-foreground/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-sm"
              style={{ backgroundColor: primaryColor }}
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
        title={`Workflow Rule: ${selectedRule?.ruleCode}`}
        subtitle={`${selectedRule?.ruleName} • ${selectedRule?.ruleType}`}
      >
        {selectedRule && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-2">
              <div className="text-xs text-muted-foreground">Rule Classification</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{selectedRule.ruleType}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  selectedRule.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                }`}>
                  {selectedRule.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scope & Thresholds</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">First Response:</span>
                  <div className="font-semibold text-foreground">{selectedRule.firstResponseTarget}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Resolution Target:</span>
                  <div className="font-semibold text-foreground">{selectedRule.resolutionTarget}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Operating Schedule:</span>
                  <div className="font-semibold text-foreground">{selectedRule.operatingHours}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Team:</span>
                  <div className="font-semibold text-foreground">{selectedRule.assignedDepartment}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escalation Protocol</h4>
              <div className="p-3 rounded-lg border border-border bg-background text-xs text-foreground font-medium">
                {selectedRule.escalationTarget}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleToggle(selectedRule.id);
                  setSelectedRule(null);
                }}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
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

