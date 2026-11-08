import { redirect } from "next/navigation";

export default function BoqIndexPage() {
  redirect("/dashboard/procurement/boq/all-boq");
}
