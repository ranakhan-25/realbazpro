/* eslint-disable prettier/prettier */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { hrmFetch } from "@/app/(admin-dashbord)/dashboard/hrm/hrm-fetch";

type Row = Record<string, any>;

interface DashboardData {
  employees: Row[];
  attendance: Row[];
  leaves: Row[];
  pendingLeaves: Row[];
  holidays: Row[];
  salaries: Row[];
}

const emptyData: DashboardData = {
  employees: [],
  attendance: [],
  leaves: [],
  pendingLeaves: [],
  holidays: [],
  salaries: [],
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_PREFIX = "/realbizpro/api/v1";

function rowsFrom(payload: any): Row[] {
  const candidates = [payload?.data?.data, payload?.data, payload?.rows, payload];
  return candidates.find(Array.isArray) || [];
}

async function getRows(path: string): Promise<Row[]> {
  const url = new URL(`${API_BASE}${API_PREFIX}${path}`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("page", "1");
  const allRows: Row[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    url.searchParams.set("page", String(page));
    const response = await hrmFetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || `Request failed (${response.status})`;
      throw new Error(Array.isArray(message) ? message.join(", ") : String(message));
    }
    allRows.push(...rowsFrom(payload));
    const meta = payload?.data?.meta || payload?.meta;
    totalPages = Math.max(1, Number(meta?.totalPages) || 1);
    page += 1;
  }
  return allRows;
}

function dateOnly(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function localDateString(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function employeeName(employee: Row | undefined, fallback?: unknown): string {
  return (
    employee?.name ||
    employee?.fullName ||
    employee?.employeeName ||
    (fallback == null ? "Employee" : String(fallback))
  );
}

function isActive(employee: Row): boolean {
  return !employee.status || String(employee.status).toLowerCase() === "active";
}

export default function HRMDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const today = new Date();
    const todayString = localDateString(today);
    const yearStart = `${today.getFullYear()}-01-01`;
    const yearEnd = `${today.getFullYear()}-12-31`;

    void Promise.allSettled([
      getRows("/employee-list?page=1&limit=1000&status=active&withDeleted=false"),
      getRows(`/attendance?page=1&limit=1000&date=${todayString}&withDeleted=false`),
      getRows("/leave-application?page=1&limit=1000&status=approved&withRelations=true&withDeleted=false"),
      getRows("/leave-application?page=1&limit=1000&status=pending&withRelations=true&withDeleted=false"),
      getRows(`/holiday?page=1&limit=1000&dateFrom=${yearStart}&dateTo=${yearEnd}&withDeleted=false`),
      getRows("/employee-salary?page=1&limit=1000&withDeleted=false"),
    ]).then((results) => {
      if (!active) return;
      const names: (keyof DashboardData)[] = ["employees", "attendance", "leaves", "pendingLeaves", "holidays", "salaries"];
      const nextData = { ...emptyData };
      const errors: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") nextData[names[index]] = result.value;
        else errors.push(names[index]);
      });
      setData(nextData);
      setLoadErrors(errors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const employees = data.employees.filter(isActive);
    const employeeById = new Map<string, Row>(
      employees.map((employee): [string, Row] => [String(employee.uuid || employee.id), employee]),
    );
    const attendanceToday = data.attendance;
    const presentIds = new Set(
      attendanceToday
        .filter((row) => row.isPresent === true || String(row.isPresent).toLowerCase() === "true")
        .map((row) => String(row.employeeId || row.employee?.uuid || ""))
        .filter(Boolean),
    );
    const leaveToday = data.leaves.filter((leave) => {
      const from = dateOnly(leave.fromDate);
      const to = dateOnly(leave.toDate);
      const today = localDateString();
      return from && to && from <= today && to >= today;
    });
    const leaveIds = new Set(leaveToday.map((leave) => String(leave.employeeId || leave.employee?.uuid || "")).filter(Boolean));
    const excludedDayIds = new Set(
      attendanceToday
        .filter((row) => ["holiday", "offday", "weekend"].includes(String(row.type || "").toLowerCase()))
        .map((row) => String(row.employeeId || "")),
    );
    const absentEmployees = employees.filter((employee) => {
      const id = String(employee.uuid || employee.id);
      return !presentIds.has(id) && !leaveIds.has(id) && !excludedDayIds.has(id);
    });
    const lateAttendance = attendanceToday.filter((row) =>
      row.isLate === true || Number(row.lateMinutes || row.late || 0) > 0,
    );
    const basicSalaryTotal = data.salaries.reduce(
      (sum, salary) => sum + (Number(salary.basicSalary || salary.basic_salary) || 0),
      0,
    );
    const todaysHolidays = data.holidays.filter((holiday) => {
      const from = dateOnly(holiday.fromDate || holiday.date || holiday.dateFrom);
      const to = dateOnly(holiday.toDate || holiday.date || holiday.dateTo) || from;
      const today = localDateString();
      return from && from <= today && to >= today;
    });

    return {
      employees,
      total: employees.length,
      present: presentIds.size,
      absent: absentEmployees.length,
      absentEmployees,
      leaveToday,
      pendingLeaves: data.pendingLeaves,
      lateAttendance,
      basicSalaryTotal,
      holidayCount: todaysHolidays.length,
      employeeById,
    };
  }, [data]);

  const radius = 54;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const absentLen = circumference * (metrics.total > 0 ? metrics.absent / metrics.total : 0);
  const presentLen = circumference - absentLen;
  const statusCards = [
    { title: "Employee", value: loading ? "—" : String(metrics.total), gradient: "from-amber-500 to-yellow-600" },
    { title: "Today Present", value: loading ? "—" : String(metrics.present), gradient: "from-cyan-400 to-teal-600" },
    { title: "Today Absent", value: loading ? "—" : String(metrics.absent), gradient: "from-emerald-500 to-green-600" },
    { title: "On Leave Today", value: loading ? "—" : String(metrics.leaveToday.length), gradient: "from-fuchsia-500 to-pink-600" },
    { title: "Basic Salary Total", value: loading ? "—" : `৳${metrics.basicSalaryTotal.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`, gradient: "from-orange-400 to-rose-500" },
    { title: "Holiday Today", value: loading ? "—" : String(metrics.holidayCount), gradient: "from-blue-500 to-indigo-700" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="bg-surface border-b border-border px-4 py-2 flex items-center gap-1.5">
        <button type="button" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-black text-white text-[13px] font-medium shadow-sm">
          <Users className="w-3.5 h-3.5" /> HRM
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loadErrors.length > 0 && (
          <div role="status" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Could not load: {loadErrors.join(", ")}. Check your HRM permissions and try again.
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {statusCards.map((card) => (
              <div key={card.title} className={`rounded-lg bg-gradient-to-br ${card.gradient} px-4 py-3 text-white shadow-sm`}>
                <p className="text-[12px] font-medium opacity-90">{card.title}</p>
                <p className="text-[22px] font-bold tabular-nums mt-0.5">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="w-[240px] shrink-0 hidden xl:block bg-surface rounded-lg border border-border p-3">
            <h3 className="text-[13px] font-semibold text-ink text-center mb-2">Pending Leave Application</h3>
            {metrics.pendingLeaves.length === 0 ? (
              <p className="text-[12px] text-ink-faint text-center py-4">No pending leave applications.</p>
            ) : (
              <div className="max-h-28 overflow-y-auto space-y-2">
                {metrics.pendingLeaves.slice(0, 5).map((leave) => (
                  <div key={leave.uuid || leave.id} className="text-xs text-ink border-b border-border pb-1">
                    {employeeName(leave.employee, leave.employeeName || leave.employeeId)}
                    <span className="block text-ink-faint">{dateOnly(leave.fromDate)} – {dateOnly(leave.toDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-semibold text-amber-500 text-center">Today Late</h3></div>
            <div className="p-3 space-y-2">
              {metrics.lateAttendance.length === 0 ? (
                <div className="rounded-md bg-sky-50 dark:bg-sky-500/10 px-4 py-3 text-center text-[13px] text-sky-600 dark:text-sky-400">No late attendances recorded.</div>
              ) : metrics.lateAttendance.slice(0, 5).map((row) => (
                <div key={row.uuid || row.id} className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-4 py-2 text-sm text-ink">
                  {employeeName(metrics.employeeById.get(String(row.employeeId)), row.employeeName || row.employeeId)} · {row.inTime || "Late"}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-semibold text-amber-500 text-center">Leave Today</h3></div>
            <div className="p-3 space-y-2">
              {metrics.leaveToday.length === 0 ? (
                <div className="rounded-md bg-sky-50 dark:bg-sky-500/10 px-4 py-3 text-center text-[13px] text-sky-600 dark:text-sky-400">No approved leave today.</div>
              ) : metrics.leaveToday.slice(0, 5).map((leave) => (
                <div key={leave.uuid || leave.id} className="rounded-md bg-sky-50 dark:bg-sky-500/10 px-4 py-2 text-sm text-ink">
                  {employeeName(leave.employee, leave.employeeName || leave.employeeId)} · {leave.leaveType?.name || leave.leaveTypeName || "Leave"}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-4 flex flex-col items-center">
            <h3 className="text-[13px] font-semibold text-ink mb-1">Total VS Absent Employees</h3>
            <p className="text-[11px] text-ink-muted mb-2">Today</p>
            <div className="relative w-[140px] h-[140px]">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#22c55e" strokeWidth={stroke} strokeDasharray={`${presentLen} ${circumference}`} strokeDashoffset={0} />
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#ef4444" strokeWidth={stroke} strokeDasharray={`${absentLen} ${circumference}`} strokeDashoffset={-presentLen} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-[18px] font-bold text-ink tabular-nums">{metrics.absent} / {metrics.total}</span></div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[12px]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-ink-muted">Total Employees</span><span className="font-semibold text-ink ml-1">{metrics.total}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-ink-muted">Absent Employees</span><span className="font-semibold text-ink ml-1">{metrics.absent}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-semibold text-ink">Absent Today</h3></div>
          <div className="p-3">
            {metrics.absentEmployees.length === 0 ? (
              <p className="text-sm text-ink-faint text-center py-4">{loading ? "Loading attendance…" : "No absent employees today."}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metrics.absentEmployees.map((employee, index) => (
                  <div key={employee.uuid || employee.id} className="flex items-center border border-border rounded-md overflow-hidden text-[12px]">
                    <div className="w-10 shrink-0 px-2 py-2.5 text-center text-ink-muted border-r border-border bg-canvas/50">{index + 1}</div>
                    <div className="flex-1 px-3 py-2.5 text-ink font-medium">{employeeName(employee)}</div>
                    <div className="px-3 py-2.5 text-rose-500 font-medium border-l border-border">Absent</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
