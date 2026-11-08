import { redirect } from "next/navigation";

export default function PurchaseOrderIndexPage() {
  redirect("/dashboard/procurement/purchase-order/purchase-order-list");
}
