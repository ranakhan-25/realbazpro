"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Check,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import UserForm from "@/components/modules/UserForm";
import UserWizardModal from "@/components/modules/UserWizardModal";
import UserModuleAccessModal from "@/components/modules/UserModuleAccessModal";
import UserCustomPermissionModal from "@/components/modules/UserCustomPermissionModal";
import { getUserOverrideSummaries } from "@/services/customPermissionService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import {
  deleteUser,
  getUser,
  getUsers,
  type User,
} from "@/services/userService";
import { useTheme } from "@/lib/theme";

const DEMO_USERS: User[] = [
  {
    id: 101,
    uuid: "demo-user-101",
    email: "admin@garmentech.com",
    username: "admin",
    firstName: "System",
    lastName: "Administrator",
    phone: "+8801700000001",
    isActive: true,
    createdAt: "2024-01-15T08:30:00.000Z",
    updatedAt: "2024-06-02T10:15:00.000Z",
    roleIds: [1, 2],
    moduleIds: [1, 2, 3],
    permissionIds: [1, 2, 3],
    userType: "admin",
  },
  {
    id: 102,
    uuid: "demo-user-102",
    email: "manager@garmentech.com",
    username: "manager",
    firstName: "Project",
    lastName: "Manager",
    phone: "+8801700000002",
    isActive: true,
    createdAt: "2024-02-10T09:00:00.000Z",
    updatedAt: "2024-06-02T12:00:00.000Z",
    roleIds: [2],
    moduleIds: [2, 3],
    permissionIds: [2, 4],
    userType: "manager",
  },
  {
    id: 103,
    uuid: "demo-user-103",
    email: "sales@garmentech.com",
    username: "salesrep",
    firstName: "Sales",
    lastName: "Representative",
    phone: "+8801700000003",
    isActive: true,
    createdAt: "2024-03-12T11:20:00.000Z",
    updatedAt: "2024-06-01T15:30:00.000Z",
    roleIds: [3],
    moduleIds: [2],
    permissionIds: [3],
    userType: "staff",
  },
  {
    id: 104,
    uuid: "demo-user-104",
    email: "support@garmentech.com",
    username: "support",
    firstName: "Customer",
    lastName: "Support",
    phone: "+8801700000004",
    isActive: false,
    createdAt: "2024-04-08T13:45:00.000Z",
    updatedAt: "2024-05-20T09:50:00.000Z",
    roleIds: [4],
    moduleIds: [1],
    permissionIds: [5],
    userType: "support",
  },
];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function getUserIdentifier(user: User) {
  return String(user.uuid ?? user.id);
}

function getFullName(user: User) {
  return (
    (user as any).name ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    "Unnamed User"
  );
}

function getRoleList(user: User): any[] {
  const roles = (user as any).roles;
  if (Array.isArray(roles)) return roles;
  const roleIds = (user as any).roleIds;
  if (Array.isArray(roleIds)) return roleIds;
  return [];
}

const ROLE_NAMES: Record<number, string> = {
  1: "Super Admin",
  2: "Admin",
  3: "Manager",
  4: "Employee",
};

function roleLabel(role: any, index: number): string {
  if (role === null || role === undefined) return "—";

  if (typeof role === "object") {
    const name = role.name ?? role.title ?? role.code;
    if (name) return String(name);

    const id = Number(role.id ?? role.roleId);
    return (
      ROLE_NAMES[id] ??
      (Number.isFinite(id) ? `Role ${id}` : `Role ${index + 1}`)
    );
  }

  const id = Number(role);
  return ROLE_NAMES[id] ?? `Role ${String(role)}`;
}

export default function UsersPage() {
  const { primaryColor } = useTheme();
  const profile = typeof window !== "undefined" ? getStoredUserProfile() : null;
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [moduleAccessUser, setModuleAccessUser] = useState<User | null>(null);
  const [customPermUser, setCustomPermUser] = useState<User | null>(null);
  const [overrideSummaries, setOverrideSummaries] = useState<
    Record<
      string | number,
      { totalOverrides: number; deniedCount: number; allowedCount: number }
    >
  >({});
  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [menuUserId, setMenuUserId] = useState<string | number | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const requestIdRef = useRef(0);
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => setPage(1), [status, pageSize]);

  const loadUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError("");
      const response = await getUsers({
        page,
        limit: pageSize,
        search: search || undefined,
        isActive: status === "all" ? undefined : status === "active",
        sortField: "created_at",
        sortOrder: "DESC",
      });

      if (requestId !== requestIdRef.current) return;
      let rawUsers: User[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        rawUsers = response;
        total = response.length;
      } else if (response && typeof response === "object") {
        const result = response as any;
        if (Array.isArray(result.data)) {
          rawUsers = result.data;
          total = result.meta?.total ?? rawUsers.length;
        } else if (Array.isArray(result.data?.data)) {
          rawUsers = result.data.data;
          total = result.data.meta?.total ?? rawUsers.length;
        }
      }

      const validUsers = rawUsers.filter(
        (user) =>
          user &&
          typeof user === "object" &&
          user.id !== undefined &&
          user.id !== null &&
          String(user.id).trim() !== "",
      );

      setUsers(validUsers);
      setTotalUsers(total || validUsers.length);

      getUserOverrideSummaries()
        .then((sums) => setOverrideSummaries(sums || {}))
        .catch(() => {});
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to retrieve user records.",
      );
      setUsers([]);
      setTotalUsers(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (menuUserId === null) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node))
        setMenuUserId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuUserId(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuUserId]);

  const openCreate = () => {
    setWizardOpen(true);
  };
  const openEdit = (user: User) => {
    setMenuUserId(null);
    setEditingUser(user);
    setFormOpen(true);
  };

  const openModuleAccess = (user: User) => {
    setMenuUserId(null);
    setModuleAccessUser(user);
  };

  const openView = async (user: User) => {
    setMenuUserId(null);
    setViewOpen(true);
    setViewLoading(true);
    setViewError("");
    setViewUser(null);
    try {
      const data = await getUser(getUserIdentifier(user), true);
      setViewUser(data);
    } catch (err) {
      setViewUser(user);
      setViewError(
        err instanceof Error
          ? err.message
          : "Couldn't load full details; showing cached data.",
      );
    } finally {
      setViewLoading(false);
    }
  };

  const openResetPassword = (user: User) => {
    setMenuUserId(null);
    setResetUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetError("");
    setResetNotice("");
  };

  const closeResetPassword = () => {
    setResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetNotice("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError("");
    setResetNotice("");
    if (newPassword.length < 8) {
      setResetError("Password must contain at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setResetError("Use at least one letter and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please check again.");
      return;
    }
    setResetNotice(
      "Validation passed, but the password has NOT been changed. Connect the backend reset-password API to complete this action.",
    );
  };

  const requestDelete = (user: User) => {
    setMenuUserId(null);
    setDeleteError("");
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    setDeleteError("");
    try {
      await deleteUser(getUserIdentifier(userToDelete));
      setUsers((current) =>
        current.filter((item) => item.id !== userToDelete.id),
      );
      setTotalUsers((current) => Math.max(0, current - 1));
      setUserToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete user.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = (savedUser: User) => {
    setFormOpen(false);
    setEditingUser(null);
    setUsers((current) => {
      const exists = current.some((item) => item.id === savedUser.id);
      if (exists)
        return current.map((item) =>
          item.id === savedUser.id ? { ...item, ...savedUser } : item,
        );
      setTotalUsers((total) => total + 1);
      return [savedUser, ...current];
    });
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page, "...", totalPages];
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.isOrgAdmin ? "Company Users" : "Users"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile?.isOrgAdmin
              ? "Manage company team members, authority levels, and workplace credentials."
              : "Manage platform users, roles, permissions and access."}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard
          label="Active (this page)"
          value={users.filter((user) => user.isActive).length}
          valueClass="text-emerald-600"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Page
          </p>
          <p
            className="mt-1 text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            {page}{" "}
            <span className="text-base font-medium text-slate-400">
              / {totalPages}
            </span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search username or email..."
              aria-label="Search users"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:bg-white"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 4px ${primaryColor}1A`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "active" | "inactive")
              }
              aria-label="Filter by status"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                {[
                  "User",
                  "Username",
                  "Phone Number",
                  "Email",
                  "Role",
                  "Status",
                  "Created",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Loader2
                      className="mx-auto h-6 w-6 animate-spin"
                      style={{ color: primaryColor }}
                    />
                    <p className="mt-2 text-sm text-slate-400">
                      Loading users...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <UserRound className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const fullName = getFullName(user);
                  const roles = getRoleList(user);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                            style={{
                              backgroundColor: `${primaryColor}1A`,
                              color: primaryColor,
                            }}
                          >
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound className="h-4 w-4" />
                            )}
                          </div>
                          <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                            {fullName}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.username ? `@${user.username}` : "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.phone || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.email || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {roles.length ? (
                          <div className="flex max-w-[200px] flex-wrap gap-1.5">
                            {roles.slice(0, 2).map((role, i) => (
                              <span
                                key={
                                  role?.id ??
                                  role?.uuid ??
                                  `${String(role)}-${i}`
                                }
                                className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-[#EE5426]"
                              >
                                {roleLabel(role, i)}
                              </span>
                            ))}
                            {roles.length > 2 && (
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                                +{roles.length - 2}
                              </span>
                            )}
                            {user.id && Boolean(overrideSummaries[user.id]?.deniedCount) && (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200"
                                title="This user has explicit permission restrictions"
                              >
                                <Ban className="h-2.5 w-2.5" />
                                {overrideSummaries[user.id]?.deniedCount} Restricted
                              </span>
                            )}
                            {user.id && Boolean(overrideSummaries[user.id]?.allowedCount) && (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200"
                                title="This user has explicit permission grants"
                              >
                                <Check className="h-2.5 w-2.5" />
                                {overrideSummaries[user.id]?.allowedCount} Granted
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <ShieldCheck className="h-4 w-4" /> No Role
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="relative px-5 py-4">
                        <div className="flex items-center gap-1">
                          <ActionIcon
                            label={`View ${fullName}`}
                            title="View user"
                            onClick={() => void openView(user)}
                            onColor={primaryColor}
                          >
                            <Eye className="h-4 w-4" />
                          </ActionIcon>
                          <ActionIcon
                            label={`Edit ${fullName}`}
                            title="Edit user"
                            onClick={() => openEdit(user)}
                            onColor={primaryColor}
                          >
                            <Edit3 className="h-4 w-4" />
                          </ActionIcon>
                          <button
                            type="button"
                            onClick={() => requestDelete(user)}
                            title="Delete user"
                            aria-label={`Delete ${fullName}`}
                            disabled={deletingId === user.id}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMenuUserId(
                                menuUserId === user.id ? null : user.id,
                              )
                            }
                            title="More"
                            aria-label={`More actions for ${fullName}`}
                            aria-haspopup="menu"
                            aria-expanded={menuUserId === user.id}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </div>
                        {menuUserId === user.id && (
                          <div
                            ref={menuRootRef}
                            role="menu"
                            className="absolute right-5 top-14 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                          >
                            <MenuButton
                              onClick={() => void openView(user)}
                              icon={<Eye className="h-4 w-4" />}
                            >
                              View Details
                            </MenuButton>
                            <MenuButton
                              onClick={() => openEdit(user)}
                              icon={<Edit3 className="h-4 w-4" />}
                            >
                              Edit User
                            </MenuButton>
                            <MenuButton
                              onClick={() => openModuleAccess(user)}
                              icon={<ShieldCheck className="h-4 w-4 text-indigo-600" />}
                            >
                              Module & Feature Access
                            </MenuButton>
                            <MenuButton
                              onClick={() => {
                                setMenuUserId(null);
                                setCustomPermUser(user);
                              }}
                              icon={<ShieldAlert className="h-4 w-4 text-rose-600" />}
                            >
                              Permission Overrides & Restrictions
                            </MenuButton>
                            <MenuButton
                              onClick={() => openResetPassword(user)}
                              icon={<KeyRound className="h-4 w-4" />}
                            >
                              Reset Password
                            </MenuButton>
                            <MenuButton
                              onClick={() => requestDelete(user)}
                              danger
                              icon={<Trash2 className="h-4 w-4" />}
                            >
                              Delete User
                            </MenuButton>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalUsers > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(page - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(page * pageSize, totalUsers)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {totalUsers}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {getPageNumbers().map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-8 min-w-6 items-center justify-center px-1 text-xs text-slate-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border text-xs font-medium transition"
                      style={
                        page === item
                          ? {
                              backgroundColor: primaryColor,
                              borderColor: primaryColor,
                              color: "#fff",
                            }
                          : {
                              borderColor: "#e2e8f0",
                              backgroundColor: "#fff",
                              color: "#475569",
                            }
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <UserWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => void loadUsers()}
      />

      <UserModuleAccessModal
        isOpen={Boolean(moduleAccessUser)}
        user={moduleAccessUser}
        onClose={() => setModuleAccessUser(null)}
        onSuccess={() => void loadUsers()}
      />

      <UserCustomPermissionModal
        isOpen={Boolean(customPermUser)}
        user={customPermUser}
        onClose={() => setCustomPermUser(null)}
        onSuccess={() => {
          void loadUsers();
          getUserOverrideSummaries()
            .then((sums) => setOverrideSummaries(sums || {}))
            .catch(() => {});
        }}
      />

      <AnimatePresence>
        {formOpen && (
          <Modal
            onClose={() => {
              setFormOpen(false);
              setEditingUser(null);
            }}
            labelledBy="user-form-heading"
          >
            <UserForm
              user={editingUser}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setFormOpen(false);
                setEditingUser(null);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewOpen && (
          <Modal
            onClose={() => setViewOpen(false)}
            labelledBy="user-view-heading"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2
                    id="user-view-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    User Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Complete user information
                  </p>
                </div>
                <CloseButton onClick={() => setViewOpen(false)} />
              </div>
              {viewLoading ? (
                <div className="py-12 text-center">
                  <Loader2
                    className="mx-auto h-6 w-6 animate-spin"
                    style={{ color: primaryColor }}
                  />
                </div>
              ) : viewUser ? (
                <>
                  {viewError && (
                    <p
                      role="alert"
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700"
                    >
                      {viewError}
                    </p>
                  )}
                  <UserDetails user={viewUser} primaryColor={primaryColor} />
                </>
              ) : null}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetUser && (
          <Modal
            onClose={closeResetPassword}
            labelledBy="reset-password-heading"
            maxWidthClass="max-w-md"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      id="reset-password-heading"
                      className="text-lg font-bold text-slate-900"
                    >
                      Reset Password
                    </h2>
                    <p className="text-sm text-slate-500">
                      Set a new password for this user.
                    </p>
                  </div>
                </div>
                <CloseButton onClick={closeResetPassword} />
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  User account
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getFullName(resetUser)}
                </p>
                <p className="text-xs text-slate-500">
                  {resetUser.email || `@${resetUser.username}`}
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <PasswordInput
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword((v) => !v)}
                  primaryColor={primaryColor}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="confirm-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
                  primaryColor={primaryColor}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-400">
                  Use at least 8 characters, including a letter and a number.
                </p>
                {resetError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
                  >
                    {resetError}
                  </p>
                )}
                {resetNotice && (
                  <p
                    role="status"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-800"
                  >
                    {resetNotice}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeResetPassword}
                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <KeyRound className="h-4 w-4" /> Validate Password
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userToDelete && (
          <Modal
            onClose={() => {
              if (deletingId === null) setUserToDelete(null);
            }}
            labelledBy="delete-user-heading"
            maxWidthClass="max-w-md"
          >
            <div className="space-y-4">
              <h2
                id="delete-user-heading"
                className="text-lg font-bold text-slate-900"
              >
                Delete user?
              </h2>
              <p className="text-sm text-slate-500">
                This will permanently remove{" "}
                <span className="font-semibold text-slate-700">
                  {userToDelete.username}
                </span>
                . This action cannot be undone.
              </p>
              {deleteError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
                >
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingId !== null}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deletingId !== null}
                  className="flex h-10 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  {deletingId !== null && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function ActionIcon({
  children,
  label,
  title,
  onClick,
  onColor,
}: {
  children: ReactNode;
  label: string;
  title: string;
  onClick: () => void;
  onColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
      onMouseEnter={(e) => {
        e.currentTarget.style.color = onColor;
        e.currentTarget.style.backgroundColor = `${onColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "";
        e.currentTarget.style.backgroundColor = "";
      }}
    >
      {children}
    </button>
  );
}

function MenuButton({
  children,
  icon,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <X className="h-5 w-5" />
    </button>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  primaryColor,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  primaryColor: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={8}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = primaryColor;
            e.currentTarget.style.boxShadow = `0 0 0 4px ${primaryColor}1A`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function UserDetails({
  user,
  primaryColor,
}: {
  user: User;
  primaryColor: string;
}) {
  const anyUser = user as any;
  const fullName =
    anyUser.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Not specified";
  const mobile = anyUser.mobile || user.phone || anyUser.phone_number || "Not specified";
  const createdDate = formatDate(anyUser.createdAt || anyUser.created_at);
  const updatedDate = formatDate(anyUser.updatedAt || anyUser.updated_at);
  const lastLogin = formatDate(anyUser.lastLoginAt || anyUser.last_login_at);
  const designation = anyUser.designationName || anyUser.designation || "Not specified";
  const isSuperUser = anyUser.isSuperUser ?? anyUser.is_super_user;
  const isOrgAdmin = anyUser.isOrgAdmin ?? anyUser.is_org_admin;
  const orgId = anyUser.orgId ?? anyUser.org_id;
  const orgName =
    anyUser.organization?.name ||
    anyUser.orgName ||
    (orgId
      ? `Organization #${orgId}`
      : isSuperUser
        ? "Platform Super Admin"
        : "Not assigned");
  const userType = user.userType || anyUser.user_type || "Office";
  const roles = getRoleList(user);
  const companies = Array.isArray(anyUser.companies) ? anyUser.companies : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
          style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor }}
        >
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 truncate">{fullName}</h3>
            {isSuperUser && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Super Admin
              </span>
            )}
            {isOrgAdmin && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Org Admin
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {user.email || `@${user.username}`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            user.isActive
              ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Full Name" value={fullName} />
        <Detail label="Username" value={user.username} />
        <Detail label="Email Address" value={user.email} />
        <Detail label="Phone Number" value={mobile} />
        <Detail label="User Type" value={userType} />
        <Detail label="Designation" value={designation} />
        <Detail label="Organization" value={orgName} />
        <Detail label="Created On" value={createdDate} />
        <Detail label="Last Updated" value={updatedDate} />
        {anyUser.last_login_at && (
          <Detail label="Last Login" value={lastLogin} />
        )}
      </div>

      <div className="grid gap-3 pt-1 md:grid-cols-2">
        <ObjectArrayDetail label="Assigned Roles" values={roles} />
        <ObjectArrayDetail label="Assigned Companies" values={companies} />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value === undefined || value === null || value === "" ? "Not specified" : value}
      </p>
    </div>
  );
}

function ArrayDetail({ label, values }: { label: string; values?: any[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {values?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, i) => (
            <span
              key={`${String(value)}-${i}`}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
            >
              {String(value)}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-400">None</span>
      )}
    </div>
  );
}

function ObjectArrayDetail({
  label,
  values,
}: {
  label: string;
  values?: any[];
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {values?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, i) => {
            const labelText =
              typeof value === "object" && value !== null
                ? (value.name ??
                  value.title ??
                  value.code ??
                  value.id ??
                  `Item ${i + 1}`)
                : value;
            return (
              <span
                key={value?.id ?? value?.uuid ?? i}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
              >
                {String(labelText)}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="text-sm text-slate-400">None</span>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
  labelledBy,
  maxWidthClass = "max-w-5xl",
}: {
  children: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full ${maxWidthClass} overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function formatDate(date?: string) {
  if (!date) return "Not recorded";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
