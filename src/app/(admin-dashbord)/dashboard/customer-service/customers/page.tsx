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
  const brand = primaryColor || "#0000F2";

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
      header: "Customer Name & ID",
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900">{c.name}</div>
          <div className="text-[11px] font-mono text-slate-400">{c.id}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact",
      render: (c) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <Phone className="h-3 w-3 text-slate-400" /> {c.phone}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Mail className="h-3 w-3 text-slate-400" /> {c.email}
          </div>
        </div>
      ),
    },
    {
      key: "nid",
      header: "NID / TIN",
      render: (c) => (
        <div>
          <div className="font-mono text-xs text-slate-800">{c.nid}</div>
          {c.tin && (
            <div className="text-[11px] text-slate-400">TIN: {c.tin}</div>
          )}
        </div>
      ),
    },
    {
      key: "nomineeName",
      header: "Nominee",
      render: (c) => (
        <div>
          <div className="text-xs font-semibold text-slate-700">{c.nomineeName}</div>
          <div className="text-[11px] text-slate-400">({c.nomineeRelation})</div>
        </div>
      ),
    },
    {
      key: "totalPaidAmount",
      header: "Financials",
      render: (c) => (
        <div>
          <div className="text-xs font-bold text-emerald-600">
            Paid: ৳ {(c.totalPaidAmount / 100000).toFixed(1)} Lac
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Due: ৳ {(c.totalDueAmount / 100000).toFixed(1)} Lac
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            c.status === "vip"
              ? "bg-amber-100 text-amber-800 font-bold"
              : c.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
          }`}
        >
          {c.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "90px",
      render: (c) => (
        <button
          type="button"
          onClick={() => setSelectedCustomer(c)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Eye className="h-3.5 w-3.5 text-blue-600" /> View 360°
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <CSStatCard
          title="Total Lifetime Collections"
          value="৳ 3.86 Cr"
          subtext="Verified money receipts ledger"
          icon={Building}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
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
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" /> Verified KYC & Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                  <span className="font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-semibold">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">National ID (NID)</span>
                  <span className="font-mono font-semibold">{selectedCustomer.nid}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">e-TIN Reference</span>
                  <span className="font-mono font-semibold">{selectedCustomer.tin || "Not Provided"}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Mailing Address</span>
                <span className="font-medium text-slate-800">{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Nominee Details */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" /> Registered Nominee Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nominee Full Name</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.nomineeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Relationship</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.nomineeRelation}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Nominee NID / Birth Cert</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedCustomer.nomineeNid}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600" /> Property Ledger Balance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block text-[11px]">Total Paid Amount</span>
                  <span className="text-base font-bold text-emerald-700">
                    ৳ {selectedCustomer.totalPaidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block text-[11px]">Remaining Due Balance</span>
                  <span className="text-base font-bold text-slate-900">
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              Save Profile
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mohammad Rafiqul Islam"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+880 1711-XXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                National ID (NID) *
              </label>
              <input
                type="text"
                required
                value={newNid}
                onChange={(e) => setNewNid(e.target.value)}
                placeholder="10 / 17 digit NID"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominee Name
              </label>
              <input
                type="text"
                value={newNominee}
                onChange={(e) => setNewNominee(e.target.value)}
                placeholder="Nominee full name"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominee Relation
              </label>
              <select
                value={newNomineeRel}
                onChange={(e) => setNewNomineeRel(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
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

