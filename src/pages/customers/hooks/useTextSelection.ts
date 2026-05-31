/**
 * useTextSelection
 *
 * Exposes a `handleMouseUp` callback to attach directly to the content
 * element via React's `onMouseUp` prop. This is more reliable than a global
 * window listener inside a fixed panel because:
 *  - No requestAnimationFrame timing race
 *  - Event is scoped to the element naturally (no contains() check needed)
 *  - Works correctly in portals and fixed-position overlays
 *
 * Usage:
 *   const { selection, handleMouseUp, clearSelection } = useTextSelection(enabled);
 *   <div onMouseUp={handleMouseUp}>...</div>
 */

import { useState, useEffect, useCallback } from 'react';

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

interface UseTextSelectionReturn {
  selection:      SelectionInfo | null;
  handleMouseUp:  () => void;
  clearSelection: () => void;
}

export function useTextSelection(enabled: boolean): UseTextSelectionReturn {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') clearSelection(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  // Clear when disabled (e.g. edit mode activated)
  useEffect(() => {
    if (!enabled) clearSelection();
  }, [enabled, clearSelection]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelection(null); return; }

    const text = sel.toString().trim();
    if (!text) { setSelection(null); return; }

    setSelection({ text, rect: sel.getRangeAt(0).getBoundingClientRect() });
  }, [enabled]);

  return { selection, handleMouseUp, clearSelection };
}
