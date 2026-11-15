import { CollectionModule } from "@/components/collection/CollectionModule";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : "";
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Credit Collection Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Installment schedules, dues realization, automated receipts, waivers, aging analytics, and field recovery operations.
          </p>
        </div>
        <CollectionModule initialPath={path} />
      </div>
    </div>
  );
}
