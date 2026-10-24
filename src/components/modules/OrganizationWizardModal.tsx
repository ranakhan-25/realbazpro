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
} from "lucide-react";
import { toast } from "sonner";
import { getPlans, type Plan } from "@/services/planService";
import { getModuleTree, type ModuleTreeNode } from "@/services/moduleTreeService";
import {
  createOrganizationWizard,
  type CreateOrganizationWizardPayload,
  type Organization,
} from "@/services/organizationService";

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
  // Map of moduleId -> Set of featureIds
  const [selectedFeatures, setSelectedFeatures] = useState<{ [moduleId: number]: number[] }>({});

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
      const initialMap: { [moduleId: number]: number[] } = {};
      for (const m of fetchedTree) {
        if (m.id) {
          initialMap[m.id] = (m.features || [])
            .map((f) => f.id)
            .filter((id): id is number => typeof id === "number");
        }
      }
      setSelectedFeatures(initialMap);
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
  const toggleModuleAll = (moduleId: number) => {
    const mod = moduleTree.find((m) => m.id === moduleId);
    if (!mod) return;
    const allFeatureIds = (mod.features || [])
      .map((f) => f.id)
      .filter((id): id is number => typeof id === "number");

    const currentSelected = selectedFeatures[moduleId] || [];
    if (currentSelected.length === allFeatureIds.length) {
      // Deselect all
      setSelectedFeatures((prev) => ({ ...prev, [moduleId]: [] }));
    } else {
      // Select all
      setSelectedFeatures((prev) => ({ ...prev, [moduleId]: allFeatureIds }));
    }
  };

  // Toggle Single Feature Checkbox
  const toggleFeature = (moduleId: number, featureId: number) => {
    setSelectedFeatures((prev) => {
      const current = prev[moduleId] || [];
      const exists = current.includes(featureId);
      const updated = exists ? current.filter((id) => id !== featureId) : [...current, featureId];
      return { ...prev, [moduleId]: updated };
    });
  };

  // Calculate Expiration Date
  const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

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
    return true;
  };

  const validateStep2 = () => {
    if (!adminName.trim()) {
      toast.error("Admin Full Name is required");
      return false;
    }
    if (!adminUsername.trim()) {
      toast.error("Admin Username is required");
      return false;
    }
    if (!adminEmail.trim()) {
      toast.error("Admin Email is required");
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
      .filter(([_, featureIds]) => featureIds.length > 0)
      .map(([moduleId, featureIds]) => ({
        moduleId: Number(moduleId),
        featureIds,
      }));

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
        planId: selectedPlanId ? Number(selectedPlanId) : undefined,
        durationDays,
        trialDays,
        maxUsers,
        maxProjects,
        maxStorageMb: maxStorageGb * 1024,
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
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to create organization");
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
                      onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Module & Feature Access Entitlements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Check the modules and nested features this organization and its users are permitted to access.
                  </p>
                </div>
              </div>

              {moduleTree.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No modules found. Please create modules in the Module Tree Builder.
                </div>
              ) : (
                <div className="space-y-4">
                  {moduleTree.map((mod) => {
                    const modId = mod.id || 0;
                    const featureList = mod.features || [];
                    const selectedList = selectedFeatures[modId] || [];
                    const isAllSelected =
                      featureList.length > 0 && selectedList.length === featureList.length;

                    return (
                      <div
                        key={modId}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs"
                      >
                        {/* Module Header Row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`mod-${modId}`}
                              checked={isAllSelected}
                              onChange={() => toggleModuleAll(modId)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                              htmlFor={`mod-${modId}`}
                              className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer flex items-center gap-1.5"
                            >
                              <Layers className="h-3.5 w-3.5 text-indigo-600" />
                              {mod.name}
                              <span className="font-mono text-[10px] text-slate-400">
                                ({mod.code})
                              </span>
                            </label>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-500">
                            {selectedList.length} of {featureList.length} features enabled
                          </span>
                        </div>

                        {/* Nested Features Checkbox Grid */}
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {featureList.map((feat) => {
                            const featId = feat.id || 0;
                            const isChecked = selectedList.includes(featId);

                            return (
                              <label
                                key={featId}
                                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                  isChecked
                                    ? "border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20"
                                    : "border-slate-100 dark:border-slate-800/80 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleFeature(modId, featId)}
                                  className="w-3.5 h-3.5 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {feat.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400 truncate">
                                    {feat.code}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
