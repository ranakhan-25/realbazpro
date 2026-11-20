"use client";

import React from "react";
import { Building2, ArrowUpRight, Sparkles } from "lucide-react";
import { CSProjectSelector } from "./CSProjectSelector";

interface CSSelectProjectEmptyStateProps {
  title?: string;
  featureTitle?: string;
  description?: string;
}

export function CSSelectProjectEmptyState({
  title,
  featureTitle = "this module",
  description,
}: CSSelectProjectEmptyStateProps) {
  const headingText = title
    ? `Select a Project to View ${title}`
    : `Select a Project to View ${featureTitle}`;
  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] p-8 text-center bg-white rounded-3xl border border-gray-200/80 shadow-xs max-w-xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#F4F1FF] text-[#6D4AFF] flex items-center justify-center mb-4 shadow-inner ring-8 ring-[#F4F1FF]/60">
        <Building2 className="w-7 h-7" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE] mb-3">
        <Sparkles className="w-3.5 h-3.5" /> Project Context Required
      </span>

      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
        {headingText}
      </h3>

      <p className="text-sm text-gray-500 max-w-md mt-1.5 leading-relaxed">
        {description ||
          `Customer service records and operations are scoped per-project. Select a project from the top bar or use the selector below to continue.`}
      </p>

      <div className="mt-6 flex flex-col items-center gap-2">
        <CSProjectSelector compact={false} showLabel={false} />
        <span className="text-[11px] text-gray-400">
          Or switch projects anytime from the workspace top bar above
        </span>
      </div>
    </div>
  );
}
