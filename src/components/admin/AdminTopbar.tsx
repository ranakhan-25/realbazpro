"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Search,
  ShieldCheck,
  User,
  Menu as MenuIcon,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useTheme } from "@/lib/theme";
import {
  clearStoredTokens,
  getStoredUserProfile,
  type AdminUserProfile,
} from "@/lib/admin-auth/adminAuthStorage";
import { logoutAdminSession } from "@/lib/admin-auth/adminAuthApi";
import { useSidebar } from "@/context/SidebarContext";

export default function AdminTopbar() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar();

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUserProfile | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredUserProfile());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfile = () => {
    setProfileOpen(false);
    router.push("/admin/profile");
  };

  const handleSignOut = async () => {
    try {
      await logoutAdminSession();
    } catch (err) {
      console.warn("Logout session error:", err);
    } finally {
      clearStoredTokens();
      setProfileOpen(false);
      setSearchOpen(false);
      router.replace("/login");
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6 lg:px-8"
      style={
        {
          "--primary-color": primaryColor || "#0000F2",
        } as React.CSSProperties
      }
    >
      {/* LEFT SECTION: COLLAPSE TOGGLE & SEARCH */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none lg:flex"
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4 text-slate-700" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={toggleMobile}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Open mobile navigation"
        >
          <MenuIcon className="h-4 w-4" />
        </button>

        {/* Search Input (No Left Offset Hack) */}
        <div className="relative hidden w-72 sm:block md:w-80">
          <Search
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search commands, users, modules…"
            aria-label="Search"
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-color)]/10"
          />
        </div>

        {/* Mobile Search Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setSearchOpen((prev) => !prev)}
          aria-label="Open search"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 sm:hidden"
        >
          <Search size={16} strokeWidth={1.8} />
        </motion.button>

        {/* Mobile Search Input Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "200px" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden sm:hidden"
            >
              <input
                type="search"
                autoFocus
                placeholder="Search..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT SECTION: ENVIRONMENT BADGE, NOTIFICATIONS, PROFILE */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Governance / Status Badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold text-blue-700 md:inline-flex">
          <Sparkles className="h-3 w-3 text-blue-600" />
          <span>Super Admin Console</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.8} />
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white"
            style={{ backgroundColor: primaryColor || "#0000F2" }}
          />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-expanded={profileOpen}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: primaryColor || "#0000F2" }}
            >
              <ShieldCheck size={16} strokeWidth={2.2} />
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-xs font-bold leading-tight text-slate-800">
                {currentUser?.name || "Super Admin"}
              </p>
              <p className="max-w-[120px] truncate text-[10px] text-slate-400">
                {currentUser?.isSuperUser ? "Super User" : "Administrator"}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
              >
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-bold text-slate-900">
                    {currentUser?.name || "Administrator"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {currentUser?.email || "admin@realbiz.com"}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleProfile}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <User size={15} className="text-slate-400" />
                    <span>Account Profile</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
