import test from "node:test";
import assert from "node:assert/strict";

import {
  mockBookings,
  mockPaymentSchedules,
  mockCustomerDues,
  mockCollectionEntries,
  mockWaivers,
  mockAdjustments,
  mockOutstandingReceivables,
  mockAgingAnalysis,
  mockOverdueCollections,
  mockRecoveryActions,
  mockFollowUps,
  mockFieldVisits,
  mockOfficerMetrics,
  mockCollectionKPIs,
} from "../data/collection/collection.mock.ts";

import {
  getCollectionPermissionPath,
  collectionPath,
} from "../lib/collectionRoutes.ts";

test("Credit Collection: mock datasets are valid and non-empty", () => {
  assert.ok(Array.isArray(mockBookings), "Bookings must be an array");
  assert.ok(mockBookings.length > 0, "Bookings must have data");

  for (const b of mockBookings) {
    assert.ok(b.id, "Booking must have an id");
    assert.ok(b.code, "Booking must have a code");
    assert.ok(b.total_agreed > 0, "Total agreed must be positive");
    assert.ok(b.balance >= 0, "Balance must be non-negative");
  }

  assert.ok(Array.isArray(mockPaymentSchedules), "Payment schedules must be an array");
  for (const s of mockPaymentSchedules) {
    assert.ok(s.id, "Schedule must have an id");
    assert.ok(s.installment_no > 0, "Installment no must be positive");
    assert.ok(s.amount >= s.paid, "Total installment amount >= paid amount");
    assert.equal(s.balance, s.amount - s.paid, "Balance must match amount - paid");
  }

  assert.ok(Array.isArray(mockCustomerDues), "Customer dues must be an array");
  for (const d of mockCustomerDues) {
    assert.ok(d.due_amount > 0, "Due amount must be positive");
    assert.ok(["0-30", "31-60", "61-90", "90+"].includes(d.aging_bucket), "Aging bucket must be valid");
  }

  assert.ok(Array.isArray(mockCollectionEntries), "Collection entries must be an array");
  for (const e of mockCollectionEntries) {
    assert.ok(e.receipt_no.startsWith("REC-"), "Receipt no must start with REC-");
    assert.ok(e.amount > 0, "Amount must be positive");
    assert.ok(e.collected_at, "Must have collection timestamp");
  }

  assert.ok(Array.isArray(mockWaivers), "Waivers must be an array");
  assert.ok(Array.isArray(mockAdjustments), "Adjustments must be an array");
  assert.ok(Array.isArray(mockOutstandingReceivables), "Receivables must be an array");
  assert.ok(Array.isArray(mockAgingAnalysis), "Aging analysis must be an array");
  assert.ok(Array.isArray(mockOverdueCollections), "Overdue collections must be an array");
  assert.ok(Array.isArray(mockRecoveryActions), "Recovery actions must be an array");
  assert.ok(Array.isArray(mockFollowUps), "Followups must be an array");
  assert.ok(Array.isArray(mockFieldVisits), "Field visits must be an array");
  assert.ok(Array.isArray(mockOfficerMetrics), "Officer metrics must be an array");
});

test("Credit Collection: aging matrix total due equals sum of all buckets", () => {
  for (const row of mockAgingAnalysis) {
    const computedTotal =
      row.bucket_0_30 + row.bucket_31_60 + row.bucket_61_90 + row.bucket_90_plus;
    assert.equal(
      row.total_due,
      computedTotal,
      `Total due for ${row.booking_code} must match sum of bucket amounts`
    );
  }
});

test("Credit Collection: route helpers resolve expected dashboard paths and permissions", () => {
  assert.equal(collectionPath(), "/dashboard/collection");
  assert.equal(collectionPath("schedule"), "/dashboard/collection/schedule");
  assert.equal(collectionPath("due"), "/dashboard/collection/due");
  assert.equal(collectionPath("entries"), "/dashboard/collection/entries");
  assert.equal(collectionPath("waivers"), "/dashboard/collection/waivers");

  assert.equal(getCollectionPermissionPath("schedule"), "agreements");
  assert.equal(getCollectionPermissionPath("due"), "overdue-list");
  assert.equal(getCollectionPermissionPath("entries"), "receipt-voucher");
  assert.equal(getCollectionPermissionPath("recovery"), "recovery");
  assert.equal(getCollectionPermissionPath("perf"), "dashboard");
});

test("Credit Collection: executive summary KPIs reflect positive totals", () => {
  assert.ok(mockCollectionKPIs.todayCollection > 0, "Today collection > 0");
  assert.ok(mockCollectionKPIs.mtdCollection >= mockCollectionKPIs.todayCollection, "MTD >= today");
  assert.ok(mockCollectionKPIs.totalOverduePool > 0, "Total overdue pool > 0");
  assert.ok(mockCollectionKPIs.collectionRate > 0 && mockCollectionKPIs.collectionRate <= 100, "Collection rate is %");
});
