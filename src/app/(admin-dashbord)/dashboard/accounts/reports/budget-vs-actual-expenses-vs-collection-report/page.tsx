import AccountsReportViewer from "@/app/(admin-dashbord)/dashboard/accounts/reports/accounts-report-viewer";

export default function AccountsReportPage() {
  return (
    <AccountsReportViewer
      reportKey="budget-vs-actual-expenses-vs-collection-report"
      title="Budget vs Actual Expenses vs Collection"
    />
  );
}
