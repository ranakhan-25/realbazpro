"use client";

import { Metadata } from "next";
import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";


export default function FollowUpPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Follow Up"
      title="Follow Up"
      description="Scheduled and completed follow-up calls."
      apiEndpoint="/crm/reports/follow-ups"
      columns={[
        { key: "leadId", label: "Lead ID" },
        { key: "name", label: "Lead" },
        { key: "followUpDate", label: "Follow-up Date" },
        { key: "summary", label: "Activity" },
        { key: "type", label: "Type" },
      ]}
      transformData={(items: any[]) =>
        items.map((item: any) => ({
          id: item.uuid || item.id,
          leadId: item.lead?.lead_code || `#${item.lead_id}`,
          name: item.lead?.client_name || "Lead",
          followUpDate: item.next_followup_date ? String(item.next_followup_date).slice(0, 10) : "—",
          summary: item.summary,
          type: item.activity_type,
        }))
      }
    />
  );
}
