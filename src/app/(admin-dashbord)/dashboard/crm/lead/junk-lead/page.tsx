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
        leads.map((lead) => ({
          id: lead.uuid || lead.id,
          code: lead.lead_code || `#${lead.id}`,
          name: lead.client_name,
          phone: lead.phone,
          reason: lead.notes || "No reason provided",
          score: lead.lead_score ?? 0,
          status: "Junk",
        }))
      }
      columns={[
        { key: "code", label: "Lead Code" },
        { key: "name", label: "Client Name" },
        { key: "phone", label: "Phone" },
        { key: "reason", label: "Reason" },
        { key: "score", label: "Lead Score" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
