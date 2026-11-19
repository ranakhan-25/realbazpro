import type { Metadata } from "next";
import { CustomerServiceLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "Customer Service & After-Sales - RealBiz Pro",
  description:
    "Post-sales operations, customer entry, property portfolio bookings, change requests, handover, and warranties",
};

export default function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerServiceLayoutClient>{children}</CustomerServiceLayoutClient>;
}
