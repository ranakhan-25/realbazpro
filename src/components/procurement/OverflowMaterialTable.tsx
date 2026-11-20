"use client";

import { useState } from "react";
import { PackageCheck, Layers } from "lucide-react";
import { DashboardOverflowMaterial } from "@/lib/procurement";

interface Props {
  materials: DashboardOverflowMaterial[];
  isLoading: boolean;
}

const statusClasses: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
  issued:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
  completed:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
};

export default function OverflowMaterialTable({
  materials = [],
  isLoading,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayMaterials = showAll ? materials : materials.slice(0, 7);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Overflow Material
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Material budget and actual issue comparison
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {materials.length} {materials.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-850 dark:bg-slate-800/50"
              >
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      ) : materials.length === 0 ? (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <PackageCheck size={28} />
          </div>
          <h4 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No Overflow Materials
          </h4>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            All material issues are currently within their approved requisition budgets for this period.
          </p>
        </div>
      ) : (
        /* Content Tables */
        <>
          {/* Mobile / Compact Table */}
          <div className="lg:hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Requisition</th>
                    <th className="px-4 py-3 text-right">Budget</th>
                    <th className="px-4 py-3 text-right">Issued</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayMaterials.map((item, index) => (
                    <tr
                      key={`${item.requisition?.uuid || ""}-${item.itemCode}-${index}`}
                      className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.description || item.itemCode}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Code: {item.itemCode}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.requisition?.code || "N/A"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="font-medium text-slate-700 dark:text-slate-200">
                          ৳ {item.budgetAmount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.budgetQty.toLocaleString()} {item.unit}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="font-medium text-slate-700 dark:text-slate-200">
                          ৳ {item.issueAmount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.issueQty.toLocaleString()} {item.unit}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            statusClasses[item.status.toLowerCase()] ||
                            statusClasses.pending
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Show More Button */}
            {materials.length > 7 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-center dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                >
                  {showAll ? "Show Less" : `Show All (${materials.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-4 py-3">Requisition</th>
                    <th className="px-4 py-3 text-right">Budget</th>
                    <th className="px-4 py-3 text-right">Issued</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {materials.map((item, index) => (
                    <tr
                      key={`${item.requisition?.uuid || ""}-${item.itemCode}-${index}`}
                      className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {index + 1}
                      </td>

                      <td className="max-w-[200px] px-4 py-3">
                        <div className="truncate font-semibold text-slate-800 dark:text-slate-200" title={item.description}>
                          {item.description || item.itemCode}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Item Code: {item.itemCode}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.requisition?.code || "N/A"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          ৳ {item.budgetAmount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.budgetQty.toLocaleString()} {item.unit}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          ৳ {item.issueAmount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.issueQty.toLocaleString()} {item.unit}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            statusClasses[item.status.toLowerCase()] ||
                            statusClasses.pending
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desktop Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Showing {materials.length} overflow material records
            </div>
          </div>
        </>
      )}
    </div>
  );
}