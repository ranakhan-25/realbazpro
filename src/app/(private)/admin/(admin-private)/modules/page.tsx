"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
  Link2,
  CheckCircle2,
  Layers,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import ModuleTreeBuilderModal from "@/components/modules/ModuleTreeBuilderModal";
import ModuleHierarchicalTree from "@/components/modules/ModuleHierarchicalTree";
import {
  getModuleTree,
  deleteModule,
  deleteModuleFeature,
  type ModuleTreeNode,
  type FeatureNode,
} from "@/services/moduleTreeService";

const FALLBACK_MODULE_TREES: ModuleTreeNode[] = [
  {
    id: 1,
    name: "System & Administration",
    code: "SYSTEM_ADMIN",
    pathRoute: "/admin",
    icon: "ShieldCheck",
    description: "Core tenancy, organizations, subscription plans, and user permissions.",
    displayOrder: 1,
    isActive: true,
    features: [
      {
        id: 101,
        moduleId: 1,
        name: "Organizations Management",
        code: "SYS_ORGS_MANAGE",
        routePath: "/admin/orgs",
        actionType: "manage",
        description: "Create, configure, and lock tenant organizations.",
        isActive: true,
      },
      {
        id: 102,
        moduleId: 1,
        name: "Subscription Plans",
        code: "SYS_PLANS_MANAGE",
        routePath: "/admin/plans",
        actionType: "manage",
        description: "Manage commercial tiers, duration, quotas, and pricing.",
        isActive: true,
      },
      {
        id: 103,
        moduleId: 1,
        name: "Dynamic Module Tree",
        code: "SYS_MODULES_TREE",
        routePath: "/admin/modules",
        actionType: "manage",
        description: "Configure system modules, sub-modules, and nested features.",
        isActive: true,
      },
      {
        id: 104,
        moduleId: 1,
        name: "Roles & Permissions",
        code: "SYS_ROLES_PERMISSIONS",
        routePath: "/admin/roles",
        actionType: "manage",
        description: "Manage global and tenant-specific role entitlements.",
        isActive: true,
      },
    ],
  },
  {
    id: 2,
    name: "CRM & Sales Pipeline",
    code: "CRM_SALES",
    pathRoute: "/crm",
    icon: "Sparkles",
    description: "Leads tracking, pipeline stages, client meetings, and conversion history.",
    displayOrder: 2,
    isActive: true,
    features: [
      {
        id: 201,
        moduleId: 2,
        name: "Leads Directory",
        code: "CRM_LEADS_VIEW",
        routePath: "/crm/leads",
        actionType: "read",
        description: "View and filter incoming customer leads.",
        isActive: true,
      },
      {
        id: 202,
        moduleId: 2,
        name: "Create & Convert Leads",
        code: "CRM_LEADS_WRITE",
        routePath: "/crm/leads/new",
        actionType: "write",
        description: "Add new leads and convert to opportunity.",
        isActive: true,
      },
      {
        id: 203,
        moduleId: 2,
        name: "Meetings & Calls",
        code: "CRM_MEETINGS_MANAGE",
        routePath: "/crm/meetings",
        actionType: "manage",
        description: "Schedule follow-up meetings and track discussion notes.",
        isActive: true,
      },
    ],
  },
  {
    id: 3,
    name: "Projects & Real Estate",
    code: "PROJECTS_CORE",
    pathRoute: "/projects",
    icon: "Boxes",
    description: "Land development, site progress, BOQ allocations, and contractor billing.",
    displayOrder: 3,
    isActive: true,
    features: [
      {
        id: 301,
        moduleId: 3,
        name: "Project Sites Directory",
        code: "PROJECTS_LIST",
        routePath: "/projects/list",
        actionType: "read",
        description: "Overview of all active development sites.",
        isActive: true,
      },
      {
        id: 302,
        moduleId: 3,
        name: "Material Requisitions",
        code: "PROJECTS_REQUISITIONS",
        routePath: "/projects/requisitions",
        actionType: "write",
        description: "Site engineer material requests and approvals.",
        isActive: true,
      },
    ],
  },
];

export default function ModuleManagementPage() {
  const { primaryColor } = useTheme();

  const [modules, setModules] = useState<ModuleTreeNode[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Tree Modal State
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleTreeNode | null>(null);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);
  const [selectedParentGroup, setSelectedParentGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "visual-cards">("tree");

  // Collapsible Accordion State
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
  });

  const [activeDropdownId, setActiveDropdownId] = useState<string | number | null>(null);
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | number | null>(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await getModuleTree();
      if (Array.isArray(data) && data.length > 0) {
        setModules(data);
        setIsUsingFallback(false);
      } else {
        setModules(FALLBACK_MODULE_TREES);
        setIsUsingFallback(true);
      }
    } catch (err) {
      console.warn("Using sample module tree data because API is offline:", err);
      setModules(FALLBACK_MODULE_TREES);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const toggleExpand = (id: string | number) => {
    const key = String(id);
    setExpandedModuleIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    modules.forEach((mod) => {
      const key = String(mod.id || mod.code);
      allExpanded[key] = true;
    });
    setExpandedModuleIds(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedModuleIds({});
  };

  const handleOpenCreateModal = () => {
    setSelectedModule(null);
    setSelectedFeatureIndex(null);
    setSelectedParentGroup(null);
    setIsTreeModalOpen(true);
  };

  const handleOpenEditModal = (mod: ModuleTreeNode) => {
    setSelectedModule(mod);
    setSelectedFeatureIndex(null);
    setSelectedParentGroup(null);
    setIsTreeModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleOpenAddFeatureModal = (mod: ModuleTreeNode, parentGroup?: string) => {
    setSelectedModule(mod);
    setSelectedFeatureIndex(null);
    setSelectedParentGroup(parentGroup || null);
    setIsTreeModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleOpenEditFeatureModal = (mod: ModuleTreeNode, featureIndex: number) => {
    setSelectedModule(mod);
    setSelectedFeatureIndex(featureIndex);
    setSelectedParentGroup(null);
    setIsTreeModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleDeleteModule = async (mod: ModuleTreeNode) => {
    if (!window.confirm(`Are you sure you want to delete module "${mod.name}" and all its child features?`)) {
      return;
    }

    try {
      if (mod.id) {
        await deleteModule(mod.id);
      }
      toast.success(`Module "${mod.name}" deleted.`);
      setModules((prev) => prev.filter((m) => (m.id ? m.id !== mod.id : m.code !== mod.code)));
      setActiveDropdownId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete module");
    }
  };

  const handleDeleteFeature = async (modId: number | string | undefined, feat: FeatureNode) => {
    if (!window.confirm(`Delete nested feature "${feat.name}" (${feat.code})?`)) {
      return;
    }

    try {
      setDeletingFeatureId(feat.id || feat.code);
      if (feat.id) {
        await deleteModuleFeature(feat.id);
      }
      toast.success(`Feature "${feat.name}" removed.`);

      // Update local state
      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id === modId || mod.code === modId) {
            return {
              ...mod,
              features: mod.features.filter((f) => (f.id ? f.id !== feat.id : f.code !== feat.code)),
            };
          }
          return mod;
        }),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete feature");
    } finally {
      setDeletingFeatureId(null);
    }
  };

  const handleModalSuccess = (savedModule: ModuleTreeNode) => {
    fetchModules();
  };

  // Filtered module list matching query across modules and features
  const filteredModules = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;

    return modules.filter((mod) => {
      const matchModule =
        mod.name.toLowerCase().includes(q) ||
        mod.code.toLowerCase().includes(q) ||
        (mod.pathRoute && mod.pathRoute.toLowerCase().includes(q)) ||
        (mod.description && mod.description.toLowerCase().includes(q));

      const matchFeature = mod.features?.some(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.routePath && f.routePath.toLowerCase().includes(q)),
      );

      return matchModule || matchFeature;
    });
  }, [modules, search]);

  const totalFeaturesCount = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.features?.length || 0), 0);
  }, [modules]);

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              Enterprise RBAC Tree
            </span>
            {isUsingFallback && (
              <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                Live Server Demo Mode
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Module & Feature Tree Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create modules and inline nested features with route paths and RBAC action permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchModules}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            Add Module Tree
          </button>
        </div>
      </motion.div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Modules</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{modules.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Root functional containers</p>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            <Boxes className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nested Features</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{totalFeaturesCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Granular action permissions</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Atomic Builder</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">Dynamic Tree</p>
            <p className="text-xs text-slate-500 mt-0.5">Staged inline &quot;+&quot; feature inputs</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Layers className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search module name, code, or feature..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <div className="flex items-center rounded-lg bg-slate-200/70 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === "tree"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hierarchical Tree
              </button>
              <button
                type="button"
                onClick={() => setViewMode("visual-cards")}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === "visual-cards"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Visual Branches
              </button>
            </div>

            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree List */}
        <div className="divide-y divide-slate-100">
          {loading && modules.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading module tree...
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Boxes className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-base font-semibold text-slate-600">No modules found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? `No items matching "${search}"` : "Click 'Add Module Tree' to create your first module."}
              </p>
            </div>
          ) : (
            filteredModules.map((mod) => {
              const modKey = String(mod.id || mod.code);
              const isExpanded = !!expandedModuleIds[modKey];
              const featureCount = mod.features?.length || 0;

              return (
                <div key={modKey} className="transition hover:bg-slate-50/40">
                  {/* Module Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 cursor-pointer select-none" onClick={() => toggleExpand(modKey)}>
                      <button
                        type="button"
                        className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      >
                        <Boxes className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{mod.name}</h3>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {mod.code}
                          </span>
                          {mod.pathRoute && (
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {mod.pathRoute}
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                            {featureCount} {featureCount === 1 ? "Feature" : "Features"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 max-w-2xl line-clamp-1">
                          {mod.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end md:self-center pl-10 md:pl-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(mod)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                        title="Edit module information and features"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        Edit Module
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(mod)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm transition"
                        title="Add feature to this module"
                      >
                        <Plus className="h-3.5 w-3.5 text-indigo-600" />
                        Add Feature
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteModule(mod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-sm transition"
                        title="Delete module"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expandable Nested Features Tree */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-slate-50/60 border-t border-slate-100"
                      >
                        <div className="p-4 sm:pl-12 sm:pr-8 py-3">
                          <ModuleHierarchicalTree
                            module={mod}
                            variant={viewMode}
                            primaryColor={primaryColor}
                            searchQuery={search}
                            onEditModule={handleOpenEditModal}
                            onDeleteModule={handleDeleteModule}
                            onAddFeature={(m, grp) => handleOpenAddFeatureModal(m, grp)}
                            onEditFeature={(m, idx) => handleOpenEditFeatureModal(m, idx)}
                            onDeleteFeature={(m, feat) => handleDeleteFeature(m.id || m.code, feat)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Module Tree Builder Modal */}
      <ModuleTreeBuilderModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        initialModule={selectedModule}
        initialFeatureIndex={selectedFeatureIndex}
        initialParentGroup={selectedParentGroup}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
