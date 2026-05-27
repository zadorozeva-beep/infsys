import { api } from './axios';
import type { ApiSuccess, AuthResponse, User } from '../types';

export interface LoginPayload {
  login: string;
  password: string;
}

export interface RegisterPayload {
  login: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  return data.data;
}

export async function meRequest(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/auth/me');
  return data.data;
}
