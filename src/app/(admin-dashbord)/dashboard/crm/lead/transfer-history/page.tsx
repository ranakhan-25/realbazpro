"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";


export default function TransferHistoryPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Leads / Transfer History"
      title="Lead Handover & Transfer History"
      description="Audit trail of leads transferred between sales representatives and closers."
      apiEndpoint="/crm/leads/transfers"
      transformData={(transfers: any[]) =>
        transfers.map((transfer) => ({
          id: transfer.uuid || transfer.id,
          code: transfer.lead?.lead_code || `#${transfer.lead_id}`,
          client: transfer.lead?.client_name || "Lead",
          from: transfer.transferred_from,
          to: transfer.transferred_to,
          reason: transfer.transfer_reason || "—",
          date: transfer.transfer_date ? String(transfer.transfer_date).slice(0, 10) : "—",
        }))
      }
      columns={[
        { key: "code", label: "Lead Code" },
        { key: "client", label: "Client" },
        { key: "from", label: "Transferred From" },
        { key: "to", label: "Transferred To" },
        { key: "reason", label: "Transfer Reason" },
        { key: "date", label: "Date" },
      ]}
    />
  );
}
