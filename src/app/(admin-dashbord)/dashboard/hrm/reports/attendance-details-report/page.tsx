import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Attendance Details Report" endpoint="hrm/reports/attendance-details-report" />;
}
