"use client";

import Link from "next/link";
import { RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ShareProjectRecord, ShareProjectStatus } from "../types";

type Props = {
  projects: ShareProjectRecord[];
  status?: ShareProjectStatus;
  trash?: boolean;
  loading?: boolean;
  onDelete?: (project: ShareProjectRecord) => void;
  onRestore?: (project: ShareProjectRecord) => void;
};

function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ShareProjectTable({
  projects,
  status,
  trash = false,
  loading = false,
  onDelete,
  onRestore,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 10;

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesStatus =
        !status ||
        String(project.status || "").toLowerCase() === status ||
        (status === "approved" && String(project.status || "").toUpperCase() === "COMPLETED") ||
        (status === "published" && String(project.status || "").toUpperCase() === "ACTIVE");
      const text = `${project.name || ""} ${project.code || ""} ${project.location || ""} ${project.projectType || ""}`.toLowerCase();
      return matchesStatus && (!query || text.includes(query));
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sort === "oldest") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [projects, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const visible = rows.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search projects..." className="pl-9" />
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none"
          aria-label="Sort projects"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Project name</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">Loading projects...</TableCell></TableRow>
            ) : visible.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">No projects found.</TableCell></TableRow>
            ) : visible.map((project) => (
              <TableRow key={String(project.uuid || project.id || project.code)}>
                <TableCell>
                  <Link href={`/admin/share-project/projects/${encodeURIComponent(project.uuid || String(project.id || project.code || ""))}`} className="font-medium text-slate-900 hover:text-[#2ed573]">
                    {project.name || project.code || "Untitled project"}
                  </Link>
                  {project.code && <p className="mt-1 text-xs text-slate-400">{project.code}</p>}
                </TableCell>
                <TableCell>{project.projectType || "-"}</TableCell>
                <TableCell>{project.location || "-"}</TableCell>
                <TableCell><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabel(project.status)}</span></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/share-project/projects/${encodeURIComponent(project.uuid || String(project.id || project.code || ""))}`}>
                      <Button variant="outline" size="sm">Review</Button>
                    </Link>
                    {!trash && onDelete && (
                      <Button variant="ghost" size="icon" aria-label={`Delete ${project.name || "project"}`} onClick={() => onDelete(project)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    {trash && onRestore && (
                      <Button variant="ghost" size="icon" aria-label={`Restore ${project.name || "project"}`} onClick={() => onRestore(project)}>
                        <RotateCcw className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
