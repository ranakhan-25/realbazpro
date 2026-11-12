"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronRight, FileText, Download, Printer, Search,
  FolderOpen, Image as ImageIcon, MoreVertical, ShieldCheck,
  Loader2, Plus, Upload,
} from "lucide-react";

// ============ TYPES ============
interface DocumentFile {
  uuid: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  uploadedDate: string;
  bookingId: string;
}

// ============ HELPERS ============
function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const getFileIcon = (type: string) => {
  if (type?.toLowerCase()?.includes("image") || type?.toLowerCase()?.includes("jpg") || type?.toLowerCase()?.includes("png")) {
    return <ImageIcon size={20} className="text-blue-500" />;
  }
  return <FileText size={20} className="text-red-500" />;
};

// ============ MAIN PAGE ============
export default function DocumentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingUuid =
    (params?.uuid as string) ||
    searchParams.get("uuid") ||
    searchParams.get("bookingId") ||
    "8266761a-5943-4eb0-9d9e-e2cfc858473a";

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!bookingUuid) {
      setError("Booking UUID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ API Call (GET /bookings/{uuid}/documents)
        const response = await fetch(
          `http://localhost:5002/realbizpro/api/v1/bookings/${bookingUuid}/documents`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setDocuments([]);
            return;
          }
          throw new Error("Failed to fetch documents.");
        }

        const result = await response.json();
        
        // ডাটা যদি { data: [...] } আকারে আসে বা সরাসরি অ্যারে আসে
        let finalData: DocumentFile[] = [];
        if (Array.isArray(result)) {
          finalData = result;
        } else if (result && Array.isArray(result.data)) {
          finalData = result.data;
        } else if (result && result.data && Array.isArray(result.data.data)) {
           finalData = result.data.data;
        }

        setDocuments(finalData);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        toast.error(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [bookingUuid]);

  // ===== GROUP BY CATEGORY & SEARCH FILTER =====
  const groupedDocuments = useMemo(() => {
    // ১. সার্চ অনুযায়ী ফিল্টার
    const filtered = documents.filter((doc) =>
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ২. ক্যাটাগরি অনুযায়ী গ্রুপ করা
    const groups: Record<string, DocumentFile[]> = {};
    filtered.forEach((doc) => {
      const cat = doc.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });

    return groups;
  }, [documents, searchQuery]);

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading Documents...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR / EMPTY STATE =====
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 max-w-md w-full">
          <p className="text-red-500 font-bold mb-2">Oops! Data not found.</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm">
              Try Again
            </button>
            <Link href="/dashboard/sales-management/bookings" className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              Go to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasDocuments = documents.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{bookingUuid}</span>
      </nav>

      {/* HEADER & TABS */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 flex-wrap">
              Documents Vault
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                {documents.length} Files
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">All files and legal paperwork related to this booking.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <button 
              onClick={() => toast.success("Upload modal would open here")}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
            >
              <Upload size={16} /> Upload
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
           <Link href={`/dashboard/sales-management/bookings/details/overview?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Overview</Link>
           <Link href={`/dashboard/sales-management/bookings/details/installments?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
           <Link href={`/dashboard/sales-management/bookings/details/agreement?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
           <Link href={`/dashboard/sales-management/bookings/details/registration?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
           <Link href={`/dashboard/sales-management/bookings/details/documents?uuid=${bookingUuid}`} className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Documents</Link>
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      {!hasDocuments ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
           <FolderOpen size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400">No documents found for this booking.</p>
        </div>
      ) : Object.keys(groupedDocuments).length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
           <Search size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400">No documents match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedDocuments).map(([category, files]) => (
            <div key={category} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <FolderOpen size={18} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{category}</h3>
                <span className="ml-auto text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-md">
                  {files.length} files
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {files.map((file) => (
                  <div key={file.uuid} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{file.fileSize} • {formatDate(file.uploadedDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <a 
                        href={file.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 gap-2 text-sm">
        <ShieldCheck size={18} />
        All documents are encrypted and access is logged for security purposes.
      </div>
    </div>
  );
}