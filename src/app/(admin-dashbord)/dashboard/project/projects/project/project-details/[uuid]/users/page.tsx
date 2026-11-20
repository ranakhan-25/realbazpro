"use client";

import { projectFetch } from "@/app/(admin-dashbord)/dashboard/project/project-fetch";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

type ProjectMember = {
  uuid: string;
  name: string;
  email: string;
  phone?: string | null;
};
type DirectoryUser = {
  uuid: string;
  name: string;
  email: string;
  phone?: string | null;
};
type DisplayMember = ProjectMember & {
  role: "Project Manager" | "Team Member";
  isProjectManager?: boolean;
};
type MemberForm = {
  userUuid: string;
  name: string;
  email: string;
  phone: string;
};
type ApiPayload = {
  success?: boolean;
  message?: string | string[];
  data?: unknown;
  [key: string]: unknown;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_ROOT = `${API_BASE}/realbizpro/api/v1`;
const EMPTY_FORM: MemberForm = { userUuid: "", name: "", email: "", phone: "" };

function apiMessage(payload: ApiPayload | null, fallback: string): string {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message ? message : fallback;
}

function rowsFrom<T>(payload: unknown): T[] {
  let value = payload;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(value)) return value as T[];
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    value = record.data ?? record.rows ?? record.items;
  }
  return [];
}

function projectFrom(payload: unknown): Record<string, unknown> | null {
  let value = payload;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    if ("projectManager" in record) return record;
    value = record.data ?? record.project;
  }
  return null;
}

async function requestJson(
  url: string,
  init?: RequestInit,
): Promise<{ response: Response; payload: ApiPayload | null }> {
  const response = await projectFetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : `Request failed (${response.status}).`;
    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
  }
  return {
    response,
    payload:
      payload && typeof payload === "object" ? (payload as ApiPayload) : null,
  };
}

export default function UsersPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const projectUuid = String(uuid);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [projectManagerUuid, setProjectManagerUuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { payload } = await requestJson(
        `${API_ROOT}/project/${encodeURIComponent(projectUuid)}/members`,
      );
      if (payload?.success === false)
        throw new Error(apiMessage(payload, "Could not load project members."));
      setMembers(rowsFrom<ProjectMember>(payload));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load project members.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson(
        `${API_ROOT}/project/${encodeURIComponent(projectUuid)}`,
      ).then(({ payload }) => {
        if (active)
          setProjectManagerUuid(
            String(projectFrom(payload)?.projectManager || ""),
          );
      }),
      requestJson(`${API_ROOT}/crm/projects/dropdown/users`).then(
        ({ payload }) => {
          if (payload?.success === false)
            throw new Error(
              apiMessage(payload, "User dropdown could not be loaded."),
            );
          if (active) setDirectoryUsers(rowsFrom<DirectoryUser>(payload));
        },
      ),
    ]).catch((cause: unknown) => {
      if (active)
        setError(
          cause instanceof Error
            ? cause.message
            : "Project user data could not be loaded.",
        );
    });
    return () => {
      active = false;
    };
  }, [projectUuid]);

  const manager = directoryUsers.find(
    (user) => user.uuid === projectManagerUuid,
  );
  const displayedMembers = useMemo<DisplayMember[]>(() => {
    const managerAlreadyListed =
      manager &&
      members.some(
        (member) => member.email.toLowerCase() === manager.email.toLowerCase(),
      );
    const managerRow: DisplayMember[] =
      manager && !managerAlreadyListed
        ? [{ ...manager, role: "Project Manager", isProjectManager: true }]
        : [];
    return [
      ...managerRow,
      ...members.map((member) => ({ ...member, role: "Team Member" as const })),
    ];
  }, [manager, members]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };
  const openEdit = (member: ProjectMember) => {
    setEditing(member);
    setForm({
      userUuid: "",
      name: member.name,
      email: member.email,
      phone: member.phone || "",
    });
    setError("");
    setModalOpen(true);
  };

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const selectedUser = directoryUsers.find(
        (user) => user.uuid === form.userUuid,
      );
      const memberData = selectedUser && !editing ? selectedUser : form;
      const collectionUrl = `${API_ROOT}/project/${encodeURIComponent(projectUuid)}/members`;
      const url = editing
        ? `${collectionUrl}/${encodeURIComponent(editing.uuid)}`
        : collectionUrl;
      const { payload } = await requestJson(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: memberData.name.trim(),
          email: memberData.email.trim(),
          phone: memberData.phone?.trim() || null,
        }),
      });
      if (payload?.success === false)
        throw new Error(
          apiMessage(payload, "Project member could not be saved."),
        );
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadMembers();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Project member could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member: ProjectMember) => {
    if (!window.confirm(`Remove ${member.name} from this project?`)) return;
    setDeleting(member.uuid);
    setError("");
    try {
      const { payload } = await requestJson(
        `${API_ROOT}/project/${encodeURIComponent(projectUuid)}/members/${encodeURIComponent(member.uuid)}`,
        { method: "DELETE" },
      );
      if (payload?.success === false)
        throw new Error(
          apiMessage(payload, "Project member could not be removed."),
        );
      setMembers((current) =>
        current.filter((item) => item.uuid !== member.uuid),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Project member could not be removed.",
      );
    } finally {
      setDeleting("");
    }
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-white p-3">
        <div>
          <h2 className="font-semibold">Project Users</h2>
          <p className="text-xs text-slate-500">
            Project manager and assigned team members
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={loading || !directoryUsers.length}
          className="flex items-center gap-1 rounded bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
        >
          <Plus size={15} /> Add Member
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="w-12 px-3 py-2">#</th>
              <th className="px-3 py-2">NAME</th>
              <th className="px-3 py-2">EMAIL</th>
              <th className="px-3 py-2">PHONE</th>
              <th className="px-3 py-2">ROLE</th>
              <th className="px-3 py-2 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : displayedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No team members or project manager are linked to this project
                  yet.
                </td>
              </tr>
            ) : (
              displayedMembers.map((member, index) => (
                <tr
                  key={
                    member.isProjectManager
                      ? `manager-${member.uuid}`
                      : member.uuid
                  }
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2 font-medium">{member.name}</td>
                  <td className="px-3 py-2">{member.email}</td>
                  <td className="px-3 py-2">{member.phone || "—"}</td>
                  <td className="px-3 py-2">{member.role}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      {!member.isProjectManager && (
                        <>
                          <button
                            type="button"
                            aria-label={`Edit ${member.name}`}
                            onClick={() => openEdit(member)}
                            className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${member.name}`}
                            onClick={() => void deleteMember(member)}
                            disabled={deleting === member.uuid}
                            className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === member.uuid ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveMember}
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="font-semibold">
                {editing ? "Edit Project Member" : "Assign User"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5">
              {editing ? (
                <label className="text-sm">
                  Name
                  <input
                    required
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className="mt-1 w-full rounded border px-3 py-2"
                  />
                </label>
              ) : (
                <label className="text-sm">
                  Select active user
                  <select
                    required
                    value={form.userUuid}
                    onChange={(event) => {
                      const user = directoryUsers.find(
                        (item) => item.uuid === event.target.value,
                      );
                      setForm({
                        userUuid: event.target.value,
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                      });
                    }}
                    className="mt-1 w-full rounded border px-3 py-2"
                  >
                    <option value="">Choose a user</option>
                    {directoryUsers
                      .filter(
                        (user) =>
                          !members.some(
                            (member) =>
                              member.email.toLowerCase() ===
                              user.email.toLowerCase(),
                          ),
                      )
                      .map((user) => (
                        <option key={user.uuid} value={user.uuid}>
                          {user.name} — {user.email}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label className="text-sm">
                Email
                <input
                  required
                  type="email"
                  maxLength={255}
                  readOnly={!editing}
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="mt-1 w-full rounded border px-3 py-2 read-only:bg-gray-50"
                />
              </label>
              <label className="text-sm">
                Phone
                <input
                  maxLength={50}
                  readOnly={!editing}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="mt-1 w-full rounded border px-3 py-2 read-only:bg-gray-50"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t bg-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded bg-gray-400 px-4 py-2 text-sm text-white"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Save Changes" : "Assign User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
