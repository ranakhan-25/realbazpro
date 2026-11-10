"use client";

interface VoucherDateRangeProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  className?: string;
}

export function VoucherDateRange({ fromDate, toDate, onFromDateChange, onToDateChange, className = "" }: VoucherDateRangeProps) {
  return (
    <div className={`grid grid-cols-2 gap-1.5 ${className}`}>
      <input aria-label="From date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => onFromDateChange(event.target.value)} className="min-w-0 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200" />
      <input aria-label="To date" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => onToDateChange(event.target.value)} className="min-w-0 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200" />
    </div>
  );
}
