"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function RequirementTypePage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Configuration / Requirement Type"
      title="Requirement Types"
      description="Define property requirement categories for buyer preferences."
      addLabel="Add Requirement Type"
      apiEndpoint="/crm/master/requirement-types"
      columns={[
        { key: "name", label: "Type Name" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
      ]}
      createFields={[
        { key: "name", label: "Type Name", type: "text", required: true, placeholder: "e.g. Residential Plot" },
        { key: "code", label: "Code", type: "text", placeholder: "e.g. REQ-RES" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Describe the requirement type..." },
      ]}
    />
  );
}
