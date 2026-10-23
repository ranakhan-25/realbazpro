


"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import toast from "react-hot-toast";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

type MilestoneStatus =
  | "Planned"
  | "In Progress"
  | "Completed"
  | "Delayed"
  | "Cancelled";

interface Milestone {
  id: string;
  uuid: string;
  uid: string;
  projectUuid: string;
  milestoneCode: string;
  milestoneName: string;
  plannedDate: string;
  actualDate: string | null;
  progress: number;
  status: MilestoneStatus;
  varianceDays: string | number;
  addedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MilestoneForm {
  projectUuid: string;
  milestoneCode: string;
  milestoneName: string;
  plannedDate: string;
  actualDate: string;
  progress: number;
  status: MilestoneStatus;
  varianceDays: string;
  addedBy: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5002/realbizpro/api/v1"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/project-milestone`;

const STATUSES: MilestoneStatus[] = [
  "Planned",
  "In Progress",
  "Completed",
  "Delayed",
  "Cancelled",
];

const EMPTY_FORM: MilestoneForm = {
  projectUuid: "",
  milestoneCode: "",
  milestoneName: "",
  plannedDate: "",
  actualDate: "",
  progress: 0,
  status: "Planned",
  varianceDays: "0",
  addedBy: "Shamim Khan",
};

/* -------------------------------------------------------------------------- */
/*                              API UTILITIES                                 */
/* -------------------------------------------------------------------------- */

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const duration = performance.now() - startedAt;

    console.info(
      `[Project Milestone API] ${options.method || "GET"} ${url} — ${duration.toFixed(2)} ms`,
    );

    const text = await response.text();

    let result: ApiResponse<T> | T | null = null;

    if (text) {
      try {
        result = JSON.parse(text) as ApiResponse<T> | T;
      } catch {
        throw new Error(`Server returned an invalid response (${response.status}).`);
      }
    }

    if (!response.ok) {
      const errorMessage =
        result &&
        typeof result === "object" &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : `Request failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      result.success === false
    ) {
      throw new Error(
        "message" in result && typeof result.message === "string"
          ? result.message
          : "API request failed.",
      );
    }

    return result as T;
  } catch (error) {
    const duration = performance.now() - startedAt;

    console.error(
      `[Project Milestone API] Request failed after ${duration.toFixed(2)} ms`,
      error,
    );

    throw error;
  }
}

function unwrapData(value: unknown): unknown {
  let current = value;

  // Supports common API response shapes such as { data: [...] }
  // and { data: { data: [...] } }.
  for (let i = 0; i < 3; i++) {
    if (
      current &&
      typeof current === "object" &&
      "data" in current
    ) {
      current = (current as { data: unknown }).data;
    } else {
      break;
    }
  }

  return current;
}

function toDateInput(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeStatus(value: unknown): MilestoneStatus {
  const normalized = String(value ?? "Planned")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  const match = STATUSES.find(
    (status) => status.toLowerCase() === normalized,
  );

  return match ?? "Planned";
}

function normalizeMilestone(item: Record<string, unknown>): Milestone {
  return {
    id: String(item.id ?? item.uuid ?? item.uid ?? ""),
    uuid: String(item.uuid ?? ""),
    uid: String(item.uid ?? ""),
    projectUuid: String(item.projectUuid ?? ""),
    milestoneCode: String(item.milestoneCode ?? ""),
    milestoneName: String(item.milestoneName ?? ""),
    plannedDate: String(item.plannedDate ?? ""),
    actualDate: item.actualDate ? String(item.actualDate) : null,
    progress: Number(item.progress ?? 0),
    status: normalizeStatus(item.status),
    varianceDays: String(item.varianceDays ?? "0"),
    addedBy: String(item.addedBy ?? ""),
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                    */
/* -------------------------------------------------------------------------- */

export default function ProjectMilestonePage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<Milestone | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);

  /* ------------------------------- GET LIST ------------------------------- */

  const loadMilestones = useCallback(async (showToast = false) => {
    setLoading(true);

    try {
      const result = await apiRequest<unknown>(
        `${API_URL}?page=1&limit=100`,
      );

      const data = unwrapData(result);

      if (!Array.isArray(data)) {
        throw new Error(
          "Unexpected API response. Check the GET project-milestone response in Swagger.",
        );
      }

      const rows = data
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .map(normalizeMilestone);

      setMilestones(rows);

      if (showToast) {
        toast.success("Milestones refreshed.");
      }
    } catch (error) {
      console.error("Failed to load milestones:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMilestones();
  }, [loadMilestones]);

  /* ------------------------------ FILTER LIST ----------------------------- */

  const filteredMilestones = useMemo(() => {
    const query = search.trim().toLowerCase();

    return milestones.filter((item) => {
      const matchesSearch =
        !query ||
        item.milestoneName.toLowerCase().includes(query) ||
        item.milestoneCode.toLowerCase().includes(query) ||
        item.projectUuid.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [milestones, search, statusFilter]);

  /* --------------------------------- STATS -------------------------------- */

  const stats = useMemo(
    () => ({
      total: milestones.length,
      completed: milestones.filter((m) => m.status === "Completed").length,
      inProgress: milestones.filter((m) => m.status === "In Progress").length,
      delayed: milestones.filter((m) => m.status === "Delayed").length,
    }),
    [milestones],
  );

  /* ------------------------------- OPEN FORM ------------------------------ */

  function openCreateModal() {
    setEditingMilestone(null);
    setForm({ ...EMPTY_FORM });
    setIsModalOpen(true);
  }

  function openEditModal(item: Milestone) {
    setEditingMilestone(item);

    setForm({
      projectUuid: item.projectUuid,
      milestoneCode: item.milestoneCode,
      milestoneName: item.milestoneName,
      plannedDate: toDateInput(item.plannedDate),
      actualDate: toDateInput(item.actualDate),
      progress: item.progress,
      status: item.status,
      varianceDays: String(item.varianceDays ?? "0"),
      addedBy: item.addedBy || "Shamim Khan",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingMilestone(null);
    setForm({ ...EMPTY_FORM });
  }

  function updateForm<K extends keyof MilestoneForm>(
    key: K,
    value: MilestoneForm[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  /* ----------------------------- CREATE / EDIT ---------------------------- */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.projectUuid.trim()) {
      toast.error("Project UUID is required.");
      return;
    }

    if (!form.milestoneCode.trim()) {
      toast.error("Milestone code is required.");
      return;
    }

    if (!form.milestoneName.trim()) {
      toast.error("Milestone name is required.");
      return;
    }

    if (!form.plannedDate) {
      toast.error("Planned date is required.");
      return;
    }

    if (form.progress < 0 || form.progress > 100) {
      toast.error("Progress must be between 0 and 100.");
      return;
    }

    const isEditing = Boolean(editingMilestone);

    const payload = {
      uid: editingMilestone?.uid || crypto.randomUUID(),
      projectUuid: form.projectUuid.trim(),
      milestoneCode: form.milestoneCode.trim(),
      milestoneName: form.milestoneName.trim(),
      plannedDate: new Date(
        `${form.plannedDate}T00:00:00`,
      ).toISOString(),
      actualDate: form.actualDate
        ? new Date(`${form.actualDate}T00:00:00`).toISOString()
        : null,
      progress: Number(form.progress),
      status: form.status,
      varianceDays: String(form.varianceDays || "0"),
      addedBy: form.addedBy.trim() || "Shamim Khan",
    };

    const uuid = editingMilestone?.uuid;

    if (isEditing && !uuid) {
      toast.error("This milestone has no UUID, so it cannot be updated.");
      return;
    }

    setSaving(true);

    const toastId = toast.loading(
      isEditing ? "Updating milestone..." : "Creating milestone...",
    );

    try {
      const result = await apiRequest<unknown>(
        isEditing
          ? `${API_URL}/${encodeURIComponent(uuid!)}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      toast.dismiss(toastId);

      const returned = unwrapData(result);

      if (returned && typeof returned === "object" && !Array.isArray(returned)) {
        const saved = normalizeMilestone(
          returned as Record<string, unknown>,
        );

        setMilestones((previous) => {
          if (isEditing) {
            return previous.map((item) =>
              item.uuid === uuid ? saved : item,
            );
          }

          return [saved, ...previous.filter((item) => item.uuid !== saved.uuid)];
        });
      } else {
        // If the server returns no usable row, reload the list.
        await loadMilestones();
      }

      toast.success(
        isEditing
          ? "Milestone updated successfully."
          : "Milestone created successfully.",
      );

      setIsModalOpen(false);
      setEditingMilestone(null);
      setForm({ ...EMPTY_FORM });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------- DELETE -------------------------------- */

  async function handleDelete(item: Milestone) {
    if (!item.uuid) {
      toast.error("This milestone has no UUID, so it cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.milestoneName}"?`,
    );

    if (!confirmed) return;

    setDeletingUuid(item.uuid);

    const toastId = toast.loading("Deleting milestone...");

    try {
      await apiRequest<unknown>(
        `${API_URL}/${encodeURIComponent(item.uuid)}`,
        { method: "DELETE" },
      );

      setMilestones((previous) =>
        previous.filter((milestone) => milestone.uuid !== item.uuid),
      );

      toast.dismiss(toastId);
      toast.success("Milestone deleted successfully.");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingUuid(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <Activity size={17} />
              Project Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Project Milestones
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track project deadlines, progress, and milestone status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadMilestones(true)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <Plus size={18} />
              Add Milestone
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Milestones"
            value={stats.total}
            icon={<CalendarDays size={20} />}
            iconClass="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-50 text-amber-700"
          />
          <StatCard
            title="Delayed"
            value={stats.delayed}
            icon={<Activity size={20} />}
            iconClass="bg-rose-50 text-rose-700"
          />
        </section>

        {/* Table panel */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold">All Milestones</h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredMilestones.length} of {milestones.length} milestones
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search milestones..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Milestone</th>
                  <th className="px-5 py-4 font-semibold">Project UUID</th>
                  <th className="px-5 py-4 font-semibold">Planned Date</th>
                  <th className="px-5 py-4 font-semibold">Actual Date</th>
                  <th className="px-5 py-4 font-semibold">Progress</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Variance</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Loader2
                        size={28}
                        className="mx-auto animate-spin text-blue-700"
                      />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading milestones...
                      </p>
                    </td>
                  </tr>
                ) : filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <CalendarDays
                        size={32}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-semibold text-slate-700">
                        No milestones found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing the filters or create a new milestone.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMilestones.map((item) => (
                    <tr
                      key={item.uuid || item.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {item.milestoneName || "Untitled milestone"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.milestoneCode}
                        </p>
                      </td>

                      <td className="max-w-48 truncate px-5 py-4 font-mono text-xs text-slate-500">
                        {item.projectUuid || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(item.plannedDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(item.actualDate)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, item.progress))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {item.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {item.varianceDays} days
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit milestone"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            disabled={deletingUuid === item.uuid}
                            title="Delete milestone"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            {deletingUuid === item.uuid ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="milestone-modal-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="milestone-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingMilestone ? "Edit Milestone" : "Create Milestone"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the milestone details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <FormField label="Project UUID" required>
                  <input
                    required
                    value={form.projectUuid}
                    onChange={(event) =>
                      updateForm("projectUuid", event.target.value)
                    }
                    placeholder="Enter a valid project UUID"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Milestone Code" required>
                  <input
                    required
                    value={form.milestoneCode}
                    onChange={(event) =>
                      updateForm("milestoneCode", event.target.value)
                    }
                    placeholder="e.g. MS-002"
                    className={inputClass}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Milestone Name" required>
                    <input
                      required
                      value={form.milestoneName}
                      onChange={(event) =>
                        updateForm("milestoneName", event.target.value)
                      }
                      placeholder="e.g. Foundation Work Completed"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <FormField label="Planned Date" required>
                  <input
                    type="date"
                    required
                    value={form.plannedDate}
                    onChange={(event) =>
                      updateForm("plannedDate", event.target.value)
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Actual Date">
                  <input
                    type="date"
                    value={form.actualDate}
                    onChange={(event) =>
                      updateForm("actualDate", event.target.value)
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Progress (%)" required>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={form.progress}
                    onChange={(event) =>
                      updateForm(
                        "progress",
                        Math.min(100, Math.max(0, Number(event.target.value))),
                      )
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Status" required>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        normalizeStatus(event.target.value),
                      )
                    }
                    className={inputClass}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Variance (days)">
                  <input
                    type="number"
                    value={form.varianceDays}
                    onChange={(event) =>
                      updateForm("varianceDays", event.target.value)
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Added By">
                  <input
                    value={form.addedBy}
                    onChange={(event) =>
                      updateForm("addedBy", event.target.value)
                    }
                    placeholder="Name"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingMilestone
                      ? "Save Changes"
                      : "Create Milestone"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                              REUSABLE UI                                  */
/* -------------------------------------------------------------------------- */

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: MilestoneStatus }) {
  const styles: Record<MilestoneStatus, string> = {
    Planned: "bg-slate-100 text-slate-700 ring-slate-200",
    "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Delayed: "bg-rose-50 text-rose-700 ring-rose-200",
    Cancelled: "bg-amber-50 text-amber-700 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
