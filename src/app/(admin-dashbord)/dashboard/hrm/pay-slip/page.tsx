import HrmModuleIndex from "../hrm-module-index";

export default function PaySlipModulePage() {
  return <HrmModuleIndex title="Pay Slip" description="Process payroll and review generated employee pay slips." items={[
    { title: "Pay Slip Process", href: "/dashboard/hrm/pay-slip/pay-slip-process", description: "Generate pay slips for a selected month and year." },
    { title: "Pay Slip Details", href: "/dashboard/hrm/pay-slip/pay-slip-details", description: "Review generated pay slips and balances." },
    { title: "Bank Pay Slip", href: "/dashboard/hrm/pay-slip/bank-pay-slip", description: "Review pay slips allocated to bank payment." },
  ]} />;
}
