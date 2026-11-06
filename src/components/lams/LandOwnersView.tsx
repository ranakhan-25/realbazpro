"use client";

import React, { useState, useMemo } from "react";
import { Search, PlusCircle, Eye, Trash2, Pencil, X, Check, User } from "lucide-react";

interface LandOwnersViewProps {
  owners: any[];
  acquisitionLeads?: any[];
  onAddOwner?: (owner: any) => void;
  onEditOwner?: (uuid: string, data: any) => void;
  onDeleteOwner?: (uuid: string) => void;
}

export function LandOwnersView({
  owners,
  acquisitionLeads = [],
  onAddOwner,
  onEditOwner,
  onDeleteOwner,
}: LandOwnersViewProps) {
  // স্টেটস
  const [searchTerm, setSearchTerm] = useState("");
  const [hasNidFilter, setHasNidFilter] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // মডাল স্টেটস
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  // ফর্ম ডাটা (Nominee Array সহ)
  const [formData, setFormData] = useState({
    name: "", father_name: "", nid: "", phone: "", email: "",
    address: "", bank_name: "", bank_account: "",
    nominees: [{ name: "", relation: "", nid: "", phone: "" }]
  });

  const safeOwners = Array.isArray(owners) ? owners : [];

  // ফিল্টার লজিক
  const filteredOwners = useMemo(() => {
    return safeOwners.filter((owner) => {
      const o = owner as any;
      const matchesSearch = !searchTerm ||
        o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesNid = !hasNidFilter || (o.nid && o.nid.length > 0);

      return matchesSearch && matchesNid;
    });
  }, [safeOwners, searchTerm, hasNidFilter]);

  const displayedOwners = filteredOwners.slice(0, entriesPerPage);

  // ফর্ম ওপেন
  const openForm = (owner?: any) => {
    if (owner) {
      setEditingOwner(owner);
      setFormData({
        name: owner.name || "",
        father_name: owner.father_name || "",
        nid: owner.nid || "",
        phone: owner.phone || "",
        email: owner.email || "",
        address: owner.address || "",
        bank_name: owner.bank_name || "",
        bank_account: owner.bank_account || "",
        nominees: owner.nominee_json?.length > 0 ? owner.nominee_json : [{ name: "", relation: "", nid: "", phone: "" }]
      });
    } else {
      setEditingOwner(null);
      setFormData({ name: "", father_name: "", nid: "", phone: "", email: "", address: "", bank_name: "", bank_account: "", nominees: [{ name: "", relation: "", nid: "", phone: "" }] });
    }
    setIsFormModalOpen(true);
  };

  // নমিনি অ্যাড/রিমুভ
  const handleNomineeChange = (index: number, field: string, value: string) => {
    const updatedNominees = [...formData.nominees];
    updatedNominees[index] = { ...updatedNominees[index], [field]: value };
    setFormData({ ...formData, nominees: updatedNominees });
  };

  const addNomineeField = () => {
    setFormData({ ...formData, nominees: [...formData.nominees, { name: "", relation: "", nid: "", phone: "" }] });
  };

  const removeNomineeField = (index: number) => {
    const updatedNominees = formData.nominees.filter((_, i) => i !== index);
    setFormData({ ...formData, nominees: updatedNominees });
  };

  // সাবমিট
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, nominee_json: formData.nominees };
    
    if (editingOwner && onEditOwner) {
      onEditOwner(editingOwner.uuid || editingOwner.id, payload);
    } else if (onAddOwner) {
      onAddOwner(payload);
    }
    setIsFormModalOpen(false);
    setEditingOwner(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. ফিল্টার বার */}
      <div className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border bg-slate-50 text-xs w-72"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasNidFilter}
              onChange={(e) => setHasNidFilter(e.target.checked)}
              className="rounded text-cyan-600"
            />
            Has NID
          </label>
        </div>
        
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Add Landowner
        </button>
      </div>

      {/* 2. ডাটা টেবিল */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Name</th>
                <th className="py-3 px-3.5">NID</th>
                <th className="py-3 px-3.5">Phone</th>
                <th className="py-3 px-3.5">Email</th>
                <th className="py-3 px-3.5">Address</th>
                <th className="py-3 px-3.5 text-center">Lands (#)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedOwners.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No landowners found.</td></tr>
              ) : (
                displayedOwners.map((owner, idx) => {
                  const o = owner as any;
                  // লিডের মধ্যে এই ওনারের মালিকানা খুঁজে বের করা (lands#)
                  const landsCount = acquisitionLeads.filter((lead: any) => lead.owner_id === o.uuid || lead.owner_name === o.name).length;

                  return (
                    <tr key={o.uuid || idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 font-bold text-slate-900">{o.name}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">{o.nid || "N/A"}</td>
                      <td className="py-3 px-3.5 text-slate-600">{o.phone}</td>
                      <td className="py-3 px-3.5 text-slate-600">{o.email || "N/A"}</td>
                      <td className="py-3 px-3.5 text-slate-500 truncate max-w-[150px]">{o.address || "N/A"}</td>
                      <td className="py-3 px-3.5 text-center font-bold text-emerald-600">{landsCount}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedOwner(o)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openForm(o)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if(confirm("Delete this owner?")) onDeleteOwner?.(o.uuid || o.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

      {/* 3. Add/Edit Owner Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">{editingOwner ? "Edit Landowner" : "Add New Landowner"}</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1 block">Name *</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                <div><label className="text-xs font-bold mb-1 block">Father's Name</label><input type="text" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                <div>
                  <label className="text-xs font-bold mb-1 block">NID (10-17 digits)</label>
                  <input type="text" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} className="w-full border p-2 rounded text-sm" />
                </div>
                <div><label className="text-xs font-bold mb-1 block">Phone *</label><input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                <div><label className="text-xs font-bold mb-1 block">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                <div className="col-span-2"><label className="text-xs font-bold mb-1 block">Address</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded text-sm" rows={2} /></div>
              </div>

              {/* Bank Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-bold mb-3">Bank Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold mb-1 block">Bank Name</label><input type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                  <div><label className="text-xs font-bold mb-1 block">Bank Account</label><input type="text" value={formData.bank_account} onChange={e => setFormData({...formData, bank_account: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                </div>
              </div>

              {/* Nominee TBL */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold">Nominees</h4>
                  <button type="button" onClick={addNomineeField} className="text-xs font-bold text-cyan-600">+ Add Nominee</button>
                </div>
                <div className="space-y-2">
                  {formData.nominees.map((nominee, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center bg-slate-50 p-2 rounded-lg">
                      <input type="text" placeholder="Name" value={nominee.name} onChange={e => handleNomineeChange(index, "name", e.target.value)} className="border p-1.5 rounded text-xs" />
                      <input type="text" placeholder="Relation" value={nominee.relation} onChange={e => handleNomineeChange(index, "relation", e.target.value)} className="border p-1.5 rounded text-xs" />
                      <input type="text" placeholder="NID" value={nominee.nid} onChange={e => handleNomineeChange(index, "nid", e.target.value)} className="border p-1.5 rounded text-xs" />
                      <div className="flex gap-1">
                        <input type="text" placeholder="Phone" value={nominee.phone} onChange={e => handleNomineeChange(index, "phone", e.target.value)} className="border p-1.5 rounded text-xs w-full" />
                        <button type="button" onClick={() => removeNomineeField(index)} className="text-rose-500 p-1"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm font-bold">Save Owner</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. View Owner Detail Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg flex items-center gap-2"><User className="w-5 h-5"/> Landowner Profile</h2>
              <button onClick={() => setSelectedOwner(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500 font-bold">Name</p><p className="font-bold">{selectedOwner.name}</p></div>
                <div><p className="text-xs text-slate-500 font-bold">Father's Name</p><p>{selectedOwner.father_name || "N/A"}</p></div>
                <div><p className="text-xs text-slate-500 font-bold">NID</p><p className="font-mono">{selectedOwner.nid || "N/A"}</p></div>
                <div><p className="text-xs text-slate-500 font-bold">Phone</p><p>{selectedOwner.phone}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500 font-bold">Address</p><p>{selectedOwner.address || "N/A"}</p></div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs font-bold text-slate-500 mb-2">Bank Info</p>
                <p>{selectedOwner.bank_name || "N/A"} - <span className="font-mono">{selectedOwner.bank_account || "N/A"}</span></p>
              </div>

              {selectedOwner.nominee_json && selectedOwner.nominee_json.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Nominees</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedOwner.nominee_json.map((n: any, i: number) => (
                      <li key={i}>{n.name} ({n.relation}) - {n.phone}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}