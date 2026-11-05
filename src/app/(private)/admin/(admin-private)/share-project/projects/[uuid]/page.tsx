"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveProject, getProject, publishProject, rejectProject, unpublishProject } from "../../api";
import type { ShareProjectRecord } from "../../types";
import { ShareProjectAuthGate } from "../../_components/ShareProjectAuthGate";

export default function ShareProjectDetailsPage({ params }: { params: Promise<{ uuid: string }> }) {
  const [project, setProject] = useState<ShareProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    void params.then(({ uuid: routeUuid }) => {
      void getProject(routeUuid)
        .then(setProject)
        .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load project details."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function reloadProject() {
    if (!project?.uuid) return;
    setProject(await getProject(project.uuid));
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

  const owner = project?.owner && typeof project.owner === "object" ? project.owner as Record<string, unknown> : null;
  return (
    <ShareProjectAuthGate>
    <div className="space-y-5">
      <Link href="/admin/share-project/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to projects</Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{loading ? "Project Details" : project?.name || project?.code || "Project Details"}</h1>
        <p className="mt-1 text-sm text-slate-500">Share Project review and management</p>
      </div>
      {error && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      {loading ? <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Loading project...</div> : project ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">Project Information</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[["Code", project.code], ["Category", project.projectType], ["Location", project.location], ["Status", project.status], ["Start Date", project.startDate], ["End Date", project.endDate], ["Investment Amount", project.totalBudget]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value == null || value === "" ? "-" : String(value)}</dd></div>
              ))}
            </dl>
            <div className="mt-5"><p className="text-xs text-slate-400">Description</p><p className="mt-2 text-sm leading-6 text-slate-600">{project.description || "-"}</p></div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Project Owner</h2>
              {owner ? <dl className="mt-4 space-y-3">{Object.entries(owner).slice(0, 8).map(([key, value]) => <div key={key}><dt className="text-xs text-slate-400">{key}</dt><dd className="mt-1 text-sm text-slate-700">{String(value ?? "-")}</dd></div>)}</dl> : <p className="mt-3 text-sm text-slate-500">Owner information is not available.</p>}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Workflow Actions</h2>
              <div className="mt-4 space-y-2">
                <Button className="w-full" variant="outline" disabled={!project.uuid} onClick={() => { if (window.confirm("Approve this project?")) void runAction(() => approveProject(project.uuid || ""), "Could not approve project."); }}><CheckCircle2 />Approve</Button>
                <Button className="w-full" variant="outline" onClick={() => setRejecting(true)}><XCircle />Reject</Button>
                <Button className="w-full" variant="outline" disabled={!project.uuid} onClick={() => { if (window.confirm("Publish this project publicly?")) void runAction(() => publishProject(project.uuid || ""), "Could not publish project."); }}><Eye />Publish</Button>
                <Button className="w-full" variant="outline" disabled={!project.uuid} onClick={() => { if (window.confirm("Unpublish this project?")) void runAction(() => unpublishProject(project.uuid || ""), "Could not unpublish project."); }}><EyeOff />Unpublish</Button>
              </div>
            </div>
          </aside>
        </div>
      ) : <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Project not found.</div>}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submitRejection} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reject Project</h2>
            <p className="mt-1 text-sm text-slate-500">A rejection reason is required.</p>
            <label className="mt-4 block text-sm font-medium text-slate-700">Rejection reason<textarea required value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={5} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2ed573]" /></label>
            <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRejecting(false)}>Cancel</Button><Button type="submit" variant="destructive">Reject Project</Button></div>
          </form>
        </div>
      )}
    </div>
    </ShareProjectAuthGate>
  );
}
