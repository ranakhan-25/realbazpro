"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function InternalTaskPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Configuration / Internal Tasks"
      title="Internal Tasks"
      description="Manage internal CRM task assignments and team workflows."
      addLabel="Create Internal Task"
      apiEndpoint="/crm/tasks"
      transformData={(tasks: any[]) =>
        tasks.map((t) => ({
          id: t.uuid || t.id,
          title: t.title,
          priority: (t.priority || "medium").toUpperCase(),
          dueDate: t.due_date ? String(t.due_date).slice(0, 10) : "—",
          status: (t.status || "pending").replace(/_/g, " ").toUpperCase(),
          assignedTo: t.assigned_to || "Unassigned",
        }))
      }
      columns={[
        { key: "title", label: "Task Title" },
        { key: "priority", label: "Priority" },
        { key: "dueDate", label: "Due Date" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
      ]}
      createFields={[
        { key: "title", label: "Task Title", type: "text", required: true, placeholder: "e.g. Prepare sales report" },
        { key: "due_date", label: "Due Date", type: "date", required: true },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          defaultValue: "medium",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" },
          ],
        },
        { key: "assigned_to", label: "Assign To", type: "text", placeholder: "Employee name" },
        { key: "description", label: "Instructions", type: "textarea", placeholder: "Task details..." },
      ]}
    />
  );
}
