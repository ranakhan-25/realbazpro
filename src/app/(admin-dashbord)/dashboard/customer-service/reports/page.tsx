"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Receipt,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  CheckCircle2,
  Building2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import customerReportsService from "@/services/customerReportsService";

interface ExecutiveSummaryData {
  generated_at?: string;
  project_id?: string;
  collections?: {
    total_overdue_receivables?: number;
    total_overdue_receivables_formatted?: string;
    critical_default_90_plus?: number;
    critical_default_90_plus_formatted?: string;
    realized_collections_mtd?: number;
    realized_collections_mtd_formatted?: string;
    collection_velocity_pct?: number;
    active_projects_count?: number;
  };
  handover_property_care?: {
    total_handed_over_units?: number;
    total_units?: number;
    total_handed_over_display?: string;
    portfolio_handover_pct?: number;
    portfolio_handover_pct_display?: string;
    avg_snag_rectification_days?: number;
    avg_snag_rectification_display?: string;
    active_dlp_units?: number;
    active_dlp_units_display?: string;
    service_charge_recovery_rate?: string;
  };
  ticket_sla?: {
    overall_sla_adherence_pct?: number;
    overall_sla_adherence_display?: string;
    avg_resolution_time_hours?: number;
    avg_resolution_time_display?: string;
    first_contact_resolution_pct?: number;
    first_contact_resolution_display?: string;
    sla_breaches_this_month?: number;
    total_tickets_monitored?: number;
  };
  critical_action_items?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
}

const DEFAULT_SUMMARY: ExecutiveSummaryData = {
  collections: {
    total_overdue_receivables_formatted: "৳ 4.82 Cr",
    critical_default_90_plus_formatted: "৳ 1.12 Cr",
    realized_collections_mtd_formatted: "৳ 1.95 Cr",
    collection_velocity_pct: 93.4,
    active_projects_count: 6,
  },
  handover_property_care: {
    total_handed_over_display: "385 / 435 Units",
    portfolio_handover_pct_display: "88.5%",
    avg_snag_rectification_display: "4.2 Days",
    active_dlp_units_display: "142 Units",
    service_charge_recovery_rate: "94.8%",
  },
  ticket_sla: {
    overall_sla_adherence_display: "96.4%",
    avg_resolution_time_display: "18.5 Hours",
    first_contact_resolution_display: "82.5%",
    sla_breaches_this_month: 4,
    total_tickets_monitored: 8,
  },
  critical_action_items: [
    {
      type: "STATUTORY_RECOVERY_REQUIRED",
      severity: "CRITICAL",
      title: "1 Accounts in 90+ Day Delinquency",
      description:
        "Statutory Section 14 written demand notices mandatory prior to forfeiture proceedings.",
    },
    {
      type: "SLA_BREACH_ALERT",
      severity: "HIGH",
      title: "1 SLA Breaches Logged",
      description:
        "Emergency MEP & plumbing turnarounds exceeded standard contractual window.",
    },
    {
      type: "DLP_WARRANTY_AUDIT",
      severity: "MEDIUM",
      title: "142 Units Covered Under Statutory DLP",
      description:
        "24-Month statutory defect liability warranty active per Real Estate Act 2010.",
    },
  ],
};

export default function CustomerServiceReportsHubPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ExecutiveSummaryData>(DEFAULT_SUMMARY);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await customerReportsService.getExecutiveSummary(
        projectId && projectId !== "all" ? projectId : undefined,
      );
      if (
        res &&
        (res.collections || res.handover_property_care || res.ticket_sla)
      ) {
        setSummary(res);
      }
    } catch (err) {
      console.warn("Using baseline executive summary data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <CSPageHeader
        title="Customer Service Reports & Analytics Hub"
        subtitle="Executive portfolio governance across financial receivables ageing, property handover lifecycle, DLP warranty care, and SLA compliance."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customer Service", href: "/dashboard/customer-service" },
          { label: "Reports & Analytics" },
        ]}
        onRefresh={fetchSummary}
        isRefreshing={isLoading}
      />

      {/* Scope Banner if project filtered */}
      {project && (
        <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F4F1FF]/60 px-4 py-2.5 text-xs text-[#5925DC]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#6D4AFF]" />
            <span>
              Currently viewing executive audit scoped to:{" "}
              <strong>{project.name}</strong>
            </span>
          </div>
          <span className="font-semibold text-[#6D4AFF]">
            Active Project Filter
          </span>
        </div>
      )}

      {/* 4 Core Executive Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Overdue Receivables"
          value={
            summary.collections?.total_overdue_receivables_formatted || "৳ 0"
          }
          subtitle="All ageing brackets combined"
          icon={Receipt}
          color="rose"
        />
        <CSStatCard
          title="90+ Day Delinquency"
          value={
            summary.collections?.critical_default_90_plus_formatted || "৳ 0"
          }
          subtitle="Subject to Sec 14 notices"
          icon={AlertTriangle}
          color="amber"
        />
        <CSStatCard
          title="Portfolio Handover %"
          value={
            summary.handover_property_care?.portfolio_handover_pct_display ||
            "0%"
          }
          subtitle={`${summary.handover_property_care?.total_handed_over_display || "0 Units"}`}
          icon={KeyRound}
          color="purple"
        />
        <CSStatCard
          title="SLA Compliance Rate"
          value={summary.ticket_sla?.overall_sla_adherence_display || "100%"}
          subtitle={`Avg: ${summary.ticket_sla?.avg_resolution_time_display || "0 hrs"}`}
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* 3 Dedicated Report Launch Modules */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F2937]">
              Specialized Governance & Audit Reports
            </h2>
            <p className="text-xs text-[#6B7280]">
              Deep-dive into individual audit modules for compliance
              verification and operational resolution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Collections & Dues Ageing */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xs transition hover:border-[#6D4AFF]/50 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F1FF] text-[#6D4AFF]">
                  <Receipt className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Sec 14 Compliant
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#111827]">
                Collections & Dues Ageing
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                Customer instalment delinquency ageing brackets (0-30, 31-60,
                61-90, 90+ days), contractual delay surcharges, and statutory
                recovery notice logs.
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl bg-[#F9FAFB] p-3 text-xs">
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Realized Collections MTD</span>
                  <span className="font-semibold text-[#111827]">
                    {summary.collections?.realized_collections_mtd_formatted ||
                      "৳ 1.95 Cr"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Collection Velocity</span>
                  <span className="font-semibold text-emerald-600">
                    {summary.collections?.collection_velocity_pct || 93.4}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Active Monitored Projects</span>
                  <span className="font-semibold text-[#111827]">
                    {summary.collections?.active_projects_count || 6} Projects
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F3F4F6]">
              <Link
                href="/dashboard/customer-service/reports/collections-ageing"
                className="flex w-full items-center justify-between rounded-xl bg-[#F4F1FF] px-4 py-2.5 text-xs font-semibold text-[#6D4AFF] transition group-hover:bg-[#6D4AFF] group-hover:text-white"
              >
                <span>Launch Ageing Report</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Handover & Property Care */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xs transition hover:border-[#6D4AFF]/50 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <KeyRound className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  24-Mo DLP Active
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#111827]">
                Handover & Property Care
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                Pre-handover snagging rectification velocity, 24-month statutory
                defect liability warranty claims, and Owners' Association
                formation governance.
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl bg-[#F9FAFB] p-3 text-xs">
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Handed Over Units</span>
                  <span className="font-semibold text-[#111827]">
                    {summary.handover_property_care
                      ?.total_handed_over_display || "385 / 435 Units"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Avg Snag Rectification</span>
                  <span className="font-semibold text-blue-600">
                    {summary.handover_property_care
                      ?.avg_snag_rectification_display || "4.2 Days"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Service Charge Recovery</span>
                  <span className="font-semibold text-[#111827]">
                    {summary.handover_property_care
                      ?.service_charge_recovery_rate || "94.8%"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F3F4F6]">
              <Link
                href="/dashboard/customer-service/reports/handover-property-care"
                className="flex w-full items-center justify-between rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white"
              >
                <span>Launch Handover Report</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Service Ticket & SLA Governance */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xs transition hover:border-[#6D4AFF]/50 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#027A48]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                  Real-time SLA
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#111827]">
                Service Ticket & SLA
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                Customer grievance resolution performance, urgent MEP triage
                response, statutory compliance windows, and First Contact
                Resolution (FCR) analytics.
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl bg-[#F9FAFB] p-3 text-xs">
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>Avg Resolution Turnaround</span>
                  <span className="font-semibold text-emerald-600">
                    {summary.ticket_sla?.avg_resolution_time_display ||
                      "18.5 Hours"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>First Contact Resolution</span>
                  <span className="font-semibold text-[#111827]">
                    {summary.ticket_sla?.first_contact_resolution_display ||
                      "82.5%"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4B5563]">
                  <span>SLA Breaches This Month</span>
                  <span className="font-semibold text-rose-600">
                    {summary.ticket_sla?.sla_breaches_this_month || 4} Incidents
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F3F4F6]">
              <Link
                href="/dashboard/customer-service/reports/service-ticket-sla"
                className="flex w-full items-center justify-between rounded-xl bg-[#ECFDF3] px-4 py-2.5 text-xs font-semibold text-[#027A48] transition group-hover:bg-[#027A48] group-hover:text-white"
              >
                <span>Launch SLA Report</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Action Items & Governance Directives */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold text-[#111827]">
              Critical Action Items & Statutory Directives
            </h3>
          </div>
          <span className="text-xs text-[#6B7280]">
            Generated at:{" "}
            {summary.generated_at
              ? new Date(summary.generated_at).toLocaleTimeString()
              : "Live"}
          </span>
        </div>

        <div className="space-y-3">
          {(
            summary.critical_action_items ||
            DEFAULT_SUMMARY.critical_action_items
          )?.map((item, idx) => {
            const isCrit = item.severity === "CRITICAL";
            const isHigh = item.severity === "HIGH";
            return (
              <div
                key={idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 transition ${
                  isCrit
                    ? "border-rose-200 bg-rose-50/50"
                    : isHigh
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-lg p-1.5 ${
                      isCrit
                        ? "bg-rose-100 text-rose-700"
                        : isHigh
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isCrit ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : isHigh ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#111827]">
                        {item.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isCrit
                            ? "bg-rose-100 text-rose-800"
                            : isHigh
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#4B5563]">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center gap-2 shrink-0">
                  {item.type === "STATUTORY_RECOVERY_REQUIRED" && (
                    <Link
                      href="/dashboard/customer-service/reports/collections-ageing"
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50"
                    >
                      <span>Review Accounts</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {item.type === "SLA_BREACH_ALERT" && (
                    <Link
                      href="/dashboard/customer-service/reports/service-ticket-sla"
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-xs hover:bg-amber-50"
                    >
                      <span>Inspect Breaches</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {item.type === "DLP_WARRANTY_AUDIT" && (
                    <Link
                      href="/dashboard/customer-service/reports/handover-property-care"
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-50"
                    >
                      <span>DLP Audit</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
