import api from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`;

/* =========================================================
   USER
========================================================= */

export interface User {
  id: number;

  // IMPORTANT:
  // Backend update/delete endpoint may use UUID.
  uuid?: string;

  avatarUrl?: string;

  email: string;
  username: string;

  firstName?: string;
  lastName?: string;
  phone?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt?: string;
  createdById?: number;

  roleIds?: number[];
  moduleIds?: number[];
  permissionIds?: number[];
  categoryIds?: number[];

  userType?: string;
  designationId?: number;

  officeIds?: number[];
  officeTypeIds?: number[];

  distributionId?: number;
  warehouseId?: number;
  receivingPointId?: number;
  factoryId?: number;
  unitId?: number;

  sectionIds?: number[];
  companyIds?: number[];

  employeeId?: number;
}

/* =========================================================
   GET USERS PARAMS
========================================================= */

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;

  isActive?: boolean | string;

  userType?: string | string[];

  sortField?: string;
  sortOrder?: "ASC" | "DESC";

  distributionId?: number;
  warehouseId?: number;
  factoryId?: number;
  departmentId?: number;
  designationId?: number;
  sectionId?: number;
  unitId?: number;
  companyId?: number;
  orgId?: number;
}

/* =========================================================
   BASE USER PAYLOAD
========================================================= */

export interface BaseUserPayload {
  name?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  username: string;
  isActive: boolean;
  designationId?: number;
  roleIds?: number[];
  moduleIds?: number[];
  categoryIds?: number[];
  userType?: string;
  companyIds?: number[];
  orgId?: number;
  orgUuid?: string;
}


/* =========================================================
   CREATE USER PAYLOAD
========================================================= */

export interface CreateUserPayload extends BaseUserPayload {
  password: string;
}

/* =========================================================
   UPDATE USER PAYLOAD
========================================================= */

export interface UpdateUserPayload extends BaseUserPayload {
  password?: string;
}

/* =========================================================
   COMPATIBILITY TYPE
========================================================= */

export type UserPayload =
  | CreateUserPayload
  | UpdateUserPayload;

/* =========================================================
   AXIOS & FETCH ERROR HANDLING
========================================================= */

function handleAxiosError(err: any): never {
  const res = err?.response;
  const result = res?.data;
  let message = "";

  if (typeof result === "string") {
    message = result;
  } else if (typeof result?.message === "string") {
    message = result.message;
  } else if (typeof result?.error === "string") {
    message = result.error;
  }

  if (Array.isArray(result?.errors)) {
    const errorMessages = result.errors
      .map((item: any) =>
        typeof item === "string"
          ? item
          : item?.message || item?.msg || item?.error || JSON.stringify(item),
      )
      .filter(Boolean);

    if (errorMessages.length > 0) {
      message = errorMessages.join(", ");
    }
  }

  if (Array.isArray(result?.message)) {
    message = result.message
      .map((item: any) =>
        typeof item === "string"
          ? item
          : item?.message || JSON.stringify(item),
      )
      .join(", ");
  }

  if (!message) {
    message = res?.status
      ? `Request failed with status code ${res.status}`
      : err?.message || "API request failed";
  }

  console.error(`[UserService] API Error (${res?.status || "network"}):`, message);
  throw new Error(message);
}

function getHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_access_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token")
      : null;

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T = unknown>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  let result: any = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (!response.ok) {
    let message = "";

    if (typeof result === "string") {
      message = result;
    } else if (typeof result?.message === "string") {
      message = result.message;
    } else if (typeof result?.error === "string") {
      message = result.error;
    }

    if (Array.isArray(result?.errors)) {
      const errorMessages = result.errors
        .map((item: any) =>
          typeof item === "string"
            ? item
            : item?.message ||
              item?.msg ||
              item?.error ||
              JSON.stringify(item),
        )
        .filter(Boolean);

      if (errorMessages.length > 0) {
        message = errorMessages.join(", ");
      }
    }

    if (Array.isArray(result?.message)) {
      message = result.message
        .map((item: any) =>
          typeof item === "string"
            ? item
            : item?.message || JSON.stringify(item),
        )
        .join(", ");
    }

    if (!message) {
      message =
        `Request failed with status code ${response.status}`;
    }

    console.error(
      `[UserService] API ERROR [${response.status} ${response.statusText}]:`,
      message,
    );

    throw new Error(message);
  }

  return result as T;
}

/* =========================================================
   UNWRAP SINGLE USER OBJECT
   -----------------------------------------------------
   Backend wraps single-record responses like:
     { success: true, data: { id, username, ... }, message }
   or sometimes:
     { success: true, data: { data: { id, ... } } }
   or, occasionally, the plain user object itself:
     { id, username, ... }

   Without unwrapping, `createUser`/`updateUser` were
   returning the *wrapper* object (no top-level `id`),
   which is why the newly created row appeared without
   an id in the UI. This walks the common shapes and
   returns the first object that actually looks like a user.
========================================================= */

function looksLikeUser(value: unknown): value is User {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("id" in (value as Record<string, unknown>) ||
      "uuid" in (value as Record<string, unknown>))
  );
}

function unwrapUser(result: any): User {
  if (looksLikeUser(result)) {
    return result as User;
  }

  if (looksLikeUser(result?.data)) {
    return result.data as User;
  }

  if (looksLikeUser(result?.data?.data)) {
    return result.data.data as User;
  }

  if (looksLikeUser(result?.user)) {
    return result.user as User;
  }

  console.error(
    "Unexpected user response shape — could not find `id`/`uuid`:",
    result,
  );

  throw new Error(
    "User was saved, but the server response was in an unexpected format (missing id). Please refresh the list.",
  );
}

/* =========================================================
   GET USERS
========================================================= */

export async function getUsers(
  params: GetUsersParams = {},
) {
  const searchParams = new URLSearchParams();

  searchParams.set(
    "page",
    String(params.page ?? 1),
  );

  searchParams.set(
    "limit",
    String(params.limit ?? 50),
  );

  if (params.search?.trim()) {
    searchParams.set(
      "search",
      params.search.trim(),
    );
  }

  if (
    params.isActive !== undefined &&
    params.isActive !== ""
  ) {
    searchParams.set(
      "isActive",
      String(params.isActive),
    );
  }

  if (params.userType) {
    if (Array.isArray(params.userType)) {
      params.userType.forEach((type) => {
        searchParams.append(
          "userType",
          type,
        );
      });
    } else {
      searchParams.append(
        "userType",
        params.userType,
      );
    }
  }

  searchParams.set(
    "sortField",
    params.sortField ?? "created_at",
  );

  searchParams.set(
    "sortOrder",
    params.sortOrder ?? "DESC",
  );

  if (params.distributionId !== undefined) {
    searchParams.set(
      "distributionId",
      String(params.distributionId),
    );
  }

  if (params.warehouseId !== undefined) {
    searchParams.set(
      "warehouseId",
      String(params.warehouseId),
    );
  }

  if (params.factoryId !== undefined) {
    searchParams.set(
      "factoryId",
      String(params.factoryId),
    );
  }

  if (params.departmentId !== undefined) {
    searchParams.set(
      "departmentId",
      String(params.departmentId),
    );
  }

  if (params.designationId !== undefined) {
    searchParams.set(
      "designationId",
      String(params.designationId),
    );
  }

  if (params.sectionId !== undefined) {
    searchParams.set(
      "sectionId",
      String(params.sectionId),
    );
  }

  if (params.unitId !== undefined) {
    searchParams.set(
      "unitId",
      String(params.unitId),
    );
  }

  if (params.companyId !== undefined) {
    searchParams.set(
      "companyId",
      String(params.companyId),
    );
  }

  try {
    const url = `/users?${searchParams.toString()}`;
    const response = await api.get(url);
    const result = response.data;

    const users = Array.isArray(result?.data?.data)
      ? result.data.data
      : Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
      ? result
      : [];

    const meta =
      result?.data?.meta ??
      result?.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        total: users.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

    return {
      success: true,
      data: users,
      meta,
    };
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   GET SINGLE USER
========================================================= */

export async function getUser(
  uuid: string | number,
  includePermissions = false,
): Promise<User> {
  const query = includePermissions
    ? "?includePermissions=true"
    : "";

  try {
    const response = await api.get(`/users/${uuid}${query}`);
    return unwrapUser(response.data);
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   CREATE USER
========================================================= */

export async function createUser(
  payload: CreateUserPayload,
): Promise<User> {
  try {
    const response = await api.post("/users", payload);
    return unwrapUser(response.data);
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   UPDATE USER
========================================================= */

export async function updateUser(
  uuid: string | number,
  payload: UpdateUserPayload,
): Promise<User> {
  try {
    const response = await api.patch(`/users/${uuid}`, payload);
    return unwrapUser(response.data);
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   DELETE USER
========================================================= */

export async function deleteUser(
  uuid: string | number,
): Promise<boolean> {
  try {
    await api.delete(`/users/${uuid}`);
    return true;
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   CONVERT EMPLOYEE TO USER
========================================================= */

export async function convertEmployeeToUser(
  employeeId: number,
): Promise<User> {
  try {
    const response = await api.post(`/users/convert/employee/${employeeId}`);
    return unwrapUser(response.data);
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   USER FORM DROPDOWN OPTIONS
========================================================= */

export interface DropdownOption {
  id: number | string;
  name: string;
  slug?: string;
  description?: string | null;
  roleLevel?: number;
  orgId?: number | null;
}

export interface UserFormDropdowns {
  designations: DropdownOption[];
  categories: DropdownOption[];
  employees: DropdownOption[];
  modules: DropdownOption[];
  roles: DropdownOption[];
  companies: DropdownOption[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  const keys = ["data", "items", "results", "content", "records", "rows", "list", "options"];
  for (const key of keys) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    const result = extractArray(nested);
    if (result.length) return result;
  }

  return [];
}

function normalizeOptions(value: unknown): DropdownOption[] {
  return extractArray(value)
    .map((item): DropdownOption | null => {
      if (!isRecord(item)) return null;

      const id = item.id;
      const name = item.name;

      if (
        (typeof id !== "number" && typeof id !== "string") ||
        (typeof name !== "string" && typeof name !== "number")
      ) {
        return null;
      }

      return {
        id,
        name: String(name),
        slug: typeof item.slug === "string" ? item.slug : undefined,
        description: typeof item.description === "string" ? item.description : null,
        roleLevel: typeof item.roleLevel === "number" ? item.roleLevel : undefined,
        orgId: typeof item.orgId === "number" ? item.orgId : null,
      };
    })
    .filter((item): item is DropdownOption => item !== null);
}

function pickDropdown(source: unknown, keys: string[]): DropdownOption[] {
  if (!isRecord(source)) return [];

  for (const key of keys) {
    if (source[key] !== undefined) {
      const result = normalizeOptions(source[key]);
      if (result.length) return result;
    }
  }

  for (const value of Object.values(source)) {
    if (isRecord(value)) {
      const result = pickDropdown(value, keys);
      if (result.length) return result;
    }
  }

  return [];
}

async function getJson(endpoint: string): Promise<unknown> {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch {
    return null;
  }
}

export async function getUserFormDropdowns(): Promise<UserFormDropdowns> {
  const [base, designations, modules, roles, companies] = await Promise.all([
    getJson("/users/dropdown/list"),
    getJson("/designation/dropdown"),
    getJson("/modules/dropdown"),
    getJson("/roles/dropdown"),
    getJson("/companies"),
  ]);

  return {
    // The existing user-dropdown endpoint is kept only for fields that
    // are still present in the form but no endpoint was supplied for them.
    designations: normalizeOptions(designations),
    categories: pickDropdown(base, ["categories", "category"]),
    employees: pickDropdown(base, ["employees", "employee"]),

    // These three fields now use the requested dedicated endpoints.
    modules: normalizeOptions(modules),
    roles: normalizeOptions(roles),
    companies: normalizeOptions(companies),
  };
}

/* =========================================================
   USER DROPDOWN
========================================================= */

export async function getUserDropdown(
  params?: {
    distributionId?: number;
    warehouseId?: number;
    factoryId?: number;
    departmentId?: number;
    designationId?: number;
    sectionId?: number;
    unitId?: number;
    userType?: string;
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.distributionId !== undefined) {
    query.set(
      "distributionId",
      String(params.distributionId),
    );
  }

  if (params?.warehouseId !== undefined) {
    query.set(
      "warehouseId",
      String(params.warehouseId),
    );
  }

  if (params?.factoryId !== undefined) {
    query.set(
      "factoryId",
      String(params.factoryId),
    );
  }

  if (params?.departmentId !== undefined) {
    query.set(
      "departmentId",
      String(params.departmentId),
    );
  }

  if (params?.designationId !== undefined) {
    query.set(
      "designationId",
      String(params.designationId),
    );
  }

  if (params?.sectionId !== undefined) {
    query.set(
      "sectionId",
      String(params.sectionId),
    );
  }

  if (params?.unitId !== undefined) {
    query.set(
      "unitId",
      String(params.unitId),
    );
  }

  if (params?.userType) {
    query.set(
      "userType",
      params.userType,
    );
  }

  if (params?.search?.trim()) {
    query.set(
      "search",
      params.search.trim(),
    );
  }

  const queryString = query.toString();

  try {
    const response = await api.get(
      `/users/dropdown/list${queryString ? `?${queryString}` : ""}`,
    );
    const result = response.data;
    return Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   ROLE
========================================================= */

export async function assignRole(
  userId: number,
  roleId: number,
) {
  try {
    const response = await api.post(`/users/${userId}/roles/${roleId}`);
    return response.data;
  } catch (err: any) {
    handleAxiosError(err);
  }
}

export async function removeRole(
  userId: number,
  roleId: number,
) {
  try {
    const response = await api.delete(`/users/${userId}/roles/${roleId}`);
    return response.data;
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   PERMISSIONS
========================================================= */

export async function addUserPermissions(
  payload: {
    userId: number;
    moduleId: number;
    permissionIds: number[];
  },
) {
  try {
    const response = await api.post("/users/permissions", payload);
    return response.data;
  } catch (err: any) {
    handleAxiosError(err);
  }
}

export async function deleteUserPermissions(
  payload: {
    userId: number;
    permissionIds: number[];
  },
) {
  try {
    const response = await api.delete("/users/permissions", { data: payload });
    return response.data;
  } catch (err: any) {
    handleAxiosError(err);
  }
}

/* =========================================================
   PUBLIC MOBILE AUTH EMPLOYEE CODES
========================================================= */

export async function getMobileAuthEmployeeCodes(
  params?: {
    search?: string;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set(
      "search",
      params.search.trim(),
    );
  }

  if (params?.limit !== undefined) {
    query.set(
      "limit",
      String(params.limit),
    );
  }

  const queryString = query.toString();

  try {
    const response = await api.get(
      `/users/public/mobile-auth-employee-codes${queryString ? `?${queryString}` : ""}`,
    );
    return response.data;
  } catch (err: any) {
    handleAxiosError(err);
  }
}