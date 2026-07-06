import axios from "axios";
import { API_BASE_URL } from "@/constants/config";
import { storage, TOKEN_KEY } from "@/lib/storage";

const api = axios.create({
  baseURL: `${API_BASE_URL}/driver`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // --- ОНОШИЙН LOG (нэвтрэлт / хүсэлтийн алдааг илрүүлэх) ---
    const cfg = err.config || {};
    const fullUrl = `${cfg.baseURL || ""}${cfg.url || ""}`;
    console.warn(
      "[api-error]",
      "method:", cfg.method,
      "url:", fullUrl,
      "status:", err.response?.status ?? "(no response)",
      "code:", err.code,
      "data:", JSON.stringify(err.response?.data),
      "message:", err.message,
    );
    // "Application not found" гэх мэт хариу нь backend-ээс биш, host (Railway/Vercel)
    // -ийн 404 байх магадлалтай — доорх лог үүнийг ялгаж харуулна.
    const rawData = err.response?.data;
    const message =
      (rawData && typeof rawData === "object" && rawData.message) ||
      (typeof rawData === "string" && rawData) ||
      err.message ||
      "Алдаа гарлаа";
    return Promise.reject(new Error(message));
  },
);

export default api;
