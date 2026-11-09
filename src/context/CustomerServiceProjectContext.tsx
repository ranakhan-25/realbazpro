"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getProjectsDropdown, ProjectOption } from "@/services/projectService";

const STORAGE_KEY = "realbiz_cs_selected_project_id";

export interface CustomerServiceProjectContextType {
  projectId: string | null;
  project: ProjectOption | null;
  projects: ProjectOption[];
  setProject: (idOrUuid: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refetchProjects: () => Promise<void>;
}

const CustomerServiceProjectContext =
  createContext<CustomerServiceProjectContextType | undefined>(undefined);

export function CustomerServiceProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getProjectsDropdown();
      setProjects(data);

      // Validate persisted project ID from localStorage against fetched list
      const storedId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;

      if (data.length > 0) {
        const found = storedId
          ? data.find(
              (p) => p.uuid === storedId || String(p.id) === storedId,
            )
          : null;

        if (found) {
          // Persisted ID is valid
          setSelectedProjectId(found.uuid);
        } else {
          // Stored ID is invalid or missing -> fallback to the first active project
          const defaultProj = data[0];
          setSelectedProjectId(defaultProj.uuid);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, defaultProj.uuid);
          }
        }
      } else {
        // Empty projects list for this organization
        setSelectedProjectId(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
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
    fetchProjects();
  }, [fetchProjects]);

  const setProject = useCallback(
    (idOrUuid: string | null) => {
      if (!idOrUuid) {
        setSelectedProjectId(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }

      // Verify the ID exists in the available projects list
      const matched = projects.find(
        (p) => p.uuid === idOrUuid || String(p.id) === idOrUuid,
      );

      const validId = matched ? matched.uuid : idOrUuid;
      setSelectedProjectId(validId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, validId);
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

  const value = useMemo(
    () => ({
      projectId: selectedProjectId,
      project: activeProject,
      projects,
      setProject,
      isLoading,
      error,
      refetchProjects: fetchProjects,
    }),
    [
      selectedProjectId,
      activeProject,
      projects,
      setProject,
      isLoading,
      error,
      fetchProjects,
    ],
  );

  return (
    <CustomerServiceProjectContext.Provider value={value}>
      {children}
    </CustomerServiceProjectContext.Provider>
  );
}

/**
 * Hook to consume the currently selected project in the customer-service area.
 * Returns:
 * - projectId: string | null (UUID of selected project)
 * - project: ProjectOption | null (Full project metadata)
 * - projects: ProjectOption[] (All projects available to user's organization)
 * - setProject: (id: string | null) => void (Update selected project)
 * - isLoading: boolean (True while fetching project list)
 *
 * Scoping Rule:
 * All customer-service API requests must scope data by `projectId`.
 * Organization ID is never passed in request bodies or query params.
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

