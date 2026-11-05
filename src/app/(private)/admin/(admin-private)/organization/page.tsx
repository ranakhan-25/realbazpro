/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import SubscriptionPaymentModal from "@/components/modules/SubscriptionPaymentModal";
import {
  getOrganizations,
  getOrganization,
  type Organization,
  type EntitledModule,
} from "@/services/organizationService";
import { type FeatureNode } from "@/services/moduleTreeService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import {
  Building2,
  Users,
  HardDrive,
  FolderKanban,
  CreditCard,
  Lock,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Layers,
  ChevronDown,
  RefreshCw,
  Clock,
  User,
  Sparkles,
  Search,
  Folder,
  FolderOpen,
  FileCode2,
  Check,
  Edit3,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import OrgEditModal, {
  buildPathNestedTree,
  flattenTreeForDisplay,
} from "../orgs/components/OrgEditModal";

export default function UserOrganizationPage() {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<"general" | "entitlements">("general");
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");
    const tranId = searchParams?.get("tran_id");
    const message = searchParams?.get("message");

    if (paymentStatus === "success") {
      toast.success(`Subscription payment succeeded! Transaction: ${tranId || ""}`);
    } else if (paymentStatus === "failed") {
      toast.error(`Payment failed or was declined. ${message || ""}`);
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment checkout was cancelled.");
    } else if (paymentStatus === "error") {
      toast.error(`Payment verification failed: ${message || ""}`);
    }
  }, [searchParams]);

  // Module Accordion & Tree States
  const [expandedModuleKeys, setExpandedModuleKeys] = useState<Set<string | number>>(new Set());
  const [collapsedFolderKeys, setCollapsedFolderKeys] = useState<Set<string>>(new Set());
  const [featureSearch, setFeatureSearch] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const profile = getStoredUserProfile();
      setCurrentUserProfile(profile);

      const allOrgs = await getOrganizations().catch((err) => {
        console.warn("Unable to fetch organizations list:", err);
        return [];
      });
      setOrgs(allOrgs || []);

      if (allOrgs && allOrgs.length > 0) {
        let active = allOrgs[0];
        if (profile?.orgId) {
          const match = allOrgs.find((o) => o.id === profile.orgId);
          if (match) active = match;
        } else if (profile?.orgUuid) {
          const match = allOrgs.find((o) => o.uuid === profile.orgUuid);
          if (match) active = match;
        }

        const detailed = await getOrganization(active.id || active.uuid).catch(() => active);
        setSelectedOrg(detailed || active);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-expand modules when an org is loaded
  useEffect(() => {
    if (selectedOrg?.entitledModules && selectedOrg.entitledModules.length > 0) {
      const allModKeys = new Set<string | number>(
        selectedOrg.entitledModules.map((m: EntitledModule) => m.moduleId)
      );
      setExpandedModuleKeys(allModKeys);
    }
  }, [selectedOrg?.id, selectedOrg?.uuid]);

  const handleSelectOrg = async (orgIdOrUuid: string | number) => {
    setIsLoading(true);
    try {
      const detailed = await getOrganization(orgIdOrUuid);
      setSelectedOrg(detailed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgUpdated = async () => {
    if (!selectedOrg) return;
    try {
      const detailed = await getOrganization(selectedOrg.id || selectedOrg.uuid);
      setSelectedOrg(detailed);
    } catch (err) {
      console.error("Failed to refresh organization:", err);
    }
  };

  const openEditGeneral = () => {
    setEditModalTab("general");
    setIsEditOpen(true);
  };

  const openEditEntitlements = () => {
    setEditModalTab("entitlements");
    setIsEditOpen(true);
  };

  const toggleModule = (moduleId: string | number) => {
    setExpandedModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleExpandAllModules = () => {
    if (!selectedOrg?.entitledModules) return;
    const all = new Set<string | number>(
      selectedOrg.entitledModules.map((m: EntitledModule) => m.moduleId)
    );
    setExpandedModuleKeys(all);
  };

  const handleCollapseAllModules = () => {
    setExpandedModuleKeys(new Set());
  };

  const toggleFolder = (folderKey: string) => {
    setCollapsedFolderKeys((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) {
        next.delete(folderKey);
      } else {
        next.add(folderKey);
      }
      return next;
    });
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  // Filter modules based on search query
  const filteredModules = useMemo(() => {
    if (!selectedOrg?.entitledModules) return [];
    if (!featureSearch.trim()) return selectedOrg.entitledModules;
    const q = featureSearch.toLowerCase().trim();
    return selectedOrg.entitledModules.filter((mod: EntitledModule) => {
      if (mod.moduleName?.toLowerCase().includes(q)) return true;
      if (mod.moduleCode?.toLowerCase().includes(q)) return true;
      return mod.features?.some(
        (f) =>
          f.featureName?.toLowerCase().includes(q) ||
          f.featureCode?.toLowerCase().includes(q) ||
          f.routePath?.toLowerCase().includes(q)
      );
    });
  }, [selectedOrg?.entitledModules, featureSearch]);

  const totalAssignedFeatures = useMemo(() => {
    if (!selectedOrg?.entitledModules) return 0;
    return selectedOrg.entitledModules.reduce(
      (sum: number, mod: EntitledModule) => sum + (mod.features?.length || 0),
      0
    );
  }, [selectedOrg?.entitledModules]);

  if (isLoading && !selectedOrg) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-gray-500">
            Loading tenant organization profile...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 max-w-7xl mx-auto">
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800">
            No Organization Found
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            You do not currently have an organization assigned, or no organizations exist on the platform.
          </p>
        </div>
      </div>
    );
  }

  const userCount = selectedOrg.userCount ?? 0;
  const maxUsers = selectedOrg.maxUsers ?? 5;
  const userPercent = Math.min(100, Math.round((userCount / (maxUsers || 1)) * 100));

  const maxProjects = selectedOrg.maxProjects ?? 5;
  const storageMb = selectedOrg.maxStorageMb ?? 2048;
  const storageGb = (storageMb / 1024).toFixed(1);

  const planName =
    selectedOrg.plan?.name ||
    (typeof selectedOrg.plan === "string" ? selectedOrg.plan : "Standard Plan");

  const planCode = selectedOrg.plan?.code || "PLAN";
  const currencySign = selectedOrg.plan?.currency || "$";
  const planPrice = selectedOrg.plan?.monthlyPrice ?? 0;
  const isLocked = Boolean(selectedOrg.isLocked);
  const status = selectedOrg.subscriptionStatus || "active";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Header & Tenant Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Organization Profile
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Multi-tenant telemetry, resource allocations, and feature entitlements.
            </p>
          </div>

          {/* Org Selector for Super Admins */}
          {orgs.length > 1 && (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Viewing Tenant:
              </span>
              <select
                value={selectedOrg.id || selectedOrg.uuid}
                onChange={(e) => handleSelectOrg(e.target.value)}
                className="text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
              >
                {orgs.map((o) => (
                  <option key={o.id || o.uuid} value={o.id || o.uuid}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tenant Hero Card - White & Emerald Redesign */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm relative overflow-hidden mb-8 transition-all">
          {/* Subtle Ambient Decorative Glow */}
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-50/70 blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-teal-50/50 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-emerald-600/15 ring-4 ring-emerald-50 shrink-0"
                style={{ backgroundColor: brandColor || "#10b981" }}
              >
                {selectedOrg.name?.charAt(0)?.toUpperCase() || "O"}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {selectedOrg.name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {selectedOrg.code}
                  </span>
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                      <Lock className="w-3.5 h-3.5 text-red-600" /> Suspended
                    </span>
                  ) : status === "trial" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Free Trial
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Subscription
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-5 mt-2.5 text-xs text-gray-500 flex-wrap">
                  {selectedOrg.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedOrg.email}
                    </span>
                  )}
                  {selectedOrg.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedOrg.phone}
                    </span>
                  )}
                  {selectedOrg.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedOrg.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions in Hero */}
            <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
              <button
                onClick={openEditEntitlements}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 border border-emerald-600 active:scale-[0.98]"
              >
                <Layers className="w-4 h-4" />
                Manage Entitlements
              </button>
              <button
                onClick={openEditGeneral}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs flex items-center gap-2 active:scale-[0.98]"
              >
                <Edit3 className="w-4 h-4 text-gray-500" />
                Edit Settings
              </button>
            </div>
          </div>

          {/* Quick Stats Grid inside Hero - White & Light Gray Theme */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-150">
            <div className="bg-slate-50/70 hover:bg-slate-50/90 rounded-2xl p-4 border border-slate-200/60 transition-colors">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-emerald-600" /> User Seat Utilization
                </span>
                <span className="font-bold text-gray-900">
                  {userCount} / {maxUsers}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${userPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                {Math.max(0, maxUsers - userCount)} seats remaining
              </p>
            </div>

            <div className="bg-slate-50/70 hover:bg-slate-50/90 rounded-2xl p-4 border border-slate-200/60 transition-colors">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <FolderKanban className="w-4 h-4 text-blue-600" /> Max Projects
                </span>
                <span className="font-bold text-gray-900">{maxProjects} Projects</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Simultaneous tenant workspaces
              </p>
            </div>

            <div className="bg-slate-50/70 hover:bg-slate-50/90 rounded-2xl p-4 border border-slate-200/60 transition-colors">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-4 h-4 text-indigo-600" /> Storage Capacity
                </span>
                <span className="font-bold text-gray-900">{storageGb} GB</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">{storageMb} MB cloud quota</p>
            </div>

            <div className="bg-slate-50/70 hover:bg-slate-50/90 rounded-2xl p-4 border border-slate-200/60 transition-colors">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CreditCard className="w-4 h-4 text-amber-600" /> Active Tier
                </span>
                <span className="font-bold text-gray-900">{planName}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                {currencySign}{planPrice}/month &bull; {planCode}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Section Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Administrator & Plan Specifications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription & Lifecycle Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Subscription Lifecycle & Limits
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedOrg.plan?.billingCycle || "Monthly"} Cycle
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Renew / Pay Plan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Subscription Start</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatDate(selectedOrg.subscriptionStartDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Subscription Renewal</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatDate(selectedOrg.subscriptionEndDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Trial End Date</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatDate(selectedOrg.trialEndsAt)}
                  </p>
                </div>
              </div>

              {selectedOrg.lockReason && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Suspension Reason:</strong> {selectedOrg.lockReason}
                  </span>
                </div>
              )}
            </div>

            {/* Entitled Modules Section - Full Width Accordion & Nested Tree Structure */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">
                        Entitled Modules & System Features
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {filteredModules.length} Modules &bull; {totalAssignedFeatures} Features
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Hierarchical feature tree with nested directory dropdowns and permissions.
                    </p>
                  </div>
                </div>

                {/* Top Action Bar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={openEditEntitlements}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Entitlements
                  </button>

                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={handleExpandAllModules}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAllModules}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter modules or search nested features (e.g. leads, reports, /crm)..."
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {featureSearch && (
                  <button
                    onClick={() => setFeatureSearch("")}
                    className="text-xs text-gray-400 hover:text-gray-600 absolute right-3.5 top-1/2 -translate-y-1/2"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Full Width Module Cards List */}
              {filteredModules && filteredModules.length > 0 ? (
                <div className="space-y-4 w-full">
                  {filteredModules.map((module: EntitledModule) => {
                    const isExpanded = expandedModuleKeys.has(module.moduleId);

                    // Convert module features to FeatureNode array for buildPathNestedTree
                    const featureNodes: FeatureNode[] = (module.features || []).map((f) => ({
                      id: f.featureId,
                      name: f.featureName,
                      code: f.featureCode,
                      routePath: f.routePath || "",
                      displayOrder: 0,
                      isActive: true,
                    }));

                    const treeNodes = buildPathNestedTree(
                      featureNodes,
                      undefined,
                      module.moduleId
                    );

                    const flattenedRows = flattenTreeForDisplay(
                      treeNodes,
                      collapsedFolderKeys,
                      featureSearch
                    );

                    return (
                      <div
                        key={module.moduleId}
                        className="w-full rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-hidden transition-all duration-200 hover:border-emerald-300/80"
                      >
                        {/* Module Accordion Header */}
                        <div
                          onClick={() => toggleModule(module.moduleId)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer bg-white hover:bg-emerald-50/20 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-2xs shrink-0"
                              style={{ backgroundColor: brandColor || "#10b981" }}
                            >
                              {module.moduleCode?.slice(0, 2) || "MD"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base tracking-tight truncate">
                                  {module.moduleName}
                                </h4>
                                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                  {module.moduleCode}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {module.features?.length || 0} Active Features
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                Click to {isExpanded ? "collapse" : "expand"} hierarchical nested feature tree
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 ml-4">
                            {/* Super Admin Quick Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditEntitlements();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                              title="Edit this module's features"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit Features</span>
                            </button>

                            {/* Accordion Chevron Toggle */}
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? "transform rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Nested Tree View */}
                        {isExpanded && (
                          <div className="border-t border-gray-150 bg-slate-50/50 p-4 sm:p-5">
                            {flattenedRows.length > 0 ? (
                              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-[minmax(280px,1fr)_auto] px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  <span>Feature Name / Hierarchy</span>
                                  <span className="text-right">Access & Operations</span>
                                </div>

                                {/* Tree Rows */}
                                <div className="divide-y divide-gray-100 font-sans">
                                  {flattenedRows.map(({ node, prefix, hasChildren, isCollapsed }, rowIdx) => {
                                    const isFolder = node.isFolder || hasChildren;

                                    return (
                                      <div
                                        key={`${module.moduleId}-${node.key}-${rowIdx}`}
                                        className={`grid grid-cols-[minmax(280px,1fr)_auto] items-center px-4 py-2.5 transition-colors ${
                                          isFolder
                                            ? "hover:bg-amber-50/30 cursor-pointer bg-slate-50/40"
                                            : "hover:bg-emerald-50/30 bg-white"
                                        }`}
                                        onClick={isFolder ? () => toggleFolder(node.key) : undefined}
                                      >
                                        {/* Left: Tree Stem + Icon + Name + Badges */}
                                        <div className="flex items-center gap-2 min-w-0 pr-4">
                                          <span className="font-mono text-xs text-gray-300 select-none whitespace-pre">
                                            {prefix}
                                          </span>

                                          {isFolder ? (
                                            <div className="flex items-center gap-2 min-w-0">
                                              {isCollapsed ? (
                                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                              ) : (
                                                <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
                                              )}
                                              <span className="text-xs font-bold text-gray-800 truncate">
                                                {node.name}
                                              </span>
                                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                {node.allSubtreeFeatureIds?.length || node.children.length} items
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                              <FileCode2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                              <span className="text-xs font-semibold text-gray-900 truncate">
                                                {node.name}
                                              </span>
                                              {node.feature?.code && (
                                                <span className="font-mono text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                                                  {node.feature.code}
                                                </span>
                                              )}
                                              {node.routePath && node.routePath !== node.feature?.code && (
                                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden md:inline truncate max-w-xs">
                                                  {node.routePath}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Right: Permission Status & Actions */}
                                        <div className="flex items-center justify-end gap-2 shrink-0">
                                          {!isFolder ? (
                                            <>
                                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                Active
                                              </span>
                                              <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                                                title="Read Access Enabled"
                                              >
                                                R
                                              </span>
                                              <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                title="Write / Action Access Enabled"
                                              >
                                                W
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-[11px] font-medium text-gray-400 hover:text-gray-700">
                                              {isCollapsed ? "Expand" : "Collapse"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-200">
                                {featureSearch
                                  ? "No matching features found in this module."
                                  : "No features assigned."}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    {featureSearch ? "No Modules Match Your Search" : "Default Plan Entitlements Active"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {featureSearch
                      ? "Try searching for a different keyword or route path."
                      : `Tenant users inherit the baseline permissions of the ${planName} plan.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Tenant Administrator & Identity Audit */}
          <div className="space-y-8">
            {/* Administrator Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Organization Administrator
                </h3>
              </div>

              {selectedOrg.adminUser ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md shadow-emerald-500/10 ring-2 ring-emerald-50"
                      style={{ backgroundColor: brandColor || "#10b981" }}
                    >
                      {selectedOrg.adminUser.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">
                        {selectedOrg.adminUser.name}
                      </h4>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">
                        @{selectedOrg.adminUser.username}
                      </p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Primary Admin
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <p className="text-gray-400 font-medium">Corporate Email</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {selectedOrg.adminUser.email}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <p className="text-gray-400 font-medium">Mobile Phone</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {selectedOrg.adminUser.mobile || "N/A"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <p className="text-gray-400 font-medium">User System Identifier</p>
                      <p className="text-sm font-mono font-semibold text-gray-800 mt-0.5">
                        User #{selectedOrg.adminUser.id}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    No designated admin attached
                  </p>
                </div>
              )}
            </div>

            {/* Audit & Metadata */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                System Identifiers & Security
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-500 font-medium">Organization ID</span>
                  <span className="font-mono font-bold text-gray-900">#{selectedOrg.id}</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <span className="text-gray-500 font-medium">Immutable Tenant UUID</span>
                  <p className="font-mono text-[11px] text-gray-800 break-all select-all">
                    {selectedOrg.uuid}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-gray-500 font-medium">Onboarded Since</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(selectedOrg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrgEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        orgData={selectedOrg}
        initialTab={editModalTab}
        onUpdate={handleOrgUpdated}
      />

      <SubscriptionPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        organization={selectedOrg}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
