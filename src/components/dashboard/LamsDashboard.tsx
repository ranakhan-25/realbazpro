"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LamsHeaderNav, LamsTab } from "@/components/lams/LamsHeaderNav";
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

const PATH_TO_TAB: Record<string, LamsTab> = {
  "": "leads",
  dashboard: "leads",
  leads: "leads",
  "acquisition-leads": "leads",
  owners: "owners",
  "land-owners": "owners",
  valuations: "valuations",
  "land-valuations": "valuations",
  legal: "legal",
  "legal-verification": "legal",
  "due-diligence": "duediligence",
  duediligence: "duediligence",
  negotiation: "negotiation",
  "negotiation-process": "negotiation",
  approvals: "approvals",
  "acquisition-approvals": "approvals",
  settlements: "settlements",
  documents: "documents",
  "legal-documents": "documents",
  reports: "reports",
  "follow-up": "followup",
  followup: "followup",
};

const TAB_TO_PATH: Record<LamsTab, string> = {
  leads: "acquisition-leads",
  owners: "land-owners",
  valuations: "valuations",
  legal: "legal-verification",
  duediligence: "due-diligence",
  negotiation: "negotiation-process",
  approvals: "approvals",
  settlements: "settlements",
  documents: "legal-documents",
  reports: "reports",
  followup: "follow-up",
};

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
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Resolve initial tab from route path
  const normalizedPath = path.toLowerCase().replace(/^\/+|\/+$/g, "");
  const initialTab = PATH_TO_TAB[normalizedPath] ?? "leads";
  const [activeTab, setActiveTab] = useState<LamsTab>(initialTab);
  const [showInsights, setShowInsights] = useState(true);

  // Sync state if path prop changes from route navigation
  useEffect(() => {
    if (normalizedPath && PATH_TO_TAB[normalizedPath]) {
      setActiveTab(PATH_TO_TAB[normalizedPath]);
    }
  }, [normalizedPath]);

  // When tab is clicked in header, sync URL if inside /dashboard/lams or /land
  const handleTabChange = (newTab: LamsTab) => {
    setActiveTab(newTab);
    const subPath = TAB_TO_PATH[newTab];
    if (pathname?.startsWith("/dashboard")) {
      router.push(`/dashboard/lams/${subPath}`);
    } else if (pathname?.startsWith("/land")) {
      router.push(`/land/${subPath}`);
    }
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
  const handleActionApproval = (id: string, action: "Approved" | "Rejected", comment?: string) => {
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
      await recordSettlementPayment(payment);
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
      {/* 1. Header Navigation Tabs with Module Counts */}
      <LamsHeaderNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showInsights={showInsights}
        onToggleInsights={() => setShowInsights((prev) => !prev)}
        counts={{
          leads: initialLeads.length,
          owners: initialOwners.length,
          valuations: initialValuations.length,
          legal: initialLegalRecords.length,
          duediligence: initialDueDiligence.length,
          negotiation: initialNegotiations.length,
          approvals: initialApprovals.length,
          settlements: initialSettlements.length,
          documents: initialDocuments.length,
          reports: initialLeads.length,
          followup: initialFollowUps.length,
        }}
      />

      {/* 2. Executive Metric Strip */}
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
            onAddValuation={handleAddValuation}
            onEditValuation={handleEditValuation}
            onDeleteValuation={handleDeleteValuation}
          />
        )}

        {/* Feature 02.05: Legal Title Verification */}
        {activeTab === "legal" && (
          <LegalVerificationView
            records={initialLegalRecords}
            acquisitionLeads={initialLeads}
            onAddRecord={handleAddLegal}
            onEditRecord={handleEditLegal}
            onDeleteRecord={handleDeleteLegal}
          />
        )}

        {/* Feature 02.06: Due Diligence Checklists */}
        {activeTab === "duediligence" && (
          <DueDiligenceView
            records={initialDueDiligence}
            acquisitionLeads={initialLeads}
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
