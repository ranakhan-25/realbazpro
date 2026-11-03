"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Mail,
  Phone,
  Lock,
  Building,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  createUser,
  getUserFormDropdowns,
  type CreateUserPayload,
  type User as UserModel,
  type FeatureOverrideItem,
} from "@/services/userService";
import { getOrganizations, type Organization } from "@/services/organizationService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import {
  getModuleTree,
  type ModuleTreeNode,
} from "@/services/moduleTreeService";
import ModuleFeatureAccessTreeSelector, {
  type FeaturePermissionState,
} from "./ModuleFeatureAccessTreeSelector";

interface UserWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdUser: UserModel) => void;
}

interface RoleOption {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  roleLevel?: number;
}

export default function UserWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: UserWizardModalProps) {
  const { primaryColor } = useTheme();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // STEP 1: Identity & Credentials
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // STEP 2: Role Level
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loadingRoles, setLoadingRoles] = useState(false);

  // STEP 3: Workplace & Designation
  const [designation, setDesignation] = useState("Operations Staff");
  const [isActive, setIsActive] = useState(true);

  // Organization Assignment (for Super Admin)
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // STEP 4: Module & Feature Access
  const [modules, setModules] = useState<ModuleTreeNode[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<(number | string)[]>([]);
  const [featurePermissions, setFeaturePermissions] = useState<
    Record<string | number, FeaturePermissionState>
  >({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const profile = typeof window !== "undefined" ? getStoredUserProfile() : null;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMessage("");
      loadRoles();
      loadModules();
      if (profile?.isSuperUser) {
        loadOrganizations();
      }
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      setLoadingModules(true);
      const tree = await getModuleTree();
      setModules(tree || []);
    } catch (err: any) {
      console.warn("Could not load module tree for wizard:", err);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const orgList = await getOrganizations();
      setOrganizations(orgList);
      if (orgList.length > 0 && !selectedOrgId) {
        setSelectedOrgId(String(orgList[0].id));
      }
    } catch (err: any) {
      console.warn("Could not load organizations for wizard:", err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const dropdowns = await getUserFormDropdowns();
      const rawRoles = (dropdowns.roles || []) as RoleOption[];

      // Filter: If user is Org Admin, exclude Super Admin (Level 1)
      const filtered = rawRoles.filter((r) => {
        if (!profile?.isSuperUser) {
          if (r.roleLevel === 1 || r.slug === "super-admin" || r.name.toLowerCase().includes("super admin")) {
            return false;
          }
        }
        return true;
      });

      setAvailableRoles(filtered);
      if (filtered.length > 0 && !selectedRoleId) {
        setSelectedRoleId(String(filtered[0].id));
      }
    } catch (err: any) {
      console.warn("Could not load roles for wizard:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Password validation checks
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password.length > 0 && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const isStep1Valid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.includes("@") &&
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.special &&
    passwordChecks.match;

  const isStep2Valid = Boolean(selectedRoleId);

  const selectedRole = availableRoles.find((r) => String(r.id) === String(selectedRoleId));

  const handleNext = () => {
    setErrorMessage("");
    if (currentStep === 1) {
      if (!isStep1Valid) {
        setErrorMessage("Please complete all required fields and satisfy password security requirements.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isStep2Valid) {
        setErrorMessage("Please select a role for this user.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const finalUsername =
        username.trim() ||
        `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`.replace(/[^a-z0-9.]/g, "") ||
        email.trim().toLowerCase().split("@")[0] ||
        "user";

      const finalOrgId = profile?.isSuperUser
        ? (selectedOrgId ? Number(selectedOrgId) : undefined)
        : (profile?.orgId ? Number(profile.orgId) : undefined);

      const overrides: FeatureOverrideItem[] = Object.entries(featurePermissions).map(
        ([featureId, state]) => ({
          featureId: Number(featureId),
          isGranted: state.isGranted,
          canView: state.canView,
          canCreate: state.canCreate,
          canEdit: state.canEdit,
          canDelete: state.canDelete,
          canApprove: state.canApprove,
        }),
      );

      const numModuleIds = selectedModuleIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      const payload: CreateUserPayload = {
        name: `${firstName} ${lastName}`.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: finalUsername,
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim() : undefined,
        password,
        roleIds: [Number(selectedRoleId)],
        moduleIds: numModuleIds,
        featureOverrides: overrides,
        isActive,
        userType: "Office",
        orgId: finalOrgId,
      };

      const created = await createUser(payload);
      toast.success("User created successfully!");
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create user. Please review the inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Creation Wizard</h2>
              <p className="text-xs text-slate-500">
                Create and provision a new team member with level-aware authorization and module entitlements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Identity" },
              { num: 2, label: "Role & Level" },
              { num: 3, label: "Workplace" },
              { num: 4, label: "Module Access" },
              { num: 5, label: "Review" },
            ].map((step, idx) => {
              const active = currentStep === step.num;
              const completed = currentStep > step.num;
              return (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                      completed
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      active ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < 4 ? <ChevronRight className="h-4 w-4 text-slate-300 hidden sm:inline ml-1" /> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        ) : null}

        {/* MODAL BODY */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* STEP 1: CREDENTIALS */}
          {currentStep === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (!username && e.target.value) {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                      }
                    }}
                    placeholder="e.g. Tariq"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Rahman"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. trahman"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700 000000"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-9 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Password checks badge grid */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className={passwordChecks.length ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.length ? "✓" : "○"} 8+ Characters
                  </span>
                  <span className={passwordChecks.upper ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.upper ? "✓" : "○"} Uppercase Letter
                  </span>
                  <span className={passwordChecks.lower ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.lower ? "✓" : "○"} Lowercase Letter
                  </span>
                  <span className={passwordChecks.number ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.number ? "✓" : "○"} Number (0-9)
                  </span>
                  <span className={passwordChecks.special ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.special ? "✓" : "○"} Special Character (!@#$)
                  </span>
                  <span className={passwordChecks.match ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {passwordChecks.match ? "✓" : "○"} Passwords Match
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* STEP 2: ROLE LEVEL & ACCESS TIER */}
          {currentStep === 2 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Role & Authority Level</h3>
                  <p className="text-xs text-slate-500">
                    Roles determine security boundaries and module access. Authority is restricted to your tier and below.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Level 2 - 5 Allowed
                </span>
              </div>

              {loadingRoles ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading accessible roles…</div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {availableRoles.map((role) => {
                    const isSelected = String(role.id) === String(selectedRoleId);
                    const level = role.roleLevel || 4;
                    const levelBadge =
                      level === 2
                        ? { text: "Level 2 • Organization Admin", color: "bg-blue-100 text-blue-700" }
                        : level === 3
                          ? { text: "Level 3 • Department Manager", color: "bg-emerald-100 text-emerald-700" }
                          : level === 4
                            ? { text: "Level 4 • Office Staff", color: "bg-slate-100 text-slate-700" }
                            : { text: "Level 5 • Viewer / Guest", color: "bg-amber-100 text-amber-700" };

                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(String(role.id))}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/40 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{role.name}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${levelBadge.color}`}>
                                {levelBadge.text}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {role.description || "Standard organization user with delegated module permissions."}
                            </p>
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* STEP 3: WORKPLACE & DESIGNATION */}
          {currentStep === 3 ? (
            <div className="space-y-4">
              {profile?.isSuperUser ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Organization <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      disabled={loadingOrgs}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">Select Tenant Organization...</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    As Super Admin, assign this user directly to a tenant organization to isolate their workspace and team.
                  </p>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Project Architect"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Account Active Status</h4>
                    <p className="text-xs text-slate-500">
                      Active users can authenticate and access authorized workspaces immediately.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* STEP 4: MODULE & FEATURE ACCESS ENTITLEMENTS */}
          {currentStep === 4 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Module & Feature Access Entitlements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant workspace access and configure granular Read, Write, and Execution privileges for this user.
                  </p>
                </div>
              </div>

              {loadingModules ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                  Loading module tree...
                </div>
              ) : (
                <ModuleFeatureAccessTreeSelector
                  modules={modules}
                  selectedModuleIds={selectedModuleIds}
                  featurePermissions={featurePermissions}
                  onChange={(updatedMods, updatedPerms) => {
                    setSelectedModuleIds(updatedMods);
                    setFeaturePermissions(updatedPerms);
                  }}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          ) : null}

          {/* STEP 5: REVIEW & CONFIRM */}
          {currentStep === 5 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {firstName} {lastName}
                    </h3>
                    <p className="text-xs text-slate-500">{email}</p>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${
                      isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isActive ? "Active User" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Username</span>
                    <p className="font-bold text-slate-800 mt-0.5">{username || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Phone</span>
                    <p className="font-bold text-slate-800 mt-0.5">{phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Designation</span>
                    <p className="font-bold text-slate-800 mt-0.5">{designation || "Staff"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Assigned Role</span>
                    <p className="font-bold text-blue-700 mt-0.5">{selectedRole?.name || "Standard Role"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Organization</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {profile?.isSuperUser
                        ? organizations.find((o) => String(o.id) === String(selectedOrgId))?.name || "Selected Organization"
                        : profile?.orgName || `Org #${profile?.orgId || "Current"}`}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">
                      Module & Feature Entitlements
                    </span>
                    <p className="font-bold text-indigo-700 mt-0.5">
                      {selectedModuleIds.length} modules selected &bull;{" "}
                      {Object.values(featurePermissions).filter((p) => p.isGranted).length} features granted
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  This user will be provisioned under{" "}
                  <strong>
                    {profile?.isSuperUser
                      ? organizations.find((o) => String(o.id) === String(selectedOrgId))?.name || "the chosen Organization"
                      : profile?.orgName || `Organization ID ${profile?.orgId}`}
                  </strong>{" "}
                  with selected module permissions and isolated tenant boundaries.
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Account…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Confirm & Create User
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
