/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { CreditCard, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: any) => void;
}

const CURRENCY_PRESETS = [
  { symbol: "$", label: "$ USD" },
  { symbol: "৳", label: "৳ BDT" },
  { symbol: "€", label: "€ EUR" },
  { symbol: "£", label: "£ GBP" },
  { symbol: "₹", label: "₹ INR" },
  { symbol: "AED", label: "AED" },
  { symbol: "SAR", label: "SAR" },
];

export default function PlanCreateModal({ isOpen, onClose, onCreate }: Props) {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState("$");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      code: formData.get("code"),
      description: formData.get("description"),
      currency: currency.trim() || "$",
      monthly_price: Number(formData.get("monthly_price")),
      yearly_price: Number(formData.get("yearly_price")),
      user_limit: Number(formData.get("user_limit")),
      project_limit: Number(formData.get("project_limit")),
      storage_gb: Number(formData.get("storage_gb")),
      duration_days: Number(formData.get("duration_days")),
      trial_days: Number(formData.get("trial_days")),
      status: formData.get("status"),
    };
    onCreate(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandColor }}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Subscription Plan</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Define pricing tiers, quota allowances, and duration settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh]">
          <form id="create-plan-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Plan Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Enterprise Tier"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Plan Code * (Unique Identifier)
                </label>
                <input
                  name="code"
                  type="text"
                  required
                  placeholder="e.g. ENTERPRISE"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Brief summary of included value"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Currency Sign / Symbol Selection */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">
                      Currency Sign / Symbol *
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Select a standard preset or type your custom currency symbol/code below
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CURRENCY_PRESETS.map((cur) => (
                      <button
                        key={cur.symbol}
                        type="button"
                        onClick={() => setCurrency(cur.symbol)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                          currency === cur.symbol
                            ? "bg-blue-600 text-white shadow-xs font-semibold"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {cur.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    name="currency"
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="e.g. $, ৳, €, USD, BDT"
                    maxLength={10}
                    required
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">
                    Preview: {currency}99 /mo
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Monthly Price ({currency}) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-gray-400 select-none">
                    {currency}
                  </span>
                  <input
                    name="monthly_price"
                    type="number"
                    min="0"
                    defaultValue="29"
                    required
                    className="w-full border border-gray-200 pl-8 pr-3 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Yearly Price ({currency}) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-gray-400 select-none">
                    {currency}
                  </span>
                  <input
                    name="yearly_price"
                    type="number"
                    min="0"
                    defaultValue="290"
                    required
                    className="w-full border border-gray-200 pl-8 pr-3 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  User Limit *
                </label>
                <input
                  name="user_limit"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Project Limit *
                </label>
                <input
                  name="project_limit"
                  type="number"
                  min="1"
                  defaultValue="15"
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Storage (GB) *
                </label>
                <input
                  name="storage_gb"
                  type="number"
                  min="1"
                  defaultValue="20"
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white capitalize"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Billing Duration (Days)
                </label>
                <input
                  name="duration_days"
                  type="number"
                  min="1"
                  defaultValue="30"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Trial Duration (Days)
                </label>
                <input
                  name="trial_days"
                  type="number"
                  min="0"
                  defaultValue="14"
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-plan-form"
            className="px-6 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: brandColor }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
