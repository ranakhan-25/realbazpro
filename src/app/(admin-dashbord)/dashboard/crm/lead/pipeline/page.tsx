"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Building,
  ArrowUpRight,
  Eye,
  Plus,
  Search,
  X,
  Edit,
  Trash2
} from "lucide-react";

interface PipelineProject {
  id: string;
  name: string;
  totalLeads: number;
  activeDeals: number;
  newThisQtr: number;
  value: number;
  status: "Active" | "Completed" | "Upcoming";
}

const defaultPipelines: PipelineProject[] = [
  {
    id: "pipe-1",
    name: "Riverside Horizon",
    totalLeads: 24,
    activeDeals: 18,
    newThisQtr: 4,
    value: 45000000,
    status: "Active",
  },
  {
    id: "pipe-2",
    name: "Meridian Tower",
    totalLeads: 15,
    activeDeals: 10,
    newThisQtr: 2,
    value: 28000000,
    status: "Active",
  },
  {
    id: "pipe-3",
    name: "Meridian Yards",
    totalLeads: 12,
    activeDeals: 8,
    newThisQtr: 3,
    value: 19500000,
    status: "Active",
  },
  {
    id: "pipe-4",
    name: "Greenfield Court",
    totalLeads: 8,
    activeDeals: 5,
    newThisQtr: 1,
    value: 12000000,
    status: "Active",
  },
];

export default function PipelineListPage() {
  const [pipelines, setPipelines] = useState<PipelineProject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active selected item for Edit / View
  const [selectedProject, setSelectedProject] = useState<PipelineProject | null>(null);

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: "",
    totalLeads: "",
    value: "",
  });

  // Pagination States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. PAGE LOAD HOLE LOCALSTORAGE THEKE DATA ANBO
  useEffect(() => {
    const savedData = localStorage.getItem("crm_pipeline_list_data");
    if (savedData) {
      try {
        setPipelines(JSON.parse(savedData));
      } catch (e) {
        setPipelines(defaultPipelines);
      }
    } else {
      setPipelines(defaultPipelines);
      localStorage.setItem("crm_pipeline_list_data", JSON.stringify(defaultPipelines));
    }
    setIsLoaded(true);
  }, []);

  // 2. DATA UPDATE HOLE LOCALSTORAGE-E SAVE KORAR HELPER FUNCTION
  const updateAndSavePipelines = (data: PipelineProject[]) => {
    setPipelines(data);
    localStorage.setItem("crm_pipeline_list_data", JSON.stringify(data));
  };

  // Handle Add New Pipeline Project
  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const created: PipelineProject = {
      id: `pipe-${Date.now()}`,
      name: newProject.name,
      totalLeads: Number(newProject.totalLeads) || 0,
      activeDeals: Number(newProject.totalLeads) || 0,
      newThisQtr: 1,
      value: Number(newProject.value) || 0,
      status: "Active",
    };

    const updatedList = [created, ...pipelines];
    updateAndSavePipelines(updatedList);

    setShowAddModal(false);
    setNewProject({ name: "", totalLeads: "", value: "" });
  };

  // Handle Save Edit Project
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updatedList = pipelines.map((item) =>
      item.id === selectedProject.id ? selectedProject : item
    );
    updateAndSavePipelines(updatedList);

    setShowEditModal(false);
    setSelectedProject(null);
  };

  // Handle Delete Project
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from pipeline?`)) {
      const updatedList = pipelines.filter((item) => item.id !== id);
      updateAndSavePipelines(updatedList);
    }
  };

  // Filter Pipelines based on Search Input
  const filteredPipelines = pipelines.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Calculations
  const totalEntries = filteredPipelines.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredPipelines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!isLoaded) {
    return <div className="p-8 text-center font-bold text-muted-foreground">Loading Pipeline Data...</div>;
  }

  return (
    <div className="w-full space-y-5 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground text-xs font-sans">
      
      {/* BREADCRUMB & HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <a href="/dashboard" className="hover:text-indigo-600 transition">Home</a>
          <span>›</span>
          <a href="#" className="hover:text-indigo-600 transition">CRM</a>
          <span>›</span>
          <span className="text-foreground font-extrabold">Pipeline List</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus size={15} /> New Pipeline Project
        </button>
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
            placeholder="Search project pipeline..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-56 p-1.5 border rounded-md bg-background border-border font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* PIPELINE LIST TABLE */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-indigo-500 text-white font-extrabold uppercase text-[11px]">
                <th className="p-3 w-12 text-center">SL</th>
                <th className="p-3 min-w-[220px]">PROJECT</th>
                <th className="p-3 min-w-[130px]">TOTAL LEADS</th>
                <th className="p-3 min-w-[130px]">ACTIVE DEALS</th>
                <th className="p-3 min-w-[140px]">NEW THIS QTR</th>
                <th className="p-3 min-w-[150px]">PIPELINE VALUE</th>
                <th className="p-3 text-center min-w-[110px]">ACTION</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border font-medium text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((project, index) => (
                  <tr key={project.id} className="hover:bg-muted/20 transition">
                    <td className="p-3 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          <Building size={16} />
                        </div>
                        <span className="font-bold text-sm text-foreground">
                          {project.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 font-mono font-semibold text-foreground">
                      {project.totalLeads} Leads
                    </td>

                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                        {project.activeDeals} Active
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1 w-fit">
                        <ArrowUpRight size={12} /> +{project.newThisQtr} this qtr
                      </span>
                    </td>

                    <td className="p-3 font-mono font-bold text-indigo-600 text-sm">
                      ৳{(project.value / 100000).toFixed(1)} Lakhs
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => { setSelectedProject(project); setShowViewModal(true); }}
                          className="p-1.5 rounded bg-muted hover:bg-indigo-600 hover:text-white transition shadow-xs"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => { setSelectedProject({ ...project }); setShowEditModal(true); }}
                          className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs"
                          title="Edit Project"
                        >
                          <Edit size={13} />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="p-1.5 rounded bg-rose-500 hover:bg-rose-600 text-white transition shadow-xs"
                          title="Delete Project"
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
                    No pipeline projects found.
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

      {/* CREATE NEW PIPELINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">New Pipeline Project</h3>
              <button onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Residency"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Initial Leads Count</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={newProject.totalLeads}
                  onChange={(e) => setNewProject({ ...newProject, totalLeads: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Estimated Pipeline Value (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000000"
                  value={newProject.value}
                  onChange={(e) => setNewProject({ ...newProject, value: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 rounded-xl bg-muted font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PIPELINE MODAL */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Edit Pipeline Project</h3>
              <button onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={selectedProject.name}
                  onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Total Leads</label>
                <input
                  type="number"
                  value={selectedProject.totalLeads}
                  onChange={(e) => setSelectedProject({ ...selectedProject, totalLeads: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Pipeline Value (BDT)</label>
                <input
                  type="number"
                  value={selectedProject.value}
                  onChange={(e) => setSelectedProject({ ...selectedProject, value: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-xl bg-muted font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-600 text-white font-black shadow-md"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PIPELINE MODAL */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">{selectedProject.name} Details</h3>
              <button onClick={() => setShowViewModal(false)}><X size={18} /></button>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Total Leads:</span>
                <span className="font-mono font-bold text-foreground">{selectedProject.totalLeads} Leads</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Active Deals:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedProject.activeDeals} Active</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">New This Quarter:</span>
                <span className="font-mono font-bold text-emerald-600">+{selectedProject.newThisQtr} Deals</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">Total Pipeline Value:</span>
                <span className="font-mono font-bold text-indigo-600">৳{selectedProject.value.toLocaleString()} BDT</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}