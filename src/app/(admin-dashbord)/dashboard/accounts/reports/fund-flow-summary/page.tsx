import AccountsReportViewer from "@/app/(admin-dashbord)/dashboard/accounts/reports/accounts-report-viewer";

export default function AccountsReportPage() {
  return (
    <AccountsReportViewer
      reportKey="fund-flow-summary"
      title="Fund Flow Summary"
    />
  );
}
