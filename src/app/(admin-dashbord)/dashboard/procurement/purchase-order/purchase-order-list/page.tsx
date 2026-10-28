"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  Paperclip,
  RotateCcw,
  X,
  Printer,
  Download,
  ShoppingBag,
  Upload,
  ArrowDownToLine,
  Trash2,
} from "lucide-react";

// ==========================================
// Types & Interfaces
// ==========================================
export interface BoqItem {
  id: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  quantity: number;
  rate: number;
  budgetQty: number;
  purchaseQty: number;
  stockQty: number;
  amount: number;
}

export interface GrnItem {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  receiveQty: number;
  alreadyReceiveQty: number;
}

export interface PurchaseOrderRow {
  id: number;
  projectType: string;
  project: string;
  titleOfWork: string;
  task: string;
  supplierName: string;
  supplierAddress?: string;
  supplierMobile?: string;
  supplierEmail?: string;
  shippingAddress?: string;
  code: string;
  reference: string;
  rfqCode?: string;
  date: string;
  subTotal: number;
  grandTotal: number;
  addedBy: string;
  approvalSteps: string[];
  note: string;
  attachment: string;
  items?: BoqItem[];
  site?: string;
  category?: string;
}

interface PurchaseOrderListProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

interface CatalogItem {
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  category: string;
  defaultRate: number;
  budgetQty: number;
  purchaseQty: number;
  stockQty: number;
}

// ==========================================
// Number to Words Helper for ERP Invoice
// ==========================================
function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Taka Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const formatHundreds = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  let intPart = Math.floor(num);
  const crore = Math.floor(intPart / 10000000);
  intPart %= 10000000;
  const lakh = Math.floor(intPart / 100000);
  intPart %= 100000;
  const thousand = Math.floor(intPart / 1000);
  intPart %= 1000;
  const remainder = intPart;

  const parts: string[] = [];
  if (crore > 0) parts.push(formatHundreds(crore) + " Crore");
  if (lakh > 0) parts.push(formatHundreds(lakh) + " Lakh");
  if (thousand > 0) parts.push(formatHundreds(thousand) + " Thousand");
  if (remainder > 0) parts.push(formatHundreds(remainder));

  return parts.join(" ") + " Taka Only";
}

// Catalog Items for Selection
const CATALOG_ITEMS: CatalogItem[] = [
  {
    itemCode: "Item 1444",
    itemName: "Cylinder Set",
    details: "Standard heavy cylinder lock fitting set",
    unit: "Set",
    category: "Hardware & Sanitary",
    defaultRate: 400,
    budgetQty: 20,
    purchaseQty: 10,
    stockQty: 8,
  },
  {
    itemCode: "ITM-001",
    itemName: "BSRM 16mm TMT 500W Bar",
    details: "Grade 500W high-strength deformed steel rebar",
    unit: "Kg",
    category: "Steel & Rebar",
    defaultRate: 98,
    budgetQty: 1000,
    purchaseQty: 500,
    stockQty: 200,
  },
  {
    itemCode: "ITM-002",
    itemName: "First Class Auto Bricks",
    details: "Gas fired standard kiln bricks with high compressive strength",
    unit: "Pcs",
    category: "Civil Materials",
    defaultRate: 14,
    budgetQty: 5000,
    purchaseQty: 2000,
    stockQty: 500,
  },
  {
    itemCode: "ITM-003",
    itemName: "Seven Rings Gold PCC Cement",
    details: "Portland Composite Cement 42.5N grade standard bag",
    unit: "Bag",
    category: "Civil Materials",
    defaultRate: 580,
    budgetQty: 300,
    purchaseQty: 100,
    stockQty: 40,
  },
  {
    itemCode: "ITM-004",
    itemName: "Thai Aluminium Section 1.5mm",
    details: "Powder coated heavy gauge sliding frame profile",
    unit: "Rft",
    category: "Glass & Thai Aluminium",
    defaultRate: 145,
    budgetQty: 200,
    purchaseQty: 80,
    stockQty: 20,
  },
];

// Initial Purchase Order Records Matching Screenshot 1 & 2
const INITIAL_PURCHASE_ORDERS: PurchaseOrderRow[] = [
  {
    id: 1,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Design Cost",
    task: "",
    supplierName: "Safety First Suppliers__",
    supplierAddress: "Motijheel",
    supplierMobile: "01312345695",
    supplierEmail: "N/A",
    shippingAddress: "Motijheel",
    code: "PO-023",
    reference: "REC00105",
    rfqCode: "R-046",
    date: "24-Oct-2026",
    subTotal: 4000,
    grandTotal: 4000,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Structural blueprint validation fee",
    attachment: "quote_po023.pdf",
    site: "Site 01 - Hena Heights",
    category: "Design & Consultancy",
    items: [
      {
        id: "boq-1-1",
        itemCode: "Item 1444",
        itemName: "Cylinder Set",
        details: "",
        unit: "Set",
        quantity: 10,
        rate: 400,
        budgetQty: 10,
        purchaseQty: 0,
        stockQty: 8,
        amount: 4000,
      },
    ],
  },
  {
    id: 2,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Design Cost",
    task: "",
    supplierName: "Mohin Business solution__",
    supplierAddress: "Banani, Dhaka",
    supplierMobile: "01712345678",
    supplierEmail: "mohin@business.com",
    shippingAddress: "Hena Heights, Site 01",
    code: "PO-022",
    reference: "REC00105",
    rfqCode: "R-045",
    date: "24-Oct-2026",
    subTotal: 4000,
    grandTotal: 4000,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Consultancy & Site assessment",
    attachment: "",
    site: "Site 01 - Hena Heights",
    category: "Design & Consultancy",
    items: [
      {
        id: "boq-2-1",
        itemCode: "Item 1444",
        itemName: "Cylinder Set",
        details: "Topographic validation verification",
        unit: "Set",
        quantity: 10,
        rate: 400,
        budgetQty: 10,
        purchaseQty: 0,
        stockQty: 8,
        amount: 4000,
      },
    ],
  },
  {
    id: 3,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Design Cost",
    task: "",
    supplierName: "Delta Glass & Aluminium__",
    supplierAddress: "Mirpur 10, Dhaka",
    supplierMobile: "01812345678",
    supplierEmail: "delta@glass.com",
    shippingAddress: "Hena Heights, Site 01",
    code: "PO-021",
    reference: "REC00102",
    rfqCode: "R-043",
    date: "19-Oct-2026",
    subTotal: 39000,
    grandTotal: 39000,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Facade and aluminium frame sample tests",
    attachment: "delta_spec.pdf",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "boq-3-1",
        itemCode: "ITM-004",
        itemName: "Thai Aluminium Section 1.5mm",
        details: "Powder coated sliding frame profile",
        unit: "Rft",
        quantity: 200,
        rate: 145,
        budgetQty: 200,
        purchaseQty: 80,
        stockQty: 20,
        amount: 29000,
      },
      {
        id: "boq-3-2",
        itemCode: "Item 1444",
        itemName: "Cylinder Set",
        details: "Stainless heavy lock fitting sets",
        unit: "Set",
        quantity: 25,
        rate: 400,
        budgetQty: 30,
        purchaseQty: 10,
        stockQty: 5,
        amount: 10000,
      },
    ],
  },
  {
    id: 4,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Bricks Works",
    task: "",
    supplierName: "Safety First Suppliers__",
    supplierAddress: "Motijheel, Dhaka",
    supplierMobile: "01312345695",
    supplierEmail: "sales@safetyfirst.com",
    shippingAddress: "Hena Heights, Site 01",
    code: "PO-020",
    reference: "REC00100",
    rfqCode: "R-041",
    date: "18-Oct-2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "First layer brick supply batch A",
    attachment: "",
    site: "Site 01 - Hena Heights",
    category: "Civil Materials",
    items: [
      {
        id: "boq-4-1",
        itemCode: "ITM-002",
        itemName: "First Class Auto Bricks",
        details: "Standard size gas fired bricks",
        unit: "Pcs",
        quantity: 1718,
        rate: 14,
        budgetQty: 5000,
        purchaseQty: 2000,
        stockQty: 500,
        amount: 24052,
      },
    ],
  },
  {
    id: 5,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Bricks Works",
    task: "",
    supplierName: "Riva Steel Mils__",
    supplierAddress: "Narayanganj",
    supplierMobile: "01912345678",
    supplierEmail: "riva@steel.com",
    shippingAddress: "Hena Heights, Site 01",
    code: "PO-019",
    reference: "REC00101",
    rfqCode: "R-040",
    date: "18-Oct-2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Batch B masonry supplies",
    attachment: "po19_quote.pdf",
    site: "Site 01 - Hena Heights",
    category: "Civil Materials",
    items: [
      {
        id: "boq-5-1",
        itemCode: "ITM-002",
        itemName: "First Class Auto Bricks",
        details: "High crushing strength clay bricks",
        unit: "Pcs",
        quantity: 1718,
        rate: 14,
        budgetQty: 5000,
        purchaseQty: 2000,
        stockQty: 500,
        amount: 24052,
      },
    ],
  },
  {
    id: 6,
    projectType: "Real Estate",
    project: "Hena Heights",
    titleOfWork: "Bricks Works",
    task: "",
    supplierName: "Rifat Thai House__Rifat Thai House",
    supplierAddress: "Uttara, Dhaka",
    supplierMobile: "01612345678",
    supplierEmail: "rifat@thaihouse.com",
    shippingAddress: "Hena Heights, Site 01",
    code: "PO-018",
    reference: "REC00099",
    rfqCode: "R-039",
    date: "17-Oct-2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Masonry partition reinforcement bricks",
    attachment: "",
    site: "Site 01 - Hena Heights",
    category: "Civil Materials",
    items: [
      {
        id: "boq-6-1",
        itemCode: "ITM-002",
        itemName: "First Class Auto Bricks",
        details: "Red brick shipment",
        unit: "Pcs",
        quantity: 1718,
        rate: 14,
        budgetQty: 5000,
        purchaseQty: 2000,
        stockQty: 500,
        amount: 24052,
      },
    ],
  },
  {
    id: 7,
    projectType: "Real Estate",
    project: "Lake Garden",
    titleOfWork: "Bricks Works",
    task: "",
    supplierName: "Akash Bepari__",
    supplierAddress: "Dhanmondi, Dhaka",
    supplierMobile: "01512345678",
    supplierEmail: "akash@bepari.com",
    shippingAddress: "Lake Garden Site 02",
    code: "PO-017",
    reference: "REC00096",
    rfqCode: "R-038",
    date: "08-Oct-2026",
    subTotal: 0,
    grandTotal: 0,
    addedBy: "Admin",
    approvalSteps: ["All Approvals Completed"],
    note: "Sample review order - zero valuation",
    attachment: "",
    site: "Site 02 - Lake Garden",
    category: "Civil Materials",
    items: [],
  },
];

const TABLE_HEADERS = [
  { label: "ID", key: "id", align: "left" },
  { label: "PROJECT TYPE", key: "projectType", align: "left" },
  { label: "PROJECT", key: "project", align: "left" },
  { label: "TITLE/NAME OF WORK", key: "titleOfWork", align: "left" },
  { label: "TASK", key: "task", align: "left" },
  { label: "SUPPLIER NAME", key: "supplierName", align: "left" },
  { label: "CODE", key: "code", align: "left" },
  { label: "REFERENCE", key: "reference", align: "left" },
  { label: "DATE", key: "date", align: "left" },
  { label: "SUB TOTAL", key: "subTotal", align: "right" },
  { label: "GRAND TOTAL", key: "grandTotal", align: "right" },
  { label: "ADDED BY", key: "addedBy", align: "left" },
  { label: "APPROVAL LAYER", key: "approvalSteps", align: "left" },
  { label: "NOTE", key: "note", align: "left" },
  { label: "ATTACHMENT", key: "attachment", align: "center" },
  { label: "ACTION", key: "action", align: "center" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PurchaseOrderList({
  isDarkMode: externalDarkMode,
  onToggleDarkMode,
}: PurchaseOrderListProps) {
  const [internalDarkMode] = useState(false);
  const isDark = externalDarkMode ?? internalDarkMode;

  // View modes: "list" (Screenshot 1), "create" (Screenshot 2), "grn" (Screenshot 3)
  const [viewMode, setViewMode] = useState<"list" | "create" | "grn">("list");

  // Orders State
  const [rows, setRows] = useState<PurchaseOrderRow[]>(INITIAL_PURCHASE_ORDERS);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Invoice / PDF View Modal State (Screenshot 2)
  const [invoiceOrder, setInvoiceOrder] = useState<PurchaseOrderRow | null>(
    null,
  );

  // Listing Filters State (matching Screenshot 1)
  const [dateRange, setDateRange] = useState(
    "1 October, 2026 - 31 October, 2026",
  );
  const [companyFilter, setCompanyFilter] = useState("RealBiz Pro");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PurchaseOrderRow;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });

  // Create Form State (Purchase Form)
  const [formDate, setFormDate] = useState("25/10/2026");
  const [formSupplier, setFormSupplier] = useState("");
  const [formCode, setFormCode] = useState("PO00002");
  const [formProjectType, setFormProjectType] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formTitleOfWork, setFormTitleOfWork] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formSite, setFormSite] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSelectedItem, setFormSelectedItem] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formAttachmentName, setFormAttachmentName] = useState("");
  const [formBoqItems, setFormBoqItems] = useState<BoqItem[]>([]);

  // GRN Form State (Matching Screenshot 3)
  const [selectedPoForGrn, setSelectedPoForGrn] =
    useState<PurchaseOrderRow | null>(null);
  const [grnDate, setGrnDate] = useState("25/10/2026");
  const [grnSupplier, setGrnSupplier] = useState("");
  const [grnCode, setGrnCode] = useState("PO00006");
  const [grnProjectType, setGrnProjectType] = useState("Real Estate");
  const [grnProject, setGrnProject] = useState("Hena Heights");
  const [grnTitleOfWork, setGrnTitleOfWork] = useState("Design Cost");
  const [grnTask, setGrnTask] = useState("");
  const [grnSite, setGrnSite] = useState("");
  const [grnItems, setGrnItems] = useState<GrnItem[]>([]);
  const [grnNote, setGrnNote] = useState("");
  const [grnAttachmentName, setGrnAttachmentName] = useState("");

  // Modals for adding Supplier / Item
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setActiveActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options derived from data
  const suppliers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.supplierName).filter(Boolean))),
    [rows],
  );
  const projects = useMemo(
    () => Array.from(new Set(rows.map((r) => r.project).filter(Boolean))),
    [rows],
  );
  const titlesOfWork = useMemo(
    () => Array.from(new Set(rows.map((r) => r.titleOfWork).filter(Boolean))),
    [rows],
  );
  const tasks = useMemo(
    () => Array.from(new Set(rows.map((r) => r.task).filter(Boolean))),
    [rows],
  );

  // Filtered & Sorted Rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [
          r.code,
          r.project,
          r.projectType,
          r.supplierName,
          r.titleOfWork,
          r.task,
          r.reference,
          r.addedBy,
          r.note,
        ].some((field) => field?.toLowerCase().includes(q));

      const matchesSupplier =
        !supplierFilter || r.supplierName === supplierFilter;
      const matchesProject = !projectFilter || r.project === projectFilter;
      const matchesTitle = !titleFilter || r.titleOfWork === titleFilter;
      const matchesTask = !taskFilter || r.task === taskFilter;

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesProject &&
        matchesTitle &&
        matchesTask
      );
    });
  }, [search, supplierFilter, projectFilter, titleFilter, taskFilter, rows]);

  const sortedRows = useMemo(() => {
    const items = [...filteredRows];
    items.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = sortedRows.slice(startIdx, startIdx + entriesPerPage);

  const handleSort = (key: keyof PurchaseOrderRow) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleResetFilters = () => {
    setCompanyFilter("");
    setSupplierFilter("");
    setProjectFilter("");
    setTitleFilter("");
    setTaskFilter("");
    setSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Open Create Purchase Order Form
  const handleOpenCreateForm = () => {
    setFormDate("25/10/2026");
    setFormSupplier("");
    setFormCode(`PO-0${rows.length + 18}`);
    setFormProjectType("Real Estate");
    setFormProject("");
    setFormTitleOfWork("");
    setFormTask("");
    setFormSite("");
    setFormCategory("");
    setFormSelectedItem("");
    setFormNote("");
    setFormAttachmentName("");
    setFormBoqItems([]);
    setViewMode("create");
  };

  // Open GRN Conversion View from PO (Image 3)
  const handleOpenGrnForm = (order: PurchaseOrderRow) => {
    setSelectedPoForGrn(order);
    setGrnDate("25/10/2026");
    setGrnSupplier(order.supplierName.replace(/_+$/, ""));
    setGrnCode("PO00006");
    setGrnProjectType(order.projectType || "Real Estate");
    setGrnProject(order.project || "Hena Heights");
    setGrnTitleOfWork(order.titleOfWork || "Design Cost");
    setGrnTask(order.task || "");
    setGrnSite(order.site || "");
    setGrnNote("");
    setGrnAttachmentName("");

    // Populate GRN items from PO items matching Image 3
    if (order.items && order.items.length > 0) {
      setGrnItems(
        order.items.map((it) => ({
          id: it.id,
          itemCode: it.itemCode,
          itemName: it.itemName,
          unit: it.unit,
          quantity: it.quantity,
          receiveQty: 2, // Default as in user's Image 3
          alreadyReceiveQty: Math.max(0, it.quantity - 2), // 8 as in user's Image 3
        })),
      );
    } else {
      setGrnItems([
        {
          id: "grn-item-1",
          itemCode: "Item 1444",
          itemName: "Cylinder Set",
          unit: "Set",
          quantity: 10,
          receiveQty: 2,
          alreadyReceiveQty: 8,
        },
      ]);
    }

    setActiveActionId(null);
    setViewMode("grn");
  };

  // Update GRN receive quantity
  const handleUpdateGrnReceiveQty = (id: string, qty: number) => {
    setGrnItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, receiveQty: qty } : it)),
    );
  };

  // Remove item from GRN
  const handleRemoveGrnItem = (id: string) => {
    setGrnItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Submit GRN Form
  const handleSubmitGrn = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      `Goods Receipt Note (${grnCode}) submitted successfully for ${selectedPoForGrn?.code || "PO"}`,
      "success",
    );
    setViewMode("list");
  };

  // Print invoice function
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className={isDark ? "dark" : ""}>
      {/* Print Specific CSS to print invoice cleanly as PDF */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #realbiz-po-invoice-print,
          #realbiz-po-invoice-print * {
            visibility: visible !important;
          }
          #realbiz-po-invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${
              toast.type === "success"
                ? "bg-slate-900 text-white border-slate-700/80 dark:bg-white dark:text-slate-900"
                : toast.type === "error"
                  ? "bg-rose-900 text-white border-rose-700"
                  : "bg-indigo-900 text-white border-indigo-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        )}

        <div className="max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-7 space-y-5">
          {/* =========================================================================
              VIEW MODE 1: LIST VIEW (Screenshot 1)
              ========================================================================= */}
          {viewMode === "list" && (
            <>
              {/* Page Header & Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Link
                    href="/dashboard"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Home
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium">
                    <span>Inventory</span>
                    <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Purchase Order List
                  </span>
                </nav>

                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+Create New Purchase Order</span>
                </button>
              </div>

              {/* Filters Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                  {/* Select Date */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        placeholder="Select Date Range"
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Company
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="w-full h-9 pl-3 pr-12 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                      >
                        <option value="RealBiz Pro">RealBiz Pro</option>
                        <option value="Realbiz Group">Realbiz Group</option>
                        <option value="Eastern Housing">Eastern Housing</option>
                      </select>
                      {companyFilter && (
                        <button
                          type="button"
                          onClick={() => setCompanyFilter("")}
                          className="absolute right-6 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Clear company"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Supplier
                    </label>
                    <div className="relative">
                      <select
                        value={supplierFilter}
                        onChange={(e) => {
                          setSupplierFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                      >
                        <option value="">Select an option</option>
                        {suppliers.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Project
                    </label>
                    <div className="relative">
                      <select
                        value={projectFilter}
                        onChange={(e) => {
                          setProjectFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                      >
                        <option value="">Select value</option>
                        {projects.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Title / Name of Work */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Title/Name of Work
                    </label>
                    <div className="relative">
                      <select
                        value={titleFilter}
                        onChange={(e) => {
                          setTitleFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                      >
                        <option value="">Select Title/Name of Work</option>
                        {titlesOfWork.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Task & Reset */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Task
                      </label>
                      <select
                        value={taskFilter}
                        onChange={(e) => {
                          setTaskFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-colors"
                      >
                        <option value="">Select Task</option>
                        {tasks.map((task) => (
                          <option key={task} value={task}>
                            {task}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-8 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      title="Reset Filters"
                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Container Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
                {/* Table Control Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                  {/* Left: Export Buttons & Entries */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => showToast("Exporting to Excel...", "info")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast("Exporting to PDF...", "info")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2">
                      <span>Show</span>
                      <select
                        value={entriesPerPage}
                        onChange={(e) => {
                          setEntriesPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-8 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span>entries</span>
                    </div>
                  </div>

                  {/* Right: Search Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Search:
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder=""
                        className="w-48 sm:w-60 h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1300px]">
                    <thead>
                      <tr className="bg-indigo-600 text-white text-[11px] font-semibold uppercase tracking-wider">
                        {TABLE_HEADERS.map((h) => (
                          <th
                            key={h.key}
                            onClick={() =>
                              h.key !== "action" &&
                              h.key !== "attachment" &&
                              h.key !== "approvalSteps" &&
                              handleSort(h.key as keyof PurchaseOrderRow)
                            }
                            className={`px-3.5 py-3 select-none ${
                              h.align === "right"
                                ? "text-right"
                                : h.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            } ${
                              h.key !== "action" &&
                              h.key !== "attachment" &&
                              h.key !== "approvalSteps"
                                ? "cursor-pointer hover:bg-indigo-700 transition-colors"
                                : ""
                            }`}
                          >
                            <div
                              className={`inline-flex items-center gap-1 ${
                                h.align === "right"
                                  ? "justify-end"
                                  : h.align === "center"
                                    ? "justify-center"
                                    : "justify-start"
                              }`}
                            >
                              <span>{h.label}</span>
                              {h.key !== "action" &&
                                h.key !== "attachment" &&
                                h.key !== "approvalSteps" && (
                                  <ArrowUpDown className="w-3 h-3 text-indigo-200" />
                                )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                      {visibleRows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* ID */}
                          <td className="px-3.5 py-3 font-medium text-slate-700 dark:text-slate-300">
                            {row.id}
                          </td>

                          {/* PROJECT TYPE */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {row.projectType}
                          </td>

                          {/* PROJECT */}
                          <td className="px-3.5 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                            {row.project}
                          </td>

                          {/* TITLE / WORK */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                            {row.titleOfWork || "—"}
                          </td>

                          {/* TASK */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {row.task || "—"}
                          </td>

                          {/* SUPPLIER NAME */}
                          <td className="px-3.5 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                            {row.supplierName}
                          </td>

                          {/* CODE */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                              {row.code}
                            </span>
                          </td>

                          {/* REFERENCE */}
                          <td className="px-3.5 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.reference || "—"}
                          </td>

                          {/* DATE */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {row.date}
                          </td>

                          {/* SUB TOTAL */}
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-300">
                            {formatCurrency(row.subTotal)}
                          </td>

                          {/* GRAND TOTAL */}
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(row.grandTotal)}
                          </td>

                          {/* ADDED BY */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {row.addedBy}
                          </td>

                          {/* APPROVAL LAYER */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>All Approvals Completed</span>
                            </span>
                          </td>

                          {/* NOTE */}
                          <td
                            className="px-3.5 py-3 max-w-[150px] truncate text-slate-500 dark:text-slate-400"
                            title={row.note}
                          >
                            {row.note || "—"}
                          </td>

                          {/* ATTACHMENT */}
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            {row.attachment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  showToast(`Opening ${row.attachment}`, "info")
                                }
                                title={row.attachment}
                                className="inline-flex items-center justify-center p-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">
                                —
                              </span>
                            )}
                          </td>

                          {/* ACTION BUTTON WITH EXACT IMAGE 1 DROPDOWN (View & GRN) */}
                          <td className="px-3.5 py-3 text-center relative whitespace-nowrap">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionId(
                                    activeActionId === row.id ? null : row.id,
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#5D5FEF] hover:bg-[#4E50E0] text-white shadow-sm transition-all cursor-pointer"
                              >
                                <span>Action</span>
                                <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                              </button>

                              {/* Exact Action Dropdown matching Image 1: View (purple) & GRN (green) */}
                              {activeActionId === row.id && (
                                <div
                                  ref={actionMenuRef}
                                  className="absolute right-0 top-9 z-30 w-36 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-2 space-y-2 animate-in fade-in-50 zoom-in-95 duration-100"
                                >
                                  {/* View Button (Purple matching Image 1) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInvoiceOrder(row);
                                      setActiveActionId(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] shadow-sm transition-all cursor-pointer active:scale-95"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>

                                  {/* GRN Button (Green matching Image 1) */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenGrnForm(row)}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] shadow-sm transition-all cursor-pointer active:scale-95"
                                  >
                                    <ArrowDownToLine className="w-3.5 h-3.5" />
                                    <span>GRN</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {visibleRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={TABLE_HEADERS.length}
                            className="px-4 py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                              <span>
                                No purchase orders match your filter criteria.
                              </span>
                              <button
                                type="button"
                                onClick={handleResetFilters}
                                className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                              >
                                Clear all filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Showing {sortedRows.length === 0 ? 0 : startIdx + 1} to{" "}
                    {Math.min(startIdx + entriesPerPage, sortedRows.length)} of{" "}
                    {sortedRows.length} entries
                  </span>

                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      type="button"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            page === safePage
                              ? "bg-[#5D5FEF] text-white font-semibold shadow-2xs"
                              : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              VIEW MODE 2: GOODS RECEIPT NOTE (GRN) CREATION FORM (Matching Screenshot 3)
              ========================================================================= */}
          {viewMode === "grn" && selectedPoForGrn && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Header & Back Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Link
                    href="/dashboard"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Home
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium">
                    <span>Inventory</span>
                    <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Goods Receipt Note(GRN)
                  </span>
                </nav>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <span>«Purchase Order List</span>
                  </button>
                  <Link
                    href="/dashboard/procurement/grn/goods-receipt-note"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <span>«Goods Receipt Note(GRN) List</span>
                  </Link>
                </div>
              </div>

              {/* Reference Header Banner matching Screenshot 3 */}
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 py-1">
                Ref:- PO No:- {selectedPoForGrn.code}, PO Date:-
                {selectedPoForGrn.date} , RFQ:-{" "}
                {selectedPoForGrn.rfqCode || "R-046"}
              </div>

              {/* Form Card Grid */}
              <form onSubmit={handleSubmitGrn} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
                  {/* Row 1: Date, Supplier, Code, Project Type, Project */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        value={grnDate}
                        onChange={(e) => setGrnDate(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Supplier */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Supplier
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={grnSupplier}
                          onChange={(e) => setGrnSupplier(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsAddSupplierModalOpen(true)}
                          className="w-9 h-9 flex items-center justify-center rounded-md bg-[#5D5FEF] hover:bg-[#4E50E0] text-white shrink-0"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Code */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Code
                      </label>
                      <input
                        type="text"
                        value={grnCode}
                        onChange={(e) => setGrnCode(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Project Type */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Project Type
                      </label>
                      <input
                        type="text"
                        value={grnProjectType}
                        onChange={(e) => setGrnProjectType(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Project
                      </label>
                      <input
                        type="text"
                        value={grnProject}
                        onChange={(e) => setGrnProject(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Title/Name of Work, If Task, Site */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {/* Title/Name of Work */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Title/Name of Work
                      </label>
                      <div className="relative flex items-center">
                        <select
                          value={grnTitleOfWork}
                          onChange={(e) => setGrnTitleOfWork(e.target.value)}
                          className="w-full h-9 pl-3 pr-10 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="Design Cost">Design Cost</option>
                          <option value="Bricks Works">Bricks Works</option>
                          <option value="Civil Work">Civil Work</option>
                          <option value="Electrical Work">
                            Electrical Work
                          </option>
                        </select>
                        {grnTitleOfWork && (
                          <button
                            type="button"
                            onClick={() => setGrnTitleOfWork("")}
                            className="absolute right-6 p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
                      </div>
                    </div>

                    {/* If Task */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        If Task
                      </label>
                      <div className="relative">
                        <select
                          value={grnTask}
                          onChange={(e) => setGrnTask(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Task</option>
                          <option value="Foundation">Foundation</option>
                          <option value="Decoration">Decoration</option>
                          <option value="Wiring">Wiring</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Site */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Site
                      </label>
                      <div className="relative">
                        <select
                          value={grnSite}
                          onChange={(e) => setGrnSite(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Site</option>
                          <option value="Site 01 - Hena Heights">
                            Site 01 - Hena Heights
                          </option>
                          <option value="Site 02 - Lake Garden">
                            Site 02 - Lake Garden
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRN Items Table matching Screenshot 3 */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-[#5D5FEF] text-white text-[11px] font-semibold uppercase tracking-wider">
                          <th className="px-3.5 py-2.5">ITEM CODE</th>
                          <th className="px-3.5 py-2.5">ITEM NAME</th>
                          <th className="px-3.5 py-2.5">UNIT</th>
                          <th className="px-3.5 py-2.5">QTY</th>
                          <th className="px-3.5 py-2.5">RECEIVE QTY</th>
                          <th className="px-3.5 py-2.5">ALREADY RECEIVE QTY</th>
                          <th className="px-3.5 py-2.5 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {grnItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* ITEM CODE */}
                            <td className="px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                              {item.itemCode}
                            </td>

                            {/* ITEM NAME */}
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                              {item.itemName}
                            </td>

                            {/* UNIT */}
                            <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                              {item.unit}
                            </td>

                            {/* QTY */}
                            <td className="px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                              {item.quantity}
                            </td>

                            {/* RECEIVE QTY (Input field) */}
                            <td className="px-3.5 py-2.5">
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={item.receiveQty}
                                onChange={(e) =>
                                  handleUpdateGrnReceiveQty(
                                    item.id,
                                    Number(e.target.value),
                                  )
                                }
                                className="w-24 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* ALREADY RECEIVE QTY */}
                            <td className="px-3.5 py-2.5 font-medium text-slate-600 dark:text-slate-400">
                              {item.alreadyReceiveQty}
                            </td>

                            {/* ACTION (Trash icon in red button) */}
                            <td className="px-3.5 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveGrnItem(item.id)}
                                title="Delete item from GRN"
                                className="p-1.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {grnItems.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500"
                            >
                              No items selected for this Goods Receipt Note.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Section: Notes, Attachment, Preview & Submit Button */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Note / Comments */}
                    <div className="md:col-span-5 space-y-1">
                      <div className="inline-block px-3 py-1 bg-[#5D5FEF] text-white text-[11px] font-semibold rounded-t-md">
                        NOTE/COMMENTS
                      </div>
                      <textarea
                        rows={3}
                        value={grnNote}
                        onChange={(e) => setGrnNote(e.target.value)}
                        placeholder="Add GRN receipt remarks..."
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    {/* Attachment */}
                    <div className="md:col-span-4 space-y-1">
                      <div className="inline-block px-3 py-1 bg-[#5D5FEF] text-white text-[11px] font-semibold rounded-t-md">
                        ATTACHMENT
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-between h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 cursor-pointer hover:border-slate-300 transition-colors">
                          <span className="truncate">
                            {grnAttachmentName || "Choose File"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {grnAttachmentName ? "" : "No file chosen"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setGrnAttachmentName(file.name);
                                showToast(
                                  `Attached file: ${file.name}`,
                                  "info",
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Signature / Image Preview Area */}
                    <div className="md:col-span-3 flex justify-end">
                      <div className="w-28 h-20 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300">
                        <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button Centered */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      className="px-8 py-2 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm transition-all cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              VIEW MODE 3: CREATE PURCHASE ORDER FORM (Screenshot 2 from previous request)
              ========================================================================= */}
          {viewMode === "create" && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Header & Back Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Link
                    href="/dashboard"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Home
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium">
                    <span>Inventory</span>
                    <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Purchase
                  </span>
                </nav>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0] shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <span>«Purchase Order List</span>
                </button>
              </div>

              {/* Form Card Grid */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setViewMode("list");
                  showToast("Purchase order saved successfully", "success");
                }}
                className="space-y-5"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4 transition-colors">
                  {/* Row 1: Date, Supplier, Code, Project Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Date
                      </label>
                      <input
                        type="text"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Supplier<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={formSupplier}
                          onChange={(e) => setFormSupplier(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                        >
                          <option value="">Select an option</option>
                          {suppliers.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsAddSupplierModalOpen(true)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#5D5FEF] hover:bg-[#4E50E0] text-white shrink-0"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Code
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Project Type
                      </label>
                      <select
                        value={formProjectType}
                        onChange={(e) => setFormProjectType(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Project Type</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Project, Title/Name of Work, If Task, Site */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Project
                      </label>
                      <select
                        value={formProject}
                        onChange={(e) => setFormProject(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Title/Name of Work
                      </label>
                      <select
                        value={formTitleOfWork}
                        onChange={(e) => setFormTitleOfWork(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Title/Name of Work</option>
                        <option value="Design Cost">Design Cost</option>
                        <option value="Bricks Works">Bricks Works</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        If Task
                      </label>
                      <select
                        value={formTask}
                        onChange={(e) => setFormTask(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Task</option>
                        <option value="Foundation">Foundation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Site
                      </label>
                      <select
                        value={formSite}
                        onChange={(e) => setFormSite(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Site</option>
                        <option value="Site 01 - Hena Heights">
                          Site 01 - Hena Heights
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Category, Select Item, Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Category</option>
                        <option value="Civil Materials">Civil Materials</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Select Item
                      </label>
                      <select
                        value={formSelectedItem}
                        onChange={(e) => setFormSelectedItem(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">Select Item</option>
                        {CATALOG_ITEMS.map((item) => (
                          <option key={item.itemCode} value={item.itemCode}>
                            {item.itemName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Note
                      </label>
                      <textarea
                        rows={2}
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4E50E0]"
                  >
                    Save Purchase Order
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL / VIEW: PRINTABLE REALBIZ PURCHASE ORDER INVOICE PDF (Screenshot 2)
            ========================================================================= */}
        {invoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-150">
            <div className="flex flex-col items-center w-full max-w-[900px] my-auto">
              {/* Modal Top Control Bar (Hidden when printing/saving PDF) */}
              <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-t-xl shadow-lg border border-slate-700/80 print-hide">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    Purchase Order Invoice Preview
                  </span>
                  <span className="text-xs font-mono bg-indigo-600 text-white px-2 py-0.5 rounded">
                    {invoiceOrder.code}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast("Downloading PDF...", "info");
                      handlePrintInvoice();
                    }}
                    className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable White Sheet matching Screenshot 2 Exactly with RealBiz Branding */}
              <div
                id="realbiz-po-invoice-print"
                className="w-full bg-white text-slate-900 shadow-2xl rounded-b-xl p-8 sm:p-12 font-sans border border-slate-200 text-xs print:border-none print:shadow-none print:p-0 print:m-0"
              >
                {/* Header: Logo (Left) | Purchase Order #{invoiceOrder.code} (Center) | RealBiz Pro (Right) */}
                <div className="flex items-start justify-between pb-4">
                  {/* Left: Tree Logo & Brand */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-full border border-emerald-600/40 p-1 flex items-center justify-center bg-white shadow-2xs">
                      <Image
                        src="/logo.svg"
                        alt="RealBiz Pro"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-[10px] leading-tight font-medium text-slate-600">
                      RealBiz Pro
                    </div>
                  </div>

                  {/* Center: Title */}
                  <div className="text-center font-bold text-base sm:text-lg text-slate-900">
                    Purchase Order #{invoiceOrder.code}
                  </div>

                  {/* Right: Company Name */}
                  <div className="text-right text-xs font-semibold text-slate-800">
                    RealBiz Pro
                  </div>
                </div>

                {/* Vendor & Shipping Details Box matching Screenshot 2 */}
                <div className="border border-slate-800 my-4 text-xs">
                  <div className="grid grid-cols-2 divide-x divide-slate-800">
                    {/* Left Column: Vendor Info */}
                    <div className="p-2.5 space-y-1">
                      <div>
                        <span className="font-bold">Vendor Name: </span>
                        <span>
                          {invoiceOrder.supplierName.replace(/_+$/, "")}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Address: </span>
                        <span>
                          {invoiceOrder.supplierAddress || "Motijheel"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Mobile: </span>
                        <span>
                          {invoiceOrder.supplierMobile || "01312345695"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Email: </span>
                        <span>{invoiceOrder.supplierEmail || "N/A"}</span>
                      </div>
                    </div>

                    {/* Right Column: Shipping Info */}
                    <div className="p-2.5">
                      <div>
                        <span className="font-bold">Shipping Address: </span>
                        <span>
                          {invoiceOrder.shippingAddress || "Motijheel"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Referral, Reference, Date, Project Grid */}
                <div className="grid grid-cols-4 gap-2 my-4 text-xs font-medium">
                  <div>
                    <span className="font-bold block">Purchase Referral:</span>
                    <span>{invoiceOrder.addedBy || "Admin"}</span>
                  </div>
                  <div>
                    <span className="font-bold block">Reference:</span>
                    <span>{invoiceOrder.reference || "REC00105"}</span>
                  </div>
                  <div>
                    <span className="font-bold block">Date:</span>
                    <span>{invoiceOrder.date}</span>
                  </div>
                  <div>
                    <span className="font-bold block">Project:</span>
                    <span>{invoiceOrder.project}</span>
                  </div>
                </div>

                {/* Items Table matching Screenshot 2 */}
                <div className="my-4 border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 font-bold bg-slate-50/50">
                        <th className="p-2 border-r border-slate-800 w-12 text-center">
                          SL
                        </th>
                        <th className="p-2 border-r border-slate-800">NAME</th>
                        <th className="p-2 border-r border-slate-800">
                          DESCRIPTION
                        </th>
                        <th className="p-2 border-r border-slate-800 text-center w-24">
                          QTY
                        </th>
                        <th className="p-2 border-r border-slate-800 text-right w-24">
                          UNIT PRICE
                        </th>
                        <th className="p-2 text-right w-28">NET TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {invoiceOrder.items && invoiceOrder.items.length > 0 ? (
                        invoiceOrder.items.map((it, idx) => (
                          <tr key={it.id}>
                            <td className="p-2 border-r border-slate-800 text-center">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-800 font-medium">
                              {it.itemName}
                            </td>
                            <td className="p-2 border-r border-slate-800 text-slate-600">
                              {it.details}
                            </td>
                            <td className="p-2 border-r border-slate-800 text-center">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="p-2 border-r border-slate-800 text-right tabular-nums">
                              {formatCurrency(it.rate)}
                            </td>
                            <td className="p-2 text-right font-medium tabular-nums">
                              {formatCurrency(it.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 border-r border-slate-800 text-center">
                            1
                          </td>
                          <td className="p-2 border-r border-slate-800 font-medium">
                            Cylinder Set
                          </td>
                          <td className="p-2 border-r border-slate-800 text-slate-600"></td>
                          <td className="p-2 border-r border-slate-800 text-center">
                            10 Set
                          </td>
                          <td className="p-2 border-r border-slate-800 text-right tabular-nums">
                            400.00
                          </td>
                          <td className="p-2 text-right font-medium tabular-nums">
                            4,000.00
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      {/* QTY Subtotal beneath QTY column */}
                      <tr className="border-t border-slate-800 font-medium">
                        <td
                          colSpan={3}
                          className="p-2 border-r border-slate-800 text-right"
                        ></td>
                        <td className="p-2 border-r border-slate-800 text-center font-bold">
                          {invoiceOrder.items?.reduce(
                            (sum, i) => sum + i.quantity,
                            0,
                          ) || 10}
                        </td>
                        <td colSpan={2} className="p-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Subtotal & Grand Total Box on Right */}
                <div className="flex justify-end my-3">
                  <div className="w-64 border border-slate-800 text-xs">
                    <div className="flex justify-between p-2 border-b border-slate-800">
                      <span className="font-bold">Subtotal</span>
                      <span className="tabular-nums">
                        {formatCurrency(invoiceOrder.subTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 font-bold bg-slate-50/50">
                      <span>Grand Total</span>
                      <span className="tabular-nums">
                        {formatCurrency(invoiceOrder.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount in words */}
                <div className="my-3 font-medium text-xs">
                  <span className="font-bold">Amount in words: </span>
                  <span>{numberToWords(invoiceOrder.grandTotal)}</span>
                </div>

                {/* Terms and Conditions Exactly Matching Screenshot 2 */}
                <div className="mt-5 space-y-1.5 text-[11px] text-slate-800 leading-relaxed border-t border-slate-200 pt-3">
                  <div className="font-bold text-xs">Terms and Conditions:</div>
                  <p>
                    1. Price: The price is including VAT, AIT 2% and carrying up
                    to the delivery point (mentioned below) with loading.
                  </p>
                  <p>
                    2. AIT will be deducted as per applicable government law.
                  </p>
                  <p>
                    3. Supplier will provide VAT Challan as per applicable
                    government law.
                  </p>
                  <p>
                    4. Payment will be made through Current Dated Account payee
                    cheque / RTGS in favor of Premier Cement Mills PLC.
                  </p>
                  <p>
                    5. Delivery Location: Chanpara, Barati Bazar, Kalapara,
                    Patuakhali. Contact Person Mr. Nitai Basak 01948-734 619 and
                    Mr Mehedi 01719-45 76 91
                  </p>
                  <p>
                    6. Delivery schedule: On 06 September, 2026. 7. Delivery
                    challan has to be sent at the delivery time & Bill have to
                    send within 7 working days.
                  </p>
                  <p className="font-medium text-slate-700 mt-2">
                    N.B: The materials would be taken to BUET for the required
                    tests as per standard from site. In any case of
                    disqualification of the same your company have to replace
                    the materials at your own cost or take back the material by
                    reimbursing the payment in cash.
                  </p>
                </div>

                {/* Signatures at Bottom */}
                <div className="grid grid-cols-3 gap-6 pt-16 mt-6 border-t border-slate-200 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold">
                      Prepared By: {invoiceOrder.addedBy || "Admin"}
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold">
                      Checked By
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 font-semibold">
                      Authorized Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Supplier Modal */}
        {isAddSupplierModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Add New Supplier
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Apex Engineering Ltd"
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSupplierName.trim()) return;
                    if (viewMode === "grn") {
                      setGrnSupplier(newSupplierName.trim());
                    } else {
                      setFormSupplier(newSupplierName.trim());
                    }
                    setIsAddSupplierModalOpen(false);
                    setNewSupplierName("");
                    showToast(
                      `Supplier "${newSupplierName.trim()}" selected`,
                      "success",
                    );
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#5D5FEF] hover:bg-[#4E50E0] transition-colors"
                >
                  Add Supplier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
