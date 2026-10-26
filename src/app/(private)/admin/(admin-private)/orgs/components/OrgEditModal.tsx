/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { getPlans, type Plan } from "@/services/planService";
import {
  updateOrganization,
  updateSubscription,
  type Organization,
} from "@/services/organizationService";
import { toast } from "sonner";
import { Building2, X, CreditCard, Users, HardDrive, FolderKanban } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orgData: any;
  onUpdate: (uuid: string, payload: any) => void;
}

export default function OrgEditModal({
  isOpen,
  onClose,
  orgData,
  onUpdate,
}: Props) {
  const { primaryColor } = useTheme();
  const brandColor = primaryColor || "#0000F2";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    getPlans({ status: "active" })
      .then((data) => {
        if (data && data.length > 0) setPlans(data);
      })
      .catch((err) => {
        console.warn("Failed to load plans for OrgEditModal:", err);
      });
  }, [isOpen]);

  useEffect(() => {
    if (orgData?.plan?.id) {
      setSelectedPlanId(String(orgData.plan.id));
    } else if (orgData?.planId) {
      setSelectedPlanId(String(orgData.planId));
    }
  }, [orgData]);

  if (!isOpen || !orgData) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const maxUsers = Number(formData.get("maxUsers")) || 5;
    const maxProjects = Number(formData.get("maxProjects")) || 5;
    const maxStorageMb = (Number(formData.get("maxStorageGb")) || 2) * 1024;
    const planId = formData.get("planId") as string;
    const status = formData.get("status") as Organization["subscriptionStatus"];

    const identifier = orgData.id || orgData.uuid;

    try {
      // 1. Update general org details & quotas
      const updatedOrg = await updateOrganization(identifier, {
        name,
        email,
        phone,
        address,
        maxUsers,
        maxProjects,
        maxStorageMb,
      });

      // 2. Update subscription tier or status if changed
      if (planId || status) {
        await updateSubscription(identifier, {
          action: "change_plan",
          planId: planId ? Number(planId) : undefined,
          status,
        }).catch((err) => {
          console.warn("Subscription update secondary step warning:", err);
        });
      }

      toast.success("Organization updated successfully");
      onUpdate(orgData.uuid || String(orgData.id), {
        ...orgData,
        ...updatedOrg,
        name,
        email,
        phone,
        address,
        maxUsers,
        maxProjects,
        maxStorageMb,
        subscriptionStatus: status,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialStorageGb = orgData.maxStorageMb
    ? Math.round(orgData.maxStorageMb / 1024)
    : (orgData.storage_gb ?? 2);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit Organization: {orgData.name}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Code: {orgData.code || orgData.slug} &bull; ID: #{orgData.id}
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

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh]">
          <form id="edit-org-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Identity Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                General Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Organization Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={orgData.name}
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tenant Code (Read Only)
                  </label>
                  <input
                    name="code"
                    type="text"
                    defaultValue={orgData.code || orgData.slug}
                    readOnly
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm bg-gray-100 font-mono text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={orgData.email}
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone Contact
                  </label>
                  <input
                    name="phone"
                    type="text"
                    defaultValue={orgData.phone || ""}
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Office / Physical Address
                  </label>
                  <input
                    name="address"
                    type="text"
                    defaultValue={orgData.address || ""}
                    placeholder="e.g. Plot 12, Gulshan Avenue, Dhaka"
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quotas & Capacity */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Resource Quotas & Limits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Max Users *
                  </label>
                  <input
                    name="maxUsers"
                    type="number"
                    min="1"
                    defaultValue={orgData.maxUsers ?? orgData.user_limit ?? 5}
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-emerald-600" /> Max Projects *
                  </label>
                  <input
                    name="maxProjects"
                    type="number"
                    min="1"
                    defaultValue={orgData.maxProjects ?? orgData.project_limit ?? 5}
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-violet-600" /> Storage (GB) *
                  </label>
                  <input
                    name="maxStorageGb"
                    type="number"
                    min="1"
                    defaultValue={initialStorageGb}
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Subscription & Lifecycle */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Subscription & Tier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Subscription Tier / Plan
                  </label>
                  <select
                    name="planId"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Plan...</option>
                    {plans.map((p) => (
                      <option key={p.id || p.uuid} value={String(p.id)}>
                        {p.name} (${p.monthlyPrice}/mo - {p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Subscription Status
                  </label>
                  <select
                    name="status"
                    defaultValue={orgData.subscriptionStatus || orgData.status || "active"}
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white capitalize"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            form="edit-org-form"
            className="px-6 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: brandColor }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
