import { redirect } from "next/navigation";

export default function WorkOrdersIndexPage() {
  redirect("/dashboard/procurement/work-orders/work-orders-list");
}
