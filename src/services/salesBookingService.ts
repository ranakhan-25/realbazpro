/* eslint-disable prettier/prettier */

import api from "@/lib/api";


export type ApiRecord = Record<string, any>;

export const salesBookingService = {
  findAll: (params?: ApiRecord) =>
    api.get("/bookings", { params }).then((r) => r.data),

  findOne: (bookingUuid: string) =>
    api.get(`/bookings/${bookingUuid}`).then((r) => r.data),

  // ✅ overview: overviewUuid থাকলে নির্দিষ্ট, না থাকলে প্রথমটি
  getOverview: async (bookingUuid: string, overviewUuid?: string) => {
    const url = overviewUuid
      ? `/bookings/${bookingUuid}/overview/${overviewUuid}`
      : `/bookings/${bookingUuid}/overview`;
    const res = await api.get(url);
    return res.data;
  },

  upsertOverview: (bookingUuid: string, payload: ApiRecord) =>
    api.post(`/bookings/${bookingUuid}/overview`, payload).then((r) => r.data),

  updateOverview: (bookingUuid: string, overviewUuid: string, payload: ApiRecord) =>
    api.patch(`/bookings/${bookingUuid}/overview/${overviewUuid}`, payload).then((r) => r.data),

  deleteOverview: (bookingUuid: string, overviewUuid: string) =>
    api.delete(`/bookings/${bookingUuid}/overview/${overviewUuid}`).then((r) => r.data),
};