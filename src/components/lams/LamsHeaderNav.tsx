"use client";

import React from "react";
import {
  Users,
  Compass,
  Handshake,
  FileCheck2,
  CalendarCheck2,
  BarChart3,
  ChevronRight,
  Home,
  Layers,
  Calculator,
  ShieldCheck,
  ClipboardCheck,
  Workflow,
  CreditCard,
} from "lucide-react";

export type LamsTab =
  | "leads"
  | "owners"
  | "valuations"
  | "legal"
  | "duediligence"
  | "negotiation"
  | "approvals"
  | "settlements"
  | "documents"
  | "reports"
  | "followup";

interface LamsHeaderNavProps {
  activeTab: LamsTab;
  onTabChange: (tab: LamsTab) => void;
  showInsights: boolean;
  onToggleInsights: () => void;
  counts?: Partial<Record<LamsTab, number>>;
}

const TABS: { id: LamsTab; label: string; icon: React.ElementType }[] = [
  { id: "leads", label: "Acquisition Leads", icon: Compass },
  { id: "owners", label: "Land Owners", icon: Users },
  { id: "valuations", label: "Land Valuation", icon: Calculator },
  { id: "legal", label: "Legal Verification", icon: ShieldCheck },
  { id: "duediligence", label: "Due Diligence", icon: ClipboardCheck },
  { id: "negotiation", label: "Negotiations", icon: Handshake },
  { id: "approvals", label: "Approvals & Workflow", icon: Workflow },
  { id: "settlements", label: "Settlements & Deeds", icon: CreditCard },
  { id: "documents", label: "Documents Repository", icon: FileCheck2 },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "followup", label: "Follow-Up Schedule", icon: CalendarCheck2 },
];

const TAB_TITLES: Record<LamsTab, string> = {
  leads: "Land Acquisition Leads & Mouza Mapping (Feature 02.01 & 02.03)",
  owners: "Land Owners & Titleholder Directory (Feature 02.02)",
  valuations: "Land Valuation & Rate Analysis (Feature 02.04)",
  legal: "Legal Title Verification & Search (Feature 02.05)",
  duediligence: "Physical & Technical Due Diligence (Feature 02.06)",
  negotiation: "Price Negotiation Process & Counter Offers (Feature 02.07)",
  approvals: "Acquisition Approval Workflow (Feature 02.08 & 02.09)",
  settlements: "Final Settlement & Purchase Agreements (Feature 02.10)",
  documents: "Title Deeds & Legal Documents Repository (Feature 02.11)",
  reports: "Land Acquisition Analytics & Reports (Feature 02.12)",
  followup: "Field Appointments & Follow-Up Schedule",
};

export function LamsHeaderNav({
  activeTab,
  onTabChange,
  showInsights,
  onToggleInsights,
  counts = {},
}: LamsHeaderNavProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner: Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Home className="w-3.5 h-3.5" />
              Home
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Module 02 — LAMS
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {TAB_TITLES[activeTab] || activeTab}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Land Acquisition & Management System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            End-to-end land acquisition lifecycle: Sourcing, Valuations, Legal Search, Due Diligence, Price Bargaining, Multi-tier Approvals, and Deeds.
          </p>
        </div>

        {/* Action button: Toggle Executive Analytics */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleInsights}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
              showInsights
                ? "bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-950/50 dark:border-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-400/30"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{showInsights ? "Hide Analytics Strip" : "Executive Insights"}</span>
          </button>
        </div>
      </div>

      {/* Module Tabs Navigation Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shadow-inner scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
              {typeof count === "number" && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
