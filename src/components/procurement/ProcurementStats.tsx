"use client";

import Link from "next/link";
import {
  ClipboardList,
  FileText,
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  LucideIcon,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { DashboardMetricItem, ProcurementDashboardData } from "@/lib/procurement";

interface Props {
  metrics: ProcurementDashboardData["metrics"] | null;
  isLoading: boolean;
}

interface StatConfig {
  id: keyof ProcurementDashboardData["metrics"];
  title: string;
  icon: LucideIcon;
  color: "red" | "blue" | "green" | "purple" | "orange" | "cyan";
  route: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    id: "pendingRequisition",
    title: "Pending Requisition",
    icon: ClipboardList,
    color: "red",
    route: "/dashboard/procurement/requisition/material-requisition",
  },
  {
    id: "requisition",
    title: "Requisition",
    icon: FileText,
    color: "blue",
    route: "/dashboard/procurement/requisition/material-requisition",
  },
  {
    id: "pendingPurchaseOrder",
    title: "Pending Purchase Order",
    icon: ShoppingCart,
    color: "green",
    route: "/dashboard/procurement/purchase-order/purchase-order-list",
  },
  {
    id: "purchaseOrder",
    title: "Purchase Order",
    icon: Package,
    color: "purple",
    route: "/dashboard/procurement/purchase-order/purchase-order-list",
  },
  {
    id: "pendingGrn",
    title: "Pending GRN",
    icon: Truck,
    color: "orange",
    route: "/dashboard/procurement/grn/goods-receipt-note",
  },
  {
    id: "pendingPurchaseBill",
    title: "Pending Purchase Bill",
    icon: Receipt,
    color: "cyan",
    route: "/dashboard/procurement/purchase-bill/purchase-bill-invoice",
  },
];

const cardStyles = {
  red: {
    background: "bg-[#fff8f8] dark:bg-red-950/20",
    border: "border-[#f3dddd] dark:border-red-900/30",
    icon: "bg-[#ffe2e2] text-[#ef4444] dark:bg-red-900/40 dark:text-red-400",
    line: "#ef4444",
    fill: "#ef4444",
  },
  blue: {
    background: "bg-[#f6f9ff] dark:bg-blue-950/20",
    border: "border-[#dce7f8] dark:border-blue-900/30",
    icon: "bg-[#dceaff] text-[#1677ff] dark:bg-blue-900/40 dark:text-blue-400",
    line: "#1677ff",
    fill: "#1677ff",
  },
  green: {
    background: "bg-[#f5fcf8] dark:bg-emerald-950/20",
    border: "border-[#d9eee3] dark:border-emerald-900/30",
    icon: "bg-[#d8f5e5] text-[#10b981] dark:bg-emerald-900/40 dark:text-emerald-400",
    line: "#10b981",
    fill: "#10b981",
  },
  purple: {
    background: "bg-[#faf8ff] dark:bg-purple-950/20",
    border: "border-[#e7def7] dark:border-purple-900/30",
    icon: "bg-[#e9ddff] text-[#7c3aed] dark:bg-purple-900/40 dark:text-purple-400",
    line: "#7c3aed",
    fill: "#7c3aed",
  },
  orange: {
    background: "bg-[#fffaf5] dark:bg-orange-950/20",
    border: "border-[#f3e1cf] dark:border-orange-900/30",
    icon: "bg-[#ffe2c6] text-[#f97316] dark:bg-orange-900/40 dark:text-orange-400",
    line: "#f97316",
    fill: "#f97316",
  },
  cyan: {
    background: "bg-[#f4fcfd] dark:bg-cyan-950/20",
    border: "border-[#d6edf1] dark:border-cyan-900/30",
    icon: "bg-[#d7f3f5] text-[#0891b2] dark:bg-cyan-900/40 dark:text-cyan-400",
    line: "#0891b2",
    fill: "#0891b2",
  },
};

function generateTrendChart(current: number, previous: number) {
  const mid = Math.round((previous + current) / 2);
  const variance = Math.max(1, Math.round(Math.abs(current - previous) * 0.2));
  return [
    { index: 0, value: previous },
    { index: 1, value: Math.max(0, previous > current ? previous - variance : previous + variance) },
    { index: 2, value: mid },
    { index: 3, value: Math.max(0, current > previous ? current - variance : current + variance) },
    { index: 4, value: current },
  ];
}

export default function ProcurementStats({ metrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[210px] animate-pulse flex-col rounded-[10px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-auto h-12 w-full rounded bg-slate-100 dark:bg-slate-800/50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {STAT_CONFIGS.map((config, index) => {
        const metric: DashboardMetricItem = metrics?.[config.id] ?? {
          count: 0,
          previousCount: 0,
          changePercent: null,
        };

        const Icon = config.icon;
        const colors = cardStyles[config.color];
        const chartData = generateTrendChart(metric.count, metric.previousCount);

        const changeVal = metric.changePercent;
        const hasChange = changeVal !== null && changeVal !== undefined;
        const isPositive = hasChange && changeVal > 0;
        const isNegative = hasChange && changeVal < 0;

        return (
          <Link
            key={config.id}
            href={config.route}
            className={[
              "group",
              "flex",
              "h-[210px]",
              "min-w-0",
              "flex-col",
              "overflow-hidden",
              "rounded-[10px]",
              "border",
              "px-[18px]",
              "pt-[16px]",
              "pb-[8px]",
              "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
              "dark:shadow-none",
              "transition-all",
              "duration-200",
              "hover:-translate-y-[1px]",
              "hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
              "dark:hover:shadow-zinc-900/50",
              "cursor-pointer",
              colors.background,
              colors.border,
            ].join(" ")}
          >
            {/* Icon */}
            <div
              className={[
                "flex",
                "h-[42px]",
                "w-[42px]",
                "shrink-0",
                "items-center",
                "justify-center",
                "rounded-[11px]",
                colors.icon,
              ].join(" ")}
            >
              <Icon size={21} strokeWidth={2.2} />
            </div>

            {/* Content */}
            <div className="min-w-0">
              {/* Title */}
              <h3 className="mt-[12px] truncate text-[13px] font-bold leading-[18px] text-[#172554] dark:text-zinc-200">
                {config.title}
              </h3>

              {/* Value */}
              <p className="mt-1.5 text-[26px] font-bold leading-8 tracking-[-0.5px] text-[#10234f] tabular-nums dark:text-zinc-50">
                {metric.count.toLocaleString()}
              </p>

              {/* Change Indicator */}
              <div className="mt-1.5 flex min-w-0 items-center gap-[5px]">
                {hasChange ? (
                  <>
                    <span
                      className={`shrink-0 text-[12px] font-semibold tabular-nums ${
                        isPositive
                          ? "text-[#16a34a] dark:text-emerald-400"
                          : isNegative
                          ? "text-[#dc2626] dark:text-red-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {isPositive ? `↑ ${changeVal}%` : isNegative ? `↓ ${Math.abs(changeVal)}%` : `0%`}
                    </span>
                    <span className="truncate text-[11px] text-[#71809c] dark:text-zinc-400">
                      vs prev
                    </span>
                  </>
                ) : (
                  <span className="truncate text-[11px] text-[#71809c] dark:text-zinc-400">
                    Prev: {metric.previousCount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Sparkline Area Chart */}
            <div className="mt-auto h-12 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id={`procurement-gradient-${config.id}-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colors.fill}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.fill}
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={colors.line}
                    strokeWidth={1.5}
                    fill={`url(#procurement-gradient-${config.id}-${index})`}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationBegin={index * 80}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Link>
        );
      })}
    </div>
  );
}