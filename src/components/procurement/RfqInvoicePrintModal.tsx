"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Printer, X, Download } from "lucide-react";
import { RfqRecord } from "./RequestForQuotationView";

interface RfqInvoicePrintModalProps {
  rfq: RfqRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const formatHundreds = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  let intPart = Math.floor(num);
  const crore = Math.floor(intPart / 10000000);
  intPart %= 10000000;
  const lakh = Math.floor(intPart / 100000);
  intPart %= 100000;
  const thousand = Math.floor(intPart / 1000);
  intPart %= 1000;
  const remainder = intPart;

  const parts: string[] = [];
  if (crore > 0) parts.push(formatHundreds(crore) + " Crore");
  if (lakh > 0) parts.push(formatHundreds(lakh) + " Lakh");
  if (thousand > 0) parts.push(formatHundreds(thousand) + " Thousand");
  if (remainder > 0) parts.push(formatHundreds(remainder));

  return parts.join(" ") || "Zero";
}

export default function RfqInvoicePrintModal({
  rfq,
  isOpen,
  onClose,
}: RfqInvoicePrintModalProps) {
  const [printTime, setPrintTime] = useState("02:57 PM");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setPrintTime(formatted);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !rfq) return null;

  // Items to display: use rfq.items or fallback matching sample screenshot
  const items =
    rfq.items && rfq.items.length > 0
      ? rfq.items
      : [
          {
            id: "it-1",
            itemCode: "ITM-501",
            itemName: "Cylinder Set",
            details: "",
            unit: "Set",
            quantity: 10,
            rate: 500,
            requiredQty: 10,
            purchaseQty: 0,
            stockQty: 2,
            amount: 5000,
          },
          {
            id: "it-2",
            itemCode: "ITM-502",
            itemName: "Land Survey",
            details: "",
            unit: "Khata",
            quantity: 10,
            rate: 3400,
            requiredQty: 10,
            purchaseQty: 0,
            stockQty: 0,
            amount: 34000,
          },
        ];

  const totalAmount = items.reduce(
    (sum, it) =>
      sum + (Number(it.amount) || Number(it.quantity) * Number(it.rate) || 0),
    0,
  );
  const grandTotal = rfq.grandTotal || totalAmount;
  const paid = (rfq as { paid?: number }).paid ?? 0;
  const due = (rfq as { due?: number }).due ?? grandTotal - paid;

  const supplierCleanName = (
    rfq.supplierName || "Delta Glass & Aluminium"
  ).replace(/_+.*$/, "");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      {/* Top Modal Container */}
      <div className="flex flex-col items-center w-full max-w-[880px] my-auto">
        {/* Floating Top Control Bar (Hidden during actual print) */}
        <div className="w-full flex items-center justify-between bg-slate-900/90 text-white px-5 py-3 rounded-t-lg shadow-lg border border-slate-700/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base">
              RFQ Order / Invoice
            </span>
            <span className="text-xs font-mono bg-cyan-600 text-white px-2 py-0.5 rounded">
              {rfq.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-1.5 rounded shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-[13px] font-medium px-3 py-1.5 rounded transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable White Document Sheet (Matches Screenshot Exactly with RealBiz Branding) */}
        <div
          id="rfq-invoice-print-area"
          className="w-full bg-white text-slate-900 shadow-2xl rounded-b-lg p-6 sm:p-12 font-sans border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0"
          style={{ minHeight: "842px" }}
        >
          {/* ==================================================== */}
          {/* HEADER: LOGO (Left) | COMPANY (Center) | TITLE (Right) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-12 items-start gap-4 pb-6">
            {/* Left: RealBiz Logo */}
            <div className="col-span-3 flex flex-col items-start justify-center">
              <Image
                src="/logo.svg"
                alt="RealBiz Pro"
                width={140}
                height={45}
                priority
                className="h-12 w-auto object-contain"
              />
              <span className="text-[9px] font-bold text-[#133C4E] tracking-tight mt-1">
                RealBiz Pro ERP
              </span>
            </div>

            {/* Center: RealBiz Company Name & Contact Info */}
            <div className="col-span-6 text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#D32F2F] tracking-wide uppercase">
                REALBIZ PRO
              </h1>
              <div className="text-[11px] sm:text-[12px] text-slate-800 leading-tight space-y-0.5">
                <p>
                  <span className="font-semibold">Address:</span> House-417,
                  Road-7, Baridhara DOHS, Dhaka-1206, Bangladesh
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  info@realbizpro.com
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> +880
                  1711-656808, +880 1757-575715
                </p>
              </div>
            </div>

            {/* Right: ORDER Heading */}
            <div className="col-span-3 text-right">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                ORDER
              </h2>
            </div>
          </div>

          {/* ==================================================== */}
          {/* METADATA BLOCK (2 Columns matching Screenshot) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:text-[13px] text-slate-900 pt-4 pb-6">
            {/* Left Column: Name, Company, Phone, Address, Project */}
            <div className="space-y-1">
              <p>
                <span className="font-bold">Name: </span>
                <span>{supplierCleanName}</span>
              </p>
              <p>
                <span className="font-bold">Company: </span>
                <span>RealBiz Pro</span>
              </p>
              <p>
                <span className="font-bold">Phone: </span>
                <span>
                  {(rfq as { phone?: string }).phone || "01312345694"}
                </span>
              </p>
              <p>
                <span className="font-bold">Address: </span>
                <span>{(rfq as { address?: string }).address || "Mirpur"}</span>
              </p>
              <p>
                <span className="font-bold">Project : </span>
                <span>{rfq.project || "Hena Heights"}</span>
              </p>
            </div>

            {/* Right Column: RFQ Code, Reference No, Date, Prepared By, Printing Time */}
            <div className="space-y-1 text-right">
              <p>
                <span className="font-bold">RFQ Code: </span>
                <span>{rfq.code || "R-043"}</span>
              </p>
              <p>
                <span className="font-bold">Reference No: </span>
                <span>{rfq.reference || "REC00102"}</span>
              </p>
              <p>
                <span className="font-bold">Date: </span>
                <span>{rfq.date || "19-Oct-2026"}</span>
              </p>
              <p>
                <span className="font-bold">Prepared By : </span>
                <span>{rfq.addedBy || "Admin"}</span>
              </p>
              <p>
                <span className="font-bold">Printing Time: </span>
                <span>{printTime}</span>
              </p>
            </div>
          </div>

          {/* ==================================================== */}
          {/* ITEMS & TOTALS TABLE */}
          {/* ==================================================== */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-[12px] sm:text-[13px] text-slate-900">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="border border-slate-300 px-2 py-2 text-center font-bold w-14">
                    SL
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                    Item Name
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold w-28">
                    Quantity
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-right font-bold w-28">
                    Unit Price
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-right font-bold w-32">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => {
                  const itemAmount =
                    Number(it.amount) ||
                    Number(it.quantity) * Number(it.rate) ||
                    0;
                  return (
                    <tr key={it.id || idx}>
                      <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-medium">
                        {it.itemName}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-medium">
                        {it.quantity}
                        {it.unit}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right">
                        {Number(it.rate).toLocaleString()}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-medium">
                        {itemAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}

                {/* Sub Total */}
                <tr>
                  <td
                    className="border border-slate-300 px-2 py-2"
                    colSpan={3}
                  ></td>
                  <td className="border border-slate-300 px-3 py-2 font-bold text-right">
                    Total
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>

                {/* Grand Total */}
                <tr>
                  <td
                    className="border border-slate-300 px-2 py-2"
                    colSpan={3}
                  ></td>
                  <td className="border border-slate-300 px-3 py-2 font-bold text-right">
                    Grand Total
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>

                {/* Paid */}
                <tr>
                  <td
                    className="border border-slate-300 px-2 py-2"
                    colSpan={3}
                  ></td>
                  <td className="border border-slate-300 px-3 py-2 font-medium text-right">
                    Paid
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {paid.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>

                {/* Due */}
                <tr>
                  <td
                    className="border border-slate-300 px-2 py-2"
                    colSpan={3}
                  ></td>
                  <td className="border border-slate-300 px-3 py-2 font-bold text-right">
                    Due
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {due.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ==================================================== */}
          {/* IN WORDS SECTION */}
          {/* ==================================================== */}
          <div className="mt-4 text-[12px] sm:text-[13px] text-slate-900 font-semibold">
            <span>In Words: </span>
            <span className="capitalize">{numberToWords(grandTotal)} Taka</span>
          </div>

          {/* ==================================================== */}
          {/* 3 SIGNATURE SECTIONS */}
          {/* ==================================================== */}
          <div className="mt-28 mb-12 grid grid-cols-3 gap-8 text-center text-[12px] sm:text-[13px] text-slate-900 font-bold">
            <div className="flex flex-col items-center">
              <div className="w-44 border-t border-slate-400"></div>
              <span className="mt-2">Prepared By</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-44 border-t border-slate-400"></div>
              <span className="mt-2">Received By</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-44 border-t border-slate-400"></div>
              <span className="mt-2">Authorized Signature</span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* FOOTER: POWERED BY */}
          {/* ==================================================== */}
          <div className="flex flex-col items-end text-[11px] sm:text-[12px] text-slate-900 space-y-0.5 pt-4">
            <p>
              <span className="font-bold">Powered by:</span> RealBiz Pro
            </p>
          </div>
        </div>
      </div>

      {/* Global Print Media Style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #rfq-invoice-print-area,
          #rfq-invoice-print-area * {
            visibility: visible !important;
          }
          #rfq-invoice-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>
    </div>
  );
}
