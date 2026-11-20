"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  Layers,
  Calendar,
  Lock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getPlans, type Plan } from "@/services/planService";
import { getModuleTree, type ModuleTreeNode } from "@/services/moduleTreeService";
import {
  createOrganizationWizard,
  type CreateOrganizationWizardPayload,
  type Organization,
} from "@/services/organizationService";
import ModuleFeatureAccessTreeSelector, {
  type FeaturePermissionState,
} from "./ModuleFeatureAccessTreeSelector";

interface OrganizationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdOrg: Organization) => void;
}

export default function OrganizationWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: OrganizationWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [conflictError, setConflictError] = useState<{ step: 1 | 2; message: string } | null>(null);

  // Available Data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Organization State
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | string>("");
  const [durationDays, setDurationDays] = useState(30);
  const [trialDays, setTrialDays] = useState(14);
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxProjects, setMaxProjects] = useState(5);
  const [maxStorageGb, setMaxStorageGb] = useState(20);

  // STEP 2: Org Admin User State
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [adminDesignation, setAdminDesignation] = useState("Managing Director");

  // STEP 3: Module & Feature Selection State
  // Map of moduleId -> Array of featureIds
  const [selectedFeatures, setSelectedFeatures] = useState<{ [moduleId: string]: (number | string)[] }>({});
  const [selectedModuleIds, setSelectedModuleIds] = useState<(number | string)[]>([]);
  const [featurePermissions, setFeaturePermissions] = useState<
    Record<string | number, FeaturePermissionState>
  >({});

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [fetchedPlans, fetchedTree] = await Promise.all([
        getPlans(),
        getModuleTree(),
      ]);
      setPlans(fetchedPlans);
      setModuleTree(fetchedTree);

      if (fetchedPlans.length > 0) {
        const first = fetchedPlans[0];
        setSelectedPlanId(first.id);
        setDurationDays(first.durationDays || 30);
        setTrialDays(first.trialDays || 14);
        setMaxUsers(first.maxUsers || 10);
        setMaxProjects(first.maxProjects || 5);
        setMaxStorageGb(Math.round((first.maxStorageMb || 20480) / 1024));
      }

      // Default select all available modules and features
      const initialMap: { [moduleId: string]: (number | string)[] } = {};
      const initialMods: (number | string)[] = [];
      const perms: Record<string | number, FeaturePermissionState> = {};

      for (const m of fetchedTree) {
        const modKey = String(m.id ?? m.uuid ?? "");
        if (modKey) {
          initialMods.push(m.id ?? m.uuid ?? "");
          const featIds = (m.features || [])
            .map((f) => (f.id !== undefined && f.id !== null ? f.id : f.uuid))
            .filter((id): id is number | string => id !== undefined && id !== null && id !== "");
          initialMap[modKey] = featIds;

          featIds.forEach((fid) => {
            perms[String(fid)] = {
              isGranted: true,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: false,
            };
          });
        }
      }
      setSelectedFeatures(initialMap);
      setSelectedModuleIds(initialMods);
      setFeaturePermissions(perms);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load plans or module tree from backend");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handlePlanChange = (planIdStr: string) => {
    setSelectedPlanId(planIdStr);
    const plan = plans.find((p) => String(p.id) === planIdStr || String(p.uuid) === planIdStr);
    if (plan) {
      setDurationDays(plan.durationDays || 30);
      setTrialDays(plan.trialDays || 14);
      setMaxUsers(plan.maxUsers || 10);
      setMaxProjects(plan.maxProjects || 5);
      setMaxStorageGb(Math.round((plan.maxStorageMb || 20480) / 1024));
    }
  };

  // Toggle Module Selection (All or None of its features)
  const toggleModuleAll = (targetModId: number | string) => {
    const mod = moduleTree.find(
      (m) =>
        String(m.id) === String(targetModId) ||
        (m.uuid && String(m.uuid) === String(targetModId)),
    );
    if (!mod) return;

    const allFeatureIds = (mod.features || [])
      .map((f) => (f.id !== undefined && f.id !== null ? f.id : f.uuid))
      .filter((id): id is number | string => id !== undefined && id !== null && id !== "");

    const key = String(targetModId);
    const currentSelected = selectedFeatures[key] || [];
    const isAllSelected =
      allFeatureIds.length > 0 &&
      allFeatureIds.every((id) =>
        currentSelected.some((cur) => String(cur) === String(id)),
      );

    if (isAllSelected) {
      // Deselect all
      setSelectedFeatures((prev) => ({ ...prev, [key]: [] }));
    } else {
      // Select all
      setSelectedFeatures((prev) => ({ ...prev, [key]: allFeatureIds }));
    }
  };

  // Toggle Single Feature Checkbox
  const toggleFeature = (targetModId: number | string, targetFeatId: number | string) => {
    const key = String(targetModId);
    setSelectedFeatures((prev) => {
      const current = prev[key] || [];
      const exists = current.some((id) => String(id) === String(targetFeatId));
      const updated = exists
        ? current.filter((id) => String(id) !== String(targetFeatId))
        : [...current, targetFeatId];
      return { ...prev, [key]: updated };
    });
  };

  // Calculate Expiration Date
  const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Wizard Step Validations
  const validateStep1 = () => {
    if (!orgName.trim()) {
      toast.error("Organization Name is required");
      return false;
    }
    if (!orgCode.trim()) {
      toast.error("Organization Code is required");
      return false;
    }
    if (orgEmail.trim() && !EMAIL_REGEX.test(orgEmail.trim())) {
      toast.error("Please enter a valid Corporate Email or leave it blank");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminName.trim()) {
      toast.error("Admin Full Name is required");
      return false;
    }
    if (!adminUsername.trim() || adminUsername.trim().length < 3) {
      toast.error("Admin Username must be at least 3 characters");
      return false;
    }
    if (!adminEmail.trim()) {
      toast.error("Admin Email is required");
      return false;
    }
    if (!EMAIL_REGEX.test(adminEmail.trim())) {
      toast.error("Please enter a valid Admin Email address");
      return false;
    }
    if (!adminPassword || adminPassword.length < 6) {
      toast.error("Admin Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleFinalSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    // Build entitlement payload
    const moduleFeatureAccess = Object.entries(selectedFeatures)
      .filter(([moduleId, featureIds]) => moduleId && featureIds && featureIds.length > 0)
      .map(([moduleId, featureIds]) => ({
        moduleId: isNaN(Number(moduleId)) ? moduleId : Number(moduleId),
        featureIds: featureIds
          .map((id) => (typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id))
          .filter((id) => id !== undefined && id !== null && id !== ""),
      }))
      .filter((item) => item.featureIds.length > 0);

    if (moduleFeatureAccess.length === 0) {
      toast.error("Please grant access to at least 1 module and feature");
      return;
    }

    const payload: CreateOrganizationWizardPayload = {
      organization: {
        name: orgName.trim(),
        code: orgCode.trim().toUpperCase().replace(/\s+/g, "_"),
        email: orgEmail.trim() || undefined,
        phone: orgPhone.trim() || undefined,
        address: orgAddress.trim() || undefined,
        planId: selectedPlanId ? (isNaN(Number(selectedPlanId)) ? String(selectedPlanId) : Number(selectedPlanId)) : undefined,
        durationDays: Math.round(Number(durationDays)) || 30,
        trialDays: Math.round(Number(trialDays)) || 0,
        maxUsers: Math.round(Number(maxUsers)) || 5,
        maxProjects: Math.round(Number(maxProjects)) || 5,
        maxStorageMb: Math.round(Number(maxStorageGb) * 1024) || 20480,
      },
      adminUser: {
        name: adminName.trim(),
        username: adminUsername.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        mobile: adminMobile.trim() || undefined,
        designationName: adminDesignation.trim() || undefined,
      },
      moduleFeatureAccess,
    };

    setIsSubmitting(true);
    try {
      const created = await createOrganizationWizard(payload);
      toast.success(
        `Organization "${created.name}" and Admin account "${created.adminUser?.username}" created successfully!`,
      );
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      const resData = err.response?.data;
      let errorMsg = "Failed to create organization";

      if (resData) {
        if (Array.isArray(resData.errors) && resData.errors.length > 0) {
          const detailMsgs: string[] = [];
          const extractErrors = (items: any[]) => {
            for (const item of items) {
              if (Array.isArray(item.errors)) {
                detailMsgs.push(...item.errors);
              }
              if (Array.isArray(item.children)) {
                extractErrors(item.children);
              }
            }
          };
          extractErrors(resData.errors);
          if (detailMsgs.length > 0) {
            errorMsg = detailMsgs.join(", ");
          }
        } else if (Array.isArray(resData.message)) {
          errorMsg = resData.message.join(", ");
        } else if (typeof resData.message === "string") {
          errorMsg = resData.message;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      if (err.response?.status === 409) {
        console.warn("Organization onboarding conflict (409):", errorMsg);
        const lowerMsg = errorMsg.toLowerCase();
        if (lowerMsg.includes("organization code") || lowerMsg.includes("code")) {
          setConflictError({ step: 1, message: errorMsg });
          setCurrentStep(1);
        } else {
          setConflictError({ step: 2, message: errorMsg });
          setCurrentStep(2);
        }
      } else {
        console.error("Failed to create organization:", err);
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header & Steps Indicator */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Super Admin: Onboard New Organization
              </h2>
              <p className="text-xs text-slate-500">
                Single unified wizard creating Organization, Tenant Admin, and Module Permissions simultaneously.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 p-2 rounded-xl transition ${
                currentStep === 1
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                  currentStep === 1 ? "bg-white text-indigo-600" : "bg-slate-200 text-slate-700"
                }`}
              >
                1
              </div>
              <span>Organization & Plan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl transition ${
                currentStep === 2
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                  currentStep === 2 ? "bg-white text-indigo-600" : "bg-slate-200 text-slate-700"
                }`}
              >
                2
              </div>
              <span>Org Admin User</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl transition ${
                currentStep === 3
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                  currentStep === 3 ? "bg-white text-indigo-600" : "bg-slate-200 text-slate-700"
                }`}
              >
                3
              </div>
              <span>Module Tree Access</span>
            </button>
          </div>
        </div>

        {/* Step Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: ORGANIZATION & SUBSCRIPTION PLAN */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {conflictError && conflictError.step === 1 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-950 dark:text-amber-100">Organization Conflict</p>
                    <p>{conflictError.message}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Organization Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Properties Ltd."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization Code / ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ORG_ACME"
                      value={orgCode}
                      onChange={(e) => {
                        setOrgCode(e.target.value.toUpperCase());
                        if (conflictError?.step === 1) setConflictError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        conflictError?.step === 1
                          ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20"
                          : "border-slate-200 dark:border-slate-700"
                      } bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      placeholder="contact@acme.com"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+8801700000000"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="Plot 14, Road 7, Banani, Dhaka"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan Picker */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Subscription Plan Package & Quota
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handlePlanChange(String(p.id))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        String(selectedPlanId) === String(p.id)
                          ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          {String(selectedPlanId) === String(p.id) && (
                            <Check className="h-4 w-4 text-indigo-600" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          ${p.monthlyPrice} / month
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2">
                          {p.maxUsers} Users · {p.maxProjects} Projects · {Math.round(p.maxStorageMb / 1024)} GB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Duration & Quota Tuning */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Package Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value) || 30)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Trial Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Max Users
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxUsers}
                      onChange={(e) => setMaxUsers(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Storage (GB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxStorageGb}
                      onChange={(e) => setMaxStorageGb(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      Calculated Tenant Expiration:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {expirationDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ORG ADMIN CREDENTIALS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {conflictError && conflictError.step === 2 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-950 dark:text-amber-100">Admin Account Conflict</p>
                    <p>{conflictError.message}</p>
                  </div>
                </div>
              )}

              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Organization Administrator Credentials
              </h3>
              <p className="text-xs text-slate-500">
                This account will be created as the root Org Admin for{" "}
                <strong className="text-slate-900 dark:text-white">{orgName || "this organization"}</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sabbir Hossain"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sabbir_admin"
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      if (conflictError?.step === 2) setConflictError(null);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      conflictError?.step === 2
                        ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20"
                        : "border-slate-200 dark:border-slate-700"
                    } bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@acme.com"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (conflictError?.step === 2) setConflictError(null);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      conflictError?.step === 2
                        ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20"
                        : "border-slate-200 dark:border-slate-700"
                    } bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="+8801712345678"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director / CEO"
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TREE MODULE & FEATURE SELECTION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Module & Feature Access Entitlements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search and configure the modules, nested features, and granular Read/Write operations permitted for this organization.
                  </p>
                </div>
              </div>

              {moduleTree.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No modules found. Please create modules in the Module Tree Builder.
                </div>
              ) : (
                <ModuleFeatureAccessTreeSelector
                  modules={moduleTree}
                  selectedModuleIds={selectedModuleIds}
                  featurePermissions={featurePermissions}
                  onChange={(updatedMods, updatedPerms) => {
                    setSelectedModuleIds(updatedMods);
                    setFeaturePermissions(updatedPerms);

                    // Sync to selectedFeatures for organization onboarding payload
                    const newSelectedFeatures: Record<string, (string | number)[]> = {};
                    moduleTree.forEach((m) => {
                      const modKey = String(m.id ?? m.uuid ?? "");
                      const grantedIds = (m.features || [])
                        .filter((f) => {
                          const fid = f.id ?? f.uuid ?? f.code;
                          return Boolean(updatedPerms[String(fid)]?.isGranted);
                        })
                        .map((f) => f.id ?? f.uuid ?? f.code)
                        .filter(Boolean) as (string | number)[];
                      if (grantedIds.length > 0) {
                        newSelectedFeatures[modKey] = grantedIds;
                      }
                    });
                    setSelectedFeatures(newSelectedFeatures);
                  }}
                  primaryColor="#0000F2"
                />
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                Continue to Step {currentStep + 1}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
              >
                {isSubmitting ? "Creating Everything…" : "Complete Organization Onboarding"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
