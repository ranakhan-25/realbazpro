import LamsDashboard from "./LamsDashboard";
import {
  getAcquisitionLeads,
  getLandOwners,
  getLandValuations,
  getLegalVerifications,
  getDueDiligenceRecords,
  getNegotiationProcesses,
  getAcquisitionApprovals,
  getSettlements,
  getLegalDocuments,
  getFollowUps,
} from "@/app/actions/lams.actions";

export default async function LamsDashboardWrapper({ path = "" }: { path?: string }) {
  // Fetch all module data in parallel
  const [
    leadsRes,
    ownersRes,
    valuationsRes,
    legalRes,
    ddRes,
    negotiationsRes,
    approvalsRes,
    settlementsRes,
    documentsRes,
    followUpsRes,
  ] = await Promise.allSettled([
    getAcquisitionLeads(),
    getLandOwners(),
    getLandValuations(),
    getLegalVerifications(),
    getDueDiligenceRecords(),
    getNegotiationProcesses(),
    getAcquisitionApprovals(),
    getSettlements(),
    getLegalDocuments(),
    getFollowUps(),
  ]);

  const leads = leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value) ? leadsRes.value : [];
  const owners = ownersRes.status === "fulfilled" && Array.isArray(ownersRes.value) ? ownersRes.value : [];
  const valuations = valuationsRes.status === "fulfilled" && Array.isArray(valuationsRes.value) ? valuationsRes.value : [];
  const legalRecords = legalRes.status === "fulfilled" && Array.isArray(legalRes.value) ? legalRes.value : [];
  const dueDiligence = ddRes.status === "fulfilled" && Array.isArray(ddRes.value) ? ddRes.value : [];
  const negotiations = negotiationsRes.status === "fulfilled" && Array.isArray(negotiationsRes.value) ? negotiationsRes.value : [];
  const approvals = approvalsRes.status === "fulfilled" && Array.isArray(approvalsRes.value) ? approvalsRes.value : [];
  const settlements = settlementsRes.status === "fulfilled" && Array.isArray(settlementsRes.value) ? settlementsRes.value : [];
  const documents = documentsRes.status === "fulfilled" && Array.isArray(documentsRes.value) ? documentsRes.value : [];
  const followUps = followUpsRes.status === "fulfilled" && Array.isArray(followUpsRes.value) ? followUpsRes.value : [];

  return (
    <LamsDashboard
      path={path}
      initialLeads={leads}
      initialOwners={owners}
      initialValuations={valuations}
      initialLegalRecords={legalRecords}
      initialDueDiligence={dueDiligence}
      initialNegotiations={negotiations}
      initialApprovals={approvals}
      initialSettlements={settlements}
      initialDocuments={documents}
      initialFollowUps={followUps}
    />
  );
}
