"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Trash2,
  RefreshCw,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  ServiceTicketItem,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  getCustomerTickets,
  getCustomerTicketStats,
  createCustomerTicket,
  updateCustomerTicket,
  addCustomerTicketReply,
  deleteCustomerTicket,
} from "@/services/customerTicketsService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function AllTicketsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project } = useSelectedProject();

  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets] = useState<ServiceTicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicketItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress: 0,
    escalated_tickets: 0,
    resolved_tickets: 0,
    overdue_tickets: 0,
    resolved_rate: 0,
    all_count: 0,
  });

  // Form states
  const [subject, setSubject] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Civil Work");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [agent, setAgent] = useState("Engr. Tariqul Hasan (Site Engr)");
  const [remarks, setRemarks] = useState("");

  // Resolution reply
  const [replyMessage, setReplyMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        getCustomerTickets({
          project_id: projectId && projectId !== "all" ? projectId : undefined,
          tab: activeTab !== "all" ? activeTab : undefined,
        }),
        getCustomerTicketStats({
          project_id: projectId && projectId !== "all" ? projectId : undefined,
        }),
      ]);

        setTickets(ticketsRes.items || []);
        setStats(statsRes);
      } catch (err: any) {
        console.error("Failed to load tickets:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load customer tickets");
      } finally {
        setIsLoading(false);
      }
    }, [projectId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!subject.trim() || !customerName.trim()) {
        toast.error("Please provide ticket subject and customer name");
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await createCustomerTicket({
          subject: subject.trim(),
          customer_name: customerName.trim(),
          phone: phone.trim() || undefined,
          unit: unit.trim() || undefined,
          project_id: projectId && projectId !== "all" ? projectId : undefined,
          project_name: project?.name || "Assigned Project",
          category,
          priority,
          status: "Open",
          assigned_agent: agent.trim() || "Unassigned",
          remarks: remarks.trim() || undefined,
        });

        toast.success(`Ticket ${created.ticketNo} logged with SLA timer (${created.slaRemainingHours}h)`);
        setIsCreateOpen(false);
        setSubject("");
        setCustomerName("");
        setPhone("");
        setUnit("");
        setRemarks("");
        loadData();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to create ticket");
      } finally {
        setIsSubmitting(false);
      }
    };

      const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;
        setIsReplying(true);
        try {
          const updated = await addCustomerTicketReply(selectedTicket.uuid, {
            message: replyMessage.trim(),
            role: "Service Representative",
          });
          setSelectedTicket(updated);
          setTickets((prev) => prev.map((t) => (t.uuid === updated.uuid ? updated : t)));
          setReplyMessage("");
          toast.success("Update and customer notification dispatched successfully");
          loadData();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to send update");
        } finally {
          setIsReplying(false);
        }
      };

        const handleStatusChange = async (newStatus: TicketStatus) => {
          if (!selectedTicket) return;
          try {
            const updated = await updateCustomerTicket(selectedTicket.uuid, {
              status: newStatus,
            });
            setSelectedTicket(updated);
            setTickets((prev) => prev.map((t) => (t.uuid === updated.uuid ? updated : t)));
            toast.success(`Ticket status updated to ${newStatus}`);
            loadData();
          } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update ticket status");
          }
        };

  const handleDelete = async (ticket: ServiceTicketItem) => {
          if (!confirm(`Are you sure you want to delete ticket ${ticket.ticketNo}?`)) return;
          try {
            await deleteCustomerTicket(ticket.uuid);
            toast.success(`Ticket ${ticket.ticketNo} deleted successfully`);
            if (selectedTicket?.uuid === ticket.uuid) {
              setSelectedTicket(null);
            }
            loadData();
          } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete ticket");
          }
        };

        const columns: Column<ServiceTicketItem>[] = [
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${t.priority === "Urgent"
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
                <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{t.unit || "N/A"}</div>
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t.status === "Open"
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
            minWidth: "100px",
            render: (t) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(t)}
                    title="View Ticket Details"
                    aria-label="View Ticket Details"
                    className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    title="Delete Ticket"
                    aria-label="Delete Ticket"
                    className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:text-[#B91C1C] transition shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
                      value={stats.total_tickets.toString()}
                      subtext="Logged in system"
                      icon={LifeBuoy}
                    />
                    <CSStatCard
                      title="Active Open Tickets"
                      value={(stats.open_tickets + stats.in_progress).toString()}
                      subtext="Under active resolution"
                      icon={Clock}
                      iconBg="bg-[#EFF6FF]"
                      iconColor="text-[#2563EB]"
                    />
                    <CSStatCard
                      title="SLA Breached"
                      value={stats.overdue_tickets.toString()}
                      subtext="Requires supervisor escalation"
                      icon={AlertTriangle}
                      iconBg="bg-[#FEF2F2]"
                      iconColor="text-[#DC2626]"
                    />
                    <CSStatCard
                      title="Resolved Rate"
                      value={`${stats.resolved_rate}%`}
                      subtext="First-contact resolution benchmark"
                      icon={CheckCircle2}
                      iconBg="bg-[#ECFDF3]"
                      iconColor="text-[#039855]"
                    />
                  </div>

                  {/* Complete Workflow Filter Tabs */}
                  <CSFilterTabs
                    tabs={[
                      { key: "all", label: "All Tickets", count: stats.total_tickets },
                      { key: "my", label: "My Tickets" },
                      {
                        key: "overdue",
                        label: "Overdue / SLA Breach",
                        count: stats.overdue_tickets,
                        badgeVariant: "danger",
                      },
                      {
                        key: "escalated",
                        label: "Escalated",
                        count: stats.escalated_tickets,
                        badgeVariant: "warning",
                      },
                      {
                        key: "open",
                        label: "Open",
                        count: stats.open_tickets,
                      },
                      {
                        key: "in-progress",
                        label: "In Progress",
                        count: stats.in_progress,
                      },
                      {
                        key: "resolved",
                        label: "Resolved",
                        count: stats.resolved_tickets,
                      },
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

                  <CSTable
                    data={tickets}
                    columns={columns}
                    searchPlaceholder="Search ticket no, customer, subject, category or assigned agent..."
                    searchFields={["ticketNo", "subject", "customerName", "unit", "category", "assignedAgent"]}
                    emptyTitle={isLoading ? "Loading service tickets..." : "No tickets found in this tab"}
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
                              <Building className="h-3.5 w-3.5 text-[#9CA3AF]" /> {selectedTicket.unit || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 tabular-nums text-[#6B7280]">
                              {selectedTicket.phone || "No phone provided"}
                            </span>
                          </div>
                        </div>

                        {/* SLA Status Bar */}
                        <div className="flex items-center justify-between rounded-[12px] border border-[#DDD6FE] bg-[#F4F1FF]/60 p-3.5">
                          <div>
                            <span className="text-[11px] text-[#6B7280] font-semibold block uppercase tracking-wider">SLA Commitment</span>
                            <span className="font-semibold text-[#111827] text-xs">
                              {selectedTicket.isOverdue ? (
                    <span className="text-[#DC2626] font-semibold">Target Response SLA Breached</span>
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
                            Service Activity & Work Order Timeline ({selectedTicket.replies?.length || 0})
                          </h5>

                          <div className="space-y-3 border-l-2 border-[#E5E7EB] pl-3.5 ml-1">
                            {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                              selectedTicket.replies.map((rep) => (
                                <div key={rep.id} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#111827] text-[11px]">{rep.sender}</span>
                                    <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7280]">
                                      {rep.role}
                                    </span>
                                    <span className="text-[10px] text-[#9CA3AF] tabular-nums">{rep.timestamp}</span>
                                  </div>
                                  <p className="text-[#374151] rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-2.5 leading-relaxed">
                                    {rep.message}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[#9CA3AF] italic text-[11px]">No activity logged yet.</p>
                            )}
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
                              disabled={isReplying || !replyMessage.trim()}
                              onClick={handleSendReply}
                              className="h-9 px-4 rounded-lg bg-[#6D4AFF] hover:bg-[#5935DE] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#6D4AFF] disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" /> {isReplying ? "Sending..." : "Send Update"}
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
                          disabled={isSubmitting}
                          onClick={() => setIsCreateOpen(false)}
                          className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleCreateTicket}
                          className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Open Ticket"
                          )}
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
                          <label className="block font-semibold text-[#374151] mb-1">Unit Number</label>
                          <input
                            type="text"
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
                            <option value="Other">Other</option>
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
                            placeholder="e.g. Engr. Tariqul Hasan"
                            className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#374151] mb-1">Remarks / Details</label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Initial observations or customer comments..."
                          className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                        />
                      </div>
                    </form>
                  </CSModal>
                </div>
                );
}
