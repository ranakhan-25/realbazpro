"use client";

import React from "react";

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
  const handleSelect = onTabChange || onChange || (() => {});

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
      <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F2F4F7] p-1 flex-wrap sm:flex-nowrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelect(tab.key)}
              className={`flex h-7 items-center gap-1.5 whitespace-nowrap px-3 text-xs font-medium rounded-md transition-all duration-140 ${
                isActive
                  ? "bg-white text-[#111827] font-semibold shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-white/50"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums ${
                    isActive
                      ? "bg-[#F4F1FF] text-[#6D4AFF]"
                      : tab.badgeVariant === "danger"
                        ? "bg-[#FEF3F2] text-[#B42318]"
                        : tab.badgeVariant === "warning"
                          ? "bg-[#FFFAEB] text-[#B54708]"
                          : "bg-[#E5E7EB] text-[#4B5563]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
