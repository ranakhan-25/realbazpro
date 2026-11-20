"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode2,
  Check,
  Eye,
  Edit,
  Trash2,
  ShieldCheck,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import type { ModuleTreeNode, FeatureNode } from "@/services/moduleTreeService";

export interface FeaturePermissionState {
  isGranted: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove?: boolean;
}

export interface ModuleFeatureAccessTreeSelectorProps {
  modules: ModuleTreeNode[];
  selectedModuleIds: (number | string)[];
  featurePermissions: Record<string | number, FeaturePermissionState>;
  onChange: (
    updatedModuleIds: (number | string)[],
    updatedPermissions: Record<string | number, FeaturePermissionState>,
  ) => void;
  primaryColor?: string;
  isDark?: boolean;
}

/* =========================================================
   INDETERMINATE CHECKBOX
========================================================= */

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
    />
  );
}

/* =========================================================
   HIERARCHY TREE STRUCTURING
========================================================= */

interface TreeNode {
  key: string;
  name: string;
  segment: string;
  routePath?: string;
  isFolder: boolean;
  feature?: FeatureNode;
  children: TreeNode[];
  allFeatureIds: (number | string)[];
}

interface FlattenedRow {
  node: TreeNode;
  prefix: string;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
}

function formatSegmentName(seg: string): string {
  return seg
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildNestedFeatureTree(
  features: FeatureNode[],
  moduleId: string | number,
): TreeNode[] {
  if (!features || features.length === 0) return [];

  const modScope = `mod-${moduleId}`;
  const root: TreeNode = {
    key: `root-${modScope}`,
    name: "root",
    segment: "",
    isFolder: true,
    children: [],
    allFeatureIds: [],
  };

  for (const f of features) {
    const featId = f.id ?? f.uuid ?? f.code;
    const path = (f.routePath || "").trim();

    if (path) {
      const parts = path.split("/").filter(Boolean);
      let curr = root;
      let currPath = "";

      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        currPath += `/${seg}`;
        const isLeaf = i === parts.length - 1;

        let next = curr.children.find((c) => c.segment === seg);
        if (!next) {
          next = {
            key: isLeaf ? `leaf-${modScope}-${featId}` : `dir-${modScope}-${currPath}`,
            segment: seg,
            name: isLeaf ? f.name : formatSegmentName(seg),
            routePath: isLeaf ? f.routePath : currPath,
            isFolder: !isLeaf,
            feature: isLeaf ? f : undefined,
            children: [],
            allFeatureIds: [],
          };
          curr.children.push(next);
        } else if (isLeaf) {
          next.feature = f;
          next.name = f.name;
          next.key = `leaf-${modScope}-${featId}`;
        }
        curr = next;
      }
    } else {
      // Group by name delimiter '|' or plain name
      const nameParts = f.name.includes("|")
        ? f.name.split("|").map((p) => p.trim()).filter(Boolean)
        : [f.name];

      let curr = root;
      for (let i = 0; i < nameParts.length; i++) {
        const seg = nameParts[i];
        const isLeaf = i === nameParts.length - 1;

        let next = curr.children.find((c) => c.segment === seg);
        if (!next) {
          next = {
            key: isLeaf ? `leaf-${modScope}-${featId}` : `dir-${modScope}-${seg}`,
            segment: seg,
            name: seg,
            routePath: f.routePath,
            isFolder: !isLeaf,
            feature: isLeaf ? f : undefined,
            children: [],
            allFeatureIds: [],
          };
          curr.children.push(next);
        } else if (isLeaf) {
          next.feature = f;
          next.name = seg;
          next.key = `leaf-${modScope}-${featId}`;
        }
        curr = next;
      }
    }
  }

  // Compute allFeatureIds bottom up
  function computeFeatureIds(node: TreeNode): (number | string)[] {
    const ids: (number | string)[] = [];
    if (node.feature) {
      const id = node.feature.id ?? node.feature.uuid ?? node.feature.code;
      if (id !== undefined) ids.push(id);
    }
    for (const child of node.children) {
      ids.push(...computeFeatureIds(child));
    }
    node.allFeatureIds = ids;
    return ids;
  }

  computeFeatureIds(root);
  return root.children;
}

function flattenTreeRows(
  nodes: TreeNode[],
  collapsedFolderKeys: Set<string>,
  filterText: string,
  depth = 0,
  prefix = "",
): FlattenedRow[] {
  const result: FlattenedRow[] = [];

  nodes.forEach((node, idx) => {
    const isLast = idx === nodes.length - 1;
    const branchPrefix = prefix + (isLast ? "└─ " : "├─ ");
    const nextPrefix = prefix + (isLast ? "   " : "│  ");
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedFolderKeys.has(node.key);

    result.push({
      node,
      prefix: depth === 0 ? "" : branchPrefix,
      depth,
      hasChildren,
      isCollapsed,
    });

    if (hasChildren && !isCollapsed) {
      result.push(
        ...flattenTreeRows(
          node.children,
          collapsedFolderKeys,
          filterText,
          depth + 1,
          nextPrefix,
        ),
      );
    }
  });

  return result;
}

/* =========================================================
   MAIN ACCESS TREE SELECTOR COMPONENT
========================================================= */

export default function ModuleFeatureAccessTreeSelector({
  modules,
  selectedModuleIds,
  featurePermissions,
  onChange,
  primaryColor = "#0000F2",
}: ModuleFeatureAccessTreeSelectorProps) {
  // Global search input state
  const [globalSearch, setGlobalSearch] = useState("");

  // Per-module search filters: record of moduleId -> search query
  const [moduleFilters, setModuleFilters] = useState<Record<string, string>>({});

  // Expanded module accordion IDs: set of moduleId strings
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(() => {
    // Default open all modules that have features or are selected
    return new Set(modules.map((m) => String(m.id ?? m.uuid ?? "")));
  });

  // Collapsed directory folder keys
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Auto-expand modules on global search
  useEffect(() => {
    if (globalSearch.trim()) {
      setExpandedModuleIds(new Set(modules.map((m) => String(m.id ?? m.uuid ?? ""))));
    }
  }, [globalSearch, modules]);

  // Handle module toggle
  const toggleModule = (modId: number | string) => {
    const key = String(modId);
    const mod = modules.find((m) => String(m.id ?? m.uuid) === key);
    if (!mod) return;

    const isCurrentlySelected = selectedModuleIds.some((id) => String(id) === key);
    let updatedModuleIds: (number | string)[];
    const updatedPerms = { ...featurePermissions };

    const features = mod.features || [];
    if (isCurrentlySelected) {
      // Deselect module and disable all its features
      updatedModuleIds = selectedModuleIds.filter((id) => String(id) !== key);
      features.forEach((f) => {
        const featId = f.id ?? f.uuid ?? f.code;
        if (featId !== undefined) {
          delete updatedPerms[featId];
        }
      });
    } else {
      // Select module and grant full access to all features by default
      updatedModuleIds = [...selectedModuleIds, mod.id ?? modId];
      features.forEach((f) => {
        const featId = f.id ?? f.uuid ?? f.code;
        if (featId !== undefined) {
          updatedPerms[featId] = {
            isGranted: true,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
          };
        }
      });
    }

    onChange(updatedModuleIds, updatedPerms);
  };

  // Toggle single feature grant / permission
  const toggleFeatureOp = (
    modId: number | string,
    featId: number | string,
    op: "grant" | "view" | "write" | "delete",
  ) => {
    const modKey = String(modId);
    const featKey = String(featId);
    const current = featurePermissions[featKey] || {
      isGranted: false,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };

    let next: FeaturePermissionState;

    if (op === "grant") {
      if (current.isGranted) {
        // Revoke
        next = {
          isGranted: false,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      } else {
        // Grant with read + write default
        next = {
          isGranted: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
        };
      }
    } else if (op === "view") {
      const nextView = !current.canView;
      next = {
        ...current,
        canView: nextView,
        isGranted: nextView || current.canCreate || current.canEdit || current.canDelete,
      };
    } else if (op === "write") {
      const nextWrite = !current.canCreate;
      next = {
        ...current,
        canCreate: nextWrite,
        canEdit: nextWrite,
        canView: nextWrite ? true : current.canView, // writing requires viewing
        isGranted: nextWrite || current.canView || current.canDelete,
      };
    } else if (op === "delete") {
      const nextDel = !current.canDelete;
      next = {
        ...current,
        canDelete: nextDel,
        isGranted: nextDel || current.canView || current.canCreate,
      };
    } else {
      next = current;
    }

    const updatedPerms = { ...featurePermissions };
    if (!next.isGranted) {
      delete updatedPerms[featKey];
    } else {
      updatedPerms[featKey] = next;
    }

    // Ensure module is marked selected if at least one feature is granted
    let updatedModuleIds = [...selectedModuleIds];
    const mod = modules.find((m) => String(m.id ?? m.uuid) === modKey);
    const modFeatures = mod?.features || [];
    const anyFeatureGranted = modFeatures.some((f) => {
      const id = f.id ?? f.uuid ?? f.code;
      return String(id) === featKey ? next.isGranted : Boolean(updatedPerms[String(id)]?.isGranted);
    });

    if (anyFeatureGranted && !selectedModuleIds.some((id) => String(id) === modKey)) {
      updatedModuleIds.push(mod?.id ?? modId);
    } else if (!anyFeatureGranted && selectedModuleIds.some((id) => String(id) === modKey)) {
      updatedModuleIds = updatedModuleIds.filter((id) => String(id) !== modKey);
    }

    onChange(updatedModuleIds, updatedPerms);
  };

  // Bulk set for a module
  const bulkSetModule = (modId: number | string, mode: "full" | "read" | "clear") => {
    const modKey = String(modId);
    const mod = modules.find((m) => String(m.id ?? m.uuid) === modKey);
    if (!mod) return;

    const features = mod.features || [];
    const updatedPerms = { ...featurePermissions };
    let updatedModuleIds = [...selectedModuleIds];

    if (mode === "clear") {
      updatedModuleIds = updatedModuleIds.filter((id) => String(id) !== modKey);
      features.forEach((f) => {
        const id = f.id ?? f.uuid ?? f.code;
        if (id !== undefined) delete updatedPerms[String(id)];
      });
    } else {
      if (!updatedModuleIds.some((id) => String(id) === modKey)) {
        updatedModuleIds.push(mod.id ?? modId);
      }
      features.forEach((f) => {
        const id = f.id ?? f.uuid ?? f.code;
        if (id !== undefined) {
          updatedPerms[String(id)] = {
            isGranted: true,
            canView: true,
            canCreate: mode === "full",
            canEdit: mode === "full",
            canDelete: false,
          };
        }
      });
    }

    onChange(updatedModuleIds, updatedPerms);
  };

  // Global bulk actions
  const bulkSetGlobal = (mode: "full" | "read" | "clear") => {
    if (mode === "clear") {
      onChange([], {});
      return;
    }

    const updatedModuleIds: (number | string)[] = [];
    const updatedPerms: Record<string | number, FeaturePermissionState> = {};

    modules.forEach((mod) => {
      const modId = mod.id ?? mod.uuid;
      if (modId !== undefined) {
        updatedModuleIds.push(modId);
      }
      (mod.features || []).forEach((f) => {
        const id = f.id ?? f.uuid ?? f.code;
        if (id !== undefined) {
          updatedPerms[String(id)] = {
            isGranted: true,
            canView: true,
            canCreate: mode === "full",
            canEdit: mode === "full",
            canDelete: false,
          };
        }
      });
    });

    onChange(updatedModuleIds, updatedPerms);
  };

  // Folder collapse toggle
  const toggleFolder = (folderKey: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) {
        next.delete(folderKey);
      } else {
        next.add(folderKey);
      }
      return next;
    });
  };

  // Toggle Subtree for a folder
  const toggleSubtree = (modId: number | string, node: TreeNode) => {
    const allIds = node.allFeatureIds.map(String);
    const allGranted = allIds.every((id) => featurePermissions[id]?.isGranted);

    const updatedPerms = { ...featurePermissions };
    allIds.forEach((id) => {
      if (allGranted) {
        delete updatedPerms[id];
      } else {
        updatedPerms[id] = {
          isGranted: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
        };
      }
    });

    let updatedModuleIds = [...selectedModuleIds];
    const modKey = String(modId);
    if (!allGranted && !selectedModuleIds.some((id) => String(id) === modKey)) {
      updatedModuleIds.push(modId);
    }

    onChange(updatedModuleIds, updatedPerms);
  };

  // Filter modules and count matching features
  const { filteredModules, totalMatches } = useMemo(() => {
    const gQuery = globalSearch.toLowerCase().trim();

    let matches = 0;
    const list = modules.map((mod) => {
      const modKey = String(mod.id ?? mod.uuid ?? "");
      const mQuery = (moduleFilters[modKey] || "").toLowerCase().trim();
      const features = mod.features || [];

      // Check if module matches global query
      const modMatches =
        !gQuery ||
        mod.name.toLowerCase().includes(gQuery) ||
        (mod.code && mod.code.toLowerCase().includes(gQuery)) ||
        (mod.pathRoute && mod.pathRoute.toLowerCase().includes(gQuery));

      // Filter features matching either global or local query
      const filteredFeatures = features.filter((feat) => {
        const matchesGlobal =
          !gQuery ||
          modMatches ||
          feat.name.toLowerCase().includes(gQuery) ||
          feat.code.toLowerCase().includes(gQuery) ||
          (feat.routePath && feat.routePath.toLowerCase().includes(gQuery));

        const matchesModule =
          !mQuery ||
          feat.name.toLowerCase().includes(mQuery) ||
          feat.code.toLowerCase().includes(mQuery) ||
          (feat.routePath && feat.routePath.toLowerCase().includes(mQuery));

        return matchesGlobal && matchesModule;
      });

      if (gQuery || mQuery) {
        matches += filteredFeatures.length;
      }

      return {
        mod,
        filteredFeatures,
        hasMatch: !gQuery && !mQuery ? true : filteredFeatures.length > 0 || modMatches,
      };
    });

    return {
      filteredModules: list.filter((item) => item.hasMatch),
      totalMatches: matches,
    };
  }, [modules, globalSearch, moduleFilters]);

  return (
    <div className="space-y-4">
      {/* GLOBAL SEARCH & BULK TOOLBAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Global Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Global Search across all modules, sub-groups & nested features..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 dark:text-white"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => bulkSetGlobal("full")}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition"
              title="Grant full read and write access across all modules"
            >
              Select All (Full Access)
            </button>
            <button
              type="button"
              onClick={() => bulkSetGlobal("read")}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
              title="Grant view-only read access across all modules"
            >
              Select All (Read Only)
            </button>
            <button
              type="button"
              onClick={() => bulkSetGlobal("clear")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Global Search Status Badge */}
        {globalSearch.trim() && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>
              Found <strong className="text-indigo-600">{totalMatches}</strong> features across{" "}
              <strong className="text-indigo-600">{filteredModules.length}</strong> modules matching &quot;{globalSearch}&quot;
            </span>
            <button
              type="button"
              onClick={() => setGlobalSearch("")}
              className="text-[11px] text-indigo-600 hover:underline font-semibold"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* MODULE LIST ACCORDION */}
      {filteredModules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/40 dark:bg-slate-900/40">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No modules or features matched your search &quot;{globalSearch}&quot;
          </p>
          <button
            type="button"
            onClick={() => setGlobalSearch("")}
            className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredModules.map(({ mod, filteredFeatures }) => {
            const modId = mod.id ?? mod.uuid ?? "";
            const modKey = String(modId);
            const isExpanded = expandedModuleIds.has(modKey);
            const isModSelected = selectedModuleIds.some((id) => String(id) === modKey);

            // Compute granted feature stats for this module
            const totalFeatures = mod.features?.length || 0;
            const grantedCount = (mod.features || []).filter((f) => {
              const fid = f.id ?? f.uuid ?? f.code;
              return Boolean(featurePermissions[String(fid)]?.isGranted);
            }).length;

            const isAllGranted = totalFeatures > 0 && grantedCount === totalFeatures;
            const isPartiallyGranted = grantedCount > 0 && grantedCount < totalFeatures;

            // Build tree rows for this module
            const treeNodes = buildNestedFeatureTree(filteredFeatures, modKey);
            const rows = flattenTreeRows(
              treeNodes,
              collapsedFolders,
              moduleFilters[modKey] || "",
            );

            return (
              <div
                key={modKey}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Module Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  {/* Left: Expand/Collapse + Checkbox + Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedModuleIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(modKey)) next.delete(modKey);
                          else next.add(modKey);
                          return next;
                        });
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
                      aria-label="Expand or collapse module"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <IndeterminateCheckbox
                      checked={isAllGranted || isModSelected}
                      indeterminate={isPartiallyGranted}
                      onChange={() => toggleModule(modId)}
                    />

                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 shadow-2xs">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          {mod.name}
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            ({mod.code})
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {grantedCount} of {totalFeatures} features granted access
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Per-Module Inline Search & Quick Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Per-Module Search Input */}
                    <div className="relative w-44 sm:w-52">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Search in ${mod.name}...`}
                        value={moduleFilters[modKey] || ""}
                        onChange={(e) =>
                          setModuleFilters((prev) => ({
                            ...prev,
                            [modKey]: e.target.value,
                          }))
                        }
                        className="w-full pl-7 pr-6 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                      />
                      {moduleFilters[modKey] && (
                        <button
                          type="button"
                          onClick={() =>
                            setModuleFilters((prev) => ({
                              ...prev,
                              [modKey]: "",
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Quick Module Buttons */}
                    <button
                      type="button"
                      onClick={() => bulkSetModule(modId, "full")}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition whitespace-nowrap"
                    >
                      Full Access
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkSetModule(modId, "read")}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition whitespace-nowrap"
                    >
                      Read Only
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkSetModule(modId, "clear")}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Module Body: Nested Features Tree */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {rows.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        {moduleFilters[modKey]
                          ? `No features found matching "${moduleFilters[modKey]}" in ${mod.name}`
                          : "No nested features registered for this module."}
                      </div>
                    ) : (
                      <div className="min-w-[680px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-[minmax(340px,480px)_minmax(0,1fr)] bg-slate-50/60 dark:bg-slate-800/40 px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          <div>Feature Hierarchy & Path</div>
                          <div className="flex items-center justify-between">
                            <span>Read & Write Access Operations</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Toggle individual access badges
                            </span>
                          </div>
                        </div>

                        {/* Tree Rows */}
                        {rows.map((row, rowIdx) => {
                          const node = row.node;
                          const feat = node.feature;
                          const featId = feat ? feat.id ?? feat.uuid ?? feat.code : undefined;
                          const featKey = featId !== undefined ? String(featId) : "";

                          const totalSubtree = node.allFeatureIds.length;
                          const selectedInSubtree = node.allFeatureIds.filter((id) =>
                            Boolean(featurePermissions[String(id)]?.isGranted),
                          ).length;
                          const isNodeAllSelected =
                            totalSubtree > 0 && selectedInSubtree === totalSubtree;
                          const isNodePartiallySelected =
                            selectedInSubtree > 0 && selectedInSubtree < totalSubtree;

                          const permState = featKey
                            ? featurePermissions[featKey] || {
                                isGranted: false,
                                canView: false,
                                canCreate: false,
                                canEdit: false,
                                canDelete: false,
                              }
                            : null;

                          return (
                            <div
                              key={`${modKey}-${node.key}-${rowIdx}`}
                              className="grid grid-cols-[minmax(340px,480px)_minmax(0,1fr)] border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors"
                            >
                              {/* Left Column: Branch stem + icon + name + route badge */}
                              <div className="flex min-h-[44px] items-center gap-2 px-3 py-2 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                {row.prefix && (
                                  <span className="font-mono text-xs select-none text-slate-400 whitespace-pre">
                                    {row.prefix}
                                  </span>
                                )}

                                {/* Checkbox: folder cascading or leaf */}
                                {row.hasChildren ? (
                                  <IndeterminateCheckbox
                                    checked={isNodeAllSelected}
                                    indeterminate={isNodePartiallySelected}
                                    onChange={() => toggleSubtree(modId, node)}
                                  />
                                ) : featId !== undefined ? (
                                  <IndeterminateCheckbox
                                    checked={Boolean(permState?.isGranted)}
                                    onChange={() => toggleFeatureOp(modId, featId, "grant")}
                                  />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}

                                {/* Icon */}
                                {row.hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleFolder(node.key)}
                                    className="text-amber-500 shrink-0 p-0.5 rounded hover:bg-amber-50 transition"
                                  >
                                    {row.isCollapsed ? (
                                      <Folder className="h-4 w-4" />
                                    ) : (
                                      <FolderOpen className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : (
                                  <FileCode2 className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
                                )}

                                {/* Name & Code Badge */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (row.hasChildren) {
                                        toggleFolder(node.key);
                                      } else if (featId !== undefined) {
                                        toggleFeatureOp(modId, featId, "grant");
                                      }
                                    }}
                                    className={`truncate text-left text-xs transition hover:text-indigo-600 ${
                                      row.hasChildren
                                        ? "font-bold text-slate-900 dark:text-white"
                                        : "font-semibold text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {node.name}
                                  </button>

                                  {(node.routePath || feat?.code) && (
                                    <span className="shrink-0 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                      {node.routePath || feat?.code}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Operations / Read & Write Access Badges */}
                              <div className="flex items-center px-4 py-2 bg-white dark:bg-slate-900">
                                {row.hasChildren ? (
                                  <div className="flex w-full items-center justify-between text-xs text-slate-500">
                                    <span className="text-[11px]">
                                      Group folder &bull;{" "}
                                      <strong className="text-slate-800 dark:text-slate-200">
                                        {selectedInSubtree}
                                      </strong>{" "}
                                      of {totalSubtree} features selected
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleSubtree(modId, node)}
                                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                      {isNodeAllSelected ? "Clear Group" : "Select Group"}
                                    </button>
                                  </div>
                                ) : featId !== undefined && permState ? (
                                  <div className="flex w-full items-center justify-between gap-3">
                                    {/* Read & Write Toggles */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Read Access Pill */}
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureOp(modId, featId, "view")}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                          permState.canView
                                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50"
                                        }`}
                                        title="Click to toggle READ (View Only) permission"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        READ
                                        {permState.canView && <Check className="w-3 h-3 text-emerald-600" />}
                                      </button>

                                      {/* Write Access Pill */}
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureOp(modId, featId, "write")}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                          permState.canCreate || permState.canEdit
                                            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50"
                                        }`}
                                        title="Click to toggle WRITE (Create & Edit) permission"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        WRITE
                                        {(permState.canCreate || permState.canEdit) && (
                                          <Check className="w-3 h-3 text-blue-600" />
                                        )}
                                      </button>

                                      {/* Delete Access Pill */}
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureOp(modId, featId, "delete")}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                          permState.canDelete
                                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50"
                                        }`}
                                        title="Click to toggle DELETE permission"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        DELETE
                                      </button>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        permState.isGranted && (permState.canCreate || permState.canEdit)
                                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                          : permState.isGranted && permState.canView
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                      }`}
                                    >
                                      {permState.isGranted && (permState.canCreate || permState.canEdit)
                                        ? "Full CRUD"
                                        : permState.isGranted && permState.canView
                                          ? "Read-Only"
                                          : "Revoked"}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
