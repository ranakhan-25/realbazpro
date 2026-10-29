"use client";

import type { Role } from "@/services/roleService";
import { getFeaturesTreePermissions, type FeatureTreeNode } from "@/services/roleService";
import { getUserAccess } from "@/services/userAccessService";
import { deleteModule, type ModuleTreeNode } from "@/services/moduleTreeService";
import ModuleTreeBuilderModal from "@/components/modules/ModuleTreeBuilderModal";
import { useTheme } from "@/lib/theme";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  X,
  Folder,
  FolderOpen,
  FileCode2,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

/* =========================================================
   GENERIC MODAL CONTAINER
========================================================= */

export interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  maxWidthClass?: string;
  closeOnOverlayClick?: boolean;
}

export function Modal({
  children,
  onClose,
  labelledBy,
  maxWidthClass = "max-w-[1380px]",
  closeOnOverlayClick = true,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-[3px] sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose();
          }
        }}
        aria-labelledby={labelledBy}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => event.stopPropagation()}
          className={`flex max-h-[96vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl`}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   DATA TYPES
========================================================= */

export interface PermissionItem {
  id: number | string;
  name: string;
  code?: string;
  action?: string;
}

export interface FeatureItem {
  id: number | string;
  name: string;
  code?: string;
  routePath?: string;
  actionType?: string;
  displayOrder?: number;
  permissions: PermissionItem[];
}

export interface ModuleTabItem {
  id: number | string;
  name: string;
  code?: string;
  pathRoute?: string;
  features: FeatureItem[];
}

export interface RolePermissionSavePayload {
  roleId: number | string;
  roleName: string;
  description?: string;
  roleLevel?: number;
  permissionIds: Array<number | string>;
  featureIds: Array<number | string>;
}

export interface RolePermissionModalProps {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
  onSave?: (payload: RolePermissionSavePayload) => void | Promise<void>;
  title?: string;
}

export interface PathTreeNode {
  key: string;
  name: string;
  segment: string;
  routePath: string;
  isFolder: boolean;
  feature?: FeatureItem;
  children: PathTreeNode[];
  depth: number;
  allSubtreePermissionIds: string[];
}

export interface FlattenedRow {
  node: PathTreeNode;
  prefix: string;
  hasChildren: boolean;
  isCollapsed: boolean;
}

/* =========================================================
   CHECKBOX COMPONENT
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
    if (checkboxRef.current) checkboxRef.current.indeterminate = indeterminate;
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
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--border)] accent-[var(--color-primary)] focus:ring-[var(--color-primary)]"
    />
  );
}

/* =========================================================
   PATH TREE BUILDER HELPER
========================================================= */

function formatSegmentName(seg: string): string {
  return seg
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPathNestedTree(features: FeatureItem[], modulePath?: string): PathTreeNode[] {
  if (!features || features.length === 0) return [];

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
    commonPrefix = modulePath.endsWith("/") ? modulePath.slice(0, -1) : modulePath;
  }

  interface RawNode {
    key: string;
    segment: string;
    name: string;
    routePath: string;
    isFolder: boolean;
    feature?: FeatureItem;
    children: RawNode[];
  }

  const root: RawNode = {
    key: "root",
    segment: "",
    name: "root",
    routePath: "",
    isFolder: true,
    children: [],
  };

  for (const f of features) {
    let p = (f.routePath || (f.code ? f.code.toLowerCase().replace(/_/g, "/") : f.name)).trim();
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
          key: currPath,
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
      }
      curr = next;
    }
  }

  function finalize(rawNodes: RawNode[], depth: number): PathTreeNode[] {
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

      const selfPermIds = (raw.feature?.permissions || []).map((p) => String(p.id));
      const childPermIds = children.flatMap((c) => c.allSubtreePermissionIds);
      const allSubtreePermissionIds = Array.from(new Set([...selfPermIds, ...childPermIds]));

      return {
        key: raw.key,
        name: raw.name,
        segment: raw.segment,
        routePath: raw.routePath,
        isFolder,
        feature: raw.feature,
        children,
        depth,
        allSubtreePermissionIds,
      };
    });
  }

  return finalize(root.children, 0);
}

function flattenTreeForDisplay(
  nodes: PathTreeNode[],
  collapsedKeys: Set<string>,
  searchQuery: string,
  ancestorIsLast: boolean[] = [],
): FlattenedRow[] {
  const result: FlattenedRow[] = [];
  const q = searchQuery.trim().toLowerCase();

  function nodeMatches(n: PathTreeNode): boolean {
    if (!q) return true;
    if (n.name.toLowerCase().includes(q)) return true;
    if (n.routePath.toLowerCase().includes(q)) return true;
    if (n.feature?.code?.toLowerCase().includes(q)) return true;
    if (
      n.feature?.permissions.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q)),
      )
    ) {
      return true;
    }
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
        ...flattenTreeForDisplay(
          node.children,
          collapsedKeys,
          searchQuery,
          [...ancestorIsLast, isLast],
        ),
      );
    }
  });

  return result;
}

/* =========================================================
   MAIN ROLE PERMISSION MODAL
========================================================= */

export default function RolePermissionModal({
  open,
  onClose,
  role,
  onSave,
  title,
}: RolePermissionModalProps) {
  const { primaryColor } = useTheme();

  const [modules, setModules] = useState<ModuleTabItem[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleLevel, setRoleLevel] = useState<number>(4);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Global set of selected permission IDs across ALL modules
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  // Tree collapsible state
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  // Module Tree Builder Modal state
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<ModuleTreeNode | null>(null);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);

  const loadLiveTree = useCallback(async () => {
    try {
      setLoading(true);
      const [featureTree, userAccess] = await Promise.all([
        getFeaturesTreePermissions(),
        getUserAccess().catch(() => null),
      ]);

      // If user is a tenant admin or staff, enforce their entitled modules
      const allowedModuleIds =
        userAccess && !userAccess.user?.isSuperUser && Array.isArray(userAccess.accessibleModules)
          ? new Set(userAccess.accessibleModules.map((m) => String(m.id)))
          : null;

      // Group features by module
      const moduleMap = new Map<
        string,
        { id: string | number; name: string; code?: string; pathRoute?: string; features: FeatureItem[] }
      >();

      for (const feat of featureTree) {
        const modId = feat.module?.id || (feat.moduleId ? String(feat.moduleId) : "general");
        const modName = feat.module?.name || "General Modules";
        const modCode = feat.module?.code;
        const modPath = feat.module?.pathRoute;

        if (allowedModuleIds && !allowedModuleIds.has(String(modId))) {
          continue;
        }

        if (!moduleMap.has(String(modId))) {
          moduleMap.set(String(modId), {
            id: modId,
            name: modName,
            code: modCode,
            pathRoute: modPath,
            features: [],
          });
        }

        const targetMod = moduleMap.get(String(modId))!;
        targetMod.features.push({
          id: feat.id,
          name: feat.name,
          code: feat.code,
          routePath: feat.routePath,
          actionType: feat.actionType,
          displayOrder: feat.displayOrder,
          permissions: (feat.permissions || []).map((p) => ({
            id: p.id,
            name: p.name,
            code: p.key,
            action: p.action,
          })),
        });
      }

      const moduleList = Array.from(moduleMap.values());
      setModules(moduleList);

      if (moduleList.length > 0) {
        setActiveModuleId((prev) => {
          if (prev && moduleList.some((m) => String(m.id) === String(prev))) {
            return prev;
          }
          return moduleList[0].id;
        });
      }
    } catch (err) {
      console.error("Failed to load feature tree permissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load live tree from backend on open
  useEffect(() => {
    if (!open) return;

    loadLiveTree();

    // Initialize role fields
    setRoleName(role?.name || "");
    setRoleDescription(role?.description || "");
    setRoleLevel((role as any)?.roleLevel || 4);

    // Pre-select existing role permissions if editing
    const initialPerms = new Set<string>();
    if (role && Array.isArray(role.permissions)) {
      for (const p of role.permissions) {
        initialPerms.add(String(p.id));
      }
    }
    setSelectedPermissionIds(initialPerms);
    setSearch("");
    setCollapsedKeys(new Set());
  }, [open, role, loadLiveTree]);

  const activeModule = useMemo(() => {
    if (!modules.length || activeModuleId === null) return null;
    return modules.find((m) => String(m.id) === String(activeModuleId)) ?? modules[0];
  }, [modules, activeModuleId]);

  // Construct hierarchical path tree for the active module
  const pathTree = useMemo(() => {
    if (!activeModule) return [];
    return buildPathNestedTree(activeModule.features, activeModule.pathRoute);
  }, [activeModule]);

  // Flatten tree for visual directory rendering matching /tmp/CopyQ.Hiwipm.png
  const flattenedRows = useMemo(() => {
    if (!pathTree.length) return [];
    return flattenTreeForDisplay(pathTree, collapsedKeys, search);
  }, [pathTree, collapsedKeys, search]);

  const activeModulePermissionIds = useMemo(
    () =>
      activeModule?.features.flatMap((f) =>
        f.permissions.map((p) => String(p.id)),
      ) ?? [],
    [activeModule],
  );

  const allActiveSelected =
    activeModulePermissionIds.length > 0 &&
    activeModulePermissionIds.every((id) => selectedPermissionIds.has(id));

  const someActiveSelected = activeModulePermissionIds.some((id) =>
    selectedPermissionIds.has(id),
  );

  const togglePermission = useCallback((permissionId: number | string) => {
    const key = String(permissionId);
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleTreeNode = useCallback((node: PathTreeNode) => {
    const ids = node.allSubtreePermissionIds;
    if (ids.length === 0) return;

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const fullySelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (fullySelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, []);

  const selectSubtree = useCallback((node: PathTreeNode) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      node.allSubtreePermissionIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearSubtree = useCallback((node: PathTreeNode) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      node.allSubtreePermissionIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedKeys(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    const allFolderKeys = new Set<string>();
    function collect(nodes: PathTreeNode[]) {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          allFolderKeys.add(n.key);
          collect(n.children);
        }
      });
    }
    collect(pathTree);
    setCollapsedKeys(allFolderKeys);
  }, [pathTree]);

  const toggleAllActive = useCallback(() => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const fullySelected =
        activeModulePermissionIds.length > 0 &&
        activeModulePermissionIds.every((id) => next.has(id));
      activeModulePermissionIds.forEach((id) => {
        if (fullySelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, [activeModulePermissionIds]);

  // =========================================================
  // MODULE ACTION HANDLERS (ADD, EDIT, DELETE)
  // =========================================================

  const handleAddModule = useCallback(() => {
    setModuleToEdit(null);
    setSelectedFeatureIndex(null);
    setIsTreeModalOpen(true);
  }, []);

  const handleEditActiveModule = useCallback(() => {
    if (!activeModule) return;
    const modNode: ModuleTreeNode = {
      id: typeof activeModule.id === "number" ? activeModule.id : Number(activeModule.id) || undefined,
      name: activeModule.name,
      code: activeModule.code || "",
      pathRoute: activeModule.pathRoute,
      features: activeModule.features.map((f) => ({
        id: typeof f.id === "number" ? f.id : Number(f.id) || undefined,
        name: f.name,
        code: f.code || "",
        routePath: f.routePath,
        actionType: f.actionType,
        displayOrder: f.displayOrder,
        isActive: true,
      })),
    };
    setModuleToEdit(modNode);
    setSelectedFeatureIndex(null);
    setIsTreeModalOpen(true);
  }, [activeModule]);

  const handleAddFeatureToActiveModule = useCallback(() => {
    if (!activeModule) return;
    const modNode: ModuleTreeNode = {
      id: typeof activeModule.id === "number" ? activeModule.id : Number(activeModule.id) || undefined,
      name: activeModule.name,
      code: activeModule.code || "",
      pathRoute: activeModule.pathRoute,
      features: activeModule.features.map((f) => ({
        id: typeof f.id === "number" ? f.id : Number(f.id) || undefined,
        name: f.name,
        code: f.code || "",
        routePath: f.routePath,
        actionType: f.actionType,
        displayOrder: f.displayOrder,
        isActive: true,
      })),
    };
    setModuleToEdit(modNode);
    setSelectedFeatureIndex(null);
    setIsTreeModalOpen(true);
  }, [activeModule]);

  const handleDeleteActiveModule = useCallback(async () => {
    if (!activeModule || !activeModule.id) return;
    if (!window.confirm(`Are you sure you want to delete module "${activeModule.name}" and all its features?`)) {
      return;
    }
    try {
      await deleteModule(activeModule.id);
      toast.success(`Module "${activeModule.name}" deleted.`);
      await loadLiveTree();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete module");
    }
  }, [activeModule, loadLiveTree]);

  // =========================================================
  // SAVE ROLE PERMISSION PAYLOAD
  // =========================================================

  const handleSave = useCallback(async () => {
    if (!roleName.trim()) return;

    const permissionIds = Array.from(selectedPermissionIds).map(Number);
    const featureIds: (string | number)[] = [];

    modules.forEach((mod) => {
      mod.features.forEach((feat) => {
        if (feat.permissions.some((p) => selectedPermissionIds.has(String(p.id)))) {
          featureIds.push(feat.id);
        }
      });
    });

    const payload: RolePermissionSavePayload = {
      roleId: role?.id || "",
      roleName: roleName.trim(),
      description: roleDescription.trim() || undefined,
      roleLevel,
      permissionIds,
      featureIds,
    };

    try {
      setSaving(true);
      await onSave?.(payload);
    } finally {
      setSaving(false);
    }
  }, [role, roleName, roleDescription, roleLevel, selectedPermissionIds, modules, onSave]);

  if (!open) return null;

  const accentStyle = {
    "--color-primary": primaryColor,
    "--color-primary-hover": primaryColor,
    "--color-primary-light": `${primaryColor}18`,
  } as React.CSSProperties;

  return (
    <div style={accentStyle}>
      <Modal
        onClose={onClose}
        labelledBy="role-permission-modal-title"
        maxWidthClass="max-w-[1380px]"
      >
        {/* MODAL HEADER & BASIC ROLE INFO */}
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 id="role-permission-modal-title" className="text-base font-bold text-[var(--foreground)]">
                {title || (role ? "Edit Role & Dynamic Permissions" : "Create Role & Dynamic Permissions")}
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="role-name" className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                <span className="mr-1 text-red-500">*</span>Role Name
              </label>
              <input
                id="role-name"
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Senior Project Coordinator"
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label htmlFor="role-description" className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                Description
              </label>
              <input
                id="role-description"
                type="text"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Brief summary of duties and responsibilities"
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label htmlFor="role-level" className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                Authority Tier
              </label>
              <select
                id="role-level"
                value={roleLevel}
                onChange={(e) => setRoleLevel(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>Level 2 • Organization Admin</option>
                <option value={3}>Level 3 • Department Manager</option>
                <option value={4}>Level 4 • Operations Staff</option>
                <option value={5}>Level 5 • Viewer / Guest</option>
              </select>
            </div>
          </div>
        </div>

        {/* MODULE TABS, ADD/EDIT/DELETE MODULE ACTIONS, AND SEARCH */}
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-5 py-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-h-24">
            {modules.map((mod) => {
              const isActive = String(activeModuleId) === String(mod.id);
              const selectedCount = mod.features
                .flatMap((f) => f.permissions)
                .filter((p) => selectedPermissionIds.has(String(p.id))).length;

              return (
                <button
                  key={String(mod.id)}
                  type="button"
                  onClick={() => {
                    setActiveModuleId(mod.id);
                    setSearch("");
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-slate-300"
                  }`}
                >
                  <span>{mod.name}</span>
                  {selectedCount > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? "bg-white text-blue-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedCount}
                    </span>
                  ) : null}
                </button>
              );
            })}

            {/* Quick "+ Add Module" Action */}
            <button
              type="button"
              onClick={handleAddModule}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition shadow-2xs"
              title="Add a new module to the system"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Active Module Management Controls: Edit, Add Feature, Delete */}
            {activeModule && (
              <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
                <button
                  type="button"
                  onClick={handleEditActiveModule}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                  title="Edit module name, code, route path, or manage features"
                >
                  <Edit3 className="h-3 w-3 text-slate-500" />
                  <span>Edit Module</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddFeatureToActiveModule}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-2xs transition"
                  title="Add a nested feature to active module"
                >
                  <Plus className="h-3 w-3 text-indigo-600" />
                  <span>Add Feature</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteActiveModule}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-2xs transition"
                  title="Delete this module and its features"
                >
                  <Trash2 className="h-3 w-3 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}

            {/* Filter Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tree & permissions..."
                className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-8 pr-3 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* PATH NESTED DIRECTORY TREE GRID */}
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin mr-2 text-blue-600" />
              Loading path nested feature hierarchy and permissions...
            </div>
          ) : !activeModule ? (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-slate-400">
              No modules or features available. Click &quot;Add Module&quot; to create one.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
              {/* Table Header */}
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(340px,500px)_minmax(0,1fr)] border-b border-[var(--border)] bg-[var(--muted)]">
                <div className="flex items-center justify-between border-r border-[var(--border)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allActiveSelected}
                      indeterminate={!allActiveSelected && someActiveSelected}
                      onChange={toggleAllActive}
                      ariaLabel="Select all permissions in module"
                    />
                    <button
                      type="button"
                      onClick={toggleAllActive}
                      className="text-xs font-bold text-[var(--foreground)]"
                    >
                      Path Nested Hierarchy ({activeModule.name})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="rounded border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                      title="Expand all directory branches"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="rounded border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                      title="Collapse all directory branches"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    Granular Operations (Read, Write, Update, Delete)
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Module selected:{" "}
                    <strong className="text-blue-600 font-bold">
                      {activeModulePermissionIds.filter((id) => selectedPermissionIds.has(id)).length}
                    </strong>{" "}
                    / {activeModulePermissionIds.length}
                  </span>
                </div>
              </div>

              {/* Flattened Path Rows with ASCII Tree Stems matching /tmp/CopyQ.Hiwipm.png */}
              {flattenedRows.length === 0 ? (
                <div className="flex min-h-[140px] items-center justify-center text-xs text-slate-400">
                  {search
                    ? `No features matched your filter "${search}".`
                    : "No features found in this module. Click 'Add Feature' to add one."}
                </div>
              ) : (
                flattenedRows.map((row) => {
                  const node = row.node;
                  const totalPerms = node.allSubtreePermissionIds.length;
                  const selectedCount = node.allSubtreePermissionIds.filter((id) =>
                    selectedPermissionIds.has(id),
                  ).length;
                  const allSelected = totalPerms > 0 && selectedCount === totalPerms;
                  const partiallySelected = selectedCount > 0 && selectedCount < totalPerms;

                  return (
                    <div
                      key={node.key}
                      className="grid grid-cols-[minmax(340px,500px)_minmax(0,1fr)] border-b border-[var(--border)] last:border-b-0 hover:bg-slate-50/60 transition"
                    >
                      {/* Left: Tree Column with Monospaced ASCII Branch Connector */}
                      <div className="flex min-h-[46px] items-center gap-2 border-r border-[var(--border)] bg-[var(--card)] px-3 py-2 overflow-x-auto">
                        {/* ASCII Branch Guide Stem Lines */}
                        <span className="font-mono text-xs select-none text-slate-400 dark:text-slate-500 whitespace-pre">
                          {row.prefix}
                        </span>

                        {/* Cascading Checkbox */}
                        <Checkbox
                          checked={allSelected}
                          indeterminate={partiallySelected}
                          onChange={() => toggleTreeNode(node)}
                          ariaLabel={`Select ${node.name}`}
                        />

                        {/* Folder / File Icon */}
                        {row.hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleCollapse(node.key)}
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-600 focus:outline-none shrink-0"
                            title={row.isCollapsed ? "Expand folder" : "Collapse folder"}
                          >
                            {row.isCollapsed ? (
                              <ChevronRight size={13} className="text-slate-400" />
                            ) : (
                              <ChevronDown size={13} className="text-slate-400" />
                            )}
                            {row.isCollapsed ? <Folder size={15} /> : <FolderOpen size={15} />}
                          </button>
                        ) : (
                          <FileCode2 size={15} className="text-blue-500 shrink-0 ml-4" />
                        )}

                        {/* Node Name and Route Tag */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => (row.hasChildren ? toggleCollapse(node.key) : toggleTreeNode(node))}
                            className={`truncate text-left text-xs transition hover:text-blue-600 ${
                              row.hasChildren
                                ? "font-bold text-[var(--foreground)]"
                                : "font-medium text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {node.name}
                          </button>

                          <span className="shrink-0 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                            {node.routePath || node.feature?.code}
                          </span>
                        </div>
                      </div>

                      {/* Right: Granular Operations or Subtree Summary */}
                      <div className="flex items-center bg-[var(--card)] px-3 py-2">
                        {node.feature?.permissions && node.feature.permissions.length > 0 ? (
                          <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                            {node.feature.permissions.map((perm) => {
                              const checked = selectedPermissionIds.has(String(perm.id));
                              return (
                                <label
                                  key={String(perm.id)}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                                    checked
                                      ? "border-blue-500 bg-blue-50/60 text-blue-900 font-medium"
                                      : "border-slate-100 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-200"
                                  }`}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onChange={() => togglePermission(perm.id)}
                                    ariaLabel={perm.name}
                                  />
                                  <span className="truncate">{perm.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-500">
                            <span>
                              Directory container •{" "}
                              <strong className="text-slate-700 font-semibold">{selectedCount}</strong> of{" "}
                              {totalPerms} operations selected in subtree
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => selectSubtree(node)}
                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => clearSubtree(node)}
                                className="text-[11px] font-semibold text-slate-400 hover:underline"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer className="flex shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>
              <strong className="font-bold text-slate-800">{selectedPermissionIds.size}</strong> total permissions selected across all modules
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading || !roleName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : role ? "Update Role" : "Create Role"}
            </button>
          </div>
        </footer>
      </Modal>

      {/* Dynamic Module Tree Builder Modal for inline Add/Edit Module */}
      <ModuleTreeBuilderModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        initialModule={moduleToEdit}
        initialFeatureIndex={selectedFeatureIndex}
        onSuccess={() => {
          loadLiveTree();
        }}
      />
    </div>
  );
}
