import api from "@/lib/api";

export type TicketCategory =
  | "Civil Work"
  | "Sanitary & Plumbing"
  | "Electrical"
  | "Finishing & Tiles"
  | "Accounts & Billing"
  | "Handover Delay"
  | "Other";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStatus =
  | "Open"
  | "In Progress"
  | "Pending Customer"
  | "Escalated"
  | "Resolved"
  | "Closed"
  | "Reopened";

export interface TicketReplyItem {
  id: string;
  sender_id?: number | null;
  sender: string;
  role: string;
  message: string;
  timestamp: string;
}

export interface ServiceTicketItem {
  id: string; // TKT-2026-xxxxx
  uuid: string;
  ticket_no: string;
  ticketNo: string;
  subject: string;
  customer_name: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  project_id?: string | null;
  booking_id?: string | null;
  customer_profile_id?: number | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_agent: string;
  assignedAgent: string;
  assigned_agent_id?: number | null;
  sla_remaining_hours: number;
  slaRemainingHours: number;
  sla_target_hours: number;
  is_overdue: boolean;
  isOverdue: boolean;
  due_date?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  remarks?: string | null;
  replies: TicketReplyItem[];
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

export interface TicketStatsResult {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  escalated_tickets: number;
  resolved_tickets: number;
  overdue_tickets: number;
  resolved_rate: number;
  all_count: number;
}

export interface QueryTicketsParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: string;
  category?: string;
  priority?: string;
  status?: string;
  project_id?: string;
}

export interface PaginatedTicketsResult {
  items: ServiceTicketItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateTicketPayload {
  subject: string;
  customer_name: string;
  phone?: string;
  unit?: string;
  project_id?: string;
  project_name?: string;
  booking_id?: string;
  customer_profile_id?: number;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_agent_id?: number;
  assigned_agent?: string;
  remarks?: string;
}

export interface UpdateTicketPayload {
  subject?: string;
  customer_name?: string;
  phone?: string;
  unit?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_agent_id?: number;
  assigned_agent?: string;
  remarks?: string;
}

export interface AddReplyPayload {
  message: string;
  role?: string;
  status?: string;
}

export async function getCustomerTicketStats(params?: {
  project_id?: string;
}): Promise<TicketStatsResult> {
  const res = await api.get("/customer-service/tickets/stats", { params });
  return res.data?.data ?? res.data;
}

export async function getCustomerTickets(
  params?: QueryTicketsParams,
): Promise<PaginatedTicketsResult> {
  const res = await api.get("/customer-service/tickets", { params });
  return res.data?.data ?? res.data;
}

export async function getCustomerTicketByUuid(
  uuid: string,
): Promise<ServiceTicketItem> {
  const res = await api.get(`/customer-service/tickets/${uuid}`);
  return res.data?.data ?? res.data;
}

export async function createCustomerTicket(
  payload: CreateTicketPayload,
): Promise<ServiceTicketItem> {
  const res = await api.post("/customer-service/tickets", payload);
  return res.data?.data ?? res.data;
}

export async function updateCustomerTicket(
  uuid: string,
  payload: UpdateTicketPayload,
): Promise<ServiceTicketItem> {
  const res = await api.patch(`/customer-service/tickets/${uuid}`, payload);
  return res.data?.data ?? res.data;
}

export async function addCustomerTicketReply(
  uuid: string,
  payload: AddReplyPayload,
): Promise<ServiceTicketItem> {
  const res = await api.post(
    `/customer-service/tickets/${uuid}/replies`,
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function deleteCustomerTicket(
  uuid: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/customer-service/tickets/${uuid}`);
  return res.data?.data ?? res.data;
}
