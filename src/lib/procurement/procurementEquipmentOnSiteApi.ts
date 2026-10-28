/**
 * Procurement Equipment On Site API Client
 *
 * Implements real backend API endpoints for:
 *   GET /realbizpro/api/v1/procurement/equipment-on-site/dropdowns (Projects list)
 *   GET /realbizpro/api/v1/procurement/equipment-on-site          (Equipment on site for project, calculated: Hire In less Hire Out)
 *
 * Read-only resource. Real backend data only.
 * No mock data, no local storage fallbacks.
 */

import api from "@/lib/api";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface BackendOnSiteProject {
  uuid: string;
  code?: string;
  name: string;
}

export interface EquipmentOnSiteDropdowns {
  projects: BackendOnSiteProject[];
}

export interface BackendEquipmentOnSite {
  source: string; // e.g. "Hire Order"
  equipment: string; // equipment name or description
  equipment_code?: string;
  quantity: number; // current quantity on site (Hire In minus Hire Out)
  unit?: string;
  location_vendor?: string; // site name or vendor supplierName
  ref?: string; // hire order number (e.g. "HO-2026-0001")
  status: "on_site" | "not_received" | string;
  project_id: string;
  hire_order_id: string;
}

export interface QueryEquipmentOnSiteParams {
  project_id: string;
}

export interface EquipmentOnSiteListResult {
  data: BackendEquipmentOnSite[];
  project_id: string;
  total: number;
}

// =============================================================================
// API CLIENT IMPLEMENTATION
// =============================================================================

export const procurementEquipmentOnSiteApi = {
  /**
   * GET /realbizpro/api/v1/procurement/equipment-on-site/dropdowns
   * Fetch projects list for filtering equipment on site
   */
  async getDropdowns(): Promise<EquipmentOnSiteDropdowns> {
    const res = await api.get("/procurement/equipment-on-site/dropdowns");
    const body = res.data;

    let projects: BackendOnSiteProject[] = [];

    if (body) {
      if (body.data?.projects && Array.isArray(body.data.projects)) {
        projects = body.data.projects;
      } else if (body.projects && Array.isArray(body.projects)) {
        projects = body.projects;
      } else if (Array.isArray(body.data)) {
        projects = body.data;
      } else if (Array.isArray(body)) {
        projects = body;
      }
    }

    return { projects };
  },

  /**
   * GET /realbizpro/api/v1/procurement/equipment-on-site?project_id={uuid}
   * Get equipment currently on site for a project based on Hire In less Hire Out quantities
   */
  async list(params: QueryEquipmentOnSiteParams): Promise<EquipmentOnSiteListResult> {
    if (!params.project_id) {
      throw new Error("Project ID is required to fetch equipment on site.");
    }

    const query = new URLSearchParams();
    query.append("project_id", params.project_id);

    const res = await api.get(`/procurement/equipment-on-site?${query.toString()}`);
    const body = res.data;

    let items: BackendEquipmentOnSite[] = [];
    let total = 0;
    const project_id = params.project_id;

    if (body) {
      if (Array.isArray(body.data)) {
        items = body.data;
        total = typeof body.total === "number" ? body.total : items.length;
      } else if (body.data?.data && Array.isArray(body.data.data)) {
        items = body.data.data;
        total = typeof body.data.total === "number" ? body.data.total : items.length;
      } else if (Array.isArray(body)) {
        items = body;
        total = body.length;
      }
    }

    return {
      data: items,
      project_id,
      total,
    };
  },
};
