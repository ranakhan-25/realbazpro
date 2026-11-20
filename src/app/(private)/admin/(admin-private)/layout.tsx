"use client";

import React from "react";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 transition-colors">
      <AdminSidebar />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <AdminTopbar />

        <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
