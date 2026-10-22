"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  UserCheck,
  MessageSquare,
  Phone
} from "lucide-react";

interface Party {
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  nid?: string;
  address?: string;
  type: "customer" | "investor" | "vendor" | "other";
  tags: string[];
  assignee?: string;
  created_at: string;
}

const mockParties: Party[] = [
  {
    uuid: "party-101",
    name: "Engr. Kabir Hossain",
    phone: "1711998877",
    email: "kabir@example.com",
    nid: "1990269123456",
    address: "House 45, Road 12, Dhanmondi, Dhaka",
    type: "customer",
    tags: ["VIP Client", "Ready Buyer"],
    assignee: "Shamim Khan",
    created_at: "2026-10-15",
  },
  {
    uuid: "party-102",
    name: "Apex Properties Ltd",
    phone: "1899112233",
    email: "info@apexprop.com",
    nid: "8877665544",
    address: "Gulshan Avenue, Dhaka",
    type: "investor",
    tags: ["High Net Worth", "Commercial"],
    assignee: "Tanvir Ahmed",
    created_at: "2026-10-18",
  },
];

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters State
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Control
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Selected Active Party
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Party Form State (Create & Edit)
  const [partyFormData, setPartyFormData] = useState({
    uuid: "",
    name: "",
    phone: "",
    email: "",
    nid: "",
    address: "",
    type: "customer" as Party["type"],
    tagsInput: "",
  });

  // Assign Form State
  const [assigneeData, setAssigneeData] = useState({
    assignee: "Shamim Khan",
    note: "",
  });

  // Communication Form State
  const [commFormData, setCommFormData] = useState({
    channel: "call",
    direction: "out",
    content: "",
    attachmentName: "",
    at: new Date().toISOString().slice(0, 16),
  });

  // Pagination States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Load LocalStorage Data
  useEffect(() => {
    const saved = localStorage.getItem("crm_parties_data");
    if (saved) {
      try {
        setParties(JSON.parse(saved));
      } catch (e) {
        setParties(mockParties);
      }
    } else {
      setParties(mockParties);
      localStorage.setItem("crm_parties_data", JSON.stringify(mockParties));
    }
    setIsLoaded(true);
  }, []);

  const saveParties = (data: Party[]) => {
    setParties(data);
    localStorage.setItem("crm_parties_data", JSON.stringify(data));
  };

  // 2. Open Party Modal (Create or Edit)
  const handleOpenPartyModal = (party?: Party) => {
    if (party) {
      setPartyFormData({
        uuid: party.uuid,
        name: party.name,
        phone: party.phone,
        email: party.email || "",
        nid: party.nid || "",
        address: party.address || "",
        type: party.type,
        tagsInput: party.tags.join(", "),
      });
    } else {
      setPartyFormData({
        uuid: "",
        name: "",
        phone: "",
        email: "",
        nid: "",
        address: "",
        type: "customer",
        tagsInput: "",
      });
    }
    setShowPartyModal(true);
  };

  // Submit Party Form
  const handlePartyFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyFormData.name || !partyFormData.phone) return;

    const tagsArr = partyFormData.tagsInput
      ? partyFormData.tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (partyFormData.uuid) {
      const updated = parties.map((p) =>
        p.uuid === partyFormData.uuid
          ? {
              ...p,
              name: partyFormData.name,
              phone: partyFormData.phone,
              email: partyFormData.email,
              nid: partyFormData.nid,
              address: partyFormData.address,
              type: partyFormData.type,
              tags: tagsArr,
            }
          : p
      );
      saveParties(updated);
    } else {
      const newParty: Party = {
        uuid: `party-${Date.now()}`,
        name: partyFormData.name,
        phone: partyFormData.phone,
        email: partyFormData.email,
        nid: partyFormData.nid,
        address: partyFormData.address,
        type: partyFormData.type,
        tags: tagsArr,
        assignee: "Shamim Khan",
        created_at: new Date().toISOString().slice(0, 10),
      };
      saveParties([newParty, ...parties]);
    }

    setShowPartyModal(false);
  };

  // 3. Delete Party
  const handleDeleteParty = (uuid: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = parties.filter((p) => p.uuid !== uuid);
      saveParties(updated);
    }
  };

  // 4. Submit Assignment Form
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    const updated = parties.map((p) =>
      p.uuid === selectedParty.uuid ? { ...p, assignee: assigneeData.assignee } : p
    );
    saveParties(updated);
    setShowAssignModal(false);
    alert(`Party assigned to ${assigneeData.assignee}`);
  };

  // 5. Submit Communication Form
  const handleCommSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !commFormData.content) return;

    alert(`Communication log recorded for ${selectedParty.name} via ${commFormData.channel.toUpperCase()}`);
    setShowCommModal(false);
    setCommFormData({
      channel: "call",
      direction: "out",
      content: "",
      attachmentName: "",
      at: new Date().toISOString().slice(0, 16),
    });
  };

  // Filter Parties
  const filteredParties = parties.filter((p) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.phone.includes(search) ||
      (p.email && p.email.toLowerCase().includes(search));

    const matchesType = typeFilter === "all" || p.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Pagination Calculations
  const totalEntries = filteredParties.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredParties.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!isLoaded) {
    return <div className="p-8 text-center font-bold text-muted-foreground">Loading Parties Directory...</div>;
  }

  return (
    <div className="w-full space-y-5 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground text-xs font-sans">
      
      {/* BREADCRUMB HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <a href="/dashboard" className="hover:text-indigo-600 transition">Home</a>
          <span>›</span>
          <a href="#" className="hover:text-indigo-600 transition">CRM</a>
          <span>›</span>
          <span className="text-foreground font-extrabold">Parties Directory</span>
        </div>

        <button
          onClick={() => handleOpenPartyModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus size={15} /> Add New Party
        </button>
      </div>

      {/* TOP FILTERS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="block font-bold text-muted-foreground mb-1 text-[11px]">Filter by Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2.5 border rounded-lg bg-background border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 capitalize"
          >
            <option value="all">All Party Types</option>
            <option value="customer">Customer</option>
            <option value="investor">Investor</option>
            <option value="vendor">Vendor</option>
            <option value="other">Other</option>
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
            placeholder="Search name, phone, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-60 p-1.5 border rounded-md bg-background border-border font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                <th className="p-3 min-w-[200px]">NAME & ASSIGNEE</th>
                <th className="p-3 min-w-[130px]">MOBILE</th>
                <th className="p-3 min-w-[160px]">EMAIL</th>
                <th className="p-3 min-w-[110px]">TYPE</th>
                <th className="p-3 min-w-[110px]">CREATED AT</th>
                <th className="p-3 text-center min-w-[140px]">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border font-medium text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((party, index) => (
                  <tr key={party.uuid} className="hover:bg-muted/20 transition">
                    <td className="p-3 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-foreground text-sm">{party.name}</div>
                      {party.assignee && (
                        <div className="text-[11px] text-muted-foreground font-semibold">
                          Assigned: {party.assignee}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-semibold text-foreground">+880{party.phone}</td>
                    <td className="p-3 text-muted-foreground font-mono">{party.email || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        party.type === 'customer' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        party.type === 'investor' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                        party.type === 'vendor' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/20'
                      }`}>
                        {party.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{party.created_at}</td>

                    {/* ACTION BUTTONS */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedParty(party); setShowViewModal(true); }}
                          className="p-1.5 rounded bg-muted hover:bg-indigo-600 hover:text-white transition shadow-xs"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          onClick={() => handleOpenPartyModal(party)}
                          className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs"
                          title="Edit Party"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          onClick={() => { setSelectedParty(party); setAssigneeData({ assignee: party.assignee || "Shamim Khan", note: "" }); setShowAssignModal(true); }}
                          className="p-1.5 rounded bg-purple-500 hover:bg-purple-600 text-white transition shadow-xs"
                          title="Assign Party"
                        >
                          <UserCheck size={13} />
                        </button>

                        <button
                          onClick={() => { setSelectedParty(party); setShowCommModal(true); }}
                          className="p-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white transition shadow-xs"
                          title="Log Communication"
                        >
                          <MessageSquare size={13} />
                        </button>

                        <button
                          onClick={() => handleDeleteParty(party.uuid, party.name)}
                          className="p-1.5 rounded bg-rose-500 hover:bg-rose-600 text-white transition shadow-xs"
                          title="Delete Party"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold">
                    No parties match the filter criteria.
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

      {/* 1. PARTY FORM MODAL (Create & Edit) */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">
                {partyFormData.uuid ? "Edit Party Profile" : "Create New Party Profile"}
              </h3>
              <button onClick={() => setShowPartyModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handlePartyFormSubmit} className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Engr. Kabir Hossain"
                    value={partyFormData.name}
                    onChange={(e) => setPartyFormData({ ...partyFormData, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="1711XXXXXX"
                    value={partyFormData.phone}
                    onChange={(e) => setPartyFormData({ ...partyFormData, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={partyFormData.email}
                    onChange={(e) => setPartyFormData({ ...partyFormData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">NID Number</label>
                  <input
                    type="text"
                    placeholder="National ID"
                    value={partyFormData.nid}
                    onChange={(e) => setPartyFormData({ ...partyFormData, nid: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Party Type *</label>
                <select
                  value={partyFormData.type}
                  onChange={(e) => setPartyFormData({ ...partyFormData, type: e.target.value as Party["type"] })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold capitalize"
                >
                  <option value="customer">Customer</option>
                  <option value="investor">Investor</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Address</label>
                <textarea
                  rows={2}
                  placeholder="Full physical address..."
                  value={partyFormData.address}
                  onChange={(e) => setPartyFormData({ ...partyFormData, address: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="VIP Client, Commercial"
                  value={partyFormData.tagsInput}
                  onChange={(e) => setPartyFormData({ ...partyFormData, tagsInput: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowPartyModal(false)} className="px-5 py-2 rounded-xl bg-muted font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ASSIGNMENT MODAL */}
      {showAssignModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Assign Party ({selectedParty.name})</h3>
              <button onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">Assignee *</label>
                <select
                  value={assigneeData.assignee}
                  onChange={(e) => setAssigneeData({ ...assigneeData, assignee: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                >
                  <option value="Shamim Khan">Shamim Khan (SE)</option>
                  <option value="Tanvir Ahmed">Tanvir Ahmed (CRM)</option>
                  <option value="Rafiqul Islam">Rafiqul Islam (Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Note</label>
                <textarea
                  rows={2}
                  placeholder="Assignment notes..."
                  value={assigneeData.note}
                  onChange={(e) => setAssigneeData({ ...assigneeData, note: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2 rounded-xl bg-muted font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. COMMUNICATION FORM MODAL */}
      {showCommModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Log Communication - {selectedParty.name}</h3>
              <button onClick={() => setShowCommModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCommSubmit} className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Channel *</label>
                  <select
                    value={commFormData.channel}
                    onChange={(e) => setCommFormData({ ...commFormData, channel: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold capitalize"
                  >
                    <option value="call">Call</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Direction *</label>
                  <select
                    value={commFormData.direction}
                    onChange={(e) => setCommFormData({ ...commFormData, direction: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                  >
                    <option value="in">Inbound (Received)</option>
                    <option value="out">Outbound (Sent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={commFormData.at}
                  onChange={(e) => setCommFormData({ ...commFormData, at: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Content / Summary *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Details of discussion..."
                  value={commFormData.content}
                  onChange={(e) => setCommFormData({ ...commFormData, content: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowCommModal(false)} className="px-5 py-2 rounded-xl bg-muted font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VIEW PARTY PROFILE MODAL */}
      {showViewModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">{selectedParty.name}</h3>
              <button onClick={() => setShowViewModal(false)}><X size={18} /></button>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono font-bold text-foreground">+880{selectedParty.phone}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono font-bold text-foreground">{selectedParty.email || "N/A"}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">NID:</span>
                <span className="font-mono font-bold text-foreground">{selectedParty.nid || "N/A"}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Type:</span>
                <span className="uppercase font-bold text-indigo-600">{selectedParty.type}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 space-y-1">
                <span className="text-muted-foreground block">Address:</span>
                <span className="text-foreground">{selectedParty.address || "No address provided"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 space-y-1">
                <span className="text-muted-foreground block">Tags:</span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedParty.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-md text-[10px] font-black uppercase border border-indigo-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}