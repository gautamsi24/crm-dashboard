import { useState, useEffect, memo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { SelectionInfo } from '@/pages/customers/hooks/useTextSelection';

interface FloatingCommentBubbleProps {
  selection:        SelectionInfo | null;
  onCommentPosted:  (text: string, selectedText: string) => Promise<void>;
  onClearSelection: () => void;
}

const FloatingCommentBubble = memo(function FloatingCommentBubble({
  selection, onCommentPosted, onClearSelection,
}: FloatingCommentBubbleProps) {
  const [showForm,  setShowForm]  = useState(false);
  const [draft,     setDraft]     = useState('');
  const [isSending, setSending]   = useState(false);

  // Reset form state whenever the selection disappears
  useEffect(() => {
    if (!selection) {
      setShowForm(false);
      setDraft('');
    }
  }, [selection]);

  if (!selection) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top:  Math.min(selection.rect.bottom + 10, window.innerHeight - 240),
    left: Math.max(16, Math.min(
      selection.rect.left + selection.rect.width / 2 - 160,
      window.innerWidth - 336,
    )),
    zIndex: 200,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await onCommentPosted(text, selection.text);
      setDraft('');
      setShowForm(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-cy="floating-comment-bubble" style={style} className="w-80 overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
      {!showForm ? (
        <button
          data-cy="bubble-add-comment"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setShowForm(true)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          <MessageSquare className="size-4 text-violet-400" />
          Add comment
          <span className="ml-auto max-w-[100px] truncate text-xs text-gray-500">
            "{selection.text}"
          </span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <p className="truncate rounded bg-gray-800 px-2 py-1 text-[10px] italic text-gray-400">
            "{selection.text.slice(0, 80)}{selection.text.length > 80 ? '…' : ''}"
          </p>
          <textarea
            data-cy="bubble-comment-input"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add your comment…"
            rows={3}
            className="w-full resize-none rounded-lg bg-gray-800 px-3 py-2 text-xs text-white outline-none placeholder:text-gray-500 focus:ring-1 focus:ring-violet-500"
          />
          <div className="flex gap-2">
            <button
              data-cy="bubble-submit"
              type="submit"
              disabled={!draft.trim() || isSending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Send className="size-3" />
              {isSending ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setShowForm(false); onClearSelection(); }}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

export default FloatingCommentBubble;
