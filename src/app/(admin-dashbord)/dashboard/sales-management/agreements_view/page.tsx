"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Download,
  Eye,
  Plus,
  DollarSign,
  FileCheck,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  ChevronLeft,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ============ TYPES ============
interface Agreement {
  id: string; 
  agreementCode: string;
  buyer: string;
  buyerAvatar?: string;
  property: string;
  propertyCode: string;
  propertyType: string;
  price: string | number; 
  advance: string | number;
  date?: string;
  agreementDate?: string;
  status: string; 
  image?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  notes?: string;
}

interface Stats {
  total: number;
  signed: number;
  pendingAction: number;
  totalValue: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  signed: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  draft: {
    bg: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    icon: FileText,
  },
};

// ============ UTILS ============
function formatMoney(n: string | number) {
  const num = Number(n);
  if (!num && num !== 0) return "৳0";
  if (num >= 10_000_000) return `৳${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `৳${(num / 100_000).toFixed(2)} L`;
  return `৳${num.toLocaleString()}`;
}

function formatDate(d?: string) {
  if (!d) return "N/A";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "N/A"; 
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// 💡 CUSTOM IMAGE COMPONENT WITH FALLBACK
const ImageWithFallback = ({ 
  src, 
  alt, 
  className, 
  fallbackIcon: Icon 
}: { 
  src?: string; 
  alt: string; 
  className?: string; 
  fallbackIcon?: any 
}) => {
  const [error, setError] = useState(false);

  // প্রপার্টি ইমেজের জন্য ডিফল্ট প্লেসহোল্ডার
  const defaultImg = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";
  // বায়ার অ্যাভাটারের জন্য ডিফল্ট প্লেসহোল্ডার
  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(alt) + "&background=6366f1&color=fff&size=150";

  const isAvatar = className?.includes("rounded-full");
  
  if (!src || error || src.includes("...")) {
    return Icon ? (
      <div className={`${className} flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-400`}>
        <Icon size={24} />
      </div>
    ) : (
      <img 
        src={isAvatar ? defaultAvatar : defaultImg} 
        alt={alt} 
        className={className} 
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)} 
    />
  );
};

// ============ MAIN COMPONENT ============
export default function AgreementsViewPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, signed: 0, pendingAction: 0, totalValue: 0 });
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  // -- Fetch Agreements --
  const fetchAgreements = useCallback(async (searchQuery: string = "", pageNumber: number = 1) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const url = new URL(`${API_BASE_URL}/agreements`);
      if (searchQuery) url.searchParams.append("search", searchQuery);
      url.searchParams.append("page", pageNumber.toString());
      url.searchParams.append("limit", "10");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch data");

      const responseData = await res.json();
      
      let list: Agreement[] = [];
      let metaData = { total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false };

      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        list = responseData.data.data;
        if (responseData.data.meta) metaData = responseData.data.meta;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        list = responseData.data;
        if (responseData.meta) metaData = responseData.meta;
      } else if (Array.isArray(responseData)) {
        list = responseData;
      }

      setAgreements(list);
      setMeta(metaData);
    } catch (error: any) {
      console.error("Failed to fetch agreements", error);
      setErrorMsg("Failed to load agreements");
      setAgreements([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -- Fetch Stats --
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agreements/stats`);
      if (!res.ok) return;
      const responseData = await res.json();
      setStats(responseData?.data || responseData);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, []);

  useEffect(() => {
    fetchAgreements(search, 1);
    fetchStats();
  }, [fetchAgreements, fetchStats]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchAgreements(search, 1);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, fetchAgreements]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agreement?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/agreements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Agreement deleted successfully!");
      fetchAgreements(search, meta.page);
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete agreement");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchAgreements(search, newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/payment-plans" className="hover:text-indigo-600 transition-colors">Payment Plans</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">Agreements</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Agreements View</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage property sale agreements, contracts, and buyer details.</p>
        </div>
        <Link href="/dashboard/sales-management/agreements_create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 w-fit">
          <Plus size={16} /> New Agreement
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <FileCheck size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Agreements</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || meta.total || agreements.length}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle2 size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Signed Contracts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.signed}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Clock size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending Action</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingAction}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(stats.totalValue)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by buyer, property, or Agreement ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle size={18} />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
           <div className="py-20 flex flex-col items-center justify-center text-gray-500">
             <Loader2 size={32} className="animate-spin mb-4 text-indigo-600" />
             <p>Loading agreements...</p>
           </div>
        ) : agreements.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No agreements found matching your search.</p>
          </div>
        ) : (
          agreements.map((agreement) => {
            const safeStatus = String(agreement.status || "draft").toLowerCase();
            const cfg = statusConfig[safeStatus] || statusConfig["draft"];
            const StatusIcon = cfg.icon;

            return (
              <div key={agreement.id} className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  
                  {/* Property Info with Custom Fallback Image */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <ImageWithFallback
                      src={agreement.image}
                      alt={agreement.property}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100 dark:bg-gray-800"
                      fallbackIcon={MapPin}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                          {agreement.agreementCode}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon size={10} />
                          {agreement.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{agreement.property}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} /> {agreement.propertyCode} • {agreement.propertyType}
                      </p>
                    </div>
                  </div>

                  {/* Buyer Info with Custom Fallback Avatar */}
                  <div className="flex items-center gap-3 lg:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                    <ImageWithFallback
                      src={agreement.buyerAvatar}
                      alt={agreement.buyer}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{agreement.buyer}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Buyer</p>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="grid grid-cols-2 gap-4 lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Total Price</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(agreement.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Advance</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(agreement.advance)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-48 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-3 lg:pt-0 lg:pl-5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={14} />
                      {formatDate(agreement.date || agreement.agreementDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedAgreement(agreement)} title="View Agreement" className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDelete(agreement.id)} title="Delete" className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {!isLoading && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing page <span className="font-semibold text-gray-900 dark:text-white">{meta.page}</span> of <span className="font-semibold text-gray-900 dark:text-white">{meta.totalPages}</span> ({meta.total} results)
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(meta.page - 1)} disabled={!meta.hasPrev} className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={() => handlePageChange(meta.page + 1)} disabled={!meta.hasNext} className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Agreement Details</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedAgreement.agreementCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgreement(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-start gap-4">
                <ImageWithFallback
                  src={selectedAgreement.image}
                  alt={selectedAgreement.property}
                  className="w-24 h-24 rounded-xl object-cover bg-gray-100 dark:bg-gray-800"
                  fallbackIcon={MapPin}
                />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedAgreement.property}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <MapPin size={14} /> {selectedAgreement.propertyCode} • {selectedAgreement.propertyType}
                  </p>
                  <div className="mt-3 flex gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Total Price</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{formatMoney(selectedAgreement.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Advance Paid</p>
                      <p className="font-bold text-emerald-600 text-lg">{formatMoney(selectedAgreement.advance)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <ImageWithFallback 
                    src={selectedAgreement.buyerAvatar} 
                    alt={selectedAgreement.buyer}
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <p className="text-xs text-gray-500">Buyer Name</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                      <User size={14} /> {selectedAgreement.buyer}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact Info</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail size={14} /> {selectedAgreement.buyerEmail || "N/A"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                    <Phone size={14} /> {selectedAgreement.buyerPhone || "N/A"}
                  </p>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              <div>
                <p className="text-xs text-gray-500 mb-1.5">Internal Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  {selectedAgreement.notes || "No notes provided."}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedAgreement(null)} className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-semibold transition-colors">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}