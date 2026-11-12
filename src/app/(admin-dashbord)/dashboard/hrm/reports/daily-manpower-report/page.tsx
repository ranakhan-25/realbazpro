import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Daily Manpower Report" endpoint="hrm/reports/daily-manpower-report" />;
}
