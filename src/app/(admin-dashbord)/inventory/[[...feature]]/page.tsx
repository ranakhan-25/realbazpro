import { redirect } from "next/navigation";

export default async function LegacyInventoryRedirect({
  params,
}: {
  params: Promise<{ feature?: string[] }>;
}) {
  const { feature = [] } = await params;
  const destination = `/dashboard/inventory${feature.length ? `/${feature.map(encodeURIComponent).join("/")}` : ""}`;
  redirect(destination);
}
