import HrmModuleIndex from "../hrm-module-index";

export default function EmployeeModulePage() {
  return <HrmModuleIndex title="Employee" description="Manage employee records and the organization structure." items={[
    { title: "Employee List", href: "/dashboard/hrm/employee/employee-list", description: "Search, review, and maintain employee profiles." },
    { title: "Department", href: "/dashboard/hrm/employee/department", description: "Manage departments and their employee assignments." },
    { title: "Designation", href: "/dashboard/hrm/employee/designation", description: "Manage job titles and department links." },
    { title: "Section", href: "/dashboard/hrm/employee/section", description: "Organize employees into sections." },
    { title: "Unit", href: "/dashboard/hrm/employee/unit", description: "Manage organizational units." },
    { title: "Shift", href: "/dashboard/hrm/employee/shift", description: "Configure reusable work shifts." },
    { title: "Shift Allocation", href: "/dashboard/hrm/employee/shift-allocation", description: "Assign shifts and review scheduled attendance." },
    { title: "Employee Hierarchy", href: "/dashboard/hrm/employee/employee-hierarchy", description: "Review reporting relationships." },
    { title: "Salary Structure", href: "/dashboard/hrm/employee/salary-structure", description: "Review employee salary components." },
    { title: "Increment", href: "/dashboard/hrm/employee/Increment", description: "Manage employee salary increments." },
    { title: "Bonus", href: "/dashboard/hrm/employee/bonus", description: "Configure employee bonus records." },
    { title: "Bonus Generate", href: "/dashboard/hrm/employee/bonus-generate", description: "Generate bonus payouts for employees." },
    { title: "ID Card Generate", href: "/dashboard/hrm/employee/ID-Card-Generate", description: "Generate employee identity cards." },
  ]} />;
}
