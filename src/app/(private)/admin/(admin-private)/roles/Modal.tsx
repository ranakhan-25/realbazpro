"use client";

import type { Role } from "@/services/roleService";
import { getFeaturesTreePermissions, type FeatureTreeNode } from "@/services/roleService";
import { getUserAccess } from "@/services/userAccessService";
import { useTheme } from "@/lib/theme";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShieldCheck, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   GENERIC MODAL
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
  maxWidthClass = "max-w-[1180px]",
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[3px] sm:p-5"
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
          className={`flex max-h-[94vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl`}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   TYPES
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
  permissions: PermissionItem[];
}

export interface ModuleTabItem {
  id: number | string;
  name: string;
  code?: string;
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

/* =========================================================
   CHECKBOX
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
   ROLE PERMISSION MODAL
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

  // Load live tree from backend on open
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadLiveTree = async () => {
      try {
        setLoading(true);
        const [featureTree, userAccess] = await Promise.all([
          getFeaturesTreePermissions(),
          getUserAccess().catch(() => null),
        ]);
        if (cancelled) return;

        // If user is a tenant admin or staff, enforce their entitled modules
        const allowedModuleIds =
          userAccess && !userAccess.user?.isSuperUser && Array.isArray(userAccess.accessibleModules)
            ? new Set(userAccess.accessibleModules.map((m) => String(m.id)))
            : null;

        // Group features by module
        const moduleMap = new Map<string, { id: string | number; name: string; features: FeatureItem[] }>();

        for (const feat of featureTree) {
          const modId = feat.module?.id || (feat.moduleId ? String(feat.moduleId) : "general");
          const modName = feat.module?.name || "General Modules";

          if (allowedModuleIds && !allowedModuleIds.has(String(modId))) {
            continue;
          }

          if (!moduleMap.has(String(modId))) {
            moduleMap.set(String(modId), {
              id: modId,
              name: modName,
              features: [],
            });
          }

          const targetMod = moduleMap.get(String(modId))!;
          targetMod.features.push({
            id: feat.id,
            name: feat.name,
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
          setActiveModuleId(moduleList[0].id);
        }

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
      } catch (err) {
        console.error("Failed to load feature tree permissions:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLiveTree();

    return () => {
      cancelled = true;
    };
  }, [open, role]);

  const activeModule = useMemo(() => {
    if (!modules.length || activeModuleId === null) return null;
    return modules.find((m) => String(m.id) === String(activeModuleId)) ?? modules[0];
  }, [modules, activeModuleId]);

  const visibleFeatures = useMemo(() => {
    if (!activeModule) return [];
    const query = search.trim().toLowerCase();
    if (!query) return activeModule.features;

    return activeModule.features
      .map((feature) => {
        const featureMatches = feature.name.toLowerCase().includes(query);
        if (featureMatches) return feature;

        const permissions = feature.permissions.filter(
          (p) => p.name.toLowerCase().includes(query) || (p.code && p.code.toLowerCase().includes(query)),
        );
        return permissions.length > 0 ? { ...feature, permissions } : null;
      })
      .filter((feature): feature is FeatureItem => feature !== null);
  }, [activeModule, search]);

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

  const toggleFeature = useCallback((feature: FeatureItem) => {
    const ids = feature.permissions.map((p) => String(p.id));
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const fullySelected = ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (fullySelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, []);

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
        maxWidthClass="max-w-[1320px]"
      >
        {/* MODAL HEADER & BASIC INFO */}
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div className="flex items-center justify-between pb-3">
            <h2 id="role-permission-modal-title" className="text-base font-bold text-[var(--foreground)]">
              {title || (role ? "Edit Role & Permissions" : "Create Role & Permissions")}
            </h2>
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

        {/* MODULE TABS & SEARCH */}
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
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
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
          </div>

          <div className="relative shrink-0 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter features & permissions..."
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-8 pr-3 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* FEATURES & PERMISSION GRID */}
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-slate-400">
              Loading dynamic module features and permissions...
            </div>
          ) : !activeModule ? (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-slate-400">
              No modules or features found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              {/* Table Header */}
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(180px,260px)_minmax(0,1fr)] border-b border-[var(--border)] bg-[var(--muted)]">
                <div className="flex items-center gap-2 border-r border-[var(--border)] px-3 py-2.5">
                  <Checkbox
                    checked={allActiveSelected}
                    indeterminate={!allActiveSelected && someActiveSelected}
                    onChange={toggleAllActive}
                    ariaLabel="Select all permissions in module"
                  />
                  <button
                    type="button"
                    onClick={toggleAllActive}
                    className="text-xs font-semibold text-[var(--foreground)]"
                  >
                    Feature Name
                  </button>
                </div>
                <div className="flex items-center px-3 py-2.5">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Granular Operations (Read, Write, Update, Delete)
                  </span>
                </div>
              </div>

              {/* Feature Rows */}
              {visibleFeatures.length === 0 ? (
                <div className="flex min-h-[130px] items-center justify-center text-xs text-slate-400">
                  No features matched your search filter.
                </div>
              ) : (
                visibleFeatures.map((feature) => {
                  const permIds = feature.permissions.map((p) => String(p.id));
                  const selectedCount = permIds.filter((id) => selectedPermissionIds.has(id)).length;
                  const fullySelected = permIds.length > 0 && selectedCount === permIds.length;
                  const partiallySelected = selectedCount > 0 && selectedCount < permIds.length;

                  return (
                    <div
                      key={String(feature.id)}
                      className="grid grid-cols-[minmax(180px,260px)_minmax(0,1fr)] border-b border-[var(--border)] last:border-b-0 hover:bg-slate-50/50"
                    >
                      {/* Feature Column */}
                      <div className="flex min-h-[50px] items-center gap-2 border-r border-[var(--border)] bg-[var(--card)] px-3 py-2">
                        <Checkbox
                          checked={fullySelected}
                          indeterminate={partiallySelected}
                          onChange={() => toggleFeature(feature)}
                          ariaLabel={`Select ${feature.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className="min-w-0 text-left text-xs font-semibold text-[var(--foreground)] hover:text-blue-600 transition"
                        >
                          {feature.name}
                        </button>
                      </div>

                      {/* Permissions Checkbox Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[var(--card)] p-2.5">
                        {feature.permissions.map((perm) => {
                          const checked = selectedPermissionIds.has(String(perm.id));
                          return (
                            <label
                              key={String(perm.id)}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                                checked
                                  ? "border-blue-500 bg-blue-50/60 text-blue-900 font-medium"
                                  : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
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
    </div>
  );
}
