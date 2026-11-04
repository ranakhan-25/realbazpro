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
      header: "BOOKING ID & DATE",
      sortable: true,
      minWidth: "180px",
      render: (b) => (
        <div>
          <span className="font-semibold text-[#111827] tabular-nums text-xs">{b.id}</span>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{b.bookingDate}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER",
      minWidth: "180px",
      render: (b) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{b.customerName}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{b.customerPhone}</div>
        </div>
      ),
    },
    {
      key: "project",
      header: "PROJECT & UNIT",
      minWidth: "220px",
      render: (b) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{b.project}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            Unit: {b.unitNumber} ({b.sizeSqFt} sft)
          </div>
        </div>
      ),
    },
    {
      key: "totalPrice",
      header: "VALUATION & LEDGER",
      minWidth: "190px",
      render: (b) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#111827] tabular-nums">
            ৳ {(b.totalPrice / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] text-[#039855] font-medium tabular-nums">
            Paid: ৳ {(b.paidAmount / 100000).toFixed(1)} Lac
          </div>
          {b.dueAmount > 0 ? (
            <div className="text-[10px] text-[#DC6803] font-medium tabular-nums">
              Due: ৳ {(b.dueAmount / 100000).toFixed(1)} Lac
            </div>
          ) : (
            <div className="text-[10px] text-[#039855] font-semibold">Paid in Full</div>
          )}
        </div>
      ),
    },
    {
      key: "handoverStatus",
      header: "HANDOVER & DLP",
      minWidth: "160px",
      render: (b) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            b.handoverStatus === "DLP Active"
              ? "bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]"
              : b.handoverStatus === "Ready for Snagging"
                ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                : b.handoverStatus === "Handed Over"
                  ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                  : "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]"
          }`}
        >
          {b.handoverStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "150px",
      render: (b) => (
        <div className="flex items-center justify-end">
          <Link
            href="/dashboard/customer-service/payments/schedules-demand-letters"
            title="View Demand Letter & Payment Schedule"
            aria-label="View Demand Letter"
            className="h-8 px-3 rounded-lg inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Demand Letter <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
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
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Active 2-Year DLP Coverage"
          value="142 Flats"
          subtext="Statutory warranty active"
          icon={Layers}
          iconBg="bg-[#F4F1FF]"
          iconColor="text-[#6D4AFF]"
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
