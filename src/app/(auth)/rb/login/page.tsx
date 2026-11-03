/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, ArrowRight, Building2, Sparkles } from "lucide-react";

import { loginUniversalSession } from "@/lib/admin-auth/adminAuthApi";
import {
  getStoredAccessToken,
  setStoredTokens,
} from "@/lib/admin-auth/adminAuthStorage";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: "HERMES WORKSPACE",
    title: "Command center for high-performance teams.",
    description:
      "Streamline operations, manage civil projects, track lead pipelines, and monitor financial statements in real time.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: "OPERATIONAL AGILITY",
    title: "Everything your enterprise needs in one place.",
    description:
      "Connect sales, inventory, procurement, human resources, and credit realisation from a unified hub.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90",
    badge: "DATA INTELLIGENCE",
    title: "Turn daily transactions into strategic decisions.",
    description:
      "Track milestones, monitor store requisitions, verify voucher entries, and scale organizational productivity.",
  },
];

export default function RegularLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (getStoredAccessToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || password.length < 4) {
      setError(
        "Please enter your email or username, and a password of at least 4 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const session = await loginUniversalSession(cleanIdentifier, password);

      setStoredTokens(session.accessToken, session.refreshToken, session.user);

      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemo = () => {
    setIdentifier("admin@admin.com");
    setPassword("12345678");
    setError("");
  };

  const slide = slides[currentSlide];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/80 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl lg:grid lg:grid-cols-2">
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
                  RealBiz Enterprise Operations
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
              <span>Universal Workspace Access</span>
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
                <Building2 className="h-4 w-4 text-[#0000F2]" />
                <span>Enterprise Workspace Access</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Welcome back
              </h1>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sign in with your organization account to access your assigned operational workspaces.
              </p>
            </div>

            {/* Quick Fill Info */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Fill:
              </span>
              <button
                type="button"
                onClick={handleUseDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0000F2] hover:bg-blue-100 hover:border-blue-300 transition active:scale-95 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0000F2]" />
                Workspace Demo
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {/* Email / Username */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="identifier"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Work Email or Username
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    className="text-[11px] font-bold text-[#0000F2] hover:underline"
                  >
                    Fill Demo
                  </button>
                </div>

                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="name@company.com or username"
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
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              ) : null}

              {/* Submit Button with Hermes Accent */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0000F2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0000F2]/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Authenticating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
              >
                ← Return to main site
              </Link>

              <Link
                href="/login"
                className="text-xs font-bold text-[#0000F2] transition hover:underline"
              >
                Super Admin Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
