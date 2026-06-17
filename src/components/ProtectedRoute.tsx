/**
 * ProtectedRoute
 *
 * Two layers of protection:
 *   1. Authentication — redirects to /login if no session exists.
 *   2. Authorization  — renders an inline 403 view if the user lacks access,
 *                       rather than redirecting with a location.state flag.
 *                       The 403 view renders inside the Layout shell so the
 *                       user can still navigate to pages they can access.
 *
 * Props:
 *   requiredPermission  — single Permission or array (all must be held)
 *   check               — custom predicate over the full permission Set;
 *                         useful for OR logic or complex policy expressions
 *
 * Usage:
 *   <ProtectedRoute>                                    // auth only
 *   <ProtectedRoute requiredPermission="customer:view"> // single permission
 *   <ProtectedRoute requiredPermission={['document:edit', 'document:comment']}>
 *   <ProtectedRoute check={p => p.has('admin:all') || p.has('customer:view')}>
 */

import { Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';

interface ProtectedRouteProps {
  children:            React.ReactNode;
  requiredPermission?: Permission | Permission[];
  check?:              (permSet: ReadonlySet<Permission>) => boolean;
}

export function ProtectedRoute({ children, requiredPermission, check }: ProtectedRouteProps) {
  const { isAuthenticated, permissionSet, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const authorized = (() => {
    if (check) return check(permissionSet);
    if (!requiredPermission) return true;
    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    return required.every(p => permissionSet.has(p));
  })();

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <ShieldOff className="size-12 text-gray-200" />
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-gray-700">Access denied</h2>
          <p className="text-sm text-gray-400">
            You don't have permission to view this page.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
