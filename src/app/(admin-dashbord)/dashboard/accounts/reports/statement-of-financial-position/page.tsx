import AccountsReportViewer from "@/app/(admin-dashbord)/dashboard/accounts/reports/accounts-report-viewer";

export default function AccountsReportPage() {
  return (
    <AccountsReportViewer
      reportKey="statement-of-financial-position"
      title="Statement of Financial Position"
    />
  );
}
