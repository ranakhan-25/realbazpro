"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  DollarSign,
  User,
  Mail,
  Phone,
  Building2,
  LandPlot,
  MapPin,
  FileText,
  Download,
  Printer,
  Hash,
  Copy,
  Check,
  TrendingUp,
  Layers,
  Receipt,
  Info,
  Plus,
  ChevronDown,
  Tag,
} from "lucide-react";

// ============ STATIC DATA ============
const planData = {
  id: "PLN-2024-0021",
  status: "Active",
  property: {
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    area: "5 katha",
    totalPrice: 12000000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  buyer: {
    name: "Ayesha Rahman",
    email: "ayesha.rahman@example.com",
    phone: "+880 1712-345678",
    avatar: "https://i.pravatar.cc/150?img=5",
    nid: "1990123456789",
  },
  plan: {
    type: "12-Month Installment",
    downPayment: 2400000,
    financed: 9600000,
    interestRate: 8,
    totalInstallments: 12,
    monthlyAmount: 830000,
    startDate: "2024-02-01",
    endDate: "2025-02-01",
  },
  progress: {
    paidAmount: 4980000,
    paidInstallments: 6,
    remainingAmount: 7020000,
    remainingInstallments: 6,
    nextDueDate: "2024-08-01",
    nextDueAmount: 830000,
    daysUntilDue: 14,
  },
  installments: [
    { no: 1, dueDate: "2024-02-01", amount: 830000, status: "Paid", paidDate: "2024-01-28", method: "Bank Transfer", txn: "TXN-CB-8A2F" },
    { no: 2, dueDate: "2024-03-01", amount: 830000, status: "Paid", paidDate: "2024-02-26", method: "Bank Transfer", txn: "TXN-CB-8B3F" },
    { no: 3, dueDate: "2024-04-01", amount: 830000, status: "Paid", paidDate: "2024-03-29", method: "Bank Transfer", txn: "TXN-CB-8C4F" },
    { no: 4, dueDate: "2024-05-01", amount: 830000, status: "Paid", paidDate: "2024-04-30", method: "Bank Transfer", txn: "TXN-CB-8D5F" },
    { no: 5, dueDate: "2024-06-01", amount: 830000, status: "Paid", paidDate: "2024-05-28", method: "Bank Transfer", txn: "TXN-CB-8E6F" },
    { no: 6, dueDate: "2024-07-01", amount: 830000, status: "Paid", paidDate: "2024-06-29", method: "Bank Transfer", txn: "TXN-CB-8F7F" },
    { no: 7, dueDate: "2024-08-01", amount: 830000, status: "Due", paidDate: null, method: null, txn: null },
    { no: 8, dueDate: "2024-09-01", amount: 830000, status: "Upcoming", paidDate: null, method: null, txn: null },
    { no: 9, dueDate: "2024-10-01", amount: 830000, status: "Upcoming", paidDate: null, method: null, txn: null },
    { no: 10, dueDate: "2024-11-01", amount: 830000, status: "Upcoming", paidDate: null, method: null, txn: null },
    { no: 11, dueDate: "2024-12-01", amount: 830000, status: "Upcoming", paidDate: null, method: null, txn: null },
    { no: 12, dueDate: "2025-01-01", amount: 830000, status: "Upcoming", paidDate: null, method: null, txn: null },
  ],
};

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  Paid: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Due: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
  },
  Upcoming: {
    bg: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    icon: Clock,
  },
  Overdue: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: AlertCircle,
  },
};

// ============ COMPONENTS ============

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable = false,
}: {
  icon: any;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {value}
          </p>
          {copyable && <CopyButton text={value} />}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <Icon size={18} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(2)} L`;
  return `৳${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============ MAIN PAGE ============

export default function InstallmentsPage() {
  const plan = planData;
  const paidPercent = Math.round(
    (plan.progress.paidAmount / plan.property.totalPrice) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/dashboard/sales-management/inventory"
          className="hover:text-indigo-600 transition-colors"
        >
          Properties
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/dashboard/sales-management/inventory/payment-plans"
          className="hover:text-indigo-600 transition-colors"
        >
          Payment Plans
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">
          {plan.id}
        </span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/sales-management/inventory/payment-plans"
            className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Installment Schedule
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={12} />
                {plan.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Hash size={14} />
              {plan.id}
              <CopyButton text={plan.id} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <Printer size={16} /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> Pay Now
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Building2 size={16} />
            <span className="text-xs font-medium">Total Price</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(plan.property.totalPrice)}</p>
          <p className="text-xs mt-1 opacity-80">{plan.property.area}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle2 size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Paid
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatMoney(plan.progress.paidAmount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {plan.progress.paidInstallments}/{plan.plan.totalInstallments} installments
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Wallet size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Remaining
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatMoney(plan.progress.remainingAmount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {plan.progress.remainingInstallments} installments left
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Clock size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Next Due
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatMoney(plan.progress.nextDueAmount)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> in {plan.progress.daysUntilDue} days
          </p>
        </div>
      </div>

      {/* PROGRESS CARD */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Payment Progress
            </h3>
          </div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {paidPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            {formatMoney(plan.progress.paidAmount)} paid
          </span>
          <span>{formatMoney(plan.progress.remainingAmount)} remaining</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - 2/3: Installment Table */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Installment Schedule"
            icon={Calendar}
            action={
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {plan.installments.length} installments
              </span>
            }
          >
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        #
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Due Date
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Paid On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.installments.map((inst) => {
                      const cfg = statusConfig[inst.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <tr
                          key={inst.no}
                          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300">
                              {inst.no}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatMoney(inst.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text}`}
                            >
                              <StatusIcon size={10} />
                              {inst.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {inst.paidDate ? formatDate(inst.paidDate) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          {/* Plan Details */}
          <SectionCard title="Plan Details" icon={Layers}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <InfoRow icon={Tag} label="Plan Type" value={plan.plan.type} />
                <InfoRow
                  icon={DollarSign}
                  label="Down Payment"
                  value={formatMoney(plan.plan.downPayment)}
                />
                <InfoRow
                  icon={Wallet}
                  label="Financed Amount"
                  value={formatMoney(plan.plan.financed)}
                />
                <InfoRow
                  icon={TrendingUp}
                  label="Interest Rate"
                  value={`${plan.plan.interestRate}% per annum`}
                />
              </div>
              <div className="space-y-1">
                <InfoRow
                  icon={Layers}
                  label="Total Installments"
                  value={`${plan.plan.totalInstallments} months`}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Monthly Amount"
                  value={formatMoney(plan.plan.monthlyAmount)}
                />
                <InfoRow icon={Calendar} label="Start Date" value={formatDate(plan.plan.startDate)} />
                <InfoRow icon={Calendar} label="End Date" value={formatDate(plan.plan.endDate)} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT - 1/3: Sidebar */}
        <div className="space-y-6">
          {/* Buyer Card */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div className="px-6 pb-6 -mt-10">
              <img
                src={plan.buyer.avatar}
                alt={plan.buyer.name}
                className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 object-cover"
              />
              <div className="mt-3">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {plan.buyer.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Property Buyer
                </p>
              </div>

              <div className="space-y-1 mt-4">
                <InfoRow icon={Mail} label="Email" value={plan.buyer.email} copyable />
                <InfoRow icon={Phone} label="Phone" value={plan.buyer.phone} copyable />
                <InfoRow icon={FileText} label="NID" value={plan.buyer.nid} copyable />
              </div>
            </div>
          </div>

          {/* Property Card */}
          <SectionCard title="Property" icon={LandPlot}>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={plan.property.image}
                alt={plan.property.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {plan.property.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {plan.property.code}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow icon={MapPin} label="Location" value={plan.property.location} />
              <InfoRow icon={Layers} label="Type" value={plan.property.type} />
              <InfoRow icon={Building2} label="Area" value={plan.property.area} />
            </div>
          </SectionCard>

          {/* Next Payment */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} />
              <h3 className="font-bold">Next Payment Due</h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatMoney(plan.progress.nextDueAmount)}
            </p>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(plan.progress.nextDueDate)} • in {plan.progress.daysUntilDue} days
            </p>
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition-colors border border-white/20">
              <CreditCard size={16} />
              Pay Now
            </button>
          </div>

          {/* Quick Actions */}
          <SectionCard title="Quick Actions" icon={Wallet}>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Receipt size={16} className="text-indigo-600" />
                  View All Receipts
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Download size={16} className="text-indigo-600" />
                  Download Statement
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar size={16} className="text-indigo-600" />
                  Reschedule Plan
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </SectionCard>

          {/* Info Alert */}
          <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Late payments incur a 2% penalty per month. Contact support if you need to reschedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}