"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjects, softDeleteProject, restoreProject } from "../api";
import type { ShareProjectRecord, ShareProjectStatus } from "../types";
import { ShareProjectTable } from "./ShareProjectTable";
import { ShareProjectAuthGate } from "./ShareProjectAuthGate";

type Props = {
  title: string;
  description?: string;
  status?: ShareProjectStatus;
  trash?: boolean;
};

export function ShareProjectPage({ title, description, status, trash = false }: Props) {
  const [projects, setProjects] = useState<ShareProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProjects(await getProjects({ status, trash }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [status, trash]);

  useEffect(() => { void load(); }, [load]);

  async function remove(project: ShareProjectRecord) {
    if (!project.uuid || !window.confirm(`Soft delete "${project.name || project.code || "project"}"?`)) return;
    try {
      await softDeleteProject(project.uuid);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete project.");
    }
  }

  async function restore(project: ShareProjectRecord) {
    if (!project.uuid || !window.confirm(`Restore "${project.name || project.code || "project"}"?`)) return;
    try {
      await restoreProject(project.uuid);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore project.");
    }
  }

  return (
    <ShareProjectAuthGate>
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      )}
      <ShareProjectTable projects={projects} status={status} trash={trash} loading={loading} onDelete={remove} onRestore={restore} />
    </div>
    </ShareProjectAuthGate>
  );
}
