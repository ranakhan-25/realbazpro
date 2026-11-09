"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { getPlans, type Plan } from "@/services/planService";
import {
  initiateSubscriptionPayment,
  type InitiatePaymentPayload,
} from "@/services/subscriptionPaymentService";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    id: number | string;
    name?: string;
    subscriptionEndDate?: string | Date;
    plan?: any;
    planId?: number | string;
  } | null;
  initialPlanId?: number | string;
  onSuccess?: () => void;
}

export default function SubscriptionPaymentModal({
  isOpen,
  onClose,
  organization,
  initialPlanId,
}: SubscriptionPaymentModalProps) {
  const { primaryColor } = useTheme();

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | string>("");
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "quarterly" | "half_yearly" | "yearly"
  >("monthly");
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePlans();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId);
    } else if (organization?.planId) {
      setSelectedPlanId(organization.planId);
    } else if (organization?.plan?.id) {
      setSelectedPlanId(organization.plan.id);
    }
  }, [initialPlanId, organization]);

  const loadAvailablePlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await getPlans();
      const planList = Array.isArray(res) ? res : (res as any)?.data || [];
      const activePlans = planList.filter(
        (p: any) => p && (p.status === "active" || !p.status),
      );
      setPlans(activePlans);

      if (!selectedPlanId && activePlans.length > 0) {
        setSelectedPlanId(activePlans[0].id || activePlans[0].uuid);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load subscription plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedPlan = plans.find(
    (p: any) => String(p.id) === String(selectedPlanId) || String(p.uuid) === String(selectedPlanId),
  );

  const calculateAmount = () => {
    if (!selectedPlan) return 100;
    const monthly = Number(selectedPlan.monthlyPrice || (selectedPlan as any).monthly_price || 0);
    const yearly = Number(selectedPlan.yearlyPrice || (selectedPlan as any).yearly_price || 0);

    switch (billingCycle) {
      case "yearly":
        return yearly > 0 ? yearly : Math.round(monthly * 12 * 0.8);
      case "half_yearly":
        return Math.round(monthly * 6 * 0.9);
      case "quarterly":
        return Math.round(monthly * 3 * 0.95);
      case "monthly":
      default:
        return monthly > 0 ? monthly : 100;
    }
  };

  const getDurationDays = () => {
    switch (billingCycle) {
      case "yearly":
        return 365;
      case "half_yearly":
        return 180;
      case "quarterly":
        return 90;
      case "monthly":
      default:
        return 30;
    }
  };

  const handleInitiate = async () => {
    if (!organization?.id) {
      toast.error("Organization information is missing");
      return;
    }
    if (!selectedPlanId) {
      toast.error("Please select a subscription plan");
      return;
    }

    setInitiating(true);
    try {
      const payload: InitiatePaymentPayload = {
        organizationId: organization.id,
        planId: selectedPlanId,
        billingCycle,
      };

      const res = await initiateSubscriptionPayment(payload);

      if (res?.gatewayUrl) {
        toast.success("Redirecting to SSLCommerz sandbox gateway...");
        window.location.href = res.gatewayUrl;
      } else {
        toast.error("Failed to generate payment gateway URL");
        setInitiating(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to start checkout");
      setInitiating(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = calculateAmount();
  const durationDays = getDurationDays();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-indigo-100"
              style={{ backgroundColor: primaryColor }}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800">
                  Renew or Pay Subscription
                </h2>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                  SSLCommerz Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Organization: <span className="font-semibold text-slate-700">{organization?.name || "Current Tenant"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={initiating}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="border-b border-indigo-100 bg-indigo-50/70 px-6 py-2.5 flex items-center gap-2 text-xs text-indigo-900">
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>
            Secure checkout powered by <strong>SSLCommerz</strong>. Supports bKash, Nagad, cards, and internet banking with instant activation.
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Plan Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Subscription Plan
            </label>
            {loadingPlans ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Loading available subscription plans...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const pid = p.id || p.uuid;
                  const isSelected = String(pid) === String(selectedPlanId);
                  const monthlyPrice = p.monthlyPrice || (p as any).monthly_price || 0;

                  return (
                    <button
                      key={String(pid)}
                      type="button"
                      onClick={() => setSelectedPlanId(pid)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-xs text-slate-800">
                          {p.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        ৳{monthlyPrice}
                        <span className="text-[10px] text-slate-500 font-normal">
                          /mo
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Billing Cycle Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Billing Cycle
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { cycle: "monthly", label: "Monthly", desc: "30 Days" },
                { cycle: "quarterly", label: "Quarterly", desc: "90 Days (5% off)" },
                { cycle: "half_yearly", label: "Half Yearly", desc: "180 Days (10% off)" },
                { cycle: "yearly", label: "Yearly", desc: "365 Days (20% off)" },
              ].map((item) => {
                const isSelected = billingCycle === item.cycle;
                return (
                  <button
                    key={item.cycle}
                    type="button"
                    onClick={() => setBillingCycle(item.cycle as any)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & Extension Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Package Selected:</span>
              <span className="font-semibold text-slate-800">
                {selectedPlan?.name || "Standard Plan"} ({billingCycle})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Period Extension:</span>
              <span className="font-semibold text-indigo-700">
                +{durationDays} Days added to subscription
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Total Payable Amount:
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                ৳{totalAmount}{" "}
                <span className="text-xs font-normal text-slate-500">BDT</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/80 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Demo Sandbox mode active. You can use test mobile banking or test cards.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={initiating}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInitiate}
              disabled={initiating || loadingPlans}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              {initiating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Session...
                </>
              ) : (
                <>
                  <span>Pay with SSLCommerz</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
