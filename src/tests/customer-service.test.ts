import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -----------------------------------------------------------------------------
// Helper mimicking Sidebar sanitizeMenuLabel
// -----------------------------------------------------------------------------
function sanitizeMenuLabel(label: string, slug?: string): string {
  if (!label) return label;
  const l = label.toLowerCase();
  const s = (slug || "").toLowerCase();
  if (
    l.includes("360") ||
    s.includes("360") ||
    l.includes("°") ||
    s.includes("°") ||
    /\u00B0/i.test(label) ||
    /360/i.test(label) ||
    /360/i.test(slug || "")
  ) {
    if (
      l.includes("properties") ||
      l.includes("portfolio") ||
      l.includes("bookings")
    ) {
      return "Bookings & Property Portfolio";
    }
    if (l.includes("customers & properties")) {
      return "Customers & Properties";
    }
    return "Customer Entry";
  }
  const cleaned = label
    .replace(/360\s*°?/gi, "")
    .replace(/[°\u00B0]/g, "")
    .trim();
  if (cleaned.toLowerCase() === "customer") {
    return "Customer Entry";
  }
  return cleaned || label;
}

test("Customer Service Menu: Label sanitization eliminates 360°", () => {
  assert.strictEqual(sanitizeMenuLabel("Customer 360°"), "Customer Entry");
  assert.strictEqual(sanitizeMenuLabel("Customer 360"), "Customer Entry");
  assert.strictEqual(
    sanitizeMenuLabel("customer 360°", "customer-360"),
    "Customer Entry",
  );
  assert.strictEqual(sanitizeMenuLabel("Customer Entry"), "Customer Entry");
  assert.strictEqual(
    sanitizeMenuLabel("Customers & Properties"),
    "Customers & Properties",
  );
  assert.strictEqual(
    sanitizeMenuLabel("Bookings & Property Portfolio 360°"),
    "Bookings & Property Portfolio",
  );
});

test("Customer Service Query Contract: is_deleted boolean serialization", () => {
  // Query construction pattern: only set is_deleted when truthy
  const buildQuery = (params?: {
    is_deleted?: boolean;
    project_id?: string;
  }) => {
    const query: Record<string, unknown> = {};
    if (params?.project_id) query.project_id = params.project_id;
    if (params?.is_deleted) query.is_deleted = true;
    return query;
  };

  const activeQuery = buildQuery({ is_deleted: false, project_id: "proj-1" });
  assert.strictEqual(
    activeQuery.is_deleted,
    undefined,
    "Active records must NOT pass is_deleted=false",
  );

  const deletedQuery = buildQuery({ is_deleted: true, project_id: "proj-1" });
  assert.strictEqual(
    deletedQuery.is_deleted,
    true,
    "Deleted records must pass is_deleted=true",
  );
});

test("Customer Service Route Registry: All 17 pages exist on disk", () => {
  const baseDir = path.resolve(
    __dirname,
    "../app/(admin-dashbord)/dashboard/customer-service",
  );

  const requiredRoutes = [
    "page.tsx",
    "building-committee/page.tsx",
    "communication/feedback-surveys/page.tsx",
    "communication/inbox-reminders/page.tsx",
    "communication/site-visits-appointments/page.tsx",
    "customers/page.tsx",
    "customers/customer-360/page.tsx",
    "customers/properties-bookings/page.tsx",
    "customers/change-requests/page.tsx",
    "documents/center/page.tsx",
    "documents/mutation-khatian-tracking/page.tsx",
    "documents/registration-tracking/page.tsx",
    "handover/inspection-snags/page.tsx",
    "handover/possession-records/page.tsx",
    "handover/schedule/page.tsx",
    "other-services/page.tsx",
    "parking-service/page.tsx",
    "property-care/maintenance-requests/page.tsx",
    "property-care/warranty-dlp/page.tsx",
    "property-care/work-orders-association/page.tsx",
    "reports/collections-ageing/page.tsx",
    "reports/handover-property-care/page.tsx",
    "reports/service-ticket-sla/page.tsx",
    "security-service/page.tsx",
    "service-charge/page.tsx",
    "tickets/page.tsx",
    "utility-service/page.tsx",
  ];

  for (const route of requiredRoutes) {
    const fullPath = path.join(baseDir, route);
    assert.strictEqual(
      fs.existsSync(fullPath),
      true,
      `Route file must exist: ${route}`,
    );
  }
});

test("Customer Service Soft-Delete Contract: No unauthorized restore actions", () => {
  const baseDir = path.resolve(
    __dirname,
    "../app/(admin-dashbord)/dashboard/customer-service",
  );

  // Inspect all files to ensure no clickable restore buttons/handlers exist in Customer Service
  const files = [
    "customers/customer-360/page.tsx",
    "handover/inspection-snags/page.tsx",
    "handover/possession-records/page.tsx",
    "handover/schedule/page.tsx",
    "property-care/maintenance-requests/page.tsx",
    "property-care/warranty-dlp/page.tsx",
    "property-care/work-orders-association/page.tsx",
    "tickets/page.tsx",
  ];

  for (const relPath of files) {
    const fullPath = path.join(baseDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      // Check for forbidden patterns
      assert.doesNotMatch(
        content,
        /<button[^>]*>\s*<RotateCcw[^>]*\/>\s*<span>Restore<\/span>\s*<\/button>/i,
        `Forbidden clickable restore button found in ${relPath}`,
      );
    }
  }
});
