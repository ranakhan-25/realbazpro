import api from "@/lib/api";

export interface FeatureNode {
  id?: number;
  uuid?: string;
  moduleId?: number;
  name: string;
  code: string;
  routePath?: string;
  actionType?: string;
  actions?: string[];
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ModuleTreeNode {
  id?: number;
  uuid?: string;
  name: string;
  code: string;
  pathRoute?: string;
  icon?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  features: FeatureNode[];
}

export async function getModuleTree(): Promise<ModuleTreeNode[]> {
  const response = await api.get<{ success?: boolean; data?: ModuleTreeNode[] } | ModuleTreeNode[]>(
    "/modules/tree",
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || [];
}

export async function saveModuleTree(payload: ModuleTreeNode): Promise<ModuleTreeNode> {
  const response = await api.post<{ success?: boolean; data?: ModuleTreeNode } | ModuleTreeNode>(
    "/modules/tree",
    payload,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as ModuleTreeNode;
}

export async function addModuleFeature(
  moduleId: number | string,
  feature: FeatureNode,
): Promise<FeatureNode> {
  const response = await api.post<{ success?: boolean; data?: FeatureNode } | FeatureNode>(
    `/modules/${moduleId}/features`,
    feature,
  );
  if ("data" in response.data && response.data.data) {
    return response.data.data;
  }
  return response.data as FeatureNode;
}

export async function deleteModuleFeature(featureId: number | string): Promise<{ message: string }> {
  const response = await api.delete(`/modules/features/${featureId}`);
  return response.data;
}

export async function deleteModule(moduleId: number | string): Promise<{ message?: string; success?: boolean }> {
  const response = await api.delete(`/modules/${moduleId}`);
  return response.data;
}

