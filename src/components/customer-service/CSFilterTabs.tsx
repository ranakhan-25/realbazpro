"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export interface FilterTabOption {
  key: string;
  label: string;
  count?: number;
  badgeVariant?: "default" | "danger" | "warning" | "success";
}

export interface CSFilterTabsProps {
  tabs: FilterTabOption[];
  activeTab: string;
  onTabChange?: (key: string) => void;
  onChange?: (key: string) => void;
}

export function CSFilterTabs({
  tabs,
  activeTab,
  onTabChange,
  onChange,
}: CSFilterTabsProps) {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";
  const handleSelect = onTabChange || onChange || (() => {});

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleSelect(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.badgeVariant === "danger"
                      ? "bg-rose-100 text-rose-700"
                      : tab.badgeVariant === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : tab.badgeVariant === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
