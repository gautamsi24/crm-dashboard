/**
 * useDocumentResume
 *
 * Persists the user's last-read page to localStorage so a session can be
 * resumed after a tab close, network drop, or accidental navigation.
 *
 * Edge cases handled:
 *  - beforeunload  → immediate synchronous write (debounce timer flushed).
 *  - visibilitychange → save when tab is backgrounded / phone screen locked.
 *  - Storage quota  → failure silently ignored; progress is best-effort.
 *  - Stale entry   → resume prompt only shown when savedPage > 1 and the
 *                    saved timestamp is within the last 30 days.
 *
 * Usage:
 *   const resume = useDocumentResume(documentId, userId);
 *   // call resume.savePosition(page) on every page change
 *   // resume.showPrompt → true if a saved position was found
 *   // resume.resumePage → page to jump to
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ResumePoint } from '@/types/document';

const STORAGE_KEY = (docId: string, userId: string) =>
  `doc:resume:${userId}:${docId}`;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DEBOUNCE_MS    = 1_500;

interface UseDocumentResumeReturn {
  showPrompt:      boolean;
  resumePage:      number | null;
  savePosition:    (page: number) => void;
  dismissPrompt:   () => void;
}

export function useDocumentResume(
  documentId: string | null,
  userId:     string,
): UseDocumentResumeReturn {
  const [showPrompt, setShowPrompt] = useState(false);
  const [resumePage, setResumePage] = useState<number | null>(null);

  const latestPageRef  = useRef(1);
  const debounceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load saved point when document changes ────────────────────────────────
  useEffect(() => {
    setShowPrompt(false);
    setResumePage(null);
    latestPageRef.current = 1;

    if (!documentId) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY(documentId, userId));
      if (!raw) return;

      const point: ResumePoint = JSON.parse(raw);
      const isRecent = Date.now() - point.savedAt < THIRTY_DAYS_MS;

      if (point.page > 1 && isRecent) {
        setResumePage(point.page);
        setShowPrompt(true);
      }
    } catch {
      // Malformed entry — ignore
    }
  }, [documentId, userId]);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persist = useCallback((page: number) => {
    if (!documentId || page <= 1) return;
    const point: ResumePoint = { documentId, userId, page, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY(documentId, userId), JSON.stringify(point));
    } catch {
      // Storage quota exceeded — silently skip
    }
  }, [documentId, userId]);

  /** Debounced save — called on every page navigation */
  const savePosition = useCallback((page: number) => {
    latestPageRef.current = page;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => persist(page), DEBOUNCE_MS);
  }, [persist]);

  /** Immediate flush — used by beforeunload / visibilitychange handlers */
  const flushSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    persist(latestPageRef.current);
  }, [persist]);

  // ── Save on tab hide / close ──────────────────────────────────────────────
  useEffect(() => {
    if (!documentId) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    const handleUnload = () => flushSave();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [documentId, flushSave]);

  const dismissPrompt = useCallback(() => setShowPrompt(false), []);

  return { showPrompt, resumePage, savePosition, dismissPrompt };
}
