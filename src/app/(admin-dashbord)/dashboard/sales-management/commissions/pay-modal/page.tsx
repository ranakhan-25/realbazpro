"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  CreditCard,
  Wallet,
  Building2,
  ChevronRight,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  DollarSign,
  Hash,
  Info,
} from "lucide-react";

// ============ STATIC DATA ============
const payoutData = {
  agent: {
    name: "Rashed Karim",
    role: "Senior Property Consultant",
    avatar: "https://i.pravatar.cc/150?img=12",
    email: "rashed.karim@estate.com",
    phone: "+880 1712-345678",
    bankName: "City Bank",
    accountNo: "1234567890123",
    branch: "Gulshan Branch",
    routingNo: "225261730",
  },
  pendingCommissions: [
    { dealId: "AGR-2024-001", property: "Gulshan Plot 12/A", amount: 240000, date: "2024-01-20", status: "Approved" },
    { dealId: "AGR-2024-008", property: "Banani Apartment 4B", amount: 130000, date: "2024-01-25", status: "Approved" },
    { dealId: "AGR-2024-012", property: "Uttara Plot 9", amount: 144000, date: "2024-02-01", status: "Approved" },
  ],
};

// ============ COMPONENTS ============
function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============
export default function PayCommissionModalPage() {
  const [submitted, setSubmitted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  const totalPayout = payoutData.pendingCommissions.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAcknowledged(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Commission paid successfully!</span>
        </div>
      )}

      {/* MAIN MODAL CARD */}
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden relative z-10">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Wallet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Process Commission Payout</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review and release pending funds to agent.</p>
            </div>
          </div>
          <Link href="/dashboard/sales-management/commissions" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            
            {/* AGENT DETAILS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <img src={payoutData.agent.avatar} alt={payoutData.agent.name} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{payoutData.agent.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{payoutData.agent.role}</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Details</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-1.5">
                  <Building2 size={14} className="text-indigo-500" /> {payoutData.agent.bankName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tracking-wider font-mono">•••• {payoutData.agent.accountNo.slice(-4)}</p>
              </div>
            </div>

            {/* COMMISSIONS BREAKDOWN */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Pending Approvals ({payoutData.pendingCommissions.length})
              </h4>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Deal ID</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Property</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {payoutData.pendingCommissions.map((comm) => (
                      <tr key={comm.dealId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">{comm.dealId}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{comm.property}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatMoney(comm.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTAL PAYOUT */}
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-1">Total Payout Amount</p>
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{formatMoney(totalPayout)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign size={24} />
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod("Bank Transfer")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "Bank Transfer" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                  <Building2 size={16} /> Bank Transfer
                </button>
                <button type="button" onClick={() => setPaymentMethod("Cheque")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "Cheque" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                  <FileText size={16} /> Cheque
                </button>
              </div>
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payout Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
              <textarea rows={2} placeholder="Reference number, transaction ID, or remarks…" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none" />
            </div>

            {/* ACKNOWLEDGEMENT */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <input type="checkbox" id="ack" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500" />
              <label htmlFor="ack" className="text-sm text-amber-800 dark:text-amber-300 select-none cursor-pointer">
                I confirm that the bank details match the agent's records and authorize this payment of <strong>{formatMoney(totalPayout)}</strong>.
              </label>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50">
            <Link href="/dashboard/sales-management/commissions" className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors text-center">
              Cancel
            </Link>
            <button type="submit" disabled={!acknowledged}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${acknowledged ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"}`}>
              <CheckCircle2 size={18} /> Confirm Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}