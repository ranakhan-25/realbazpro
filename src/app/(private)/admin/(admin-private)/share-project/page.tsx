"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import {
  Building2,
  CircleCheck,
  Clock3,
  FolderClosed,
  Landmark,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import {
  approveInvestment,
  getCategories,
  getInvestments,
  getProjects,
  getShareUsers,
  rejectInvestment,
  restoreInvestment,
  softDeleteInvestment,
} from "./api";
import type { ShareProjectRecord } from "./types";
import { ShareProjectPage } from "./_components/ShareProjectPage";
import ShareUsersPage from "./users/page";
import ProjectCategoriesPage from "./categories/page";
import { ShareProjectAuthGate } from "./_components/ShareProjectAuthGate";

const card = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

type Tab =
  | "overview"
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "published"
  | "unpublished"
  | "trash"
  | "investments"
  | "users"
  | "categories";

export default function ShareProjectDashboardPage() {
  const [projects, setProjects] = useState<ShareProjectRecord[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [trashCount, setTrashCount] = useState<number | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [trashInvestments, setTrashInvestments] = useState<any[]>([]);
  const [investmentTrashView, setInvestmentTrashView] = useState(false);
  const [investmentActionError, setInvestmentActionError] = useState("");
  const [actionLoadingUuid, setActionLoadingUuid] = useState<string | null>(
    null,
  );

  async function loadInvestments() {
    try {
      const rows = await getInvestments();
      setInvestments(rows);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadTrashInvestments() {
    try {
      const rows = await getInvestments({ trash: true });
      setTrashInvestments(rows);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleApproveInvestment(uuid: string) {
    if (!window.confirm("Approve this investment?")) return;
    setActionLoadingUuid(uuid);
    setInvestmentActionError("");
    setInvestments((prev) =>
      prev.map((inv) =>
        String(inv.uuid) === String(uuid)
          ? { ...inv, status: "confirmed" }
          : inv,
      ),
    );
    try {
      await approveInvestment(uuid);
      await loadInvestments();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to approve investment.";
      setInvestmentActionError(msg);
      await loadInvestments();
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRejectInvestment(uuid: string) {
    const reason = window.prompt("Rejection reason:");
    if (!reason || !reason.trim()) return;
    setActionLoadingUuid(uuid);
    setInvestmentActionError("");
    setInvestments((prev) =>
      prev.map((inv) =>
        String(inv.uuid) === String(uuid)
          ? { ...inv, status: "cancelled" }
          : inv,
      ),
    );
    try {
      await rejectInvestment(uuid, reason.trim());
      await loadInvestments();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to reject investment.";
      setInvestmentActionError(msg);
      await loadInvestments();
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleDeleteInvestment(uuid: string) {
    if (!window.confirm("Are you sure you want to soft delete this investment?")) return;
    setActionLoadingUuid(uuid);
    setInvestmentActionError("");
    setInvestments((prev) => prev.filter((inv) => String(inv.uuid) !== String(uuid)));
    try {
      await softDeleteInvestment(uuid);
      await Promise.all([loadInvestments(), loadTrashInvestments()]);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to delete investment.";
      setInvestmentActionError(msg);
      await loadInvestments();
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRestoreInvestment(uuid: string) {
    if (!window.confirm("Are you sure you want to restore this investment?")) return;
    setActionLoadingUuid(uuid);
    setInvestmentActionError("");
    setTrashInvestments((prev) => prev.filter((inv) => String(inv.uuid) !== String(uuid)));
    try {
      await restoreInvestment(uuid);
      await Promise.all([loadInvestments(), loadTrashInvestments()]);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to restore investment.";
      setInvestmentActionError(msg);
      await loadTrashInvestments();
    } finally {
      setActionLoadingUuid(null);
    }
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    void Promise.all([
      getProjects(),
      getShareUsers(),
      getCategories(),
      getProjects({ trash: true }),
      getInvestments(),
      getInvestments({ trash: true }),
    ])
      .then(
        ([projectRows, userRows, categoryRows, trashRows, investmentRows, trashInvestmentRows]) => {
          setProjects(projectRows);
          setUserCount(userRows.length);
          setCategoryCount(categoryRows.length);
          setTrashCount(trashRows.length);
          setInvestments(investmentRows);
          setTrashInvestments(trashInvestmentRows);
        },
      )
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load dashboard data.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const pending = projects.filter(
    (project) => String(project.status || "").toUpperCase() === "PENDING",
  ).length;
  const completed = projects.filter(
    (project) => String(project.status || "").toUpperCase() === "APPROVED",
  ).length;

  const cards = [
    {
      label: "All Projects",
      value: projects.length,
      icon: Building2,
      tab: "all" as Tab,
    },
    { label: "Pending", value: pending, icon: Clock3, tab: "pending" as Tab },
    {
      label: "Approved",
      value: completed,
      icon: CircleCheck,
      tab: "approved" as Tab,
    },
    {
      label: "Share Users",
      value: userCount ?? "-",
      icon: Users,
      tab: "users" as Tab,
    },
    {
      label: "Categories",
      value: categoryCount ?? "-",
      icon: FolderClosed,
      tab: "categories" as Tab,
    },
    {
      label: "Trash",
      value: trashCount ?? "-",
      icon: Trash2,
      tab: "trash" as Tab,
    },
    {
      label: "Investments",
      value: investments.length,
      icon: Landmark,
      tab: "investments" as Tab,
    },
  ];

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Dashboard" },
    { key: "all", label: "All Projects" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "published", label: "Published" },
    { key: "unpublished", label: "Unpublished" },
    { key: "trash", label: "Trash" },
    { key: "investments", label: "Investments" },
    { key: "users", label: "Share Users" },
    { key: "categories", label: "Categories" },
  ];

  return (
    <ShareProjectAuthGate>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Share Project Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review projects, users and project categories.
          </p>
        </div>

        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "border-[#2ed573] text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map(({ label, value, icon: Icon, tab }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`${card} text-left transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {loading ? "..." : value}
                      </p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className={card}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-semibold text-slate-900">
                  Recent Projects
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="text-sm font-medium text-[#2ed573]"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <p className="py-6 text-sm text-slate-500">Loading...</p>
                ) : projects.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">
                    No projects found.
                  </p>
                ) : (
                  projects.slice(0, 6).map((project) => (
                    <button
                      key={String(project.uuid || project.id)}
                      type="button"
                      onClick={() => setActiveTab("all")}
                      className="flex w-full items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        {project.name || project.code || "Untitled project"}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {project.status || "Unknown"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "all" && (
          <ShareProjectPage
            title="All Projects"
            description="Review and manage all Share Project submissions."
          />
        )}
        {activeTab === "pending" && (
          <ShareProjectPage
            title="Pending Projects"
            description="Projects waiting for approval."
            status="pending"
          />
        )}
        {activeTab === "approved" && (
          <ShareProjectPage
            title="Approved Projects"
            description="Approved projects ready for publication."
            status="approved"
          />
        )}
        {activeTab === "rejected" && (
          <ShareProjectPage
            title="Rejected Projects"
            description="Projects rejected with a review reason."
            status="rejected"
          />
        )}
        {activeTab === "published" && (
          <ShareProjectPage
            title="Published Projects"
            description="Projects currently visible publicly."
            status="published"
          />
        )}
        {activeTab === "unpublished" && (
          <ShareProjectPage
            title="Unpublished Projects"
            description="Approved projects not currently published."
            status="unpublished"
          />
        )}
        {activeTab === "trash" && (
          <ShareProjectPage
            title="Trash"
            description="Soft-deleted projects."
            trash
          />
        )}
        {activeTab === "investments" && (
          <div className={card}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {investmentTrashView ? "Trash Investments" : "Prepared Investments"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {investmentTrashView
                    ? "Soft-deleted investments. Super Admin can restore them anytime."
                    : "Confirmed and prepared investments submitted from public project pages."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvestmentTrashView(false);
                    void loadInvestments();
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    !investmentTrashView
                      ? "bg-[#2ed573] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Active ({investments.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvestmentTrashView(true);
                    void loadTrashInvestments();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    investmentTrashView
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Trash ({trashInvestments.length})
                </button>
              </div>
            </div>

            {investmentActionError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {investmentActionError}
              </div>
            )}

            {loading ? (
              <p className="py-6 text-sm text-slate-500">Loading...</p>
            ) : !investmentTrashView ? (
              investments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No active investments found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-500">
                        <th className="py-3 pr-4">Investor</th>
                        <th className="py-3 pr-4">Project</th>
                        <th className="py-3 pr-4">Shares</th>
                        <th className="py-3 pr-4">Total</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((investment) => (
                        <tr
                          key={String(investment.uuid)}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="py-3 pr-4 font-medium text-slate-800">
                            <div className="font-semibold text-slate-900">
                              {investment.investorName ||
                                investment.investor?.name ||
                                investment.investorEmail ||
                                investment.investor?.email ||
                                "-"}
                            </div>
                            {(investment.investorEmail || investment.investorPhone || investment.investor?.email) && (
                              <div className="text-xs text-slate-400">
                                {investment.investorEmail || investment.investor?.email}
                                {(investment.investorPhone || investment.investor?.phone)
                                  ? ` • ${investment.investorPhone || investment.investor?.phone}`
                                  : ""}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {investment.project?.uuid ||
                            investment.projectUuid ? (
                              <Link
                                href={`/admin/share-project/projects/${investment.project?.uuid || investment.projectUuid}`}
                                className="font-semibold text-emerald-600 hover:underline"
                              >
                                {investment.project?.name || "View Project"}
                              </Link>
                            ) : (
                              <span>{investment.project?.name || "-"}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">{investment.quantity}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            {Number(investment.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                investment.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : investment.status === "cancelled"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {investment.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-500">
                            {investment.createdAt
                              ? new Date(investment.createdAt).toLocaleDateString(
                                  "en-GB",
                                )
                              : "-"}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {investment.status === "prepared" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionLoadingUuid === investment.uuid}
                                    onClick={() =>
                                      handleApproveInvestment(String(investment.uuid))
                                    }
                                    className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {actionLoadingUuid === investment.uuid ? "..." : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoadingUuid === investment.uuid}
                                    onClick={() =>
                                      handleRejectInvestment(String(investment.uuid))
                                    }
                                    className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {actionLoadingUuid === investment.uuid ? "..." : "Reject"}
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                title="Soft Delete Investment"
                                disabled={actionLoadingUuid === investment.uuid}
                                onClick={() =>
                                  handleDeleteInvestment(String(investment.uuid))
                                }
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : trashInvestments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No soft-deleted investments found in trash.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="py-3 pr-4">Investor</th>
                      <th className="py-3 pr-4">Project</th>
                      <th className="py-3 pr-4">Shares</th>
                      <th className="py-3 pr-4">Total</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Deleted At</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashInvestments.map((investment) => (
                      <tr
                        key={String(investment.uuid)}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-800">
                          <div className="font-semibold text-slate-900">
                              {investment.investorName ||
                                investment.investor?.name ||
                                investment.investorEmail ||
                                investment.investor?.email ||
                                "-"}
                            </div>
                            {(investment.investorEmail || investment.investorPhone || investment.investor?.email) && (
                              <div className="text-xs text-slate-400">
                                {investment.investorEmail || investment.investor?.email}
                                {(investment.investorPhone || investment.investor?.phone)
                                  ? ` • ${investment.investorPhone || investment.investor?.phone}`
                                  : ""}
                              </div>
                            )}
                        </td>
                        <td className="py-3 pr-4">
                          {investment.project?.uuid ||
                          investment.projectUuid ? (
                            <Link
                              href={`/admin/share-project/projects/${investment.project?.uuid || investment.projectUuid}`}
                              className="font-semibold text-emerald-600 hover:underline"
                            >
                              {investment.project?.name || "View Project"}
                            </Link>
                          ) : (
                            <span>{investment.project?.name || "-"}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">{investment.quantity}</td>
                        <td className="py-3 pr-4 font-semibold text-slate-900">
                          {Number(investment.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {investment.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {investment.deletedAt
                            ? new Date(investment.deletedAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Restore Investment"
                              disabled={actionLoadingUuid === investment.uuid}
                              onClick={() =>
                                handleRestoreInvestment(String(investment.uuid))
                              }
                              className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {actionLoadingUuid === investment.uuid ? "..." : "Restore"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "users" && <ShareUsersPage />}
        {activeTab === "categories" && <ProjectCategoriesPage />}
      </div>
    </ShareProjectAuthGate>
  );
}
