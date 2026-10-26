/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import {
  getOrganizations,
  getOrganization,
  type Organization,
  type EntitledModule,
} from "@/services/organizationService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import {
  Building2,
  Users,
  HardDrive,
  FolderKanban,
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  RefreshCw,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import OrgEditModal from "../orgs/components/OrgEditModal";

export default function UserOrganizationPage() {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

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
        // Find tenant matching user's org if org admin, otherwise select first
        let active = allOrgs[0];
        if (profile?.orgId) {
          const match = allOrgs.find((o) => o.id === profile.orgId);
          if (match) active = match;
        } else if (profile?.orgUuid) {
          const match = allOrgs.find((o) => o.uuid === profile.orgUuid);
          if (match) active = match;
        }

        // Fetch deep relation details
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

  if (isLoading && !selectedOrg) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
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
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
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
  const planPrice = selectedOrg.plan?.monthlyPrice ?? 0;
  const isLocked = Boolean(selectedOrg.isLocked);
  const status = selectedOrg.subscriptionStatus || "active";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Header & Tenant Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-7 h-7" style={{ color: brandColor }} />
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Organization Profile
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Real-time multi-tenant telemetry, resource allocations, and feature entitlements.
            </p>
          </div>

          {/* Org Selector for Super Admins */}
          {orgs.length > 1 && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-sm">
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

        {/* Tenant Hero Card */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-white/10 shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {selectedOrg.name?.charAt(0)?.toUpperCase() || "O"}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {selectedOrg.name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 font-semibold border border-white/10">
                    {selectedOrg.code}
                  </span>
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                      <Lock className="w-3.5 h-3.5" /> Suspended
                    </span>
                  ) : status === "trial" ? (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      <Clock className="w-3.5 h-3.5" /> Free Trial
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Subscription
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-5 mt-2.5 text-xs text-gray-400 flex-wrap">
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

            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Edit Settings
              </button>
            </div>
          </div>

          {/* Quick Stats Grid inside Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" /> User Seat Utilization
                </span>
                <span className="font-bold text-white">
                  {userCount} / {maxUsers}
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${userPercent}%`,
                    backgroundColor: brandColor,
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {maxUsers - userCount} seats remaining
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-emerald-400" /> Max Projects
                </span>
                <span className="font-bold text-white">{maxProjects} Projects</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Simultaneous tenant workspaces
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-violet-400" /> Storage Capacity
                </span>
                <span className="font-bold text-white">{storageGb} GB</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">{storageMb} MB cloud quota</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Active Tier
                </span>
                <span className="font-bold text-white">{planName}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                ${planPrice}/month &bull; {planCode}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Section Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Administrator & Plan Specifications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription & Lifecycle Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Subscription Lifecycle & Limits
                  </h3>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedOrg.plan?.billingCycle || "Monthly"} Cycle
                </span>
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

            {/* Entitled Modules Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Entitled Modules & System Features
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Subscribed system capabilities provisioned for this organization.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedOrg.entitledModules?.length || 0} Modules Assigned
                </span>
              </div>

              {selectedOrg.entitledModules && selectedOrg.entitledModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOrg.entitledModules.map((module: EntitledModule) => (
                    <div
                      key={module.moduleId}
                      className="p-5 rounded-2xl bg-gray-50/60 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            {module.moduleCode?.slice(0, 2) || "MD"}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                              {module.moduleName}
                            </h4>
                            <span className="text-[11px] font-mono text-gray-400">
                              {module.moduleCode}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {module.features?.length || 0} Active Features
                        </span>
                      </div>

                      <div className="pt-3 flex flex-wrap gap-1.5">
                        {module.features && module.features.length > 0 ? (
                          module.features.map((feat) => (
                            <span
                              key={feat.featureId}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="font-medium">{feat.featureName}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Standard baseline features
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    Default Plan Entitlements Active
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    No custom overrides. Tenant users inherit the baseline permissions of the {planName} plan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Tenant Administrator & Identity Audit */}
          <div className="space-y-8">
            {/* Administrator Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Organization Administrator
                </h3>
              </div>

              {selectedOrg.adminUser ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                      style={{ backgroundColor: brandColor }}
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
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
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
        onUpdate={(uuid, payload) => {
          setSelectedOrg((prev: any) => (prev ? { ...prev, ...payload } : null));
        }}
      />
    </div>
  );
}
