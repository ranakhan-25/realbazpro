export const INVENTORY_BASE_PATH = "/dashboard/inventory";

const INVENTORY_PERMISSION_PATHS: Record<string, string> = {
  items: "products/item-entry",
  categories: "products/categories",
  brands: "products/brands",
  uom: "products/units",
  warehouses: "reports/stock-report",
  opening: "reports/stock-report",
  balance: "reports/stock-report",
  ledger: "reports/stock-report",
  valuation: "reports/stock-report",
  issues: "adjustment/stock-transfer",
  returns: "adjustment/stock-transfer",
  transfers: "adjustment/stock-transfer",
  adjustments: "adjustment/stock-transfer",
  counts: "reports/stock-report",
  consumption: "adjustment/material-usage",
  "slow-moving": "reports/stock-report",
};

export function getInventoryPermissionPath(path: string): string {
  const [feature, ...rest] = path.split("/").filter(Boolean);
  const permissionPath = INVENTORY_PERMISSION_PATHS[feature];
  return permissionPath ? [permissionPath, ...rest].join("/") : path;
}

export function inventoryPath(path = ""): string {
  return path ? `${INVENTORY_BASE_PATH}/${path}` : INVENTORY_BASE_PATH;
}
