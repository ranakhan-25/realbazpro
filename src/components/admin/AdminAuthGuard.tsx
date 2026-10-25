"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredUserProfile,
} from "@/lib/admin-auth/adminAuthStorage";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    const user = getStoredUserProfile();

    if (!token) {
      clearStoredTokens();
      router.replace("/admin/login");
      return;
    }

    // Optional check: verify user has admin status if profile is present
    if (user && !user.isSuperUser && !user.isOrgAdmin && !user.roles?.includes("super-admin")) {
      clearStoredTokens();
      router.replace("/admin/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] text-sm text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Checking admin session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
