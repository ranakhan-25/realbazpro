"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function TaskTypePage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Configuration / Task Type"
      title="Task Types"
      description="Configure task type classifications for CRM activities."
      addLabel="Add Task Type"
      apiEndpoint="/crm/master/task-types"
      columns={[
        { key: "name", label: "Type Name" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
      ]}
      createFields={[
        { key: "name", label: "Type Name", type: "text", required: true, placeholder: "e.g. Site Visit" },
        { key: "code", label: "Code", type: "text", placeholder: "e.g. TT-VISIT" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Task type details..." },
      ]}
    />
  );
}
