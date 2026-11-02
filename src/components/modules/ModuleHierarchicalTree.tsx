"use client";

import React, { useMemo, useState } from "react";
import { Tree, Tag, Tooltip } from "antd";
import type { DataNode } from "antd/es/tree";
import {
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Layers,
  FolderKanban,
  ShieldCheck,
  Link2,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";
import type { FeatureNode, ModuleTreeNode } from "@/services/moduleTreeService";

export interface HierarchicalFeatureGroup {
  key: string;
  name: string;
  icon?: string;
  pathRoute?: string;
  isGroup: boolean;
  feature?: FeatureNode;
  featureIndex?: number;
  children: HierarchicalFeatureGroup[];
}

export interface ModuleHierarchicalTreeProps {
  module: ModuleTreeNode;
  primaryColor?: string;
  onEditModule?: (mod: ModuleTreeNode) => void;
  onDeleteModule?: (mod: ModuleTreeNode) => void;
  onAddFeature?: (mod: ModuleTreeNode, parentGroup?: string) => void;
  onEditFeature?: (mod: ModuleTreeNode, featureIndex: number) => void;
  onDeleteFeature?: (mod: ModuleTreeNode, feature: FeatureNode) => void;
  variant?: "tree" | "visual-cards";
  searchQuery?: string;
}

/**
 * Parses flat features into a multi level hierarchy using namespace prefixes (e.g. "Group | Sub Feature")
 * or route path structures.
 */
export function buildFeatureHierarchy(features: FeatureNode[]): HierarchicalFeatureGroup[] {
  const groupMap = new Map<string, HierarchicalFeatureGroup>();
  const rootItems: HierarchicalFeatureGroup[] = [];

  features.forEach((feat, idx) => {
    const rawName = feat.name || "";

    // Check if name has a delimiter like '|' or '>' or '::'
    let groupName = "";
    let itemName = rawName;

    if (rawName.includes("|")) {
      const parts = rawName.split("|").map((p) => p.trim());
      groupName = parts[0];
      itemName = parts.slice(1).join(" | ");
    } else if (rawName.includes(">")) {
      const parts = rawName.split(">").map((p) => p.trim());
      groupName = parts[0];
      itemName = parts.slice(1).join(" > ");
    } else if (rawName.includes("::")) {
      const parts = rawName.split("::").map((p) => p.trim());
      groupName = parts[0];
      itemName = parts.slice(1).join("::");
    }

    const uniqueFeatKey = feat.id
      ? `feat-${feat.id}-${idx}`
      : feat.code
        ? `feat-${feat.code}-${idx}`
        : `feat-${idx}`;

    const itemNode: HierarchicalFeatureGroup = {
      key: uniqueFeatKey,
      name: itemName || rawName,
      isGroup: false,
      feature: { ...feat, name: itemName || rawName },
      featureIndex: idx,
      children: [],
    };

    if (groupName) {
      // Normalize group key so "Configuration" and "configuration" merge into the same group
      const normalizedGroupKey = groupName.toLowerCase().trim().replace(/\s+/g, "-");
      if (!groupMap.has(normalizedGroupKey)) {
        const displayName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
        const newGroup: HierarchicalFeatureGroup = {
          key: `group-${normalizedGroupKey}`,
          name: displayName,
          isGroup: true,
          children: [],
        };
        groupMap.set(normalizedGroupKey, newGroup);
        rootItems.push(newGroup);
      }
      groupMap.get(normalizedGroupKey)!.children.push(itemNode);
    } else {
      rootItems.push(itemNode);
    }
  });

  return rootItems;
}

export default function ModuleHierarchicalTree({
  module,
  primaryColor = "#0000F2",
  onEditModule,
  onDeleteModule,
  onAddFeature,
  onEditFeature,
  onDeleteFeature,
  variant = "tree",
  searchQuery = "",
}: ModuleHierarchicalTreeProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const hierarchy = useMemo(() => {
    return buildFeatureHierarchy(module.features || []);
  }, [module.features]);

  // Toggle group collapse
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Build Ant Design Tree Data Nodes
  const treeData = useMemo<DataNode[]>(() => {
    const q = searchQuery.toLowerCase().trim();

    const renderActionTag = (actionType?: string) => {
      const type = (actionType || "read").toLowerCase();
      let color = "default";
      if (type === "write" || type === "create") color = "blue";
      if (type === "manage" || type === "admin") color = "purple";
      if (type === "delete") color = "red";
      if (type === "export" || type === "report") color = "gold";
      return (
        <Tag color={color} className="text-[10px] m-0 px-1 py-0 font-bold uppercase">
          {type}
        </Tag>
      );
    };

    const mapGroupToNode = (grp: HierarchicalFeatureGroup): DataNode => {
      if (grp.isGroup) {
        return {
          key: grp.key,
          title: (
            <div className="flex items-center justify-between gap-3 py-1 group/row">
              <div className="flex items-center gap-2">
                <FolderOutlined className="text-indigo-500 text-sm" />
                <span className="font-bold text-slate-800 text-xs">{grp.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700">
                  {grp.children.length} {grp.children.length === 1 ? "action" : "actions"}
                </span>
              </div>
              <div className="opacity-0 group-hover/row:opacity-100 transition flex items-center gap-1">
                {onAddFeature && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFeature(module, grp.name);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                    title={`Add feature under ${grp.name}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ),
          children: grp.children.map(mapGroupToNode),
        };
      }

      const feat = grp.feature!;
      const featIdx = grp.featureIndex ?? 0;

      return {
        key: grp.key,
        title: (
          <div className="flex items-center justify-between gap-3 py-1 group/row">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-xs">{feat.name}</span>
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                {feat.code}
              </span>
              {feat.routePath && (
                <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {feat.routePath}
                </span>
              )}
              {renderActionTag(feat.actionType)}
            </div>

            <div className="opacity-0 group-hover/row:opacity-100 transition flex items-center gap-1">
              {onEditFeature && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFeature(module, featIdx);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                  title="Edit feature"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
              {onDeleteFeature && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFeature(module, feat);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete feature"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ),
      };
    };

    // Filter by query if provided
    let filteredHierarchy = hierarchy;
    if (q) {
      filteredHierarchy = hierarchy
        .map((grp) => {
          if (grp.isGroup) {
            const matchingChildren = grp.children.filter((c) => {
              const feat = c.feature;
              return (
                feat?.name.toLowerCase().includes(q) ||
                feat?.code.toLowerCase().includes(q) ||
                (feat?.routePath && feat.routePath.toLowerCase().includes(q))
              );
            });
            if (matchingChildren.length > 0 || grp.name.toLowerCase().includes(q)) {
              return { ...grp, children: matchingChildren };
            }
            return null;
          }
          const feat = grp.feature;
          if (
            feat?.name.toLowerCase().includes(q) ||
            feat?.code.toLowerCase().includes(q) ||
            (feat?.routePath && feat.routePath.toLowerCase().includes(q))
          ) {
            return grp;
          }
          return null;
        })
        .filter(Boolean) as HierarchicalFeatureGroup[];
    }

    // Root module node wrapping the children
    return [
      {
        key: `module-${module.id || module.code}`,
        title: (
          <div className="flex items-center justify-between gap-3 py-1 group/row">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{module.name}</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {module.code}
              </span>
              {module.pathRoute && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {module.pathRoute}
                </span>
              )}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {module.features?.length || 0} Features
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onAddFeature && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFeature(module);
                  }}
                  className="px-2 py-1 rounded text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Feature
                </button>
              )}
              {onEditModule && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditModule(module);
                  }}
                  className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              )}
              {onDeleteModule && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModule(module);
                  }}
                  className="px-2 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
            </div>
          </div>
        ),
        children: filteredHierarchy.map(mapGroupToNode),
      },
    ];
  }, [module, hierarchy, searchQuery, onAddFeature, onEditFeature, onDeleteFeature, onEditModule, onDeleteModule]);

  if (variant === "tree") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <Tree
          showLine={{ showLeafIcon: false }}
          defaultExpandAll
          treeData={treeData}
          className="font-sans text-xs [&_.ant-tree-node-content-wrapper]:w-full [&_.ant-tree-title]:w-full"
        />
      </div>
    );
  }

  // Visual branch cards variant (used for Architecture Preview)
  return (
    <div className="space-y-4">
      {/* Root Module Card */}
      <div className="relative flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Layers className="h-6 w-6" />
        </div>
        <div className="flex-1 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Root Module
              </span>
              <span className="rounded-md bg-indigo-600 text-white font-mono text-xs px-2 py-0.5 font-bold">
                {module.code || "MODULE_CODE"}
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {module.isActive ? "Active" : "Disabled"}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {module.name || "Untitled Module"}
          </h4>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">
            <span>Path: {module.pathRoute || "None"}</span>
            <span>Order: #{module.displayOrder || 1}</span>
            <span>Icon: {module.icon || "Layers"}</span>
            <span>Nested Count: {module.features?.length || 0} features</span>
          </div>
        </div>
      </div>

      {/* Hierarchical Branches with Connector Line */}
      <div className="relative pl-6 ml-6 border-l-2 border-dashed border-indigo-300 dark:border-indigo-800 space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hierarchical Feature Tree ({hierarchy.length} Root Groups)
          </span>
        </div>

        {hierarchy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
            No nested features attached yet.
          </div>
        ) : (
          hierarchy.map((grp) => {
            if (grp.isGroup) {
              const isCollapsed = !!collapsedGroups[grp.key];

              return (
                <div key={grp.key} className="relative space-y-2">
                  {/* Stem line to group */}
                  <div className="absolute -left-6 top-5 -mt-px w-6 border-t-2 border-dashed border-indigo-300 dark:border-indigo-800" />

                  {/* Group Header Card */}
                  <div
                    onClick={() => toggleGroup(grp.key)}
                    className="flex items-center justify-between rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 cursor-pointer hover:bg-indigo-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-700 transition"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <FolderKanban className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {grp.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-100">
                        {grp.children.length} {grp.children.length === 1 ? "Action" : "Actions"}
                      </span>
                    </div>

                    {onAddFeature && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddFeature(module, grp.name);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Sub-item
                      </button>
                    )}
                  </div>

                  {/* Children under Group */}
                  {!isCollapsed && (
                    <div className="relative pl-6 ml-4 border-l-2 border-dashed border-indigo-200 dark:border-indigo-900 space-y-2 pt-1">
                      {grp.children.map((child) => {
                        const feat = child.feature!;
                        const featIdx = child.featureIndex ?? 0;
                        const actionBadgeColor =
                          feat.actionType === "manage" || feat.actionType === "admin"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : feat.actionType === "write"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : feat.actionType === "delete"
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                          <div
                            key={child.key}
                            className="relative flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs hover:border-indigo-300 transition"
                          >
                            <div className="absolute -left-6 top-1/2 -mt-px w-6 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900" />

                            <div className="flex items-center gap-2.5">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {feat.name}
                                  </span>
                                  <span className="font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                                    {feat.code}
                                  </span>
                                  {feat.routePath && (
                                    <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                                      <Link2 className="h-3 w-3" />
                                      {feat.routePath}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${actionBadgeColor}`}
                              >
                                {feat.actionType || "read"}
                              </span>
                              {onEditFeature && (
                                <button
                                  type="button"
                                  onClick={() => onEditFeature(module, featIdx)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                              )}
                              {onDeleteFeature && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteFeature(module, feat)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standalone Leaf Node directly under Module
            const feat = grp.feature!;
            const featIdx = grp.featureIndex ?? 0;
            const actionBadgeColor =
              feat.actionType === "manage" || feat.actionType === "admin"
                ? "bg-purple-100 text-purple-700 border-purple-200"
                : feat.actionType === "write"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : feat.actionType === "delete"
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <div
                key={grp.key}
                className="relative flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs hover:border-indigo-300 transition"
              >
                <div className="absolute -left-6 top-1/2 -mt-px w-6 border-t-2 border-dashed border-indigo-300 dark:border-indigo-800" />

                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {feat.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                        {feat.code}
                      </span>
                      {feat.routePath && (
                        <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {feat.routePath}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${actionBadgeColor}`}
                  >
                    {feat.actionType || "read"}
                  </span>
                  {onEditFeature && (
                    <button
                      type="button"
                      onClick={() => onEditFeature(module, featIdx)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                  {onDeleteFeature && (
                    <button
                      type="button"
                      onClick={() => onDeleteFeature(module, feat)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
