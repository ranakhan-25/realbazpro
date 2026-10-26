/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  HardDrive,
  FolderKanban,
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  User,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  getOrganization,
  type Organization,
  type EntitledModule,
} from "@/services/organizationService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orgData: any;
  onEdit?: (org: any) => void;
}

export default function OrgViewModal({
  isOpen,
  onClose,
  orgData,
  onEdit,
}: Props) {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [activeTab, setActiveTab] = useState<
    "overview" | "subscription" | "admin" | "entitlements"
  >("overview");
  const [details, setDetails] = useState<any>(orgData || null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync and fetch fresh detailed data whenever modal opens
  useEffect(() => {
    if (!isOpen || !orgData) return;

    setDetails(orgData);
    const identifier = orgData.id || orgData.uuid;

    if (identifier) {
      setIsLoadingDetails(true);
      getOrganization(identifier)
        .then((fresh) => {
          if (fresh) setDetails(fresh);
        })
        .catch((err) => {
          console.warn("Could not fetch fresh organization details:", err);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [isOpen, orgData]);

  if (!isOpen || !details) return null;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentOrg: any = details;
  const userCount = currentOrg.userCount ?? 0;
  const maxUsers = currentOrg.maxUsers ?? currentOrg.user_limit ?? 5;
  const userPercent = Math.min(100, Math.round((userCount / (maxUsers || 1)) * 100));

  const maxProjects = currentOrg.maxProjects ?? currentOrg.project_limit ?? 5;
  const storageMb = currentOrg.maxStorageMb ?? (currentOrg.storage_gb ? currentOrg.storage_gb * 1024 : 10240);
  const storageGb = (storageMb / 1024).toFixed(1);

  const planName =
    currentOrg.plan?.name ||
    currentOrg.planName ||
    (typeof currentOrg.plan === "string" ? currentOrg.plan : "Standard Plan");

  const planCode = currentOrg.plan?.code || currentOrg.plan_code || "CUSTOM";
  const planPrice =
    currentOrg.plan?.monthlyPrice ??
    currentOrg.plan?.monthly_price ??
    currentOrg.monthly_price ??
    0;

  const isLocked = Boolean(currentOrg.isLocked);
  const status = currentOrg.subscriptionStatus || currentOrg.status || "active";

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

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white/10"
                style={{
                  backgroundColor: brandColor,
                  color: "#ffffff",
                }}
              >
                {currentOrg.name?.charAt(0)?.toUpperCase() || "O"}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {currentOrg.name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 font-semibold border border-white/10">
                    {currentOrg.code || currentOrg.slug}
                  </span>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold border border-red-500/40">
                      <Lock className="w-3 h-3" /> Suspended
                    </span>
                  )}
                  {!isLocked && status === "trial" && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                      <Clock className="w-3 h-3" /> Free Trial
                    </span>
                  )}
                  {!isLocked && status === "active" && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {currentOrg.email || "No email"}
                  </span>
                  {currentOrg.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {currentOrg.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
                    UUID: {currentOrg.uuid?.slice(0, 13)}...
                    <button
                      onClick={() => copyToClipboard(currentOrg.uuid, "uuid")}
                      className="hover:text-white transition-colors"
                      title="Copy full UUID"
                    >
                      {copiedKey === "uuid" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoadingDetails && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> Users
                </span>
                <span className="font-semibold text-white">
                  {userCount} / {maxUsers}
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${userPercent}%`,
                    backgroundColor: brandColor,
                  }}
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-emerald-400" /> Projects
                </span>
                <span className="font-semibold text-white">
                  {maxProjects} Max
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Tenant quota limit</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-violet-400" /> Storage
                </span>
                <span className="font-semibold text-white">
                  {storageGb} GB
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{storageMb} MB allocated</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Plan
                </span>
                <span className="font-semibold text-white truncate max-w-[90px]">
                  {planName}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                ${planPrice}/month
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-6 sm:px-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "overview" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <Building2 className="w-4 h-4" /> Organization Details
          </button>

          <button
            onClick={() => setActiveTab("subscription")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "subscription"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "subscription" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <CreditCard className="w-4 h-4" /> Plan & Subscription
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "admin"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "admin" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <User className="w-4 h-4" /> Org Administrator
          </button>

          <button
            onClick={() => setActiveTab("entitlements")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "entitlements"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "entitlements" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <Layers className="w-4 h-4" /> Entitled Modules
            {currentOrg.entitledModules && currentOrg.entitledModules.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                {currentOrg.entitledModules.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[50vh] space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Organization Legal Name
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {currentOrg.name}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tenant Code / Slug
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold font-mono text-gray-900">
                      {currentOrg.code || currentOrg.slug}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(currentOrg.code || currentOrg.slug, "code")
                      }
                      className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copiedKey === "code" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Corporate Email
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {currentOrg.email || "Not Provided"}
                    </p>
                    {currentOrg.email && (
                      <a
                        href={`mailto:${currentOrg.email}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Phone Contact
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {currentOrg.phone || "Not Provided"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1 md:col-span-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Office / Physical Address
                  </p>
                  <div className="flex items-start gap-2 pt-0.5">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-gray-700">
                      {currentOrg.address || "No office address registered"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    System Identifier (ID)
                  </p>
                  <p className="text-base font-semibold font-mono text-gray-800">
                    #{currentOrg.id}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Onboarded Date
                  </p>
                  <p className="text-base font-semibold text-gray-800">
                    {formatDate(currentOrg.createdAt || currentOrg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-white p-6 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                    Current Active Tier
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 mt-2">
                    {planName}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Plan Code: {planCode}
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-blue-100 sm:pl-6">
                  <div className="text-3xl font-black text-gray-900">
                    ${planPrice}
                    <span className="text-sm font-medium text-gray-500">
                      /{currentOrg.plan?.billingCycle || "month"}
                    </span>
                  </div>
                  {currentOrg.plan?.yearlyPrice ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      ${currentOrg.plan.yearlyPrice}/year billed annually
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-400">Subscription Status</p>
                  <p className="text-base font-bold text-gray-900 capitalize mt-1 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLocked
                          ? "bg-red-500"
                          : status === "active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                      }`}
                    />
                    {isLocked ? "Suspended (Locked)" : status}
                  </p>
                  {currentOrg.lockReason && (
                    <p className="text-xs text-red-600 mt-1">
                      Reason: {currentOrg.lockReason}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-400">Subscription Period</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {formatDate(currentOrg.subscriptionStartDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    to {formatDate(currentOrg.subscriptionEndDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-400">Trial Period End</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {formatDate(currentOrg.trialEndsAt || currentOrg.trial_ends_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentOrg.plan?.trialDays ? `${currentOrg.plan.trialDays} days trial policy` : "Standard trial"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Resource Limits & Multi-Tenant Boundaries
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-100">
                    <span className="text-gray-500">Max Member Users</span>
                    <strong className="text-gray-900 font-mono">{maxUsers} seats</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-100">
                    <span className="text-gray-500">Max Work Projects</span>
                    <strong className="text-gray-900 font-mono">{maxProjects} projects</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-100">
                    <span className="text-gray-500">Max Cloud Storage</span>
                    <strong className="text-gray-900 font-mono">{storageGb} GB</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORG ADMINISTRATOR */}
          {activeTab === "admin" && (
            <div className="space-y-6">
              {currentOrg.adminUser ? (
                <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                      style={{ backgroundColor: brandColor }}
                    >
                      {currentOrg.adminUser.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {currentOrg.adminUser.name}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          Tenant Admin
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">
                        Username: @{currentOrg.adminUser.username}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                      <span className="text-xs font-medium text-gray-400">Admin Email</span>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          {currentOrg.adminUser.email}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(currentOrg.adminUser!.email, "admin_email")
                          }
                          className="text-gray-400 hover:text-gray-700"
                        >
                          {copiedKey === "admin_email" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                      <span className="text-xs font-medium text-gray-400">Mobile Phone</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {currentOrg.adminUser.mobile || "No mobile phone linked"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                      <span className="text-xs font-medium text-gray-400">System User ID</span>
                      <p className="text-sm font-mono font-semibold text-gray-800">
                        User #{currentOrg.adminUser.id}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                      <span className="text-xs font-medium text-gray-400">Security Clearance</span>
                      <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Full Tenant Administrative Authority
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    No primary administrator attached
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    This organization was created without an explicit initial tenant administrator user.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ENTITLED MODULES & FEATURES */}
          {activeTab === "entitlements" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Entitled Modules & System Capabilities
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tenant users are only permitted to access features included in this list.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {currentOrg.entitledModules?.length || 0} Modules Activated
                </span>
              </div>

              {currentOrg.entitledModules && currentOrg.entitledModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentOrg.entitledModules.map((module: EntitledModule) => (
                    <div
                      key={module.moduleId}
                      className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            {module.moduleCode?.slice(0, 2) || "MD"}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 text-sm">
                              {module.moduleName}
                            </h5>
                            <span className="text-[11px] font-mono text-gray-400">
                              {module.moduleCode}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {module.features?.length || 0} Features
                        </span>
                      </div>

                      <div className="pt-3 flex flex-wrap gap-1.5">
                        {module.features && module.features.length > 0 ? (
                          module.features.map((feat) => (
                            <span
                              key={feat.featureId}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
                              title={feat.routePath ? `Route: ${feat.routePath}` : undefined}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="font-medium">{feat.featureName}</span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {feat.featureCode}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Module enabled with default baseline permissions
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    No custom entitlements allocated
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    This organization currently uses standard tier baseline module defaults.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-t border-gray-100 bg-gray-50/80">
          <div className="text-xs text-gray-400 font-mono">
            ID: #{currentOrg.id} &bull; {currentOrg.uuid?.slice(0, 18)}...
          </div>

          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(currentOrg);
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
              >
                Edit Organization
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-white font-medium text-sm transition-opacity shadow-sm hover:opacity-95"
              style={{ backgroundColor: brandColor }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
