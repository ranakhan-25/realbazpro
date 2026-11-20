"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { getProjectsDropdown, ProjectOption } from "@/services/projectService";
import { getOrganizations, Organization } from "@/services/organizationService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";

const PROJECT_STORAGE_KEY = "realbiz_cs_selected_project_id";
const ORG_STORAGE_KEY = "realbiz_cs_selected_org_id";

export interface CustomerServiceProjectContextType {
  projectId: string | null;
  project: ProjectOption | null;
  projects: ProjectOption[];
  setProject: (idOrUuid: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refetchProjects: () => Promise<void>;

  // Organization Multi-Tenancy Context
  organizationId: number | null;
  organization: Organization | null;
  organizations: Organization[];
  setOrganization: (orgId: number | string | null) => void;
  isSuperAdmin: boolean;
  isLoadingOrgs: boolean;
  refetchOrganizations: () => Promise<void>;
}

const CustomerServiceProjectContext =
  createContext<CustomerServiceProjectContextType | undefined>(undefined);

export function CustomerServiceProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ---------------------------------------------------------------------------
  // 1. User & Super Admin Identity
  // ---------------------------------------------------------------------------
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const profile = getStoredUserProfile();
    return Boolean(
      profile?.isSuperUser ||
      profile?.role === "super-admin" ||
      profile?.roles?.includes("super-admin"),
    );
  });

  // ---------------------------------------------------------------------------
  // 2. Organization State
  // ---------------------------------------------------------------------------
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const profile = getStoredUserProfile();
    if (profile?.orgId) return Number(profile.orgId);
    const stored = window.localStorage.getItem(ORG_STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [isLoadingOrgs, setIsLoadingOrgs] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // 3. Project State
  // ---------------------------------------------------------------------------
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Organizations (for Super Admin discovery and validation)
  const fetchOrganizations = useCallback(async () => {
    if (typeof window === "undefined") return;
    const profile = getStoredUserProfile();
    const superAdmin = Boolean(
      profile?.isSuperUser ||
      profile?.role === "super-admin" ||
      profile?.roles?.includes("super-admin"),
    );
    setIsSuperAdmin(superAdmin);

    setIsLoadingOrgs(true);
    try {
      if (superAdmin) {
        const orgList = await getOrganizations({ all: true });
        setOrganizations(orgList);

        if (orgList.length > 0) {
          const stored = window.localStorage.getItem(ORG_STORAGE_KEY);
          let matchedOrg: Organization | undefined;

          if (stored) {
            matchedOrg = orgList.find(
              (o) => String(o.id) === stored || o.uuid === stored,
            );
          }

          if (!matchedOrg && profile?.orgId) {
            matchedOrg = orgList.find((o) => o.id === Number(profile.orgId));
          }

          // Smart match user's name/username (e.g. Org "Fleek BD" for user "Fleek BD")
          if (!matchedOrg && (profile?.name || profile?.username)) {
            const targetName = (profile.name || profile.username || "").toLowerCase().trim();
            matchedOrg = orgList.find(
              (o) => o.name.toLowerCase().trim() === targetName,
            );
          }

          const active = matchedOrg || orgList[0];
          setSelectedOrgId(active.id);
          window.localStorage.setItem(ORG_STORAGE_KEY, String(active.id));
        }
      } else if (profile?.orgId) {
        setSelectedOrgId(Number(profile.orgId));
      }
    } catch (err) {
      console.warn("Could not load organization directory:", err);
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  const setOrganization = useCallback(
    (idOrUuid: number | string | null) => {
      if (!idOrUuid) {
        setSelectedOrgId(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ORG_STORAGE_KEY);
        }
        return;
      }

      const numId = Number(idOrUuid);
      const matched = organizations.find(
        (o) => o.id === numId || o.uuid === String(idOrUuid),
      );

      const targetId = matched ? matched.id : numId;
      setSelectedOrgId(targetId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ORG_STORAGE_KEY, String(targetId));
      }
    },
    [organizations],
  );

  // Fetch Projects list
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getProjectsDropdown();
      setProjects(data);

      const storedId =
        typeof window !== "undefined"
            ? window.localStorage.getItem(PROJECT_STORAGE_KEY)
            : null;

      if (data.length > 0) {
        const found = storedId
          ? data.find(
            (p) => p.uuid === storedId || String(p.id) === storedId,
          )
          : null;

        if (found) {
          setSelectedProjectId(found.uuid);
        } else {
          const defaultProj = data[0];
          setSelectedProjectId(defaultProj.uuid);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(PROJECT_STORAGE_KEY, defaultProj.uuid);
          }
        }
      } else {
        setSelectedProjectId(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PROJECT_STORAGE_KEY);
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message || "Failed to load organization projects";
      setError(msg);
      setProjects([]);
      setSelectedProjectId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchProjects();
}, [fetchProjects, selectedOrgId]);

const setProject = useCallback(
  (idOrUuid: string | null) => {
    if (!idOrUuid) {
      setSelectedProjectId(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PROJECT_STORAGE_KEY);
      }
      return;
    }

    const matched = projects.find(
      (p) => p.uuid === idOrUuid || String(p.id) === idOrUuid,
    );

    const validId = matched ? matched.uuid : idOrUuid;
    setSelectedProjectId(validId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, validId);
    }
  },
  [projects],
);

const activeProject = useMemo(() => {
  if (!selectedProjectId || projects.length === 0) return null;
  return (
    projects.find(
      (p) =>
        p.uuid === selectedProjectId || String(p.id) === selectedProjectId,
    ) || null
  );
}, [selectedProjectId, projects]);

const activeOrganization = useMemo(() => {
  if (!selectedOrgId || organizations.length === 0) return null;
  return (
    organizations.find((o) => o.id === selectedOrgId) || null
  );
}, [selectedOrgId, organizations]);

// ---------------------------------------------------------------------------
// 4. Scoped Axios Interceptor for Customer Service Requests
// ---------------------------------------------------------------------------
useEffect(() => {
  // Only intercepts requests while inside CustomerServiceProjectProvider
  const interceptorId = api.interceptors.request.use((config) => {
    const url = config.url || "";
    const isCsEndpoint =
      url.includes("/customer-service") || url.includes("customer-service");
    const method = (config.method || "get").toUpperCase();
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (isCsEndpoint) {
      if (selectedOrgId) {
        if (config.headers?.set) {
          config.headers.set("x-organization-id", String(selectedOrgId));
        } else {
          config.headers = config.headers || {};
          config.headers["x-organization-id"] = String(selectedOrgId);
        }
      } else if (isWrite && isSuperAdmin) {
        const msg =
          "x-organization-id is required for Super Admin write operations. Please select an organization.";
        toast.error(msg);
        return Promise.reject(new Error(msg));
      }
    }

    return config;
  });

  return () => {
    api.interceptors.request.eject(interceptorId);
  };
}, [selectedOrgId, isSuperAdmin]);

const value = useMemo(
  () => ({
    projectId: selectedProjectId,
    project: activeProject,
    projects,
    setProject,
    isLoading,
    error,
    refetchProjects: fetchProjects,

    organizationId: selectedOrgId,
    organization: activeOrganization,
    organizations,
    setOrganization,
    isSuperAdmin,
    isLoadingOrgs,
    refetchOrganizations: fetchOrganizations,
  }),
  [
    selectedProjectId,
    activeProject,
    projects,
    setProject,
    isLoading,
    error,
    fetchProjects,
    selectedOrgId,
    activeOrganization,
    organizations,
    setOrganization,
    isSuperAdmin,
    isLoadingOrgs,
    fetchOrganizations,
  ],
);

return (
  <CustomerServiceProjectContext.Provider value={value}>
    {children}
  </CustomerServiceProjectContext.Provider>
);
}

/**
 * Hook to consume the currently selected project and organization
 * in the customer-service area.
 */
export function useSelectedProject(): CustomerServiceProjectContextType {
  const context = useContext(CustomerServiceProjectContext);
  if (!context) {
    throw new Error(
      "useSelectedProject must be used within a CustomerServiceProjectProvider (or inside /dashboard/customer-service/*).",
    );
  }
  return context;
}
