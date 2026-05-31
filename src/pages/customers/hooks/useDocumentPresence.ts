/**
 * useDocumentPresence
 *
 * Tracks which page each concurrent user is currently viewing.
 * Exposes helpers so the workspace can highlight pages / show "X is here" banners.
 *
 * Production replacement:
 *   Subscribe to a WebSocket / SSE presence channel (Ably, Pusher, etc.).
 *   On every page-change event from the server, call updatePresence(userId, page).
 *   On disconnect, remove the user from the local presence list.
 *
 * This mock simulates that activity: every MOVE_INTERVAL ms, one random user
 * "jumps" to a nearby page to show the UI working realistically.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MOCK_PRESENCE_SEED, type PresenceUser } from '@/types/document';

const MOVE_INTERVAL = 8_000; // ms between simulated page-changes
const STALE_AFTER   = 60_000; // ms — user considered idle after this

export interface UseDocumentPresenceReturn {
  /** All concurrent users and their current page */
  presence: PresenceUser[];
  /** Users currently on the given page number */
  usersOnPage: (page: number) => PresenceUser[];
  /** Active (non-stale) user count */
  activeCount: number;
}

export function useDocumentPresence(
  documentId: string | null,
  totalPages:  number,
): UseDocumentPresenceReturn {
  const [presence, setPresence] = useState<PresenceUser[]>([]);

  // Reset presence when document changes
  useEffect(() => {
    if (!documentId || totalPages === 0) { setPresence([]); return; }
    // Clone seed so mutations don't affect the constant
    setPresence(MOCK_PRESENCE_SEED.map(u => ({ ...u })));
  }, [documentId, totalPages]);

  // Simulate users moving between pages
  useEffect(() => {
    if (!documentId || totalPages === 0) return;

    const timer = setInterval(() => {
      setPresence(prev => {
        if (prev.length === 0) return prev;

        // Pick a random user and move them ±1–3 pages
        const idx  = Math.floor(Math.random() * prev.length);
        const user = prev[idx];
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next  = Math.max(1, Math.min(totalPages, user.currentPage + delta));

        if (next === user.currentPage) return prev; // no change, no re-render

        const updated = [...prev];
        updated[idx]  = { ...user, currentPage: next, lastActive: Date.now() };
        return updated;
      });
    }, MOVE_INTERVAL);

    return () => clearInterval(timer);
  }, [documentId, totalPages]);

  const usersOnPage = useCallback(
    (page: number) => presence.filter(u => u.currentPage === page),
    [presence],
  );

  const activeCount = useMemo(
    () => presence.filter(u => Date.now() - u.lastActive < STALE_AFTER).length,
    [presence],
  );

  return { presence, usersOnPage, activeCount };
}
