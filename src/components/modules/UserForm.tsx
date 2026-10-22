"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  createUser,
  getUserFormDropdowns,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
} from "@/services/userService";

interface UserFormProps {
  user?: User | null;
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
}

interface FormValues {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  roleId: string;
  isActive: boolean;
}

interface DropdownItem {
  id: number | string;
  name: string;
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
  roleId: "",
  isActive: true,
};

const demoRoles: DropdownItem[] = [
  { id: 1, name: "Super Admin" },
  { id: 2, name: "Admin" },
  { id: 3, name: "Manager" },
  { id: 4, name: "Employee" },
];

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { theme, primaryColor } = useTheme();
  const isDark = theme === "dark";
  const isEdit = Boolean(user);

  const [form, setForm] = useState<FormValues>(initialValues);
  const [roles, setRoles] = useState<DropdownItem[]>(demoRoles);
  const [loading, setLoading] = useState(false);

  const [roleSearch, setRoleSearch] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  const selectedRole = roles.find((role) => String(role.id) === form.roleId);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
        setRoleSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!user) {
      setForm(initialValues);
      return;
    }

    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      username: user.username ?? "",
      password: "",
      confirmPassword: "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      roleId:
        Array.isArray(user.roleIds) && user.roleIds.length > 0
          ? String(user.roleIds[0])
          : "",
      isActive: user.isActive ?? true,
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      try {
        const data = await getUserFormDropdowns();

        if (mounted && Array.isArray(data.roles) && data.roles.length > 0) {
          setRoles(data.roles);
        }
      } catch {
        // Demo roles remain available until the API is ready.
      }
    }

    loadRoles();

    return () => {
      mounted = false;
    };
  }, []);

  const passwordChecks = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(form.password) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(form.password) },
    { label: "One number (0-9)", valid: /\d/.test(form.password) },
  ];

  const passwordStrong = passwordChecks.every((check) => check.valid);
  const passwordMatches =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const formValid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.username.trim().length > 0 &&
    form.email.trim().length > 0 &&
    Boolean(form.roleId) &&
    (isEdit && !form.password
      ? !form.confirmPassword
      : passwordStrong && passwordMatches);

  const inputClass = [
    "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition",
    "focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
    isDark
      ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",
  ].join(" ");

  const labelClass = `mb-1.5 block text-sm font-medium ${
    isDark ? "text-slate-200" : "text-slate-700"
  }`;

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.roleId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isEdit && !form.password) {
      toast.error("Password is required");
      return;
    }

    if (form.password && !passwordStrong) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const basePayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        isActive: form.isActive,
        roleIds: [Number(form.roleId)],
        userType: "system" as const,
      };

      let saved: User;

      if (user) {
        const payload = {
          ...basePayload,
          ...(form.password ? { password: form.password } : {}),
        } satisfies UpdateUserPayload;

        saved = await updateUser(String(user.uuid ?? user.id), payload);

        toast.success("User updated successfully");
      } else {
        const payload = {
          ...basePayload,
          password: form.password,
        } satisfies CreateUserPayload;

        saved = await createUser(payload);
        toast.success("User created successfully");
      }

      onSuccess?.(saved);

      if (!isEdit) {
        setForm(initialValues);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save user",
      );
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="username" className={labelClass}>
            Username <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            autoComplete="username"
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="firstName" className={labelClass}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
            autoComplete="given-name"
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
            autoComplete="family-name"
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            autoComplete="tel"
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            autoComplete="email"
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div ref={roleDropdownRef} className="relative">
          <label className={labelClass}>
            Role <span className="text-red-500">*</span>
          </label>

          <button
            type="button"
            onClick={() => setRoleDropdownOpen((open) => !open)}
            disabled={loading}
            className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm outline-none transition-all focus:ring-2 disabled:opacity-60 ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"
                : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
            style={
              roleDropdownOpen
                ? {
                    borderColor: primaryColor,
                    boxShadow: `0 0 0 3px ${primaryColor}20`,
                  }
                : undefined
            }
            aria-haspopup="listbox"
            aria-expanded={roleDropdownOpen}
          >
            <span className={selectedRole ? "" : mutedClass}>
              {selectedRole?.name ?? "Select a role"}
            </span>

            <ChevronDown
              size={17}
              className={`shrink-0 transition-transform ${
                roleDropdownOpen ? "rotate-180" : ""
              } ${mutedClass}`}
            />
          </button>

          {roleDropdownOpen && (
            <div
              className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-xl ${
                isDark
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
              style={{
                boxShadow: isDark
                  ? "0 12px 32px rgba(0,0,0,0.35)"
                  : "0 12px 32px rgba(15,23,42,0.12)",
              }}
            >
              <div
                className={`border-b p-2.5 ${
                  isDark ? "border-slate-800" : "border-slate-100"
                }`}
              >
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 ${
                    isDark
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-slate-50"
                  }`}
                  style={{ outlineColor: primaryColor }}
                >
                  <Search size={16} className={mutedClass} />

                  <input
                    autoFocus
                    type="text"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Search roles..."
                    className={`w-full bg-transparent py-2 text-sm outline-none ${
                      isDark
                        ? "text-slate-100 placeholder:text-slate-500"
                        : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />

                  {roleSearch && (
                    <button
                      type="button"
                      onClick={() => setRoleSearch("")}
                      className={`text-xs ${mutedClass}`}
                      aria-label="Clear search"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto p-1.5" role="listbox">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => {
                    const isSelected = String(role.id) === form.roleId;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setForm((previous) => ({
                            ...previous,
                            roleId: String(role.id),
                          }));
                          setRoleDropdownOpen(false);
                          setRoleSearch("");
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          isDark
                            ? "text-slate-200 hover:bg-slate-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                        style={
                          isSelected
                            ? {
                                color: primaryColor,
                                backgroundColor: `${primaryColor}12`,
                              }
                            : undefined
                        }
                      >
                        <span className="font-medium">{role.name}</span>

                        {isSelected && (
                          <Check size={16} style={{ color: primaryColor }} />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className={`px-3 py-6 text-center text-sm ${mutedClass}`}>
                    No roles found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={
              isEdit ? "Leave blank to keep current" : "Enter password"
            }
            autoComplete="new-password"
            required={!isEdit}
            disabled={loading}
            className={`${inputClass} ${
              form.password
                ? passwordStrong
                  ? "border-emerald-500"
                  : "border-amber-500"
                : ""
            }`}
          />

          {form.password && (
            <div className={`mt-2 space-y-1 text-xs ${mutedClass}`}>
              {passwordChecks.map((check) => (
                <p
                  key={check.label}
                  className={check.valid ? "text-emerald-500" : ""}
                >
                  {check.valid ? "✓" : "○"} {check.label}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm Password{" "}
            {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required={!isEdit || Boolean(form.password)}
            disabled={loading}
            className={`${inputClass} ${
              form.confirmPassword
                ? passwordMatches
                  ? "border-emerald-500"
                  : "border-red-500"
                : ""
            }`}
          />

          {form.confirmPassword && (
            <p
              className={`mt-1.5 text-xs ${
                passwordMatches ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {passwordMatches ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </div>
      </div>

      <label
        htmlFor="isActive"
        className={`flex w-fit cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 transition ${
          isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={handleChange}
          disabled={loading}
          className="peer sr-only"
        />

        <span
          className="relative h-5 w-5 rounded-md border-2 transition-colors peer-focus-visible:ring-4"
          style={{
            borderColor: form.isActive
              ? primaryColor
              : isDark
                ? "#64748b"
                : "#cbd5e1",
            backgroundColor: form.isActive ? primaryColor : "transparent",
            boxShadow: form.isActive ? `0 0 0 3px ${primaryColor}20` : "none",
          }}
        >
          {form.isActive && (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              className="absolute inset-0 h-full w-full p-0.5"
            >
              <path d="m4 10 4 4 8-8" />
            </svg>
          )}
        </span>

        <span
          className={`text-sm font-medium ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          Is Active
        </span>
      </label>

      <div
        className={`flex justify-end gap-3 border-t pt-4 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
              isDark
                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading || !formValid}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed enabled:hover:brightness-95"
          style={{
            backgroundColor: primaryColor,
            opacity: formValid && !loading ? 1 : 0.4,
            boxShadow:
              formValid && !loading ? `0 4px 14px ${primaryColor}35` : "none",
          }}
        >
          {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}
