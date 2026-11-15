import EmployeeKpiCallReportPage from "../../../crm/kpi/reports/employee-call-report/page";

export default function EmployeeTaskReport() {
  return <EmployeeKpiCallReportPage apiReportUrl="/hrm/kpi/reports/employee" mode="tasks" />;
}
