import { CollectionModule } from "@/components/collection/CollectionModule";

export default async function DashboardCollectionPage({
  params,
}: {
  params: Promise<{ feature?: string[] }>;
}) {
  const { feature } = await params;
  const path = Array.isArray(feature) ? feature.join("/") : "";
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Module 08: Credit Collection
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Post-sales dues realization, collection receipts, aging analysis, and field recovery operations.
        </p>
      </div>
      <CollectionModule initialPath={path} />
    </div>
  );
}
