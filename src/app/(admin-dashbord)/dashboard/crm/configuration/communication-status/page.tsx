"use client";

import React, { useState } from "react";
import { Sparkles, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle } from "lucide-react";

interface StatusRecord {
  id: string;
  name: string;
  status?: string;
  description: string;
  leadStage: string;
  isDefault: boolean;
  addBy: string;
}

const initialStatuses: StatusRecord[] = [
  { id: "1", name: "Did Not Pick / NR", status: "Active", description: "", leadStage: "High Prospect", isDefault: false, addBy: "Admin" },
  { id: "2", name: "Document Follow-up", status: "Active", description: "", leadStage: "Follow Up", isDefault: false, addBy: "" },
  { id: "3", name: "Token Hold", status: "Active", description: "", leadStage: "Token", isDefault: true, addBy: "" },
  { id: "4", name: "Hold For later", status: "Active", description: "", leadStage: "Prospect", isDefault: false, addBy: "Admin" },
  { id: "5", name: "EMI Hold", status: "Active", description: "", leadStage: "EMI", isDefault: false, addBy: "Admin" },
  { id: "6", name: "Junk-Not interested now", status: "Active", description: "", leadStage: "Not Interested", isDefault: false, addBy: "Admin" },
  { id: "7", name: "Handover Scheduled", status: "Active", description: "", leadStage: "Visited", isDefault: false, addBy: "" },
  { id: "8", name: "Registration Date / Document Follow-up", status: "Active", description: "", leadStage: "Follow Up", isDefault: false, addBy: "" },
  { id: "9", name: "Registration Preparation", status: "Active", description: "", leadStage: "Booking", isDefault: false, addBy: "Admin" },
  { id: "10", name: "Booking Confirmed", status: "Active", description: "", leadStage: "Booking", isDefault: false, addBy: "Admin" },
];

export default function CommunicationStatusPage() {
  const [statuses, setStatuses] = useState<StatusRecord[]>(initialStatuses);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StatusRecord | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    status: "Active",
    description: "",
    isDefault: false,
    leadStage: "",
  });

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStatusToDelete, setSelectedStatusToDelete] = useState<StatusRecord | null>(null);

  // Filter Logic
  const filteredData = statuses.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    return (
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.leadStage.toLowerCase().includes(search) ||
      item.addBy.toLowerCase().includes(search)
    );
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

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: "",
      status: "Active",
      description: "",
      isDefault: false,
      leadStage: "",
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: StatusRecord) => {
    setEditingRecord(item);
    setFormData({
      name: item.name,
      status: item.status || "Active",
      description: item.description || "",
      isDefault: item.isDefault || false,
      leadStage: item.leadStage || "",
    });
    setIsModalOpen(true);
  };

  // Submit Handler for Add / Edit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please enter a name!");
      return;
    }

    if (editingRecord) {
      // Edit existing status
      setStatuses(
        statuses.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                name: formData.name,
                status: formData.status,
                description: formData.description,
                isDefault: formData.isDefault,
                leadStage: formData.leadStage,
              }
            : item
        )
      );
    } else {
      // Add new status
      const newRecord: StatusRecord = {
        id: `${Date.now()}`,
        name: formData.name,
        status: formData.status,
        description: formData.description,
        leadStage: formData.leadStage,
        isDefault: formData.isDefault,
        addBy: "Admin",
      };
      setStatuses([newRecord, ...statuses]);
    }

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: StatusRecord) => {
    setSelectedStatusToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (selectedStatusToDelete) {
      setStatuses(statuses.filter((item) => item.id !== selectedStatusToDelete.id));
      setIsDeleteModalOpen(false);
      setSelectedStatusToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans">
      
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} className="animate-pulse" /> Leads Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
            Communication Status
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>Communication Status Add</span>
        </button>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground w-full sm:w-auto">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="py-5 px-4 w-16 text-center">SL</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[200px]">DESCRIPTION</th>
                <th className="py-5 px-4 min-w-[150px]">LEAD STAGE</th>
                <th className="py-5 px-4 min-w-[140px]">IS DEFAULT</th>
                <th className="py-5 px-4 min-w-[120px]">ADD BY</th>
                <th className="py-5 px-4 text-center min-w-[120px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.description || "—"}</td>
                    <td className="py-4 px-4">
                      {item.leadStage && (
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase border bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                          {item.leadStage}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {item.isDefault ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          Default Status
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-muted-foreground">{item.addBy || "—"}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition cursor-pointer shadow-xs"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer shadow-xs"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No communication status found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER & PAGINATION */}
        <div className="p-4 md:p-5 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-black">{totalEntries > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
            <span className="text-foreground font-black">{Math.min(indexOfLastItem, totalEntries)}</span> of{" "}
            <span className="text-foreground font-black">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-background border border-border/80 hover:bg-slate-100 text-foreground"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* COMMUNICATION STATUS ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {editingRecord ? "Communication Status Edit" : "Communication Status Add"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-extrabold outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Description</label>
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  Is Default Communication Status
                </label>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">
                  Lead Stage(if Communication Status wise changes)
                </label>
                <select
                  value={formData.leadStage}
                  onChange={(e) => setFormData({ ...formData, leadStage: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-extrabold outline-none cursor-pointer"
                >
                  <option value="">Select Stage</option>
                  <option value="New Assignment">New Assignment</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Query Lead">Query Lead</option>
                  <option value="Interested">Interested</option>
                  <option value="Visited">Visited</option>
                  <option value="New Opportunity">New Opportunity</option>
                  <option value="Prospect">Prospect</option>
                  <option value="High Prospect">High Prospect</option>
                  <option value="Priority Prospect">Priority Prospect</option>
                  <option value="Potential">Potential</option>
                  <option value="Token">Token</option>
                  <option value="EMI">EMI</option>
                  <option value="Booking">Booking</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold cursor-pointer transition text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition text-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
              Are you sure?
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              You are about to delete <span className="font-bold text-foreground">"{selectedStatusToDelete?.name}"</span>. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}