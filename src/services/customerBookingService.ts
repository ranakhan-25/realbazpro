import api from "@/lib/api";

export type HandoverStatus =
  "Under Construction" | "Ready for Snagging" | "DLP Active" | "Handed Over";

export type BookingTabKey =
  "all" | "under_construction" | "snagging" | "dlp" | "handedover";

export interface BookingStatsData {
  total_booked_units: number;
  ready_for_snagging: number;
  dlp_active: number;
  handed_over: number;
  under_construction: number;
  total_portfolio_valuation: number;
  total_portfolio_valuation_formatted: string;
  total_collected_amount: number;
  total_collected_amount_formatted: string;
  total_outstanding_due: number;
  total_outstanding_due_formatted: string;
}

export interface BookingListItem {
  id: string;
  uuid: string;
  code: string;
  customer_id: string;
  customer_uuid?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  project_id?: string;
  project_name?: string;
  project_code?: string;
  unit_id?: string;
  unit_type?: string;
  unit_number?: string;
  floor?: string;
  size_sqft?: number;
  total_price: number;
  booking_money: number;
  paid_amount: number;
  due_amount: number;
  payment_status: "Paid" | "Partial" | "Due" | "Overdue";
  next_installment_date?: string;
  handover_status: HandoverStatus;
  booking_date: string;
  possession_date?: string;
  dlp_start_date?: string;
  dlp_expiry_date?: string;
  key_register_no?: string;
  possession_cert_no?: string;
  total_snags_reported: number;
  total_snags_resolved: number;
  open_snags: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface BookingTabCounts {
  all: number;
  snagging: number;
  dlp: number;
  handedover: number;
  under_construction: number;
}

export interface BookingPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface BookingListResponse {
  items: BookingListItem[];
  tab_counts: BookingTabCounts;
  meta: BookingPaginationMeta;
}

export interface BookingDropdownMeta {
  projects: Array<{ id: number; uuid: string; name: string; code: string }>;
  handover_statuses: Array<{
    value: HandoverStatus;
    label: string;
    description: string;
  }>;
  unit_types: string[];
}

export interface Booking360Detail {
  booking: {
    id: string;
    uuid: string;
    code: string;
    booking_date: string;
    sales_by?: string;
    status: string;
    rate: number;
    subtotal: number;
    other_cost: number;
    parking: number;
    utility_charge: number;
    discount: number;
    grand_total: number;
    paid: number;
    due: number;
    payment_status: string;
    attachment?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
  };
  unit: {
    unit_id?: string;
    unit_number?: string;
    unit_type?: string;
    floor?: string;
    size_sqft?: number;
    bedroom?: number;
    bathroom?: number;
    facing?: string;
    amenities?: string;
    drawing?: string;
    dining?: string;
    kitchen?: string;
    balcony?: string;
    parking?: string;
    basement?: string;
    status?: string;
  };
  project: {
    id?: number;
    uuid?: string;
    code?: string;
    name?: string;
    project_type?: string;
    location?: string;
    description?: string;
  };
  customer: {
    customer_id?: string;
    customer_uuid?: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    nid_number?: string;
    tin_number?: string;
    nominee_name?: string;
    nominee_relation?: string;
  };
  handover: {
    handover_status: HandoverStatus;
    possession_date?: string;
    dlp_start_date?: string;
    dlp_expiry_date?: string;
    key_register_no?: string;
    possession_cert_no?: string;
    total_snags_reported: number;
    total_snags_resolved: number;
    open_snags: number;
    remarks?: string;
  };
  cost_breakdown: {
    rate: number;
    subtotal: number;
    parking: number;
    utility_charge: number;
    other_cost: number;
    discount: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
  };
  milestone_history: Array<{
    installment_no: number;
    title: string;
    due_date: string;
    payable_amount: number;
    paid_amount: number;
    due_amount: number;
    status: string;
  }>;
  snag_summary: {
    total_snags_reported: number;
    total_snags_resolved: number;
    open_snags: number;
  };
}

export interface DemandLetterPreview {
  booking_code: string;
  booking_uuid: string;
  customer_name: string;
  customer_phone?: string;
  project_name?: string;
  unit_number?: string;
  demand_letter_reference: string;
  generation_date: string;
  current_milestone: {
    installment_no?: number;
    title: string;
    due_date?: string;
    payable_amount: number;
    paid_amount: number;
    due_amount: number;
    is_overdue: boolean;
  };
  financial_summary: {
    grand_total: number;
    total_paid: number;
    total_due: number;
  };
  bank_instructions: {
    bank_name: string;
    account_name: string;
    account_number: string;
    branch_name: string;
    routing_number: string;
    payment_methods: string[];
  };
}

export interface UpdateHandoverStatusPayload {
  handover_status: HandoverStatus;
  possession_date?: string;
  dlp_expiry_date?: string;
  key_register_no?: string;
  possession_cert_no?: string;
  total_snags_reported?: number;
  total_snags_resolved?: number;
  remarks?: string;
}

export interface QueryPropertiesBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: BookingTabKey;
  project_id?: string;
  projectId?: string;
  customer_id?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

/**
 * 1. Fetch KPI Overview Metrics for Bookings & Property Portfolio
 */
  export async function getPropertiesBookingStats(projectId?: string): Promise<BookingStatsData> {
    const params: Record<string, string> = {};
    if (projectId && projectId !== "all") {
      params.project_id = projectId;
    }
    const res = await api.get("/customer-service/properties-bookings/stats", { params });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      total_booked_units: Number(raw?.total_booked_units || 0),
      ready_for_snagging: Number(raw?.ready_for_snagging || 0),
      dlp_active: Number(raw?.dlp_active || 0),
      handed_over: Number(raw?.handed_over || 0),
      under_construction: Number(raw?.under_construction || 0),
      total_portfolio_valuation: Number(raw?.total_portfolio_valuation || 0),
      total_portfolio_valuation_formatted:
        raw?.total_portfolio_valuation_formatted || "৳ 0.00",
      total_collected_amount: Number(raw?.total_collected_amount || 0),
      total_collected_amount_formatted:
        raw?.total_collected_amount_formatted || "৳ 0.00",
      total_outstanding_due: Number(raw?.total_outstanding_due || 0),
      total_outstanding_due_formatted:
        raw?.total_outstanding_due_formatted || "৳ 0.00",
    };
  }

  /**
   * 2. Fetch dropdown metadata (projects, handover statuses, unit types)
   */
  export async function getPropertiesBookingDropdownMeta(): Promise<BookingDropdownMeta> {
    const res = await api.get(
      "/customer-service/properties-bookings/dropdown/meta",
    );
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return {
      projects: Array.isArray(raw?.projects) ? raw.projects : [],
      handover_statuses: Array.isArray(raw?.handover_statuses)
        ? raw.handover_statuses
        : [],
      unit_types: Array.isArray(raw?.unit_types) ? raw.unit_types : [],
    };
  }

  /**
   * 3. List customer property bookings with search, tab counts, and pagination
   */
  export async function getPropertiesBookings(
    params?: QueryPropertiesBookingsParams,
  ): Promise<BookingListResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search) queryParams.search = params.search;
    if (params?.tab && params.tab !== "all") queryParams.tab = params.tab;
    const targetProjectId = params?.projectId || params?.project_id;
    if (targetProjectId && targetProjectId !== "all") {
      queryParams.project_id = targetProjectId;
      queryParams.projectId = targetProjectId;
    }
    if (params?.customer_id) queryParams.customer_id = params.customer_id;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;

    const res = await api.get("/customer-service/properties-bookings", {
      params: queryParams,
    });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;

    return {
      items: Array.isArray(raw?.items) ? raw.items : [],
      tab_counts: raw?.tab_counts || {
        all: 0,
        snagging: 0,
        dlp: 0,
        handedover: 0,
        under_construction: 0,
      },
      meta: raw?.meta || {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        total_pages: 1,
        has_next_page: false,
        has_previous_page: false,
      },
    };
  }

  /**
   * 4. Get complete Booking 360 view by UUID
   */
  export async function getPropertiesBooking360(
    uuid: string,
  ): Promise<Booking360Detail> {
    const res = await api.get(`/customer-service/properties-bookings/${uuid}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  }

  /**
   * 5. Transition property handover lifecycle status
   */
  export async function updatePropertiesBookingHandoverStatus(
    uuid: string,
    payload: UpdateHandoverStatusPayload,
  ): Promise<{ message?: string; data?: BookingListItem; success?: boolean }> {
    const res = await api.patch(
      `/customer-service/properties-bookings/${uuid}/handover-status`,
      payload,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  }

  /**
   * 6. Preview milestone demand letter details, bank instructions, and reference
   */
  export async function getPropertiesBookingDemandLetterPreview(
    uuid: string,
  ): Promise<DemandLetterPreview> {
    const res = await api.get(
      `/customer-service/properties-bookings/${uuid}/demand-letter-preview`,
    );
    return res.data?.data !== undefined ? res.data.data : res.data;
  }
