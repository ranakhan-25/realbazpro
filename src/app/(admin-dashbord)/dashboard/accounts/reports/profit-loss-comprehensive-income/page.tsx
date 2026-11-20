import AccountsReportViewer from "@/app/(admin-dashbord)/dashboard/accounts/reports/accounts-report-viewer";

export default function AccountsReportPage() {
  return (
    <AccountsReportViewer
      reportKey="profit-loss-comprehensive-income"
      title="Profit & Loss / Comprehensive Income"
    />
  );
}
