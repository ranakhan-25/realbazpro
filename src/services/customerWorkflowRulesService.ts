import api from "@/lib/api";

export interface WorkflowRuleItem {
  id: number | string;
  uuid: string;
  project_id?: string | null;
  projectId?: string | null;
  project_name?: string | null;
  projectName?: string | null;
  rule_code: string;
  ruleCode: string;
  rule_name: string;
  ruleName: string;
  rule_type:
    "SLA Policy" | "Auto-Routing" | "Escalation Matrix" | "Statutory Rule";
  ruleType:
    "SLA Policy" | "Auto-Routing" | "Escalation Matrix" | "Statutory Rule";
  category_or_trigger: string;
  categoryOrTrigger: string;
  first_response_target: string;
  firstResponseTarget: string;
  resolution_target: string;
  resolutionTarget: string;
  escalation_target?: string | null;
  escalationTarget?: string | null;
  assigned_department: string;
  assignedDepartment: string;
  operating_hours: string;
  operatingHours: string;
  status: "Active" | "Disabled";
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowRuleStats {
  total_rules: number;
  sla_policies: number;
  auto_routing: number;
  escalation_matrix: number;
  statutory_rules: number;
  active_rules: number;
  disabled_rules: number;
  all: number;
  sla: number;
  routing: number;
  escalation: number;
  statutory: number;
  active: number;
  disabled: number;
}

export interface QueryWorkflowRulesParams {
  page?: number;
  limit?: number;
  search?: string;
  project_id?: string;
  rule_type?: string;
  tab?: string;
  status?: string;
}

export interface CreateWorkflowRulePayload {
  project_id?: string;
  project_name?: string;
  rule_code?: string;
  rule_name: string;
  rule_type?:
    "SLA Policy" | "Auto-Routing" | "Escalation Matrix" | "Statutory Rule";
  category_or_trigger: string;
  first_response_target?: string;
  resolution_target?: string;
  escalation_target?: string;
  assigned_department?: string;
  operating_hours?: string;
  status?: "Active" | "Disabled";
}

export type UpdateWorkflowRulePayload = Partial<CreateWorkflowRulePayload>;

export async function getWorkflowRuleStats(
  projectId?: string,
): Promise<WorkflowRuleStats> {
  try {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get(
      "/customer-service/settings/workflow-rules/stats",
      { params },
    );
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      total_rules: Number(raw?.total_rules || raw?.all || 0),
      sla_policies: Number(raw?.sla_policies || raw?.sla || 0),
      auto_routing: Number(raw?.auto_routing || raw?.routing || 0),
      escalation_matrix: Number(raw?.escalation_matrix || raw?.escalation || 0),
      statutory_rules: Number(raw?.statutory_rules || raw?.statutory || 0),
      active_rules: Number(raw?.active_rules || raw?.active || 0),
      disabled_rules: Number(raw?.disabled_rules || raw?.disabled || 0),
      all: Number(raw?.total_rules || raw?.all || 0),
      sla: Number(raw?.sla_policies || raw?.sla || 0),
      routing: Number(raw?.auto_routing || raw?.routing || 0),
      escalation: Number(raw?.escalation_matrix || raw?.escalation || 0),
      statutory: Number(raw?.statutory_rules || raw?.statutory || 0),
      active: Number(raw?.active_rules || raw?.active || 0),
      disabled: Number(raw?.disabled_rules || raw?.disabled || 0),
    };
  } catch {
    return {
      total_rules: 0,
      sla_policies: 0,
      auto_routing: 0,
      escalation_matrix: 0,
      statutory_rules: 0,
      active_rules: 0,
      disabled_rules: 0,
      all: 0,
      sla: 0,
      routing: 0,
      escalation: 0,
      statutory: 0,
      active: 0,
      disabled: 0,
    };
  }
}

export async function getWorkflowRules(
  params?: QueryWorkflowRulesParams,
): Promise<{
  items: WorkflowRuleItem[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const query: Record<string, unknown> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.search) query.search = params.search;
  if (params?.project_id && params.project_id !== "all")
    query.project_id = params.project_id;
  if (params?.rule_type) query.rule_type = params.rule_type;
  if (params?.tab) query.tab = params.tab;
  if (params?.status) query.status = params.status;

  const res = await api.get("/customer-service/settings/workflow-rules", {
    params: query,
  });
  const raw = res.data?.data !== undefined ? res.data.data : res.data;
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    meta: {
      total: Number(raw?.meta?.total || 0),
      page: Number(raw?.meta?.page || 1),
      limit: Number(raw?.meta?.limit || 10),
      total_pages: Number(raw?.meta?.total_pages || 1),
    },
  };
}

export async function getWorkflowRuleByUuid(
  uuid: string,
): Promise<WorkflowRuleItem> {
  const res = await api.get(
    `/customer-service/settings/workflow-rules/${uuid}`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function createWorkflowRule(
  payload: CreateWorkflowRulePayload,
): Promise<WorkflowRuleItem> {
  const res = await api.post(
    "/customer-service/settings/workflow-rules",
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function updateWorkflowRule(
  uuid: string,
  payload: UpdateWorkflowRulePayload,
): Promise<WorkflowRuleItem> {
  const res = await api.patch(
    `/customer-service/settings/workflow-rules/${uuid}`,
    payload,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function toggleWorkflowRuleStatus(
  uuid: string,
): Promise<WorkflowRuleItem> {
  const res = await api.patch(
    `/customer-service/settings/workflow-rules/${uuid}/toggle`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function deleteWorkflowRule(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(
    `/customer-service/settings/workflow-rules/${uuid}`,
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}

export async function reloadWorkflowEngine(): Promise<{
  success: boolean;
  message: string;
  active_rules: number;
  total_rules: number;
}> {
  const res = await api.post(
    "/customer-service/settings/workflow-rules/reload",
  );
  return res.data?.data !== undefined ? res.data.data : res.data;
}
