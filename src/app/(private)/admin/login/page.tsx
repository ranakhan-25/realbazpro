/* eslint-disable prettier/prettier */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

<<<<<<< HEAD
  // Auto image/text slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Existing login functionality
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifier = email.trim();
    if (!identifier || password.length < 4) {
      setError("Enter a valid email or username, and a password of at least 4 characters.");
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
      router.replace("/admin/dashboard");
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
  const handleUseSuperAdmin = () => {
    setEmail("admin@admin.com");
    setPassword("12345678");
    setError("");
  };

  const slide = slides[currentSlide];

=======
>>>>>>> 20de41abfea25bfea38b46883d91cf5c3d5a9c51
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      Redirecting to admin login...
    </div>
  );
}
