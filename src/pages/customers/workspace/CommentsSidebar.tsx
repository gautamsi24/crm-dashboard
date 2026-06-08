/**
 * CommentsSidebar — right panel for page-level comments.
 * Shows quoted selected text (if any) above the comment body.
 * Only rendered when the user holds the 'document:comment' permission.
 */

import { useState, useMemo } from 'react';
import { MessageSquare, CheckCircle2, Send, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentComment, WorkspaceUser } from '@/types/document';

interface CommentsSidebarProps {
  comments:    DocumentComment[];
  isLoading:   boolean;
  currentPage: number;
  currentUser: WorkspaceUser;
  onAddComment:(pageNumber: number, content: string, author: WorkspaceUser, selectedText?: string) => Promise<void>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function CommentsSidebar({
  comments, isLoading, currentPage, currentUser, onAddComment,
}: CommentsSidebarProps) {
  const [draft,      setDraft]      = useState('');
  const [isSending,  setSending]    = useState(false);
  const [filterPage, setFilterPage] = useState<'all' | 'current'>('current');

  const filtered = useMemo(
    () => filterPage === 'current'
      ? comments.filter(c => c.pageNumber === currentPage)
      : comments,
    [comments, currentPage, filterPage],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await onAddComment(currentPage, text, currentUser);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-gray-100 bg-white">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <MessageSquare className="size-3.5 text-gray-400" aria-hidden="true" />
          Comments
        </h2>
        <div className="flex rounded border border-gray-200 text-[10px]">
          {(['current', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterPage(f)}
              className={cn(
                'px-2 py-0.5 transition-colors',
                filterPage === f
                  ? 'bg-gray-100 font-semibold text-gray-800'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              {f === 'current' ? `Page ${currentPage}` : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <ul aria-label="Loading comments" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="space-y-1.5 rounded-xl border border-gray-100 p-3">
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">
            No comments on{' '}
            {filterPage === 'current' ? `page ${currentPage}` : 'this document'} yet.
          </p>
        ) : (
          <ul aria-label="Comments" className="space-y-3">
            {filtered.map(comment => (
              <li key={comment.id}>
                <CommentCard comment={comment} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-100 p-3 space-y-2">
        <p className="text-[10px] text-gray-400">
          Commenting on page <span className="font-semibold text-gray-600">{currentPage}</span>
        </p>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a comment…"
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-1 focus:ring-violet-200"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-3" />
          {isSending ? 'Sending…' : 'Post comment'}
        </button>
      </form>
    </aside>
  );
}

function CommentCard({ comment }: { comment: DocumentComment }) {
  return (
    <article
      className={cn(
        'rounded-xl border p-3 text-xs',
        comment.resolved
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white',
      )}
    >
      {/* Author row */}
      <header className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white',
            comment.author.color,
          )}
          aria-label={comment.author.name}
        >
          {comment.author.initials}
        </span>
        <span className="font-semibold text-gray-800">{comment.author.name}</span>
        <span className="ml-auto text-[10px] text-gray-400">p.{comment.pageNumber}</span>
      </header>

      {/* Quoted selection */}
      {comment.selectedText && (
        <blockquote className="mb-2 flex gap-1.5 rounded-lg bg-gray-50 p-2">
          <Quote className="mt-0.5 size-3 shrink-0 text-gray-300" aria-hidden="true" />
          <p className="italic leading-relaxed text-gray-400">
            {comment.selectedText.length > 100
              ? comment.selectedText.slice(0, 100) + '…'
              : comment.selectedText}
          </p>
        </blockquote>
      )}

      <p className="leading-relaxed text-gray-600">{comment.content}</p>

      <footer className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
        <time dateTime={comment.createdAt}>{formatTime(comment.createdAt)}</time>
        {comment.resolved && (
          <span className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="size-3" aria-hidden="true" /> Resolved
          </span>
        )}
      </footer>
    </article>
  );
}
