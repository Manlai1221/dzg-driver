import { storage, TOKEN_KEY } from "@/lib/storage";
import { authService, Driver } from "@/services/auth.service";
import { create } from "zustand";

interface DriverState {
  driver: Driver | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setDriver: (d: Partial<Driver>) => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driver: null,
  token: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const token = await storage.get(TOKEN_KEY);
    if (token) {
      try {
        const raw: any = await authService.me();
        const driver: Driver = {
          _id: raw._id ?? raw.driver?._id ?? "",
          name: raw.name ?? raw.driver?.name ?? "",
          phone: raw.phone ?? raw.driver?.phone ?? "",
          isAvailable: raw.isAvailable ?? true,
          vehiclePlate: raw.vehiclePlate,
          vehicleType: raw.vehicleType,
        };
        set({ driver, token, initialized: true });
      } catch {
        await storage.remove(TOKEN_KEY);
        set({ initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },

  login: async (phone, password) => {
    set({ loading: true });
    try {
      const res = await authService.login(phone, password);
      await storage.set(TOKEN_KEY, res.accessToken);
      set({ driver: res.driver, token: res.accessToken });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await storage.remove(TOKEN_KEY);
    set({ driver: null, token: null });
  },

  setDriver: (d) =>
    set((s) => ({ driver: s.driver ? { ...s.driver, ...d } : null })),
}));
