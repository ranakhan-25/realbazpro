"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RotateCcw, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createShareUser, deleteShareUser, getShareUsers, restoreShareUser } from "../api";
import type { ShareUserRecord } from "../types";
import { ShareProjectAuthGate } from "../_components/ShareProjectAuthGate";

export default function ShareUsersPage() {
  const [users, setUsers] = useState<ShareUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ShareUserRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  async function load() {
    setLoading(true);
    setError("");
    try { setUsers(await getShareUsers()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load share users."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => `${user.name || ""} ${user.code || ""} ${user.email || ""} ${user.mobileNo || ""}`.toLowerCase().includes(query));
  }, [users, search]);

  function openCreate() {
    setForm({ name: "", email: "", phone: "", password: "" });
    setCreating(true);
    setEditing(null);
  }

  function openEdit(user: ShareUserRecord) {
    setForm({
      name: String(user.name || ""),
      email: String(user.email || ""),
      phone: String(user.phone || user.mobileNo || ""),
      password: "",
    });
    setEditing(user);
    setCreating(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) { setError("User name is required."); return; }
    if (!editing && (!form.email.trim() || form.password.length < 8)) {
      setError("A valid email and password of at least 8 characters are required.");
      return;
    }
    try {
      if (editing) {
        setError("Editing existing Share User profiles is not supported by the current backend API.");
        return;
      }
      await createShareUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      setEditing(null); setCreating(false); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save share user."); }
  }

  async function remove(user: ShareUserRecord) {
    if (!user.uuid || !window.confirm(`Soft delete "${user.name || "user"}"?`)) return;
    try { await deleteShareUser(user.uuid); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete share user."); }
  }

  async function restore(user: ShareUserRecord) {
    if (!user.uuid) return;
    try { await restoreShareUser(user.uuid); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restore share user."); }
  }

  return (
    <ShareProjectAuthGate>
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Share Users</h1><p className="mt-1 text-sm text-slate-500">Manage investor accounts used by Share Project.</p></div>
        <Button onClick={openCreate}><UserPlus />Add Share User</Button>
      </div>
      {error && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div>{error}</div></div>}
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." className="pl-9" /></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Contact</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{loading ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">Loading users...</TableCell></TableRow> : visible.length === 0 ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">No share users found.</TableCell></TableRow> : visible.map((user) => (
            <TableRow key={String(user.uuid || user.id || user.code)}>
              <TableCell><button className="font-medium text-slate-900 hover:text-[#2ed573]" onClick={() => openEdit(user)}>{user.name || "Unnamed user"}</button>{user.code && <p className="mt-1 text-xs text-slate-400">{user.code}</p>}</TableCell>
              <TableCell><p>{user.email || "-"}</p><p className="text-xs text-slate-400">{String(user.phone || user.mobileNo || "-")}</p></TableCell><TableCell>{String(user.role || "OWNER")}</TableCell><TableCell><span className="rounded-md bg-slate-100 px-2 py-1 text-xs">{String(user.status || "ACTIVE")}</span></TableCell>
              <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button><Button variant="ghost" size="icon" aria-label="Restore user" onClick={() => void restore(user)}><RotateCcw className="h-4 w-4 text-emerald-600" /></Button><Button variant="ghost" size="icon" aria-label="Delete user" onClick={() => void remove(user)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">{editing ? "Share User Details" : "Add Share User"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Name<Input required value={form.name} disabled={!!editing} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="mt-2" /></label>
              <label className="text-sm font-medium text-slate-700">Email<Input required type="email" value={form.email} disabled={!!editing} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} className="mt-2" /></label>
              <label className="text-sm font-medium text-slate-700">Phone<Input value={form.phone} disabled={!!editing} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} className="mt-2" /></label>
              {!editing && <label className="text-sm font-medium text-slate-700">Password<Input required type="password" minLength={8} value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} className="mt-2" /></label>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Close</Button>
              {!editing && <Button type="submit">Create User</Button>}
            </div>
          </form>
        </div>
      )}
    </div>
    </ShareProjectAuthGate>
  );
}
