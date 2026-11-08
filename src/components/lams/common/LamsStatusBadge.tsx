"use client";

import React from "react";

interface LamsStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const BADGE_THEMES: Record<string, { bg: string; text: string; ring: string }> = {
  // Leads
  Draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-300 dark:ring-slate-700" },
  Submitted: { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  Qualified: { bg: "bg-teal-50 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-800" },
  "In Negotiation": { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  "Legal Verification": { bg: "bg-indigo-50 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-200 dark:ring-indigo-800" },
  "Agreement Ready": { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Acquired: { bg: "bg-cyan-50 dark:bg-cyan-950/60", text: "text-cyan-700 dark:text-cyan-300", ring: "ring-cyan-200 dark:ring-cyan-800" },
  Approved: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Rejected: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Active: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Inactive: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", ring: "ring-slate-300 dark:ring-slate-700" },

  // Verifications / Status
  cleared: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Cleared: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  pending: { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  Pending: { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  flagged: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Flagged: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Verified: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  "Under Review": { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  "Discrepancy Found": { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },

  // Negotiations
  ongoing: { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  agreed: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  failed: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Agreed: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  "In Progress": { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  "Revision Needed": { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  Declined: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },

  // Settlements & Approvals
  approved: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  rejected: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Settled: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  "Partially Paid": { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  Overdue: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  Completed: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  Rescheduled: { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-800" },
  Cancelled: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
};

export function LamsStatusBadge({ status, size = "sm" }: LamsStatusBadgeProps) {
  const theme = BADGE_THEMES[status] || {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-200 dark:ring-slate-700",
  };

  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full capitalize ring-1 ${sizeClasses} ${theme.bg} ${theme.text} ${theme.ring}`}
    >
      {status}
    </span>
  );
}
