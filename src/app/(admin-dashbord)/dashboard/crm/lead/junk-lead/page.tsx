"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square
} from "lucide-react";

interface JunkLeadRecord {
  id: string;
  leadId: string;
  name: string;
  address?: string;
  phone: string;
  status: string;
  officer: string;
  lastActivity?: string;
  note: string;
  category?: string;
}

const mockJunkData: JunkLeadRecord[] = [
  {
    id: "junk-1",
    leadId: "L261001-001",
    name: "adv moni",
    address: "",
    phone: "18194278604",
    status: "Inactive",
    officer: "Admin",
    lastActivity: "",
    note: "not interested",
    category: "Ready Flat",
  },
];

export default function JunkLeadPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Leads / Junk Leads"
      title="Junk & Inactive Leads"
      description="Review discarded, uncontactable, or low-intent client inquiries."
      apiEndpoint="/crm/leads/junk"
      restoreEndpoint="/crm/leads"
      transformData={(leads: any[]) =>
        leads
          .map((l) => ({
            id: l.uuid || l.id,
            code: l.lead_code || `#${l.id}`,
            name: l.client_name,
            phone: l.phone,
            reason: l.notes || "No reason provided",
            score: l.lead_score ?? 0,
            status: "Junk",
          }))
      }
    }
    return mockJunkData;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_junk_leads_data", JSON.stringify(junkLeads));
    }
  }, [junkLeads]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("1 October, 2026 - 31 October, 2026");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSelectAll = () => {
    if (selectedLeads.length === currentTableData.length && currentTableData.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentTableData.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((item) => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleRestoreLead = (item: JunkLeadRecord) => {
    setJunkLeads((prev) => prev.filter((l) => l.id !== item.id));
    setSelectedLeads((prev) => prev.filter((id) => id !== item.id));
    alert(`Lead "${item.name}" restored!`);
  };

  const handleRestoreSelected = () => {
    if (selectedLeads.length === 0) return;
    setJunkLeads((prev) => prev.filter((l) => !selectedLeads.includes(l.id)));
    setSelectedLeads([]);
    alert(`${selectedLeads.length} leads restored!`);
  };

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) return;
    setJunkLeads((prev) => prev.filter((l) => !selectedLeads.includes(l.id)));
    setSelectedLeads([]);
    alert(`${selectedLeads.length} leads deleted!`);
  };

  const handleDeleteSingle = (item: JunkLeadRecord) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      setJunkLeads((prev) => prev.filter((l) => l.id !== item.id));
      setSelectedLeads((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const filteredData = junkLeads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.phone.includes(search) ||
      item.leadId.toLowerCase().includes(search);

    const matchesCategory =
      !selectedCategory ||
      (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesUser =
      !selectedUser ||
      (item.officer && item.officer.toLowerCase() === selectedUser.toLowerCase());

    return matchesSearch && matchesCategory && matchesUser;
  });

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
        <span className="text-foreground font-extrabold">Junk Lead</span>
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
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">Lead Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select Category</option>
            <option value="Ready Flat">Ready Flat</option>
            <option value="On going">On going</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">Users</label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select Users</option>
            <option value="Admin">Admin</option>
            <option value="Mohin">Mohin</option>
            <option value="Tazmul Reza">Tazmul Reza</option>
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

      {/* JUNK LEADS TABLE */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-indigo-500 text-white font-extrabold uppercase text-[11px]">
                <th className="p-3 w-10 text-center">SL</th>
                
                <th className="p-3 min-w-[130px]">
                  <div className="flex items-center gap-2">
                    <button onClick={handleSelectAll} className="flex items-center gap-1.5 hover:opacity-90">
                      {selectedLeads.length === currentTableData.length && currentTableData.length > 0 ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} className="text-white/80" />
                      )}
                      <span>SELECT ALL</span>
                    </button>
                  </div>

                  {selectedLeads.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <button
                        onClick={handleDeleteSelected}
                        className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
                        title="Delete Selected"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={handleRestoreSelected}
                        className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-xs"
                        title="Restore Selected"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  )}
                </th>

                <th className="p-3 min-w-[180px]">NAME</th>
                <th className="p-3 min-w-[140px]">MOBILE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">OFFICER/USER</th>
                <th className="p-3 min-w-[150px]">LAST ACTIVITY</th>
                <th className="p-3 min-w-[150px]">NOTE</th>
                <th className="p-3 text-center min-w-[100px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border font-medium text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition">
                    <td className="p-3 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="p-3">
                      <button onClick={() => handleSelectOne(item.id)}>
                        {selectedLeads.includes(item.id) ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} className="text-muted-foreground/60" />
                        )}
                      </button>
                    </td>

                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-foreground">
                        Name-<span className="text-indigo-600">{item.name}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Address-<span>{item.address || ""}</span>
                      </div>
                    </td>

                    <td className="p-3 font-mono font-semibold">+880{item.phone}</td>
                    <td className="p-3 font-semibold text-muted-foreground">{item.status}</td>
                    <td className="p-3 font-semibold text-muted-foreground">{item.officer}</td>
                    <td className="p-3 font-medium text-muted-foreground whitespace-pre-line">{item.lastActivity || "—"}</td>
                    <td className="p-3 font-medium text-muted-foreground">{item.note || "—"}</td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={`tel:+880${item.phone}`}
                          className="p-1.5 rounded bg-indigo-500 hover:bg-indigo-600 text-white transition active:scale-95 shadow-xs"
                          title="Call Direct"
                        >
                          <Phone size={13} />
                        </a>

                        <button
                          onClick={() => handleDeleteSingle(item)}
                          className="p-1.5 rounded bg-rose-500 hover:bg-rose-600 text-white transition active:scale-95 shadow-xs"
                          title="Delete Permanently"
                        >
                          <Trash2 size={13} />
                        </button>

                        <button
                          onClick={() => handleRestoreLead(item)}
                          className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition active:scale-95 shadow-xs"
                          title="Restore Lead"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                    No junk leads found.
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