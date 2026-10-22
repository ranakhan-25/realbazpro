import { Metadata } from "next";
import CrmLeadDirectory from "@/components/crm/crm-lead-directory";

export const metadata: Metadata = {
  title: "Lead Directory - CRM",
  description: "Manage and track all CRM leads",
};

export default function LeadListPage() {
  return <CrmLeadDirectory />;
}
