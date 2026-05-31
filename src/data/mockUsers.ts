/**
 * Mock user database. In production these come from an identity provider
 * (Auth0, Cognito, etc.) and the role is embedded in a signed JWT.
 *
 * Each user's role determines their permission set via ROLE_PERMISSIONS.
 */

import type { Role } from '@/types/auth';

export interface MockUser {
  id:       string;
  name:     string;
  email:    string;
  role:     Role;
  plan:     string;
  jobTitle: string;
  initials: string;
  color:    string; // Tailwind bg-* class
}

export const MOCK_USERS: MockUser[] = [
  // role: 'user' (Free) — document:view, customer:view only
  {
    id:       'u1',
    name:     'Alice Reader',
    email:    'alice@crm.demo',
    role:     'user',
    plan:     'Free',
    jobTitle: 'Sales Associate',
    initials: 'AR',
    color:    'bg-slate-400',
  },

  // role: 'proUser' (Pro) — +document:edit/comment/annotate, customer:create/edit
  {
    id:       'u2',
    name:     'Bob Creator',
    email:    'bob@crm.demo',
    role:     'proUser',
    plan:     'Pro',
    jobTitle: 'Account Manager',
    initials: 'BC',
    color:    'bg-blue-500',
  },

  // role: 'superUser' (Business) — +document:split/merge/delete
  {
    id:       'u3',
    name:     'Carol Manager',
    email:    'carol@crm.demo',
    role:     'superUser',
    plan:     'Business',
    jobTitle: 'Operations Lead',
    initials: 'CM',
    color:    'bg-violet-500',
  },

  // role: 'admin' (Enterprise) — full access including customer:delete
  {
    id:       'u4',
    name:     'Dave Admin',
    email:    'dave@crm.demo',
    role:     'admin',
    plan:     'Enterprise',
    jobTitle: 'System Administrator',
    initials: 'DA',
    color:    'bg-amber-500',
  },
];

export function getUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find(u => u.id === id);
}
