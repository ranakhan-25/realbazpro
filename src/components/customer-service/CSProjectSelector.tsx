"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
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
export { CSSelectProjectEmptyState } from "./CSSelectProjectEmptyState";

interface CSProjectSelectorProps {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function CSProjectSelector({
  className = "",
  compact = false,
  showLabel = true,
}: CSProjectSelectorProps) {
  const {
    projectId,
    project,
    projects,
    setProject,
    isLoading,
    refetchProjects,
  } = useSelectedProject();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)),
    );
  }, [projects, search]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 shadow-xs ${className}`}
      >
        <Loader2 className="w-4 h-4 text-[#6D4AFF] animate-spin" />
        <span className="text-xs font-medium text-gray-500">Loading projects…</span>
      </div>
    );
  }

  // 2. Empty State: No project found for current organization
  if (projects.length === 0) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs shadow-xs ${className}`}
        title="No projects have been provisioned or assigned to your organization yet"
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">No project found for your organization</span>
        <button
          type="button"
          onClick={() => refetchProjects()}
          className="ml-1 p-0.5 hover:bg-amber-100 rounded text-amber-700 transition"
          title="Retry fetching projects"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // 3. Normal State: Dropdown with Search & Selection
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && !compact && (
        <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">
          Active Project:
        </span>
      )}

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/90 text-sm font-medium text-gray-800 shadow-xs transition-all duration-150 outline-none focus:ring-2 focus:ring-[#6D4AFF]/20 cursor-pointer max-w-[280px] sm:max-w-[340px]"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {project ? project.name : "Select Project"}
              </span>
              {project?.code && !compact && (
                <span className="text-[10px] text-gray-400 font-mono tracking-tight -mt-0.5 truncate">
                  {project.code}
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
            Select Organization Project
          </DropdownMenuLabel>

          {/* Quick Search inside Dropdown */}
          <div className="px-2 pb-1.5">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project name or code…"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#6D4AFF] text-gray-800 transition"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No matching projects found
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = p.uuid === projectId;
                return (
                  <DropdownMenuItem
                    key={p.uuid}
                    onClick={() => {
                      setProject(p.uuid);
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
                      <span className="truncate text-xs">{p.name}</span>
                      {p.code && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {p.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.status && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#6D4AFF]" />
                      )}
                    </div>
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

