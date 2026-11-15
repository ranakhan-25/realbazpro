"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Receipt,
  FileCheck2,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  BarChart3,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Plus,
  Search,
  RefreshCw,
  PhoneCall,
  Calendar,
  AlertCircle,
  TrendingUp,
  Activity,
  Check,
  X,
  UserCheck,
  Headphones,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import InkOrbitFeatures from "@/components/ui/ink-orbit-features";
import { MOCK_TICKETS, ServiceTicket } from "@/services/customerServiceData";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  role: string;
  assignedProject: string;
  activeTickets: number;
  status: "Available" | "Busy" | "Offline";
  avatarBg: string;
}

interface FollowUpTask {
  id: string;
  title: string;
  customerName: string;
  unit: string;
  dueDate: string;
  dueTime: string;
  isOverdue?: boolean;
  priority: "Urgent" | "High" | "Normal";
  completed: boolean;
}

const SUPPORT_AGENTS: Agent[] = [
  {
    id: "AGT-1",
    name: "Engr. Tanvir Ahmed",
    role: "Senior Site QA Engineer",
    assignedProject: "Gulshan & Banani Projects",
    activeTickets: 4,
    status: "Available",
    avatarBg: "bg-[#F4F1FF] text-[#6D4AFF]",
  },
  {
    id: "AGT-2",
    name: "Sarah Rahman",
    role: "Customer Relations Specialist",
    assignedProject: "Dhanmondi Residences",
    activeTickets: 5,
    status: "Busy",
    avatarBg: "bg-[#EFF8FF] text-[#175CD3]",
  },
  {
    id: "AGT-3",
    name: "Md. Rahim Ullah",
    role: "Post-Sales Accounts Executive",
    assignedProject: "All Sites Billing & Receipts",
    activeTickets: 3,
    status: "Available",
    avatarBg: "bg-[#ECFDF3] text-[#027A48]",
  },
  {
    id: "AGT-4",
    name: "Fatima Begum",
    role: "2-Yr DLP Governance Officer",
    assignedProject: "Handover Care & Warranties",
    activeTickets: 2,
    status: "Available",
    avatarBg: "bg-[#FFF4ED] text-[#B54708]",
  },
  {
    id: "AGT-5",
    name: "Karim Chowdhury",
    role: "Joint Snagging Coordinator",
    assignedProject: "Eastern Lakeview & Uttara",
    activeTickets: 4,
    status: "Offline",
    avatarBg: "bg-[#F2F4F7] text-[#475467]",
  },
];

const INITIAL_TASKS: FollowUpTask[] = [
  {
    id: "TSK-01",
    title: "Verify structural crack inspection report with Site QA",
    customerName: "Mohammad Rafiqul Islam",
    unit: "Apt 6A (Hena Heights)",
    dueDate: "Today",
    dueTime: "11:30 AM",
    isOverdue: false,
    priority: "Urgent",
    completed: false,
  },
  {
    id: "TSK-02",
    title: "Issue final 7-day statutory reminder for pending overdue installment",
    customerName: "Dr. Nazmul Huda",
    unit: "Flat 4B (Eastern Lakeview)",
    dueDate: "Overdue",
    dueTime: "Yesterday 5:00 PM",
    isOverdue: true,
    priority: "Urgent",
    completed: false,
  },
  {
    id: "TSK-03",
    title: "Submit approved e-Mutation DCR challan to AC Land Office",
    customerName: "Syed Kamrul Hasan",
    unit: "Unit 8C (Sheba Valley)",
    dueDate: "Today",
    dueTime: "3:00 PM",
    isOverdue: false,
    priority: "High",
    completed: false,
  },
  {
    id: "TSK-04",
    title: "Coordinate key handover ceremony & sign handover certificate",
    customerName: "Begum Rowshan Ara",
    unit: "Penthouse P-1 (Uttara Park)",
    dueDate: "Tomorrow",
    dueTime: "10:00 AM",
    isOverdue: false,
    priority: "Normal",
    completed: false,
  },
];

export default function CustomerServiceDashboardPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>(MOCK_TICKETS);
  const [tasks, setTasks] = useState<FollowUpTask[]>(INITIAL_TASKS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [unit, setUnit] = useState("");
  const [project, setProject] = useState("Hena Heights");
  const [category, setCategory] = useState<ServiceTicket["category"]>("Sanitary & Plumbing");
  const [priority, setPriority] = useState<ServiceTicket["priority"]>("Medium");
  const [assignedAgent, setAssignedAgent] = useState("Engr. Tanvir Ahmed");

  // Ticket Quick View Drawer State
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Customer service metrics synchronized.");
    }, 500);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !customerName.trim() || !unit.trim()) {
      toast.error("Please fill in subject, customer name, and unit number.");
      return;
    }

    const newTicket: ServiceTicket = {
      id: `TCK-${Date.now().toString().slice(-4)}`,
      ticketNo: `SR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: subject.trim(),
      customerName: customerName.trim(),
      phone: "+880 1711-000000",
      unit: unit.trim(),
      project,
      category,
      priority,
      status: "Open",
      assignedAgent,
      slaRemainingHours: priority === "Urgent" ? 4 : priority === "High" ? 12 : 24,
      isOverdue: false,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setTickets([newTicket, ...tickets]);
    toast.success(`Service ticket ${newTicket.ticketNo} logged successfully.`);
    setIsModalOpen(false);
    setSubject("");
    setCustomerName("");
    setUnit("");
  };

  // KPI Calculations
  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const overdueTicketsCount = tickets.filter((t) => t.isOverdue).length;

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchTab =
        activeTab === "All" ||
        (activeTab === "Open" && t.status === "Open") ||
        (activeTab === "In Progress" && t.status === "In Progress") ||
        (activeTab === "Escalated" && t.status === "Escalated") ||
        (activeTab === "Overdue" && t.isOverdue) ||
        (activeTab === "Resolved" && t.status === "Resolved");

      const matchCategory =
        categoryFilter === "All" || t.category === categoryFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.ticketNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.unit.toLowerCase().includes(q);

      return matchTab && matchCategory && matchSearch;
    });
  }, [tickets, activeTab, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4 sm:p-6 pb-28 md:pb-32 space-y-7 w-full max-w-[1600px] mx-auto text-[#111111] antialiased">
      {/* 1. Breadcrumb & Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-5">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-medium text-[#666666] mb-1.5">
            <Link href="/dashboard" className="hover:text-[#111111] transition">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#111111] font-semibold">Customer Service</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0D]">
              Customer Service
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8F8FA] border border-[#EAEAEA] text-[#111111]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6D4AFF]" />
              Enterprise Control
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-1 max-w-2xl">
            Manage customer conversations, tickets, agents, milestone payments, and post-sales service quality.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-[#666666] hover:bg-[#F8F8FA] hover:text-[#111111] transition shadow-2xs disabled:opacity-50"
            title="Refresh Metrics"
            aria-label="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#6D4AFF]" : ""}`} />
          </button>

          <Link
            href="/dashboard/customer-service/tickets"
            className="inline-flex h-9 items-center justify-center px-3.5 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] hover:bg-[#F8F8FA] hover:border-[#6D4AFF] hover:text-[#6D4AFF] transition shadow-2xs"
          >
            <span>View Tickets</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-[#6D4AFF] text-xs font-medium text-[#FFFFFF] hover:bg-[#5837DB] transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Overview Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Tickets */}
        <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D0D5DD] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">Total Tickets</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F1FF] text-[#6D4AFF]">
              <LifeBuoy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#0B0B0D] tabular-nums">
            {totalTicketsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#666666]">
            {openTicketsCount} active open
          </div>
        </div>

        {/* Open Queue */}
        <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D0D5DD] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">Open Queue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EFF8FF] text-[#175CD3]">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#0B0B0D] tabular-nums">
            {openTicketsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#666666]">
            {inProgressCount} in progress
          </div>
        </div>

        {/* Overdue / SLA Breached — RED ACCENT */}
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-4 shadow-[0_1px_3px_rgba(229,57,53,0.06)] hover:border-[#F87171] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#C62828]">Overdue Tickets</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFFFFF] text-[#E53935] shadow-2xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#E53935] tabular-nums">
            {overdueTicketsCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-[#C62828]">
            Immediate dispatch required
          </div>
        </div>

        {/* Avg 1st Response */}
        <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D0D5DD] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">Avg 1st Response</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F8F8FA] text-[#111111]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#0B0B0D] tabular-nums">
            42 min
          </div>
          <div className="mt-1 text-[11px] text-[#027A48] font-medium">
            -8 min vs target
          </div>
        </div>

        {/* SLA Adherence */}
        <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D0D5DD] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">SLA Compliance</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ECFDF3] text-[#027A48]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#0B0B0D] tabular-nums">
            96.4%
          </div>
          <div className="mt-1 text-[11px] text-[#666666]">
            Benchmark: 95%
          </div>
        </div>

        {/* CSAT / NPS */}
        <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D0D5DD] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">CSAT / NPS</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F1FF] text-[#6D4AFF]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-[#0B0B0D] tabular-nums">
            4.8 <span className="text-xs font-normal text-[#666666]">/ 5.0</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#6D4AFF]">
            +72 NPS Score
          </div>
        </div>
      </div>

      {/* 3. SLA Alert Banner (Red Accent) */}
      {overdueTicketsCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E53935] text-white">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-[#E53935]">Critical SLA Notice: </span>
              <span className="text-[#C62828]">
                {overdueTicketsCount} active service ticket{overdueTicketsCount > 1 ? "s have" : " has"} breached standard turnaround thresholds and requires supervisor escalation.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("Overdue")}
            className="px-2.5 py-1 rounded-md bg-[#E53935] text-white font-semibold hover:bg-[#C62828] transition shadow-2xs whitespace-nowrap"
          >
            Filter Overdue Queue
          </button>
        </div>
      )}

      {/* 4. InkOrbitFeatures Interactive Component Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B0B0D]">
              Customer Service Operations Hub
            </h2>
            <p className="text-xs text-[#666666]">
              Real-time collaboration topology, automated resolution reports, and SLA prediction scrubbing.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F8F8FA] border border-[#EAEAEA] text-[#666666]">
            Interactive Flow Architecture
          </span>
        </div>

        <div className="w-full">
          <InkOrbitFeatures
            theme="light"
            brand="Customer Service"
            tag="CUSTOMER EXPERIENCE"
            title="Smart *Customer Service* Operations"
            collaboration={{
              title: "Real-Time Team Collaboration",
              description: "Coordinate customer conversations, share ticket updates, and keep your entire support team aligned.",
            }}
            reports={{
              title: "Automated Service Reports",
              description: "Monitor ticket resolution, response performance, SLA compliance, and customer satisfaction.",
            }}
            integrations={{
              title: "Connected Support Channels",
              description: "Organize supported customer communication channels in one unified support workflow.",
              tools: ["Email", "Phone", "WhatsApp", "Web Chat"],
            }}
            insights={{
              title: "Customer Service Insights",
              description: "Understand customer support trends, response performance, and service quality.",
              values: [24, 28, 25, 34, 30, 42, 38, 46, 44, 52, 58, 64],
              forecastFrom: 8,
            }}
          />
        </div>
      </div>

      {/* 5. Main Operational Grid: Support Queue & Team Availability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Priority Ticket Queue */}
        <div className="space-y-3.5 lg:col-span-2">
          {/* Queue Header & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B0B0D]">
                Priority Service Queue
              </h2>
              <p className="text-xs text-[#666666]">
                Review incoming complaints, contractor defects, and MEP maintenance requests.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F8F8FA] border border-[#EAEAEA] text-xs">
              {["All", "Open", "In Progress", "Overdue", "Resolved"].map((tab) => {
                const isActive = activeTab === tab;
                const isOverdueTab = tab === "Overdue";
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${isActive
                        ? isOverdueTab
                          ? "bg-[#E53935] text-white shadow-2xs"
                          : "bg-[#FFFFFF] text-[#111111] shadow-2xs font-semibold"
                        : "text-[#666666] hover:text-[#111111]"
                      }`}
                  >
                    {tab}
                    {isOverdueTab && overdueTicketsCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#FFFFFF] text-[#E53935] font-bold">
                        {overdueTicketsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Category Row */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#929292]" />
              <input
                type="text"
                placeholder="Search by ticket no, customer name, unit or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] placeholder:text-[#929292] focus:outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#929292] hover:text-[#111111]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#6D4AFF] transition"
            >
              <option value="All">All Categories</option>
              <option value="Sanitary & Plumbing">Sanitary & Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Finishing & Tiles">Finishing & Tiles</option>
              <option value="Civil Work">Civil Work</option>
              <option value="Accounts & Billing">Accounts & Billing</option>
            </select>
          </div>

          {/* White Table Card with Subtle Borders */}
          <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[11px] font-semibold text-[#0B0B0D] uppercase tracking-wider">
                    <th className="py-3 px-4">TICKET REF & SUBJECT</th>
                    <th className="py-3 px-4">CUSTOMER & UNIT</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4">PRIORITY</th>
                    <th className="py-3 px-4">SLA STATUS</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.slice(0, 6).map((t) => {
                      const isUrgent = t.priority === "Urgent";
                      const isHigh = t.priority === "High";

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-[#FAFAFC] transition group"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#111111] tabular-nums font-mono">
                              {t.ticketNo}
                            </div>
                            <div className="text-[11.5px] text-[#666666] line-clamp-1 max-w-[200px]">
                              {t.subject}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#111111]">
                              {t.customerName}
                            </div>
                            <div className="text-[11px] text-[#666666]">
                              {t.unit}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8F8FA] border border-[#EAEAEA] text-[#111111]">
                              {t.category}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${isUrgent
                                  ? "bg-[#FEF2F2] border border-[#FECACA] text-[#E53935]"
                                  : isHigh
                                    ? "bg-[#FFF4ED] border border-[#FEDF89] text-[#B54708]"
                                    : "bg-[#F8F8FA] border border-[#EAEAEA] text-[#666666]"
                                }`}
                            >
                              {t.priority}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {t.isOverdue ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[#E53935]">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Breached</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-[#027A48]">
                                <Clock className="h-3 w-3" />
                                <span className="tabular-nums">{t.slaRemainingHours}h left</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${t.status === "Open"
                                  ? "bg-[#EFF8FF] border-[#BFDBFE] text-[#175CD3]"
                                  : t.status === "In Progress"
                                    ? "bg-[#F4F1FF] border-[#DDD6FE] text-[#6D4AFF]"
                                    : t.status === "Escalated"
                                      ? "bg-[#FEF2F2] border-[#FECACA] text-[#E53935]"
                                      : "bg-[#ECFDF3] border-[#A6F4C5] text-[#027A48]"
                                }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${t.status === "Open"
                                    ? "bg-[#175CD3]"
                                    : t.status === "In Progress"
                                      ? "bg-[#6D4AFF]"
                                      : t.status === "Escalated"
                                        ? "bg-[#E53935]"
                                        : "bg-[#027A48]"
                                  }`}
                              />
                              {t.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(t)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#EAEAEA] bg-[#FFFFFF] text-[#666666] hover:bg-[#F4F1FF] hover:border-[#6D4AFF] hover:text-[#6D4AFF] transition shadow-2xs"
                              title="Inspect Ticket"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#666666]">
                        No service tickets match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between p-3 border-t border-[#EAEAEA] bg-[#FAFAFC] text-xs">
              <span className="text-[#666666]">
                Showing <strong className="text-[#111111]">{Math.min(6, filteredTickets.length)}</strong> of {filteredTickets.length} tickets
              </span>
              <Link
                href="/dashboard/customer-service/tickets"
                className="inline-flex items-center gap-1 font-semibold text-[#6D4AFF] hover:underline"
              >
                <span>Full Tickets Directory</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Agent Availability & Due Follow-ups */}
        <div className="space-y-6">
          {/* Agent Availability Card */}
          <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#0B0B0D]">
                  Support Agents & Engineers
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Real-time workload and dispatch readiness.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                4 Active
              </span>
            </div>

            <div className="space-y-2.5">
              {SUPPORT_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8FA] transition border border-transparent hover:border-[#EAEAEA]"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${agent.avatarBg}`}
                    >
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#111111]">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-[#666666]">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${agent.status === "Available"
                          ? "text-[#027A48]"
                          : agent.status === "Busy"
                            ? "text-[#B54708]"
                            : "text-[#929292]"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${agent.status === "Available"
                            ? "bg-[#027A48]"
                            : agent.status === "Busy"
                              ? "bg-[#B54708]"
                              : "bg-[#929292]"
                          }`}
                      />
                      {agent.status}
                    </span>
                    <div className="text-[10px] text-[#666666]">
                      {agent.activeTickets} tickets assigned
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Follow-ups & Tasks Card */}
          <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#0B0B0D]">
                  Follow-ups & Due Today
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Scheduled site calls and statutory deadlines.
                </p>
              </div>
              <Calendar className="h-4 w-4 text-[#666666]" />
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-lg border transition ${task.completed
                      ? "bg-[#F8F8FA] border-[#EAEAEA] opacity-60"
                      : task.isOverdue
                        ? "bg-[#FEF2F2] border-[#FECACA]"
                        : "bg-[#FFFFFF] border-[#EAEAEA] hover:border-[#D0D5DD]"
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${task.completed
                          ? "bg-[#6D4AFF] border-[#6D4AFF] text-white"
                          : "border-[#D0D5DD] hover:border-[#6D4AFF]"
                        }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    <div className="flex-1">
                      <div
                        className={`text-xs font-semibold ${task.completed
                            ? "line-through text-[#666666]"
                            : task.isOverdue
                              ? "text-[#E53935]"
                              : "text-[#111111]"
                          }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        {task.customerName} • {task.unit}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10.5px]">
                        <span
                          className={`font-semibold ${task.isOverdue
                              ? "text-[#E53935]"
                              : "text-[#666666]"
                            }`}
                        >
                          {task.dueDate} • {task.dueTime}
                        </span>
                        {task.isOverdue && (
                          <span className="font-bold text-[#E53935] uppercase tracking-wider text-[9.5px]">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="rounded-[12px] border border-[#EAEAEA] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0D]">
              Operational Shortcuts
            </h4>

            <div className="space-y-1.5">
              <Link
                href="/dashboard/customer-service/customers"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8FA] border border-transparent hover:border-[#EAEAEA] text-xs font-medium text-[#111111] transition group"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[#6D4AFF]" />
                  <span>Customer 360° Directory</span>
                </div>
                <ArrowRight className="h-3 w-3 text-[#929292] group-hover:text-[#6D4AFF] transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/handover/inspection-snags"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8FA] border border-transparent hover:border-[#EAEAEA] text-xs font-medium text-[#111111] transition group"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-[#027A48]" />
                  <span>Joint Inspection & Snagging</span>
                </div>
                <ArrowRight className="h-3 w-3 text-[#929292] group-hover:text-[#6D4AFF] transition" />
              </Link>

              <Link
                href="/dashboard/customer-service/property-care/warranty-dlp"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8FA] border border-transparent hover:border-[#EAEAEA] text-xs font-medium text-[#111111] transition group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#E53935]" />
                  <span>2-Year Statutory DLP Warranties</span>
                </div>
                <ArrowRight className="h-3 w-3 text-[#929292] group-hover:text-[#6D4AFF] transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Create Service Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[12px] bg-[#FFFFFF] border border-[#EAEAEA] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0B0B0D]">
                  Log New Service Ticket
                </h3>
                <p className="text-xs text-[#666666]">
                  Record customer complaint, civil defect, or billing inquiry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-[#666666] hover:bg-[#F8F8FA] hover:text-[#111111] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Ticket Subject / Defect Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master bathroom concealed pipe seepage"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] placeholder:text-[#929292] focus:outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammad Rafiqul Islam"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] placeholder:text-[#929292] focus:outline-none focus:border-[#6D4AFF] transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Unit / Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apt 6A"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] placeholder:text-[#929292] focus:outline-none focus:border-[#6D4AFF] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Project Site
                  </label>
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#6D4AFF] transition"
                  >
                    <option value="Hena Heights">Hena Heights (Gulshan)</option>
                    <option value="Sheba Valley">Sheba Valley (Mirpur)</option>
                    <option value="Eastern Lakeview">Eastern Lakeview (Bashundhara)</option>
                    <option value="Uttara Park">Uttara Park (Uttara)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#6D4AFF] transition"
                  >
                    <option value="Sanitary & Plumbing">Sanitary & Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil Work">Civil Work</option>
                    <option value="Finishing & Tiles">Finishing & Tiles</option>
                    <option value="Accounts & Billing">Accounts & Billing</option>
                    <option value="Handover Delay">Handover Delay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#6D4AFF] transition"
                  >
                    <option value="Low">Low (72h SLA)</option>
                    <option value="Medium">Medium (24h SLA)</option>
                    <option value="High">High (12h SLA)</option>
                    <option value="Urgent">Urgent (4h SLA - Red Alert)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Assign Agent / Engineer
                  </label>
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#6D4AFF] transition"
                  >
                    <option value="Engr. Tanvir Ahmed">Engr. Tanvir Ahmed (Site QA)</option>
                    <option value="Sarah Rahman">Sarah Rahman (Relations)</option>
                    <option value="Md. Rahim Ullah">Md. Rahim Ullah (Accounts)</option>
                    <option value="Fatima Begum">Fatima Begum (DLP Officer)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-xs font-medium text-[#111111] hover:bg-[#F8F8FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6D4AFF] text-xs font-medium text-[#FFFFFF] hover:bg-[#5837DB] transition shadow-xs"
                >
                  Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Quick View Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] border-l border-[#EAEAEA] p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
                <div>
                  <div className="font-mono text-xs font-bold text-[#6D4AFF]">
                    {selectedTicket.ticketNo}
                  </div>
                  <h3 className="text-base font-bold text-[#0B0B0D] mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-md p-1 text-[#666666] hover:bg-[#F8F8FA] hover:text-[#111111]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status & Priority Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-semibold ${selectedTicket.priority === "Urgent"
                      ? "bg-[#FEF2F2] text-[#E53935] border border-[#FECACA]"
                      : selectedTicket.priority === "High"
                        ? "bg-[#FFF4ED] text-[#B54708] border border-[#FEDF89]"
                        : "bg-[#F8F8FA] text-[#666666] border border-[#EAEAEA]"
                    }`}
                >
                  Priority: {selectedTicket.priority}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-semibold ${selectedTicket.status === "Open"
                      ? "bg-[#EFF8FF] text-[#175CD3] border border-[#BFDBFE]"
                      : selectedTicket.status === "In Progress"
                        ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
                        : selectedTicket.status === "Escalated"
                          ? "bg-[#FEF2F2] text-[#E53935] border border-[#FECACA]"
                          : "bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]"
                    }`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              {/* Detail fields */}
              <div className="rounded-lg border border-[#EAEAEA] p-3.5 bg-[#F8F8FA] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Customer Name:</span>
                  <span className="font-semibold text-[#111111]">{selectedTicket.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Contact Phone:</span>
                  <span className="font-semibold text-[#111111]">{selectedTicket.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Unit / Site:</span>
                  <span className="font-semibold text-[#111111]">
                    {selectedTicket.unit} ({selectedTicket.project})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Category:</span>
                  <span className="font-semibold text-[#111111]">{selectedTicket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Assigned Specialist:</span>
                  <span className="font-semibold text-[#6D4AFF]">{selectedTicket.assignedAgent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">SLA Adherence:</span>
                  {selectedTicket.isOverdue ? (
                    <span className="font-bold text-[#E53935]">Breached SLA</span>
                  ) : (
                    <span className="font-semibold text-[#027A48]">{selectedTicket.slaRemainingHours}h Remaining</span>
                  )}
                </div>
              </div>

              {/* Statutory Note */}
              <div className="p-3 rounded-lg border border-[#C9BFFF] bg-[#F4F1FF] text-[#2E1A87] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#6D4AFF]" />
                  <span>Post-Sales Warranty Coverage</span>
                </div>
                <p className="text-[11px] text-[#374151] leading-relaxed">
                  Complaints logged under civil, finishing, or concealed MEP categories within 24 months of possession are governed under Real Estate Act 2010 Section 11(2)(c) rectification obligations.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAEAEA] flex gap-2">
              <Link
                href="/dashboard/customer-service/tickets"
                className="flex-1 inline-flex items-center justify-center py-2 px-3 rounded-lg bg-[#6D4AFF] text-white font-medium text-xs hover:bg-[#5837DB] transition"
              >
                <span>Open in Ticket Manager</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="py-2 px-3 rounded-lg border border-[#EAEAEA] text-xs font-medium text-[#111111] hover:bg-[#F8F8FA] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
