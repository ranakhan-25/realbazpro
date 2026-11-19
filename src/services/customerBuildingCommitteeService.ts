import api from "@/lib/api";

export type CommitteeMemberType = "DEVELOPER_REP" | "FLAT_OWNER";

export type CommitteeDesignation =
  "President" | "Secretary" | "Treasurer" | "Member" | "Advisor";

export type CommitteeMemberStatus = "ACTIVE" | "TERM_EXPIRED" | "RESIGNED";

export type DecisionStatus = "APPROVED" | "IN_PROGRESS" | "IMPLEMENTED";

// =========================================================================
// 1. DOMAIN INTERFACES
// =========================================================================

export interface CommitteeMemberItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  member_type: CommitteeMemberType;
  flat_number?: string | null;
  name: string;
  designation: CommitteeDesignation;
  responsibility?: string | null;
  phone: string;
  email?: string | null;
  term_start: string;
  term_end?: string | null;
  status: CommitteeMemberStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommitteeDecisionItem {
  id: number;
  uuid: string;
  project_id: string;
  project_name?: string | null;
  title: string;
  meeting_date: string;
  agenda_category: string;
  resolution_notes: string;
  status: DecisionStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CommitteeOverviewStats {
  members: {
    total: number;
    active: number;
    developer_representatives: number;
    flat_owners: number;
  };
  decisions: {
    total: number;
    approved: number;
    implemented: number;
  };
}

// =========================================================================
// 2. PAYLOADS
// =========================================================================

export interface CreateCommitteeMemberPayload {
  project_id: string;
  member_type: CommitteeMemberType;
  flat_number?: string;
  name: string;
  designation: CommitteeDesignation;
  responsibility?: string;
  phone: string;
  email?: string;
  term_start: string;
  term_end?: string;
  status?: CommitteeMemberStatus;
  notes?: string;
}

export interface UpdateCommitteeMemberPayload {
  member_type?: CommitteeMemberType;
  flat_number?: string;
  name?: string;
  designation?: CommitteeDesignation;
  responsibility?: string;
  phone?: string;
  email?: string;
  term_start?: string;
  term_end?: string;
  status?: CommitteeMemberStatus;
  notes?: string;
}

export interface CreateCommitteeDecisionPayload {
  project_id: string;
  title: string;
  meeting_date: string;
  agenda_category?: string;
  resolution_notes: string;
  status?: DecisionStatus;
}

export interface UpdateCommitteeDecisionPayload {
  title?: string;
  meeting_date?: string;
  agenda_category?: string;
  resolution_notes?: string;
  status?: DecisionStatus;
}

// =========================================================================
// 3. API FUNCTIONS
// =========================================================================

export async function getCommitteeOverviewStats(
  projectId?: string,
): Promise<CommitteeOverviewStats> {
  const res = await api.get(
    "/customer-service/building-committee/overview-stats",
    {
      params: { project_id: projectId },
    },
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createCommitteeMember(
  payload: CreateCommitteeMemberPayload,
): Promise<CommitteeMemberItem> {
  const res = await api.post(
    "/customer-service/building-committee/members",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getCommitteeMembers(params: {
  project_id?: string;
  member_type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: CommitteeMemberItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  stats: {
    total_members: number;
    active_members: number;
    developer_reps_count: number;
    flat_owners_count: number;
  };
}> {
  const q: Record<string, unknown> = { ...params };
  if (q.member_type === "all") delete q.member_type;
  if (q.status === "all") delete q.status;
  const res = await api.get("/customer-service/building-committee/members", {
    params: q,
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getCommitteeMember(
  uuid: string,
): Promise<CommitteeMemberItem> {
  const res = await api.get(
    `/customer-service/building-committee/members/${uuid}`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateCommitteeMember(
  uuid: string,
  payload: UpdateCommitteeMemberPayload,
): Promise<CommitteeMemberItem> {
  const res = await api.patch(
    `/customer-service/building-committee/members/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteCommitteeMember(uuid: string): Promise<void> {
  await api.delete(`/customer-service/building-committee/members/${uuid}`);
}

export async function createCommitteeDecision(
  payload: CreateCommitteeDecisionPayload,
): Promise<CommitteeDecisionItem> {
  const res = await api.post(
    "/customer-service/building-committee/decisions",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function getCommitteeDecisions(params: {
  project_id?: string;
  status?: string;
  agenda_category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: CommitteeDecisionItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
  stats: {
    total_decisions: number;
    approved_count: number;
    in_progress_count: number;
    implemented_count: number;
  };
}> {
  const q: Record<string, unknown> = { ...params };
  if (q.status === "all") delete q.status;
  if (q.agenda_category === "all") delete q.agenda_category;
  const res = await api.get("/customer-service/building-committee/decisions", {
    params: q,
  });
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateCommitteeDecision(
  uuid: string,
  payload: UpdateCommitteeDecisionPayload,
): Promise<CommitteeDecisionItem> {
  const res = await api.patch(
    `/customer-service/building-committee/decisions/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteCommitteeDecision(uuid: string): Promise<void> {
  await api.delete(`/customer-service/building-committee/decisions/${uuid}`);
}
