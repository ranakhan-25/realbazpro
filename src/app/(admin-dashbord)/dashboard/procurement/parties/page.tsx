import { redirect } from "next/navigation";

export default function PartiesIndexPage() {
  redirect("/dashboard/procurement/parties/all-party");
}
