"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/lib/theme";

export interface CSStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  subtitle?: string;
  color?: string;
  trend?: {
    value: number;
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
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
}: CSStatCardProps) {
  const { primaryColor } = useTheme();
  const displaySubtext = subtext || subtitle;

  const colorClasses = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400" },
  };

  const chosenBg = color && (colorClasses as any)[color] ? (colorClasses as any)[color].bg : iconBg;
  const chosenColor = color && (colorClasses as any)[color] ? (colorClasses as any)[color].text : iconColor;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${chosenBg} ${chosenColor}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {(change || trend) && (
          <span
            className={`flex items-center text-xs font-semibold ${
              (trend ? trend.isPositive : isPositive)
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {(trend ? trend.isPositive : isPositive) ? (
              <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
            )}
            {trend ? `${trend.isPositive ? "+" : ""}${trend.value}%` : change}
          </span>
        )}
      </div>

      {displaySubtext && (
        <p className="mt-1 text-xs text-slate-500">{displaySubtext}</p>
      )}
    </div>
  );
}
