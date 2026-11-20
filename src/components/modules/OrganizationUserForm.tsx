"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createOrganizationUser,
  getOrganizationUserFormDropdowns,
  updateOrganizationUser,
  type CreateOrganizationUserPayload,
  type DropdownOption,
  type OrganizationUser,
  type UpdateOrganizationUserPayload,
  type OrganizationUserFormDropdowns,
} from "@/services/organizationUserService";

import { useTheme } from "@/lib/theme";

const organizationUserSchema = z
  .object({
    firstName: z.string().min(1, "Name is required"),
    lastName: z.string().optional(),
    username: z.string().min(2, "Username must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().optional(),

    password: z.string().optional(),
    confirmPassword: z.string().optional(),

    employeeId: z.string().optional(),
    designationId: z.string().optional(),
    distributionId: z.string().optional(),
    warehouseId: z.string().optional(),
    factoryId: z.string().optional(),
    receivingPointId: z.string().optional(),
    unitId: z.string().optional(),

    organizationName: z.string().optional(),
    organizationId: z.string().optional(),

    roleIds: z.array(z.string()),
    moduleIds: z.array(z.string()),
    companyIds: z.array(z.string()),

    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 6 characters.",
      });
    }

    if (data.password !== data.confirmPassword) {
      if (data.password || data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords do not match.",
        });
      }
    }
  });

type FormValues = z.infer<typeof organizationUserSchema>;

interface OrganizationUserFormProps {
  user: OrganizationUser | null;
  onSuccess: (user: OrganizationUser) => void;
  onCancel: () => void;
}

const DEMO_OPTIONS = {
  employees: [
    { id: "101", name: "Rahim Uddin · EMP-101" },
    { id: "102", name: "Karim Ahmed · EMP-102" },
    { id: "103", name: "Sakib Hasan · EMP-103" },
    { id: "104", name: "Nusrat Jahan · EMP-104" },
  ],
  designations: [
    { id: "1", name: "System Administrator" },
    { id: "2", name: "HR Manager" },
    { id: "3", name: "Accounts Officer" },
    { id: "4", name: "Operations Manager" },
  ],
  distributions: [
    { id: "1", name: "Central Distribution" },
    { id: "2", name: "North Distribution" },
    { id: "3", name: "South Distribution" },
  ],
  warehouses: [
    { id: "1", name: "Main Warehouse" },
    { id: "2", name: "Raw Materials Warehouse" },
    { id: "3", name: "Finished Goods Warehouse" },
  ],
  factories: [
    { id: "1", name: "Main Factory" },
    { id: "2", name: "Factory - North" },
    { id: "3", name: "Factory - South" },
  ],
  receivingPoints: [
    { id: "1", name: "Main Receiving Point" },
    { id: "2", name: "Raw Materials Receiving" },
    { id: "3", name: "Finished Goods Receiving" },
  ],
  units: [
    { id: "1", name: "Head Office" },
    { id: "2", name: "Production Unit" },
    { id: "3", name: "Quality Control Unit" },
  ],
  organizations: [
    { id: "1", name: "GarmenTek" },
    { id: "2", name: "Demo Garments Ltd." },
    { id: "3", name: "Textile Manufacturing Ltd." },
  ],
  roles: [
    { id: "1", name: "Organization Admin" },
    { id: "2", name: "HR Manager" },
    { id: "3", name: "Employee" },
  ],
  modules: [
    { id: "1", name: "HRM" },
    { id: "2", name: "Procurement" },
    { id: "3", name: "Inventory" },
    { id: "4", name: "Reports" },
  ],
  companies: [
    { id: "1", name: "GarmenTek Main Company" },
    { id: "2", name: "GarmenTek Factory Unit" },
  ],
} satisfies Record<string, DropdownOption[]>;

const EMPTY_DROPDOWNS: OrganizationUserFormDropdowns = {
  designations: [],
  categories: [],
  employees: [],
  modules: [],
  roles: [],
  companies: [],
  organizations: [],
};

function asString(value: number | string | undefined | null): string {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeOptions(options: DropdownOption[]): DropdownOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    const id = String(option.id);

    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

function useFormOptions() {
  const [dropdowns, setDropdowns] =
    useState<OrganizationUserFormDropdowns>(EMPTY_DROPDOWNS);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const result = await getOrganizationUserFormDropdowns();

        if (active) {
          setDropdowns(result);
        }
      } catch {
        if (active) {
          setDropdowns(EMPTY_DROPDOWNS);
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const options = useMemo(
    () => ({
      employees: normalizeOptions(
        dropdowns.employees.length
          ? dropdowns.employees
          : DEMO_OPTIONS.employees,
      ),
      designations: normalizeOptions(
        dropdowns.designations.length
          ? dropdowns.designations
          : DEMO_OPTIONS.designations,
      ),
      organizations: normalizeOptions(
        dropdowns.organizations.length
          ? dropdowns.organizations
          : DEMO_OPTIONS.organizations,
      ),
      roles: normalizeOptions(
        dropdowns.roles.length ? dropdowns.roles : DEMO_OPTIONS.roles,
      ),
      modules: normalizeOptions(
        dropdowns.modules.length ? dropdowns.modules : DEMO_OPTIONS.modules,
      ),
      companies: normalizeOptions(
        dropdowns.companies.length
          ? dropdowns.companies
          : DEMO_OPTIONS.companies,
      ),
      distributions: DEMO_OPTIONS.distributions,
      warehouses: DEMO_OPTIONS.warehouses,
      factories: DEMO_OPTIONS.factories,
      receivingPoints: DEMO_OPTIONS.receivingPoints,
      units: DEMO_OPTIONS.units,
    }),
    [dropdowns],
  );

  return { options, loadingOptions };
}

export default function OrganizationUserForm({
  user,
  onSuccess,
  onCancel,
}: OrganizationUserFormProps) {
  const { primaryColor } = useTheme();
  const { options, loadingOptions } = useFormOptions();

  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    user?.avatarUrl ?? null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEdit = Boolean(user);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(organizationUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      employeeId: "",
      designationId: "",
      distributionId: "",
      warehouseId: "",
      factoryId: "",
      receivingPointId: "",
      unitId: "",
      organizationName: "",
      organizationId: "",
      roleIds: [],
      moduleIds: [],
      companyIds: [],
      isActive: true,
    },
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      password: "",
      confirmPassword: "",
      employeeId: asString(user?.employeeId),
      designationId: asString(user?.designationId),
      distributionId: asString(user?.distributionId),
      warehouseId: asString(user?.warehouseId),
      factoryId: asString(user?.factoryId),
      receivingPointId: asString(user?.receivingPointId),
      unitId: asString(user?.unitId),
      organizationName: user?.organizationName ?? "",
      organizationId: asString(user?.organizationId),
      roleIds: (user?.roleIds ?? []).map(String),
      moduleIds: (user?.moduleIds ?? []).map(String),
      companyIds: (user?.companyIds ?? []).map(String),
      isActive: user?.isActive ?? true,
    });

    setLogoPreview(user?.avatarUrl ?? null);
  }, [user, reset]);

  const password = watch("password");
  const selectedOrganizationId = watch("organizationId");

  useEffect(() => {
    if (!selectedOrganizationId) return;

    const selected = options.organizations.find(
      (item) => String(item.id) === selectedOrganizationId,
    );

    if (selected) {
      setValue("organizationName", selected.name, {
        shouldDirty: true,
      });
    }
  }, [selectedOrganizationId, options.organizations, setValue]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    setLogoPreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });
  };

  const submit = async (values: FormValues) => {
    if (!isEdit && !values.password?.trim()) {
      toast.error("Password is required.");
      return;
    }

    try {
      setSaving(true);

      const passwordValue = values.password?.trim();

      const commonFields = {
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || "",
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,

        employeeId: values.employeeId ? Number(values.employeeId) : undefined,

        designationId: values.designationId
          ? Number(values.designationId)
          : undefined,

        distributionId: values.distributionId
          ? Number(values.distributionId)
          : undefined,

        warehouseId: values.warehouseId
          ? Number(values.warehouseId)
          : undefined,

        factoryId: values.factoryId ? Number(values.factoryId) : undefined,

        receivingPointId: values.receivingPointId
          ? Number(values.receivingPointId)
          : undefined,

        unitId: values.unitId ? Number(values.unitId) : undefined,

        organizationName: values.organizationName?.trim() || undefined,

        organizationId: values.organizationId
          ? Number(values.organizationId)
          : undefined,

        roleIds: values.roleIds.map(Number),
        moduleIds: values.moduleIds.map(Number),
        companyIds: values.companyIds.map(Number),

        isActive: values.isActive,
        userType: "organization" as const,
      };

      if (isEdit && user) {
        const payload: UpdateOrganizationUserPayload = {
          ...commonFields,
          ...(passwordValue
            ? {
                password: passwordValue,
                confirmPassword: values.confirmPassword?.trim(),
              }
            : {}),
        };

        const saved = await updateOrganizationUser(
          String(user.uuid ?? user.id),
          payload,
        );

        toast.success("Organization user updated successfully.");
        onSuccess(saved);
      } else {
        const payload: CreateOrganizationUserPayload = {
          ...commonFields,
          password: passwordValue ?? "",
          confirmPassword: values.confirmPassword?.trim() ?? "",
        };

        const saved = await createOrganizationUser(payload);

        toast.success("Organization user created successfully.");
        onSuccess(saved);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save organization user.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-7">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Close form"
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <section>
        <SectionTitle
          title="Basic Information"
          description="Personal and login information."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name" required error={errors.firstName?.message}>
            <input
              {...register("firstName")}
              placeholder="Enter first name"
              className={inputClass(Boolean(errors.firstName))}
            />
          </Field>

          <Field label="Last Name" error={errors.lastName?.message}>
            <input
              {...register("lastName")}
              placeholder="Enter last name"
              className={inputClass(Boolean(errors.lastName))}
            />
          </Field>

          <Field label="Username" required error={errors.username?.message}>
            <input
              {...register("username")}
              placeholder="Choose a username"
              autoComplete="username"
              className={inputClass(Boolean(errors.username))}
            />
          </Field>

          <Field label="Email Address" required error={errors.email?.message}>
            <input
              type="email"
              {...register("email")}
              placeholder="name@example.com"
              autoComplete="email"
              className={inputClass(Boolean(errors.email))}
            />
          </Field>

          <Field label="Phone Number" error={errors.phone?.message}>
            <input
              {...register("phone")}
              placeholder="+8801XXXXXXXXX"
              className={inputClass(Boolean(errors.phone))}
            />
          </Field>

          <Field label="Employee" error={errors.employeeId?.message}>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.employees}
                  onChange={field.onChange}
                  placeholder="Search employee..."
                  emptyText="No employees found"
                  primaryColor={primaryColor}
                  loading={loadingOptions}
                />
              )}
            />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Security"
          description={
            isEdit
              ? "Leave the password empty to keep the current password."
              : "Set a secure password for this account."
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Password"
            required={!isEdit}
            error={errors.password?.message}
          >
            <input
              type="password"
              {...register("password")}
              autoComplete={isEdit ? "new-password" : "new-password"}
              placeholder={
                isEdit ? "Leave empty to keep current" : "Enter password"
              }
              className={inputClass(Boolean(errors.password))}
            />
          </Field>

          <Field
            label="Confirm Password"
            required={Boolean(password)}
            error={errors.confirmPassword?.message}
          >
            <input
              type="password"
              {...register("confirmPassword")}
              autoComplete="new-password"
              placeholder="Re-enter password"
              className={inputClass(Boolean(errors.confirmPassword))}
            />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Organization Information"
          description="Select the organization and configure its access."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization" error={errors.organizationId?.message}>
            <Controller
              name="organizationId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.organizations}
                  onChange={field.onChange}
                  placeholder="Search organization..."
                  emptyText="No organizations found"
                  primaryColor={primaryColor}
                  loading={loadingOptions}
                />
              )}
            />
          </Field>

          <Field
            label="Organization Name"
            error={errors.organizationName?.message}
          >
            <input
              {...register("organizationName")}
              placeholder="Select an organization above or enter a name"
              className={inputClass(Boolean(errors.organizationName))}
            />
          </Field>

          <Field label="Organization Logo">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
            >
              <Upload className="h-4 w-4" />
              {logoPreview ? "Change Logo" : "Upload Logo"}
              <span className="text-xs font-normal text-slate-400">
                Max 5 MB
              </span>
            </button>
          </Field>

          {logoPreview && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <img
                src={logoPreview}
                alt="Organization logo preview"
                className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700">
                  Logo Preview
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Preview only; upload support depends on the API.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLogoPreview((previous) => {
                    if (previous?.startsWith("blob:")) {
                      URL.revokeObjectURL(previous);
                    }
                    return null;
                  });

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                aria-label="Remove logo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Access & Permissions"
          description="Assign roles, application modules, and companies."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Roles">
            <Controller
              name="roleIds"
              control={control}
              render={({ field }) => (
                <SearchableMultiSelect
                  value={field.value ?? []}
                  options={options.roles}
                  onChange={field.onChange}
                  placeholder="Search and select roles..."
                  emptyText="No roles found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Modules">
            <Controller
              name="moduleIds"
              control={control}
              render={({ field }) => (
                <SearchableMultiSelect
                  value={field.value ?? []}
                  options={options.modules}
                  onChange={field.onChange}
                  placeholder="Search and select modules..."
                  emptyText="No modules found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Companies">
            <Controller
              name="companyIds"
              control={control}
              render={({ field }) => (
                <SearchableMultiSelect
                  value={field.value ?? []}
                  options={options.companies}
                  onChange={field.onChange}
                  placeholder="Search and select companies..."
                  emptyText="No companies found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Additional Information"
          description="Set the user's designation and operational assignments."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Designation">
            <Controller
              name="designationId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.designations}
                  onChange={field.onChange}
                  placeholder="Search designation..."
                  emptyText="No designations found"
                  primaryColor={primaryColor}
                  loading={loadingOptions}
                />
              )}
            />
          </Field>

          <Field label="Distribution">
            <Controller
              name="distributionId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.distributions}
                  onChange={field.onChange}
                  placeholder="Search distribution..."
                  emptyText="No distributions found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Warehouse">
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.warehouses}
                  onChange={field.onChange}
                  placeholder="Search warehouse..."
                  emptyText="No warehouses found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Factory">
            <Controller
              name="factoryId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.factories}
                  onChange={field.onChange}
                  placeholder="Search factory..."
                  emptyText="No factories found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Receiving Point">
            <Controller
              name="receivingPointId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.receivingPoints}
                  onChange={field.onChange}
                  placeholder="Search receiving point..."
                  emptyText="No receiving points found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>

          <Field label="Unit">
            <Controller
              name="unitId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ""}
                  options={options.units}
                  onChange={field.onChange}
                  placeholder="Search unit..."
                  emptyText="No units found"
                  primaryColor={primaryColor}
                />
              )}
            />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Account Status"
          description="Control whether this user can access the platform."
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
          <input
            type="checkbox"
            {...register("isActive")}
            className="h-4 w-4 rounded"
            style={{ accentColor: primaryColor }}
          />

          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-800">
              Active Account
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Allow this organization user to access the platform.
            </span>
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              watch("isActive")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {watch("isActive") ? "Active" : "Inactive"}
          </span>
        </label>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  emptyText,
  primaryColor,
  loading = false,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder: string;
  emptyText: string;
  primaryColor: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((option) => String(option.id) === value);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(query) ||
        String(option.id).toLowerCase().includes(query),
    );
  }, [options, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch("");
        }}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "text-slate-800" : "text-slate-400"
          }`}
        >
          {selected?.name ?? placeholder}
        </span>

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-100 p-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Type to search..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-1.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-50"
              >
                Clear selection
              </button>

              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const selectedOption = String(option.id) === value;

                  return (
                    <button
                      key={String(option.id)}
                      type="button"
                      onClick={() => {
                        onChange(String(option.id));
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          color: primaryColor,
                          backgroundColor: `${primaryColor}10`,
                        }}
                      >
                        <Building2 className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-700">
                          {option.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          ID: {option.id}
                        </span>
                      </span>

                      {selectedOption && (
                        <Check
                          className="h-4 w-4 shrink-0"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  {emptyText}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SearchableMultiSelect({
  value,
  options,
  onChange,
  placeholder,
  emptyText,
  primaryColor,
}: {
  value: string[];
  options: DropdownOption[];
  onChange: (value: string[]) => void;
  placeholder: string;
  emptyText: string;
  primaryColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(query) ||
        String(option.id).toLowerCase().includes(query),
    );
  }, [options, search]);

  const selectedOptions = options.filter((option) =>
    value.includes(String(option.id)),
  );

  function toggleOption(id: string) {
    onChange(
      value.includes(id)
        ? value.filter((selectedId) => selectedId !== id)
        : [...value, id],
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch("");
        }}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left text-sm transition hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOptions.length ? "text-slate-800" : "text-slate-400"
          }`}
        >
          {selectedOptions.length
            ? `${selectedOptions.length} selected`
            : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={String(option.id)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
              style={{
                color: primaryColor,
                backgroundColor: `${primaryColor}10`,
              }}
            >
              <span className="max-w-40 truncate">{option.name}</span>
              <button
                type="button"
                onClick={() => toggleOption(String(option.id))}
                aria-label={`Remove ${option.name}`}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-100 p-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search options..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-1.5">
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const id = String(option.id);
                  const checked = value.includes(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleOption(id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? "border-transparent text-white"
                            : "border-slate-300 bg-white"
                        }`}
                        style={checked ? { backgroundColor: primaryColor } : {}}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {option.name}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  {emptyText}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5">
              <span className="text-xs text-slate-500">
                {value.length} selected
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
  }`;
}
