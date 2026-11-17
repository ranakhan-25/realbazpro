"use client";

import React, { useState, useMemo } from "react";
import {
  Building,
  ChevronDown,
  Check,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSelectedProject } from "@/context/CustomerServiceProjectContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CSOrganizationSelectorProps {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function CSOrganizationSelector({
  className = "",
  compact = false,
  showLabel = true,
}: CSOrganizationSelectorProps) {
  const {
    organizationId,
    organization,
    organizations,
    setOrganization,
    isSuperAdmin,
    isLoadingOrgs,
  } = useSelectedProject();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOrgs = useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.code && o.code.toLowerCase().includes(q)),
    );
  }, [organizations, search]);

  // If not Super Admin, organization is fixed to tenant; do not render switcher
  if (!isSuperAdmin) {
    return null;
  }

  // 1. Loading State
  if (isLoadingOrgs) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 shadow-xs ${className}`}
      >
        <Loader2 className="w-4 h-4 text-[#6D4AFF] animate-spin" />
        <span className="text-xs font-medium text-gray-500">Loading orgs…</span>
      </div>
    );
  }

  // 2. Empty State: No organization found in the system
  if (organizations.length === 0) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs shadow-xs ${className}`}
        title="No organizations are registered in the system"
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">No organizations found</span>
      </div>
    );
  }

  // 3. Normal State: Dropdown with Search & Selection
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && !compact && (
        <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">
          Target Org:
        </span>
      )}

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-sm font-medium text-purple-900 shadow-xs transition-all duration-150 outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 cursor-pointer max-w-[240px] sm:max-w-[280px]"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[#6D4AFF] text-white shrink-0">
              <Building className="w-3 h-3" />
            </div>

            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {organization ? organization.name : "Select Target Org"}
              </span>
              {organization?.code && !compact && (
                <span className="text-[10px] text-purple-600 font-mono tracking-tight -mt-0.5 truncate">
                  ID: {organization.id} • {organization.code}
                </span>
              )}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-auto" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-72 sm:w-80 rounded-2xl p-1.5 shadow-xl bg-white border border-gray-100 z-50"
        >
          <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Select Target Organization
          </DropdownMenuLabel>

          {/* Quick Search inside Dropdown */}
          <div className="px-2 pb-1.5">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search org name or code…"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#6D4AFF] text-gray-800 transition"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Organizations List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOrgs.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No matching organizations found
              </div>
            ) : (
              filteredOrgs.map((o) => {
                const isSelected = o.id === organizationId;
                return (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => {
                      setOrganization(o.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? "bg-[#F4F1FF] text-[#6D4AFF] font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate text-xs">{o.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID: {o.id} {o.code ? `• ${o.code}` : ""}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#6D4AFF] shrink-0" />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
