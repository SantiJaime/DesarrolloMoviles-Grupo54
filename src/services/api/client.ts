import { AxiosError, create } from "axios";

import { getStoredToken } from "@/src/lib/secure-session";
import type { ApiError } from "@/src/types";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = create({
  baseURL: API_URL,
  timeout: 60_000,
  headers: { Accept: "application/json" },
});


api.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    const token = await getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ApiError>>) => {
    const cuerpo = error.response?.data?.error;
    if (cuerpo) {
      error.message = cuerpo.mensaje;
    } else if (!error.response) {
      error.message = "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.";
    } else {
      error.message = "Ocurrió un error inesperado. Intentá de nuevo.";
    }
    return Promise.reject(error);
  },
);
