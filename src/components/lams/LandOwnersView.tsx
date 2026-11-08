"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  X,
  Check,
  User,
  Users,
  FileSpreadsheet,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { LandOwner, AcquisitionLead } from "@/types/lams";
import { LamsTableToolbar, ColumnDefinition } from "./common/LamsTableToolbar";
import { LamsBulkActionBar } from "./common/LamsBulkActionBar";
import { LamsEmptyState } from "./common/LamsEmptyState";

interface LandOwnersViewProps {
  owners: LandOwner[];
  acquisitionLeads?: AcquisitionLead[];
  onAddOwner?: (owner: any) => void;
  onEditOwner?: (uuid: string, data: any) => void;
  onDeleteOwner?: (uuid: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: "name", label: "Landowner Name", visible: true },
  { key: "nid", label: "National ID (NID)", visible: true },
  { key: "phone", label: "Contact Phone", visible: true },
  { key: "email", label: "Email", visible: true },
  { key: "address", label: "Address", visible: true },
  { key: "lands_count", label: "Registered Lands (#)", visible: true },
];

export function LandOwnersView({
  owners = [],
  acquisitionLeads = [],
  onAddOwner,
  onEditOwner,
  onDeleteOwner,
}: LandOwnersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasNidFilter, setHasNidFilter] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [nidError, setNidError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    nid: "",
    phone: "",
    email: "",
    address: "",
    bank_name: "",
    bank_account: "",
    nominees: [{ name: "", relation: "", nid: "", phone: "" }],
  });

  const safeOwners = Array.isArray(owners) ? owners : [];

  const filteredOwners = useMemo(() => {
    return safeOwners.filter((owner) => {
      const o = owner as any;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        o.name?.toLowerCase().includes(term) ||
        o.phone?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term) ||
        o.nid?.toLowerCase().includes(term);

      const matchesNid = !hasNidFilter || (o.nid && o.nid.trim().length > 0);

      return matchesSearch && matchesNid;
    });
  }, [safeOwners, searchTerm, hasNidFilter]);

  const displayedOwners = filteredOwners.slice(0, entriesPerPage);

  const handleToggleColumn = (key: string) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedOwners.map((o: any) => o.uuid || o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Father's Name",
      "NID",
      "Phone",
      "Email",
      "Address",
      "Bank Name",
      "Bank Account",
      "Lands Count",
    ];
    const rows = filteredOwners.map((o: any) => {
      const count = acquisitionLeads.filter(
        (lead: any) => lead.owner_id === (o.uuid || o.id) || lead.owner_name === o.name || lead.owner === o.name
      ).length;
      return [
        `"${o.name}"`,
        `"${o.father_name || ""}"`,
        `"${o.nid || ""}"`,
        `"${o.phone || ""}"`,
        `"${o.email || ""}"`,
        `"${o.address || ""}"`,
        `"${o.bank_name || ""}"`,
        `"${o.bank_account || ""}"`,
        count,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `land_owners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Add/Edit Modal
  const openForm = (owner?: any) => {
    setNidError("");
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
        nominees:
          owner.nominee_json && owner.nominee_json.length > 0
            ? owner.nominee_json
            : [{ name: "", relation: "", nid: "", phone: "" }],
      });
    } else {
      setEditingOwner(null);
      setFormData({
        name: "",
        father_name: "",
        nid: "",
        phone: "",
        email: "",
        address: "",
        bank_name: "",
        bank_account: "",
        nominees: [{ name: "", relation: "", nid: "", phone: "" }],
      });
    }
    setIsFormModalOpen(true);
  };

  // Nominee handlers
  const handleNomineeChange = (index: number, field: string, value: string) => {
    const updated = [...formData.nominees];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, nominees: updated });
  };

  const addNomineeField = () => {
    setFormData({
      ...formData,
      nominees: [...formData.nominees, { name: "", relation: "", nid: "", phone: "" }],
    });
  };

  const removeNomineeField = (index: number) => {
    const updated = formData.nominees.filter((_, i) => i !== index);
    setFormData({ ...formData, nominees: updated });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // NID validation check (10-17 digits if provided)
    if (formData.nid && formData.nid.trim().length > 0) {
      const cleanNid = formData.nid.trim();
      if (!/^\d{10,17}$/.test(cleanNid)) {
        setNidError("NID must be between 10 and 17 numeric digits.");
        return;
      }
    }
    setNidError("");

    const payload = {
      ...formData,
      nominee_json: formData.nominees.filter((n) => n.name.trim().length > 0),
    };

    if (editingOwner && onEditOwner) {
      onEditOwner(editingOwner.uuid || editingOwner.id, payload);
    } else if (onAddOwner) {
      onAddOwner(payload);
    }
    setIsFormModalOpen(false);
    setEditingOwner(null);
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="space-y-6">
      {/* 1. Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Landowners Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered titleholders, bank settlements, NID verification, and nominee structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Landowner Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNidFilter}
                onChange={(e) => setHasNidFilter(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Has Verified NID Only</span>
            </label>
          </div>
        </div>

        {/* Universal Toolbar */}
        <LamsTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search landowner by name, phone, email, NID..."
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExportCSV={handleExportCSV}
          entriesPerPage={entriesPerPage}
          onEntriesPerPageChange={setEntriesPerPage}
          onResetFilters={() => {
            setSearchTerm("");
            setHasNidFilter(false);
          }}
          hasActiveFilters={Boolean(searchTerm) || hasNidFilter}
        />
      </div>

      {/* 3. Bulk Action Bar */}
      <LamsBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={() => {
          if (confirm(`Are you sure you want to delete ${selectedIds.length} landowner records?`)) {
            selectedIds.forEach((id) => onDeleteOwner?.(id));
            setSelectedIds([]);
          }
        }}
      />

      {/* 4. Landowners Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedOwners.length === 0 ? (
          <LamsEmptyState
            title="No landowners found"
            description="Add a landowner profile or clear filters to view registered landowners."
            actionLabel="Add Landowner Profile"
            onAction={() => openForm()}
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        displayedOwners.length > 0 &&
                        selectedIds.length === displayedOwners.length
                      }
                      className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  {isColVisible("name") && <th className="py-3 px-3.5">Landowner Name</th>}
                  {isColVisible("nid") && <th className="py-3 px-3.5">NID</th>}
                  {isColVisible("phone") && <th className="py-3 px-3.5">Contact Phone</th>}
                  {isColVisible("email") && <th className="py-3 px-3.5">Email</th>}
                  {isColVisible("address") && <th className="py-3 px-3.5">Address</th>}
                  {isColVisible("lands_count") && (
                    <th className="py-3 px-3.5 text-center">Lands (#)</th>
                  )}
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedOwners.map((owner: any) => {
                  const ownerId = owner.uuid || owner.id;
                  const isSelected = selectedIds.includes(ownerId);
                  const landsCount = acquisitionLeads.filter(
                    (lead: any) =>
                      lead.owner_id === ownerId ||
                      lead.owner_name === owner.name ||
                      lead.owner === owner.name
                  ).length;

                  return (
                    <tr
                      key={ownerId}
                      className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                        isSelected ? "bg-cyan-50/40 dark:bg-cyan-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(ownerId)}
                          className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>

                      {/* Name */}
                      {isColVisible("name") && (
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                          <button
                            onClick={() => setSelectedOwner(owner)}
                            className="hover:underline text-cyan-700 dark:text-cyan-400"
                          >
                            {owner.name}
                          </button>
                          {owner.father_name && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              C/O {owner.father_name}
                            </span>
                          )}
                        </td>
                      )}

                      {/* NID */}
                      {isColVisible("nid") && (
                        <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {owner.nid ? (
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              {owner.nid}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Verified</span>
                          )}
                        </td>
                      )}

                      {/* Phone */}
                      {isColVisible("phone") && (
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-medium">
                          {owner.phone}
                        </td>
                      )}

                      {/* Email */}
                      {isColVisible("email") && (
                        <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400">
                          {owner.email || "N/A"}
                        </td>
                      )}

                      {/* Address */}
                      {isColVisible("address") && (
                        <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {owner.address || "N/A"}
                        </td>
                      )}

                      {/* Lands Count */}
                      {isColVisible("lands_count") && (
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                            {landsCount} parcels
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOwner(owner)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 transition-all"
                            title="View Owner Profile & Nominees"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openForm(owner)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                            title="Edit Landowner"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete landowner "${owner.name}"?`)) {
                                onDeleteOwner?.(ownerId);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all"
                            title="Delete Landowner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                {editingOwner ? "Edit Landowner Profile" : "Add New Landowner Profile"}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Landowner name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Father's / Husband's Name
                  </label>
                  <input
                    type="text"
                    placeholder="Parent or spouse name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    National ID (10 - 17 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="NID number"
                    value={formData.nid}
                    onChange={(e) => {
                      setFormData({ ...formData, nid: e.target.value });
                      if (nidError) setNidError("");
                    }}
                    className={`w-full border p-2 rounded-xl outline-none ${
                      nidError
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}
                  />
                  {nidError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {nidError}
                    </p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Contact Phone *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="owner@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Present / Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Complete mailing and residential address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Bank Settlement Info */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  Bank & Settlement Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. City Bank / Dutch-Bangla Bank"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="Account number"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Nominees Structure */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    Nominee & Heir Details
                  </h4>
                  <button
                    type="button"
                    onClick={addNomineeField}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    + Add Nominee
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.nominees.map((nominee, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700"
                    >
                      <input
                        type="text"
                        placeholder="Nominee Name"
                        value={nominee.name}
                        onChange={(e) => handleNomineeChange(index, "name", e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Relation (e.g. Son, Wife)"
                        value={nominee.relation}
                        onChange={(e) => handleNomineeChange(index, "relation", e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Nominee NID"
                        value={nominee.nid}
                        onChange={(e) => handleNomineeChange(index, "nid", e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 rounded-lg text-xs"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Contact Phone"
                          value={nominee.phone}
                          onChange={(e) => handleNomineeChange(index, "phone", e.target.value)}
                          className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 rounded-lg text-xs w-full"
                        />
                        {formData.nominees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeNomineeField(index)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Save Landowner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Owner Profile Detail Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600" />
                Landowner Comprehensive Profile
              </h2>
              <button
                onClick={() => setSelectedOwner(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Name</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedOwner.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Father's / Spouse</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOwner.father_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">NID Number</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedOwner.nid || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOwner.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Email</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOwner.email || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Address</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOwner.address || "N/A"}</p>
                </div>
              </div>

              {/* Bank Info */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Bank Information</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedOwner.bank_name || "Bank not specified"} — <span className="font-mono">{selectedOwner.bank_account || "No Account"}</span>
                </p>
              </div>

              {/* Nominees */}
              {selectedOwner.nominee_json && selectedOwner.nominee_json.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-2">Registered Nominees</p>
                  <div className="space-y-1.5">
                    {selectedOwner.nominee_json.map((n: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{n.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">({n.relation})</span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">{n.phone || n.nid}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Acquisition Leads */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-slate-400 font-bold uppercase text-[10px] mb-2">Associated Land Parcels</p>
                {acquisitionLeads.filter(
                  (l: any) =>
                    l.owner_id === (selectedOwner.uuid || selectedOwner.id) ||
                    l.owner_name === selectedOwner.name ||
                    l.owner === selectedOwner.name
                ).length > 0 ? (
                  <div className="space-y-1.5">
                    {acquisitionLeads
                      .filter(
                        (l: any) =>
                          l.owner_id === (selectedOwner.uuid || selectedOwner.id) ||
                          l.owner_name === selectedOwner.name ||
                          l.owner === selectedOwner.name
                      )
                      .map((lead: any) => (
                        <div key={lead.id || lead.uuid} className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{lead.code || lead.lead_code || lead.title}</span>
                            <span className="text-slate-500 text-[11px] ml-2">{lead.location}</span>
                          </div>
                          <span className="font-bold text-emerald-600">{lead.area_katha || lead.landArea} Katha</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No land parcels linked yet.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOwner(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
