"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function VisitPlacesPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Configuration / Visit Places"
      title="Visit Places"
      description="Manage locations where site visits and client meetings take place."
      addLabel="Add Visit Place"
      apiEndpoint="/crm/master/visit-places"
      columns={[
        { key: "name", label: "Place Name" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
      ]}
      createFields={[
        { key: "name", label: "Place Name", type: "text", required: true, placeholder: "e.g. Purbachal Project Site" },
        { key: "code", label: "Code", type: "text", placeholder: "e.g. VP-PUR" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Location details..." },
      ]}
    />
  );
}
