"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Check,
  Ban,
  Search,
  Filter,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  getUserCustomPermissions,
  bulkSetUserCustomPermissionOverrides,
  type UserPermissionOverrideItem,
} from "@/services/customPermissionService";
import type { User as UserModel } from "@/services/userService";

interface UserCustomPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserModel | null;
  onSuccess?: () => void;
}

type EffectChoice = "INHERIT" | "ALLOW" | "DENY";

interface LocalOverrideState {
  effect: EffectChoice;
  reason: string;
}

export default function UserCustomPermissionModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserCustomPermissionModalProps) {
  const { primaryColor } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissionOverrideItem[]>([]);
  const [localOverrides, setLocalOverrides] = useState<Record<string | number, LocalOverrideState>>({});
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "DENY" | "ALLOW" | "INHERIT">("all");

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    } else {
      setPermissions([]);
      setLocalOverrides({});
      setSearch("");
      setFilterAction("all");
      setFilterStatus("all");
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    const identifier = user.id ?? user.uuid;
    if (!identifier) return;

    setLoading(true);
    try {
      const res = await getUserCustomPermissions(identifier);
      const items = res.permissions || [];
      setPermissions(items);

      const initialOverrides: Record<string | number, LocalOverrideState> = {};
      items.forEach((p) => {
        initialOverrides[p.id] = {
          effect: (p.override?.effect as EffectChoice) || "INHERIT",
          reason: p.override?.reason || "",
        };
      });
      setLocalOverrides(initialOverrides);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load custom permission overrides");
    } finally {
      setLoading(false);
    }
  };

  const handleEffectChange = (permId: string | number, newEffect: EffectChoice) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [permId]: {
        effect: newEffect,
        reason: prev[permId]?.reason || "",
      },
    }));
  };

  const handleReasonChange = (permId: string | number, reason: string) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [permId]: {
        effect: prev[permId]?.effect || "INHERIT",
        reason,
      },
    }));
  };

  const handleResetAll = () => {
    const resetState: Record<string | number, LocalOverrideState> = {};
    permissions.forEach((p) => {
      resetState[p.id] = {
        effect: "INHERIT",
        reason: "",
      };
    });
    setLocalOverrides(resetState);
    toast.info("All permissions set to Inherit from Role");
  };

  const handleSave = async () => {
    if (!user) return;
    const identifier = user.id ?? user.uuid;
    if (!identifier) return;

    setSaving(true);
    try {
      const payload = Object.entries(localOverrides).map(([permId, state]) => ({
        customPermissionId: permId,
        effect: state.effect,
        reason: state.reason?.trim() || undefined,
      }));

      await bulkSetUserCustomPermissionOverrides(identifier, payload);
      toast.success("User permission overrides saved successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save user permission overrides");
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const state = localOverrides[p.id]?.effect || "INHERIT";

      if (filterStatus !== "all" && state !== filterStatus) {
        return false;
      }

      if (filterAction !== "all" && p.action?.toLowerCase() !== filterAction.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesKey = p.key?.toLowerCase().includes(q);
        const matchesFeature = p.feature?.name?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesKey && !matchesFeature && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [permissions, localOverrides, search, filterAction, filterStatus]);

  const counts = useMemo(() => {
    let denied = 0;
    let allowed = 0;
    let inherited = 0;
    Object.values(localOverrides).forEach((s) => {
      if (s.effect === "DENY") denied++;
      else if (s.effect === "ALLOW") allowed++;
      else inherited++;
    });
    return { denied, allowed, inherited, total: permissions.length };
  }, [localOverrides, permissions]);

  if (!isOpen || !user) return null;

  const displayName =
    (user as any).name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";

  const rawRoles = (user as any).roles || (user as any).roleIds || [];
  const userRoles = Array.isArray(rawRoles) && rawRoles.length > 0
    ? rawRoles
        .map((r: any) => (typeof r === "string" ? r : r.name || r.title || `Role ${r}`))
        .join(", ")
    : "Standard User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-indigo-100"
              style={{ backgroundColor: primaryColor }}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800">
                  Custom Permission Overrides & Restrictions
                </h2>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  User Level
                </span>
              </div>
              <p className="text-xs text-slate-500">
                User: <span className="font-semibold text-slate-700">{displayName}</span>
                {user.email ? ` (${user.email})` : ""} | Base Roles:{" "}
                <span className="font-semibold text-indigo-600">{userRoles || "None"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informational Architecture Banner */}
        <div className="border-b border-indigo-100 bg-indigo-50/70 px-6 py-2.5 flex items-center justify-between gap-4 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-600" />
            <span>
              <strong>Explicit DENY</strong> always overrides role permissions. Restrict an individual user without creating separate roles.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-medium text-[11px]">
              <Ban className="h-3 w-3" /> {counts.denied} Denied
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium text-[11px]">
              <Check className="h-3 w-3" /> {counts.allowed} Allowed
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium text-[11px]">
              {counts.inherited} Inherited
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search permission or feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(["all", "DENY", "ALLOW", "INHERIT"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterStatus === s
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "all"
                    ? "All"
                    : s === "DENY"
                      ? "Restricted"
                      : s === "ALLOW"
                        ? "Explicit Grant"
                        : "Inherited"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              title="Reset all to Inherited"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">Loading custom permissions catalog...</p>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Custom Permissions Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You haven't defined any custom permissions yet. Visit the Permissions page to configure granular actions first.
              </p>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">No permissions match your filter criteria.</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filteredPermissions.map((perm) => {
                const overrideState = localOverrides[perm.id] || { effect: "INHERIT", reason: "" };
                const currentEffect = overrideState.effect;

                return (
                  <div
                    key={perm.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      currentEffect === "DENY"
                        ? "border-rose-200 bg-rose-50/40"
                        : currentEffect === "ALLOW"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-800">
                          {perm.name}
                        </span>
                        <code className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {perm.key}
                        </code>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {perm.action}
                        </span>
                        {perm.feature?.name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {perm.feature.name}
                          </span>
                        )}
                      </div>

                      {perm.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {perm.description}
                        </p>
                      )}

                      {/* Reason input when override is active */}
                      {currentEffect !== "INHERIT" && (
                        <div className="pt-1.5 max-w-md">
                          <input
                            type="text"
                            placeholder="Optional reason for override (e.g. Trainee restriction)..."
                            value={overrideState.reason}
                            onChange={(e) => handleReasonChange(perm.id, e.target.value)}
                            className="w-full text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 text-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Three Way Switch */}
                    <div className="flex items-center gap-1 shrink-0 self-start md:self-center">
                      {/* Inherit Button */}
                      <button
                        type="button"
                        onClick={() => handleEffectChange(perm.id, "INHERIT")}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                          currentEffect === "INHERIT"
                            ? "bg-slate-700 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Inherit behavior from user assigned role"
                      >
                        Inherit Role
                      </button>

                      {/* Explicit Allow Button */}
                      <button
                        type="button"
                        onClick={() => handleEffectChange(perm.id, "ALLOW")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                          currentEffect === "ALLOW"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                        title="Explicitly grant this permission"
                      >
                        <Check className="h-3 w-3" />
                        Allow
                      </button>

                      {/* Explicit Deny Button */}
                      <button
                        type="button"
                        onClick={() => handleEffectChange(perm.id, "DENY")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                          currentEffect === "DENY"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        }`}
                        title="Explicitly block and restrict this permission"
                      >
                        <Ban className="h-3 w-3" />
                        Deny
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {counts.denied > 0 ? (
              <span className="text-rose-600 font-semibold">
                {counts.denied} permission{counts.denied > 1 ? "s" : ""} will be restricted for this user.
              </span>
            ) : (
              <span>All active changes will be saved to the database.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Overrides...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Overrides
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
