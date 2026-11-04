"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  User,
  Building,
  Eye,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { MOCK_TICKETS, ServiceTicket } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function AllTicketsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets] = useState<ServiceTicket[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [project, setProject] = useState("Hena Heights, Gulshan-2");
  const [category, setCategory] = useState<ServiceTicket["category"]>("Civil Work");
  const [priority, setPriority] = useState<ServiceTicket["priority"]>("Medium");
  const [agent, setAgent] = useState("Md. Tariqul Hasan (Site Engr)");

  // Resolution reply
  const [replyMessage, setReplyMessage] = useState("");

  const filtered = tickets.filter((t) => {
    if (activeTab === "my") return t.assignedAgent.toLowerCase().includes("tariqul") || t.assignedAgent.toLowerCase().includes("you");
    if (activeTab === "unassigned") return !t.assignedAgent || t.assignedAgent.includes("Unassigned");
    if (activeTab === "open") return t.status === "Open";
    if (activeTab === "in-progress") return t.status === "In Progress";
    if (activeTab === "pending") return t.status === "Pending Customer";
    if (activeTab === "overdue") return t.isOverdue;
    if (activeTab === "escalated") return t.status === "Escalated";
    if (activeTab === "resolved") return t.status === "Resolved";
    if (activeTab === "closed") return t.status === "Closed";
    if (activeTab === "reopened") return t.status === "Reopened";
    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !customerName) {
      toast.error("Please provide ticket subject and customer name");
      return;
    }

    const created: ServiceTicket = {
      id: `TKT-${300 + tickets.length + 1}`,
      ticketNo: `TKT-2026-0${300 + tickets.length + 1}`,
      subject,
      customerName,
      phone: phone || "+880 1711-000000",
      unit: unit || "Unit Allotment",
      project,
      category,
      priority,
      status: "Open",
      assignedAgent: agent,
      slaRemainingHours: priority === "Urgent" ? 4 : priority === "High" ? 12 : 24,
      isOverdue: false,
      createdAt: new Date().toLocaleDateString() + " 09:00 AM",
      updatedAt: new Date().toLocaleDateString() + " 09:00 AM",
    };

    setTickets([created, ...tickets]);
    toast.success(`Ticket ${created.ticketNo} logged with SLA timer (${created.slaRemainingHours}h)`);
    setIsCreateOpen(false);
    setSubject("");
    setCustomerName("");
    setUnit("");
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    toast.success("Update and customer notification dispatched via SMS & Email");
    setReplyMessage("");
  };

  const handleStatusChange = (newStatus: ServiceTicket["status"]) => {
    if (!selectedTicket) return;
    const updated = {
      ...selectedTicket,
      status: newStatus,
      isOverdue: newStatus === "Resolved" || newStatus === "Closed" ? false : selectedTicket.isOverdue,
    };
    setTickets(tickets.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setSelectedTicket(updated);
    toast.success(`Ticket status updated to ${newStatus}`);
  };

  const columns: Column<ServiceTicket>[] = [
    {
      key: "ticketNo",
      header: "TICKET NO & SUBJECT",
      sortable: true,
      minWidth: "220px",
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#111827] tabular-nums text-xs">{t.ticketNo}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                t.priority === "Urgent"
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : t.priority === "High"
                    ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                    : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              }`}
            >
              {t.priority}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#4B5563] font-medium line-clamp-1">{t.subject}</p>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER & UNIT",
      minWidth: "180px",
      render: (t) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{t.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{t.unit}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "CATEGORY & AGENT",
      minWidth: "190px",
      render: (t) => (
        <div>
          <span className="rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
            {t.category}
          </span>
          <div className="text-[11px] text-[#6B7280] font-medium mt-1">{t.assignedAgent}</div>
        </div>
      ),
    },
    {
      key: "slaRemainingHours",
      header: "SLA ADHERENCE",
      minWidth: "150px",
      render: (t) => (
        <div>
          {t.isOverdue ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
              <AlertTriangle className="h-3.5 w-3.5" /> SLA Breached
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#039855] tabular-nums">
              <Clock className="h-3.5 w-3.5" /> {t.slaRemainingHours}h Left
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "130px",
      render: (t) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            t.status === "Open"
              ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              : t.status === "In Progress"
                ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                : t.status === "Escalated"
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "90px",
      render: (t) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedTicket(t)}
            title="View Ticket Details"
            aria-label="View Ticket Details"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
        title="Tickets & Service Requests (অভিযোগ ও সেবা ব্যবস্থাপনা)"
        subtitle="Omnichannel customer ticketing, engineer dispatch, SLA timers, escalation tracking and resolution workflows."
        badge="SLA Engine"
        breadcrumbs={[{ label: "Tickets & Service Requests" }, { label: "All Tickets" }]}
        primaryAction={{
          label: "Create New Ticket",
          onClick: () => setIsCreateOpen(true),
          icon: Plus,
        }}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CSStatCard
          title="Total Service Tickets"
          value={tickets.length.toString()}
          subtext="Logged in system"
          icon={LifeBuoy}
        />
        <CSStatCard
          title="Active Open Tickets"
          value={tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length.toString()}
          subtext="Under active resolution"
          icon={Clock}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="SLA Breached"
          value={tickets.filter((t) => t.isOverdue).length.toString()}
          subtext="Requires supervisor escalation"
          icon={AlertTriangle}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <CSStatCard
          title="Resolved Rate"
          value="94.2%"
          subtext="First-contact resolution benchmark"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Complete Workflow Filter Tabs */}
      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Tickets", count: tickets.length },
          { key: "my", label: "My Tickets", count: 1 },
          {
            key: "overdue",
            label: "Overdue / SLA Breach",
            count: tickets.filter((t) => t.isOverdue).length,
            badgeVariant: "danger",
          },
          {
            key: "escalated",
            label: "Escalated",
            count: tickets.filter((t) => t.status === "Escalated").length,
            badgeVariant: "warning",
          },
          {
            key: "open",
            label: "Open",
            count: tickets.filter((t) => t.status === "Open").length,
          },
          {
            key: "in-progress",
            label: "In Progress",
            count: tickets.filter((t) => t.status === "In Progress").length,
          },
          {
            key: "resolved",
            label: "Resolved",
            count: tickets.filter((t) => t.status === "Resolved").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search ticket no, customer, subject, category or assigned agent..."
        searchFields={["ticketNo", "subject", "customerName", "unit", "category", "assignedAgent"]}
        emptyTitle="No tickets found in this tab"
      />

      {/* Slide-over Ticket Detail & Work Order Drawer */}
      <CSDetailDrawer
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.ticketNo || "Ticket Details"}
        badge={selectedTicket?.priority}
        subtitle={`${selectedTicket?.category} • Created ${selectedTicket?.createdAt}`}
        width="xl"
      >
        {selectedTicket && (
          <div className="space-y-5 text-xs">
            {/* Subject and SLA Header Box */}
            <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 space-y-2">
              <h4 className="font-semibold text-[#111827] text-sm">{selectedTicket.subject}</h4>
              <div className="flex flex-wrap items-center gap-3 text-[#4B5563] pt-1">
                <span className="flex items-center gap-1.5 font-semibold text-[#6D4AFF]">
                  <User className="h-3.5 w-3.5" /> {selectedTicket.customerName}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#111827]">
                  <Building className="h-3.5 w-3.5 text-[#9CA3AF]" /> {selectedTicket.unit}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums text-[#6B7280]">
                  {selectedTicket.phone}
                </span>
              </div>
            </div>

            {/* SLA Status Bar */}
            <div className="flex items-center justify-between rounded-[12px] border border-[#DDD6FE] bg-[#F4F1FF]/60 p-3.5">
              <div>
                <span className="text-[11px] text-[#6B7280] font-semibold block uppercase tracking-wider">SLA Commitment</span>
                <span className="font-semibold text-[#111827] text-xs">
                  {selectedTicket.isOverdue ? (
                    <span className="text-[#DC2626] font-semibold">Target Response Breached by 6 hours</span>
                  ) : (
                    <span className="text-[#039855]">Within Target ({selectedTicket.slaRemainingHours} hours remaining)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-[11px] font-medium">Workflow:</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white font-medium text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] text-xs transition"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Customer">Pending Customer</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>
            </div>

            {/* Conversation Timeline & Engineering Dispatch */}
            <div className="space-y-3">
              <h5 className="font-semibold text-[#111827] text-xs uppercase tracking-wider">
                Service Activity & Work Order Timeline
              </h5>

              <div className="space-y-3 border-l-2 border-[#E5E7EB] pl-3.5 ml-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827] text-[11px]">Customer Support Desk</span>
                    <span className="text-[10px] text-[#9CA3AF] tabular-nums">08:00 AM</span>
                  </div>
                  <p className="text-[#4B5563] rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-2.5">
                    Ticket logged via Phone call. Forwarded to {selectedTicket.assignedAgent} for on-site inspection.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#6D4AFF] text-[11px]">{selectedTicket.assignedAgent}</span>
                    <span className="text-[10px] text-[#9CA3AF] tabular-nums">08:30 AM</span>
                  </div>
                  <p className="text-[#374151] rounded-lg bg-[#F4F1FF]/60 border border-[#DDD6FE] p-2.5">
                    Site engineer scheduled inspection visit for today at 3:00 PM. Notified customer.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispatch / Reply input */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
              <label className="block font-semibold text-[#374151] text-xs">
                Post Internal Engineering Note / Customer Update
              </label>
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type resolution update, material requisition ref or technician findings..."
                className="w-full p-3 rounded-lg border border-[#E5E7EB] bg-white outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] text-xs text-[#111827] transition"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReply}
                  className="h-9 px-4 rounded-lg bg-[#6D4AFF] hover:bg-[#5935DE] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#6D4AFF]"
                >
                  <Send className="h-3.5 w-3.5" /> Send Update
                </button>
              </div>
            </div>
          </div>
        )}
      </CSDetailDrawer>

      {/* Create Ticket Modal */}
      <CSModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Service Request"
        subtitle="Log issue with priority level and automated SLA tracking"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTicket}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Open Ticket
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">Issue Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Water seepage in master bedroom"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 17XX-XXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit Number *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Civil Work">Civil Work (Plaster, Brick, Tiles)</option>
                <option value="Sanitary & Plumbing">Sanitary & Plumbing (Drainage, Leakage)</option>
                <option value="Electrical">Electrical (Sub-station, DB, Fittings)</option>
                <option value="Finishing & Tiles">Finishing & Polish</option>
                <option value="Accounts & Billing">Accounts & Billing Inquiry</option>
                <option value="Handover Delay">Handover Delay / Snagging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Priority (SLA Timer)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Urgent">Urgent (4h SLA)</option>
                <option value="High">High (12h SLA)</option>
                <option value="Medium">Medium (24h SLA)</option>
                <option value="Low">Low (48h SLA)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Assigned Engineer / Officer</label>
              <input
                type="text"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
