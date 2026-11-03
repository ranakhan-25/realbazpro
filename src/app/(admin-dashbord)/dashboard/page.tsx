/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Coins,
  Compass,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Loader2,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import { useUserAccess } from "@/context/UserAccessContext";

interface ModuleMeta {
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  badgeBg: string;
  badgeText: string;
}

const MODULE_META: Record<string, ModuleMeta> = {
  project: {
    title: "Project Management",
    category: "Operations & Civil",
    description: "Manage projects, site plans, milestones, tasks, BOQ, budgets, costs, and progress tracking.",
    icon: FolderKanban,
    gradient: "from-blue-600 to-indigo-700",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
    badgeText: "Civil Engineering",
  },
  crm: {
    title: "CRM & Sales",
    category: "Customer Relations",
    description: "Pipelines, leads, calls, property site visits, deal negotiations, and conversions.",
    icon: Users,
    gradient: "from-violet-600 to-purple-700",
    badgeBg: "bg-purple-50 border-purple-200 text-purple-700",
    badgeText: "Sales Acceleration",
  },
  inventory: {
    title: "Inventory & Stock",
    category: "Supply Chain",
    description: "Item catalogs, store requisitions, purchases, material transfers, and inventory audits.",
    icon: Warehouse,
    gradient: "from-amber-500 to-orange-600",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
    badgeText: "Warehouse & Stock",
  },
  accounts: {
    title: "Finance & Accounts",
    category: "Financial Control",
    description: "Chart of accounts, vouchers, bank reconciliations, ledgers, and comprehensive income statements.",
    icon: Receipt,
    gradient: "from-emerald-600 to-teal-700",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    badgeText: "General Ledger",
  },
  hrm: {
    title: "Human Resources",
    category: "Workforce & Payroll",
    description: "Employee records, attendance, biometric sync, salary slips, leave requests, and KPIs.",
    icon: UserCheck,
    gradient: "from-sky-600 to-cyan-700",
    badgeBg: "bg-sky-50 border-sky-200 text-sky-700",
    badgeText: "HRM & Payroll",
  },
  cr: {
    title: "Credit Realisation",
    category: "Revenue & Collections",
    description: "Sales agreements, installment schedules, recovery tracking, vouchers, and aging analyses.",
    icon: CreditCard,
    gradient: "from-rose-600 to-pink-700",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
    badgeText: "Collections & Recovery",
  },
  lams: {
    title: "Land Acquisition",
    category: "Asset Management",
    description: "Land owners, acquisition leads, negotiation workflows, and legal title documents.",
    icon: Compass,
    gradient: "from-teal-600 to-cyan-700",
    badgeBg: "bg-teal-50 border-teal-200 text-teal-700",
    badgeText: "Land & Survey",
  },
  procurement: {
    title: "Procurement & SCM",
    category: "Purchasing & Vendors",
    description: "Material requisitions, RFQs, vendor work orders, GRNs, and billing approvals.",
    icon: ShoppingCart,
    gradient: "from-indigo-600 to-blue-700",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
    badgeText: "Strategic Sourcing",
  },
};

export default function UniversalDashboardPage() {
  const router = useRouter();
  const { user, accessibleModules, isLoading } = useUserAccess();

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Assembling Workspace Entitlements...
        </p>
      </div>
    );
  }

  const roleTitle = user?.isSuperUser
    ? "Super Administrator"
    : user?.isOrgAdmin
      ? "Organization Administrator"
      : user?.role || "Team Member";

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero - Hermes Palette */}
      <div className="relative overflow-hidden rounded-3xl bg-[#060814] border border-[#1E293B] p-8 text-white shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-[#0000F2]/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-56 w-56 rounded-full bg-[#00D2FF]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Universal Workspace Hub</span>
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-300">Hermes Core</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Welcome, {user?.name || "Workspace Member"}
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your centralized launchpad for all operational enterprise modules. Select a workspace below to manage workflows, records, transactions, and performance metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {(user?.isSuperUser || user?.isOrgAdmin) && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0000F2] hover:bg-[#0000F2]/90 border border-blue-400/30 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition backdrop-blur-md active:scale-95"
              >
                <ShieldCheck className="h-4 w-4 text-white" />
                <span>Admin Governance</span>
              </Link>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-right backdrop-blur-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tenant Context
              </span>
              <span className="font-semibold text-sm text-white">
                {user?.orgName || (user?.isSuperUser ? "Global Enterprise" : "Main Organization")}
              </span>
            </div>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 pt-6">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Assigned Authority
            </span>
            <p className="text-base font-bold text-white mt-0.5">{roleTitle}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Security Level
            </span>
            <p className="text-base font-bold text-white mt-0.5">Tier {user?.roleLevel ?? 4}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Entitled Workspaces
            </span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              {accessibleModules.length} Operational Modules
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Access Governance
            </span>
            <p className="text-base font-bold text-blue-400 mt-0.5">Verified Tenant RBAC</p>
          </div>
        </div>
      </div>

      {/* ENTERPRISE WORKFLOW & ONBOARDING TIMELINE */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>Operational Lifecycle Roadmap</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Organization Flow of Work & Execution Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow the end-to-end operational sequence to set up master records, delegate duties, and run daily workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Readiness:</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              System Ready
            </span>
          </div>
        </div>

        {/* 5-Step Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {[
            {
              step: "01",
              title: "Organization Profile",
              desc: "Set tenant branding, currency, address, and localized fiscal settings",
              href: user?.isSuperUser || user?.isOrgAdmin ? "/admin/web-settings" : "#",
              btnText: "Configure",
              icon: Building2,
              badge: "Identity",
            },
            {
              step: "02",
              title: "Roles & Scopes",
              desc: "Define organizational roles and granular feature authorization",
              href: user?.isSuperUser || user?.isOrgAdmin ? "/admin/roles" : "#",
              btnText: "Manage Roles",
              icon: ShieldCheck,
              badge: "RBAC Scoped",
            },
            {
              step: "03",
              title: "Team Onboarding",
              desc: "Invite project engineers, accountants, sales agents, and managers",
              href: user?.isSuperUser || user?.isOrgAdmin ? "/admin/users" : "#",
              btnText: "Team Directory",
              icon: Users,
              badge: "Staffing",
            },
            {
              step: "04",
              title: "Master Configuration",
              desc: "Seed Chart of Accounts, Projects, Lead Pipelines & Warehouses",
              href: accessibleModules.length > 0 ? `/dashboard/${accessibleModules[0].key}/dashboard` : "/dashboard",
              btnText: "Open Modules",
              icon: FolderKanban,
              badge: "Master Data",
            },
            {
              step: "05",
              title: "Daily Operations",
              desc: "Process vouchers, purchase requisitions, BOQ milestones & payroll",
              href: "/dashboard",
              btnText: "Workspaces",
              icon: Activity,
              badge: "Live Execution",
            },
          ].map((item) => {
            const StepIcon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      Step {item.step}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                      {item.badge}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-[#0000F2] group-hover:text-white transition">
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={item.href}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-[#0000F2] hover:text-white transition active:scale-95 shadow-sm"
                  >
                    <span>{item.btnText}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modules Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Available Operational Modules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any workspace below to navigate directly into that module's operations.
          </p>
        </div>

        <span className="text-xs font-medium text-slate-500">
          Showing {accessibleModules.length} modules
        </span>
      </div>

      {/* Grid of Accessible Modules */}
      {accessibleModules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No Module Entitlements Assigned
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Your user account does not currently have permissions assigned to any operational modules. Please contact your organization administrator to enable your workspace roles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleModules.map((mod) => {
            const meta = MODULE_META[mod.key] || {
              title: mod.name,
              category: "Operational Module",
              description: `Access tools and workflow management for ${mod.name}.`,
              icon: Package,
              gradient: "from-slate-700 to-slate-900",
              badgeBg: "bg-slate-100 border-slate-200 text-slate-700",
              badgeText: "Operations",
            };
            const Icon = meta.icon;
            const targetRoute = `/dashboard/${mod.key}/dashboard`;

            return (
              <div
                key={mod.key}
                onClick={() => router.push(targetRoute)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 hover:border-[#0000F2]/40 hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-md shadow-blue-500/10 group-hover:scale-105 transition`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${meta.badgeBg}`}
                    >
                      {meta.badgeText}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div className="mt-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {meta.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5 group-hover:text-[#0000F2] transition">
                      {mod.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {meta.description}
                  </p>
                </div>

                {/* Footer inside card */}
                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {mod.features.includes("*")
                        ? "Full Access"
                        : `${mod.features.length} Features`}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0000F2] group-hover:translate-x-1 transition-transform">
                    <span>Enter Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
