import HrmModuleIndex from "../hrm-module-index";

export default function ConfigurationModulePage() {
  return <HrmModuleIndex title="HRM Configuration" description="Maintain the rules and reference data used by HRM workflows." items={[
    { title: "Allowance & Deduction", href: "/dashboard/hrm/configuration/allowance-deduction", description: "Configure salary allowance and deduction types." },
    { title: "Deduction Rules", href: "/dashboard/hrm/configuration/deduction-rules", description: "Set attendance and payroll deduction rules." },
    { title: "Holiday", href: "/dashboard/hrm/configuration/holiday", description: "Manage organization holidays." },
    { title: "Leave Type", href: "/dashboard/hrm/configuration/leave-type", description: "Configure leave policies and allocations." },
    { title: "Month Configuration", href: "/dashboard/hrm/configuration/month-configuration", description: "Set payroll and attendance periods." },
    { title: "Salary Grade", href: "/dashboard/hrm/configuration/salary-grade", description: "Maintain salary grades and basic pay." },
    { title: "ZKTeco Device", href: "/dashboard/hrm/configuration/zkteco-device-configuration", description: "Configure attendance devices." },
  ]} />;
}
