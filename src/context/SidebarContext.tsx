"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DEFAULT_STORAGE_KEY = "realbiz_admin_sidebar_collapsed";

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage read errors in SSR/sandboxed mode
    }
  }, [storageKey]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Ignore write error
      }
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem(storageKey, String(val));
    } catch {
      // Ignore write error
    }
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const setMobileOpen = (val: boolean) => {
    setIsMobileOpen(val);
  };

  // Prevent flash of collapsed state during hydration
  const value: SidebarContextType = {
    isCollapsed: mounted ? isCollapsed : defaultCollapsed,
    toggleCollapse,
    setCollapsed,
    isMobileOpen,
    toggleMobile,
    setMobileOpen,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
