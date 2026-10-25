import api from "@/lib/api";

export interface TenantSiteThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  darkMode: boolean;
  borderRadius: string;
}

export interface TenantSiteSeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  keywords?: string;
}

export interface TenantSite {
  id: number;
  uuid: string;
  orgId: number;
  subdomain: string;
  customDomain?: string | null;
  siteTitle: string;
  tagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  themeConfig: TenantSiteThemeConfig;
  seoConfig: TenantSiteSeoConfig;
  isPublished: boolean;
  organization?: {
    id: number | string;
    name: string;
    code: string;
  };
}

export interface TenantMenuItem {
  id: number;
  uuid?: string;
  menuId: number;
  orgId: number;
  parentId?: number | null;
  title: string;
  url: string;
  target?: string;
  icon?: string | null;
  orderIndex: number;
  isVisible: boolean;
  children?: TenantMenuItem[];
}

export interface TenantMenu {
  id: number;
  uuid?: string;
  orgId: number;
  name: string;
  location: "HEADER" | "FOOTER" | "SIDEBAR" | "PORTAL";
  isActive: boolean;
  items?: TenantMenuItem[];
  tree?: TenantMenuItem[];
}

export interface TenantPageBlock {
  id: number;
  uuid?: string;
  pageId: number;
  orgId: number;
  blockType: "HERO" | "FEATURES" | "STATS" | "SERVICES" | "PRICING" | "TESTIMONIALS" | "LEAD_FORM" | "CUSTOM_HTML";
  blockName: string;
  orderIndex: number;
  contentJson: Record<string, any>;
  isVisible: boolean;
}

export interface TenantPage {
  id: number;
  uuid?: string;
  orgId: number;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isHomePage: boolean;
  blocks?: TenantPageBlock[];
}

export interface PublicTenantSiteData {
  site: TenantSite;
  menus: TenantMenu[];
  pages: TenantPage[];
}

export const tenantCmsService = {
  // Site settings
  getSite: async (orgId?: number): Promise<TenantSite> => {
    const params = orgId ? { orgId } : {};
    const res = await api.get<{ success: boolean; data: TenantSite }>("/system/cms/site", { params });
    return (res as any).data || res;
  },

  updateSite: async (dto: Partial<TenantSite>, orgId?: number): Promise<TenantSite> => {
    const params = orgId ? { orgId } : {};
    const res = await api.patch<{ success: boolean; data: TenantSite }>("/system/cms/site", dto, { params });
    return (res as any).data || res;
  },

  // Menus
  getMenus: async (orgId?: number): Promise<TenantMenu[]> => {
    const params = orgId ? { orgId } : {};
    const res = await api.get<{ success: boolean; data: TenantMenu[] }>("/system/cms/menus", { params });
    return (res as any).data || res;
  },

  createMenu: async (dto: { name: string; location: string; isActive?: boolean }, orgId?: number): Promise<TenantMenu> => {
    const params = orgId ? { orgId } : {};
    const res = await api.post<{ success: boolean; data: TenantMenu }>("/system/cms/menus", dto, { params });
    return (res as any).data || res;
  },

  createMenuItem: async (dto: Partial<TenantMenuItem>, orgId?: number): Promise<TenantMenuItem> => {
    const params = orgId ? { orgId } : {};
    const res = await api.post<{ success: boolean; data: TenantMenuItem }>("/system/cms/menu-items", dto, { params });
    return (res as any).data || res;
  },

  updateMenuItem: async (id: number, dto: Partial<TenantMenuItem>, orgId?: number): Promise<TenantMenuItem> => {
    const params = orgId ? { orgId } : {};
    const res = await api.patch<{ success: boolean; data: TenantMenuItem }>(`/system/cms/menu-items/${id}`, dto, { params });
    return (res as any).data || res;
  },

  deleteMenuItem: async (id: number, orgId?: number): Promise<{ success: boolean }> => {
    const params = orgId ? { orgId } : {};
    const res = await api.delete<{ success: boolean }>(`/system/cms/menu-items/${id}`, { params });
    return (res as any).data || res;
  },

  // Pages & Blocks
  getPages: async (orgId?: number): Promise<TenantPage[]> => {
    const params = orgId ? { orgId } : {};
    const res = await api.get<{ success: boolean; data: TenantPage[] }>("/system/cms/pages", { params });
    return (res as any).data || res;
  },

  createPage: async (dto: Partial<TenantPage>, orgId?: number): Promise<TenantPage> => {
    const params = orgId ? { orgId } : {};
    const res = await api.post<{ success: boolean; data: TenantPage }>("/system/cms/pages", dto, { params });
    return (res as any).data || res;
  },

  updatePage: async (id: number, dto: Partial<TenantPage>, orgId?: number): Promise<TenantPage> => {
    const params = orgId ? { orgId } : {};
    const res = await api.patch<{ success: boolean; data: TenantPage }>(`/system/cms/pages/${id}`, dto, { params });
    return (res as any).data || res;
  },

  addPageBlock: async (dto: Partial<TenantPageBlock>, orgId?: number): Promise<TenantPageBlock> => {
    const params = orgId ? { orgId } : {};
    const res = await api.post<{ success: boolean; data: TenantPageBlock }>("/system/cms/blocks", dto, { params });
    return (res as any).data || res;
  },

  updatePageBlock: async (id: number, dto: Partial<TenantPageBlock>, orgId?: number): Promise<TenantPageBlock> => {
    const params = orgId ? { orgId } : {};
    const res = await api.patch<{ success: boolean; data: TenantPageBlock }>(`/system/cms/blocks/${id}`, dto, { params });
    return (res as any).data || res;
  },

  deletePageBlock: async (id: number, orgId?: number): Promise<{ success: boolean }> => {
    const params = orgId ? { orgId } : {};
    const res = await api.delete<{ success: boolean }>(`/system/cms/blocks/${id}`, { params });
    return (res as any).data || res;
  },

  // Public resolver
  getPublicSite: async (subdomainOrOrgId: string): Promise<PublicTenantSiteData> => {
    const res = await api.get<{ success: boolean; data: PublicTenantSiteData }>(`/system/cms/public/${subdomainOrOrgId}`);
    return (res as any).data || res;
  },
};
