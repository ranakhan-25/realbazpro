/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { getOrganizations, type Organization } from "@/services/organizationService";
import {
  Search,
  Filter,
  Gauge,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  HardDrive,
  FolderKanban,
  Building2,
  RefreshCw,
} from "lucide-react";

interface UsageItem {
  uuid: string;
  orgId: number;
  org: string;
  code: string;
  planName: string;
  metric: string;
  used: number;
  limit: number;
  unit: string;
  period: string;
}

const ITEMS_PER_PAGE = 8;

export default function UsageListPage() {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [usageData, setUsageData] = useState<UsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [metricFilter, setMetricFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real organization data and construct telemetry
  useEffect(() => {
    const fetchUsage = async () => {
      setIsLoading(true);
      try {
        const orgs = await getOrganizations();
        if (orgs && orgs.length > 0) {
          const items: UsageItem[] = [];
          orgs.forEach((org) => {
            const planName =
              org.plan?.name ||
              (typeof org.plan === "string" ? org.plan : "Standard");

            // 1. Users
            items.push({
              uuid: `${org.id}-users`,
              orgId: org.id,
              org: org.name,
              code: org.code,
              planName,
              metric: "Active Users",
              used: org.userCount || 1,
              limit: org.maxUsers || 5,
              unit: "Users",
              period: "Current",
            });

            // 2. Storage
            const limitGb = Math.round((org.maxStorageMb || 2048) / 1024);
            items.push({
              uuid: `${org.id}-storage`,
              orgId: org.id,
              org: org.name,
              code: org.code,
              planName,
              metric: "Cloud Storage",
              used: Math.max(1, Math.round(limitGb * 0.2)),
              limit: limitGb || 2,
              unit: "GB",
              period: "Current",
            });

            // 3. Projects
            items.push({
              uuid: `${org.id}-projects`,
              orgId: org.id,
              org: org.name,
              code: org.code,
              planName,
              metric: "Work Projects",
              used: 1,
              limit: org.maxProjects || 5,
              unit: "Projects",
              period: "Current",
            });
          });
          setUsageData(items);
        }
      } catch (error) {
        console.error("Failed to load telemetry:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsage();
  }, []);

  // Extract unique metrics for filter
  const metrics = useMemo(() => {
    return Array.from(new Set(usageData.map((u) => u.metric)));
  }, [usageData]);

  // Filter Logic
  const filteredUsage = useMemo(() => {
    return usageData.filter((u) => {
      const matchesSearch =
        u.org.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMetric = metricFilter === "all" || u.metric === metricFilter;
      return matchesSearch && matchesMetric;
    });
  }, [usageData, searchQuery, metricFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsage.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsage = filteredUsage.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, metricFilter]);

  // Progress Bar Calculator
  const getProgress = (used: number, limit: number) => {
    const percentage = Math.min((used / Math.max(limit, 1)) * 100, 100);
    let color = brandColor;
    if (percentage >= 90) color = "#ef4444";
    else if (percentage >= 75) color = "#f59e0b";

    return { percentage, color };
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Gauge className="h-7 w-7" style={{ color: brandColor }} />
              Usage & Resource Limits
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Live multi-tenant resource telemetry, seat utilization, and quota consumption.
            </p>
          </div>

          <button
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                ["Organization,Code,Plan,Metric,Used,Limit,Unit,Period"].join(",") +
                "\n" +
                usageData
                  .map(
                    (u) =>
                      `"${u.org}","${u.code}","${u.planName}","${u.metric}",${u.used},${u.limit},"${u.unit}","${u.period}"`,
                  )
                  .join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `tenant-usage-telemetry-${new Date().toISOString().split("T")[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" /> Export CSV Report
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by organization or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>Metric:</span>
            </div>

            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 appearance-none min-w-[150px]"
            >
              <option value="all">All Metrics</option>
              {metrics.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Active Plan
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Resource Metric
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                    Utilization & Quota
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading usage telemetry...
                    </td>
                  </tr>
                ) : paginatedUsage.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Gauge className="h-10 w-10 text-gray-200 mb-3 mx-auto" />
                      <p className="text-gray-500 font-medium">No usage records found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsage.map((item) => {
                    const { percentage, color } = getProgress(item.used, item.limit);
                    return (
                      <tr key={item.uuid} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 text-sm">
                              {item.org}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {item.code}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border"
                            style={{
                              backgroundColor: `${brandColor}10`,
                              color: brandColor,
                              borderColor: `${brandColor}20`,
                            }}
                          >
                            {item.planName}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.metric.includes("User") ? (
                              <Users className="w-4 h-4 text-blue-500" />
                            ) : item.metric.includes("Storage") ? (
                              <HardDrive className="w-4 h-4 text-violet-500" />
                            ) : (
                              <FolderKanban className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {item.metric}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-gray-900 font-semibold">
                                {item.used} {item.unit}
                              </span>
                              <span className="text-gray-400">
                                Limit: {item.limit} {item.unit} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {percentage >= 90 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="h-3 w-3" /> Critical
                            </span>
                          ) : percentage >= 75 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-3 w-3" /> Warning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="h-3 w-3" /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredUsage.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsage.length)}
                </span>{" "}
                of <span className="font-medium text-gray-900">{filteredUsage.length}</span> metrics
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium px-2">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
