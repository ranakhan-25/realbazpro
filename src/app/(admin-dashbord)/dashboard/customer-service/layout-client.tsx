"use client";

import React from "react";
import {
  CustomerServiceProjectProvider,
  useSelectedProject,
} from "@/context/CustomerServiceProjectContext";
import { CSProjectSelector } from "@/components/customer-service/CSProjectSelector";
import { CSOrganizationSelector } from "@/components/customer-service/CSOrganizationSelector";
import { AlertCircle, Building2, Building } from "lucide-react";

function CustomerServiceTopBar() {
  const { project, projects, isLoading, isSuperAdmin, organization } =
    useSelectedProject();

  return (
    <div className="border-b border-gray-200/80 bg-white/95 backdrop-blur-xs sticky top-0 z-30 px-6 py-2.5 shadow-2xs mb-6 -mx-6 sm:-mx-8 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Organization (Super Admin) & Project Selector Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
                <Building className="w-3.5 h-3.5 text-[#6D4AFF]" />
                <span className="hidden sm:inline">Organization</span>
              </span>
              <CSOrganizationSelector showLabel={false} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#6D4AFF]" />
              <span className="hidden sm:inline">Workspace Project</span>
            </span>
          </div>

          <CSProjectSelector />
        </div>

        {/* Right: Project context & Scoping indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isSuperAdmin && organization && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
              <Building className="w-3 h-3 text-purple-600" />
              Org: {organization.name}
            </span>
          )}
          {!isLoading && projects.length > 0 && project && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Scoped to: {project.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Empty State Banner across customer service if organization has 0 projects */}
      {!isLoading && projects.length === 0 && (
        <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>No project found for your organization.</strong> Customer
            service records are scoped per-project. Please contact your
            administrator to provision projects for your organization.
          </span>
        </div>
      )}
    </div>
  );
}

export function CustomerServiceLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerServiceProjectProvider>
      <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 sm:p-8 bg-[#F9FAFB]/60">
        <CustomerServiceTopBar />
        <main className="flex-1 w-full min-w-0">{children}</main>
      </div>
    </CustomerServiceProjectProvider>
  );
}
