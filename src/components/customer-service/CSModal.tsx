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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className={`relative w-full ${MAX_WIDTHS[maxWidth]} max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {displaySubtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{displaySubtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
