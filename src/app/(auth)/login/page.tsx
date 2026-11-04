/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, ShieldCheck, Loader2, ArrowRight, Sparkles } from "lucide-react";

import { loginAdminSession } from "@/lib/admin-auth/adminAuthApi";
import {
  getStoredAccessToken,
  setStoredTokens,
} from "@/lib/admin-auth/adminAuthStorage";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: "HERMES ENTERPRISE",
    title: "Governance & multi-tenant command console.",
    description:
      "Control enterprise organizations, manage module entitlements, configure tenant-isolated RBAC, and monitor platform health.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: "PLATFORM ARCHITECTURE",
    title: "Isolated tenant hierarchies with zero-leak access.",
    description:
      "Role-based authorization and modular micro-features kept strictly in-sync between backend services and UI clients.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90",
    badge: "TELEMETRY & OPERATIONS",
    title: "Real-time auditing and active tenant oversight.",
    description:
      "Monitor tenant registrations, audit subscription quotas, and manage enterprise security from one central location.",
  },
];

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track which button was clicked to determine the redirect path
  const [loginType, setLoginType] = useState<"default" | "super_admin" | "regular">("default");
  const [isGreen, setIsGreen] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (getStoredAccessToken()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifier = email.trim();
    if (!identifier || password.length < 4) {
      setError(
        "Enter a valid email or username, and a password of at least 4 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const session = await loginAdminSession(identifier, password);

      setStoredTokens(
        session.accessToken,
        session.refreshToken,
        session.user,
      );

      // Redirect logic based on which button was clicked
      if (loginType === "regular") {
        router.replace("/dashboard");
      } else {
        router.replace("/admin/dashboard");
      }
      
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Admin login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // For Super Admin Demo
  const handleUseSuperAdmin = () => {
    setEmail("fleek_bd");
    setPassword("Password@123");
    setError("");
    setIsGreen(true);
    setLoginType("super_admin");
  };

  // For Regular Workspace Login
  const handleUseRegularLogin = () => {
    setEmail("fleek_bd");
    setPassword("Password@123");
    setError("");
    setIsGreen(true);
    setLoginType("regular");
  };

  // Reset green state and login type if user manually edits the fields
  const handleInputChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setIsGreen(false);
    setLoginType("default");
  };

  const slide = slides[currentSlide];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/80 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl lg:grid lg:grid-cols-2">
        {/* LEFT SIDE - IMAGE SLIDER WITH VIBRANT ENTERPRISE VISUALS */}
        <div className="relative hidden min-h-[640px] overflow-hidden lg:block bg-slate-900">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={currentSlide}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
              {/* Soft directional gradients so the photograph stays completely clear and vibrant */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Top Header */}
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${currentSlide}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md shadow-sm"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D2FF]" />
                {slide.badge}
              </motion.div>
            </AnimatePresence>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900 shadow-sm"
            >
              ← Portal Home
            </Link>
          </div>

          {/* Bottom Content */}
          <div className="absolute inset-x-0 bottom-0 z-30 p-8 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="max-w-xl"
              >
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00D2FF] font-bold drop-shadow-sm">
                  RealBiz Super Governance
                </p>

                <h2 className="text-2xl font-black leading-tight tracking-tight text-white xl:text-3xl drop-shadow-md">
                  {slide.title}
                </h2>

                <p className="mt-3 max-w-lg text-xs leading-relaxed text-slate-200 drop-shadow-sm">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slider Indicators */}
            <div className="mt-6 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className="group py-2"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ${
                      currentSlide === index
                        ? "w-8 bg-[#0000F2] shadow-sm shadow-blue-500/50"
                        : "w-3 bg-white/40 group-hover:bg-white/70"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Footer Metadata */}
            <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] uppercase tracking-wider text-slate-300">
              <span>Hermes Security Architecture</span>
              <span>Central Admin Console</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="flex min-h-[640px] flex-col justify-center bg-white p-8 sm:p-12">
          <div className="mx-auto w-full max-w-md">
            {/* RealBiz Brand Logo */}
            <div className="mb-6">
              <Link href="/" className="inline-block" aria-label="RealBiz Home">
                <img
                  src="/logo.svg"
                  alt="RealBiz Pro"
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Form Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <ShieldCheck className="h-4 w-4 text-[#0000F2]" />
                <span>Super Administrator Access</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Super Admin Login
              </h1>

              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your administrative credentials to manage tenant organizations, module policies, and roles.
              </p>
            </div>

            {/* Quick Fill Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Fill:
              </span>
              <button
                type="button"
                onClick={handleUseSuperAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0000F2] hover:bg-blue-100 hover:border-blue-300 transition active:scale-95 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0000F2]" />
                Super Admin Demo
              </button>

              <button
                type="button"
                onClick={handleUseRegularLogin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition active:scale-95 shadow-sm"
              >
                Regular Workspace Login →
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {/* Email or Username */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Email or Username
                  </label>
                  <button
                    type="button"
                    onClick={handleUseSuperAdmin}
                    className="text-[11px] font-bold text-[#0000F2] hover:underline"
                  >
                    Fill Admin
                  </button>
                </div>

                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="fleek_bd"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600"
                >
                  {error}
                </motion.div>
              ) : null}

              {/* Login Button - Green when filled via any quick fill button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
                  isGreen
                    ? "bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-600/90"
                    : "bg-[#0000F2] shadow-blue-600/25 hover:bg-[#0000F2]/90"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Signing in to Admin...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-6">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
              >
                ← Return to main site
              </Link>
              
              <div className="flex items-center gap-4">
                <Link
                  href="/change-password"
                  target="_blank"
                  className="text-xs font-semibold text-[#0000F2] hover:underline transition"
                >
                  Change Password
                </Link>
                
                <Link
                  href="/book-a-demo"
                  target="_blank"
                  className="text-xs font-semibold text-[#0000F2] hover:underline transition"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}