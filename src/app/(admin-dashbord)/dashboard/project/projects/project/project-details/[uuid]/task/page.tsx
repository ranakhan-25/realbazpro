/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { projectFetch } from "@/app/(admin-dashbord)/dashboard/project/project-fetch";


import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Task {
  id: string | number;
  uuid: string;
  uid: string;
  taskName: string;
  progress: number;
  priority: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: string;
  completeDate: string;
  budget: number;
  cost: number;
  projectId?: string | null;
  deletedAt?: string | null;
  parentTaskId?: string | null;
}

function getRows<T>(payload: unknown): T[] {
  let value = payload;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(value)) return value as T[];
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    value = record.data ?? record.rows ?? record.items;
  }
  return [];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

// ---------- Main Task Page ----------
export default function TaskPage() {
  const { uuid } = useParams();
  const projectUuid = String(uuid);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [assigningTask, setAssigningTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  // API থেকে টাস্ক লিস্ট ফেচ
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      // আপনার API এন্ডপয়েন্ট
      const res = await projectFetch(`${API_BASE}/realbizpro/api/v1/task?page=1&limit=100&projectId=${encodeURIComponent(projectUuid)}`);
      const json = await res.json();
      
      if (!res.ok || json.success === false) throw new Error(json.message || `Task request failed (${res.status}).`);
      const projectTasks = getRows<Task>(json).filter((task) => !task.deletedAt && task.projectId === projectUuid);
      setTasks(projectTasks);
      setUnassignedTasks([]);
      if (projectTasks.length === 0) {
        try {
          const looseResponse = await projectFetch(`${API_BASE}/realbizpro/api/v1/task?page=1&limit=100`, { cache: "no-store" });
          const loosePayload: unknown = await looseResponse.json().catch(() => null);
          if (looseResponse.ok) setUnassignedTasks(getRows<Task>(loosePayload).filter((task) => !task.deletedAt && !task.projectId));
        } catch {
          // Keep the project-specific empty state if unassigned records cannot be fetched.
        }
      }
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : "Could not load project tasks.");
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  const assignTaskToProject = async (task: Task) => {
    if (!window.confirm(`Assign "${task.taskName}" to this project?`)) return;
    setAssigningTask(task.uuid);
    try {
      const response = await projectFetch(`${API_BASE}/realbizpro/api/v1/task/${encodeURIComponent(task.uuid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectUuid }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || `Could not assign task (${response.status}).`);
      toast.success("Task linked to this project.");
      await fetchTasks();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not assign task to this project.");
    } finally {
      setAssigningTask("");
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => setIsAddModalOpen(true)} className="bg-teal-500 text-white p-2 rounded hover:bg-teal-600">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-indigo-600 text-white text-xs uppercase">
            <tr>
              {["#", "TASK", "UNDER", "PROGRESS", "START", "END", "DURATION", "STATUS", "COMPLETE DATE", "PRIORITY", "BUDGET", "COST", "AVAILABLE", "COMPLETED"].map(h => (
                <th key={h} className="px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={14} className="text-center py-6 text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : loadError ? (
              <tr><td colSpan={14} className="text-center py-6 text-red-600">{loadError}</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={14} className="text-center py-6 text-gray-500">No tasks are linked to this project yet. Older tasks without a project assignment are not included here. Create a task below to add project-specific data.</td></tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task.uuid || idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 text-indigo-600 font-medium">{task.taskName}</td>
                  <td className="px-3 py-2">{tasks.find((parent) => parent.uuid === task.parentTaskId)?.taskName || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{task.startDate}</td>
                  <td className="px-3 py-2">{task.endDate}</td>
                  <td className="px-3 py-2">{task.duration}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${task.status === 'In Progress' ? 'bg-indigo-500 text-white' : task.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{task.completeDate}</td>
                  <td className="px-3 py-2">
                    <span className="bg-gray-400 text-white px-2 py-1 rounded text-xs">{task.priority}</span>
                  </td>
                  <td className="px-3 py-2">{task.budget?.toLocaleString()}</td>
                  <td className="px-3 py-2">{task.cost?.toLocaleString()}</td>
                  <td className="px-3 py-2">{(task.budget - task.cost)?.toLocaleString()}</td>
                  <td className="px-3 py-2">0%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {unassignedTasks.length > 0 && (
        <section className="mt-4 overflow-x-auto rounded-md border bg-white">
          <div className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-900">Existing tasks without a project link. Assign only the tasks that belong here.</div>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="px-3 py-2">TASK</th><th className="px-3 py-2">CODE</th><th className="px-3 py-2">STATUS</th><th className="px-3 py-2 text-right">ACTION</th></tr></thead>
            <tbody className="divide-y">{unassignedTasks.map((task) => <tr key={task.uuid}><td className="px-3 py-2">{task.taskName}</td><td className="px-3 py-2">{task.uid || "—"}</td><td className="px-3 py-2">{task.status || "—"}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => void assignTaskToProject(task)} disabled={assigningTask === task.uuid} className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">{assigningTask === task.uuid ? "Assigning…" : "Assign to this project"}</button></td></tr>)}</tbody>
          </table>
        </section>
      )}

      {/* Task Add Modal */}
      {isAddModalOpen && (
        <TaskAddModal projectUuid={projectUuid} parentTasks={tasks}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchTasks();
          }} 
        />
      )}
    </div>
  );
}

// ---------- Task Add Modal (API Integration) ----------
function TaskAddModal({ projectUuid, parentTasks, onClose, onSuccess }: { projectUuid: string, parentTasks: Task[], onClose: () => void, onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // ✅ projectId বাদ দেওয়া হয়েছে
    const payload = {
      projectId: projectUuid,
      parentTaskId: formData.get("parentTaskId") || null,
      taskName: formData.get("taskName"),
      status: formData.get("status"), // সঠিক ভ্যালু: In Progress, Completed, Pending, Delayed
      priority: formData.get("priority"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      duration: formData.get("duration"),
      budget: Number(formData.get("budget")) || 0,
      cost: Number(formData.get("cost")) || 0,
      progress: Number(formData.get("progress")) || 0,
    };

    try {
      // ✅ রিয়েল API POST কল
      const res = await projectFetch(`${API_BASE}/realbizpro/api/v1/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success !== false) {
        toast.success("Task Created Successfully!");
        onSuccess();
      } else {
        toast.error(json.message || "Failed to create task");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Task Add</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Under Task (optional)</label>
            <select name="parentTaskId" defaultValue="" className="w-full border rounded px-3 py-2 text-sm">
              <option value="">{parentTasks.length ? "Select parent task" : "No other project tasks yet"}</option>
              {parentTasks.map((task) => <option key={task.uuid} value={task.uuid}>{task.taskName}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Task Name</label>
            <input name="taskName" type="text" required placeholder="Enter Task Name" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select name="status" className="w-full border rounded px-3 py-2 text-sm">
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Priority</label>
            <select name="priority" className="w-full border rounded px-3 py-2 text-sm">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Progress (%)</label>
            <input name="progress" type="number" defaultValue="0" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Duration (Days)</label>
            <input name="duration" type="text" placeholder="e.g. 60 Days" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input name="startDate" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input name="endDate" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Budget</label>
            <input name="budget" type="number" placeholder="Budget" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Cost</label>
            <input name="cost" type="number" defaultValue="0" min="0" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
