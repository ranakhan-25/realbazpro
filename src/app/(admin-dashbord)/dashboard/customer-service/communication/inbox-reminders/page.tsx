"use client";

import React, { useState } from "react";
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
  Filter,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface CommunicationLog {
  id: string;
  commNo: string;
  customerName: string;
  phone: string;
  email: string;
  unit: string;
  project: string;
  channel: "SMS" | "Email" | "WhatsApp" | "Call";
  type: "Payment Reminder" | "Construction Milestone" | "Handover Invite" | "DLP Update" | "Legal Notice";
  subjectOrPreview: string;
  sentAt: string;
  status: "Delivered" | "Read" | "Sent" | "Scheduled" | "Failed";
  scheduledFor?: string;
  sentBy: string;
}

const INITIAL_LOGS: CommunicationLog[] = [
  {
    id: "COMM-101",
    commNo: "MSG-2026-8801",
    customerName: "Mohammad Rafiqul Islam",
    phone: "+880 1711-223344",
    email: "rafiqul.islam@example.com",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    channel: "SMS",
    type: "Payment Reminder",
    subjectOrPreview: "Dear Valued Allottee, your 8th Slab casting installment of BDT 8,50,000 for Apt A-7 is due on Nov 10, 2026. Please clear to avoid delay surcharge. RealBiz Pro.",
    sentAt: "2026-11-04 09:30 AM",
    status: "Delivered",
    sentBy: "Auto-Billing Trigger",
  },
  {
    id: "COMM-102",
    commNo: "MSG-2026-8802",
    customerName: "Dr. Nazmul Huda",
    phone: "+880 1819-876543",
    email: "dr.nazmul@hospital.org",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    channel: "WhatsApp",
    type: "Construction Milestone",
    subjectOrPreview: "Dear Dr. Nazmul, 12th floor roof casting is complete! View progress photos and updated timeline on your buyer portal: https://rbz.bd/p/lakeview-b4",
    sentAt: "2026-11-03 04:15 PM",
    status: "Read",
    sentBy: "Engr. Farhan (CRM Team)",
  },
  {
    id: "COMM-103",
    commNo: "MSG-2026-8803",
    customerName: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    email: "shahed@supremecourt-bd.com",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    channel: "Email",
    type: "Handover Invite",
    subjectOrPreview: "Invitation for Joint Pre-Handover Snagging Inspection & Key Handover Ceremony for Flat C-9 scheduled on Nov 15, 2026.",
    sentAt: "2026-11-03 11:20 AM",
    status: "Delivered",
    sentBy: "Nusrat Jahan (Post-Sales Officer)",
  },
  {
    id: "COMM-104",
    commNo: "MSG-2026-8804",
    customerName: "Mrs. Anowara Begum",
    phone: "+880 1715-334455",
    email: "anowara.begum@yahoo.com",
    unit: "B-2, Meghna Ocean Pearl",
    project: "Meghna Ocean Pearl",
    channel: "Call",
    type: "Payment Reminder",
    subjectOrPreview: "Direct telephonic reminder for overdue installment of 60 days (BDT 12,00,000). Customer promised pay order by coming Sunday Nov 09.",
    sentAt: "2026-11-02 02:45 PM",
    status: "Sent",
    sentBy: "Tariqul Alam (Recovery Team)",
  },
  {
    id: "COMM-105",
    commNo: "MSG-2026-8805",
    customerName: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    email: "tanvir.engr@techbd.com",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    channel: "SMS",
    type: "DLP Update",
    subjectOrPreview: "Sub-station earthing ticket TKT-2026-0304 has been inspected by QA team. Rectification work in progress. Expected resolution: Nov 05, 5 PM.",
    sentAt: "2026-11-04 08:30 AM",
    status: "Delivered",
    sentBy: "Automated Ticket SLA",
  },
  {
    id: "COMM-106",
    commNo: "MSG-2026-8806",
    customerName: "Sultana Razia",
    phone: "+880 1678-112233",
    email: "sultana.razia@domain.com",
    unit: "F-5, Padma Riverside",
    project: "Padma Riverside",
    channel: "Email",
    type: "Legal Notice",
    subjectOrPreview: "Final Intimation prior to cancellation notice under Real Estate Development & Management Act 2010 Section 14.",
    sentAt: "—",
    scheduledFor: "2026-11-05 10:00 AM",
    status: "Scheduled",
    sentBy: "Advocate Rezaul Karim (Legal Dept)",
  },
];

export default function CommunicationInboxPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [logs, setLogs] = useState<CommunicationLog[]>(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // New message form state
  const [newCustomer, setNewCustomer] = useState("");
  const [newChannel, setNewChannel] = useState<CommunicationLog["channel"]>("SMS");
  const [newType, setNewType] = useState<CommunicationLog["type"]>("Payment Reminder");
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (activeTab === "sms") return log.channel === "SMS";
    if (activeTab === "email") return log.channel === "Email";
    if (activeTab === "whatsapp") return log.channel === "WhatsApp";
    if (activeTab === "calls") return log.channel === "Call";
    if (activeTab === "reminders") return log.type === "Payment Reminder";
    if (activeTab === "scheduled") return log.status === "Scheduled";
    return true;
  });

  const counts = {
    all: logs.length,
    sms: logs.filter((l) => l.channel === "SMS").length,
    email: logs.filter((l) => l.channel === "Email").length,
    whatsapp: logs.filter((l) => l.channel === "WhatsApp").length,
    calls: logs.filter((l) => l.channel === "Call").length,
    reminders: logs.filter((l) => l.type === "Payment Reminder").length,
    scheduled: logs.filter((l) => l.status === "Scheduled").length,
  };

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newContent) {
      toast.error("Please fill in recipient customer and message body.");
      return;
    }

    const newEntry: CommunicationLog = {
      id: `COMM-${Date.now().toString().slice(-4)}`,
      commNo: `MSG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomer,
      phone: "+880 1700-000000",
      email: "client@example.com",
      unit: "Apt Allocated",
      project: "General Notice",
      channel: newChannel,
      type: newType,
      subjectOrPreview: newContent,
      sentAt: "Just now",
      status: "Delivered",
      sentBy: "Current Operator",
    };

    setLogs([newEntry, ...logs]);
    toast.success(`Message sent via ${newChannel} to ${newCustomer}`);
    setIsComposeOpen(false);
    setNewCustomer("");
    setNewSubject("");
    setNewContent("");
  };

  const handleResend = (log: CommunicationLog) => {
    toast.success(`Resending notification via ${log.channel} to ${log.customerName}`);
  };

  const columns: Column<CommunicationLog>[] = [
    {
      key: "commNo",
      header: "REFERENCE & CUSTOMER",
      sortable: true,
      minWidth: "220px",
      render: (row) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{row.customerName}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{row.commNo} • {row.unit}</div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "CHANNEL",
      minWidth: "140px",
      render: (row) => {
        const icons = {
          SMS: <MessageSquare className="h-3.5 w-3.5 text-[#2563EB]" />,
          Email: <Mail className="h-3.5 w-3.5 text-[#6D4AFF]" />,
          WhatsApp: <MessageSquare className="h-3.5 w-3.5 text-[#039855]" />,
          Call: <PhoneCall className="h-3.5 w-3.5 text-[#DC6803]" />,
        };
        const colors = {
          SMS: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
          Email: "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]",
          WhatsApp: "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
          Call: "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colors[row.channel]}`}>
            {icons[row.channel]}
            {row.channel}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "PURPOSE / TYPE",
      minWidth: "180px",
      render: (row) => (
        <span className="text-[11px] font-medium text-[#374151] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
          {row.type}
        </span>
      ),
    },
    {
      key: "subjectOrPreview",
      header: "MESSAGE SNIPPET",
      minWidth: "260px",
      render: (row) => (
        <p className="text-xs text-[#6B7280] line-clamp-2 max-w-sm" title={row.subjectOrPreview}>
          {row.subjectOrPreview}
        </p>
      ),
    },
    {
      key: "sentAt",
      header: "TIME & DISPATCHER",
      minWidth: "180px",
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[#111827] tabular-nums">{row.status === "Scheduled" ? `Queued: ${row.scheduledFor}` : row.sentAt}</div>
          <div className="text-[#6B7280] text-[11px] mt-0.5">{row.sentBy}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "120px",
      render: (row) => {
        const badges = {
          Delivered: "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
          Read: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
          Sent: "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]",
          Scheduled: "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
          Failed: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.status]}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "110px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedLog(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title="View Dispatch Details"
            aria-label="View Dispatch Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleResend(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F4F1FF] border border-[#DDD6FE] text-[#6D4AFF] hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
            title="Resend Dispatch"
            aria-label="Resend Dispatch"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Omnichannel Communication Hub & Reminders"
        subtitle="Unified dispatch log for SMS broadcasts, automated payment reminders, WhatsApp updates, emails, and direct call interactions."
        badge="Real-time Dispatcher"
        breadcrumbs={[{ label: "Communication & Appointments" }, { label: "Unified Inbox" }]}
        primaryAction={{
          label: "Compose Notification",
          icon: Plus,
          onClick: () => setIsComposeOpen(true),
        }}
        secondaryActions={[
          {
            label: "Refresh Status",
            icon: RefreshCw,
            onClick: () => toast.success("Gateway dispatch delivery reports synced."),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Total Dispatched (MTD)"
          value="4,820"
          subtext="SMS, Email & WhatsApp"
          icon={Send}
        />
        <CSStatCard
          title="Delivery Success Rate"
          value="98.7%"
          subtext="Teletalk & Twilio Gateways"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
        <CSStatCard
          title="Auto-Payment Reminders"
          value="318"
          subtext="Sent for upcoming milestones"
          icon={Clock}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Delivery Failures / Bounces"
          value="12"
          subtext="Invalid phone/email requiring update"
          icon={AlertCircle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Communications", count: counts.all },
          { key: "sms", label: "SMS Broadcasts", count: counts.sms },
          { key: "email", label: "Email Dispatch", count: counts.email },
          { key: "whatsapp", label: "WhatsApp", count: counts.whatsapp },
          { key: "calls", label: "Call Logs", count: counts.calls },
          { key: "reminders", label: "Payment Reminders", count: counts.reminders },
          { key: "scheduled", label: "Scheduled Queue", count: counts.scheduled },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Search by customer, unit, project, or communication ID..."
        exportFileName="RealBiz_Communication_Logs"
      />

      {/* Compose Modal */}
      <CSModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Customer Communication"
        subtitle="Dispatch SMS, Email, or WhatsApp updates with automated customer record tracking."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="compose-form"
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Dispatch Now
            </button>
          </>
        }
      >
        <form id="compose-form" onSubmit={handleCompose} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">Target Customer / Allottee *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mohammad Rafiqul Islam (Apt A-7)"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Channel *</label>
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="SMS">SMS Gateway (Teletalk)</option>
                <option value="WhatsApp">WhatsApp Business</option>
                <option value="Email">Email (SMTP / SendGrid)</option>
                <option value="Call">Phone Call Log</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Notice Category *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Payment Reminder">Payment Reminder</option>
                <option value="Construction Milestone">Construction Milestone</option>
                <option value="Handover Invite">Handover Invite</option>
                <option value="DLP Update">DLP Update</option>
                <option value="Legal Notice">Legal Notice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Message Subject / Headline</label>
            <input
              type="text"
              placeholder="e.g. 7th Floor Slab Casting Complete"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Message Body *</label>
            <textarea
              required
              rows={4}
              placeholder="Type message text or select a template..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] text-xs transition"
            />
            <p className="text-[11px] text-[#6B7280] mt-1">
              Dynamic tags supported: {"{customer_name}"}, {"{unit_no}"}, {"{amount_due}"}, {"{due_date}"}
            </p>
          </div>
        </form>
      </CSModal>

      {/* Detail Drawer */}
      <CSDetailDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Communication Log: ${selectedLog?.commNo}`}
        subtitle={`${selectedLog?.customerName} • ${selectedLog?.channel}`}
      >
        {selectedLog && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-2">
              <div className="text-[11px] text-[#6B7280]">Channel & Status</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827]">{selectedLog.channel} Broadcast</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]">
                  {selectedLog.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Recipient Details</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Customer:</span>
                  <div className="font-semibold text-[#111827]">{selectedLog.customerName}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Allocated Unit:</span>
                  <div className="font-semibold text-[#6D4AFF]">{selectedLog.unit}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Phone:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedLog.phone}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Email:</span>
                  <div className="font-semibold text-[#111827]">{selectedLog.email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Dispatched Message Body</h4>
              <div className="p-3.5 rounded-[12px] border border-[#E5E7EB] bg-white text-xs leading-relaxed text-[#374151] whitespace-pre-wrap font-sans">
                {selectedLog.subjectOrPreview}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E5E7EB] text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Dispatched By:</span>
                <span className="font-medium text-[#111827]">{selectedLog.sentBy}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Timestamp:</span>
                <span className="font-medium text-[#111827] tabular-nums">{selectedLog.sentAt}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleResend(selectedLog);
                  setSelectedLog(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg transition shadow-xs"
              >
                Resend Message
              </button>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
