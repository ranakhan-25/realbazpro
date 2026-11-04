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
    customerNotes: "Interior contractor introduced and site access permission pass endorsed.",
  },
  {
    id: "VST-105",
    visitNo: "VST-2026-038",
    customerName: "Mrs. Anowara Begum",
    phone: "+880 1715-334455",
    unit: "B-2, Meghna Ocean Pearl",
    project: "Meghna Ocean Pearl",
    visitPurpose: "General Visit",
    appointmentDate: "2026-11-02",
    timeSlot: "11:30 AM - 01:00 PM",
    assignedEscort: "Engr. Mahmudul Karim",
    safetyPpeRequired: true,
    status: "Rescheduled",
    customerNotes: "Postponed due to rainfall; customer requested next Saturday visit.",
  },
];

export default function SiteVisitsAppointmentsPage() {
  const { primaryColor } = useTheme();
  const [visits, setVisits] = useState<SiteVisitAppointment[]>(INITIAL_VISITS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState<SiteVisitAppointment | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState("Hena Heights, Gulshan");
  const [unit, setUnit] = useState("");
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
      toast.error("Please fill in customer name, unit and appointment date.");
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
      safetyPpeRequired: true,
      status: "Scheduled",
      customerNotes,
    };

    setVisits([newVisit, ...visits]);
    toast.success(`Site visit booked for ${customerName} on ${appointmentDate}`);
    setIsBookModalOpen(false);
    setCustomerName("");
    setPhone("");
    setUnit("");
    setCustomerNotes("");
  };

  const handleStatusChange = (id: string, newStatus: SiteVisitAppointment["status"]) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
    toast.success(`Visit status updated to ${newStatus}`);
  };

  const columns: Column<SiteVisitAppointment>[] = [
    {
      header: "Visit ID & Customer",
      accessorKey: "visitNo",
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.visitNo} • {row.phone}</div>
        </div>
      ),
    },
    {
      header: "Project & Unit",
      accessorKey: "project",
      cell: (row) => (
        <div>
          <div className="text-xs font-medium text-foreground">{row.project}</div>
          <div className="text-xs text-muted-foreground">Unit: {row.unit}</div>
        </div>
      ),
    },
    {
      header: "Purpose",
      accessorKey: "visitPurpose",
      cell: (row) => (
        <span className="text-xs font-medium text-foreground bg-foreground/5 px-2.5 py-1 rounded-md">
          {row.visitPurpose}
        </span>
      ),
    },
    {
      header: "Scheduled Slot",
      accessorKey: "appointmentDate",
      cell: (row) => (
        <div className="text-xs">
          <div className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {row.appointmentDate}
          </div>
          <div className="text-muted-foreground text-[11px] flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {row.timeSlot}
          </div>
        </div>
      ),
    },
    {
      header: "Assigned Escort & Safety",
      accessorKey: "assignedEscort",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-foreground">{row.assignedEscort}</div>
          {row.safetyPpeRequired && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
              <HardHat className="h-3 w-3" /> Helmet & PPE Required
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const badges = {
          "Scheduled": "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
          "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
          "Completed": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
          "Rescheduled": "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
          "Cancelled": "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
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
            onClick={() => setSelectedVisit(row)}
            className="p-1.5 rounded-lg border border-border hover:bg-foreground/5 text-foreground/80 transition"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.status === "Scheduled" && (
            <button
              onClick={() => handleStatusChange(row.id, "In Progress")}
              className="px-2 py-1 text-xs rounded border border-border hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 font-medium transition"
              title="Mark In Progress"
            >
              Check-In
            </button>
          )}
          {row.status === "In Progress" && (
            <button
              onClick={() => handleStatusChange(row.id, "Completed")}
              className="px-2 py-1 text-xs rounded border border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 font-medium transition"
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
    <div className="space-y-6">
      <CSPageHeader
        title="Site Visits & Appointments"
        description="Coordinate prospective and post-sales site visits, joint construction inspections, handover walkthroughs, and safety compliance."
        badgeText="On-Site Operations"
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
          subtitle="Across 6 active projects"
          icon={Calendar}
          color="blue"
        />
        <CSStatCard
          title="Today's Site Appointments"
          value="5"
          subtitle="2 Completed, 1 In Progress"
          icon={Clock}
          trend={{ value: 10, isPositive: true }}
        />
        <CSStatCard
          title="Escort Engineers on Duty"
          value="8"
          subtitle="Site QA & Post-Sales Officers"
          icon={UserCheck}
          color="purple"
        />
        <CSStatCard
          title="Visit Completion Rate"
          value="96.2%"
          subtitle="Prompt site feedback captured"
          icon={CheckCircle2}
          color="emerald"
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
        onChange={setActiveTab}
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
        description="Coordinate engineer escort, safety PPE protocol, and schedule calendar."
      >
        <form onSubmit={handleBookVisit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Barrister Shahed Chowdhury"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Contact Phone *</label>
              <input
                type="text"
                placeholder="+880 1700-000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Project *</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Hena Heights, Gulshan">Hena Heights, Gulshan</option>
                <option value="Eastern Lakeview">Eastern Lakeview</option>
                <option value="Sheba Green Valley">Sheba Green Valley</option>
                <option value="Uttara Green Park">Uttara Green Park</option>
                <option value="Meghna Ocean Pearl">Meghna Ocean Pearl</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Unit / Flat No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apt A-7 (7th Floor)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Visit Purpose *</label>
              <select
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Milestone Inspection">Milestone Inspection</option>
                <option value="Snagging Walkthrough">Snagging Walkthrough</option>
                <option value="Handover Walkthrough">Handover Walkthrough</option>
                <option value="Interior Fit-out">Interior Fit-out</option>
                <option value="General Visit">General Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Assigned Escort *</label>
              <select
                value={assignedEscort}
                onChange={(e) => setAssignedEscort(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Engr. Monirul Islam (Site QA)">Engr. Monirul Islam (Site QA)</option>
                <option value="Kazi Farhad (QA Supervisor)">Kazi Farhad (QA Supervisor)</option>
                <option value="Md. Tariqul Hasan (Site Engr)">Md. Tariqul Hasan (Site Engr)</option>
                <option value="Nusrat Jahan (Post-Sales Officer)">Nusrat Jahan (Post-Sales Officer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Time Slot *</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM</option>
                <option value="04:00 PM - 05:30 PM">04:00 PM - 05:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Specific Inspection Focus / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Inspect bathroom tile grouting and kitchen window sealant..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-foreground/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Confirm Appointment
            </button>
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
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-border bg-foreground/[0.02] space-y-2">
              <div className="text-xs text-muted-foreground">Appointment Status</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{selectedVisit.visitPurpose}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                  {selectedVisit.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer & Project</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.phone}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Project:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.project}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.unit}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visit Logistics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.appointmentDate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Time Slot:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.timeSlot}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Escort:</span>
                  <div className="font-semibold text-foreground">{selectedVisit.assignedEscort}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Safety Gear:</span>
                  <div className="font-semibold text-foreground">
                    {selectedVisit.safetyPpeRequired ? "Helmet & Vest Mandatory" : "General Access"}
                  </div>
                </div>
              </div>
            </div>

            {selectedVisit.customerNotes && (
              <div className="space-y-1 pt-2 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Special Instructions</h4>
                <p className="text-xs text-muted-foreground bg-foreground/5 p-3 rounded-lg">
                  {selectedVisit.customerNotes}
                </p>
              </div>
            )}

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  handleStatusChange(selectedVisit.id, "Completed");
                  setSelectedVisit(null);
                }}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
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

