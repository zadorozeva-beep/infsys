import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { MaterialsListPage } from './pages/MaterialsListPage';
import { PlanPage } from './pages/PlanPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { UploadMaterialPage } from './pages/UploadMaterialPage';
import {
  AuthContext,
  type AuthContextValue,
  readStoredAuth,
} from './store/auth.store';
import { SocketProvider } from './store/socket.store';
import { ThemeContext, useThemeState } from './store/theme.store';
import { ToastProvider } from './store/toast.store';
import type { User } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App(): JSX.Element {
  const initial = readStoredAuth();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<User | null>(initial.user);
  const themeValue = useThemeState();

  const authValue = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      setAuth: (t, u) => {
        setToken(t);
        setUser(u);
      },
      clearAuth: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return (
    <ErrorBoundary>
    <ThemeContext.Provider value={themeValue}>
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
        <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              <Route path="/" element={<MaterialsListPage />} />
              <Route path="/materials/:id" element={<MaterialDetailPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plan"
                element={
                  <ProtectedRoute>
                    <PlanPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute roles={['teacher', 'admin']}>
                    <UploadMaterialPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </SocketProvider>
        </ToastProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
    </ThemeContext.Provider>
    </ErrorBoundary>
  );
}
