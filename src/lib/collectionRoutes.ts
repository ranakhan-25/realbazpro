export const COLLECTION_BASE_PATH = "/dashboard/collection";

const COLLECTION_PERMISSION_PATHS: Record<string, string> = {
  schedule: "agreements",
  due: "overdue-list",
  entries: "receipt-voucher",
  receipts: "receipt-voucher",
  waivers: "agreements",
  outstanding: "reports/realization-summary-report",
  aging: "reports/aging-report",
  overdue: "overdue-list",
  recovery: "recovery",
  followups: "recovery",
  visits: "recovery",
  perf: "dashboard",
  dashboard: "dashboard",
};

export function getCollectionPermissionPath(path: string): string {
  const [feature, ...rest] = path.split("/").filter(Boolean);
  const permissionPath = COLLECTION_PERMISSION_PATHS[feature];
  return permissionPath ? [permissionPath, ...rest].join("/") : path;
}

export function collectionPath(path = ""): string {
  return path ? `${COLLECTION_BASE_PATH}/${path}` : COLLECTION_BASE_PATH;
}
