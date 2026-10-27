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
  Eye,
  GitBranch,
  ArrowRight,
  ChevronRight,
  Database,
  Layout,
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
  // Modal View Mode: "edit" or "preview"
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

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
      setActiveTab("edit");
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
        icon: icon.trim() || "Layers",
        description: description.trim() || undefined,
        displayOrder: Number(displayOrder) || 1,
        isActive,
        features: features.map((f, idx) => ({
          name: f.name.trim(),
          code: f.code.trim().toUpperCase().replace(/\s+/g, "_"),
          routePath: f.routePath?.trim() || undefined,
          actionType: f.actionType || "read",
          displayOrder: idx + 1,
          isActive: f.isActive ?? true,
        })),
      };

      const result = await saveModuleTree(payload);
      toast.success(
        initialModule?.id
          ? `Module "${payload.name}" updated successfully`
          : `Module "${payload.name}" and ${features.length} nested features created`,
      );
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err: any) {
      console.error("Save module tree failed", err);
      toast.error(err.response?.data?.message || "Failed to save module tree hierarchy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {initialModule?.id ? "Edit Dynamic Module Tree" : "Create Dynamic Module Tree"}
                </h3>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Atomic Tree
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define the root system module and attach atomic nested features in one single operation.
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === "edit"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Configuration
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
                  activeTab === "preview"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Architecture Preview</span>
                <span className="ml-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 text-[10px]">
                  {features.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitTree} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "preview" ? (
            /* VISUAL ARCHITECTURE TREE PREVIEW */
            <div className="space-y-6 py-2">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nested Architecture Visual Tree
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Root Module + {features.length} Nested Features
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  This visual graph shows how this module is rendered across the universal dashboard, sidebar, and RBAC guard engine.
                </p>
              </div>

              {/* Tree Diagram */}
              <div className="relative pl-6 space-y-6">
                {/* ROOT MODULE NODE */}
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="flex-1 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Root Module
                        </span>
                        <span className="rounded-md bg-indigo-600 text-white font-mono text-xs px-2 py-0.5 font-bold">
                          {moduleCode || "MODULE_CODE"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {moduleName || "Untitled Module"}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">
                      <span>Path: {pathRoute || "None"}</span>
                      <span>Order: #{displayOrder}</span>
                      <span>Icon: {icon}</span>
                    </div>
                  </div>
                </div>

                {/* SVG STEM CONNECTOR */}
                <div className="relative pl-6 ml-6 border-l-2 border-dashed border-indigo-300 dark:border-indigo-800 space-y-4 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nested Features & Actions ({features.length})
                  </span>

                  {features.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                      No nested features attached. Switch to Configuration tab to add features.
                    </div>
                  ) : (
                    features.map((feat, idx) => {
                      const actionBadgeColor =
                        feat.actionType === "manage" || feat.actionType === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200"
                          : feat.actionType === "write"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
                          : feat.actionType === "delete"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";

                      return (
                        <div
                          key={idx}
                          className="relative flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs hover:border-indigo-300 transition"
                        >
                          {/* Branch indicator */}
                          <div className="absolute -left-6 top-1/2 -mt-px w-6 border-t-2 border-dashed border-indigo-300 dark:border-indigo-800" />

                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {feat.name}
                                </span>
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {feat.code}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                                <span>Route: {feat.routePath || "None (Inline)"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${actionBadgeColor}`}
                            >
                              {feat.actionType || "read"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CONFIGURATION EDIT TAB */
            <>
              {/* Section 1: Module Metadata */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Step 1: Root Module Attributes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Module Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales & CRM, Project Management"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Module Code / Identifier <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CRM_CORE, PROJECTS_CORE"
                      value={moduleCode}
                      onChange={(e) => setModuleCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Root Route / Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /crm, /projects"
                      value={pathRoute}
                      onChange={(e) => setPathRoute(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Icon (Lucide)
                      </label>
                      <input
                        type="text"
                        placeholder="Layers, Sparkles, Boxes"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Nested Features Table */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Step 2: Nested Features & Route Permissions ({features.length})
                    </span>
                  </div>

                  {!isDraftingFeature && (
                    <button
                      type="button"
                      onClick={handleStartAdd}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Feature Row
                    </button>
                  )}
                </div>

                {/* Inline Add / Edit Staging Row */}
                {isDraftingFeature && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        {editingIndex !== null ? "Edit Feature Node" : "Stage New Nested Feature"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDraftingFeature(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Feature Name (e.g. View Leads)"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Feature Code (e.g. CRM_LEADS_VIEW)"
                          value={draftCode}
                          onChange={(e) => setDraftCode(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Route (e.g. /crm/leads)"
                          value={draftRoute}
                          onChange={(e) => setDraftRoute(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <select
                          value={draftAction}
                          onChange={(e) => setDraftAction(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="read">read (View Only)</option>
                          <option value="write">write (Create/Edit)</option>
                          <option value="delete">delete (Removal)</option>
                          <option value="manage">manage (Full Admin)</option>
                          <option value="export">export (Reports)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmFeature}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {editingIndex !== null ? "Update In Tree" : "Add To Tree"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Features Table */}
                {features.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-500">
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
            </>
          )}

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
