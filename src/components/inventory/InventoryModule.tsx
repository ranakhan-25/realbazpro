"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileClock,
  FileDown,
  FileImage,
  LayoutDashboard,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  Printer,
  Search,
  Settings2,
  Trash2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { RouteBreadcrumb } from "@/components/ui/RouteBreadcrumb";
import { useUserAccess } from "@/context/UserAccessContext";
import {
  getInventoryPermissionPath,
  inventoryPath,
  INVENTORY_BASE_PATH,
} from "@/lib/inventoryRoutes";
import {
  fallbackBrands,
  fallbackCategories,
  fallbackItems,
  fallbackUnits,
  brandsApi,
  categoriesApi,
  itemsApi,
  materialUsageApi,
  unitsApi,
} from "@/lib/inventoryApi";

type Master = { id: string; name: string };
type Item = Master & {
  code: string;
  category: string;
  brand: string;
  uom: string;
  sku: string;
  reorderLevel: number;
  minQty: number;
  maxQty: number;
  barcode: string;
  notes: string;
  status: "Active" | "Inactive";
  avgCost: number;
  categoryId?: string;
  brandId?: string;
  uomId?: string;
};
type Category = Master & { parent: string; code?: string };
type Brand = Master & { code?: string };
type Uom = Master & { code: string; baseUom: string; factor: number };
type WarehouseRecord = Master & {
  code: string;
  location: string;
  type: "Store" | "Site" | "Transit";
};
type MovementType =
  "opening" | "issue" | "return" | "transfer" | "adjustment" | "consumption";
type Movement = {
  id: string;
  code: string;
  type: MovementType;
  itemId: string;
  warehouseId: string;
  toWarehouseId?: string;
  qty: number;
  rate: number;
  date: string;
  issuedTo?: string;
  refType?: string;
  refUuid?: string;
  reason?: string;
  approver?: string;
  notes?: string;
  photoName?: string;
  project?: string;
};
type CountLine = {
  itemId: string;
  systemQty: number;
  countedQty: number;
  note: string;
  saved: boolean;
};
type CountSession = {
  id: string;
  warehouseId: string;
  countedAt: string;
  status: "Draft" | "Adjusted";
  lines: CountLine[];
};
type InventoryData = {
  items: Item[];
  categories: Category[];
  brands: Brand[];
  uoms: Uom[];
  warehouses: WarehouseRecord[];
  movements: Movement[];
  counts: CountSession[];
};

const STORAGE_KEY = "realbiz.inventory.module.v1";
const today = new Date().toISOString().slice(0, 10);
const MAIN_WAREHOUSE_ID = "wh-main";

const initialData: InventoryData = {
  items: fallbackItems.map((row, index) => ({
    id: String(row.id),
    code: row.item_code,
    name: row.name,
    category: row.category.name,
    brand: row.brand.name,
    uom: row.unit.name,
    categoryId: String(row.category_id),
    brandId: String(row.brand_id),
    uomId: String(row.unit_id),
    sku: `SKU-${501 + index}`,
    reorderLevel: [15, 80, 25, 30, 100][index] ?? 10,
    minQty: 0,
    maxQty: 0,
    barcode: "",
    notes: "",
    status: "Active",
    avgCost: row.purchase_price,
  })),
  categories: fallbackCategories.map((row) => ({
    id: String(row.id),
    name: row.name,
    parent: "",
    code: row.category_code,
  })),
  brands: fallbackBrands.map((row) => ({
    id: String(row.id),
    name: row.name,
    code: row.code,
  })),
  uoms: fallbackUnits.map((row) => ({
    id: String(row.id),
    name: row.name,
    code: row.code,
    baseUom: row.conversionUnit || row.code,
    factor: Number(row.rate) || 1,
  })),
  warehouses: [
    {
      id: MAIN_WAREHOUSE_ID,
      code: "WH-001",
      name: "Central Store",
      location: "Head Office, Dhaka",
      type: "Store",
    },
    {
      id: "wh-site",
      code: "WH-002",
      name: "Sheba Eyecon Site",
      location: "Gulshan, Dhaka",
      type: "Site",
    },
    {
      id: "wh-transit",
      code: "WH-003",
      name: "Transit Warehouse",
      location: "On the road",
      type: "Transit",
    },
  ],
  movements: fallbackItems.map((row, index) => ({
    id: `open-${index + 1}`,
    code: `OPEN-00${index + 1}`,
    type: "opening",
    itemId: String(row.id),
    warehouseId: MAIN_WAREHOUSE_ID,
    qty: [120, 420, 190, 260, 850][index] ?? 100,
    rate: row.purchase_price,
    date: "2026-01-01",
    notes: "Initial opening balance",
  })),
  counts: [],
};

const menu = [
  { label: "Overview", href: inventoryPath(), icon: LayoutDashboard },
  { label: "Items", href: inventoryPath("items"), icon: Package },
  { label: "Categories", href: inventoryPath("categories"), icon: Boxes },
  { label: "Brands", href: inventoryPath("brands"), icon: Settings2 },
  { label: "Units of measure", href: inventoryPath("uom"), icon: Activity },
  { label: "Warehouses", href: inventoryPath("warehouses"), icon: Warehouse },
  {
    label: "Opening stock",
    href: inventoryPath("opening"),
    icon: ArrowDownLeft,
  },
  {
    label: "Stock balance",
    href: inventoryPath("balance"),
    icon: ClipboardList,
  },
  { label: "Stock ledger", href: inventoryPath("ledger"), icon: FileClock },
  { label: "Valuation", href: inventoryPath("valuation"), icon: FileDown },
  { label: "Issues", href: inventoryPath("issues"), icon: ArrowUpRight },
  {
    label: "Transfers",
    href: inventoryPath("transfers/create"),
    icon: ArrowLeftRight,
  },
  {
    label: "Returns",
    href: inventoryPath("returns/create"),
    icon: ArrowDownLeft,
  },
  {
    label: "Adjustments",
    href: inventoryPath("adjustments/create"),
    icon: Settings2,
  },
  {
    label: "Consumption",
    href: inventoryPath("consumption/create"),
    icon: Activity,
  },
  {
    label: "Physical counts",
    href: inventoryPath("counts"),
    icon: ClipboardCheck,
  },
  {
    label: "Slow moving",
    href: inventoryPath("slow-moving"),
    icon: Activity,
  },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const getFormValue = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const apiString = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
const getMoneyValue = (form: FormData, key: string) =>
  Number(String(form.get(key) ?? "").replaceAll(",", ""));
const mergeApiRecords = <T extends { id: string }>(
  remote: T[],
  local: T[],
): T[] => {
  const remoteIds = new Set(remote.map((record) => record.id));
  return [...remote, ...local.filter((record) => !remoteIds.has(record.id))];
};
const apiResponseId = (response: unknown): string | undefined => {
  if (!response || typeof response !== "object") return undefined;
  const payload = response as {
    id?: string | number;
    data?: { id?: string | number };
  };
  const id = payload.id ?? payload.data?.id;
  return id === undefined ? undefined : String(id);
};

function balanceFor(
  movements: Movement[],
  itemId: string,
  warehouseId?: string,
): number {
  return movements.reduce((balance, movement) => {
    if (movement.itemId !== itemId) return balance;
    let delta = 0;
    if (movement.type === "opening" || movement.type === "return") {
      delta = movement.qty;
    } else if (movement.type === "issue" || movement.type === "consumption") {
      delta = -movement.qty;
    } else if (movement.type === "adjustment") {
      delta = movement.qty;
    } else if (movement.type === "transfer") {
      if (!warehouseId || movement.warehouseId === warehouseId)
        delta -= movement.qty;
      if (!warehouseId || movement.toWarehouseId === warehouseId)
        delta += movement.qty;
    }
    if (
      warehouseId &&
      movement.type !== "transfer" &&
      movement.warehouseId !== warehouseId
    ) {
      return balance;
    }
    return balance + delta;
  }, 0);
}

function Field({
  label,
  name,
  required,
  type = "text",
  min,
  max,
  step,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        name={name}
        type={type}
        min={min}
        max={max}
        step={step}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}

function CurrencyField({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: number;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <div className="flex h-10 items-center overflow-hidden rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <span className="border-r border-input px-3 text-sm text-muted-foreground">
          ৳
        </span>
        <input
          className="h-full min-w-0 flex-1 bg-background px-3 text-sm text-foreground outline-none"
          defaultValue={defaultValue?.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}
          inputMode="decimal"
          name={name}
          onBlur={(event) => {
            const value = Number(event.currentTarget.value.replaceAll(",", ""));
            if (Number.isFinite(value)) {
              event.currentTarget.value = value.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              });
            }
          }}
          onFocus={(event) => {
            event.currentTarget.value = event.currentTarget.value.replaceAll(
              ",",
              "",
            );
          }}
          pattern="[0-9,]+(\\.[0-9]{1,2})?"
          required={required}
          type="text"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
  defaultValue,
  value,
  onValueChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <select
        name={name}
        required={required}
        {...(value === undefined
          ? { defaultValue: defaultValue ?? "" }
          : { value })}
        onChange={(event) => onValueChange?.(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        <option value="">
          {required ? `Select ${label.toLowerCase()}` : "All / None"}
        </option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <textarea
        className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        name={name}
        required={required}
      />
    </label>
  );
}

function PageTitle({
  eyebrow = "INVENTORY MANAGEMENT",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
        secondary
          ? "border border-border bg-card text-foreground hover:bg-muted"
          : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
      }`}
    >
      {children}
    </Link>
  );
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th className="whitespace-nowrap px-4 py-3" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length ? (
              rows.map((row, index) => (
                <tr className="text-foreground hover:bg-muted/50" key={index}>
                  {row.map((cell, cellIndex) => (
                    <td
                      className="whitespace-nowrap px-4 py-3 text-foreground"
                      key={cellIndex}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                  colSpan={columns.length}
                >
                  {empty ?? (
                    <div className="flex flex-col items-center gap-2">
                      <PackageOpen className="h-8 w-8 opacity-40" />
                      <span>No records yet.</span>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <div aria-label="Loading inventory data" className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="mb-4 h-10 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="flex gap-3" key={index}>
              {Array.from({ length: 6 }, (_, cell) => (
                <div
                  className="h-8 flex-1 animate-pulse rounded-md bg-muted"
                  key={cell}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function InventoryModule() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccessToRoute } = useUserAccess();
  const routeParts = pathname.split("/").filter(Boolean).slice(2);
  const section = routeParts[0] ?? "home";
  const subroute = routeParts[1] ?? "";
  const [data, setData] = useState<InventoryData>(initialData);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedRefType, setSelectedRefType] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [daysMin, setDaysMin] = useState(90);
  const [treeView, setTreeView] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countDrafts, setCountDrafts] = useState<
    Record<string, { qty: number; note: string }>
  >({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [itemModal, setItemModal] = useState<{
    item: Item;
    mode: "view" | "edit";
  } | null>(null);
  const [masterModal, setMasterModal] = useState<"brands" | "uoms" | null>(
    null,
  );
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const [itemStatusFilter, setItemStatusFilter] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [transactionItemId, setTransactionItemId] = useState("");
  const [transactionWarehouseId, setTransactionWarehouseId] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          "items" in parsed &&
          "movements" in parsed &&
          Array.isArray(parsed.items) &&
          Array.isArray(parsed.movements)
        ) {
          setData(parsed as InventoryData);
        }
      }
    } catch (error) {
      console.error("Could not load local inventory data.", error);
      toast.error("Inventory data could not be loaded from this browser.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const loadApiMasters = async () => {
      try {
        const [categoryRows, brandRows, unitRows, itemRows] = await Promise.all(
          [
            categoriesApi.getAll(),
            brandsApi.getAll(),
            unitsApi.getAll(),
            itemsApi.getAll(),
          ],
        );
        if (!active) return;

        const categories: Category[] = categoryRows.map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            id: apiString(row.id) || newId(),
            name: apiString(row.name),
            parent: apiString(row.parent_name ?? row.parent),
            code: apiString(row.category_code ?? row.code),
          };
        });
        const brands: Brand[] = brandRows.map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            id: apiString(row.id) || newId(),
            name: apiString(row.name),
            code: apiString(row.code),
          };
        });
        const uoms: Uom[] = unitRows.map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            id: apiString(row.id) || newId(),
            name: apiString(row.name),
            code: apiString(row.code),
            baseUom: apiString(row.base_uom ?? row.conversionUnit ?? row.code),
            factor: Number(row.factor ?? row.rate) || 1,
          };
        });
        setData((current) => ({
          ...current,
          categories: mergeApiRecords(categories, current.categories).map(
            (category) => ({
              ...category,
              parent:
                category.parent ||
                current.categories.find((row) => row.id === category.id)
                  ?.parent ||
                "",
            }),
          ),
          brands: mergeApiRecords(brands, current.brands).map((brand) => ({
            ...brand,
            code:
              brand.code ||
              current.brands.find((row) => row.id === brand.id)?.code,
          })),
          uoms: mergeApiRecords(uoms, current.uoms).map((unit) => {
            const local = current.uoms.find((row) => row.id === unit.id);
            return {
              ...unit,
              baseUom: unit.baseUom || local?.baseUom || unit.code,
              factor: local?.factor ?? unit.factor,
            };
          }),
          items: mergeApiRecords(
            itemRows.map((entry, index) => {
              const row = entry as Record<string, unknown>;
              const id = apiString(row.id) || `api-item-${index}`;
              const previous = current.items.find((item) => item.id === id);
              const nestedCategory =
                row.category && typeof row.category === "object"
                  ? (row.category as Record<string, unknown>)
                  : undefined;
              const nestedBrand =
                row.brand && typeof row.brand === "object"
                  ? (row.brand as Record<string, unknown>)
                  : undefined;
              const nestedUnit =
                row.unit && typeof row.unit === "object"
                  ? (row.unit as Record<string, unknown>)
                  : undefined;
              const categoryId = apiString(
                row.category_id ?? nestedCategory?.id,
              );
              const brandId = apiString(row.brand_id ?? nestedBrand?.id);
              const uomId = apiString(row.unit_id ?? nestedUnit?.id);
              return {
                id,
                code:
                  apiString(row.item_code ?? row.code) || previous?.code || "",
                name: apiString(row.name) || previous?.name || "",
                category:
                  apiString(nestedCategory?.name) ||
                  categories.find((category) => category.id === categoryId)
                    ?.name ||
                  previous?.category ||
                  "",
                brand:
                  apiString(nestedBrand?.name) ||
                  brands.find((brand) => brand.id === brandId)?.name ||
                  previous?.brand ||
                  "",
                uom:
                  apiString(nestedUnit?.name) ||
                  uoms.find((unit) => unit.id === uomId)?.name ||
                  previous?.uom ||
                  "",
                sku: apiString(row.sku) || previous?.sku || "",
                reorderLevel:
                  Number(row.reorder_level ?? previous?.reorderLevel) || 0,
                minQty: Number(row.min_qty ?? previous?.minQty) || 0,
                maxQty: Number(row.max_qty ?? previous?.maxQty) || 0,
                barcode: apiString(row.barcode) || previous?.barcode || "",
                notes: apiString(row.notes) || previous?.notes || "",
                status:
                  apiString(row.status) === "Inactive" ? "Inactive" : "Active",
                avgCost: Number(row.purchase_price ?? previous?.avgCost) || 0,
                categoryId: categoryId || previous?.categoryId,
                brandId: brandId || previous?.brandId,
                uomId: uomId || previous?.uomId,
              };
            }),
            current.items,
          ),
        }));
      } catch (error) {
        console.error(
          "Could not load inventory master data from the API.",
          error,
        );
        toast.error("Inventory master data could not be loaded from the API.");
      }
    };
    void loadApiMasters();
    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save local inventory data.", error);
      toast.error("Inventory changes could not be saved in this browser.");
    }
  }, [data, ready]);

  useEffect(() => {
    setSelectedWarehouse("");
    setSelectedItem("");
    setLowStockOnly(false);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelectedRefType("");
    setSelectedIssueId("");
    setTransactionItemId("");
    setTransactionWarehouseId("");
  }, [pathname]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target ||
        link.origin !== window.location.origin
      )
        return;
      if (
        !window.confirm(
          "You have unsaved changes. Leave this page and discard them?",
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setHasUnsavedChanges(false);
      router.push(`${link.pathname}${link.search}${link.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptNavigation, true);
    };
  }, [hasUnsavedChanges, router]);

  const items = data.items;
  const warehouses = data.warehouses;
  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} — ${warehouse.name}`,
  }));
  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
  }));
  const selectedCount = data.counts.find((count) => count.id === subroute);

  const stockRows = useMemo(
    () =>
      items.map((item) => ({
        item,
        qty: balanceFor(
          data.movements,
          item.id,
          selectedWarehouse || undefined,
        ),
      })),
    [data.movements, items, selectedWarehouse],
  );
  const warehouseStockRows = useMemo(
    () =>
      warehouses.flatMap((warehouse) =>
        items.map((item) => ({
          item,
          warehouse,
          qty: balanceFor(data.movements, item.id, warehouse.id),
        })),
      ),
    [data.movements, items, warehouses],
  );
  const totalUnits = stockRows.reduce((total, row) => total + row.qty, 0);
  const stockValue = stockRows.reduce(
    (total, row) => total + row.qty * row.item.avgCost,
    0,
  );
  const lowStockCount = stockRows.filter(
    ({ item, qty }) => item.reorderLevel > 0 && qty < item.reorderLevel,
  ).length;

  const addMovement = (movement: Omit<Movement, "id">) => {
    setData((current) => {
      const currentItemQty = balanceFor(current.movements, movement.itemId);
      const nextItems =
        movement.type === "opening"
          ? current.items.map((item) =>
              item.id === movement.itemId
                ? {
                    ...item,
                    avgCost:
                      (currentItemQty * item.avgCost +
                        movement.qty * movement.rate) /
                      (currentItemQty + movement.qty),
                  }
                : item,
            )
          : current.items;
      return {
        ...current,
        items: nextItems,
        movements: [...current.movements, { ...movement, id: newId() }],
      };
    });
  };

  const saveMaster = (
    kind: "items" | "categories" | "brands" | "uoms" | "warehouses",
    record: Record<string, string | number>,
  ) => {
    setData((current) => ({
      ...current,
      [kind]: [
        ...current[kind],
        { ...record, id: apiString(record.id) || newId() },
      ],
    }));
  };

  const saveTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const typeBySection: Record<string, MovementType> = {
      opening: "opening",
      issues: "issue",
      returns: "return",
      transfers: "transfer",
      adjustments: "adjustment",
      consumption: "consumption",
    };
    const type = typeBySection[section];
    if (!type) return;
    const selectedIssue =
      type === "return"
        ? data.movements.find(
            (row) =>
              row.id === getFormValue(form, "issueId") && row.type === "issue",
          )
        : undefined;
    const itemId = selectedIssue?.itemId ?? getFormValue(form, "itemId");
    const warehouseId =
      getFormValue(form, "warehouseId") ||
      getFormValue(form, "fromWarehouseId");
    const qty = Number(
      form.get(type === "adjustment" ? "adjustmentQty" : "qty"),
    );
    const item = items.find((row) => row.id === itemId);
    if (
      !item ||
      !Number.isFinite(qty) ||
      (type === "adjustment" ? qty === 0 : qty <= 0)
    )
      return;
    const available = balanceFor(data.movements, itemId, warehouseId);

    if (type === "issue" && qty > available) {
      toast.error(
        `Issue quantity cannot exceed the available balance (${formatNumber(available)}).`,
      );
      return;
    }
    if (type === "transfer" && qty > available) {
      toast.error(
        `Transfer quantity cannot exceed the available balance (${formatNumber(available)}).`,
      );
      return;
    }
    if (
      type === "transfer" &&
      warehouseId === getFormValue(form, "toWarehouseId")
    ) {
      toast.error("Choose two different warehouses for a transfer.");
      return;
    }
    if (type === "adjustment") {
      if (available + qty < 0) {
        toast.error("The adjustment cannot reduce stock below zero.");
        return;
      }
    }
    const movement: Movement = {
      id: newId(),
      code: `${type.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      type,
      itemId,
      warehouseId,
      toWarehouseId: getFormValue(form, "toWarehouseId") || undefined,
      qty,
      rate: getMoneyValue(form, "rate") || item.avgCost,
      date: getFormValue(form, "date") || today,
      issuedTo:
        getFormValue(form, "issuedTo") ||
        getFormValue(form, "project") ||
        undefined,
      refType: getFormValue(form, "refType") || undefined,
      refUuid: getFormValue(form, "refUuid") || undefined,
      reason: getFormValue(form, "reason") || undefined,
      approver: getFormValue(form, "approver") || undefined,
      notes: getFormValue(form, "notes") || undefined,
      project: getFormValue(form, "project") || undefined,
      photoName: (form.get("photo") as File | null)?.name || undefined,
    };
    if (type === "adjustment") {
      if (!movement.qty || !getFormValue(form, "reason")) {
        toast.error("Enter a non-zero adjustment quantity and a reason.");
        return;
      }
    }
    if (type === "return") {
      const issue = selectedIssue;
      const alreadyReturned = data.movements
        .filter((row) => row.type === "return" && row.refUuid === issue?.id)
        .reduce((sum, row) => sum + row.qty, 0);
      if (
        !issue ||
        issue.itemId !== itemId ||
        qty > issue.qty - alreadyReturned
      ) {
        toast.error(
          "Return quantity cannot exceed the unreturned quantity of the selected issue.",
        );
        return;
      }
      movement.refUuid = issue.id;
      movement.refType = "Issue";
      movement.warehouseId = issue.warehouseId;
    }
    if (type === "opening") {
      movement.type = "opening";
    }
    if (type === "consumption") {
      await materialUsageApi.create({
        date: movement.date,
        note: movement.notes,
        items: [{ item_id: itemId, quantity: qty }],
        projectId: movement.refUuid,
      });
    }
    addMovement(movement);
    setHasUnsavedChanges(false);
    toast.success(`${type[0].toUpperCase()}${type.slice(1)} saved.`);
    router.push(
      type === "opening"
        ? inventoryPath("opening")
        : type === "issue"
          ? inventoryPath("issues")
          : type === "transfer"
            ? inventoryPath("balance")
            : inventoryPath("ledger"),
    );
  };

  const handleMasterSubmit = async (
    event: FormEvent<HTMLFormElement>,
    kind: "items" | "categories" | "brands" | "uoms" | "warehouses",
  ) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: Record<string, string | number> = {};
    for (const [key, value] of form.entries()) {
      if (key === "image") continue;
      record[key] = value.toString().trim();
    }
    if (kind === "items") {
      record.reorderLevel = Number(form.get("reorderLevel"));
      record.minQty = Number(form.get("minQty")) || 0;
      record.maxQty = Number(form.get("maxQty")) || 0;
      record.avgCost = getMoneyValue(form, "avgCost") || 0;
      record.status = getFormValue(form, "status") || "Active";
      record.sku = getFormValue(form, "sku");
      record.barcode = getFormValue(form, "barcode");
      record.notes = getFormValue(form, "notes");
      record.brand = getFormValue(form, "brand");
      record.category = getFormValue(form, "category");
      record.uom = getFormValue(form, "uom");
    }
    if (kind === "uoms") {
      record.factor = Number(form.get("factor"));
      if (
        !Number.isFinite(Number(record.factor)) ||
        Number(record.factor) <= 0
      ) {
        toast.error("UOM factor must be greater than zero.");
        return;
      }
    }
    if (
      kind === "items" &&
      Number(record.maxQty) > 0 &&
      Number(record.minQty) > Number(record.maxQty)
    ) {
      toast.error("Minimum quantity cannot exceed maximum quantity.");
      return;
    }
    if (
      kind === "items" &&
      data.items.some(
        (item) => item.code.toLowerCase() === String(record.code).toLowerCase(),
      )
    ) {
      toast.error("Item code must be unique.");
      return;
    }
    if (
      kind === "uoms" &&
      data.uoms.some(
        (unit) => unit.code.toLowerCase() === String(record.code).toLowerCase(),
      )
    ) {
      toast.error("UOM code must be unique.");
      return;
    }
    if (kind === "categories") {
      const code = `CAT-${Date.now().toString().slice(-6)}`;
      const response = await categoriesApi.create({
        category_code: code,
        name: String(record.name),
      });
      record.code = code;
      record.id = apiResponseId(response) || newId();
    } else if (kind === "brands") {
      const code = `BR-${Date.now().toString().slice(-6)}`;
      const response = await brandsApi.create({
        code,
        name: String(record.name),
      });
      record.code = code;
      record.id = apiResponseId(response) || newId();
    } else if (kind === "uoms") {
      const response = await unitsApi.create({
        code: String(record.code),
        name: String(record.name),
      });
      record.id = apiResponseId(response) || newId();
    } else if (kind === "items") {
      const category = data.categories.find(
        (row) => row.name === String(record.category),
      );
      const uom = data.uoms.find((row) => row.name === String(record.uom));
      const brand = data.brands.find(
        (row) => row.name === String(record.brand),
      );
      if (!category || !uom) {
        toast.error("Choose an existing category and UOM before saving.");
        return;
      }
      const response = await itemsApi.create({
        item_code: String(record.code),
        name: String(record.name),
        type: "Material",
        purchase_price: Number(record.avgCost) || 0,
        sale_price: 0,
        category_id: category.id,
        unit_id: uom.id,
        brand_id: brand?.id,
      });
      record.id = apiResponseId(response) || newId();
      record.categoryId = category.id;
      record.uomId = uom.id;
      if (brand) record.brandId = brand.id;
    }
    saveMaster(kind, record);
    setHasUnsavedChanges(false);
    const labels = {
      items: "Item",
      categories: "Category",
      brands: "Brand",
      uoms: "Unit of measure",
      warehouses: "Warehouse",
    };
    toast.success(`${labels[kind]} created.`);
    router.push(
      kind === "items"
        ? inventoryPath("items")
        : kind === "uoms"
          ? inventoryPath("uom")
          : inventoryPath(kind),
    );
  };

  const saveItemModal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemModal || itemModal.mode !== "edit") return;
    const form = new FormData(event.currentTarget);
    const code = getFormValue(form, "code");
    if (
      data.items.some(
        (item) =>
          item.id !== itemModal.item.id &&
          item.code.toLowerCase() === code.toLowerCase(),
      )
    ) {
      toast.error("Item code must be unique.");
      return;
    }
    const updated: Item = {
      ...itemModal.item,
      code,
      name: getFormValue(form, "name"),
      category: getFormValue(form, "category"),
      brand: getFormValue(form, "brand"),
      uom: getFormValue(form, "uom"),
      sku: getFormValue(form, "sku"),
      reorderLevel: Number(form.get("reorderLevel")),
      minQty: Number(form.get("minQty")) || 0,
      maxQty: Number(form.get("maxQty")) || 0,
      barcode: getFormValue(form, "barcode"),
      notes: getFormValue(form, "notes"),
      status: getFormValue(form, "status") as Item["status"],
      avgCost:
        Number(String(form.get("avgCost") ?? "").replaceAll(",", "")) || 0,
    };
    const category = data.categories.find(
      (row) => row.name === updated.category,
    );
    const uom = data.uoms.find((row) => row.name === updated.uom);
    const brand = data.brands.find((row) => row.name === updated.brand);
    if (!category || !uom) {
      toast.error("Choose an existing category and UOM before saving.");
      return;
    }
    await itemsApi.update(itemModal.item.id, {
      item_code: updated.code,
      name: updated.name,
      purchase_price: updated.avgCost,
      sale_price: 0,
      category_id: category.id,
      unit_id: uom.id,
      brand_id: brand?.id,
    });
    updated.categoryId = category.id;
    updated.uomId = uom.id;
    updated.brandId = brand?.id;
    setData((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    }));
    setHasUnsavedChanges(false);
    setItemModal(null);
    toast.success("Item updated.");
  };

  const deleteItem = async (item: Item) => {
    if (
      !window.confirm(
        `Delete "${item.name}" and its local movement/count history? This cannot be undone.`,
      )
    ) {
      return;
    }
    await itemsApi.delete(item.id);
    setData((current) => ({
      ...current,
      items: current.items.filter((row) => row.id !== item.id),
      movements: current.movements.filter((row) => row.itemId !== item.id),
      counts: current.counts.map((count) => ({
        ...count,
        lines: count.lines.filter((line) => line.itemId !== item.id),
      })),
    }));
    setItemPage((page) =>
      Math.min(
        page,
        Math.max(1, Math.ceil((data.items.length - 1) / itemPageSize)),
      ),
    );
    toast.success("Item and its local history deleted.");
  };

  const saveMasterModal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!masterModal) return;
    const form = new FormData(event.currentTarget);
    if (masterModal === "brands") {
      const code = `BR-${Date.now().toString().slice(-6)}`;
      const response = await brandsApi.create({
        code,
        name: getFormValue(form, "name"),
      });
      saveMaster("brands", {
        id: apiResponseId(response) || newId(),
        code,
        name: getFormValue(form, "name"),
      });
      toast.success("Brand created.");
    } else {
      const code = getFormValue(form, "code");
      if (
        data.uoms.some((unit) => unit.code.toLowerCase() === code.toLowerCase())
      ) {
        toast.error("UOM code must be unique.");
        return;
      }
      const factor = Number(form.get("factor"));
      if (!Number.isFinite(factor) || factor <= 0) {
        toast.error("UOM factor must be greater than zero.");
        return;
      }
      const response = await unitsApi.create({
        code,
        name: getFormValue(form, "name"),
      });
      saveMaster("uoms", {
        id: apiResponseId(response) || newId(),
        name: getFormValue(form, "name"),
        code,
        baseUom: getFormValue(form, "baseUom") || code,
        factor,
      });
      toast.success("Unit of measure created.");
    }
    setHasUnsavedChanges(false);
    setMasterModal(null);
  };

  const renderMasterModal = () => {
    if (!masterModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <section
          aria-labelledby="inventory-master-modal-title"
          aria-modal="true"
          className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          role="dialog"
        >
          <h2
            className="text-xl font-bold text-slate-950"
            id="inventory-master-modal-title"
          >
            Add {masterModal === "brands" ? "brand" : "unit of measure"}
          </h2>
          <form
            className="mt-5 grid gap-4"
            onChange={() => setHasUnsavedChanges(true)}
            onSubmit={saveMasterModal}
          >
            <Field label="Name" name="name" required />
            {masterModal === "uoms" && (
              <>
                <Field label="Code" name="code" required />
                <SelectField
                  label="Base UOM"
                  name="baseUom"
                  options={data.uoms.map((unit) => ({
                    value: unit.code,
                    label: `${unit.name} (${unit.code})`,
                  }))}
                />
                <Field
                  label="Factor"
                  name="factor"
                  type="number"
                  min={0.000001}
                  step={0.000001}
                  defaultValue={1}
                  required
                />
              </>
            )}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium"
                onClick={() => {
                  if (
                    hasUnsavedChanges &&
                    !window.confirm("Discard your unsaved changes?")
                  )
                    return;
                  setHasUnsavedChanges(false);
                  setMasterModal(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white"
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const renderItemModal = () => {
    if (!itemModal) return null;
    const { item, mode } = itemModal;
    const closeModal = () => {
      if (
        hasUnsavedChanges &&
        !window.confirm("Discard your unsaved item changes?")
      ) {
        return;
      }
      setHasUnsavedChanges(false);
      setItemModal(null);
    };
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <section
          aria-labelledby="inventory-item-modal-title"
          aria-modal="true"
          className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          role="dialog"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Item master
              </p>
              <h2
                className="mt-1 text-xl font-bold text-slate-950"
                id="inventory-item-modal-title"
              >
                {mode === "edit" ? "Edit item" : item.name}
              </h2>
            </div>
            <button
              aria-label="Close item details"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={closeModal}
              type="button"
            >
              ×
            </button>
          </div>
          {mode === "view" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Code", item.code],
                ["Name", item.name],
                ["Category", item.category],
                ["Brand", item.brand || "—"],
                ["UOM", item.uom],
                ["SKU", item.sku || "—"],
                ["Reorder level", formatNumber(item.reorderLevel)],
                ["Minimum quantity", formatNumber(item.minQty)],
                ["Maximum quantity", formatNumber(item.maxQty)],
                ["Barcode", item.barcode || "—"],
                ["Status", item.status],
                ["Average cost", formatMoney(item.avgCost)],
                ["Notes", item.notes || "—"],
              ].map(([label, value]) => (
                <div className="rounded-lg bg-slate-50 p-3" key={label}>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Images</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <FileImage size={16} /> No images stored
                </p>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onChange={() => setHasUnsavedChanges(true)}
              onSubmit={saveItemModal}
            >
              <Field
                label="Code"
                name="code"
                required
                defaultValue={item.code}
              />
              <Field
                label="Name"
                name="name"
                required
                defaultValue={item.name}
              />
              <SelectField
                label="Category"
                name="category"
                required
                defaultValue={item.category}
                options={data.categories.map((row) => ({
                  value: row.name,
                  label: row.name,
                }))}
              />
              <SelectField
                label="Brand"
                name="brand"
                defaultValue={item.brand}
                options={data.brands.map((row) => ({
                  value: row.name,
                  label: row.name,
                }))}
              />
              <SelectField
                label="UOM"
                name="uom"
                required
                defaultValue={item.uom}
                options={data.uoms.map((row) => ({
                  value: row.name,
                  label: row.name,
                }))}
              />
              <Field label="SKU" name="sku" defaultValue={item.sku} />
              <Field
                label="Reorder level"
                name="reorderLevel"
                type="number"
                min={0}
                step={0.01}
                required
                defaultValue={item.reorderLevel}
              />
              <Field
                label="Minimum quantity"
                name="minQty"
                type="number"
                min={0}
                step={0.01}
                defaultValue={item.minQty}
              />
              <Field
                label="Maximum quantity"
                name="maxQty"
                type="number"
                min={0}
                step={0.01}
                defaultValue={item.maxQty}
              />
              <CurrencyField
                label="Average cost"
                name="avgCost"
                defaultValue={item.avgCost}
              />
              <Field
                label="Barcode"
                name="barcode"
                defaultValue={item.barcode}
              />
              <SelectField
                label="Status"
                name="status"
                required
                defaultValue={item.status}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Images
                </span>
                <input
                  className="block w-full text-sm text-slate-500"
                  type="file"
                  name="image"
                  accept="image/*"
                  multiple
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  name="notes"
                  defaultValue={item.notes}
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
                <button
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
                  type="submit"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    );
  };

  const createCount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const warehouseId = getFormValue(form, "warehouseId");
    const count: CountSession = {
      id: newId(),
      warehouseId,
      countedAt: getFormValue(form, "countedAt") || today,
      status: "Draft",
      lines: items.map((item) => ({
        itemId: item.id,
        systemQty: balanceFor(data.movements, item.id, warehouseId),
        countedQty: balanceFor(data.movements, item.id, warehouseId),
        note: "",
        saved: false,
      })),
    };
    setData((current) => ({ ...current, counts: [...current.counts, count] }));
    setHasUnsavedChanges(false);
    toast.success("Physical count created.");
    router.push(inventoryPath(`counts/${count.id}`));
  };

  const saveCountLine = (
    countId: string,
    lineIndex: number,
    countedQty: number,
    note: string,
  ) => {
    setData((current) => ({
      ...current,
      counts: current.counts.map((count) =>
        count.id !== countId
          ? count
          : {
              ...count,
              lines: count.lines.map((line, index) =>
                index === lineIndex
                  ? { ...line, countedQty, note, saved: true }
                  : line,
              ),
            },
      ),
    }));
    const savedKey = `${countId}-${lineIndex}`;
    const remaining = Object.fromEntries(
      Object.entries(countDrafts).filter(([key]) => key !== savedKey),
    );
    setCountDrafts(remaining);
    setHasUnsavedChanges(
      Object.keys(remaining).some((key) => key.startsWith(`${countId}-`)),
    );
    toast.success("Count line saved.");
  };

  const submitCount = (count: CountSession) => {
    if (
      Object.keys(countDrafts).some((key) => key.startsWith(`${count.id}-`))
    ) {
      toast.error("Save each edited count line before submitting the count.");
      return;
    }
    const hasDifferences = count.lines.some(
      (line) => line.countedQty !== line.systemQty,
    );
    if (
      hasDifferences &&
      !window.confirm("Create inventory adjustments for all count differences?")
    ) {
      return;
    }
    setData((current) => {
      const adjustments = count.lines
        .map((line) => ({
          line,
          diff: line.countedQty - line.systemQty,
        }))
        .filter(({ diff }) => diff !== 0)
        .map(({ line, diff }) => ({
          id: newId(),
          code: `COUNT-${count.id.slice(-6)}`,
          type: "adjustment" as const,
          itemId: line.itemId,
          warehouseId: count.warehouseId,
          qty: diff,
          rate:
            current.items.find((item) => item.id === line.itemId)?.avgCost ?? 0,
          date: count.countedAt,
          reason: "Physical count adjustment",
          notes: line.note,
        }));
      return {
        ...current,
        movements: [...current.movements, ...adjustments],
        counts: current.counts.map((row) =>
          row.id === count.id ? { ...row, status: "Adjusted" } : row,
        ),
      };
    });
    toast.success("Count submitted; stock adjustments were created.");
    router.push(inventoryPath("counts"));
  };

  const exportCsv = (
    headers: string[],
    rows: (string | number)[][],
    filename: string,
  ) => {
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderForm = (
    title: string,
    description: string,
    submit: (event: FormEvent<HTMLFormElement>) => void,
    children: ReactNode,
  ) => (
    <>
      <PageTitle title={title} description={description} />
      <form
        onSubmit={submit}
        onChange={() => setHasUnsavedChanges(true)}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
          <ButtonLink href={inventoryPath()} secondary>
            Cancel
          </ButtonLink>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </form>
    </>
  );

  const masterForm = (
    kind: "items" | "categories" | "brands" | "uoms" | "warehouses",
    title: string,
  ) => {
    const options = (values: string[]) =>
      values.map((value) => ({ value, label: value }));
    const onSubmit = (event: FormEvent<HTMLFormElement>) =>
      handleMasterSubmit(event, kind);
    if (kind === "items") {
      return renderForm(
        title,
        "Create an item record with stock controls and identification details.",
        onSubmit,
        <>
          <Field label="Code" name="code" required />
          <Field label="Name" name="name" required />
          <SelectField
            label="Category"
            name="category"
            required
            options={data.categories.map((row) => ({
              value: row.name,
              label: row.name,
            }))}
          />
          <SelectField
            label="Brand"
            name="brand"
            options={data.brands.map((row) => ({
              value: row.name,
              label: row.name,
            }))}
          />
          <SelectField
            label="UOM"
            name="uom"
            required
            options={data.uoms.map((row) => ({
              value: row.name,
              label: row.name,
            }))}
          />
          <Field label="SKU" name="sku" />
          <Field
            label="Reorder level"
            name="reorderLevel"
            type="number"
            min={0}
            step={0.01}
            required
          />
          <Field
            label="Minimum quantity"
            name="minQty"
            type="number"
            min={0}
            step={0.01}
          />
          <Field
            label="Maximum quantity"
            name="maxQty"
            type="number"
            min={0}
            step={0.01}
          />
          <CurrencyField label="Average cost" name="avgCost" />
          <Field label="Barcode" name="barcode" />
          <SelectField
            label="Status"
            name="status"
            required
            options={options(["Active", "Inactive"])}
            defaultValue="Active"
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Images</span>
            <input
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700"
              type="file"
              name="image"
              accept="image/*"
              multiple
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              name="notes"
            />
          </label>
        </>,
      );
    }
    if (kind === "categories") {
      return renderForm(
        title,
        "Add a category and optionally nest it under a parent.",
        onSubmit,
        <>
          <Field label="Name" name="name" required />
          <SelectField
            label="Parent category"
            name="parent"
            options={data.categories.map((row) => ({
              value: row.name,
              label: row.name,
            }))}
          />
        </>,
      );
    }
    if (kind === "brands") {
      return renderForm(
        title,
        "Add a brand to item master data.",
        onSubmit,
        <>
          <Field label="Name" name="name" required />
        </>,
      );
    }
    if (kind === "uoms") {
      return renderForm(
        title,
        "Set the unit and conversion factor. Base units use a factor of 1.",
        onSubmit,
        <>
          <Field label="Name" name="name" required />
          <Field label="Code" name="code" required />
          <Field label="Base UOM" name="baseUom" />
          <Field
            label="Factor"
            name="factor"
            type="number"
            min={0.000001}
            step={0.000001}
            defaultValue={1}
            required
          />
        </>,
      );
    }
    return renderForm(
      title,
      "Configure a stock location.",
      onSubmit,
      <>
        <Field label="Code" name="code" required />
        <Field label="Name" name="name" required />
        <TextArea label="Location" name="location" required />
        <SelectField
          label="Type"
          name="type"
          required
          options={options(["Store", "Site", "Transit"])}
        />
      </>,
    );
  };

  const renderMasterList = (
    kind: "items" | "categories" | "brands" | "uoms" | "warehouses",
  ) => {
    const links: Record<typeof kind, string> = {
      items: inventoryPath("items/create"),
      categories: inventoryPath("categories/create"),
      brands: inventoryPath("brands/create"),
      uoms: inventoryPath("uom/create"),
      warehouses: inventoryPath("warehouses/create"),
    };
    if (kind === "items") {
      const filtered = stockRows.filter(
        ({ item }) =>
          (!itemCategoryFilter || item.category === itemCategoryFilter) &&
          (!itemStatusFilter || item.status === itemStatusFilter) &&
          [item.code, item.name, item.category, item.brand, item.sku]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
      const totalPages = Math.max(1, Math.ceil(filtered.length / itemPageSize));
      const pageItems = filtered.slice(
        (itemPage - 1) * itemPageSize,
        itemPage * itemPageSize,
      );
      return (
        <>
          <PageTitle
            title="Item list"
            description="Catalog, stock availability, and replenishment thresholds."
            action={
              <ButtonLink href={links.items}>
                <Plus size={16} /> Create item
              </ButtonLink>
            }
          />
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <Search size={17} className="text-slate-400" />
            <input
              className="min-w-48 flex-1 bg-transparent text-sm outline-none"
              placeholder="Search code, name, SKU, category or brand"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setItemPage(1);
              }}
            />
            <label className="flex items-center gap-2 whitespace-nowrap text-xs text-slate-500">
              Rows
              <select
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={itemPageSize}
                onChange={(event) => {
                  setItemPageSize(Number(event.target.value));
                  setItemPage(1);
                }}
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <select
              aria-label="Filter by category"
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-600"
              value={itemCategoryFilter}
              onChange={(event) => {
                setItemCategoryFilter(event.target.value);
                setItemPage(1);
              }}
            >
              <option value="">All categories</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-600"
              value={itemStatusFilter}
              onChange={(event) => {
                setItemStatusFilter(event.target.value);
                setItemPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <span className="whitespace-nowrap text-xs text-slate-400">
              {filtered.length} items
            </span>
          </div>
          <DataTable
            columns={[
              "Code",
              "Name",
              "Category",
              "Brand",
              "UOM",
              "SKU",
              "Reorder",
              "Stock qty",
              "Status",
              "Actions",
            ]}
            rows={pageItems.map(({ item, qty }) => [
              <span className="font-mono text-xs font-semibold" key="code">
                {item.code}
              </span>,
              <span className="font-medium text-slate-900" key="name">
                {item.name}
              </span>,
              item.category,
              item.brand || "—",
              item.uom,
              item.sku || "—",
              formatNumber(item.reorderLevel),
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${qty < item.reorderLevel ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
                key="stock"
              >
                {formatNumber(qty)}
              </span>,
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                key="status"
              >
                {item.status}
              </span>,
              <div
                className="flex items-center gap-1"
                key={`actions-${item.id}`}
              >
                <button
                  aria-label={`View ${item.name}`}
                  className="rounded-md p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setItemModal({ item, mode: "view" })}
                  type="button"
                >
                  <Eye size={16} />
                </button>
                <button
                  aria-label={`Edit ${item.name}`}
                  className="rounded-md p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setItemModal({ item, mode: "edit" })}
                  type="button"
                >
                  <Pencil size={16} />
                </button>
                <button
                  aria-label={`Delete ${item.name}`}
                  className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => deleteItem(item)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>,
            ])}
            empty={
              <div className="flex flex-col items-center gap-2">
                <PackageOpen className="h-8 w-8 text-slate-300" />
                <span>
                  {search ? "No items match these filters." : "No items yet."}
                </span>
                <ButtonLink href={links.items}>
                  <Plus size={15} /> Create item
                </ButtonLink>
              </div>
            }
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Showing {filtered.length ? (itemPage - 1) * itemPageSize + 1 : 0}–
              {Math.min(itemPage * itemPageSize, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40"
                disabled={itemPage <= 1}
                onClick={() => setItemPage((page) => page - 1)}
                type="button"
              >
                Previous
              </button>
              <span className="px-2 py-2">
                Page {itemPage} of {totalPages}
              </span>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40"
                disabled={itemPage >= totalPages}
                onClick={() => setItemPage((page) => page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      );
    }
    if (kind === "categories") {
      const ordered: { category: Category; depth: number }[] = [];
      const visited = new Set<string>();
      const addCategory = (category: Category, depth: number) => {
        if (visited.has(category.id)) return;
        visited.add(category.id);
        ordered.push({ category, depth });
        if (treeView) {
          data.categories
            .filter((child) => child.parent === category.name)
            .sort((left, right) => left.name.localeCompare(right.name))
            .forEach((child) => addCategory(child, depth + 1));
        }
      };
      if (treeView) {
        data.categories
          .filter(
            (category) =>
              !category.parent ||
              !data.categories.some(
                (parent) => parent.name === category.parent,
              ),
          )
          .sort((left, right) => left.name.localeCompare(right.name))
          .forEach((category) => addCategory(category, 0));
        data.categories.forEach((category) => addCategory(category, 0));
      } else {
        data.categories.forEach((category) => addCategory(category, 0));
      }
      const categories = ordered.filter(({ category }) =>
        category.name.toLowerCase().includes(search.toLowerCase()),
      );
      return (
        <>
          <PageTitle
            title="Categories"
            description="Organize the item catalog with optional parent categories."
            action={
              <ButtonLink href={links.categories}>
                <Plus size={16} /> Add category
              </ButtonLink>
            }
          />
          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search categories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="ml-3 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
              onClick={() => setTreeView((value) => !value)}
              type="button"
            >
              {treeView ? "List view" : "Tree view"}
            </button>
          </div>
          <DataTable
            columns={["Name", "Parent", "Items #"]}
            rows={categories.map(({ category, depth }) => [
              <span
                className="font-medium"
                style={{
                  paddingLeft: treeView ? `${depth * 18}px` : undefined,
                }}
                key={category.id}
              >
                {treeView && depth > 0 ? `↳ ${category.name}` : category.name}
              </span>,
              category.parent || "—",
              String(
                items.filter((item) => item.category === category.name).length,
              ),
            ])}
          />
        </>
      );
    }
    if (kind === "brands")
      return (
        <>
          <PageTitle
            title="Brands"
            description="Manage the brands available when creating items."
            action={
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setMasterModal("brands");
                }}
                type="button"
              >
                <Plus size={16} /> Add brand
              </button>
            }
          />
          <DataTable
            columns={["Name"]}
            rows={data.brands
              .filter((row) =>
                row.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((row) => [row.name])}
          />
        </>
      );
    if (kind === "uoms")
      return (
        <>
          <PageTitle
            title="Units of measure"
            description="Configure base units and conversion factors."
            action={
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setMasterModal("uoms");
                }}
                type="button"
              >
                <Plus size={16} /> Add UOM
              </button>
            }
          />
          <DataTable
            columns={["Name", "Code", "Base UOM", "Factor"]}
            rows={data.uoms.map((row) => [
              row.name,
              row.code,
              row.baseUom || "—",
              formatNumber(row.factor),
            ])}
          />
        </>
      );
    return (
      <>
        <PageTitle
          title="Warehouses"
          description="Stores, project sites, and transit stock locations."
          action={
            <ButtonLink href={links.warehouses}>
              <Plus size={16} /> Add warehouse
            </ButtonLink>
          }
        />
        <DataTable
          columns={["Code", "Name", "Type", "Location", "Items #"]}
          rows={data.warehouses.map((row) => [
            row.code,
            row.name,
            <span
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
              key={row.id}
            >
              {row.type}
            </span>,
            row.location,
            String(
              items.filter(
                (item) => balanceFor(data.movements, item.id, row.id) !== 0,
              ).length,
            ),
          ])}
        />
      </>
    );
  };

  const renderMovementForm = (type: MovementType) => {
    const title: Record<MovementType, string> = {
      opening: "Opening stock",
      issue: "Issue stock",
      return: "Return stock",
      transfer: "Transfer stock",
      adjustment: "Stock adjustment",
      consumption: "Record consumption",
    };
    const description: Record<MovementType, string> = {
      opening:
        "Enter the starting quantity and cost for an item in a warehouse.",
      issue: "Issue stock to a user or project reference.",
      return: "Return unused quantity against a previous stock issue.",
      transfer: "Move stock between two different warehouses.",
      adjustment: "Correct stock with a signed quantity and reason.",
      consumption: "Record project material consumption.",
    };
    if (type === "return") {
      const issues = data.movements.filter(
        (row) =>
          row.type === "issue" &&
          row.qty >
            data.movements
              .filter(
                (movement) =>
                  movement.type === "return" && movement.refUuid === row.id,
              )
              .reduce((sum, movement) => sum + movement.qty, 0),
      );
      const issueOptions = issues.map((issue) => ({
        value: issue.id,
        label: `${issue.code} — ${items.find((item) => item.id === issue.itemId)?.name ?? issue.itemId} (${formatNumber(issue.qty)} issued)`,
      }));
      const selectedIssue = issues.find(
        (issue) => issue.id === selectedIssueId,
      );
      const returnedQty = selectedIssue
        ? data.movements
            .filter(
              (movement) =>
                movement.type === "return" &&
                movement.refUuid === selectedIssue.id,
            )
            .reduce((sum, movement) => sum + movement.qty, 0)
        : 0;
      const remainingQty = selectedIssue
        ? selectedIssue.qty - returnedQty
        : undefined;
      return renderForm(
        title[type],
        description[type],
        saveTransaction,
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Issue <span className="text-rose-500">*</span>
            </span>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              name="issueId"
              onChange={(event) => {
                setSelectedIssueId(event.target.value);
                setHasUnsavedChanges(true);
              }}
              required
              value={selectedIssueId}
            >
              <option value="">Select an issue</option>
              {issueOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedIssue && (
              <span className="block text-xs text-slate-500">
                Item:{" "}
                {items.find((item) => item.id === selectedIssue.itemId)?.name}
                {" · "}Remaining: {formatNumber(remainingQty ?? 0)}
              </span>
            )}
          </label>
          <Field
            label="Quantity"
            name="qty"
            type="number"
            min={0.01}
            max={remainingQty}
            step={0.01}
            required
          />
          <TextArea label="Reason" name="reason" required />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Photo</span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="block w-full text-sm text-slate-500"
            />
          </label>
        </>,
      );
    }
    const isAdjustment = type === "adjustment";
    const usesAvailableStock = type === "issue" || type === "transfer";
    const transactionAvailable =
      usesAvailableStock && transactionItemId && transactionWarehouseId
        ? balanceFor(data.movements, transactionItemId, transactionWarehouseId)
        : undefined;
    return renderForm(
      title[type],
      description[type],
      saveTransaction,
      <>
        <SelectField
          label="Item"
          name="itemId"
          required
          options={itemOptions}
          value={usesAvailableStock ? transactionItemId : undefined}
          onValueChange={
            usesAvailableStock
              ? (value) => {
                  setTransactionItemId(value);
                  setHasUnsavedChanges(true);
                }
              : undefined
          }
        />
        {type === "transfer" ? (
          <>
            <SelectField
              label="From warehouse"
              name="fromWarehouseId"
              required
              options={warehouseOptions}
              value={transactionWarehouseId}
              onValueChange={(value) => {
                setTransactionWarehouseId(value);
                setHasUnsavedChanges(true);
              }}
            />
            <SelectField
              label="To warehouse"
              name="toWarehouseId"
              required
              options={warehouseOptions.filter(
                (option) => option.value !== transactionWarehouseId,
              )}
            />
          </>
        ) : (
          <SelectField
            label="Warehouse"
            name="warehouseId"
            required
            options={warehouseOptions}
            value={type === "issue" ? transactionWarehouseId : undefined}
            onValueChange={
              type === "issue"
                ? (value) => {
                    setTransactionWarehouseId(value);
                    setHasUnsavedChanges(true);
                  }
                : undefined
            }
          />
        )}
        {isAdjustment ? (
          <Field
            label="Quantity (+/-)"
            name="adjustmentQty"
            type="number"
            step={0.01}
            required
          />
        ) : (
          <Field
            label="Quantity"
            name="qty"
            type="number"
            min={0.01}
            max={usesAvailableStock ? transactionAvailable : undefined}
            step={0.01}
            required
          />
        )}
        {type === "opening" && (
          <CurrencyField label="Rate" name="rate" required />
        )}
        {type === "issue" && (
          <SelectField
            label="Issued to"
            name="issuedTo"
            required
            options={[
              { value: "User", label: "User" },
              { value: "Project", label: "Project" },
            ]}
          />
        )}
        {type === "consumption" && (
          <SelectField
            label="Project"
            name="project"
            required
            options={[
              { value: "Sheba Eyecon Tower", label: "Sheba Eyecon Tower" },
              { value: "Bashundhara Tower", label: "Bashundhara Tower" },
              {
                value: "Dhaka Commercial Center",
                label: "Dhaka Commercial Center",
              },
            ]}
          />
        )}
        {(type === "issue" || type === "consumption") && (
          <>
            <SelectField
              label="Reference type"
              name="refType"
              options={[
                { value: "Project", label: "Project" },
                { value: "Requisition", label: "Requisition" },
                { value: "Manual", label: "Manual" },
              ]}
            />
            <Field label="Reference UUID" name="refUuid" />
          </>
        )}
        {isAdjustment && (
          <SelectField
            label="Approver"
            name="approver"
            options={[
              { value: "Inventory Supervisor", label: "Inventory Supervisor" },
              { value: "Operations Manager", label: "Operations Manager" },
              { value: "System Admin", label: "System Admin" },
            ]}
          />
        )}
        <Field
          label="Date"
          name="date"
          type="date"
          defaultValue={today}
          required
        />
        {isAdjustment || type === "issue" ? (
          <TextArea
            label={isAdjustment ? "Reason" : "Notes"}
            name={isAdjustment ? "reason" : "notes"}
            required={isAdjustment}
          />
        ) : (
          <TextArea label="Notes" name="notes" />
        )}
        {type === "issue" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Photo</span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="block w-full text-sm text-slate-500"
            />
          </label>
        )}
      </>,
    );
  };

  const renderOpeningList = () => {
    const openings = data.movements.filter((row) => row.type === "opening");
    return (
      <>
        <PageTitle
          title="Opening stock"
          description="Starting quantities and rates by item and warehouse."
          action={
            <ButtonLink href={inventoryPath("opening/create")}>
              <Plus size={16} /> Add opening stock
            </ButtonLink>
          }
        />
        <DataTable
          columns={["Item", "Warehouse", "Qty", "Rate", "Value", "Date"]}
          rows={openings.map((row) => [
            items.find((item) => item.id === row.itemId)?.name ??
              "Unknown item",
            warehouses.find((warehouse) => warehouse.id === row.warehouseId)
              ?.name ?? "Unknown warehouse",
            formatNumber(row.qty),
            formatMoney(row.rate),
            formatMoney(row.qty * row.rate),
            row.date,
          ])}
        />
      </>
    );
  };

  const renderBalance = () => {
    const filtered = warehouseStockRows.filter(
      ({ item, warehouse, qty }) =>
        (!selectedWarehouse || warehouse.id === selectedWarehouse) &&
        (!selectedItem || item.id === selectedItem) &&
        (!lowStockOnly || (item.reorderLevel > 0 && qty < item.reorderLevel)),
    );
    return (
      <>
        <PageTitle
          title="Stock balance"
          description="Current on-hand quantity and average-cost snapshot."
        />
        <div className="mb-4 flex gap-3">
          <label className="text-xs font-medium text-slate-500">
            Warehouse
            <select
              className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
              value={selectedWarehouse}
              onChange={(event) => setSelectedWarehouse(event.target.value)}
            >
              <option value="">All warehouses</option>
              {warehouseOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-500">
            Item
            <select
              className="ml-2 h-9 max-w-64 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
              value={selectedItem}
              onChange={(event) => setSelectedItem(event.target.value)}
            >
              <option value="">All items</option>
              {itemOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 self-center text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
            />
            Low stock only
          </label>
        </div>
        <DataTable
          columns={[
            "Item",
            "Warehouse",
            "Qty",
            "Avg cost",
            "Value",
            "Last movement",
          ]}
          rows={filtered.map(({ item, warehouse, qty }) => {
            const last = data.movements
              .filter(
                (row) =>
                  row.itemId === item.id &&
                  (row.warehouseId === warehouse.id ||
                    row.toWarehouseId === warehouse.id),
              )
              .sort((left, right) => left.date.localeCompare(right.date))
              .at(-1);
            return [
              item.name,
              warehouse.name,
              <span
                className={
                  qty < item.reorderLevel
                    ? "font-bold text-rose-600"
                    : "font-medium"
                }
                key="qty"
              >
                {formatNumber(qty)}
              </span>,
              formatMoney(item.avgCost),
              formatMoney(qty * item.avgCost),
              last?.date ?? "—",
            ];
          })}
        />
      </>
    );
  };

  const renderLedger = () => {
    const balances = new Map<string, number>();
    const refTypes = [
      ...new Set(
        data.movements.map((movement) => movement.refType ?? movement.type),
      ),
    ];
    const ledgerRows = data.movements
      .map((movement, index) => ({ movement, index }))
      .sort(
        (left, right) =>
          left.movement.date.localeCompare(right.movement.date) ||
          left.index - right.index,
      )
      .flatMap(({ movement }) => {
        const projections: {
          warehouseId: string;
          inQty: number;
          outQty: number;
        }[] =
          movement.type === "transfer"
            ? [
                {
                  warehouseId: movement.warehouseId,
                  inQty: 0,
                  outQty: movement.qty,
                },
                {
                  warehouseId: movement.toWarehouseId ?? "",
                  inQty: movement.qty,
                  outQty: 0,
                },
              ]
            : movement.type === "opening" || movement.type === "return"
              ? [
                  {
                    warehouseId: movement.warehouseId,
                    inQty: movement.qty,
                    outQty: 0,
                  },
                ]
              : movement.type === "issue" || movement.type === "consumption"
                ? [
                    {
                      warehouseId: movement.warehouseId,
                      inQty: 0,
                      outQty: movement.qty,
                    },
                  ]
                : movement.qty >= 0
                  ? [
                      {
                        warehouseId: movement.warehouseId,
                        inQty: movement.qty,
                        outQty: 0,
                      },
                    ]
                  : [
                      {
                        warehouseId: movement.warehouseId,
                        inQty: 0,
                        outQty: Math.abs(movement.qty),
                      },
                    ];
        return projections.map((projection) => {
          const balanceKey = `${movement.itemId}:${projection.warehouseId}`;
          const balance =
            (balances.get(balanceKey) ?? 0) +
            projection.inQty -
            projection.outQty;
          balances.set(balanceKey, balance);
          return { movement, ...projection, balance };
        });
      })
      .filter(
        ({ movement, warehouseId }) =>
          (!selectedItem || movement.itemId === selectedItem) &&
          (!selectedWarehouse || warehouseId === selectedWarehouse) &&
          (!dateFrom || movement.date >= dateFrom) &&
          (!dateTo || movement.date <= dateTo) &&
          (!selectedRefType ||
            (movement.refType ?? movement.type) === selectedRefType) &&
          (!search ||
            `${movement.code} ${movement.refType ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      );
    const exportRows = ledgerRows.map(
      ({ movement, inQty, outQty, balance }) => [
        movement.date,
        items.find((item) => item.id === movement.itemId)?.name ??
          movement.itemId,
        movement.refType ?? movement.type,
        movement.code,
        inQty,
        outQty,
        formatNumber(balance),
        movement.rate,
      ],
    );
    return (
      <>
        <PageTitle
          title="Balance ledger"
          description="Read-only stock movement history. Export the filtered result as CSV."
          action={
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() =>
                exportCsv(
                  [
                    "Date",
                    "Item",
                    "Ref type",
                    "Ref no",
                    "In qty",
                    "Out qty",
                    "Balance",
                    "Rate",
                  ],
                  exportRows,
                  "inventory-ledger.csv",
                )
              }
            >
              <FileDown size={16} /> Export CSV
            </button>
          }
        />
        <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <input
            aria-label="Search reference"
            className="h-9 min-w-48 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            placeholder="Reference type or number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter warehouse"
            className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
          >
            <option value="">All warehouses</option>
            {warehouseOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter item"
            className="h-9 max-w-56 rounded-lg border border-slate-200 px-2 text-sm"
            value={selectedItem}
            onChange={(event) => setSelectedItem(event.target.value)}
          >
            <option value="">All items</option>
            {itemOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter reference type"
            className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
            value={selectedRefType}
            onChange={(event) => setSelectedRefType(event.target.value)}
          >
            <option value="">All reference types</option>
            {refTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            aria-label="From date"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
          />
          <input
            aria-label="To date"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
          />
        </div>
        <DataTable
          columns={[
            "Date",
            "Item",
            "Ref type",
            "Ref no",
            "In qty",
            "Out qty",
            "Balance",
            "Rate",
          ]}
          rows={ledgerRows.map(({ movement, inQty, outQty, balance }) => [
            movement.date,
            items.find((item) => item.id === movement.itemId)?.name ??
              "Unknown item",
            movement.refType ?? movement.type,
            movement.code,
            inQty ? formatNumber(inQty) : "—",
            outQty ? formatNumber(outQty) : "—",
            formatNumber(balance),
            formatMoney(movement.rate),
          ])}
        />
      </>
    );
  };

  const renderValuation = () => (
    <>
      <PageTitle
        title="Inventory valuation"
        description="Current quantity and stock value at average cost."
      />
      <DataTable
        columns={[
          "Item",
          "Warehouse",
          "Qty",
          "Avg cost",
          "Total value",
          "As of",
        ]}
        rows={warehouseStockRows
          .filter(
            ({ warehouse, item }) =>
              (!selectedWarehouse || warehouse.id === selectedWarehouse) &&
              (!selectedItem || item.id === selectedItem),
          )
          .map(({ item, warehouse, qty }) => [
            item.name,
            warehouse.name,
            formatNumber(qty),
            formatMoney(item.avgCost),
            formatMoney(qty * item.avgCost),
            today,
          ])}
      />
    </>
  );

  const renderIssueList = () => {
    const issues = data.movements.filter((row) => row.type === "issue");
    return (
      <>
        <PageTitle
          title="Stock issues"
          description="Issued quantities, recipients, and references."
          action={
            <ButtonLink href={inventoryPath("issues/create")}>
              <Plus size={16} /> New issue
            </ButtonLink>
          }
        />
        <DataTable
          columns={["Code", "Item", "Warehouse", "Qty", "Issued to", "Ref"]}
          rows={issues.map((row) => [
            row.code,
            items.find((item) => item.id === row.itemId)?.name ??
              "Unknown item",
            warehouses.find((warehouse) => warehouse.id === row.warehouseId)
              ?.name ?? "Unknown warehouse",
            formatNumber(row.qty),
            row.issuedTo ?? "—",
            row.refUuid ?? row.refType ?? "—",
          ])}
        />
      </>
    );
  };

  const renderCounts = () => (
    <>
      <PageTitle
        title="Physical counts"
        description="Create count sessions and review line-by-line differences."
        action={
          <ButtonLink href={inventoryPath("counts/create")}>
            <Plus size={16} /> Start count
          </ButtonLink>
        }
      />
      <DataTable
        columns={[
          "Count ID",
          "Warehouse",
          "Counted at",
          "Lines",
          "Status",
          "Details",
        ]}
        rows={data.counts.map((count) => [
          count.id.slice(-8),
          warehouses.find((row) => row.id === count.warehouseId)?.name ??
            "Unknown warehouse",
          count.countedAt,
          String(count.lines.length),
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${count.status === "Adjusted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
            key={count.id}
          >
            {count.status}
          </span>,
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-800"
            href={inventoryPath(`counts/${count.id}`)}
            key="open"
          >
            Open count
          </Link>,
        ])}
      />
    </>
  );

  const renderCountEditor = (count: CountSession) => (
    <>
      <PageTitle
        title="Count detail"
        description={`Warehouse: ${warehouses.find((row) => row.id === count.warehouseId)?.name ?? "Unknown"} · Counted at ${count.countedAt}`}
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print view
          </button>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {[
                "Item",
                "System qty",
                "Counted qty",
                "Difference",
                "Note",
                "Save line",
              ].map((heading) => (
                <th className="px-4 py-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {count.lines.map((line, index) => {
              const item = items.find((row) => row.id === line.itemId);
              const draftKey = `${count.id}-${index}`;
              const draft = countDrafts[draftKey];
              const countedQty = draft?.qty ?? line.countedQty;
              const note = draft?.note ?? line.note;
              return (
                <tr key={line.itemId}>
                  <td className="px-4 py-3 font-medium">
                    {item?.name ?? line.itemId}
                  </td>
                  <td className="px-4 py-3">{formatNumber(line.systemQty)}</td>
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Counted quantity ${item?.name}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={countedQty}
                      className="h-9 w-28 rounded-md border border-slate-200 px-2"
                      onChange={(event) => {
                        setHasUnsavedChanges(true);
                        setCountDrafts((current) => ({
                          ...current,
                          [draftKey]: { qty: Number(event.target.value), note },
                        }));
                      }}
                    />
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${countedQty === line.systemQty ? "text-slate-500" : "text-amber-700"}`}
                  >
                    {formatNumber(countedQty - line.systemQty)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Count note ${item?.name}`}
                      value={note}
                      className="h-9 min-w-36 rounded-md border border-slate-200 px-2"
                      onChange={(event) => {
                        setHasUnsavedChanges(true);
                        setCountDrafts((current) => ({
                          ...current,
                          [draftKey]: {
                            qty: countedQty,
                            note: event.target.value,
                          },
                        }));
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      onClick={(event) => {
                        saveCountLine(count.id, index, countedQty, note);
                      }}
                    >
                      Save line
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          disabled={count.status === "Adjusted"}
          className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
          onClick={() => submitCount(count)}
        >
          {count.status === "Adjusted" ? "Count submitted" : "Submit count"}
        </button>
      </div>
    </>
  );

  const renderHome = () => (
    <>
      <PageTitle
        title="Inventory"
        description="Item master, stock control, and inventory reporting."
        action={
          <ButtonLink href={inventoryPath("items")}>
            <Package size={16} /> Browse items
          </ButtonLink>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active items"
          value={formatNumber(
            items.filter((item) => item.status === "Active").length,
          )}
          detail="Across all categories"
        />
        <StatCard
          label="Units on hand"
          value={formatNumber(totalUnits)}
          detail="Current total stock quantity"
        />
        <StatCard
          label="Inventory value"
          value={formatMoney(stockValue)}
          detail="Calculated at average cost"
        />
        <StatCard
          label="Below reorder"
          value={formatNumber(lowStockCount)}
          detail="Items requiring replenishment"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {menu.slice(1).map((entry) => {
          const Icon = entry.icon;
          return (
            <Link
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              href={entry.href}
              key={entry.href}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={20} />
              </span>
              <span className="font-semibold text-slate-800 group-hover:text-indigo-700">
                {entry.label}
              </span>
              <span className="ml-auto text-slate-300 group-hover:text-indigo-500">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );

  const isCreate = subroute === "create";
  let content: ReactNode;
  if (section === "home") content = renderHome();
  else if (section === "items" && isCreate)
    content = masterForm("items", "Create item");
  else if (section === "items") content = renderMasterList("items");
  else if (section === "categories" && isCreate)
    content = masterForm("categories", "Create category");
  else if (section === "categories") content = renderMasterList("categories");
  else if (section === "brands" && isCreate)
    content = masterForm("brands", "Create brand");
  else if (section === "brands") content = renderMasterList("brands");
  else if (section === "uom" && isCreate)
    content = masterForm("uoms", "Create unit of measure");
  else if (section === "uom") content = renderMasterList("uoms");
  else if (section === "warehouses" && isCreate)
    content = masterForm("warehouses", "Create warehouse");
  else if (section === "warehouses") content = renderMasterList("warehouses");
  else if (section === "opening" && isCreate)
    content = renderMovementForm("opening");
  else if (section === "opening") content = renderOpeningList();
  else if (section === "balance") content = renderBalance();
  else if (section === "ledger") content = renderLedger();
  else if (section === "valuation") content = renderValuation();
  else if (section === "issues" && isCreate)
    content = renderMovementForm("issue");
  else if (section === "issues") content = renderIssueList();
  else if (section === "returns" && isCreate)
    content = renderMovementForm("return");
  else if (section === "transfers" && isCreate)
    content = renderMovementForm("transfer");
  else if (section === "adjustments" && isCreate)
    content = renderMovementForm("adjustment");
  else if (section === "consumption" && isCreate)
    content = renderMovementForm("consumption");
  else if (section === "counts" && isCreate) {
    content = renderForm(
      "Start physical count",
      "Choose a warehouse and date to snapshot system quantities.",
      createCount,
      <>
        <SelectField
          label="Warehouse"
          name="warehouseId"
          required
          options={warehouseOptions}
        />
        <Field
          label="Counted at"
          name="countedAt"
          type="date"
          defaultValue={today}
          required
        />
      </>,
    );
  } else if (section === "counts" && selectedCount)
    content = renderCountEditor(selectedCount);
  else if (section === "counts") content = renderCounts();
  else if (section === "slow-moving") {
    const moving = warehouseStockRows
      .map(({ item, warehouse, qty }) => {
        const last = data.movements
          .filter(
            (row) =>
              row.itemId === item.id &&
              (row.warehouseId === warehouse.id ||
                row.toWarehouseId === warehouse.id),
          )
          .sort((left, right) => left.date.localeCompare(right.date))
          .at(-1);
        const days = last
          ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)
          : 0;
        return { item, warehouse, qty, date: last?.date ?? "—", days };
      })
      .filter((row) => row.days >= daysMin);
    content = (
      <>
        <PageTitle
          title="Slow-moving stock"
          description="Items with no recent movement and their current stock value."
        />
        <label className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Days since movement{" "}
          <input
            className="h-8 w-24 rounded-md border border-slate-200 px-2"
            type="number"
            min={0}
            value={daysMin}
            onChange={(event) => setDaysMin(Number(event.target.value))}
          />
        </label>
        <DataTable
          columns={[
            "Item",
            "Warehouse",
            "Qty",
            "Value",
            "Last movement",
            "Days since",
          ]}
          rows={moving.map(({ item, warehouse, qty, date, days }) => [
            item.name,
            warehouse.name,
            formatNumber(qty),
            formatMoney(qty * item.avgCost),
            date,
            formatNumber(days),
          ])}
        />
      </>
    );
  } else {
    content = (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">
          Inventory page not found
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a page from the inventory menu.
        </p>
        <ButtonLink href={inventoryPath()}>Inventory overview</ButtonLink>
      </div>
    );
  }

  const accessibleMenu = menu.filter((entry) => {
    if (entry.href === INVENTORY_BASE_PATH) return true;
    const featurePath = entry.href
      .slice(INVENTORY_BASE_PATH.length + 1)
      .replace(/\/+$/, "");
    return hasAccessToRoute(
      "inventory",
      getInventoryPermissionPath(featurePath),
    );
  });

  return (
    <div className="min-h-full bg-background p-4 font-sans text-foreground sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5">
          <RouteBreadcrumb />
        </div>
        <nav
          aria-label="Inventory navigation"
          className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-3"
        >
          {accessibleMenu.map((entry) => {
            const Icon = entry.icon;
            const active =
              pathname === entry.href ||
              (entry.href !== INVENTORY_BASE_PATH &&
                pathname.startsWith(`${entry.href}/`));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={entry.href}
                key={entry.href}
              >
                <Icon size={16} />
                {entry.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">
          {!ready ? <InventoryTableSkeleton /> : content}
          {section === "issues" && !isCreate && (
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={inventoryPath("returns/create")} secondary>
                <ArrowDownLeft size={15} /> Record return
              </ButtonLink>
              <ButtonLink href={inventoryPath("consumption/create")} secondary>
                <Activity size={15} /> Record consumption
              </ButtonLink>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Some workflows are stored only in this browser because the backend
          does not yet expose matching inventory endpoints.
        </p>
      </div>
      {itemModal && renderItemModal()}
      {masterModal && renderMasterModal()}
    </div>
  );
}
