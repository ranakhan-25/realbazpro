"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function VisitStatusPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Configuration / Visit Status"
      title="Visit Statuses"
      description="Define statuses for site visit tracking and outcomes."
      addLabel="Add Visit Status"
      apiEndpoint="/crm/master/visit-statuses"
      columns={[
        { key: "name", label: "Status Name" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
        { key: "status", label: "Active" },
      ]}
      createFields={[
        { key: "name", label: "Status Name", type: "text", required: true, placeholder: "e.g. Completed" },
        { key: "code", label: "Code", type: "text", placeholder: "e.g. VS-COMP" },
        { key: "description", label: "Description", type: "textarea", placeholder: "What this status means..." },
      ]}
    />
  );
}
