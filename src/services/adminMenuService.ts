import api from "@/lib/api";

export interface AdminMenuItemNode {
  id: number;
  uuid?: string;
  title: string;
  url?: string;
  icon?: string;
  order: number;
  parentId?: number | null;
  moduleId?: number | null;
  isVisible?: boolean;
  role?: string;
  children?: AdminMenuItemNode[];
}

export interface ReorderAdminMenuItemPayload {
  id: number;
  order: number;
  parentId: number | null;
}

export const adminMenuService = {
  getMenuTree: async (role?: string, moduleId?: string | number): Promise<AdminMenuItemNode[]> => {
    const params: Record<string, any> = {};
    if (role) params.role = role;
    if (moduleId !== undefined && moduleId !== null) params.moduleId = moduleId;
    const res = await api.get("/system/admin-menus", { params });
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  getModulesDropdown: async (): Promise<Array<{ id: number; name: string; description?: string }>> => {
    try {
      const res = await api.get("/modules/dropdown");
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    } catch {
      return [];
    }
  },

  createMenuItem: async (item: Partial<AdminMenuItemNode>): Promise<AdminMenuItemNode> => {
    const res = await api.post("/system/admin-menus", item);
    return res.data?.data || res.data;
  },

  updateMenuItem: async (id: number, item: Partial<AdminMenuItemNode>): Promise<AdminMenuItemNode> => {
    const res = await api.patch(`/system/admin-menus/${id}`, item);
    return res.data?.data || res.data;
  },

  reorderTree: async (items: ReorderAdminMenuItemPayload[]): Promise<{ success: boolean; count: number }> => {
    const res = await api.put("/system/admin-menus/reorder", { items });
    return res.data?.data || res.data;
  },

  deleteMenuItem: async (id: number): Promise<{ success: boolean }> => {
    const res = await api.delete(`/system/admin-menus/${id}`);
    return res.data?.data || res.data;
  },

  syncFromModules: async (
    moduleId?: string | number
  ): Promise<{
    success: boolean;
    syncedModules: number;
    createdCount: number;
    updatedCount: number;
    message: string;
  }> => {
    const params: Record<string, any> = {};
    if (moduleId && moduleId !== "admin" && moduleId !== "all") {
      params.moduleId = moduleId;
    }
    const res = await api.post("/system/admin-menus/sync-from-modules", {}, {
      params,
    });
    return res.data?.data || res.data;
  },
};
