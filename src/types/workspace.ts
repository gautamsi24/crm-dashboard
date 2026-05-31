// ── RBAC ─────────────────────────────────────────────────────────────────────
export type Permission = 'view' | 'edit' | 'split' | 'merge' | 'delete' | 'comment' | 'annotate';
export type Role       = 'viewer' | 'commenter' | 'editor' | 'admin';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer:    ['view'],
  commenter: ['view', 'comment', 'annotate'],
  editor:    ['view', 'comment', 'annotate', 'edit', 'split', 'merge'],
  admin:     ['view', 'comment', 'annotate', 'edit', 'split', 'merge', 'delete'],
};

export const MINIMUM_ROLE: Record<Permission, Role> = {
  view:     'viewer',
  comment:  'commenter',
  annotate: 'commenter',
  edit:     'editor',
  split:    'editor',
  merge:    'editor',
  delete:   'admin',
};

// ── Users ─────────────────────────────────────────────────────────────────────
export interface WorkspaceUser {
  id:       string;
  name:     string;
  role:     Role;
  initials: string;
  color:    string; // Tailwind bg-* class
}

/** Swap `role` here to test different permission levels */
export const CURRENT_USER: WorkspaceUser = {
  id:       'user-001',
  name:     'Gautam',
  role:     'editor',
  initials: 'G',
  color:    'bg-amber-400',
};

export const MOCK_PRESENCE_USERS: WorkspaceUser[] = [
  { id: 'user-002', name: 'Jane Cooper', role: 'viewer',    initials: 'JC', color: 'bg-pink-400'  },
  { id: 'user-003', name: 'Floyd Miles', role: 'commenter', initials: 'FM', color: 'bg-blue-400'  },
];

// ── Document loading ──────────────────────────────────────────────────────────
export type LoadPhase = 'idle' | 'metadata' | 'chunking' | 'ready' | 'error';

export interface LoadProgress {
  phase:       LoadPhase;
  bytesLoaded: number;
  bytesTotal:  number;
  pagesReady:  number;
  totalPages:  number;
  message:     string;
}

// ── Resume ────────────────────────────────────────────────────────────────────
export interface ResumePoint {
  documentId: string;
  userId:     string;
  page:       number;
  savedAt:    number; // epoch ms
}

// ── Comments ──────────────────────────────────────────────────────────────────
export interface DocumentComment {
  id:         string;
  pageNumber: number;
  author:     WorkspaceUser;
  content:    string;
  createdAt:  string; // ISO
  resolved:   boolean;
}

// ── Network ───────────────────────────────────────────────────────────────────
export type NetworkStatus = 'online' | 'offline' | 'reconnecting';
