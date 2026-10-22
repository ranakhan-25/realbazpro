"use client";

import type { Role } from "@/services/roleService";
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
}

export interface FeatureItem {
  id: number | string;
  name: string;
  code?: string;
  permissions: PermissionItem[];
}

export interface RolePermissionRole {
  id: number | string;
  name: string;
  code?: string;
  features: FeatureItem[];
}

export interface RolePermissionData {
  roles: RolePermissionRole[];
}

export interface RolePermissionSavePayload {
  roleId: number | string;
  roleName: string;
  permissionIds: Array<number | string>;
  featureIds: Array<number | string>;
}

export interface RolePermissionModalProps {
  open: boolean;
  onClose: () => void;
  loadData?: () => Promise<RolePermissionData>;
  initialRoleId?: number | string;
  initialPermissionIds?: Array<number | string>;
  role?: Role | null;
  onSave?: (payload: RolePermissionSavePayload) => void | Promise<void>;
  title?: string;
}

/* =========================================================
   MODULES
========================================================= */

const MODULE_NAMES = [
  "Project",
  "Inventory",
  "Requisition",
  "Accounts",
  "HRM",
  "CRM",
  "LAMS",
  "CR",
] as const;

const COMMON_PERMISSIONS = [
  { name: "View", code: "VIEW" },
  { name: "Create", code: "CREATE" },
  { name: "Edit", code: "EDIT" },
  { name: "Delete", code: "DELETE" },
];

const MODULE_FEATURES: Record<string, string[]> = {
  Project: ["Project Management", "Project Tasks", "Project Reports"],
  Inventory: ["Inventory Management", "Stock Management", "Inventory Reports"],
  Requisition: [
    "Requisition Management",
    "Requisition Approval",
    "Requisition Reports",
  ],
  Accounts: ["Account Management", "Transactions", "Accounts Reports"],
  HRM: ["Employee Management", "Attendance", "Leave Management", "Payroll"],
  CRM: ["Customer Management", "Lead Management", "Customer Reports"],
  LAMS: ["Asset Management", "Asset Allocation", "Asset Reports"],
  CR: ["Customer Relations", "Complaints", "Customer Reports"],
};

const EXTRA_PERMISSIONS: Record<string, string[]> = {
  Project: ["Approve"],
  Inventory: ["Adjust Stock"],
  Requisition: ["Approve", "Reject"],
  Accounts: ["Approve", "Export"],
  HRM: ["Approve", "Export"],
  CRM: ["Export"],
  LAMS: ["Assign", "Manage"],
  CR: ["Resolve", "Close"],
};

let permissionCounter = 1;
let featureCounter = 1;

const DEMO_DATA: RolePermissionData = {
  roles: MODULE_NAMES.map((moduleName, moduleIndex) => ({
    id: `module-${moduleIndex + 1}`,
    name: moduleName,
    code: moduleName.toUpperCase(),
    features: MODULE_FEATURES[moduleName].map((featureName) => {
      const featureId = `feature-${featureCounter++}`;
      const permissions = [
        ...COMMON_PERMISSIONS,
        ...(EXTRA_PERMISSIONS[moduleName] ?? []).map((name) => ({
          name,
          code: name.toUpperCase().replace(/\s+/g, "_"),
        })),
      ].map((permission) => ({
        id: `permission-${permissionCounter++}`,
        name: `${permission.name} ${featureName}`,
        code: `${moduleName}_${permission.code}_${featureName
          .toUpperCase()
          .replace(/\s+/g, "_")}`,
      }));

      return {
        id: featureId,
        name: featureName,
        code: featureName.toUpperCase().replace(/\s+/g, "_"),
        permissions,
      };
    }),
  })),
};

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
  loadData,
  initialRoleId,
  initialPermissionIds = [],
  role,
  onSave,
  title = "Add Role",
}: RolePermissionModalProps) {
  const { primaryColor } = useTheme();
  const [data, setData] = useState<RolePermissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<number | string | null>(
    null,
  );
  const [selectedByRole, setSelectedByRole] = useState<
    Record<string, string[]>
  >({});
  const [roleName, setRoleName] = useState("");
  const [search, setSearch] = useState("");

  const initializedRef = useRef(false);
  const loadDataRef = useRef(loadData);
  const initialRoleIdRef = useRef(initialRoleId);
  const initialPermissionIdsRef = useRef(initialPermissionIds);
  const roleRef = useRef(role);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    initialRoleIdRef.current = initialRoleId;
  }, [initialRoleId]);

  useEffect(() => {
    initialPermissionIdsRef.current = initialPermissionIds;
  }, [initialPermissionIds]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;

    initializedRef.current = true;
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setUsingDemoData(false);

      try {
        let result: RolePermissionData | null = null;

        if (loadDataRef.current) {
          try {
            result = await loadDataRef.current();
          } catch {
            result = null;
          }
        }

        if (
          !result ||
          !Array.isArray(result.roles) ||
          result.roles.length === 0
        ) {
          result = DEMO_DATA;
          setUsingDemoData(true);
        }
        if (cancelled) return;

        setData(result);
        const currentRole = roleRef.current;
        const requestedId = initialRoleIdRef.current ?? currentRole?.id;
        const selectedRole =
          result.roles.find(
            (item) => String(item.id) === String(requestedId),
          ) ?? result.roles[0];

        if (!selectedRole) {
          setActiveRoleId(null);
          return;
        }

        setActiveRoleId(selectedRole.id);
        setRoleName(currentRole?.name ?? "");

        const initialIds = initialPermissionIdsRef.current.map(String);
        const rolePermissions =
          initialIds.length > 0
            ? initialIds
            : currentRole &&
                String(currentRole.id) === String(selectedRole.id) &&
                Array.isArray(currentRole.permissions)
              ? currentRole.permissions.map((item) => String(item.id))
              : [];

        setSelectedByRole({ [String(selectedRole.id)]: rolePermissions });
        setSearch("");
      } catch {
        if (cancelled) return;
        setData(DEMO_DATA);
        setUsingDemoData(true);
        setActiveRoleId(DEMO_DATA.roles[0]?.id ?? null);
        setRoleName(roleRef.current?.name ?? "");
        setSelectedByRole({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const activeRole = useMemo(() => {
    if (!data || activeRoleId === null) return null;
    return (
      data.roles.find((item) => String(item.id) === String(activeRoleId)) ??
      null
    );
  }, [data, activeRoleId]);

  const selectedPermissionIds = useMemo(
    () =>
      new Set(
        activeRoleId === null
          ? []
          : (selectedByRole[String(activeRoleId)] ?? []),
      ),
    [selectedByRole, activeRoleId],
  );

  const visibleFeatures = useMemo(() => {
    if (!activeRole) return [];
    const query = search.trim().toLowerCase();
    if (!query) return activeRole.features;

    return activeRole.features
      .map((feature) => {
        const featureMatches =
          feature.name.toLowerCase().includes(query) ||
          feature.code?.toLowerCase().includes(query);
        if (featureMatches) return feature;

        const permissions = feature.permissions.filter(
          (permission) =>
            permission.name.toLowerCase().includes(query) ||
            permission.code?.toLowerCase().includes(query),
        );
        return permissions.length > 0 ? { ...feature, permissions } : null;
      })
      .filter((feature): feature is FeatureItem => feature !== null);
  }, [activeRole, search]);

  const allPermissionIds = useMemo(
    () =>
      activeRole?.features.flatMap((feature) =>
        feature.permissions.map((permission) => String(permission.id)),
      ) ?? [],
    [activeRole],
  );

  const allSelected =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => selectedPermissionIds.has(id));
  const someSelected = allPermissionIds.some((id) =>
    selectedPermissionIds.has(id),
  );

  const updatePermissions = useCallback(
    (updater: (current: Set<string>) => Set<string>) => {
      if (activeRoleId === null) return;
      const key = String(activeRoleId);
      setSelectedByRole((previous) => {
        const current = new Set(previous[key] ?? []);
        const next = updater(current);
        return { ...previous, [key]: Array.from(next) };
      });
    },
    [activeRoleId],
  );

  const togglePermission = useCallback(
    (permissionId: number | string) => {
      const key = String(permissionId);
      updatePermissions((current) => {
        if (current.has(key)) current.delete(key);
        else current.add(key);
        return current;
      });
    },
    [updatePermissions],
  );

  const toggleFeature = useCallback(
    (feature: FeatureItem) => {
      const ids = feature.permissions.map((item) => String(item.id));
      updatePermissions((current) => {
        const fullySelected =
          ids.length > 0 && ids.every((id) => current.has(id));
        ids.forEach((id) => {
          if (fullySelected) current.delete(id);
          else current.add(id);
        });
        return current;
      });
    },
    [updatePermissions],
  );

  const toggleAll = useCallback(() => {
    updatePermissions((current) => {
      const fullySelected =
        allPermissionIds.length > 0 &&
        allPermissionIds.every((id) => current.has(id));
      allPermissionIds.forEach((id) => {
        if (fullySelected) current.delete(id);
        else current.add(id);
      });
      return current;
    });
  }, [allPermissionIds, updatePermissions]);

  const handleModuleChange = (moduleId: number | string) => {
    setActiveRoleId(moduleId);
    setSearch("");
  };

  const handleSave = useCallback(async () => {
    if (activeRoleId === null || !roleName.trim()) return;
    const key = String(activeRoleId);
    const permissionIds = selectedByRole[key] ?? [];
    const featureIds =
      activeRole?.features
        .filter((feature) =>
          feature.permissions.some((permission) =>
            permissionIds.includes(String(permission.id)),
          ),
        )
        .map((feature) => feature.id) ?? [];

    const payload: RolePermissionSavePayload = {
      roleId: activeRoleId,
      roleName: roleName.trim(),
      permissionIds,
      featureIds,
    };

    try {
      setSaving(true);
      await onSave?.(payload);
    } finally {
      setSaving(false);
    }
  }, [activeRole, activeRoleId, onSave, roleName, selectedByRole]);

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
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <label
            htmlFor="role-name"
            className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]"
          >
            <span className="mr-1" style={{ color: primaryColor }}>
              *
            </span>
            Role Name
          </label>
          <input
            id="role-name"
            type="text"
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder="Enter role name"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:ring-2"
            style={
              { "--tw-ring-color": `${primaryColor}25` } as React.CSSProperties
            }
          />
        </div>

        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-5 py-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {data?.roles.map((item) => {
              const isActive = String(activeRoleId) === String(item.id);
              const selectedCount =
                selectedByRole[String(item.id)]?.length ?? 0;
              return (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => handleModuleChange(item.id)}
                  className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition"
                  style={
                    isActive
                      ? {
                          borderColor: primaryColor,
                          backgroundColor: primaryColor,
                          color: "#fff",
                          boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)",
                        }
                      : {
                          borderColor: "var(--border)",
                          backgroundColor: "var(--card)",
                          color: "var(--muted-foreground)",
                        }
                  }
                >
                  {item.name}
                  {selectedCount > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px]"
                      style={
                        isActive
                          ? {
                              backgroundColor: "rgb(255 255 255 / 0.2)",
                              color: "#fff",
                            }
                          : {
                              backgroundColor: `${primaryColor}18`,
                              color: primaryColor,
                            }
                      }
                    >
                      {selectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-[270px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search features or permissions..."
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-xs text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)]"
              style={
                {
                  "--tw-ring-color": `${primaryColor}25`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {activeRole?.name ?? "Features"} — Features & Permissions
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Select the permissions this role can access.
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${primaryColor}18`,
              color: primaryColor,
            }}
          >
            {selectedPermissionIds.size} selected
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">
          {usingDemoData && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Demo features and permissions are displayed. Connect your backend
              data before production use.
            </div>
          )}
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-[var(--muted-foreground)]">
              Loading features and permissions...
            </div>
          ) : !activeRole ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-[var(--muted-foreground)]">
              No modules found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(150px,230px)_minmax(0,1fr)] border-b border-[var(--border)] bg-[var(--muted)]">
                <div className="flex items-center gap-2 border-r border-[var(--border)] px-3 py-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                    ariaLabel="Select all permissions"
                  />
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-semibold text-[var(--foreground)]"
                  >
                    Features
                  </button>
                </div>
                <div className="flex items-center px-3 py-3">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Permissions
                  </span>
                </div>
              </div>

              {visibleFeatures.length === 0 ? (
                <div className="flex min-h-[130px] items-center justify-center text-sm text-[var(--muted-foreground)]">
                  No features or permissions found.
                </div>
              ) : (
                visibleFeatures.map((feature) => {
                  const permissionIds = feature.permissions.map((item) =>
                    String(item.id),
                  );
                  const selectedCount = permissionIds.filter((id) =>
                    selectedPermissionIds.has(id),
                  ).length;
                  const fullySelected =
                    permissionIds.length > 0 &&
                    selectedCount === permissionIds.length;
                  const partiallySelected =
                    selectedCount > 0 && selectedCount < permissionIds.length;

                  return (
                    <div
                      key={String(feature.id)}
                      className="grid grid-cols-[minmax(150px,230px)_minmax(0,1fr)] border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="flex min-h-[56px] items-center gap-2 border-r border-[var(--border)] bg-[var(--card)] px-3 py-3">
                        <Checkbox
                          checked={fullySelected}
                          indeterminate={partiallySelected}
                          onChange={() => toggleFeature(feature)}
                          ariaLabel={`Select ${feature.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className="min-w-0 text-left text-xs font-medium leading-5 text-[var(--foreground)] transition"
                          onMouseEnter={(event) => {
                            event.currentTarget.style.color = primaryColor;
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.color =
                              "var(--foreground)";
                          }}
                        >
                          {feature.name}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-x-3 gap-y-2 bg-[var(--card)] p-3 sm:grid-cols-2 xl:grid-cols-3">
                        {feature.permissions.map((permission) => {
                          const checked = selectedPermissionIds.has(
                            String(permission.id),
                          );
                          return (
                            <label
                              key={String(permission.id)}
                              className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs transition"
                              style={{
                                backgroundColor: checked
                                  ? `${primaryColor}0D`
                                  : "transparent",
                                color: checked
                                  ? primaryColor
                                  : "var(--muted-foreground)",
                              }}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={() => togglePermission(permission.id)}
                                ariaLabel={permission.name}
                              />
                              <span className="break-words leading-5">
                                {permission.name}
                              </span>
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

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <ShieldCheck size={16} style={{ color: primaryColor }} />
            <span>
              <strong className="font-semibold text-[var(--foreground)]">
                {selectedPermissionIds.size}
              </strong>{" "}
              permissions selected
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:opacity-80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading || !activeRole || !roleName.trim()}
              className="rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? "Saving..." : "Save Role"}
            </button>
          </div>
        </footer>
      </Modal>
    </div>
  );
}
