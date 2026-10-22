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

  return (
    <div className="w-full space-y-5 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground text-xs font-sans">
      
      {/* BREADCRUMB HEADER */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <a href="/dashboard" className="hover:text-indigo-600 transition">Home</a>
        <span>›</span>
        <a href="#" className="hover:text-indigo-600 transition">Call Center</a>
        <span>›</span>
        <span className="text-foreground font-extrabold">Transfer Lead List</span>
      </div>

      {/* TOP FILTERS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div>
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">Select Date</label>
          <input
            type="text"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">From</label>
          <select
            value={selectedFrom}
            onChange={(e) => {
              setSelectedFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select One Option</option>
            <option value="Admin">Admin</option>
            <option value="Mohin">Mohin</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">To</label>
          <select
            value={selectedTo}
            onChange={(e) => {
              setSelectedTo(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select One Option</option>
            <option value="Rowza">Rowza</option>
            <option value="Sarna11">Sarna11</option>
          </select>
        </div>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-1.5 border rounded-md bg-background border-border font-bold text-foreground outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-muted-foreground">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48 p-1.5 border rounded-md bg-background border-border font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-indigo-500 text-white font-extrabold uppercase text-[11px]">
                <th className="p-3 w-12 text-center">SL</th>
                <th className="p-3 min-w-[120px]">ID</th>
                <th className="p-3 min-w-[180px]">NAME</th>
                <th className="p-3 min-w-[130px]">MOBILE</th>
                <th className="p-3 min-w-[110px]">FROM</th>
                <th className="p-3 min-w-[110px]">TO</th>
                <th className="p-3 min-w-[120px]">DATE</th>
                <th className="p-3 min-w-[150px]">LAST ACTIVITY</th>
                <th className="p-3 text-center min-w-[90px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border font-medium text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition">
                    <td className="p-3 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-3 font-mono font-semibold text-foreground">{item.leadCode}</td>
                    <td className="p-3 font-semibold text-foreground">{item.name}</td>
                    <td className="p-3 font-mono font-semibold text-foreground">+880{item.mobile}</td>
                    <td className="p-3 font-semibold text-muted-foreground">{item.from}</td>
                    <td className="p-3 font-semibold text-muted-foreground">{item.to}</td>
                    <td className="p-3 font-mono font-semibold text-muted-foreground">{item.date}</td>
                    <td className="p-3 font-medium text-muted-foreground">{item.lastActivity || "—"}</td>
                    
                    {/* CALL ACTION BUTTON */}
                    <td className="p-3 text-center">
                      <a
                        href={`tel:+880${item.mobile}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition active:scale-95 shadow-xs"
                        title="Call Direct"
                      >
                        <Phone size={13} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                    No transfer leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-3 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <div>
            Showing {totalEntries > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 font-bold transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "bg-background border border-border hover:bg-muted text-foreground"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 font-bold transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}