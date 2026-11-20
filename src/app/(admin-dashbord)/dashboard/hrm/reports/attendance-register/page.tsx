import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Attendance Register" endpoint="hrm/reports/attendance-register" />;
}
