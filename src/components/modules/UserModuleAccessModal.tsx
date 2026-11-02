"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  User,
  Save,
  Loader2,
  Sparkles,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  getModuleTree,
  type ModuleTreeNode,
} from "@/services/moduleTreeService";
import {
  getUserFeatureAccess,
  updateUserFeatureAccess,
  type User as UserModel,
  type FeatureOverrideItem,
} from "@/services/userService";
import ModuleFeatureAccessTreeSelector, {
  type FeaturePermissionState,
} from "./ModuleFeatureAccessTreeSelector";

interface UserModuleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserModel | null;
  onSuccess?: () => void;
}

export default function UserModuleAccessModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserModuleAccessModalProps) {
  const { primaryColor } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ModuleTreeNode[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<(number | string)[]>([]);
  const [featurePermissions, setFeaturePermissions] = useState<
    Record<string | number, FeaturePermissionState>
  >({});

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Load module tree hierarchy
      const moduleTree = await getModuleTree();
      setModules(moduleTree || []);

      // 2. Load user's existing feature access
      const accessData = await getUserFeatureAccess(user.id || user.uuid || "");
      if (accessData) {
        setSelectedModuleIds(accessData.moduleIds || []);

        const perms: Record<string | number, FeaturePermissionState> = {};
        (accessData.featureOverrides || []).forEach((fo) => {
          perms[fo.featureId] = {
            isGranted: fo.isGranted ?? true,
            canView: fo.canView ?? true,
            canCreate: fo.canCreate ?? true,
            canEdit: fo.canEdit ?? true,
            canDelete: fo.canDelete ?? false,
            canApprove: fo.canApprove ?? false,
          };
        });

        // If user already had moduleIds but no overrides yet, default enable features under those modules
        if ((!accessData.featureOverrides || accessData.featureOverrides.length === 0) && accessData.moduleIds?.length) {
          const modSet = new Set(accessData.moduleIds.map(String));
          (moduleTree || []).forEach((m) => {
            if (modSet.has(String(m.id ?? m.uuid))) {
              (m.features || []).forEach((f) => {
                const fid = f.id ?? f.uuid ?? f.code;
                if (fid !== undefined) {
                  perms[fid] = {
                    isGranted: true,
                    canView: true,
                    canCreate: true,
                    canEdit: true,
                    canDelete: false,
                  };
                }
              });
            }
          });
        }

        setFeaturePermissions(perms);
      }
    } catch (err: any) {
      console.error("Failed to load user module access", err);
      toast.error("Failed to load user access permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const overrides: FeatureOverrideItem[] = Object.entries(featurePermissions).map(
        ([featureId, state]) => ({
          featureId: Number(featureId),
          isGranted: state.isGranted,
          canView: state.canView,
          canCreate: state.canCreate,
          canEdit: state.canEdit,
          canDelete: state.canDelete,
          canApprove: state.canApprove,
        }),
      );

      const numModuleIds = selectedModuleIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      await updateUserFeatureAccess(user.id || user.uuid || "", {
        moduleIds: numModuleIds,
        featureOverrides: overrides,
      });

      toast.success(
        `Updated module & feature access for "${user.firstName || user.username || "User"}"`,
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save feature access", err);
      toast.error(err.message || "Failed to update module and feature access");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Module & Feature Access Entitlements
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {displayName}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure dynamic module visibility, nested route authorization, and granular Read/Write operations for this user.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Quick Info Pill */}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              @{user.username}
            </span>
            <span>&bull;</span>
            <span>{user.email}</span>
            {user.userType && (
              <>
                <span>&bull;</span>
                <span className="capitalize font-medium">Type: {user.userType}</span>
              </>
            )}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Loading module tree and feature permissions...</p>
            </div>
          ) : (
            <ModuleFeatureAccessTreeSelector
              modules={modules}
              selectedModuleIds={selectedModuleIds}
              featurePermissions={featurePermissions}
              onChange={(updatedMods, updatedPerms) => {
                setSelectedModuleIds(updatedMods);
                setFeaturePermissions(updatedPerms);
              }}
              primaryColor={primaryColor}
            />
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500">
            Selected <strong className="text-indigo-600">{selectedModuleIds.length}</strong> modules and{" "}
            <strong className="text-indigo-600">
              {Object.values(featurePermissions).filter((p) => p.isGranted).length}
            </strong>{" "}
            features
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving Changes..." : "Save Entitlements"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
