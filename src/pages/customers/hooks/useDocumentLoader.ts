/**
 * useDocumentLoader
 *
 * Simulates chunked/progressive loading for large documents (150 MB – 1 GB).
 *
 * Production strategy (Phase 2):
 *  1. fetchDocumentMetadata  → instant metadata (filename, page count, size).
 *  2. HTTP Range requests    → stream binary in 2–4 MB chunks via fetch().
 *  3. Web Worker             → decode/render each chunk off the main thread.
 *  4. Service Worker cache   → resume interrupted downloads without re-fetching.
 *
 * This mock reproduces the same UX: metadata first, pages become available
 * progressively, and the user can start reading before the full doc is ready.
 *
 * Edge cases handled:
 *  - Network drop during load → auto-retry up to MAX_RETRIES with back-off.
 *  - Tab hidden during load   → load continues; no cancel on visibilitychange.
 *  - New document selected    → previous load is cancelled immediately.
 *  - Manual retry             → increment `attempt` to re-trigger the effect.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchDocumentMetadata, fetchDocument } from '@/lib/mockApi';
import type { MockDocumentResult } from '@/lib/mockApi';
import type { LoadPhase } from '@/types/document';

const MAX_RETRIES   = 3;
const REVEAL_CHUNKS = 5;   // pages revealed in N progressive batches
const CHUNK_DELAY   = 350; // ms between batches

interface LoaderState {
  phase:       LoadPhase;
  doc:         MockDocumentResult | null;
  pagesReady:  number;
  totalPages:  number;
  bytesLoaded: number;
  bytesTotal:  number;
  message:     string;
  error:       string | null;
  currentPage: number;
}

const IDLE: LoaderState = {
  phase: 'idle', doc: null, pagesReady: 0, totalPages: 0,
  bytesLoaded: 0, bytesTotal: 0, message: '', error: null, currentPage: 1,
};

export interface UseDocumentLoaderReturn extends LoaderState {
  setCurrentPage: (page: number) => void;
  retry:          () => void;
}

export function useDocumentLoader(documentId: string | null): UseDocumentLoaderReturn {
  const [state, setState]     = useState<LoaderState>(IDLE);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  const setCurrentPage = useCallback(
    (page: number) => setState(s => ({ ...s, currentPage: page })),
    [],
  );

  useEffect(() => {
    if (!documentId) { setState(IDLE); return; }

    let cancelled = false;
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    setState({
      ...IDLE, phase: 'metadata',
      message: 'Fetching document metadata…',
    });

    const run = async (retryCount = 0): Promise<void> => {
      try {
        // ── Phase 1: fast metadata ────────────────────────────────────────────
        const meta = await fetchDocumentMetadata(documentId);
        if (cancelled) return;

        setState(s => ({
          ...s,
          phase:      'chunking',
          bytesTotal: meta.sizeBytes,
          totalPages: meta.pages,
          message:    'Downloading document…',
        }));

        // Simulate progress bar movement while the full payload loads
        let sim = 0;
        progressTimer = setInterval(() => {
          sim = Math.min(sim + Math.random() * 7 + 3, 85);
          setState(s => ({ ...s, bytesLoaded: Math.round(meta.sizeBytes * sim / 100) }));
        }, 200);

        // ── Phase 2: fetch full doc content (single call in mock) ─────────────
        const fullDoc = await fetchDocument(documentId);
        if (cancelled) return;

        clearInterval(progressTimer);
        progressTimer = null;

        // ── Phase 3: reveal pages progressively ───────────────────────────────
        const chunkSize    = Math.ceil(fullDoc.pages.length / REVEAL_CHUNKS);
        const bytesPerStep = Math.floor(meta.sizeBytes / REVEAL_CHUNKS);

        for (let step = 0; step < REVEAL_CHUNKS; step++) {
          await new Promise<void>(r => setTimeout(r, CHUNK_DELAY));
          if (cancelled) return;

          const ready = Math.min((step + 1) * chunkSize, fullDoc.pages.length);

          setState(s => ({
            ...s,
            bytesLoaded: Math.min((step + 1) * bytesPerStep, meta.sizeBytes),
            pagesReady:  ready,
            message:     `${ready} of ${fullDoc.pages.length} pages ready`,
            doc: { ...fullDoc, pages: fullDoc.pages.slice(0, ready) },
          }));
        }

        // ── Phase 4: fully ready ──────────────────────────────────────────────
        if (!cancelled) {
          setState(s => ({
            ...s,
            phase:       'ready',
            bytesLoaded: meta.sizeBytes,
            pagesReady:  fullDoc.pages.length,
            message:     'Document ready',
            doc:         fullDoc,
          }));
        }
      } catch (e) {
        if (cancelled) return;
        clearInterval(progressTimer!);

        if (!navigator.onLine && retryCount < MAX_RETRIES) {
          const wait = (retryCount + 1) * 2000;
          setState(s => ({
            ...s,
            message: `Network error — retrying in ${wait / 1000}s… (${retryCount + 1}/${MAX_RETRIES})`,
          }));
          await new Promise<void>(r => setTimeout(r, wait));
          if (!cancelled) return run(retryCount + 1);
        }

        setState(s => ({
          ...s,
          phase:   'error',
          error:   (e as Error).message || 'Failed to load document.',
          message: (e as Error).message || 'Failed to load document.',
        }));
      }
    };

    run();

    return () => {
      cancelled = true;
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [documentId, attempt]);

  return { ...state, setCurrentPage, retry };
}
