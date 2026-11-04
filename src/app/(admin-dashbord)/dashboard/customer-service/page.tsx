"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Receipt,
  FileCheck2,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { MOCK_TICKETS, ServiceTicket } from "@/services/customerServiceData";

export default function CustomerServiceDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const ticketColumns: Column<ServiceTicket>[] = [
    {
      key: "ticketNo",
      header: "Ticket Ref & Subject",
      sortable: true,
      minWidth: "240px",
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#111827] tabular-nums font-sans">{t.ticketNo}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                t.priority === "Urgent"
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : t.priority === "High"
                    ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                    : "bg-[#EFF8FF] text-[#175CD3] border border-[#BFDBFE]"
              }`}
            >
              {t.priority}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#4B5563] line-clamp-1">{t.subject}</p>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      sortable: true,
      minWidth: "180px",
      render: (t) => (
        <div>
          <div className="font-medium text-[#111827]">{t.customerName}</div>
          <div className="text-[12px] text-[#6B7280]">{t.unit}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      minWidth: "130px",
      render: (t) => (
        <span className="inline-block rounded-md bg-[#F2F4F7] px-2 py-0.5 text-xs font-medium text-[#344054] border border-[#E4E7EC]">
          {t.category}
        </span>
      ),
    },
    {
      key: "slaRemainingHours",
      header: "SLA Adherence",
      sortable: true,
      minWidth: "140px",
      render: (t) => (
        <div>
          {t.isOverdue ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2]" />
              <span>SLA Breached</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#027A48]">
              <Clock className="h-3.5 w-3.5 stroke-[2]" />
              <span className="tabular-nums font-sans">{t.slaRemainingHours}h Remaining</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: "120px",
      render: (t) => {
        const badges: Record<string, { bg: string; text: string; dot: string }> = {
          Open: { bg: "bg-[#EFF8FF]", text: "text-[#175CD3]", dot: "bg-[#2E90FA]" },
          "In Progress": { bg: "bg-[#F4F1FF]", text: "text-[#6D4AFF]", dot: "bg-[#9B7DFF]" },
          Escalated: { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", dot: "bg-[#F04438]" },
          Resolved: { bg: "bg-[#ECFDF3]", text: "text-[#027A48]", dot: "bg-[#12B76A]" },
        };
        const s = badges[t.status] || badges.Open;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium border border-[#E5E7EB] ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {t.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      minWidth: "100px",
      align: "right",
      render: (t) => (
        <div className="flex items-center justify-end gap-2 pr-1">
          <Link
            href={`/dashboard/customer-service/tickets`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] shadow-2xs hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
            title="Inspect Service Ticket"
            aria-label="Inspect Service Ticket"
          >
            <Eye className="h-4 w-4 stroke-[1.75]" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <CSPageHeader
        title="Post-Sales & Customer Service"
        subtitle="Linear-density customer experience: milestone billing, handover snagging, statutory DLP tracking, and service governance."
        badge="Enterprise Control"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        secondaryAction={{
          label: "Collections Ledger",
          onClick: () => {
            window.location.href = "/dashboard/customer-service/reports/collections-ageing";
          },
          icon: BarChart3,
        }}
        primaryAction={{
          label: "Log Service Ticket",
          onClick: () => {
            window.location.href = "/dashboard/customer-service/tickets";
          },
          icon: LifeBuoy,
        }}
      />

      {/* KPI Cards Row 1: Operations & Financial Follow-up */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Active Customer Bookings"
          value="486 Units"
          change="+18 this month"
          isPositive={true}
          subtitle="Gulshan, Dhanmondi, Bashundhara"
          icon={Users}
          color="blue"
        />

        <CSStatCard
          title="Collections MTD"
          value="৳ 3.42 Cr"
          change="92% of target"
          isPositive={true}
          subtitle="Target: ৳ 3.75 Cr by 30th"
          icon={Receipt}
          color="emerald"
        />

        <CSStatCard
          title="Overdue Dues (>60 Days)"
          value="৳ 84.5 Lac"
          change="+12% risk"
          isPositive={false}
          subtitle="24 units flagged for statutory notice"
          icon={AlertTriangle}
          color="amber"
        />

        <CSStatCard
          title="Active DLP & Warranty"
          value="142 Flats"
          change="Real Estate Act 2010"
          isPositive={true}
          subtitle="Statutory 2-year maintenance active"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* KPI Cards Row 2: Service & Handover Velocity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Live Service Tickets"
          value="18 Active"
          change="4 urgent"
          isPositive={false}
          subtitle="Avg 1st Response: 42 mins"
          icon={LifeBuoy}
          color="rose"
        />

        <CSStatCard
          title="SLA Adherence Rate"
          value="96.4%"
          change="+2.1%"
          isPositive={true}
          subtitle="Target benchmark >= 95%"
          icon={Clock}
          color="emerald"
        />

        <CSStatCard
          title="Snags in Rectification"
          value="37 Items"
          change="8 pending sign-off"
          isPositive={true}
          subtitle="Pre-possession joint inspections"
          icon={KeyRound}
          color="sky"
        />

        <CSStatCard
          title="CSAT / NPS Rating"
          value="4.8 / 5.0"
          change="+72 NPS"
          isPositive={true}
          subtitle="184 post-handover survey responses"
          icon={Sparkles}
          color="purple"
        />
      </div>

      {/* Main Grid: Live Queue & Operational Shortcuts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Live Priority Support Queue */}
        <div className="space-y-3.5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111827]">
                Priority Service Queue & SLA Tracking
              </h2>
              <p className="text-xs text-[#6B7280]">
                Real-time escalated and urgent service tickets requiring engineer dispatch.
              </p>
            </div>
            <Link
              href="/dashboard/customer-service/tickets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D4AFF] hover:underline"
            >
              <span>View All 18 Tickets</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <CSTable
            data={MOCK_TICKETS}
            columns={ticketColumns}
            pageSize={4}
            searchPlaceholder="Filter queue by customer, ticket no or unit..."
            emptyTitle="No pending tickets in live queue"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Right Col: Quick Execution Hubs & Follow-ups */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-3.5">
            <h3 className="text-[15px] font-semibold text-[#111827] flex items-center justify-between">
              <span>Operational Workflows</span>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                10 Systems
              </span>
            </h3>

            <div className="space-y-2">
              <Link
                href="/dashboard/customer-service/payments/schedules-demand-letters"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#A6F4C5] bg-[#ECFDF3] text-[#039855]">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#111827] group-hover:text-[#6D4AFF] transition">
                      Demand Letters Generator
                    </div>
                    <div className="text-[11px] text-[#6B7280]">Generate milestone notice PDFs</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#6D4AFF] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/documents/mutation-khatian-tracking"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#111827] group-hover:text-[#6D4AFF] transition">
                      e-Mutation & Khatian Records
                    </div>
                    <div className="text-[11px] text-[#6B7280]">Application No & DCR tracking</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#6D4AFF] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/handover/inspection-snags"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#FEDF89] bg-[#FFFAEB] text-[#DC6803]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#111827] group-hover:text-[#6D4AFF] transition">
                      Snagging & Joint Inspection
                    </div>
                    <div className="text-[11px] text-[#6B7280]">Defect logs before key handover</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#6D4AFF] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/property-care/warranty-dlp"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDD6FE] bg-[#F4F1FF] text-[#6D4AFF]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#111827] group-hover:text-[#6D4AFF] transition">
                      2-Year Statutory DLP Governance
                    </div>
                    <div className="text-[11px] text-[#6B7280]">Structural warranty defect claims</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#6D4AFF] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/payments/refunds-adjustments"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#111827] group-hover:text-[#6D4AFF] transition">
                      Refunds & Waiver Chain
                    </div>
                    <div className="text-[11px] text-[#6B7280]">Maker-checker approval hierarchy</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#6D4AFF] group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Statutory Compliance Notice Card with Lavender Anchor Accent */}
          <div className="rounded-[12px] border border-[#C9BFFF] bg-[#F4F1FF] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-2 border-l-4 border-l-[#6D4AFF]">
            <div className="flex items-center gap-2 text-[#2E1A87] font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-[#6D4AFF]" />
              <span>Real Estate Development Act 2010</span>
            </div>
            <p className="text-xs text-[#374151] leading-relaxed">
              Under Section 11(2)(c), builders are legally mandated to rectify construction defects
              for a minimum of <strong className="text-[#111827] font-semibold">2 years from the date of physical possession</strong>.
              All defect liability timers are automatically calculated from endorsed key release records.
            </p>
            <div className="pt-1">
              <Link
                href="/dashboard/customer-service/property-care/warranty-dlp"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:text-[#4F32C7] transition"
              >
                <span>Inspect Active DLP Warranties</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
