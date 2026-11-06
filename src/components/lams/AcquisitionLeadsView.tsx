"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  PlusCircle,
  Eye,
  Trash2,
  Filter,
  RotateCcw,
  Pencil,
  X,
  Check,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

// TypeScript এরর এড়াতে any[] ব্যবহার করা হয়েছে
interface AcquisitionLeadsViewProps {
  leads: any[];
  onAddLead?: (lead: any) => void;
  onEditLead?: (uuid: string, data: any) => void;
  onDeleteLead?: (uuid: string) => void;
}

const SOURCES = ["Direct Owner", "Broker", "Referral", "Media / Ad", "Cold Contact", "Online Listing"];
const USERS = ["Sakib Al Hasan", "Rezaul Karim", "Tanvir Hossain", "Shamim Khan", "Farhana Ahmed"];
const STATUSES = ["Draft", "Submitted", "Qualified", "In Negotiation", "Approved", "Rejected"];

const STAGE_BADGES: Record<string, { bg: string; text: string; ring: string }> = {
  Draft: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  Submitted: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  Qualified: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  "In Negotiation": { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  Approved: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  Rejected: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
};

export function AcquisitionLeadsView({
  leads,
  onAddLead,
  onEditLead,
  onDeleteLead,
}: AcquisitionLeadsViewProps) {
  // লিস্ট ও ফিল্টার স্টেট
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // ফর্ম মডাল স্টেট
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    location: "", area_katha: "", area_sqft: "", source: "", 
    owner_name: "", owner_phone: "", asking_price: "", notes: "",
    owner_id: "", assigned_to: "", priority: "Medium"
  });

  // ডিটেইলস মডাল স্টেট
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailTab, setDetailTab] = useState("Overview");
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);

  const safeLeads = Array.isArray(leads) ? leads : [];

  const resetFilters = () => {
    setSearchTerm(""); setStatusFilter("ALL"); setSourceFilter("ALL"); setUserFilter("ALL");
  };

  const filteredLeads = useMemo(() => {
    return safeLeads.filter((lead) => {
      const l = lead as any; // Type casting to avoid TS errors
      const matchesSearch = !searchTerm || 
        (l.code || l.leadCode || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.location || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.owner_name || l.ownerName || "")?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || (l.status || l.leadStage) === statusFilter;
      const matchesSource = sourceFilter === "ALL" || l.source === sourceFilter;
      const matchesUser = userFilter === "ALL" || (l.assignee || l.assignedUser) === userFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesUser;
    });
  }, [safeLeads, searchTerm, statusFilter, sourceFilter, userFilter]);

  const displayedLeads = filteredLeads.slice(0, entriesPerPage);

  // ফর্ম ওপেন করা
  const openForm = (lead?: any) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        location: lead.location || "", area_katha: String(lead.area_katha || lead.landArea || ""), area_sqft: "",
        source: lead.source || "", owner_name: lead.owner_name || lead.ownerName || "", owner_phone: lead.owner_phone || lead.ownerPhone || "",
        asking_price: String(lead.asking_price || lead.expectedPrice || ""), notes: "", owner_id: "", assigned_to: lead.assignee || lead.assignedUser || "", priority: "Medium"
      });
    } else {
      setEditingLead(null);
      setFormData({ location: "", area_katha: "", area_sqft: "", source: "", owner_name: "", owner_phone: "", asking_price: "", notes: "", owner_id: "", assigned_to: "", priority: "Medium" });
    }
    setFormStep(1);
    setIsFormModalOpen(true);
  };

  // ফর্ম সাবমিট
  const handleFormSubmit = (status: "Draft" | "Submitted") => {
    const payload = { ...formData, status };
    if (editingLead && onEditLead) {
      onEditLead(editingLead.uuid || editingLead.id, payload);
    } else if (onAddLead) {
      onAddLead(payload);
    }
    setIsFormModalOpen(false);
    setEditingLead(null);
  };

  return (
    <div className="space-y-4 relative">
      {/* 1. ফিল্টার বার */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-600" /><span>Filter Leads</span>
          </div>
          {(statusFilter !== "ALL" || sourceFilter !== "ALL" || userFilter !== "ALL") && (
            <button onClick={resetFilters} className="text-[11px] font-semibold text-cyan-600 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 text-xs">
            <option value="ALL">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 text-xs">
            <option value="ALL">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 text-xs">
            <option value="ALL">All Assignees</option>
            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* 2. টেবিল কন্ট্রোল */}
      <div className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-xs">
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <span>Show</span>
          <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))} className="px-2 py-1 border rounded bg-slate-50 font-bold">
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 rounded-xl border bg-slate-50 text-xs w-64" />
          </div>
          <button onClick={() => openForm()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white shadow-md">
            <PlusCircle className="w-4 h-4" /> Create Lead
          </button>
        </div>
      </div>

      {/* 3. ডাটা টেবিল */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Code</th>
                <th className="py-3 px-3.5">Location</th>
                <th className="py-3 px-3.5">Area (Katha)</th>
                <th className="py-3 px-3.5">Owner Info</th>
                <th className="py-3 px-3.5">Asking Price</th>
                <th className="py-3 px-3.5">Source</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5">Assignee</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLeads.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400">No leads found.</td></tr>
              ) : (
                displayedLeads.map((lead, idx) => {
                  const l = lead as any;
                  const statusKey = l.status || l.leadStage || "Draft";
                  const stageStyle = STAGE_BADGES[statusKey] || STAGE_BADGES.Draft;
                  
                  return (
                    <tr key={l.uuid || l.id || idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 font-mono font-bold text-cyan-700">{l.code || l.leadCode}</td>
                      <td className="py-3 px-3.5 font-medium">{l.location || "N/A"}</td>
                      <td className="py-3 px-3.5 font-bold text-emerald-600">{l.area_katha || l.landArea || 0}</td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold">{l.owner_name || l.ownerName || "N/A"}</p>
                        <p className="text-[10px] text-slate-500">{l.owner_phone || l.ownerPhone || ""}</p>
                      </td>
                      <td className="py-3 px-3.5 font-bold">৳ {(l.asking_price || l.expectedPrice || 0).toLocaleString()}</td>
                      <td className="py-3 px-3.5 text-slate-600">{l.source || "N/A"}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${stageStyle.bg} ${stageStyle.text} ring-1 ${stageStyle.ring}`}>{statusKey}</span>
                      </td>
                      <td className="py-3 px-3.5 font-medium">{l.assignee || l.assignedUser || "Unassigned"}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedLead(lead); setDetailTab("Overview"); }} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openForm(lead)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if(confirm("Delete this lead?")) onDeleteLead?.(l.uuid || l.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. Create / Edit Form Modal (Step 1, 2, 3) */}
      {/* ========================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">{editingLead ? "Edit Lead" : "Create New Lead"}</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex justify-between mb-6 border-b pb-4">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`flex items-center gap-2 font-bold ${formStep === s ? "text-cyan-600" : "text-slate-400"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${formStep === s ? "bg-cyan-100" : "bg-slate-100"}`}>
                      {formStep > s ? <Check className="w-3 h-3" /> : s}
                    </div>
                    <span className="text-xs">{s === 1 ? "Info" : s === 2 ? "Owner" : "Assign"}</span>
                  </div>
                ))}
              </div>

              {/* Step 1: Info */}
              {formStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-bold mb-1 block">Location *</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Area (Katha) *</label><input type="number" value={formData.area_katha} onChange={e => setFormData({...formData, area_katha: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Area (Sqft)</label><input type="number" value={formData.area_sqft} onChange={e => setFormData({...formData, area_sqft: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Source *</label><select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border p-2 rounded text-sm"><option value="">Select</option>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="text-xs font-bold mb-1 block">Owner Name *</label><input type="text" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Owner Phone *</label><input type="text" value={formData.owner_phone} onChange={e => setFormData({...formData, owner_phone: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Asking Price</label><input type="number" value={formData.asking_price} onChange={e => setFormData({...formData, asking_price: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div className="col-span-2"><label className="text-xs font-bold mb-1 block">Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border p-2 rounded text-sm" rows={2} /></div>
                </div>
              )}

              {/* Step 2: Owner */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div><label className="text-xs font-bold mb-1 block">Link Existing Owner</label><select className="w-full border p-2 rounded text-sm"><option value="">Select Owner...</option></select></div>
                  <div className="text-center text-xs text-slate-400">-- OR --</div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed">
                    <h4 className="font-bold text-xs mb-2">Create New Owner Profile</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Name" className="border p-1.5 rounded text-xs" />
                      <input type="text" placeholder="NID" className="border p-1.5 rounded text-xs" />
                      <input type="text" placeholder="Phone" className="border p-1.5 rounded text-xs" />
                      <input type="email" placeholder="Email" className="border p-1.5 rounded text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Assign */}
              {formStep === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold mb-1 block">Assign To</label><select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} className="w-full border p-2 rounded text-sm"><option value="">Select User</option>{USERS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                  <div><label className="text-xs font-bold mb-1 block">Priority</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border p-2 rounded text-sm"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="p-4 border-t bg-slate-50 flex justify-between">
              <button disabled={formStep === 1} onClick={() => setFormStep(formStep - 1)} className="px-4 py-2 border rounded text-sm font-bold disabled:opacity-50">Previous</button>
              <div className="flex gap-2">
                {formStep < 3 ? (
                  <button onClick={() => setFormStep(formStep + 1)} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm font-bold">Next</button>
                ) : (
                  <>
                    <button onClick={() => handleFormSubmit("Draft")} className="px-4 py-2 border rounded text-sm font-bold">Save Draft</button>
                    <button onClick={() => handleFormSubmit("Submitted")} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold">Submit</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. Lead Details Modal (Overview, Info, Valuations, Workflow) */}
      {/* ========================================== */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="bg-white border text-cyan-700 font-mono font-bold px-3 py-1 rounded-md text-sm">{selectedLead.code || selectedLead.leadCode}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STAGE_BADGES[selectedLead.status || selectedLead.leadStage || "Draft"]?.bg} ${STAGE_BADGES[selectedLead.status || selectedLead.leadStage || "Draft"]?.text}`}>{selectedLead.status || selectedLead.leadStage}</span>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-2 border-b flex gap-2 bg-white">
              <button className="px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Qualify</button>
              <button className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 rounded border border-red-200 flex items-center gap-1"><XCircle className="w-3 h-3"/> Reject</button>
              <button onClick={() => setIsRemarksModalOpen(true)} className="px-3 py-1.5 text-xs font-bold bg-cyan-600 text-white rounded flex items-center gap-1"><ArrowRight className="w-3 h-3"/> Advance</button>
            </div>

            {/* Tabs Nav */}
            <div className="flex gap-4 px-4 border-b bg-white">
              {["Overview", "Info", "Valuations", "Workflow"].map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`py-3 text-xs font-bold border-b-2 ${detailTab === tab ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500"}`}>{tab}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {detailTab === "Overview" && (
                <div className="grid grid-cols-2 gap-6">
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Location</p><p className="font-bold text-sm">{selectedLead.location || "N/A"}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Area</p><p className="font-bold text-emerald-600 text-sm">{selectedLead.area_katha || selectedLead.landArea || 0} Katha</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Owner Name</p><p className="font-bold text-sm">{selectedLead.owner_name || selectedLead.ownerName || "N/A"}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Owner Phone</p><p className="font-bold text-sm">{selectedLead.owner_phone || selectedLead.ownerPhone || "N/A"}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Asking Price</p><p className="font-bold text-sm">৳ {(selectedLead.asking_price || selectedLead.expectedPrice || 0).toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Source</p><p className="font-bold text-sm">{selectedLead.source || "N/A"}</p></div>
                </div>
              )}
              {detailTab === "Info" && <p className="text-sm text-slate-500">Land Information (Mouza, Khatian, Dag) coming soon...</p>}
              {detailTab === "Valuations" && <p className="text-sm text-slate-500">Valuation details coming soon...</p>}
              {detailTab === "Workflow" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 bg-cyan-600 rounded-full"></div><span className="text-sm font-bold">Lead Created</span></div>
                  <div className="flex items-center gap-3"><div className="w-3 h-3 bg-slate-200 rounded-full"></div><span className="text-sm text-slate-500">Negotiation</span></div>
                  <div className="flex items-center gap-3"><div className="w-3 h-3 bg-slate-200 rounded-full"></div><span className="text-sm text-slate-500">Approval</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal for Advance/Reject */}
      {isRemarksModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="font-bold text-sm mb-4">Advance Stage Remarks</h3>
            <textarea placeholder="Enter remarks *" className="w-full border p-2 rounded text-sm mb-4" rows={3} required />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsRemarksModalOpen(false)} className="px-3 py-1.5 border rounded text-xs font-bold">Cancel</button>
              <button onClick={() => setIsRemarksModalOpen(false)} className="px-3 py-1.5 bg-cyan-600 text-white rounded text-xs font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}