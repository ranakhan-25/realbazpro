/* eslint-disable prettier/prettier */
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileKey2,
  KeyRound,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Globe,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import {
  getAdminDashboardStats,
  DashboardStatsResponse,
} from "@/services/dashboardService";
import UserWizardModal from "@/components/modules/UserWizardModal";

export default function AdminDashboardPage() {
  const { primaryColor } = useTheme();
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminDashboardStats();
      setData(res);
    } catch (err: any) {
      console.warn("Could not load dashboard stats:", err);
      setError(err?.message || "Failed to load live statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const isOrgAdmin = data?.role === "org-admin";

  const metrics = useMemo(() => {
    if (data?.overview?.metrics) {
      const iconMap: Record<number, any> = {
        0: isOrgAdmin ? Users : Building2,
        1: isOrgAdmin ? UserCheck : CheckCircle2,
        2: isOrgAdmin ? Boxes : Users,
        3: isOrgAdmin ? Globe : ShieldCheck,
      };
      return data.overview.metrics.map((m, idx) => ({
        ...m,
        icon: iconMap[idx] || Users,
      }));
    }
    return [];
  }, [data, isOrgAdmin]);

  const quickActions = useMemo(() => {
    if (isOrgAdmin) {
      return [
        {
          label: "Add User",
          description: "Launch wizard",
          icon: UserPlus,
          onClick: () => setWizardOpen(true),
          color: "bg-blue-100 text-blue-600 group-hover:bg-blue-600",
        },
        {
          label: "Company Users",
          description: "Manage team",
          icon: Users,
          href: "/admin/users",
          color: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600",
        },
        {
          label: "Roles & Access",
          description: "Role levels",
          icon: ShieldCheck,
          href: "/admin/roles",
          color: "bg-violet-100 text-violet-600 group-hover:bg-violet-600",
        },
        {
          label: "Website CMS",
          description: "Brand settings",
          icon: Settings,
          href: "/admin/web-settings",
          color: "bg-amber-100 text-amber-600 group-hover:bg-amber-600",
        },
      ];
    }
    return [
      {
        label: "Organizations",
        description: "Manage tenants",
        icon: Building2,
        href: "/admin/orgs",
        color: "bg-blue-100 text-blue-600 group-hover:bg-blue-600",
      },
      {
        label: "Subscription Plans",
        description: "Package tiers",
        icon: Boxes,
        href: "/admin/plans",
        color: "bg-violet-100 text-violet-600 group-hover:bg-violet-600",
      },
      {
        label: "Users & Security",
        description: "Global accounts",
        icon: Users,
        href: "/admin/users",
        color: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600",
      },
      {
        label: "System Modules",
        description: "ERP features",
        icon: FileKey2,
        href: "/admin/modules",
        color: "bg-amber-100 text-amber-600 group-hover:bg-amber-600",
      },
    ];
  }, [isOrgAdmin]);

  const activityData = data?.charts?.activityTrend || [
    { day: "Mon", value: 30 },
    { day: "Tue", value: 45 },
    { day: "Wed", value: 60 },
    { day: "Thu", value: 75 },
    { day: "Fri", value: 65 },
    { day: "Sat", value: 85 },
    { day: "Sun", value: 70 },
  ];

  const roleDistribution = data?.charts?.roleDistribution || [
    { name: "Admin", value: 60, color: "#0000F2" },
    { name: "Manager", value: 40, color: "#10B981" },
    { name: "Staff", value: 30, color: "#8B5CF6" },
  ];

  const activities = data?.recentActivities || [];

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              {isOrgAdmin ? "Organization Workspace" : "Super Administration"}
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {data?.overview?.title || "Administration Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {data?.overview?.subtitle || "Real-time enterprise analytics and access governance."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOrgAdmin ? (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <UserPlus className="h-4 w-4" /> Add Team Member
            </button>
          ) : null}
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Operational
          </div>
        </div>
      </motion.div>

      {/* METRIC STATS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-150"
                style={{ backgroundColor: stat.color }}
              />

              <div className="relative flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.text} transition-all`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                {stat.change ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {stat.change}
                  </span>
                ) : null}
              </div>

              <p className="relative mt-4 text-xs font-medium text-slate-500">
                {stat.title}
              </p>
              <h2 className="relative mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </h2>
            </motion.div>
          );
        })}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* Activity Curve */}
        <motion.section
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isOrgAdmin ? "Team Activity Trend" : "Platform Registration Trend"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Weekly activity progression over 7 days
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              Active Growth
            </span>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 px-2">
            {activityData.map((item, index) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-36 bg-slate-50/70 rounded-xl p-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(15, item.value)}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    className="w-full max-w-[28px] rounded-lg bg-blue-600"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Role Breakdown */}
        <motion.section
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isOrgAdmin ? "Role Allocation" : "Authority Breakdown"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Distribution across authorization tiers
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {roleDistribution.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value} users</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, item.value * 3))}%`,
                      backgroundColor: item.color || primaryColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* BOTTOM ROW: RECENT ACTIVITIES & QUICK ACTIONS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent Activity Feed */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {isOrgAdmin ? "Recent team milestones" : "Platform registrations"}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {activities.length > 0 ? (
              activities.map((act, index) => (
                <div key={index} className="flex items-center gap-3.5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {act.description}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                    <Clock3 className="h-3 w-3" />
                    {act.time}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No recent activity recorded.
              </p>
            )}
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Essential administrative navigation
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const content = (
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition group-hover:text-white ${action.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500" />
                  </div>
                  <div>
                    <p className="mt-3 text-xs font-bold text-slate-700">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              );

              if (action.onClick) {
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="group rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={action.label}
                  href={action.href!}
                  className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-sm"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </motion.section>
      </div>

      <UserWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => void loadStats()}
      />
    </main>
  );
}
