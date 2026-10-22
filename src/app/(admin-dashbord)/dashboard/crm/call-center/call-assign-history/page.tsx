"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallAssignHistoryPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Assign History"
      title="Call Assignment History"
      description="Calls assigned to CRM representatives and their current status."
      apiEndpoint="/crm/leads/call-assignments"
      transformData={(assignments: any[]) => assignments.map((assignment) => ({
        id: assignment.uuid || assignment.id,
        lead: assignment.lead?.client_name || `Lead #${assignment.lead_id}`,
        assignedFrom: assignment.assigned_from,
        assignedTo: assignment.assigned_to,
        assignedOn: assignment.assignment_date ? String(assignment.assignment_date).slice(0, 10) : "—",
        due: assignment.due_date ? String(assignment.due_date).slice(0, 10) : "—",
        status: assignment.status,
      }))}
      columns={[
        { key: "lead", label: "Lead" },
        { key: "assignedFrom", label: "Assigned From" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "assignedOn", label: "Assigned On" },
        { key: "due", label: "Due Date" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
