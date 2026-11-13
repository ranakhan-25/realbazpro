"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, CheckCircle2, Clock, XCircle, User,
  FileText, Download, Printer, Hash, ShieldCheck,
  Loader2, Plus, Calendar, X
} from "lucide-react";

// ============ TYPES ============
interface ApprovalData {
  uuid: string;
  approvalId: string;
  title: string;
  requestedBy: string;
  approverName: string | null;
  status: "Pending" | "Approved" | "Rejected";
  notes: string | null;
  approvedDate: string | null;
}

// ============ MOCK DATA ============
const MOCK_APPROVAL: ApprovalData = {
  uuid: "mock-apv-uuid",
  approvalId: "APV-2024-012",
  title: "Discount Approval for Booking",
  requestedBy: "Rashed Karim (Sales Executive)",
  approverName: "Md. Abdul Rahman (Manager)",
  status: "Approved",
  notes: "Approved as per management decision. A 5% discount is granted.",
  approvedDate: "2024-02-25",
};

// ============ HELPERS ============
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  Pending: { bg: "bg-amber-100 text-amber-700", text: "text-amber-600", icon: Clock },
  Approved: { bg: "bg-emerald-100 text-emerald-700", text: "text-emerald-600", icon: CheckCircle2 },
  Rejected: { bg: "bg-red-100 text-red-700", text: "text-red-600", icon: XCircle },
};

// ============ MAIN PAGE ============
export default function ApprovalDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [data, setData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Modal Form State
  const [formData, setFormData] = useState({
    approvalId: "",
    title: "",
    requestedBy: "",
    approverName: "",
    status: "Pending" as "Pending" | "Approved" | "Rejected",
    notes: "",
    approvedDate: new Date().toISOString().split("T")[0],
  });

  // ✅ Fetch Data
  useEffect(() => {
    const fetchApproval = async () => {
      try {
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/approval`
        );
        if (response.ok) {
          const result = await response.json();
          const approvalData = result?.data || result;
          if (approvalData && approvalData.uuid) {
            setData(approvalData);
            return;
          }
        }
      } catch (err) {
        console.log("API error, using mock data");
      } finally {
        setLoading(false);
      }
      setData(MOCK_APPROVAL);
    };
    fetchApproval();
  }, [bookingUuid]);

  // ✅ Save Function (API Call)
  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        approvalId: formData.approvalId || `APV-${Date.now()}`,
        title: formData.title || "New Approval Request",
        requestedBy: formData.requestedBy || "N/A",
        approverName: formData.approverName || "N/A",
        status: formData.status,
        notes: formData.notes,
        approvedDate: formData.approvedDate,
      };

      const response = await fetch(
        `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save");
      }

      toast.success("Approval saved successfully!");
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save approval");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const displayData = data || MOCK_APPROVAL;
  const cfg = statusColors[displayData.status] || statusColors.Pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* ===== CREATE MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Approval</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateApproval} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Title
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Discount Request" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Requested By
                  <input type="text" value={formData.requestedBy} onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Rashed Karim" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Approver Name
                  <input type="text" value={formData.approverName} onChange={(e) => setFormData({ ...formData, approverName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Md. Abdul Rahman" />
                </label>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Status
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as "Pending" | "Approved" | "Rejected" })} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </label>
              </div>
              <label className="text-sm text-gray-600 dark:text-gray-300 block">
                Notes
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Enter notes..." />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : "Save Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Approval Request
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.bg}`}>
                <StatusIcon size={12} /> {displayData.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} /> Approval ID: {displayData.approvalId}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Create Approval
            </button>
            <button onClick={() => toast("Preparing document for print...", { icon: "🖨️" })} className="px-4 py-2 rounded-xl border border-gray-200 text-sm flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
           <Link href={`/dashboard/sales-management/bookings/details/overview?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Overview</Link>
           <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Agreement</Link>
           <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Registration</Link>
           <Link href={`/dashboard/sales-management/bookings/details/documents?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Documents</Link>
           <Link href={`/dashboard/sales-management/bookings/details/approval?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Approvals</Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Approval Details
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs text-gray-500 mb-1">Title</p>
                <p className="text-sm font-semibold text-gray-900">{displayData.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border">
                  <p className="text-xs text-gray-500 mb-1">Requested By</p>
                  <p className="text-sm font-semibold text-gray-900">{displayData.requestedBy}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border">
                  <p className="text-xs text-gray-500 mb-1">Approver</p>
                  <p className="text-sm font-semibold text-gray-900">{displayData.approverName || "Not Assigned"}</p>
                </div>
              </div>
              {displayData.notes && (
                <div className="p-4 rounded-xl bg-gray-50 border">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{displayData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" /> Audit
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold ${cfg.text}`}>{displayData.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">{formatDate(displayData.approvedDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}