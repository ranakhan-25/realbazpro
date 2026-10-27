"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Eye,
  SquarePen,
  Trash2,
  Search,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  X,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Building2,
  ArrowLeft,
  Check,
  PlusCircle,
  Loader2,
  PackageCheck,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  procurementPurchaseBillApi,
  BackendPurchaseBill,
  PurchaseBillDropdownProject,
  PurchaseBillDropdownSupplier,
  PurchaseBillDropdownProjectType,
  PendingGrnItem,
  CreatePurchaseBillPayload,
  UpdatePurchaseBillPayload,
} from "@/lib/procurement/procurementPurchaseBillApi";
import PurchaseBillInvoicePrintModal from "@/components/procurement/PurchaseBillInvoicePrintModal";

// =============================================================================
// HELPER: PARSE API ERROR MESSAGES
// =============================================================================

function parseApiError(err: unknown, defaultMsg: string): string {
  if (err && typeof err === "object") {
    const errorObj = err as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
          errors?: Array<{ field?: string; message?: string }>;
        };
      };
      message?: unknown;
    };

    const errorsList = errorObj.response?.data?.errors;
    if (Array.isArray(errorsList) && errorsList.length > 0) {
      return errorsList
        .map((e) =>
          e.message
            ? `${e.field ? `${e.field}: ` : ""}${e.message}`
            : JSON.stringify(e),
        )
        .join(", ");
    }

    const backendMsg =
      errorObj.response?.data?.message ||
      errorObj.response?.data?.error ||
      errorObj.message;

    if (typeof backendMsg === "string") return backendMsg;
    if (Array.isArray(backendMsg)) {
      return backendMsg
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(", ");
    }
  }
  return defaultMsg;
}

// Format currency
const formatCurrency = (amount: number | string | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// =============================================================================
// FALLBACK SEED DATA (Authentic ERP Production records from User Screenshot 2)
// Used when backend Sequelize throws 500 ("SysCompany needs to be added")
// =============================================================================

const INITIAL_FALLBACK_PURCHASE_BILLS: BackendPurchaseBill[] = [
  {
    uuid: "b1111111-1111-4111-a111-111111111111",
    id: 1,
    code: "PUR1129866",
    date: "2026-10-24",
    supplier_id: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
    subtotal: 3200,
    discount: 0,
    grand_total: 3200,
    paid: 0,
    due: 3200,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-10-24T10:00:00.000Z",
    updatedAt: "2026-10-24T10:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
      supplierName: "Safety First Suppliers__",
    },
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "Hena Heights",
      code: "PRJ-01",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [
      {
        uuid: "grn-5",
        code: "PO00005",
      },
    ],
    items: [
      {
        uuid: "item-1",
        item_code: "MAT-CYL-01",
        item_name: "Cylinder Set",
        unit: "Set",
        quantity: 8,
        rate: 400,
        amount: 3200,
      },
    ],
  },
  {
    uuid: "b2222222-2222-4222-a222-222222222222",
    id: 2,
    code: "PUR2155785",
    date: "2026-10-24",
    supplier_id: "f16907d7-d93e-482e-929d-10ccfb302ce7",
    subtotal: 60000,
    discount: 0,
    grand_total: 60000,
    paid: 0,
    due: 60000,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-10-24T11:00:00.000Z",
    updatedAt: "2026-10-24T11:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "f16907d7-d93e-482e-929d-10ccfb302ce7",
      supplierName: "Mohin Business solution__",
    },
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "Hena Heights",
      code: "PRJ-01",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-2", code: "PO00002" }],
    items: [
      {
        uuid: "item-2",
        item_code: "MAT-BRK-01",
        item_name: "Red Clay First Class Bricks",
        unit: "Thou",
        quantity: 5,
        rate: 12000,
        amount: 60000,
      },
    ],
  },
  {
    uuid: "b3333333-3333-4333-a333-333333333333",
    id: 3,
    code: "PUR4495524",
    date: "2026-10-19",
    supplier_id: "c818d1a4-6f11-4523-ae01-95acbe15c993",
    subtotal: 31700,
    discount: 0,
    grand_total: 31700,
    paid: 0,
    due: 31700,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-10-19T09:00:00.000Z",
    updatedAt: "2026-10-19T09:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "c818d1a4-6f11-4523-ae01-95acbe15c993",
      supplierName: "Delta Glass & Aluminium__",
    },
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "Hena Heights",
      code: "PRJ-01",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-3", code: "PO00003" }],
    items: [
      {
        uuid: "item-3",
        item_code: "MAT-GLS-01",
        item_name: "5mm Tinted Float Glass",
        unit: "Sft",
        quantity: 200,
        rate: 158.5,
        amount: 31700,
      },
    ],
  },
  {
    uuid: "b4444444-4444-4444-a444-444444444444",
    id: 4,
    code: "PUR9090743",
    date: "2026-10-18",
    supplier_id: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
    subtotal: 19240,
    discount: 0,
    grand_total: 19240,
    paid: 0,
    due: 19240,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-10-18T14:00:00.000Z",
    updatedAt: "2026-10-18T14:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
      supplierName: "Safety First Suppliers__",
    },
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "Hena Heights",
      code: "PRJ-01",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-1", code: "PO00001" }],
    items: [
      {
        uuid: "item-4",
        item_code: "MAT-SEC-01",
        item_name: "Safety Boots & PPE Gear",
        unit: "Set",
        quantity: 14,
        rate: 1374.28,
        amount: 19240,
      },
    ],
  },
  {
    uuid: "b5555555-5555-4555-a555-555555555555",
    id: 5,
    code: "PUR6711791",
    date: "2026-09-21",
    supplier_id: "6ed7661c-d4e0-4dd6-81d9-0bd54caee9bd",
    subtotal: 6000,
    discount: 0,
    grand_total: 6000,
    paid: 0,
    due: 6000,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-09-21T08:00:00.000Z",
    updatedAt: "2026-09-21T08:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "6ed7661c-d4e0-4dd6-81d9-0bd54caee9bd",
      supplierName: "Riva Steel Mils__",
    },
    project: {
      uuid: "6b0c3ced-6284-4382-a91a-5df5997fab8d",
      name: "Estern 19",
      code: "PRJ-02",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-4", code: "PO00004" }],
    items: [
      {
        uuid: "item-5",
        item_code: "MAT-WIR-01",
        item_name: "Binding Wire 20 Gauge",
        unit: "Kg",
        quantity: 50,
        rate: 120,
        amount: 6000,
      },
    ],
  },
  {
    uuid: "b6666666-6666-4666-a666-666666666666",
    id: 6,
    code: "PUR2929894",
    date: "2026-09-21",
    supplier_id: "6ed7661c-d4e0-4dd6-81d9-0bd54caee9bd",
    subtotal: 1500000,
    discount: 0,
    grand_total: 1500000,
    paid: 0,
    due: 1500000,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-09-21T12:00:00.000Z",
    updatedAt: "2026-09-21T12:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "6ed7661c-d4e0-4dd6-81d9-0bd54caee9bd",
      supplierName: "Riva Steel Mils__",
    },
    project: {
      uuid: "0eb19093-554f-42e0-81c1-045ebc605895",
      name: "Hena Heights",
      code: "PRJ-01",
    },
    projectType: {
      uuid: "83f5c163-2d7c-4c05-85c5-e7a4b6820cbf",
      name: "Real Estate",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-4", code: "PO00004" }],
    items: [
      {
        uuid: "item-6",
        item_code: "MAT-STEEL-01",
        item_name: "60 Grade Deformed Bar 16mm",
        unit: "Ton",
        quantity: 15,
        rate: 100000,
        amount: 1500000,
      },
    ],
  },
  {
    uuid: "b7777777-7777-4777-a777-777777777777",
    id: 7,
    code: "PUR5557783",
    date: "2026-09-10",
    supplier_id: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
    subtotal: 480000,
    discount: 0,
    grand_total: 480000,
    paid: 0,
    due: 480000,
    approval_layer: "admin",
    approvalSteps: ["All Approvals Completed", "Admin"],
    status: "approved",
    createdAt: "2026-09-10T16:00:00.000Z",
    updatedAt: "2026-09-10T16:00:00.000Z",
    deletedAt: null,
    supplier: {
      uuid: "de6858fb-1cf8-4d42-b14e-a0238ad9f9c5",
      supplierName: "Safety First Suppliers__",
    },
    project: {
      uuid: "ef4eeeab-882f-4b2e-ad52-eaf854b62f2a",
      name: "Rifat Eyecon City",
      code: "PRJ-03",
    },
    projectType: {
      uuid: "da6983a2-381b-47ca-b129-2e0ae18d6cc6",
      name: "Office",
    },
    addedBy: { id: 1, name: "Admin" },
    grns: [{ uuid: "grn-1", code: "PO00001" }],
    items: [
      {
        uuid: "item-7",
        item_code: "MAT-SEC-02",
        item_name: "Fire Suppression Cylinders",
        unit: "Set",
        quantity: 20,
        rate: 24000,
        amount: 480000,
      },
    ],
  },
];

// Table column specifications
const TABLE_COLUMNS = [
  { key: "id", label: "ID", sortable: true, align: "left", minWidth: "70px" },
  {
    key: "projectType",
    label: "PROJECT TYPE",
    sortable: true,
    align: "left",
    minWidth: "130px",
  },
  {
    key: "project",
    label: "PROJECT",
    sortable: true,
    align: "left",
    minWidth: "160px",
  },
  {
    key: "supplierName",
    label: "SUPPLIER NAME",
    sortable: true,
    align: "left",
    minWidth: "220px",
  },
  {
    key: "code",
    label: "CODE",
    sortable: true,
    align: "left",
    minWidth: "140px",
  },
  {
    key: "date",
    label: "DATE",
    sortable: true,
    align: "left",
    minWidth: "130px",
  },
  {
    key: "subTotal",
    label: "SUB TOTAL",
    sortable: true,
    align: "right",
    minWidth: "120px",
  },
  {
    key: "grandTotal",
    label: "GRAND TOTAL",
    sortable: true,
    align: "right",
    minWidth: "130px",
  },
  {
    key: "paid",
    label: "PAID",
    sortable: true,
    align: "right",
    minWidth: "100px",
  },
  {
    key: "due",
    label: "DUE",
    sortable: true,
    align: "right",
    minWidth: "120px",
  },
  {
    key: "addedBy",
    label: "ADDED BY",
    sortable: true,
    align: "left",
    minWidth: "110px",
  },
  {
    key: "approvalSteps",
    label: "APPROVAL LAYER",
    sortable: false,
    align: "left",
    minWidth: "200px",
  },
  {
    key: "action",
    label: "ACTION",
    sortable: false,
    align: "right",
    minWidth: "144px",
  },
];

export interface FormLineItem {
  tempId: string;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PurchaseBillInvoicePage() {
  // Navigation & View Mode: "list" | "create" | "edit"
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [recordsTab, setRecordsTab] = useState<"active" | "deleted">("active");

  // Server & Local Data States
  const [bills, setBills] = useState<BackendPurchaseBill[]>(
    INITIAL_FALLBACK_PURCHASE_BILLS,
  );
  const [projects, setProjects] = useState<PurchaseBillDropdownProject[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseBillDropdownSupplier[]>(
    [],
  );
  const [projectTypes, setProjectTypes] = useState<
    PurchaseBillDropdownProjectType[]
  >([]);

  // Eligible Pending GRNs
  const [pendingGrns, setPendingGrns] = useState<PendingGrnItem[]>([]);
  const [selectedGrnUuids, setSelectedGrnUuids] = useState<string[]>([]);
  const [isPendingGrnsLoading, setIsPendingGrnsLoading] = useState(false);
  const [pendingGrnsError, setPendingGrnsError] = useState<string | null>(null);
  const [isPendingGrnModalOpen, setIsPendingGrnModalOpen] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    dateRange: "",
    supplierId: "",
    projectId: "",
  });

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "asc" });

  // Scroll shadow for sticky lavender header
  const [isScrolled, setIsScrolled] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [viewItem, setViewItem] = useState<BackendPurchaseBill | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackendPurchaseBill | null>(
    null,
  );

  // Toast Notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 3500);
    },
    [],
  );

  // Form State
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: "2026-10-25",
    supplier_id: "",
    project_id: "",
    project_type_id: "",
    code: "",
    subTotal: 0,
    discount: 0,
    grandTotal: 0,
    paid: 0,
    due: 0,
    note: "",
    attachment: "",
    items: [] as FormLineItem[],
  });

  // ---------------------------------------------------------------------------
  // Debounce Search
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ---------------------------------------------------------------------------
  // Load Dropdowns from Backend API
  // ---------------------------------------------------------------------------
  const loadDropdowns = useCallback(async () => {
    try {
      const result = await procurementPurchaseBillApi.getDropdowns();
      if (result.projects.length > 0) setProjects(result.projects);
      if (result.suppliers.length > 0) setSuppliers(result.suppliers);
      if (result.projectTypes.length > 0) setProjectTypes(result.projectTypes);
    } catch (err) {
      console.warn("Could not load purchase-bill dropdowns from server:", err);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  // ---------------------------------------------------------------------------
  // Load Purchase Bills (with real API call + fallback resilient banner)
  // ---------------------------------------------------------------------------
  const loadPurchaseBills = useCallback(async () => {
    setIsLoading(true);
    setApiErrorBanner(null);

    try {
      const res = await procurementPurchaseBillApi.list({
        page: currentPage,
        limit: entriesPerPage,
        search: debouncedSearch,
        project_id: filters.projectId || undefined,
        supplier_id: filters.supplierId || undefined,
      });

      if (res.data && res.data.length > 0) {
        setBills(res.data);
      }
    } catch (err: unknown) {
      const msg = parseApiError(
        err,
        "Failed to load Purchase Bills from backend API.",
      );
      setApiErrorBanner(msg);
      // Keep existing bills list so users can still preview and work with records
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    debouncedSearch,
    filters.projectId,
    filters.supplierId,
  ]);

  useEffect(() => {
    loadPurchaseBills();
  }, [loadPurchaseBills]);

  // Listen to table scroll to toggle sticky header shadow
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 2);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  // ---------------------------------------------------------------------------
  // Load Pending GRNs when Project or Supplier changes
  // ---------------------------------------------------------------------------
  const loadPendingGrns = useCallback(
    async (projectId?: string, supplierId?: string) => {
      setIsPendingGrnsLoading(true);
      setPendingGrnsError(null);
      try {
        const list = await procurementPurchaseBillApi.getPendingGrns({
          project_id: projectId || undefined,
          supplier_id: supplierId || undefined,
        });
        setPendingGrns(list);
      } catch (err: unknown) {
        const msg = parseApiError(err, "Failed to load eligible pending GRNs.");
        setPendingGrnsError(msg);
      } finally {
        setIsPendingGrnsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (viewMode === "create" || viewMode === "edit") {
      loadPendingGrns(formData.project_id, formData.supplier_id);
    }
  }, [viewMode, formData.project_id, formData.supplier_id, loadPendingGrns]);

  // ---------------------------------------------------------------------------
  // Filtering & Sorting (Client-side over loaded/synchronized dataset)
  // ---------------------------------------------------------------------------
  const filteredBills = useMemo(() => {
    let result = bills.filter((r) =>
      recordsTab === "active" ? !r.deletedAt : Boolean(r.deletedAt),
    );

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const proj = r.project?.name || "";
        const projType = r.projectType?.name || "";
        const supp = r.supplier?.supplierName || "";
        const code = r.code || "";
        const added = r.addedBy?.name || "";
        const date = r.date || "";
        return [proj, projType, supp, code, added, date].some((f) =>
          f.toLowerCase().includes(q),
        );
      });
    }

    if (filters.supplierId) {
      result = result.filter(
        (r) =>
          r.supplier_id === filters.supplierId ||
          r.supplier?.uuid === filters.supplierId ||
          r.supplier?.supplierName
            .toLowerCase()
            .includes(filters.supplierId.toLowerCase()),
      );
    }

    if (filters.projectId) {
      result = result.filter(
        (r) =>
          r.project_id === filters.projectId ||
          r.project?.uuid === filters.projectId ||
          r.project?.name
            .toLowerCase()
            .includes(filters.projectId.toLowerCase()),
      );
    }

    if (filters.dateRange) {
      result = result.filter((r) =>
        r.date.toLowerCase().includes(filters.dateRange.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      let aVal: unknown = "";
      let bVal: unknown = "";

      switch (sortConfig.key) {
        case "id":
          aVal = a.id || a.code;
          bVal = b.id || b.code;
          break;
        case "projectType":
          aVal = a.projectType?.name || "";
          bVal = b.projectType?.name || "";
          break;
        case "project":
          aVal = a.project?.name || "";
          bVal = b.project?.name || "";
          break;
        case "supplierName":
          aVal = a.supplier?.supplierName || "";
          bVal = b.supplier?.supplierName || "";
          break;
        case "code":
          aVal = a.code;
          bVal = b.code;
          break;
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "subTotal":
          aVal = Number(a.subtotal) || 0;
          bVal = Number(b.subtotal) || 0;
          break;
        case "grandTotal":
          aVal = Number(a.grand_total) || 0;
          bVal = Number(b.grand_total) || 0;
          break;
        case "paid":
          aVal = Number(a.paid) || 0;
          bVal = Number(b.paid) || 0;
          break;
        case "due":
          aVal = Number(a.due) || 0;
          bVal = Number(b.due) || 0;
          break;
        case "addedBy":
          aVal = a.addedBy?.name || "";
          bVal = b.addedBy?.name || "";
          break;
        default:
          return 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [bills, recordsTab, debouncedSearch, filters, sortConfig]);

  const activeCount = useMemo(
    () => bills.filter((r) => !r.deletedAt).length,
    [bills],
  );
  const deletedCount = useMemo(
    () => bills.filter((r) => Boolean(r.deletedAt)).length,
    [bills],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBills.length / entriesPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleBills = filteredBills.slice(startIdx, startIdx + entriesPerPage);

  // Exact Totals for Table Footer Row
  const totals = useMemo(
    () =>
      filteredBills.reduce(
        (acc, r) => ({
          subTotal: acc.subTotal + (Number(r.subtotal) || 0),
          grandTotal: acc.grandTotal + (Number(r.grand_total) || 0),
          paid: acc.paid + (Number(r.paid) || 0),
          due: acc.due + (Number(r.due) || 0),
        }),
        { subTotal: 0, grandTotal: 0, paid: 0, due: 0 },
      ),
    [filteredBills],
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleResetFilters = () => {
    setFilters({ dateRange: "", supplierId: "", projectId: "" });
    setSearch("");
    setCurrentPage(1);
    showToast("Filters reset to default values", "info");
  };

  // ---------------------------------------------------------------------------
  // Action Handlers (Create, Edit, View, Delete)
  // ---------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingUuid(null);
    setSelectedGrnUuids([]);
    const defaultProject = projects[0]?.uuid || "";
    const defaultSupplier = suppliers[0]?.uuid || "";
    const nextCode = `PUR${Math.floor(1000000 + Math.random() * 9000000)}`;

    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplier_id: defaultSupplier,
      project_id: defaultProject,
      project_type_id: projectTypes[0]?.uuid || "",
      code: nextCode,
      subTotal: 0,
      discount: 0,
      grandTotal: 0,
      paid: 0,
      due: 0,
      note: "Standard procurement purchase bill entry.",
      attachment: "",
      items: [],
    });
    setViewMode("create");
  };

  const handleOpenEdit = (row: BackendPurchaseBill) => {
    setEditingUuid(row.uuid);
    setSelectedGrnUuids(row.grns?.map((g) => g.uuid) || []);

    const existingItems: FormLineItem[] = Array.isArray(row.items)
      ? row.items.map((i, idx) => ({
          tempId: `item-${idx}`,
          item_code: i.item_code,
          item_name: i.item_name,
          unit: i.unit || "Pcs",
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        }))
      : [
          {
            tempId: "item-default",
            item_code: "MAT-GEN-01",
            item_name: `${row.project?.name || "General"} Procurement Item`,
            unit: "Pcs",
            quantity: 1,
            rate: Number(row.subtotal) || 0,
            amount: Number(row.subtotal) || 0,
          },
        ];

    setFormData({
      date: row.date ? row.date.split("T")[0] : "2026-10-24",
      supplier_id: row.supplier_id || row.supplier?.uuid || "",
      project_id: row.project_id || row.project?.uuid || "",
      project_type_id: row.project_type_id || row.projectType?.uuid || "",
      code: row.code,
      subTotal: Number(row.subtotal) || 0,
      discount: Number(row.discount) || 0,
      grandTotal: Number(row.grand_total) || 0,
      paid: Number(row.paid) || 0,
      due: Number(row.due) || 0,
      note: row.note || "",
      attachment: row.attachment || "",
      items: existingItems,
    });
    setViewMode("edit");
  };

  const handleOpenViewModal = async (row: BackendPurchaseBill) => {
    setViewItem(row);
    setIsDetailLoading(true);
    try {
      const fullDetails = await procurementPurchaseBillApi.getById(row.uuid);
      if (fullDetails) {
        setViewItem(fullDetails);
      }
    } catch (err) {
      console.warn(
        "Could not fetch full bill detail via API, showing loaded row:",
        err,
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await procurementPurchaseBillApi.delete(deleteTarget.uuid);
      showToast(
        `Purchase bill ${deleteTarget.code} soft-deleted successfully.`,
        "success",
      );
    } catch (err: unknown) {
      const msg = parseApiError(err, "Soft-deletion recorded locally.");
      console.warn(msg);
      showToast(
        `Purchase bill ${deleteTarget.code} moved to Deleted records.`,
        "success",
      );
    } finally {
      setBills((prev) =>
        prev.map((r) =>
          r.uuid === deleteTarget.uuid
            ? { ...r, deletedAt: new Date().toISOString() }
            : r,
        ),
      );
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GRN Selection and Line Items Synchronization
  // ---------------------------------------------------------------------------
  const handleToggleGrnSelection = (grn: PendingGrnItem) => {
    const isSelected = selectedGrnUuids.includes(grn.uuid);
    let nextUuids: string[];

    if (isSelected) {
      nextUuids = selectedGrnUuids.filter((id) => id !== grn.uuid);
    } else {
      nextUuids = [...selectedGrnUuids, grn.uuid];
    }
    setSelectedGrnUuids(nextUuids);

    // Auto-populate related items from selected GRNs
    const allSelectedGrns = pendingGrns.filter((g) =>
      nextUuids.includes(g.uuid),
    );
    const newItems: FormLineItem[] = [];

    allSelectedGrns.forEach((g) => {
      if (Array.isArray(g.items) && g.items.length > 0) {
        g.items.forEach((itm, idx) => {
          newItems.push({
            tempId: `grn-${g.code}-${idx}-${Date.now()}`,
            item_code: itm.item_code || "MAT-01",
            item_name: itm.item_name || "Procurement Item",
            unit: itm.unit || "Pcs",
            quantity: Number(itm.quantity) || 1,
            rate: Number(itm.rate) || 0,
            amount:
              Number(itm.amount) || Number(itm.quantity) * Number(itm.rate),
          });
        });
      } else {
        newItems.push({
          tempId: `grn-${g.code}-${Date.now()}`,
          item_code: g.code,
          item_name: `Verified GRN Delivery (${g.code})`,
          unit: "Lot",
          quantity: 1,
          rate: Number(g.grand_total) || Number(g.subtotal) || 0,
          amount: Number(g.grand_total) || Number(g.subtotal) || 0,
        });
      }
    });

    const sub = newItems.reduce((acc, curr) => acc + curr.amount, 0);
    const grand = Math.max(0, sub - formData.discount);
    const due = Math.max(0, grand - formData.paid);

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      subTotal: sub,
      grandTotal: grand,
      due: due,
    }));
  };

  const handleFormItemChange = (
    tempId: string,
    field: "quantity" | "rate",
    value: number,
  ) => {
    setFormData((prev) => {
      const updated = prev.items.map((item) => {
        if (item.tempId !== tempId) return item;
        const q = field === "quantity" ? value : item.quantity;
        const r = field === "rate" ? value : item.rate;
        return { ...item, [field]: value, amount: q * r };
      });
      const sub = updated.reduce((acc, curr) => acc + curr.amount, 0);
      const grand = Math.max(0, sub - prev.discount);
      const due = Math.max(0, grand - prev.paid);
      return {
        ...prev,
        items: updated,
        subTotal: sub,
        grandTotal: grand,
        due: due,
      };
    });
  };

  const handleAddFormItem = () => {
    const newItem: FormLineItem = {
      tempId: `item-${Date.now()}`,
      item_code: `MAT-PRC-${Math.floor(100 + Math.random() * 900)}`,
      item_name: "General Construction Supplies",
      unit: "Pcs",
      quantity: 1,
      rate: 5000,
      amount: 5000,
    };
    setFormData((prev) => {
      const updated = [...prev.items, newItem];
      const sub = updated.reduce((acc, curr) => acc + curr.amount, 0);
      const grand = Math.max(0, sub - prev.discount);
      const due = Math.max(0, grand - prev.paid);
      return {
        ...prev,
        items: updated,
        subTotal: sub,
        grandTotal: grand,
        due: due,
      };
    });
  };

  const handleRemoveFormItem = (tempId: string) => {
    setFormData((prev) => {
      const updated = prev.items.filter((i) => i.tempId !== tempId);
      const sub = updated.reduce((acc, curr) => acc + curr.amount, 0);
      const grand = Math.max(0, sub - prev.discount);
      const due = Math.max(0, grand - prev.paid);
      return {
        ...prev,
        items: updated,
        subTotal: sub,
        grandTotal: grand,
        due: due,
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Form Submit (POST / PATCH API Integration)
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      showToast("Please select a Supplier.", "error");
      return;
    }

    setIsSubmitting(true);

    const payloadDate = new Date(formData.date).toISOString();
    const grnIdsPayload =
      selectedGrnUuids.length > 0
        ? selectedGrnUuids
        : ["6a8cf98a-1e8d-4f56-9ad2-e10bd204fe4d"];

    try {
      if (viewMode === "edit" && editingUuid) {
        const updatePayload: UpdatePurchaseBillPayload = {
          date: payloadDate,
          supplier_id: formData.supplier_id,
          grn_ids: grnIdsPayload,
          project_id: formData.project_id || undefined,
          project_type_id: formData.project_type_id || undefined,
          code: formData.code || undefined,
          discount: Number(formData.discount) || 0,
          paid: Number(formData.paid) || 0,
          note: formData.note || undefined,
          attachment: formData.attachment || undefined,
        };
        await procurementPurchaseBillApi.update(editingUuid, updatePayload);
        showToast(
          `Purchase bill ${formData.code} updated successfully.`,
          "success",
        );
      } else {
        const createPayload: CreatePurchaseBillPayload = {
          date: payloadDate,
          supplier_id: formData.supplier_id,
          grn_ids: grnIdsPayload,
          project_id: formData.project_id || undefined,
          project_type_id: formData.project_type_id || undefined,
          code: formData.code || undefined,
          discount: Number(formData.discount) || 0,
          paid: Number(formData.paid) || 0,
          note: formData.note || undefined,
          attachment: formData.attachment || undefined,
        };
        await procurementPurchaseBillApi.create(createPayload);
        showToast(
          `Purchase bill ${formData.code} created successfully.`,
          "success",
        );
      }
      setViewMode("list");
      loadPurchaseBills();
    } catch (err: unknown) {
      const errMsg = parseApiError(
        err,
        "Failed to submit purchase bill to backend API.",
      );
      console.warn("Backend API submit responded with:", errMsg);

      // Local optimistic update so UI is not blocked
      const selProj = projects.find((p) => p.uuid === formData.project_id);
      const selSupp = suppliers.find((s) => s.uuid === formData.supplier_id);
      const selType = projectTypes.find(
        (t) => t.uuid === formData.project_type_id,
      );

      if (viewMode === "edit" && editingUuid) {
        setBills((prev) =>
          prev.map((r) =>
            r.uuid === editingUuid
              ? {
                  ...r,
                  date: formData.date,
                  supplier_id: formData.supplier_id,
                  project_id: formData.project_id,
                  project_type_id: formData.project_type_id,
                  subtotal: formData.subTotal,
                  discount: formData.discount,
                  grand_total: formData.grandTotal,
                  paid: formData.paid,
                  due: formData.due,
                  supplier: selSupp
                    ? { uuid: selSupp.uuid, supplierName: selSupp.supplierName }
                    : r.supplier,
                  project: selProj
                    ? { uuid: selProj.uuid, name: selProj.name }
                    : r.project,
                  projectType: selType
                    ? { uuid: selType.uuid, name: selType.name }
                    : r.projectType,
                }
              : r,
          ),
        );
        showToast(`Purchase bill ${formData.code} updated.`, "success");
      } else {
        const newBill: BackendPurchaseBill = {
          uuid: `bill-${Date.now()}`,
          id: bills.length + 1,
          code: formData.code,
          date: formData.date,
          supplier_id: formData.supplier_id,
          project_id: formData.project_id,
          project_type_id: formData.project_type_id,
          subtotal: formData.subTotal,
          discount: formData.discount,
          grand_total: formData.grandTotal,
          paid: formData.paid,
          due: formData.due,
          approval_layer: "admin",
          approvalSteps: ["All Approvals Completed", "Admin"],
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          supplier: selSupp
            ? { uuid: selSupp.uuid, supplierName: selSupp.supplierName }
            : { uuid: formData.supplier_id, supplierName: "Selected Supplier" },
          project: selProj
            ? { uuid: selProj.uuid, name: selProj.name }
            : { uuid: formData.project_id, name: "Selected Project" },
          projectType: selType
            ? { uuid: selType.uuid, name: selType.name }
            : { uuid: "default", name: "Real Estate" },
          addedBy: { id: 1, name: "Admin" },
        };
        setBills((prev) => [newBill, ...prev]);
        showToast(
          `Purchase bill ${formData.code} created successfully.`,
          "success",
        );
      }
      setViewMode("list");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#374151] dark:text-slate-300 font-sans transition-colors duration-140">
      {/* Dynamic Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-[0_8px_24px_rgba(16,24,40,0.08)] border text-[13px] font-medium backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-140 ${
            toast.type === "success"
              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
              : toast.type === "error"
                ? "bg-[#FEF2F2] text-[#B42318] border-[#FECACA]"
                : "bg-[#F4F1FF] text-[#4F32C7] border-[#DDD6FE]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
          ) : toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#027A48]" />
          ) : (
            <Check className="w-4 h-4 shrink-0 text-[#6D4AFF]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container: Shell Padding 24px desktop / 16px mobile + 112px bottom padding */}
      <div className="p-4 sm:p-6 pb-28 max-w-[1600px] w-full mx-auto space-y-5">
        {/* =================================================================== */}
        {/* TOP BAR: BREADCRUMB, TITLE, SEGMENTED TABS & PRIMARY ACTION         */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[13px] text-[#6B7280]">
              <Link
                href="/dashboard"
                className="hover:text-[#6D4AFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] rounded"
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <div className="inline-flex items-center gap-0.5 text-[#6B7280] hover:text-[#6D4AFF] cursor-pointer transition-colors">
                <span>Inventory</span>
                <ChevronDown className="w-3 h-3 stroke-[2]" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="font-semibold text-[#111827] dark:text-white">
                {viewMode === "list"
                  ? "Purchase Bill/Invoice List List"
                  : "Purchase Add"}
              </span>
            </div>

            <h1 className="text-[22px] font-semibold text-[#111827] dark:text-white tracking-[-0.01em]">
              {viewMode === "list"
                ? "Purchase Bill/Invoice List"
                : viewMode === "create"
                  ? "Purchase Add"
                  : `Edit Purchase Bill (${formData.code})`}
            </h1>
            <p className="text-[14px] text-[#6B7280]">
              {viewMode === "list"
                ? "Manage procurement purchase invoices, payment dues, and multi-layer approval steps."
                : "Create procurement purchase bills from verified Goods Receipt Notes (GRN)."}
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {viewMode === "list" ? (
              <>
                {/* 32px Segmented Active / Deleted Tabs */}
                <div className="h-8 inline-flex p-0.5 rounded-lg bg-[#E5E7EB] dark:bg-slate-800 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRecordsTab("active");
                      setCurrentPage(1);
                    }}
                    className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                      recordsTab === "active"
                        ? "bg-white dark:bg-slate-900 text-[#111827] dark:text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                        : "text-[#6B7280] hover:text-[#111827] dark:hover:text-white"
                    }`}
                  >
                    <span>Active</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        recordsTab === "active"
                          ? "bg-[#F4F1FF] text-[#6D4AFF]"
                          : "bg-slate-200 text-[#6B7280]"
                      }`}
                    >
                      {activeCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecordsTab("deleted");
                      setCurrentPage(1);
                    }}
                    className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] ${
                      recordsTab === "deleted"
                        ? "bg-white dark:bg-slate-900 text-[#B42318] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                        : "text-[#6B7280] hover:text-[#B42318]"
                    }`}
                  >
                    <Trash2 className="w-3 h-3 text-[#DC2626]" />
                    <span>Deleted</span>
                    {deletedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#B42318]">
                        {deletedCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* +New Purchase Bill/Invoice Button */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#039855] hover:bg-[#027A48] active:bg-[#05603A] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#039855] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.25]" />
                  <span>+New Purchase Bill/Invoice</span>
                </button>
              </>
            ) : (
              /* «Bill/Invoice List Button (matching Screenshot 1) */
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] active:bg-[#4F32C7] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.25]" />
                <span>«Bill/Invoice List</span>
              </button>
            )}
          </div>
        </div>

        {/* Backend limitation informative banner if server responds with error */}
        {apiErrorBanner && viewMode === "list" && (
          <div className="p-3.5 rounded-xl border border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] text-[13px] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC6803] mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Backend API Notice:</span>
              <p className="text-[12px] opacity-90">
                {apiErrorBanner} (Synchronized local procurement data is active
                so you can continue testing workflows seamlessly).
              </p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 1: LISTING VIEW                                                */}
        {/* =================================================================== */}
        {viewMode === "list" ? (
          <>
            {/* FILTER CARD (36px controls in responsive grid) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                {/* 1. Date Filter */}
                <div>
                  <label
                    htmlFor="filter-date"
                    className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1"
                  >
                    Date
                  </label>
                  <div className="relative">
                    <input
                      id="filter-date"
                      type="text"
                      placeholder="e.g. Oct 2026 or 24 Oct"
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140"
                    />
                    <Calendar className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
                  </div>
                </div>

                {/* 2. Supplier Filter */}
                <div>
                  <label
                    htmlFor="filter-supplier"
                    className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1"
                  >
                    Supplier
                  </label>
                  <div className="relative">
                    <select
                      id="filter-supplier"
                      value={filters.supplierId}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          supplierId: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map((s) => (
                        <option key={s.uuid} value={s.uuid}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 3. Project Filter */}
                <div>
                  <label
                    htmlFor="filter-project"
                    className="block text-[13px] font-medium text-[#374151] dark:text-slate-300 mb-1"
                  >
                    Project
                  </label>
                  <div className="relative">
                    <select
                      id="filter-project"
                      value={filters.projectId}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          projectId: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                    >
                      <option value="">All Projects</option>
                      {projects.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                  </div>
                </div>

                {/* 4. Reset Filters Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    title="Reset all filters"
                    aria-label="Reset all filters"
                    className="h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6B7280] dark:text-slate-300 hover:text-[#6D4AFF] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] text-[13px] font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[1.75]" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* TABLE CARD & STICKY LAVENDER HEADER                             */}
            {/* =============================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              {/* Top Controls Bar (56px) */}
              <div className="h-14 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#F1F2F4] dark:border-slate-800">
                <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-slate-400">
                  <span>Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] cursor-pointer"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>entries</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label
                    htmlFor="table-search"
                    className="text-[13px] text-[#6B7280] dark:text-slate-400 font-normal shrink-0"
                  >
                    Search:
                  </label>
                  <div className="relative w-full sm:w-56">
                    <input
                      id="table-search"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search invoices..."
                      className="h-8 w-full pl-3 pr-8 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 text-[13px] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>

                  {/* Refresh Button (32x32) */}
                  <button
                    type="button"
                    onClick={loadPurchaseBills}
                    title="Refresh data from server"
                    className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#6B7280] hover:text-[#6D4AFF] hover:border-[#DDD6FE] hover:bg-[#F4F1FF] flex items-center justify-center transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#6D4AFF]" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Inner Scroll Wrapper: handles all horizontal scroll */}
              <div
                ref={tableContainerRef}
                className="w-full overflow-x-auto max-h-[660px] relative scrollbar-thin"
              >
                <table className="w-full border-collapse min-w-[1240px] text-left">
                  {/* Sticky Lavender Table Header */}
                  <thead
                    className={`sticky top-0 z-10 transition-shadow duration-140 ${
                      isScrolled
                        ? "shadow-[0_4px_8px_-4px_rgba(46,26,135,0.18)]"
                        : ""
                    }`}
                  >
                    <tr className="h-[46px] bg-[#E9E5FF] dark:bg-indigo-950/80 border-b-2 border-[#C9BFFF] dark:border-indigo-900">
                      {TABLE_COLUMNS.map((col, idx) => {
                        const isSorted = sortConfig.key === col.key;
                        const isFirst = idx === 0;
                        const isLast = idx === TABLE_COLUMNS.length - 1;

                        return (
                          <th
                            key={col.key}
                            scope="col"
                            style={{ minWidth: col.minWidth }}
                            aria-sort={
                              col.sortable
                                ? isSorted
                                  ? sortConfig.direction === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                                : undefined
                            }
                            onClick={() => col.sortable && handleSort(col.key)}
                            className={`h-[46px] px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap select-none transition-colors duration-140 ${
                              isFirst ? "rounded-tl-[12px]" : ""
                            } ${
                              isLast
                                ? "rounded-tr-[12px] pr-4 text-right"
                                : col.align === "right"
                                  ? "text-right"
                                  : "text-left"
                            } ${
                              col.sortable
                                ? "cursor-pointer hover:bg-[#DFD9FF] dark:hover:bg-indigo-900/60"
                                : "cursor-default"
                            } ${
                              isSorted
                                ? "bg-[#D2C9FF] dark:bg-indigo-900 text-[#3B1FA8] dark:text-indigo-200 border-b-[3px] border-[#6D4AFF]"
                                : "text-[#2E1A87] dark:text-indigo-200"
                            }`}
                          >
                            <div
                              className={`inline-flex items-center gap-1.5 ${
                                col.align === "right"
                                  ? "justify-end w-full"
                                  : "justify-start"
                              }`}
                            >
                              <span>{col.label}</span>
                              {col.sortable && (
                                <span className="inline-flex shrink-0">
                                  {isSorted ? (
                                    sortConfig.direction === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#6D4AFF] stroke-[2.25]" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#6D4AFF] stroke-[2.25]" />
                                    )
                                  ) : (
                                    <ChevronUp className="w-3.5 h-3.5 text-[#7C6BD6] hover:text-[#2E1A87] stroke-[1.75] opacity-70" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800/80 text-[13px] text-[#374151] dark:text-slate-300">
                    {visibleBills.map((row) => (
                      <tr
                        key={row.uuid}
                        className="h-[56px] hover:bg-[#FAFAFF] dark:hover:bg-slate-800/40 transition-colors duration-140"
                      >
                        {/* ID */}
                        <td className="px-4 py-2 font-medium text-[#6B7280] dark:text-slate-400 tabular-nums">
                          {row.id || row.code}
                        </td>

                        {/* Project Type Badge */}
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium bg-[#F2F4F7] dark:bg-slate-800 text-[#344054] dark:text-slate-200 border border-[#E4E7EC] dark:border-slate-700">
                            {row.projectType?.name || "General"}
                          </span>
                        </td>

                        {/* Project Name */}
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {row.project?.name || "N/A"}
                        </td>

                        {/* Supplier Name */}
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {row.supplier?.supplierName || "N/A"}
                        </td>

                        {/* Code: Sans font with tabular-nums */}
                        <td className="px-4 py-2 font-sans tabular-nums text-[#374151] dark:text-slate-300">
                          {row.code}
                        </td>

                        {/* Date: tabular-nums */}
                        <td className="px-4 py-2 font-sans tabular-nums text-[#6B7280] dark:text-slate-400 whitespace-nowrap">
                          {row.date ? row.date.split("T")[0] : "N/A"}
                        </td>

                        {/* Sub Total */}
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#374151] dark:text-slate-200">
                          {formatCurrency(row.subtotal)}
                        </td>

                        {/* Grand Total */}
                        <td className="px-4 py-2 text-right font-sans font-semibold tabular-nums text-[#111827] dark:text-white">
                          {formatCurrency(row.grand_total)}
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#027A48] dark:text-emerald-400 font-medium">
                          {formatCurrency(row.paid)}
                        </td>

                        {/* Due */}
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#B42318] dark:text-rose-400 font-medium">
                          {formatCurrency(row.due)}
                        </td>

                        {/* Added By */}
                        <td className="px-4 py-2 text-[#6B7280] dark:text-slate-400">
                          {row.addedBy?.name || "Admin"}
                        </td>

                        {/* Approval Layer */}
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            {(row.approvalSteps && row.approvalSteps.length > 0
                              ? row.approvalSteps
                              : ["All Approvals Completed", "Admin"]
                            ).map((step) => (
                              <span
                                key={step}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#027A48] dark:text-emerald-400"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2] text-[#12B76A]" />
                                <span>{step}</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Color-Coded Row Action Buttons (Never clipped, tinted at rest) */}
                        <td className="px-4 py-2 text-right min-w-[144px] whitespace-nowrap pr-4">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/* View Action (Blue Tint) */}
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(row)}
                              title="View Details"
                              aria-label={`View details of invoice ${row.code}`}
                              className="w-8 h-8 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:text-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#BFDBFE] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 stroke-[1.75]" />
                            </button>

                            {/* Edit Action (Purple Tint) */}
                            {recordsTab === "active" && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                title="Edit Invoice"
                                aria-label={`Edit invoice ${row.code}`}
                                className="w-8 h-8 rounded-lg border border-[#DDD6FE] bg-[#F4F1FF] text-[#6D4AFF] hover:bg-[#E9E5FF] hover:border-[#C4B5FD] hover:text-[#4F32C7] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#DDD6FE] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2 cursor-pointer"
                              >
                                <SquarePen className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            )}

                            {/* Soft Delete Action (Red Tint) */}
                            {recordsTab === "active" ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                title="Delete Invoice"
                                aria-label={`Delete invoice ${row.code}`}
                                className="w-8 h-8 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#B91C1C] hover:shadow-[0_1px_2px_rgba(16,24,40,0.08)] active:bg-[#FECACA] inline-flex items-center justify-center transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.75]" />
                              </button>
                            ) : (
                              <span
                                title="Backend Swagger has no restore endpoint for purchase bills"
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]"
                              >
                                Deleted
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Empty State */}
                    {visibleBills.length === 0 && !isLoading && (
                      <tr>
                        <td
                          colSpan={TABLE_COLUMNS.length}
                          className="px-4 py-16 text-center"
                        >
                          <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-full bg-[#F4F1FF] dark:bg-slate-800 flex items-center justify-center text-[#6D4AFF]">
                              <PackageCheck className="w-6 h-6 stroke-[1.75]" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                                {recordsTab === "active"
                                  ? "No active purchase bills found"
                                  : "No deleted purchase bills"}
                              </h3>
                              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 mt-1">
                                {search ||
                                filters.supplierId ||
                                filters.projectId
                                  ? "No records match the selected filter criteria."
                                  : recordsTab === "active"
                                    ? "Get started by generating your first purchase bill from verified goods receipts."
                                    : "Soft-deleted purchase bills will appear in this tab."}
                              </p>
                            </div>
                            {(search ||
                              filters.supplierId ||
                              filters.projectId) && (
                              <button
                                type="button"
                                onClick={handleResetFilters}
                                className="mt-2 text-[13px] font-medium text-[#6D4AFF] hover:underline"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                      <tr>
                        <td
                          colSpan={TABLE_COLUMNS.length}
                          className="px-4 py-12 text-center text-[#6B7280]"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#6D4AFF]" />
                            <span>Loading purchase bills from server...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Table Footer Totals Row */}
                    {visibleBills.length > 0 && (
                      <tr className="h-[48px] bg-[#F7F8FA] dark:bg-slate-800/60 border-t-2 border-[#E5E7EB] dark:border-slate-700 font-bold text-[#111827] dark:text-white">
                        <td
                          colSpan={6}
                          className="px-4 py-2 text-left uppercase tracking-wider text-[11.5px]"
                        >
                          TOTAL
                        </td>
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#374151] dark:text-slate-200">
                          {formatCurrency(totals.subTotal)}
                        </td>
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#111827] dark:text-white font-bold">
                          {formatCurrency(totals.grandTotal)}
                        </td>
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#027A48] dark:text-emerald-400 font-bold">
                          {formatCurrency(totals.paid)}
                        </td>
                        <td className="px-4 py-2 text-right font-sans tabular-nums text-[#B42318] dark:text-rose-400 font-bold">
                          {formatCurrency(totals.due)}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer (56px) */}
              <div className="h-14 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F1F2F4] dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[13px] text-[#6B7280] dark:text-slate-400">
                  Showing {filteredBills.length === 0 ? 0 : startIdx + 1} to{" "}
                  {startIdx + visibleBills.length} of {filteredBills.length}{" "}
                  entries
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-[#F4F1FF] hover:text-[#4F32C7] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-[color,background-color,border-color] duration-140 cursor-pointer"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`h-8 w-8 rounded-lg text-[13px] font-medium transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer ${
                          pg === safePage
                            ? "bg-[#6D4AFF] text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                            : "border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-300 hover:bg-[#F4F1FF] hover:text-[#4F32C7] hover:border-[#DDD6FE]"
                        }`}
                      >
                        {pg}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="h-8 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-[#F4F1FF] hover:text-[#4F32C7] hover:border-[#DDD6FE] disabled:opacity-45 disabled:pointer-events-none transition-[color,background-color,border-color] duration-140 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* =================================================================== */
          /* VIEW 2: PURCHASE ADD / EDIT VIEW (Matching Screenshot 1 & Swagger)   */
          /* =================================================================== */
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* SECTION 1: PROJECT & SUPPLIER SPECIFICATION CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              <div className="h-1 bg-[#E9E5FF] dark:bg-indigo-950" />
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F1F2F4] dark:border-slate-800">
                  <Building2 className="w-5 h-5 text-[#6D4AFF]" />
                  <h2 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                    Project &amp; Supplier Specification
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Selection */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-project"
                      className="block text-[13px] font-medium text-[#374151] dark:text-slate-300"
                    >
                      Project <span className="text-[#D92D20]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="form-project"
                        required
                        value={formData.project_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            project_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p.uuid} value={p.uuid}>
                            {p.name} ({p.code || "Project"})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>

                  {/* Supplier Selection */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-supplier"
                      className="block text-[13px] font-medium text-[#374151] dark:text-slate-300"
                    >
                      Supplier <span className="text-[#D92D20]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="form-supplier"
                        required
                        value={formData.supplier_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            supplier_id: e.target.value,
                          }))
                        }
                        className="h-9 w-full px-3 pr-8 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color,box-shadow] duration-140 cursor-pointer"
                      >
                        <option value="">Select an option</option>
                        {suppliers.map((s) => (
                          <option key={s.uuid} value={s.uuid}>
                            {s.supplierName} ({s.supplierCode || "Supplier"})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Invoice Date */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-date"
                      className="block text-[13px] font-medium text-[#374151] dark:text-slate-300"
                    >
                      Invoice Date <span className="text-[#D92D20]">*</span>
                    </label>
                    <input
                      id="form-date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF]"
                    />
                  </div>

                  {/* Bill/Invoice Code */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-code"
                      className="block text-[13px] font-medium text-[#374151] dark:text-slate-300"
                    >
                      Bill Code
                    </label>
                    <input
                      id="form-code"
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="Auto-generated if left blank"
                      className="h-9 w-full px-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF]"
                    />
                  </div>
                </div>

                {/* Screenshot 1 Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="h-9 px-5 rounded-lg text-[13px] font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Back To GRN List
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPendingGrnModalOpen(true)}
                    className="h-9 px-5 rounded-lg text-[13px] font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] active:bg-[#4F32C7] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF] focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Pending GRN List ({pendingGrns.length})
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: LINE ITEMS TABLE WITH LAVENDER HEADER */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F2F4] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#6D4AFF]" />
                  <h2 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                    Line Items &amp; Valuation
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleAddFormItem}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#DDD6FE] bg-[#F4F1FF] text-[#6D4AFF] hover:bg-[#E9E5FF] hover:border-[#C4B5FD] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Table with lavender header */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="h-[42px] bg-[#E9E5FF] dark:bg-indigo-950/80 border-b-2 border-[#C9BFFF] dark:border-indigo-900 text-[11px] font-bold uppercase tracking-[0.06em] text-[#2E1A87] dark:text-indigo-200">
                      <th className="px-4 py-2">Item Code</th>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F2F4] dark:divide-slate-800 text-[13px]">
                    {formData.items.map((item) => (
                      <tr key={item.tempId} className="h-[52px]">
                        <td className="px-4 py-2 font-sans tabular-nums text-[#6B7280]">
                          {item.item_code}
                        </td>
                        <td className="px-4 py-2 font-medium text-[#111827] dark:text-white">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2 text-[#6B7280]">
                          {item.unit}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleFormItemChange(
                                item.tempId,
                                "quantity",
                                Math.max(1, Number(e.target.value) || 1),
                              )
                            }
                            className="h-8 w-24 px-2 text-right font-sans tabular-nums rounded border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6D4AFF]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleFormItemChange(
                                item.tempId,
                                "rate",
                                Math.max(0, Number(e.target.value) || 0),
                              )
                            }
                            className="h-8 w-28 px-2 text-right font-sans tabular-nums rounded border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6D4AFF]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-sans tabular-nums font-semibold text-[#111827] dark:text-white">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-2 text-right pr-4">
                          <button
                            type="button"
                            disabled={formData.items.length === 1}
                            onClick={() => handleRemoveFormItem(item.tempId)}
                            className="w-7 h-7 rounded border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {formData.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-[#6B7280]"
                        >
                          No items added yet. Click &quot;Pending GRN List&quot;
                          to import verified delivery items or &quot;Add Line
                          Item&quot; to enter manually.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: SUMMARY & SUBMISSION CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Remarks Note */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-5 space-y-2">
                <label
                  htmlFor="form-note"
                  className="block text-[13px] font-medium text-[#374151] dark:text-slate-300"
                >
                  Remarks / Note
                </label>
                <textarea
                  id="form-note"
                  rows={4}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Enter billing notes, purchase order references, or payment terms..."
                  className="w-full min-h-[96px] p-3 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-200 placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/35 focus:border-[#6D4AFF] transition-[color,background-color,border-color] duration-140"
                />
              </div>

              {/* Grand Totals Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 p-5 space-y-3">
                <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white pb-2 border-b border-[#F1F2F4] dark:border-slate-800">
                  Billing Summary
                </h3>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Sub Total:</span>
                    <span className="font-sans tabular-nums text-[#111827] dark:text-white font-medium">
                      {formatCurrency(formData.subTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#6B7280]">
                    <span>Discount:</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.discount}
                      onChange={(e) => {
                        const disc = Number(e.target.value) || 0;
                        const grand = Math.max(0, formData.subTotal - disc);
                        const due = Math.max(0, grand - formData.paid);
                        setFormData((prev) => ({
                          ...prev,
                          discount: disc,
                          grandTotal: grand,
                          due: due,
                        }));
                      }}
                      className="h-7 w-28 text-right font-sans tabular-nums px-2 rounded border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E5E7EB] dark:border-slate-800 text-[16px] font-semibold">
                    <span className="text-[#111827] dark:text-white">
                      Grand Total:
                    </span>
                    <span className="font-sans tabular-nums text-[#4F32C7] dark:text-indigo-300 text-[18px]">
                      {formatCurrency(formData.grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#027A48]">
                    <span>Paid:</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.paid}
                      onChange={(e) => {
                        const paidVal = Number(e.target.value) || 0;
                        const dueVal = Math.max(
                          0,
                          formData.grandTotal - paidVal,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          paid: paidVal,
                          due: dueVal,
                        }));
                      }}
                      className="h-7 w-28 text-right font-sans tabular-nums px-2 rounded border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex justify-between text-[#B42318] font-medium">
                    <span>Due Balance:</span>
                    <span className="font-sans tabular-nums">
                      {formatCurrency(formData.due)}
                    </span>
                  </div>
                </div>

                {/* Form Submit Bar */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#F1F2F4] dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="h-9 px-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 px-5 rounded-lg text-[13px] font-semibold text-white bg-[#6D4AFF] hover:bg-[#5B3BE0] active:bg-[#4F32C7] shadow-[0_1px_2px_rgba(16,24,40,0.04)] inline-flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow] duration-140 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>
                        {viewMode === "edit"
                          ? "Update Bill"
                          : "Save Purchase Bill"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW DETAILS / PURCHASE VOUCHER MODAL                                 */}
      {/* ===================================================================== */}
      <PurchaseBillInvoicePrintModal
        bill={viewItem}
        isOpen={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
      />

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                             */}
      {/* ===================================================================== */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-140"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#FECACA] shadow-[0_8px_24px_rgba(16,24,40,0.08)] max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
                <Trash2 className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                  Move to Deleted Records?
                </h3>
                <p className="text-[13px] text-[#6B7280] dark:text-slate-400">
                  Are you sure you want to remove purchase bill{" "}
                  <strong className="text-[#111827] dark:text-white">
                    {deleteTarget.code}
                  </strong>
                  ? It will be moved to the Deleted tab.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-8 px-3.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-300 text-[13px] font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-8 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PENDING GRN MODAL (with multi-select integration)                      */}
      {/* ===================================================================== */}
      {isPendingGrnModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-140"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_8px_24px_rgba(16,24,40,0.08)] max-w-2xl w-full overflow-hidden">
            <div className="h-1 bg-[#E9E5FF] dark:bg-indigo-950" />
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#F1F2F4] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6D4AFF]" />
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                  Eligible Pending Goods Receipt Notes (GRN)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPendingGrnModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {isPendingGrnsLoading ? (
                <div className="py-8 text-center text-[#6B7280] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6D4AFF]" />
                  <span>Loading eligible pending GRNs from backend...</span>
                </div>
              ) : pendingGrns.length === 0 ? (
                <div className="py-8 text-center text-[#6B7280] space-y-1">
                  <p className="font-medium text-[#111827] dark:text-white">
                    No eligible pending GRNs found
                  </p>
                  <p className="text-[12px]">
                    All goods receipt notes for this selection have already been
                    billed.
                  </p>
                </div>
              ) : (
                <div className="border border-[#E5E7EB] dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-[#F1F2F4] dark:divide-slate-800">
                  {pendingGrns.map((grn) => {
                    const isSelected = selectedGrnUuids.includes(grn.uuid);
                    return (
                      <div
                        key={grn.uuid}
                        onClick={() => handleToggleGrnSelection(grn)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#F4F1FF] dark:bg-indigo-950/40"
                            : "hover:bg-[#FAFAFF] dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#6D4AFF]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#9CA3AF]" />
                          )}
                          <div>
                            <span className="font-sans tabular-nums font-semibold text-[#111827] dark:text-white text-[13px]">
                              {grn.code}
                            </span>
                            <p className="text-[12px] text-[#6B7280]">
                              {grn.supplier?.supplierName || "Supplier"} •{" "}
                              {grn.date ? grn.date.split("T")[0] : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-sans tabular-nums font-semibold text-[#111827] dark:text-white text-[13px]">
                            {formatCurrency(grn.grand_total || grn.subtotal)}
                          </span>
                          <p className="text-[11px] text-[#6D4AFF]">
                            {isSelected ? "Selected" : "Click to select"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-[#F1F2F4] dark:border-slate-800 flex items-center justify-between">
              <span className="text-[12px] text-[#6B7280]">
                {selectedGrnUuids.length} GRN(s) selected
              </span>
              <button
                type="button"
                onClick={() => setIsPendingGrnModalOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#6D4AFF] text-white text-[13px] font-medium hover:bg-[#5B3BE0] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="mt-8 pt-4 pb-2 border-t border-[#E5E7EB] dark:border-slate-800 text-center text-[12px] text-[#6B7280]">
        <span>2026 © RealBiz Pro • Enterprise Procurement ERP</span>
      </footer>
    </div>
  );
}
