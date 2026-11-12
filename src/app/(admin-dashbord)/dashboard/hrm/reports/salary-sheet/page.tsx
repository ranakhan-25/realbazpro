import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Salary Sheet" endpoint="hrm/reports/salary-sheet" />;
}
