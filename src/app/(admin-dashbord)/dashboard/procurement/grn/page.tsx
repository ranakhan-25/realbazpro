import { redirect } from "next/navigation";

export default function GrnIndexPage() {
  redirect("/dashboard/procurement/grn/goods-receipt-note");
}
