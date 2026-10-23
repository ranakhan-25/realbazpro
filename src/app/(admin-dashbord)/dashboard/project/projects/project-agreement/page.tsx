
"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Home,
  ChevronRight,
  Plus,
  Search,
  FileText,
  DollarSign,
  X,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Undo2,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5002/realbizpro/api/v1"
).replace(/\/+$/, "");

type AgreementType = "Service" | "Partnership" | "Investment" | "Other";
type AgreementStatus = "Active" | "Expired" | "Terminated";

interface ProjectAgreement {
  id?: string;
  uuid: string;
  uid?: string;
  projectUuid?: string;
  code: string;
  partyUuid?: string;
  party: string;
  type: AgreementType;
  signedAt: string;
  startAt: string;
  endAt?: string;
  value: number;
  status: AgreementStatus;
  notes?: string;
  agreementFile?: string;
  addedBy?: string;
}

interface AgreementForm {
  code: string;
  partyUuid: string;
  type: AgreementType;
  signedAt: string;
  startAt: string;
  endAt: string;
  value: string;
  status: AgreementStatus;
  notes: string;
  agreementFile: string;
  projectUuid: string;
}

interface PartyOption {
  uuid: string;
  label: string;
}

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
};

const day = (value?: string | null) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const emptyForm = (projectUuid = ""): AgreementForm => ({
  code: "",
  partyUuid: "",
  type: "Service",
  signedAt: today(),
  startAt: today(),
  endAt: "",
  value: "",
  status: "Active",
  notes: "",
  agreementFile: "",
  projectUuid,
});

/* ==========================================================================
   API HELPERS
   ========================================================================== */

async function request<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const startedAt = performance.now();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const duration = performance.now() - startedAt;

    console.info(
      `[Project Agreement API] ${init?.method || "GET"} ${path}: ${duration.toFixed(2)} ms`,
    );

    const raw = response.status === 204 ? "" : await response.text();
    let result: any = undefined;

    if (raw) {
      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error("The server returned an invalid JSON response.");
      }
    }

    if (!response.ok || result?.success === false) {
      const message = Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message ||
          `Request failed (${response.status})`;

      throw new Error(message);
    }

    return result as T;
  } catch (error) {
    console.error(`[Project Agreement API] ${path}`, error);
    throw error;
  }
}

/**
 * Supports:
 * [ ... ]
 * { data: [...] }
 * { data: { data: [...] } }
 * { data: { items: [...] } }
 */
function unwrapList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function unwrapOne(response: any): any {
  let current = response;

  for (let index = 0; index < 3; index++) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      current.data &&
      !Array.isArray(current.data)
    ) {
      current = current.data;
    } else {
      break;
    }
  }

  return current;
}

function normalizeStatus(value: unknown): AgreementStatus {
  const status = String(value ?? "Active").toLowerCase();

  if (status === "expired") return "Expired";
  if (status === "terminated") return "Terminated";

  return "Active";
}

function normalize(value: any): ProjectAgreement {
  const agreement = value ?? {};

  return {
    id: agreement.id != null ? String(agreement.id) : undefined,
    uuid: String(agreement.uuid ?? agreement.id ?? ""),
    uid: agreement.uid,
    projectUuid: agreement.projectUuid ?? agreement.project?.uuid ?? "",
    code: String(agreement.agreementCode ?? agreement.code ?? ""),
    partyUuid: agreement.partyUuid ?? agreement.party?.uuid ?? "",
    party:
      agreement.party?.name ??
      agreement.party?.partyName ??
      agreement.party?.companyName ??
      (typeof agreement.party === "string" ? agreement.party : "") ??
      "",
    type: (agreement.agreementType ?? "Service") as AgreementType,
    signedAt: day(agreement.signedDate ?? agreement.signedAt),
    startAt: day(agreement.startDate ?? agreement.startAt),
    endAt: day(agreement.endDate ?? agreement.endAt) || undefined,
    value: Number(agreement.contractValue ?? agreement.value ?? 0),
    status: normalizeStatus(agreement.status),
    notes: agreement.notes ?? "",
    agreementFile: agreement.agreementFile ?? "",
    addedBy: agreement.addedBy ?? "",
  };
}

function toPayload(form: AgreementForm, isCreate: boolean) {
  return {
    ...(isCreate ? { projectUuid: form.projectUuid.trim() } : {}),
    agreementCode: form.code.trim(),
    partyUuid: form.partyUuid.trim(),
    agreementType: form.type,
    signedDate: form.signedAt,
    startDate: form.startAt,
    ...(form.endAt ? { endDate: form.endAt } : {}),
    contractValue: Number(form.value) || 0,
    status: form.status,
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(form.agreementFile.trim()
      ? { agreementFile: form.agreementFile.trim() }
      : {}),
  };
}

const api = {
  list: async (projectUuid?: string) => {
    const params = new URLSearchParams({
      page: "1",
      limit: "100",
      sortBy: "createdAt",
      sortOrder: "DESC",
      withDeleted: "false",
    });

    if (projectUuid) {
      params.set("projectUuid", projectUuid);
    }

    const response = await request(
      `/project-agreement?${params.toString()}`,
    );

    return unwrapList(response).map(normalize);
  },

  get: async (uuid: string) => {
    const response = await request(
      `/project-agreement/${encodeURIComponent(uuid)}`,
    );

    return normalize(unwrapOne(response));
  },

  parties: async (): Promise<PartyOption[]> => {
    const response = await request("/party");

    return unwrapList(response)
      .map((party: any) => ({
        uuid: String(party.uuid ?? party.id ?? ""),
        label: String(
          party.name ??
            party.partyName ??
            party.companyName ??
            party.fullName ??
            party.code ??
            party.uuid ??
            "",
        ),
      }))
      .filter((party) => party.uuid);
  },

  create: (form: AgreementForm) =>
    request("/project-agreement", {
      method: "POST",
      body: JSON.stringify(toPayload(form, true)),
    }),

  update: (uuid: string, form: AgreementForm) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}`, {
      method: "PUT",
      body: JSON.stringify(toPayload(form, false)),
    }),

  remove: (uuid: string) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}`, {
      method: "DELETE",
    }),

  restore: (uuid: string) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}/restore`, {
      method: "POST",
    }),
};

/* ==========================================================================
   UI CONSTANTS
   ========================================================================== */

const typeLabel: Record<AgreementType, string> = {
  Service: "Service",
  Partnership: "Partnership",
  Investment: "Investment",
  Other: "Other",
};

const typeTone: Record<AgreementType, string> = {
  Service: "bg-sky-50 text-sky-700 ring-sky-200",
  Partnership: "bg-violet-50 text-violet-700 ring-violet-200",
  Investment: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Other: "bg-amber-50 text-amber-700 ring-amber-200",
};

const statusMeta: Record<
  AgreementStatus,
  { label: string; cls: string; dot: string; icon: any }
> = {
  Active: {
    label: "Active",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  Expired: {
    label: "Expired",
    cls: "bg-slate-100 text-slate-600 ring-slate-300",
    dot: "bg-slate-400",
    icon: AlertTriangle,
  },
  Terminated: {
    label: "Terminated",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    icon: Ban,
  },
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";

const money = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxW = "max-w-xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 break-all font-mono text-[11px] text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE
   ========================================================================== */

function AgreementsInner() {
  const searchParams = useSearchParams();
  const projectUuid = searchParams.get("projectUuid") || undefined;

  const [items, setItems] = useState<ProjectAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [parties, setParties] = useState<PartyOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [form, setForm] = useState<AgreementForm>(emptyForm(projectUuid));
  const [viewItem, setViewItem] = useState<ProjectAgreement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectAgreement | null>(
    null,
  );

  const [notice, setNotice] = useState<{
    id: number;
    type: "ok" | "err";
    msg: string;
    undo?: () => Promise<void>;
  } | null>(null);

  const notify = useCallback(
    (
      type: "ok" | "err",
      msg: string,
      undo?: () => Promise<void>,
    ) => {
      setNotice({ id: Date.now(), type, msg, undo });
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.list(projectUuid);
      setItems(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load agreements";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let mounted = true;

    api
      .parties()
      .then((result) => {
        if (mounted) setParties(result);
      })
      .catch(() => {
        if (mounted) setParties([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice((current) =>
        current?.id === notice.id ? null : current,
      );
    }, notice.undo ? 7000 : 3500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const openCreate = () => {
    setEditingUuid(null);
    setForm(emptyForm(projectUuid));
    setFormOpen(true);
  };

  const openEdit = (agreement: ProjectAgreement) => {
    setEditingUuid(agreement.uuid);

    setForm({
      code: agreement.code,
      partyUuid: agreement.partyUuid || "",
      type: agreement.type,
      signedAt: agreement.signedAt || today(),
      startAt: agreement.startAt || today(),
      endAt: agreement.endAt || "",
      value: String(agreement.value),
      status: agreement.status,
      notes: agreement.notes || "",
      agreementFile: agreement.agreementFile || "",
      projectUuid: agreement.projectUuid || projectUuid || "",
    });

    setFormOpen(true);
  };

  const closeForm = () => {
    if (busy) return;
    setFormOpen(false);
    setEditingUuid(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.projectUuid.trim()) {
      notify("err", "Project UUID is required.");
      return;
    }

    if (!form.code.trim()) {
      notify("err", "Agreement code is required.");
      return;
    }

    if (!form.partyUuid.trim()) {
      notify("err", "Party UUID is required.");
      return;
    }

    if (!form.signedAt || !form.startAt) {
      notify("err", "Signed date and start date are required.");
      return;
    }

    if (form.endAt && form.endAt < form.startAt) {
      notify("err", "End date cannot be earlier than start date.");
      return;
    }

    if (!Number.isFinite(Number(form.value)) || Number(form.value) < 0) {
      notify("err", "Enter a valid non-negative contract value.");
      return;
    }

    setBusy(true);

    try {
      if (editingUuid) {
        await api.update(editingUuid, form);
      } else {
        await api.create(form);
      }

      setFormOpen(false);
      setEditingUuid(null);

      notify(
        "ok",
        editingUuid
          ? "Agreement updated successfully."
          : "Agreement created successfully.",
      );

      await load();
    } catch (err) {
      notify(
        "err",
        err instanceof Error ? err.message : "Failed to save agreement.",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;

    setBusy(true);

    try {
      await api.remove(target.uuid);

      setDeleteTarget(null);
      setItems((previous) =>
        previous.filter((item) => item.uuid !== target.uuid),
      );

      notify("ok", `${target.code || "Agreement"} deleted.`, async () => {
        try {
          await api.restore(target.uuid);
          notify("ok", "Agreement restored successfully.");
          await load();
        } catch (err) {
          notify(
            "err",
            err instanceof Error ? err.message : "Restore failed.",
          );
        }
      });
    } catch (err) {
      notify(
        "err",
        err instanceof Error ? err.message : "Failed to delete agreement.",
      );
    } finally {
      setBusy(false);
    }
  };

  const openView = async (agreement: ProjectAgreement) => {
    setViewItem(agreement);

    try {
      const latest = await api.get(agreement.uuid);
      setViewItem(latest);
    } catch (err) {
      notify(
        "err",
        err instanceof Error ? err.message : "Could not load agreement details.",
      );
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.party.toLowerCase().includes(query) ||
        (item.notes || "").toLowerCase().includes(query) ||
        (item.partyUuid || "").toLowerCase().includes(query);

      return (
        matchesSearch &&
        (typeFilter === "All" || item.type === typeFilter) &&
        (statusFilter === "All" || item.status === statusFilter)
      );
    });
  }, [items, search, typeFilter, statusFilter]);

  const totalValue = filtered.reduce((sum, item) => sum + item.value, 0);
  const activeCount = items.filter((item) => item.status === "Active").length;
  const expiredCount = items.filter((item) => item.status === "Expired").length;

  const kpis = [
    {
      label: "Portfolio Value",
      value: loading ? "—" : `$${compact(totalValue)}`,
      sub: loading ? "Loading..." : money(totalValue),
      icon: DollarSign,
      tone: "from-indigo-500 to-violet-500",
    },
    {
      label: "Active Contracts",
      value: loading ? "—" : activeCount,
      sub: `${expiredCount} expired`,
      icon: CheckCircle2,
      tone: "from-emerald-500 to-teal-500",
    },
    {
      label: "Total Agreements",
      value: loading ? "—" : items.length,
      sub: `${filtered.length} in current view`,
      icon: FileText,
      tone: "from-sky-500 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 font-sans text-slate-800 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              href="/projects"
              className="flex items-center hover:text-indigo-600"
            >
              <Home className="mr-1 h-4 w-4" />
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span>{projectUuid || "All projects"}</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">Agreements</span>
          </nav>

          <h1 className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Agreements & Contracts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track parties, contract terms, dates and values in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create Agreement
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.label}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{kpi.sub}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.tone} text-white shadow-md`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Agreements table */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={`${inputCls} !w-auto cursor-pointer`}
              aria-label="Filter by agreement type"
            >
              <option value="All">All Types</option>
              {Object.entries(typeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputCls} !w-auto cursor-pointer`}
              aria-label="Filter by agreement status"
            >
              <option value="All">All Statuses</option>
              {Object.entries(statusMeta).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search party, code or notes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {[
                  "Code",
                  "Party",
                  "Type",
                  "Signed",
                  "Term",
                  "Value",
                  "Status",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3.5">
                    {heading}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 8 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
                    <p className="font-semibold text-slate-700">{error}</p>
                    <button
                      type="button"
                      onClick={() => void load()}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((agreement) => {
                  const status =
                    statusMeta[agreement.status] ?? statusMeta.Active;
                  const type =
                    typeTone[agreement.type] ?? typeTone.Service;

                  return (
                    <tr
                      key={agreement.uuid}
                      className="transition-colors hover:bg-indigo-50/40"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600">
                        {agreement.code ||
                          agreement.uuid.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">
                            {(agreement.party || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">
                            {agreement.party || agreement.partyUuid || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${type}`}
                        >
                          {typeLabel[agreement.type] ?? agreement.type}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                        {agreement.signedAt || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {agreement.startAt || "—"} →{" "}
                          {agreement.endAt || "Open"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                        {money(agreement.value)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.cls}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => void openView(agreement)}
                            title="View agreement"
                            className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(agreement)}
                            title="Edit agreement"
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(agreement)}
                            title="Delete agreement"
                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-slate-400">
                      No agreement records found.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>

            {!loading && !error && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 text-sm font-bold">
                  <td
                    colSpan={5}
                    className="px-5 py-3.5 text-right text-xs uppercase tracking-wider text-slate-500"
                  >
                    Total contract value
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-indigo-600">
                    {money(totalValue)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {!loading && !error && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
            Showing <b className="text-slate-700">{filtered.length}</b> of{" "}
            <b className="text-slate-700">{items.length}</b> agreements
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <Modal
          title={editingUuid ? "Edit Agreement" : "Create Agreement"}
          subtitle={editingUuid || undefined}
          onClose={closeForm}
        >
          <form
            onSubmit={submit}
            className="flex-1 space-y-4 overflow-y-auto p-6"
          >
            {!projectUuid && (
              <div>
                <label className={labelCls}>Project UUID *</label>
                <input
                  required
                  value={form.projectUuid}
                  onChange={(event) =>
                    setForm({ ...form, projectUuid: event.target.value })
                  }
                  className={`${inputCls} font-mono`}
                  placeholder="Project UUID"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Agreement Code *</label>
                <input
                  required
                  value={form.code}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                  className={`${inputCls} font-mono`}
                  placeholder="AGR-001"
                />
              </div>

              <div>
                <label className={labelCls}>Status *</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as AgreementStatus,
                    })
                  }
                  className={inputCls}
                >
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Party *</label>
              {parties.length > 0 ? (
                <select
                  required
                  value={form.partyUuid}
                  onChange={(event) =>
                    setForm({ ...form, partyUuid: event.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">Select party...</option>
                  {parties.map((party) => (
                    <option key={party.uuid} value={party.uuid}>
                      {party.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={form.partyUuid}
                  onChange={(event) =>
                    setForm({ ...form, partyUuid: event.target.value })
                  }
                  className={`${inputCls} font-mono`}
                  placeholder="Party UUID"
                />
              )}
            </div>

            <div>
              <label className={labelCls}>Agreement Type *</label>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target.value as AgreementType,
                  })
                }
                className={inputCls}
              >
                {Object.entries(typeLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Signed Date *</label>
                <input
                  type="date"
                  required
                  value={form.signedAt}
                  onChange={(event) =>
                    setForm({ ...form, signedAt: event.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.startAt}
                  onChange={(event) =>
                    setForm({ ...form, startAt: event.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>End Date</label>
                <input
                  type="date"
                  value={form.endAt}
                  min={form.startAt}
                  onChange={(event) =>
                    setForm({ ...form, endAt: event.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Contract Value *</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.value}
                  onChange={(event) =>
                    setForm({ ...form, value: event.target.value })
                  }
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Agreement File URL</label>
              <input
                type="url"
                value={form.agreementFile}
                onChange={(event) =>
                  setForm({ ...form, agreementFile: event.target.value })
                }
                className={inputCls}
                placeholder="https://example.com/agreement.pdf"
              />
              <p className="mt-1 text-xs text-slate-400">
                Enter a file URL if your backend accepts agreementFile.
              </p>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                className={inputCls}
                placeholder="Terms, conditions and notes..."
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingUuid ? "Update Agreement" : "Save Agreement"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View modal */}
      {viewItem && (
        <Modal
          title={viewItem.party || viewItem.code || "Agreement"}
          subtitle={viewItem.code || viewItem.uuid}
          onClose={() => setViewItem(null)}
          maxW="max-w-md"
        >
          <div className="space-y-2.5 overflow-y-auto p-6 text-sm">
            {[
              ["Agreement Code", viewItem.code || "—"],
              ["Party", viewItem.party || viewItem.partyUuid || "—"],
              ["Type", typeLabel[viewItem.type] ?? viewItem.type],
              ["Status", viewItem.status],
              ["Signed", viewItem.signedAt || "—"],
              ["Start", viewItem.startAt || "—"],
              ["End", viewItem.endAt || "Open-ended"],
              ["Value", money(viewItem.value)],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {key}
                </span>
                <span className="break-all text-right font-bold text-slate-800">
                  {value}
                </span>
              </div>
            ))}

            {viewItem.agreementFile && (
              <a
                href={viewItem.agreementFile}
                target="_blank"
                rel="noreferrer"
                className="block break-all rounded-xl bg-indigo-50 p-4 font-semibold text-indigo-700 hover:underline"
              >
                Open agreement file
              </a>
            )}

            {viewItem.notes && (
              <p className="rounded-xl bg-indigo-50/50 p-4 text-slate-600 ring-1 ring-indigo-100">
                {viewItem.notes}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
            <button
              type="button"
              onClick={() => setViewItem(null)}
              className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          title="Delete Agreement?"
          onClose={() => {
            if (!busy) setDeleteTarget(null);
          }}
          maxW="max-w-sm"
        >
          <div className="p-6 text-sm text-slate-600">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <p className="text-center">
              The agreement{" "}
              <b className="text-slate-900">
                {deleteTarget.code || deleteTarget.party || deleteTarget.uuid}
              </b>{" "}
              will be removed.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[70] flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl"
        >
          {notice.type === "ok" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}

          <span>{notice.msg}</span>

          {notice.undo && (
            <button
              type="button"
              onClick={() => {
                const undo = notice.undo;
                setNotice(null);
                void undo();
              }}
              className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   NEXT.JS PAGE
   ========================================================================== */

export default function ProjectAgreementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AgreementsInner />
    </Suspense>
  );
}
