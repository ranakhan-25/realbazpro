'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Home, ChevronRight, Plus, Search, Layers, Grid, X, Eye, Edit, Trash2,
  Building2, RefreshCw, Undo2, AlertCircle, CheckCircle2, Loader2, ArrowUpDown,
} from 'lucide-react';

/* ----------------------------------------------------------------------------
 * API LAYER  —  POST/GET /floor, GET/PUT/DELETE /floor/{uuid}, POST /floor/{uuid}/restore
 * ------------------------------------------------------------------------- */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

interface ProjectFloor {
  uuid: string;
  buildingUuid: string;
  floorCode: string;
  name: string;
  number: number;
  units_count: number;
}

interface FloorPayload {
  buildingUuid: string;
  floorCode: string;
  floorName: string;
  floorNumber: number;
}

interface ProjectUnit {
  id: string;
  floorUuid: string;
  code: string;
  type: '1BHK' | '2BHK' | '3BHK' | 'office' | 'shop' | 'plot';
  size_sqft: number;
  facing: string;
  price: number;
  status: 'available' | 'booked' | 'sold' | 'reserved' | 'blocked';
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = Array.isArray(j?.message) ? j.message.join(', ') : j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Tolerant of { data: [...] } | { data: { items: [...] } } | [...]
const unwrapList = (r: any): any[] =>
  Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.items) ? r.data.items : Array.isArray(r?.items) ? r.items : [];
const unwrapOne = (r: any) => (r?.data && !Array.isArray(r.data) ? r.data : r);

const normalize = (f: any): ProjectFloor => ({
  uuid: f.uuid ?? f.id,
  buildingUuid: f.buildingUuid ?? f.building_uuid ?? f.building?.uuid ?? '',
  floorCode: f.floorCode ?? f.floor_code ?? '',
  name: f.floorName ?? f.name ?? '',
  number: Number(f.floorNumber ?? f.number ?? 0),
  units_count: Number(f.units_count ?? f.unitsCount ?? f._count?.units ?? f.units?.length ?? 0),
});

const floorApi = {
  list: async (buildingUuid?: string) => {
    const q = buildingUuid ? `?buildingUuid=${encodeURIComponent(buildingUuid)}` : '';
    return unwrapList(await request(`/floor${q}`)).map(normalize);
  },
  get: async (uuid: string) => normalize(unwrapOne(await request(`/floor/${uuid}`))),
  create: async (body: FloorPayload) =>
    normalize(unwrapOne(await request('/floor', { method: 'POST', body: JSON.stringify(body) }))),
  update: async (uuid: string, body: FloorPayload) =>
    request(`/floor/${uuid}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (uuid: string) => request(`/floor/${uuid}`, { method: 'DELETE' }),
  restore: (uuid: string) => request(`/floor/${uuid}/restore`, { method: 'POST' }),
};

/* ----------------------------------------------------------------------------
 * UI helpers
 * ------------------------------------------------------------------------- */
const statusStyle: Record<ProjectUnit['status'], string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  booked: 'bg-amber-50 text-amber-700 ring-amber-200',
  sold: 'bg-rose-50 text-rose-700 ring-rose-200',
  reserved: 'bg-violet-50 text-violet-700 ring-violet-200',
  blocked: 'bg-slate-100 text-slate-600 ring-slate-300',
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500';

function ModalShell({
  title, subtitle, onClose, children, maxW = 'max-w-lg', z = 'z-50',
}: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; maxW?: string; z?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm`} onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 font-mono text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * PAGE
 * ------------------------------------------------------------------------- */
function FloorsListInner() {
  const searchParams = useSearchParams();
  const buildingUuid = searchParams.get('buildingUuid') || undefined;

  const [floors, setFloors] = useState<ProjectFloor[]>([]);
  const [units, setUnits] = useState<ProjectUnit[]>([]); // no unit endpoint provided yet -> local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string; undo?: () => void } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewFloor, setViewFloor] = useState<ProjectFloor | null>(null);
  const [editFloor, setEditFloor] = useState<ProjectFloor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectFloor | null>(null);
  const [selectedFloorForUnits, setSelectedFloorForUnits] = useState<ProjectFloor | null>(null);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    buildingUuid: buildingUuid ?? '',
    floorCode: '',
    floorName: '',
    floorNumber: '',
  });
  const [unitFormData, setUnitFormData] = useState({
    code: '', type: '3BHK' as ProjectUnit['type'], size_sqft: '', facing: 'SE', price: '', status: 'available' as ProjectUnit['status'],
  });

  const notify = useCallback((t: NonNullable<typeof toast>) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), t.undo ? 7000 : 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFloors(await floorApi.list(buildingUuid));
    } catch (e: any) {
      setError(e.message || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  }, [buildingUuid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (buildingUuid) {
      setFormData((current) => ({ ...current, buildingUuid }));
    }
  }, [buildingUuid]);

  /* ---- handlers ---- */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await floorApi.create({
        buildingUuid: formData.buildingUuid.trim(),
        floorCode: formData.floorCode.trim(),
        floorName: formData.floorName.trim(),
        floorNumber: Number(formData.floorNumber),
      });
      setIsModalOpen(false);
      setFormData({
        buildingUuid: buildingUuid ?? '',
        floorCode: '',
        floorName: '',
        floorNumber: '',
      });
      notify({ type: 'ok', msg: `"${created.name || formData.floorName}" created` });
      await load();
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally { setBusy(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFloor) return;
    setBusy(true);
    try {
      await floorApi.update(editFloor.uuid, {
        buildingUuid: editFloor.buildingUuid,
        floorCode: editFloor.floorCode.trim(),
        floorName: editFloor.name.trim(),
        floorNumber: editFloor.number,
      });
      setEditFloor(null);
      notify({ type: 'ok', msg: 'Floor updated' });
      await load();
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusy(true);
    try {
      await floorApi.remove(target.uuid);
      setDeleteTarget(null);
      await load();
      notify({
        type: 'ok',
        msg: `"${target.name}" deleted`,
        undo: async () => {
          try {
            await floorApi.restore(target.uuid);
            notify({ type: 'ok', msg: 'Floor restored' });
            await load();
          } catch (err: any) { notify({ type: 'err', msg: err.message }); }
        },
      });
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally { setBusy(false); }
  };

  const openDetails = async (floor: ProjectFloor) => {
    setViewFloor(floor);
    try { setViewFloor(await floorApi.get(floor.uuid)); } catch {}
  };

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorForUnits) return;
    const newUnit: ProjectUnit = {
      id: `UNT-${Date.now()}`,
      floorUuid: selectedFloorForUnits.uuid,
      code: unitFormData.code,
      type: unitFormData.type,
      size_sqft: parseFloat(unitFormData.size_sqft) || 0,
      facing: unitFormData.facing,
      price: parseFloat(unitFormData.price) || 0,
      status: unitFormData.status,
    };
    setUnits((u) => [newUnit, ...u]);
    setFloors((fs) => fs.map((f) => (f.uuid === selectedFloorForUnits.uuid ? { ...f, units_count: f.units_count + 1 } : f)));
    setSelectedFloorForUnits({ ...selectedFloorForUnits, units_count: selectedFloorForUnits.units_count + 1 });
    setIsAddUnitModalOpen(false);
    setUnitFormData({ code: '', type: '3BHK', size_sqft: '', facing: 'SE', price: '', status: 'available' });
  };

  /* ---- derived ---- */
  const filteredFloors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return floors
      .filter((f) => f.name.toLowerCase().includes(q) || f.number.toString().includes(q))
      .sort((a, b) => (sortAsc ? a.number - b.number : b.number - a.number));
  }, [floors, searchQuery, sortAsc]);

  const totalUnits = floors.reduce((s, f) => s + f.units_count, 0);
  const highest = floors.length ? Math.max(...floors.map((f) => f.number)) : 0;
  const floorUnits = selectedFloorForUnits ? units.filter((u) => u.floorUuid === selectedFloorForUnits.uuid) : [];

  const stats = [
    { label: 'Total Floors', value: floors.length, icon: Layers, tone: 'from-indigo-500 to-violet-500' },
    { label: 'Total Units', value: totalUnits, icon: Grid, tone: 'from-sky-500 to-cyan-500' },
    { label: 'Highest Level', value: `L${highest}`, icon: Building2, tone: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-6 font-sans text-slate-800 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center space-x-2 text-sm text-slate-500">
            <Link href="/projects" className="flex items-center transition-colors hover:text-indigo-600">
              <Home className="mr-1 h-4 w-4" /> Projects
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <Link href="/projects/sites" className="transition-colors hover:text-indigo-600">Buildings</Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">Floors</span>
          </nav>
          <h1 className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Building Floors Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage every level, its units and availability in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:shadow-indigo-600/40"
          >
            <Plus className="h-4 w-4" /> Add Floor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.tone} text-white shadow-md`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-2xl font-extrabold text-slate-900">{loading ? '—' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <p className="text-sm font-bold text-slate-900">
              {buildingUuid ? <>Building <span className="font-mono text-indigo-600">{buildingUuid}</span></> : 'All Buildings'}
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search floor name, number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Floor Code</th>
                <th className="px-5 py-3.5">Floor Name</th>
                <th className="px-5 py-3.5">
                  <button onClick={() => setSortAsc(!sortAsc)} className="inline-flex items-center gap-1 uppercase hover:text-indigo-600">
                    Level <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-5 py-3.5">Units</th>
                <th className="px-5 py-3.5 text-center">Units Link</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
                    <p className="font-semibold text-slate-700">{error}</p>
                    <button onClick={load} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">Try again</button>
                  </td>
                </tr>
              ) : filteredFloors.length > 0 ? (
                filteredFloors.map((floor) => (
                  <tr key={floor.uuid} className="group transition-colors hover:bg-indigo-50/40">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600">{floor.floorCode || floor.uuid.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{floor.name}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Level {floor.number}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{floor.units_count} Units</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedFloorForUnits(floor)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                      >
                        View Units <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetails(floor)} title="View Details" className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditFloor({ ...floor })} title="Edit Floor" className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(floor)} title="Delete Floor" className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-slate-400">No floors found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
            Showing <b className="text-slate-700">{filteredFloors.length}</b> of <b className="text-slate-700">{floors.length}</b> floors
          </div>
        )}
      </div>

      {/* Add floor */}
      {isModalOpen && (
        <ModalShell title="Add Floor" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
            <div>
              <label className={labelCls}>Building UUID *</label>
              <input required value={formData.buildingUuid}
                onChange={(e) => setFormData({ ...formData, buildingUuid: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Code *</label>
              <input required placeholder="e.g. FL-01" value={formData.floorCode}
                onChange={(e) => setFormData({ ...formData, floorCode: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Name *</label>
              <input required placeholder="e.g. 2nd Floor - Premium Suites" value={formData.floorName}
                onChange={(e) => setFormData({ ...formData, floorName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Number *</label>
              <input type="number" min="0" required placeholder="2" value={formData.floorNumber}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })} className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save Floor
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Edit floor */}
      {editFloor && (
        <ModalShell title="Edit Floor" subtitle={editFloor.uuid} onClose={() => setEditFloor(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
            <div>
              <label className={labelCls}>Building UUID</label>
              <input required value={editFloor.buildingUuid}
                onChange={(e) => setEditFloor({ ...editFloor, buildingUuid: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Code</label>
              <input required value={editFloor.floorCode}
                onChange={(e) => setEditFloor({ ...editFloor, floorCode: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Name</label>
              <input required value={editFloor.name} onChange={(e) => setEditFloor({ ...editFloor, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor Number</label>
              <input type="number" min="0" required value={editFloor.number}
                onChange={(e) => setEditFloor({ ...editFloor, number: parseInt(e.target.value) || 0 })} className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditFloor(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update Floor
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* View details */}
      {viewFloor && (
        <ModalShell title="Floor Details" subtitle={viewFloor.uuid} onClose={() => setViewFloor(null)} maxW="max-w-md">
          <div className="space-y-3 p-6 text-sm">
            {[
              ['Floor Name', viewFloor.name],
              ['Floor Code', viewFloor.floorCode || '—'],
              ['Level Number', `Level ${viewFloor.number}`],
              ['Total Units', `${viewFloor.units_count} Units`],
              ['Building', viewFloor.buildingUuid || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k}</span>
                <span className="font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
            <button onClick={() => setViewFloor(null)} className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">Close</button>
          </div>
        </ModalShell>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ModalShell title="Delete Floor?" onClose={() => setDeleteTarget(null)} maxW="max-w-sm">
          <div className="p-6 text-sm text-slate-600">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <p className="text-center">
              <b className="text-slate-900">{deleteTarget.name}</b> will be removed. You can undo it right after.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Units modal */}
      {selectedFloorForUnits && (
        <ModalShell
          title={`Units on ${selectedFloorForUnits.name}`}
          subtitle={selectedFloorForUnits.uuid}
          onClose={() => setSelectedFloorForUnits(null)}
          maxW="max-w-3xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
            <p className="text-xs text-slate-500">{floorUnits.length} unit(s) on this floor</p>
            <button onClick={() => setIsAddUnitModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Add Unit
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {floorUnits.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {floorUnits.map((unit) => (
                  <div key={unit.id} className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600">{unit.code}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${statusStyle[unit.status]}`}>{unit.status}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex justify-between"><span>Type</span><b className="uppercase text-slate-800">{unit.type}</b></div>
                      <div className="flex justify-between"><span>Size</span><b className="text-slate-800">{unit.size_sqft} sqft</b></div>
                      <div className="flex justify-between"><span>Facing</span><b className="font-mono text-slate-800">{unit.facing}</b></div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                        <span>Price</span><span className="text-indigo-600">${unit.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Grid className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p>No units on this floor yet.</p>
                <button onClick={() => setIsAddUnitModalOpen(true)} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">
                  + Add the first unit
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
            <button onClick={() => setSelectedFloorForUnits(null)} className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">Close</button>
          </div>
        </ModalShell>
      )}

      {/* Add unit */}
      {isAddUnitModalOpen && selectedFloorForUnits && (
        <ModalShell title={`Add Unit to ${selectedFloorForUnits.name}`} onClose={() => setIsAddUnitModalOpen(false)} maxW="max-w-md" z="z-[60]">
          <form onSubmit={handleAddUnitSubmit} className="space-y-4 p-6">
            <div>
              <label className={labelCls}>Unit Code *</label>
              <input required placeholder="e.g. A-301" value={unitFormData.code}
                onChange={(e) => setUnitFormData({ ...unitFormData, code: e.target.value })} className={`${inputCls} font-mono`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Type *</label>
                <select value={unitFormData.type} onChange={(e) => setUnitFormData({ ...unitFormData, type: e.target.value as ProjectUnit['type'] })} className={inputCls}>
                  {['1BHK', '2BHK', '3BHK', 'office', 'shop', 'plot'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Size (sqft) *</label>
                <input type="number" required placeholder="1200" value={unitFormData.size_sqft}
                  onChange={(e) => setUnitFormData({ ...unitFormData, size_sqft: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Facing *</label>
                <select value={unitFormData.facing} onChange={(e) => setUnitFormData({ ...unitFormData, facing: e.target.value })} className={inputCls}>
                  {['N', 'S', 'E', 'W', 'SE', 'SW'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Price ($) *</label>
                <input type="number" required placeholder="150000" value={unitFormData.price}
                  onChange={(e) => setUnitFormData({ ...unitFormData, price: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsAddUnitModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">Save Unit</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          {toast.type === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
          <span>{toast.msg}</span>
          {toast.undo && (
            <button onClick={() => { toast.undo?.(); setToast(null); }} className="ml-2 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FloorsListPage() {
  return (
    <Suspense fallback={null}>
      <FloorsListInner />
    </Suspense>
  );
}