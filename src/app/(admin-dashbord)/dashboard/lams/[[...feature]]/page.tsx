import LamsDashboardWrapper from "@/components/dashboard/LamsDashboardWrapper";

/**
 * Dashboard LAMS module route: /dashboard/lams/[...feature]
 * Uses optional catch-all so /dashboard/lams also works (feature = undefined).
 * Sub-paths like /dashboard/lams/acquisition-leads, /dashboard/lams/land-owners etc.
 * are handled by the tab resolver inside LamsDashboard.
 */
export default async function DashboardLamsPage({
  params,
}: {
  params: Promise<{ feature?: string[] }>;
}) {
  const { feature } = await params;
  const path = Array.isArray(feature) ? feature.join("/") : "";
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LamsDashboardWrapper path={path} />
    </div>
  );
}
