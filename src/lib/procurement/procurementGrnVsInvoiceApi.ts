import api from "../api";

// =============================================================================
// SWAGGER TYPES & SCHEMAS FOR GRN VS INVOICE REPORT
// Base Path: /realbizpro/api/v1/procurement/reports/grn-vs-invoice
// =============================================================================

export interface DropdownBill {
  uuid: string;
  code: string;
  date?: string;
  supplier_id?: string;
}

export interface DropdownGrn {
  uuid: string;
  code: string;
  date?: string;
  supplier_id?: string;
  project_id?: string;
}

export interface DropdownCategory {
  uuid: string;
  code?: string;
  name: string;
}

export interface DropdownItem {
  uuid: string;
  item_code: string;
  name: string;
  category_id?: string;
}

export interface DropdownSupplier {
  uuid: string;
  supplierCode?: string;
  supplierName: string;
}

export interface DropdownProject {
  uuid: string;
  code?: string;
  name: string;
}

export interface DropdownProjectType {
  uuid: string;
  code?: string;
  name: string;
}

export interface GrnVsInvoiceDropdownsData {
  bills: DropdownBill[];
  grns: DropdownGrn[];
  categories: DropdownCategory[];
  items: DropdownItem[];
  suppliers: DropdownSupplier[];
  projects: DropdownProject[];
  projectTypes: DropdownProjectType[];
}

export interface QueryGrnVsInvoiceParams {
  date_from?: string;
  date_to?: string;
  bill_id?: string;
  category_id?: string;
  item_id?: string;
  supplier_id?: string;
  project_id?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GrnVsInvoiceRow {
  id: number | string;
  date: string;
  purchase_order_no: string;
  grn_no: string;
  bill_no: string;
  supplier?: {
    uuid: string;
    supplierCode?: string;
    supplierName: string;
  } | null;
  project?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  project_type?: {
    uuid: string;
    code?: string;
    name: string;
  } | null;
  item_code: string;
  item_name: string;
  category_id?: string;
  grn_qty: number;
  already_bill_qty: number;
  grn_total: number;
  bill_total: number;
}

export interface GrnVsInvoiceTotals {
  grn_qty: number;
  already_bill_qty: number;
  grn_total: number;
  bill_total: number;
}

export interface GrnVsInvoiceReportResult {
  data: GrnVsInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totals: GrnVsInvoiceTotals;
}

// =============================================================================
// API SERVICE
// =============================================================================

export const procurementGrnVsInvoiceApi = {
  /**
   * GET /realbizpro/api/v1/procurement/reports/grn-vs-invoice/dropdowns
   * Fetch filter dropdown options
   */
  async getDropdowns(): Promise<GrnVsInvoiceDropdownsData> {
    const res = await api.get("/procurement/reports/grn-vs-invoice/dropdowns");
    return (
      res.data?.data ||
      res.data || {
        bills: [],
        grns: [],
        categories: [],
        items: [],
        suppliers: [],
        projects: [],
        projectTypes: [],
      }
    );
  },

  /**
   * GET /realbizpro/api/v1/procurement/reports/grn-vs-invoice
   * Fetch report data comparing goods received with invoiced quantities and totals
   */
  async getReport(
    params?: QueryGrnVsInvoiceParams,
  ): Promise<GrnVsInvoiceReportResult> {
    const res = await api.get("/procurement/reports/grn-vs-invoice", {
      params,
    });
    return (
      res.data?.data ||
      res.data || {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        totals: {
          grn_qty: 0,
          already_bill_qty: 0,
          grn_total: 0,
          bill_total: 0,
        },
      }
    );
  },
};

export default procurementGrnVsInvoiceApi;
