/* eslint-disable prettier/prettier */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ChangePasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!identifier || !oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ ENV Variable use kora hoyeche
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

      const response = await fetch(`${baseUrl}/realbizpro/api/v1/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (response.status === 204 || response.status === 200) {
        setSuccess(true);
        setIdentifier("");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (response.status === 401) {
        setError("Current password is incorrect or user not found.");
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-8 text-center relative">
          <Link href="/login" className="absolute left-6 top-8 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <ShieldCheck className="h-6 w-6 text-[#0000F2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Change Password</h1>
          <p className="mt-2 text-xs text-slate-500">Enter your credentials to update your password.</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Email or Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isSubmitting} className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50" placeholder="Enter your email or username" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Current Password</label>
              <div className="relative">
                <input type={showOld ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={isSubmitting} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 pr-10 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50" placeholder="Enter current password" />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSubmitting} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 pr-10 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50" placeholder="Enter new password" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmitting} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 pr-10 text-sm outline-none transition focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:bg-slate-50" placeholder="Confirm new password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={16} className="shrink-0" /> Password changed successfully! You can now login.
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0000F2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#0000F2]/90 disabled:cursor-not-allowed disabled:opacity-70 mt-2">
              {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : ("Update Password")}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}