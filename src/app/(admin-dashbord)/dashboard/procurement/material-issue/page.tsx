import { redirect } from "next/navigation";

export default function MaterialIssueIndexPage() {
  redirect("/dashboard/procurement/material-issue/material-issue-list");
}
