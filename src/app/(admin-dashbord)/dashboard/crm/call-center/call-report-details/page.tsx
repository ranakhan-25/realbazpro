"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallReportDetailsPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Details"
      title="Call Activity Details"
      description="Detailed call records and their scheduled follow-ups."
      apiEndpoint="/crm/reports/activities?type=call"
      transformData={(activities: any[]) => activities.map((activity) => ({
        id: activity.uuid || activity.id,
        lead: activity.lead?.client_name || `Lead #${activity.lead_id}`,
        phone: activity.lead?.phone || "—",
        summary: activity.summary,
        notes: activity.discussion_points || activity.feedback || "—",
        nextFollowup: activity.next_followup_date ? String(activity.next_followup_date).slice(0, 16).replace("T", " ") : "—",
      }))}
      columns={[
        { key: "lead", label: "Lead" },
        { key: "phone", label: "Phone" },
        { key: "summary", label: "Call Summary" },
        { key: "notes", label: "Notes" },
        { key: "nextFollowup", label: "Next Follow-up" },
      ]}
    />
  );
}
