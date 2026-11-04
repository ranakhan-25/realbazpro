"use client";

import React, { useState } from "react";
import {
  Users,
  Eye,
  Phone,
  Mail,
  MapPin,
  Shield,
  Plus,
  FileText,
  UserCheck,
  Building,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSDetailDrawer } from "@/components/customer-service/CSDetailDrawer";
import { CSModal } from "@/components/customer-service/CSModal";
import { MOCK_CUSTOMERS, CustomerProfile } from "@/services/customerServiceData";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export default function Customer360Page() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [customers, setCustomers] = useState<CustomerProfile[]>(MOCK_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNid, setNewNid] = useState("");
  const [newNominee, setNewNominee] = useState("");
  const [newNomineeRel, setNewNomineeRel] = useState("Spouse");

  const filteredCustomers = customers.filter((c) => {
    if (activeTab === "vip") return c.status === "vip";
    if (activeTab === "active") return c.status === "active";
    if (activeTab === "disputed") return c.status === "disputed";
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newNid.trim()) {
      toast.error("Please enter Name, Phone and NID");
      return;
    }

    const created: CustomerProfile = {
      id: `CUST-00${customers.length + 1}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || "no-email@customer.com",
      nid: newNid.trim(),
      address: "Dhaka, Bangladesh",
      nomineeName: newNominee.trim() || "Unspecified",
      nomineeRelation: newNomineeRel,
      nomineeNid: "N/A",
      totalBookings: 1,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      status: "active",
      joinedDate: new Date().toISOString().split("T")[0],
    };

    setCustomers([created, ...customers]);
    toast.success(`Customer profile for ${created.name} created successfully`);
    setIsCreateOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewNid("");
    setNewNominee("");
  };

  const columns: Column<CustomerProfile>[] = [
    {
      key: "name",
      header: "CUSTOMER NAME & ID",
      sortable: true,
      minWidth: "220px",
      render: (c) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{c.name}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">{c.id}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "CONTACT",
      minWidth: "190px",
      render: (c) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#374151] tabular-nums font-medium">
            <Phone className="h-3 w-3 text-[#9CA3AF]" /> {c.phone}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <Mail className="h-3 w-3 text-[#9CA3AF]" /> {c.email}
          </div>
        </div>
      ),
    },
    {
      key: "nid",
      header: "NID / TIN",
      minWidth: "160px",
      render: (c) => (
        <div>
          <div className="tabular-nums text-xs font-medium text-[#111827]">{c.nid}</div>
          {c.tin && (
            <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">TIN: {c.tin}</div>
          )}
        </div>
      ),
    },
    {
      key: "nomineeName",
      header: "NOMINEE",
      minWidth: "160px",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-[#111827]">{c.nomineeName}</div>
          <div className="text-[11px] text-[#6B7280]">({c.nomineeRelation})</div>
        </div>
      ),
    },
    {
      key: "totalPaidAmount",
      header: "FINANCIALS",
      minWidth: "160px",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-[#039855] tabular-nums">
            Paid: ৳ {(c.totalPaidAmount / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] font-medium text-[#6B7280] tabular-nums mt-0.5">
            Due: ৳ {(c.totalDueAmount / 100000).toFixed(1)} Lac
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      minWidth: "120px",
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
            c.status === "vip"
              ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
              : c.status === "active"
                ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
                : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
          }`}
        >
          {c.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "90px",
      render: (c) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedCustomer(c)}
            title="View Customer 360° Profile"
            aria-label="View Customer 360° Profile"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Customer 360° Profiles"
        subtitle="Master customer directory, nominee KYC, co-applicants, and property lifecycle timeline."
        badge="Post-Sales CRM"
        breadcrumbs={[{ label: "Customers & Properties" }, { label: "Customer 360°" }]}
        primaryAction={{
          label: "Add Customer Profile",
          onClick: () => setIsCreateOpen(true),
          icon: Plus,
        }}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Registered Clients"
          value={customers.length.toString()}
          subtext="With active apartment / plot bookings"
          icon={Users}
        />
        <CSStatCard
          title="VIP Clients"
          value={customers.filter((c) => c.status === "vip").length.toString()}
          subtext="High-value multi-unit portfolios"
          icon={UserCheck}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Total Lifetime Collections"
          value="৳ 3.86 Cr"
          subtext="Verified money receipts ledger"
          icon={Building}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      {/* Filter Tabs */}
      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Customers", count: customers.length },
          {
            key: "vip",
            label: "VIP Clients",
            count: customers.filter((c) => c.status === "vip").length,
          },
          {
            key: "active",
            label: "Active Regular",
            count: customers.filter((c) => c.status === "active").length,
          },
          {
            key: "disputed",
            label: "Flagged / Disputed",
            count: customers.filter((c) => c.status === "disputed").length,
            badgeVariant: "danger",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Table */}
      <CSTable
        data={filteredCustomers}
        columns={columns}
        searchPlaceholder="Search by customer name, phone, NID or nominee..."
        searchFields={["name", "phone", "nid", "nomineeName"]}
        emptyTitle="No customers match this filter"
      />

      {/* Slide-over Customer 360° Profile Drawer */}
      <CSDetailDrawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || "Customer 360° Profile"}
        badge={selectedCustomer?.status?.toUpperCase()}
        subtitle={`ID: ${selectedCustomer?.id} | Enrolled: ${selectedCustomer?.joinedDate}`}
        width="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 text-xs">
            {/* Contact & KYC Details */}
            <div className="rounded-[12px] border border-[#E5E7EB] p-4 space-y-3 bg-[#F9FAFB]">
              <h4 className="font-semibold text-[#111827] text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#6D4AFF]" /> Verified KYC & Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-[#374151]">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Primary Phone</span>
                  <span className="font-semibold tabular-nums text-[#111827]">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Email Address</span>
                  <span className="font-semibold text-[#111827]">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">National ID (NID)</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedCustomer.nid}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">e-TIN Reference</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedCustomer.tin || "Not Provided"}</span>
                </div>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Mailing Address</span>
                <span className="font-medium text-[#111827]">{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Nominee Details */}
            <div className="rounded-[12px] border border-[#E5E7EB] p-4 space-y-2 bg-white">
              <h4 className="font-semibold text-[#111827] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#6D4AFF]" /> Registered Nominee Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Nominee Full Name</span>
                  <span className="font-semibold text-[#111827]">{selectedCustomer.nomineeName}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Relationship</span>
                  <span className="font-semibold text-[#111827]">{selectedCustomer.nomineeRelation}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6B7280] block text-[11px]">Nominee NID / Birth Cert</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedCustomer.nomineeNid}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-[12px] border border-[#A6F4C5] bg-[#ECFDF3]/40 p-4 space-y-2">
              <h4 className="font-semibold text-[#027A48] flex items-center gap-2">
                <Building className="h-4 w-4 text-[#039855]" /> Property Ledger Balance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-[#A6F4C5]/60 shadow-xs">
                  <span className="text-[#6B7280] block text-[11px]">Total Paid Amount</span>
                  <span className="text-base font-semibold text-[#039855] tabular-nums">
                    ৳ {selectedCustomer.totalPaidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-xs">
                  <span className="text-[#6B7280] block text-[11px]">Remaining Due Balance</span>
                  <span className="text-base font-semibold text-[#111827] tabular-nums">
                    ৳ {selectedCustomer.totalDueAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CSDetailDrawer>

      {/* Add Customer Modal */}
      <CSModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Customer Profile"
        subtitle="Register purchaser details for post-sales portfolio tracking"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Save Profile
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mohammad Rafiqul Islam"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+880 1711-XXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                National ID (NID) *
              </label>
              <input
                type="text"
                required
                value={newNid}
                onChange={(e) => setNewNid(e.target.value)}
                placeholder="10 / 17 digit NID"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] tabular-nums outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E7EB]">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Nominee Name
              </label>
              <input
                type="text"
                value={newNominee}
                onChange={(e) => setNewNominee(e.target.value)}
                placeholder="Nominee full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Nominee Relation
              </label>
              <select
                value={newNomineeRel}
                onChange={(e) => setNewNomineeRel(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
              </select>
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
