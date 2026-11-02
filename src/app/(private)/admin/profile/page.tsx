/* eslint-disable prettier/prettier */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */
type UserProfile = {
  id: string;
  uuid: string;
  name?: string;
  email: string;
  mobile: string | null;
  phone: string | null;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
  designationName: string | null;
  userCode: string | null;
  isSuperUser: boolean;
  isActive: boolean;
  isOrgAdmin: boolean;
  avatar: { url?: string } | null;
  fileId: string | null;
  organization: { name?: string } | null;
  roles: any[];
  modules: any[];
  permissions: any[];
  companies: any[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ================================================================== */
/* API CONFIG                                                         */
/* ================================================================== */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5002/realbizpro/api/v1";

const ENDPOINTS = {
  profile: `${API_BASE}/auth/profile`,
  upload: `${API_BASE}/files/upload`,
  content: `${API_BASE}/files/content`, // ছবি দেখার সঠিক এন্ডপয়েন্ট
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  
  const localToken =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");
  if (localToken) return localToken;

  const match = document.cookie.match(
    /(^|;)\s*(access_token|token|auth_token)\s*=\s*([^;]+)/
  );
  return match ? decodeURIComponent(match[3]) : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGetProfile(): Promise<UserProfile> {
  const res = await fetch(ENDPOINTS.profile, {
    method: "GET",
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("Session expired. Please login again.");
    throw new Error("Failed to load profile.");
  }
  
  const json = await res.json();
  return json.data ?? json;
}

async function apiUpdateProfile(payload: Record<string, any>) {
  const res = await fetch(ENDPOINTS.profile, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const json = await res.json();
    return json.data ?? json;
  }
  
  const errorData = await res.json().catch(() => ({}));
  throw new Error(errorData.message || errorData.error || "Failed to update profile.");
}

async function apiUploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  
  const res = await fetch(ENDPOINTS.upload, {
    method: "POST",
    headers: authHeaders(), 
    body: form,
  });
  
  if (!res.ok) throw new Error("Failed to upload photo.");
  const json = await res.json();
  
  // রেসপন্স থেকে id এবং filePath দুটোই বের করা হচ্ছে
  return {
    id: json.data?.id,
    filePath: json.data?.filePath,
  };
}

/* ================================================================== */
/* HELPERS                                                            */
/* ================================================================== */
function getInitials(p?: UserProfile | null) {
  const f = p?.firstName?.[0] ?? "";
  const l = p?.lastName?.[0] ?? "";
  const initials = `${f}${l}`.trim();
  return (initials || p?.username?.[0] || "U").toUpperCase();
}

function getFullName(p?: UserProfile | null) {
  if (!p) return "Unnamed User";
  const full = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return full || p.username || "Unnamed User";
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ✅ ফাইল পাথ থেকে সঠিক ছবির URL তৈরি করা
function getAvatarUrl(profile: UserProfile | null) {
  if (!profile) return "";
  // যদি সরাসরি avatar.url থাকে
  if (profile.avatar?.url) return profile.avatar.url;
  // যদি filePath থাকে (যা আপনার রেসপন্সে পাওয়া গেছে)
  if (profile.avatar && (profile.avatar as any).filePath) {
    return `${ENDPOINTS.content}/${encodeURIComponent((profile.avatar as any).filePath)}`;
  }
  return "";
}

/* ================================================================== */
/* PAGE                                                               */
/* ================================================================== */
export default function ProfilePage() {
  const { primaryColor } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGetProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const avatarUrl = getAvatarUrl(profile);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: primaryColor }}>
              Account Settings
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and update your personal information, contact details, and account security.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          disabled={!profile}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          <Edit3 className="h-4 w-4" /> Edit Profile
        </button>
      </motion.div>

      {/* ERROR */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{error}</span>
          <button onClick={loadProfile} className="text-xs font-bold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* BODY */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.7fr]">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.7fr]">
          {/* LEFT — Identity card */}
          <motion.section
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.06]"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div
                  className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold"
                  style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(profile)
                  )}
                </div>
                {profile.isActive && (
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">{getFullName(profile)}</h2>
              <p className="text-sm text-slate-500">@{profile.username}</p>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <Tag color="#EE5426">{profile.userType}</Tag>
                {profile.isSuperUser && <Tag color="#10B981" icon={<ShieldCheck className="h-3 w-3" />}>Super User</Tag>}
                {profile.isOrgAdmin && <Tag color="#8B5CF6" icon={<BadgeCheck className="h-3 w-3" />}>Org Admin</Tag>}
              </div>

              <div className="mt-5 w-full border-t border-slate-100 pt-4 text-left">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} color={primaryColor} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone || profile.mobile || "—"} color={primaryColor} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Organization" value={profile.organization?.name || "—"} color={primaryColor} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Designation" value={profile.designationName || "—"} color={primaryColor} />
              </div>
            </div>
          </motion.section>

          {/* RIGHT — Details grid */}
          <div className="space-y-5">
            <motion.section
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
            >
              <SectionTitle title="Personal Information" subtitle="Basic identity and account details" primaryColor={primaryColor} />
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail label="First Name" value={profile.firstName} icon={<UserRound className="h-3.5 w-3.5" />} />
                <Detail label="Last Name" value={profile.lastName} icon={<UserRound className="h-3.5 w-3.5" />} />
                <Detail label="Username" value={profile.username} icon={<AtSign className="h-3.5 w-3.5" />} />
                <Detail label="User Code" value={profile.userCode} icon={<BadgeCheck className="h-3.5 w-3.5" />} />
                <Detail label="Email" value={profile.email} icon={<Mail className="h-3.5 w-3.5" />} />
                <Detail label="Phone" value={profile.phone || profile.mobile} icon={<Phone className="h-3.5 w-3.5" />} />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
            >
              <SectionTitle title="Account & Access" subtitle="Security status and audit trail" primaryColor={primaryColor} />
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail
                  label="Account Status"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  value={
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${profile.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${profile.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {profile.isActive ? "Active" : "Inactive"}
                    </span>
                  }
                />
                <Detail label="User Type" icon={<ShieldCheck className="h-3.5 w-3.5" />} value={profile.userType} />
                <Detail label="Last Login" icon={<Clock3 className="h-3.5 w-3.5" />} value={formatDateTime(profile.lastLoginAt)} />
                <Detail label="Member Since" icon={<CalendarDays className="h-3.5 w-3.5" />} value={formatDate(profile.createdAt)} />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ObjectListDetail label="Roles" values={profile.roles} primaryColor={primaryColor} />
                <ObjectListDetail label="Modules" values={profile.modules} primaryColor={primaryColor} />
                <ObjectListDetail label="Permissions" values={profile.permissions} primaryColor={primaryColor} className="sm:col-span-2" />
              </div>
            </motion.section>
          </div>
        </div>
      ) : null}

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editOpen && profile && (
          <EditProfileModal
            profile={profile}
            primaryColor={primaryColor}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              void loadProfile();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ================================================================== */
/* SUB COMPONENTS                                                     */
/* ================================================================== */
function Tag({ children, color, icon }: { children: ReactNode; color: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize" style={{ backgroundColor: `${color}15`, color }}>
      {icon}
      {children}
    </span>
  );
}

function InfoRow({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-none">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700">{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, primaryColor }: { title: string; subtitle?: string; primaryColor: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: primaryColor }} />
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value?: string | number | null | ReactNode; icon?: ReactNode }) {
  const isEmpty = value === undefined || value === null || value === "" || (typeof value === "string" && value.trim() === "");
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-700">{isEmpty ? "—" : value}</div>
    </div>
  );
}

function ObjectListDetail({ label, values, primaryColor, className = "" }: { label: string; values?: any[]; primaryColor: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white p-3 ${className}`}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {values && values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => {
            const text = typeof v === "object" && v !== null ? (v.name ?? v.title ?? v.code ?? v.id ?? `Item ${i + 1}`) : v;
            return (
              <span key={v?.id ?? v?.uuid ?? i} className="rounded-md px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                {String(text)}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="text-xs text-slate-400">None assigned</span>
      )}
    </div>
  );
}

/* ================================================================== */
/* EDIT MODAL                                                         */
/* ================================================================== */
function EditProfileModal({ profile, primaryColor, onClose, onSaved }: { profile: UserProfile; primaryColor: string; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(getAvatarUrl(profile));
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const basePayload: Record<string, any> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      };
      
      let uploadedData = null;
      if (avatarFile) {
        uploadedData = await apiUploadAvatar(avatarFile);
      }
      
      if (uploadedData) {
        // প্রথমে fileId পাঠিয়ে চেষ্টা করবে
        const payload = { ...basePayload, fileId: uploadedData.id };
        try {
          await apiUpdateProfile(payload);
        } catch (err: any) {
          // যদি fileId রিজেক্ট করে, তবে avatar বা profileImage ট্রাই করবে
          if (err.message.includes("should not exist")) {
            const fallbackFields = ["avatar", "profileImage", "image"];
            let success = false;
            for (const field of fallbackFields) {
              try {
                const fallbackPayload = { ...basePayload, [field]: uploadedData.id };
                await apiUpdateProfile(fallbackPayload);
                success = true;
                break;
              } catch (e) {
                // পরের ফিল্ডে চেষ্টা
              }
            }
            if (!success) {
              await apiUpdateProfile(basePayload); // ছবি বাদে টেক্সট আপডেট
            }
          } else {
            throw err;
          }
        }
      } else {
        await apiUpdateProfile(basePayload);
      }
      
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
              <p className="text-xs text-slate-500">Update your personal information and photo.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold" style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              getInitials(profile)
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              <Camera className="h-4 w-4" /> Change Photo
            </button>
            <p className="mt-1 text-[11px] text-slate-400">JPG or PNG. Max 2MB.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="First Name" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} primaryColor={primaryColor} />
          <FormField label="Last Name" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} primaryColor={primaryColor} />
          <FormField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} primaryColor={primaryColor} disabled />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: primaryColor }}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, value, onChange, primaryColor, disabled }: { label: string; value: string; onChange: (v: string) => void; primaryColor: string; disabled?: boolean; }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        onFocus={(e) => {
          if (disabled) return;
          e.currentTarget.style.borderColor = primaryColor;
          e.currentTarget.style.boxShadow = `0 0 0 4px ${primaryColor}1A`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.boxShadow = "";
        }}
      />
    </div>
  );
}