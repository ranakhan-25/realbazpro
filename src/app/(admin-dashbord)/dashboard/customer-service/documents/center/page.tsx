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
  const brand = primaryColor || "#0000F2";

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
      header: "Document Title & ID",
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-bold text-slate-900">{d.docTitle}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            {d.id} • {d.fileName} ({d.fileSize})
          </div>
        </div>
      ),
    },
    {
      key: "docCategory",
      header: "Document Category",
      render: (d) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
          {d.docCategory}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer & Allotment",
      render: (d) => (
        <div>
          <div className="font-semibold text-slate-800">{d.customerName}</div>
          <div className="text-[11px] text-blue-600 font-medium">{d.unit}</div>
        </div>
      ),
    },
    {
      key: "uploadDate",
      header: "Uploaded On",
      render: (d) => <span className="text-slate-600">{d.uploadDate}</span>,
    },
    {
      key: "verificationStatus",
      header: "Legal Vetting Status",
      render: (d) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            d.verificationStatus === "Signed & Executed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : d.verificationStatus === "Pending Vetting"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {d.verificationStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toast.info(`Viewing document: ${d.fileName}`)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
            title="Preview Document"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.success(`Downloading ${d.fileName}`)}
            className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
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
          title="Digital Dossiers Stored"
          value={docs.length.toString()}
          subtext="Verified client files"
          icon={FolderOpen}
        />
        <CSStatCard
          title="Fully Executed Deeds"
          value={docs.filter((d) => d.verificationStatus === "Signed & Executed").length.toString()}
          subtext="Registered and notarized"
          icon={FileCheck2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <CSStatCard
          title="Pending Legal Vetting"
          value={docs.filter((d) => d.verificationStatus === "Pending Vetting").length.toString()}
          subtext="Under in-house counsel review"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
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
            label: "Pending Vetting",
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
        searchPlaceholder="Search document title, customer, unit or category..."
        searchFields={["docTitle", "customerName", "unit", "docCategory"]}
        emptyTitle="No documents found in vault"
      />

      {/* Modal */}
      <CSModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Customer Dossier / Legal Deed"
        subtitle="Upload signed contracts with category categorization"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              Confirm Upload
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Registered Baina Deed"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-9 px-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
            >
              <option value="Sale Agreement (Baina)">Sale Agreement (Baina)</option>
              <option value="Allotment Letter">Allotment Letter</option>
              <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
              <option value="KYC & NID Scans">KYC & NID Scans</option>
              <option value="Possession Certificate">Possession Certificate</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Purchaser name"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Allotment</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. A-7, Hena Heights"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </form>
      </CSModal>
    </div>
  );
}

