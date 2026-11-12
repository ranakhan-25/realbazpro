import type {
  AcquisitionApproval,
  AcquisitionLead,
  DueDiligenceRecord,
  FollowUpItem,
  LandOwner,
  LandValuation,
  LegalDocument,
  LegalVerification,
  LamsKpiMetric,
  MouzaDistributionStat,
  NegotiationRecord,
  PipelineStageStat,
  SettlementRecord,
} from "../../types/lams.ts";

export const mockKpiMetrics: LamsKpiMetric[] = [];
export const mockPipelineStages: PipelineStageStat[] = [];
export const mockMouzaDistribution: MouzaDistributionStat[] = [];
export const mockLandOwners: LandOwner[] = [];
export const mockAcquisitionLeads: AcquisitionLead[] = [];
export const mockLandValuations: LandValuation[] = [];
export const mockLegalVerifications: LegalVerification[] = [];
export const mockDueDiligence: DueDiligenceRecord[] = [];
export const mockNegotiations: NegotiationRecord[] = [];
export const mockAcquisitionApprovals: AcquisitionApproval[] = [];
export const mockSettlements: SettlementRecord[] = [];
export const mockLegalDocuments: LegalDocument[] = [];
export const mockFollowUps: FollowUpItem[] = [];
export const mockNegotiationRecords = mockNegotiations;
export const mockFollowUpItems = mockFollowUps;
