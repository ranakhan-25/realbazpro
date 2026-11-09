/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  X,
  LayoutDashboard,
  Users,
  Compass,
  Handshake,
  FileCheck2,
  CalendarCheck2,
  Calculator,
  ShieldCheck,
  ClipboardCheck,
  Workflow,
  CreditCard,
  BarChart3,
  Settings,
  Headset,
  Wrench,
  Building2,
  Database,
  Zap,
  Car,
  Layers,
  KeyRound,
  LifeBuoy,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MENUS, MODULES, type MenuNode, type ModuleKey } from "@/lib/menus";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useUserAccess } from "@/context/UserAccessContext";
import { useSidebar } from "@/context/SidebarContext";

const CUSTOMER_SERVICE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  "after-sales": Headset,
  "building-services": Wrench,
  "building-management": Building2,
  "pre-sales": CalendarCheck2,
  "core-records": Database,
  "utility-service": Zap,
  "security-service": ShieldCheck,
  "parking-service": Car,
  "other-services": Layers,
  "service-charge": Receipt,
  "building-committee": Users,
  customers: Users,
  "customers-properties": Users,
  payments: Receipt,
  "payments-collections": Receipt,
  documents: FileCheck2,
  "documents-land-records": FileCheck2,
  handover: KeyRound,
  "handover-possession": KeyRound,
  tickets: LifeBuoy,
  "tickets-service-requests": LifeBuoy,
  "property-care": ShieldCheck,
  "warranty-property-care": ShieldCheck,
  communication: MessageSquare,
  "communication-appointments": MessageSquare,
  reports: BarChart3,
  "reports-analytics": BarChart3,
  settings: Settings,
  "settings-administration": Settings,
};
const LAMS_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  "acquisition-leads": Compass,
  "land-owners": Users,
  valuations: Calculator,
  "legal-verification": ShieldCheck,
  "due-diligence": ClipboardCheck,
  "negotiation-process": Handshake,
  approvals: Workflow,
  settlements: CreditCard,
  "legal-documents": FileCheck2,
  reports: BarChart3,
  "follow-up": CalendarCheck2,
};

const FALLBACK_PRIMARY = "#2ed573";

type Props = {
  module: ModuleKey;
  activePath: string;
  open: boolean;
  onClose: () => void;
  filter: string;
};

function pruneTreeByAccess(
  nodes: MenuNode[] | undefined,
  moduleKey: string,
  hasAccess: (mod: string, path: string) => boolean,
): MenuNode[] {
  if (!nodes || !nodes.length) return [];
  const out: MenuNode[] = [];
  for (const n of nodes) {
    const kids = n.children
      ? pruneTreeByAccess(n.children, moduleKey, hasAccess)
      : undefined;
    const selfAllowed = hasAccess(moduleKey, n.path);
    if (selfAllowed || (kids && kids.length > 0)) {
      out.push({
        ...n,
        children: kids,
      });
    }
  }
  return out;
}

function filterTree(nodes: MenuNode[], q: string): MenuNode[] {
  if (!q) return nodes;
  const out: MenuNode[] = [];
  for (const n of nodes) {
    const kids = n.children ? filterTree(n.children, q) : [];
    if (n.label.toLowerCase().includes(q) || kids.length) {
      out.push({
        ...n,
        children: kids.length
          ? kids
          : n.children && n.label.toLowerCase().includes(q)
            ? n.children
            : undefined,
      });
    }
  }
  return out;
}

function cloneTree(nodes: MenuNode[] | undefined): MenuNode[] {
  return (nodes ?? []).map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

export function Sidebar({ module, activePath, open, onClose, filter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || FALLBACK_PRIMARY;
  const { accessibleModules, hasAccessToRoute } = useUserAccess();
  const { isCollapsed, toggleCollapse } = useSidebar();

  const displayModules = useMemo(() => {
    if (accessibleModules && accessibleModules.length > 0) {
      return accessibleModules.map((m) => ({
        key: m.key as ModuleKey,
        label: m.name,
      }));
    }
    return MODULES;
  }, [accessibleModules]);

  const q = filter.trim().toLowerCase();

  const currentAccessibleMod = useMemo(() => {
    return accessibleModules.find(
      (m) => m.key.toLowerCase() === module.toLowerCase(),
    );
  }, [accessibleModules, module]);

  const permittedTree = useMemo(() => {
    let base: MenuNode[] = [];
    if (
      currentAccessibleMod?.menuTree &&
      currentAccessibleMod.menuTree.length > 0
    ) {
      base = currentAccessibleMod.menuTree;
    } else {
      const rawTree = MENUS[module] || [];
      base = pruneTreeByAccess(rawTree, module, hasAccessToRoute);
    }
    // let base = pruneTreeByAccess(MENUS[module], module, hasAccessToRoute);
    if (module === "procurement") {
      base = base.filter(
        (n) => n.slug !== "approvals" && n.slug !== "vendors"
      );
      const eqNode = base.find((n) => n.slug === "equipment-hire");
      const defaultEqNode = MENUS.procurement?.find((n) => n.slug === "equipment-hire");
      if (eqNode && defaultEqNode?.children) {
        eqNode.children = defaultEqNode.children;
      } else if (!eqNode && defaultEqNode) {
        base.push(defaultEqNode);
      }

      // Ensure configuration -> products has all 5 items: Category, Sub-Category, Brand, Unit, Item Entry
      const configNode = base.find((n) => n.slug === "configuration");
      const defaultConfigNode = MENUS.procurement?.find((n) => n.slug === "configuration");
      if (configNode && defaultConfigNode?.children) {
        const prodNode = configNode.children?.find((c) => c.slug === "products");
        const defaultProdNode = defaultConfigNode.children?.find((c) => c.slug === "products");
        if (prodNode && defaultProdNode?.children) {
          prodNode.children = defaultProdNode.children;
        } else if (!prodNode && defaultProdNode) {
          configNode.children = [defaultProdNode, ...(configNode.children || [])];
        }

        const assetNode = configNode.children?.find((c) => c.slug === "asset");
        const defaultAssetNode = defaultConfigNode.children?.find((c) => c.slug === "asset");
        if (assetNode && defaultAssetNode?.children) {
          assetNode.children = defaultAssetNode.children;
        } else if (!assetNode && defaultAssetNode) {
          configNode.children = [...(configNode.children || []), defaultAssetNode];
        }
      } else if (!configNode && defaultConfigNode) {
        base.unshift(defaultConfigNode);
      }
    }
    return base;
  }, [currentAccessibleMod, module, hasAccessToRoute]);

  const tree = useMemo(() => filterTree(permittedTree, q), [permittedTree, q]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const parts = activePath.split("/").filter(Boolean);
    const next = new Set<string>();
    for (let i = 1; i < parts.length; i++) {
      next.add(parts.slice(0, i).join("/"));
    }

    const cleanActive = activePath
      .replace(/^\//, "")
      .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");

    const findAncestors = (nodes: MenuNode[], stack: string[]): boolean => {
      for (const node of nodes) {
        const cleanNode = node.path
          .replace(/^\//, "")
          .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
        if (
          cleanNode === cleanActive ||
          node.path === activePath ||
          (cleanNode && cleanActive.startsWith(cleanNode + "/"))
        ) {
          stack.forEach((p) => next.add(p));
          if (!node.children?.length) {
            return true;
          }
        }
        if (node.children?.length) {
          if (findAncestors(node.children, [...stack, node.path])) {
            return true;
          }
        }
      }
      return false;
    };
    findAncestors(permittedTree, []);

    setExpanded((prev) => new Set([...prev, ...next]));
  }, [activePath, module, permittedTree]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(path)) n.delete(path);
      else n.add(path);
      return n;
    });
  };

  const renderNodes = (nodes: MenuNode[], depth = 0) => (
    <ul
      className={cn("space-y-0.5", depth > 0 && "ml-3 border-l pl-2")}
      style={depth > 0 ? { borderColor: `${brandColor}33` } : undefined}
    >
      {nodes.map((n) => {
        const cleanNodePath = n.path
          .replace(/^\//, "")
          .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
        const cleanActivePath = activePath
          .replace(/^\//, "")
          .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
        const isActive =
          cleanNodePath === cleanActivePath ||
          n.path === activePath ||
          (!cleanActivePath && (n.slug === "dashboard" || cleanNodePath === "dashboard"));
        const hasActiveDescendant = (node: MenuNode): boolean => {
          if (!node.children?.length) return false;
          return node.children.some((c) => {
            const cleanC = c.path
              .replace(/^\//, "")
              .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
            if (cleanC === cleanActivePath || c.path === activePath) return true;
            if (cleanC && cleanActivePath.startsWith(cleanC + "/")) return true;
            return hasActiveDescendant(c);
          });
        };
        const isChildActive = hasActiveDescendant(n);
        const isAncestor = Boolean(
          (cleanNodePath && cleanActivePath.startsWith(cleanNodePath + "/")) || isChildActive
        );
        const isOpen = !!q || expanded.has(n.path) || expanded.has(cleanNodePath);
        const Icon = module === "lams" ? LAMS_ICONS[n.slug] : null;

        if (n.children?.length) {
          return (
            <li key={n.path}>
              <button
                type="button"
                onClick={() => toggle(n.path)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition",
                  depth === 0 ? "font-semibold" : "font-medium",
                  !isAncestor && "text-foreground/80 hover:bg-foreground/5",
                )}
                style={
                  isAncestor
                    ? {
                        backgroundColor: `${brandColor}1A`,
                        color: brandColor,
                        boxShadow: `inset 0 0 0 1px ${brandColor}40`,
                      }
                    : undefined
                }
              >
                <span className="flex items-center gap-1.5">
                  {isAncestor ? (
                    <span
                      className="h-3.5 w-1 rounded"
                      style={{ backgroundColor: brandColor }}
                    />
                  ) : null}
                  {n.label}
                </span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen ? (
                <div className="mt-0.5">
                  {renderNodes(n.children, depth + 1)}
                </div>
              ) : null}
            </li>
          );
        }

        const href = n.path.startsWith("/")
          ? n.path
          : n.path.startsWith("http")
            ? n.path
            : `/dashboard/${module}/${n.path}`;

        return (
          <li key={n.path}>
            <Link
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition",
                isActive
                  ? "font-semibold text-white shadow-sm"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
              )}
              style={
                isActive
                  ? {
                      backgroundColor: brandColor,
                      boxShadow: `0 1px 2px ${brandColor}33`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-2 truncate">
                {Icon ? (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                ) : isActive ? (
                  <span className="h-3.5 w-1 rounded bg-white/80" />
                ) : null}
                <span className="truncate">{n.label}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const renderCollapsedNodes = (nodes: MenuNode[]) => (
    <ul className="space-y-1.5 py-1">
      {nodes.map((n) => {
        const cleanNodePath = n.path
          .replace(/^\//, "")
          .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
        const cleanActivePath = activePath
          .replace(/^\//, "")
          .replace(new RegExp(`^dashboard/${module}/?`, "i"), "");
        const isActive =
          cleanNodePath === cleanActivePath ||
          n.path === activePath ||
          (!cleanActivePath && (n.slug === "dashboard" || cleanNodePath === "dashboard"));
        const isAncestor = Boolean(
          cleanNodePath && cleanActivePath.startsWith(cleanNodePath + "/")
        );
        const Icon = module === "lams" ? LAMS_ICONS[n.slug] : null;

        if (n.children?.length) {
          return (
            <li key={n.path} className="relative group">
              <button
                type="button"
                onClick={() => {
                  toggleCollapse();
                  toggle(n.path);
                }}
                className={cn(
                  "flex h-10 w-10 mx-auto items-center justify-center rounded-xl transition",
                  isAncestor
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                )}
                style={
                  isAncestor
                    ? { backgroundColor: brandColor }
                    : undefined
                }
                title={n.label}
              >
                {Icon ? (
                  <Icon className="h-4.5 w-4.5" />
                ) : (
                  <span className="text-xs font-bold tracking-tight">
                    {n.label.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </button>

              <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                {n.label}
                <span className="ml-1 text-[10px] text-slate-300">({n.children.length})</span>
              </div>
            </li>
          );
        }

        const href = n.path.startsWith("/")
          ? n.path
          : n.path.startsWith("http")
            ? n.path
            : `/dashboard/${module}/${n.path}`;

        return (
          <li key={n.path} className="relative group">
            <Link
              href={href}
              onClick={onClose}
              className={cn(
                "flex h-10 w-10 mx-auto items-center justify-center rounded-xl transition",
                isActive
                  ? "text-white shadow-md shadow-blue-500/20"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
              )}
              style={
                isActive
                  ? { backgroundColor: brandColor }
                  : undefined
              }
              title={n.label}
            >
              {Icon ? (
                <Icon className="h-4.5 w-4.5" />
              ) : (
                <span className="text-xs font-bold tracking-tight">
                  {n.label.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>

            <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              {n.label}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-72",
          open ? "w-72 translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Module Select */}
        {isCollapsed ? (
          <div className="hidden lg:flex flex-col items-center py-4 border-b border-sidebar-border gap-2.5">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
              title="Return to Universal Workspace Hub"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black uppercase text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
              title={`Active Module: ${module.toUpperCase()}`}
            >
              {module.slice(0, 2).toUpperCase()}
            </div>
          </div>
        ) : null}

        <div className={cn("border-b border-sidebar-border p-4", isCollapsed && "lg:hidden")}>
          <div className="mb-2 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              title="Return to Universal Workspace Launchpad"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-blue-600" />
              <span>Workspace Hub</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <select
            id="module-select"
            value={module}
            onChange={(e) => {
              const next = `/dashboard/${e.target.value}`;
              if (pathname !== next) router.push(next);
            }}
            className="w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none transition"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = brandColor;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}25`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            {displayModules.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Tree */}
        <nav className="grow overflow-y-auto px-3 py-3">
          {tree.length ? (
            isCollapsed ? (
              <>
                <div className="hidden lg:block">{renderCollapsedNodes(tree)}</div>
                <div className="lg:hidden">{renderNodes(tree)}</div>
              </>
            ) : (
              renderNodes(tree)
            )
          ) : (
            <p className="px-2 text-sm text-muted-foreground">
              No menu matches.
            </p>
          )}
        </nav>

        <div className={cn(
          "border-t border-sidebar-border px-4 py-3 text-[11px] text-muted-foreground",
          isCollapsed && "lg:hidden"
        )}>
          Menu follows the selected module.
        </div>
      </aside>
    </>
  );
}
