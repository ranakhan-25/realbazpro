import test from "node:test";
import assert from "node:assert/strict";
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
  fallbackStockTransfers,
  fallbackMaterialRequisitions,
  fallbackSales,
  fallbackItemHistory,
  categoriesApi,
} from "../lib/inventoryApi.ts";
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
import { resolveLamsTab, parseLamsRoute, lamsPath } from "../lib/lamsRoutes.ts";

test("CR/LAMS/Inventory fallback collections contain no sample records", () => {
  const collections = [
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
    fallbackStockTransfers,
    fallbackMaterialRequisitions,
    fallbackSales,
    fallbackItemHistory,
  ];

  for (const collection of collections) {
    assert.deepEqual(collection, []);
  }
});

test("Inventory API returns backend records and surfaces failed requests", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [{ id: 7, name: "Backend category" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    assert.deepEqual(await categoriesApi.getAll(), [
      { id: 7, name: "Backend category" },
    ]);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "Unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(categoriesApi.getAll(), /Unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("LAMS sub-route deep links resolve to the expected tabs", () => {
  assert.equal(resolveLamsTab(""), "leads");
  assert.equal(resolveLamsTab("owners"), "owners");
  assert.equal(resolveLamsTab("valuations"), "valuations");
  assert.equal(resolveLamsTab("negotiations"), "negotiation");
  assert.equal(resolveLamsTab("settlements"), "settlements");

  assert.deepEqual(parseLamsRoute("leads/create"), {
    tab: "leads",
    isOpenCreate: true,
    selectedLeadId: undefined,
    initialDetailTab: undefined,
  });
  assert.equal(parseLamsRoute("leads/LEAD-003/docs").initialDetailTab, "Documents");
  assert.equal(lamsPath(""), "/dashboard/lams");
});
