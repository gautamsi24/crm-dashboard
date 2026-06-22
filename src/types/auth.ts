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
 *
 * Role hierarchy: each role inherits all permissions from the role below it.
 * Only permissions introduced at each tier are listed in ROLE_OWN_PERMISSIONS —
 * the full permission set is derived by walking the chain.
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
  | 'document:ai'
  | 'customer:view'
  | 'customer:create'
  | 'customer:edit'
  | 'customer:delete';

// Single-parent inheritance chain: null means no parent.
const ROLE_PARENT: Record<Role, Role | null> = {
  user:      null,
  proUser:   'user',
  superUser: 'proUser',
  admin:     'superUser',
};

// Permissions introduced at each tier — not re-listed from parents.
const ROLE_OWN_PERMISSIONS: Record<Role, Permission[]> = {
  user:      ['document:view', 'customer:view'],
  proUser:   ['document:edit', 'document:comment', 'document:annotate', 'document:ai', 'customer:create', 'customer:edit'],
  superUser: ['document:split', 'document:merge', 'document:delete'],
  admin:     ['customer:delete'],
};

function resolvePermissions(role: Role): Permission[] {
  const parent = ROLE_PARENT[role];
  const inherited = parent ? resolvePermissions(parent) : [];
  return [...inherited, ...ROLE_OWN_PERMISSIONS[role]];
}

/** Single source of truth: role → full permission list (includes inherited). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user:      resolvePermissions('user'),
  proUser:   resolvePermissions('proUser'),
  superUser: resolvePermissions('superUser'),
  admin:     resolvePermissions('admin'),
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

/**
 * User-facing messages shown when a permission is denied.
 * Uses business/plan language instead of exposing internal permission strings.
 */
export const PERMISSION_DENIED_MESSAGE: Record<Permission, string> = {
  'document:view':     'Document viewing is not available on your current plan',
  'document:edit':     'Upgrade to Pro plan to edit documents',
  'document:comment':  'Upgrade to Pro plan to comment on documents',
  'document:annotate': 'Upgrade to Pro plan to annotate documents',
  'document:split':    'Upgrade to Business plan to split documents',
  'document:merge':    'Upgrade to Business plan to merge documents',
  'document:delete':   'Upgrade to Business plan to delete documents',
  'document:ai':       'Upgrade to Pro plan to use AI document features',
  'customer:view':     'Customer access is not available on your current plan',
  'customer:create':   'Upgrade to Pro plan to create customers',
  'customer:edit':     'Upgrade to Pro plan to edit customers',
  'customer:delete':   'Upgrade to Enterprise plan to delete customers',
};
