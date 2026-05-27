import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: Props): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role as Role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
