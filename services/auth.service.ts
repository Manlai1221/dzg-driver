import api from "@/lib/api";

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  vehiclePlate?: string;
  vehicleType?: string;
}

export interface AuthResponse {
  accessToken: string;
  driver: Driver;
}

export const authService = {
  login: async (phone: string, password: string): Promise<AuthResponse> => {
    const raw: any = await api.post("/auth/login", { phone, password });
    const token = raw?.accessToken ?? raw?.token ?? raw?.access_token;
    if (!token) throw new Error("Серверээс token ирээгүй байна");
    const driver: Driver = {
      _id: raw._id ?? raw.driver?._id ?? "",
      name: raw.name ?? raw.driver?.name ?? phone,
      phone: raw.phone ?? raw.driver?.phone ?? phone,
      isAvailable: raw.isAvailable ?? raw.driver?.isAvailable ?? true,
      vehiclePlate: raw.vehiclePlate ?? raw.driver?.vehiclePlate,
      vehicleType: raw.vehicleType ?? raw.driver?.vehicleType,
    };
    return { accessToken: token, driver };
  },

  me: (): Promise<any> => api.get("/auth/me"),

  registerFcmToken: (fcmToken: string): Promise<void> =>
    api.post("/auth/fcm-token", { fcmToken }),
};
