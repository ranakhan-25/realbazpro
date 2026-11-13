import HrmModuleIndex from "../hrm-module-index";

export default function ReportsModulePage() {
  return <HrmModuleIndex title="HRM Reports" description="Live attendance, leave, and payroll reporting." items={[
    { title: "Daily Attendance Report", href: "/dashboard/hrm/reports/daily-attendance-report", description: "Review employee attendance for a date range." },
    { title: "Daily Manpower Report", href: "/dashboard/hrm/reports/daily-manpower-report", description: "Review daily present and absent headcount." },
    { title: "Attendance Register", href: "/dashboard/hrm/reports/attendance-register", description: "Review attendance records in register format." },
    { title: "Attendance Summary", href: "/dashboard/hrm/reports/attendance-summary", description: "Summarize employee attendance and rates." },
    { title: "Attendance Details", href: "/dashboard/hrm/reports/attendance-details-report", description: "Inspect employee attendance details." },
    { title: "Job Card", href: "/dashboard/hrm/reports/job-card", description: "Review employee workday details." },
    { title: "Leave Report", href: "/dashboard/hrm/reports/leave-report", description: "Review employee leave applications." },
    { title: "Leave Details", href: "/dashboard/hrm/reports/leave-details-report", description: "Review leave balances and allocations." },
    { title: "Salary Sheet", href: "/dashboard/hrm/reports/salary-sheet", description: "Review generated monthly payroll." },
    { title: "Salary Due", href: "/dashboard/hrm/reports/salary-due-report", description: "Review unpaid salary balances." },
    { title: "Deduction Report", href: "/dashboard/hrm/reports/deduction-report", description: "Review generated payroll deductions." },
  ]} />;
}
