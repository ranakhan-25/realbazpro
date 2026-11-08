import { redirect } from "next/navigation";

export default function ReportsIndexPage() {
  redirect("/dashboard/procurement/reports/grn-vs-invoice-report");
}
