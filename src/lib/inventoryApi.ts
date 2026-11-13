export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5002/realbizpro/api/v1";

// Kept as empty arrays for older inventory views; live records come from the API.
export const fallbackCategories: any[] = [];
export const fallbackSubCategories: any[] = [];
export const fallbackBrands: any[] = [];
export const fallbackUnits: any[] = [];
export const fallbackItems: any[] = [];
export const fallbackSuppliers: any[] = [];
export const fallbackPurchases: any[] = [];
export const fallbackStockReport: any[] = [];
export const fallbackMaterialComparison: any[] = [];
export const fallbackMaterialUsage: any[] = [];
export const fallbackStockTransfers: any[] = [];
export const fallbackMaterialRequisitions: any[] = [];
export const fallbackSales: any[] = [];
export const fallbackItemHistory: any[] = [];

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const { adminAuthStorage } = await import(
      "./admin-auth/adminAuthStorage"
    );
    const token =
      adminAuthStorage.getAccessToken() ||
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (json?.data ?? json) as T;
}

const request = (endpoint: string, method: string, data?: unknown) =>
  apiFetch<any>(endpoint, {
    method,
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });

const list = async (endpoint: string) => {
  const data = await apiFetch<unknown>(endpoint);
  return Array.isArray(data) ? data : [];
};

export const categoriesApi = {
  getAll: () => list("/inventory/categories"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/categories/${id}`),
  create: (data: { category_code: string; name: string; projectId?: string }) =>
    request("/inventory/categories", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/categories/${id}`, "PUT", data),
  delete: (id: string | number) =>
    request(`/inventory/categories/${id}`, "DELETE"),
};

export const subCategoriesApi = {
  getAll: () => list("/inventory/sub-categories"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/sub-categories/${id}`),
  create: (data: {
    category_id: string;
    sub_category_code: string;
    name: string;
    projectId?: string;
  }) => request("/inventory/sub-categories", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/sub-categories/${id}`, "PUT", data),
  delete: (id: string | number) =>
    request(`/inventory/sub-categories/${id}`, "DELETE"),
};

export const brandsApi = {
  getAll: () => list("/inventory/brands"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/brands/${id}`),
  create: (data: { code: string; name: string }) =>
    request("/inventory/brands", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/brands/${id}`, "PUT", data),
  delete: (id: string | number) => request(`/inventory/brands/${id}`, "DELETE"),
};

export const unitsApi = {
  getAll: () => list("/inventory/units"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/units/${id}`),
  create: (data: { code: string; name: string }) =>
    request("/inventory/units", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/units/${id}`, "PUT", data),
  delete: (id: string | number) => request(`/inventory/units/${id}`, "DELETE"),
};

export const itemsApi = {
  getAll: () => list("/inventory/items"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/items/${id}`),
  create: (data: {
    item_code: string;
    name: string;
    type?: string;
    purchase_price: number;
    sale_price: number;
    category_id: string;
    sub_category_id?: string;
    brand_id?: string;
    unit_id: string;
    projectId?: string;
  }) => request("/inventory/items", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/items/${id}`, "PUT", data),
  delete: (id: string | number) => request(`/inventory/items/${id}`, "DELETE"),
};

export const suppliersApi = {
  getAll: () => list("/inventory/suppliers"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/suppliers/${id}`),
  create: (data: {
    code: string;
    name: string;
    company?: string;
    mobile: string;
    email?: string;
    address?: string;
    credit_limit?: number;
    opening_balance?: number;
    projectId?: string;
  }) => request("/inventory/suppliers", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/suppliers/${id}`, "PUT", data),
  delete: (id: string | number) =>
    request(`/inventory/suppliers/${id}`, "DELETE"),
};

export const purchasesApi = {
  getAll: () => list("/inventory/purchases"),
  getOne: (id: string | number) => apiFetch<any>(`/inventory/purchases/${id}`),
  create: (data: any) => request("/inventory/purchases", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/inventory/purchases/${id}`, "PATCH", data),
  delete: (id: string | number) =>
    request(`/inventory/purchases/${id}`, "DELETE"),
};

export const materialUsageApi = {
  getAll: () => list("/inventory/material-usage"),
  getOne: (id: string | number) =>
    apiFetch<any>(`/inventory/material-usage/${id}`),
  create: (data: any) => request("/inventory/material-usage", "POST", data),
  delete: (id: string | number) =>
    request(`/inventory/material-usage/${id}`, "DELETE"),
};

export const stockTransfersApi = {
  getAll: () => list("/inventory/stock-transfers"),
  getOne: (id: string | number) =>
    apiFetch<any>(`/inventory/stock-transfers/${id}`),
  create: (data: any) => request("/inventory/stock-transfers", "POST", data),
  delete: (id: string | number) =>
    request(`/inventory/stock-transfers/${id}`, "DELETE"),
};

export const materialRequisitionsApi = {
  getAll: () => list("/material-requisition"),
  getOne: (id: string | number) => apiFetch<any>(`/material-requisition/${id}`),
  create: (data: any) => request("/material-requisition", "POST", data),
  delete: (id: string | number) =>
    request(`/material-requisition/${id}`, "DELETE"),
};

export const salesApi = {
  getAll: () => list("/sales"),
  getOne: (id: string | number) => apiFetch<any>(`/sales/${id}`),
  create: (data: any) => request("/sales", "POST", data),
  update: (id: string | number, data: any) =>
    request(`/sales/${id}`, "PUT", data),
  delete: (id: string | number) => request(`/sales/${id}`, "DELETE"),
};

export const reportsApi = {
  getStockReport: (projectId?: number, itemId?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", String(projectId));
    if (itemId) params.set("item_id", itemId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any>(`/inventory/reports/stock${query}`);
  },
  getMaterialComparison: (projectId?: number) => {
    const query = projectId ? `?project_id=${projectId}` : "";
    return apiFetch<any>(`/inventory/reports/material-comparison${query}`);
  },
  getItemHistory: () => list("/inventory/reports/item-history"),
};
