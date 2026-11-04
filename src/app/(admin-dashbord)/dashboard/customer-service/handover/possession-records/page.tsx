"use client";

import React, { useState } from "react";
import {
  KeyRound,
  FileCheck2,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building,
  Zap,
  Droplets,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

interface PossessionRecord {
  id: string;
  certNo: string;
  customerName: string;
  unit: string;
  project: string;
  possessionDate: string;
  dlpExpiryDate: string;
  keyRegisterNo: string;
  keysDeliveredCount: number;
  electricMeterReading: string;
  gasMeterReading: string;
  waterMeterReading: string;
  signedByCustomer: boolean;
}

const INITIAL_RECORDS: PossessionRecord[] = [
  {
    id: "POS-1001",
    certNo: "POS-CERT-2026-00412",
    customerName: "Dr. Nazmul Huda",
    unit: "B-4, Eastern Lakeview",
    project: "Eastern Lakeview",
    possessionDate: "2026-10-15",
    dlpExpiryDate: "2028-10-14",
    keyRegisterNo: "KEY-2026-00412",
    keysDeliveredCount: 8,
    electricMeterReading: "14,208 kWh (DESCO Prepaid)",
    gasMeterReading: "Direct Cylinder System Active",
    waterMeterReading: "00,124 m³",
    signedByCustomer: true,
  },
  {
    id: "POS-1002",
    certNo: "POS-CERT-2026-00388",
    customerName: "Mohammad Rafiqul Islam",
    unit: "A-7, Hena Heights",
    project: "Hena Heights, Gulshan",
    possessionDate: "2026-08-20",
    dlpExpiryDate: "2028-08-19",
    keyRegisterNo: "KEY-2026-00388",
    keysDeliveredCount: 10,
    electricMeterReading: "02,110 kWh (DPDC Postpaid)",
    gasMeterReading: "Central Reticulated LPG",
    waterMeterReading: "00,050 m³",
    signedByCustomer: true,
  },
];

export default function PossessionRecordsPage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#0000F2";

  const [records, setRecords] = useState<PossessionRecord[]>(INITIAL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<PossessionRecord | null>(null);

  const columns: Column<PossessionRecord>[] = [
    {
      key: "certNo",
      header: "Possession Certificate & Unit",
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{r.certNo}</span>
          <div className="text-[11px] font-semibold text-slate-800">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Purchaser & Project",
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900">{r.customerName}</div>
          <div className="text-[11px] text-slate-500">{r.project}</div>
        </div>
      ),
    },
    {
      key: "possessionDate",
      header: "Possession Taken",
      render: (r) => (
        <span className="text-xs font-semibold text-slate-800">
          {r.possessionDate}
        </span>
      ),
    },
    {
      key: "dlpExpiryDate",
      header: "Statutory 2-Year DLP Timer",
      render: (r) => (
        <div>
          <span className="font-bold text-indigo-700 text-xs">
            Valid till {r.dlpExpiryDate}
          </span>
          <div className="text-[10px] text-slate-400">Real Estate Act 2010 Sec 11(2)(c)</div>
        </div>
      ),
    },
    {
      key: "keysDeliveredCount",
      header: "Key Register",
      render: (r) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-700">
          {r.keyRegisterNo} ({r.keysDeliveredCount} Keys)
        </span>
      ),
    },
    {
      key: "actions",
      header: "Possession Certificate",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedRecord(r)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Printer className="h-3.5 w-3.5 text-blue-600" /> Certificate
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      <CSPageHeader
        title="Possession & Handover Records (হস্তান্তরপত্র ও চাবি রেজিস্টার)"
        subtitle="Permanent digital archives of possession certificates, key handover registers, utility meter transfers and DLP timers."
        badge="Asset Handover Archive"
        breadcrumbs={[{ label: "Handover & Possession" }, { label: "Possession Records" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CSStatCard
          title="Total Possession Records"
          value={records.length.toString()}
          subtext="Signed & executed certificates"
          icon={KeyRound}
        />
        <CSStatCard
          title="Active 2-Year DLP Timers"
          value={records.length.toString()}
          subtext="Under statutory builder warranty"
          icon={ShieldCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <CSStatCard
          title="Utility Meters Transferred"
          value="100%"
          subtext="DESCO / DPDC / Gas meters logged"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <CSTable
        data={records}
        columns={columns}
        searchPlaceholder="Search possession certificate no, customer name or unit..."
        searchFields={["certNo", "customerName", "unit", "keyRegisterNo"]}
        emptyTitle="No possession records archived"
      />

      {/* Possession Certificate Modal */}
      <CSModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Official Possession Certificate (হস্তান্তরপত্র)"
        subtitle={`Certificate Ref: ${selectedRecord?.certNo}`}
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Printer className="h-3.5 w-3.5" /> Print Possession Certificate
            </button>
          </>
        }
      >
        {selectedRecord && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs font-serif text-slate-800">
            <div className="border-b border-slate-200 pb-3 text-center font-sans">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                REALBIZ PRO REAL ESTATE LTD.
              </h2>
              <p className="text-[11px] text-slate-500">
                Official Possession Certificate & Key Delivery Deed
              </p>
              <span className="text-[10px] font-mono text-blue-700 font-bold block mt-1">
                Certificate No: {selectedRecord.certNo}
              </span>
            </div>

            <div className="space-y-3 leading-relaxed text-justify">
              <p>
                This is to certify that physical, vacant, peaceful and legal possession of the apartment
                <strong> “{selectedRecord.unit}”</strong> in the project <strong>“{selectedRecord.project}”</strong> has been
                formally handed over to the purchaser:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-sans space-y-1">
                <div>
                  <span className="text-slate-500 text-[11px]">Allottee Name: </span>
                  <span className="font-bold text-slate-900">{selectedRecord.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Possession Handover Date: </span>
                  <span className="font-bold text-slate-900">{selectedRecord.possessionDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Key Register Reference: </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedRecord.keyRegisterNo} ({selectedRecord.keysDeliveredCount} sets of brass & master keys)
                  </span>
                </div>
              </div>

              {/* Meter readings */}
              <div className="border border-slate-200 rounded-lg p-3 font-sans space-y-1 text-[11px]">
                <div className="font-bold text-slate-900 mb-1">Transferred Utility Meter Baseline Readings:</div>
                <div className="flex justify-between">
                  <span>Electricity Meter:</span>
                  <span className="font-mono font-semibold">{selectedRecord.electricMeterReading}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Utility Line:</span>
                  <span className="font-mono font-semibold">{selectedRecord.gasMeterReading}</span>
                </div>
                <div className="flex justify-between">
                  <span>Water Supply Meter:</span>
                  <span className="font-mono font-semibold">{selectedRecord.waterMeterReading}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600">
                * Pursuant to Section 11(2)(c) of the Bangladesh Real Estate Development & Management Act, 2010,
                the statutory 2-year Defect Liability Period (DLP) for construction defects is effective from the date of
                this possession certificate until <strong>{selectedRecord.dlpExpiryDate}</strong>.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 font-sans text-center">
              <div>
                <p className="border-t border-slate-400 pt-1 font-bold text-slate-800">Purchaser Signature</p>
                <p className="text-[10px] text-slate-400">Accepted with complete satisfaction</p>
              </div>
              <div>
                <p className="border-t border-slate-400 pt-1 font-bold text-slate-800">For RealBiz Pro Ltd.</p>
                <p className="text-[10px] text-slate-400">Authorized Officer & Project Head</p>
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}

