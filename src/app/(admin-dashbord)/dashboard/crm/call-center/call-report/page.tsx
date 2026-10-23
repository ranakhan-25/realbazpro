"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallReportPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Report"
      title="Call Activity Report"
      description="Calls logged against CRM leads."
      apiEndpoint="/crm/reports/activities?type=call"
      transformData={(activities: any[]) => activities.map((activity) => ({
        id: activity.uuid || activity.id,
        date: activity.activity_date ? String(activity.activity_date).slice(0, 10) : "—",
        lead: activity.lead?.client_name || `Lead #${activity.lead_id}`,
        phone: activity.lead?.phone || "—",
        summary: activity.summary,
        feedback: activity.feedback || "—",
      }))}
      columns={[
        { key: "date", label: "Date" },
        { key: "lead", label: "Lead" },
        { key: "phone", label: "Phone" },
        { key: "summary", label: "Call Summary" },
        { key: "feedback", label: "Feedback" },
      ]}
    />
  );
}
