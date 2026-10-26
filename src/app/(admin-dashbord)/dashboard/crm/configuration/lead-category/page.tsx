"use client";

import React, { useState } from "react";
import { Sparkles, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle } from "lucide-react";

interface CategoryRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  addBy: string;
}

const initialCategories: CategoryRecord[] = [
  {
    id: "1",
    code: "LC5589255",
    name: "Land share",
    description: "assdasd",
    addBy: "Admin",
  },
  {
    id: "2",
    code: "LC5999555",
    name: "Used Flat",
    description: "List all leads who want to buy a used flat",
    addBy: "",
  },
  {
    id: "3",
    code: "LC7540564",
    name: "Junk",
    description: "",
    addBy: "",
  },
  {
    id: "4",
    code: "LC4364740",
    name: "Upcoming",
    description: "Listing those clients who are interested for upcoming projects.",
    addBy: "",
  },
  {
    id: "5",
    code: "LC6717551",
    name: "On going",
    description: "Listing those clients who are interested for under construction or on going projects.",
    addBy: "",
  },
  {
    id: "6",
    code: "LC5543544",
    name: "Ready Flat",
    description: "List all those clients who are interested in buying a ready flat.",
    addBy: "",
  },
];

export default function LeadCategoryPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CategoryRecord | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<CategoryRecord | null>(null);

  // Filter Logic
  const filteredData = categories.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    return (
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
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
      code: `LC${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: CategoryRecord) => {
    setEditingRecord(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please enter Category Name!");
      return;
    }

    if (editingRecord) {
      // Edit logic
      setCategories(
        categories.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                code: formData.code,
                name: formData.name,
                description: formData.description,
              }
            : item
        )
      );
    } else {
      // Add logic
      const newRecord: CategoryRecord = {
        id: `${Date.now()}`,
        code: formData.code || `LC${Math.floor(1000000 + Math.random() * 9000000)}`,
        name: formData.name,
        description: formData.description,
        addBy: "Admin",
      };
      setCategories([newRecord, ...categories]);
    }

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: CategoryRecord) => {
    setSelectedCategoryToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (selectedCategoryToDelete) {
      setCategories(categories.filter((item) => item.id !== selectedCategoryToDelete.id));
      setIsDeleteModalOpen(false);
      setSelectedCategoryToDelete(null);
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
            Lead Category
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>Category Add</span>
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
                <th className="py-5 px-4 min-w-[150px]">CODE</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[300px]">DESCRIPTION</th>
                <th className="py-5 px-4 min-w-[140px]">ADD BY</th>
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
                    <td className="py-4 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {item.code}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.description || "—"}</td>
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
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No lead categories found.
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

      {/* LEAD CATEGORY ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {editingRecord ? "Lead Category Edit" : "Lead Category Add"}
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
                <label className="block text-slate-500 mb-1.5">Category Code</label>
                <input
                  type="text"
                  placeholder="Category Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Category Description</label>
                <textarea
                  placeholder="Category Description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
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
              You are about to delete <span className="font-bold text-foreground">"{selectedCategoryToDelete?.name}"</span>. This action cannot be undone.
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