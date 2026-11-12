import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, BadgeDollarSign, ClipboardList,
  FileCheck2, FileText, Handshake, House, Landmark, ReceiptText, ShieldAlert,
} from "lucide-react";

type BookingDetailsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sections = [
  { title: "Overview", description: "Property, buyer, and booking summary", href: "overview", icon: House, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" },
  { title: "Installments", description: "Payment schedule and due amounts", href: "installments", icon: ReceiptText, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" },
  { title: "Agreement", description: "Agreement details and signing status", href: "agreement", icon: Handshake, color: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" },
  { title: "Registration", description: "Registry progress and ownership records", href: "registration", icon: Landmark, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { title: "Handover", description: "Handover checklist and completion details", href: "handover", icon: ClipboardList, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  { title: "Documents", description: "Booking files and supporting documents", href: "documents", icon: FileText, color: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" },
  { title: "Cancellation", description: "Cancellation request and refund status", href: "cancellation", icon: ShieldAlert, color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  { title: "Commission", description: "Commission amounts and payment status", href: "commission", icon: BadgeDollarSign, color: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300" },
  { title: "Ownership transfer", description: "Transfer parties and effective date", href: "transfer", icon: ArrowRightLeft, color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300" },
];

export default async function BookingDetailsPage({ searchParams }: BookingDetailsPageProps) {
  const query = await searchParams;
  const value = query.uuid ?? query.bookingUuid ?? query.bookingId ?? query.id;
  const bookingUuid = Array.isArray(value) ? value[0] : value;

  if (bookingUuid) {
    redirect(`/dashboard/sales-management/bookings/details/overview?uuid=${encodeURIComponent(bookingUuid)}`);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard/sales-management/bookings"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300"
        >
          <ArrowLeft size={16} /> Back to bookings
        </Link>

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-900/10 sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-44 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-50">
              <FileCheck2 size={14} /> SALES MANAGEMENT
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Booking details</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Choose a section to review a booking. Open a booking first to see its information across every section.
            </p>
            <Link
              href="/dashboard/sales-management/bookings"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Find a booking <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Booking sections</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All details pages in one place</p>
          </div>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {sections.length} sections
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ title, description, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={`/dashboard/sales-management/bookings/details/${href}`}
              className="group flex min-h-36 items-start gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-800"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 font-semibold text-gray-900 dark:text-white">
                  {title}
                  <ArrowRight size={16} className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:text-gray-600" />
                </span>
                <span className="mt-1.5 block text-sm leading-5 text-gray-500 dark:text-gray-400">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
