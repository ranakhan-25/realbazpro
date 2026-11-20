"use client";

import React from "react";
import { X } from "lucide-react";

export interface CSDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl";
}

const WIDTH_CLASSES = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function CSDetailDrawer({
  isOpen,
  onClose,
  title,
  badge,
  subtitle,
  children,
  footer,
  width = "lg",
}: CSDetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-140">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative z-10 flex h-full w-full ${WIDTH_CLASSES[width]} flex-col bg-white shadow-[0_8px_24px_rgba(16,24,40,0.08)] border-l border-[#E5E7EB] animate-in slide-in-from-right duration-140`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#111827]">
                {title}
              </h3>
              {badge && (
                <span className="rounded-full bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE] px-2 py-0.5 text-[11px] font-semibold">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>

        {/* Drawer Footer */}
        {footer && (
          <div className="border-t border-[#E5E7EB] bg-[#FAFAFF] px-6 py-3.5 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
