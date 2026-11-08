import LamsDashboardWrapper from "@/components/dashboard/LamsDashboardWrapper";

export default async function LandSlugPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : "";
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LamsDashboardWrapper path={path} />
    </div>
  );
}
