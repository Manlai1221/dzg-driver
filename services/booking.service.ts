import api from "@/lib/api";

export interface BookingItem {
  product: { _id: string; name: string; price: number };
  quantity: number;
  variantId?: string;
}

export interface Booking {
  _id: string;
  code: string;
  status: string;
  totalAmount: number;
  amount: number;
  createdAt: string;
  driver?: string;
  driverAcceptedAt?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  items: BookingItem[];
}

export const bookingService = {
  // scope="available" → авах боломжтой (эзэнгүй PAID захиалгууд)
  // scope="mine"      → миний хүргэж яваа идэвхтэй захиалгууд (DELIVERY)
  list: (params?: {
    scope?: "available" | "mine";
    page?: number;
  }): Promise<{ bookings: Booking[]; total: number }> =>
    api.get("/bookings", { params: { page: 1, limit: 50, ...params } }),

  detail: (id: string): Promise<{ booking: Booking }> =>
    api.get(`/bookings/${id}`),

  accept: (id: string): Promise<{ booking: Booking }> =>
    api.post(`/bookings/${id}/accept`),

  complete: (id: string): Promise<{ booking: Booking }> =>
    api.post(`/bookings/${id}/complete`),

  stats: (): Promise<{ delivered: number; delivering: number }> =>
    api.get("/stats"),
};
