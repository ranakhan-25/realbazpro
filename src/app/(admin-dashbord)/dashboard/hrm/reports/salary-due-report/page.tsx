import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Salary Due Report" endpoint="hrm/reports/salary-due-report" />;
}
