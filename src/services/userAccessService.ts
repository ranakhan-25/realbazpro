import api from "@/lib/api";

export interface AccessibleModuleItem {
  id: number;
  key: string;
  name: string;
  code: string;
  route: string;
  features: string[];
  allowedRoutes: string[];
}

export interface UserAccessProfile {
  id: number;
  uuid?: string;
  name: string;
  email: string;
  username?: string;
  orgId: number | null;
  orgName?: string;
  isSuperUser: boolean;
  isOrgAdmin: boolean;
  role: string;
  roleLevel: number;
}

export interface UserAccessResponse {
  user: UserAccessProfile;
  accessibleModules: AccessibleModuleItem[];
  entitledModuleKeys: string[];
  allAllowedPaths: string[];
}

export async function getUserAccess(): Promise<UserAccessResponse> {
  const response = await api.get<UserAccessResponse | { data: UserAccessResponse }>(
    "/system/user-access",
  );
  if (response.data && "accessibleModules" in response.data) {
    return response.data as UserAccessResponse;
  }
  if (response.data && "data" in response.data) {
    return (response.data as { data: UserAccessResponse }).data;
  }
  return response.data as UserAccessResponse;
}
