"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw, Plus, Download } from "lucide-react";

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
  const displaySubtitle = subtitle || description;
  const displayBadge = badge || badgeText;

  return (
    <div className="mb-6 space-y-2.5">
      {/* Quiet Breadcrumbs aligned with page */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
          <Link
            href="/dashboard/customer-service"
            className="hover:text-[#111827] transition-colors"
          >
            Customer Service
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[#111827] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#374151] font-semibold">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row: 22px Title, 14px secondary description, 36px controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#111827] leading-tight">
              {title}
            </h1>
            {displayBadge && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#F4F1FF] text-[#6D4AFF] border border-[#DDD6FE]">
                {displayBadge}
              </span>
            )}
          </div>
          {displaySubtitle && (
            <p className="mt-1 text-sm font-normal text-[#6B7280] leading-normal max-w-3xl">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Action Buttons: Uniform 36px height, 8px radius */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] shadow-xs hover:bg-[#F9FAFB] hover:text-[#111827] transition active:scale-95 disabled:opacity-50"
              title="Refresh dataset"
              aria-label="Refresh dataset"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#6D4AFF]" : ""}`}
              />
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-xs font-semibold text-[#374151] shadow-xs hover:bg-[#F4F1FF] hover:border-[#DDD6FE] hover:text-[#6D4AFF] transition active:scale-95"
            >
              {secondaryAction.icon ? (
                <secondaryAction.icon className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {secondaryActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-xs font-semibold text-[#374151] shadow-xs hover:bg-[#F4F1FF] hover:border-[#DDD6FE] hover:text-[#6D4AFF] transition active:scale-95"
            >
              {action.icon ? (
                <action.icon className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{action.label}</span>
            </button>
          ))}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#5B3BE0] active:bg-[#4F32C7] transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
