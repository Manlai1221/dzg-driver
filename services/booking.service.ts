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
  list: (page = 1): Promise<{ bookings: Booking[]; total: number }> =>
    api.get("/bookings", { params: { page, limit: 20 } }),

  detail: (id: string): Promise<{ booking: Booking }> =>
    api.get(`/bookings/${id}`),

  accept: (id: string): Promise<{ booking: Booking }> =>
    api.post(`/bookings/${id}/accept`),

  complete: (id: string): Promise<{ booking: Booking }> =>
    api.post(`/bookings/${id}/complete`),
};
