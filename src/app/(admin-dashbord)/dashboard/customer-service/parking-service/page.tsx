"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Car,
  Building,
  Key,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Tag,
  Shield,
  Search,
  Trash2,
  Edit2,
  DollarSign,
  User,
  Phone,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  FileText,
  AlertTriangle,
  LogOut,
  Calendar,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  getParkingSlots,
  createParkingSlot,
  updateParkingSlot,
  deleteParkingSlot,
  getParkingAssignments,
  createParkingAssignment,
  releaseParkingAssignment,
  getParkingExternalRentals,
  createParkingExternalRental,
  collectRentalPayment,
  terminateExternalRental,
  getParkingIncomeSummary,
  getParkingDropdownMeta,
  ParkingSlotItem,
  ParkingAssignmentItem,
  ParkingExternalRentalItem,
  ParkingIncomeSummary,
  ParkingDropdownMeta,
  ParkingSlotStatus,
  ParkingVehicleType,
} from "@/services/customerParkingService";

type MainTab = "slots" | "assignments" | "rentals" | "income";

export default function ParkingServicePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, isLoading: isProjectLoading } = useSelectedProject();

  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("slots");

  // Sub-filter tabs
  const [slotStatusFilter, setSlotStatusFilter] = useState<string>("all");
  const [slotFloorFilter, setSlotFloorFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [rentalFilter, setRentalFilter] = useState<string>("all");

  // View mode for slots (visual grid vs table)
  const [slotViewMode, setSlotViewMode] = useState<"grid" | "table">("grid");

  // Search queries
  const [slotSearch, setSlotSearch] = useState<string>("");
  const [assignmentSearch, setAssignmentSearch] = useState<string>("");
  const [rentalSearch, setRentalSearch] = useState<string>("");

  // Data states
  const [slots, setSlots] = useState<ParkingSlotItem[]>([]);
  const [assignments, setAssignments] = useState<ParkingAssignmentItem[]>([]);
  const [rentals, setRentals] = useState<ParkingExternalRentalItem[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<ParkingIncomeSummary | null>(null);
  const [dropdownMeta, setDropdownMeta] = useState<ParkingDropdownMeta>({
    vehicle_types: ["Car", "SUV", "Motorcycle", "Van / Micro", "Any"],
    slot_statuses: ["FREE", "OCCUPIED", "RENTED_EXTERNAL"],
    rental_payment_statuses: ["PAID", "PARTIAL", "DUE", "OVERDUE"],
    external_rental_statuses: ["ACTIVE", "TERMINATED", "EXPIRED"],
    floors_zones: [
      "Basement 1 (B1)",
      "Basement 2 (B2)",
      "Ground Floor (GF)",
      "1st Floor (1F)",
      "Outdoor Open Bay",
    ],
    free_slots: [],
  });

  // Loading states
  const [isSlotsLoading, setIsSlotsLoading] = useState<boolean>(false);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState<boolean>(false);
  const [isRentalsLoading, setIsRentalsLoading] = useState<boolean>(false);
  const [isIncomeLoading, setIsIncomeLoading] = useState<boolean>(false);

  // Pagination states
  const [slotPage, setSlotPage] = useState<number>(1);
  const [slotTotalPages, setSlotTotalPages] = useState<number>(1);
  const [assignmentPage, setAssignmentPage] = useState<number>(1);
  const [assignmentTotalPages, setAssignmentTotalPages] = useState<number>(1);
  const [rentalPage, setRentalPage] = useState<number>(1);
  const [rentalTotalPages, setRentalTotalPages] = useState<number>(1);

  // Modals state
  const [isAddSlotOpen, setIsAddSlotOpen] = useState<boolean>(false);
  const [isEditSlotOpen, setIsEditSlotOpen] = useState<boolean>(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<ParkingSlotItem | null>(null);
  const [isDeleteSlotOpen, setIsDeleteSlotOpen] = useState<boolean>(false);
  const [selectedSlotForDelete, setSelectedSlotForDelete] = useState<ParkingSlotItem | null>(null);

  const [isAssignSlotOpen, setIsAssignSlotOpen] = useState<boolean>(false);
  const [preselectedSlotId, setPreselectedSlotId] = useState<number | null>(null);
  const [isReleaseAssignmentOpen, setIsReleaseAssignmentOpen] = useState<boolean>(false);
  const [selectedAssignmentForRelease, setSelectedAssignmentForRelease] = useState<ParkingAssignmentItem | null>(null);

  const [isNewRentalOpen, setIsNewRentalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedRentalForPayment, setSelectedRentalForPayment] = useState<ParkingExternalRentalItem | null>(null);
  const [isTerminateRentalOpen, setIsTerminateRentalOpen] = useState<boolean>(false);
  const [selectedRentalForTerminate, setSelectedRentalForTerminate] = useState<ParkingExternalRentalItem | null>(null);

  // Slot Form State
  const [slotFormNumber, setSlotFormNumber] = useState("");
  const [slotFormFloor, setSlotFormFloor] = useState("Basement 1 (B1)");
  const [slotFormVehicleType, setSlotFormVehicleType] = useState<ParkingVehicleType>("Car");
  const [slotFormNotes, setSlotFormNotes] = useState("");

  // Assignment Form State
  const [assignFormSlotId, setAssignFormSlotId] = useState<number | "">("");
  const [assignFormFlat, setAssignFormFlat] = useState("");
  const [assignFormResident, setAssignFormResident] = useState("");
  const [assignFormPhone, setAssignFormPhone] = useState("");
  const [assignFormVehicleNo, setAssignFormVehicleNo] = useState("");
  const [assignFormVehicleType, setAssignFormVehicleType] = useState<ParkingVehicleType>("Car");
  const [assignFormRfid, setAssignFormRfid] = useState("");
  const [assignFormStartDate, setAssignFormStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [assignFormEndDate, setAssignFormEndDate] = useState("");

  // Release Form State
  const [releaseFormDate, setReleaseFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [releaseFormReason, setReleaseFormReason] = useState("");

  // External Rental Form State
  const [rentalFormSlotId, setRentalFormSlotId] = useState<number | "">("");
  const [rentalFormName, setRentalFormName] = useState("");
  const [rentalFormPhone, setRentalFormPhone] = useState("");
  const [rentalFormNid, setRentalFormNid] = useState("");
  const [rentalFormVehicleNo, setRentalFormVehicleNo] = useState("");
  const [rentalFormVehicleType, setRentalFormVehicleType] = useState<ParkingVehicleType>("Car");
  const [rentalFormMonthlyRent, setRentalFormMonthlyRent] = useState<number | "">(4000);
  const [rentalFormDeposit, setRentalFormDeposit] = useState<number | "">(8000);
  const [rentalFormStartDate, setRentalFormStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [rentalFormEndDate, setRentalFormEndDate] = useState("");
  const [rentalFormNotes, setRentalFormNotes] = useState("");

  // Payment Form State
  const [paymentFormAmount, setPaymentFormAmount] = useState<number | "">("");
  const [paymentFormDate, setPaymentFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentFormReference, setPaymentFormReference] = useState("");
  const [paymentFormNotes, setPaymentFormNotes] = useState("");

  // Terminate Rental Form State
  const [terminateFormDate, setTerminateFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [terminateFormNotes, setTerminateFormNotes] = useState("");

  // Submitting flags
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================================
  // LOADERS
  // =========================================================================

  const loadDropdownMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const meta = await getParkingDropdownMeta(projectId);
      setDropdownMeta(meta);
    } catch (err: any) {
      console.error("Failed to load parking dropdown metadata:", err);
    }
  }, [projectId]);

  const loadSlots = useCallback(async () => {
    if (!projectId) return;
    setIsSlotsLoading(true);
    try {
      const res = await getParkingSlots({
        project_id: projectId,
        status: slotStatusFilter !== "all" ? slotStatusFilter : undefined,
        floor_zone: slotFloorFilter !== "all" ? slotFloorFilter : undefined,
        search: slotSearch.trim() || undefined,
        page: slotPage,
        limit: 100, // Load full floor roster for visual grid
      });
      setSlots(res.items);
      setSlotTotalPages(res.meta.total_pages);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load parking slots");
    } finally {
      setIsSlotsLoading(false);
    }
  }, [projectId, slotStatusFilter, slotFloorFilter, slotSearch, slotPage]);

  const loadAssignments = useCallback(async () => {
    if (!projectId) return;
    setIsAssignmentsLoading(true);
    try {
      const res = await getParkingAssignments({
        project_id: projectId,
        is_active: assignmentFilter !== "all" ? assignmentFilter : undefined,
        search: assignmentSearch.trim() || undefined,
        page: assignmentPage,
        limit: 15,
      });
      setAssignments(res.items);
      setAssignmentTotalPages(res.meta.total_pages);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load parking assignments");
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [projectId, assignmentFilter, assignmentSearch, assignmentPage]);

  const loadRentals = useCallback(async () => {
    if (!projectId) return;
    setIsRentalsLoading(true);
    try {
      const res = await getParkingExternalRentals({
        project_id: projectId,
        payment_status: rentalFilter !== "all" ? rentalFilter : undefined,
        search: rentalSearch.trim() || undefined,
        page: rentalPage,
        limit: 15,
      });
      setRentals(res.items);
      setRentalTotalPages(res.meta.total_pages);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load external rentals");
    } finally {
      setIsRentalsLoading(false);
    }
  }, [projectId, rentalFilter, rentalSearch, rentalPage]);

  const loadIncomeSummary = useCallback(async () => {
    if (!projectId) return;
    setIsIncomeLoading(true);
    try {
      const summary = await getParkingIncomeSummary(projectId);
      setIncomeSummary(summary);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load income summary");
    } finally {
      setIsIncomeLoading(false);
    }
  }, [projectId]);

  // Initial and reactive data fetching
  useEffect(() => {
    if (projectId) {
      loadDropdownMeta();
      loadSlots();
      loadAssignments();
      loadRentals();
      loadIncomeSummary();
    }
  }, [projectId, loadDropdownMeta, loadSlots, loadAssignments, loadRentals, loadIncomeSummary]);

  // Trigger sub-filters
  useEffect(() => {
    if (projectId) loadSlots();
  }, [slotStatusFilter, slotFloorFilter, slotPage, loadSlots, projectId]);

  useEffect(() => {
    if (projectId) loadAssignments();
  }, [assignmentFilter, assignmentPage, loadAssignments, projectId]);

  useEffect(() => {
    if (projectId) loadRentals();
  }, [rentalFilter, rentalPage, loadRentals, projectId]);

  // Group slots by Floor / Zone for visual grid
  const slotsByFloor = useMemo(() => {
    const groups: Record<string, ParkingSlotItem[]> = {};
    for (const slot of slots) {
      const floor = slot.floor_zone || "Unspecified Zone";
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(slot);
    }
    return groups;
  }, [slots]);

  // =========================================================================
  // ACTIONS: SLOTS
  // =========================================================================

  const handleOpenAddSlot = () => {
    setSlotFormNumber("");
    setSlotFormFloor(dropdownMeta.floors_zones[0] || "Basement 1 (B1)");
    setSlotFormVehicleType("Car");
    setSlotFormNotes("");
    setIsAddSlotOpen(true);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!slotFormNumber.trim()) {
      toast.error("Please enter a slot number (e.g. B1-01)");
      return;
    }

    setIsSubmitting(true);
    try {
      await createParkingSlot({
        project_id: projectId,
        slot_number: slotFormNumber.trim(),
        floor_zone: slotFormFloor.trim(),
        allowed_vehicle_type: slotFormVehicleType,
        status: "FREE",
        notes: slotFormNotes.trim() || undefined,
      });
      toast.success(`Slot ${slotFormNumber} created successfully`);
      setIsAddSlotOpen(false);
      loadSlots();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditSlot = (slot: ParkingSlotItem) => {
    setSelectedSlotForEdit(slot);
    setSlotFormNumber(slot.slot_number);
    setSlotFormFloor(slot.floor_zone);
    setSlotFormVehicleType(slot.allowed_vehicle_type);
    setSlotFormNotes(slot.notes || "");
    setIsEditSlotOpen(true);
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForEdit) return;

    setIsSubmitting(true);
    try {
      await updateParkingSlot(selectedSlotForEdit.uuid, {
        slot_number: slotFormNumber.trim(),
        floor_zone: slotFormFloor.trim(),
        allowed_vehicle_type: slotFormVehicleType,
        notes: slotFormNotes.trim() || undefined,
      });
      toast.success(`Slot ${slotFormNumber} updated successfully`);
      setIsEditSlotOpen(false);
      setSelectedSlotForEdit(null);
      loadSlots();
      loadDropdownMeta();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteSlot = (slot: ParkingSlotItem) => {
    setSelectedSlotForDelete(slot);
    setIsDeleteSlotOpen(true);
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlotForDelete) return;
    setIsSubmitting(true);
    try {
      await deleteParkingSlot(selectedSlotForDelete.uuid);
      toast.success(`Slot ${selectedSlotForDelete.slot_number} deleted successfully`);
      setIsDeleteSlotOpen(false);
      setSelectedSlotForDelete(null);
      loadSlots();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // ACTIONS: ASSIGNMENTS (RESIDENT FLAT OWNERS)
  // =========================================================================

  const handleOpenAssignModal = (slotId?: number) => {
    setAssignFormSlotId(slotId || (dropdownMeta.free_slots[0]?.id ?? ""));
    setAssignFormFlat("");
    setAssignFormResident("");
    setAssignFormPhone("");
    setAssignFormVehicleNo("");
    setAssignFormVehicleType("Car");
    setAssignFormRfid("");
    setAssignFormStartDate(new Date().toISOString().slice(0, 10));
    setAssignFormEndDate("");
    setIsAssignSlotOpen(true);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!assignFormSlotId) {
      toast.error("Please select a parking slot");
      return;
    }
    if (!assignFormFlat.trim()) {
      toast.error("Please enter flat or unit number (e.g. Flat 7A)");
      return;
    }
    if (!assignFormResident.trim()) {
      toast.error("Please enter resident name");
      return;
    }
    if (!assignFormVehicleNo.trim()) {
      toast.error("Please enter vehicle plate number");
      return;
    }

    setIsSubmitting(true);
    try {
      await createParkingAssignment({
        project_id: projectId,
        slot_id: Number(assignFormSlotId),
        flat_number: assignFormFlat.trim(),
        resident_name: assignFormResident.trim(),
        resident_phone: assignFormPhone.trim() || undefined,
        vehicle_number: assignFormVehicleNo.trim(),
        vehicle_type: assignFormVehicleType,
        rfid_tag: assignFormRfid.trim() || undefined,
        start_date: assignFormStartDate,
        end_date: assignFormEndDate.trim() || undefined,
      });
      toast.success(`Slot assigned to ${assignFormResident} successfully!`);
      setIsAssignSlotOpen(false);
      loadSlots();
      loadAssignments();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReleaseModal = (assignment: ParkingAssignmentItem) => {
    setSelectedAssignmentForRelease(assignment);
    setReleaseFormDate(new Date().toISOString().slice(0, 10));
    setReleaseFormReason("");
    setIsReleaseAssignmentOpen(true);
  };

  const handleReleaseAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForRelease) return;

    setIsSubmitting(true);
    try {
      await releaseParkingAssignment(selectedAssignmentForRelease.uuid, {
        release_date: releaseFormDate,
        release_reason: releaseFormReason.trim() || undefined,
      });
      toast.success(
        `Slot ${selectedAssignmentForRelease.slot_number} released and restored to FREE status`,
      );
      setIsReleaseAssignmentOpen(false);
      setSelectedAssignmentForRelease(null);
      loadSlots();
      loadAssignments();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to release assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // ACTIONS: EXTERNAL RENTALS (OUTSIDER RENTALS FUNDING MAINTENANCE)
  // =========================================================================

  const handleOpenRentalModal = (slotId?: number) => {
    setRentalFormSlotId(slotId || (dropdownMeta.free_slots[0]?.id ?? ""));
    setRentalFormName("");
    setRentalFormPhone("");
    setRentalFormNid("");
    setRentalFormVehicleNo("");
    setRentalFormVehicleType("Car");
    setRentalFormMonthlyRent(4000);
    setRentalFormDeposit(8000);
    setRentalFormStartDate(new Date().toISOString().slice(0, 10));
    setRentalFormEndDate("");
    setRentalFormNotes("");
    setIsNewRentalOpen(true);
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!rentalFormSlotId) {
      toast.error("Please select a parking slot");
      return;
    }
    if (!rentalFormName.trim()) {
      toast.error("Please enter renter full name");
      return;
    }
    if (!rentalFormPhone.trim()) {
      toast.error("Please enter renter phone number");
      return;
    }
    if (!rentalFormVehicleNo.trim()) {
      toast.error("Please enter vehicle plate number");
      return;
    }
    if (!rentalFormMonthlyRent || Number(rentalFormMonthlyRent) <= 0) {
      toast.error("Please enter valid monthly rent amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await createParkingExternalRental({
        project_id: projectId,
        slot_id: Number(rentalFormSlotId),
        renter_name: rentalFormName.trim(),
        renter_phone: rentalFormPhone.trim(),
        renter_nid: rentalFormNid.trim() || undefined,
        vehicle_number: rentalFormVehicleNo.trim(),
        vehicle_type: rentalFormVehicleType,
        monthly_rent: Number(rentalFormMonthlyRent),
        deposit_amount: Number(rentalFormDeposit || 0),
        start_date: rentalFormStartDate,
        end_date: rentalFormEndDate.trim() || undefined,
        notes: rentalFormNotes.trim() || undefined,
      });
      toast.success(`Slot rented to ${rentalFormName} (Monthly Rent: ৳ ${Number(rentalFormMonthlyRent).toLocaleString()})`);
      setIsNewRentalOpen(false);
      loadSlots();
      loadRentals();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create external rental");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (rental: ParkingExternalRentalItem) => {
    setSelectedRentalForPayment(rental);
    setPaymentFormAmount(rental.balance_due > 0 ? rental.balance_due : rental.monthly_rent);
    setPaymentFormDate(new Date().toISOString().slice(0, 10));
    setPaymentFormReference("");
    setPaymentFormNotes("");
    setIsPaymentModalOpen(true);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentalForPayment) return;
    if (!paymentFormAmount || Number(paymentFormAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await collectRentalPayment(selectedRentalForPayment.uuid, {
        amount: Number(paymentFormAmount),
        payment_date: paymentFormDate,
        reference: paymentFormReference.trim() || undefined,
        notes: paymentFormNotes.trim() || undefined,
      });
      toast.success(
        `Payment of ৳ ${Number(paymentFormAmount).toLocaleString()} collected for ${selectedRentalForPayment.renter_name}`,
      );
      setIsPaymentModalOpen(false);
      setSelectedRentalForPayment(null);
      loadRentals();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTerminateRentalModal = (rental: ParkingExternalRentalItem) => {
    setSelectedRentalForTerminate(rental);
    setTerminateFormDate(new Date().toISOString().slice(0, 10));
    setTerminateFormNotes("");
    setIsTerminateRentalOpen(true);
  };

  const handleTerminateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentalForTerminate) return;

    setIsSubmitting(true);
    try {
      await terminateExternalRental(selectedRentalForTerminate.uuid, {
        end_date: terminateFormDate,
        notes: terminateFormNotes.trim() || undefined,
      });
      toast.success(
        `External rental for ${selectedRentalForTerminate.renter_name} terminated. Slot ${selectedRentalForTerminate.slot_number} restored to FREE.`,
      );
      setIsTerminateRentalOpen(false);
      setSelectedRentalForTerminate(null);
      loadSlots();
      loadRentals();
      loadDropdownMeta();
      loadIncomeSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to terminate rental");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // TABLE COLUMNS CONFIGURATIONS
  // =========================================================================

  // Slots Table Columns
  const slotColumns: Column<ParkingSlotItem>[] = [
    {
      header: "Slot Number",
      accessorKey: "slot_number",
      sortable: true,
      render: (slot) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              slot.status === "FREE"
                ? "bg-emerald-500"
                : slot.status === "OCCUPIED"
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
          />
          <span className="font-bold text-foreground text-sm tracking-wide">
            {slot.slot_number}
          </span>
        </div>
      ),
    },
    {
      header: "Floor / Zone",
      accessorKey: "floor_zone",
      sortable: true,
      render: (slot) => (
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-muted-foreground" />
          {slot.floor_zone}
        </span>
      ),
    },
    {
      header: "Vehicle Type",
      accessorKey: "allowed_vehicle_type",
      sortable: true,
      render: (slot) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium">
          <Car className="w-3 h-3" />
          {slot.allowed_vehicle_type}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      render: (slot) => {
        if (slot.status === "FREE") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Available (Free)
            </span>
          );
        }
        if (slot.status === "OCCUPIED") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              <User className="w-3 h-3" />
              Resident Occupied
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <DollarSign className="w-3 h-3" />
            Rented External
          </span>
        );
      },
    },
    {
      header: "Current Occupant / Vehicle",
      accessorKey: "current_occupant",
      render: (slot) => {
        const occ = slot.current_occupant;
        if (!occ) {
          return <span className="text-xs text-muted-foreground italic">None (Vacant)</span>;
        }
        if (occ.type === "RESIDENT") {
          return (
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">
                {occ.resident_name} • <span className="text-primary font-bold">{occ.flat_number}</span>
              </p>
              <p className="text-muted-foreground font-mono">
                {occ.vehicle_number} {occ.rfid_tag ? `• RFID: ${occ.rfid_tag}` : ""}
              </p>
            </div>
          );
        }
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span>{occ.renter_name}</span>
              <span className="bg-amber-100 dark:bg-amber-950/50 px-1 rounded text-[10px] font-bold">
                {occ.monthly_rent_formatted}/mo
              </span>
            </p>
            <p className="text-muted-foreground font-mono">
              {occ.vehicle_number} • {occ.renter_phone}
            </p>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "uuid",
      align: "right",
      render: (slot) => (
        <div className="flex items-center justify-end gap-1.5">
          {slot.status === "FREE" && (
            <>
              <button
                onClick={() => handleOpenAssignModal(slot.id)}
                className="px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                title="Assign to Flat Resident"
              >
                Assign
              </button>
              <button
                onClick={() => handleOpenRentalModal(slot.id)}
                className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                title="Rent to External Outsider"
              >
                Rent
              </button>
            </>
          )}
          <button
            onClick={() => handleOpenEditSlot(slot)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit Slot"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenDeleteSlot(slot)}
            disabled={slot.status !== "FREE"}
            className={`p-1 rounded transition-colors ${
              slot.status === "FREE"
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                : "text-muted-foreground/30 cursor-not-allowed"
            }`}
            title={slot.status === "FREE" ? "Delete Slot" : "Cannot delete occupied slot"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Assignments Table Columns
  const assignmentColumns: Column<ParkingAssignmentItem>[] = [
    {
      header: "Slot & Floor",
      accessorKey: "slot_number",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-foreground text-sm">{item.slot_number}</span>
          <p className="text-xs text-muted-foreground">{item.floor_zone}</p>
        </div>
      ),
    },
    {
      header: "Flat & Resident",
      accessorKey: "resident_name",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-foreground text-sm">{item.resident_name}</span>
          <p className="text-xs text-primary font-bold">{item.flat_number}</p>
          {item.resident_phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {item.resident_phone}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Vehicle & RFID",
      accessorKey: "vehicle_number",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-mono font-medium text-foreground">{item.vehicle_number}</p>
          <p className="text-muted-foreground">Type: {item.vehicle_type}</p>
          {item.rfid_tag && (
            <p className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
              <Tag className="w-3 h-3" />
              RFID: {item.rfid_tag}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Assignment Dates",
      accessorKey: "start_date",
      render: (item) => (
        <div className="text-xs space-y-0.5 text-muted-foreground">
          <p>Start: {item.start_date}</p>
          {item.end_date && <p>End: {item.end_date}</p>}
          {!item.is_active && item.release_date && (
            <p className="text-red-500 font-medium">Released: {item.release_date}</p>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      render: (item) => (
        item.is_active ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            <LogOut className="w-3 h-3" />
            Released
          </span>
        )
      ),
    },
    {
      header: "Actions",
      accessorKey: "uuid",
      align: "right",
      render: (item) => (
        item.is_active ? (
          <button
            onClick={() => handleOpenReleaseModal(item)}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            Release Slot
          </button>
        ) : (
          <span className="text-xs text-muted-foreground italic">No actions</span>
        )
      ),
    },
  ];

  // External Rentals Table Columns
  const rentalColumns: Column<ParkingExternalRentalItem>[] = [
    {
      header: "Slot & Floor",
      accessorKey: "slot_number",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-foreground text-sm">{item.slot_number}</span>
          <p className="text-xs text-muted-foreground">{item.floor_zone}</p>
        </div>
      ),
    },
    {
      header: "Renter Info",
      accessorKey: "renter_name",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-foreground text-sm">{item.renter_name}</span>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {item.renter_phone}
          </p>
          {item.renter_nid && (
            <p className="text-[11px] text-muted-foreground">NID: {item.renter_nid}</p>
          )}
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessorKey: "vehicle_number",
      render: (item) => (
        <div className="text-xs font-mono space-y-0.5">
          <p className="font-medium text-foreground">{item.vehicle_number}</p>
          <p className="text-muted-foreground text-[11px]">{item.vehicle_type}</p>
        </div>
      ),
    },
    {
      header: "Monthly Rent & Collected",
      accessorKey: "monthly_rent",
      sortable: true,
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-foreground">{item.monthly_rent_formatted} / mo</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Paid: {item.amount_collected_formatted}
          </p>
          {item.balance_due > 0 && (
            <p className="text-red-500 font-semibold">
              Due: {item.balance_due_formatted}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Payment Status",
      accessorKey: "payment_status",
      sortable: true,
      render: (item) => {
        if (item.payment_status === "PAID") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Paid
            </span>
          );
        }
        if (item.payment_status === "PARTIAL") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Partial
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" />
            Due
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "uuid",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status === "ACTIVE" && (
            <>
              <button
                onClick={() => handleOpenPaymentModal(item)}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                title="Collect Monthly Rent Payment"
              >
                <DollarSign className="w-3 h-3" />
                Collect Rent
              </button>
              <button
                onClick={() => handleOpenTerminateRentalModal(item)}
                className="px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition-colors"
                title="Terminate Rental & Release Slot"
              >
                Terminate
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // If no project selected from the global switcher
  if (!isProjectLoading && !projectId) {
    return (
      <div className="space-y-6">
        <CSPageHeader
          title="Parking & Slot Management"
          subtitle="Building Services • Slot Allocation, Outsider Rentals & Building Cost Funding"
          badge="Building Services"
          breadcrumbs={[
            { label: "Building Services" },
            { label: "Parking Service" },
          ]}
        />
        <CSSelectProjectEmptyState
          title="Select a Project to View Parking Service"
          description="Vehicle slot inventories, flat owner assignments, and outsider rental incomes are scoped per project. Select a project from the top bar to inspect slots."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <CSPageHeader
        title="Parking & Vehicle Access Management"
        subtitle={`Building Services • Tracking slots, resident vehicle allocations, and external rental revenue for ${project?.name || "Project"}`}
        badge="Building Services"
        breadcrumbs={[
          { label: "Building Services" },
          { label: "Parking Service" },
        ]}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadSlots();
              loadAssignments();
              loadRentals();
              loadIncomeSummary();
            }}
            className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Refresh all data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {activeMainTab === "slots" && (
            <button
              onClick={handleOpenAddSlot}
              className="px-3 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Parking Slot
            </button>
          )}
          {activeMainTab === "assignments" && (
            <button
              onClick={() => handleOpenAssignModal()}
              className="px-3 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Slot to Resident
            </button>
          )}
          {activeMainTab === "rentals" && (
            <button
              onClick={() => handleOpenRentalModal()}
              className="px-3 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              New External Rental
            </button>
          )}
        </div>
      </CSPageHeader>

      {/* Top Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CSStatCard
          title="Total Slots"
          value={incomeSummary ? `${incomeSummary.total_slots}` : `${slots.length}`}
          subtitle={`${incomeSummary?.occupancy_rate_percent || 0}% Occupancy Rate`}
          icon={Car}
          trend={{ value: `${incomeSummary?.occupied_slots || 0} Resident Occupied`, isPositive: true }}
        />
        <CSStatCard
          title="Available Slots"
          value={incomeSummary ? `${incomeSummary.free_slots}` : `${dropdownMeta.free_slots.length}`}
          subtitle="Vacant for Allocation / Rental"
          icon={CheckCircle2}
          trend={{ value: "Ready to Assign", isPositive: true }}
        />
        <CSStatCard
          title="Outsider Rentals"
          value={incomeSummary ? `${incomeSummary.active_external_rentals_count}` : `${rentals.length}`}
          subtitle="Rented to Non-Residents"
          icon={Shield}
          trend={{ value: "Funds Building Maintenance", isPositive: true }}
        />
        <CSStatCard
          title="Monthly Parking Income"
          value={incomeSummary?.total_rent_collected_formatted || "৳ 0"}
          subtitle={`Receivable: ${incomeSummary?.monthly_rent_receivable_formatted || "৳ 0"}`}
          icon={DollarSign}
          trend={{
            value: `${incomeSummary?.collection_rate_percent || 0}% Collected`,
            isPositive: (incomeSummary?.collection_rate_percent || 0) >= 70,
          }}
        />
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveMainTab("slots")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "slots"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car className="w-4 h-4" />
            Parking Slots Master
            <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-muted font-bold">
              {slots.length}
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab("assignments")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "assignments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Key className="w-4 h-4" />
            Resident Flat Allocations
            <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-muted font-bold">
              {assignments.filter((a) => a.is_active).length}
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab("rentals")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "rentals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            External Outsider Rentals
            <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              {rentals.filter((r) => r.status === "ACTIVE").length}
            </span>
          </button>
          <button
            onClick={() => setActiveMainTab("income")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "income"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Monthly Income Summary
          </button>
        </nav>
      </div>

      {/* TAB 1: PARKING SLOTS MASTER */}
      {activeMainTab === "slots" && (
        <div className="space-y-4">
          {/* Sub Filters & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CSFilterTabs
                tabs={[
                  { key: "all", label: "All Slots", count: slots.length },
                  {
                    key: "FREE",
                    label: "Available (Free)",
                    count: slots.filter((s) => s.status === "FREE").length,
                  },
                  {
                    key: "OCCUPIED",
                    label: "Resident Occupied",
                    count: slots.filter((s) => s.status === "OCCUPIED").length,
                  },
                  {
                    key: "RENTED_EXTERNAL",
                    label: "Rented External",
                    count: slots.filter((s) => s.status === "RENTED_EXTERNAL").length,
                  },
                ]}
                activeTab={slotStatusFilter}
                onChange={setSlotStatusFilter}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Floor Filter */}
              <select
                value={slotFloorFilter}
                onChange={(e) => setSlotFloorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground"
              >
                <option value="all">All Floors / Zones</option>
                {dropdownMeta.floors_zones.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
                <button
                  onClick={() => setSlotViewMode("grid")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                    slotViewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Visual Parking Bay Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setSlotViewMode("table")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                    slotViewMode === "table"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Data Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* VISUAL PARKING BAY GRID VIEW */}
          {slotViewMode === "grid" && (
            <div className="space-y-6">
              {Object.keys(slotsByFloor).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
                  <Car className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No parking slots found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Add Parking Slot" to provision parking bays for this project.
                  </p>
                </div>
              ) : (
                Object.entries(slotsByFloor).map(([floor, floorSlots]) => (
                  <div key={floor} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-sm text-foreground">{floor}</h3>
                        <span className="text-xs text-muted-foreground">
                          ({floorSlots.length} bays • {floorSlots.filter((s) => s.status === "FREE").length} vacant)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Resident
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> External Rent
                        </span>
                      </div>
                    </div>

                    {/* Parking Bays Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {floorSlots.map((slot) => {
                        const isFree = slot.status === "FREE";
                        const isResident = slot.status === "OCCUPIED";
                        const isRent = slot.status === "RENTED_EXTERNAL";

                        return (
                          <div
                            key={slot.uuid}
                            className={`rounded-lg border-2 p-3 transition-all relative flex flex-col justify-between h-36 ${
                              isFree
                                ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500"
                                : isResident
                                ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-500"
                                : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500"
                            }`}
                          >
                            {/* Top row: slot number & badge */}
                            <div className="flex items-start justify-between">
                              <span className="font-black text-sm tracking-wide text-foreground">
                                {slot.slot_number}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                  isFree
                                    ? "bg-emerald-500 text-white"
                                    : isResident
                                    ? "bg-blue-600 text-white"
                                    : "bg-amber-600 text-white"
                                }`}
                              >
                                {isFree ? "Free" : isResident ? "Owner" : "Rent"}
                              </span>
                            </div>

                            {/* Middle details: occupant / vehicle */}
                            <div className="my-1">
                              {isFree && (
                                <div className="text-center py-2 text-emerald-600 dark:text-emerald-400">
                                  <Car className="w-6 h-6 mx-auto opacity-40 mb-1" />
                                  <span className="text-[11px] font-medium">Available</span>
                                </div>
                              )}
                              {isResident && slot.current_occupant && (
                                <div className="text-xs space-y-0.5">
                                  <p className="font-bold text-foreground truncate">
                                    {slot.current_occupant.flat_number}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {slot.current_occupant.resident_name}
                                  </p>
                                  <p className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 truncate">
                                    {slot.current_occupant.vehicle_number}
                                  </p>
                                </div>
                              )}
                              {isRent && slot.current_occupant && (
                                <div className="text-xs space-y-0.5">
                                  <p className="font-bold text-amber-700 dark:text-amber-300 truncate">
                                    {slot.current_occupant.renter_name}
                                  </p>
                                  <p className="text-[11px] font-semibold text-foreground">
                                    {slot.current_occupant.monthly_rent_formatted}
                                  </p>
                                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                                    {slot.current_occupant.vehicle_number}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Bottom quick actions */}
                            <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-[11px]">
                              {isFree ? (
                                <div className="flex items-center gap-1 w-full justify-between">
                                  <button
                                    onClick={() => handleOpenAssignModal(slot.id)}
                                    className="text-blue-600 hover:underline font-semibold"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    onClick={() => handleOpenRentalModal(slot.id)}
                                    className="text-amber-600 hover:underline font-semibold"
                                  >
                                    Rent
                                  </button>
                                </div>
                              ) : isResident && slot.current_occupant?.assignment_uuid ? (
                                <button
                                  onClick={() => {
                                    const a = assignments.find(
                                      (item) => item.uuid === slot.current_occupant?.assignment_uuid,
                                    );
                                    if (a) handleOpenReleaseModal(a);
                                    else handleOpenReleaseModal({
                                      id: slot.current_occupant!.assignment_id!,
                                      uuid: slot.current_occupant!.assignment_uuid!,
                                      project_id: projectId!,
                                      slot_id: slot.id,
                                      slot_number: slot.slot_number,
                                      floor_zone: slot.floor_zone,
                                      flat_number: slot.current_occupant!.flat_number!,
                                      resident_name: slot.current_occupant!.resident_name!,
                                      vehicle_number: slot.current_occupant!.vehicle_number,
                                      vehicle_type: "Car",
                                      start_date: slot.current_occupant!.start_date,
                                      is_active: true,
                                    });
                                  }}
                                  className="text-red-500 hover:underline font-semibold flex items-center gap-0.5"
                                >
                                  <LogOut className="w-3 h-3" /> Release
                                </button>
                              ) : isRent && slot.current_occupant?.rental_uuid ? (
                                <button
                                  onClick={() => {
                                    const r = rentals.find(
                                      (item) => item.uuid === slot.current_occupant?.rental_uuid,
                                    );
                                    if (r) handleOpenPaymentModal(r);
                                  }}
                                  className="text-emerald-600 hover:underline font-semibold flex items-center gap-0.5"
                                >
                                  <DollarSign className="w-3 h-3" /> Collect
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleOpenEditSlot(slot)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TABLE VIEW */}
          {slotViewMode === "table" && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <CSTable
                columns={slotColumns}
                data={slots}
                searchPlaceholder="Search slots by number, zone, notes..."
                searchFields={["slot_number", "floor_zone", "notes"]}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESIDENT FLAT ALLOCATIONS */}
      {activeMainTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Records", count: assignments.length },
                {
                  key: "true",
                  label: "Active Allocations",
                  count: assignments.filter((a) => a.is_active).length,
                },
                {
                  key: "false",
                  label: "Released / Past",
                  count: assignments.filter((a) => !a.is_active).length,
                },
              ]}
              activeTab={assignmentFilter}
              onChange={setAssignmentFilter}
            />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <CSTable
              columns={assignmentColumns}
              data={assignments}
              searchPlaceholder="Search by resident, flat, vehicle, RFID..."
              searchFields={["resident_name", "flat_number", "vehicle_number", "rfid_tag", "slot_number"]}
            />
          </div>
        </div>
      )}

      {/* TAB 3: EXTERNAL OUTSIDER RENTALS */}
      {activeMainTab === "rentals" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Rentals", count: rentals.length },
                {
                  key: "DUE",
                  label: "Payment Due",
                  count: rentals.filter((r) => r.payment_status === "DUE" && r.status === "ACTIVE").length,
                },
                {
                  key: "PARTIAL",
                  label: "Partial Paid",
                  count: rentals.filter((r) => r.payment_status === "PARTIAL").length,
                },
                {
                  key: "PAID",
                  label: "Fully Paid",
                  count: rentals.filter((r) => r.payment_status === "PAID").length,
                },
              ]}
              activeTab={rentalFilter}
              onChange={setRentalFilter}
            />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <CSTable
              columns={rentalColumns}
              data={rentals}
              searchPlaceholder="Search by renter name, phone, vehicle plate..."
              searchFields={["renter_name", "renter_phone", "vehicle_number", "slot_number"]}
            />
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY INCOME SUMMARY (FEEDS SERVICE CHARGE INCOME) */}
      {activeMainTab === "income" && (
        <div className="space-y-6">
          {/* Information & Strategic Guidance Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border border-primary/20 flex items-start gap-3">
            <Receipt className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-foreground text-sm">
                Parking Maintenance Revenue Feed (Service Charge Integration)
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Rent collected from external vehicles directly finances building common operations
                (such as security guard agency bills, common area electricity, and utility pump maintenance).
                This revenue is aggregated here and streams automatically into the monthly Service Charge ledger.
              </p>
            </div>
          </div>

          {/* Income KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium">Monthly Rent Receivable</span>
              <p className="text-xl font-bold text-foreground mt-1">
                {incomeSummary?.monthly_rent_receivable_formatted || "৳ 0"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                From {incomeSummary?.active_external_rentals_count || 0} active external contracts
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium">Rent Collected This Month</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {incomeSummary?.total_rent_collected_formatted || "৳ 0"}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                {incomeSummary?.collection_rate_percent || 0}% collection efficiency
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium">Outstanding Rent Balance</span>
              <p className="text-xl font-bold text-red-500 mt-1">
                {incomeSummary?.total_rent_due_formatted || "৳ 0"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Remaining due from renters
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium">Commercial Occupancy</span>
              <p className="text-xl font-bold text-foreground mt-1">
                {incomeSummary?.rented_external_slots || 0} of {incomeSummary?.total_slots || 0} Slots
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Utilizing surplus building capacity
              </p>
            </div>
          </div>

          {/* Collection Progress Bar */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Monthly Rent Collection Progress</span>
              <span className="text-primary font-bold">
                {incomeSummary?.collection_rate_percent || 0}% Completed
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, incomeSummary?.collection_rate_percent || 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Collected: {incomeSummary?.total_rent_collected_formatted || "৳ 0"}</span>
              <span>Total Target: {incomeSummary?.monthly_rent_receivable_formatted || "৳ 0"}</span>
            </div>
          </div>

          {/* Detailed Active Renters Income Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h4 className="font-bold text-sm text-foreground">
                Active External Renters & Collections
              </h4>
              <button
                onClick={() => handleOpenRentalModal()}
                className="px-2.5 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1"
                style={{ backgroundColor: brand }}
              >
                <Plus className="w-3.5 h-3.5" />
                Rent Another Slot
              </button>
            </div>
            <CSTable
              columns={rentalColumns}
              data={incomeSummary?.rentals_breakdown || rentals}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD PARKING SLOT */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Add New Parking Slot"
        description="Provision a dedicated parking bay for this project."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Slot Identifier / Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slotFormNumber}
              onChange={(e) => setSlotFormNumber(e.target.value)}
              placeholder="e.g. B1-01, B2-14, G-05"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Must be unique within this project.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Floor / Zone</label>
              <select
                value={slotFormFloor}
                onChange={(e) => setSlotFormFloor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.floors_zones.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Allowed Vehicle Type</label>
              <select
                value={slotFormVehicleType}
                onChange={(e) => setSlotFormVehicleType(e.target.value as ParkingVehicleType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.vehicle_types.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Notes / Dimensions</label>
            <textarea
              rows={2}
              value={slotFormNotes}
              onChange={(e) => setSlotFormNotes(e.target.value)}
              placeholder="e.g. Standard 8x18 ft bay, adjacent to pillar 4"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddSlotOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Creating..." : "Create Slot"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: EDIT PARKING SLOT */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isEditSlotOpen}
        onClose={() => setIsEditSlotOpen(false)}
        title="Edit Parking Slot"
        description={`Modify configuration for slot ${selectedSlotForEdit?.slot_number}.`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateSlot} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">Slot Number</label>
            <input
              type="text"
              required
              value={slotFormNumber}
              onChange={(e) => setSlotFormNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Floor / Zone</label>
              <select
                value={slotFormFloor}
                onChange={(e) => setSlotFormFloor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.floors_zones.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Allowed Vehicle Type</label>
              <select
                value={slotFormVehicleType}
                onChange={(e) => setSlotFormVehicleType(e.target.value as ParkingVehicleType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.vehicle_types.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Notes</label>
            <textarea
              rows={2}
              value={slotFormNotes}
              onChange={(e) => setSlotFormNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditSlotOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: DELETE PARKING SLOT CONFIRMATION */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isDeleteSlotOpen}
        onClose={() => setIsDeleteSlotOpen(false)}
        title="Delete Parking Slot"
        description={`Are you sure you want to delete slot ${selectedSlotForDelete?.slot_number}?`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            This action will soft-delete the slot record. Occupied or rented slots cannot be deleted.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsDeleteSlotOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSlot}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Deleting..." : "Delete Slot"}
            </button>
          </div>
        </div>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: ASSIGN SLOT TO RESIDENT FLAT OWNER (BLOCKS DOUBLE ASSIGNMENT) */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isAssignSlotOpen}
        onClose={() => setIsAssignSlotOpen(false)}
        title="Assign Parking Slot to Resident"
        description="Allocate an available slot to a flat owner. Double assignment is strictly blocked."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Select Available Slot <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={assignFormSlotId}
                onChange={(e) => setAssignFormSlotId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">-- Choose Free Slot --</option>
                {dropdownMeta.free_slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_number} ({s.floor_zone} • {s.allowed_vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Flat / Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assignFormFlat}
                onChange={(e) => setAssignFormFlat(e.target.value)}
                placeholder="e.g. Flat 7-A, Apt 12-B"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Resident Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assignFormResident}
                onChange={(e) => setAssignFormResident(e.target.value)}
                placeholder="e.g. Engr. Tanvir Ahmed"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Resident Phone</label>
              <input
                type="text"
                value={assignFormPhone}
                onChange={(e) => setAssignFormPhone(e.target.value)}
                placeholder="+88017XXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Vehicle Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assignFormVehicleNo}
                onChange={(e) => setAssignFormVehicleNo(e.target.value)}
                placeholder="e.g. Dhaka Metro GA-33-4102"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Vehicle Type</label>
              <select
                value={assignFormVehicleType}
                onChange={(e) => setAssignFormVehicleType(e.target.value as ParkingVehicleType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.vehicle_types.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Barrier RFID Tag</label>
              <input
                type="text"
                value={assignFormRfid}
                onChange={(e) => setAssignFormRfid(e.target.value)}
                placeholder="e.g. RFID-8812-04"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={assignFormStartDate}
                onChange={(e) => setAssignFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={assignFormEndDate}
                onChange={(e) => setAssignFormEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAssignSlotOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Allocating..." : "Confirm Allocation"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: RELEASE ASSIGNMENT */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isReleaseAssignmentOpen}
        onClose={() => setIsReleaseAssignmentOpen(false)}
        title="Release Parking Slot"
        description={`Release slot ${selectedAssignmentForRelease?.slot_number} from ${selectedAssignmentForRelease?.resident_name}.`}
        maxWidth="md"
      >
        <form onSubmit={handleReleaseAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">Release Date</label>
            <input
              type="date"
              required
              value={releaseFormDate}
              onChange={(e) => setReleaseFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Release Reason</label>
            <textarea
              rows={2}
              value={releaseFormReason}
              onChange={(e) => setReleaseFormReason(e.target.value)}
              placeholder="e.g. Resident sold flat, changed parking slot, or sold vehicle"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            Releasing this assignment will return slot {selectedAssignmentForRelease?.slot_number} to
            FREE status, making it instantly available for other residents or external rental.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsReleaseAssignmentOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Releasing..." : "Release Slot"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: NEW EXTERNAL RENTAL (OUTSIDER RENTAL FUNDING BUILDING COSTS) */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isNewRentalOpen}
        onClose={() => setIsNewRentalOpen(false)}
        title="Rent Parking Slot to Outsider"
        description="Lease vacant parking space to external vehicle owners to fund building maintenance costs."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRental} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Select Available Slot <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={rentalFormSlotId}
                onChange={(e) => setRentalFormSlotId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">-- Choose Free Slot --</option>
                {dropdownMeta.free_slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_number} ({s.floor_zone} • {s.allowed_vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Renter Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rentalFormName}
                onChange={(e) => setRentalFormName(e.target.value)}
                placeholder="e.g. Dr. Shahabuddin / Bank Security Van"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rentalFormPhone}
                onChange={(e) => setRentalFormPhone(e.target.value)}
                placeholder="+88017XXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">National ID / Passport</label>
              <input
                type="text"
                value={rentalFormNid}
                onChange={(e) => setRentalFormNid(e.target.value)}
                placeholder="NID number"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Vehicle Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rentalFormVehicleNo}
                onChange={(e) => setRentalFormVehicleNo(e.target.value)}
                placeholder="e.g. Dhaka Metro KHA-88-1200"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Vehicle Type</label>
              <select
                value={rentalFormVehicleType}
                onChange={(e) => setRentalFormVehicleType(e.target.value as ParkingVehicleType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {dropdownMeta.vehicle_types.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Monthly Rent (BDT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={rentalFormMonthlyRent}
                onChange={(e) => setRentalFormMonthlyRent(Number(e.target.value))}
                placeholder="e.g. 4500"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Security Deposit (BDT)</label>
              <input
                type="number"
                min="0"
                value={rentalFormDeposit}
                onChange={(e) => setRentalFormDeposit(Number(e.target.value))}
                placeholder="e.g. 9000"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Rental Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={rentalFormStartDate}
                onChange={(e) => setRentalFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Agreement End Date</label>
              <input
                type="date"
                value={rentalFormEndDate}
                onChange={(e) => setRentalFormEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={rentalFormNotes}
              onChange={(e) => setRentalFormNotes(e.target.value)}
              placeholder="e.g. Allowed between 8am and 8pm; 1-month advance paid"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewRentalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? "Creating..." : "Confirm Rental Agreement"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: COLLECT RENTAL PAYMENT */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Collect Rental Payment"
        description={`Record rent collection from ${selectedRentalForPayment?.renter_name} (Slot ${selectedRentalForPayment?.slot_number}).`}
        maxWidth="md"
      >
        <form onSubmit={handleCollectPayment} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-bold text-foreground">
                {selectedRentalForPayment?.monthly_rent_formatted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previously Paid:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {selectedRentalForPayment?.amount_collected_formatted}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-1">
              <span className="text-muted-foreground font-semibold">Remaining Due:</span>
              <span className="font-bold text-red-500">
                {selectedRentalForPayment?.balance_due_formatted}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Collection Amount (BDT) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={paymentFormAmount}
              onChange={(e) => setPaymentFormAmount(Number(e.target.value))}
              placeholder="e.g. 4500"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentFormDate}
                onChange={(e) => setPaymentFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Receipt / Ref #</label>
              <input
                type="text"
                value={paymentFormReference}
                onChange={(e) => setPaymentFormReference(e.target.value)}
                placeholder="e.g. MR-2026-091"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Notes</label>
            <input
              type="text"
              value={paymentFormNotes}
              onChange={(e) => setPaymentFormNotes(e.target.value)}
              placeholder="e.g. Paid via bKash / Bank transfer"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ===================================================================== */}
      {/* MODAL: TERMINATE EXTERNAL RENTAL */}
      {/* ===================================================================== */}
      <CSModal
        isOpen={isTerminateRentalOpen}
        onClose={() => setIsTerminateRentalOpen(false)}
        title="Terminate External Rental"
        description={`Terminate lease for ${selectedRentalForTerminate?.renter_name} on slot ${selectedRentalForTerminate?.slot_number}.`}
        maxWidth="md"
      >
        <form onSubmit={handleTerminateRental} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">Termination Date</label>
            <input
              type="date"
              required
              value={terminateFormDate}
              onChange={(e) => setTerminateFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Reason / Handover Notes</label>
            <textarea
              rows={2}
              value={terminateFormNotes}
              onChange={(e) => setTerminateFormNotes(e.target.value)}
              placeholder="e.g. Contract completed, security deposit refunded"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            Terminating this rental agreement will restore slot {selectedRentalForTerminate?.slot_number} to
            FREE status and mark the contract as TERMINATED.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsTerminateRentalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Terminating..." : "Terminate & Free Slot"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
