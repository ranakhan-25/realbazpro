/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Landmark,
  Mail,
  Phone,
  Receipt,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveInvestment,
  approveProject,
  getInvestments,
  getProject,
  publishProject,
  rejectInvestment,
  rejectProject,
  softDeleteInvestment,
  unpublishProject,
} from "../../api";
import type { ShareProjectRecord } from "../../types";
import { ShareProjectAuthGate } from "../../_components/ShareProjectAuthGate";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ShareProjectDetailsPage({ params }: { params: Promise<{ uuid: string }> }) {
  const [project, setProject] = useState<ShareProjectRecord | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoadingUuid, setActionLoadingUuid] = useState<string | null>(null);

  useEffect(() => {
    void params.then(({ uuid: routeUuid }) => {
      Promise.all([
        getProject(routeUuid),
        getInvestments({ projectUuid: routeUuid }).catch(() => []),
      ])
        .then(([proj, invs]) => {
          setProject(proj);
          setInvestments(invs);
        })
        .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load project details."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function reloadProject() {
    if (!project?.uuid) return;
    const [p, invs] = await Promise.all([
      getProject(project.uuid),
      getInvestments({ projectUuid: project.uuid }).catch(() => []),
    ]);
    setProject(p);
    setInvestments(invs);
  }

  async function runAction(action: () => Promise<void>, fallbackMessage: string) {
    setError("");
    try {
      await action();
      await reloadProject();
      setRejecting(false);
      setRejectionReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallbackMessage);
    }
  }

  async function submitRejection(event: React.FormEvent) {
    event.preventDefault();
    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    await runAction(
      () => rejectProject(String(project?.uuid || ""), rejectionReason.trim()),
      "Could not reject project.",
    );
  }

  async function handleApproveInvestment(invUuid: string) {
    if (!window.confirm("Approve this investment?")) return;
    setActionLoadingUuid(invUuid);
    setInvestments((prev) =>
      prev.map((i) => (String(i.uuid) === String(invUuid) ? { ...i, status: "confirmed" } : i))
    );
    try {
      await approveInvestment(invUuid);
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve investment");
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRejectInvestment(invUuid: string) {
    const reason = window.prompt("Rejection reason:");
    if (!reason || !reason.trim()) return;
    setActionLoadingUuid(invUuid);
    setInvestments((prev) =>
      prev.map((i) => (String(i.uuid) === String(invUuid) ? { ...i, status: "cancelled" } : i))
    );
    try {
      await rejectInvestment(invUuid, reason.trim());
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject investment");
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleDeleteInvestment(invUuid: string) {
    if (!window.confirm("Are you sure you want to soft delete this investment?")) return;
    setActionLoadingUuid(invUuid);
    setInvestments((prev) => prev.filter((i) => String(i.uuid) !== String(invUuid)));
    try {
      await softDeleteInvestment(invUuid);
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete investment");
      if (project?.uuid) {
        const invs = await getInvestments({ projectUuid: project.uuid });
        setInvestments(invs);
      }
    } finally {
      setActionLoadingUuid(null);
    }
  }

  const owner = project?.owner && typeof project.owner === "object" ? project.owner as Record<string, unknown> : null;
  const ownerName = owner?.name || project?.creatorName;
  const ownerEmail = owner?.email || project?.creatorEmail;
  const ownerPhone = owner?.phone || project?.creatorPhone;
  const ownerCompany = owner?.companyName || (owner as any)?.company || project?.companyName;
  const ownerStatus = owner?.status;

  const projectFields: [string, string][] = [
    ["Code", project?.code || ""],
    ["Category", project?.category?.name || project?.projectType || ""],
    ["Location", project?.location || ""],
    ["Status", project?.status || ""],
    ["Start Date", formatDate(project?.startDate)],
    ["End Date", formatDate(project?.endDate)],
    ["Investment Amount", project?.totalInvestmentAmount ? Number(project.totalInvestmentAmount).toLocaleString() : ""],
    ["Total Shares", project?.totalShares ? String(project.totalShares) : ""],
    ["Price Per Share", project?.pricePerShare ? Number(project.pricePerShare).toLocaleString() : ""],
    ["Expected Return (%)", project?.expectedAnnualReturn ? String(project.expectedAnnualReturn) : ""],
    ["Submitted", formatDate(project?.createdAt)],
  ];

  const totalCollected = investments
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  const totalSoldShares = investments
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);

  return (
    <ShareProjectAuthGate>
      <div className="space-y-6">
        <Link href="/admin/share-project" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />Back to Share Project Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{loading ? "Project Details" : project?.name || project?.code || "Project Details"}</h1>
          <p className="mt-1 text-sm text-slate-500">Project information, creator details, and all investments.</p>
        </div>
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            Loading project...
          </div>
        ) : project ? (
          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              {/* Project info & creator */}
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <h2 className="font-semibold text-slate-900">Project Information</h2>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    {projectFields.map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs text-slate-400">{label}</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-800">{value == null || value === "" ? "-" : value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5">
                    <p className="text-xs text-slate-400">Description</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{project.description || "-"}</p>
                  </div>
                </div>

                {/* Creator info */}
                {(project.creatorName || project.creatorEmail || project.creatorPhone || project.companyName) && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-900">Project Creator</h2>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      {project.creatorName && (
                        <div className="flex items-start gap-3">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <dt className="text-xs text-slate-400">Name</dt>
                            <dd className="mt-0.5 text-sm font-medium text-slate-800">{project.creatorName}</dd>
                          </div>
                        </div>
                      )}
                      {project.creatorEmail && (
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <dt className="text-xs text-slate-400">Email</dt>
                            <dd className="mt-0.5 text-sm font-medium text-slate-800">{project.creatorEmail}</dd>
                          </div>
                        </div>
                      )}
                      {project.creatorPhone && (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <dt className="text-xs text-slate-400">Phone</dt>
                            <dd className="mt-0.5 text-sm font-medium text-slate-800">{project.creatorPhone}</dd>
                          </div>
                        </div>
                      )}
                      {project.companyName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <dt className="text-xs text-slate-400">Company</dt>
                            <dd className="mt-0.5 text-sm font-medium text-slate-800">{project.companyName}</dd>
                          </div>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                {/* Owner */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-semibold text-slate-900">Project Owner</h2>
                    {(ownerStatus || project?.status) && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {String(ownerStatus || "Active")}
                      </span>
                    )}
                  </div>
                  {ownerName || ownerEmail || ownerPhone ? (
                    <div className="mt-4 space-y-3.5">
                      {ownerName && (
                        <div className="flex items-start gap-3">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Name</p>
                            <p className="text-sm font-medium text-slate-800">{String(ownerName)}</p>
                          </div>
                        </div>
                      )}
                      {ownerEmail && (
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Email</p>
                            <p className="text-sm font-medium text-slate-800">{String(ownerEmail)}</p>
                          </div>
                        </div>
                      )}
                      {ownerPhone && (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Phone</p>
                            <p className="text-sm font-medium text-slate-800">{String(ownerPhone)}</p>
                          </div>
                        </div>
                      )}
                      {ownerCompany && (
                        <div className="flex items-start gap-3">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Company</p>
                            <p className="text-sm font-medium text-slate-800">{String(ownerCompany)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Owner information is not available.</p>
                  )}
                </div>

                {/* Workflow Actions */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-semibold text-slate-900">Workflow Actions</h2>
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!project.uuid}
                      onClick={() => {
                        if (window.confirm("Approve this project?")) void runAction(() => approveProject(project.uuid || ""), "Could not approve project.");
                      }}
                    >
                      <CheckCircle2 />Approve
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setRejecting(true)}>
                      <XCircle />Reject
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!project.uuid}
                      onClick={() => {
                        if (window.confirm("Publish this project publicly? An email will be sent to the creator.")) {
                          void runAction(() => publishProject(project.uuid || ""), "Could not publish project.");
                        }
                      }}
                    >
                      <Eye />Publish
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!project.uuid}
                      onClick={() => {
                        if (window.confirm("Unpublish this project?")) void runAction(() => unpublishProject(project.uuid || ""), "Could not unpublish project.");
                      }}
                    >
                      <EyeOff />Unpublish
                    </Button>
                  </div>
                </div>
              </aside>
            </div>

            {/* Investments Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Project Investments ({investments.length})</h2>
                  <p className="text-xs text-slate-500">All investments submitted for this project.</p>
                </div>
              </div>

              {/* Investment KPIs */}
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Investors</span>
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{investments.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Shares Sold</span>
                    <Landmark className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {totalSoldShares} {project.totalShares ? `/ ${project.totalShares}` : ""}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Collected</span>
                    <Receipt className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    ৳ {totalCollected.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Investment Table */}
              <div className="mt-6 overflow-x-auto">
                {investments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No investments submitted for this project yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-500">
                        <th className="py-3 pr-4">Code</th>
                        <th className="py-3 pr-4">Investor</th>
                        <th className="py-3 pr-4">Contact</th>
                        <th className="py-3 pr-4">Shares</th>
                        <th className="py-3 pr-4">Total Amount</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv) => (
                        <tr key={String(inv.uuid || inv.id)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 pr-4 font-mono text-xs text-slate-500">{inv.code || "-"}</td>
                          <td className="py-3 pr-4 font-medium text-slate-800">
                            {inv.investorName || inv.investor?.name || inv.investorEmail || inv.investor?.email || "-"}
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-500">
                            <div>{inv.investorEmail || inv.investor?.email || "-"}</div>
                            <div>{inv.investorPhone || inv.investor?.phone || ""}</div>
                          </td>
                          <td className="py-3 pr-4 font-semibold">{inv.quantity}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            ৳ {Number(inv.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                inv.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : inv.status === "cancelled"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-500">
                            {inv.createdAt ? formatDate(inv.createdAt) : "-"}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status === "prepared" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionLoadingUuid === inv.uuid}
                                    onClick={() => handleApproveInvestment(String(inv.uuid))}
                                    className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {actionLoadingUuid === inv.uuid ? "..." : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoadingUuid === inv.uuid}
                                    onClick={() => handleRejectInvestment(String(inv.uuid))}
                                    className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {actionLoadingUuid === inv.uuid ? "..." : "Reject"}
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                title="Soft Delete Investment"
                                disabled={actionLoadingUuid === inv.uuid}
                                onClick={() => handleDeleteInvestment(String(inv.uuid))}
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
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            Project not found.
          </div>
        )}

        {rejecting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <form onSubmit={submitRejection} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Reject Project</h2>
              <p className="mt-1 text-sm text-slate-500">A rejection reason is required.</p>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Rejection reason
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2ed573]"
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Reject Project
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ShareProjectAuthGate>
  );
}
