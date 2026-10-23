"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface KPIRecord {
  id: string;
  type: "INDIVIDUAL" | "TEAM";
  name: string;
  workType1: string;
  target1: number;
  workType2: string;
  target2: number;
  workType3: string;
  target3: number;
  fromDate: string;
  toDate: string;
  leftDays: number;
  status: "ACTIVE" | "INACTIVE";
}

const mockKPIData: KPIRecord[] = [
  {
    id: "kpi-1",
    type: "TEAM",
    name: "grod",
    workType1: "Call Task",
    target1: 11,
    workType2: "Visit Task",
    target2: 4,
    workType3: "Sales Task",
    target3: 4,
    fromDate: "2026-10-22",
    toDate: "2026-11-17",
    leftDays: 26,
    status: "ACTIVE",
  },
  {
    id: "kpi-2",
    type: "INDIVIDUAL",
    name: "N/A",
    workType1: "Call Task",
    target1: 7,
    workType2: "Visit Task",
    target2: 7,
    workType3: "Sales Task",
    target3: 7,
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    leftDays: 0,
    status: "ACTIVE",
  },
  {
    id: "kpi-3",
    type: "INDIVIDUAL",
    name: "N/A",
    workType1: "Call Task",
    target1: 10,
    workType2: "Visit Task",
    target2: 5,
    workType3: "Sales Task",
    target3: 100000,
    fromDate: "2026-07-13",
    toDate: "2026-07-18",
    leftDays: 0,
    status: "ACTIVE",
  },
  {
    id: "kpi-4",
    type: "TEAM",
    name: "Go",
    workType1: "Call Task",
    target1: 9,
    workType2: "Visit Task",
    target2: 8,
    workType3: "Sales Task",
    target3: 6,
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    leftDays: 0,
    status: "ACTIVE",
  },
];

export default function EmployeeKPIReportsPage() {
  const [kpiList, setKpiList] = useState<KPIRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KPIRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: "INDIVIDUAL" as "INDIVIDUAL" | "TEAM",
    name: "N/A",
    workType1: "Call Task",
    target1: "10",
    workType2: "Visit Task",
    target2: "5",
    workType3: "Sales Task",
    target3: "2",
    fromDate: "2026-10-22",
    toDate: "2026-11-22",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  useEffect(() => {
    const saved = localStorage.getItem("crm_employee_kpi_full_reports");
    if (saved) {
      try {
        setKpiList(JSON.parse(saved));
      } catch (e) {
        setKpiList(mockKPIData);
      }
    } else {
      setKpiList(mockKPIData);
      localStorage.setItem("crm_employee_kpi_full_reports", JSON.stringify(mockKPIData));
    }
    setIsLoaded(true);
  }, []);

  const saveToStorage = (data: KPIRecord[]) => {
    setKpiList(data);
    localStorage.setItem("crm_employee_kpi_full_reports", JSON.stringify(data));
  };

  const calculateLeftDays = (targetDateStr: string) => {
    const targetDate = new Date(targetDateStr).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleOpenModal = (record?: KPIRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        type: record.type,
        name: record.name,
        workType1: record.workType1,
        target1: record.target1.toString(),
        workType2: record.workType2,
        target2: record.target2.toString(),
        workType3: record.workType3,
        target3: record.target3.toString(),
        fromDate: record.fromDate,
        toDate: record.toDate,
        status: record.status,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        type: "INDIVIDUAL",
        name: "N/A",
        workType1: "Call Task",
        target1: "10",
        workType2: "Visit Task",
        target2: "5",
        workType3: "Sales Task",
        target3: "2",
        fromDate: "2026-10-22",
        toDate: "2026-11-22",
        status: "ACTIVE",
      });
    }
    setShowModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const daysLeft = calculateLeftDays(formData.toDate);

    if (editingRecord) {
      const updated = kpiList.map((item) =>
        item.id === editingRecord.id
          ? {
              ...item,
              type: formData.type,
              name: formData.type === "INDIVIDUAL" ? "N/A" : formData.name || "Team",
              workType1: formData.workType1,
              target1: Number(formData.target1) || 0,
              workType2: formData.workType2,
              target2: Number(formData.target2) || 0,
              workType3: formData.workType3,
              target3: Number(formData.target3) || 0,
              fromDate: formData.fromDate,
              toDate: formData.toDate,
              leftDays: daysLeft,
              status: formData.status,
            }
          : item
      );
      saveToStorage(updated);
    } else {
      const newRec: KPIRecord = {
        id: `kpi-${Date.now()}`,
        type: formData.type,
        name: formData.type === "INDIVIDUAL" ? "N/A" : formData.name || "Team",
        workType1: formData.workType1,
        target1: Number(formData.target1) || 0,
        workType2: formData.workType2,
        target2: Number(formData.target2) || 0,
        workType3: formData.workType3,
        target3: Number(formData.target3) || 0,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        leftDays: daysLeft,
        status: formData.status,
      };
      saveToStorage([newRec, ...kpiList]);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this KPI target record?")) {
      saveToStorage(kpiList.filter((item) => item.id !== id));
    }
  };

  // 1. Filter Data
  const filteredData = kpiList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.fromDate.includes(q) ||
      item.toDate.includes(q)
    );
  });

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (!isLoaded) {
    return <div className="p-12 text-center font-bold text-muted-foreground">Loading KPI...</div>;
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-8 py-6 text-foreground bg-background min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600">
            <Sparkles size={15} /> Employee KPI Reports
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mt-0.5">
            Employee KPI
          </h1>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition flex items-center gap-2 shadow-lg active:scale-95"
        >
          <Plus size={18} /> +New KPI
        </button>
      </div>

      {/* FILTER & ENTRIES PER PAGE */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-2 border rounded-xl bg-background border-border text-foreground font-black outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none bg-background border-border text-sm font-medium"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-black uppercase text-[11px] tracking-wider bg-muted/50">
                <th className="p-4">SL</th>
                <th className="p-4">TYPE</th>
                <th className="p-4">NAME</th>
                <th className="p-4">WORK TYPE</th>
                <th className="p-4">TARGET</th>
                <th className="p-4">WORK TYPE</th>
                <th className="p-4">TARGET</th>
                <th className="p-4">WORK TYPE</th>
                <th className="p-4">TARGET</th>
                <th className="p-4">FROM DATE</th>
                <th className="p-4">TO DATE</th>
                <th className="p-4">LEFT DAYS</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-bold text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition">
                    <td className="p-4 font-mono">{indexOfFirstItem + index + 1}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.type === 'INDIVIDUAL'
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-black">{item.name}</td>
                    
                    <td className="p-4 text-muted-foreground">{item.workType1}</td>
                    <td className="p-4 font-mono font-bold text-indigo-600">{item.target1}</td>

                    <td className="p-4 text-muted-foreground">{item.workType2}</td>
                    <td className="p-4 font-mono font-bold text-purple-600">{item.target2}</td>

                    <td className="p-4 text-muted-foreground">{item.workType3}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{item.target3}</td>

                    <td className="p-4 font-mono">{item.fromDate}</td>
                    <td className="p-4 font-mono">{item.toDate}</td>
                    <td className="p-4 font-mono font-black">{item.leftDays}d</td>
                    
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 hover:bg-cyan-600 hover:text-white transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-muted-foreground font-bold">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
          <span>
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white transition disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-xl transition font-black ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted hover:bg-indigo-600 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white transition disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-card border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">
                {editingRecord ? "Edit Employee KPI" : "+New KPI Setup"}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">TYPE *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const t = e.target.value as "INDIVIDUAL" | "TEAM";
                      setFormData({
                        ...formData,
                        type: t,
                        name: t === "INDIVIDUAL" ? "N/A" : "",
                      });
                    }}
                    className="w-full p-2.5 border rounded-xl bg-background border-border"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="TEAM">TEAM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold mb-1">NAME *</label>
                  <input
                    type="text"
                    required
                    disabled={formData.type === "INDIVIDUAL"}
                    placeholder={formData.type === "INDIVIDUAL" ? "N/A" : "Team Name"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-background border-border disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">WORK TYPE 1 *</label>
                  <select
                    value={formData.workType1}
                    onChange={(e) => setFormData({ ...formData, workType1: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border"
                  >
                    <option value="Call Task">Call Task</option>
                    <option value="Visit Task">Visit Task</option>
                    <option value="Sales Task">Sales Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">TARGET 1 *</label>
                  <input
                    type="number"
                    required
                    value={formData.target1}
                    onChange={(e) => setFormData({ ...formData, target1: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">WORK TYPE 2 *</label>
                  <select
                    value={formData.workType2}
                    onChange={(e) => setFormData({ ...formData, workType2: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border"
                  >
                    <option value="Visit Task">Visit Task</option>
                    <option value="Call Task">Call Task</option>
                    <option value="Sales Task">Sales Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">TARGET 2 *</label>
                  <input
                    type="number"
                    required
                    value={formData.target2}
                    onChange={(e) => setFormData({ ...formData, target2: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">WORK TYPE 3 *</label>
                  <select
                    value={formData.workType3}
                    onChange={(e) => setFormData({ ...formData, workType3: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border"
                  >
                    <option value="Sales Task">Sales Task</option>
                    <option value="Call Task">Call Task</option>
                    <option value="Visit Task">Visit Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">TARGET 3 *</label>
                  <input
                    type="number"
                    required
                    value={formData.target3}
                    onChange={(e) => setFormData({ ...formData, target3: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">FROM DATE *</label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">TO DATE *</label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-background border-border font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold mb-1">STATUS *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                    className="w-full p-2 border rounded-xl bg-background border-border text-[11px]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-muted font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                  Save KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}