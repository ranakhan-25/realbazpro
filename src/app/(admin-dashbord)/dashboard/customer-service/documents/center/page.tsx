"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Shield,
  FileCheck2,
  FolderOpen,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface CustomerDocument {
  id: string;
  docTitle: string;
  docCategory: "Sale Agreement (Baina)" | "Allotment Letter" | "Power of Attorney (POA)" | "KYC & NID Scans" | "Possession Certificate";
  customerName: string;
  unit: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  verificationStatus: "Verified" | "Pending Vetting" | "Signed & Executed";
}

const INITIAL_DOCS: CustomerDocument[] = [
  {
    id: "DOC-201",
    docTitle: "Baina Deed & Sale Agreement (Registered Copy)",
    docCategory: "Sale Agreement (Baina)",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    fileName: "baina_deed_rafiqul_islam.pdf",
    fileSize: "4.8 MB",
    uploadDate: "2026-10-12",
    verificationStatus: "Signed & Executed",
  },
  {
    id: "DOC-202",
    docTitle: "Official Allotment Letter & Car Parking Bay",
    docCategory: "Allotment Letter",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    fileName: "allotment_letter_nazmul_huda.pdf",
    fileSize: "1.2 MB",
    uploadDate: "2026-09-05",
    verificationStatus: "Verified",
  },
  {
    id: "DOC-203",
    docTitle: "Power of Attorney (POA) for Sub-Registry Appearance",
    docCategory: "Power of Attorney (POA)",
    customerName: "Barrister Shahed Chowdhury",
    unit: "C-9, Sheba Green",
    fileName: "poa_shahed_chowdhury.pdf",
    fileSize: "2.1 MB",
    uploadDate: "2026-10-22",
    verificationStatus: "Pending Vetting",
  },
  {
    id: "DOC-204",
    docTitle: "Customer & Nominee NID & TIN Cert Scans",
    docCategory: "KYC & NID Scans",
    customerName: "Engr. Tanvir Ahmed",
    unit: "D-2, Uttara Green",
    fileName: "kyc_bundle_tanvir_ahmed.pdf",
    fileSize: "3.5 MB",
    uploadDate: "2026-08-14",
    verificationStatus: "Verified",
  },
];

export default function DocumentCenterPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";

  const [activeTab, setActiveTab] = useState("all");
  const [docs, setDocs] = useState<CustomerDocument[]>(INITIAL_DOCS);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CustomerDocument["docCategory"]>("Sale Agreement (Baina)");
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");

  const filtered = docs.filter((d) => {
    if (activeTab === "executed") return d.verificationStatus === "Signed & Executed";
    if (activeTab === "pending") return d.verificationStatus === "Pending Vetting";
    return true;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !customer) {
      toast.error("Please provide document title and customer name");
      return;
    }

    const created: CustomerDocument = {
      id: `DOC-${200 + docs.length + 1}`,
      docTitle: title,
      docCategory: category,
      customerName: customer,
      unit: unit || "Unit Allotment",
      fileName: `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: "2.4 MB",
      uploadDate: new Date().toISOString().split("T")[0],
      verificationStatus: "Pending Vetting",
    };

    setDocs([created, ...docs]);
    toast.success(`Document "${created.docTitle}" uploaded to Customer Service repository`);
    setIsUploadOpen(false);
  };

  const columns: Column<CustomerDocument>[] = [
    {
      key: "docTitle",
      header: "DOCUMENT TITLE & ID",
      sortable: true,
      minWidth: "250px",
      render: (d) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{d.docTitle}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {d.id} • {d.fileName} ({d.fileSize})
          </div>
        </div>
      ),
    },
    {
      key: "docCategory",
      header: "DOCUMENT CATEGORY",
      minWidth: "190px",
      render: (d) => (
        <span className="rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
          {d.docCategory}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "CUSTOMER & ALLOTMENT",
      minWidth: "190px",
      render: (d) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{d.customerName}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">{d.unit}</div>
        </div>
      ),
    },
    {
      key: "uploadDate",
      header: "UPLOADED ON",
      minWidth: "140px",
      render: (d) => <span className="text-[#6B7280] text-xs tabular-nums">{d.uploadDate}</span>,
    },
    {
      key: "verificationStatus",
      header: "LEGAL VETTING STATUS",
      minWidth: "180px",
      render: (d) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            d.verificationStatus === "Signed & Executed"
              ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
              : d.verificationStatus === "Pending Vetting"
                ? "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
                : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
          }`}
        >
          {d.verificationStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "110px",
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => toast.info(`Viewing document: ${d.fileName}`)}
            title="Preview Document"
            aria-label="Preview Document"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.success(`Downloading ${d.fileName}`)}
            title="Download PDF"
            aria-label="Download PDF"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] hover:border-[#6CE9A6] hover:text-[#027A48] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
      <CSPageHeader
        title="Document Centre & Digital Vault"
        subtitle="Manage customer contract deeds, registered Baina agreements, Power of Attorney and KYC dossiers."
        badge="Legal Vault"
        breadcrumbs={[{ label: "Documents & Land Records" }, { label: "Document Centre" }]}
        primaryAction={{
          label: "Upload Document",
          onClick: () => setIsUploadOpen(true),
          icon: Upload,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Archived Deeds"
          value={docs.length.toString()}
          subtext="Stored in customer repository"
          icon={FolderOpen}
        />
        <CSStatCard
          title="Pending Legal Vetting"
          value={docs.filter((d) => d.verificationStatus === "Pending Vetting").length.toString()}
          subtext="Awaiting panel lawyer sign-off"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Executed Agreements"
          value={docs.filter((d) => d.verificationStatus === "Signed & Executed").length.toString()}
          subtext="Registered & executed copies"
          icon={FileCheck2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Documents", count: docs.length },
          {
            key: "executed",
            label: "Signed & Executed",
            count: docs.filter((d) => d.verificationStatus === "Signed & Executed").length,
          },
          {
            key: "pending",
            label: "Pending Legal Vetting",
            count: docs.filter((d) => d.verificationStatus === "Pending Vetting").length,
            badgeVariant: "warning",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <CSTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search document title, customer name, unit or file..."
        searchFields={["docTitle", "customerName", "unit", "docCategory", "fileName"]}
        emptyTitle="No documents found"
      />

      {/* Upload Modal */}
      <CSModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Customer Legal Document"
        subtitle="Add digital copy of agreements, allotments, or KYC records"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              Upload to Vault
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Registered Baina Deed Copy"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] bg-white text-[#111827] transition"
            >
              <option value="Sale Agreement (Baina)">Sale Agreement (Baina Deed)</option>
              <option value="Allotment Letter">Official Allotment Letter</option>
              <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
              <option value="KYC & NID Scans">KYC, NID & TIN Dossier</option>
              <option value="Possession Certificate">Possession & Handover Certificate</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">Unit Number</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
              />
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
