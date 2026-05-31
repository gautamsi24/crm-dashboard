/**
 * ProtectedRoute
 *
 * Two layers of protection:
 *   1. Authentication — redirects to /login if no session exists.
 *   2. Authorization  — redirects to / with { unauthorized: true } state
 *                       if the user lacks the required permission.
 *
 * The unauthorized redirect triggers a banner in Layout so the user
 * understands why they landed on the home page.
 *
 * Usage:
 *   <ProtectedRoute>                          // auth only
 *   <ProtectedRoute requiredPermission="customer:view">  // auth + permission
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';

interface ProtectedRouteProps {
  children:            React.ReactNode;
  requiredPermission?: Permission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  // Wait for sessionStorage restore before making auth decisions
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save where the user was trying to go so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" state={{ unauthorized: true }} replace />;
  }

  return <>{children}</>;
}
