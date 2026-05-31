/**
 * DocumentWorkspace — orchestrates all document-feature hooks.
 *
 * Edit mode  : contentEditable <pre>, auto-saves after 1.5 s of inactivity.
 *              No Save button — mirrors Gmail's draft behavior.
 *
 * Comments   : select text → onMouseUp fires → floating bubble appears →
 *              "Add comment" expands to an inline form → posts to sidebar.
 *
 * Split      : dialog with page-number input; warns about presence users in
 *              the affected section; shows a dismissible notification after.
 */

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  X, FileText, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, Wifi, WifiOff, RefreshCw, Eye,
  MessageSquare, Scissors, Send, CheckCircle2, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth }               from '@/contexts/AuthContext';
import { useDocumentLoader }     from '@/pages/customers/hooks/useDocumentLoader';
import { useDocumentResume }     from '@/pages/customers/hooks/useDocumentResume';
import { useDocumentPresence }   from '@/pages/customers/hooks/useDocumentPresence';
import { useDocumentComments }   from '@/pages/customers/hooks/useDocumentComments';
import { useDocumentEdit }       from '@/pages/customers/hooks/useDocumentEdit';
import { useTextSelection }      from '@/pages/customers/hooks/useTextSelection';
import { CURRENT_USER }          from '@/types/document';
import DocumentToolbar           from '@/pages/customers/workspace/DocumentToolbar';
import PageNavigator             from '@/pages/customers/workspace/PageNavigator';
import CommentsSidebar           from '@/pages/customers/workspace/CommentsSidebar';
import type { Customer }         from '@/lib/mockApi';
import type { PresenceUser }     from '@/types/document';

function formatBytes(b: number) {
  return b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${(b / 1_000).toFixed(0)} KB`;
}

interface SplitNotification { splitAfterPage: number; affectedUsers: PresenceUser[] }

export default function DocumentWorkspace({
  customer, onClose,
}: { customer: Customer | null; onClose: () => void }) {
  const documentId = customer?.document.id ?? null;
  const isOpen     = customer !== null;

  // ── Feature hooks ─────────────────────────────────────────────────────────
  const { hasPermission } = useAuth();
  const loader       = useDocumentLoader(documentId);
  const resume       = useDocumentResume(documentId, CURRENT_USER.id);
  const docComments  = useDocumentComments(documentId);
  const documentEdit = useDocumentEdit();

  const totalPages = loader.doc?.totalPages ?? loader.totalPages;
  const presence   = useDocumentPresence(documentId, totalPages);

  // Text-selection — disabled while editing (onMouseUp attached to viewer div)
  const textSel = useTextSelection(!documentEdit.isEditing && hasPermission('document:comment'));

  // ── Refs ──────────────────────────────────────────────────────────────────
  const editableRef = useRef<HTMLPreElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null); // Phase 2: web-worker target

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showPageNav,       setShowPageNav]      = useState(true);
  const [showComments,      setShowComments]      = useState(false);
  const [networkOnline,     setNetworkOnline]     = useState(navigator.onLine);
  const [showSplitDialog,   setShowSplitDialog]   = useState(false);
  const [splitPageInput,    setSplitPageInput]    = useState(1);
  const [splitNotification, setSplitNotification] = useState<SplitNotification | null>(null);
  const [showCommentForm,   setShowCommentForm]   = useState(false);
  const [commentDraft,      setCommentDraft]      = useState('');
  const [isSendingComment,  setSendingComment]    = useState(false);

  // ── Network ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const up = () => setNetworkOnline(true), down = () => setNetworkOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // ── Reset on doc change ───────────────────────────────────────────────────
  useEffect(() => {
    documentEdit.stopEditing();
    setShowComments(false); setShowSplitDialog(false);
    setSplitNotification(null); setShowCommentForm(false); setCommentDraft('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // ── contentEditable sync ──────────────────────────────────────────────────
  // Sets textContent only when the page changes or edit mode is toggled.
  // Intentionally does NOT run when displayContent changes mid-edit so the
  // cursor position is never reset while the user is typing.
  useLayoutEffect(() => {
    if (!documentEdit.isEditing || !editableRef.current) return;
    const content = documentEdit.getPageContent(
      loader.currentPage,
      loader.doc?.pages[loader.currentPage - 1]?.content ?? '',
    );
    editableRef.current.textContent = content;
    editableRef.current.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader.currentPage, documentEdit.isEditing]);

  // Clear inline comment form when selection disappears
  useEffect(() => {
    if (!textSel.selection) { setShowCommentForm(false); setCommentDraft(''); }
  }, [textSel.selection]);

  // ── Page navigation ───────────────────────────────────────────────────────
  const handlePageChange = (page: number) => {
    loader.setCurrentPage(page); resume.savePosition(page);
  };

  // ── Toolbar actions ───────────────────────────────────────────────────────
  const handleAction = (key: string) => {
    if (key === 'edit')    { documentEdit.isEditing ? documentEdit.stopEditing() : documentEdit.startEditing(); return; }
    if (key === 'comment') { setShowComments(c => !c); return; }
    if (key === 'split')   { setSplitPageInput(Math.max(1, Math.min(loader.currentPage, totalPages - 1))); setShowSplitDialog(true); return; }
  };

  // ── Split confirm ─────────────────────────────────────────────────────────
  const handleSplitConfirm = () => {
    const affected = presence.presence.filter(u => u.currentPage > splitPageInput);
    setSplitNotification({ splitAfterPage: splitPageInput, affectedUsers: affected });
    setShowSplitDialog(false);
  };

  // ── Selection-based comment ───────────────────────────────────────────────
  const handleSelectionCommentSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const text = commentDraft.trim();
    if (!text || !textSel.selection) return;
    setSendingComment(true);
    try {
      await docComments.addComment(loader.currentPage, text, CURRENT_USER, textSel.selection.text);
      setCommentDraft(''); setShowCommentForm(false);
      textSel.clearSelection();
      setShowComments(true);
    } finally { setSendingComment(false); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isDocReady     = loader.phase === 'ready';
  const displayContent = documentEdit.getPageContent(
    loader.currentPage,
    loader.doc?.pages[loader.currentPage - 1]?.content ?? '',
  );
  const viewersHere    = presence.usersOnPage(loader.currentPage);
  const affectedPrev   = presence.presence.filter(u => u.currentPage > splitPageInput);

  const bubbleStyle = textSel.selection ? {
    position: 'fixed' as const,
    top:  Math.min(textSel.selection.rect.bottom + 10, window.innerHeight - 240),
    left: Math.max(16, Math.min(
      textSel.selection.rect.left + textSel.selection.rect.width / 2 - 160,
      window.innerWidth - 336,
    )),
    zIndex: 200,
  } : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/25 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-6xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>

        {/* ── Header ── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50">
            <FileText className="size-4 text-rose-500" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-gray-900">
              {customer?.document.fileName ?? '—'}
            </span>
            {customer && (
              <span className="text-xs text-gray-400">
                {formatBytes(customer.document.sizeBytes)} · {customer.document.pages} pages · {customer.name}
              </span>
            )}
          </div>

          {presence.activeCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              <Eye className="size-3" /> {presence.activeCount + 1} viewing
            </div>
          )}
          {presence.presence.map((u, i) => (
            <span key={u.id} title={`${u.name} — page ${u.currentPage}`}
              className={cn('flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white', u.color, i !== 0 && '-ml-1.5')}>
              {u.initials}
            </span>
          ))}

          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
            networkOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
            {networkOnline ? <><Wifi className="size-3" /> Online</> : <><WifiOff className="size-3" /> Offline</>}
          </span>

          <button onClick={onClose} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="size-4" />
          </button>
        </header>

        {/* ── Resume prompt ── */}
        {resume.showPrompt && resume.resumePage && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-2">
            <p className="text-xs text-amber-800">
              You were last on <span className="font-semibold">page {resume.resumePage}</span>. Continue?
            </p>
            <div className="flex gap-2">
              <button onClick={() => { handlePageChange(resume.resumePage!); resume.dismissPrompt(); }}
                className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600">
                Resume
              </button>
              <button onClick={resume.dismissPrompt}
                className="rounded-md px-3 py-1 text-xs text-amber-700 hover:bg-amber-100">
                Start from page 1
              </button>
            </div>
          </div>
        )}

        {/* ── Split notification ── */}
        {splitNotification && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-orange-100 bg-orange-50 px-5 py-2.5">
            <div className="flex items-start gap-2 text-xs text-orange-800">
              <Scissors className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
              <div>
                <p className="font-semibold">Document split after page {splitNotification.splitAfterPage}.</p>
                <p className="mt-0.5">
                  {splitNotification.affectedUsers.length > 0
                    ? `${splitNotification.affectedUsers.map(u => u.name).join(' and ')} were working on the affected section and have been notified.`
                    : 'No other users were on the affected pages.'}
                </p>
              </div>
            </div>
            <button onClick={() => setSplitNotification(null)}
              className="shrink-0 rounded px-2 py-0.5 text-[10px] text-orange-600 hover:bg-orange-100">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <DocumentToolbar
          isEditing={documentEdit.isEditing}
          showPageNav={showPageNav}
          showComments={showComments}
          isDocReady={isDocReady}
          onAction={handleAction}
          onTogglePageNav={() => setShowPageNav(v => !v)}
          onToggleComments={() => setShowComments(v => !v)}
        />

        {/* ── Edit mode status bar (auto-save indicator + Done) ── */}
        {documentEdit.isEditing && (
          <div className="flex shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-1.5">
            <span className="flex items-center gap-1.5 text-xs">
              {documentEdit.saveStatus === 'saving' && (
                <><Loader2 className="size-3 animate-spin text-amber-500" /><span className="text-amber-600">Saving…</span></>
              )}
              {documentEdit.saveStatus === 'saved' && (
                <><CheckCircle2 className="size-3 text-emerald-500" /><span className="text-emerald-600">Saved</span></>
              )}
              {documentEdit.saveStatus === 'idle' && (
                <span className="text-amber-500">Edit mode — changes save automatically</span>
              )}
            </span>
            <button
              onClick={documentEdit.stopEditing}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <LogOut className="size-3" /> Done editing
            </button>
          </div>
        )}

        {/* ── Loading progress ── */}
        {(loader.phase === 'metadata' || loader.phase === 'chunking') && (
          <div className="shrink-0 border-b border-gray-100 px-5 py-2.5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Loader2 className="size-3 animate-spin text-primary" /> {loader.message}
              </span>
              <span className="font-medium text-gray-600">
                {loader.bytesTotal > 0 ? `${Math.round(loader.bytesLoaded / loader.bytesTotal * 100)}%` : '…'}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: loader.bytesTotal > 0 ? `${loader.bytesLoaded / loader.bytesTotal * 100}%` : '0%' }} />
            </div>
            {loader.pagesReady > 0 && (
              <p className="mt-1 text-[10px] text-emerald-600">✓ {loader.pagesReady} pages ready — you can start reading</p>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {showPageNav && (
            <PageNavigator
              totalPages={totalPages} pagesReady={loader.pagesReady}
              currentPage={loader.currentPage} onPageSelect={handlePageChange}
              usersOnPage={presence.usersOnPage}
            />
          )}

          {/* Center: viewer */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-100 p-3">
            {loader.phase === 'error' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <AlertCircle className="size-8 text-rose-400" />
                <p className="text-sm font-medium text-gray-700">{loader.error}</p>
                <button onClick={loader.retry}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                  <RefreshCw className="size-3.5" /> Retry
                </button>
              </div>
            ) : loader.phase === 'idle' ? (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                Select a customer row to open their document.
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm">

                {/* Page header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400">
                  <span>
                    {loader.doc?.fileName} — Page{' '}
                    <span className="font-semibold text-gray-600">{loader.currentPage}</span>{' '}
                    of {totalPages || '…'}
                  </span>
                  {documentEdit.isEditing && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Editing</span>
                  )}
                </div>

                {/* Presence banner */}
                {viewersHere.length > 0 && (
                  <div className="flex shrink-0 items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-1.5 text-xs text-violet-700">
                    <div className="flex">
                      {viewersHere.map(v => (
                        <span key={v.id} className={cn('flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white', v.color)}>
                          {v.initials[0]}
                        </span>
                      ))}
                    </div>
                    {viewersHere.map(v => v.name).join(' & ')} {viewersHere.length === 1 ? 'is' : 'are'} also on this page
                  </div>
                )}

                {/* Content */}
                {loader.currentPage <= loader.pagesReady ? (
                  documentEdit.isEditing ? (
                    /* ── Edit mode: contentEditable pre (Gmail-style auto-save) ── */
                    <pre
                      ref={editableRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => {
                        documentEdit.updatePageContent(
                          loader.currentPage,
                          editableRef.current?.textContent ?? '',
                        );
                      }}
                      className="flex-1 overflow-y-auto bg-amber-50/40 p-6 font-mono text-xs leading-relaxed text-gray-800 outline-none whitespace-pre-wrap"
                      style={{ minHeight: 0 }}
                    />
                  ) : (
                    /* ── View mode: read-only pre; onMouseUp fires selection hook ── */
                    <div
                      onMouseUp={textSel.handleMouseUp}
                      className="flex-1 overflow-y-auto"
                    >
                      <pre className="min-h-full cursor-text select-text p-6 font-mono text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {displayContent}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="size-4 animate-spin" /> Page {loader.currentPage} is still loading…
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
          </div>

          {showComments && hasPermission('document:comment') && (
            <CommentsSidebar
              comments={docComments.comments} isLoading={docComments.isLoading}
              currentPage={loader.currentPage} currentUser={CURRENT_USER}
              onAddComment={docComments.addComment}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="flex shrink-0 items-center justify-between border-t border-gray-100 px-5 py-2.5">
          <p className="text-xs text-gray-400">
            {isDocReady ? `${totalPages} pages · ${formatBytes(customer?.document.sizeBytes ?? 0)}` : loader.message}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(Math.max(1, loader.currentPage - 1))}
              disabled={loader.currentPage <= 1 || !isDocReady}
              className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-medium text-gray-700">
              {loader.currentPage} / {totalPages || '—'}
            </span>
            <button onClick={() => handlePageChange(Math.min(totalPages || 1, loader.currentPage + 1))}
              disabled={loader.currentPage >= totalPages || !isDocReady}
              className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>

        {/* ── Split dialog ── */}
        {showSplitDialog && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30">
            <div className="w-96 rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="mb-1 text-sm font-bold text-gray-900">Split Document</h3>
              <p className="mb-4 text-xs text-gray-500">
                Creates two documents: pages 1–{splitPageInput} and pages {splitPageInput + 1}–{totalPages}.
              </p>
              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-medium text-gray-700">Split after page</span>
                <input type="number" min={1} max={Math.max(1, totalPages - 1)}
                  value={splitPageInput} onChange={e => setSplitPageInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200" />
              </label>

              {affectedPrev.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <p>
                    <span className="font-semibold">{affectedPrev.map(u => u.name).join(' and ')} </span>
                    {affectedPrev.length === 1 ? 'is' : 'are'} on page
                    {affectedPrev.length === 1
                      ? ` ${affectedPrev[0].currentPage}`
                      : 's ' + affectedPrev.map(u => u.currentPage).join(', ')
                    }, which falls in the section being split. They will be notified.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleSplitConfirm}
                  disabled={splitPageInput < 1 || splitPageInput >= totalPages}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">
                  <Scissors className="size-3.5" /> Confirm Split
                </button>
                <button onClick={() => setShowSplitDialog(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating comment bubble (fixed, outside panel) ── */}
      {textSel.selection && bubbleStyle && (
        <div style={bubbleStyle} className="w-80 overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
          {!showCommentForm ? (
            <button
              onMouseDown={e => e.preventDefault()} // preserve browser selection
              onClick={() => setShowCommentForm(true)}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              <MessageSquare className="size-4 text-violet-400" />
              Add comment
              <span className="ml-auto max-w-[100px] truncate text-xs text-gray-500">
                "{textSel.selection.text}"
              </span>
            </button>
          ) : (
            <form onSubmit={handleSelectionCommentSubmit} className="p-3 space-y-2">
              {/* Quote preview */}
              <p className="truncate rounded bg-gray-800 px-2 py-1 text-[10px] italic text-gray-400">
                "{textSel.selection.text.slice(0, 80)}{textSel.selection.text.length > 80 ? '…' : ''}"
              </p>
              <textarea
                autoFocus
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Add your comment…"
                rows={3}
                className="w-full resize-none rounded-lg bg-gray-800 px-3 py-2 text-xs text-white outline-none placeholder:text-gray-500 focus:ring-1 focus:ring-violet-500"
              />
              <div className="flex gap-2">
                <button type="submit"
                  disabled={!commentDraft.trim() || isSendingComment}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                  <Send className="size-3" />
                  {isSendingComment ? 'Posting…' : 'Post'}
                </button>
                <button type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setShowCommentForm(false); textSel.clearSelection(); }}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
