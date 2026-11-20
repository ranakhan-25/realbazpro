"use client";

import Link from "next/link";
import { Plus, ArrowLeft, Loader2, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SmartPageStateProps {
  loading: boolean;
  error: string | null;
  data: any;
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  children: ReactNode; // আসল ডাটা থাকলে যে UI দেখাবে
  fallbackData?: any;  // ডেমো ডাটা (যদি চান)
  showDemoData?: boolean; // ✅ ডেমো ডাটা দেখতে চাইলে true করুন
}

export default function SmartPageState({
  loading,
  error,
  data,
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  children,
  fallbackData,
  showDemoData = true, // ডিফল্টভাবে ডেমো অন থাকবে, প্রোডাকশনে false করবেন
}: SmartPageStateProps) {
  
  // ১. লোডিং স্টেট
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ২. ডাটা না থাকলে বা এরর হলে
  if (error || !data) {
    // যদি ডেমো ডাটা দেখানোর অপশন অন থাকে এবং ফলব্যাক ডাটা দেওয়া থাকে
    if (showDemoData && fallbackData) {
      return <>{children}</>;
    }

    // অন্যথায় সুন্দর Empty State দেখাবে
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 max-w-lg w-full">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon size={40} className="text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/sales-management/bookings"
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Go Back
            </Link>
            <button
              onClick={onButtonClick}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ৩. আসল ডাটা থাকলে চিলড্রেন রেন্ডার করবে
  return <>{children}</>;
}
