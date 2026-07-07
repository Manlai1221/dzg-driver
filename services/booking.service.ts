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
  // Хүргэлтийн мэдээллийг booking дээр шууд хадгална (захиалга үүсэх үеийн snapshot).
  // Жолоочид харуулах ЗӨВ эх сурвалж энэ — `user` нь populate хийгдээгүй ObjectId.
  customerName?: string;
  customerPhone?: string;
  address?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  items: BookingItem[];
}

/**
 * Захиалгаас харуулах хэрэглэгч/утас/хаягийг гаргана.
 * Эхлээд booking дээрх snapshot (customerName/customerPhone/address)-ыг,
 * байхгүй бол populate хийгдсэн user-ийн талбарыг ашиглана.
 */
export function bookingContact(b: Booking): {
  name: string;
  phone: string;
  address: string;
} {
  const name =
    b.customerName?.trim() ||
    [b.user?.firstName, b.user?.lastName].filter(Boolean).join(" ").trim();
  const phone = b.customerPhone?.trim() || b.user?.phone?.trim() || "";
  const address = b.address?.trim() || b.user?.address?.trim() || "";
  return { name: name || "Хэрэглэгч", phone, address };
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
