import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Daily Attendance Report" endpoint="hrm/reports/daily-attendance-report" />;
}
