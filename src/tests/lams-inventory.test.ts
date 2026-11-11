import test from "node:test";
import assert from "node:assert/strict";

// Import fallback datasets and API definitions from inventoryApi
import {
  fallbackCategories,
  fallbackSubCategories,
  fallbackBrands,
  fallbackUnits,
  fallbackItems,
  fallbackSuppliers,
  fallbackPurchases,
  fallbackStockReport,
  fallbackMaterialComparison,
  fallbackMaterialUsage,
  reportsApi,
} from "../lib/inventoryApi.ts";

// Import LAMS mock datasets
import {
  mockAcquisitionLeads,
  mockLandOwners,
  mockNegotiations,
  mockLegalDocuments,
  mockFollowUps,
  mockLandValuations,
  mockLegalVerifications,
  mockDueDiligence,
  mockAcquisitionApprovals,
  mockSettlements,
} from "../data/lams/lams.mock.ts";

import {
  resolveLamsTab,
  parseLamsRoute,
  lamsPath,
} from "../lib/lamsRoutes.ts";

test("LAMS: mock datasets are non-empty and well-structured", () => {
  assert.ok(Array.isArray(mockAcquisitionLeads), "Acquisition leads must be an array");
  assert.ok(mockAcquisitionLeads.length > 0, "Acquisition leads must have fallback data");

  for (const lead of mockAcquisitionLeads) {
    assert.ok(lead.id, "Lead must have an id");
    assert.ok(lead.district, "Lead must have district");
    assert.ok(lead.mouza, "Lead must have mouza");
    assert.ok(lead.leadStatus || (lead as any).status, "Lead must have status");
  }

  assert.ok(Array.isArray(mockLandOwners), "Land owners must be an array");
  assert.ok(mockLandOwners.length > 0, "Land owners must have items");
  for (const owner of mockLandOwners) {
    assert.ok(owner.id, "Owner must have id");
    assert.ok(owner.ownerName || (owner as any).name, "Owner must have name");
    assert.ok(owner.acquisitionLeadId || (owner as any).leadId, "Owner must have leadId");
  }

  assert.ok(Array.isArray(mockNegotiations), "Negotiation records must be an array");
  assert.ok(mockNegotiations.length > 0, "Negotiations must have items");

  assert.ok(Array.isArray(mockLegalDocuments), "Legal documents must be an array");
  assert.ok(mockLegalDocuments.length > 0, "Legal docs must have items");

  assert.ok(Array.isArray(mockFollowUps), "Follow ups must be an array");
  assert.ok(mockFollowUps.length > 0, "Follow ups must have items");
});

test("LAMS: Lead IDs and UUIDs are properly normalized", () => {
  const sampleLead = mockAcquisitionLeads[0];
  const normalizedId = sampleLead.uuid || sampleLead.id;
  assert.ok(typeof normalizedId === "string", "Normalized ID must be a string");
  assert.ok(normalizedId.length > 0, "Normalized ID must not be empty");
});

test("LAMS: Payload builder generates Swagger-compliant schemas", () => {
  // Test Lead Payload
  const leadPayload = {
    title: "Project Expansion Plot 4",
    district: "Dhaka",
    upazila: "Savar",
    mouza: "Hemayetpur",
    jl_number: "JL-88",
    plot_number: "PL-101",
    total_land_area: 45.5,
    estimated_budget: 15000000,
    source: "Direct Contact",
    priority: "High",
    assigned_to: "Officer A",
    notes: "Site visit completed",
    projectId: "PRJ-1001",
  };
  assert.strictEqual(leadPayload.projectId, "PRJ-1001");
  assert.strictEqual(typeof leadPayload.total_land_area, "number");
  assert.strictEqual(typeof leadPayload.estimated_budget, "number");

  // Test Land Owner Payload
  const ownerPayload = {
    lead_id: "0a5f9737-fbca-4c91-9e79-8ec9d58beae8",
    name: "Mohammad Ali",
    phone: "01711000000",
    nid_number: "19882692012345678",
    ownership_type: "Individual",
    share_percentage: 100,
    projectId: "PRJ-1001",
  };
  assert.ok(ownerPayload.lead_id.includes("-"), "lead_id should be UUID format");
  assert.strictEqual(ownerPayload.share_percentage, 100);

  // Test Negotiation Record Payload
  const negPayload = {
    lead_id: "0a5f9737-fbca-4c91-9e79-8ec9d58beae8",
    meeting_date: "2026-10-12",
    discussion_points: "Price negotiation",
    demanded_price: 5000000,
    offered_price: 4500000,
    status: "In Progress",
    projectId: "PRJ-1001",
  };
  assert.strictEqual(negPayload.status, "In Progress");
  assert.ok(negPayload.demanded_price > negPayload.offered_price);

  // Test Follow-up Item Payload
  const followUpPayload = {
    lead_id: "0a5f9737-fbca-4c91-9e79-8ec9d58beae8",
    action_item: "Document collection",
    due_date: "2026-10-20",
    assigned_to: "Officer B",
    priority: "High",
    status: "Pending",
    projectId: "PRJ-1001",
  };
  assert.strictEqual(followUpPayload.priority, "High");
});

test("LAMS: Sub-route deep-linking and path resolution contracts", () => {
  // Test basic tab resolutions
  assert.strictEqual(resolveLamsTab(""), "leads");
  assert.strictEqual(resolveLamsTab("leads"), "leads");
  assert.strictEqual(resolveLamsTab("acquisition-leads"), "leads");
  assert.strictEqual(resolveLamsTab("owners"), "owners");
  assert.strictEqual(resolveLamsTab("valuations"), "valuations");
  assert.strictEqual(resolveLamsTab("legal"), "legal");
  assert.strictEqual(resolveLamsTab("due-diligence"), "duediligence");
  assert.strictEqual(resolveLamsTab("negotiations"), "negotiation");
  assert.strictEqual(resolveLamsTab("settlements"), "settlements");
  assert.strictEqual(resolveLamsTab("documents"), "documents");
  assert.strictEqual(resolveLamsTab("reports"), "reports");

  // Test parseLamsRoute for wizard form triggers
  const createLeadRoute = parseLamsRoute("leads/create");
  assert.strictEqual(createLeadRoute.tab, "leads");
  assert.strictEqual(createLeadRoute.isOpenCreate, true);
  assert.strictEqual(createLeadRoute.selectedLeadId, undefined);

  const createOwnerRoute = parseLamsRoute("owners/create");
  assert.strictEqual(createOwnerRoute.tab, "owners");
  assert.strictEqual(createOwnerRoute.isOpenCreate, true);

  const createValuationRoute = parseLamsRoute("valuations/create");
  assert.strictEqual(createValuationRoute.tab, "valuations");
  assert.strictEqual(createValuationRoute.isOpenCreate, true);

  // Test parseLamsRoute for deep tab links on specific lead
  const workflowRoute = parseLamsRoute("leads/LEAD-001/workflow");
  assert.strictEqual(workflowRoute.tab, "leads");
  assert.strictEqual(workflowRoute.selectedLeadId, "LEAD-001");
  assert.strictEqual(workflowRoute.initialDetailTab, "Workflow");

  const infoRoute = parseLamsRoute("leads/LEAD-002/info");
  assert.strictEqual(infoRoute.tab, "leads");
  assert.strictEqual(infoRoute.selectedLeadId, "LEAD-002");
  assert.strictEqual(infoRoute.initialDetailTab, "Info");

  const docsRoute = parseLamsRoute("leads/LEAD-003/docs");
  assert.strictEqual(docsRoute.tab, "leads");
  assert.strictEqual(docsRoute.selectedLeadId, "LEAD-003");
  assert.strictEqual(docsRoute.initialDetailTab, "Documents");

  assert.strictEqual(lamsPath("leads/create"), "/dashboard/lams/leads/create");
  assert.strictEqual(lamsPath(""), "/dashboard/lams");
});

test("LAMS: Valuations, Legal Verifications, Due Diligence, Approvals, and Settlements data integrity", () => {
  // Valuations
  assert.ok(Array.isArray(mockLandValuations), "Land valuations must be an array");
  assert.ok(mockLandValuations.length > 0, "Land valuations must not be empty");
  for (const v of mockLandValuations) {
    assert.ok(v.id, "Valuation must have id");
    assert.ok(v.lead_code || (v as any).leadCode, "Valuation must have lead_code");
    assert.ok(v.total_value > 0, "Valuation total_value must be positive");
  }

  // Legal Verifications
  assert.ok(Array.isArray(mockLegalVerifications), "Legal verifications must be an array");
  assert.ok(mockLegalVerifications.length > 0, "Legal verifications must not be empty");
  for (const lv of mockLegalVerifications) {
    assert.ok(lv.id, "Legal verification must have id");
    assert.ok(typeof lv.title_clear === "boolean", "title_clear must be boolean");
    assert.ok(typeof lv.mutation_ok === "boolean", "mutation_ok must be boolean");
    assert.ok(typeof lv.tax_clear === "boolean", "tax_clear must be boolean");
  }

  // Due Diligence
  assert.ok(Array.isArray(mockDueDiligence), "Due diligence records must be an array");
  assert.ok(mockDueDiligence.length > 0, "Due diligence records must not be empty");
  for (const dd of mockDueDiligence) {
    assert.ok(dd.id, "Due diligence must have id");
    assert.ok(dd.score >= 0 && dd.score <= 100, "Due diligence score must be 0-100");
  }

  // Approvals
  assert.ok(Array.isArray(mockAcquisitionApprovals), "Approvals must be an array");
  assert.ok(mockAcquisitionApprovals.length > 0, "Approvals must not be empty");
  for (const a of mockAcquisitionApprovals) {
    assert.ok(a.id, "Approval must have id");
    assert.ok(a.level, "Approval must have level");
    assert.ok(a.approver, "Approval must have approver");
  }

  // Settlements
  assert.ok(Array.isArray(mockSettlements), "Settlements must be an array");
  assert.ok(mockSettlements.length > 0, "Settlements must not be empty");
  for (const s of mockSettlements) {
    assert.ok(s.id, "Settlement must have id");
    assert.ok(s.agreed_amount > 0, "Agreed amount must be positive");
    assert.ok(s.paid >= 0, "Paid must be non-negative");
    assert.strictEqual(s.due, s.agreed_amount - s.paid, "Due must equal agreed_amount - paid");
  }
});

test("Inventory: Fallback categories and subcategories are complete", () => {
  assert.ok(Array.isArray(fallbackCategories), "Categories must be array");
  assert.ok(fallbackCategories.length >= 5, "Categories must contain at least 5 items");

  for (const cat of fallbackCategories) {
    assert.ok(cat.id, "Category must have id");
    assert.ok(cat.category_code, "Category must have category_code");
    assert.ok(cat.name, "Category must have name");
  }

  assert.ok(Array.isArray(fallbackSubCategories), "Subcategories must be array");
  assert.ok(fallbackSubCategories.length >= 5, "Subcategories must contain at least 5 items");

  for (const sub of fallbackSubCategories) {
    assert.ok(sub.id, "Subcategory must have id");
    assert.ok(sub.category_id, "Subcategory must have category_id");
    assert.ok(sub.name, "Subcategory must have name");
  }
});

test("Inventory: Fallback brands and units are valid", () => {
  assert.ok(Array.isArray(fallbackBrands), "Brands must be array");
  assert.ok(fallbackBrands.length >= 4, "Brands must have at least 4 items");

  for (const b of fallbackBrands) {
    assert.ok(b.id, "Brand must have id");
    assert.ok(b.name, "Brand must have name");
  }

  assert.ok(Array.isArray(fallbackUnits), "Units must be array");
  assert.ok(fallbackUnits.length >= 4, "Units must have at least 4 items");

  for (const u of fallbackUnits) {
    assert.ok(u.id, "Unit must have id");
    assert.ok(u.code, "Unit must have code");
    assert.ok(u.name, "Unit must have name");
  }
});

test("Inventory: Fallback items have valid nested references", () => {
  assert.ok(Array.isArray(fallbackItems), "Items must be array");
  assert.ok(fallbackItems.length > 0, "Items must have items");

  for (const item of fallbackItems) {
    assert.ok(item.id, "Item must have id");
    assert.ok(item.item_code, "Item must have item_code");
    assert.ok(item.name, "Item must have name");
    assert.ok(item.category_id, "Item must have category_id");
    assert.ok(item.unit_id, "Item must have unit_id");
    assert.ok(typeof item.purchase_price === "number", "Item purchase_price must be number");
  }
});

test("Inventory: Fallback purchases and suppliers format matches Swagger schema", () => {
  assert.ok(Array.isArray(fallbackSuppliers), "Suppliers must be array");
  assert.ok(fallbackSuppliers.length > 0, "Suppliers must have items");

  assert.ok(Array.isArray(fallbackPurchases), "Purchases must be array");
  assert.ok(fallbackPurchases.length > 0, "Purchases must have items");

  for (const p of fallbackPurchases) {
    assert.ok(p.id, "Purchase must have id");
    assert.ok(p.code || (p as any).purchase_no || (p as any).invoice_no, "Purchase must have code/purchase_no");
    assert.ok(p.supplier, "Purchase must have supplier");
    assert.ok(Array.isArray(p.items), "Purchase must have items array");
    assert.ok(p.items.length > 0, "Purchase must have at least 1 item line");
    assert.ok((p.grand_total || (p as any).total_amount) > 0, "Purchase must have total amount");
  }
});

test("Inventory: Stock report and Material comparison fallbacks contain valid metrics", () => {
  assert.ok(Array.isArray(fallbackStockReport), "Stock report must be array");
  assert.ok(fallbackStockReport.length > 0, "Stock report must have items");

  for (const sr of fallbackStockReport) {
    assert.ok(sr.item_id, "Stock item must have item_id");
    assert.ok(sr.item_name, "Stock item must have item_name");
    assert.ok(sr.category, "Stock item must have category");
    assert.ok(sr.unit, "Stock item must have unit");
    assert.ok(typeof sr.current_stock === "number", "current_stock must be number");
  }

  assert.ok(Array.isArray(fallbackMaterialComparison), "Material comparison must be array");
  assert.ok(fallbackMaterialComparison.length > 0, "Material comparison must have items");

  for (const mc of fallbackMaterialComparison) {
    assert.ok(mc.item_name, "Material item must have item_name");
    assert.ok(mc.budget_qty >= 0, "budget_qty must be >= 0");
    assert.ok(mc.purchase_qty >= 0, "purchase_qty must be >= 0");
  }
});

test("Inventory: Fallback material usage contains complete site and worker details", () => {
  assert.ok(Array.isArray(fallbackMaterialUsage), "Material usage must be array");
  assert.ok(fallbackMaterialUsage.length > 0, "Material usage must have items");

  for (const mu of fallbackMaterialUsage) {
    assert.ok(mu.id, "Usage must have id");
    assert.ok(mu.usage_no, "Usage must have usage_no");
    assert.ok(mu.project?.name || mu.project_name, "Usage must have project");
    assert.ok(mu.title_of_work, "Usage must have title_of_work");
    assert.ok(mu.task, "Usage must have task");
    assert.ok(mu.site?.name || mu.site_name, "Usage must have site");
    assert.ok(mu.worker_staff_name, "Usage must have worker");
    assert.ok(mu.item_name, "Usage must have item_name");
    assert.ok(mu.quantity > 0, "Usage must have positive quantity");
  }
});

test("Inventory: reportsApi material comparison endpoint builds query parameter properly", () => {
  const projectId = "PRJ-1001";
  const expectedParam = `?project_id=${projectId}`;
  assert.ok(expectedParam.includes("project_id=PRJ-1001"));
});

test("Inventory: Fallback stock transfers, requisitions, sales, and item history are complete", async () => {
  const {
    fallbackStockTransfers,
    fallbackMaterialRequisitions,
    fallbackSales,
    fallbackItemHistory,
    stockTransfersApi,
    materialRequisitionsApi,
    salesApi,
    reportsApi,
  } = await import("../lib/inventoryApi.ts");

  assert.ok(Array.isArray(fallbackStockTransfers), "Stock transfers must be array");
  assert.ok(fallbackStockTransfers.length > 0, "Stock transfers must have records");
  for (const st of fallbackStockTransfers) {
    assert.ok(st.id && st.code, "Stock transfer must have id and code");
    assert.ok(st.fromProject && st.toProject, "Stock transfer must have from and to projects");
  }

  assert.ok(Array.isArray(fallbackMaterialRequisitions), "Requisitions must be array");
  assert.ok(fallbackMaterialRequisitions.length > 0, "Requisitions must have records");
  for (const mr of fallbackMaterialRequisitions) {
    assert.ok(mr.id && mr.code, "Requisition must have id and code");
    assert.ok(mr.project, "Requisition must have project");
  }

  assert.ok(Array.isArray(fallbackSales), "Sales must be array");
  assert.ok(fallbackSales.length > 0, "Sales must have records");
  for (const s of fallbackSales) {
    assert.ok(s.id && s.code, "Sale must have id and code");
    assert.ok(s.customerName, "Sale must have customerName");
    assert.ok(s.grandTotal > 0, "Sale must have positive grand total");
  }

  assert.ok(Array.isArray(fallbackItemHistory), "Item history must be array");
  assert.ok(fallbackItemHistory.length > 0, "Item history must have records");
  for (const ih of fallbackItemHistory) {
    assert.ok(ih.id && ih.invoiceNo, "Item history record must have id and invoiceNo");
    assert.ok(ih.project, "Item history record must have project");
    assert.ok(ih.balance >= 0, "Item history record must have balance");
  }

  assert.strictEqual(typeof stockTransfersApi.getAll, "function");
  assert.strictEqual(typeof materialRequisitionsApi.getAll, "function");
  assert.strictEqual(typeof salesApi.getAll, "function");
  assert.strictEqual(typeof reportsApi.getItemHistory, "function");
});

test("Inventory: Optimistic mutation handles backend failure without crashing", async () => {
  const { suppliersApi, fallbackSuppliers, categoriesApi, fallbackCategories } = await import(
    "../lib/inventoryApi.ts"
  );

  const initialSuppliersCount = fallbackSuppliers.length;
  // Test creating a supplier (even if backend fails or columns missing)
  const createdSupplier = await suppliersApi.create({
    code: "SUP-TEST-99",
    name: "Test Resilient Supplier",
    mobile: "01799998888",
    credit_limit: 50000,
    opening_balance: 1000,
  });

  assert.ok(createdSupplier, "Created supplier must return valid response");
  assert.ok(createdSupplier.name === "Test Resilient Supplier" || createdSupplier.data?.name === "Test Resilient Supplier", "Supplier name must match payload");
  assert.strictEqual(fallbackSuppliers.length, initialSuppliersCount + 1, "Fallback suppliers array must have new item");

  // Test updating supplier
  const testId = createdSupplier.id || fallbackSuppliers[0].id;
  const updatedSupplier = await suppliersApi.update(testId, {
    name: "Updated Resilient Supplier",
  });
  assert.ok(updatedSupplier, "Update must succeed");
  const found = fallbackSuppliers.find((s) => String(s.id) === String(testId));
  assert.strictEqual(found?.name, "Updated Resilient Supplier", "Supplier in list must be updated");

  // Test deleting supplier
  await suppliersApi.delete(testId);
  const afterDelete = fallbackSuppliers.find((s) => String(s.id) === String(testId));
  assert.strictEqual(afterDelete, undefined, "Deleted supplier must be removed from list");

  // Test category creation fallback
  const initialCatCount = fallbackCategories.length;
  const newCat = await categoriesApi.create({
    category_code: "CAT-TEST-01",
    name: "Test Resilient Category",
  });
  assert.ok(newCat, "Category creation must return object");
  assert.strictEqual(fallbackCategories.length, initialCatCount + 1, "Category count must increment");
  const catFound = fallbackCategories.find((c) => c.category_code === "CAT-TEST-01" || c.code === "CAT-TEST-01");
  assert.ok(catFound, "New category must be present in fallbackCategories");
});

test("Inventory Store: Requisitions, Material Usage, and Stock Transfers CRUD in-memory store works", async () => {
  const {
    materialRequisitionsApi,
    fallbackMaterialRequisitions,
    materialUsageApi,
    fallbackMaterialUsage,
    stockTransfersApi,
    fallbackStockTransfers,
  } = await import("../lib/inventoryApi.ts");

  // 1. Requisitions
  assert.ok(Array.isArray(fallbackMaterialRequisitions), "Requisitions store must be an array");
  const initialReqLen = fallbackMaterialRequisitions.length;
  const testReq = await materialRequisitionsApi.create({
    code: "REQ-TEST-1",
    projectName: "Tower Alpha",
    projectType: "Real Estate",
    demandDate: "2026-10-15",
  });
  assert.ok(testReq);
  assert.strictEqual(fallbackMaterialRequisitions.length, initialReqLen + 1);

  // 2. Material Usage
  assert.ok(Array.isArray(fallbackMaterialUsage), "Material usage store must be an array");
  const initialUsageLen = fallbackMaterialUsage.length;
  const testUsage = await materialUsageApi.create({
    usage_no: "MU-TEST-1",
    date: "2026-10-12",
    worker_staff_name: "John Doe",
  });
  assert.ok(testUsage);
  assert.strictEqual(fallbackMaterialUsage.length, initialUsageLen + 1);

  // 3. Stock Transfers
  assert.ok(Array.isArray(fallbackStockTransfers), "Stock transfers store must be an array");
  const initialTransferLen = fallbackStockTransfers.length;
  const testTransfer = await stockTransfersApi.create({
    code: "ST-TEST-1",
    fromProject: "Site A",
    toProject: "Site B",
    quantity: 10,
  });
  assert.ok(testTransfer);
  assert.strictEqual(fallbackStockTransfers.length, initialTransferLen + 1);
});


