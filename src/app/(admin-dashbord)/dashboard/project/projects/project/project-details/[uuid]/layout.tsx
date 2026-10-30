/* eslint-disable prettier/prettier */
"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  uuid: string;
  name: string;
  code: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

// ✅ Duration Calculation Function
const calculateDuration = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return "N/A";
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  if (isNaN(start) || isNaN(end)) return "N/A";
  
  const diff = end - start;
  if (diff < 0) return "Invalid Dates";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${days} Day : ${hours} Hour : ${minutes} Minute : ${seconds} Second`;
};

export default function ProjectDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const uuid = params.uuid as string;

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project/${uuid}`
        );
        const json = await res.json();
        if (json.success) {
          setProject(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (uuid) fetchProject();
  }, [uuid]);

  const basePath = `/dashboard/project/projects/project/project-details/${uuid}`;

  const tabs = [
    { key: "dashboard", label: "Dashboard", href: `${basePath}/dashboard` },
    { key: "boq", label: "BOQ", href: `${basePath}/boq` },
    { key: "task", label: "Task", href: `${basePath}/task` },
    { key: "users", label: "Users", href: `${basePath}/users` },
    { key: "details", label: "Details", href: `${basePath}/details` },
    { key: "flat-land", label: "Flat/Land", href: `${basePath}/flat-land` },
    { key: "boq-comparison", label: "BOQ Comparison", href: `${basePath}/boq-comparison` },
    { key: "quotation", label: "Quotation", href: `${basePath}/quotation` },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        
        {/* ✅ এখানে ডাইনামিক ডিউরেশন বসানো হলো */}
        <div className="text-sm text-red-500 font-medium">
          {calculateDuration(project?.startDate, project?.endDate)}
        </div>

        <h1 className="text-xl font-semibold text-gray-800">
          {project?.name || "Loading..."}
        </h1>

        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-white">
            👁
          </button>
          <Link href="#" className="text-purple-600 text-sm hover:underline">
            Overall Report
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive(tab.href)
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-purple-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}