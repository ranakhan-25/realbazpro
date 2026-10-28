/* eslint-disable prettier/prettier */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      Redirecting to admin login...
    </div>
  );
}
