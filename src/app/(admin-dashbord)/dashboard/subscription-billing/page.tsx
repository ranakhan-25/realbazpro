/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import PaymentHistoryTable from "@/components/modules/PaymentHistoryTable";
import SubscriptionPaymentModal from "@/components/modules/SubscriptionPaymentModal";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";

export default function SubscriptionBillingPage() {
  const { primaryColor } = useTheme();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const profile = getStoredUserProfile();
  const orgId = profile?.orgId ?? null;

  const org = orgId
    ? { id: orgId, name: profile?.orgName ?? "My Organization" }
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Receipt className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Subscription &amp; Billing
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-12.5">
              View your payment history and download invoices for every transaction.
            </p>
          </div>

          <button
            onClick={() => setPaymentModalOpen(true)}
            style={{ backgroundColor: primaryColor }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm hover:opacity-90 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            Renew / Pay Plan
          </button>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Organization</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {profile?.orgName ?? "My Organization"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Account Type</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {profile?.isOrgAdmin ? "Organization Admin" : "Member"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Invoice Downloads</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                Available below
              </p>
            </div>
          </div>
        </div>

        {/* Payment History with Invoice Downloads */}
        <PaymentHistoryTable organizationId={orgId ?? undefined} />

      </div>

      {/* Payment Modal */}
      <SubscriptionPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        organization={org}
        onSuccess={() => {
          setPaymentModalOpen(false);
        }}
      />
    </div>
  );
}
