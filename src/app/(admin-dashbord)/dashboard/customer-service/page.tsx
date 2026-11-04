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
  TrendingUp,
  FileText,
  Calendar,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { MOCK_TICKETS, MOCK_BOOKINGS, ServiceTicket } from "@/services/customerServiceData";
import { useTheme } from "@/lib/theme";

export default function CustomerServiceDashboardPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const ticketColumns: Column<ServiceTicket>[] = [
    {
      key: "ticketNo",
      header: "Ticket No & Subject",
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900">{t.ticketNo}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                t.priority === "Urgent"
                  ? "bg-rose-100 text-rose-700 animate-pulse"
                  : t.priority === "High"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {t.priority}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{t.subject}</p>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-800">{t.customerName}</div>
          <div className="text-[11px] text-slate-400">{t.unit}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (t) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
          {t.category}
        </span>
      ),
    },
    {
      key: "slaRemainingHours",
      header: "SLA Status",
      render: (t) => (
        <div>
          {t.isOverdue ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Overdue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Clock className="h-3.5 w-3.5" /> {t.slaRemainingHours}h Left
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            t.status === "Open"
              ? "bg-blue-50 text-blue-700"
              : t.status === "In Progress"
                ? "bg-purple-50 text-purple-700"
                : t.status === "Escalated"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {t.status}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      {/* Header */}
      <CSPageHeader
        title="Post-Sales & Customer Service"
        subtitle="Real Estate customer lifecycle management: collections, handover, snagging, statutory DLP & support."
        badge="Enterprise Hub"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        secondaryAction={{
          label: "Collections Report",
          onClick: () => {
            window.location.href = "/dashboard/customer-service/reports/collections-ageing";
          },
          icon: BarChart3,
        }}
        primaryAction={{
          label: "New Service Request",
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
          change="+18 this mo"
          isPositive={true}
          subtext="Gulshan, Dhanmondi, Bashundhara"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <CSStatCard
          title="Collections MTD"
          value="৳ 3.42 Cr"
          change="92% of target"
          isPositive={true}
          subtext="Target: ৳ 3.75 Cr by 30th"
          icon={Receipt}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <CSStatCard
          title="Overdue Dues (>60 Days)"
          value="৳ 84.5 Lac"
          change="+12% risk"
          isPositive={false}
          subtext="24 units flagged for legal notice"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <CSStatCard
          title="Active DLP & Warranty"
          value="142 Flats"
          change="Real Estate Act 2010"
          isPositive={true}
          subtext="Statutory 2-year maintenance active"
          icon={ShieldCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* KPI Cards Row 2: Service & Handover Velocity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Live Service Tickets"
          value="18 Active"
          change="4 urgent"
          isPositive={false}
          subtext="Avg 1st Response: 42 mins"
          icon={LifeBuoy}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />

        <CSStatCard
          title="SLA Adherence Rate"
          value="96.4%"
          change="+2.1%"
          isPositive={true}
          subtext="Target benchmark >= 95%"
          icon={Clock}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />

        <CSStatCard
          title="Snags in Rectification"
          value="37 Items"
          change="8 pending sign-off"
          isPositive={true}
          subtext="Pre-possession joint inspections"
          icon={KeyRound}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <CSStatCard
          title="CSAT / NPS Score"
          value="4.8 / 5.0"
          change="+72 NPS"
          isPositive={true}
          subtext="184 post-handover survey responses"
          icon={Sparkles}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Grid: Live Queue & Operational Shortcuts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Live Priority Support Queue */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Priority Service Queue & SLA Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Real-time escalated and urgent service tickets requiring engineer dispatch.
              </p>
            </div>
            <Link
              href="/dashboard/customer-service/tickets"
              className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: brand }}
            >
              View All 18 Tickets <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <CSTable
            data={MOCK_TICKETS}
            columns={ticketColumns}
            pageSize={4}
            searchPlaceholder="Filter queue by customer, ticket no or unit..."
            emptyTitle="No pending tickets in live queue"
          />
        </div>

        {/* Right Col: Quick Execution Hubs & Follow-ups */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Operational Quick Links</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                10 Workflows
              </span>
            </h3>

            <div className="space-y-2">
              <Link
                href="/dashboard/customer-service/payments/schedules-demand-letters"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      Demand Letters Generator
                    </div>
                    <div className="text-[11px] text-slate-400">Generate milestone notice PDFs</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/documents/mutation-khatian-tracking"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      e-Mutation & Khatian
                    </div>
                    <div className="text-[11px] text-slate-400">Application No & DCR tracking</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/handover/inspection-snags"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      Snagging & Joint Inspection
                    </div>
                    <div className="text-[11px] text-slate-400">Defect logs before key handover</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/property-care/warranty-dlp"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      2-Year Statutory DLP
                    </div>
                    <div className="text-[11px] text-slate-400">Structural warranty defect claims</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/payments/refunds-adjustments"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      Refunds & Waiver Approval
                    </div>
                    <div className="text-[11px] text-slate-400">Maker-checker approval chain</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Today's Statutory Compliance Alert Card */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Bangladesh Real Estate Act 2010 Notice</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under Section 11(2)(c), builders are legally bound to rectify construction defects
              for a minimum of <strong className="text-slate-900">2 years from the date of physical possession</strong>.
              All DLP timers are synced to possession records.
            </p>
            <div className="pt-1">
              <Link
                href="/dashboard/customer-service/property-care/warranty-dlp"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                Inspect DLP Expiry Roster <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

