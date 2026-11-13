import HrmModuleIndex from "../hrm-module-index";

export default function AttendanceModulePage() {
  return <HrmModuleIndex title="Attendance" description="Record daily attendance and resolve attendance exceptions." items={[
    { title: "Attendance", href: "/dashboard/hrm/attendance/attendance", description: "Review and maintain employee attendance." },
    { title: "Attendance Log", href: "/dashboard/hrm/attendance/attendance-log", description: "Review recorded check-in and check-out events." },
    { title: "Pending Attendance", href: "/dashboard/hrm/attendance/pending-attendance", description: "Review attendance entries awaiting action." },
    { title: "Attendance Reconciliations", href: "/dashboard/hrm/attendance/attendance-reconciliations", description: "Review attendance correction requests." },
  ]} />;
}
