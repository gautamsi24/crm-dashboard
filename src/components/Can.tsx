/**
 * <Can> — declarative permission gate for rendering.
 *
 * Reads the current user's permissionSet from AuthContext and
 * renders children only when the check passes. Renders fallback
 * (default null) otherwise.
 *
 * Props:
 *   permission  — single Permission or array
 *   any         — if true, any one permission suffices (OR logic);
 *                 default false requires all permissions (AND logic)
 *   fallback    — what to render when denied; defaults to null
 *
 * Examples:
 *   <Can permission="document:edit">
 *     <EditButton />
 *   </Can>
 *
 *   <Can permission={['document:split', 'document:merge']} any>
 *     <AdvancedTools />
 *   </Can>
 *
 *   <Can permission="customer:delete" fallback={<UpgradeBanner />}>
 *     <DeleteButton />
 *   </Can>
 */

import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';

interface CanProps {
  permission: Permission | Permission[];
  any?:       boolean;
  children:   React.ReactNode;
  fallback?:  React.ReactNode;
}

export function Can({ permission, any: anyMode = false, children, fallback = null }: CanProps) {
  const { permissionSet } = useAuth();
  const perms   = Array.isArray(permission) ? permission : [permission];
  const allowed = anyMode
    ? perms.some(p => permissionSet.has(p))
    : perms.every(p => permissionSet.has(p));

  return <>{allowed ? children : fallback}</>;
}
