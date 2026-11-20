import axios from "axios";
import { showAlert } from "./swal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

import { adminAuthStorage } from "./admin-auth/adminAuthStorage";

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      adminAuthStorage.getAccessToken() ||
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");
    if (token) {
      if (config.headers?.set) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const orgId =
      localStorage.getItem("realbiz_cs_selected_org_id") ||
      localStorage.getItem("selected_org_id") ||
      (typeof adminAuthStorage.getStoredUserProfile === "function"
        ? adminAuthStorage.getStoredUserProfile()?.orgId
        : typeof adminAuthStorage.getUserProfile === "function"
        ? adminAuthStorage.getUserProfile()?.orgId
        : undefined);
    if (orgId && !config.headers?.["x-organization-id"]) {
      if (config.headers?.set) {
        config.headers.set("x-organization-id", String(orgId));
      } else {
        config.headers = config.headers || {};
        config.headers["x-organization-id"] = String(orgId);
      }
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function formatApiErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const data = error.response?.data;
  if (!data) return error.message || "An unexpected network error occurred.";

  const detailMessages: string[] = [];

  const genericMessages = new Set([
    "validation failed",
    "validation error",
    "bad request",
    "an error occurred",
    "error",
  ]);

  if (Array.isArray(data.message)) {
    detailMessages.push(...data.message.filter(Boolean).map(String));
  } else if (
    typeof data.message === "string" &&
    data.message.trim() &&
    !genericMessages.has(data.message.trim().toLowerCase())
  ) {
    detailMessages.push(data.message.trim());
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parseErrors = (errs: any[], prefix = "") => {
      for (const item of errs) {
        const fieldName = prefix
          ? `${prefix}.${item.field || item.property || item.path || ""}`
          : item.field || item.property || item.path || "";

        // 1. class-validator format (array of strings)
        if (Array.isArray(item.errors) && item.errors.length > 0) {
          const joined = item.errors.join(", ");
          detailMessages.push(fieldName ? `${fieldName}: ${joined}` : joined);
        }
        // 2. Sequelize / PostgreSQL format ({ field, message, value })
        else if (typeof item.message === "string" && item.message.trim()) {
          const valStr =
            item.value !== undefined &&
            item.value !== null &&
            String(item.value).trim()
              ? ` ("${item.value}")`
              : "";
          const msg = item.message.trim();
          detailMessages.push(
            fieldName && !msg.toLowerCase().includes(fieldName.toLowerCase())
              ? `${fieldName}: ${msg}${valStr}`
              : `${msg}${valStr}`,
          );
        }

        if (Array.isArray(item.children) && item.children.length > 0) {
          parseErrors(item.children, fieldName);
        }
      }
    };
    parseErrors(data.errors);
  }

  if (detailMessages.length > 0) {
    return Array.from(new Set(detailMessages)).join("; ");
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (data.error && typeof data.error === "string") {
    return data.error;
  }

  return error.message || "Validation failed";
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.data) {
      const formatted = formatApiErrorMessage(error);
      if (formatted) {
        error.response.data.message = formatted;
      }
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // Avoid infinite loop on auth endpoints
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      const refreshToken =
        adminAuthStorage.getRefreshToken() ||
        localStorage.getItem("admin_refresh_token") ||
        localStorage.getItem("refreshToken");

      if (!refreshToken) {
        adminAuthStorage.clear();
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers?.set) {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
            } else {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const resData = refreshResponse.data;
        const newAccessToken = resData.accessToken || resData.data?.accessToken;
        const newRefreshToken =
          resData.refreshToken || resData.data?.refreshToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }

        adminAuthStorage.setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers?.set) {
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${newAccessToken}`,
          );
        } else {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        adminAuthStorage.clear();
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  tone: "accent" | "success" | "warning" | "danger" | "info" | "neutral";
  leadStageId?: number;
}

export interface StatGroup {
  id: string;
  label: string;
  totalValue: number;
  tone: StatCardData["tone"];
  items: StatCardData[];
}

export interface TodoSummaryItem {
  id: string;
  label: string;
  value: number;
  emphasis?: "danger";
}

export interface FeedLead {
  id: string;
  leadId: string;
  name: string;
  caller: string;
  phone?: string;
  timestamp: string;
}

export interface FeedVisit {
  id: string;
  message: string;
}

export interface CalendarEvent {
  date: string; // ISO yyyy-mm-dd
  count: number;
  label: string;
}

export interface ActivityPoint {
  label: string;
  leads: number;
  followUps: number;
}

export interface PropertyStatusCount {
  status: string;
  count: number;
}

export interface DayActivity {
  date: string;
  visits: number;
  calls: number;
  birthdays: { name: string; mobile: string; date: string }[];
  anniversaries: { name: string; mobile: string; date: string }[];
}

export function groupStatCards(stats: StatCardData[]): StatGroup[] {
  const groups: Record<string, StatGroup> = {
    overview: {
      id: "overview",
      label: "Total Pipeline",
      totalValue: 0,
      tone: "accent",
      items: [],
    },
    active: {
      id: "active",
      label: "Active Deals",
      totalValue: 0,
      tone: "info",
      items: [],
    },
    closing: {
      id: "closing",
      label: "Closing & Won",
      totalValue: 0,
      tone: "success",
      items: [],
    },
    hold: {
      id: "hold",
      label: "Pending & Hold",
      totalValue: 0,
      tone: "warning",
      items: [],
    },
    archived: {
      id: "archived",
      label: "Junk & Lost",
      totalValue: 0,
      tone: "danger",
      items: [],
    },
  };

  const groupMapping: Record<string, keyof typeof groups> = {
    "total-leads": "overview",
    "junk-leads": "archived",
    lost: "archived",
    sold: "closing",
    closed: "closing",
    booked: "closing",
    booking: "closing",
    registration: "closing",
    exchange: "closing",
    "high-prospect": "active",
    priority: "active",
    negotiation: "active",
    visit: "active",
    query: "active",
    "new-call": "active",
    "follow-up": "active",
    lead: "active",
    potential: "active",
    "high-potential": "active",
    "token-lead": "active",
    hold: "hold",
    "emi-hold": "hold",
    "hold-for-later": "hold",
    "token-hold": "hold",
  };

  stats.forEach((stat) => {
    const groupId = groupMapping[stat.id] || "active";
    groups[groupId].items.push(stat);

    if (stat.id !== "total-leads") {
      groups[groupId].totalValue += stat.value;
    } else {
      groups[groupId].totalValue = stat.value;
    }
  });

  return Object.values(groups);
}

// =========================================================================
// CRM OVERVIEW DASHBOARD LIVE API CALLS
// =========================================================================

export async function fetchStatCards(): Promise<StatCardData[]> {
  try {
    const res = await api.get("/crm/reports/lead-funnel");
    const funnel = res.data?.data;
    const stages = funnel?.stage_distribution || funnel?.funnel_stages || [];
    const totalLeads = funnel?.total_leads || 0;

    const cards: StatCardData[] = [
      {
        id: "total-leads",
        label: "Total Leads",
        value: totalLeads,
        tone: "accent",
      },
    ];

    stages.forEach((st: any) => {
      const stageName = st.stage_name || `Stage ${st.stage_id}`;
      const slug = stageName.toLowerCase().replace(/\s+/g, "-");
      const count = Number(st.count || 0);

      let tone: StatCardData["tone"] = "neutral";
      if (
        slug.includes("won") ||
        slug.includes("sold") ||
        slug.includes("closed")
      )
        tone = "success";
      else if (
        slug.includes("consultation") ||
        slug.includes("visit") ||
        slug.includes("prospect")
      )
        tone = "accent";
      else if (slug.includes("negotiation") || slug.includes("priority"))
        tone = "warning";
      else if (slug.includes("lost") || slug.includes("junk")) tone = "danger";

      cards.push({
        id: slug,
        label: stageName,
        value: count,
        tone,
        leadStageId: Number(st.stage_id),
      });
    });

    return cards;
  } catch (err) {
    console.warn(
      "fetchStatCards: Fallback to default metrics on initial load",
      err,
    );
    return [
      { id: "total-leads", label: "Total Leads", value: 0, tone: "accent" },
      { id: "new-leads", label: "New Leads", value: 0, tone: "info" },
      { id: "follow-up", label: "Follow-Up", value: 0, tone: "warning" },
      { id: "won", label: "Deals Won", value: 0, tone: "success" },
    ];
  }
}

export async function fetchTodoSummary(): Promise<TodoSummaryItem[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];

    const pendingTasks = tasks.filter(
      (t: any) => t.status === "pending" || t.status === "in_progress",
    );
    const urgentTasks = pendingTasks.filter(
      (t: any) => t.priority === "urgent",
    );

    return [
      {
        id: "all-tasks",
        label: "Active Follow-ups",
        value: pendingTasks.length,
      },
      {
        id: "urgent-tasks",
        label: "Urgent Priority",
        value: urgentTasks.length,
        emphasis: "danger",
      },
      {
        id: "completed-tasks",
        label: "Completed",
        value: tasks.filter((t: any) => t.status === "completed").length,
      },
    ];
  } catch (err) {
    return [
      { id: "all-tasks", label: "Active Follow-ups", value: 0 },
      {
        id: "urgent-tasks",
        label: "Urgent Priority",
        value: 0,
        emphasis: "danger",
      },
    ];
  }
}

export async function fetchRecentLeads(): Promise<FeedLead[]> {
  try {
    const res = await api.get("/crm/leads");
    const list = res.data?.data || [];
    return list.slice(0, 10).map((l: any) => ({
      id: l.uuid,
      leadId: l.lead_code || `#${l.id}`,
      name: l.client_name,
      caller: l.assigned_to || "Unassigned",
      phone: l.phone,
      timestamp: l.createdAt
        ? new Date(l.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently",
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchRecentVisits(): Promise<FeedVisit[]> {
  try {
    const res = await api.get("/crm/leads");
    const leads = res.data?.data || [];
    const visits: FeedVisit[] = [];

    leads.forEach((l: any) => {
      (l.activities || []).forEach((act: any) => {
        if (act.activity_type === "visit") {
          visits.push({
            id: act.uuid || String(act.id),
            message: `${l.client_name}: ${act.summary || "Conducted field visit"}`,
          });
        }
      });
    });

    return visits.slice(0, 6);
  } catch (err) {
    return [];
  }
}

export async function fetchNewLeads(): Promise<FeedLead[]> {
  return fetchRecentLeads();
}

export async function fetchFollowUps(): Promise<FeedLead[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];
    return tasks.slice(0, 10).map((t: any) => ({
      id: t.uuid || String(t.id),
      leadId: t.lead_code || `#${t.id}`,
      name: t.title || "Scheduled Follow-up",
      caller: t.assigned_to || "Agent",
      phone: t.contact_phone || "N/A",
      timestamp: t.due_date ? String(t.due_date).slice(0, 10) : "Today",
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchTaskVisits(): Promise<FeedVisit[]> {
  return fetchRecentVisits();
}

export async function fetchCalendarEvents(
  monthKey?: string,
): Promise<CalendarEvent[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];
    const map: Record<string, number> = {};

    tasks.forEach((t: any) => {
      if (t.due_date) {
        const d = String(t.due_date).slice(0, 10);
        if (!monthKey || d.startsWith(monthKey)) {
          map[d] = (map[d] || 0) + 1;
        }
      }
    });

    return Object.entries(map).map(([date, count]) => ({
      date,
      count,
      label: `${count} scheduled task${count > 1 ? "s" : ""}`,
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchDayActivity(dateISO: string): Promise<DayActivity> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = (res.data?.data || []).filter((t: any) =>
      String(t.due_date).startsWith(dateISO),
    );
    const visits = tasks.filter((t: any) => t.task_type === "visit").length;
    const calls = tasks.filter((t: any) => t.task_type === "call").length;

    return {
      date: dateISO,
      visits,
      calls,
      birthdays: [],
      anniversaries: [],
    };
  } catch (err) {
    return {
      date: dateISO,
      visits: 0,
      calls: 0,
      birthdays: [],
      anniversaries: [],
    };
  }
}

export async function fetchActivityTrend(
  range: string = "weekly",
): Promise<ActivityPoint[]> {
  return fetchActivityTimeline();
}

export async function fetchPropertyStatusCounts(): Promise<
  PropertyStatusCount[]
> {
  return [
    { status: "Available", count: 42 },
    { status: "Booked", count: 18 },
    { status: "Sold", count: 24 },
  ];
}

export async function fetchActivityTimeline(): Promise<ActivityPoint[]> {
  try {
    const res = await api.get("/crm/reports/sales-pipeline-funnel");
    const funnel = res.data?.data ?? {};
    const stages = funnel.stages ?? funnel.stage_distribution ?? [];

    if (!Array.isArray(stages)) return [];

    return stages.map((stage: any) => ({
      label: stage.name || stage.stageName || "Stage",
      leads: Number(stage.count ?? stage.leadCount ?? 0),
      followUps: 0,
    }));
  } catch (err) {
    console.error("Error loading CRM activity report:", err);
    return [];
  }
}

export async function fetchPropertyStatusBreakdown(): Promise<
  { status: string; count: number; color: string }[]
> {
  return [
    { status: "Available", count: 42, color: "#0000F2" },
    { status: "Booked", count: 18, color: "#3B82F6" },
    { status: "Sold", count: 24, color: "#10B981" },
    { status: "Under Negotiation", count: 8, color: "#F59E0B" },
  ];
}

// =========================================================================
// CRM GENERIC MASTER DATA & PIPELINE API HELPER
// =========================================================================

export const crmApi = {
  // Master data
  async getMaster(subPath: string) {
    try {
      const res = await api.get(`/crm/master/${subPath}`);
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error(`Error fetching CRM master [${subPath}]:`, err);
      showAlert.error(
        "Failed to load records",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createMaster(subPath: string, payload: any) {
    try {
      const res = await api.post(`/crm/master/${subPath}`, payload);
      showAlert.success(
        "Record Created",
        "Master data entry added successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Leads
  async getLeads(params?: any) {
    try {
      const res = await api.get("/crm/leads", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load leads",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async getLeadDetails(uuid: string) {
    try {
      const res = await api.get(`/crm/leads/${uuid}`);
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Failed to load lead details",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async createLead(payload: any) {
    try {
      const res = await api.post("/crm/leads", payload);
      showAlert.success(
        "Lead Created",
        `Lead ${payload.client_name || ""} registered successfully.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Lead Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async logLeadActivity(leadUuid: string, payload: any) {
    try {
      const res = await api.post(`/crm/leads/${leadUuid}/activities`, payload);
      showAlert.success(
        "Activity Logged",
        "Lead activity added to 360 timeline.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Activity Logging Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateLeadStage(leadUuid: string, stageId: number, notes?: string) {
    try {
      const res = await api.post(`/crm/leads/${leadUuid}/stage`, {
        lead_stage_id: stageId,
        notes,
      });
      showAlert.success("Stage Updated", "Pipeline transition applied.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Stage Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Negotiations
  async getNegotiations() {
    try {
      const res = await api.get("/crm/negotiations");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load negotiations",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async approveNegotiation(uuid: string, approvedBy: string) {
    try {
      const res = await api.post(`/crm/negotiations/${uuid}/approve`, {
        approval_status: "approved",
        approved_by: approvedBy,
      });
      showAlert.success(
        "Negotiation Approved",
        "Deal terms approved successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Approval Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Tasks
  async getTasks(params?: any) {
    try {
      const res = await api.get("/crm/tasks", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load tasks",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createTask(payload: any) {
    try {
      const res = await api.post("/crm/tasks", payload);
      showAlert.success("Task Created", "Internal assignment saved.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Task Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },
};
