"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronRight, ArrowLeft, Calendar, Clock, CheckCircle2, AlertCircle,
  CreditCard, Wallet, Building2, Mail, Phone, Hash, Copy, Check,
  TrendingUp, X, Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ============ TYPES ============
interface Installment {
  id: string;
  uuid?: string;
  no?: number;
  installmentNo?: number;
  dueDate: string;
  amount: number | string;
  status: string;
  paidDate?: string | null;
  method?: string | null;
  txn?: string | null;
}

interface PlanDetails {
  uuid: string;
  planCode: string;
  status: string;
  property: {
    totalPrice: number | string;
    area?: string;
    name?: string;
    code?: string;
    type?: string;
    location?: string;
    image?: string;
  };
  buyer?: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    nid?: string;
  };
  plan: {
    type: string;
    downPayment: number | string;
    financed: number | string;
    interestRate: number | string;
    totalInstallments: number;
    monthlyAmount: number | string;
    startDate: string;
    endDate: string;
  };
  progress: {
    paidAmount: number;
    paidInstallments: number;
    remainingAmount: number;
    remainingInstallments: number;
    nextDueDate: string | null;
    nextDueAmount: number;
  };
  installments: Installment[];
}

// ============ MOCK DATA (ডাটাবেসের আসল id বসানো হয়েছে) ============
const MOCK_PLAN: PlanDetails = {
  uuid: "f6ecd9f3-a700-48a5-a40d-ceaf73b60d98",
  planCode: "PLN-2024-001",
  status: "Active",
  property: {
    totalPrice: 12000000,
    area: "5 Katha",
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    location: "Gulshan-2, Dhaka",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  },
  buyer: {
    name: "Ayesha Rahman",
    email: "ayesha.rahman@example.com",
    phone: "+880 1712-345678",
    avatar: "https://i.pravatar.cc/150?img=5",
    nid: "1990123456789",
  },
  plan: {
    type: "Standard Plan",
    downPayment: 2400000,
    financed: 9600000,
    interestRate: 5,
    totalInstallments: 36,
    monthlyAmount: 266666,
    startDate: "2024-01-15",
    endDate: "2027-01-15",
  },
  progress: {
    paidAmount: 2400000,
    paidInstallments: 1,
    remainingAmount: 9600000,
    remainingInstallments: 35,
    nextDueDate: "2024-02-15",
    nextDueAmount: 266666,
  },
  installments: [
    // ✅ ১ নম্বর ইনস্টলমেন্ট (ডাটাবেসে থাকা আসল id)
    { id: "c825720c-390f-427...", no: 1, dueDate: "2024-01-15", amount: 2400000, status: "Paid", paidDate: "2024-01-10" },
    // ✅ ২ নম্বর ইনস্টলমেন্ট (নতুন তৈরি হওয়া id)
    { id: "আপনার-ডাটাবেসের-id-২", no: 2, dueDate: "2024-02-15", amount: 266666, status: "Due" },
    // ✅ ৩ নম্বর ইনস্টলমেন্ট (নতুন তৈরি হওয়া id)
    { id: "আপনার-ডাটাবেসের-id-৩", no: 3, dueDate: "2024-03-15", amount: 266666, status: "Upcoming" },
  ],
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

// ============ HELPERS ============
const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  Paid: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  Due: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: AlertCircle },
  Upcoming: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", icon: Clock },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function formatMoney(n: number | string) {
  const num = Number(n);
  if (!num && num !== 0) return "৳0";
  if (num >= 10_000_000) return `৳${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `৳${(num / 100_000).toFixed(2)} L`;
  return `৳${num.toLocaleString()}`;
}

function formatDate(d?: string | null) {
  if (!d) return "N/A";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============ MAIN PAGE ============
export default function InstallmentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planUuid = (params?.uuid || params?.id || searchParams.get("uuid")) as string;

  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [txnId, setTxnId] = useState("");

  // ✅ Fetch Data
  const fetchPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/installment-plans/${planUuid}`);
      if (res.ok) {
        const responseData = await res.json();
        const actualData = responseData?.data || responseData;
        if (actualData && actualData.installments) {
          setPlan(actualData);
          return;
        }
      }
    } catch (error) {
      console.log("API error, using mock data");
    } finally {
      setIsLoading(false);
    }
    setPlan(MOCK_PLAN);
  }, [planUuid]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // ✅ Open Modal
  const handleOpenModal = (installment?: Installment) => {
    if (installment) {
      setSelectedInstallment(installment);
    } else if (plan) {
      const nextDue = plan.installments.find((i) => i.status === "Due");
      if (nextDue) setSelectedInstallment(nextDue);
      else setSelectedInstallment(plan.installments[0]);
    }
    setIsModalOpen(true);
  };

  // ✅ Submit Payment (সবচেয়ে গুরুত্বপূর্ণ ফিক্স)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnId) return toast.error("Please enter a Transaction ID");
    if (!plan || !selectedInstallment) return;

    setIsSubmitting(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, '')}/installment-plans/pay`;

      // ✅ এখানে uuid এর বদলে no বা id পাঠানো হচ্ছে
      const payload = {
        planUuid: plan.uuid || MOCK_PLAN.uuid,
        installmentUuid: String(selectedInstallment.no || selectedInstallment.id),
        paymentMethod,
        transactionId: txnId,
      };

      console.log("🚀 Sending Payment Request:", { url, payload });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");

      toast.success("Payment Successful!");
      setIsModalOpen(false);
      setTxnId("");
      fetchPlan(); 
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={40} className="animate-spin text-indigo-600" /></div>;
  }

  const displayPlan = plan || MOCK_PLAN;
  const paidPercent = Math.round((Number(displayPlan.progress.paidAmount) / (Number(displayPlan.property.totalPrice) || 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <CreditCard className="text-indigo-600" size={20} /> Pay Installment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl mb-4 border border-indigo-100">
                <p className="text-xs text-indigo-600 mb-1">Amount to Pay</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMoney(selectedInstallment?.amount || displayPlan.progress.nextDueAmount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Installment #{selectedInstallment?.no || selectedInstallment?.installmentNo || "Next"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Bkash">Bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Check">Check</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input type="text" required value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. TXN-CB-8A2F" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-70">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/inventory" className="hover:text-indigo-600">Properties</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/inventory/payment-plans" className="hover:text-indigo-600">Payment Plans</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{displayPlan.planCode}</span>
      </nav>

      <div className="flex items-start gap-4 mb-8">
        <Link href="/dashboard/sales-management/inventory/payment-plans" className="p-2.5 rounded-xl bg-white border hover:bg-gray-50">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
            Installment Schedule
            <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> {displayPlan.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Hash size={14} /> {displayPlan.planCode} <CopyButton text={displayPlan.planCode} />
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90"><Building2 size={16} /> <span className="text-xs font-medium">Total Price</span></div>
          <p className="text-2xl font-bold">{formatMoney(displayPlan.property.totalPrice)}</p>
        </div>
        <div className="rounded-2xl bg-white border p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600"><CheckCircle2 size={16} /> <span className="text-xs font-medium text-gray-500">Paid</span></div>
          <p className="text-lg font-bold text-gray-900">{formatMoney(displayPlan.progress.paidAmount)}</p>
        </div>
        <div className="rounded-2xl bg-white border p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600"><Wallet size={16} /> <span className="text-xs font-medium text-gray-500">Remaining</span></div>
          <p className="text-lg font-bold text-gray-900">{formatMoney(displayPlan.progress.remainingAmount)}</p>
        </div>
        <div className="rounded-2xl bg-white border p-5">
          <div className="flex items-center gap-2 mb-2 text-blue-600"><Clock size={16} /> <span className="text-xs font-medium text-gray-500">Next Due</span></div>
          <p className="text-lg font-bold text-gray-900">{formatMoney(displayPlan.progress.nextDueAmount)}</p>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="rounded-2xl bg-white border p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600" /> <h3 className="font-bold text-gray-900">Payment Progress</h3></div>
          <span className="text-sm font-bold text-indigo-600">{paidPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${paidPercent}%` }} />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayPlan.installments.map((inst) => {
              const cfg = statusConfig[inst.status] || statusConfig["Upcoming"];
              const StatusIcon = cfg.icon;
              return (
                <tr key={inst.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inst.no || inst.installmentNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatDate(inst.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoney(inst.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text}`}>
                      <StatusIcon size={10} /> {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inst.status === "Due" && (
                      <button onClick={() => handleOpenModal(inst)} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={() => handleOpenModal()} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
        <CreditCard size={18} className="inline mr-2" /> Pay Next Installment
      </button>
    </div>
  );
}