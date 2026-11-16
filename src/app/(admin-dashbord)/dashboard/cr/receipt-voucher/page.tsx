/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  Plus,
  FileText,
  FileSpreadsheet,
  Mail,
  MessageCircle,
  Printer,
  Edit,
  Trash2,
  Copy,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { crApi } from "@/lib/crApi";
import { showAlert } from "@/lib/swal";

const menuItems = [
  "Chart of Group",
  "Chart of Accounts",
  "Expense",
  "Bank Reconciliation",
  "Payment Voucher",
  "Journal Voucher",
  "Contra Voucher",
];

export default function ReceiptVoucherPage() {
  const [showMenu, setShowMenu] = useState(false);
  const [entries, setEntries] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [agreements, setAgreements] = useState<any[]>([]);
  const [overduePlans, setOverduePlans] = useState<any[]>([]);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [activeVoucherPrint, setActiveVoucherPrint] = useState<any>(null);

  // Form states
  const [selectedPlanUuid, setSelectedPlanUuid] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [chequeNo, setChequeNo] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agrsResult, overdueResult] = await Promise.allSettled([
        crApi.getAgreements?.() ?? Promise.resolve([]),
        crApi.getOverdueInstallments?.() ?? Promise.resolve([]),
      ]);
      const agrs = agrsResult.status === "fulfilled" && Array.isArray(agrsResult.value) ? agrsResult.value : [];
      const overdue = overdueResult.status === "fulfilled" && Array.isArray(overdueResult.value) ? overdueResult.value : [];

      setAgreements(agrs);
      setOverduePlans(overdue);

      // Flatten payment vouchers from all agreements
      const rows: any[] = [];
      let sl = 1;

      (agrs || []).forEach((agr: any) => {
        (agr.installment_plans || []).forEach((plan: any) => {
          (plan.payments || []).forEach((pay: any) => {
            rows.push({
              sl: sl++,
              date: pay?.payment_date || (pay?.createdAt ? String(pay.createdAt).slice(0, 10) : "Not found"),
              project: agr?.unit_identifier || "Not found",
              code: pay?.payment_voucher_no || "Not found",
              credit: agr?.customer_name || "Not found",
              debit: pay?.payment_method?.replace(/_/g, " ").toUpperCase() || "Not found",
              total: Number(pay.paid_amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              ref: plan?.title || (plan?.installment_no ? `Installment #${plan.installment_no}` : "Not found"),
              cheque: pay?.cheque_no || pay?.transaction_reference || "Not found",
              comment: pay?.remarks || agr?.agreement_number || "Not found",
              addedBy: pay?.createdBy || "Not found",
              editedBy: "—",
              approve: pay?.approval_status || "Not found",
              attachment: pay?.attachment ? "1" : "Not found",
              status: pay?.status || "Not found",
            });
          });
        });
      });

      setTableRows(rows);
    } catch (err) {
      console.error("Error loading receipt voucher data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return tableRows;
    const q = search.toLowerCase();
    return tableRows.filter(
      (r) =>
        r.project?.toLowerCase().includes(q) ||
        r.credit?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.ref?.toLowerCase().includes(q)
    );
  }, [search, tableRows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict Validation
    if (!voucherNo.trim()) {
      showAlert.warning("Voucher Number Required", "Please enter a valid Voucher Number.");
      return;
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showAlert.warning("Invalid Amount", "Please enter a valid payment amount greater than 0.");
      return;
    }
    if (!paymentMethod) {
      showAlert.warning("Payment Method Required", "Please select a payment method.");
      return;
    }

    // Determine target installment plan uuid
    const targetUuid = selectedPlanUuid;

    if (!targetUuid) {
      showAlert.warning(
        "No Installment Found",
        "Please select an agreement or installment to apply this payment."
      );
      return;
    }

    setSubmitting(true);
    try {
      await crApi.recordPayment(targetUuid, {
        payment_voucher_no: voucherNo,
        paid_amount: numAmount,
        penalty_paid: 0,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        cheque_no: chequeNo || undefined,
        remarks: comment || undefined,
      });

      // Reset form
      setVoucherNo("");
      setAmount("");
      setChequeNo("");
      setComment("");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-canvas text-ink cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[17px] font-semibold text-ink">Receipt Voucher</h1>
            <p className="text-[12px] text-ink-muted">
              Credit Realization / Receipt Voucher Register
            </p>
          </div>
        </div>

        {/* Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-[13px] font-medium text-ink hover:bg-canvas cursor-pointer"
          >
            Accounts Menu
            <ChevronDown className="w-4 h-4 text-ink-muted" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-surface shadow-lg py-1 z-30">
              {menuItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-ink hover:bg-canvas cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Voucher Entry Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Header Information */}
          <div className="bg-surface rounded-lg border border-border shadow-sm p-4 space-y-3">
            <h3 className="text-[13px] font-semibold text-ink border-b border-border pb-2">
              Header Information
            </h3>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">
                Select Customer / Sale Agreement <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPlanUuid}
                onChange={(e) => setSelectedPlanUuid(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              >
                <option value="">
                  {agreements.length === 0 ? "Loading agreements..." : "Select Customer Account..."}
                </option>
                {agreements.map((agr) =>
                  (agr.installment_plans || []).map((p: any) => (
                    <option key={p.uuid} value={p.uuid}>
                      {agr.customer_name} ({agr.unit_identifier}) — {p.title} (Due: {p.due_amount} BDT)
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">
                Voucher No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="Voucher No"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              />
            </div>
          </div>

          {/* Card 2: Payment Details */}
          <div className="bg-surface rounded-lg border border-border shadow-sm p-4 space-y-3">
            <h3 className="text-[13px] font-semibold text-ink border-b border-border pb-2">
              Payment Details
            </h3>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              >
                <option value="bank_transfer">Bank Transfer (EBL / BEFTN)</option>
                <option value="cash">Cash Counter Receipt</option>
                <option value="cheque">Account Payee Cheque</option>
                <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">Cheque / Receipt No</label>
              <input
                type="text"
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                placeholder="Enter Cheque / TRX reference"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">
                Amount (BDT) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 233333.33"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              />
            </div>
          </div>

          {/* Card 3: Additional Notes */}
          <div className="bg-surface rounded-lg border border-border shadow-sm p-4 space-y-3">
            <h3 className="text-[13px] font-semibold text-ink border-b border-border pb-2">
              Reference & Remarks
            </h3>
            <div>
              <label className="block text-[12px] text-ink-muted mb-1">Remarks / Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Payment clearance verification notes..."
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0000F2] text-white text-[13px] font-medium shadow-sm hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Post Receipt Voucher
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Table Section */}
      <div className="px-4 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="border border-border rounded px-2 py-1 text-[13px] bg-surface text-ink"
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-ink-muted">Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vouchers..."
              className="border border-border rounded px-2 py-1 text-[13px] w-48 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-[#0000F2]"
            />
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  {[
                    "SL",
                    "DATE",
                    "PROJECT",
                    "VOUCHER",
                    "CUSTOMER",
                    "METHOD",
                    "TOTAL (BDT)",
                    "INSTALLMENT REF",
                    "CHEQUE / TRX",
                    "APPROVAL",
                    "ACTION",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border animate-pulse">
                      {Array.from({ length: 11 }).map((__, cIdx) => (
                        <td key={cIdx} className="px-3 py-3">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredRows.length > 0 ? (
                  filteredRows.slice(0, entries).map((row, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-canvas/70">
                      <td className="px-3 py-2.5 text-ink-muted">{row.sl}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-ink">{row.date}</td>
                      <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                        {row.project}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-ink">{row.code}</td>
                      <td className="px-3 py-2.5 text-sky-600 font-medium">{row.credit}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{row.debit}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold text-emerald-600">
                        {row.total}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted">{row.ref}</td>
                      <td className="px-3 py-2.5 font-mono text-ink-muted">{row.cheque}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-emerald-600 text-[11px] font-medium">
                          ✓ {row.approve}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveVoucherPrint(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0000F2] text-white text-[11px] font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                        >
                          <Printer size={12} />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-ink-faint">
                      No live receipt vouchers found. Fill the form above to record a payment voucher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Print Ready Money Receipt Modal */}
      {activeVoucherPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-gray-200">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Official Money Receipt Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0000F2] text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Printer size={13} />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVoucherPrint(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Receipt Printable Card */}
            <div className="border-2 border-gray-900 p-6 rounded-xl space-y-5 bg-white text-gray-900">
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">
                    REALBIZ PRO REAL ESTATE LTD.
                  </h2>
                  <p className="text-xs text-gray-600">
                    Credit Realization & Collection Division
                  </p>
                  <p className="text-xs text-gray-500">
                    Dhaka, Bangladesh | Phone: +880 9612-000000
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded">
                    MONEY RECEIPT
                  </div>
                  <div className="mt-2 text-xs font-mono font-bold text-gray-800">
                    MR No: {activeVoucherPrint.code}
                  </div>
                  <div className="text-xs text-gray-500">
                    Date: {activeVoucherPrint.date}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-gray-500">Received With Thanks From:</span>
                  <p className="font-bold text-sm text-gray-900 mt-0.5">
                    {activeVoucherPrint.credit}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Project & Allotment:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {activeVoucherPrint.project}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Payment Purpose / Ref:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {activeVoucherPrint.ref}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Payment Mode & Instrument:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {activeVoucherPrint.debit} | Cheque/Trx: {activeVoucherPrint.cheque}
                  </p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Amount Received
                  </span>
                  <div className="text-xl font-black font-mono text-gray-900">
                    BDT {activeVoucherPrint.total}
                  </div>
                </div>
                <div className="text-right text-xs max-w-xs">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    Status
                  </span>
                  <p className="font-bold text-emerald-700 capitalize">
                    ✓ Verified Receipt Voucher
                  </p>
                </div>
              </div>

              {/* Remarks */}
              <div className="text-xs text-gray-600 italic">
                Note: {activeVoucherPrint.comment || "Subject to realization of cheque / online fund transfer clearance."}
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs text-gray-700">
                <div className="border-t border-gray-400 pt-1 font-medium">
                  Received / Posted By
                </div>
                <div className="border-t border-gray-400 pt-1 font-medium">
                  Checked & Verified
                </div>
                <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
