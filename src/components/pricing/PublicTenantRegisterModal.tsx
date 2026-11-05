"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  publicSubscriptionCheckout,
  type PublicCheckoutPayload,
} from "@/services/subscriptionPaymentService";

interface PublicTenantRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: number | string;
    name: string;
    monthly: string;
    yearly: string;
    isFree?: boolean;
    description?: string;
  } | null;
  billingCycle: "monthly" | "yearly";
}

export default function PublicTenantRegisterModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
}: PublicTenantRegisterModalProps) {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !plan) return null;

  const isFreeTrial = Boolean(plan.isFree);
  const priceDisplay = billingCycle === "yearly" ? plan.yearly : plan.monthly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error("Please enter your Company / Organization name");
      return;
    }
    if (!adminName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!adminEmail.trim()) {
      toast.error("Please enter your corporate email");
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);
    try {
      const payload: PublicCheckoutPayload = {
        planId: plan.id,
        billingCycle: billingCycle === "yearly" ? "yearly" : "monthly",
        organizationName: orgName.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
        adminPhone: adminPhone.trim() || undefined,
      };

      const res = await publicSubscriptionCheckout(payload);

      if (res.isFree) {
        toast.success(
          res.message ||
            "Account registered successfully! Redirecting to login...",
        );
        onClose();
        router.push("/portal");
      } else if (res.gatewayUrl) {
        toast.success(
          "Organization created! Redirecting to SSLCommerz checkout...",
        );
        window.location.href = res.gatewayUrl;
      } else {
        toast.success("Organization registered successfully!");
        onClose();
        router.push("/portal");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to start checkout";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-indigo-500/20"
              style={{ backgroundColor: brandColor }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Get Started with RealBiz Pro
                </h2>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  {isFreeTrial ? "Free Trial" : "Instant Setup"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Register your organization and activate your subscription
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Plan Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">
              Selected: <strong className="text-slate-900">{plan.name}</strong>{" "}
              ({billingCycle})
            </span>
          </div>
          <span className="text-sm font-extrabold text-indigo-700">
            {priceDisplay}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Company or Organization Name{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. Apex Holdings Ltd."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hossain"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="e.g. 01700000000"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Work Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="admin@yourcompany.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Set Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Secure SSLCommerz badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isFreeTrial
                ? "No credit card required for 14-day free trial evaluation."
                : "Secure checkout powered by SSLCommerz. Instant activation via bKash, Nagad, Visa, Mastercard."}
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: brandColor }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : isFreeTrial ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Start Free Trial
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
