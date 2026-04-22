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
    const message = err.response?.data?.message || err.message || "Алдаа гарлаа";
    return Promise.reject(new Error(message));
  },
);

export default api;
