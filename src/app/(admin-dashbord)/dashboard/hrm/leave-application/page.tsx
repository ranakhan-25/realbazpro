/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Search, Check, XCircle, Edit3 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface LeaveApplication {
  id: string;
  uuid: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  allocatedDays: number;
  balanceDays: number;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  deletedAt?: string;
}

export default function LeaveApplicationPage() {
  const [dataList, setDataList] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  
  // ✅ এডিট করার জন্য স্টেট
  const [editingItem, setEditingItem] = useState<LeaveApplication | null>(null);

  // ড্রপডাউন ডাটা
  const [staffs, setStaffs] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  // ফর্ম ডাটা
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveTypeId: "",
    allocatedDays: 0,
    balanceDays: 0,
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    reason: "",
    status: "pending",
  });

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resStaff = await fetch(`${API_PATH}/employee-list?page=1&limit=100`);
      const jsonStaff = await resStaff.json();
      if (jsonStaff.success) setStaffs(jsonStaff.data.data || jsonStaff.data || []);

      const resType = await fetch(`${API_PATH}/leave-type?page=1&limit=100`);
      const jsonType = await resType.json();
      if (jsonType.success) setLeaveTypes(jsonType.data.data || jsonType.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  // ====================== FETCH LISTS ======================
  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      let currentStaffs = staffs;
      let currentLeaveTypes = leaveTypes;

      if (currentStaffs.length === 0 || currentLeaveTypes.length === 0) {
        await fetchDropdowns();
        const resStaff = await fetch(`${API_PATH}/employee-list?page=1&limit=100`);
        const jsonStaff = await resStaff.json();
        currentStaffs = jsonStaff.data?.data || jsonStaff.data || [];

        const resType = await fetch(`${API_PATH}/leave-type?page=1&limit=100`);
        const jsonType = await resType.json();
        currentLeaveTypes = jsonType.data?.data || jsonType.data || [];
      }

      const res = await fetch(`${API_PATH}/leave-application?page=1&limit=100`);
      const json = await res.json();
      
      if (json.success) {
        const activeData = (json.data.data || []).filter((item: any) => !item.deletedAt);

        const formattedData = activeData.map((item: any) => {
          const staff = currentStaffs.find((s: any) => s.uuid === item.employeeId);
          const leaveType = currentLeaveTypes.find((lt: any) => lt.uuid === item.leaveTypeId);
          
          return {
            ...item,
            employeeName: staff ? (staff.name || staff.employeeName) : item.employeeId,
            leaveTypeName: leaveType ? leaveType.name : item.leaveTypeId,
          };
        });

        setDataList(formattedData);
      }
    } catch (err) {
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchApplications();
  }, []);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      employeeId: formData.employeeId,
      leaveTypeId: formData.leaveTypeId,
      allocatedDays: Number(formData.allocatedDays),
      balanceDays: Number(formData.balanceDays),
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      reason: formData.reason,
      status: formData.status,
      addedById: "user-uuid",
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit 
        ? `${API_PATH}/leave-application/${editingItem!.uuid}` 
        : `${API_PATH}/leave-application`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Submitted successfully!");
        setIsModalOpen(false);
        setEditingItem(null); // এডিট স্টেট রিসেট
        fetchApplications();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (item: LeaveApplication) => {
    if (!window.confirm(`Delete this leave application?`)) return;
    try {
      const res = await fetch(`${API_PATH}/leave-application/${item.uuid}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((row) => row.uuid !== item.uuid));
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  // ====================== OPEN MODAL (CREATE) ======================
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      employeeId: "",
      leaveTypeId: "",
      allocatedDays: 0,
      balanceDays: 0,
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
      reason: "",
      status: "pending",
    });
    setIsModalOpen(true);
  };

  // ====================== OPEN MODAL (EDIT) ======================
  const handleEdit = (item: LeaveApplication) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      leaveTypeId: item.leaveTypeId,
      allocatedDays: Number(item.allocatedDays),
      balanceDays: Number(item.balanceDays),
      fromDate: item.fromDate,
      toDate: item.toDate,
      reason: item.reason,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const filteredData = dataList.filter((item) =>
    item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    item.leaveTypeName?.toLowerCase().includes(search.toLowerCase()) ||
    item.status?.toLowerCase().includes(search.toLowerCase())
  );

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; HRM &gt; Leave Application List</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Leave Application Add
        </button>
      </div>

      <div className="bg-white p-4 border rounded shadow-sm">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select className="border rounded px-2 py-1"><option>10</option></select>
            <span>entries</span>
          </div>
          <div className="flex gap-2 items-center text-sm">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["SL", "STAFF", "LEAVE TYPE", "FROM DATE", "TO DATE", "REASON", "STATUS", "ADD BY", "APPROVE", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{item.employeeName}</td>
                      <td className="px-3 py-2">{item.leaveTypeName}</td>
                      <td className="px-3 py-2">{item.fromDate}</td>
                      <td className="px-3 py-2">{item.toDate}</td>
                      <td className="px-3 py-2">{item.reason}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'Approved' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">Admin</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col text-xs space-y-0.5">
                          <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> All Approvals Completed.</span>
                          <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> Rasel Hossain</span>
                          <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> Admin</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 flex gap-1">
                        {/* ✅ এডিট বাটন যোগ করা হলো */}
                        <button onClick={() => handleEdit(item)} className="bg-teal-500 text-white p-1.5 rounded hover:bg-teal-600">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button className="bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <div>Showing 1 to {filteredData.length} of {filteredData.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded bg-white text-gray-500 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border rounded bg-indigo-600 text-white">1</button>
            <button className="px-3 py-1 border rounded bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Leave Application" : "Leave Application Add"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Staff <span className="text-red-500">*</span></label>
                  <select required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select value</option>
                    {staffs.map(s => (
                      <option key={s.uuid} value={s.uuid}>{s.name || s.employeeName} - {s.employeeCode || s.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Leave Type <span className="text-red-500">*</span></label>
                  <select required value={formData.leaveTypeId} onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select value</option>
                    {leaveTypes.map(lt => (
                      <option key={lt.uuid} value={lt.uuid}>{lt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Allocated Days</label>
                  <input type="number" step="0.5" value={formData.allocatedDays} onChange={(e) => setFormData({ ...formData, allocatedDays: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Balance Days</label>
                  <input type="number" step="0.5" value={formData.balanceDays} onChange={(e) => setFormData({ ...formData, balanceDays: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">To Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Reason <span className="text-red-500">*</span></label>
                <textarea required rows={3} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Write Valid Reason..." className="w-full border rounded px-3 py-2 text-sm resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {editingItem ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}