"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  ArrowLeftRight,
  ArrowLeft,
  SquarePen,
  Trash2,
  X,
  Search,
  Check,
  Calendar,
  FileText,
  Printer,
  ShoppingCart,
  ClipboardList,
  RefreshCw,
  Eye,
  Handshake,
  Paperclip,
} from "lucide-react";
import MaterialRequisitionPrintModal from "./MaterialRequisitionPrintModal";

// ==========================================
// Types & Interfaces
// ==========================================
export interface ApprovalStep {
  label: string;
  type?: "approved" | "rejected" | "handshake" | "pending";
}

export interface RequisitionRow {
  id: number;
  projectType: string;
  project: string;
  titleOfWork: string;
  code: string;
  ref: string;
  date: string;
  demandDate: string;
  note?: string;
  addedBy: string;
  approvalSteps: ApprovalStep[];
  attachment?: string;
  items?: RequisitionItem[];
  address?: string;
  siteEngineer?: string;
  phone?: string;
}

export interface RequisitionItem {
  id: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  budgetQty: number;
  alreadyPurchaseQty: number;
  availableQty: number;
  demandQty: number;
  stock: number;
  brand?: string;
  approvedQty?: number;
}

// ==========================================
// Initial Data (Exact Match with Screenshot 1)
// ==========================================
const INITIAL_REQUISITIONS: RequisitionRow[] = [
  {
    id: 1,
    projectType: "Real Estate",
    project: "Mustain Villa",
    titleOfWork: "Direct Common Cost",
    code: "REC00103",
    ref: "",
    date: "19 Oct 2026",
    demandDate: "20 Oct 2026",
    note: "",
    addedBy: "Mohin",
    address: "Jolshiri",
    siteEngineer: "Mohin",
    phone: "01543667788",
    approvalSteps: [
      { label: "Rasel Hosain", type: "rejected" },
      { label: "Admin", type: "handshake" },
    ],
    items: [
      {
        id: "itm-1",
        itemCode: "ITM-501",
        itemName: "Land Survey",
        details: "",
        unit: "Khata",
        brand: "",
        budgetQty: 10,
        alreadyPurchaseQty: 0,
        availableQty: 10,
        demandQty: 2,
        approvedQty: 0,
        stock: 0,
      },
    ],
  },
  {
    id: 2,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Design Cost",
    code: "REC00102",
    ref: "",
    date: "19 Oct 2026",
    demandDate: "21 Oct 2026",
    note: "This is urgent.",
    addedBy: "Admin",
    address: "Mirpur DOHS, Dhaka",
    siteEngineer: "Engr. Tanvir",
    phone: "01722334455",
    approvalSteps: [{ label: "All Approvals Completed", type: "approved" }],
    items: [
      {
        id: "itm-2",
        itemCode: "ITM-502",
        itemName: "Architectural Layout Blueprint",
        details: "Revised 3D Elevation",
        unit: "Set",
        brand: "AutoCAD Pro",
        budgetQty: 5,
        alreadyPurchaseQty: 1,
        availableQty: 4,
        demandQty: 2,
        approvedQty: 2,
        stock: 2,
      },
    ],
  },
  {
    id: 3,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Bricks Works",
    code: "REC00101",
    ref: "",
    date: "18 Oct 2026",
    demandDate: "",
    note: "",
    addedBy: "Admin",
    address: "Mirpur DOHS, Dhaka",
    siteEngineer: "Engr. Tanvir",
    phone: "01722334455",
    approvalSteps: [
      { label: "All Approvals Completed", type: "approved" },
      { label: "All Approvals Completed", type: "approved" },
    ],
    items: [
      {
        id: "itm-3",
        itemCode: "ITM-503",
        itemName: "Auto First Class Red Bricks",
        details: "10-inch exterior walls",
        unit: "Pcs",
        brand: "Seven Rings",
        budgetQty: 25000,
        alreadyPurchaseQty: 10000,
        availableQty: 15000,
        demandQty: 5000,
        approvedQty: 5000,
        stock: 1200,
      },
    ],
  },
];

// Available BOQ items for adding in new requisition
const SAMPLE_BOQ_ITEMS: RequisitionItem[] = [
  {
    id: "boq-1",
    itemCode: "ITM-101",
    itemName: "BSRM 16mm TMT 500W High Strength Bar",
    details: "Grade 500W Steel Rebar",
    unit: "MT",
    budgetQty: 50,
    alreadyPurchaseQty: 20,
    availableQty: 30,
    demandQty: 10,
    stock: 5,
  },
  {
    id: "boq-2",
    itemCode: "ITM-102",
    itemName: "Seven Rings Gold PCC 42.5N Cement",
    details: "Portland Composite Cement",
    unit: "Bag",
    budgetQty: 2000,
    alreadyPurchaseQty: 800,
    availableQty: 1200,
    demandQty: 400,
    stock: 150,
  },
  {
    id: "boq-3",
    itemCode: "ITM-103",
    itemName: "Pakur Black Crushed Stone Chips (3/4)",
    details: "High density stone chips",
    unit: "Cft",
    budgetQty: 5000,
    alreadyPurchaseQty: 2000,
    availableQty: 3000,
    demandQty: 1000,
    stock: 450,
  },
  {
    id: "boq-4",
    itemCode: "ITM-104",
    itemName: "Coarse River Sand (Sylhet FM 2.5)",
    details: "Sylhet Sand for casting",
    unit: "Cft",
    budgetQty: 8000,
    alreadyPurchaseQty: 3500,
    availableQty: 4500,
    demandQty: 1500,
    stock: 600,
  },
  {
    id: "boq-5",
    itemCode: "ITM-105",
    itemName: "uPVC Schedule 40 Pressure Pipes 4-inch",
    details: "Plumbing drainage",
    unit: "Pcs",
    budgetQty: 200,
    alreadyPurchaseQty: 50,
    availableQty: 150,
    demandQty: 40,
    stock: 15,
  },
];

export default function MaterialRequisitionList() {
  const router = useRouter();
  const STORAGE_KEY = "realbiz_material_requisitions_v2";

  // View Mode: "list" (Screenshot 1) vs "create" (Screenshot 2)
  const [viewMode, setViewMode] = useState<"list" | "create">("list");

  // Requisitions State
  const [requisitions, setRequisitions] = useState<RequisitionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter State (Screenshot 1)
  const [filterDate, setFilterDate] = useState(
    "1 October, 2026 - 31 October, 2026",
  );
  const [filterCompany, setFilterCompany] = useState("RealBiz Pro");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTitleOfWork, setFilterTitleOfWork] = useState("");

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<keyof RequisitionRow | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Action Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // PDF / Print Modal State
  const [printModalRow, setPrintModalRow] = useState<RequisitionRow | null>(
    null,
  );
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleOpenPdf = (row: RequisitionRow) => {
    setPrintModalRow(row);
    setIsPrintModalOpen(true);
  };

  // Note Modal State
  const [noteModalContent, setNoteModalContent] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<RequisitionRow | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // ==========================================
  // Form State for "Create / Edit Requisition" (Screenshot 2)
  // ==========================================
  const [formDate, setFormDate] = useState("22/10/2026");
  const [formDemandDate, setFormDemandDate] = useState("");
  const [formCode, setFormCode] = useState("REC00104");
  const [formRef, setFormRef] = useState("");
  const [formProjectType, setFormProjectType] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formTitleOfWork, setFormTitleOfWork] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formSite, setFormSite] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSelectedItem, setFormSelectedItem] = useState("");
  const [formAttachment, setFormAttachment] = useState<string>("");
  const [formNote, setFormNote] = useState("");
  const [formItems, setFormItems] = useState<RequisitionItem[]>([]);
  const [boqSearch, setBoqSearch] = useState("");

  // Load Initial Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequisitions(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setRequisitions(INITIAL_REQUISITIONS);
  }, []);

  // Save changes to localStorage
  const saveRequisitions = useCallback((updated: RequisitionRow[]) => {
    setRequisitions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Click outside to close action dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show Toast
  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Generate next requisition code
  const getNextRequisitionCode = () => {
    const nextNum = requisitions.length + 104;
    return `REC00${nextNum}`;
  };

  // Toggle View to "Create"
  const handleOpenCreateForm = () => {
    setFormDate(new Date().toLocaleDateString("en-GB"));
    setFormDemandDate("");
    setFormCode(getNextRequisitionCode());
    setFormRef("");
    setFormProjectType("Real Estate");
    setFormProject("Mustain Villa");
    setFormTitleOfWork("Direct Common Cost");
    setFormTask("");
    setFormSite("Site-1 North Yard");
    setFormCategory("Miscellaneous");
    setFormSelectedItem("");
    setFormAttachment("");
    setFormNote("");
    setFormItems([SAMPLE_BOQ_ITEMS[0], SAMPLE_BOQ_ITEMS[1]]);
    setViewMode("create");
  };

  // Add Item to Form BOQ Table
  const handleAddItemToForm = () => {
    if (!formSelectedItem) {
      // Default to next available BOQ item
      const nextItem =
        SAMPLE_BOQ_ITEMS.find(
          (it) => !formItems.some((f) => f.itemCode === it.itemCode),
        ) || SAMPLE_BOQ_ITEMS[0];
      setFormItems((prev) => [
        ...prev,
        { ...nextItem, id: `item-${Date.now()}` },
      ]);
      showToast(`Added ${nextItem.itemName} to table`, "info");
      return;
    }
    const found = SAMPLE_BOQ_ITEMS.find(
      (it) => it.itemName === formSelectedItem,
    );
    if (found) {
      setFormItems((prev) => [...prev, { ...found, id: `item-${Date.now()}` }]);
      setFormSelectedItem("");
      showToast(`Added ${found.itemName} to table`, "info");
    }
  };

  // Remove Item from Form BOQ Table
  const handleRemoveFormItem = (id: string) => {
    setFormItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item Demand Qty in Form
  const handleUpdateItemDemand = (id: string, qty: number) => {
    setFormItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, demandQty: Math.max(0, qty) } : it,
      ),
    );
  };

  // Total Quantity Calculation in Form
  const formTotalQuantity = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (Number(it.demandQty) || 0), 0);
  }, [formItems]);

  // Handle Form Submit (Save New Requisition)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProject.trim()) {
      showToast("Please select a project", "error");
      return;
    }

    const nextId =
      requisitions.length > 0
        ? Math.max(...requisitions.map((r) => r.id)) + 1
        : 1;
    const newRequisition: RequisitionRow = {
      id: nextId,
      projectType: formProjectType || "Real Estate",
      project: formProject,
      titleOfWork: formTitleOfWork || "General Works",
      code: formCode || getNextRequisitionCode(),
      ref: formRef,
      date: formDate,
      demandDate: formDemandDate,
      note: formNote,
      addedBy: "Admin",
      approvalSteps: [{ label: "All Approvals Completed", type: "approved" }],
      attachment: formAttachment,
      items: formItems,
    };

    const updated = [newRequisition, ...requisitions];
    saveRequisitions(updated);
    showToast(
      `Requisition ${newRequisition.code} created successfully!`,
      "success",
    );
    setViewMode("list");
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const filtered = requisitions.filter((r) => r.id !== deleteTarget.id);
    saveRequisitions(filtered);
    showToast(`Requisition ${deleteTarget.code} deleted`, "info");
    setDeleteTarget(null);
  };

  // Multiple Convert Handlers
  const handleMultipleConvert = (target: "PO" | "RFQ" | "Purchase") => {
    if (selectedIds.length === 0) {
      showToast(
        `Please select at least one requisition to convert to ${target}`,
        "error",
      );
      return;
    }
    showToast(
      `Converting ${selectedIds.length} requisitions to ${target}...`,
      "success",
    );
    setSelectedIds([]);
  };

  // Select / Deselect All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAndSorted.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Sorting
  const handleSort = (field: keyof RequisitionRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...requisitions];

    // Filter by Company
    if (filterCompany) {
      // In sample data company is implied
    }

    // Filter by Project
    if (filterProject) {
      result = result.filter((r) =>
        r.project.toLowerCase().includes(filterProject.toLowerCase()),
      );
    }

    // Filter by Title of Work
    if (filterTitleOfWork) {
      result = result.filter((r) =>
        r.titleOfWork.toLowerCase().includes(filterTitleOfWork.toLowerCase()),
      );
    }

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q) ||
          r.titleOfWork.toLowerCase().includes(q) ||
          r.addedBy.toLowerCase().includes(q) ||
          r.projectType.toLowerCase().includes(q) ||
          String(r.id).includes(q),
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = (valA || "").toString().toLowerCase();
        const strB = (valB || "").toString().toLowerCase();

        if (strA < strB) return sortDirection === "asc" ? -1 : 1;
        if (strA > strB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    requisitions,
    filterCompany,
    filterProject,
    filterTitleOfWork,
    search,
    sortField,
    sortDirection,
  ]);

  // Pagination Logic
  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * entriesPerPage;
  const currentEntries = filteredAndSorted.slice(
    startIdx,
    startIdx + entriesPerPage,
  );

  const displayFrom = totalEntries === 0 ? 0 : startIdx + 1;
  const displayTo = Math.min(startIdx + entriesPerPage, totalEntries);

  // =========================================================================
  // RENDER: CREATE / NEW REQUISITION VIEW (Screenshot 2)
  // =========================================================================
  if (viewMode === "create") {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
            <span>{toast.message}</span>
          </div>
        )}

        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-[13px] font-normal">
              <Link
                href="/dashboard"
                className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400"
              >
                Home
              </Link>
              <span className="text-slate-400 dark:text-slate-600">›</span>
              <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
                <span>Requisition</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span className="text-slate-400 dark:text-slate-600">›</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Material Requisition
              </span>
            </nav>

            {/* Back to List Button */}
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>« Material Requisition List</span>
            </button>
          </div>

          {/* Form Top Card: Metadata Grid */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
              {/* Row 1: Date, Demand Date, Code, Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Demand Date
                  </label>
                  <input
                    type="text"
                    value={formDemandDate}
                    onChange={(e) => setFormDemandDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Ref
                  </label>
                  <input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    placeholder="Ref"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Project Type, Project, Title/Name of Work, If Task */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Type
                  </label>
                  <div className="relative">
                    <select
                      value={formProjectType}
                      onChange={(e) => setFormProjectType(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select value</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={formProject}
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Project</option>
                      <option value="Mustain Villa">Mustain Villa</option>
                      <option value="Hena Heights">Hena Heights</option>
                      <option value="Rifat Eyecon City">
                        Rifat Eyecon City
                      </option>
                      <option value="Lake Garden">Lake Garden</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Title/Name of Work
                  </label>
                  <div className="relative">
                    <select
                      value={formTitleOfWork}
                      onChange={(e) => setFormTitleOfWork(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Title/Name of Work</option>
                      <option value="Direct Common Cost">
                        Direct Common Cost
                      </option>
                      <option value="Design Cost">Design Cost</option>
                      <option value="Bricks Works">Bricks Works</option>
                      <option value="Foundation & Casting">
                        Foundation & Casting
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    If Task
                  </label>
                  <div className="relative">
                    <select
                      value={formTask}
                      onChange={(e) => setFormTask(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Task</option>
                      <option value="Piling Work">Piling Work</option>
                      <option value="Slab Concreting">Slab Concreting</option>
                      <option value="Masonry Work">Masonry Work</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Row 3: Site, Category, Select Item (+), Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Site
                  </label>
                  <div className="relative">
                    <select
                      value={formSite}
                      onChange={(e) => setFormSite(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Site</option>
                      <option value="Site-1 North Yard">
                        Site-1 North Yard
                      </option>
                      <option value="Tower-A Block">Tower-A Block</option>
                      <option value="Foundation Site">Foundation Site</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                    >
                      <option value="">Select Category</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                      <option value="Raw Construction Materials">
                        Raw Construction Materials
                      </option>
                      <option value="Deformed Rebar & Steels">
                        Deformed Rebar & Steels
                      </option>
                      <option value="Cement & Aggregates">
                        Cement & Aggregates
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Item
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={formSelectedItem}
                        onChange={(e) => setFormSelectedItem(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                      >
                        <option value="">Select Item</option>
                        {SAMPLE_BOQ_ITEMS.map((b) => (
                          <option key={b.id} value={b.itemName}>
                            {b.itemName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                    {/* Inline '+' Button */}
                    <button
                      type="button"
                      onClick={handleAddItemToForm}
                      title="Add selected item to requisition table"
                      className="w-8 h-8 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Attachment
                  </label>
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-500 shadow-2xs">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-[11px] font-medium text-slate-700 dark:text-slate-200 mr-2">
                      Choose File
                    </span>
                    <span className="truncate">
                      {formAttachment || "No file chosen"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Section: Left BOQ Items & Right Items Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (Search + BOQ ITEMS Tab) */}
              <div className="lg:col-span-3 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={boqSearch}
                    onChange={(e) => setBoqSearch(e.target.value)}
                    placeholder="Search Item Name, Qty"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  className="w-full py-2 bg-[#6366F1] text-white text-xs font-bold uppercase rounded-md shadow-xs text-center cursor-pointer"
                >
                  BOQ ITEMS
                </button>

                {/* Quick Add List from BOQ */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-2 space-y-1 max-h-60 overflow-y-auto">
                  {SAMPLE_BOQ_ITEMS.filter((it) =>
                    it.itemName.toLowerCase().includes(boqSearch.toLowerCase()),
                  ).map((it) => (
                    <div
                      key={it.id}
                      onClick={() => {
                        if (
                          !formItems.some((f) => f.itemCode === it.itemCode)
                        ) {
                          setFormItems((prev) => [
                            ...prev,
                            { ...it, id: `item-${Date.now()}` },
                          ]);
                          showToast(`Added ${it.itemName}`, "info");
                        }
                      }}
                      className="p-2 hover:bg-indigo-50/70 dark:hover:bg-slate-800 rounded text-xs cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <span className="truncate font-medium">
                        {it.itemName}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                        {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column (BOQ Items Table + Note + Total + Submit) */}
              <div className="lg:col-span-9 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#6366F1] text-white text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">ITEM CODE</th>
                          <th className="py-2.5 px-3">ITEM NAME</th>
                          <th className="py-2.5 px-3">DETAILS</th>
                          <th className="py-2.5 px-3">UNIT</th>
                          <th className="py-2.5 px-3 text-right">BUDGET QTY</th>
                          <th className="py-2.5 px-3 text-right">
                            ALREADY PURCHASE QTY
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            AVAILABLE QTY
                          </th>
                          <th className="py-2.5 px-3 text-right w-24">
                            DEMAND QTY
                          </th>
                          <th className="py-2.5 px-3 text-right">STOCK</th>
                          <th className="py-2.5 px-3 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {formItems.length > 0 ? (
                          formItems.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {item.itemCode}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">
                                {item.itemName}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {item.details}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.budgetQty}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.alreadyPurchaseQty}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-indigo-600 dark:text-indigo-400">
                                {item.availableQty}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.demandQty}
                                  onChange={(e) =>
                                    handleUpdateItemDemand(
                                      item.id,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.stock}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={10}
                              className="text-center py-8 text-slate-400 text-xs"
                            >
                              No items selected yet. Click + next to Select Item
                              or pick from the BOQ list.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Below Table: Note on left, Total + Submit on right */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Left: Note Textarea */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="Add any specific notes or instructions..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs resize-none"
                    />
                  </div>

                  {/* Right: Total Display & Submit Button */}
                  <div className="space-y-3 sm:text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">
                        Total :
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={formTotalQuantity}
                        className="w-full sm:w-60 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-right shadow-2xs inline-block"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-2.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold rounded-md shadow-md shadow-indigo-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: LIST VIEW (Screenshot 1)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* ========================================================= */}
        {/* TOP BAR: Breadcrumbs + Conversion & Add Action Buttons */}
        {/* ========================================================= */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[13px] font-normal"
          >
            <Link
              href="/dashboard"
              className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400"
            >
              Home
            </Link>
            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>
            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
              <span>Requisition</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2] text-[#5D5FEF] dark:text-indigo-400" />
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-light">
              ›
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Material Requisition List
            </span>
          </nav>

          {/* Action Buttons (Screenshot 1: Multiple PO, Multiple RFQ, Multiple Purchase, +New Material Requisition) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Multiple PO Convert (Cyan) */}
            <button
              onClick={() => handleMultipleConvert("PO")}
              className="flex items-center gap-1.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Multiple PO Convert</span>
            </button>

            {/* Multiple RFQ Convert (Indigo/Purple) */}
            <button
              onClick={() => handleMultipleConvert("RFQ")}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Multiple RFQ Convert</span>
            </button>

            {/* Multiple Purchase Convert (Cyan) */}
            <button
              onClick={() => handleMultipleConvert("Purchase")}
              className="flex items-center gap-1.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs sm:text-[13px] font-semibold px-3.5 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Multiple Purchase Convert</span>
            </button>

            {/* +New Material Requisition Button (Vibrant Purple) */}
            <button
              id="new-material-requisition-btn"
              onClick={handleOpenCreateForm}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Material Requisition</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILTER PANEL CARD (Matches Screenshot 1 Exactly) */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          {/* Row 1: Select Date, Company, Supplier, Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Select Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company
              </label>
              <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 shadow-2xs">
                <span className="flex-1 truncate">
                  {filterCompany || "Select Company"}
                </span>
                {filterCompany && (
                  <button
                    type="button"
                    onClick={() => setFilterCompany("")}
                    className="text-slate-400 hover:text-slate-600 mr-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Supplier
              </label>
              <div className="relative">
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                >
                  <option value="">Select an option</option>
                  <option value="Safety First Suppliers">
                    Safety First Suppliers
                  </option>
                  <option value="Delta Glass & Aluminium">
                    Delta Glass & Aluminium
                  </option>
                  <option value="Mohin Business Solution">
                    Mohin Business Solution
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project
              </label>
              <div className="relative">
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
                >
                  <option value="">Select value</option>
                  <option value="Mustain Villa">Mustain Villa</option>
                  <option value="Hena Heights">Hena Heights</option>
                  <option value="Rifat Eyecon City">Rifat Eyecon City</option>
                  <option value="Lake Garden">Lake Garden</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>

          {/* Row 2: Title/Name of Work */}
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Title/Name of Work
            </label>
            <div className="relative">
              <select
                value={filterTitleOfWork}
                onChange={(e) => setFilterTitleOfWork(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-8 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer font-normal"
              >
                <option value="">Select Title/Name of Work</option>
                <option value="Direct Common Cost">Direct Common Cost</option>
                <option value="Design Cost">Design Cost</option>
                <option value="Bricks Works">Bricks Works</option>
                <option value="Foundation & Casting">
                  Foundation & Casting
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD CONTAINER: Controls + Table + Pagination */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Controls: Show entries & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
              <span>Show</span>
              <div className="relative inline-block">
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-7 py-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px]">
              <span>Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder=""
                  className="w-40 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Element (Matches Screenshot 1 Columns Exactly) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#6366F1] dark:bg-[#5558E6] text-white text-[11px] font-bold uppercase tracking-wider select-none">
                  {/* ID */}
                  <th
                    onClick={() => handleSort("id")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* SELECT All Checkbox */}
                  <th className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px]">SELECT</span>
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === filteredAndSorted.length &&
                          filteredAndSorted.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-white/60 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </th>

                  {/* PROJECT TYPE */}
                  <th
                    onClick={() => handleSort("projectType")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT TYPE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* PROJECT */}
                  <th
                    onClick={() => handleSort("project")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* TITLE/NAME OF WORK */}
                  <th
                    onClick={() => handleSort("titleOfWork")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>TITLE/NAME OF WORK</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* CODE */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>CODE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* REF */}
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span>REF</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* DATE */}
                  <th
                    onClick={() => handleSort("date")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>DATE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* DEMAND DATE */}
                  <th
                    onClick={() => handleSort("demandDate")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>DEMAND DATE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* NOTE */}
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span>NOTE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* ADDED BY */}
                  <th
                    onClick={() => handleSort("addedBy")}
                    className="py-3 px-3 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-1">
                      <span>ADDED BY</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* APPROVAL LAYER */}
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span>APPROVAL LAYER</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* ATTACHMENT */}
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span>ATTACHMENT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>

                  {/* ACTION */}
                  <th className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>ACTION</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
                {currentEntries.length > 0 ? (
                  currentEntries.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected
                            ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                            : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3 px-3 font-normal">{row.id}</td>

                        {/* SELECT Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* PROJECT TYPE */}
                        <td className="py-3 px-3 font-normal">
                          {row.projectType}
                        </td>

                        {/* PROJECT */}
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {row.project}
                        </td>

                        {/* TITLE/NAME OF WORK */}
                        <td className="py-3 px-3 font-normal">
                          {row.titleOfWork || "-"}
                        </td>

                        {/* CODE (Clickable to preview PDF) */}
                        <td
                          className="py-3 px-3 font-mono font-medium text-[#6366F1] dark:text-indigo-400 hover:underline cursor-pointer"
                          onClick={() => handleOpenPdf(row)}
                          title="Click to view Material Requisition PDF"
                        >
                          {row.code}
                        </td>

                        {/* REF */}
                        <td className="py-3 px-3 text-slate-400">
                          {row.ref || ""}
                        </td>

                        {/* DATE */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* DEMAND DATE */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {row.demandDate || ""}
                        </td>

                        {/* NOTE */}
                        <td className="py-3 px-3">
                          {row.note ? (
                            <div className="text-xs">
                              <span className="text-slate-700 dark:text-slate-300">
                                {row.note}{" "}
                              </span>
                              <button
                                onClick={() =>
                                  setNoteModalContent(row.note || "")
                                }
                                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                See more
                              </button>
                            </div>
                          ) : (
                            ""
                          )}
                        </td>

                        {/* ADDED BY */}
                        <td className="py-3 px-3">{row.addedBy}</td>

                        {/* APPROVAL LAYER (Matches Screenshot 1 Badges) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 items-start text-xs">
                            {row.approvalSteps.map((step, idx) => {
                              if (step.type === "rejected") {
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{step.label}</span>
                                  </span>
                                );
                              }
                              if (step.type === "handshake") {
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-[#10B981] text-white px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs"
                                  >
                                    <Handshake className="w-3.5 h-3.5" />
                                    <span>{step.label}</span>
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>{step.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* ATTACHMENT */}
                        <td className="py-3 px-3">
                          {row.attachment ? (
                            <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-xs">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>File</span>
                            </span>
                          ) : (
                            ""
                          )}
                        </td>

                        {/* ACTION Dropdown Button (Purple `#5D5FEF`) */}
                        <td className="py-3 px-3 text-center relative whitespace-nowrap">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === row.id ? null : row.id,
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5D5FEF] hover:bg-[#4d4ee0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <span>Action</span>
                              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            {/* Dropdown Menu (Matches Screenshot: View, Edit, Delete) */}
                            {activeMenuId === row.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
                              >
                                {/* 1. View Button (Purple) - Opens PDF Modal */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenPdf(row);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#5D5FEF] hover:bg-[#4d4ee0] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 fill-white text-white" />
                                  <span>View</span>
                                </button>

                                {/* 2. Edit Button (Cyan) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setFormProject(row.project);
                                    setFormCode(row.code);
                                    setFormTitleOfWork(row.titleOfWork);
                                    setViewMode("create");
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <SquarePen className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>

                                {/* 3. Delete Button (Red) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setDeleteTarget(row);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 fill-white text-white" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={14}
                      className="text-center py-10 text-slate-400 text-xs"
                    >
                      No requisitions match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Showing entries & Numbered Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
            </div>

            <div className="flex items-center gap-1 select-none">
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded font-medium cursor-pointer ${
                        isActive
                          ? "bg-[#6366F1] text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}

              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 disabled:opacity-40 font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NOTE MODAL */}
      {/* ========================================================= */}
      {noteModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Requisition Note
              </h3>
              <button
                onClick={() => setNoteModalContent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
              {noteModalContent}
            </p>
            <div className="text-right">
              <button
                onClick={() => setNoteModalContent(null)}
                className="px-4 py-1.5 rounded-md bg-[#6366F1] text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove requisition{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.code}
              </strong>
              ?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MATERIAL REQUISITION PRINT / PDF MODAL */}
      {/* ========================================================= */}
      <MaterialRequisitionPrintModal
        requisition={printModalRow}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
