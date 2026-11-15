"use client";

import React from "react";
import { Printer, Download, Mail, Send, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { CollectionEntry } from "@/types/collection";
import { toast } from "sonner";

interface Props {
  entry: CollectionEntry;
  onBack: () => void;
}

// Convert numbers to English words (simple utility for money receipts)
function numberToWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if ((n = n.toString() as any).length > 9) return "overflow";
    const match = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return "";
    let str = "";
    str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0] as any] + " " + a[match[1][1] as any]) + "Crore " : "";
    str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0] as any] + " " + a[match[2][1] as any]) + "Lakh " : "";
    str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0] as any] + " " + a[match[3][1] as any]) + "Thousand " : "";
    str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0] as any] + " " + a[match[4][1] as any]) + "Hundred " : "";
    str += Number(match[5]) !== 0 ? ((str !== "" ? "and " : "") + (a[Number(match[5])] || b[match[5][0] as any] + " " + a[match[5][1] as any])) : "";
    return str;
  }
  return inWords(num).trim() + " Taka Only";
}

export function ReceiptDetailView({ entry, onBack }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const handleAction = (action: string) => {
    toast.success(`Action '${action}' triggered for Receipt ${entry.receipt_no}`);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Collection Entries</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={() => handleAction("Download PDF")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleAction("Send via Email")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </button>
          <button
            onClick={() => handleAction("Send via SMS")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Send className="h-4 w-4" />
            <span>SMS</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-xl shadow-md">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                RealBiz Pro Holdings Ltd.
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Plot 14, Road 11, Block C, Gulshan-1, Dhaka-1212 • Hotline: +880 9612 000 999
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black tracking-wider text-emerald-800 uppercase">
              Official Money Receipt
            </span>
            <div className="mt-2 text-sm font-mono font-bold text-slate-900">
              No: {entry.receipt_no}
            </div>
            <div className="text-[11px] text-slate-500">Date: {entry.collected_at}</div>
          </div>
        </div>

        {/* Customer & Booking Meta */}
        <div className="grid grid-cols-2 gap-6 py-6 text-xs border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received From:</span>
            <div className="mt-1 text-sm font-bold text-slate-900">{entry.party_name}</div>
            <div className="text-slate-600 mt-0.5">Booking ID: <span className="font-mono font-bold">{entry.booking_code}</span></div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Channel:</span>
            <div className="mt-1 text-xs font-bold text-slate-900 uppercase">{entry.mode}</div>
            <div className="text-slate-600 mt-0.5">Ref: <span className="font-mono">{entry.txn_ref || "Direct Bank Credit"}</span></div>
            <div className="text-slate-500 text-[10px]">JV Ref: {entry.journal_entry_no}</div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-3">SL</th>
                <th className="py-2.5 px-3">Description / Installment Particulars</th>
                <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3 font-mono">01</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{entry.installment_label || "Property Installment Payment"}</div>
                  <div className="text-[11px] text-slate-500">Towards agreed purchase consideration for {entry.booking_code}</div>
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                  ৳{entry.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50/50">
                <td colSpan={2} className="py-3 px-3 font-bold text-slate-900 uppercase">
                  Total Received Consideration
                </td>
                <td className="py-3 px-3 text-right font-black text-slate-900 text-base">
                  ৳{entry.amount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* In Words */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Amount in Words:
          </span>
          <p className="text-xs font-semibold text-slate-800 italic">
            {numberToWords(entry.amount)}
          </p>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="mt-4 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Remarks: </span>
            {entry.notes}
          </div>
        )}

        {/* Signature Line */}
        <div className="mt-16 grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-200 text-center text-xs">
          <div>
            <div className="mx-auto w-40 border-b border-slate-400 pb-1 font-semibold text-slate-700">
              {entry.collected_by}
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">
              Collected By / Accounts Officer
            </span>
          </div>
          <div>
            <div className="mx-auto w-40 border-b border-slate-400 pb-1 font-semibold text-slate-700">
              Authorized Signatory
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">
              For RealBiz Pro Holdings Ltd.
            </span>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="mt-8 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> System Verified Electronic Receipt
          </span>
          <span>Printed on {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
