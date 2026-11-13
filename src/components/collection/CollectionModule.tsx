"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CalendarDays,
  AlertCircle,
  Receipt,
  Percent,
  BarChart3,
  ShieldAlert,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";

import {
  PaymentScheduleItem,
  CustomerDueItem,
  CollectionEntry,
  WaiverItem,
  AdjustmentItem,
  RecoveryActionItem,
  FollowUpItem,
  FieldVisitItem,
} from "@/types/collection";

import {
  mockPaymentSchedules,
  mockCustomerDues,
  mockCollectionEntries,
  mockWaivers,
  mockAdjustments,
  mockOutstandingReceivables,
  mockAgingAnalysis,
  mockOverdueCollections,
  mockRecoveryActions,
  mockFollowUps,
  mockFieldVisits,
  mockOfficerMetrics,
  mockCollectionKPIs,
} from "@/data/collection/collection.mock";

import {
  createCollectionEntry,
  createWaiver,
  createAdjustment,
  createRecoveryAction,
  createFollowUp,
  createFieldVisit,
  assignOfficerToBookings,
} from "@/app/actions/collection.actions";

import { PaymentScheduleView } from "./PaymentScheduleView";
import { CustomerDueView } from "./CustomerDueView";
import { CollectionEntriesView } from "./CollectionEntriesView";
import { ReceiptDetailView } from "./ReceiptDetailView";
import { WaiversAdjustmentsView } from "./WaiversAdjustmentsView";
import { CollectionReportsView } from "./CollectionReportsView";
import { FieldRecoveryView } from "./FieldRecoveryView";
import { CollectionDashboardsView } from "./CollectionDashboardsView";

import { CreateCollectionEntryModal } from "./modals/CreateCollectionEntryModal";
import { CreateWaiverModal } from "./modals/CreateWaiverModal";
import { CreateAdjustmentModal } from "./modals/CreateAdjustmentModal";
import { CreateRecoveryModal } from "./modals/CreateRecoveryModal";
import { CreateFollowUpModal } from "./modals/CreateFollowUpModal";
import { CreateFieldVisitModal } from "./modals/CreateFieldVisitModal";
import { AssignOfficerModal } from "./modals/AssignOfficerModal";
import { toast } from "sonner";

export type CollectionTab =
  | "dashboard"
  | "schedule"
  | "due"
  | "entries"
  | "receipt"
  | "waivers"
  | "reports"
  | "recovery"
  | "perf";

interface Props {
  initialPath?: string;
}

export function CollectionModule({ initialPath = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Local state initialized with rich mock datasets
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>(mockPaymentSchedules);
  const [dues, setDues] = useState<CustomerDueItem[]>(mockCustomerDues);
  const [entries, setEntries] = useState<CollectionEntry[]>(mockCollectionEntries);
  const [waivers, setWaivers] = useState<WaiverItem[]>(mockWaivers);
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>(mockAdjustments);
  const [recoveries, setRecoveries] = useState<RecoveryActionItem[]>(mockRecoveryActions);
  const [followups, setFollowups] = useState<FollowUpItem[]>(mockFollowUps);
  const [visits, setVisits] = useState<FieldVisitItem[]>(mockFieldVisits);
  const [officers, setOfficers] = useState(mockOfficerMetrics);
  const [kpis, setKpis] = useState(mockCollectionKPIs);

  // Selected receipt for detail print view
  const [activeReceipt, setActiveReceipt] = useState<CollectionEntry | null>(entries[0] || null);

  // Modal dialog states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedSchedule, setPreselectedSchedule] = useState<PaymentScheduleItem | null>(null);

  // Resolve active tab from URL or path
  const resolveTabFromPath = (path: string): CollectionTab => {
    const clean = path.toLowerCase().replace(/^\/+|\/+$/g, "");
    if (clean === "schedule") return "schedule";
    if (clean === "due") return "due";
    if (clean === "entries" || clean.startsWith("entries/")) return "entries";
    if (clean.startsWith("receipts/")) return "receipt";
    if (clean === "waivers" || clean.startsWith("waivers/")) return "waivers";
    if (clean === "outstanding" || clean === "aging" || clean === "overdue" || clean === "reports") return "reports";
    if (clean === "recovery" || clean === "followups" || clean === "visits") return "recovery";
    if (clean === "perf") return "perf";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState<CollectionTab>(
    resolveTabFromPath(initialPath || pathname.replace(/.*\/collection\/?/, ""))
  );

  useEffect(() => {
    const sub = initialPath || pathname.replace(/.*\/collection\/?/, "");
    if (sub) {
      const tab = resolveTabFromPath(sub);
      setActiveTab(tab);
      // Auto open creation modals if URL has '/create'
      if (sub === "entries/create") setIsEntryModalOpen(true);
      if (sub === "waivers/create") setIsWaiverModalOpen(true);
      if (sub.startsWith("receipts/")) {
        const uuid = sub.replace("receipts/", "");
        const matched = entries.find((e) => e.receipt_no.toLowerCase() === uuid.toLowerCase() || e.id === uuid);
        if (matched) setActiveReceipt(matched);
      }
    }
  }, [initialPath, pathname, entries]);

  const handleTabChange = (tab: CollectionTab) => {
    setActiveTab(tab);
    const basePath = pathname?.startsWith("/dashboard") ? "/dashboard/collection" : "/collection";
    let target = basePath;
    switch (tab) {
      case "schedule":
        target = `${basePath}/schedule`;
        break;
      case "due":
        target = `${basePath}/due`;
        break;
      case "entries":
        target = `${basePath}/entries`;
        break;
      case "receipt":
        target = `${basePath}/receipts/${activeReceipt?.receipt_no || "REC-2026-0891"}`;
        break;
      case "waivers":
        target = `${basePath}/waivers`;
        break;
      case "reports":
        target = `${basePath}/outstanding`;
        break;
      case "recovery":
        target = `${basePath}/recovery`;
        break;
      case "perf":
        target = `${basePath}/perf`;
        break;
      default:
        target = `${basePath}/dashboard`;
        break;
    }
    router.push(target);
  };

  // Handlers for server action submissions with optimistic state
  const handleCreateEntry = async (data: any) => {
    const res = await createCollectionEntry(data);
    if (res.success && res.data) {
      setEntries((prev) => [res.data, ...prev]);
      setActiveReceipt(res.data);
      setKpis((prev) => ({
        ...prev,
        todayCollection: prev.todayCollection + res.data.amount,
        mtdCollection: prev.mtdCollection + res.data.amount,
      }));
      toast.success(`Payment recorded! Official Receipt ${res.data.receipt_no} generated.`);
    }
  };

  const handleCreateWaiver = async (data: any) => {
    const res = await createWaiver(data);
    if (res.success && res.data) {
      setWaivers((prev) => [res.data, ...prev]);
      toast.success(`Waiver request of ৳${res.data.amount.toLocaleString()} submitted for approval.`);
    }
  };

  const handleCreateAdjustment = async (data: any) => {
    const res = await createAdjustment(data);
    if (res.success && res.data) {
      setAdjustments((prev) => [res.data, ...prev]);
      toast.success(`Ledger adjustment applied successfully.`);
    }
  };

  const handleCreateRecovery = async (data: any) => {
    const res = await createRecoveryAction(data);
    if (res.success && res.data) {
      setRecoveries((prev) => [res.data, ...prev]);
      toast.success(`Recovery action logged successfully.`);
    }
  };

  const handleCreateFollowUp = async (data: any) => {
    const res = await createFollowUp(data);
    if (res.success && res.data) {
      setFollowups((prev) => [res.data, ...prev]);
      toast.success(`Customer follow-up scheduled.`);
    }
  };

  const handleCreateVisit = async (data: any) => {
    const res = await createFieldVisit(data);
    if (res.success && res.data) {
      setVisits((prev) => [res.data, ...prev]);
      toast.success(`Field recovery visit report recorded.`);
    }
  };

  const handleAssignOfficer = async (data: any) => {
    const res = await assignOfficerToBookings(
      data.booking_ids,
      data.officer_id,
      data.officer_name,
      data.target_amount,
      data.due_date
    );
    if (res.success) {
      toast.success(res.message);
    }
  };

  const handleGenerateReceiptFromSchedule = (sch: PaymentScheduleItem) => {
    setPreselectedSchedule(sch);
    setIsEntryModalOpen(true);
  };

  const handleViewReceiptFromList = (entry: CollectionEntry) => {
    setActiveReceipt(entry);
    setActiveTab("receipt");
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2.5 scrollbar-none">
        <button
          onClick={() => handleTabChange("dashboard")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "dashboard"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => handleTabChange("schedule")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "schedule"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Payment Schedules</span>
        </button>

        <button
          onClick={() => handleTabChange("due")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "due"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Customer Dues ({dues.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("entries")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "entries" || activeTab === "receipt"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="h-4 w-4 text-emerald-500" />
          <span>Collection Entries</span>
        </button>

        <button
          onClick={() => handleTabChange("waivers")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "waivers"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>Waivers & Adjustments</span>
        </button>

        <button
          onClick={() => handleTabChange("reports")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "reports"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Reports & Aging</span>
        </button>

        <button
          onClick={() => handleTabChange("recovery")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "recovery"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          <span>Field Recovery</span>
        </button>

        <button
          onClick={() => handleTabChange("perf")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "perf"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <span>Officer Performance</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === "dashboard" && (
        <CollectionDashboardsView
          kpis={kpis}
          officers={officers}
          overdueList={mockOverdueCollections}
          defaultView="dashboard"
        />
      )}

      {activeTab === "schedule" && (
        <PaymentScheduleView
          schedules={schedules}
          onGenerateReceipt={handleGenerateReceiptFromSchedule}
        />
      )}

      {activeTab === "due" && (
        <CustomerDueView
          dues={dues}
          onAssignOfficer={() => setIsAssignModalOpen(true)}
        />
      )}

      {activeTab === "entries" && (
        <CollectionEntriesView
          entries={entries}
          onOpenCreate={() => setIsEntryModalOpen(true)}
          onViewReceipt={handleViewReceiptFromList}
        />
      )}

      {activeTab === "receipt" && activeReceipt && (
        <ReceiptDetailView
          entry={activeReceipt}
          onBack={() => setActiveTab("entries")}
        />
      )}

      {activeTab === "waivers" && (
        <WaiversAdjustmentsView
          waivers={waivers}
          adjustments={adjustments}
          onOpenCreateWaiver={() => setIsWaiverModalOpen(true)}
          onOpenCreateAdjustment={() => setIsAdjustmentModalOpen(true)}
        />
      )}

      {activeTab === "reports" && (
        <CollectionReportsView
          receivables={mockOutstandingReceivables}
          agingRows={mockAgingAnalysis}
          overdueList={mockOverdueCollections}
        />
      )}

      {activeTab === "recovery" && (
        <FieldRecoveryView
          recoveries={recoveries}
          followups={followups}
          visits={visits}
          onOpenCreateRecovery={() => setIsRecoveryModalOpen(true)}
          onOpenCreateFollowUp={() => setIsFollowUpModalOpen(true)}
          onOpenCreateVisit={() => setIsVisitModalOpen(true)}
          onOpenAssignOfficer={() => setIsAssignModalOpen(true)}
        />
      )}

      {activeTab === "perf" && (
        <CollectionDashboardsView
          kpis={kpis}
          officers={officers}
          overdueList={mockOverdueCollections}
          defaultView="perf"
        />
      )}

      {/* Modals */}
      <CreateCollectionEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setPreselectedSchedule(null);
        }}
        onSubmit={handleCreateEntry}
        preselectedBookingId={
          preselectedSchedule ? mockPaymentSchedules.find((s) => s.id === preselectedSchedule.id)?.booking_code : undefined
        }
        preselectedInstallmentId={preselectedSchedule?.id}
      />

      <CreateWaiverModal
        isOpen={isWaiverModalOpen}
        onClose={() => setIsWaiverModalOpen(false)}
        onSubmit={handleCreateWaiver}
      />

      <CreateAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSubmit={handleCreateAdjustment}
      />

      <CreateRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onSubmit={handleCreateRecovery}
      />

      <CreateFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSubmit={handleCreateFollowUp}
      />

      <CreateFieldVisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSubmit={handleCreateVisit}
      />

      <AssignOfficerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleAssignOfficer}
      />
    </div>
  );
}
