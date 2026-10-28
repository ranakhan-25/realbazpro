"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getUserAccess,
  AccessibleModuleItem,
  UserAccessProfile,
  UserAccessResponse,
} from "@/services/userAccessService";

interface UserAccessContextType {
  user: UserAccessProfile | null;
  accessibleModules: AccessibleModuleItem[];
  entitledModuleKeys: string[];
  allAllowedPaths: string[];
  isLoading: boolean;
  error: string | null;
  hasAccessToModule: (moduleKey: string) => boolean;
  hasAccessToRoute: (moduleKey: string, routePath: string) => boolean;
  refreshAccess: () => Promise<void>;
}

const UserAccessContext = createContext<UserAccessContextType | undefined>(undefined);

export function UserAccessProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccessProfile | null>(null);
  const [accessibleModules, setAccessibleModules] = useState<AccessibleModuleItem[]>([]);
  const [entitledModuleKeys, setEntitledModuleKeys] = useState<string[]>([]);
  const [allAllowedPaths, setAllAllowedPaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: UserAccessResponse = await getUserAccess();
      setUser(data.user);
      setAccessibleModules(data.accessibleModules || []);
      setEntitledModuleKeys(data.entitledModuleKeys || []);
      setAllAllowedPaths(data.allAllowedPaths || []);
    } catch (err: any) {
      console.warn("Could not load user access entitlements:", err?.message || err);
      setError(err?.message || "Failed to load access configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const hasAccessToModule = useCallback(
    (moduleKey: string): boolean => {
      if (!moduleKey) return false;
      if (user?.isSuperUser) return true;
      const normalized = moduleKey.toLowerCase().trim();
      return entitledModuleKeys.some((k) => k.toLowerCase() === normalized);
    },
    [user, entitledModuleKeys],
  );

  const hasAccessToRoute = useCallback(
    (moduleKey: string, routePath: string): boolean => {
      if (!moduleKey) return false;
      if (user?.isSuperUser) return true;
      if (!hasAccessToModule(moduleKey)) return false;

      const mod = accessibleModules.find(
        (m) => m.key.toLowerCase() === moduleKey.toLowerCase(),
      );
      if (!mod) return false;
      if (mod.allowedRoutes?.includes("*")) return true;

      if (!routePath || routePath === "dashboard") return true;

      const cleanRoute = routePath.toLowerCase().replace(/^\/+|\/+$/g, "");
      return mod.allowedRoutes.some((r) => {
        const cleanAllowed = r.toLowerCase().replace(/^\/+|\/+$/g, "");
        return cleanRoute === cleanAllowed || cleanRoute.startsWith(`${cleanAllowed}/`);
      });
    },
    [user, accessibleModules, hasAccessToModule],
  );

  return (
    <UserAccessContext.Provider
      value={{
        user,
        accessibleModules,
        entitledModuleKeys,
        allAllowedPaths,
        isLoading,
        error,
        hasAccessToModule,
        hasAccessToRoute,
        refreshAccess: fetchAccess,
      }}
    >
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess() {
  const context = useContext(UserAccessContext);
  if (!context) {
    throw new Error("useUserAccess must be used within a UserAccessProvider");
  }
  return context;
}
