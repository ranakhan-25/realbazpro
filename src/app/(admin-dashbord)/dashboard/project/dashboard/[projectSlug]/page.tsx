import ProjectApiDashboard from "../project-api-dashboard";

export default async function DynamicProjectDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string }>;
  searchParams: Promise<{ uuid?: string | string[] }>;
}) {
  const [{ projectSlug }, query] = await Promise.all([params, searchParams]);
  const uuid = Array.isArray(query.uuid) ? query.uuid[0] : query.uuid;
  const projectName = decodeURIComponent(projectSlug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (!uuid) {
    return (
      <main className="p-6">
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Project UUID is missing. Open this dashboard from the project list.
        </div>
      </main>
    );
  }

  return (
    <ProjectApiDashboard
      projectName={projectName}
      projectUuid={uuid}
      detailsHref={`/dashboard/project/projects/project/project-details/${encodeURIComponent(uuid)}`}
    />
  );
}
