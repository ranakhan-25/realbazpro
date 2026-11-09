export type LamsTab =
  | "leads"
  | "owners"
  | "valuations"
  | "legal"
  | "duediligence"
  | "negotiation"
  | "approvals"
  | "settlements"
  | "documents"
  | "reports"
  | "followup";

export const LAMS_BASE_PATH = "/land";

export const PATH_TO_TAB: Record<string, LamsTab> = {
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
  negotiations: "negotiation",
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

export const TAB_TO_PATH: Record<LamsTab, string> = {
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

export function resolveLamsTab(path: string): LamsTab {
  const clean = path.toLowerCase().replace(/^\/+|\/+$/g, "");
  if (PATH_TO_TAB[clean]) return PATH_TO_TAB[clean];
  const first = clean.split("/")[0];
  if (PATH_TO_TAB[first]) return PATH_TO_TAB[first];
  return "leads";
}

export function parseLamsRoute(path: string) {
  const rawSegments = path ? path.replace(/^\/+|\/+$/g, "").split("/") : [];
  const primarySeg = (rawSegments[0] || "").toLowerCase();
  const secondarySeg = rawSegments[1] || "";
  const tertiarySeg = (rawSegments[2] || "").toLowerCase();

  const tab = resolveLamsTab(primarySeg);

  const isCreateAction = secondarySeg.toLowerCase() === "create";
  const selectedLeadId =
    tab === "leads" && secondarySeg && !isCreateAction ? secondarySeg : undefined;

  let initialDetailTab: string | undefined = undefined;
  if (selectedLeadId && tertiarySeg) {
    if (tertiarySeg === "workflow") initialDetailTab = "Workflow";
    else if (tertiarySeg === "info") initialDetailTab = "Info";
    else if (tertiarySeg === "docs" || tertiarySeg === "documents") initialDetailTab = "Documents";
    else if (tertiarySeg === "valuations") initialDetailTab = "Valuations";
    else if (tertiarySeg === "legal") initialDetailTab = "Legal";
    else if (tertiarySeg === "due-diligence" || tertiarySeg === "duediligence")
      initialDetailTab = "Due Diligence";
    else if (tertiarySeg === "negotiations" || tertiarySeg === "negotiation")
      initialDetailTab = "Negotiations";
    else if (tertiarySeg === "approvals") initialDetailTab = "Approvals";
    else if (tertiarySeg === "settlements") initialDetailTab = "Settlements";
  }

  return {
    tab,
    isOpenCreate: isCreateAction,
    selectedLeadId,
    initialDetailTab,
  };
}

export function lamsPath(path = ""): string {
  return path ? `${LAMS_BASE_PATH}/${path.replace(/^\/+/, "")}` : LAMS_BASE_PATH;
}
