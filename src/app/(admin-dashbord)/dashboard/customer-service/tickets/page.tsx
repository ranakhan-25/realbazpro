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
  const brand = primaryColor || "#0000F2";

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
      header: "Ticket No & Subject",
      sortable: true,
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
          <p className="mt-0.5 text-xs text-slate-700 font-medium line-clamp-1">{t.subject}</p>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Unit",
      render: (t) => (
        <div>
          <div className="font-bold text-slate-900">{t.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{t.unit}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category & Agent",
      render: (t) => (
        <div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {t.category}
          </span>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{t.assignedAgent}</div>
        </div>
      ),
    },
    {
      key: "slaRemainingHours",
      header: "SLA Adherence",
      render: (t) => (
        <div>
          {t.isOverdue ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" /> SLA Breached
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
                  ? "bg-rose-50 text-rose-700 font-bold"
                  : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "View",
      render: (t) => (
        <button
          type="button"
          onClick={() => setSelectedTicket(t)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Eye className="h-3.5 w-3.5 text-blue-600" /> Detail
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <CSStatCard
          title="SLA Breached"
          value={tickets.filter((t) => t.isOverdue).length.toString()}
          subtext="Requires supervisor escalation"
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <CSStatCard
          title="Resolved Rate"
          value="94.2%"
          subtext="First-contact resolution benchmark"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</h4>
              <div className="flex flex-wrap items-center gap-3 text-slate-600 pt-1">
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <User className="h-3.5 w-3.5" /> {selectedTicket.customerName}
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> {selectedTicket.unit}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-500">
                  {selectedTicket.phone}
                </span>
              </div>
            </div>

            {/* SLA Status Bar */}
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">SLA Commitment</span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedTicket.isOverdue ? (
                    <span className="text-rose-600 font-bold">Target Response Breached by 6 hours</span>
                  ) : (
                    <span className="text-emerald-700">Within Target ({selectedTicket.slaRemainingHours} hours remaining)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Workflow:</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-blue-500 text-xs"
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
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Service Activity & Work Order Timeline
              </h5>

              <div className="space-y-2.5 border-l-2 border-slate-200 pl-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-[11px]">Customer Support Desk</span>
                    <span className="text-[10px] text-slate-400">08:00 AM</span>
                  </div>
                  <p className="text-slate-600 rounded-lg bg-slate-100 p-2.5">
                    Ticket logged via Phone call. Forwarded to {selectedTicket.assignedAgent} for on-site inspection.
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 text-[11px]">{selectedTicket.assignedAgent}</span>
                    <span className="text-[10px] text-slate-400">08:30 AM</span>
                  </div>
                  <p className="text-slate-700 rounded-lg bg-blue-50/60 border border-blue-100 p-2.5">
                    Site engineer scheduled inspection visit for today at 3:00 PM. Notified customer.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispatch / Reply input */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-semibold text-slate-700 text-xs">
                Post Internal Engineering Note / Customer Update
              </label>
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type resolution update, material requisition ref or technician findings..."
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReply}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: brand }}
                >
                  <Send className="h-3 w-3" /> Send Update
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTicket}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              Open Ticket
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Water seepage in master bedroom"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 17XX-XXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Number *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority (SLA Timer)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Urgent">Urgent (4h SLA)</option>
                <option value="High">High (12h SLA)</option>
                <option value="Medium">Medium (24h SLA)</option>
                <option value="Low">Low (48h SLA)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Engineer / Officer</label>
              <input
                type="text"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}

