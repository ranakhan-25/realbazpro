"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  KeyRound,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { MOCK_BOOKINGS, PropertyBooking } from "@/services/customerServiceData";

export default function PropertiesBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState<PropertyBooking[]>(MOCK_BOOKINGS);

  const filtered = bookings.filter((b) => {
    if (activeTab === "dlp") return b.handoverStatus === "DLP Active";
    if (activeTab === "snagging") return b.handoverStatus === "Ready for Snagging";
    if (activeTab === "handedover") return b.handoverStatus === "Handed Over";
    return true;
  });

  const columns: Column<PropertyBooking>[] = [
    {
      key: "id",
      header: "Booking ID & Date",
      sortable: true,
      render: (b) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{b.id}</span>
          <div className="text-[11px] text-slate-400">{b.bookingDate}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (b) => (
        <div>
          <div className="font-bold text-slate-800">{b.customerName}</div>
          <div className="text-[11px] text-slate-400">{b.customerPhone}</div>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project & Unit",
      render: (b) => (
        <div>
          <div className="font-semibold text-slate-900">{b.project}</div>
          <div className="text-[11px] text-blue-600 font-medium">
            Unit: {b.unitNumber} ({b.sizeSqFt} sft)
          </div>
        </div>
      ),
    },
    {
      key: "totalPrice",
      header: "Valuation & Ledger",
      render: (b) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900">
            ৳ {(b.totalPrice / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Paid: ৳ {(b.paidAmount / 100000).toFixed(1)} Lac
          </div>
          {b.dueAmount > 0 ? (
            <div className="text-[10px] text-amber-700 font-medium">
              Due: ৳ {(b.dueAmount / 100000).toFixed(1)} Lac
            </div>
          ) : (
            <div className="text-[10px] text-emerald-700 font-bold">Paid in Full</div>
          )}
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "Handover & DLP",
      render: (b) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            b.handoverStatus === "DLP Active"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
              : b.handoverStatus === "Ready for Snagging"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : b.handoverStatus === "Handed Over"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-700"
          }`}
        >
          {b.handoverStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Quick Action",
      render: (b) => (
        <Link
          href="/dashboard/customer-service/payments/schedules-demand-letters"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          Demand Letter <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      <CSPageHeader
        title="Bookings & Property Portfolio"
        subtitle="Customer apartment allotments, commercial spaces, plots, parking bays, and milestone payment status."
        badge="Asset Inventory"
        breadcrumbs={[{ label: "Customers & Properties" }, { label: "Bookings Portfolio" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Booked Units"
          value="486 Units"
          subtext="Under Customer Service custody"
          icon={Building2}
        />
        <CSStatCard
          title="Ready for Joint Snagging"
          value="18 Flats"
          subtext="Pending pre-possession inspection"
          icon={KeyRound}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Active 2-Year DLP Coverage"
          value="142 Flats"
          subtext="Statutory warranty active"
          icon={Layers}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Bookings", count: bookings.length },
          {
            key: "snagging",
            label: "Ready for Snagging",
            count: bookings.filter((b) => b.handoverStatus === "Ready for Snagging").length,
            badgeVariant: "warning",
          },
          {
            key: "dlp",
            label: "DLP Active (2-Year)",
            count: bookings.filter((b) => b.handoverStatus === "DLP Active").length,
          },
          {
            key: "handedover",
            label: "Fully Handed Over",
            count: bookings.filter((b) => b.handoverStatus === "Handed Over").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by booking ID, customer name, project or unit..."
        searchFields={["id", "customerName", "project", "unitNumber"]}
        emptyTitle="No property bookings found"
      />
    </div>
  );
}

