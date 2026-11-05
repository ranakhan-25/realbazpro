"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FolderPlus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../api";
import type { ProjectCategoryRecord } from "../types";
import { ShareProjectAuthGate } from "../_components/ShareProjectAuthGate";

export default function ProjectCategoriesPage() {
  const [categories, setCategories] = useState<ProjectCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProjectCategoryRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", name: "" });

  async function load() {
    setLoading(true); setError("");
    try { setCategories(await getCategories()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load categories."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => `${category.name || ""} ${category.code || ""}`.toLowerCase().includes(query));
  }, [categories, search]);

  function openCreate() { setEditing(null); setCreating(true); setForm({ code: "", name: "" }); }
  function openEdit(category: ProjectCategoryRecord) { setCreating(false); setEditing(category); setForm({ code: String(category.code || ""), name: String(category.name || "") }); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) { setError("Category name is required."); return; }
    if (!editing && !form.code.trim()) { setError("Category code is required."); return; }
    try {
      if (editing?.uuid) await updateCategory(editing.uuid, form);
      else await createCategory(form);
      setCreating(false); setEditing(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save category."); }
  }

  async function remove(category: ProjectCategoryRecord) {
    if (!category.uuid || !window.confirm(`Delete category "${category.name || category.code || "category"}"?`)) return;
    try { await deleteCategory(category.uuid); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete category."); }
  }

  return (
    <ShareProjectAuthGate>
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Project Categories</h1><p className="mt-1 text-sm text-slate-500">Manage Share Project categories.</p></div><Button onClick={openCreate}><FolderPlus />Add Category</Button></div>
      {error && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div>{error}</div></div>}
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." className="pl-9" /></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={3} className="py-12 text-center text-slate-500">Loading categories...</TableCell></TableRow> : visible.length === 0 ? <TableRow><TableCell colSpan={3} className="py-12 text-center text-slate-500">No categories found.</TableCell></TableRow> : visible.map((category) => <TableRow key={String(category.uuid || category.id || category.code)}><TableCell><button className="font-medium text-slate-900 hover:text-[#2ed573]" onClick={() => openEdit(category)}>{category.name || "Unnamed category"}</button></TableCell><TableCell>{category.code || "-"}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(category)}>Edit</Button><Button variant="ghost" size="icon" aria-label="Delete category" onClick={() => void remove(category)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
      {(creating || editing) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold text-slate-900">{editing ? "Edit Category" : "Add Category"}</h2><div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-700">Name<Input required value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="mt-2" /></label><label className="block text-sm font-medium text-slate-700">Code<Input value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} className="mt-2" /></label></div><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button><Button type="submit">Save Category</Button></div></form></div>}
    </div>
    </ShareProjectAuthGate>
  );
}
