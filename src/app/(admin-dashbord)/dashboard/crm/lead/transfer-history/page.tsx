"use client";

import React, { useState, useEffect } from "react";
import { Phone } from "lucide-react";

interface TransferLeadRecord {
  id: string;
  leadCode: string;
  name: string;
  mobile: string;
  from: string;
  to: string;
  date: string;
  lastActivity?: string;
}

const mockTransferLeads: TransferLeadRecord[] = [
  { id: "1", leadCode: "L261008-117", name: "Gazi Nasir", mobile: "1711921550", from: "Admin", to: "Rowza", date: "14-10-2026", lastActivity: "" },
  { id: "2", leadCode: "L261008-116", name: "Mostakim", mobile: "1722519606", from: "Admin", to: "Rowza", date: "14-10-2026", lastActivity: "" },
  { id: "3", leadCode: "L261008-115", name: "Md Habibur Rahman", mobile: "1797474790", from: "Admin", to: "Rowza", date: "14-10-2026", lastActivity: "" },
  { id: "4", leadCode: "L261008-114", name: "Md Shakil", mobile: "1715326093", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "5", leadCode: "L261008-113", name: "Md Anwar Hossain", mobile: "1812154559", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "6", leadCode: "L261008-112", name: "Sulaiman Ahmed", mobile: "1727795533", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "7", leadCode: "L261008-111", name: "Poly", mobile: "1777194879", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "8", leadCode: "L261008-110", name: "S Mahmud Intl", mobile: "1685809115", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "9", leadCode: "L261008-109", name: "Md Badrul", mobile: "1913470936", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "10", leadCode: "L261008-108", name: "Ahraf Peal", mobile: "1980862327", from: "Admin", to: "Sarna11", date: "14-10-2026", lastActivity: "" },
  { id: "11", leadCode: "L261008-107", name: "Tanvir Ahmed", mobile: "1812345678", from: "Mohin", to: "Rowza", date: "13-10-2026", lastActivity: "" },
  { id: "12", leadCode: "L261008-106", name: "Kamrul Islam", mobile: "1712345679", from: "Mohin", to: "Sarna11", date: "13-10-2026", lastActivity: "" },
];

export default function TransferLeadListPage() {
  const [transferLeads, setTransferLeads] = useState<TransferLeadRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_transfer_leads_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return mockTransferLeads;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_transfer_leads_data", JSON.stringify(transferLeads));
    }
  }, [transferLeads]);

  // Filter States
  const [selectedDateRange, setSelectedDateRange] = useState("September 23, 2026 - October 22, 2026");
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredData = transferLeads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.mobile.includes(search) ||
      item.leadCode.toLowerCase().includes(search);

    const matchesFrom = !selectedFrom || item.from.toLowerCase() === selectedFrom.toLowerCase();
    const matchesTo = !selectedTo || item.to.toLowerCase() === selectedTo.toLowerCase();

    return matchesSearch && matchesFrom && matchesTo;
  });

  // Pagination Calculations
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


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