/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect } from "react";
import { 
  Search, Loader2, CalendarDays, Eye, AlertCircle, 
  ChevronLeft, ChevronRight, FileText, Building2, 
  Mail, MapPin, User, Clock, CheckCircle2, X, Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

interface DemoBooking {
  uuid: string;
  organizationName: string;
  organizationEmail: string;
  organizationLocation: string;
  organizationYear: number;
  contactPersonName: string;
  tradeLicense: string;
  demoDate: string;
  meetingTime: string;
  createdAt: string;
}

export default function AdminDemoBookingsPage() {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal / Drawer State
  const [selectedBooking, setSelectedBooking] = useState<DemoBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Update Form State
  const [meetingTime, setMeetingTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = getStoredAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search: search })
      });

      const response = await fetch(`${baseUrl}/realbizpro/api/v1/auth/demobook?${queryParams}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const json = await response.json();
        
        // ✅ EXACT PARSING: Backend theke jevabe ashche
        let extractedBookings: DemoBooking[] = [];
        let metaData = { totalPages: 1, total: 0 };

        // JSON: { success: true, data: { data: [...], meta: {...} } }
        if (json.success && json.data) {
          extractedBookings = json.data.data || []; 
          metaData = {
            totalPages: json.data.meta?.totalPages || 1,
            total: json.data.meta?.total || 0
          };
        } 
        // Fallback
        else if (Array.isArray(json)) {
          extractedBookings = json;
        } else {
          extractedBookings = json.data?.data || json.data || json.items || json.rows || [];
        }

        setBookings(extractedBookings);
        setTotalPages(metaData.totalPages);
        setTotalItems(metaData.total);
        
      } else {
        setError(`Failed to load demo bookings. Status: ${response.status}`);
      }
    } catch (err) {
      setError("Network error while fetching data.");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleOpenDrawer = (booking: DemoBooking) => {
    setSelectedBooking(booking);
    setMeetingTime(booking.meetingTime || "");
    setIsDrawerOpen(true);
    setUpdateError("");
    setUpdateSuccess(false);
  };

  const handleUpdateMeetingTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTime) {
      setUpdateError("Please select a meeting time.");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess(false);

    try {
      const token = getStoredAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

      const response = await fetch(`${baseUrl}/realbizpro/api/v1/auth/demobook/${selectedBooking?.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ meetingTime }),
      });

      if (response.ok) {
        setUpdateSuccess(true);
        setBookings(prev => prev.map(b => 
          b.uuid === selectedBooking?.uuid ? { ...b, meetingTime } : b
        ));
        if (selectedBooking) {
          setSelectedBooking({ ...selectedBooking, meetingTime });
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setUpdateError(data.message || "Failed to update meeting time.");
      }
    } catch (err) {
      setUpdateError("Network error while updating.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative min-h-screen">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Demo Bookings</h1>
          <p className="text-sm text-slate-500">Manage and view all demo requests from your website.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search organization, email..." 
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Organization</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Demo Date & Time</th>
                <th className="p-4">Requested On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0000F2]" />
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No demo bookings found.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    key={booking.uuid} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{booking.organizationName}</div>
                      <div className="text-xs text-slate-500">{booking.organizationEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{booking.contactPersonName}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <CalendarDays size={14} className="text-slate-400" />
                        {booking.demoDate ? new Date(booking.demoDate).toLocaleDateString() : "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{booking.meetingTime || "Not set"}</div>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenDrawer(booking)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0000F2] transition shadow-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && bookings.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing page {page} of {totalPages} ({totalItems} total)
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer Overlay & Content */}
      <AnimatePresence>
        {isDrawerOpen && selectedBooking && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Booking Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Requested on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : "N/A"}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Organization Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Organization Info</h3>
                  
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Name</p><p className="font-semibold text-slate-900">{selectedBooking.organizationName}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Email</p><p className="font-semibold text-slate-900">{selectedBooking.organizationEmail}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Location</p><p className="font-semibold text-slate-900">{selectedBooking.organizationLocation}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Established Year</p><p className="font-semibold text-slate-900">{selectedBooking.organizationYear}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Trade License</p><p className="font-semibold text-slate-900">{selectedBooking.tradeLicense || "N/A"}</p></div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Contact & Meeting</h3>
                  
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Contact Person</p><p className="font-semibold text-slate-900">{selectedBooking.contactPersonName}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div><p className="text-xs text-slate-500">Preferred Date</p><p className="font-semibold text-slate-900">{selectedBooking.demoDate ? new Date(selectedBooking.demoDate).toLocaleDateString() : "N/A"}</p></div>
                  </div>
                </div>

                {/* Update Form */}
                <form onSubmit={handleUpdateMeetingTime} className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-2">
                    Set / Update Meeting Time
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        disabled={isUpdating}
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating || meetingTime === selectedBooking.meetingTime}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0000F2] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0000F2]/90 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                      Save
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {updateSuccess && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Time updated successfully!
                      </motion.p>
                    )}
                    {updateError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle size={14} /> {updateError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}