"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface CSStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  subtitle?: string;
  color?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  icon?: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}

export function CSStatCard({
  title,
  value,
  change,
  isPositive = true,
  subtext,
  subtitle,
  color,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: CSStatCardProps) {
  const displaySubtext = subtext || subtitle;

  const colorClasses: Record<string, { bg: string; text: string }> = {
    purple: {
      bg: "bg-[#F4F1FF] border border-[#DDD6FE]",
      text: "text-[#6D4AFF]",
    },
    blue: {
      bg: "bg-[#EFF6FF] border border-[#BFDBFE]",
      text: "text-[#2563EB]",
    },
    emerald: {
      bg: "bg-[#ECFDF3] border border-[#A6F4C5]",
      text: "text-[#027A48]",
    },
    amber: {
      bg: "bg-[#FFFAEB] border border-[#FEDF89]",
      text: "text-[#DC6803]",
    },
    rose: {
      bg: "bg-[#FEF2F2] border border-[#FECACA]",
      text: "text-[#DC2626]",
    },
    sky: { bg: "bg-[#EFF8FF] border border-[#BFDBFE]", text: "text-[#175CD3]" },
    teal: {
      bg: "bg-[#F0FDFA] border border-[#99F6E4]",
      text: "text-[#0F766E]",
    },
    indigo: {
      bg: "bg-[#EEF2FF] border border-[#C7D2FE]",
      text: "text-[#4F46E5]",
    },
  };

  const palette = (color && colorClasses[color]) || colorClasses.purple;
  const chosenBg = iconBg || palette.bg;
  const chosenColor = iconColor || palette.text;

  const trendPositive = trend ? trend.isPositive : isPositive;

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${chosenBg} ${chosenColor}`}
          >
            <Icon className="h-4.5 w-4.5 stroke-[1.8]" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl font-bold tracking-tight text-[#111827] tabular-nums">
          {value}
        </span>
        {(change || trend) && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendPositive
                ? "bg-[#ECFDF3] text-[#027A48]"
                : "bg-[#FEF3F2] text-[#B42318]"
            }`}
          >
            {trendPositive ? (
              <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
            )}
            <span className="tabular-nums">
              {trend ? `${trend.isPositive ? "+" : ""}${trend.value}%` : change}
            </span>
          </span>
        )}
      </div>

      {displaySubtext && (
        <p className="mt-1 text-xs text-[#6B7280] line-clamp-1">
          {displaySubtext}
        </p>
      )}
    </div>
  );
}
