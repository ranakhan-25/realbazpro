"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw, Plus, Download, Filter } from "lucide-react";
import { useTheme } from "@/lib/theme";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CSPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeText?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  }>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children?: React.ReactNode;
}

export function CSPageHeader({
  title,
  subtitle,
  description,
  badge,
  badgeText,
  breadcrumbs = [],
  primaryAction,
  secondaryAction,
  secondaryActions,
  onRefresh,
  isRefreshing = false,
  children,
}: CSPageHeaderProps) {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";
  const displaySubtitle = subtitle || description;
  const displayBadge = badge || badgeText;

  return (
    <div className="mb-6 space-y-3">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link
            href="/dashboard/customer-service"
            className="hover:text-slate-700 transition"
          >
            Customer Service
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-slate-700 transition"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {displayBadge && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${brand}15`,
                  color: brand,
                }}
              >
                {displayBadge}
              </span>
            )}
          </div>
          {displaySubtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{displaySubtitle}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              title="Refresh dataset"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
            >
              {secondaryAction.icon ? (
                <secondaryAction.icon className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {secondaryAction.label}
            </button>
          )}

          {secondaryActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
            >
              {action.icon ? (
                <action.icon className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {action.label}
            </button>
          ))}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white shadow-sm transition active:scale-95 hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
