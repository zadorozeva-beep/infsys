import { useCallback } from 'react';

import { clearStoredAuth, persistAuth, useAuthContext } from '../store/auth.store';
import type { User } from '../types';

export function useAuth() {
  const ctx = useAuthContext();

  const signIn = useCallback(
    (token: string, user: User) => {
      persistAuth(token, user);
      ctx.setAuth(token, user);
    },
    [ctx],
  );

  const signOut = useCallback(() => {
    clearStoredAuth();
    ctx.clearAuth();
  }, [ctx]);

  const updateUser = useCallback(
    (user: User) => {
      if (!ctx.token) return;
      persistAuth(ctx.token, user);
      ctx.setAuth(ctx.token, user);
    },
    [ctx],
  );

  return {
    token: ctx.token,
    user: ctx.user,
    isAuthenticated: !!ctx.token && !!ctx.user,
    signIn,
    signOut,
    updateUser,
  };
}
