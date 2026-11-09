"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  ArrowLeft,
  SquarePen,
  Trash2,
  X,
  Search,
  Check,
  Calendar,
  FileText,
  Printer,
  Eye,
  Handshake,
  Paperclip,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  Package,
  Layers,
} from "lucide-react";
import { procurementAssetRequisitionApi } from "@/lib/procurement";

// ==========================================
// Types & Interfaces
// ==========================================
export interface ApprovalStep {
  label: string;
  type?: "approved" | "rejected" | "handshake" | "pending";
}

export interface AssetItemRow {
  id: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  demandQty: number;
}

export interface AssetRequisition {
  id: number;
  uuid?: string;
  projectType: string;
  project: string;
  titleOfWork: string;
  code: string;
  ref: string;
  date: string;
  demandDate: string;
  addedBy: string;
  approvalSteps: ApprovalStep[];
  attachmentCount: number;
  attachmentName?: string;
  site?: string;
  category?: string;
  task?: string;
  note?: string;
  items: AssetItemRow[];
  totalQty: number;
}

// Preset Asset Catalog for "Select Item" picker
interface CatalogAsset {
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  category: string;
}

const ASSET_CATALOG: CatalogAsset[] = [
  {
    itemCode: "AST-LPT-001",
    itemName: 'Apple MacBook Pro 16" M3 Max (36GB Unified RAM, 1TB SSD)',
    details: "High-spec development workstation for AI/ML engineering team",
    unit: "Pcs",
    category: "IT Equipment",
  },
  {
    itemCode: "AST-LPT-002",
    itemName: 'Dell Latitude 5540 Core i7-1370P (32GB RAM, 512GB NVMe)',
    details: "Enterprise business series laptop with 3-year ProSupport warranty",
    unit: "Pcs",
    category: "IT Equipment",
  },
  {
    itemCode: "AST-MON-001",
    itemName: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
    details: "IPS Black technology with 90W power delivery & Daisy chain support",
    unit: "Pcs",
    category: "IT Equipment",
  },
  {
    itemCode: "AST-SRV-001",
    itemName: "Dell PowerEdge R750xs 2U Rack Server (Dual Xeon Silver, 128GB RAM)",
    details: "Redundant hot-plug power supplies and PERC H755 RAID controller",
    unit: "Unit",
    category: "IT Equipment",
  },
  {
    itemCode: "AST-NET-001",
    itemName: "Cisco Catalyst 9300 Series 48-Port PoE+ Gigabit Switch",
    details: "Managed network switch with modular uplink and Cisco DNA license",
    unit: "Unit",
    category: "Networking & Telecom",
  },
  {
    itemCode: "AST-NET-002",
    itemName: "Fortinet FortiGate 100F Enterprise Next-Gen Firewall",
    details: "Multi-gigabit firewall with redundant WAN and SSL VPN support",
    unit: "Unit",
    category: "Networking & Telecom",
  },
  {
    itemCode: "AST-FUR-001",
    itemName: "Herman Miller Aeron Ergonomic Task Chair (Graphite, Size B)",
    details: "PosturFit SL lumbar support and fully adjustable tilt limiter",
    unit: "Pcs",
    category: "Office Furniture",
  },
  {
    itemCode: "AST-FUR-002",
    itemName: "Executive Mahogany 14-Seat Boardroom Conference Table",
    details: "Integrated pop-up power modules, HDMI/LAN sockets & cable ducting",
    unit: "Set",
    category: "Office Furniture",
  },
  {
    itemCode: "AST-AV-001",
    itemName: "Logitech Rally Plus Ultra-HD Modular Video Conferencing System",
    details: "Dual speakers, dual mic pods, Table Hub and Display Hub",
    unit: "Set",
    category: "Audio / Visual",
  },
  {
    itemCode: "AST-AV-002",
    itemName: 'Samsung 75" 4K UHD Commercial Smart Signage Display',
    details: "Non-glare panel, 24/7 continuous operation for board room",
    unit: "Pcs",
    category: "Audio / Visual",
  },
  {
    itemCode: "AST-PWR-001",
    itemName: "APC Smart-UPS On-Line 10kVA / 10kW 230V Rack/Tower",
    details: "Double-conversion online UPS with Network Management Card",
    unit: "Unit",
    category: "Power & UPS",
  },
];

// Initial mock data
const INITIAL_ASSET_REQUISITIONS: AssetRequisition[] = [
  {
    id: 1,
    projectType: "Internal",
    project: "Somikoron Tower Headquarter",
    titleOfWork: "Executive Workstation & AI Lab Setup",
    code: "AR00001",
    ref: "REF-2026-001",
    date: "22/10/2026",
    demandDate: "30/10/2026",
    addedBy: "Admin / Arafat",
    approvalSteps: [
      { label: "Dept Head", type: "approved" },
      { label: "Finance", type: "approved" },
      { label: "Management", type: "handshake" },
    ],
    attachmentCount: 2,
    attachmentName: "it_workstation_specs_v2.pdf",
    site: "Dhaka Head Office (Level 9)",
    category: "IT Equipment",
    task: "Hardware Procurement",
    note: "Urgent requisition for new senior AI researchers and software engineers joining next month.",
    items: [
      {
        id: "ast-row-1",
        itemCode: "AST-LPT-001",
        itemName: 'Apple MacBook Pro 16" M3 Max (36GB Unified RAM, 1TB SSD)',
        details: "For Lead AI Engineer & Senior Architect",
        unit: "Pcs",
        demandQty: 4,
      },
      {
        id: "ast-row-2",
        itemCode: "AST-MON-001",
        itemName: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
        details: "Dual monitor setup for workstations",
        unit: "Pcs",
        demandQty: 8,
      },
      {
        id: "ast-row-3",
        itemCode: "AST-FUR-001",
        itemName: "Herman Miller Aeron Ergonomic Task Chair (Graphite, Size B)",
        details: "Lumbar support for prolonged work hours",
        unit: "Pcs",
        demandQty: 6,
      },
    ],
    totalQty: 18,
  },
  {
    id: 2,
    projectType: "Client Project",
    project: "Banani Innovation Hub",
    titleOfWork: "Core Network Switch & Firewall Upgrade",
    code: "AR00002",
    ref: "REF-2026-002",
    date: "19/10/2026",
    demandDate: "27/10/2026",
    addedBy: "Tariqul Islam",
    approvalSteps: [
      { label: "Dept Head", type: "approved" },
      { label: "Finance", type: "approved" },
    ],
    attachmentCount: 1,
    attachmentName: "network_architecture_diagram.pdf",
    site: "Banani Corporate Hub",
    category: "Networking & Telecom",
    task: "Rack Mount & Cabling",
    note: "Replacement of obsolete distribution switches to ensure 10Gbps backbone across the floor.",
    items: [
      {
        id: "ast-row-4",
        itemCode: "AST-NET-001",
        itemName: "Cisco Catalyst 9300 Series 48-Port PoE+ Gigabit Switch",
        details: "Core distribution switches for Server Room B",
        unit: "Unit",
        demandQty: 2,
      },
      {
        id: "ast-row-5",
        itemCode: "AST-NET-002",
        itemName: "Fortinet FortiGate 100F Enterprise Next-Gen Firewall",
        details: "High availability (HA) secondary pair",
        unit: "Unit",
        demandQty: 1,
      },
    ],
    totalQty: 3,
  },
  {
    id: 3,
    projectType: "Corporate",
    project: "Chattogram Regional Hub",
    titleOfWork: "Executive Boardroom AV Setup",
    code: "AR00003",
    ref: "REF-2026-003",
    date: "15/10/2026",
    demandDate: "25/10/2026",
    addedBy: "Mahmudul Hasan",
    approvalSteps: [
      { label: "Dept Head", type: "approved" },
      { label: "Management", type: "approved" },
    ],
    attachmentCount: 3,
    attachmentName: "boardroom_layout_quote.pdf",
    site: "Chattogram Regional Office",
    category: "Audio / Visual",
    task: "Meeting Room AV Systems",
    note: "Complete AV overhaul with dual display conferencing and ceiling mic array.",
    items: [
      {
        id: "ast-row-6",
        itemCode: "AST-AV-001",
        itemName: "Logitech Rally Plus Ultra-HD Modular Video Conferencing System",
        details: "For executive boardroom meetings",
        unit: "Set",
        demandQty: 1,
      },
      {
        id: "ast-row-7",
        itemCode: "AST-AV-002",
        itemName: 'Samsung 75" 4K UHD Commercial Smart Signage Display',
        details: "Dual presentation screens",
        unit: "Pcs",
        demandQty: 2,
      },
    ],
    totalQty: 3,
  },
  {
    id: 4,
    projectType: "Commercial",
    project: "Uttara Data Center",
    titleOfWork: "Server Room Rack & Power Conditioning",
    code: "AR00004",
    ref: "REF-2026-004",
    date: "11/10/2026",
    demandDate: "20/10/2026",
    addedBy: "Nafis Fuad",
    approvalSteps: [
      { label: "Dept Head", type: "approved" },
      { label: "Finance", type: "handshake" },
    ],
    attachmentCount: 1,
    attachmentName: "ups_load_calculation.xlsx",
    site: "Uttara Data Center Hub",
    category: "Power & UPS",
    task: "Server Installation",
    note: "Online UPS backup expansion to support increased rack compute density.",
    items: [
      {
        id: "ast-row-8",
        itemCode: "AST-PWR-001",
        itemName: "APC Smart-UPS On-Line 10kVA / 10kW 230V Rack/Tower",
        details: "With external battery pack",
        unit: "Unit",
        demandQty: 2,
      },
      {
        id: "ast-row-9",
        itemCode: "AST-SRV-001",
        itemName: "Dell PowerEdge R750xs 2U Rack Server (Dual Xeon Silver, 128GB RAM)",
        details: "Storage virtualization node",
        unit: "Unit",
        demandQty: 2,
      },
    ],
    totalQty: 4,
  },
];

export default function AssetRequisitionView() {
  const router = useRouter();
  const STORAGE_KEY = "realbiz_asset_requisitions_v1";

  // View Mode: "list" (Screenshot 1) vs "create" (Screenshot 2)
  const [viewMode, setViewMode] = useState<"list" | "create">("list");

  // Requisitions State
  const [requisitions, setRequisitions] = useState<AssetRequisition[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter State (Screenshot 1)
  const [filterDate, setFilterDate] = useState("1 October, 2026 - 31 October, 2026");
  const [filterCompany, setFilterCompany] = useState("Somikoron IT Ltd");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTitleOfWork, setFilterTitleOfWork] = useState("");

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting State
  const [sortField, setSortField] = useState<keyof AssetRequisition | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // View Modal State
  const [viewingRequisition, setViewingRequisition] = useState<AssetRequisition | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<AssetRequisition | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // -------------------------------------------------------------
  // Form View State (Screenshot 2)
  // -------------------------------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState("22/10/2026");
  const [formDemandDate, setFormDemandDate] = useState("");
  const [formCode, setFormCode] = useState("AR00001");
  const [formRef, setFormRef] = useState("");
  const [formProjectType, setFormProjectType] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formTitleOfWork, setFormTitleOfWork] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formSite, setFormSite] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState("");
  const [formAttachmentName, setFormAttachmentName] = useState<string>("");
  const [formNote, setFormNote] = useState("");
  const [formItems, setFormItems] = useState<AssetItemRow[]>([]);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load from API or fallback
  const fetchRequisitions = async () => {
    setIsLoading(true);
    try {
      const res = await procurementAssetRequisitionApi.getRequisitions({
        page: currentPage,
        limit: entriesPerPage,
        search: search || undefined,
      });
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: AssetRequisition[] = res.data.map((item, idx) => ({
          id: item.id || idx + 1,
          uuid: item.uuid,
          projectType: item.projectType?.name || "Internal",
          project: item.project?.name || "Somikoron Tower Headquarter",
          titleOfWork: item.titleOfWork?.name || "Asset Procurement",
          code: item.code,
          ref: item.ref || "",
          date: item.date ? item.date.split("T")[0] : "",
          demandDate: item.demand_date ? item.demand_date.split("T")[0] : "",
          addedBy: item.addedBy?.name || item.createdBy || "Admin",
          approvalSteps: [
            { label: "Dept Head", type: item.status === "approved" ? "approved" : "pending" },
            { label: "Finance", type: item.status === "completed" ? "approved" : "pending" },
          ],
          attachmentCount: item.attachment ? 1 : 0,
          attachmentName: item.attachment,
          site: item.site?.name || "",
          category: item.category?.name || "",
          task: item.task?.taskName || "",
          note: item.note || "",
          items: (item.items || []).map((it, itemIdx) => ({
            id: it.uuid || String(itemIdx + 1),
            itemCode: it.item?.item_code || "",
            itemName: it.item?.name || "",
            details: it.details || "",
            unit: it.item?.unit?.name || it.item?.unit?.code || "Pcs",
            demandQty: Number(it.demand_qty) || 0,
          })),
          totalQty: (item.items || []).reduce((acc, curr) => acc + (Number(curr.demand_qty) || 0), 0),
        }));
        setRequisitions(mapped);
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRequisitions(parsed);
              return;
            }
          }
        } catch {}
        setRequisitions(INITIAL_ASSET_REQUISITIONS);
      }
    } catch (e) {
      console.warn("Could not read from API, falling back to local data", e);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRequisitions(parsed);
            return;
          }
        }
      } catch {}
      setRequisitions(INITIAL_ASSET_REQUISITIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [currentPage, entriesPerPage, search]);

  // Save to localStorage when changed
  const saveRequisitions = (newList: AssetRequisition[]) => {
    setRequisitions(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  };

  // Generate next AR Code
  const getNextCode = () => {
    if (requisitions.length === 0) return "AR00001";
    const nums = requisitions.map((r) => {
      const match = r.code.match(/AR(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...nums, 0);
    return `AR${String(max + 1).padStart(5, "0")}`;
  };

  // Switch to Create Mode (New)
  const handleOpenCreate = () => {
    setEditingId(null);
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    setFormDate(formattedToday);
    setFormDemandDate("");
    setFormCode(getNextCode());
    setFormRef("");
    setFormProjectType("");
    setFormProject("");
    setFormTitleOfWork("");
    setFormTask("");
    setFormSite("");
    setFormCategory("");
    setSelectedCatalogItem("");
    setFormAttachmentName("");
    setFormNote("");
    setFormItems([]);
    setViewMode("create");
  };

  // Switch to Edit Mode
  const handleOpenEdit = (item: AssetRequisition) => {
    setEditingId(item.id);
    setFormDate(item.date || "22/10/2026");
    setFormDemandDate(item.demandDate || "");
    setFormCode(item.code || getNextCode());
    setFormRef(item.ref || "");
    setFormProjectType(item.projectType || "");
    setFormProject(item.project || "");
    setFormTitleOfWork(item.titleOfWork || "");
    setFormTask(item.task || "");
    setFormSite(item.site || "");
    setFormCategory(item.category || "");
    setSelectedCatalogItem("");
    setFormAttachmentName(item.attachmentName || "");
    setFormNote(item.note || "");
    setFormItems(item.items || []);
    setActiveMenuId(null);
    setViewMode("create");
  };

  // Add Item to table from Select Item dropdown
  const handleAddCatalogItem = () => {
    if (!selectedCatalogItem) {
      // If nothing selected, prompt user or add a blank row
      const newCustomItem: AssetItemRow = {
        id: `ast-row-${Date.now()}`,
        itemCode: `AST-CST-${String(formItems.length + 1).padStart(3, "0")}`,
        itemName: "Custom Asset Equipment",
        details: "Enter specific technical requirements here",
        unit: "Pcs",
        demandQty: 1,
      };
      setFormItems((prev) => [...prev, newCustomItem]);
      showToast("Added custom asset row to table", "info");
      return;
    }

    const found = ASSET_CATALOG.find((a) => a.itemCode === selectedCatalogItem);
    if (!found) return;

    // Check if already in items
    const existingIndex = formItems.findIndex((it) => it.itemCode === found.itemCode);
    if (existingIndex >= 0) {
      setFormItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, demandQty: it.demandQty + 1 } : it))
      );
      showToast(`Increased quantity for ${found.itemCode}`, "info");
    } else {
      const newItem: AssetItemRow = {
        id: `ast-row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemCode: found.itemCode,
        itemName: found.itemName,
        details: found.details,
        unit: found.unit,
        demandQty: 1,
      };
      setFormItems((prev) => [...prev, newItem]);
      showToast(`Added ${found.itemCode} to table`, "success");
    }
  };

  // Update item field
  const handleUpdateItemField = (id: string, field: keyof AssetItemRow, value: string | number) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === "demandQty") {
            const num = typeof value === "string" ? parseInt(value, 10) || 0 : value;
            return { ...item, demandQty: Math.max(0, num) };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Remove item from table
  const handleRemoveItem = (id: string) => {
    setFormItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate total demand quantity in form
  const formTotalDemandQty = useMemo(() => {
    return formItems.reduce((acc, curr) => acc + (Number(curr.demandQty) || 0), 0);
  }, [formItems]);

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      showToast("Requisition Code is required", "error");
      return;
    }

    if (formItems.length === 0) {
      showToast("Please add at least one asset item before submitting", "error");
      return;
    }

    if (editingId) {
      // Update existing
      const updatedList = requisitions.map((req) => {
        if (req.id === editingId) {
          return {
            ...req,
            date: formDate,
            demandDate: formDemandDate || formDate,
            code: formCode,
            ref: formRef,
            projectType: formProjectType || "Internal",
            project: formProject || "General Corporate",
            titleOfWork: formTitleOfWork || "Asset Procurement",
            task: formTask,
            site: formSite,
            category: formCategory,
            note: formNote,
            attachmentCount: formAttachmentName ? 1 : req.attachmentCount,
            attachmentName: formAttachmentName || req.attachmentName,
            items: formItems,
            totalQty: formTotalDemandQty,
          };
        }
        return req;
      });
      saveRequisitions(updatedList);
      showToast(`Requisition ${formCode} updated successfully`, "success");
    } else {
      // Create new
      const newId = requisitions.length > 0 ? Math.max(...requisitions.map((r) => r.id)) + 1 : 1;
      const newRecord: AssetRequisition = {
        id: newId,
        projectType: formProjectType || "Internal",
        project: formProject || "Somikoron Tower Headquarter",
        titleOfWork: formTitleOfWork || "Asset Procurement",
        code: formCode,
        ref: formRef || `REF-${new Date().getFullYear()}-${String(newId).padStart(3, "0")}`,
        date: formDate,
        demandDate: formDemandDate || formDate,
        addedBy: "Admin / Arafat",
        approvalSteps: [
          { label: "Dept Head", type: "approved" },
          { label: "Finance", type: "pending" },
        ],
        attachmentCount: formAttachmentName ? 1 : 0,
        attachmentName: formAttachmentName,
        site: formSite,
        category: formCategory,
        task: formTask,
        note: formNote,
        items: formItems,
        totalQty: formTotalDemandQty,
      };

      saveRequisitions([newRecord, ...requisitions]);
      showToast(`Asset Requisition ${formCode} created successfully!`, "success");
    }

    setViewMode("list");
  };

  // Delete Requisition
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.uuid) {
        await procurementAssetRequisitionApi.deleteRequisition(deleteTarget.uuid);
      }
      const remaining = requisitions.filter((r) => r.id !== deleteTarget.id);
      saveRequisitions(remaining);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      showToast(`Requisition ${deleteTarget.code} deleted`, "info");
    } catch (e: any) {
      console.error("Failed to delete requisition", e);
      showToast(e?.response?.data?.message || "Failed to delete requisition", "error");
    } finally {
      setDeleteTarget(null);
    }
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
  const handleSort = (field: keyof AssetRequisition) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Search Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...requisitions];

    // Filter by Project
    if (filterProject) {
      result = result.filter((r) => r.project.toLowerCase().includes(filterProject.toLowerCase()));
    }

    // Filter by Title of Work
    if (filterTitleOfWork) {
      result = result.filter((r) =>
        r.titleOfWork.toLowerCase().includes(filterTitleOfWork.toLowerCase())
      );
    }

    // Search query across fields
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q) ||
          r.titleOfWork.toLowerCase().includes(q) ||
          r.projectType.toLowerCase().includes(q) ||
          r.ref.toLowerCase().includes(q) ||
          r.addedBy.toLowerCase().includes(q)
      );
    }

    // Sort
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
  }, [requisitions, filterProject, filterTitleOfWork, search, sortField, sortDirection]);

  // Pagination Logic
  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * entriesPerPage;
  const currentEntries = filteredAndSorted.slice(startIdx, startIdx + entriesPerPage);

  const displayFrom = totalEntries === 0 ? 0 : startIdx + 1;
  const displayTo = Math.min(startIdx + entriesPerPage, totalEntries);

  // Available catalog items filtered by selected category
  const filteredCatalogOptions = useMemo(() => {
    if (!formCategory) return ASSET_CATALOG;
    return ASSET_CATALOG.filter((item) => item.category === formCategory);
  }, [formCategory]);

  // =========================================================================
  // RENDER: CREATE / NEW REQUISITION VIEW (Screenshot 2)
  // =========================================================================
  if (viewMode === "create") {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 font-sans transition-colors duration-200">
        {/* Toast Alert */}
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
              <Link href="/dashboard" className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400">
                Home
              </Link>
              <span className="text-slate-400 dark:text-slate-600">›</span>
              <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
                <span>Requisition</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span className="text-slate-400 dark:text-slate-600">›</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Asset Requisition</span>
            </nav>

            {/* Back to List Button */}
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>«Asset Requisition List</span>
            </button>
          </div>

          {/* Form Card: Metadata Grid (Screenshot 2) */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select value</option>
                      <option value="Internal">Internal</option>
                      <option value="Client Project">Client Project</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Government">Government</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Project</option>
                      <option value="Somikoron Tower Headquarter">Somikoron Tower Headquarter</option>
                      <option value="Banani Innovation Hub">Banani Innovation Hub</option>
                      <option value="Chattogram Regional Hub">Chattogram Regional Hub</option>
                      <option value="Uttara Data Center">Uttara Data Center</option>
                      <option value="Sylhet Operations Hub">Sylhet Operations Hub</option>
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Title/Name of Work</option>
                      <option value="Executive Workstation & AI Lab Setup">Executive Workstation & AI Lab Setup</option>
                      <option value="Core Network Switch & Firewall Upgrade">Core Network Switch & Firewall Upgrade</option>
                      <option value="Executive Boardroom AV Setup">Executive Boardroom AV Setup</option>
                      <option value="Server Room Rack & Power Conditioning">Server Room Rack & Power Conditioning</option>
                      <option value="Security Access Control & Surveillance">Security Access Control & Surveillance</option>
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Task</option>
                      <option value="Hardware Procurement">Hardware Procurement</option>
                      <option value="Rack Mount & Cabling">Rack Mount & Cabling</option>
                      <option value="Meeting Room AV Systems">Meeting Room AV Systems</option>
                      <option value="Server Installation">Server Installation</option>
                      <option value="Workstation Wiring">Workstation Wiring</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 3: Site, Category, Select Item + button, Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Site
                  </label>
                  <div className="relative">
                    <select
                      value={formSite}
                      onChange={(e) => setFormSite(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Site</option>
                      <option value="Dhaka Head Office (Level 9)">Dhaka Head Office (Level 9)</option>
                      <option value="Banani Corporate Hub">Banani Corporate Hub</option>
                      <option value="Chattogram Regional Office">Chattogram Regional Office</option>
                      <option value="Uttara Data Center Hub">Uttara Data Center Hub</option>
                      <option value="Central Warehouse 02">Central Warehouse 02</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      <option value="IT Equipment">IT Equipment</option>
                      <option value="Networking & Telecom">Networking & Telecom</option>
                      <option value="Office Furniture">Office Furniture</option>
                      <option value="Audio / Visual">Audio / Visual</option>
                      <option value="Power & UPS">Power & UPS</option>
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 pr-7 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs truncate cursor-pointer"
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

                    {/* Screenshot 2: Purple "+" Button adjacent to select item */}
                    <button
                      type="button"
                      onClick={handleAddCatalogItem}
                      title="Add selected item to requisition table"
                      className="shrink-0 w-9 h-[37px] flex items-center justify-center bg-[#6366F1] hover:bg-[#5254d8] text-white rounded-md shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Attachment
                  </label>
                  <div className="relative flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 px-3 py-1.5 shadow-2xs">
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
                      id="asset-req-file-input"
                    />
                    <label
                      htmlFor="asset-req-file-input"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 cursor-pointer transition-colors shrink-0"
                    >
                      Choose File
                    </label>
                    <span className="ml-2.5 text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
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

            {/* Items Table (Screenshot 2) */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Purple Table Header */}
                  <thead>
                    <tr className="bg-[#6366F1] text-white font-semibold tracking-wide">
                      <th className="py-2.5 px-4 w-[16%] uppercase text-[11px]">ITEM CODE</th>
                      <th className="py-2.5 px-4 w-[28%] uppercase text-[11px]">ITEM NAME</th>
                      <th className="py-2.5 px-4 w-[26%] uppercase text-[11px]">DETAILS</th>
                      <th className="py-2.5 px-4 w-[10%] uppercase text-[11px]">UNIT</th>
                      <th className="py-2.5 px-4 w-[12%] uppercase text-[11px]">DEMAND QTY</th>
                      <th className="py-2.5 px-4 w-[8%] text-center uppercase text-[11px]">ACTION</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                          <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-[1.5]" />
                          <p className="text-xs font-medium">No items added to this requisition.</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Select an item from the dropdown above and click the purple &ldquo;+&rdquo; button.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      formItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Item Code */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleUpdateItemField(item.id, "itemCode", e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Item Name */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleUpdateItemField(item.id, "itemName", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 px-1 py-1 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none"
                            />
                          </td>

                          {/* Details */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.details}
                              onChange={(e) => handleUpdateItemField(item.id, "details", e.target.value)}
                              placeholder="Specifications / remarks"
                              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItemField(item.id, "unit", e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 text-center font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Demand Qty */}
                          <td className="py-2.5 px-4">
                            <input
                              type="number"
                              min="1"
                              value={item.demandQty}
                              onChange={(e) => handleUpdateItemField(item.id, "demandQty", e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                            />
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-4 text-center">
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

              {/* Table Action Footbar (Quick add row helper) */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total Items: <strong className="text-slate-700 dark:text-slate-200">{formItems.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleAddCatalogItem}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Item Row</span>
                </button>
              </div>
            </div>

            {/* Bottom Section: Note (Left) & Total + Submit (Right) (Screenshot 2) */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Note Field (Left) */}
                <div className="lg:col-span-6 space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Note
                  </label>
                  <textarea
                    rows={4}
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Enter any justification, delivery instructions or requisition notes..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y shadow-2xs"
                  />
                </div>

                {/* Total & Submit Button (Right) */}
                <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6 pt-1">
                  {/* Total field matching Screenshot 2 */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 shrink-0">
                      Total :
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={formTotalDemandQty}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 font-semibold focus:outline-none shadow-2xs cursor-default"
                    />
                  </div>

                  {/* Submit Button matching Screenshot 2 */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-8 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      <span>Submit</span>
                    </button>
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
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 text-xs font-medium border border-slate-700/50">
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Top Header & Breadcrumb & Action Button (Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[13px] font-normal">
            <Link href="/dashboard" className="text-[#5D5FEF] hover:text-[#4A4CE0] dark:text-indigo-400">
              Home
            </Link>
            <span className="text-slate-400 dark:text-slate-600">›</span>
            <div className="inline-flex items-center gap-1 text-[#5D5FEF] dark:text-indigo-400 cursor-pointer hover:underline">
              <span>Requisition</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <span className="text-slate-400 dark:text-slate-600">›</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Asset Requisition List</span>
          </nav>

          {/* "+New Asset Requisition" Button matching Screenshot 1 */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs sm:text-[13px] font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Asset Requisition</span>
          </button>
        </div>

        {/* Filter Section: 2 Rows as shown in Screenshot 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
          {/* Row 1: Select Date, Company, Supplier, Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Select Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Company with 'x' icon and dropdown chevron */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Company
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3.5 pr-14 py-2 text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5 text-slate-400">
                  {filterCompany && (
                    <button
                      type="button"
                      onClick={() => setFilterCompany("")}
                      className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select an option</option>
                  <option value="Dell Global Services">Dell Global Services</option>
                  <option value="Cisco Bangladesh Ltd">Cisco Bangladesh Ltd</option>
                  <option value="Smart Technologies Ltd">Smart Technologies Ltd</option>
                  <option value="Herman Miller Bangladesh">Herman Miller Bangladesh</option>
                  <option value="Schneider Electric / APC">Schneider Electric / APC</option>
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select value</option>
                  <option value="Somikoron Tower Headquarter">Somikoron Tower Headquarter</option>
                  <option value="Banani Innovation Hub">Banani Innovation Hub</option>
                  <option value="Chattogram Regional Hub">Chattogram Regional Hub</option>
                  <option value="Uttara Data Center">Uttara Data Center</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Title/Name of Work */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pr-8 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Title/Name of Work</option>
                  <option value="Executive Workstation & AI Lab Setup">Executive Workstation & AI Lab Setup</option>
                  <option value="Core Network Switch & Firewall Upgrade">Core Network Switch & Firewall Upgrade</option>
                  <option value="Executive Boardroom AV Setup">Executive Boardroom AV Setup</option>
                  <option value="Server Room Rack & Power Conditioning">Server Room Rack & Power Conditioning</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-md px-4 py-2.5 text-xs animate-in fade-in duration-150">
            <span className="font-medium text-indigo-900 dark:text-indigo-200">
              Selected <strong>{selectedIds.length}</strong> requisition(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  showToast(`Converting ${selectedIds.length} requisitions to Asset PO...`, "info");
                  setSelectedIds([]);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
              >
                Convert to Asset PO
              </button>
              <button
                onClick={() => {
                  const filtered = requisitions.filter((r) => !selectedIds.includes(r.id));
                  saveRequisitions(filtered);
                  setSelectedIds([]);
                  showToast("Selected requisitions deleted", "info");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-3 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Table Container Card (Screenshot 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
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

          {/* Table Data (Purple Header matching Screenshot 1) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#6366F1] text-white font-semibold tracking-wide">
                  {/* ID */}
                  <th
                    onClick={() => handleSort("id")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* SELECT Checkbox */}
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

                  {/* PROJECT TYPE */}
                  <th
                    onClick={() => handleSort("projectType")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT TYPE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* PROJECT */}
                  <th
                    onClick={() => handleSort("project")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>PROJECT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* TITLE/NAME OF WORK */}
                  <th
                    onClick={() => handleSort("titleOfWork")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>TITLE/NAME OF WORK</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* CODE */}
                  <th
                    onClick={() => handleSort("code")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>CODE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* REF */}
                  <th
                    onClick={() => handleSort("ref")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>REF</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* DATE */}
                  <th
                    onClick={() => handleSort("date")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>DATE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* DEMAND DATE */}
                  <th
                    onClick={() => handleSort("demandDate")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>DEMAND DATE</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* ADDED BY */}
                  <th
                    onClick={() => handleSort("addedBy")}
                    className="py-3 px-3.5 cursor-pointer select-none hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>ADDED BY</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* APPROVAL LAYER */}
                  <th className="py-3 px-3.5 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>APPROVAL LAYER</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* ATTACHMENT */}
                  <th className="py-3 px-3.5 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>ATTACHMENT</span>
                      <ChevronsUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  {/* ACTION */}
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
                  /* Exact empty state text matching Screenshot 1 */
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
                        {/* ID */}
                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {row.id}
                        </td>

                        {/* SELECT */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* PROJECT TYPE */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                            {row.projectType}
                          </span>
                        </td>

                        {/* PROJECT */}
                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {row.project}
                        </td>

                        {/* TITLE/NAME OF WORK */}
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-[220px] truncate" title={row.titleOfWork}>
                          {row.titleOfWork}
                        </td>

                        {/* CODE */}
                        <td className="py-3 px-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">
                          {row.code}
                        </td>

                        {/* REF */}
                        <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.ref || "—"}
                        </td>

                        {/* DATE */}
                        <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* DEMAND DATE */}
                        <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.demandDate}
                        </td>

                        {/* ADDED BY */}
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {row.addedBy}
                        </td>

                        {/* APPROVAL LAYER */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.approvalSteps?.map((step, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${
                                  step.type === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                    : step.type === "handshake"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                              >
                                {step.type === "approved" && <Check className="w-3 h-3 stroke-[2.5]" />}
                                {step.type === "handshake" && <Handshake className="w-3 h-3 stroke-[2]" />}
                                <span>{step.label}</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* ATTACHMENT */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {row.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                              <Paperclip className="w-3 h-3" />
                              <span>{row.attachmentCount} files</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* ACTION */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap relative">
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                              }}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Action</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Action Dropdown Menu */}
                            {activeMenuId === row.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-3 top-10 z-40 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingRequisition(row);
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
                                  <span>Edit Requisition</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    window.print();
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Print / Export</span>
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

          {/* Table Footer: Showing X to Y of Z entries & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            {/* Showing entries text matching Screenshot 1 */}
            <div>
              Showing {displayFrom} to {displayTo} of {totalEntries} entries
            </div>

            {/* Pagination Controls */}
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
      {/* VIEW REQUISITION DETAILS MODAL */}
      {/* ========================================================= */}
      {viewingRequisition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Requisition: {viewingRequisition.code}</span>
                  <span className="text-xs font-normal text-slate-500">({viewingRequisition.projectType})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingRequisition.titleOfWork}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequisition(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Project:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.project}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Demand Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.demandDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Added By:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.addedBy}</span>
              </div>
              {viewingRequisition.site && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Site:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.site}</span>
                </div>
              )}
              {viewingRequisition.category && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Category:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.category}</span>
                </div>
              )}
              {viewingRequisition.task && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Task:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingRequisition.task}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-2">Requisition Items</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#6366F1] text-white">
                    <tr>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Details</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3 text-right">Demand Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingRequisition.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">{it.itemCode}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{it.itemName}</td>
                        <td className="py-2 px-3 text-slate-500">{it.details || "—"}</td>
                        <td className="py-2 px-3">{it.unit}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{it.demandQty}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="py-2 px-3 text-right">Total Demand Qty:</td>
                      <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">{viewingRequisition.totalQty}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Note */}
            {viewingRequisition.note && (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 p-3 rounded text-xs text-amber-900 dark:text-amber-200">
                <strong className="block text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300">Note:</strong>
                {viewingRequisition.note}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingRequisition(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingRequisition(null);
                  handleOpenEdit(viewingRequisition);
                }}
                className="px-4 py-2 rounded-md bg-[#6366F1] hover:bg-[#5254d8] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Edit Requisition
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
              Are you sure you want to delete asset requisition{" "}
              <strong className="text-slate-900 dark:text-white">{deleteTarget.code}</strong>?
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
