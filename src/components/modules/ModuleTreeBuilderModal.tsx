"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Check,
  X,
  Layers,
  FolderTree,
  Sparkles,
  Link2,
  Tag,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveModuleTree,
  type FeatureNode,
  type ModuleTreeNode,
} from "@/services/moduleTreeService";

interface ModuleTreeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (savedModule: ModuleTreeNode) => void;
  initialModule?: ModuleTreeNode | null;
}

export default function ModuleTreeBuilderModal({
  isOpen,
  onClose,
  onSuccess,
  initialModule,
}: ModuleTreeBuilderModalProps) {
  // Module Form States
  const [moduleName, setModuleName] = useState(initialModule?.name || "");
  const [moduleCode, setModuleCode] = useState(initialModule?.code || "");
  const [pathRoute, setPathRoute] = useState(initialModule?.pathRoute || "");
  const [icon, setIcon] = useState(initialModule?.icon || "Layers");
  const [description, setDescription] = useState(initialModule?.description || "");
  const [displayOrder, setDisplayOrder] = useState<number>(initialModule?.displayOrder || 1);
  const [isActive, setIsActive] = useState<boolean>(initialModule?.isActive ?? true);

  // Nested Features List
  const [features, setFeatures] = useState<FeatureNode[]>(initialModule?.features || []);

  // Inline "+" Staging Form State
  const [isDraftingFeature, setIsDraftingFeature] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftRoute, setDraftRoute] = useState("");
  const [draftAction, setDraftAction] = useState("read");

  // Editing existing item index
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModuleName(initialModule?.name || "");
      setModuleCode(initialModule?.code || "");
      setPathRoute(initialModule?.pathRoute || "");
      setIcon(initialModule?.icon || "Layers");
      setDescription(initialModule?.description || "");
      setDisplayOrder(initialModule?.displayOrder || 1);
      setIsActive(initialModule?.isActive ?? true);
      setFeatures(initialModule?.features ? [...initialModule.features] : []);
      setIsDraftingFeature(false);
      setEditingIndex(null);
    }
  }, [isOpen, initialModule]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingIndex(null);
    setDraftName("");
    setDraftCode("");
    setDraftRoute("");
    setDraftAction("read");
    setIsDraftingFeature(true);
  };

  const handleConfirmFeature = () => {
    if (!draftName.trim() || !draftCode.trim()) {
      toast.error("Please provide both Feature Name and Feature Code / ID");
      return;
    }

    const formattedCode = draftCode.trim().toUpperCase().replace(/\s+/g, "_");

    if (editingIndex !== null) {
      // Update existing
      setFeatures((prev) =>
        prev.map((item, idx) =>
          idx === editingIndex
            ? {
                ...item,
                name: draftName.trim(),
                code: formattedCode,
                routePath: draftRoute.trim() || undefined,
                actionType: draftAction,
              }
            : item,
        ),
      );
      toast.success(`Feature "${draftName}" updated in tree`);
      setEditingIndex(null);
    } else {
      // Add new
      const newFeature: FeatureNode = {
        name: draftName.trim(),
        code: formattedCode,
        routePath: draftRoute.trim() || undefined,
        actionType: draftAction,
        displayOrder: features.length + 1,
        isActive: true,
      };
      setFeatures((prev) => [...prev, newFeature]);
      toast.success(`Added "${draftName}" to tree`);
    }

    // Reset inline inputs
    setDraftName("");
    setDraftCode("");
    setDraftRoute("");
    setIsDraftingFeature(false);
  };

  const handleEditFeature = (index: number) => {
    const target = features[index];
    setDraftName(target.name);
    setDraftCode(target.code);
    setDraftRoute(target.routePath || "");
    setDraftAction(target.actionType || "read");
    setEditingIndex(index);
    setIsDraftingFeature(true);
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    toast.info("Feature removed from tree");
  };

  const handleSubmitTree = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleName.trim() || !moduleCode.trim()) {
      toast.error("Module Name and Module Code are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ModuleTreeNode = {
        id: initialModule?.id,
        name: moduleName.trim(),
        code: moduleCode.trim().toUpperCase().replace(/\s+/g, "_"),
        pathRoute: pathRoute.trim() || undefined,
        icon: icon.trim() || undefined,
        description: description.trim() || undefined,
        displayOrder,
        isActive,
        features,
      };

      const result = await saveModuleTree(payload);
      toast.success(`Module "${result.name}" with ${features.length} nested features saved successfully!`);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to save module tree");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialModule ? "Edit Module & Feature Tree" : "Create Module & Nested Feature Tree"}
              </h2>
              <p className="text-xs text-slate-500">
                Define parent module routing and configure child features dynamically with the + button.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitTree} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: Module Definition */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
              <span>1. Module Parent Header</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM & Sales"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Module Code / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM"
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Base Route Path
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="/dashboard/crm"
                    value={pathRoute}
                    onChange={(e) => setPathRoute(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lucide Icon Key
                </label>
                <input
                  type="text"
                  placeholder="e.g. Users, Building2, Layers"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="module-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="module-active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Module Active & Visible
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of functions governed by this module..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          {/* SECTION 2: Nested Feature Tree Management */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <FolderTree className="h-4 w-4" />
                <span>2. Nested Features ({features.length} configured)</span>
              </div>

              {!isDraftingFeature && (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature Row
                </button>
              )}
            </div>

            {/* Inline "+" Staging Form */}
            {isDraftingFeature && (
              <div className="p-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    {editingIndex !== null ? "Edit Feature" : "New Nested Feature"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click OK checkmark to add without submitting entire form
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Feature Name *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Lead Transfer"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Feature ID / Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CRM_LEAD_TRANSFER"
                      value={draftCode}
                      onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Route Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /crm/lead/transfer-history"
                      value={draftRoute}
                      onChange={(e) => setDraftRoute(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Action Type
                    </label>
                    <select
                      value={draftAction}
                      onChange={(e) => setDraftAction(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="read">Read (View)</option>
                      <option value="write">Write (Create/Edit)</option>
                      <option value="admin">Admin (Manage)</option>
                      <option value="report">Report (Analytics)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDraftingFeature(false);
                      setEditingIndex(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFeature}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    OK (Add to Tree)
                  </button>
                </div>
              </div>
            )}

            {/* Staged Features Table */}
            {features.length === 0 && !isDraftingFeature ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  No nested features added yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click the "+ Add Feature Row" button above to add sub-functions and route permissions.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold text-[11px] uppercase">
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Feature Name</th>
                      <th className="p-2.5">Feature ID / Code</th>
                      <th className="p-2.5">Route Path</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {features.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {feat.name}
                        </td>
                        <td className="p-2.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          {feat.code}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {feat.routePath || "—"}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {feat.actionType || "read"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditFeature(idx)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit feature"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeature(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Delete feature"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5">
            <span className="text-xs text-slate-500">
              Total 1 Module and {features.length} nested features will be saved atomically.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving Tree…" : "Save Entire Module Tree"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
