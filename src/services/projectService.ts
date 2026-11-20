import api from "@/lib/api";

export interface ProjectOption {
  id: number | string;
  uuid: string;
  name: string;
  code?: string;
  status?: string;
  projectType?: string;
  location?: string;
}

/**
 * Fetches the list of projects available to the user's organization.
 * Reuses existing backend endpoints:
 * 1. Primary: /customer-service/properties-bookings/dropdown/meta (returns { data: { projects } })
 * 2. Fallback: /project (returns { data: Project[] })
 *
 * NOTE: organization_id is NEVER sent in query parameters or headers from the frontend.
 * Multi-tenancy filtering is handled strictly on the backend via JWT / user session.
 */
export async function getProjectsDropdown(): Promise<ProjectOption[]> {
  // Helper to extract project array across single-wrapped or double-wrapped response shapes
  const extractProjectList = (payload: any): any[] => {
    let cur = payload;
    // Unwrap nested 'data' wrappers if present
    if (cur?.data !== undefined) cur = cur.data;
    if (cur?.data !== undefined) cur = cur.data;

    if (cur?.projects && Array.isArray(cur.projects)) return cur.projects;
    if (Array.isArray(cur)) return cur;
    if (cur?.rows && Array.isArray(cur.rows)) return cur.rows;
    if (cur?.items && Array.isArray(cur.items)) return cur.items;
    return [];
  };

  // Try primary customer-service dropdown meta endpoint
  try {
    const res = await api.get("/customer-service/properties-bookings/dropdown/meta");
        const list = extractProjectList(res.data);
        if(list.length > 0) {
        return list.map((p: any) => ({
          id: p.id ?? p.uuid,
          uuid: p.uuid || String(p.id),
          name: p.name || "Unnamed Project",
          code: p.code || "",
          status: p.status || "ACTIVE",
        }));
      }
  } catch (err) {
      console.warn("Primary project dropdown meta unavailable, falling back to /project:", err);
    }

    // Fallback to /project endpoint
    try {
      const res = await api.get("/project", { params: { limit: 100 } });
      const list = extractProjectList(res.data);
      return list.map((p: any) => ({
        id: p.id ?? p.uuid,
        uuid: p.uuid || String(p.id),
        name: p.name || "Unnamed Project",
        code: p.code || "",
        status: p.status || "ACTIVE",
        projectType: p.projectType || p.type?.name,
        location: p.location,
      }));
    } catch (fallbackErr) {
      console.error("Failed to load projects from both endpoints:", fallbackErr);
      return [];
    }
  }

