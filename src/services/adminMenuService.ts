import api from "@/lib/api";

export interface AdminMenuItemNode {
  id: number;
  uuid?: string;
  title: string;
  url?: string;
  icon?: string;
  order: number;
  parentId?: number | null;
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
  getMenuTree: async (role?: string): Promise<AdminMenuItemNode[]> => {
    const params = role ? { role } : {};
    const res = await api.get("/system/admin-menus", { params });
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
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
};
