"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Receipt,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Coins,
  TrendingUp,
  DollarSign,
  TrendingDown,
  Layers,
  Settings,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Car,
  ChevronRight,
  RefreshCw,
  Edit2,
  Trash2,
  CreditCard,
  Calendar,
} from "lucide-react";
import { CSPageHeader } from "@/components/customer-service/CSPageHeader";
import { CSStatCard } from "@/components/customer-service/CSStatCard";
import { CSTable, Column } from "@/components/customer-service/CSTable";
import { CSFilterTabs } from "@/components/customer-service/CSFilterTabs";
import { CSModal } from "@/components/customer-service/CSModal";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { CSSelectProjectEmptyState } from "@/components/customer-service/CSSelectProjectEmptyState";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import {
  RateBasis,
  ServiceChargePaymentStatus,
  BuildingIncomeType,
  BuildingExpenseType,
  ServiceChargeRate,
  FlatServiceChargeItem,
  BuildingIncomeItem,
  BuildingExpenseItem,
  MonthlySummaryData,
  getServiceChargeRate,
  upsertServiceChargeRate,
  generateMonthlyCharges,
  createFlatCharge,
  getFlatServiceCharges,
  collectChargePayment,
  createBuildingIncome,
  getBuildingIncomes,
  updateBuildingIncome,
  deleteBuildingIncome,
  createBuildingExpense,
  getBuildingExpenses,
  updateBuildingExpense,
  deleteBuildingExpense,
  getMonthlySummary,
} from "@/services/customerServiceChargeService";

const TABS = [
  { id: "charges", label: "Flat Charges" },
  { id: "income", label: "Extra Income" },
  { id: "expenses", label: "Expenses" },
  { id: "summary", label: "Monthly Summary" },
];

export default function ServiceChargePage() {
  const { primaryColor } = useTheme();
  const brand = primaryColor || "#6D4AFF";
  const { projectId, project, isLoading: isProjectLoading } = useSelectedProject();

  // Active top tab
  const [activeTab, setActiveTab] = useState("charges");

  // Selected Billing Month (defaults to current YYYY-MM)
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // ---------------------------------------------------------------------------
  // TAB 1: CHARGES STATE
  // ---------------------------------------------------------------------------
  const [rateConfig, setRateConfig] = useState<ServiceChargeRate | null>(null);
  const [charges, setCharges] = useState<FlatServiceChargeItem[]>([]);
  const [chargesStats, setChargesStats] = useState({
    total_flats: 0,
    total_receivable: 0,
    total_collected: 0,
    total_due: 0,
    collection_rate_percent: 0,
    paid_count: 0,
    due_count: 0,
  });
  const [chargesStatusFilter, setChargesStatusFilter] = useState("all");
  const [chargesSearch, setChargesSearch] = useState("");
  const [isChargesLoading, setIsChargesLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 2: EXTRA INCOMES STATE
  // ---------------------------------------------------------------------------
  const [incomes, setIncomes] = useState<BuildingIncomeItem[]>([]);
  const [incomesStats, setIncomesStats] = useState<{ total_income: number; by_category: Record<string, number> }>({
    total_income: 0,
    by_category: {},
  });
  const [incomeTypeFilter, setIncomeTypeFilter] = useState("all");
  const [incomeSearch, setIncomeSearch] = useState("");
  const [isIncomesLoading, setIsIncomesLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 3: EXPENSES STATE
  // ---------------------------------------------------------------------------
  const [expenses, setExpenses] = useState<BuildingExpenseItem[]>([]);
  const [expensesStats, setExpensesStats] = useState<{ total_expense: number; by_category: Record<string, number> }>({
    total_expense: 0,
    by_category: {},
  });
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 4: MONTHLY SUMMARY STATE
  // ---------------------------------------------------------------------------
  const [summaryData, setSummaryData] = useState<MonthlySummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // MODALS STATE
  // ---------------------------------------------------------------------------
  // 1. Tariff Modal
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffForm, setTariffForm] = useState({
    rate_basis: "PER_SQFT" as RateBasis,
    rate_per_sqft: 5.0,
    fixed_rate_per_flat: 5000.0,
    due_day_of_month: 10,
    notes: "",
  });

  // 2. Generate Bills Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    billing_month: currentMonthStr,
    due_date: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // 3. Collect Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedChargeForPayment, setSelectedChargeForPayment] = useState<FlatServiceChargeItem | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paid_amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "Bank Transfer",
    reference_number: "",
    notes: "",
  });
  const [isCollecting, setIsCollecting] = useState(false);

  // 4. Create Single Flat Bill Modal
  const [isCreateChargeModalOpen, setIsCreateChargeModalOpen] = useState(false);
  const [createChargeForm, setCreateChargeForm] = useState({
    flat_number: "",
    resident_name: "",
    resident_phone: "",
    flat_size_sqft: 1500,
    billing_month: currentMonthStr,
    total_amount: "",
    due_date: "",
    notes: "",
  });

  // 5. Income Modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<BuildingIncomeItem | null>(null);
  const [incomeForm, setIncomeForm] = useState({
    income_type: "COMMUNITY_HALL" as BuildingIncomeType,
    title: "",
    amount: 0,
    income_date: new Date().toISOString().slice(0, 10),
    received_from: "",
    source_reference: "",
    notes: "",
  });

  // 6. Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BuildingExpenseItem | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    expense_type: "MAINTENANCE" as BuildingExpenseType,
    title: "",
    vendor_name: "",
    amount: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    invoice_reference: "",
    payment_status: "PAID" as "PAID" | "PENDING",
    notes: "",
  });

  // ---------------------------------------------------------------------------
  // DATA LOADERS
  // ---------------------------------------------------------------------------

  // Load Rate
  const loadRate = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getServiceChargeRate(projectId);
      setRateConfig(res);
      setTariffForm({
        rate_basis: res.rate_basis,
        rate_per_sqft: res.rate_per_sqft || 5.0,
        fixed_rate_per_flat: res.fixed_rate_per_flat || 5000.0,
        due_day_of_month: res.due_day_of_month || 10,
        notes: res.notes || "",
      });
    } catch (err) {
      console.error("Failed to load tariff rate:", err);
    }
  }, [projectId]);

  // Load Charges
  const loadCharges = useCallback(async () => {
    if (!projectId) return;
    setIsChargesLoading(true);
    try {
      const res = await getFlatServiceCharges({
        project_id: projectId,
        billing_month: selectedMonth || undefined,
        payment_status: chargesStatusFilter !== "all" ? chargesStatusFilter : undefined,
        search: chargesSearch.trim() || undefined,
        limit: 100,
      });
      setCharges(res.items);
      setChargesStats(res.stats);
    } catch (err) {
      console.error("Failed to load charges:", err);
      toast.error("Failed to load flat service charges");
    } finally {
      setIsChargesLoading(false);
    }
  }, [projectId, selectedMonth, chargesStatusFilter, chargesSearch]);

  // Load Incomes
  const loadIncomes = useCallback(async () => {
    if (!projectId) return;
    setIsIncomesLoading(true);
    try {
      const res = await getBuildingIncomes({
        project_id: projectId,
        month: selectedMonth || undefined,
        income_type: incomeTypeFilter !== "all" ? incomeTypeFilter : undefined,
        search: incomeSearch.trim() || undefined,
        limit: 100,
      });
      setIncomes(res.items);
      setIncomesStats(res.stats);
    } catch (err) {
      console.error("Failed to load incomes:", err);
      toast.error("Failed to load building incomes");
    } finally {
      setIsIncomesLoading(false);
    }
  }, [projectId, selectedMonth, incomeTypeFilter, incomeSearch]);

  // Load Expenses
  const loadExpenses = useCallback(async () => {
    if (!projectId) return;
    setIsExpensesLoading(true);
    try {
      const res = await getBuildingExpenses({
        project_id: projectId,
        month: selectedMonth || undefined,
        expense_type: expenseTypeFilter !== "all" ? expenseTypeFilter : undefined,
        search: expenseSearch.trim() || undefined,
        limit: 100,
      });
      setExpenses(res.items);
      setExpensesStats(res.stats);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      toast.error("Failed to load building expenses");
    } finally {
      setIsExpensesLoading(false);
    }
  }, [projectId, selectedMonth, expenseTypeFilter, expenseSearch]);

  // Load Summary
  const loadSummary = useCallback(async () => {
    if (!projectId) return;
    setIsSummaryLoading(true);
    try {
      const res = await getMonthlySummary(projectId, selectedMonth);
      setSummaryData(res);
    } catch (err) {
      console.error("Failed to load summary:", err);
      toast.error("Failed to load financial summary");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [projectId, selectedMonth]);

  // Initial & Tab triggered loads
  useEffect(() => {
    if (projectId) {
      loadRate();
      if (activeTab === "charges") loadCharges();
      else if (activeTab === "income") loadIncomes();
      else if (activeTab === "expenses") loadExpenses();
      else if (activeTab === "summary") loadSummary();
    }
  }, [projectId, activeTab, loadRate, loadCharges, loadIncomes, loadExpenses, loadSummary]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleSaveTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await upsertServiceChargeRate({
        project_id: projectId,
        rate_basis: tariffForm.rate_basis,
        rate_per_sqft: Number(tariffForm.rate_per_sqft),
        fixed_rate_per_flat: Number(tariffForm.fixed_rate_per_flat),
        due_day_of_month: Number(tariffForm.due_day_of_month),
        notes: tariffForm.notes,
      });
      toast.success("Tariff rate policy updated successfully");
      setIsTariffModalOpen(false);
      loadRate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update tariff rate");
    }
  };

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsGenerating(true);
    try {
      const res = await generateMonthlyCharges({
        project_id: projectId,
        billing_month: generateForm.billing_month,
        due_date: generateForm.due_date || undefined,
      });
      toast.success(res.message || `Bills generated for ${generateForm.billing_month}`);
      setIsGenerateModalOpen(false);
      setSelectedMonth(generateForm.billing_month);
      loadCharges();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate monthly bills");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSingleCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await createFlatCharge({
        project_id: projectId,
        flat_number: createChargeForm.flat_number.trim(),
        resident_name: createChargeForm.resident_name.trim(),
        resident_phone: createChargeForm.resident_phone.trim() || undefined,
        flat_size_sqft: Number(createChargeForm.flat_size_sqft || 1500),
        billing_month: createChargeForm.billing_month,
        total_amount: createChargeForm.total_amount ? Number(createChargeForm.total_amount) : undefined,
        due_date: createChargeForm.due_date || undefined,
        notes: createChargeForm.notes || undefined,
      });
      toast.success("Flat bill created successfully");
      setIsCreateChargeModalOpen(false);
      loadCharges();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create flat bill");
    }
  };

  const handleOpenPaymentModal = (item: FlatServiceChargeItem) => {
    setSelectedChargeForPayment(item);
    setPaymentForm({
      paid_amount: item.due_amount > 0 ? item.due_amount : item.total_amount,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "Bank Transfer",
      reference_number: "",
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChargeForPayment) return;
    setIsCollecting(true);
    try {
      await collectChargePayment(selectedChargeForPayment.uuid, {
        paid_amount: Number(paymentForm.paid_amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success("Payment recorded successfully");
      setIsPaymentModalOpen(false);
      loadCharges();
      if (activeTab === "summary") loadSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setIsCollecting(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      if (editingIncome) {
        await updateBuildingIncome(editingIncome.uuid, {
          income_type: incomeForm.income_type,
          title: incomeForm.title,
          amount: Number(incomeForm.amount),
          income_date: incomeForm.income_date,
          received_from: incomeForm.received_from || undefined,
          source_reference: incomeForm.source_reference || undefined,
          notes: incomeForm.notes || undefined,
        });
        toast.success("Income entry updated");
      } else {
        await createBuildingIncome({
          project_id: projectId,
          income_type: incomeForm.income_type,
          title: incomeForm.title,
          amount: Number(incomeForm.amount),
          income_date: incomeForm.income_date,
          received_from: incomeForm.received_from || undefined,
          source_reference: incomeForm.source_reference || undefined,
          notes: incomeForm.notes || undefined,
        });
        toast.success("Income entry created");
      }
      setIsIncomeModalOpen(false);
      loadIncomes();
      if (activeTab === "summary") loadSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save income");
    }
  };

  const handleDeleteIncome = async (item: BuildingIncomeItem) => {
    if (!confirm(`Delete income "${item.title}"?`)) return;
    try {
      await deleteBuildingIncome(item.uuid);
      toast.success("Income entry deleted");
      loadIncomes();
    } catch (err: any) {
      toast.error("Failed to delete income");
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      if (editingExpense) {
        await updateBuildingExpense(editingExpense.uuid, {
          expense_type: expenseForm.expense_type,
          title: expenseForm.title,
          vendor_name: expenseForm.vendor_name || undefined,
          amount: Number(expenseForm.amount),
          expense_date: expenseForm.expense_date,
          invoice_reference: expenseForm.invoice_reference || undefined,
          payment_status: expenseForm.payment_status,
          notes: expenseForm.notes || undefined,
        });
        toast.success("Expense entry updated");
      } else {
        await createBuildingExpense({
          project_id: projectId,
          expense_type: expenseForm.expense_type,
          title: expenseForm.title,
          vendor_name: expenseForm.vendor_name || undefined,
          amount: Number(expenseForm.amount),
          expense_date: expenseForm.expense_date,
          invoice_reference: expenseForm.invoice_reference || undefined,
          payment_status: expenseForm.payment_status,
          notes: expenseForm.notes || undefined,
        });
        toast.success("Expense entry created");
      }
      setIsExpenseModalOpen(false);
      loadExpenses();
      if (activeTab === "summary") loadSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save expense");
    }
  };

  const handleDeleteExpense = async (item: BuildingExpenseItem) => {
    if (!confirm(`Delete expense "${item.title}"?`)) return;
    try {
      await deleteBuildingExpense(item.uuid);
      toast.success("Expense entry deleted");
      loadExpenses();
    } catch (err: any) {
      toast.error("Failed to delete expense");
    }
  };

  // ---------------------------------------------------------------------------
  // EMPTY STATE / PROJECT REQUIRED
  // ---------------------------------------------------------------------------
  if (!isProjectLoading && !projectId) {
    return (
      <div className="space-y-6">
        <CSPageHeader
          title="Service Charge & Costing"
          subtitle="Monthly Flat Billing, Extra Facility Revenues, Common Maintenance & Net Financial Balance"
          badge="Building Management"
          breadcrumbs={[
            { label: "Building Management" },
            { label: "Service Charge & Costing" },
          ]}
        />
        <CSSelectProjectEmptyState />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TABLE COLUMNS CONFIGURATION
  // ---------------------------------------------------------------------------

  const chargesColumns: Column<FlatServiceChargeItem>[] = [
    {
      header: "Flat & Resident",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            {item.flat_number}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">
              {item.resident_name}
            </div>
            <div className="text-xs text-slate-500">
              {item.flat_size_sqft} sqft {item.resident_phone ? `• ${item.resident_phone}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Billing Month",
      render: (item) => (
        <div className="text-sm font-medium text-slate-700">
          {item.billing_month}
        </div>
      ),
    },
    {
      header: "Rate Applied",
      render: (item) => (
        <div className="text-xs text-slate-600 font-mono">
          {rateConfig?.rate_basis === "PER_SQFT"
            ? `৳ ${item.rate_applied} / sft`
            : `৳ ${Number(item.rate_applied).toLocaleString()} Fixed`}
        </div>
      ),
    },
    {
      header: "Total Billed",
      render: (item) => (
        <div className="text-sm font-bold text-slate-900 font-mono">
          ৳ {item.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: "Paid / Due",
      render: (item) => (
        <div>
          <div className="text-xs font-semibold text-emerald-600 font-mono">
            Paid: ৳ {item.paid_amount.toLocaleString("en-IN")}
          </div>
          {item.due_amount > 0 && (
            <div className="text-xs font-semibold text-rose-500 font-mono">
              Due: ৳ {item.due_amount.toLocaleString("en-IN")}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Due Date",
      render: (item) => (
        <div className="text-xs text-slate-600">
          {item.due_date}
        </div>
      ),
    },
    {
      header: "Status",
      render: (item) => {
        const colors = {
          PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
          PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
          DUE: "bg-blue-50 text-blue-700 border-blue-200",
          OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
              colors[item.payment_status] || "bg-slate-50 text-slate-700"
            }`}
          >
            {item.payment_status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {item.payment_status !== "PAID" && (
            <button
              onClick={() => handleOpenPaymentModal(item)}
              className="px-2.5 py-1 text-xs font-medium rounded-md text-white transition-all shadow-xs hover:opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: brand }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Collect
            </button>
          )}
          {item.payment_status === "PAID" && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid in full
            </span>
          )}
        </div>
      ),
    },
  ];

  const incomeColumns: Column<BuildingIncomeItem>[] = [
    {
      header: "Date",
      render: (item) => (
        <div className="text-sm font-medium text-slate-700 font-mono">
          {item.income_date}
        </div>
      ),
    },
    {
      header: "Category",
      render: (item) => {
        const labels: Record<string, string> = {
          COMMUNITY_HALL: "Community Hall",
          ROOFTOP_RENT: "Rooftop Rent",
          PARKING: "External Parking",
          SWIMMING_POOL: "Swimming Pool",
          MOSQUE: "Mosque Donation",
          OTHER: "Other Revenue",
        };
        return (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ backgroundColor: `${brand}15`, color: brand }}
          >
            {labels[item.income_type] || item.income_type}
          </span>
        );
      },
    },
    {
      header: "Title & Details",
      render: (item) => (
        <div>
          <div className="text-sm font-semibold text-slate-800">{item.title}</div>
          {item.received_from && (
            <div className="text-xs text-slate-500">From: {item.received_from}</div>
          )}
          {item.source_reference && (
            <div className="text-xs text-slate-400 font-mono">Ref: {item.source_reference}</div>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      render: (item) => (
        <div className="text-sm font-bold text-emerald-600 font-mono">
          + ৳ {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingIncome(item);
              setIncomeForm({
                income_type: item.income_type,
                title: item.title,
                amount: item.amount,
                income_date: item.income_date,
                received_from: item.received_from || "",
                source_reference: item.source_reference || "",
                notes: item.notes || "",
              });
              setIsIncomeModalOpen(true);
            }}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteIncome(item)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const expenseColumns: Column<BuildingExpenseItem>[] = [
    {
      header: "Date",
      render: (item) => (
        <div className="text-sm font-medium text-slate-700 font-mono">
          {item.expense_date}
        </div>
      ),
    },
    {
      header: "Category",
      render: (item) => {
        const labels: Record<string, string> = {
          SECURITY: "Security Guard Bill",
          LIFT: "Lift Maintenance & AMC",
          UTILITIES: "Common Utilities (WASA/DESCO)",
          CLEANING: "Cleaning & Janitorial",
          MAINTENANCE: "Repairs & Civil Work",
          OTHER: "Other Operations",
        };
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            {labels[item.expense_type] || item.expense_type}
          </span>
        );
      },
    },
    {
      header: "Title & Vendor",
      render: (item) => (
        <div>
          <div className="text-sm font-semibold text-slate-800">{item.title}</div>
          {item.vendor_name && (
            <div className="text-xs text-slate-500">Vendor: {item.vendor_name}</div>
          )}
          {item.invoice_reference && (
            <div className="text-xs text-slate-400 font-mono">Inv: {item.invoice_reference}</div>
          )}
        </div>
      ),
    },
    {
      header: "Payment Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            item.payment_status === "PAID"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {item.payment_status}
        </span>
      ),
    },
    {
      header: "Amount",
      render: (item) => (
        <div className="text-sm font-bold text-rose-600 font-mono">
          - ৳ {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingExpense(item);
              setExpenseForm({
                expense_type: item.expense_type,
                title: item.title,
                vendor_name: item.vendor_name || "",
                amount: item.amount,
                expense_date: item.expense_date,
                invoice_reference: item.invoice_reference || "",
                payment_status: item.payment_status,
                notes: item.notes || "",
              });
              setIsExpenseModalOpen(true);
            }}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteExpense(item)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <CSPageHeader
        title="Service Charge & Costing"
        subtitle={`Building Management • Monthly Flat Billings, Hall & Facility Incomes, Common Expenses (${project?.name || "Selected Project"})`}
        badge="Building Management"
        breadcrumbs={[
          { label: "Building Management" },
          { label: "Service Charge & Costing" },
        ]}
      >
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-none outline-hidden cursor-pointer"
            />
          </div>

          {activeTab === "charges" && (
            <>
              <button
                onClick={() => setIsTariffModalOpen(true)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                Tariff Policy
              </button>
              <button
                onClick={() => {
                  setGenerateForm({
                    billing_month: selectedMonth,
                    due_date: "",
                  });
                  setIsGenerateModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 shadow-xs transition-all hover:opacity-95"
                style={{ backgroundColor: brand }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Monthly Bills
              </button>
              <button
                onClick={() => {
                  setCreateChargeForm({
                    flat_number: "",
                    resident_name: "",
                    resident_phone: "",
                    flat_size_sqft: 1500,
                    billing_month: selectedMonth,
                    total_amount: "",
                    due_date: "",
                    notes: "",
                  });
                  setIsCreateChargeModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                New Flat Bill
              </button>
            </>
          )}

          {activeTab === "income" && (
            <button
              onClick={() => {
                setEditingIncome(null);
                setIncomeForm({
                  income_type: "COMMUNITY_HALL",
                  title: "",
                  amount: 0,
                  income_date: new Date().toISOString().slice(0, 10),
                  received_from: "",
                  source_reference: "",
                  notes: "",
                });
                setIsIncomeModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 shadow-xs transition-all hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Income Entry
            </button>
          )}

          {activeTab === "expenses" && (
            <button
              onClick={() => {
                setEditingExpense(null);
                setExpenseForm({
                  expense_type: "MAINTENANCE",
                  title: "",
                  vendor_name: "",
                  amount: 0,
                  expense_date: new Date().toISOString().slice(0, 10),
                  invoice_reference: "",
                  payment_status: "PAID",
                  notes: "",
                });
                setIsExpenseModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 shadow-xs transition-all hover:opacity-95"
              style={{ backgroundColor: brand }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Expense Entry
            </button>
          )}
        </div>
      </CSPageHeader>

      {/* 2. Top Navigation Tabs */}
      <div className="flex border-b border-[#E5E7EB] bg-white px-2 rounded-t-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-current text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
            style={{ borderColor: activeTab === tab.id ? brand : "transparent" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FLAT CHARGES */}
      {/* ========================================================================= */}
      {activeTab === "charges" && (
        <div className="space-y-6">
          {/* Rate Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${brand}15`, color: brand }}
              >
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Active Tariff Policy:{" "}
                  <span className="font-semibold text-slate-700">
                    {rateConfig?.rate_basis === "PER_SQFT"
                      ? `৳ ${rateConfig?.rate_per_sqft || 5} per sq.ft / month`
                      : `৳ ${(rateConfig?.fixed_rate_per_flat || 5000).toLocaleString()} Fixed per flat`}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Due by day {rateConfig?.due_day_of_month || 10}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {rateConfig?.notes || "Standard tariff configuration for flat owners"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsTariffModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors self-start md:self-auto text-slate-700"
            >
              Modify Tariff
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Receivable"
              value={`৳ ${chargesStats.total_receivable.toLocaleString("en-IN")}`}
              subtitle={`${chargesStats.total_flats} flats billed for ${selectedMonth}`}
              icon={Receipt}
              color="purple"
            />
            <CSStatCard
              title="Collected Amount"
              value={`৳ ${chargesStats.total_collected.toLocaleString("en-IN")}`}
              subtitle={`${chargesStats.paid_count} flats fully settled`}
              icon={CheckCircle2}
              isPositive={true}
              color="emerald"
            />
            <CSStatCard
              title="Outstanding Due"
              value={`৳ ${chargesStats.total_due.toLocaleString("en-IN")}`}
              subtitle={`${chargesStats.due_count} flats with balance`}
              icon={Clock}
              isPositive={false}
              color="amber"
            />
            <CSStatCard
              title="Collection Rate"
              value={`${chargesStats.collection_rate_percent}%`}
              subtitle="Payment recovery efficiency"
              icon={TrendingUp}
              isPositive={chargesStats.collection_rate_percent >= 75}
              color="blue"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Bills", count: chargesStats.total_flats },
                { key: "PAID", label: "Paid", count: chargesStats.paid_count },
                { key: "PARTIAL", label: "Partial" },
                { key: "DUE", label: "Due", count: chargesStats.due_count },
                { key: "OVERDUE", label: "Overdue" },
              ]}
              activeTab={chargesStatusFilter}
              onChange={setChargesStatusFilter}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={chargesSearch}
                onChange={(e) => setChargesSearch(e.target.value)}
                placeholder="Search flat, resident..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          {/* Table */}
          <CSTable
            columns={chargesColumns}
            data={charges}
            emptyTitle="No service charge bills found"
            emptySubtitle={`No service charge bills found for ${selectedMonth}. Click "Generate Monthly Bills" to create bills.`}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXTRA INCOMES */}
      {/* ========================================================================= */}
      {activeTab === "income" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Extra Income"
              value={`৳ ${incomesStats.total_income.toLocaleString("en-IN")}`}
              subtitle={`Facilities & amenities for ${selectedMonth}`}
              icon={Coins}
              isPositive={true}
              color="emerald"
            />
            <CSStatCard
              title="Community Hall"
              value={`৳ ${(incomesStats.by_category.COMMUNITY_HALL || 0).toLocaleString("en-IN")}`}
              subtitle="Events & ceremonies rent"
              icon={Building}
              color="purple"
            />
            <CSStatCard
              title="Rooftop Flats Rent"
              value={`৳ ${(incomesStats.by_category.ROOFTOP_RENT || 0).toLocaleString("en-IN")}`}
              subtitle="Developer retained units rent"
              icon={Layers}
              color="blue"
            />
            <CSStatCard
              title="External Parking & Others"
              value={`৳ ${(
                (incomesStats.by_category.PARKING || 0) +
                (incomesStats.by_category.SWIMMING_POOL || 0) +
                (incomesStats.by_category.MOSQUE || 0) +
                (incomesStats.by_category.OTHER || 0)
              ).toLocaleString("en-IN")}`}
              subtitle="Parking, Pool, Mosque, Misc"
              icon={Car}
              color="amber"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Income" },
                { key: "COMMUNITY_HALL", label: "Community Hall" },
                { key: "ROOFTOP_RENT", label: "Rooftop Rent" },
                { key: "PARKING", label: "Parking" },
                { key: "SWIMMING_POOL", label: "Pool" },
                { key: "MOSQUE", label: "Mosque" },
                { key: "OTHER", label: "Other" },
              ]}
              activeTab={incomeTypeFilter}
              onChange={setIncomeTypeFilter}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                placeholder="Search description, payer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          <CSTable
            columns={incomeColumns}
            data={incomes}
            emptyTitle="No extra income entries recorded"
            emptySubtitle={`No extra income entries recorded for ${selectedMonth}. Click "Add Income Entry" to register facility collections.`}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPENSES */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CSStatCard
              title="Total Expenses"
              value={`৳ ${expensesStats.total_expense.toLocaleString("en-IN")}`}
              subtitle={`Building operations for ${selectedMonth}`}
              icon={TrendingDown}
              isPositive={false}
              color="rose"
            />
            <CSStatCard
              title="Lift Maintenance"
              value={`৳ ${(expensesStats.by_category.LIFT || 0).toLocaleString("en-IN")}`}
              subtitle="AMC, inspection, repairs"
              icon={Layers}
              color="blue"
            />
            <CSStatCard
              title="Security Guard Bill"
              value={`৳ ${(expensesStats.by_category.SECURITY || 0).toLocaleString("en-IN")}`}
              subtitle="Agency contracted guards"
              icon={ShieldCheck}
              color="amber"
            />
            <CSStatCard
              title="Common Utilities"
              value={`৳ ${(expensesStats.by_category.UTILITIES || 0).toLocaleString("en-IN")}`}
              subtitle="Water pump, generator, lighting"
              icon={Receipt}
              color="purple"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
            <CSFilterTabs
              tabs={[
                { key: "all", label: "All Expenses" },
                { key: "SECURITY", label: "Security" },
                { key: "LIFT", label: "Lift" },
                { key: "UTILITIES", label: "Utilities" },
                { key: "CLEANING", label: "Cleaning" },
                { key: "MAINTENANCE", label: "Maintenance" },
                { key: "OTHER", label: "Other" },
              ]}
              activeTab={expenseTypeFilter}
              onChange={setExpenseTypeFilter}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Search vendor, invoice..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          <CSTable
            columns={expenseColumns}
            data={expenses}
            emptyTitle="No expense entries recorded"
            emptySubtitle={`No expense entries recorded for ${selectedMonth}. Click "Add Expense Entry" to record bills.`}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MONTHLY FINANCIAL SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {summaryData && (
            <>
              {/* Top Financial Health KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Gross Income
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
                    ৳ {summaryData.summary.total_gross_income.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    ৳ {summaryData.service_charges.collected.toLocaleString("en-IN")} charges + ৳{" "}
                    {summaryData.extra_incomes.total.toLocaleString("en-IN")} facilities
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Expenses
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
                    ৳ {summaryData.summary.total_expenses.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Security, lift, utilities, cleaning & repairs
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Net Operating Balance
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        summaryData.summary.financial_status === "SURPLUS"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {summaryData.summary.financial_status}
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-2xl font-bold font-mono ${
                      summaryData.summary.net_balance >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {summaryData.summary.net_balance >= 0 ? "+ " : "- "}৳{" "}
                    {Math.abs(summaryData.summary.net_balance).toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Cash surplus / (shortfall) for {summaryData.billing_month}
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Recovery Efficiency
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
                    {summaryData.service_charges.collection_rate_percent}%
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    ৳ {summaryData.service_charges.due.toLocaleString("en-IN")} pending collection
                  </div>
                </div>
              </div>

              {/* Incomes vs Expenses Category Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incomes Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Income Sources Breakdown
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      ৳ {summaryData.summary.total_gross_income.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Flat Service Charges Collected</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.service_charges.collected.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Community Hall Bookings</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.extra_incomes.breakdown.COMMUNITY_HALL.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Rooftop Retained Flats Rent</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.extra_incomes.breakdown.ROOFTOP_RENT.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">External Parking Rent</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.extra_incomes.breakdown.PARKING.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Swimming Pool & Club Facilities</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.extra_incomes.breakdown.SWIMMING_POOL.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Mosque Donations & Others</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {(
                          summaryData.extra_incomes.breakdown.MOSQUE +
                          summaryData.extra_incomes.breakdown.OTHER
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      Operating Expenses Breakdown
                    </h3>
                    <span className="text-xs font-bold text-rose-600 font-mono">
                      ৳ {summaryData.summary.total_expenses.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Security Guard Services (Agency/In-house)</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.SECURITY.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Elevator / Lift Monthly AMC & Repairs</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.LIFT.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Common Area Electricity, WASA & Generator</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.UTILITIES.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Janitorial & Common Area Cleaning</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.CLEANING.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">General Maintenance & Civil Plumbing</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.MAINTENANCE.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Other Miscellaneous Outlays</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ৳ {summaryData.expenses.breakdown.OTHER.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cross Module Feeds Audit Card */}
              <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      Cross-Module Automation Feeds Audit
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Live data connections from Parking Service (Prompt 8) and Security Service (Prompt 7)
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    Integrated Real-time
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  {/* Parking Feed */}
                  <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          External Parking Income Feed
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                        {summaryData.cross_module_feeds.parking.active_external_rentals_count} Active Slot Rentals
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">Monthly Expected:</div>
                        <div className="font-bold text-white font-mono mt-0.5">
                          ৳ {summaryData.cross_module_feeds.parking.monthly_rent_expected.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Monthly Collected:</div>
                        <div className="font-bold text-emerald-400 font-mono mt-0.5">
                          ৳ {summaryData.cross_module_feeds.parking.monthly_rent_collected.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Feed */}
                  <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          Contracted Security Expense Feed
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        {summaryData.cross_module_feeds.security.active_companies_count} Contracted Agencies
                      </span>
                    </div>
                    <div className="mt-3 text-xs">
                      <div className="text-slate-400">Active Monthly Contract Bill:</div>
                      <div className="font-bold text-rose-400 font-mono text-sm mt-0.5">
                        ৳ {summaryData.cross_module_feeds.security.contracted_monthly_cost.toLocaleString("en-IN")} / month
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TARIFF RATE CONFIGURATION */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        title="Configure Service Charge Tariff"
        subtitle="Set the billing formula (Per Sq.ft or Fixed per flat) for this project"
      >
        <form onSubmit={handleSaveTariff} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tariff Basis *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  tariffForm.rate_basis === "PER_SQFT"
                    ? "border-purple-600 bg-purple-50/50 text-purple-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="rate_basis"
                  value="PER_SQFT"
                  checked={tariffForm.rate_basis === "PER_SQFT"}
                  onChange={() => setTariffForm((p) => ({ ...p, rate_basis: "PER_SQFT" }))}
                  className="accent-purple-600"
                />
                <span className="text-xs font-semibold">Per Square Foot (৳/sqft)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  tariffForm.rate_basis === "FIXED_PER_FLAT"
                    ? "border-purple-600 bg-purple-50/50 text-purple-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="rate_basis"
                  value="FIXED_PER_FLAT"
                  checked={tariffForm.rate_basis === "FIXED_PER_FLAT"}
                  onChange={() => setTariffForm((p) => ({ ...p, rate_basis: "FIXED_PER_FLAT" }))}
                  className="accent-purple-600"
                />
                <span className="text-xs font-semibold">Fixed Charge Per Flat (৳)</span>
              </label>
            </div>
          </div>

          {tariffForm.rate_basis === "PER_SQFT" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate per Square Foot (৳) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={tariffForm.rate_per_sqft}
                onChange={(e) =>
                  setTariffForm((p) => ({ ...p, rate_per_sqft: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                placeholder="e.g. 5.50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A 1,500 sqft flat will be billed ৳ {(1500 * tariffForm.rate_per_sqft).toLocaleString()} / month.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fixed Rate per Flat (৳) *
              </label>
              <input
                type="number"
                step="100"
                min="0"
                required
                value={tariffForm.fixed_rate_per_flat}
                onChange={(e) =>
                  setTariffForm((p) => ({ ...p, fixed_rate_per_flat: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                placeholder="e.g. 6000"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Every unit in this project will be billed exactly this flat monthly amount.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Day of Month (1 - 28) *
            </label>
            <input
              type="number"
              min="1"
              max="28"
              required
              value={tariffForm.due_day_of_month}
              onChange={(e) =>
                setTariffForm((p) => ({ ...p, due_day_of_month: parseInt(e.target.value) || 10 }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes or Bylaws Reference
            </label>
            <textarea
              rows={2}
              value={tariffForm.notes}
              onChange={(e) => setTariffForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Approved in AGM 2026. Includes lift and security."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTariffModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              Save Tariff Policy
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 2: GENERATE MONTHLY BILLS */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Batch Generate Monthly Bills"
        subtitle="Automatically calculates service charge for all flats based on tariff policy"
      >
        <form onSubmit={handleGenerateBills} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Month (YYYY-MM) *
            </label>
            <input
              type="month"
              required
              value={generateForm.billing_month}
              onChange={(e) => setGenerateForm((p) => ({ ...p, billing_month: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Override Due Date (Optional)
            </label>
            <input
              type="date"
              value={generateForm.due_date}
              onChange={(e) => setGenerateForm((p) => ({ ...p, due_date: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to default to day {rateConfig?.due_day_of_month || 10} of the billing month.
            </p>
          </div>

          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs text-purple-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Automated Calculation Logic:
            </div>
            <div>
              Rate Basis:{" "}
              <strong>
                {rateConfig?.rate_basis === "PER_SQFT"
                  ? `৳ ${rateConfig?.rate_per_sqft || 5} / sqft`
                  : `৳ ${(rateConfig?.fixed_rate_per_flat || 5000).toLocaleString()} Fixed`}
              </strong>
            </div>
            <div>
              Units will be auto-loaded from registered project flats & bookings. Existing paid balances are preserved.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5"
              style={{ backgroundColor: brand }}
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGenerating ? "Generating..." : "Generate Bills"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 3: COLLECT PAYMENT */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Service Charge Payment"
        subtitle={`Flat ${selectedChargeForPayment?.flat_number} • ${selectedChargeForPayment?.resident_name}`}
      >
        <form onSubmit={handleCollectPayment} className="space-y-4 p-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
            <div>
              <div className="text-slate-500">Total Billed:</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">
                ৳ {selectedChargeForPayment?.total_amount.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Already Paid:</div>
              <div className="font-bold text-emerald-600 font-mono mt-0.5">
                ৳ {selectedChargeForPayment?.paid_amount.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Current Balance:</div>
              <div className="font-bold text-rose-600 font-mono mt-0.5">
                ৳ {selectedChargeForPayment?.due_amount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount to Pay (৳) *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={paymentForm.paid_amount}
              onChange={(e) =>
                setPaymentForm((p) => ({ ...p, paid_amount: parseFloat(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono text-base font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="bKash / Nagad">bKash / Nagad</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slip / Reference / Cheque #
            </label>
            <input
              type="text"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm((p) => ({ ...p, reference_number: e.target.value }))}
              placeholder="e.g. TR-9988231 or Chq-45210"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Received at site office"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCollecting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-1.5"
              style={{ backgroundColor: brand }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isCollecting ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE SINGLE FLAT BILL */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isCreateChargeModalOpen}
        onClose={() => setIsCreateChargeModalOpen(false)}
        title="Add Single Flat Service Charge"
        subtitle="Create an individual billing line for a specific flat"
      >
        <form onSubmit={handleCreateSingleCharge} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Flat Number *
              </label>
              <input
                type="text"
                required
                value={createChargeForm.flat_number}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, flat_number: e.target.value }))
                }
                placeholder="e.g. 5-B"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Flat Size (sqft)
              </label>
              <input
                type="number"
                min="100"
                value={createChargeForm.flat_size_sqft}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, flat_size_sqft: parseFloat(e.target.value) || 1500 }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resident / Owner Name *
              </label>
              <input
                type="text"
                required
                value={createChargeForm.resident_name}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, resident_name: e.target.value }))
                }
                placeholder="e.g. Mohammad Rafiqul Islam"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resident Phone
              </label>
              <input
                type="text"
                value={createChargeForm.resident_phone}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, resident_phone: e.target.value }))
                }
                placeholder="e.g. +880 1711-000000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Month (YYYY-MM) *
              </label>
              <input
                type="month"
                required
                value={createChargeForm.billing_month}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, billing_month: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount (৳, optional override)
              </label>
              <input
                type="number"
                step="1"
                value={createChargeForm.total_amount}
                onChange={(e) =>
                  setCreateChargeForm((p) => ({ ...p, total_amount: e.target.value }))
                }
                placeholder="Auto-computed if empty"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateChargeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              Create Flat Bill
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD / EDIT EXTRA INCOME */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        title={editingIncome ? "Edit Extra Income Entry" : "Add Extra Building Income"}
        subtitle="Log revenues from community hall, rooftop flats, external parking, or amenities"
      >
        <form onSubmit={handleSaveIncome} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Category *
              </label>
              <select
                value={incomeForm.income_type}
                onChange={(e) =>
                  setIncomeForm((p) => ({ ...p, income_type: e.target.value as BuildingIncomeType }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="COMMUNITY_HALL">Community Hall Booking</option>
                <option value="ROOFTOP_RENT">Rooftop Flat Rent</option>
                <option value="PARKING">External Parking Rent</option>
                <option value="SWIMMING_POOL">Swimming Pool & Club</option>
                <option value="MOSQUE">Mosque Donation</option>
                <option value="OTHER">Other Amenity</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (৳) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={incomeForm.amount}
                onChange={(e) =>
                  setIncomeForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Description *
            </label>
            <input
              type="text"
              required
              value={incomeForm.title}
              onChange={(e) => setIncomeForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Wedding Reception Hall Booking - Flat 7A"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Date *
              </label>
              <input
                type="date"
                required
                value={incomeForm.income_date}
                onChange={(e) => setIncomeForm((p) => ({ ...p, income_date: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Received From
              </label>
              <input
                type="text"
                value={incomeForm.received_from}
                onChange={(e) => setIncomeForm((p) => ({ ...p, received_from: e.target.value }))}
                placeholder="e.g. Mr. Rafiqul / Guest"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt / Slip Ref #
            </label>
            <input
              type="text"
              value={incomeForm.source_reference}
              onChange={(e) => setIncomeForm((p) => ({ ...p, source_reference: e.target.value }))}
              placeholder="e.g. MR-09923"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsIncomeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              {editingIncome ? "Update Entry" : "Save Income"}
            </button>
          </div>
        </form>
      </CSModal>

      {/* ========================================================================= */}
      {/* MODAL 6: ADD / EDIT EXPENSE */}
      {/* ========================================================================= */}
      <CSModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpense ? "Edit Expense Entry" : "Add Building Maintenance Expense"}
        subtitle="Record vendor payouts for security, lift AMC, utilities, or repairs"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Category *
              </label>
              <select
                value={expenseForm.expense_type}
                onChange={(e) =>
                  setExpenseForm((p) => ({ ...p, expense_type: e.target.value as BuildingExpenseType }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="SECURITY">Security Services Bill</option>
                <option value="LIFT">Lift AMC & Servicing</option>
                <option value="UTILITIES">Common Utilities (Electricity/Water)</option>
                <option value="CLEANING">Cleaning & Janitorial Supplies</option>
                <option value="MAINTENANCE">General Repairs & Civil Works</option>
                <option value="OTHER">Other Operational Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (৳) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Line Item *
            </label>
            <input
              type="text"
              required
              value={expenseForm.title}
              onChange={(e) => setExpenseForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Otis Lift Monthly AMC & Greasing"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Contractor Name
              </label>
              <input
                type="text"
                value={expenseForm.vendor_name}
                onChange={(e) => setExpenseForm((p) => ({ ...p, vendor_name: e.target.value }))}
                placeholder="e.g. Otis Elevator Co."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice / Voucher Reference
              </label>
              <input
                type="text"
                value={expenseForm.invoice_reference}
                onChange={(e) => setExpenseForm((p) => ({ ...p, invoice_reference: e.target.value }))}
                placeholder="e.g. INV-2026-8812"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm((p) => ({ ...p, expense_date: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status *
              </label>
              <select
                value={expenseForm.payment_status}
                onChange={(e) =>
                  setExpenseForm((p) => ({ ...p, payment_status: e.target.value as "PAID" | "PENDING" }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="PAID">Paid (Settled)</option>
                <option value="PENDING">Pending (Payable)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: brand }}
            >
              {editingExpense ? "Update Entry" : "Save Expense"}
            </button>
          </div>
        </form>
      </CSModal>
    </div>
  );
}
