/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ArrowRight, ShieldCheck, Building2, User } from "lucide-react";

import { loginUniversalSession } from "@/lib/admin-auth/adminAuthApi";
import {
  getStoredAccessToken,
  setStoredTokens,
} from "@/lib/admin-auth/adminAuthStorage";
import { SiteShell } from "@/components/site/SiteNav";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: "RealBiz OS Enterprise",
    title: "Command center for high-performance teams.",
    description:
      "Streamline your pipeline, analyze operational metrics, and scale growth securely from a unified workspace.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: "Smart Operations",
    title: "Everything your business needs in one place.",
    description:
      "Manage sales, projects, finance, customers, vendors, and daily operations from one powerful platform.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90",
    badge: "Business Intelligence",
    title: "Turn your business data into better decisions.",
    description:
      "Track performance, monitor cash flow, understand your numbers, and make faster decisions with real-time insights.",
  },
];

function LoginPages() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Please enter your email or username, and a password of at least 4 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const session = await loginUniversalSession(cleanIdentifier, password);

      setStoredTokens(
        session.accessToken,
        session.refreshToken,
        session.user,
      );

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

  const handleQuickFill = (emailVal: string, passVal: string) => {
    setIdentifier(emailVal);
    setPassword(passVal);
    setError("");
  };

  const slide = slides[currentSlide];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900">
      {/* Main Container */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid lg:grid-cols-2">
        {/* ========================================================= */}
        {/* LEFT SIDE - FULL IMAGE SLIDER                            */}
        {/* ========================================================= */}

        <div className="relative hidden min-h-[680px] overflow-hidden lg:block">
          {/* Sliding Images */}
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={currentSlide}
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
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

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/45" />

              {/* Bottom Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
            </motion.div>
          </AnimatePresence>

          {/* Top Header */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-8">
            {/* Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${currentSlide}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {slide.badge}
              </motion.div>
            </AnimatePresence>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/20 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white hover:text-zinc-900"
            >
              ← Back
            </button>
          </div>

          {/* Center / Bottom Content */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-8 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{
                  opacity: 0,
                  x: 50,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -50,
                }}
                transition={{
                  duration: 0.55,
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="max-w-lg"
              >
                {/* Small Label */}
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                  RealBiz Universal Platform
                </p>

                {/* Title */}
                <h2 className="font-sans text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slider Indicators */}
            <div className="mt-8 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className="group py-2"
                >
                  <span
                    className={`block h-1 rounded-full transition-all duration-500 ${
                      currentSlide === index
                        ? "w-10 bg-white"
                        : "w-4 bg-white/35 group-hover:bg-white/60"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Footer Metadata */}
            <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] uppercase tracking-wider text-white/50">
              <span>Enterprise Grade Security</span>
              <span>Universal Workspace Gateway</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE - LOGIN UI                                    */}
        {/* ========================================================= */}

        <div className="flex flex-col justify-center bg-white p-8 sm:p-12">
          <div className="mx-auto w-full max-w-md">
            {/* Form Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Welcome back
              </h1>

              <p className="text-sm text-zinc-600">
                Sign in with your organization account to access your workspace.
              </p>
            </div>

            {/* Quick preset selector */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Fill:
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@admin.com", "12345678")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@apex.com", "12345678")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition"
              >
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                Org Admin
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {/* Email / Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                >
                  Work Email or Username
                </label>

                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:opacity-60"
                  placeholder="name@company.com or username"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-500"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </div>

              {/* Error */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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
            <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
              <Link
                href="/"
                className="text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
              >
                ← Return to main site
              </Link>

              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Universal Gateway
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <SiteShell>
      <LoginPages />
    </SiteShell>
  );
}
