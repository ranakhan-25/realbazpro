"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wrench,
  ShieldCheck,
  Clock,
  Plus,
  Tag,
  Search,
  DollarSign,
  Trash2,
  Star,
  Users,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import {
  getUtilityTickets,
  getUtilityTicketStats,
  getUtilityTicketDropdownMeta,
  createUtilityTicket,
  assignUtilityTicketTechnician,
  updateUtilityTicketStatus,
  deleteUtilityTicket,
  getUtilityTechnicians,
  createUtilityTechnician,
  deleteUtilityTechnician,
  getWarrantyItems,
  getWarrantyStats,
  createWarrantyItem,
  deleteWarrantyItem,
  UtilityTicketItem,
  UtilityTicketStatsData,
  UtilityTechnicianItem,
  WarrantyRegistryItem,
  WarrantyStatsData,
  UtilityDropdownMeta,
  TechnicianSpecialty,
  TechnicianType,
  UtilityTicketCategory,
  UtilityTicketPriority,
  UtilityTicketStatus,
  WarrantyItemCategory,
} from "@/services/customerUtilityService";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function UtilityServicePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, isLoading: isProjectLoading } = useSelectedProject();

  // Primary Feature Navigation
  const [activeFeatureTab, setActiveFeatureTab] = useState<
    "tickets" | "technicians" | "warranty"
  >("tickets");

  // ==========================================
  // 1. TICKETS STATE
  // ==========================================
  const [tickets, setTickets] = useState<UtilityTicketItem[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);
  const [ticketTab, setTicketTab] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStats, setTicketStats] = useState<UtilityTicketStatsData>({
    total_tickets: 0,
    active_queue: 0,
    open_count: 0,
    assigned_count: 0,
    in_progress_count: 0,
    resolved_count: 0,
    handed_over_count: 0,
    closed_count: 0,
    free_count: 0,
    paid_count: 0,
    total_collected_charges: 0,
    total_collected_charges_formatted: "৳ 0",
  });
  const [meta, setMeta] = useState<UtilityDropdownMeta>({
    categories: ["Plumbing", "Electrical", "Sanitary", "Other"],
    priorities: ["Low", "Medium", "High", "Emergency"],
    statuses: [
      "Open",
      "Assigned",
      "In Progress",
      "Resolved",
      "Handed Over",
      "Closed",
    ],
    technicians: [],
    warranty_items: [],
  });

  // ==========================================
  // 2. TECHNICIANS STATE
  // ==========================================
  const [technicians, setTechnicians] = useState<UtilityTechnicianItem[]>([]);
  const [isTechLoading, setIsTechLoading] = useState(false);
  const [techSpecialtyFilter, setTechSpecialtyFilter] = useState("all");

  // ==========================================
  // 3. WARRANTY REGISTRY STATE
  // ==========================================
  const [warrantyItems, setWarrantyItems] = useState<WarrantyRegistryItem[]>(
    [],
  );
  const [isWarrantyLoading, setIsWarrantyLoading] = useState(false);
  const [warrantyTab, setWarrantyTab] = useState("all");
  const [warrantyStats, setWarrantyStats] = useState<WarrantyStatsData>({
    total_items: 0,
    active_items: 0,
    expiring_soon_items: 0,
    expired_items: 0,
  });

  // ==========================================
  // MODALS STATE
  // ==========================================
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isAssignTechOpen, setIsAssignTechOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [isCreateTechOpen, setIsCreateTechOpen] = useState(false);
  const [isCreateWarrantyOpen, setIsCreateWarrantyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<UtilityTicketItem | null>(null);

  // Ticket Form
  const [tUnit, setTUnit] = useState("");
  const [tCustomerName, setTCustomerName] = useState("");
  const [tCustomerPhone, setTCustomerPhone] = useState("");
  const [tCategory, setTCategory] = useState<UtilityTicketCategory>("Plumbing");
  const [tDescription, setTDescription] = useState("");
  const [tPriority, setTPriority] = useState<UtilityTicketPriority>("Medium");
  const [tTechnicianId, setTTechnicianId] = useState<number | undefined>(
    undefined,
  );
  const [tWarrantyItemId, setTWarrantyItemId] = useState<number | undefined>(
    undefined,
  );
  const [tEstimatedCharge, setTEstimatedCharge] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workflow Form
  const [wTargetStatus, setWTargetStatus] =
    useState<UtilityTicketStatus>("In Progress");
  const [wResolutionNotes, setWResolutionNotes] = useState("");
  const [wActualCharge, setWActualCharge] = useState<number>(0);
  const [wCustomerFeedback, setWCustomerFeedback] = useState("");
  const [wCustomerRating, setWCustomerRating] = useState<number>(5);
  const [assignTechId, setAssignTechId] = useState<number | undefined>(
    undefined,
  );

  // Technician Form
  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [techSpecialty, setTechSpecialty] =
    useState<TechnicianSpecialty>("Plumber");
  const [techType, setTechType] = useState<TechnicianType>("In-house");
  const [techVendorName, setTechVendorName] = useState("");

  // Warranty Form
  const [wItemUnit, setWItemUnit] = useState("");
  const [wItemCustomer, setWItemCustomer] = useState("");
  const [wItemName, setWItemName] = useState("");
  const [wItemCategory, setWItemCategory] =
    useState<WarrantyItemCategory>("Plumbing");
  const [wItemBrand, setWItemBrand] = useState("");
  const [wItemLocation, setWItemLocation] = useState("");
  const [wItemQuantity, setWItemQuantity] = useState(1);
  const [wItemStart, setWItemStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [wItemEnd, setWItemEnd] = useState(
    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  );

  // Selected warranty fixture preview for Ticket Form
  const selectedWarrantyItem = useMemo(() => {
    if (!tWarrantyItemId) return null;
    return (
      meta.warranty_items.find((item) => item.id === tWarrantyItemId) || null
    );
  }, [tWarrantyItemId, meta.warranty_items]);

  // Data Loaders
  const loadDropdownMeta = useCallback(async () => {
    try {
      const res = await getUtilityTicketDropdownMeta(projectId || undefined);
      setMeta(res);
    } catch (e) {
      console.warn("Failed to load utility dropdown metadata:", e);
    }
  }, [projectId]);

  const loadTickets = useCallback(async () => {
    setIsTicketsLoading(true);
    try {
      const [ticketRes, statsRes] = await Promise.all([
        getUtilityTickets({
          project_id: projectId || undefined,
          tab: ticketTab !== "all" ? ticketTab : undefined,
          search: ticketSearch.trim() || undefined,
          sort_by: "queue_serial",
          sort_order: "asc",
          limit: 100,
        }),
        getUtilityTicketStats(projectId || undefined),
      ]);
      setTickets(ticketRes.items);
      setTicketStats(statsRes);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      toast.error("Failed to load utility tickets");
    } finally {
      setIsTicketsLoading(false);
    }
  }, [projectId, ticketTab, ticketSearch]);

  const loadTechnicians = useCallback(async () => {
    setIsTechLoading(true);
    try {
      const res = await getUtilityTechnicians({
        project_id: projectId || undefined,
        specialty:
          techSpecialtyFilter !== "all" ? techSpecialtyFilter : undefined,
        limit: 100,
      });
      setTechnicians(res.items);
    } catch (err) {
      console.error("Failed to load technicians:", err);
    } finally {
      setIsTechLoading(false);
    }
  }, [projectId, techSpecialtyFilter]);

  const loadWarranty = useCallback(async () => {
    setIsWarrantyLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        getWarrantyItems({
          project_id: projectId || undefined,
          status: warrantyTab !== "all" ? warrantyTab : undefined,
          limit: 100,
        }),
        getWarrantyStats(projectId || undefined),
      ]);
      setWarrantyItems(wRes.items);
      setWarrantyStats(sRes);
    } catch (err) {
      console.error("Failed to load warranty items:", err);
    } finally {
      setIsWarrantyLoading(false);
    }
  }, [projectId, warrantyTab]);

  useEffect(() => {
    if (!projectId) return;
    loadDropdownMeta();
  }, [projectId, loadDropdownMeta]);

  useEffect(() => {
    if (!projectId) return;
    if (activeFeatureTab === "tickets") {
      loadTickets();
    } else if (activeFeatureTab === "technicians") {
      loadTechnicians();
    } else if (activeFeatureTab === "warranty") {
      loadWarranty();
    }
  }, [projectId, activeFeatureTab, loadTickets, loadTechnicians, loadWarranty]);

  // Handlers
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      await createUtilityTicket({
        project_id: projectId,
        unit: tUnit,
        customer_name: tCustomerName,
        customer_phone: tCustomerPhone || undefined,
        category: tCategory,
        description: tDescription,
        priority: tPriority,
        technician_id: tTechnicianId,
        warranty_item_id: tWarrantyItemId,
        estimated_charge: tEstimatedCharge,
      });
      toast.success("Utility ticket created successfully!");
      setIsCreateTicketOpen(false);
      setTUnit("");
      setTCustomerName("");
      setTCustomerPhone("");
      setTDescription("");
      setTEstimatedCharge(0);
      setTTechnicianId(undefined);
      setTWarrantyItemId(undefined);
      loadTickets();
      loadDropdownMeta();
    } catch {
      toast.error("Failed to create utility ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTicket || !assignTechId) return;
    setIsSubmitting(true);
    try {
      await assignUtilityTicketTechnician(selectedTicket.uuid, assignTechId);
      toast.success("Technician assigned successfully!");
      setIsAssignTechOpen(false);
      setSelectedTicket(null);
      setAssignTechId(undefined);
      loadTickets();
    } catch {
      toast.error("Failed to assign technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      await updateUtilityTicketStatus(selectedTicket.uuid, {
        status: wTargetStatus,
        resolution_notes: wResolutionNotes || undefined,
        actual_charge: wActualCharge || undefined,
        customer_feedback: wCustomerFeedback || undefined,
        customer_rating: wCustomerRating || undefined,
      });
      toast.success(`Ticket updated to ${wTargetStatus}`);
      setIsUpdateStatusOpen(false);
      setSelectedTicket(null);
      loadTickets();
    } catch {
      toast.error("Failed to update ticket status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteUtilityTicket(uuid);
      toast.success("Ticket deleted");
      loadTickets();
    } catch {
      toast.error("Failed to delete ticket");
    }
  };

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      await createUtilityTechnician({
        name: techName,
        phone: techPhone,
        specialty: techSpecialty,
        technician_type: techType,
        vendor_name: techType === "Vendor" ? techVendorName : undefined,
        is_active: true,
        project_id: projectId,
      });
      toast.success("Technician added successfully!");
      setIsCreateTechOpen(false);
      setTechName("");
      setTechPhone("");
      setTechVendorName("");
      loadTechnicians();
      loadDropdownMeta();
    } catch {
      toast.error("Failed to add technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTechnician = async (uuid: string) => {
    if (!confirm("Are you sure you want to remove this technician?")) return;
    try {
      await deleteUtilityTechnician(uuid);
      toast.success("Technician removed");
      loadTechnicians();
      loadDropdownMeta();
    } catch {
      toast.error("Failed to delete technician");
    }
  };

  const handleCreateWarrantyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      await createWarrantyItem({
        project_id: projectId,
        unit: wItemUnit,
        customer_name: wItemCustomer || undefined,
        item_name: wItemName,
        category: wItemCategory,
        brand: wItemBrand,
        location: wItemLocation,
        quantity: wItemQuantity,
        warranty_start_date: wItemStart,
        warranty_end_date: wItemEnd,
      });
      toast.success("Warranty item registered!");
      setIsCreateWarrantyOpen(false);
      setWItemUnit("");
      setWItemCustomer("");
      setWItemName("");
      setWItemBrand("");
      setWItemLocation("");
      loadWarranty();
      loadDropdownMeta();
    } catch {
      toast.error("Failed to register warranty item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWarrantyItem = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this warranty item?")) return;
    try {
      await deleteWarrantyItem(uuid);
      toast.success("Warranty item deleted");
      loadWarranty();
      loadDropdownMeta();
    } catch {
      toast.error("Failed to delete warranty item");
    }
  };

  // Guard: Empty Project State
  if (!isProjectLoading && !projectId) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
        <CSPageHeader
          title="Building Services | Utility Service"
          subtitle="Manage flat owner utility claims, automated FIFO ticket sequencing, technician assignments, and fixture warranties."
          badge="Building Services"
          breadcrumbs={[
            { label: "Building Services" },
            { label: "Utility Service" },
          ]}
        />
        <CSSelectProjectEmptyState
          featureTitle="Utility Service & Maintenance"
          description="Utility claim queues, on-site technician rosters, and unit fixture warranties are scoped per project. Select a project from the top bar to inspect claims."
        />
      </div>
    );
  }

  // Column Configurations
  const ticketColumns: Column<UtilityTicketItem>[] = [
    {
      header: "QUEUE & SERIAL",
      accessorKey: "queue_serial",
      minWidth: "150px",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F4F1FF] text-[#6D4AFF] font-bold text-xs ring-1 ring-[#DDD6FE]">
              #{row.queue_serial}
            </span>
            <span className="font-semibold text-xs text-[#111827]">
              {row.ticket_number}
            </span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {row.unit} • {row.customer_name}
          </div>
        </div>
      ),
    },
    {
      header: "PROBLEM & CATEGORY",
      accessorKey: "category",
      minWidth: "220px",
      cell: (row) => {
        const catBadgeColors: Record<string, string> = {
          Plumbing: "bg-blue-50 text-blue-700 border-blue-200",
          Electrical: "bg-amber-50 text-amber-700 border-amber-200",
          Sanitary: "bg-teal-50 text-teal-700 border-teal-200",
          Other: "bg-gray-50 text-gray-700 border-gray-200",
        };
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${catBadgeColors[row.category] || catBadgeColors.Other}`}
              >
                {row.category}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  row.priority === "Emergency"
                    ? "bg-red-100 text-red-700 font-bold"
                    : row.priority === "High"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {row.priority}
              </span>
            </div>
            <p className="text-xs text-[#374151] line-clamp-2 max-w-sm">
              {row.description}
            </p>
          </div>
        );
      },
    },
    {
      header: "WARRANTY & COST",
      accessorKey: "cost_type",
      minWidth: "160px",
      cell: (row) => {
        const isFree = row.cost_type === "FREE";
        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isFree
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isFree ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> FREE (Warranty)
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" /> PAID (৳{" "}
                  {row.estimated_charge})
                </>
              )}
            </span>
            {row.warranty_item && (
              <div
                className="text-[11px] text-[#6B7280] truncate max-w-[170px]"
                title={row.warranty_item.item_name}
              >
                🔗 {row.warranty_item.brand} {row.warranty_item.item_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "STATUS",
      accessorKey: "status",
      minWidth: "130px",
      cell: (row) => {
        const statusColors: Record<string, string> = {
          Open: "bg-blue-50 text-blue-700 border-blue-200",
          Assigned: "bg-purple-50 text-purple-700 border-purple-200",
          "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
          Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
          "Handed Over": "bg-teal-50 text-teal-700 border-teal-200",
          Closed: "bg-gray-100 text-gray-500 border-gray-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusColors[row.status] || statusColors.Open}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "TECHNICIAN",
      accessorKey: "technician_id",
      minWidth: "160px",
      cell: (row) =>
        row.technician ? (
          <div>
            <div className="text-xs font-semibold text-[#111827]">
              {row.technician.name}
            </div>
            <div className="text-[11px] text-[#6B7280]">
              {row.technician.specialty} • {row.technician.phone}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        ),
    },
    {
      header: "ACTIONS",
      accessorKey: "uuid",
      minWidth: "200px",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "Open" && (
            <button
              onClick={() => {
                setSelectedTicket(row);
                setAssignTechId(undefined);
                setIsAssignTechOpen(true);
              }}
              className="px-2 py-1 text-[10.5px] font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
            >
              Assign
            </button>
          )}
          {["Open", "Assigned", "In Progress", "Resolved"].includes(
            row.status,
          ) && (
            <button
              onClick={() => {
                setSelectedTicket(row);
                setWTargetStatus(
                  row.status === "Open"
                    ? "Assigned"
                    : row.status === "Assigned"
                      ? "In Progress"
                      : row.status === "In Progress"
                        ? "Resolved"
                        : "Handed Over",
                );
                setWResolutionNotes("");
                setWActualCharge(0);
                setWCustomerFeedback("");
                setWCustomerRating(5);
                setIsUpdateStatusOpen(true);
              }}
              className="px-2 py-1 text-[10.5px] font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              {row.status === "In Progress" ? "Resolve" : "Advance"}
            </button>
          )}
          <button
            onClick={() => handleDeleteTicket(row.uuid)}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const technicianColumns: Column<UtilityTechnicianItem>[] = [
    {
      header: "NAME & CONTACT",
      accessorKey: "name",
      minWidth: "200px",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: brand }}
            >
              {row.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#111827]">
                {row.name}
              </div>
              <div className="text-[11px] text-[#6B7280]">{row.phone}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "SPECIALTY",
      accessorKey: "specialty",
      minWidth: "140px",
      cell: (row) => {
        const specialtyColors: Record<string, string> = {
          Plumber: "bg-blue-50 text-blue-700 border-blue-200",
          Electrician: "bg-amber-50 text-amber-700 border-amber-200",
          "Sanitary Specialist": "bg-teal-50 text-teal-700 border-teal-200",
          "HVAC / Generator": "bg-indigo-50 text-indigo-700 border-indigo-200",
          "Multi-skilled": "bg-purple-50 text-purple-700 border-purple-200",
        };
        return (
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${specialtyColors[row.specialty] || "bg-gray-50 text-gray-700 border-gray-200"}`}
          >
            {row.specialty}
          </span>
        );
      },
    },
    {
      header: "TYPE",
      accessorKey: "technician_type",
      minWidth: "130px",
      cell: (row) => (
        <div>
          <span
            className={`text-xs font-semibold ${
              row.technician_type === "In-house"
                ? "text-emerald-700"
                : "text-orange-700"
            }`}
          >
            {row.technician_type}
          </span>
          {row.vendor_name && (
            <div className="text-[11px] text-[#6B7280]">{row.vendor_name}</div>
          )}
        </div>
      ),
    },
    {
      header: "STATUS",
      accessorKey: "is_active",
      minWidth: "100px",
      cell: (row) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            row.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      accessorKey: "uuid",
      minWidth: "80px",
      cell: (row) => (
        <button
          onClick={() => handleDeleteTechnician(row.uuid)}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const warrantyColumns: Column<WarrantyRegistryItem>[] = [
    {
      header: "ITEM & UNIT",
      accessorKey: "item_name",
      minWidth: "200px",
      cell: (row) => (
        <div>
          <div className="text-xs font-semibold text-[#111827]">
            {row.item_name}
          </div>
          <div className="text-[11px] text-[#6B7280]">
            {row.unit} • {row.brand}
          </div>
          {row.customer_name && (
            <div className="text-[11px] text-[#9CA3AF]">
              {row.customer_name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "CATEGORY",
      accessorKey: "category",
      minWidth: "130px",
      cell: (row) => {
        const catColors: Record<string, string> = {
          Electrical: "bg-amber-50 text-amber-700 border-amber-200",
          Plumbing: "bg-blue-50 text-blue-700 border-blue-200",
          Sanitary: "bg-teal-50 text-teal-700 border-teal-200",
          "Water Fittings": "bg-cyan-50 text-cyan-700 border-cyan-200",
          Other: "bg-gray-50 text-gray-700 border-gray-200",
        };
        return (
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catColors[row.category] || catColors.Other}`}
          >
            {row.category}
          </span>
        );
      },
    },
    {
      header: "WARRANTY PERIOD",
      accessorKey: "warranty_status",
      minWidth: "180px",
      cell: (row) => {
        const statusColors: Record<string, string> = {
          Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
          "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-200",
          Expired: "bg-red-50 text-red-600 border-red-200",
        };
        return (
          <div className="space-y-1">
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusColors[row.warranty_status] || statusColors.Active}`}
            >
              {row.warranty_status}
            </span>
            <div className="text-[11px] text-[#6B7280]">
              {new Date(row.warranty_start_date).toLocaleDateString()} –{" "}
              {new Date(row.warranty_end_date).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      header: "LOCATION",
      accessorKey: "location",
      minWidth: "140px",
      cell: (row) => (
        <div>
          <div className="text-xs text-[#374151]">{row.location}</div>
          <div className="text-[11px] text-[#9CA3AF]">Qty: {row.quantity}</div>
        </div>
      ),
    },
    {
      header: "ACTIONS",
      accessorKey: "uuid",
      minWidth: "80px",
      cell: (row) => (
        <button
          onClick={() => handleDeleteWarrantyItem(row.uuid)}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const featureTabs = [
    {
      id: "tickets" as const,
      label: "Utility Claims Queue",
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: "technicians" as const,
      label: "Technician Roster",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "warranty" as const,
      label: "Warranty Registry",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Building Services | Utility Service"
        subtitle="Manage flat owner utility claims, automated FIFO ticket sequencing, technician assignments, and fixture warranties."
        badge="Building Services"
        breadcrumbs={[
          { label: "Building Services" },
          { label: "Utility Service" },
        ]}
      />

      {/* Feature Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-1 flex gap-1">
        {featureTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFeatureTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeFeatureTab === tab.id
                ? "text-white shadow-xs"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            style={
              activeFeatureTab === tab.id
                ? { backgroundColor: brand }
                : undefined
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TICKETS TAB */}
      {activeFeatureTab === "tickets" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CSStatCard
              title="Active Queue"
              value={ticketStats.active_queue}
              icon={Clock}
              color="blue"
            />
            <CSStatCard
              title="Total Tickets"
              value={ticketStats.total_tickets}
              icon={Wrench}
              color="purple"
            />
            <CSStatCard
              title="FREE (Warranty)"
              value={ticketStats.free_count}
              icon={ShieldCheck}
              color="emerald"
            />
            <CSStatCard
              title="PAID Charges"
              value={ticketStats.total_collected_charges_formatted}
              icon={DollarSign}
              color="amber"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-xs">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "resolved", label: "Resolved" },
                { id: "closed", label: "Closed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTicketTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    ticketTab === tab.id
                      ? "text-white shadow-xs"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={
                    ticketTab === tab.id
                      ? { backgroundColor: brand }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>

            <div className="ml-auto">
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
                style={{ backgroundColor: brand }}
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>
          </div>

          <CSTable<UtilityTicketItem>
            columns={ticketColumns}
            data={tickets}
            isRefreshing={isTicketsLoading}
            emptyTitle="No Utility Tickets"
            emptySubtitle="Create a new ticket to track a utility claim."
            onRefresh={loadTickets}
          />
        </div>
      )}

      {/* TECHNICIANS TAB */}
      {activeFeatureTab === "technicians" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-xs">
              {[
                { id: "all", label: "All" },
                { id: "Plumber", label: "Plumber" },
                { id: "Electrician", label: "Electrician" },
                { id: "Sanitary Specialist", label: "Sanitary" },
                { id: "HVAC / Generator", label: "HVAC" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTechSpecialtyFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    techSpecialtyFilter === tab.id
                      ? "text-white shadow-xs"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={
                    techSpecialtyFilter === tab.id
                      ? { backgroundColor: brand }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setIsCreateTechOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
                style={{ backgroundColor: brand }}
              >
                <Plus className="w-4 h-4" />
                Add Technician
              </button>
            </div>
          </div>

          <CSTable<UtilityTechnicianItem>
            columns={technicianColumns}
            data={technicians}
            isRefreshing={isTechLoading}
            emptyTitle="No Technicians"
            emptySubtitle="Add technicians to assign to utility service tickets."
            onRefresh={loadTechnicians}
          />
        </div>
      )}

      {/* WARRANTY REGISTRY TAB */}
      {activeFeatureTab === "warranty" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Items"
              value={warrantyStats.total_items}
              icon={Tag}
              color="purple"
            />
            <CSStatCard
              title="Active Warranties"
              value={warrantyStats.active_items}
              icon={ShieldCheck}
              color="emerald"
            />
            <CSStatCard
              title="Expiring Soon"
              value={warrantyStats.expiring_soon_items}
              icon={Clock}
              color="amber"
            />
            <CSStatCard
              title="Expired"
              value={warrantyStats.expired_items}
              icon={Star}
              color="rose"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-xs">
              {[
                { id: "all", label: "All" },
                { id: "Active", label: "Active" },
                { id: "Expiring Soon", label: "Expiring" },
                { id: "Expired", label: "Expired" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWarrantyTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    warrantyTab === tab.id
                      ? "text-white shadow-xs"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={
                    warrantyTab === tab.id
                      ? { backgroundColor: brand }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setIsCreateWarrantyOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
                style={{ backgroundColor: brand }}
              >
                <Plus className="w-4 h-4" />
                Register Warranty
              </button>
            </div>
          </div>

          <CSTable<WarrantyRegistryItem>
            columns={warrantyColumns}
            data={warrantyItems}
            isRefreshing={isWarrantyLoading}
            emptyTitle="No Warranty Items"
            emptySubtitle="Register fixture warranty items to auto-detect FREE vs PAID claims."
            onRefresh={loadWarranty}
          />
        </div>
      )}

      {/* Create Ticket Modal */}
      <CSModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        title="Create Utility Ticket"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit / Flat *
              </label>
              <input
                type="text"
                required
                value={tUnit}
                onChange={(e) => setTUnit(e.target.value)}
                placeholder="e.g. A-301"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={tCustomerName}
                onChange={(e) => setTCustomerName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                value={tCustomerPhone}
                onChange={(e) => setTCustomerPhone(e.target.value)}
                placeholder="e.g. 01711223344"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={tCategory}
                onChange={(e) =>
                  setTCategory(e.target.value as UtilityTicketCategory)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                {meta.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={tDescription}
              onChange={(e) => setTDescription(e.target.value)}
              rows={3}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={tPriority}
                onChange={(e) =>
                  setTPriority(e.target.value as UtilityTicketPriority)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                {meta.priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign Technician
              </label>
              <select
                value={tTechnicianId ?? ""}
                onChange={(e) =>
                  setTTechnicianId(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                <option value="">None (Assign later)</option>
                {meta.technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Estimated Charge (৳)
              </label>
              <input
                type="number"
                min={0}
                value={tEstimatedCharge}
                onChange={(e) => setTEstimatedCharge(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          {/* Warranty Item Picker with Live Preview */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Link Warranty Registry Item (Auto FREE/PAID logic)
            </label>
            <select
              value={tWarrantyItemId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setTWarrantyItemId(val);
                if (val) {
                  const match = meta.warranty_items.find((w) => w.id === val);
                  if (match && match.is_active_warranty) {
                    setTEstimatedCharge(0);
                  }
                }
              }}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
            >
              <option value="">
                No warranty fixture linked (Default standard claim)
              </option>
              {meta.warranty_items.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.item_name} [{w.brand}] — Unit {w.unit} (
                  {w.is_active_warranty
                    ? "FREE - Active Warranty"
                    : "PAID - Expired"}
                  )
                </option>
              ))}
            </select>
            {selectedWarrantyItem && (
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-gray-600">
                  Fixture:{" "}
                  <strong className="text-gray-800">
                    {selectedWarrantyItem.item_name}
                  </strong>{" "}
                  ({selectedWarrantyItem.brand})
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold ${
                    selectedWarrantyItem.is_active_warranty
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedWarrantyItem.is_active_warranty
                    ? "✅ Warranty Active (Cost: FREE)"
                    : "⚠️ Warranty Expired (Billable)"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateTicketOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* Assign Technician Modal */}
      <CSModal
        isOpen={isAssignTechOpen}
        onClose={() => setIsAssignTechOpen(false)}
        title={`Assign Technician to ${selectedTicket?.ticket_number || ""}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Available Technician *
            </label>
            <select
              value={assignTechId ?? ""}
              onChange={(e) =>
                setAssignTechId(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
            >
              <option value="">Choose a technician...</option>
              {meta.technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.specialty}) — {t.phone}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAssignTechOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTechnician}
              disabled={isSubmitting || !assignTechId}
              className="px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Assigning..." : "Assign Technician"}
            </button>
          </div>
        </div>
      </CSModal>

      {/* Update Status / Workflow Modal */}
      <CSModal
        isOpen={isUpdateStatusOpen}
        onClose={() => setIsUpdateStatusOpen(false)}
        title={`Update ${selectedTicket?.ticket_number || ""} Status`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Status
            </label>
            <select
              value={wTargetStatus}
              onChange={(e) =>
                setWTargetStatus(e.target.value as UtilityTicketStatus)
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
            >
              {meta.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(wTargetStatus === "Resolved" || wTargetStatus === "Closed") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  value={wResolutionNotes}
                  onChange={(e) => setWResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what action was taken to fix the issue..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Actual Charge (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={wActualCharge}
                  onChange={(e) => setWActualCharge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
                />
              </div>
            </>
          )}

          {wTargetStatus === "Handed Over" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Feedback
                </label>
                <textarea
                  value={wCustomerFeedback}
                  onChange={(e) => setWCustomerFeedback(e.target.value)}
                  rows={2}
                  placeholder="Flat owner feedback upon sign-off..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rating (1–5)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setWCustomerRating(s)}
                      className="cursor-pointer p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= wCustomerRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsUpdateStatusOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Updating..." : `Set ${wTargetStatus}`}
            </button>
          </div>
        </form>
      </CSModal>

      {/* Create Technician Modal */}
      <CSModal
        isOpen={isCreateTechOpen}
        onClose={() => setIsCreateTechOpen(false)}
        title="Add New Technician"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTechnician} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                placeholder="e.g. Rafiqul Islam"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                value={techPhone}
                onChange={(e) => setTechPhone(e.target.value)}
                placeholder="e.g. 01811223344"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Specialty *
              </label>
              <select
                required
                value={techSpecialty}
                onChange={(e) =>
                  setTechSpecialty(e.target.value as TechnicianSpecialty)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                <option value="Plumber">Plumber</option>
                <option value="Electrician">Electrician</option>
                <option value="Sanitary Specialist">Sanitary Specialist</option>
                <option value="HVAC / Generator">HVAC / Generator</option>
                <option value="Multi-skilled">Multi-skilled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Type
              </label>
              <select
                value={techType}
                onChange={(e) => setTechType(e.target.value as TechnicianType)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                <option value="In-house">In-house</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
          </div>

          {techType === "Vendor" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Vendor Company Name
              </label>
              <input
                type="text"
                value={techVendorName}
                onChange={(e) => setTechVendorName(e.target.value)}
                placeholder="e.g. ElectroMech Engineering"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateTechOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Adding..." : "Add Technician"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* Create Warranty Item Modal */}
      <CSModal
        isOpen={isCreateWarrantyOpen}
        onClose={() => setIsCreateWarrantyOpen(false)}
        title="Register Fixture Warranty Item"
        description="Track manufacturer fixture warranties to automatically waive charges for claims within the warranty period."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateWarrantyItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit / Flat *
              </label>
              <input
                type="text"
                required
                value={wItemUnit}
                onChange={(e) => setWItemUnit(e.target.value)}
                placeholder="e.g. A-301"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={wItemCustomer}
                onChange={(e) => setWItemCustomer(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Item / Fixture Name *
              </label>
              <input
                type="text"
                required
                value={wItemName}
                onChange={(e) => setWItemName(e.target.value)}
                placeholder="e.g. Concealed Stop Cock"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={wItemCategory}
                onChange={(e) =>
                  setWItemCategory(e.target.value as WarrantyItemCategory)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Sanitary">Sanitary</option>
                <option value="Water Fittings">Water Fittings</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                required
                value={wItemBrand}
                onChange={(e) => setWItemBrand(e.target.value)}
                placeholder="e.g. Grohe, Havells, Cotto"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Location in Flat *
              </label>
              <input
                type="text"
                required
                value={wItemLocation}
                onChange={(e) => setWItemLocation(e.target.value)}
                placeholder="e.g. Master Bathroom, Kitchen"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={wItemQuantity}
                onChange={(e) => setWItemQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Warranty Start Date *
              </label>
              <input
                type="date"
                required
                value={wItemStart}
                onChange={(e) => setWItemStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Warranty End Date *
              </label>
              <input
                type="date"
                required
                value={wItemEnd}
                onChange={(e) => setWItemEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D4AFF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateWarrantyOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Registering..." : "Register Warranty Item"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
