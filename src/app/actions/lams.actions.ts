"use server";

import { revalidatePath } from "next/cache";
import {
  mockAcquisitionLeads,
  mockLandOwners,
  mockNegotiationRecords,
  mockLegalDocuments,
  mockFollowUpItems,
  mockLandValuations,
  mockLegalVerifications,
  mockDueDiligences,
  mockAcquisitionApprovals,
  mockSettlements,
} from "@/data/lams/lams.mock";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5002/realbizpro/api/v1";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function safeDate(dateStr: string | undefined | null): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? new Date().toISOString().split("T")[0]
    : d.toISOString().split("T")[0];
}

// ----------------------------------------------------------------------
// Acquisition Leads (Feature 02.01 & 02.03)
// ----------------------------------------------------------------------
export async function getAcquisitionLeads() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/acquisition-leads`, {
      cache: "no-store",
      next: { tags: ["lams-acquisition-leads"] },
    });
    if (!res.ok) {
      return mockAcquisitionLeads;
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return mockAcquisitionLeads;
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item.id || item.uuid || `AL-${idx + 1}`);
      return {
        id: idStr,
        uuid: idStr,
        code: item.code || item.lead_code || "AL-" + idStr.substring(0, 6).toUpperCase(),
        leadCode: item.lead_code || item.code || "AL-" + idStr.substring(0, 6).toUpperCase(),
        title: item.lead_title || item.title || "Prospective Land Parcel",
        location: item.location || item.address || "Savar, Dhaka",
        address: item.address || item.location || "Savar, Dhaka",
        district: item.district || "Dhaka",
        upazila: item.upazila || "Savar",
        mouza: item.mouza || "Boliarpur",
        dagNo: item.dag_no || item.dagNo || "102",
        dag_no: item.dag_no || item.dagNo || "102",
        khatianNo: item.khatian_no || item.khatianNo || "RS-405",
        khatian_no: item.khatian_no || item.khatianNo || "RS-405",
        landArea: Number(item.land_area || item.area_katha || item.landArea || 10),
        area_katha: Number(item.area_katha || item.landArea || 10),
        area_sqft: Number(item.area_sqft || (item.area_katha ? item.area_katha * 720 : 7200)),
        landAreaUnit: item.land_area_unit || "Decimal",
        landType: item.land_type || item.landType || "Commercial",
        land_type: item.land_type || item.landType || "commercial",
        leadStage: item.lead_status || item.status || item.leadStage || "New",
        status: item.status || item.lead_status || item.leadStage || "New",
        leadSource: item.lead_source || item.source || item.leadSource || "Direct Owner",
        source: item.source || item.lead_source || "Direct Owner",
        leadStatus: item.lead_status || "Active",
        assignedUser: item.assigned_user || item.assignee || item.assignedUser || "Sakib Al Hasan",
        assignee: item.assignee || item.assigned_user || "Sakib Al Hasan",
        priority: item.priority || "Medium",
        expectedPrice: Number(item.expected_price || item.asking_price || item.expectedPrice || 25000000),
        asking_price: Number(item.asking_price || item.expected_price || 25000000),
        offeredPrice: Number(item.offered_price || item.offeredPrice || 22000000),
        ownerName: item.owner_name || item.ownerName || "Primary Landowner",
        owner_name: item.owner_name || item.ownerName || "Primary Landowner",
        ownerPhone: item.owner_phone || item.ownerPhone || "+880 1711-000000",
        owner_phone: item.owner_phone || item.ownerPhone || "+880 1711-000000",
        ownerAddress: item.owner_address || item.ownerAddress || "Dhaka",
        createdAt: item.lead_date || item.createdAt || new Date().toISOString().split("T")[0],
        notes: item.notes || item.remarks || "",
        remarks: item.remarks || item.notes || "",
        projectId: item.projectId || item.project_id,
        co_owners_json: item.co_owners_json || [],
        map_url: item.map_url || "",
      };
    });
  } catch (error) {
    return mockAcquisitionLeads;
  }
}

export async function createAcquisitionLead(data: any) {
  const payload = {
    code: data.code || `AL-2026-${Math.floor(100 + Math.random() * 900)}`,
    lead_title: data.title || data.location || "Prospective Parcel",
    location: data.location || "",
    area_katha: parseFloat(data.area_katha) || 0,
    area_sqft: parseFloat(data.area_sqft) || 0,
    source: data.source || "Direct Owner",
    owner_name: data.owner_name || data.ownerName || "",
    owner_phone: data.owner_phone || data.ownerPhone || "",
    asking_price: parseFloat(data.asking_price) || 0,
    notes: data.notes || "",
    owner_id: data.owner_id || "",
    assignee: data.assigned_to || data.assignee || "Sakib Al Hasan",
    priority: data.priority || "Medium",
    status: data.status || "Draft",
    lead_date: safeDate(data.createdAt || data.lead_date),
    land_type: data.land_type || data.landType || "commercial",
    land_area: parseFloat(data.area_katha || data.landArea) || 0,
    lead_status: data.status || "Draft",
    projectId: data.projectId,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/lams/acquisition-leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    return payload;
  }
}

export async function updateAcquisitionLead(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/acquisition-leads/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteAcquisitionLead(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/acquisition-leads/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteAcquisitionLead error:", err);
  }
}

// ----------------------------------------------------------------------
// Land Owners (Feature 02.02)
// ----------------------------------------------------------------------
export async function getLandOwners() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/land-owners`, {
      cache: "no-store",
      next: { tags: ["lams-land-owners"] },
    });
    if (!res.ok) {
      return mockLandOwners;
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return mockLandOwners;
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item.id || item.uuid || `LO-${idx + 1}`);
      return {
        id: idStr,
        uuid: idStr,
        code: item.code || "LW-" + idStr.substring(0, 6).toUpperCase(),
        acquisitionLeadId: item.lead_id || item.acquisitionLeadId || "",
        landPlot: item.land_plot || item.landPlot || "General Parcel",
        ownerName: item.name || item.ownerName || "Owner",
        name: item.name || item.ownerName || "Owner",
        isPrimary: item.owner_type === "Owner" || item.isPrimary === true,
        fatherName: item.father_name || item.fatherName || "-",
        father_name: item.father_name || item.fatherName || "-",
        nidNumber: item.nid || item.nidNumber || "",
        nid: item.nid || item.nidNumber || "",
        phone: item.phone || item.contact_number || "",
        email: item.email || "",
        address: item.address || "",
        bank_name: item.bank_name || "",
        bank_account: item.bank_account || "",
        status: (item.status || "Active") as "Active" | "Inactive",
        addedBy: item.added_by || item.addedBy || "Sakib Al Hasan",
        remarks: item.remarks || "",
        ownershipSharePercentage: Number(item.ownership_percentage || item.ownershipSharePercentage || 50),
        lands_count: Number(item.lands_count || item.lands || 1),
        nominee_json: item.nominee_json || [],
        projectId: item.projectId || item.project_id,
      };
    });
  } catch (error) {
    return mockLandOwners;
  }
}

export async function createLandOwner(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/land-owners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateLandOwner(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/land-owners/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteLandOwner(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/land-owners/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteLandOwner error:", err);
  }
}

// ----------------------------------------------------------------------
// Land Valuations (Feature 02.04)
// ----------------------------------------------------------------------
export async function getLandValuations() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/valuations`, {
      cache: "no-store",
      next: { tags: ["lams-valuations"] },
    });
    if (!res.ok) return mockLandValuations;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockLandValuations;
  } catch (error) {
    return mockLandValuations;
  }
}

export async function createLandValuation(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/valuations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateLandValuation(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/valuations/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteLandValuation(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/valuations/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteLandValuation error:", err);
  }
}

// ----------------------------------------------------------------------
// Legal Verification (Feature 02.05)
// ----------------------------------------------------------------------
export async function getLegalVerifications() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-verifications`, {
      cache: "no-store",
      next: { tags: ["lams-legal-verifications"] },
    });
    if (!res.ok) return mockLegalVerifications;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockLegalVerifications;
  } catch (error) {
    return mockLegalVerifications;
  }
}

export async function createLegalVerification(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-verifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateLegalVerification(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-verifications/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteLegalVerification(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/legal-verifications/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteLegalVerification error:", err);
  }
}

// ----------------------------------------------------------------------
// Due Diligence (Feature 02.06)
// ----------------------------------------------------------------------
export async function getDueDiligenceRecords() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligence`, {
      cache: "no-store",
      next: { tags: ["lams-due-diligence"] },
    });
    if (!res.ok) return mockDueDiligence;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockDueDiligence;
  } catch (error) {
    return mockDueDiligence;
  }
}

export async function createDueDiligence(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateDueDiligence(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligence/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteDueDiligence(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/due-diligence/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteDueDiligence error:", err);
  }
}

// ----------------------------------------------------------------------
// Negotiation Process (Feature 02.07)
// ----------------------------------------------------------------------
export async function getNegotiationProcesses() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/negotiation-processes`, {
      cache: "no-store",
      next: { tags: ["lams-negotiation-processes"] },
    });
    if (!res.ok) {
      return mockNegotiationRecords;
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return mockNegotiationRecords;
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item.id || item.uuid || `NEG-${idx + 1}`);
      return {
        id: idStr,
        uuid: idStr,
        acquisitionLeadId: item.lead_id || item.acquisitionLeadId || "",
        lead: item.lead_code || item.lead || "AL-2026-001",
        lead_code: item.lead_code || item.lead || "AL-2026-001",
        leadTitle: item.lead_title || item.leadTitle || "Land Parcel",
        mouza: item.mouza || "Kayetpara",
        dagNo: item.dag_no || item.dagNo || "1405",
        round_no: Number(item.round_no || idx + 1),
        offer_amount: Number(item.offer_amount || item.offered_price || item.offeredTotalPrice || 0),
        offeredTotalPrice: Number(item.offered_price || item.offeredTotalPrice || item.offer_amount || 0),
        offeredPricePerDecimal: Number(item.offered_price_per_decimal || item.offeredPricePerDecimal || 0),
        counter_amount: Number(item.counter_amount || item.agreed_price || item.counterOfferByOwner || 0),
        counterOfferByOwner: Number(item.counter_amount || item.agreed_price || item.counterOfferByOwner || 0),
        counterPricePerDecimal: Number(item.counter_price_per_decimal || item.counterPricePerDecimal || 0),
        final_amount: Number(item.final_amount || item.agreed_price || 0),
        negotiator: item.negotiator || item.attended_by || item.attendedBy || "Sakib Al Hasan",
        attendedBy: item.attended_by || item.attendedBy || item.negotiator || "Sakib Al Hasan",
        date: item.date || (item.negotiation_date ? safeDate(item.negotiation_date) : "2026-09-14"),
        meetingDate: item.negotiation_date
          ? new Date(item.negotiation_date).toLocaleString()
          : item.meetingDate || "",
        status: (item.status || (item.negotiation_status === "Agreed" ? "agreed" : item.negotiation_status === "Declined" ? "failed" : "ongoing")) as any,
        negotiationStatus: item.negotiation_status || item.negotiationStatus || "In Progress",
        notes: item.notes || item.remarks || item.meeting_notes || "",
        remarks: item.meeting_notes || item.remarks || item.notes || "",
        projectId: item.projectId || item.project_id,
      };
    });
  } catch (error) {
    return mockNegotiationRecords;
  }
}

export async function createNegotiationProcess(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/negotiation-processes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateNegotiationProcess(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/negotiation-processes/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteNegotiationProcess(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/negotiation-processes/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteNegotiationProcess error:", err);
  }
}

// ----------------------------------------------------------------------
// Acquisition Approvals (Feature 02.08 & 02.09)
// ----------------------------------------------------------------------
export async function getAcquisitionApprovals() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/approvals`, {
      cache: "no-store",
      next: { tags: ["lams-approvals"] },
    });
    if (!res.ok) return mockAcquisitionApprovals;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockAcquisitionApprovals;
  } catch (error) {
    return mockAcquisitionApprovals;
  }
}

export async function createAcquisitionApproval(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function actionApproval(uuid: string, decision: "approved" | "rejected", comment?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/approvals/${uuid}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment, decided_at: new Date().toISOString() }),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || { uuid, decision, comment };
  } catch (err) {
    return { uuid, decision, comment };
  }
}

// ----------------------------------------------------------------------
// Settlements (Feature 02.10)
// ----------------------------------------------------------------------
export async function getSettlements() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements`, {
      cache: "no-store",
      next: { tags: ["lams-settlements"] },
    });
    if (!res.ok) return mockSettlements;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockSettlements;
  } catch (error) {
    return mockSettlements;
  }
}

export async function createSettlement(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateSettlement(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function recordSettlementPayment(settlementId: string, paymentData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements/${settlementId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || paymentData;
  } catch (err) {
    return paymentData;
  }
}

export async function advanceLeadWorkflowStage(leadId: string, stage: string, remarks: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/acquisition-leads/${leadId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, remarks }),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || { leadId, stage, remarks };
  } catch (err) {
    return { leadId, stage, remarks };
  }
}

// ----------------------------------------------------------------------
// Legal Documents (Feature 02.11)
// ----------------------------------------------------------------------
export async function getLegalDocuments() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-documents`, {
      cache: "no-store",
      next: { tags: ["lams-legal-documents"] },
    });
    if (!res.ok) {
      return mockLegalDocuments;
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return mockLegalDocuments;
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item.id || item.uuid || `DOC-${idx + 1}`);
      return {
        id: idStr,
        uuid: idStr,
        acquisitionLeadId: item.lead_id || item.acquisitionLeadId || "",
        lead_code: item.lead_code || item.lead || "AL-2026-001",
        leadTitle: item.lead_title || item.leadTitle || "Land Parcel",
        category: item.category || item.document_type || "Deed",
        title: item.title || item.document_number || item.documentFileName || "Document",
        documentType: item.document_type || item.documentType || "Baya Deed",
        documentFileName: item.document_number || item.documentFileName || "deed_document.pdf",
        file: item.file || item.document_number || item.documentFileName || "document.pdf",
        size: item.size || item.file_size || item.fileSize || "2.4 MB",
        fileSize: item.file_size || item.fileSize || item.size || "2.4 MB",
        version: item.version || "1.0",
        uploaded_by: item.uploaded_by || item.verified_by || item.verifiedBy || "Sakib Al Hasan",
        uploaded_at: item.uploaded_at || (item.issue_date ? safeDate(item.issue_date) : "2026-08-20"),
        verificationStatus: item.verification_status || item.verificationStatus || "Pending",
        verifiedBy: item.verified_by || item.verifiedBy || "Legal Officer",
        verificationDate: item.issue_date
          ? new Date(item.issue_date).toLocaleDateString()
          : item.verificationDate || "",
        remarks: item.vetting_remarks || item.remarks || "",
        projectId: item.projectId || item.project_id,
      };
    });
  } catch (error) {
    return mockLegalDocuments;
  }
}

export async function createLegalDocument(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateLegalDocument(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-documents/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteLegalDocument(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/legal-documents/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteLegalDocument error:", err);
  }
}

// ----------------------------------------------------------------------
// Follow Ups (Feature 02.01 Follow up & meetings)
// ----------------------------------------------------------------------
export async function getFollowUps() {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/follow-ups`, {
      cache: "no-store",
      next: { tags: ["lams-follow-ups"] },
    });
    if (!res.ok) {
      return mockFollowUpItems;
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return mockFollowUpItems;
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item.id || item.uuid || `FLW-${idx + 1}`);
      return {
        id: idStr,
        uuid: idStr,
        sl: idx + 1,
        acquisitionLeadId: item.lead_id || item.acquisitionLeadId || "",
        date: item.follow_up_date
          ? new Date(item.follow_up_date).toLocaleDateString()
          : item.date || new Date().toLocaleDateString(),
        landDetails: item.land_details || item.landDetails || "Land Parcel",
        ownerDetails: item.owner_details || item.ownerDetails || "Land Owner",
        contact: item.contact || "+880 1711-000000",
        followUpType: item.follow_up_type || item.followUpType || "Call",
        status: (item.outcome === "Interested" || item.status === "Completed"
          ? "Completed"
          : "Pending") as any,
        note: item.remarks || item.note || "",
        assignedTo: item.assigned_to || item.assignedTo || "Sakib Al Hasan",
        projectId: item.projectId || item.project_id,
      };
    });
  } catch (error) {
    return mockFollowUpItems;
  }
}

export async function createFollowUp(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function updateFollowUp(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/follow-ups/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    return data;
  }
}

export async function deleteFollowUp(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/follow-ups/${uuid}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteFollowUp error:", err);
  }
}

// ----------------------------------------------------------------------
// Land Valuations
// ----------------------------------------------------------------------
export async function getValuations(leadId?: string) {
  try {
    const url = leadId
      ? `${API_BASE_URL}/lams/valuations?lead_id=${encodeURIComponent(leadId)}`
      : `${API_BASE_URL}/lams/valuations`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: ["lams-valuations"] },
    });
    if (!res.ok) return mockLandValuations;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockLandValuations;
  } catch (err) {
    console.warn("getValuations error, using mock:", err);
    return mockLandValuations;
  }
}

export async function createValuation(data: any) {
  const payload = {
    lead_id: data.lead_id || data.acquisitionLeadId,
    valuer_id: data.valuer_id || data.valuerName,
    market_rate: parseFloat(data.market_rate) || 0,
    govt_rate: parseFloat(data.govt_rate) || 0,
    total_value: parseFloat(data.total_value) || 0,
    method: data.method || "comparative",
    report_url: data.report_url,
    valued_at: safeDate(data.valued_at),
    status: data.status || "completed",
    notes: data.notes || "",
    org_id: data.org_id || data.projectId,
  };
  try {
    const res = await fetch(`${API_BASE_URL}/lams/valuations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    console.warn("createValuation error:", err);
    return payload;
  }
}

export async function updateValuation(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/valuations/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    console.warn("updateValuation error:", err);
    return data;
  }
}

export async function deleteValuation(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/valuations/${uuid}`, { method: "DELETE" });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteValuation error:", err);
  }
}

// ----------------------------------------------------------------------
// Legal Verifications
// ----------------------------------------------------------------------
export async function getLegalVerifications(leadId?: string) {
  try {
    const url = leadId
      ? `${API_BASE_URL}/lams/legal-verifications?lead_id=${encodeURIComponent(leadId)}`
      : `${API_BASE_URL}/lams/legal-verifications`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: ["lams-legal-verifications"] },
    });
    if (!res.ok) return mockLegalVerifications;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockLegalVerifications;
  } catch (err) {
    console.warn("getLegalVerifications error, using mock:", err);
    return mockLegalVerifications;
  }
}

export async function createLegalVerification(data: any) {
  const payload = {
    lead_id: data.lead_id || data.acquisitionLeadId,
    lawyer_name: data.lawyer_name,
    title_clear: Boolean(data.title_clear),
    mutation_ok: Boolean(data.mutation_ok),
    tax_clear: Boolean(data.tax_clear),
    status: data.status || "verified",
    verified_at: safeDate(data.verified_at),
    opinion: data.opinion,
    report_url: data.report_url,
    findings_json: data.findings_json,
    org_id: data.org_id || data.projectId,
  };
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-verifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    console.warn("createLegalVerification error:", err);
    return payload;
  }
}

export async function updateLegalVerification(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/legal-verifications/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    console.warn("updateLegalVerification error:", err);
    return data;
  }
}

export async function deleteLegalVerification(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/legal-verifications/${uuid}`, { method: "DELETE" });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteLegalVerification error:", err);
  }
}

// ----------------------------------------------------------------------
// Due Diligences
// ----------------------------------------------------------------------
export async function getDueDiligences(leadId?: string) {
  try {
    const url = leadId
      ? `${API_BASE_URL}/lams/due-diligences?lead_id=${encodeURIComponent(leadId)}`
      : `${API_BASE_URL}/lams/due-diligences`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: ["lams-due-diligences"] },
    });
    if (!res.ok) return mockDueDiligences;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockDueDiligences;
  } catch (err) {
    console.warn("getDueDiligences error, using mock:", err);
    return mockDueDiligences;
  }
}

export async function createDueDiligence(data: any) {
  const payload = {
    lead_id: data.lead_id || data.acquisitionLeadId,
    score: parseFloat(data.score) || 0,
    status: data.status || "approved",
    surveyor_name: data.surveyor_name,
    report_url: data.report_url,
    checklist_json: data.checklist_json,
    org_id: data.org_id || data.projectId,
  };
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    console.warn("createDueDiligence error:", err);
    return payload;
  }
}

export async function updateDueDiligence(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligences/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    console.warn("updateDueDiligence error:", err);
    return data;
  }
}

export async function deleteDueDiligence(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/due-diligences/${uuid}`, { method: "DELETE" });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteDueDiligence error:", err);
  }
}

// ----------------------------------------------------------------------
// Acquisition Approvals
// ----------------------------------------------------------------------
export async function getApprovals(leadId?: string) {
  try {
    const url = leadId
      ? `${API_BASE_URL}/lams/approvals?lead_id=${encodeURIComponent(leadId)}`
      : `${API_BASE_URL}/lams/approvals`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: ["lams-approvals"] },
    });
    if (!res.ok) return mockAcquisitionApprovals;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockAcquisitionApprovals;
  } catch (err) {
    console.warn("getApprovals error, using mock:", err);
    return mockAcquisitionApprovals;
  }
}

export async function createApproval(data: any) {
  const payload = {
    lead_id: data.lead_id || data.acquisitionLeadId,
    level: data.level || "level_1",
    approver_name: data.approver_name,
    decision: data.decision || "approved",
    comment: data.comment,
    decided_at: data.decided_at || new Date().toISOString(),
    stage: data.stage || "lead",
    org_id: data.org_id || data.projectId,
  };
  try {
    const res = await fetch(`${API_BASE_URL}/lams/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    console.warn("createApproval error:", err);
    return payload;
  }
}

export async function updateApproval(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/approvals/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    console.warn("updateApproval error:", err);
    return data;
  }
}

export async function deleteApproval(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/approvals/${uuid}`, { method: "DELETE" });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteApproval error:", err);
  }
}

// ----------------------------------------------------------------------
// Settlements
// ----------------------------------------------------------------------
export async function getSettlements(leadId?: string) {
  try {
    const url = leadId
      ? `${API_BASE_URL}/lams/settlements?lead_id=${encodeURIComponent(leadId)}`
      : `${API_BASE_URL}/lams/settlements`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: ["lams-settlements"] },
    });
    if (!res.ok) return mockSettlements;
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) && rawData.length > 0 ? rawData : mockSettlements;
  } catch (err) {
    console.warn("getSettlements error, using mock:", err);
    return mockSettlements;
  }
}

export async function createSettlement(data: any) {
  const payload = {
    lead_id: data.lead_id || data.acquisitionLeadId,
    owner_id: data.owner_id,
    agreed_amount: parseFloat(data.agreed_amount) || 0,
    advance_amount: parseFloat(data.advance_amount) || 0,
    paid_amount: parseFloat(data.paid_amount) || 0,
    due_amount: parseFloat(data.due_amount) || 0,
    payment_mode: data.payment_mode || "bank_transfer",
    scheduled_at: safeDate(data.scheduled_at),
    status: data.status || "pending",
    payment_schedule: data.payment_schedule,
    notes: data.notes,
    org_id: data.org_id || data.projectId,
  };
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || payload;
  } catch (err) {
    console.warn("createSettlement error:", err);
    return payload;
  }
}

export async function updateSettlement(uuid: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/settlements/${uuid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    return json?.data || json || data;
  } catch (err) {
    console.warn("updateSettlement error:", err);
    return data;
  }
}

export async function deleteSettlement(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/settlements/${uuid}`, { method: "DELETE" });
    revalidatePath("/dashboard/lams");
  } catch (err) {
    console.warn("deleteSettlement error:", err);
  }
}

