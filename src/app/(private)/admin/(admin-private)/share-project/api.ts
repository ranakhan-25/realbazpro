"use client";

import axios from "axios";
import type { ProjectCategoryRecord, ShareProjectRecord, ShareUserRecord } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("share_project_access_token") ||
      localStorage.getItem("share-project:access-token");
    if (token) {
      config.headers["Authorization"] = ["Bearer", token].join(" ");
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "The Share Project API request failed.";
    return Promise.reject(new Error(Array.isArray(message) ? message.join(", ") : String(message)));
  },
);

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.data)) return body.data as T[];
  if (body.data && typeof body.data === "object") {
    const nested = body.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as T[];
  }
  return [];
}

export async function loginShareAdmin(email: string, password: string) {
  const response = await api.post("/share-user/login", { email, password });
  const payload = response.data as {
    data?: { accessToken?: string; refreshToken?: string; user?: { role?: string } };
    accessToken?: string;
    refreshToken?: string;
    user?: { role?: string };
  };
  const session = payload.data || payload;
  if (!session.accessToken) throw new Error("Share User login did not return an access token.");
  if (session.user?.role !== "super-admin") throw new Error("This account is not a Share Project Super Admin.");
  if (typeof window !== "undefined") {
    localStorage.setItem("share_project_access_token", session.accessToken);
    localStorage.setItem("share-project:access-token", session.accessToken);
    if (session.refreshToken) localStorage.setItem("share-project:refresh-token", session.refreshToken);
  }
  return session;
}

export async function getProjects(params: { status?: string; search?: string; page?: number; limit?: number; trash?: boolean } = {}) {
  const page = params.page || 1;
  const limit = params.limit || 100;
  const status = params.status?.toLowerCase();
  const routes: Record<string, string> = {
    pending: "/share-project/admin/projects/pending",
    approved: "/share-project/admin/projects/approved",
    rejected: "/share-project/admin/projects/rejected",
    published: "/share-project/admin/projects/published",
    unpublished: "/share-project/admin/projects/unpublished",
  };
  const url = params.trash
    ? "/share-project/admin/projects/trash"
    : routes[status || ""] || "/share-project/admin/projects";
  const response = await api.get(url, {
    params: {
      page,
      limit,
      ...(status === undefined && params.search ? { search: params.search } : {}),
    },
  });
  return unwrap<ShareProjectRecord>(response.data);
}

export async function getProject(uuid: string) {
  const response = await api.get(`/share-project/admin/projects/${encodeURIComponent(uuid)}`);
  const payload = response.data as { data?: ShareProjectRecord } | ShareProjectRecord;
  return ("data" in payload && payload.data ? payload.data : payload) as ShareProjectRecord;
}

export async function softDeleteProject(uuid: string) {
  await api.delete(`/share-project/admin/projects/${encodeURIComponent(uuid)}`);
}

export async function restoreProject(uuid: string) {
  await api.patch(`/share-project/admin/projects/${encodeURIComponent(uuid)}/restore`);
}

export async function getCategories() {
  const response = await api.get("/share-project/admin/categories");
  return unwrap<ProjectCategoryRecord>(response.data);
}

export async function createCategory(data: { code: string; name: string; isActive?: boolean }) {
  await api.post("/share-project/admin/categories", data);
}

export async function updateCategory(uuid: string, data: { code?: string; name?: string; isActive?: boolean }) {
  await api.patch(`/share-project/admin/categories/${encodeURIComponent(uuid)}`, data);
}

export async function deleteCategory(uuid: string) {
  await api.delete(`/share-project/admin/categories/${encodeURIComponent(uuid)}`);
}

export async function getShareUsers(params = {}) {
  const response = await api.get("/share-user", { params: { page: 1, limit: 100, ...params } });
  return unwrap<ShareUserRecord>(response.data);
}

export async function createShareUser(data: Record<string, unknown>) {
  await api.post("/share-user/register", data);
}

export async function deleteShareUser(uuid: string) {
  await api.patch(`/share-user/${encodeURIComponent(uuid)}/block`);
}

export async function restoreShareUser(uuid: string) {
  await api.patch(`/share-user/${encodeURIComponent(uuid)}/unblock`);
}

export async function approveProject(uuid: string) {
  await api.post(`/share-project/admin/projects/${encodeURIComponent(uuid)}/approve`);
}

export async function rejectProject(uuid: string, reason: string) {
  await api.post(`/share-project/admin/projects/${encodeURIComponent(uuid)}/reject`, { reason });
}

export async function publishProject(uuid: string) {
  await api.post(`/share-project/admin/projects/${encodeURIComponent(uuid)}/publish`);
}

export async function unpublishProject(uuid: string) {
  await api.post(`/share-project/admin/projects/${encodeURIComponent(uuid)}/unpublish`);
}

export async function getInvestments(params: { page?: number; limit?: number; projectUuid?: string } = {}) {
  const response = await api.get("/share-project/admin/investments", {
    params: { page: params.page || 1, limit: params.limit || 100, ...(params.projectUuid ? { projectUuid: params.projectUuid } : {}) },
  });
  return unwrap<any>(response.data);
}



export async function approveInvestment(uuid: string) {
  await api.post(`/share-project/admin/investments/${encodeURIComponent(uuid)}/approve`);
}

export async function rejectInvestment(uuid: string, reason: string) {
  await api.post(`/share-project/admin/investments/${encodeURIComponent(uuid)}/reject`, { reason });
}
