"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredUserProfile,
} from "@/lib/admin-auth/adminAuthStorage";

// Routes exclusively reserved for Platform Super Administrators
const SUPER_ADMIN_ONLY_PREFIXES = [
  "/admin/plans",
  "/admin/orgs",
  "/admin/modules",
  "/admin/menus",
  "/admin/audit",
  "/admin/agreements",
  "/admin/config",
  "/admin/usage",
];

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    const user = getStoredUserProfile();

    if (!token) {
      clearStoredTokens();
      router.replace("/login");
      return;
    }

    const isSuperAdmin = Boolean(
      user?.isSuperUser === true ||
        user?.role === "super-admin" ||
        (Array.isArray(user?.roles) && user.roles.includes("super-admin"))
    );

    const isOrgAdmin = Boolean(
      user?.isOrgAdmin === true ||
        user?.role === "org-admin" ||
        (Array.isArray(user?.roles) && user.roles.includes("org-admin"))
    );

    // Verify user has any administrative standing
    if (user && !isSuperAdmin && !isOrgAdmin) {
      clearStoredTokens();
      router.replace("/login");
      return;
    }

    // Role-based anti-sneak route protection for Super Admin exclusive views
    if (!isSuperAdmin) {
      const isRestricted = SUPER_ADMIN_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (isRestricted) {
        toast.error("Access restricted: Requires Super Administrator privileges");
        router.replace("/admin/dashboard");
        return;
      }
    }

    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] text-sm text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Verifying admin session and permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
