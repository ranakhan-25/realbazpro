import api from "@/lib/api";

export interface Plan {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  billingCycle: "monthly" | "quarterly" | "half_yearly" | "yearly" | "lifetime";
  durationDays: number;
  trialDays: number;
  maxUsers: number;
  maxProjects: number;
  maxStorageMb: number;
  features?: string[] | any;
  status: "active" | "inactive" | "archived";
  subscribersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  name: string;
  code: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  billingCycle?: "monthly" | "quarterly" | "half_yearly" | "yearly" | "lifetime";
  durationDays: number;
  trialDays: number;
  maxUsers: number;
  maxProjects: number;
  maxStorageMb: number;
  features?: any;
  status?: "active" | "inactive" | "archived";
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {}

export async function getPlans(params?: { status?: string; search?: string }): Promise<Plan[]> {
  const response = await api.get<{ success?: boolean; data?: Plan[] } | Plan[]>("/system/plans", {
    params,
  });
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || [];
}

export async function getPlan(id: string | number): Promise<Plan> {
  const response = await api.get<{ success?: boolean; data?: Plan } | Plan>(`/system/plans/${id}`);
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Plan;
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const response = await api.post<{ success?: boolean; data?: Plan } | Plan>("/system/plans", payload);
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Plan;
}

export async function updatePlan(id: string | number, payload: UpdatePlanPayload): Promise<Plan> {
  const response = await api.patch<{ success?: boolean; data?: Plan } | Plan>(`/system/plans/${id}`, payload);
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Plan;
}

export async function deletePlan(id: string | number): Promise<{ message: string }> {
  const response = await api.delete(`/system/plans/${id}`);
  return response.data;
}
