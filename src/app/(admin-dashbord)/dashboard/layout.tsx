/* eslint-disable prettier/prettier */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { getSession, type Session } from "@/lib/auth";
import { isModuleKey, type ModuleKey } from "@/lib/menus";
import { UserAccessProvider, useUserAccess } from "@/context/UserAccessContext";

function DashboardAccessGuard({
  moduleKey,
  activePath,
  isHubRoot,
  children,
}: {
  moduleKey: ModuleKey;
  activePath: string;
  isHubRoot?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { accessibleModules, hasAccessToModule, hasAccessToRoute, isLoading } = useUserAccess();

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Verifying Workspace Entitlements…
          </p>
        </div>
      </div>
    );
  }

  // Universal Dashboard Hub root is always allowed for authenticated sessions
  if (isHubRoot) {
    return <>{children}</>;
  }

  // Anti-sneak zero-trust validation
  const isModuleAllowed = hasAccessToModule(moduleKey);
  const isRouteAllowed = isModuleAllowed && hasAccessToRoute(moduleKey, activePath);

  if (!isModuleAllowed || !isRouteAllowed) {
    const fallbackModule = accessibleModules.length > 0 ? accessibleModules[0].key : null;
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-xl shadow-red-500/5">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
            Security Block (403)
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Unauthorized Route Access
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            You do not possess entitlement permissions for module{" "}
            <span className="font-semibold text-slate-800 uppercase">{moduleKey}</span>
            {activePath ? (
              <>
                {" "}or path{" "}
                <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {activePath}
                </code>
              </>
            ) : null}
            . Direct URL navigation has been blocked by system access policy.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {fallbackModule ? (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/${fallbackModule}`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Go to Accessible Workspace ({fallbackModule.toUpperCase()})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function DashboardContent({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { accessibleModules } = useUserAccess();

  const isHubRoot = pathname === "/dashboard" || pathname === "/dashboard/";
  const rest = pathname.replace(/^\/dashboard\/?/, "");
  const [first = "", ...restParts] = rest.split("/").filter(Boolean);
  const defaultModuleKey: ModuleKey =
    accessibleModules.length > 0 ? (accessibleModules[0].key as ModuleKey) : "project";
  const moduleKey: ModuleKey = isModuleKey(first) ? first : defaultModuleKey;
  const activePath = restParts.join("/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar
        session={session}
        onMenu={() => setOpen(true)}
        search={search}
        onSearch={setSearch}
      />
      <div className="flex">
        <Sidebar
          module={moduleKey}
          activePath={activePath}
          open={open}
          onClose={() => setOpen(false)}
          filter={search}
        />
        <main className="min-w-0 flex-1">
          <DashboardAccessGuard
            moduleKey={moduleKey}
            activePath={activePath}
            isHubRoot={isHubRoot}
          >
            {children}
          </DashboardAccessGuard>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const s = getSession();
    if (!s) router.replace("/login");
    else setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  return (
    <UserAccessProvider>
      <DashboardContent session={session}>{children}</DashboardContent>
    </UserAccessProvider>
  );
}
