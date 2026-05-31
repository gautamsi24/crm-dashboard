// ── Workspace users (display only — permissions live in AuthContext) ──────────
export interface WorkspaceUser {
  id:       string;
  name:     string;
  initials: string;
  color:    string; // Tailwind bg-* class
}

/** A user whose current document position is being tracked (real-time presence) */
export interface PresenceUser extends WorkspaceUser {
  currentPage: number;
  lastActive:  number; // epoch ms — used to show stale/active state
}

/** Authenticated user shown in the workspace header */
export const CURRENT_USER: WorkspaceUser = {
  id:       'user-001',
  name:     'Gautam',
  initials: 'G',
  color:    'bg-amber-400',
};

/**
 * Seed data for concurrent users.
 * In production this comes from a WebSocket presence channel (e.g. Ably,
 * Pusher, or a custom SSE stream) and updates whenever a user changes page.
 */
export const MOCK_PRESENCE_SEED: PresenceUser[] = [
  { id: 'user-002', name: 'Jane Cooper', initials: 'JC', color: 'bg-pink-400', currentPage: 3, lastActive: Date.now() },
  { id: 'user-003', name: 'Floyd Miles', initials: 'FM', color: 'bg-blue-400', currentPage: 1, lastActive: Date.now() },
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
  id:            string;
  pageNumber:    number;
  author:        WorkspaceUser;
  content:       string;
  selectedText?: string; // highlighted text that triggered this comment
  createdAt:     string; // ISO
  resolved:      boolean;
}

// ── Network ───────────────────────────────────────────────────────────────────
export type NetworkStatus = 'online' | 'offline' | 'reconnecting';
