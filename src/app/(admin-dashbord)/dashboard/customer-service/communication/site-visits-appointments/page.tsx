"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  HardHat,
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

interface SiteVisitAppointment {
  id: string;
  visitNo: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  visitPurpose: "Milestone Inspection" | "Snagging Walkthrough" | "Handover Walkthrough" | "Interior Fit-out" | "General Visit";
  appointmentDate: string;
  timeSlot: string;
  assignedEscort: string;
  safetyPpeRequired: boolean;
  status: "Scheduled" | "In Progress" | "Completed" | "Rescheduled" | "Cancelled";
  customerNotes?: string;
}

const INITIAL_VISITS: SiteVisitAppointment[] = [
  {
    id: "VST-101",
    visitNo: "VST-2026-041",
    customerName: "Mohammad Rafiqul Islam",
    phone: "+880 1711-223344",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    visitPurpose: "Milestone Inspection",
    appointmentDate: "2026-11-04",
    timeSlot: "11:00 AM - 12:30 PM",
    assignedEscort: "Engr. Monirul Islam (Site QA)",
    safetyPpeRequired: true,
    status: "In Progress",
    customerNotes: "Allottee wishes to inspect dining floor layout before granite installation begins.",
  },
  {
    id: "VST-102",
    visitNo: "VST-2026-042",
    customerName: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    unit: "C-9, Sheba Green Valley",
    project: "Sheba Green Valley",
    visitPurpose: "Snagging Walkthrough",
    appointmentDate: "2026-11-04",
    timeSlot: "02:30 PM - 04:00 PM",
    assignedEscort: "Kazi Farhad (QA Supervisor)",
    safetyPpeRequired: true,
    status: "Scheduled",
    customerNotes: "Joint inspection for electrical fixture checking prior to final possession sign-off.",
  },
  {
    id: "VST-103",
    visitNo: "VST-2026-043",
    customerName: "Dr. Nazmul Huda",
    phone: "+880 1819-876543",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    visitPurpose: "Handover Walkthrough",
    appointmentDate: "2026-11-05",
    timeSlot: "10:00 AM - 11:30 AM",
    assignedEscort: "Nusrat Jahan (Post-Sales Officer)",
    safetyPpeRequired: false,
    status: "Scheduled",
    customerNotes: "Key verification and utility sub-meter reading verification.",
  },
  {
    id: "VST-104",
    visitNo: "VST-2026-039",
    customerName: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    unit: "D-2, Uttara Green Park",
    project: "Uttara Green Park",
    visitPurpose: "Interior Fit-out",
    appointmentDate: "2026-11-03",
    timeSlot: "03:00 PM - 04:30 PM",
    assignedEscort: "Md. Tariqul Hasan (Site Engr)",
    safetyPpeRequired: true,
    status: "Completed",
    customerNotes: "Allottee contractor access granted for false ceiling design measurement.",
  },
];

export default function SiteVisitsAppointmentsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [visits, setVisits] = useState<SiteVisitAppointment[]>(INITIAL_VISITS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState<SiteVisitAppointment | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [project, setProject] = useState("Hena Heights, Gulshan");
  const [visitPurpose, setVisitPurpose] = useState<SiteVisitAppointment["visitPurpose"]>("Milestone Inspection");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 11:30 AM");
  const [assignedEscort, setAssignedEscort] = useState("Engr. Monirul Islam (Site QA)");
  const [customerNotes, setCustomerNotes] = useState("");

  const filteredVisits = visits.filter((v) => {
    if (activeTab === "today") return v.appointmentDate === "2026-11-04";
    if (activeTab === "upcoming") return v.status === "Scheduled";
    if (activeTab === "snagging") return v.visitPurpose === "Snagging Walkthrough";
    if (activeTab === "completed") return v.status === "Completed";
    if (activeTab === "rescheduled") return v.status === "Rescheduled" || v.status === "Cancelled";
    return true;
  });

  const counts = {
    all: visits.length,
    today: visits.filter((v) => v.appointmentDate === "2026-11-04").length,
    upcoming: visits.filter((v) => v.status === "Scheduled").length,
    snagging: visits.filter((v) => v.visitPurpose === "Snagging Walkthrough").length,
    completed: visits.filter((v) => v.status === "Completed").length,
    rescheduled: visits.filter((v) => v.status === "Rescheduled" || v.status === "Cancelled").length,
  };

  const handleBookVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !unit || !appointmentDate) {
      toast.error("Please fill in customer name, unit, and visit date.");
      return;
    }

    const newVisit: SiteVisitAppointment = {
      id: `VST-${Date.now().toString().slice(-4)}`,
      visitNo: `VST-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      phone: phone || "+880 1700-000000",
      unit,
      project,
      visitPurpose,
      appointmentDate,
      timeSlot,
      assignedEscort,
      safetyPpeRequired: visitPurpose !== "Handover Walkthrough",
      status: "Scheduled",
      customerNotes,
    };

    setVisits([newVisit, ...visits]);
    toast.success(`Site appointment booked for ${customerName} on ${appointmentDate}`);
    setIsBookModalOpen(false);
    setCustomerName("");
    setPhone("");
    setUnit("");
    setCustomerNotes("");
  };

  const handleStatusChange = (id: string, newStatus: SiteVisitAppointment["status"]) => {
    setVisits(visits.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const columns: Column<SiteVisitAppointment>[] = [
    {
      key: "visitNo",
      header: "SLOT NO & CUSTOMER",
      sortable: true,
      minWidth: "210px",
      render: (row) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{row.customerName}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{row.visitNo} • {row.unit}</div>
        </div>
      ),
    },
    {
      key: "visitPurpose",
      header: "PURPOSE",
      minWidth: "180px",
      render: (row) => (
        <span className="text-[11px] font-medium text-[#374151] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
          {row.visitPurpose}
        </span>
      ),
    },
    {
      key: "appointmentDate",
      header: "DATE & TIME SLOT",
      minWidth: "190px",
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[#111827] tabular-nums">{row.appointmentDate}</div>
          <div className="text-[#6B7280] text-[11px] tabular-nums mt-0.5">{row.timeSlot}</div>
        </div>
      ),
    },
    {
      key: "assignedEscort",
      header: "ESCORT & SAFETY",
      minWidth: "200px",
      render: (row) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#111827]">{row.assignedEscort}</div>
          {row.safetyPpeRequired ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#DC6803] font-semibold bg-[#FFFAEB] border border-[#FEDF89] px-2 py-0.5 rounded-full">
              <HardHat className="h-3 w-3" /> Helmet & Vest
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#039855] font-semibold bg-[#ECFDF3] border border-[#A6F4C5] px-2 py-0.5 rounded-full">
              General Access
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "130px",
      render: (row) => {
        const badges = {
          Scheduled: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
          "In Progress": "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]",
          Completed: "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]",
          Rescheduled: "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]",
          Cancelled: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
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
      minWidth: "140px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedVisit(row)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title="View Details"
            aria-label="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === "Scheduled" && (
            <button
              type="button"
              onClick={() => handleStatusChange(row.id, "In Progress")}
              className="h-8 px-2.5 rounded-lg inline-flex items-center text-xs font-semibold bg-[#FFFAEB] border border-[#FEDF89] text-[#DC6803] hover:bg-[#FEF0C7] transition shadow-xs"
              title="Mark In Progress"
            >
              Check-In
            </button>
          )}
          {row.status === "In Progress" && (
            <button
              type="button"
              onClick={() => handleStatusChange(row.id, "Completed")}
              className="h-8 px-2.5 rounded-lg inline-flex items-center text-xs font-semibold bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] transition shadow-xs"
              title="Mark Completed"
            >
              Done
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Site Visits & Appointments"
        subtitle="Coordinate prospective and post-sales site visits, joint construction inspections, handover walkthroughs, and safety compliance."
        badge="On-Site Operations"
        breadcrumbs={[{ label: "Communication & Appointments" }, { label: "Site Visits" }]}
        primaryAction={{
          label: "Book Site Visit",
          icon: Plus,
          onClick: () => setIsBookModalOpen(true),
        }}
        secondaryActions={[
          {
            label: "Refresh Calendar",
            icon: RefreshCw,
            onClick: () => toast.success("Site engineer visit calendar updated."),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Scheduled This Week"
          value="24"
          subtext="Across 6 active projects"
          icon={Calendar}
        />
        <CSStatCard
          title="Today's Site Appointments"
          value="5"
          subtext="2 Completed, 1 In Progress"
          icon={Clock}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#2563EB]"
        />
        <CSStatCard
          title="Escort Engineers on Duty"
          value="8"
          subtext="Site QA & Post-Sales Officers"
          icon={UserCheck}
          iconBg="bg-[#F4F1FF]"
          iconColor="text-[#6D4AFF]"
        />
        <CSStatCard
          title="Visit Completion Rate"
          value="96.2%"
          subtext="Prompt site feedback captured"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Visits", count: counts.all },
          { key: "today", label: "Today's Schedule", count: counts.today },
          { key: "upcoming", label: "Upcoming / Confirmed", count: counts.upcoming },
          { key: "snagging", label: "Snagging Inspections", count: counts.snagging },
          { key: "completed", label: "Completed", count: counts.completed },
          { key: "rescheduled", label: "Rescheduled / Cancelled", count: counts.rescheduled },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        columns={columns}
        data={filteredVisits}
        searchPlaceholder="Search by customer, unit, project, or escort engineer..."
        exportFileName="RealBiz_Site_Visits_Schedule"
      />

      {/* Book Visit Modal */}
      <CSModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Customer Site Visit / Inspection"
        subtitle="Coordinate engineer escort, safety PPE protocol, and schedule calendar."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="book-visit-form"
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Confirm Appointment
            </button>
          </>
        }
      >
        <form id="book-visit-form" onSubmit={handleBookVisit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Barrister Shahed Chowdhury"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Contact Phone *</label>
              <input
                type="text"
                placeholder="+880 1700-000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Project *</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Hena Heights, Gulshan">Hena Heights, Gulshan</option>
                <option value="Eastern Lakeview">Eastern Lakeview</option>
                <option value="Sheba Green Valley">Sheba Green Valley</option>
                <option value="Uttara Green Park">Uttara Green Park</option>
                <option value="Meghna Ocean Pearl">Meghna Ocean Pearl</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit / Flat No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apt A-7 (7th Floor)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Visit Purpose *</label>
              <select
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Milestone Inspection">Milestone Inspection</option>
                <option value="Snagging Walkthrough">Snagging Walkthrough</option>
                <option value="Handover Walkthrough">Handover Walkthrough</option>
                <option value="Interior Fit-out">Interior Fit-out</option>
                <option value="General Visit">General Visit</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Assigned Escort *</label>
              <select
                value={assignedEscort}
                onChange={(e) => setAssignedEscort(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Engr. Monirul Islam (Site QA)">Engr. Monirul Islam (Site QA)</option>
                <option value="Kazi Farhad (QA Supervisor)">Kazi Farhad (QA Supervisor)</option>
                <option value="Md. Tariqul Hasan (Site Engr)">Md. Tariqul Hasan (Site Engr)</option>
                <option value="Nusrat Jahan (Post-Sales Officer)">Nusrat Jahan (Post-Sales Officer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Time Slot *</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM</option>
                <option value="04:00 PM - 05:30 PM">04:00 PM - 05:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Specific Inspection Focus / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Inspect bathroom tile grouting and kitchen window sealant..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] text-xs transition"
            />
          </div>
        </form>
      </CSModal>

      {/* Detail Drawer */}
      <CSDetailDrawer
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title={`Visit Record: ${selectedVisit?.visitNo}`}
        subtitle={`${selectedVisit?.customerName} • ${selectedVisit?.project}`}
      >
        {selectedVisit && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] space-y-2">
              <div className="text-[11px] text-[#6B7280]">Appointment Status</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827]">{selectedVisit.visitPurpose}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {selectedVisit.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Customer & Project</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Customer:</span>
                  <div className="font-semibold text-[#111827]">{selectedVisit.customerName}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Phone:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedVisit.phone}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Project:</span>
                  <div className="font-semibold text-[#111827]">{selectedVisit.project}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Unit:</span>
                  <div className="font-semibold text-[#6D4AFF]">{selectedVisit.unit}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Visit Logistics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Date:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedVisit.appointmentDate}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Time Slot:</span>
                  <div className="font-semibold text-[#111827] tabular-nums">{selectedVisit.timeSlot}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Assigned Escort:</span>
                  <div className="font-semibold text-[#111827]">{selectedVisit.assignedEscort}</div>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Safety Gear:</span>
                  <div className="font-semibold text-[#111827]">
                    {selectedVisit.safetyPpeRequired ? "Helmet & Vest Mandatory" : "General Access"}
                  </div>
                </div>
              </div>
            </div>

            {selectedVisit.customerNotes && (
              <div className="space-y-1 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Special Instructions</h4>
                <p className="text-xs text-[#374151] bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-lg">
                  {selectedVisit.customerNotes}
                </p>
              </div>
            )}

            <div className="pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(selectedVisit.id, "Completed");
                  setSelectedVisit(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg transition shadow-xs"
              >
                Mark Visit Completed
              </button>
            </div>
          </div>
        )}
      </CSDetailDrawer>
    </div>
  );
}
