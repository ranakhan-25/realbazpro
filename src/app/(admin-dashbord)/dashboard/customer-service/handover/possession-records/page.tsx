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
  const brand = primaryColor || "#6D4AFF";

  const [records, setRecords] = useState<PossessionRecord[]>(INITIAL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<PossessionRecord | null>(null);

  const columns: Column<PossessionRecord>[] = [
    {
      key: "certNo",
      header: "POSSESSION CERTIFICATE & UNIT",
      sortable: true,
      minWidth: "240px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] tabular-nums text-xs">{r.certNo}</span>
          <div className="text-[11px] font-medium text-[#111827] mt-0.5">{r.unit}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "PURCHASER & PROJECT",
      minWidth: "200px",
      render: (r) => (
        <div>
          <div className="font-semibold text-[#111827] text-xs">{r.customerName}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">{r.project}</div>
        </div>
      ),
    },
    {
      key: "possessionDate",
      header: "POSSESSION TAKEN",
      minWidth: "150px",
      render: (r) => (
        <span className="text-xs font-semibold text-[#111827] tabular-nums">
          {r.possessionDate}
        </span>
      ),
    },
    {
      key: "dlpExpiryDate",
      header: "STATUTORY 2-YEAR DLP TIMER",
      minWidth: "220px",
      render: (r) => (
        <div>
          <span className="font-semibold text-[#6D4AFF] text-xs tabular-nums">
            Valid till {r.dlpExpiryDate}
          </span>
          <div className="text-[10px] text-[#6B7280]">Real Estate Act 2010 Sec 11(2)(c)</div>
        </div>
      ),
    },
    {
      key: "keysDeliveredCount",
      header: "KEY REGISTER",
      minWidth: "190px",
      render: (r) => (
        <span className="rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#374151] tabular-nums">
          {r.keyRegisterNo} ({r.keysDeliveredCount} Keys)
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      align: "right",
      minWidth: "120px",
      render: (r) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedRecord(r)}
            title="View & Print Possession Certificate"
            aria-label="View Certificate"
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] text-xs font-semibold transition shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Printer className="h-3.5 w-3.5" /> Certificate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6 pb-28 md:pb-32 space-y-6 max-w-[1600px] mx-auto">
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
          iconBg="bg-[#F4F1FF]"
          iconColor="text-[#6D4AFF]"
        />
        <CSStatCard
          title="Utility Meters Transferred"
          value="100%"
          subtext="DESCO / DPDC / Gas meters logged"
          icon={CheckCircle2}
          iconBg="bg-[#ECFDF3]"
          iconColor="text-[#039855]"
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
              className="h-9 px-4 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#6D4AFF] hover:bg-[#5935DE] rounded-lg shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5" /> Print Possession Certificate
            </button>
          </>
        }
      >
        {selectedRecord && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 space-y-4 text-xs font-sans text-[#374151]">
            <div className="border-b border-[#E5E7EB] pb-3 text-center">
              <h2 className="text-base font-bold text-[#111827] tracking-tight">
                REALBIZ PRO REAL ESTATE LTD.
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Official Possession Certificate & Key Delivery Deed
              </p>
              <span className="text-[10px] tabular-nums text-[#6D4AFF] font-semibold block mt-1">
                Certificate No: {selectedRecord.certNo}
              </span>
            </div>

            <div className="space-y-3 leading-relaxed text-justify">
              <p>
                This is to certify that physical, vacant, peaceful and legal possession of the apartment
                <strong> “{selectedRecord.unit}”</strong> in the project <strong>“{selectedRecord.project}”</strong> has been
                formally handed over to the purchaser:
              </p>
              <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-1.5">
                <div>
                  <span className="text-[#6B7280] text-[11px]">Allottee Name: </span>
                  <span className="font-semibold text-[#111827]">{selectedRecord.customerName}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[11px]">Possession Handover Date: </span>
                  <span className="font-semibold text-[#111827] tabular-nums">{selectedRecord.possessionDate}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[11px]">Key Register Reference: </span>
                  <span className="tabular-nums font-semibold text-[#111827]">
                    {selectedRecord.keyRegisterNo} ({selectedRecord.keysDeliveredCount} sets of brass & master keys)
                  </span>
                </div>
              </div>

              {/* Meter readings */}
              <div className="border border-[#E5E7EB] rounded-[12px] p-3.5 space-y-1.5 text-[11px] bg-white">
                <div className="font-semibold text-[#111827] mb-1">Transferred Utility Meter Baseline Readings:</div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Electricity Meter:</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedRecord.electricMeterReading}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Gas Utility Line:</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedRecord.gasMeterReading}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Water Supply Meter:</span>
                  <span className="tabular-nums font-semibold text-[#111827]">{selectedRecord.waterMeterReading}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#6B7280]">
                * Pursuant to Section 11(2)(c) of the Bangladesh Real Estate Development & Management Act, 2010,
                the statutory 2-year Defect Liability Period (DLP) for construction defects is effective from the date of
                this possession certificate until <strong>{selectedRecord.dlpExpiryDate}</strong>.
              </p>
            </div>

            <div className="pt-6 border-t border-[#E5E7EB] grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="border-t border-[#9CA3AF] pt-1.5 font-semibold text-[#111827]">Purchaser Signature</p>
                <p className="text-[10px] text-[#9CA3AF]">Accepted with complete satisfaction</p>
              </div>
              <div>
                <p className="border-t border-[#9CA3AF] pt-1.5 font-semibold text-[#111827]">For RealBiz Pro Ltd.</p>
                <p className="text-[10px] text-[#9CA3AF]">Authorized Officer & Project Head</p>
              </div>
            </div>
          </div>
        )}
      </CSModal>
    </div>
  );
}
