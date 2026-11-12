/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LamsTab } from "@/components/lams/LamsHeaderNav";
import { LamsMetrics } from "@/components/lams/LamsMetrics";
import { LandOwnersView } from "@/components/lams/LandOwnersView";
import { AcquisitionLeadsView } from "@/components/lams/AcquisitionLeadsView";
import { LandValuationsView } from "@/components/lams/LandValuationsView";
import { LegalVerificationView } from "@/components/lams/LegalVerificationView";
import { DueDiligenceView } from "@/components/lams/DueDiligenceView";
import { NegotiationProcessView } from "@/components/lams/NegotiationProcessView";
import { AcquisitionApprovalsView } from "@/components/lams/AcquisitionApprovalsView";
import { SettlementsView } from "@/components/lams/SettlementsView";
import { LegalDocumentsView } from "@/components/lams/LegalDocumentsView";
import { LamsReportsView } from "@/components/lams/LamsReportsView";
import { FollowUpView } from "@/components/lams/FollowUpView";

import {
  createLandOwner,
  deleteLandOwner,
  updateLandOwner,
  createAcquisitionLead,
  deleteAcquisitionLead,
  updateAcquisitionLead,
  createNegotiationProcess,
  deleteNegotiationProcess,
  updateNegotiationProcess,
  createLegalDocument,
  deleteLegalDocument,
  updateLegalDocument,
  createFollowUp,
  deleteFollowUp,
  updateFollowUp,
  createLandValuation,
  updateLandValuation,
  deleteLandValuation,
  createLegalVerification,
  updateLegalVerification,
  deleteLegalVerification,
  createDueDiligence,
  updateDueDiligence,
  deleteDueDiligence,
  createAcquisitionApproval,
  actionApproval,
  createSettlement,
  updateSettlement,
  recordSettlementPayment,
  advanceLeadWorkflowStage,
} from "@/app/actions/lams.actions";

import {
  LandOwner,
  AcquisitionLead,
  LandValuation,
  LegalVerification,
  DueDiligenceRecord,
  NegotiationRecord,
  AcquisitionApproval,
  SettlementRecord,
  LegalDocument,
  FollowUpItem,
} from "@/types/lams";
import {
  resolveLamsTab,
  parseLamsRoute,
  TAB_TO_PATH,
} from "@/lib/lamsRoutes";

interface LamsDashboardProps {
  path?: string;
  initialLeads: AcquisitionLead[];
  initialOwners: LandOwner[];
  initialValuations?: LandValuation[];
  initialLegalRecords?: LegalVerification[];
  initialDueDiligence?: DueDiligenceRecord[];
  initialNegotiations: NegotiationRecord[];
  initialApprovals?: AcquisitionApproval[];
  initialSettlements?: SettlementRecord[];
  initialDocuments: LegalDocument[];
  initialFollowUps: FollowUpItem[];
}

export default function LamsDashboard({
  path = "",
  initialLeads = [],
  initialOwners = [],
  initialValuations = [],
  initialLegalRecords = [],
  initialDueDiligence = [],
  initialNegotiations = [],
  initialApprovals = [],
  initialSettlements = [],
  initialDocuments = [],
  initialFollowUps = [],
}: LamsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Resolve initial tab from route path
  const initialTab = resolveLamsTab(path);
  const [activeTab, setActiveTab] = useState<LamsTab>(initialTab);
  const [showInsights, setShowInsights] = useState(true);

  // Sync state if path prop changes from route navigation
  useEffect(() => {
    setActiveTab(resolveLamsTab(path));
  }, [path]);

  // Sub-route deep linking params
  const parsedRoute = parseLamsRoute(path);
  const isLeadsTab = activeTab === "leads";
  const isLeadsCreateOpen = isLeadsTab && parsedRoute.isOpenCreate;
  const selectedLeadId = isLeadsTab ? parsedRoute.selectedLeadId : undefined;
  const initialDetailTab = isLeadsTab ? parsedRoute.initialDetailTab : undefined;

  const isOwnersCreateOpen = activeTab === "owners" && parsedRoute.isOpenCreate;
  const isValuationsCreateOpen = activeTab === "valuations" && parsedRoute.isOpenCreate;
  const isLegalCreateOpen = activeTab === "legal" && parsedRoute.isOpenCreate;
  const isDdCreateOpen = activeTab === "duediligence" && parsedRoute.isOpenCreate;
  const isNegotiationsCreateOpen = activeTab === "negotiation" && parsedRoute.isOpenCreate;
  const isSettlementsCreateOpen = activeTab === "settlements" && parsedRoute.isOpenCreate;

  // When tab changes, always push to /dashboard/lams sub-route
  const handleTabChange = (newTab: LamsTab) => {
    setActiveTab(newTab);
    const subPath = TAB_TO_PATH[newTab];
    router.push(`/dashboard/lams/${subPath}`);
  };

  // Handlers for Land Owners
  const handleAddOwner = (newOwner: any) => {
    startTransition(async () => {
      await createLandOwner(newOwner);
    });
  };
  const handleEditOwner = (uuid: string, updatedOwner: any) => {
    startTransition(async () => {
      await updateLandOwner(uuid, updatedOwner);
    });
  };
  const handleDeleteOwner = (uuid: string) => {
    startTransition(async () => {
      await deleteLandOwner(uuid);
    });
  };

  // Handlers for Acquisition Leads
  const handleAddLead = (newLead: any) => {
    startTransition(async () => {
      await createAcquisitionLead(newLead);
    });
  };
  const handleEditLead = (uuid: string, updatedLead: any) => {
    startTransition(async () => {
      await updateAcquisitionLead(uuid, updatedLead);
    });
  };
  const handleDeleteLead = (uuid: string) => {
    startTransition(async () => {
      await deleteAcquisitionLead(uuid);
    });
  };
  const handleQualifyLead = (uuid: string) => {
    startTransition(async () => {
      await updateAcquisitionLead(uuid, { status: "Qualified" });
    });
  };
  const handleRejectLead = (uuid: string, remarks: string) => {
    startTransition(async () => {
      await updateAcquisitionLead(uuid, { status: "Rejected", notes: remarks });
    });
  };
  const handleAdvanceStage = (uuid: string, nextStage: string, remarks: string) => {
    startTransition(async () => {
      await advanceLeadWorkflowStage(uuid, nextStage, remarks);
    });
  };

  // Handlers for Valuations
  const handleAddValuation = (val: any) => {
    startTransition(async () => {
      await createLandValuation(val);
    });
  };
  const handleEditValuation = (uuid: string, val: any) => {
    startTransition(async () => {
      await updateLandValuation(uuid, val);
    });
  };
  const handleDeleteValuation = (uuid: string) => {
    startTransition(async () => {
      await deleteLandValuation(uuid);
    });
  };

  // Handlers for Legal Verification
  const handleAddLegal = (rec: any) => {
    startTransition(async () => {
      await createLegalVerification(rec);
    });
  };
  const handleEditLegal = (uuid: string, rec: any) => {
    startTransition(async () => {
      await updateLegalVerification(uuid, rec);
    });
  };
  const handleDeleteLegal = (uuid: string) => {
    startTransition(async () => {
      await deleteLegalVerification(uuid);
    });
  };

  // Handlers for Due Diligence
  const handleAddDD = (rec: any) => {
    startTransition(async () => {
      await createDueDiligence(rec);
    });
  };
  const handleEditDD = (uuid: string, rec: any) => {
    startTransition(async () => {
      await updateDueDiligence(uuid, rec);
    });
  };
  const handleDeleteDD = (uuid: string) => {
    startTransition(async () => {
      await deleteDueDiligence(uuid);
    });
  };

  // Handlers for Negotiations
  const handleAddNegotiation = (newRecord: any) => {
    startTransition(async () => {
      await createNegotiationProcess(newRecord);
    });
  };
  const handleEditNegotiation = (uuid: string, updatedRecord: any) => {
    startTransition(async () => {
      await updateNegotiationProcess(uuid, updatedRecord);
    });
  };
  const handleDeleteNegotiation = (uuid: string) => {
    startTransition(async () => {
      await deleteNegotiationProcess(uuid);
    });
  };

  // Handlers for Approvals
  const handleAddApproval = (rec: any) => {
    startTransition(async () => {
      await createAcquisitionApproval(rec);
    });
  };
  const handleActionApproval = (id: string, action: "approved" | "rejected", comment?: string) => {
    startTransition(async () => {
      await actionApproval(id, action, comment);
    });
  };

  // Handlers for Settlements
  const handleAddSettlement = (data: any) => {
    startTransition(async () => {
      await createSettlement(data);
    });
  };
  const handleEditSettlement = (uuid: string, data: any) => {
    startTransition(async () => {
      await updateSettlement(uuid, data);
    });
  };
  const handleDeleteSettlement = (uuid: string) => {
    // Optimistic fallback
    startTransition(async () => {
      await updateSettlement(uuid, { status: "Cancelled" as any });
    });
  };
  const handleRecordPayment = (payment: any) => {
    startTransition(async () => {
      await recordSettlementPayment(payment.settlement_id, payment);
    });
  };

  // Handlers for Legal Documents
  const handleAddDocument = (newDoc: any) => {
    startTransition(async () => {
      await createLegalDocument(newDoc);
    });
  };
  const handleEditDocument = (uuid: string, updatedDoc: any) => {
    startTransition(async () => {
      await updateLegalDocument(uuid, updatedDoc);
    });
  };
  const handleDeleteDocument = (uuid: string) => {
    startTransition(async () => {
      await deleteLegalDocument(uuid);
    });
  };

  // Handlers for Follow Ups
  const handleAddFollowUp = (newItem: any) => {
    startTransition(async () => {
      await createFollowUp(newItem);
    });
  };
  const handleEditFollowUp = (uuid: string, updatedItem: any) => {
    startTransition(async () => {
      await updateFollowUp(uuid, updatedItem);
    });
  };
  const handleDeleteFollowUp = (uuid: string) => {
    startTransition(async () => {
      await deleteFollowUp(uuid);
    });
  };
  const handleToggleCompleteFollowUp = (uuid: string) => {
    const item = initialFollowUps.find((f) => f.uuid === uuid || (f as any).id === uuid);
    if (!item) return;
    const newStatus = item.status === "Completed" ? "Pending" : "Completed";
    startTransition(async () => {
      await updateFollowUp(uuid, { status: newStatus });
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Module 02 — LAMS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Land Acquisition &amp; Management System
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end land acquisition pipeline — leads, owners, valuations, legal, negotiations, settlements &amp; analytics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInsights((prev) => !prev)}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          {showInsights ? "Hide" : "Show"} Insights
        </button>
      </div>

      {/* Executive Metric Strip */}
      <LamsMetrics
        showInsights={showInsights}
        leads={initialLeads}
        owners={initialOwners}
        negotiations={initialNegotiations}
        documents={initialDocuments}
        followUps={initialFollowUps}
      />

      {/* 3. Modular Feature Views (Feature 02.01 through 02.12) */}
      <div className="animate-in fade-in duration-200">
        {/* Feature 02.01 & 02.03: Acquisition Leads & Mouza Mapping */}
        {activeTab === "leads" && (
          <AcquisitionLeadsView
            leads={initialLeads}
            landOwners={initialOwners}
            valuations={initialValuations}
            legalVerifications={initialLegalRecords}
            dueDiligenceRecords={initialDueDiligence}
            negotiations={initialNegotiations}
            approvals={initialApprovals}
            settlements={initialSettlements}
            documents={initialDocuments}
            initialOpenCreate={isLeadsCreateOpen}
            selectedLeadId={selectedLeadId}
            initialDetailTab={initialDetailTab}
            onAddLead={handleAddLead}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onQualifyLead={handleQualifyLead}
            onRejectLead={handleRejectLead}
            onAdvanceStage={handleAdvanceStage}
            onPaySettlement={handleRecordPayment}
          />
        )}

        {/* Feature 02.02: Landowners Directory */}
        {activeTab === "owners" && (
          <LandOwnersView
            owners={initialOwners}
            acquisitionLeads={initialLeads}
            initialOpenCreate={isOwnersCreateOpen}
            onAddOwner={handleAddOwner}
            onEditOwner={handleEditOwner}
            onDeleteOwner={handleDeleteOwner}
          />
        )}

        {/* Feature 02.04: Land Valuation */}
        {activeTab === "valuations" && (
          <LandValuationsView
            valuations={initialValuations}
            acquisitionLeads={initialLeads}
            initialOpenCreate={isValuationsCreateOpen}
            onAddValuation={handleAddValuation}
            onEditValuation={handleEditValuation}
            onDeleteValuation={handleDeleteValuation}
          />
        )}

        {/* Feature 02.05: Legal Title Verification */}
        {activeTab === "legal" && (
          <LegalVerificationView
            verifications={initialLegalRecords || []}
            acquisitionLeads={initialLeads}
            initialOpenCreate={isLegalCreateOpen}
            onAddVerification={handleAddLegal}
            onEditVerification={handleEditLegal}
            onDeleteVerification={handleDeleteLegal}
          />
        )}

        {/* Feature 02.06: Due Diligence Checklists */}
        {activeTab === "duediligence" && (
          <DueDiligenceView
            records={initialDueDiligence}
            acquisitionLeads={initialLeads}
            initialOpenCreate={isDdCreateOpen}
            onAddRecord={handleAddDD}
            onEditRecord={handleEditDD}
            onDeleteRecord={handleDeleteDD}
          />
        )}

        {/* Feature 02.07: Price Negotiations */}
        {activeTab === "negotiation" && (
          <NegotiationProcessView
            negotiations={initialNegotiations}
            acquisitionLeads={initialLeads}
            initialOpenCreate={isNegotiationsCreateOpen}
            onAddNegotiation={handleAddNegotiation}
            onEditNegotiation={handleEditNegotiation}
            onDeleteNegotiation={handleDeleteNegotiation}
          />
        )}

        {/* Feature 02.08 & 02.09: Acquisition Approvals */}
        {activeTab === "approvals" && (
          <AcquisitionApprovalsView
            approvals={initialApprovals}
            acquisitionLeads={initialLeads}
            onActionApproval={handleActionApproval}
            onAddApproval={handleAddApproval}
          />
        )}

        {/* Feature 02.10: Final Settlements & Agreements */}
        {activeTab === "settlements" && (
          <SettlementsView
            settlements={initialSettlements}
            acquisitionLeads={initialLeads}
            landOwners={initialOwners}
            initialOpenCreate={isSettlementsCreateOpen}
            onAddSettlement={handleAddSettlement}
            onEditSettlement={handleEditSettlement}
            onDeleteSettlement={handleDeleteSettlement}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {/* Feature 02.11: Legal Documents Repository */}
        {activeTab === "documents" && (
          <LegalDocumentsView
            documents={initialDocuments}
            acquisitionLeads={initialLeads}
            onAddDocument={handleAddDocument}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {/* Feature 02.12: Land Acquisition Analytics & Reports */}
        {activeTab === "reports" && (
          <LamsReportsView
            leads={initialLeads}
            owners={initialOwners}
            valuations={initialValuations}
            legalRecords={initialLegalRecords}
            dueDiligenceRecords={initialDueDiligence}
            settlements={initialSettlements}
          />
        )}

        {/* Follow-Up Schedule */}
        {activeTab === "followup" && (
          <FollowUpView
            followUps={initialFollowUps}
            acquisitionLeads={initialLeads}
            onAddFollowUp={handleAddFollowUp}
            onEditFollowUp={handleEditFollowUp}
            onDeleteFollowUp={handleDeleteFollowUp}
            onToggleComplete={handleToggleCompleteFollowUp}
          />
        )}
      </div>
    </div>
  );
}
