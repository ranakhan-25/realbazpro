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
      header: "Reference & Customer",
      accessorKey: "commNo",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.commNo} • {row.unit}</div>
        </div>
      ),
    },
    {
      header: "Channel",
      accessorKey: "channel",
      cell: (row) => {
        const icons = {
          SMS: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
          Email: <Mail className="h-3.5 w-3.5 text-purple-500" />,
          WhatsApp: <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />,
          Call: <PhoneCall className="h-3.5 w-3.5 text-amber-500" />,
        };
        const colors = {
          SMS: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
          Email: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
          WhatsApp: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          Call: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${colors[row.channel]}`}>
            {icons[row.channel]}
            {row.channel}
          </span>
        );
      },
    },
    {
      header: "Purpose / Type",
      accessorKey: "type",
      cell: (row) => (
        <span className="text-xs font-medium text-foreground bg-foreground/5 px-2 py-1 rounded">
          {row.type}
        </span>
      ),
    },
    {
      header: "Message Snippet",
      accessorKey: "subjectOrPreview",
      cell: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm" title={row.subjectOrPreview}>
          {row.subjectOrPreview}
        </p>
      ),
    },
    {
      header: "Time & Dispatcher",
      accessorKey: "sentAt",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground">{row.status === "Scheduled" ? `Queued: ${row.scheduledFor}` : row.sentAt}</div>
          <div className="text-muted-foreground text-[11px]">{row.sentBy}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const badges = {
          Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
          Read: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
          Sent: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
          Scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
          Failed: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badges[row.status]}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedLog(row)}
            className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
            title="View Dispatch Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleResend(row)}
            className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
            title="Resend Dispatch"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CSPageHeader
        title="Omnichannel Communication Hub & Reminders"
        description="Unified dispatch log for SMS broadcasts, automated payment reminders, WhatsApp updates, emails, and direct call interactions."
        badgeText="Real-time Dispatcher"
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
          subtitle="SMS, Email & WhatsApp"
          icon={Send}
          trend={{ value: 14.5, isPositive: true }}
        />
        <CSStatCard
          title="Delivery Success Rate"
          value="98.7%"
          subtitle="Teletalk & Twilio Gateways"
          icon={CheckCircle2}
          color="emerald"
        />
        <CSStatCard
          title="Auto-Payment Reminders"
          value="318"
          subtitle="Sent for upcoming milestones"
          icon={Clock}
          color="blue"
        />
        <CSStatCard
          title="Delivery Failures / Bounces"
          value="12"
          subtitle="Invalid phone/email requiring update"
          icon={AlertCircle}
          color="rose"
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
        onChange={setActiveTab}
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
        description="Dispatch SMS, Email, or WhatsApp updates with automated customer record tracking."
      >
        <form onSubmit={handleCompose} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Target Customer / Allottee *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mohammad Rafiqul Islam (Apt A-7)"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Channel *</label>
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="SMS">SMS Gateway (Teletalk)</option>
                <option value="WhatsApp">WhatsApp Business</option>
                <option value="Email">Email (SMTP / SendGrid)</option>
                <option value="Call">Phone Call Log</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Notice Category *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <label className="block text-xs font-medium text-foreground mb-1">Message Subject / Headline</label>
            <input
              type="text"
              placeholder="e.g. 7th Floor Slab Casting Complete"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Message Body *</label>
            <textarea
              required
              rows={4}
              placeholder="Type message text or select a template..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Dynamic tags supported: {"{customer_name}"}, {"{unit_no}"}, {"{amount_due}"}, {"{due_date}"}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-foreground/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Dispatch Now
            </button>
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
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-2">
              <div className="text-xs text-muted-foreground">Channel & Status</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{selectedLog.channel} Broadcast</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {selectedLog.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-semibold text-foreground">{selectedLog.customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Allocated Unit:</span>
                  <div className="font-semibold text-foreground">{selectedLog.unit}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div className="font-semibold text-foreground">{selectedLog.phone}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <div className="font-semibold text-foreground">{selectedLog.email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dispatched Message Body</h4>
              <div className="p-3 rounded-lg border border-border bg-background text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                {selectedLog.subjectOrPreview}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Dispatched By:</span>
                <span className="font-medium text-foreground">{selectedLog.sentBy}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Timestamp:</span>
                <span className="font-medium text-foreground">{selectedLog.sentAt}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleResend(selectedLog);
                  setSelectedLog(null);
                }}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
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

