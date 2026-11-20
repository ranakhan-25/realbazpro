import HrmReportViewer from "@/app/(admin-dashbord)/dashboard/hrm/hrm-report-viewer";

export default function Page() {
  return <HrmReportViewer title="Deduction Report" endpoint="hrm/reports/deduction-report" />;
}
