/* eslint-disable prettier/prettier */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Boxes,
  Building,
  ChevronDown,
  ChevronRight,
  FileCog,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
  Building2,
  CreditCard,
  History,
  Gauge,
  FileText,
  Settings2,
  Layers,
  Database,
  BarChart3,
  Bell,
  Sliders,
  FolderTree,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import {
  clearStoredTokens,
  getStoredUserProfile,
  AdminUserProfile,
} from "@/lib/admin-auth/adminAuthStorage";
import { useTheme } from "@/lib/theme";
import { adminMenuService, AdminMenuItemNode } from "@/services/adminMenuService";

// Map Lucide icons by string identifier
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Boxes,
  Building,
  Building2,
  CreditCard,
  Menu: MenuIcon,
  Settings,
  User,
  Users,
  ShieldCheck,
  KeyRound,
  FileCog,
  History,
  Gauge,
  FileText,
  Settings2,
  Layers,
  Database,
  BarChart3,
  Bell,
  Sliders,
  FolderTree,
};

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type AdminNavGroup = {
  label: string;
  icon: LucideIcon;
  children: AdminNavItem[];
};

type AdminMenuItem = AdminNavItem | AdminNavGroup;

export const defaultMenuGroups: AdminMenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "System Management",
    icon: Boxes,
    children: [
      {
        label: "Organization",
        href: "/admin/orgs",
        icon: Building2,
      },
      {
        label: "Plans & Subscriptions",
        href: "/admin/plans",
        icon: CreditCard,
      },
      {
        label: "Menu Management",
        href: "/admin/menus",
        icon: MenuIcon,
      },
      {
        label: "Web Management",
        href: "/admin/web-settings",
        icon: Settings,
      },
      {
        label: "User Organization",
        href: "/admin/organization",
        icon: User,
      },
    ],
  },
  {
    label: "Authentication & Access",
    icon: ShieldCheck,
    children: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Roles",
        href: "/admin/roles",
        icon: ShieldCheck,
      },
      {
        label: "Permissions",
        href: "/admin/permissions",
        icon: KeyRound,
      },
      {
        label: "Features",
        href: "/admin/features",
        icon: FileCog,
      },
      {
        label: "Modules",
        href: "/admin/modules",
        icon: Boxes,
      },
    ],
  },
  {
    label: "Reports & Logs",
    icon: History,
    children: [
      {
        label: "Audit Logs",
        href: "/admin/audit",
        icon: History,
      },
      {
        label: "Usage & Limits",
        href: "/admin/usage",
        icon: Gauge,
      },
    ],
  },
  {
    label: "System Settings",
    icon: Settings2,
    children: [
      {
        label: "Agreements",
        href: "/admin/agreements",
        icon: FileText,
      },
      {
        label: "System Config",
        href: "/admin/config",
        icon: Settings2,
      },
    ],
  },
  {
    label: "Enterprise Analytics Suite",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

// Org Admin allowed sidebar links
const ORG_ADMIN_ALLOWED_HREFS = new Set([
  "/admin/dashboard",
  "/admin/web-settings",
  "/admin/organization",
  "/admin/users",
  "/admin/roles",
]);

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { primaryColor } = useTheme();

  const [userProfile, setUserProfile] = useState<AdminUserProfile | null>(null);
  const [dynamicMenuTree, setDynamicMenuTree] = useState<AdminMenuItemNode[] | null>(null);

  useEffect(() => {
    const profile = getStoredUserProfile();
    setUserProfile(profile);

    const isSuper = Boolean(
      profile?.isSuperUser === true ||
        profile?.role === "super-admin" ||
        (Array.isArray(profile?.roles) && profile.roles.includes("super-admin"))
    );

    const roleParam = isSuper ? "super-admin" : "org-admin";

    adminMenuService
      .getMenuTree(roleParam)
      .then((tree) => {
        if (Array.isArray(tree) && tree.length > 0) {
          setDynamicMenuTree(tree);
        }
      })
      .catch(() => {
        // Fallback to static defaultMenuGroups
      });
  }, []);

  const isSuperAdmin = useMemo(() => {
    if (!userProfile) return true;
    return Boolean(
      userProfile.isSuperUser === true ||
        userProfile.role === "super-admin" ||
        (Array.isArray(userProfile.roles) && userProfile.roles.includes("super-admin"))
    );
  }, [userProfile]);

  // Convert dynamic backend tree to sidebar structure, or fall back to default
  const visibleMenuGroups = useMemo<AdminMenuItem[]>(() => {
    if (dynamicMenuTree && dynamicMenuTree.length > 0) {
      // Filter out any operational module items that do not belong to /admin portal
      const adminNodes = dynamicMenuTree.filter((node) => {
        if (!node.children || node.children.length === 0) {
          return Boolean(node.url && node.url.startsWith("/admin"));
        }
        return node.children.some((c) => Boolean(c.url && c.url.startsWith("/admin")));
      });

      if (adminNodes.length > 0) {
        return adminNodes
          .map((node) => {
            const IconComponent = (node.icon && ICON_MAP[node.icon]) || FolderTree;

            if (node.children && node.children.length > 0) {
              const adminChildren = node.children.filter(
                (c) => Boolean(c.url && c.url.startsWith("/admin")),
              );

              const filteredChildren = isSuperAdmin
                ? adminChildren
                : adminChildren.filter((c) => c.url && ORG_ADMIN_ALLOWED_HREFS.has(c.url));

              if (filteredChildren.length === 0) return null;

              return {
                label: node.title,
                icon: IconComponent,
                children: filteredChildren.map((c) => ({
                  label: c.title,
                  href: c.url || "#",
                  icon: (c.icon && ICON_MAP[c.icon]) || ChevronRight,
                })),
              };
            }

            if (!node.url || !node.url.startsWith("/admin")) {
              return null;
            }

            if (!isSuperAdmin && !ORG_ADMIN_ALLOWED_HREFS.has(node.url)) {
              return null;
            }

            return {
              label: node.title,
              href: node.url || "#",
              icon: IconComponent,
            };
          })
          .filter(Boolean) as AdminMenuItem[];
      }
    }

    if (isSuperAdmin) {
      return defaultMenuGroups;
    }

    return defaultMenuGroups
      .map((item) => {
        if ("href" in item) {
          return ORG_ADMIN_ALLOWED_HREFS.has(item.href) ? item : null;
        }

        const filteredChildren = item.children.filter((child) =>
          ORG_ADMIN_ALLOWED_HREFS.has(child.href)
        );

        if (filteredChildren.length === 0) return null;

        return {
          ...item,
          children: filteredChildren,
        };
      })
      .filter(Boolean) as AdminMenuItem[];
  }, [dynamicMenuTree, isSuperAdmin]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "System Management": true,
    "Authentication & Access": true,
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleSignOut = () => {
    clearStoredTokens();
    router.replace("/admin/login");
  };

  const isItemActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (children: AdminNavItem[]) => {
    return children.some((c) => isItemActive(c.href));
  };

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-all duration-200 active:scale-95 md:hidden"
        aria-label="Open navigation menu"
      >
        <MenuIcon size={20} />
      </button>

      {/* BACKDROP FOR MOBILE */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* LOGO & BRAND HEADER */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative h-8 w-8">
              <Image
                src="/logo.svg"
                alt="Realbiz Logo"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  Realbiz
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${primaryColor}14`,
                    color: primaryColor,
                  }}
                >
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-normal text-slate-500">
                {isSuperAdmin ? "Super Admin Console" : "Org Admin Portal"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-3">
          <div className="space-y-1">
            {visibleMenuGroups.map((group, idx) => {
              // SINGLE NAV ITEM (No children)
              if ("href" in group) {
                const active = isItemActive(group.href);
                const Icon = group.icon;

                return (
                  <Link
                    key={`item-${idx}-${group.href}`}
                    href={group.href}
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: active ? 0 : 2 }}
                      whileTap={{ scale: 0.985 }}
                      className="relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
                      style={
                        active
                          ? {
                              backgroundColor: primaryColor,
                              color: "#ffffff",
                              boxShadow: `0 1px 2px ${primaryColor}33`,
                            }
                          : { color: "#475569" }
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
                          e.currentTarget.style.color = primaryColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = "";
                          e.currentTarget.style.color = "#475569";
                        }
                      }}
                    >
                      <Icon
                        size={17}
                        className="shrink-0"
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {group.label}
                      </span>
                      {active && (
                        <ChevronRight size={14} className="shrink-0" />
                      )}
                    </motion.div>
                  </Link>
                );
              }

              // COLLAPSIBLE GROUP
              const isOpen = openGroups[group.label] ?? false;
              const hasActiveChild = isGroupActive(group.children);
              const GroupIcon = group.icon;

              return (
                <motion.div
                  key={`group-${idx}-${group.label}`}
                  className="space-y-0.5"
                  initial={false}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                    style={
                      hasActiveChild && !isOpen
                        ? {
                            backgroundColor: `${primaryColor}0D`,
                            color: primaryColor,
                          }
                        : { color: "#475569" }
                    }
                    onMouseEnter={(e) => {
                      if (!hasActiveChild || isOpen) {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasActiveChild || isOpen) {
                        e.currentTarget.style.backgroundColor = "";
                      }
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <GroupIcon
                        size={17}
                        className="shrink-0"
                        strokeWidth={hasActiveChild ? 2.2 : 1.8}
                      />
                      <span className="min-w-0 truncate">{group.label}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown size={14} className="shrink-0 opacity-60" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="relative space-y-0.5 py-0.5 pl-6 pr-1">
                          <div
                            aria-hidden
                            className="absolute top-1 bottom-1 left-4 w-px bg-slate-200"
                          />
                          {group.children.map((child, cIdx) => {
                            const active = isItemActive(child.href);
                            const ChildIcon = child.icon;

                            return (
                              <Link
                                key={`child-${idx}-${cIdx}-${child.href}`}
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className="block"
                              >
                                <motion.div
                                  whileHover={{ x: active ? 0 : 2 }}
                                  whileTap={{ scale: 0.985 }}
                                  className="relative flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium transition-all sm:px-3"
                                  style={
                                    active
                                      ? {
                                          backgroundColor: primaryColor,
                                          color: "#ffffff",
                                          boxShadow: `0 1px 2px ${primaryColor}33`,
                                        }
                                      : { color: "#64748B" }
                                  }
                                  onMouseEnter={(e) => {
                                    if (!active) {
                                      e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
                                      e.currentTarget.style.color = primaryColor;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!active) {
                                      e.currentTarget.style.backgroundColor = "";
                                      e.currentTarget.style.color = "#64748B";
                                    }
                                  }}
                                >
                                  <ChildIcon
                                    size={15}
                                    className="shrink-0"
                                    strokeWidth={active ? 2.1 : 1.7}
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {child.label}
                                  </span>
                                  {active && (
                                    <ChevronRight size={13} className="shrink-0" />
                                  )}
                                </motion.div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 pb-[max(12px,env(safe-area-inset-bottom))] sm:p-3">
          <Link
            href="/admin/settings"
            onClick={() => setMobileOpen(false)}
            className="block"
          >
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.985 }}
              className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
              style={
                pathname.startsWith("/admin/settings")
                  ? {
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      boxShadow: `0 1px 2px ${primaryColor}33`,
                    }
                  : { color: "#475569" }
              }
              onMouseEnter={(e) => {
                if (!pathname.startsWith("/admin/settings")) {
                  e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
                  e.currentTarget.style.color = primaryColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!pathname.startsWith("/admin/settings")) {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <Settings size={17} className="shrink-0" />
              <span className="min-w-0 truncate">Settings</span>
            </motion.div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full text-left"
          >
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.985 }}
              className="mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut size={17} className="shrink-0" />
              <span className="min-w-0 truncate">Sign Out</span>
            </motion.div>
          </button>
        </div>
      </aside>
    </>
  );
}
