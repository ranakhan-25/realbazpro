import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export type HrmIndexItem = { title: string; href: string; description: string };

export default function HrmModuleIndex({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: HrmIndexItem[];
}) {
  return (
    <main className="min-h-screen space-y-5 bg-canvas p-4 text-ink sm:p-6">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-indigo-600 p-3 text-white"><FileText size={20} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Human Resource Management</p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          </div>
        </div>
      </header>
      <section aria-label={`${title} pages`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{item.title}</h2>
              <ArrowRight size={16} className="shrink-0 text-indigo-600 transition group-hover:translate-x-1" />
            </div>
            <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
          </Link>
        ))}
      </section>
      {!items.length && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">No pages are configured for this module yet.</p>}
    </main>
  );
}
