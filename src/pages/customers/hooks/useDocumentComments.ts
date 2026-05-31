import { useState, useEffect, useCallback } from 'react';
import { fetchDocumentComments, addDocumentComment } from '@/lib/mockApi';
import type { DocumentComment, WorkspaceUser } from '@/types/document';

interface UseDocumentCommentsReturn {
  comments:   DocumentComment[];
  isLoading:  boolean;
  error:      string | null;
  addComment: (pageNumber: number, content: string, author: WorkspaceUser, selectedText?: string) => Promise<void>;
}

export function useDocumentComments(documentId: string | null): UseDocumentCommentsReturn {
  const [comments,  setComments]  = useState<DocumentComment[]>([]);
  const [isLoading, setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) { setComments([]); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDocumentComments(documentId)
      .then(data => { if (!cancelled) { setComments(data); setLoading(false); } })
      .catch((e: Error) => {
        if (!cancelled) { setError(e.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [documentId]);

  const addComment = useCallback(async (
    pageNumber:    number,
    content:       string,
    author:        WorkspaceUser,
    selectedText?: string,
  ) => {
    if (!documentId) return;
    const newComment = await addDocumentComment(documentId, pageNumber, content, author, selectedText);
    setComments(prev => [...prev, newComment]);
  }, [documentId]);

  return { comments, isLoading, error, addComment };
}
