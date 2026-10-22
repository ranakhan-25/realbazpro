"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function JunkLeadPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Leads / Junk Leads"
      title="Junk & Inactive Leads"
      description="Review discarded, uncontactable, or low-intent client inquiries."
      apiEndpoint="/crm/leads/junk"
      restoreEndpoint="/crm/leads"
      transformData={(leads: any[]) =>
        leads
          .map((l) => ({
            id: l.uuid || l.id,
            code: l.lead_code || `#${l.id}`,
            name: l.client_name,
            phone: l.phone,
            reason: l.notes || "No reason provided",
            score: l.lead_score ?? 0,
            status: "Junk",
          }))
      }
      columns={[
        { key: "code", label: "Lead Code" },
        { key: "name", label: "Client Name" },
        { key: "phone", label: "Phone" },
        { key: "reason", label: "Reason / Notes" },
        { key: "score", label: "Score" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
