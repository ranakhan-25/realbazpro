"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  ArrowLeftRight,
  SquarePen,
  Trash2,
  X,
  Search,
  Check,
  Calendar,
  FileText,
  Printer,
  Eye,
  Paperclip,
  CheckCircle2,
  Building2,
  User,
  Layers,
  FileSearch,
  CheckSquare,
  RotateCcw,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Percent,
} from "lucide-react";

// ==========================================
// Types & Interfaces
// ==========================================
export interface RfqItemRow {
  id: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  quantity: number;
  rate: number;
  requiredQty: number;
  purchaseQty: number;
  stockQty: number;
  amount: number;
}

export interface RfqRecord {
  id: number;
  projectType: string;
  project: string;
  supplierName: string;
  code: string;
  reference: string;
  date: string;
  subTotal: number;
  grandTotal: number;
  addedBy: string;
  attachmentCount: number;
  attachmentName?: string;
  titleOfWork?: string;
  requisition?: string;
  task?: string;
  site?: string;
  category?: string;
  items: RfqItemRow[];
}

interface CatalogItem {
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  category: string;
  defaultRate: number;
  stockQty: number;
}

const SAMPLE_CATALOG_ITEMS: CatalogItem[] = [
  {
    itemCode: "GLS-001",
    itemName: '5mm Tinted Clear Belgian Glass',
    details: "UV resistant float glass for exterior facade",
    unit: "Sft",
    category: "Glass & Thai Aluminium",
    defaultRate: 78,
    stockQty: 120,
  },
  {
    itemCode: "ALM-002",
    itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
    details: "Powder coated heavy gauge sliding profile",
    unit: "Rft",
    category: "Glass & Thai Aluminium",
    defaultRate: 145,
    stockQty: 350,
  },
  {
    itemCode: "CMT-001",
    itemName: "Seven Rings Gold PCC 42.5N Cement",
    details: "Portland Composite Cement standard strength",
    unit: "Bag",
    category: "Civil Materials",
    defaultRate: 580,
    stockQty: 450,
  },
  {
    itemCode: "STL-001",
    itemName: "BSRM 16mm TMT 500W High Strength Bar",
    details: "Thermo-mechanically treated rebar (Grade 500W)",
    unit: "Kg",
    category: "Steel & Rebar",
    defaultRate: 98,
    stockQty: 8500,
  },
  {
    itemCode: "SND-001",
    itemName: "Sylhet Coarse Sand (FM 2.5)",
    details: "Washed river sand for high-strength casting",
    unit: "Cft",
    category: "Civil Materials",
    defaultRate: 65,
    stockQty: 1800,
  },
  {
    itemCode: "BRK-001",
    itemName: "First Class Auto Bricks (Gas Fired)",
    details: "High crushing strength standard size",
    unit: "Pcs",
    category: "Civil Materials",
    defaultRate: 14,
    stockQty: 12000,
  },
  {
    itemCode: "HDW-001",
    itemName: "Stainless Steel SS-304 Heavy Sliding Rollers",
    details: "Twin nylon bearing rollers for heavy thai shutters",
    unit: "Pair",
    category: "Hardware & Sanitary",
    defaultRate: 320,
    stockQty: 80,
  },
];

// Initial 16 RFQ Records exactly matching user's Screenshot 2
const INITIAL_RFQ_RECORDS: RfqRecord[] = [
  {
    id: 1,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Delta Glass & Aluminium__",
    code: "R-043",
    reference: "REC00102",
    date: "19 Oct 2026",
    subTotal: 39000,
    grandTotal: 39000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Glass & Aluminium Fitting",
    requisition: "REQ-2026-102",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-1",
        itemCode: "GLS-001",
        itemName: '5mm Tinted Clear Belgian Glass',
        details: "Belgian tint for exterior facade",
        unit: "Sft",
        quantity: 500,
        rate: 78,
        requiredQty: 500,
        purchaseQty: 0,
        stockQty: 120,
        amount: 39000,
      },
    ],
  },
  {
    id: 2,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Mohin Business solution__",
    code: "R-042",
    reference: "REC00102",
    date: "19 Oct 2026",
    subTotal: 39000,
    grandTotal: 39000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Glass & Aluminium Fitting",
    requisition: "REQ-2026-102",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-2",
        itemCode: "GLS-001",
        itemName: '5mm Tinted Clear Belgian Glass',
        details: "Standard clear facade glass",
        unit: "Sft",
        quantity: 500,
        rate: 78,
        requiredQty: 500,
        purchaseQty: 0,
        stockQty: 120,
        amount: 39000,
      },
    ],
  },
  {
    id: 3,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Rifat Thai House__Rifat Thai House",
    code: "R00035",
    reference: "REC00102",
    date: "19 Oct 2026",
    subTotal: 39000,
    grandTotal: 39000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Glass & Aluminium Fitting",
    requisition: "REQ-2026-102",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-3",
        itemCode: "GLS-001",
        itemName: '5mm Tinted Clear Belgian Glass',
        details: "Grade A float glass",
        unit: "Sft",
        quantity: 500,
        rate: 78,
        requiredQty: 500,
        purchaseQty: 0,
        stockQty: 120,
        amount: 39000,
      },
    ],
  },
  {
    id: 4,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Mohin Business solution__",
    code: "R-040",
    reference: "REC00100",
    date: "18 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-100",
    task: "Exterior Facade",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-4",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Window section frames",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 5,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Rifat Thai House__Rifat Thai House",
    code: "R-039",
    reference: "REC00100",
    date: "18 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-100",
    task: "Exterior Facade",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-5",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Section bronze finish",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 6,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Safety First Suppliers__",
    code: "R00034",
    reference: "REC00100",
    date: "18 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-100",
    task: "Exterior Facade",
    site: "Site 01 - Hena Heights",
    category: "Hardware & Sanitary",
    items: [
      {
        id: "rfq-it-6",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Heavy sliding profile",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 7,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Riva Steel Mils__",
    code: "R-037",
    reference: "REC00101",
    date: "18 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-101",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-7",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Silver anodized finish",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 8,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Riva Steel Mils__",
    code: "R00033",
    reference: "REC00101",
    date: "18 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-101",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-8",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Standard aluminium profile",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 9,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Rifat Thai House__Rifat Thai House",
    code: "R00032",
    reference: "REC00099",
    date: "17 Oct 2026",
    subTotal: 24050,
    grandTotal: 24050,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Thai Aluminium Windows",
    requisition: "REQ-2026-099",
    task: "Floor 4-8 Fittings",
    site: "Site 01 - Hena Heights",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-9",
        itemCode: "ALM-002",
        itemName: 'Thai Aluminium Section 1.5mm (Silver / Bronze)',
        details: "Door and window frames",
        unit: "Rft",
        quantity: 165,
        rate: 145,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 80,
        amount: 23925,
      },
    ],
  },
  {
    id: 10,
    projectType: "Real Estate",
    project: "Lake Garden",
    supplierName: "Akash Bepari__",
    code: "R-034",
    reference: "REC00096",
    date: "08 Oct 2026",
    subTotal: 2000,
    grandTotal: 2000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Civil Construction",
    requisition: "REQ-2026-096",
    task: "Procurement Phase 1",
    site: "Site 02 - Lake Garden",
    category: "Civil Materials",
    items: [
      {
        id: "rfq-it-10",
        itemCode: "BRK-001",
        itemName: "First Class Auto Bricks (Gas Fired)",
        details: "Sample testing bricks",
        unit: "Pcs",
        quantity: 140,
        rate: 14.28,
        requiredQty: 140,
        purchaseQty: 0,
        stockQty: 500,
        amount: 2000,
      },
    ],
  },
  {
    id: 11,
    projectType: "Real Estate",
    project: "Lake Garden",
    supplierName: "Akash Bepari__",
    code: "R-033",
    reference: "REC00096",
    date: "08 Oct 2026",
    subTotal: 45000,
    grandTotal: 45000,
    addedBy: "Admin",
    attachmentCount: 1,
    attachmentName: "brick_test_report.pdf",
    titleOfWork: "Civil Construction",
    requisition: "REQ-2026-096",
    task: "Procurement Phase 1",
    site: "Site 02 - Lake Garden",
    category: "Civil Materials",
    items: [
      {
        id: "rfq-it-11",
        itemCode: "BRK-001",
        itemName: "First Class Auto Bricks (Gas Fired)",
        details: "Lot delivery for basement wall",
        unit: "Pcs",
        quantity: 3200,
        rate: 14,
        requiredQty: 3200,
        purchaseQty: 0,
        stockQty: 1200,
        amount: 44800,
      },
    ],
  },
  {
    id: 12,
    projectType: "Real Estate",
    project: "Lake Garden",
    supplierName: "Seven Rings Cement Co.",
    code: "R-031",
    reference: "REC00094",
    date: "05 Oct 2026",
    subTotal: 85000,
    grandTotal: 85000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Civil Construction",
    requisition: "REQ-2026-094",
    task: "Procurement Phase 1",
    site: "Site 02 - Lake Garden",
    category: "Civil Materials",
    items: [
      {
        id: "rfq-it-12",
        itemCode: "CMT-001",
        itemName: "Seven Rings Gold PCC 42.5N Cement",
        details: "50kg standard bags",
        unit: "Bag",
        quantity: 150,
        rate: 566.66,
        requiredQty: 150,
        purchaseQty: 0,
        stockQty: 80,
        amount: 85000,
      },
    ],
  },
  {
    id: 13,
    projectType: "Real Estate",
    project: "Somikoron Tower",
    supplierName: "BSRM Steel Ltd",
    code: "R-030",
    reference: "REC00092",
    date: "03 Oct 2026",
    subTotal: 125000,
    grandTotal: 125000,
    addedBy: "Admin",
    attachmentCount: 1,
    attachmentName: "bsrm_mill_test_certificate.pdf",
    titleOfWork: "Structural Framework",
    requisition: "REQ-2026-092",
    task: "Procurement Phase 1",
    site: "Dhaka Main Site",
    category: "Steel & Rebar",
    items: [
      {
        id: "rfq-it-13",
        itemCode: "STL-001",
        itemName: "BSRM 16mm TMT 500W High Strength Bar",
        details: "Direct mill bundle delivery",
        unit: "Kg",
        quantity: 1280,
        rate: 97.65,
        requiredQty: 1280,
        purchaseQty: 0,
        stockQty: 4000,
        amount: 125000,
      },
    ],
  },
  {
    id: 14,
    projectType: "Commercial",
    project: "Banani Hub",
    supplierName: "Smart Hardware Solutions",
    code: "R-029",
    reference: "REC00090",
    date: "02 Oct 2026",
    subTotal: 18500,
    grandTotal: 18500,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Hardware & Lock Fittings",
    requisition: "REQ-2026-090",
    task: "Procurement Phase 1",
    site: "Banani Corporate Hub",
    category: "Hardware & Sanitary",
    items: [
      {
        id: "rfq-it-14",
        itemCode: "HDW-001",
        itemName: "Stainless Steel SS-304 Heavy Sliding Rollers",
        details: "Twin bearing rollers",
        unit: "Pair",
        quantity: 60,
        rate: 308.33,
        requiredQty: 60,
        purchaseQty: 0,
        stockQty: 40,
        amount: 18500,
      },
    ],
  },
  {
    id: 15,
    projectType: "Commercial",
    project: "Banani Hub",
    supplierName: "Delta Glass & Aluminium__",
    code: "R-028",
    reference: "REC00088",
    date: "01 Oct 2026",
    subTotal: 42000,
    grandTotal: 42000,
    addedBy: "Admin",
    attachmentCount: 0,
    titleOfWork: "Glass & Aluminium Fitting",
    requisition: "REQ-2026-088",
    task: "Floor 4-8 Fittings",
    site: "Banani Corporate Hub",
    category: "Glass & Thai Aluminium",
    items: [
      {
        id: "rfq-it-15",
        itemCode: "GLS-001",
        itemName: '5mm Tinted Clear Belgian Glass',
        details: "Partition glass panels",
        unit: "Sft",
        quantity: 538,
        rate: 78,
        requiredQty: 538,
        purchaseQty: 0,
        stockQty: 100,
        amount: 42000,
      },
    ],
  },
  {
    id: 16,
    projectType: "Real Estate",
    project: "Hena Heights",
    supplierName: "Bengal Cement Supply__",
    code: "R-027",
    reference: "REC00085",
    date: "01 Oct 2026",
    subTotal: 95000,
    grandTotal: 95000,
    addedBy: "Admin",
    attachmentCount: 2,
    attachmentName: "bengal_cement_quote.pdf",
    titleOfWork: "Civil Construction",
    requisition: "REQ-2026-085",
    task: "Procurement Phase 1",
    site: "Site 01 - Hena Heights",
    category: "Civil Materials",
    items: [
      {
        id: "rfq-it-16",
        itemCode: "CMT-001",
        itemName: "Seven Rings Gold PCC 42.5N Cement",
        details: "Bulk supply for 4th floor roof slab",
        unit: "Bag",
        quantity: 165,
        rate: 575.75,
        requiredQty: 165,
        purchaseQty: 0,
        stockQty: 250,
        amount: 95000,
      },
    ],
  },
];

export default function RequestForQuotationView() {
  const router = useRouter();
  const STORAGE_KEY = "realbiz_rfq_v1";

  // View Mode: "list" (Screenshot 2) vs "create" (Screenshot 1)
  const [viewMode, setViewMode] = useState<"list" | "create">("list");

  // RFQ State
  const [rfqList, setRfqList] = useState<RfqRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter State (Screenshot 2)
  const [filterDate, setFilterDate] = useState("1 October, 2026 - 31 October, 2026");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterCompany, setFilterCompany] = useState("Somikoron IT Ltd");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTitleOfWork, setFilterTitleOfWork] = useState("");
  const [filterRequisition, setFilterRequisition] = useState("");
  const [filterAddedBy, setFilterAddedBy] = useState("");

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<keyof RfqRecord | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dropdown & Action State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Modals State
  const [viewingRfq, setViewingRfq] = useState<RfqRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RfqRecord | null>(null);
  const [showRfqCompareModal, setShowRfqCompareModal] = useState(false);
  const [showSupplierCompareModal, setShowSupplierCompareModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // New Supplier Quick Form State
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // -------------------------------------------------------------
  // Form View State (Screenshot 1)
  // -------------------------------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState("22/10/2026");
  const [formSupplier, setFormSupplier] = useState("");
  const [formCode, setFormCode] = useState("R00036");
  const [formProjectType, setFormProjectType] = useState("Select Project Type");
  const [formProject, setFormProject] = useState("");
  const [formTitleOfWork, setFormTitleOfWork] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formSite, setFormSite] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState("");
  const [formAttachmentName, setFormAttachmentName] = useState<string>("");
  const [formItems, setFormItems] = useState<RfqItemRow[]>([]);

  // Suppliers List
  const [suppliersList, setSuppliersList] = useState<string[]>([
    "Delta Glass & Aluminium__",
    "Mohin Business solution__",
    "Rifat Thai House__Rifat Thai House",
    "Safety First Suppliers__",
    "Riva Steel Mils__",
    "Akash Bepari__",
    "Seven Rings Cement Co.",
    "BSRM Steel Ltd",
    "Smart Hardware Solutions",
    "Bengal Cement Supply__",
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load from localStorage or initialize with sample data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRfqList(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using initial mock data", e);
    }
    setRfqList(INITIAL_RFQ_RECORDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RFQ_RECORDS));
    } catch {}
  }, []);

  // Save to localStorage when changed
  const saveRfqList = (newList: RfqRecord[]) => {
    setRfqList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterDate("1 October, 2026 - 31 October, 2026");
    setFilterCompany("Somikoron IT Ltd");
    setFilterSupplier("");
    setFilterProject("");
    setFilterTitleOfWork("");
    setFilterRequisition("");
    setFilterAddedBy("");
    setSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default", "info");
  };

  // Generate next RFQ Code
  const getNextCode = () => {
    if (rfqList.length === 0) return "R00036";
    const nums = rfqList.map((r) => {
      const match = r.code.match(/R-?0*(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...nums, 35);
    return `R${String(max + 1).padStart(5, "0")}`;
  };

  // Switch to Create Mode (New)
  const handleOpenCreate = () => {
    setEditingId(null);
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    setFormDate(formattedToday);
    setFormSupplier("");
    setFormCode(getNextCode());
    setFormProjectType("Select Project Type");
    setFormProject("");
    setFormTitleOfWork("");
    setFormTask("");
    setFormSite("");
    setFormCategory("");
    setSelectedCatalogItem("");
    setFormAttachmentName("");
    setFormItems([]);
    setViewMode("create");
  };

  // Switch to Edit Mode
  const handleOpenEdit = (record: RfqRecord) => {
    setEditingId(record.id);
    setFormDate(record.date || "22/10/2026");
    setFormSupplier(record.supplierName || "");
    setFormCode(record.code || getNextCode());
    setFormProjectType(record.projectType || "Real Estate");
    setFormProject(record.project || "");
    setFormTitleOfWork(record.titleOfWork || "");
    setFormTask(record.task || "");
    setFormSite(record.site || "");
    setFormCategory(record.category || "");
    setSelectedCatalogItem("");
    setFormAttachmentName(record.attachmentName || "");
    setFormItems(record.items || []);
    setActiveMenuId(null);
    setViewMode("create");
  };

  // Add Item to table from Select Item dropdown
  const handleAddCatalogItem = () => {
    if (!selectedCatalogItem) {
      const newCustomItem: RfqItemRow = {
        id: `rfq-it-${Date.now()}`,
        itemCode: `ITM-NEW-${String(formItems.length + 1).padStart(3, "0")}`,
        itemName: "Custom Procurement Material",
        details: "Specification details",
        unit: "Pcs",
        quantity: 100,
        rate: 50,
        requiredQty: 100,
        purchaseQty: 0,
        stockQty: 20,
        amount: 5000,
      };
      setFormItems((prev) => [...prev, newCustomItem]);
      showToast("Added item row to table", "info");
      return;
    }

    const found = SAMPLE_CATALOG_ITEMS.find((a) => a.itemCode === selectedCatalogItem);
    if (!found) return;

    const existingIndex = formItems.findIndex((it) => it.itemCode === found.itemCode);
    if (existingIndex >= 0) {
      setFormItems((prev) =>
        prev.map((it, idx) => {
          if (idx === existingIndex) {
            const newQty = it.quantity + 50;
            return {
              ...it,
              quantity: newQty,
              amount: newQty * it.rate,
            };
          }
          return it;
        })
      );
      showToast(`Increased quantity for ${found.itemCode}`, "info");
    } else {
      const defaultQty = 100;
      const newItem: RfqItemRow = {
        id: `rfq-it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemCode: found.itemCode,
        itemName: found.itemName,
        details: found.details,
        unit: found.unit,
        quantity: defaultQty,
        rate: found.defaultRate,
        requiredQty: defaultQty,
        purchaseQty: 0,
        stockQty: found.stockQty,
        amount: defaultQty * found.defaultRate,
      };
      setFormItems((prev) => [...prev, newItem]);
      showToast(`Added ${found.itemCode} to table`, "success");
    }
  };

  // Update item field dynamically and recalculate amount
  const handleUpdateItemField = (id: string, field: keyof RfqItemRow, value: string | number) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item };
          if (field === "quantity") {
            const num = typeof value === "string" ? parseFloat(value) || 0 : value;
            updated.quantity = Math.max(0, num);
            updated.amount = updated.quantity * updated.rate;
          } else if (field === "rate") {
            const num = typeof value === "string" ? parseFloat(value) || 0 : value;
            updated.rate = Math.max(0, num);
            updated.amount = updated.quantity * updated.rate;
          } else if (field === "requiredQty" || field === "purchaseQty" || field === "stockQty") {
            const num = typeof value === "string" ? parseFloat(value) || 0 : value;
            updated[field] = num;
          } else {
            (updated as any)[field] = value;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setFormItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Quick Add Supplier
  const handleAddNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      showToast("Supplier Name is required", "error");
      return;
    }
    const cleanName = newSupplierName.trim();
    if (!suppliersList.includes(cleanName)) {
      setSuppliersList((prev) => [cleanName, ...prev]);
    }
    setFormSupplier(cleanName);
    setShowAddSupplierModal(false);
    setNewSupplierName("");
    setNewSupplierPhone("");
    setNewSupplierAddress("");
    showToast(`Supplier ${cleanName} added and selected`, "success");
  };

  // Subtotal & Grand Total calculation
  const formSubtotal = useMemo(() => {
    return formItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [formItems]);

  const formGrandTotal = formSubtotal;

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSupplier || formSupplier === "Select an option") {
      showToast("Please select a Supplier", "error");
      return;
    }

    if (!formCode.trim()) {
      showToast("RFQ Code is required", "error");
      return;
    }

    if (formItems.length === 0) {
      showToast("Please add at least one item before submitting", "error");
      return;
    }

    if (editingId) {
      const updatedList = rfqList.map((rfq) => {
        if (rfq.id === editingId) {
          return {
            ...rfq,
            date: formDate,
            supplierName: formSupplier,
            code: formCode,
            projectType: formProjectType === "Select Project Type" ? "Real Estate" : formProjectType,
            project: formProject || "Hena Heights",
            titleOfWork: formTitleOfWork || "Material Procurement",
            task: formTask,
            site: formSite,
            category: formCategory,
            attachmentCount: formAttachmentName ? 1 : rfq.attachmentCount,
            attachmentName: formAttachmentName || rfq.attachmentName,
            subTotal: formSubtotal,
            grandTotal: formGrandTotal,
            items: formItems,
          };
        }
        return rfq;
      });
      saveRfqList(updatedList);
      showToast(`RFQ ${formCode} updated successfully`, "success");
    } else {
      const newId = rfqList.length > 0 ? Math.max(...rfqList.map((r) => r.id)) + 1 : 1;
      const newRecord: RfqRecord = {
        id: newId,
        projectType: formProjectType === "Select Project Type" ? "Real Estate" : formProjectType,
        project: formProject || "Hena Heights",
        supplierName: formSupplier,
        code: formCode,
        reference: `REC00${String(100 + newId).padStart(3, "0")}`,
        date: formDate,
        subTotal: formSubtotal,
        grandTotal: formGrandTotal,
        addedBy: "Admin",
        attachmentCount: formAttachmentName ? 1 : 0,
        attachmentName: formAttachmentName,
        titleOfWork: formTitleOfWork || "Material Procurement",
        task: formTask,
        site: formSite,
        category: formCategory,
        items: formItems,
      };

      saveRfqList([newRecord, ...rfqList]);
      showToast(`Request for Quotation ${formCode} created successfully!`, "success");
    }

    setViewMode("list");
  };

  // Delete RFQ
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const remaining = rfqList.filter((r) => r.id !== deleteTarget.id);
    saveRfqList(remaining);
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    showToast(`RFQ ${deleteTarget.code} deleted`, "info");
    setDeleteTarget(null);
  };

  // Bulk Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAndSorted.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sorting
  const handleSort = (field: keyof RfqRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Search Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...rfqList];

    if (filterProject) {
      result = result.filter((r) => r.project.toLowerCase().includes(filterProject.toLowerCase()));
    }

    if (filterSupplier) {
      result = result.filter((r) =>
        r.supplierName.toLowerCase().includes(filterSupplier.toLowerCase())
      );
    }

    if (filterTitleOfWork) {
      result = result.filter((r) =>
        r.titleOfWork?.toLowerCase().includes(filterTitleOfWork.toLowerCase())
      );
    }

    if (filterRequisition) {
      result = result.filter((r) =>
        r.requisition?.toLowerCase().includes(filterRequisition.toLowerCase())
      );
    }

    if (filterAddedBy) {
      result = result.filter((r) =>
        r.addedBy.toLowerCase().includes(filterAddedBy.toLowerCase())
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.projectType.toLowerCase().includes(q) ||
          r.addedBy.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") {
          const comp = (valA as string).localeCompare((valB as string) || "");
          return sortDirection === "asc" ? comp : -comp;
        }

        if (typeof valA === "number") {
          return sortDirection === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }

        return 0;
      });
    }

    return result;
  }, [
    rfqList,
    filterProject,
    filterSupplier,
    filterTitleOfWork,
    filterRequisition,
    filterAddedBy,
    search,
    sortField,
    sortDirection,
  ]);

  // Pagination Logic
  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * entriesPerPage;
  const currentEntries = filteredAndSorted.slice(startIdx, startIdx + entriesPerPage);

  const displayFrom = totalEntries === 0 ? 0 : startIdx + 1;
  const displayTo = Math.min(startIdx + entriesPerPage, totalEntries);

  const filteredCatalogOptions = useMemo(() => {
    if (!formCategory) return SAMPLE_CATALOG_ITEMS;
    return SAMPLE_CATALOG_ITEMS.filter((item) => item.category === formCategory);
  }, [formCategory]);

  // =========================================================================
  // RENDER: CREATE / NEW RFQ VIEW (Screenshot 1)
  // =========================================================================
  if (viewMode === "create") {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
        {toast && (
          <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
            <span>{toast.message}</span>
          </div>
        )}

        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <Link href="/dashboard" className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400">
                Home
              </Link>
              <span className="text-slate-400">›</span>
              <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
                <span>Inventory</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span className="text-slate-400">›</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Request for Quotation(RFQ)</span>
            </nav>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
            >
              <span>«Request for Quotation(RFQ) List</span>
            </button>
          </div>

          {/* Form Card Grid */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Supplier<span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <select
                        value={formSupplier}
                        onChange={(e) => setFormSupplier(e.target.value)}
                        className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs truncate cursor-pointer"
                      >
                        <option value="">Select an option</option>
                        {suppliersList.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddSupplierModal(true)}
                      title="Quick add new supplier"
                      className="shrink-0 w-9 h-[38px] flex items-center justify-center bg-[#6366F1] hover:bg-[#5254d8] text-white rounded-md shadow-2xs transition-all active:scale-95 cursor-pointer"
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
                    className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Type
                  </label>
                  <div className="relative">
                    <select
                      value={formProjectType}
                      onChange={(e) => setFormProjectType(e.target.value)}
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="Select Project Type">Select Project Type</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Internal">Internal</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={formProject}
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Project</option>
                      <option value="Hena Heights">Hena Heights</option>
                      <option value="Lake Garden">Lake Garden</option>
                      <option value="Somikoron Tower">Somikoron Tower</option>
                      <option value="Banani Hub">Banani Hub</option>
                      <option value="Uttara Heights">Uttara Heights</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Title/Name of Work</option>
                      <option value="Glass & Aluminium Fitting">Glass & Aluminium Fitting</option>
                      <option value="Thai Aluminium Windows">Thai Aluminium Windows</option>
                      <option value="Civil Construction">Civil Construction</option>
                      <option value="Structural Framework">Structural Framework</option>
                      <option value="Hardware & Lock Fittings">Hardware & Lock Fittings</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Task</option>
                      <option value="Floor 4-8 Fittings">Floor 4-8 Fittings</option>
                      <option value="Exterior Facade">Exterior Facade</option>
                      <option value="Procurement Phase 1">Procurement Phase 1</option>
                      <option value="Basement Concreting">Basement Concreting</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Site
                  </label>
                  <div className="relative">
                    <select
                      value={formSite}
                      onChange={(e) => setFormSite(e.target.value)}
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Site</option>
                      <option value="Site 01 - Hena Heights">Site 01 - Hena Heights</option>
                      <option value="Site 02 - Lake Garden">Site 02 - Lake Garden</option>
                      <option value="Dhaka Main Site">Dhaka Main Site</option>
                      <option value="Banani Corporate Hub">Banani Corporate Hub</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setSelectedCatalogItem("");
                      }}
                      className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      <option value="Glass & Thai Aluminium">Glass & Thai Aluminium</option>
                      <option value="Civil Materials">Civil Materials</option>
                      <option value="Steel & Rebar">Steel & Rebar</option>
                      <option value="Hardware & Sanitary">Hardware & Sanitary</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Item
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <select
                        value={selectedCatalogItem}
                        onChange={(e) => setSelectedCatalogItem(e.target.value)}
                        className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-7 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs truncate cursor-pointer"
                      >
                        <option value="">Select Item</option>
                        {filteredCatalogOptions.map((catItem) => (
                          <option key={catItem.itemCode} value={catItem.itemCode}>
                            {catItem.itemCode} - {catItem.itemName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCatalogItem}
                      title="Add item to RFQ items table"
                      className="shrink-0 w-9 h-[38px] flex items-center justify-center bg-[#6366F1] hover:bg-[#5254d8] text-white rounded-md shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#6366F1] text-white font-semibold tracking-wide">
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap">ITEM CODE</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap">ITEM NAME</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap">DETAILS</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap">UNIT</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">QUANTITY</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">RATE</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">REQUIRED QTY</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">PURCHASE QTY</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">STOCK QTY</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-right">AMOUNT</th>
                      <th className="py-2.5 px-3 uppercase text-[11px] whitespace-nowrap text-center">ACTION</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                          <FileSearch className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-[1.5]" />
                          <p className="text-xs font-medium">No items added to this quotation.</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Choose an item from the &ldquo;Select Item&rdquo; dropdown above and click the purple &ldquo;+&rdquo; button.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      formItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleUpdateItemField(item.id, "itemCode", e.target.value)}
                              className="w-24 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-3 min-w-[180px]">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleUpdateItemField(item.id, "itemName", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-indigo-400 px-1 py-1 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3 min-w-[160px]">
                            <input
                              type="text"
                              value={item.details}
                              onChange={(e) => handleUpdateItemField(item.id, "details", e.target.value)}
                              placeholder="Specifications"
                              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItemField(item.id, "unit", e.target.value)}
                              className="w-16 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-center text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemField(item.id, "quantity", e.target.value)}
                              className="w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded px-2 py-1 text-xs font-semibold text-right text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) => handleUpdateItemField(item.id, "rate", e.target.value)}
                              className="w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded px-2 py-1 text-xs font-semibold text-right text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.requiredQty}
                              onChange={(e) => handleUpdateItemField(item.id, "requiredQty", e.target.value)}
                              className="w-20 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-600 dark:text-slate-300 focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.purchaseQty}
                              onChange={(e) => handleUpdateItemField(item.id, "purchaseQty", e.target.value)}
                              className="w-18 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-600 dark:text-slate-300 focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.stockQty}
                              onChange={(e) => handleUpdateItemField(item.id, "stockQty", e.target.value)}
                              className="w-18 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-600 dark:text-slate-300 focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {Number(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2]" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Strip: SUBTOTAL, GRAND TOTAL, ATTACHMENT */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                  <div className="bg-[#6366F1] text-white text-[11px] font-semibold uppercase px-4 py-2 tracking-wider">
                    SUBTOTAL
                  </div>
                  <div className="p-3">
                    <input
                      type="text"
                      readOnly
                      value={formSubtotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 focus:outline-none shadow-2xs cursor-default"
                    />
                  </div>
                </div>

                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                  <div className="bg-[#6366F1] text-white text-[11px] font-semibold uppercase px-4 py-2 tracking-wider">
                    GRAND TOTAL
                  </div>
                  <div className="p-3">
                    <input
                      type="text"
                      readOnly
                      value={formGrandTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 focus:outline-none shadow-2xs cursor-default"
                    />
                  </div>
                </div>

                <div>
                  <div className="bg-[#6366F1] text-white text-[11px] font-semibold uppercase px-4 py-2 tracking-wider">
                    ATTACHMENT
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormAttachmentName(file.name);
                            showToast(`Attached: ${file.name}`, "info");
                          }
                        }}
                        className="hidden"
                        id="rfq-attachment-input"
                      />
                      <label
                        htmlFor="rfq-attachment-input"
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer transition-colors shrink-0"
                      >
                        Choose File
                      </label>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                        {formAttachmentName || "No file chosen"}
                      </span>
                      {formAttachmentName && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormAttachmentName("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button Centered */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-12 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <span>Submit</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Add Supplier Modal */}
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>Add New Supplier</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewSupplier} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Apex Industrial Supplies Ltd"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="+880 1700 000000"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Address / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    placeholder="Factory / Office address"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#6366F1] hover:bg-[#5254d8] text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Add &amp; Select
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: LIST VIEW (Screenshot 2)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Top Header & Breadcrumb & 3 Action Buttons (No wrapping on desktop!) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-0.5">
          {/* Breadcrumb Navigation - Never wraps into 2 lines */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-x-auto py-1">
            <Link href="/dashboard" className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400 shrink-0 font-medium">
              Home
            </Link>
            <span className="text-slate-400 shrink-0">›</span>
            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline shrink-0 font-medium">
              <span>Inventory</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <span className="text-slate-400 shrink-0">›</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">
              Request for Quotation(RFQ) List
            </span>
          </nav>

          {/* 3 Action Buttons in a clean single row */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* 1. RFQ Compare (Cyan Button) */}
            <button
              type="button"
              onClick={() => setShowRfqCompareModal(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs sm:text-[13px] font-semibold px-4 py-2 rounded-md shadow-xs transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>RFQ Compare</span>
            </button>

            {/* 2. Supplier Wise Compare (Purple Button) */}
            <button
              type="button"
              onClick={() => setShowSupplierCompareModal(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2 rounded-md shadow-xs transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Supplier Wise Compare</span>
            </button>

            {/* 3. +New Request for Quotation(RFQ) (Green Button) */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-[13px] font-semibold px-4 py-2 rounded-md shadow-xs transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Request for Quotation(RFQ)</span>
            </button>
          </div>
        </div>

        {/* Filter Section: 2 Rows matching Screenshot 2 with perfect date width */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
          {/* Row 1: Select Date, Company, Supplier, Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Select Date - With Date Dropdown Presets to prevent truncation */}
            <div className="relative" ref={datePickerRef}>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Select Date
              </label>
              <div
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 flex items-center justify-between text-xs sm:text-[12.5px] text-slate-800 dark:text-slate-100 cursor-pointer shadow-2xs hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">{filterDate}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

              {/* Date Presets Dropdown */}
              {showDatePicker && (
                <div className="absolute left-0 top-[65px] z-30 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-3 text-xs space-y-2 animate-in fade-in duration-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Quick Date Presets
                  </div>
                  <div className="space-y-1">
                    {[
                      "1 October, 2026 - 31 October, 2026",
                      "1 September, 2026 - 30 September, 2026",
                      "Last 30 Days (22 Sep - 22 Oct 2026)",
                      "Q4 (1 October - 31 December 2026)",
                      "Full Year 2026",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setFilterDate(preset);
                          setShowDatePicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                          filterDate === preset
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company with 'x' icon and chevron */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Company
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-14 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-medium"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5 text-slate-400">
                  {filterCompany && (
                    <button
                      type="button"
                      onClick={() => setFilterCompany("")}
                      className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Supplier
              </label>
              <div className="relative">
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select an option</option>
                  {suppliersList.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Project
              </label>
              <div className="relative">
                <select
                  value={filterProject}
                  onChange={(e) => {
                    setFilterProject(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select value</option>
                  <option value="Hena Heights">Hena Heights</option>
                  <option value="Lake Garden">Lake Garden</option>
                  <option value="Somikoron Tower">Somikoron Tower</option>
                  <option value="Banani Hub">Banani Hub</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Title/Name of Work, Requisition, Added By + Quick Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Title/Name of Work */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title/Name of Work
              </label>
              <div className="relative">
                <select
                  value={filterTitleOfWork}
                  onChange={(e) => {
                    setFilterTitleOfWork(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Title/Name of Work</option>
                  <option value="Glass & Aluminium Fitting">Glass & Aluminium Fitting</option>
                  <option value="Thai Aluminium Windows">Thai Aluminium Windows</option>
                  <option value="Civil Construction">Civil Construction</option>
                  <option value="Structural Framework">Structural Framework</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Requisition */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Requisition
              </label>
              <div className="relative">
                <select
                  value={filterRequisition}
                  onChange={(e) => {
                    setFilterRequisition(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Requisition</option>
                  <option value="REQ-2026-102">REQ-2026-102 (Hena Heights)</option>
                  <option value="REQ-2026-100">REQ-2026-100 (Hena Heights)</option>
                  <option value="REQ-2026-096">REQ-2026-096 (Lake Garden)</option>
                  <option value="REQ-2026-092">REQ-2026-092 (Somikoron Tower)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Added By */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Added By
              </label>
              <div className="relative">
                <select
                  value={filterAddedBy}
                  onChange={(e) => {
                    setFilterAddedBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select User</option>
                  <option value="Admin">Admin</option>
                  <option value="Procurement Manager">Procurement Manager</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick Reset Button in 4th slot */}
            <div className="flex items-center justify-between h-[38px] px-1">
              {(filterSupplier || filterProject || filterTitleOfWork || filterRequisition || filterAddedBy || search) ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Filters Active: <strong className="text-slate-600 dark:text-slate-300">Somikoron IT Ltd</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-md px-4 py-2.5 text-xs animate-in fade-in duration-150">
            <span className="font-medium text-indigo-900 dark:text-indigo-200">
              Selected <strong>{selectedIds.length}</strong> RFQ record(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRfqCompareModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-3 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
              >
                Compare Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => {
                  showToast(`Converting ${selectedIds.length} RFQ(s) to Purchase Orders...`, "info");
                  setSelectedIds([]);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
              >
                Convert to PO
              </button>
              <button
                onClick={() => {
                  const filtered = rfqList.filter((r) => !selectedIds.includes(r.id));
                  saveRfqList(filtered);
                  setSelectedIds([]);
                  showToast("Selected RFQs deleted", "info");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-3 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Table Container Card matching Screenshot 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Controls Bar: Show Entries (Left) & Search (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
            {/* Show Entries */}
            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400">
              <span>Show</span>
              <div className="relative">
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 pr-6 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2.5 pointer-events-none" />
              </div>
              <span>entries</span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400">
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
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-xs text-slate-800 dark:text-slate-100 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Data (Solid Purple Header matching Screenshot 2) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#6366F1] text-white font-semibold tracking-wide">
                  <th
                    onClick={() => handleSort("id")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th className="py-3 px-3 text-center select-none whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>SELECT</span>
                      <input
                        type="checkbox"
                        checked={
                          currentEntries.length > 0 &&
                          currentEntries.every((r) => selectedIds.includes(r.id))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-400 rounded cursor-pointer"
                      />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("projectType")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT TYPE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("project")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("supplierName")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>SUPPLIER NAME</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>CODE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("reference")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>REFERENCE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("date")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>DATE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("subTotal")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>SUB TOTAL</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("grandTotal")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>GRAND TOTAL</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("addedBy")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>ADDED BY</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th className="py-3 px-3.5 select-none whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>ATTACHMENT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th className="py-3 px-3.5 text-center select-none whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>ACTION</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {currentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs font-normal">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  currentEntries.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {row.id}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-800 dark:text-slate-200">
                          {row.projectType}
                        </td>

                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {row.project}
                        </td>

                        <td className="py-3 px-3.5 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                          {row.supplierName}
                        </td>

                        <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.code}
                        </td>

                        <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.reference}
                        </td>

                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.date}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row.subTotal !== null ? row.subTotal.toLocaleString() : "—"}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.grandTotal.toLocaleString()}
                        </td>

                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.addedBy}
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {row.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{row.attachmentCount}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap relative">
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                              }}
                              className="bg-[#6366F1] hover:bg-[#5254d8] text-white text-[11px] font-semibold px-3 py-1 rounded inline-flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer"
                            >
                              <span>Action</span>
                              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                            </button>

                            {activeMenuId === row.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-2 top-9 z-40 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingRfq(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(row)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                >
                                  <SquarePen className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Edit RFQ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    showToast(`Converted RFQ ${row.code} to Purchase Order`, "success");
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                >
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Convert to PO</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    window.print();
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Print / PDF</span>
                                </button>

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Showing 1 to 10 of 16 entries & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalEntries === 0}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#6366F1] text-white"
                      : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalEntries === 0}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RFQ COMPARE MODAL */}
      {/* ========================================================= */}
      {showRfqCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-cyan-500" />
                  <span>Request for Quotation Comparison (RFQ Compare)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparative analysis of quotations received for Hena Heights &amp; Lake Garden
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRfqCompareModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compare Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#6366F1] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">RFQ Code</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Sub Total (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Grand Total (BDT)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rfqList.slice(0, 6).map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        {item.supplierName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-3">{item.project}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.date}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{item.subTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {idx === 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10.5px] font-bold">
                            Lowest Rate
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded text-[10.5px]">
                            Alternative
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRfqCompareModal(false)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-md bg-[#00BCD4] hover:bg-[#00acc1] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Comparison Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUPPLIER WISE COMPARE MODAL */}
      {/* ========================================================= */}
      {showSupplierCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                  <span>Supplier Wise Quotation Comparison Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Itemized pricing breakdown across registered suppliers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupplierCompareModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#6366F1] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Delta Glass</th>
                    <th className="py-2.5 px-3 text-right">Mohin Business</th>
                    <th className="py-2.5 px-3 text-right">Rifat Thai House</th>
                    <th className="py-2.5 px-3 text-center">Best Quote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      5mm Tinted Clear Belgian Glass (500 Sft)
                    </td>
                    <td className="py-2.5 px-3 text-center">Sft</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                      Tk 78 /sft
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 82 /sft</td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 85 /sft</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Delta Glass</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      Thai Aluminium Section 1.5mm Bronze (165 Rft)
                    </td>
                    <td className="py-2.5 px-3 text-center">Rft</td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 148 /rft</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                      Tk 145 /rft
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 146 /rft</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Mohin Business</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      SS-304 Heavy Sliding Rollers (60 Pair)
                    </td>
                    <td className="py-2.5 px-3 text-center">Pair</td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 330 /pr</td>
                    <td className="py-2.5 px-3 text-right font-mono">Tk 320 /pr</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                      Tk 308 /pr
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Rifat Thai</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSupplierCompareModal(false)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW RFQ DETAILS MODAL */}
      {/* ========================================================= */}
      {viewingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>RFQ: {viewingRfq.code}</span>
                  <span className="text-xs font-normal text-slate-500">({viewingRfq.reference})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supplier: <strong>{viewingRfq.supplierName}</strong> | Project: {viewingRfq.project}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRfq(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Project:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRfq.project}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRfq.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Added By:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRfq.addedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Grand Total:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  BDT {viewingRfq.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-2">Item Quotation Breakdown</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#6366F1] text-white">
                    <tr>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingRfq.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">{it.itemCode}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{it.itemName}</td>
                        <td className="py-2 px-3">{it.unit}</td>
                        <td className="py-2 px-3 text-right font-medium">{it.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{it.rate}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{it.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={5} className="py-2 px-3 text-right">Total Amount:</td>
                      <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">{viewingRfq.grandTotal.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingRfq(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingRfq(null);
                  handleOpenEdit(viewingRfq);
                }}
                className="px-4 py-2 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Edit RFQ
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete Request for Quotation{" "}
              <strong className="text-slate-900 dark:text-white">{deleteTarget.code}</strong> from{" "}
              <strong>{deleteTarget.supplierName}</strong>?
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
    </div>
  );
}
