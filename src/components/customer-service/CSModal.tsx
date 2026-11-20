"use client";

import React from "react";
import { X } from "lucide-react";

export interface CSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  footer?: React.ReactNode;
}

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

export function CSModal({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  children,
  maxWidth = "xl",
  footer,
}: CSModalProps) {
  if (!isOpen) return null;
  const displaySubtitle = subtitle || description;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-140">
      <div
        className={`relative w-full ${MAX_WIDTHS[maxWidth]} max-h-[90vh] flex flex-col rounded-[12px] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.08)] overflow-hidden border border-[#E5E7EB]`}
      >
        {/* Header Spec: 15px font-semibold #111827 */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 bg-white">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">
              {title}
            </h3>
            {displaySubtitle && (
              <p className="mt-0.5 text-xs text-[#6B7280]">{displaySubtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[#E5E7EB] bg-[#FAFAFF] px-6 py-3.5 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
