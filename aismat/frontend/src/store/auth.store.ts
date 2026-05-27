import { createContext, useContext } from 'react';

import type { User } from '../types';

const TOKEN_KEY = 'aismat_token';
const USER_KEY = 'aismat_user';

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface AuthContextValue extends AuthState {
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext має використовуватися всередині AuthProvider');
  return ctx;
}

export function readStoredAuth(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw) return { token: null, user: null };
    return { token, user: JSON.parse(userRaw) as User };
  } catch {
    return { token: null, user: null };
  }
}

export function persistAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
