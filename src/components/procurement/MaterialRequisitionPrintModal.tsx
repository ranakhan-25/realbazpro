"use client";

import React, { useEffect, useState } from "react";
import { Printer, X, Download } from "lucide-react";
import { RequisitionRow } from "./MaterialRequisitionList";

interface MaterialRequisitionPrintModalProps {
  requisition: RequisitionRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialRequisitionPrintModal({
  requisition,
  isOpen,
  onClose,
}: MaterialRequisitionPrintModalProps) {
  const [printTime, setPrintTime] = useState("02:29 PM");

  useEffect(() => {
    // Generate formatted print time, e.g. "02:29 PM"
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

  if (!isOpen || !requisition) return null;

  // Compute totals
  const items = requisition.items && requisition.items.length > 0
    ? requisition.items
    : [
        {
          id: "default-1",
          itemCode: "ITM-501",
          itemName: "Land Survey",
          details: "",
          unit: "Khata",
          brand: "",
          demandQty: 2,
          approvedQty: 0,
          budgetQty: 0,
          alreadyPurchaseQty: 0,
          availableQty: 0,
          stock: 0,
        },
      ];

  const totalDemandQty = items.reduce(
    (sum, it) => sum + (Number(it.demandQty) || 0),
    0
  );
  const totalApprovedQty = items.reduce(
    (sum, it) => sum + (Number(it.approvedQty) || 0),
    0
  );

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
              Material Requisition Document
            </span>
            <span className="text-xs font-mono bg-indigo-600/80 text-white px-2 py-0.5 rounded">
              {requisition.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-1.5 rounded shadow-sm transition-all cursor-pointer active:scale-95"
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

        {/* Printable White Document Sheet (Matches Screenshot Exactly) */}
        <div
          id="material-requisition-print-area"
          className="w-full bg-white text-slate-900 shadow-2xl rounded-b-lg p-6 sm:p-12 font-sans border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0"
          style={{ minHeight: "842px" }}
        >
          {/* ==================================================== */}
          {/* HEADER: LOGO (Left) | COMPANY (Center) | TITLE (Right) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-12 items-start gap-4 pb-6">
            
            {/* Left: Somikoron IT Ltd Logo */}
            <div className="col-span-3 flex flex-col items-start justify-center">
              <div className="w-20 h-20 rounded-full border border-slate-400 p-1 flex flex-col items-center justify-center relative shadow-2xs">
                <svg
                  viewBox="0 0 100 100"
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                >
                  {/* Circular border */}
                  <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="2.5" />
                  {/* Circuit tree stem */}
                  <path d="M50 78 V46" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 56 L32 40" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M50 56 L68 40" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M50 44 L36 28" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                  <path d="M50 44 L64 28" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                  <path d="M50 34 V22" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Circuit Nodes */}
                  <circle cx="50" cy="20" r="3.5" fill="#10B981" />
                  <circle cx="32" cy="40" r="3" fill="#475569" />
                  <circle cx="68" cy="40" r="3" fill="#475569" />
                  <circle cx="36" cy="28" r="3" fill="#10B981" />
                  <circle cx="64" cy="28" r="3" fill="#10B981" />
                  <circle cx="24" cy="48" r="2.8" fill="#475569" />
                  <circle cx="76" cy="48" r="2.8" fill="#475569" />
                  <circle cx="50" cy="48" r="3.2" fill="#475569" />
                </svg>
                <span className="text-[8px] font-bold text-slate-800 tracking-tight mt-0.5">
                  Somikoron IT Ltd
                </span>
              </div>
            </div>

            {/* Center: Company Name & Contact Info */}
            <div className="col-span-6 text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#D32F2F] tracking-wide uppercase">
                SOMIKORON IT LTD
              </h1>
              <div className="text-[11px] sm:text-[12px] text-slate-800 leading-tight space-y-0.5">
                <p>
                  <span className="font-semibold">Address:</span> Hasan Holdings, New
                  Eskaton Road, Banglamotor, Dhaka
                </p>
                <p>
                  <span className="font-semibold">Email:</span> info@somikoronitld.com
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> 01711656808,
                  01757575715
                </p>
              </div>
            </div>

            {/* Right: MATERIAL REQUISITION Heading */}
            <div className="col-span-3 text-right">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                MATERIAL<br />REQUISITION
              </h2>
            </div>
          </div>

          {/* ==================================================== */}
          {/* METADATA BLOCK (2 Columns matching Screenshot) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:text-[13px] text-slate-900 pt-4 pb-6">
            
            {/* Left Column: Project, Title, Address, Site Engineer, Phone */}
            <div className="space-y-1">
              <p>
                <span className="font-bold">Project : </span>
                <span>{requisition.project || "Mustain Villa"}</span>
              </p>
              <p>
                <span className="font-bold">Title/Name of Work : </span>
                <span>{requisition.titleOfWork || "Direct Common Cost"}</span>
              </p>
              <p>
                <span className="font-bold">Address : </span>
                <span>{requisition.address || "Jolshiri"}</span>
              </p>
              <p>
                <span className="font-bold">Site Engineer: </span>
                <span>{requisition.siteEngineer || requisition.addedBy || "Mohin"}</span>
              </p>
              <p>
                <span className="font-bold">Phone: </span>
                <span>{requisition.phone || "01543667788"}</span>
              </p>
            </div>

            {/* Right Column: Requisition No, Date, Demand Date, Prepared By */}
            <div className="space-y-1 text-right">
              <p>
                <span className="font-bold">Requisition No: </span>
                <span>{requisition.code || "REC00103"}</span>
              </p>
              <p>
                <span className="font-bold">Date: </span>
                <span>{requisition.date || "19 Oct 2026"}</span>
              </p>
              <p>
                <span className="font-bold">Demand Date: </span>
                <span>{requisition.demandDate || "20 Oct 2026"}</span>
              </p>
              <p>
                <span className="font-bold">Prepared By : </span>
                <span>{requisition.addedBy || "Mohin"}</span>
              </p>
            </div>
          </div>

          {/* ==================================================== */}
          {/* ITEMS TABLE (Bordered, exact column layout) */}
          {/* ==================================================== */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[12px] sm:text-[13px] text-slate-900">
              <thead>
                <tr className="bg-white">
                  <th className="border border-black px-2 py-2 text-center font-bold w-12">
                    SL
                  </th>
                  <th className="border border-black px-3 py-2 text-left font-bold">
                    Item Name
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-bold w-20">
                    Unit
                  </th>
                  <th className="border border-black px-3 py-2 text-left font-bold">
                    Description
                  </th>
                  <th className="border border-black px-3 py-2 text-left font-bold w-24">
                    Brand
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-bold w-20 leading-tight">
                    Demand<br />Qty
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-bold w-20 leading-tight">
                    Approve<br />d Qty
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-3 py-2 font-medium">
                      {it.itemName}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {it.unit}
                    </td>
                    <td className="border border-black px-3 py-2">
                      {it.details || ""}
                    </td>
                    <td className="border border-black px-3 py-2">
                      {it.brand || ""}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {it.demandQty}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {it.approvedQty ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td className="border border-black px-2 py-2" colSpan={4}></td>
                  <td className="border border-black px-3 py-2 font-bold text-right">
                    Total
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-bold">
                    {totalDemandQty}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-bold">
                    {totalApprovedQty}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ==================================================== */}
          {/* SIGNATURE SECTION (Generous spacing + centered line) */}
          {/* ==================================================== */}
          <div className="mt-36 mb-16 flex flex-col items-center justify-center">
            <div className="w-64 border-t border-black"></div>
            <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 mt-2">
              Authorized Signature
            </span>
          </div>

          {/* ==================================================== */}
          {/* FOOTER: POWERED BY & PRINTING TIME */}
          {/* ==================================================== */}
          <div className="flex flex-col items-end text-[11px] sm:text-[12px] text-slate-900 space-y-0.5 pt-4">
            <p>
              <span className="font-bold">Powered by:</span> Somikoron IT Ltd
            </p>
            <p>
              <span className="font-bold">Printing Time:</span> {printTime}
            </p>
          </div>
        </div>
      </div>

      {/* Global Print Media Style */}
      <style jsx global>{`
        @media print {
          /* Hide all surrounding interface */
          body * {
            visibility: hidden !important;
          }
          /* Make printable element visible */
          #material-requisition-print-area,
          #material-requisition-print-area * {
            visibility: visible !important;
          }
          /* Fill the printed sheet without margins or offsets */
          #material-requisition-print-area {
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
