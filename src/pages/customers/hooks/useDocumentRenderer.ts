/**
 * useDocumentRenderer
 *
 * Manages the documentRenderer.worker lifecycle and the bitmap cache
 * so the rest of the app never touches the Worker API directly.
 *
 * Lifecycle
 *   - Worker is created once on mount and terminated on unmount.
 *   - Bitmap cache is cleared (and GPU memory freed) whenever documentId
 *     changes, so stale bitmaps from a previous document never leak.
 *
 * isSupported
 *   False on browsers/environments that lack OffscreenCanvas or Worker
 *   (e.g. older Safari, jsdom in tests). Callers should fall back to the
 *   plain-text <pre> renderer when this is false.
 *
 * renderPage(pageNum, content, fileName)
 *   Sends a RENDER_PAGE message to the worker.  The worker posts back a
 *   PAGE_READY response carrying a transferred ImageBitmap, which is stored
 *   in bitmapCache keyed by page number.
 *
 * Production Phase 2 upgrade:
 *   Pass an ArrayBuffer (HTTP Range response chunk) instead of text content,
 *   and have the worker decode it with PDF.js.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Render at 1.5× so text is sharp on high-DPI displays
const RENDER_SCALE = 1.5;

interface WorkerResponse {
  type:    'PAGE_READY' | 'ERROR';
  pageNum: number;
  bitmap?: ImageBitmap;
  error?:  string;
}

export interface UseDocumentRendererReturn {
  /** Cached ImageBitmap keyed by page number */
  bitmapCache: Map<number, ImageBitmap>;
  /** Send a render request to the worker */
  renderPage:  (pageNum: number, content: string, fileName: string) => void;
  /** False when OffscreenCanvas or Worker are not available in this environment */
  isSupported: boolean;
}

export function useDocumentRenderer(documentId: string | null): UseDocumentRendererReturn {
  const workerRef = useRef<Worker | null>(null);
  const [bitmapCache, setBitmapCache] = useState<Map<number, ImageBitmap>>(new Map());

  const isSupported =
    typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';

  // ── Worker lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupported) return;

    const worker = new Worker(
      new URL('../../../workers/documentRenderer.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, pageNum, bitmap } = e.data;
      if (type === 'PAGE_READY' && bitmap) {
        setBitmapCache(prev => new Map(prev).set(pageNum, bitmap));
      } else if (type === 'ERROR') {
        console.error(`[documentRenderer] page ${pageNum}:`, e.data.error);
      }
    };

    worker.onerror = (e) => {
      console.error('[documentRenderer.worker]', e.message);
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [isSupported]);

  // ── Cache invalidation ────────────────────────────────────────────────────
  // When the document changes, close every ImageBitmap to release GPU memory
  // before discarding the cache entries.
  useEffect(() => {
    setBitmapCache(prev => {
      prev.forEach(bmp => bmp.close());
      return new Map();
    });
  }, [documentId]);

  // ── Render request ────────────────────────────────────────────────────────
  const renderPage = useCallback((
    pageNum:  number,
    content:  string,
    fileName: string,
  ) => {
    workerRef.current?.postMessage({
      type: 'RENDER_PAGE',
      pageNum,
      content,
      fileName,
      scale: RENDER_SCALE,
    });
  }, []);

  return { bitmapCache, renderPage, isSupported };
}
