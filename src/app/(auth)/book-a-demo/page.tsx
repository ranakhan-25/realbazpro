/* eslint-disable prettier/prettier */
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Building2, Mail, User, FileText, 
  CalendarDays, Clock, Loader2, CheckCircle2, AlertCircle, Sparkles, MapPin, Calendar
} from "lucide-react";

export default function BookADemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Backend er exact fields onujayi state update kora hoyeche
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationLocation: "",
    organizationEmail: "",
    organizationYear: new Date().getFullYear(),
    demoDate: "",
    contactPersonName: "",
    meetingTime: "",
    tradeLicense: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Basic Validation
    if (
      !formData.organizationName || 
      !formData.organizationLocation || 
      !formData.organizationEmail || 
      !formData.organizationYear ||
      !formData.demoDate ||
      !formData.contactPersonName || 
      !formData.meetingTime
    ) {
      setError("Please fill in all the required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

      const response = await fetch(`${baseUrl}/realbizpro/api/v1/auth/demobook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Year ke number e convert kora holo jate backend error na dey
          organizationYear: parseInt(formData.organizationYear as any, 10),
        }),
      });

      if (response.ok || response.status === 201) {
        setSuccess(true);
        // Reset form
        setFormData({
          organizationName: "",
          organizationLocation: "",
          organizationEmail: "",
          organizationYear: new Date().getFullYear(),
          demoDate: "",
          contactPersonName: "",
          meetingTime: "",
          tradeLicense: "",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        console.error("API Error Details:", data);
        // Backend theke array of errors ashte pare, seta handle kora holo
        if (Array.isArray(data.message)) {
          setError(data.message.join(", "));
        } else {
          setError(data.message || data.error || "Failed to book a demo. Please check your inputs and try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-8 text-center relative">
          <Link href="/" className="absolute left-6 top-8 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft size={14} /> Back
          </Link>
          
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Sparkles className="h-6 w-6 text-[#0000F2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Book a Demo</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Fill out the form below and our team will get back to you to schedule a personalized demo.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              
              {/* Organization Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="e.g. RealBiz Ltd."
                  />
                </div>
              </div>

              {/* Organization Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="organizationLocation"
                    value={formData.organizationLocation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="e.g. Dhaka, Bangladesh"
                  />
                </div>
              </div>

              {/* Organization Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Est. Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="number"
                    name="organizationYear"
                    value={formData.organizationYear}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min={1800}
                    max={2100}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="e.g. 2015"
                  />
                </div>
              </div>

              {/* Organization Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Organization Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="organizationEmail"
                    value={formData.organizationEmail}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="info@company.com"
                  />
                </div>
              </div>

              {/* Contact Person Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Trade License */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Trade License (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="tradeLicense"
                    value={formData.tradeLicense}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                    placeholder="Trade License Number"
                  />
                </div>
              </div>

              {/* Demo Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    name="demoDate"
                    value={formData.demoDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Meeting Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="time"
                    name="meetingTime"
                    value={formData.meetingTime}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50"
                  />
                </div>
              </div>

            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
                >
                  <CheckCircle2 size={20} className="shrink-0" />
                  Thank you! Your demo request has been submitted successfully. We will contact you soon.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0000F2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#0000F2]/90 disabled:cursor-not-allowed disabled:opacity-70 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Book My Demo"
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}