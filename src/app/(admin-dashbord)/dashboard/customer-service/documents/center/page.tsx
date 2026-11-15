"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import {
  getCustomerDocuments,
  getCustomerDocumentStats,
  createCustomerDocument,
  updateCustomerDocument,
  deleteCustomerDocument,
  CustomerDocumentItem,
  CustomerDocumentStats,
  DocumentCategory,
  DocumentVerificationStatus,
} from "@/services/customerDocumentsService";

export default function DocumentCenterPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId } = useSelectedProject();

  const [activeTab, setActiveTab] = useState("all");
  const [docs, setDocs] = useState<CustomerDocumentItem[]>([]);
  const [stats, setStats] = useState<CustomerDocumentStats>({
    total_archived: 0,
    pending_vetting: 0,
    signed_executed: 0,
    verified: 0,
    all_count: 0,
    pending_count: 0,
    executed_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Sale Agreement (Baina)");
  const [customer, setCustomer] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        getCustomerDocumentStats(projectId || undefined),
        getCustomerDocuments({
          project_id: projectId || undefined,
          tab: activeTab,
          limit: 100,
        }),
      ]);
      setStats(statsRes);
      setDocs(listRes.items);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !customer.trim()) {
      toast.error("Please provide document title and customer name");
      return;
    }

    setIsSubmitting(true);
    try {
      const fileName = `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`;
      await createCustomerDocument({
        doc_title: title.trim(),
        doc_category: category,
        customer_name: customer.trim(),
        unit_name: unit.trim() || undefined,
        project_id: projectId || undefined,
        file_name: fileName,
        file_size: "2.4 MB",
        verification_status: "Pending Vetting",
        notes: notes.trim() || undefined,
      });

      toast.success(`Document "${title}" uploaded to Customer Service repository`);
      setIsUploadOpen(false);
      setTitle("");
      setCustomer("");
      setUnit("");
      setNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (doc: CustomerDocumentItem) => {
    try {
      await updateCustomerDocument(doc.uuid, {
        verification_status: "Verified",
        notes: "Verified by legal vetting panel",
      });
      toast.success(`Document ${doc.doc_code} marked as Verified`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update verification status");
    }
  };

  const handleDelete = async (doc: CustomerDocumentItem) => {
    if (!confirm(`Are you sure you want to delete ${doc.doc_code} (${doc.doc_title})?`)) return;
    try {
      await deleteCustomerDocument(doc.uuid);
      toast.success(`Document ${doc.doc_code} removed from vault`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete document");
    }
  };

  const columns: Column<CustomerDocumentItem>[] = [
    {
      key: "doc_title",
      header: "DOCUMENT TITLE & ID",
      sortable: true,
      minWidth: "250px",
      render: (d) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{d.doc_title}</div>
          <div className="text-[11px] text-[#6B7280] tabular-nums mt-0.5">
            {d.doc_code} • {d.file_name || "document.pdf"} ({d.file_size || "2.4 MB"})
          </div>
        </div>
      ),
    },
    {
      key: "doc_category",
      header: "DOCUMENT CATEGORY",
      minWidth: "190px",
      render: (d) => (
        <span className="rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
          {d.doc_category}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "CUSTOMER & ALLOTMENT",
      minWidth: "190px",
      render: (d) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{d.customer_name}</div>
          <div className="text-[11px] text-[#6D4AFF] font-medium mt-0.5">
            {d.unit_name || "Unit Allotment"}
          </div>
        </div>
      ),
    },
    {
      key: "upload_date",
      header: "UPLOADED ON",
      minWidth: "130px",
      render: (d) => (
        <span className="text-[#6B7280] text-xs tabular-nums">{d.upload_date}</span>
      ),
    },
    {
      key: "verification_status",
      header: "LEGAL VETTING STATUS",
      minWidth: "180px",
      render: (d) => (
        <span
              className={`rounded - full px - 2.5 py - 0.5 text - [11px] font - semibold ${
      d.verification_status === "Signed & Executed"
        ? "bg-[#ECFDF3] text-[#039855] border border-[#A6F4C5]"
        : d.verification_status === "Verified"
          ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
          : d.verification_status === "Rejected"
            ? "bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]"
            : "bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89]"
    }`}
            >
              {d.verification_status}
            </span>
          ),
        },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "140px",
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          {d.verification_status === "Pending Vetting" && (
            <button
              type="button"
              onClick={() => handleVerify(d)}
              title="Verify Document"
              aria-label="Verify Document"
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#ECFDF3] border border-[#A6F4C5] text-[#039855] hover:bg-[#D1FADF] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#039855]"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toast.info(`Viewing document: ${ d.file_name || d.doc_title } `)}
            title="Preview Document"
            aria-label="Preview Document"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.success(`Downloading ${ d.file_name || d.doc_title } `)}
            title="Download PDF"
            aria-label="Download PDF"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#E5E7EB] transition shadow-xs"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(d)}
            title="Delete Document"
            aria-label="Delete Document"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] hover:bg-[#FEE4E2] transition shadow-xs"
          >
            <Trash2 className="h-4 w-4" />
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
          value={stats.total_archived.toString()}
          subtext="Stored in customer repository"
          icon={FolderOpen}
        />
        <CSStatCard
          title="Pending Legal Vetting"
          value={stats.pending_vetting.toString()}
          subtext="Awaiting panel lawyer sign-off"
          icon={Clock}
          iconBg="bg-[#FFFAEB]"
          iconColor="text-[#DC6803]"
        />
        <CSStatCard
          title="Executed Agreements"
          value={stats.signed_executed.toString()}
          subtext="Registered & executed copies"
          icon={FileCheck2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
        />
      </div>

      <CSFilterTabs
        tabs={[
          { key: "all", label: "All Documents", count: stats.all_count },
          {
            key: "executed",
            label: "Signed & Executed",
            count: stats.executed_count,
          },
          {
            key: "pending",
            label: "Pending Legal Vetting",
            count: stats.pending_count,
            badgeVariant: "warning",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D4AFF]" />
        </div>
      ) : (
        <CSTable
          data={docs}
          columns={columns}
          searchPlaceholder="Search document title, customer name, unit or file..."
          searchFields={["doc_title", "customer_name", "unit_name", "doc_category", "file_name", "doc_code"]}
          emptyTitle="No documents found"
        />
      )}

      {/* Upload Modal */}
      <CSModal
        isOpen={isUploadOpen}
        onClose={() => !isSubmitting && setIsUploadOpen(false)}
        title="Upload Customer Legal Document"
        subtitle="Add digital copy of agreements, allotments, or KYC records"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsUploadOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleUpload}
              className="h-9 px-4 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
              <option value="Other">Other Legal Deed</option>
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

          <div>
            <label className="block font-semibold text-[#374151] mb-1">Notes / Legal Description</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks regarding this agreement or legal file..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] outline-none focus:border-[#6D4AFF] focus:ring-1 focus:ring-[#6D4AFF] transition"
            />
          </div>
        </form>
      </CSModal>
    </div>
  );
}
