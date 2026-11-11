"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Download,
  Printer,
  Search,
  FolderOpen,
  FileSignature,
  Image as ImageIcon,
  FileCheck,
  MoreVertical,
  ShieldCheck,
} from "lucide-react";

const documents = [
  {
    category: "Legal & Agreements",
    files: [
      { name: "Main Sale Agreement.pdf", size: "2.4 MB", date: "2024-01-15", type: "pdf" },
      { name: "Addendum_1.pdf", size: "1.1 MB", date: "2024-01-20", type: "pdf" },
      { name: "NOC_Document.pdf", size: "850 KB", date: "2024-01-10", type: "pdf" },
    ],
  },
  {
    category: "KYC & Buyer Info",
    files: [
      { name: "Buyer_NID_Copy.jpg", size: "1.5 MB", date: "2024-01-15", type: "img" },
      { name: "TIN_Certificate.pdf", size: "500 KB", date: "2024-01-15", type: "pdf" },
    ],
  },
  {
    category: "Payment Receipts",
    files: [
      { name: "Down_Payment_Receipt.pdf", size: "420 KB", date: "2024-01-16", type: "pdf" },
      { name: "Installment_1_Receipt.pdf", size: "415 KB", date: "2024-02-01", type: "pdf" },
    ],
  },
  {
    category: "Registry & Mutation",
    files: [
      { name: "Registered_Deed.pdf", size: "3.2 MB", date: "2024-02-25", type: "pdf" },
      { name: "Mutation_Khatiyan.pdf", size: "1.8 MB", date: "2024-03-10", type: "pdf" },
    ],
  },
];

const fileIcons: any = {
  pdf: <FileText size={20} className="text-red-500" />,
  img: <ImageIcon size={20} className="text-blue-500" />,
};

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">BK-2024-7845</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents Vault</h1>
            <p className="text-sm text-gray-500 mt-1">All files and legal paperwork related to this booking.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <Link href=".../overview" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Overview</Link>
          <Link href=".../installments" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Installments</Link>
          <Link href=".../agreement" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Agreement</Link>
          <Link href=".../registration" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Registration</Link>
          <Link href=".../documents" className="px-4 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 whitespace-nowrap">Documents</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((folder, idx) => (
          <div key={idx} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <FolderOpen size={18} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{folder.category}</h3>
              <span className="ml-auto text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-md">
                {folder.files.length} files
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {folder.files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
                      {fileIcons[file.type]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate max-w-[200px] sm:max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{file.size} • {file.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                      <Download size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 gap-2 text-sm">
        <ShieldCheck size={18} />
        All documents are encrypted and access is logged for security purposes.
      </div>
    </div>
  );
}