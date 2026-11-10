import { Suspense } from "react";
import BookingResourcePage from "@/components/sales/BookingResourcePage";

export default async function BookingDetailsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const initialUuid = String(query.uuid ?? query.bookingUuid ?? query.bookingId ?? query.id ?? "");
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading booking…</div>}>
      <BookingResourcePage resource="overview" title="Booking Details" recordParam="overviewUuid" initialUuid={initialUuid} />
    </Suspense>
  );
}
