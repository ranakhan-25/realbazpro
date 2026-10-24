import api from "@/lib/api";
import { Plan } from "./planService";

export interface OrgAdminSummary {
  id: number;
  username?: string;
  name: string;
  email: string;
  mobile?: string;
}

export interface EntitledFeature {
  featureId: number;
  featureCode: string;
  featureName: string;
  routePath?: string;
}

export interface EntitledModule {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  features: EntitledFeature[];
}

export interface Organization {
  id: number;
  uuid: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStatus: "trial" | "active" | "past_due" | "expired" | "locked" | "canceled";
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  trialEndsAt?: string;
  maxUsers: number;
  maxProjects: number;
  maxStorageMb: number;
  isLocked: boolean;
  lockReason?: string;
  userCount: number;
  plan?: Plan;
  adminUser?: OrgAdminSummary;
  entitledModules?: EntitledModule[];
  createdAt: string;
}

export interface ModuleFeatureAccessItem {
  moduleId: number | string;
  featureIds: Array<number | string>;
}

export interface CreateOrganizationWizardPayload {
  organization: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    planId?: number | string;
    durationDays?: number;
    trialDays?: number;
    maxUsers?: number;
    maxProjects?: number;
    maxStorageMb?: number;
  };
  adminUser: {
    name: string;
    username: string;
    email: string;
    password: string;
    mobile?: string;
    designationName?: string;
  };
  moduleFeatureAccess: ModuleFeatureAccessItem[];
}

export interface UpdateOrganizationPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  maxUsers?: number;
  maxProjects?: number;
  maxStorageMb?: number;
}

export interface UpdateSubscriptionPayload {
  action: "renew" | "extend" | "change_plan" | "cancel";
  planId?: number | string;
  durationDays?: number;
  subscriptionEndDate?: string;
  status?: Organization["subscriptionStatus"];
}

export interface ToggleLockPayload {
  isLocked: boolean;
  lockReason?: string;
}

export async function getOrganizations(params?: {
  status?: string;
  isLocked?: boolean;
  search?: string;
}): Promise<Organization[]> {
  const response = await api.get<{ success?: boolean; data?: Organization[] } | Organization[]>(
    "/system/organizations",
    { params },
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || [];
}

export async function getOrganization(id: string | number): Promise<Organization> {
  const response = await api.get<{ success?: boolean; data?: Organization } | Organization>(
    `/system/organizations/${id}`,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Organization;
}

export async function createOrganizationWizard(
  payload: CreateOrganizationWizardPayload,
): Promise<Organization> {
  const response = await api.post<{ success?: boolean; data?: Organization } | Organization>(
    "/system/organizations/wizard",
    payload,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Organization;
}

export async function updateOrganization(
  id: string | number,
  payload: UpdateOrganizationPayload,
): Promise<Organization> {
  const response = await api.patch<{ success?: boolean; data?: Organization } | Organization>(
    `/system/organizations/${id}`,
    payload,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Organization;
}

export async function updateSubscription(
  id: string | number,
  payload: UpdateSubscriptionPayload,
): Promise<Organization> {
  const response = await api.patch<{ success?: boolean; data?: Organization } | Organization>(
    `/system/organizations/${id}/subscription`,
    payload,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Organization;
}

export async function toggleOrganizationLock(
  id: string | number,
  payload: ToggleLockPayload,
): Promise<Organization> {
  const response = await api.patch<{ success?: boolean; data?: Organization } | Organization>(
    `/system/organizations/${id}/lock`,
    payload,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as Organization;
}

export async function getOrganizationEntitlements(id: string | number): Promise<EntitledModule[]> {
  const response = await api.get<{ success?: boolean; data?: EntitledModule[] } | EntitledModule[]>(
    `/system/organizations/${id}/entitlements`,
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || [];
}

export async function updateOrganizationEntitlements(
  id: string | number,
  moduleFeatureAccess: ModuleFeatureAccessItem[],
): Promise<EntitledModule[]> {
  const response = await api.put<{ success?: boolean; data?: EntitledModule[] } | EntitledModule[]>(
    `/system/organizations/${id}/entitlements`,
    { moduleFeatureAccess },
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || [];
}
