import api from "@/lib/api";

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string;
  color?: string;
  bg?: string;
  text?: string;
}

export interface DashboardActivity {
  title: string;
  description: string;
  time: string;
  type?: string;
}

export interface DashboardStatsResponse {
  role: "super-admin" | "org-admin";
  overview: {
    title: string;
    subtitle: string;
    metrics: DashboardMetric[];
  };
  charts: {
    activityTrend: Array<{ day: string; value: number }>;
    roleDistribution: Array<{ name: string; value: number; color?: string }>;
    userStatusBreakdown: Array<{ label: string; count: number; color: string }>;
  };
  recentActivities: DashboardActivity[];
  organization?: {
    id: number;
    name: string;
    code: string;
    websitePublished?: boolean;
    subdomain?: string;
    customDomain?: string | null;
  };
}

export async function getAdminDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await api.get<DashboardStatsResponse | { data: DashboardStatsResponse }>(
    "/system/dashboard/stats",
  );
  if (response.data && "overview" in response.data) {
    return response.data as DashboardStatsResponse;
  }
  if (response.data && "data" in response.data) {
    return (response.data as { data: DashboardStatsResponse }).data;
  }
  return response.data as DashboardStatsResponse;
}
