/**
 * useDocumentEdit
 *
 * Gmail-style auto-save: changes are persisted automatically after a short
 * idle window — no explicit Save button required.
 *
 * Production: replace the setTimeout in updatePageContent with a debounced
 * PATCH /api/documents/{id}/pages call.
 */

import { useState, useCallback, useRef } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface UseDocumentEditReturn {
  isEditing:         boolean;
  saveStatus:        SaveStatus;
  getPageContent:    (page: number, original: string) => string;
  updatePageContent: (page: number, content: string) => void;
  startEditing:      () => void;
  stopEditing:       () => void;
}

const AUTO_SAVE_DELAY = 1_500; // ms of inactivity before "saving"

export function useDocumentEdit(): UseDocumentEditReturn {
  const [isEditing,  setIsEditing]  = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [edits,      setEdits]      = useState<Record<number, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setSaveStatus('idle');
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setSaveStatus('idle');
    clearTimeout(timerRef.current);
  }, []);

  const updatePageContent = useCallback((page: number, content: string) => {
    setEdits(prev => ({ ...prev, [page]: content }));
    setSaveStatus('saving');

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Production: await patchDocumentPages(documentId, { [page]: content })
      setSaveStatus('saved');
    }, AUTO_SAVE_DELAY);
  }, []);

  const getPageContent = useCallback(
    (page: number, original: string) => edits[page] ?? original,
    [edits],
  );

  return { isEditing, saveStatus, getPageContent, updatePageContent, startEditing, stopEditing };
}
