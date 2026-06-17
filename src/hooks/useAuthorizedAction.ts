/**
 * useAuthorizedAction — wraps an event handler with a permission check.
 *
 * The returned function calls the original handler only when the user holds
 * the required permission(s). Silently no-ops otherwise, because the UI
 * should already be disabled/hidden via <Can> or hasPermission checks.
 *
 * Usage:
 *   const handleEdit = useAuthorizedAction('document:edit', () => startEditing());
 *   <button onClick={handleEdit}>Edit</button>
 *
 *   // Multiple permissions (all required):
 *   const handleAdvanced = useAuthorizedAction(
 *     ['document:split', 'document:merge'],
 *     () => openAdvancedTools(),
 *   );
 */

import { useCallback } from 'react';
import { useAuth }     from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';

export function useAuthorizedAction(
  permission: Permission | Permission[],
  handler:    () => void,
): () => void {
  const { permissionSet } = useAuth();

  return useCallback(() => {
    const perms   = Array.isArray(permission) ? permission : [permission];
    const allowed = perms.every(p => permissionSet.has(p));
    if (allowed) handler();
  // permission is typically a constant; permissionSet changes only on login/logout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionSet, handler]);
}
