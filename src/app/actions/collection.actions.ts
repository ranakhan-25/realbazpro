"use server";

import { revalidatePath } from "next/cache";
import {
  CollectionEntry,
  WaiverItem,
  AdjustmentItem,
  RecoveryActionItem,
  FollowUpItem,
  FieldVisitItem,
} from "@/types/collection";

export async function createCollectionEntry(data: Partial<CollectionEntry>) {
  try {
    const entry: CollectionEntry = {
      id: `col-${Date.now()}`,
      receipt_no: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      booking_id: data.booking_id || "b-101",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      party_name: data.party_name || "Valued Client",
      installment_id: data.installment_id,
      installment_label: data.installment_label || "Installment Payment",
      amount: Number(data.amount || 0),
      mode: data.mode || "bank",
      txn_ref: data.txn_ref || `TXN-${Date.now()}`,
      collected_by: data.collected_by || "Recovery Officer",
      collected_at: data.collected_at || new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: data.notes || "",
      journal_entry_no: `JV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create collection entry" };
  }
}

export async function createWaiver(data: Partial<WaiverItem>) {
  try {
    const waiver: WaiverItem = {
      id: `wav-${Date.now()}`,
      booking_id: data.booking_id || "",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      party_name: data.party_name || "Valued Client",
      amount: Number(data.amount || 0),
      reason: data.reason || "",
      approver_id: data.approver_id || "usr-admin-1",
      approved_by: data.approved_by || "Pending Approval",
      status: "pending",
      created_at: new Date().toISOString().split("T")[0],
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: waiver };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit waiver" };
  }
}

export async function createAdjustment(data: Partial<AdjustmentItem>) {
  try {
    const adj: AdjustmentItem = {
      id: `adj-${Date.now()}`,
      booking_id: data.booking_id || "",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      type: data.type || "credit_note",
      amount: Number(data.amount || 0),
      reason: data.reason || "",
      reference: data.reference || `REF-ADJ-${Date.now()}`,
      created_at: new Date().toISOString().split("T")[0],
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: adj };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to apply adjustment" };
  }
}

export async function createRecoveryAction(data: Partial<RecoveryActionItem>) {
  try {
    const action: RecoveryActionItem = {
      id: `rec-${Date.now()}`,
      booking_id: data.booking_id || "",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      party_name: data.party_name || "Valued Client",
      action_type: data.action_type || "call",
      note: data.note || "",
      next_action_at: data.next_action_at || new Date().toISOString().replace("T", " ").substring(0, 16),
      priority: data.priority || "medium",
      status: "pending",
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: action };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log recovery action" };
  }
}

export async function createFollowUp(data: Partial<FollowUpItem>) {
  try {
    const flw: FollowUpItem = {
      id: `flw-${Date.now()}`,
      booking_id: data.booking_id || "",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      officer: data.officer || "Recovery Officer",
      note: data.note || "",
      next_at: data.next_at || new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "pending",
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: flw };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log follow-up" };
  }
}

export async function createFieldVisit(data: Partial<FieldVisitItem>) {
  try {
    const visit: FieldVisitItem = {
      id: `vis-${Date.now()}`,
      booking_id: data.booking_id || "",
      booking_code: data.booking_code || "BK-DHK-2026-001",
      party_name: data.party_name || "Valued Client",
      officer_id: data.officer_id || "off-1",
      officer: data.officer || "Field Officer",
      visited_at: data.visited_at || new Date().toISOString().replace("T", " ").substring(0, 16),
      outcome: data.outcome || "promise",
      geo_coordinates: data.geo_coordinates || "23.7808° N, 90.4225° E",
      photos: data.photos || "",
      note: data.note || "",
    };

    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return { success: true, data: visit };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log field visit" };
  }
}

export async function assignOfficerToBookings(bookingIds: string[], officerId: string, officerName: string, targetAmount: number, dueDate: string) {
  try {
    revalidatePath("/dashboard/collection");
    revalidatePath("/collection");
    return {
      success: true,
      message: `Assigned ${bookingIds.length} bookings to ${officerName} with target BDT ${targetAmount.toLocaleString()}.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to assign officer" };
  }
}
