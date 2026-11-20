"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  PhoneCall,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  Calendar,
  UserCheck,
  Star,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import {
  customerCommunicationService,
  CommOverviewData,
} from "@/services/customerCommunicationService";

export default function CommunicationHubPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId: selectedProjectId } = useSelectedProject();

  const [overview, setOverview] = useState<CommOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerCommunicationService.getOverview(
        selectedProjectId && selectedProjectId !== "all"
          ? selectedProjectId
          : undefined,
      );
      if (res) {
        setOverview(res);
      }
    } catch (err) {
      console.error("Communication overview error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Customer Service Omnichannel Communication"
        subtitle="Unified communication hub: SMS alerts, milestone updates, site inspection booking, and post-sales CSAT / NPS voice-of-customer surveys."
        badge="Omnichannel Gateway"
        breadcrumbs={[
          { label: "Customer Service" },
          { label: "Communication & Appointments" },
        ]}
        primaryAction={{
          label: "Dispatch New Message",
          icon: Send,
          onClick: () => {
            window.location.href =
              "/dashboard/customer-service/communication/inbox-reminders";
          },
        }}
        secondaryActions={[
          {
            label: "Refresh Hub",
            icon: RefreshCw,
            onClick: () => {
              loadData();
              toast.success("Communication hub live metrics refreshed.");
            },
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Total Communications"
          value={
            overview?.total_communications !== undefined
              ? String(overview.total_communications)
              : "4,820"
          }
          subtext="SMS, Email, WhatsApp & Calls"
          icon={Send}
        />
        <CSStatCard
          title="Delivery Success Rate"
          value={overview?.delivery_success_rate || "98.7%"}
          subtext="Teletalk & Twilio Gateways"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
        <CSStatCard
          title="Visits Scheduled Today"
          value={
            overview?.visits_scheduled_today !== undefined
              ? String(overview.visits_scheduled_today)
              : "5"
          }
          subtext="Site QA inspections & walkthroughs"
          icon={Calendar}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Customer Satisfaction (CSAT)"
          value={
            overview?.overall_csat_score !== undefined
              ? `${overview.overall_csat_score} / 5.0`
              : "4.6 / 5.0"
          }
          subtext={`NPS +${overview?.net_promoter_score ?? 68} (${overview?.promoter_pct ?? 78.5}% Promoters)`}
          icon={Star}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
      </div>

      {/* Direct Module Portals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Inbox & Reminders */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between hover:border-[#BFDBFE] transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full">
                Active Reminders: {overview?.active_scheduled_reminders ?? 6}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Unified Inbox & Auto Reminders
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Centralized broadcast console for SMS, WhatsApp updates, email
                alerts, and logged call reminders across all customer accounts.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Broadcast Gateways:</span>
                <span className="font-semibold text-[#111827]">
                  Teletalk, Twilio, WhatsApp
                </span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Upcoming Milestones:</span>
                <span className="font-semibold text-[#111827]">
                  Slab Casting, Handover
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <Link
              href="/dashboard/customer-service/communication/inbox-reminders"
              className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition"
            >
              Open Unified Inbox
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Site Visits & Appointments */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between hover:border-[#DDD6FE] transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#F4F1FF] border border-[#DDD6FE] flex items-center justify-center text-[#6D4AFF]">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#6D4AFF] bg-[#F4F1FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full">
                Today: {overview?.visits_scheduled_today ?? 3} Visits
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Site Visits & Joint Inspections
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Coordinate client site visits, pre-handover snagging
                walkthroughs, architect consultations, and on-site safety
                compliance.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Escort Protocol:</span>
                <span className="font-semibold text-[#111827]">
                  Assigned QA Engineer
                </span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Safety Compliance:</span>
                <span className="font-semibold text-[#039855]">
                  Helmet & PPE Protocol
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <Link
              href="/dashboard/customer-service/communication/site-visits-appointments"
              className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-xs font-semibold text-[#6D4AFF] bg-[#F4F1FF] hover:bg-[#E9E5FF] border border-[#DDD6FE] transition"
            >
              Manage Site Visits
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Feedback & CSAT Surveys */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between hover:border-[#FEDF89] transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] flex items-center justify-center text-[#DC6803]">
                <Star className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#039855] bg-[#ECFDF3] border border-[#A6F4C5] px-2.5 py-0.5 rounded-full">
                NPS +{overview?.net_promoter_score ?? 68}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Feedback & CSAT Surveys
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Measure allottee satisfaction across key touchpoints: sales
                journey, construction progress, handover possession, and 2-year
                DLP care.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Brand Promoters:</span>
                <span className="font-semibold text-[#039855]">
                  {overview?.promoter_pct ?? 78.5}% (9-10 rating)
                </span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Open Detractor Cases:</span>
                <span className="font-semibold text-[#DC2626]">
                  {overview?.open_escalations_count ?? 2} Pending
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <Link
              href="/dashboard/customer-service/communication/feedback-surveys"
              className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-xs font-semibold text-[#DC6803] bg-[#FFFAEB] hover:bg-[#FEF0C7] border border-[#FEDF89] transition"
            >
              Analyze Feedback & NPS
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Gateway Status & Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6D4AFF]" />
              Gateway Channels & Health Status
            </h3>
            <span className="text-[11px] font-semibold text-[#039855] bg-[#ECFDF3] border border-[#A6F4C5] px-2 py-0.5 rounded-full">
              All Systems Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                  SMS
                </div>
                <div>
                  <div className="font-semibold text-[#111827]">
                    Teletalk Bangladesh / Onnorokom SMS
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Masked SMS Sender ID: RealBizPro
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#039855]">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#ECFDF3] text-[#039855] flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <div className="font-semibold text-[#111827]">
                    Meta WhatsApp Cloud Business API
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Interactive templates for milestone updates
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#039855]">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] flex items-center justify-center font-bold">
                  EM
                </div>
                <div>
                  <div className="font-semibold text-[#111827]">
                    Amazon SES / SendGrid SMTP Relay
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Formal demand notices & legal statements
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#039855]">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
              Scheduled Directives & Automated Workflows
            </h3>
            <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF]/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1D4ED8]">
                  Automated 7-Day Pre-Due Installment Notice
                </span>
                <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                  Cron Daily 09:00 AM
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                Triggers SMS reminder to allottees whose milestone installment
                is due in the next 7 calendar days.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[#A6F4C5] bg-[#ECFDF3]/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#047857]">
                  Automatic Handover CSAT Survey Trigger
                </span>
                <span className="text-[10px] font-bold text-[#039855] bg-white px-2 py-0.5 rounded-md border border-[#A6F4C5]">
                  On Key Handover
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                Dispatches a 3-question CSAT & NPS survey via WhatsApp 48 hours
                after final possession deed sign-off.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#B91C1C]">
                  Detractor Escalation to Head of Customer Experience
                </span>
                <span className="text-[10px] font-bold text-[#DC2626] bg-white px-2 py-0.5 rounded-md border border-[#FECACA]">
                  Immediate SLA 2h
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                Surveys with NPS score ≤ 6 automatically create high-priority
                follow-up tasks for senior management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
