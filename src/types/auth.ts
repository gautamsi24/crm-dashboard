/**
 * Roles represent plan tiers (user → proUser → superUser → admin).
 * Permissions are derived from roles via ROLE_PERMISSIONS — the frontend
 * never stores raw roles in business logic; it only checks permissions.
 *
 * Role ladder (assumption based on plan):
 *   user       Free       — read-only
 *   proUser    Pro        — create/edit/comment
 *   superUser  Business   — +split/merge/delete documents
 *   admin      Enterprise — full access including customer delete
 */

export type Role = 'user' | 'proUser' | 'superUser' | 'admin';

export type Permission =
  | 'document:view'
  | 'document:edit'
  | 'document:split'
  | 'document:merge'
  | 'document:delete'
  | 'document:comment'
  | 'document:annotate'
  | 'customer:view'
  | 'customer:create'
  | 'customer:edit'
  | 'customer:delete';

/** Single source of truth: role → flat permission list */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    'document:view',
    'customer:view',
  ],
  proUser: [
    'document:view', 'document:edit', 'document:comment', 'document:annotate',
    'customer:view', 'customer:create', 'customer:edit',
  ],
  superUser: [
    'document:view', 'document:edit', 'document:comment', 'document:annotate',
    'document:split', 'document:merge', 'document:delete',
    'customer:view', 'customer:create', 'customer:edit',
  ],
  admin: [
    'document:view', 'document:edit', 'document:comment', 'document:annotate',
    'document:split', 'document:merge', 'document:delete',
    'customer:view', 'customer:create', 'customer:edit', 'customer:delete',
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  user:      'Viewer',
  proUser:   'Creator',
  superUser: 'Manager',
  admin:     'Administrator',
};

export const ROLE_PLAN: Record<Role, string> = {
  user:      'Free',
  proUser:   'Pro',
  superUser: 'Business',
  admin:     'Enterprise',
};
