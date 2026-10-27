/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import { motion } from "framer-motion";
import {
  Edit3,
  Eye,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useTheme } from "@/lib/theme";
import RolePermissionModal, { Modal, type RolePermissionSavePayload } from "./Modal";
import {
  getRoles,
  createRoleWithPermissions,
  updateRole,
  deleteRole,
  type Role,
} from "@/services/roleService";

export default function RolesPage() {
  const { primaryColor } = useTheme();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch live roles
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
      toast.error("Failed to load roles from server");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Handlers
  const openCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  // Save (Create / Update) from modal
  const handleSaveRole = async (payload: RolePermissionSavePayload) => {
    try {
      if (editingRole && editingRole.id) {
        // Update
        await updateRole(editingRole.id, {
          name: payload.roleName,
          description: payload.description,
        });
        toast.success(`Role '${payload.roleName}' updated successfully`);
      } else {
        // Create new role with permissions across all modules
        await createRoleWithPermissions({
          name: payload.roleName,
          description: payload.description,
          roleLevel: payload.roleLevel,
          permissionIds: payload.permissionIds.map(Number),
        });
        toast.success(`Role '${payload.roleName}' created with permissions`);
      }

      setFormOpen(false);
      await loadRoles();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save role";
      toast.error(msg);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      setDeletingId(roleToDelete.id);
      await deleteRole(roleToDelete.id);
      toast.success(`Role '${roleToDelete.name}' deleted successfully`);
      setRoleToDelete(null);
      await loadRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [roles, search]);

  return (
    <main className="w-full p-4 md:p-6">
      {/* HEADER */}
      <section className="mb-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Role Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage roles and their assigned granular permissions across all modules.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Role
          </button>
        </div>
      </section>

      {/* TABLE SECTION */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SEARCH */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Configured Roles
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {filteredRoles.length}{" "}
              {filteredRoles.length === 1 ? "role" : "roles"} available
            </p>
          </div>
          <div className="relative w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search roles..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          {loadingRoles ? (
            <div className="flex h-48 items-center justify-center text-xs text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
              Loading system and organization roles...
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Permissions
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Created
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                      No roles found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role, index) => (
                    <motion.tr
                      key={role.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.025 }}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {role.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              ID: {role.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[360px] truncate text-sm text-slate-500">
                          {role.description || "No description available"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1.5 text-xs font-semibold">
                          <KeyRound className="h-3.5 w-3.5" />
                          {role.permissions?.length ?? 0}
                          <span style={{ opacity: 0.7 }}>permissions</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {role.createdAt
                          ? new Date(role.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRole(role)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(role)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                            title="Edit role"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRoleToDelete(role)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      <RolePermissionModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        role={editingRole}
        title={
          editingRole ? "Edit Role & Permissions" : "Create Role & Permissions"
        }
        onSave={handleSaveRole}
      />

      {/* VIEW MODAL (Details) */}
      {viewingRole && (
        <Modal onClose={() => setViewingRole(null)} maxWidthClass="max-w-2xl">
          <div className="flex items-center justify-between border-b px-6 py-5 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Role Details</h2>
                <p className="text-xs text-slate-500">Overview of authority tier and module permissions</p>
              </div>
            </div>
            <button
              onClick={() => setViewingRole(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Meta Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Role Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {viewingRole.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
                  ID: {viewingRole.id}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Authority Level
                </p>
                <div className="mt-1">
                  {viewingRole.roleLevel === 1 ? (
                    <span className="inline-flex rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
                      Level 1 • Super Admin
                    </span>
                  ) : viewingRole.roleLevel === 2 ? (
                    <span className="inline-flex rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold">
                      Level 2 • Organization Admin
                    </span>
                  ) : viewingRole.roleLevel === 3 ? (
                    <span className="inline-flex rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
                      Level 3 • Department Manager
                    </span>
                  ) : viewingRole.roleLevel === 5 ? (
                    <span className="inline-flex rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-bold">
                      Level 5 • Viewer / Guest
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 text-xs font-bold">
                      Level 4 • Operations Staff
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Permissions
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-bold">
                    <KeyRound className="h-3.5 w-3.5" />
                    {viewingRole.permissions?.length || 0} permissions
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Description
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {viewingRole.description || "No description provided for this role."}
              </p>
            </div>

            {/* Assigned Permissions List Grouped by Module / Feature */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Capabilities ({viewingRole.permissions?.length || 0})
                </h3>
              </div>

              {(!viewingRole.permissions || viewingRole.permissions.length === 0) ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-400">
                  No granular permissions assigned to this role yet.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 divide-y divide-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1">
                    {viewingRole.permissions.map((perm) => (
                      <div
                        key={String(perm.id)}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-700 truncate pr-2">
                          {perm.name || perm.key}
                        </span>
                        {perm.action && (
                          <span className="shrink-0 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {perm.action}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
            <button
              onClick={() => setViewingRole(null)}
              className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {roleToDelete && (
        <Modal onClose={() => setRoleToDelete(null)} maxWidthClass="max-w-md">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Delete role?</h2>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete <b>{roleToDelete.name}</b>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 border rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                {deletingId && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
