/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@/lib/theme";
import {
  getOrganization,
  type Organization,
  type EntitledModule,
} from "@/services/organizationService";
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
  ChevronLeft,
  RefreshCw,
  Clock,
  User,
  Copy,
  Check,
} from "lucide-react";

export default function OrgDetailPage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [org, setOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "subscription" | "admin" | "entitlements">("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    setIsLoading(true);
    getOrganization(uuid)
      .then((data) => setOrg(data))
      .catch((err) => console.error("Failed to fetch organization:", err))
      .finally(() => setIsLoading(false));
  }, [uuid]);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">
            Loading organization data...
          </p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 max-w-7xl mx-auto">
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800">
            Organization Not Found
          </h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Could not find an organization matching identifier &quot;{uuid}&quot;.
          </p>
          <Link
            href="/admin/orgs"
            className="px-5 py-2.5 rounded-xl text-white font-medium text-sm inline-flex items-center gap-2"
            style={{ backgroundColor: brandColor }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  const userCount = org.userCount ?? 0;
  const maxUsers = org.maxUsers ?? 5;
  const userPercent = Math.min(100, Math.round((userCount / (maxUsers || 1)) * 100));

  const maxProjects = org.maxProjects ?? 5;
  const storageMb = org.maxStorageMb ?? 2048;
  const storageGb = (storageMb / 1024).toFixed(1);

  const planName =
    org.plan?.name || (typeof org.plan === "string" ? org.plan : "Standard");
  const planCode = org.plan?.code || "PLAN";
  const planPrice = org.plan?.monthlyPrice ?? 0;
  const isLocked = Boolean(org.isLocked);
  const status = org.subscriptionStatus || "active";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/orgs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Organizations List
          </Link>
          <span className="text-xs font-mono text-gray-400">
            UUID: {org.uuid}
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-white/10 shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {org.name?.charAt(0)?.toUpperCase() || "O"}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {org.name}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 font-semibold border border-white/10">
                    {org.code}
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
                  {org.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {org.email}
                    </span>
                  )}
                  {org.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {org.phone}
                    </span>
                  )}
                  {org.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {org.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
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
                  style={{ width: `${userPercent}%`, backgroundColor: brandColor }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                {maxUsers - userCount} seats free
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-emerald-400" /> Max Projects
                </span>
                <span className="font-bold text-white">{maxProjects}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Active workspace limit</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-violet-400" /> Cloud Storage
                </span>
                <span className="font-bold text-white">{storageGb} GB</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">{storageMb} MB quota</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Current Plan
                </span>
                <span className="font-bold text-white">{planName}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">${planPrice}/mo ({planCode})</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "overview" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <Building2 className="w-4 h-4" /> Overview & Profile
          </button>

          <button
            onClick={() => setActiveTab("subscription")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "subscription"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "subscription" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <CreditCard className="w-4 h-4" /> Subscription & Limits
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "admin"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "admin" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <User className="w-4 h-4" /> Tenant Administrator
          </button>

          <button
            onClick={() => setActiveTab("entitlements")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "entitlements"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
            style={activeTab === "entitlements" ? { borderColor: brandColor, color: brandColor } : {}}
          >
            <Layers className="w-4 h-4" /> Entitled Modules
            {org.entitledModules && org.entitledModules.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                {org.entitledModules.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Tenant Code</span>
                <p className="text-base font-bold font-mono text-gray-900">{org.code}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Email</span>
                <p className="text-base font-bold text-gray-900">{org.email || "N/A"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Phone</span>
                <p className="text-base font-bold text-gray-900">{org.phone || "N/A"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Office Location</span>
                <p className="text-base font-bold text-gray-900">{org.address || "N/A"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">System ID</span>
                <p className="text-base font-bold font-mono text-gray-900">#{org.id}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Created Date</span>
                <p className="text-base font-bold text-gray-900">{formatDate(org.createdAt)}</p>
              </div>
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Subscription Start</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(org.subscriptionStartDate)}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Subscription End</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(org.subscriptionEndDate)}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Trial End</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(org.trialEndsAt)}</p>
                </div>
              </div>

              {org.lockReason && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  <strong>Suspension Reason:</strong> {org.lockReason}
                </div>
              )}
            </div>
          )}

          {activeTab === "admin" && (
            <div>
              {org.adminUser ? (
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {org.adminUser.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{org.adminUser.name}</h3>
                    <p className="text-xs font-mono text-gray-500">@{org.adminUser.username} &bull; {org.adminUser.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Mobile: {org.adminUser.mobile || "N/A"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No designated administrator user record.</p>
              )}
            </div>
          )}

          {activeTab === "entitlements" && (
            <div>
              {org.entitledModules && org.entitledModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {org.entitledModules.map((m: EntitledModule) => (
                    <div key={m.moduleId} className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm text-gray-900">{m.moduleName}</span>
                        <span className="text-xs font-mono text-gray-400">{m.moduleCode}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.features?.map((f) => (
                          <span
                            key={f.featureId}
                            className="text-xs px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-700"
                          >
                            {f.featureName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Baseline plan entitlements active.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
