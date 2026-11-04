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
    <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex h-full w-full ${WIDTH_CLASSES[width]} flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {badge && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
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

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

