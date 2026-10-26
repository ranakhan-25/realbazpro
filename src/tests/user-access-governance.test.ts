import test from "node:test";
import assert from "node:assert/strict";

import type { UserAccessResponse, AccessibleModule } from "../services/userAccessService";
import type { DashboardStatsResponse } from "../services/dashboardService";

/**
 * Pure route validation logic matching UserAccessContext.hasAccessToRoute
 */
function checkRouteAccess(
  pathname: string,
  entitledModuleKeys: string[],
  allAllowedPaths: string[],
): boolean {
  if (!pathname.startsWith("/dashboard")) {
    return true;
  }

  const parts = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) {
    return true;
  }

  const targetModuleKey = parts[0];
  if (!entitledModuleKeys.includes(targetModuleKey)) {
    return false;
  }

  if (allAllowedPaths.length === 0) {
    return true;
  }

  const isExplicitlyAllowed = allAllowedPaths.some((p) => {
    if (p === pathname) return true;
    if (pathname.startsWith(`${p}/`)) return true;
    if (p.endsWith("/*")) {
      const base = p.replace(/\/\*$/, "");
      return pathname.startsWith(base);
    }
    return false;
  });

  return isExplicitlyAllowed;
}

test("UserAccess: recognizes entitled modules and blocks unentitled modules", () => {
  const entitledModuleKeys = ["project", "crm", "procurement"];
  const allAllowedPaths = [
    "/dashboard/project",
    "/dashboard/project/dashboard",
    "/dashboard/project/projects",
    "/dashboard/crm",
    "/dashboard/crm/leads",
    "/dashboard/procurement",
  ];

  // Allowed module and route
  assert.equal(
    checkRouteAccess("/dashboard/project/dashboard", entitledModuleKeys, allAllowedPaths),
    true,
    "Should allow navigation to permitted project dashboard",
  );

  assert.equal(
    checkRouteAccess("/dashboard/crm/leads", entitledModuleKeys, allAllowedPaths),
    true,
    "Should allow navigation to permitted CRM leads",
  );

  // Unentitled module (anti sneak security barrier)
  assert.equal(
    checkRouteAccess("/dashboard/accounts/billing/invoices", entitledModuleKeys, allAllowedPaths),
    false,
    "Should strictly block access to accounts module when not entitled",
  );

  assert.equal(
    checkRouteAccess("/dashboard/lams/land-owners", entitledModuleKeys, allAllowedPaths),
    false,
    "Should block access to LAMS module when not entitled",
  );

  assert.equal(
    checkRouteAccess("/dashboard/hrm/payroll", entitledModuleKeys, allAllowedPaths),
    false,
    "Should block access to HRM module when not entitled",
  );
});

test("UserAccess: handles non dashboard routes gracefully", () => {
  const entitled = ["project"];
  const paths = ["/dashboard/project"];

  assert.equal(
    checkRouteAccess("/admin/dashboard", entitled, paths),
    true,
    "Non dashboard routes should pass through",
  );

  assert.equal(
    checkRouteAccess("/login", entitled, paths),
    true,
    "Public auth routes should pass through",
  );
});

test("UserAccess: handles nested wildcard routes", () => {
  const entitled = ["project"];
  const paths = ["/dashboard/project/*"];

  assert.equal(
    checkRouteAccess("/dashboard/project/sites/details/123", entitled, paths),
    true,
    "Wildcard path should match deep nested pages",
  );
});

test("RoleAuthority: enforces hierarchy levels", () => {
  const ROLE_LEVELS = {
    SUPER_ADMIN: 1,
    ORG_ADMIN: 2,
    MANAGER: 3,
    STAFF: 4,
    VIEWER: 5,
  };

  const isPrivilegeEscalation = (creatorLevel: number, targetLevel: number) => {
    // Creator cannot assign a role with higher authority (lower level number)
    return targetLevel < creatorLevel;
  };

  // Org Admin (level 2) cannot create Super Admin (level 1)
  assert.equal(
    isPrivilegeEscalation(ROLE_LEVELS.ORG_ADMIN, ROLE_LEVELS.SUPER_ADMIN),
    true,
    "Org Admin must not create Super Admin",
  );

  // Org Admin can create another Org Admin (level 2)
  assert.equal(
    isPrivilegeEscalation(ROLE_LEVELS.ORG_ADMIN, ROLE_LEVELS.ORG_ADMIN),
    false,
    "Org Admin may create another Org Admin",
  );

  // Org Admin can create Staff (level 4)
  assert.equal(
    isPrivilegeEscalation(ROLE_LEVELS.ORG_ADMIN, ROLE_LEVELS.STAFF),
    false,
    "Org Admin may create staff",
  );

  // Staff (level 4) cannot create Manager (level 3)
  assert.equal(
    isPrivilegeEscalation(ROLE_LEVELS.STAFF, ROLE_LEVELS.MANAGER),
    true,
    "Staff cannot escalate to Manager",
  );
});

test("DashboardStats: validates response shape for Super Admin vs Org Admin", () => {
  const superAdminStats: DashboardStatsResponse = {
    role: "super-admin",
    overview: {
      title: "Platform Administration",
      subtitle: "Global overview across all tenants",
      metrics: [
        { title: "Total Organizations", value: 10 },
        { title: "Total Platform Users", value: 17 },
      ],
    },
    charts: {
      activityTrend: [{ day: "Mon", value: 10 }],
      roleDistribution: [{ name: "Super Admin", value: 2 }],
      userStatusBreakdown: [{ label: "Active", count: 17, color: "#0000F2" }],
    },
    recentActivities: [
      { title: "Org registered", description: "Org 14 joined", time: "1h ago" },
    ],
  };

  assert.equal(superAdminStats.role, "super-admin");
  assert.equal(superAdminStats.overview.metrics.length, 2);
  assert.equal(superAdminStats.organization, undefined);

  const orgAdminStats: DashboardStatsResponse = {
    role: "org-admin",
    overview: {
      title: "Company Workspace",
      subtitle: "Enterprise operations",
      metrics: [
        { title: "Company Users", value: 3 },
        { title: "Active Members", value: 3 },
      ],
    },
    charts: {
      activityTrend: [{ day: "Mon", value: 5 }],
      roleDistribution: [{ name: "Org Admin", value: 1 }],
      userStatusBreakdown: [{ label: "Active", count: 3, color: "#0000F2" }],
    },
    recentActivities: [
      { title: "User created", description: "Tariq joined", time: "Just now" },
    ],
    organization: {
      id: 14,
      name: "Apex Holdings",
      code: "APEX",
      websitePublished: true,
    },
  };

  assert.equal(orgAdminStats.role, "org-admin");
  assert.equal(orgAdminStats.organization?.id, 14);
  assert.equal(orgAdminStats.organization?.websitePublished, true);
});

test("UniversalDashboard & DynamicSidebar: verifies Hub route access and dynamic menu tree resolution", () => {
  // 1. Universal Dashboard Hub is permissible even if user has zero project entitlement
  const nonProjectEntitlements = ["crm", "accounts"];
  const nonProjectPaths = ["/dashboard/crm", "/dashboard/accounts"];

  assert.equal(
    checkRouteAccess("/dashboard", nonProjectEntitlements, nonProjectPaths),
    true,
    "Universal Dashboard hub route must be accessible to any authenticated user",
  );

  assert.equal(
    checkRouteAccess("/dashboard/", nonProjectEntitlements, nonProjectPaths),
    true,
    "Universal Dashboard hub with trailing slash must be accessible",
  );

  // 2. Dynamic sidebar resolution logic
  const mockBackendTree = [
    { label: "Dashboard", slug: "dashboard", path: "dashboard" },
    {
      label: "Custom Feature",
      slug: "custom-feature",
      path: "custom-feature",
      children: [{ label: "Sub Item", slug: "sub-item", path: "custom-feature/sub-item" }],
    },
  ];

  const currentAccessibleMod = {
    id: 1,
    key: "crm",
    name: "CRM",
    code: "CRM",
    route: "/dashboard/crm",
    features: ["CRM_CUSTOM"],
    allowedRoutes: ["custom-feature"],
    menuTree: mockBackendTree,
  };

  // When backend menuTree is provided, resolveDynamicTree adopts it directly
  function resolveDynamicTree(mod: typeof currentAccessibleMod, staticFallback: any[]) {
    if (mod?.menuTree && mod.menuTree.length > 0) {
      return mod.menuTree;
    }
    return staticFallback;
  }

  const resolved = resolveDynamicTree(currentAccessibleMod, [{ label: "Static", slug: "static", path: "static" }]);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[1].label, "Custom Feature");
  assert.equal(resolved[1].children?.[0].label, "Sub Item");
});

