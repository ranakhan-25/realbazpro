"use client";

import React, { useState } from "react";
import { X, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { SettlementRecord } from "@/types/lams";

interface SettlementPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: SettlementRecord | null;
  onPay: (payment: {
    settlement_id: string;
    amount: number;
    mode: string;
    txn_ref: string;
    paid_at: string;
  }) => void;
}

export function SettlementPayModal({
  isOpen,
  onClose,
  settlement,
  onPay,
}: SettlementPayModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [mode, setMode] = useState("Bank Transfer");
  const [txnRef, setTxnRef] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [error, setError] = useState("");

  if (!isOpen || !settlement) return null;

  const dueAmount = settlement.due ?? (settlement.agreed_amount - settlement.paid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setError("Please enter a valid payment amount > 0");
      return;
    }
    if (payNum > dueAmount) {
      setError(`Payment cannot exceed outstanding due of ৳ ${dueAmount.toLocaleString()}`);
      return;
    }

    onPay({
      settlement_id: settlement.uuid || settlement.id,
      amount: payNum,
      mode,
      txn_ref: txnRef,
      paid_at: paidAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Settlement Payment
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {settlement.lead_code || settlement.lead} · {settlement.owner}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outstanding Balance Banner */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Total Agreed
              </p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                ৳ {settlement.agreed_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Paid to Date
              </p>
              <p className="font-bold text-emerald-600">
                ৳ {settlement.paid.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                Balance Due
              </p>
              <p className="font-extrabold text-rose-600">
                ৳ {dueAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amount (amount* MONEY(≤due)) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (BDT) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
              <input
                type="number"
                max={dueAmount}
                min={1}
                placeholder={`Max: ${dueAmount}`}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value === "" ? "" : Number(e.target.value));
                  if (error) setError("");
                }}
                required
                className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Bank Transfer">Bank Transfer (RTGS / BEFTN)</option>
              <option value="Cheque">Account Payee Cheque</option>
              <option value="Pay Order">Bank Pay Order / Demand Draft</option>
              <option value="Cash">Cash Handover</option>
            </select>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transaction / Instrument Reference No
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-98421039 / Cheque #8921"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Paid At (DateTime) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
