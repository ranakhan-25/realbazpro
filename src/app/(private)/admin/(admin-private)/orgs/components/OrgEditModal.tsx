/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { getPlans, type Plan } from "@/services/planService";
import {
  updateOrganization,
  updateSubscription,
  getOrganizationEntitlements,
  updateOrganizationEntitlements,
  type Organization,
  type EntitledModule,
} from "@/services/organizationService";
import {
  getModuleTree,
  type ModuleTreeNode,
  type FeatureNode,
} from "@/services/moduleTreeService";
import { toast } from "sonner";
import {
  Building2,
  X,
  CreditCard,
  Users,
  HardDrive,
  FolderKanban,
  ShieldCheck,
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode2,
  CheckCircle2,
  Check,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Sparkles,
} from "lucide-react";
import type { FeaturePermissionState } from "@/components/modules/ModuleFeatureAccessTreeSelector";

export interface OrgEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgData: any;
  onUpdate: (uuid: string, payload: any) => void;
  initialTab?: "general" | "entitlements";
}

/* =========================================================
   REUSABLE INDETERMINATE CHECKBOX COMPONENT
========================================================= */

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: CheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      aria-label={ariaLabel}
      onChange={(event) => {
        event.stopPropagation();
        onChange();
      }}
      onClick={(event) => event.stopPropagation()}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
    />
  );
}

/* =========================================================
   PATH NESTED TREE DATA STRUCTURES & BUILDER
========================================================= */

export interface OrgFeatureTreeNode {
  key: string;
  name: string;
  segment: string;
  routePath: string;
  isFolder: boolean;
  feature?: FeatureNode;
  children: OrgFeatureTreeNode[];
  depth: number;
  allSubtreeFeatureIds: (number | string)[];
}

export interface FlattenedOrgTreeRow {
  node: OrgFeatureTreeNode;
  prefix: string;
  hasChildren: boolean;
  isCollapsed: boolean;
}

function formatSegmentName(seg: string): string {
  return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildPathNestedTree(
  features: FeatureNode[],
  modulePath?: string,
  moduleId?: string | number,
): OrgFeatureTreeNode[] {
  if (!features || features.length === 0) return [];

  const modScope =
    moduleId !== undefined && moduleId !== null ? `mod-${moduleId}` : "mod";
  const paths = features.map((f) => f.routePath).filter(Boolean) as string[];

  // Find longest common prefix ending with / (e.g. /dashboard/project)
  let commonPrefix = "";
  if (paths.length > 0) {
    const firstParts = paths[0].split("/").filter(Boolean);
    if (firstParts.length >= 2) {
      const candidate = `/${firstParts[0]}/${firstParts[1]}`;
      if (paths.every((p) => p.startsWith(candidate))) {
        commonPrefix = candidate;
      }
    }
  }
  if (!commonPrefix && modulePath) {
    commonPrefix = modulePath.endsWith("/")
      ? modulePath.slice(0, -1)
      : modulePath;
  }

  interface RawNode {
    key: string;
    segment: string;
    name: string;
    routePath: string;
    isFolder: boolean;
    feature?: FeatureNode;
    children: RawNode[];
  }

  const root: RawNode = {
    key: modScope,
    segment: "",
    name: "root",
    routePath: "",
    isFolder: true,
    children: [],
  };

  for (const f of features) {
    let p = (f.routePath || "").trim();

    if (p) {
      if (commonPrefix && p.startsWith(commonPrefix)) {
        p = p.slice(commonPrefix.length);
      }
      const segments = p.split("/").filter(Boolean);
      if (segments.length === 0) {
        segments.push(f.name);
      }

      let curr = root;
      let currPath = commonPrefix;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        currPath += `/${seg}`;
        const isLeaf = i === segments.length - 1;

        let next = curr.children.find((c) => c.segment === seg);
        if (!next) {
          next = {
            key: isLeaf
              ? `feat-leaf-${modScope}-${f.id ?? f.uuid ?? currPath}`
              : `folder-${modScope}-${currPath}`,
            segment: seg,
            name: isLeaf ? f.name : formatSegmentName(seg),
            routePath: currPath,
            isFolder: !isLeaf,
            feature: isLeaf ? f : undefined,
            children: [],
          };
          curr.children.push(next);
        } else if (isLeaf) {
          next.feature = f;
          next.name = f.name;
          next.key = `feat-leaf-${modScope}-${f.id ?? f.uuid ?? currPath}`;
        }
        curr = next;
      }
    } else {
      // Features without routePath: check if name has delimiter '|' or '/'
      const nameParts = f.name.includes("|")
        ? f.name
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : f.name.includes("/")
          ? f.name
              .split("/")
              .map((s) => s.trim())
              .filter(Boolean)
          : [f.name];

      let curr = root;
      for (let i = 0; i < nameParts.length; i++) {
        const seg = nameParts[i];
        const segSlug = seg.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const isLeaf = i === nameParts.length - 1;

        let next = curr.children.find((c) => c.segment === seg);
        if (!next) {
          next = {
            key: isLeaf
              ? `feat-leaf-${modScope}-${f.id ?? f.uuid ?? `${curr.key}-${segSlug}`}`
              : `folder-${curr.key}-${segSlug}`,
            segment: seg,
            name: seg,
            routePath: isLeaf ? f.code : "",
            isFolder: !isLeaf,
            feature: isLeaf ? f : undefined,
            children: [],
          };
          curr.children.push(next);
        } else if (isLeaf) {
          next.feature = f;
          next.name = seg;
          next.key = `feat-leaf-${modScope}-${f.id ?? f.uuid ?? `${curr.key}-${segSlug}`}`;
        }
        curr = next;
      }
    }
  }

  function finalize(rawNodes: RawNode[], depth: number): OrgFeatureTreeNode[] {
    rawNodes.sort((a, b) => {
      const aHasChildren = a.children.length > 0;
      const bHasChildren = b.children.length > 0;
      if (aHasChildren !== bHasChildren) {
        return aHasChildren ? -1 : 1;
      }
      const orderA = a.feature?.displayOrder ?? 999;
      const orderB = b.feature?.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return rawNodes.map((raw) => {
      const children = finalize(raw.children, depth + 1);
      const isFolder = raw.isFolder || children.length > 0;

      const selfFeatId =
        raw.feature?.id !== undefined && raw.feature?.id !== null
          ? raw.feature.id
          : raw.feature?.uuid;
      const selfIds: (number | string)[] =
        selfFeatId !== undefined && selfFeatId !== null ? [selfFeatId] : [];
      const childIds = children.flatMap((c) => c.allSubtreeFeatureIds);
      const allSubtreeFeatureIds = Array.from(
        new Set([...selfIds, ...childIds]),
      );

      return {
        key: raw.key,
        name: raw.name,
        segment: raw.segment,
        routePath: raw.routePath,
        isFolder,
        feature: raw.feature,
        children,
        depth,
        allSubtreeFeatureIds,
      };
    });
  }

  return finalize(root.children, 0);
}

export function flattenTreeForDisplay(
  nodes: OrgFeatureTreeNode[],
  collapsedKeys: Set<string>,
  searchQuery: string,
  ancestorIsLast: boolean[] = [],
): FlattenedOrgTreeRow[] {
  const result: FlattenedOrgTreeRow[] = [];
  const q = searchQuery.trim().toLowerCase();

  function nodeMatches(n: OrgFeatureTreeNode): boolean {
    if (!q) return true;
    if (n.name.toLowerCase().includes(q)) return true;
    if (n.routePath.toLowerCase().includes(q)) return true;
    if (n.feature?.code?.toLowerCase().includes(q)) return true;
    return n.children.some(nodeMatches);
  }

  const visibleNodes = q ? nodes.filter(nodeMatches) : nodes;

  visibleNodes.forEach((node, idx) => {
    const isLast = idx === visibleNodes.length - 1;

    let prefix = "";
    for (const last of ancestorIsLast) {
      prefix += last ? "    " : "│   ";
    }
    prefix += isLast ? "└── " : "├── ";

    const hasChildren = node.children.length > 0;
    const isCollapsed = q ? false : collapsedKeys.has(node.key);

    result.push({
      node,
      prefix,
      hasChildren,
      isCollapsed,
    });

    if (hasChildren && !isCollapsed) {
      result.push(
        ...flattenTreeForDisplay(node.children, collapsedKeys, searchQuery, [
          ...ancestorIsLast,
          isLast,
        ]),
      );
    }
  });

  return result;
}

/* =========================================================
   MAIN ORG EDIT MODAL
========================================================= */

export default function OrgEditModal({
  isOpen,
  onClose,
  orgData,
  onUpdate,
  initialTab = "general",
}: OrgEditModalProps) {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  // Active Tab: "general" | "entitlements"
  const [activeTab, setActiveTab] = useState<"general" | "entitlements">(
    initialTab,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

  // General Form States
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Module & Feature Entitlements States
  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<
    Record<string, (number | string)[]>
  >({});
  const [featurePermissions, setFeaturePermissions] = useState<
    Record<string | number, FeaturePermissionState>
  >({});
  const [expandedModuleKeys, setExpandedModuleKeys] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedFolderKeys, setCollapsedFolderKeys] = useState<Set<string>>(
    new Set(),
  );
  const [featureSearch, setFeatureSearch] = useState<string>("");
  const [moduleSearchMap, setModuleSearchMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!isOpen || !orgData) return;
    setActiveTab(initialTab || "general");

    const identifier = orgData.id || orgData.uuid;

    setIsLoadingDependencies(true);
    Promise.all([
      getPlans({ status: "active" }).catch((err) => {
        console.warn("Failed to load plans:", err);
        return [];
      }),
      getModuleTree().catch((err) => {
        console.warn("Failed to load module tree:", err);
        return [];
      }),
      getOrganizationEntitlements(identifier).catch((err) => {
        console.warn("Failed to load entitlements:", err);
        return [];
      }),
    ])
      .then(([plansData, treeData, entsData]) => {
        if (plansData && plansData.length > 0) setPlans(plansData);
        if (treeData && treeData.length > 0) setModuleTree(treeData);

        // Pre-populate selectedFeatures and featurePermissions from entitlements
        const initialMap: Record<string, (number | string)[]> = {};
        const initialPerms: Record<string | number, FeaturePermissionState> =
          {};

        // 1. Initialize all modules in the tree with empty selection
        for (const mod of treeData || []) {
          const modKey = String(mod.id ?? mod.uuid ?? "");
          if (modKey) initialMap[modKey] = [];
        }

        // 2. Map existing active entitlements
        const sourceEnts =
          Array.isArray(entsData) && entsData.length > 0
            ? entsData
            : orgData.entitledModules && Array.isArray(orgData.entitledModules)
              ? orgData.entitledModules
              : [];

        if (sourceEnts.length > 0) {
          for (const ent of sourceEnts) {
            const modKey = String(ent.moduleId);
            const featIds: (number | string)[] = [];
            for (const f of ent.features || []) {
              if (f.featureId !== undefined && f.featureId !== null) {
                featIds.push(f.featureId);
                initialPerms[String(f.featureId)] = {
                  isGranted: true,
                  canView: f.canView ?? true,
                  canCreate: f.canCreate ?? true,
                  canEdit: f.canEdit ?? true,
                  canDelete: f.canDelete ?? false,
                };
              }
            }
            initialMap[modKey] = featIds;
          }
        }

        setSelectedFeatures(initialMap);
        setFeaturePermissions(initialPerms);

        // Expand modules that have active entitlements
        const activeModKeys = Object.entries(initialMap)
          .filter(([, fIds]) => fIds && fIds.length > 0)
          .map(([mKey]) => mKey);

        if (activeModKeys.length > 0) {
          setExpandedModuleKeys(new Set(activeModKeys));
        } else if (treeData && treeData.length > 0) {
          // Default expand first 3 modules if none active yet
          setExpandedModuleKeys(
            new Set(treeData.slice(0, 3).map((m) => String(m.id))),
          );
        }
      })
      .finally(() => {
        setIsLoadingDependencies(false);
      });
  }, [isOpen, orgData]);

  useEffect(() => {
    if (orgData?.plan?.id) {
      setSelectedPlanId(String(orgData.plan.id));
    } else if (orgData?.planId) {
      setSelectedPlanId(String(orgData.planId));
    }
  }, [orgData]);

  if (!isOpen || !orgData) return null;

  // Compute Total Entitlement Counts
  const totalAvailableModules = moduleTree.length;
  const totalAvailableFeatures = moduleTree.reduce(
    (acc, m) => acc + (m.features?.length || 0),
    0,
  );

  const selectedModulesCount = Object.entries(selectedFeatures).filter(
    ([, fIds]) => fIds && fIds.length > 0,
  ).length;

  const totalSelectedFeaturesCount = Object.values(selectedFeatures).reduce(
    (acc, fIds) => acc + (fIds?.length || 0),
    0,
  );

  // Toggle Module Accordion open/close
  const toggleModuleAccordion = (modKey: string) => {
    setExpandedModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(modKey)) next.delete(modKey);
      else next.add(modKey);
      return next;
    });
  };

  // Toggle Folder open/close inside tree
  const toggleFolderCollapse = (folderKey: string) => {
    setCollapsedFolderKeys((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) next.delete(folderKey);
      else next.add(folderKey);
      return next;
    });
  };

  // Toggle Entire Module (Select All / Deselect All features in this module)
  const toggleModuleAll = (targetModId: number | string) => {
    const mod = moduleTree.find(
      (m) =>
        String(m.id) === String(targetModId) ||
        (m.uuid && String(m.uuid) === String(targetModId)),
    );
    if (!mod) return;

    const allFeatureIds = (mod.features || [])
      .map((f) => (f.id !== undefined && f.id !== null ? f.id : f.uuid))
      .filter(
        (id): id is number | string =>
          id !== undefined && id !== null && id !== "",
      );

    const key = String(targetModId);
    const currentSelected = selectedFeatures[key] || [];
    const isAllSelected =
      allFeatureIds.length > 0 &&
      allFeatureIds.every((id) =>
        currentSelected.some((cur) => String(cur) === String(id)),
      );

    if (isAllSelected) {
      setSelectedFeatures((prev) => ({ ...prev, [key]: [] }));
      setFeaturePermissions((prev) => {
        const next = { ...prev };
        for (const fid of allFeatureIds) {
          delete next[String(fid)];
        }
        return next;
      });
    } else {
      setSelectedFeatures((prev) => ({ ...prev, [key]: allFeatureIds }));
      setFeaturePermissions((prev) => {
        const next = { ...prev };
        for (const fid of allFeatureIds) {
          if (!next[String(fid)]) {
            next[String(fid)] = {
              isGranted: true,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: false,
            };
          } else {
            next[String(fid)] = {
              ...next[String(fid)],
              isGranted: true,
              canView: next[String(fid)].canView ?? true,
            };
          }
        }
        return next;
      });
    }
  };

  // Toggle Single Feature Checkbox
  const toggleFeature = (
    targetModId: number | string,
    targetFeatId: number | string,
  ) => {
    const key = String(targetModId);
    const featKey = String(targetFeatId);

    setSelectedFeatures((prev) => {
      const current = prev[key] || [];
      const exists = current.some((id) => String(id) === featKey);
      const updated = exists
        ? current.filter((id) => String(id) !== featKey)
        : [...current, targetFeatId];
      return { ...prev, [key]: updated };
    });

    setFeaturePermissions((prev) => {
      const current = prev[featKey];
      if (current && current.isGranted) {
        const next = { ...prev };
        delete next[featKey];
        return next;
      } else {
        return {
          ...prev,
          [featKey]: {
            isGranted: true,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
          },
        };
      }
    });
  };

  // Toggle Granular Operation (view / write / delete) for an Org Admin on a Feature
  const toggleFeatureOp = (
    targetModId: number | string,
    targetFeatId: number | string,
    op: "view" | "write" | "delete",
  ) => {
    const modKey = String(targetModId);
    const featKey = String(targetFeatId);
    const current = featurePermissions[featKey] || {
      isGranted: false,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };

    let next: FeaturePermissionState;

    if (op === "view") {
      const nextView = !current.canView;
      next = {
        ...current,
        canView: nextView,
        isGranted:
          nextView || current.canCreate || current.canEdit || current.canDelete,
      };
    } else if (op === "write") {
      const nextWrite = !(current.canCreate || current.canEdit);
      next = {
        ...current,
        canCreate: nextWrite,
        canEdit: nextWrite,
        canView: nextWrite ? true : current.canView,
        isGranted: nextWrite || current.canView || current.canDelete,
      };
    } else if (op === "delete") {
      const nextDel = !current.canDelete;
      next = {
        ...current,
        canDelete: nextDel,
        isGranted:
          nextDel || current.canView || current.canCreate || current.canEdit,
      };
    } else {
      next = current;
    }

    setFeaturePermissions((prev) => {
      const updated = { ...prev };
      if (!next.isGranted) {
        delete updated[featKey];
      } else {
        updated[featKey] = next;
      }
      return updated;
    });

    // Also synchronize selectedFeatures list for this module
    setSelectedFeatures((prev) => {
      const curList = prev[modKey] || [];
      const exists = curList.some((id) => String(id) === featKey);
      if (next.isGranted && !exists) {
        return { ...prev, [modKey]: [...curList, targetFeatId] };
      } else if (!next.isGranted && exists) {
        return {
          ...prev,
          [modKey]: curList.filter((id) => String(id) !== featKey),
        };
      }
      return prev;
    });
  };

  // Toggle Subtree in Path Tree (cascading select/deselect)
  const toggleTreeNodeSubtree = (
    targetModId: number | string,
    node: OrgFeatureTreeNode,
  ) => {
    const key = String(targetModId);
    const subtreeIds = node.allSubtreeFeatureIds;
    setSelectedFeatures((prev) => {
      const current = prev[key] || [];
      const allSelected =
        subtreeIds.length > 0 &&
        subtreeIds.every((id) =>
          current.some((cur) => String(cur) === String(id)),
        );

      let updated: (number | string)[];
      if (allSelected) {
        const removeSet = new Set(subtreeIds.map(String));
        updated = current.filter((id) => !removeSet.has(String(id)));
      } else {
        const toAdd = subtreeIds.filter(
          (id) => !current.some((cur) => String(cur) === String(id)),
        );
        updated = [...current, ...toAdd];
      }
      return { ...prev, [key]: updated };
    });

    setFeaturePermissions((prev) => {
      const allSelected =
        subtreeIds.length > 0 &&
        subtreeIds.every((id) => Boolean(prev[String(id)]?.isGranted));

      const updated = { ...prev };
      if (allSelected) {
        for (const sid of subtreeIds) {
          delete updated[String(sid)];
        }
      } else {
        for (const sid of subtreeIds) {
          if (!updated[String(sid)]) {
            updated[String(sid)] = {
              isGranted: true,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: false,
            };
          }
        }
      }
      return updated;
    });
  };

  // Global Quick Toggles across ALL modules
  const handleSelectAllEverything = () => {
    const newMap: Record<string, (number | string)[]> = {};
    const newPerms: Record<string | number, FeaturePermissionState> = {};
    for (const mod of moduleTree) {
      const key = String(mod.id ?? mod.uuid ?? "");
      if (key) {
        const featIds = (mod.features || [])
          .map((f) => (f.id !== undefined && f.id !== null ? f.id : f.uuid))
          .filter(
            (id): id is number | string =>
              id !== undefined && id !== null && id !== "",
          );
        newMap[key] = featIds;
        for (const fid of featIds) {
          newPerms[String(fid)] = {
            isGranted: true,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
          };
        }
      }
    }
    setSelectedFeatures(newMap);
    setFeaturePermissions(newPerms);
    toast.success("All modules and features enabled for this organization");
  };

  const handleDeselectAllEverything = () => {
    const newMap: Record<string, (number | string)[]> = {};
    for (const mod of moduleTree) {
      const key = String(mod.id ?? mod.uuid ?? "");
      if (key) newMap[key] = [];
    }
    setSelectedFeatures(newMap);
    setFeaturePermissions({});
    toast.info("All modules and features cleared");
  };

  const handleExpandAllAccordions = () => {
    const allKeys = moduleTree
      .map((m) => String(m.id ?? m.uuid ?? ""))
      .filter(Boolean);
    setExpandedModuleKeys(new Set(allKeys));
  };

  const handleCollapseAllAccordions = () => {
    setExpandedModuleKeys(new Set());
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const name = (formData.get("name") as string)?.trim() || orgData.name;
    const email = (formData.get("email") as string)?.trim() || orgData.email;
    const phone = (formData.get("phone") as string) ?? (orgData.phone || "");
    const address =
      (formData.get("address") as string) ?? (orgData.address || "");
    const maxUsers = Number(formData.get("maxUsers")) || orgData.maxUsers || 5;
    const maxProjects =
      Number(formData.get("maxProjects")) || orgData.maxProjects || 5;
    const maxStorageMb = formData.get("maxStorageGb")
      ? Number(formData.get("maxStorageGb")) * 1024
      : orgData.maxStorageMb || 2048;
    const planId = (formData.get("planId") as string) || selectedPlanId;
    const status =
      (formData.get("status") as Organization["subscriptionStatus"]) ||
      orgData.subscriptionStatus ||
      "active";

    const identifier = orgData.id || orgData.uuid;

    try {
      // 1. Update general org details & quotas
      const updatedOrg = await updateOrganization(identifier, {
        name,
        email,
        phone,
        address,
        maxUsers,
        maxProjects,
        maxStorageMb,
      });

      // 2. Update subscription tier or status if changed
      if (planId || status) {
        await updateSubscription(identifier, {
          action: "change_plan",
          planId: planId ? Number(planId) : undefined,
          status,
        }).catch((err) => {
          console.warn("Subscription update secondary step warning:", err);
        });
      }

      // 3. Update organization module & feature access entitlements
      const moduleFeatureAccess = Object.entries(selectedFeatures)
        .map(([moduleId, featureIds]) => ({
          moduleId: isNaN(Number(moduleId)) ? moduleId : Number(moduleId),
          featureIds: (featureIds || [])
            .map((id) =>
              typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id,
            )
            .filter((id) => id !== undefined && id !== null && id !== ""),
        }))
        .filter((item) => item.featureIds.length > 0);

      // Build granular featureOverrides for organization admin user
      const overridesPayload = Object.entries(featurePermissions).map(
        ([featureId, state]) => ({
          featureId: Number(featureId),
          isGranted: state.isGranted,
          canView: state.canView,
          canCreate: state.canCreate,
          canEdit: state.canEdit,
          canDelete: state.canDelete,
        }),
      );

      const updatedEntitlements = await updateOrganizationEntitlements(
        identifier,
        moduleFeatureAccess,
        overridesPayload,
      ).catch((err) => {
        console.warn("Failed to update entitlements:", err);
        return null;
      });

      toast.success(
        "Organization profile and module access updated successfully",
      );

      onUpdate(orgData.uuid || String(orgData.id), {
        ...orgData,
        ...updatedOrg,
        name,
        email,
        phone,
        address,
        maxUsers,
        maxProjects,
        maxStorageMb,
        subscriptionStatus: status,
        entitledModules: updatedEntitlements || orgData.entitledModules,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to update organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialStorageGb = orgData.maxStorageMb
    ? Math.round(orgData.maxStorageMb / 1024)
    : (orgData.storage_gb ?? 2);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                Edit Organization: {orgData.name}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Code: {orgData.code || orgData.slug} &bull; ID: #{orgData.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>General Profile & Quotas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("entitlements")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "entitlements"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Module & Feature Access</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === "entitlements"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {totalSelectedFeaturesCount} active
            </span>
          </button>
        </div>

        {/* Form Container */}
        <form
          id="edit-org-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            {/* =========================================================
                TAB 1: GENERAL PROFILE & RESOURCE QUOTAS
            ========================================================= */}
            <div
              className={`space-y-6 ${activeTab === "general" ? "block" : "hidden"}`}
            >
              {/* Identity Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  General Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Organization Name *
                    </label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={orgData.name}
                      required
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Tenant Code (Read Only)
                    </label>
                    <input
                      name="code"
                      type="text"
                      defaultValue={orgData.code || orgData.slug}
                      readOnly
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm bg-gray-100 font-mono text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Corporate Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={orgData.email}
                      required
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phone Contact
                    </label>
                    <input
                      name="phone"
                      type="text"
                      defaultValue={orgData.phone || ""}
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Office / Physical Address
                    </label>
                    <input
                      name="address"
                      type="text"
                      defaultValue={orgData.address || ""}
                      placeholder="e.g. Plot 12, Gulshan Avenue, Dhaka"
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quotas & Capacity */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Resource Quotas & Limits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> Max Users
                      *
                    </label>
                    <input
                      name="maxUsers"
                      type="number"
                      min="1"
                      defaultValue={orgData.maxUsers ?? orgData.user_limit ?? 5}
                      required
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />{" "}
                      Max Projects *
                    </label>
                    <input
                      name="maxProjects"
                      type="number"
                      min="1"
                      defaultValue={
                        orgData.maxProjects ?? orgData.project_limit ?? 5
                      }
                      required
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-violet-600" />{" "}
                      Storage (GB) *
                    </label>
                    <input
                      name="maxStorageGb"
                      type="number"
                      min="1"
                      defaultValue={initialStorageGb}
                      required
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Lifecycle */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Subscription & Tier
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Subscription Tier / Plan
                    </label>
                    <select
                      name="planId"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Plan...</option>
                      {plans.map((p) => (
                        <option key={p.id || p.uuid} value={String(p.id)}>
                          {p.name} (${p.monthlyPrice}/mo - {p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Subscription Status
                    </label>
                    <select
                      name="status"
                      defaultValue={
                        orgData.subscriptionStatus || orgData.status || "active"
                      }
                      className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white capitalize"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past Due</option>
                      <option value="suspended">Suspended</option>
                      <option value="locked">Locked</option>
                      <option value="expired">Expired</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================
                TAB 2: MODULE & NESTED FEATURE ENTITLEMENTS (TREE STRUCTURE)
            ========================================================= */}
            <div
              className={`space-y-5 ${activeTab === "entitlements" ? "block" : "hidden"}`}
            >
              {/* Header Information & Search Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Module & Feature Access Entitlements
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure modules and nested features accessible to this
                    organization. Checked features grant tenant users Read &
                    Write access.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    <strong>{selectedModulesCount}</strong> /{" "}
                    {totalAvailableModules} modules active
                  </span>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <strong>{totalSelectedFeaturesCount}</strong> /{" "}
                    {totalAvailableFeatures} features active
                  </span>
                </div>
              </div>

              {/* Search Bar & Quick Bulk Action Buttons */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-200">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Search modules, features, or route paths..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllEverything}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={handleDeselectAllEverything}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition"
                  >
                    Deselect All
                  </button>

                  <button
                    type="button"
                    onClick={handleExpandAllAccordions}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition"
                  >
                    Expand All
                  </button>

                  <button
                    type="button"
                    onClick={handleCollapseAllAccordions}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Modules Accordion List */}
              {isLoadingDependencies ? (
                <div className="flex min-h-[260px] items-center justify-center text-xs text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                  Loading system modules and organization entitlements...
                </div>
              ) : moduleTree.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border border-dashed rounded-2xl">
                  No system modules registered.
                </div>
              ) : (
                <div className="space-y-3">
                  {moduleTree
                    .filter((mod) => {
                      if (!featureSearch.trim()) return true;
                      const q = featureSearch.toLowerCase();
                      if (mod.name.toLowerCase().includes(q)) return true;
                      if (mod.code.toLowerCase().includes(q)) return true;
                      return (mod.features || []).some(
                        (f) =>
                          f.name.toLowerCase().includes(q) ||
                          f.code.toLowerCase().includes(q) ||
                          (f.routePath &&
                            f.routePath.toLowerCase().includes(q)),
                      );
                    })
                    .map((mod, modIdx) => {
                      const modId = mod.id ?? mod.uuid ?? "";
                      const key = String(modId || modIdx);
                      const featureList = mod.features || [];
                      const selectedList = selectedFeatures[key] || [];

                      const allFeatureIds = featureList
                        .map((f) =>
                          f.id !== undefined && f.id !== null ? f.id : f.uuid,
                        )
                        .filter(
                          (id): id is number | string =>
                            id !== undefined && id !== null && id !== "",
                        );

                      const isAllSelected =
                        allFeatureIds.length > 0 &&
                        allFeatureIds.every((id) =>
                          selectedList.some(
                            (cur) => String(cur) === String(id),
                          ),
                        );

                      const isPartiallySelected =
                        !isAllSelected &&
                        allFeatureIds.some((id) =>
                          selectedList.some(
                            (cur) => String(cur) === String(id),
                          ),
                        );

                      const selectedCount = allFeatureIds.filter((id) =>
                        selectedList.some((cur) => String(cur) === String(id)),
                      ).length;

                      const isExpanded = expandedModuleKeys.has(key);
                      const effectiveSearch =
                        moduleSearchMap[key] || featureSearch;

                      // Build Path Nested Tree for features under this module
                      const nestedTreeNodes = buildPathNestedTree(
                        featureList,
                        mod.pathRoute,
                        key,
                      );
                      const flattenedRows = flattenTreeForDisplay(
                        nestedTreeNodes,
                        collapsedFolderKeys,
                        effectiveSearch,
                      );

                      return (
                        <div
                          key={`module-${key}-${modIdx}`}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isExpanded
                              ? "border-blue-200 bg-white shadow-sm ring-1 ring-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {/* Module Accordion Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-gray-50/70 border-b border-gray-100 select-none">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Chevron expand/collapse dropdown button */}
                              <button
                                type="button"
                                onClick={() => toggleModuleAccordion(key)}
                                className="p-1 rounded-md text-gray-500 hover:bg-gray-200 transition shrink-0"
                                title={
                                  isExpanded
                                    ? "Collapse module"
                                    : "Expand module"
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </button>

                              {/* Master Module Checkbox */}
                              <Checkbox
                                checked={isAllSelected}
                                indeterminate={isPartiallySelected}
                                onChange={() => toggleModuleAll(modId)}
                                ariaLabel={`Select all features in ${mod.name}`}
                              />

                              {/* Module Info */}
                              <div
                                className="cursor-pointer min-w-0"
                                onClick={() => toggleModuleAccordion(key)}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {mod.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                    {mod.code}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Side Search & Stats & Badges */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                              {/* Per-module search filter */}
                              <div
                                className="relative w-36 sm:w-44"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={moduleSearchMap[key] || ""}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setModuleSearchMap((prev) => ({
                                      ...prev,
                                      [key]: e.target.value,
                                    }));
                                  }}
                                  placeholder={`Filter ${mod.name}...`}
                                  className="w-full pl-6 pr-5 py-1 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                {moduleSearchMap[key] && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModuleSearchMap((prev) => ({
                                        ...prev,
                                        [key]: "",
                                      }));
                                    }}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              <span className="text-[11px] font-semibold text-gray-600">
                                <strong className="text-blue-600 font-bold">
                                  {selectedCount}
                                </strong>{" "}
                                of {featureList.length} features
                              </span>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isAllSelected
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isPartiallySelected
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}
                              >
                                {isAllSelected
                                  ? "Full Access"
                                  : isPartiallySelected
                                    ? "Partial Access"
                                    : "No Access"}
                              </span>
                            </div>
                          </div>

                          {/* Nested Features Tree View (When Module Expanded) */}
                          {isExpanded && (
                            <div className="p-0 border-t border-gray-100 overflow-x-auto">
                              {featureList.length === 0 ? (
                                <div className="p-4 text-xs text-gray-400 italic text-center">
                                  No nested features registered under this
                                  module.
                                </div>
                              ) : (
                                <div className="min-w-[650px]">
                                  {/* Sub-table Header */}
                                  <div className="grid grid-cols-[minmax(320px,460px)_minmax(0,1fr)] bg-slate-50/80 px-4 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <span>Feature Path Hierarchy</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>
                                        Read & Write Access Operations
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-normal">
                                        Checked = Granted to Organization
                                      </span>
                                    </div>
                                  </div>

                                  {/* Tree Rows */}
                                  {flattenedRows.map((row, rowIdx) => {
                                    const node = row.node;
                                    const totalSubtree =
                                      node.allSubtreeFeatureIds.length;
                                    const selectedInSubtree =
                                      node.allSubtreeFeatureIds.filter((id) =>
                                        selectedList.some(
                                          (cur) => String(cur) === String(id),
                                        ),
                                      ).length;

                                    const isNodeAllSelected =
                                      totalSubtree > 0 &&
                                      selectedInSubtree === totalSubtree;
                                    const isNodePartiallySelected =
                                      selectedInSubtree > 0 &&
                                      selectedInSubtree < totalSubtree;

                                    const featId =
                                      node.feature?.id !== undefined &&
                                      node.feature?.id !== null
                                        ? node.feature.id
                                        : node.feature?.uuid;
                                    const isLeafChecked =
                                      featId !== undefined &&
                                      selectedList.some(
                                        (cur) => String(cur) === String(featId),
                                      );

                                    const leafPerm: FeaturePermissionState =
                                      (featId &&
                                        featurePermissions[String(featId)]) || {
                                        isGranted: isLeafChecked,
                                        canView: isLeafChecked,
                                        canCreate: isLeafChecked,
                                        canEdit: isLeafChecked,
                                        canDelete: false,
                                      };

                                    return (
                                      <div
                                        key={`${key}-${node.key}-${rowIdx}`}
                                        className="grid grid-cols-[minmax(320px,460px)_minmax(0,1fr)] border-b border-gray-100 last:border-b-0 hover:bg-blue-50/20 transition-colors"
                                      >
                                        {/* Left Tree Column with Monospaced ASCII Branch Connector */}
                                        <div className="flex min-h-[44px] items-center gap-2 px-3 py-2 border-r border-gray-100 bg-white">
                                          {/* ASCII Guide Stems */}
                                          <span className="font-mono text-xs select-none text-gray-400 whitespace-pre">
                                            {row.prefix}
                                          </span>

                                          {/* Checkbox (Cascading for folder, direct for leaf) */}
                                          {row.hasChildren ? (
                                            <Checkbox
                                              checked={isNodeAllSelected}
                                              indeterminate={
                                                isNodePartiallySelected
                                              }
                                              onChange={() =>
                                                toggleTreeNodeSubtree(
                                                  modId,
                                                  node,
                                                )
                                              }
                                              ariaLabel={`Select folder ${node.name}`}
                                            />
                                          ) : (
                                            <Checkbox
                                              checked={isLeafChecked}
                                              onChange={() =>
                                                featId &&
                                                toggleFeature(modId, featId)
                                              }
                                              ariaLabel={`Select feature ${node.name}`}
                                            />
                                          )}

                                          {/* Folder / File Icon */}
                                          {row.hasChildren ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleFolderCollapse(node.key)
                                              }
                                              className="flex items-center gap-1 text-amber-500 hover:text-amber-600 focus:outline-none shrink-0"
                                              title={
                                                row.isCollapsed
                                                  ? "Expand folder"
                                                  : "Collapse folder"
                                              }
                                            >
                                              {row.isCollapsed ? (
                                                <ChevronRight
                                                  size={13}
                                                  className="text-gray-400"
                                                />
                                              ) : (
                                                <ChevronDown
                                                  size={13}
                                                  className="text-gray-400"
                                                />
                                              )}
                                              {row.isCollapsed ? (
                                                <Folder size={15} />
                                              ) : (
                                                <FolderOpen size={15} />
                                              )}
                                            </button>
                                          ) : (
                                            <FileCode2
                                              size={15}
                                              className="text-blue-500 shrink-0 ml-4"
                                            />
                                          )}

                                          {/* Name and Route Tag */}
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                row.hasChildren
                                                  ? toggleFolderCollapse(
                                                      node.key,
                                                    )
                                                  : featId &&
                                                    toggleFeature(modId, featId)
                                              }
                                              className={`truncate text-left text-xs transition hover:text-blue-600 ${
                                                row.hasChildren
                                                  ? "font-bold text-gray-900"
                                                  : "font-medium text-gray-700"
                                              }`}
                                            >
                                              {node.name}
                                            </button>

                                            <span className="shrink-0 font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                              {node.routePath ||
                                                node.feature?.code}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Right Column: Operations / Read & Write Access Badges */}
                                        <div className="flex items-center px-4 py-2 bg-white">
                                          {row.hasChildren ? (
                                            <div className="flex w-full items-center justify-between text-xs text-gray-500">
                                              <span className="text-[11px]">
                                                Directory container &bull;{" "}
                                                <strong className="text-gray-800 font-semibold">
                                                  {selectedInSubtree}
                                                </strong>{" "}
                                                of {totalSubtree} features
                                                selected in branch
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    toggleTreeNodeSubtree(
                                                      modId,
                                                      node,
                                                    )
                                                  }
                                                  className="text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                  {isNodeAllSelected
                                                    ? "Clear Branch"
                                                    : "Select Branch"}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex w-full items-center justify-between gap-3">
                                              {/* Read, Write & Delete Operational Toggle Buttons */}
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {/* READ Toggle Button */}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    featId &&
                                                    toggleFeatureOp(
                                                      modId,
                                                      featId,
                                                      "view",
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                                    leafPerm.canView
                                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-200/80"
                                                      : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200/60"
                                                  }`}
                                                  title={
                                                    leafPerm.canView
                                                      ? "Click to revoke READ access"
                                                      : "Click to grant READ access"
                                                  }
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                  READ
                                                  {leafPerm.canView && (
                                                    <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                                                  )}
                                                </button>

                                                {/* WRITE Toggle Button */}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    featId &&
                                                    toggleFeatureOp(
                                                      modId,
                                                      featId,
                                                      "write",
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                                    leafPerm.canCreate ||
                                                    leafPerm.canEdit
                                                      ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs hover:bg-blue-200/80"
                                                      : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200/60"
                                                  }`}
                                                  title={
                                                    leafPerm.canCreate ||
                                                    leafPerm.canEdit
                                                      ? "Click to revoke WRITE access"
                                                      : "Click to grant WRITE access"
                                                  }
                                                >
                                                  <Edit className="w-3.5 h-3.5" />
                                                  WRITE
                                                  {(leafPerm.canCreate ||
                                                    leafPerm.canEdit) && (
                                                    <Check className="w-3 h-3 text-blue-600 ml-0.5" />
                                                  )}
                                                </button>

                                                {/* DELETE Toggle Button */}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    featId &&
                                                    toggleFeatureOp(
                                                      modId,
                                                      featId,
                                                      "delete",
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                                    leafPerm.canDelete
                                                      ? "bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs hover:bg-rose-200/80"
                                                      : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200/60"
                                                  }`}
                                                  title={
                                                    leafPerm.canDelete
                                                      ? "Click to revoke DELETE access"
                                                      : "Click to grant DELETE access"
                                                  }
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                  DELETE
                                                  {leafPerm.canDelete && (
                                                    <Check className="w-3 h-3 text-rose-600 ml-0.5" />
                                                  )}
                                                </button>
                                              </div>

                                              {/* Organization Entitlement Status Pill */}
                                              {isLeafChecked ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                  Granted
                                                </span>
                                              ) : (
                                                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                                                  Disabled
                                                </span>
                                              )}
                                            </div>
                                          )}
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 shrink-0">
            <div className="text-xs text-gray-500 hidden sm:block">
              Editing Organization:{" "}
              <strong className="text-gray-900 font-semibold">
                {orgData.name}
              </strong>{" "}
              &bull;{" "}
              <strong className="text-blue-600">
                {totalSelectedFeaturesCount}
              </strong>{" "}
              features enabled
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white rounded-xl text-xs sm:text-sm font-medium hover:opacity-95 transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: brandColor }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save All Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
