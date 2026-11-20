"use server";

import { revalidatePath } from "next/cache";

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
      return [];
    }
    const json = await res.json();
    const rawData = json?.data ?? json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    return rawData.map((item: any) => {
      const idStr = String(item?.id ?? item?.uuid ?? "");
      return {
        id: idStr,
        uuid: idStr,
        code: item?.code ?? item?.lead_code ?? "",
        leadCode: item?.lead_code ?? item?.code ?? "",
        title: item?.lead_title ?? item?.title ?? "",
        location: item?.location ?? item?.address ?? "",
        address: item?.address ?? item?.location ?? "",
        district: item?.district ?? "",
        upazila: item?.upazila ?? "",
        mouza: item?.mouza ?? "",
        dagNo: item?.dag_no ?? item?.dagNo ?? "",
        dag_no: item?.dag_no ?? item?.dagNo ?? "",
        khatianNo: item?.khatian_no ?? item?.khatianNo ?? "",
        khatian_no: item?.khatian_no ?? item?.khatianNo ?? "",
        landArea: Number(item?.land_area ?? item?.area_katha ?? item?.landArea ?? 0),
        area_katha: Number(item?.area_katha ?? item?.landArea ?? 0),
        area_sqft: Number(item?.area_sqft ?? 0),
        landAreaUnit: item?.land_area_unit ?? "",
        landType: item?.land_type ?? item?.landType ?? "",
        land_type: item?.land_type ?? item?.landType ?? "",
        leadStage: item?.lead_status ?? item?.status ?? item?.leadStage ?? "",
        status: item?.status ?? item?.lead_status ?? item?.leadStage ?? "",
        leadSource: item?.lead_source ?? item?.source ?? item?.leadSource ?? "",
        source: item?.source ?? item?.lead_source ?? "",
        leadStatus: item?.lead_status ?? "",
        assignedUser: item?.assigned_user ?? item?.assignee ?? item?.assignedUser ?? "",
        assignee: item?.assignee ?? item?.assigned_user ?? "",
        priority: item?.priority ?? "",
        expectedPrice: Number(item?.expected_price ?? item?.asking_price ?? item?.expectedPrice ?? 0),
        asking_price: Number(item?.asking_price ?? item?.expected_price ?? 0),
        offeredPrice: Number(item?.offered_price ?? item?.offeredPrice ?? 0),
        ownerName: item?.owner_name ?? item?.ownerName ?? "",
        owner_name: item?.owner_name ?? item?.ownerName ?? "",
        ownerPhone: item?.owner_phone ?? item?.ownerPhone ?? "",
        owner_phone: item?.owner_phone ?? item?.ownerPhone ?? "",
        ownerAddress: item?.owner_address ?? item?.ownerAddress ?? "",
        createdAt: item?.lead_date ?? item?.createdAt ?? "",
        notes: item?.notes ?? item?.remarks ?? "",
        remarks: item?.remarks ?? item?.notes ?? "",
        projectId: item?.projectId ?? item?.project_id,
        co_owners_json: item?.co_owners_json ?? [],
        map_url: item?.map_url ?? "",
      };
    });
  } catch (error) {
    return [];
  }
}

export async function createAcquisitionLead(data: any) {
  const payload = {
    code: data.code || undefined,
    lead_title: data.title || data.location || "",
    location: data.location || "",
    area_katha: parseFloat(data.area_katha) || 0,
    area_sqft: parseFloat(data.area_sqft) || 0,
    source: data.source || "",
    owner_name: data.owner_name || data.ownerName || "",
    owner_phone: data.owner_phone || data.ownerPhone || "",
    asking_price: parseFloat(data.asking_price) || 0,
    notes: data.notes || "",
    owner_id: data.owner_id || "",
    assignee: data.assigned_to || data.assignee || "",
    priority: data.priority || "",
    status: data.status || "Draft",
    lead_date: safeDate(data.createdAt || data.lead_date),
    land_type: data.land_type || data.landType || "",
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
      return [];
    }
    const json = await res.json();
    const rawData = json?.data ?? json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    return rawData.map((item: any) => {
      const idStr = String(item?.id ?? item?.uuid ?? "");
      return {
        id: idStr,
        uuid: idStr,
        code: item?.code ?? "",
        acquisitionLeadId: item?.lead_id ?? item?.acquisitionLeadId ?? "",
        landPlot: item?.land_plot ?? item?.landPlot ?? "",
        ownerName: item?.name ?? item?.ownerName ?? "",
        name: item?.name ?? item?.ownerName ?? "",
        isPrimary: item?.owner_type === "Owner" || item?.isPrimary === true,
        fatherName: item?.father_name ?? item?.fatherName ?? "",
        father_name: item?.father_name ?? item?.fatherName ?? "",
        nidNumber: item?.nid ?? item?.nidNumber ?? "",
        nid: item?.nid ?? item?.nidNumber ?? "",
        phone: item?.phone ?? item?.contact_number ?? "",
        email: item?.email ?? "",
        address: item?.address ?? "",
        bank_name: item?.bank_name ?? "",
        bank_account: item?.bank_account ?? "",
        status: item?.status ?? "",
        addedBy: item?.added_by ?? item?.addedBy ?? "",
        remarks: item?.remarks ?? "",
        ownershipSharePercentage: Number(item?.ownership_percentage ?? item?.ownershipSharePercentage ?? 0),
        lands_count: Number(item?.lands_count ?? item?.lands ?? 0),
        nominee_json: item?.nominee_json ?? [],
        projectId: item?.projectId ?? item?.project_id,
      };
    });
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) return [];
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) return [];
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    const res = await fetch(`${API_BASE_URL}/lams/due-diligences`, {
      cache: "no-store",
      next: { tags: ["lams-due-diligences"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    return [];
  }
}

export async function createDueDiligence(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/lams/due-diligences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    revalidatePath("/dashboard/lams");
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
  }
}

export async function deleteDueDiligence(uuid: string) {
  try {
    await fetch(`${API_BASE_URL}/lams/due-diligences/${uuid}`, {
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
      return [];
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    return rawData.map((item: any) => {
      const idStr = String(item?.id ?? item?.uuid ?? "");
      return {
        id: idStr,
        uuid: idStr,
        acquisitionLeadId: item?.lead_id ?? item?.acquisitionLeadId,
        lead: item?.lead_code ?? item?.lead,
        lead_code: item?.lead_code ?? item?.lead,
        leadTitle: item?.lead_title ?? item?.leadTitle,
        mouza: item?.mouza,
        dagNo: item?.dag_no ?? item?.dagNo,
        round_no: item?.round_no == null ? undefined : Number(item.round_no),
        offer_amount: item?.offer_amount ?? item?.offered_price ?? item?.offeredTotalPrice,
        offeredTotalPrice: item?.offered_price ?? item?.offeredTotalPrice ?? item?.offer_amount,
        offeredPricePerDecimal: item?.offered_price_per_decimal ?? item?.offeredPricePerDecimal,
        counter_amount: item?.counter_amount ?? item?.agreed_price ?? item?.counterOfferByOwner,
        counterOfferByOwner: item?.counter_amount ?? item?.agreed_price ?? item?.counterOfferByOwner,
        counterPricePerDecimal: item?.counter_price_per_decimal ?? item?.counterPricePerDecimal,
        final_amount: item?.final_amount ?? item?.agreed_price,
        negotiator: item?.negotiator ?? item?.attended_by ?? item?.attendedBy ?? "",
        attendedBy: item?.attended_by ?? item?.attendedBy ?? item?.negotiator ?? "",
        date: item?.date ?? (item?.negotiation_date ? safeDate(item.negotiation_date) : undefined),
        meetingDate: item?.negotiation_date
          ? new Date(item.negotiation_date).toLocaleString()
          : item?.meetingDate,
        status: item?.status ?? (item?.negotiation_status === "Agreed" ? "agreed" : item?.negotiation_status === "Declined" ? "failed" : undefined),
        negotiationStatus: item?.negotiation_status ?? item?.negotiationStatus,
        notes: item?.notes ?? item?.remarks ?? item?.meeting_notes,
        remarks: item?.meeting_notes ?? item?.remarks ?? item?.notes,
        projectId: item?.projectId ?? item?.project_id,
      };
    });
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) return [];
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) return [];
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
      return [];
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    return rawData.map((item: any) => {
      const idStr = String(item?.id ?? item?.uuid ?? "");
      return {
        id: idStr,
        uuid: idStr,
        acquisitionLeadId: item?.lead_id ?? item?.acquisitionLeadId,
        lead_code: item?.lead_code ?? item?.lead,
        leadTitle: item?.lead_title ?? item?.leadTitle,
        category: item?.category ?? item?.document_type,
        title: item?.title ?? item?.document_number ?? item?.documentFileName,
        documentType: item?.document_type ?? item?.documentType,
        documentFileName: item?.document_number ?? item?.documentFileName,
        file: item?.file ?? item?.document_number ?? item?.documentFileName,
        size: item?.size ?? item?.file_size ?? item?.fileSize,
        fileSize: item?.file_size ?? item?.fileSize ?? item?.size,
        version: item?.version,
        uploaded_by: item?.uploaded_by ?? item?.verified_by ?? item?.verifiedBy ?? "",
        uploaded_at: item?.uploaded_at ?? (item?.issue_date ? safeDate(item.issue_date) : undefined),
        verificationStatus: item?.verification_status ?? item?.verificationStatus,
        verifiedBy: item?.verified_by ?? item?.verifiedBy,
        verificationDate: item?.issue_date
          ? new Date(item.issue_date).toLocaleDateString()
          : item?.verificationDate,
        remarks: item?.vetting_remarks ?? item?.remarks,
        projectId: item?.projectId ?? item?.project_id,
      };
    });
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
      return [];
    }
    const json = await res.json();
    const rawData = json.data !== undefined ? json.data : json;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    return rawData.map((item: any, idx: number) => {
      const idStr = String(item?.id ?? item?.uuid ?? "");
      return {
        id: idStr,
        uuid: idStr,
        sl: item?.sl ?? idx + 1,
        acquisitionLeadId: item?.lead_id ?? item?.acquisitionLeadId ?? "",
        date: item?.follow_up_date
          ? new Date(item.follow_up_date).toLocaleDateString()
          : item?.date,
        landDetails: item?.land_details ?? item?.landDetails ?? "",
        ownerDetails: item?.owner_details ?? item?.ownerDetails ?? "",
        contact: item?.contact ?? "",
        followUpType: item?.follow_up_type ?? item?.followUpType,
        status: item?.status ?? (item?.outcome
          ? item.outcome === "Interested" ? "Completed" : "Pending"
          : undefined),
        note: item.remarks || item.note || "",
        assignedTo: item?.assigned_to ?? item?.assignedTo ?? "",
        projectId: item.projectId || item.project_id,
      };
    });
  } catch (error) {
    return [];
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
    if (!res.ok) throw new Error(json?.message || `LAMS request failed (${res.status})`);
    return json?.data ?? json ?? null;
  } catch (err) {
    throw err;
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
