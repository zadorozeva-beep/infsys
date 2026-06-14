import axios, { type AxiosError, type AxiosInstance } from 'axios';

import { API_BASE_URL } from '../config';
import { clearStoredAuth, getStoredToken } from '../store/auth.store';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorPayload {
  error: { code: string; message: string; details?: unknown };
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Невідома помилка';
}
