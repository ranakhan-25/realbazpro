import { redirect } from "next/navigation";

export default function RfqIndexPage() {
  redirect("/dashboard/procurement/rfq/request-for-quotation");
}
