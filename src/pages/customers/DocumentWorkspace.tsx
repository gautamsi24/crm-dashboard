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

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  X, FileText, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, Wifi, WifiOff, RefreshCw, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth }                  from '@/contexts/AuthContext';
import { useDocumentLoader }        from '@/pages/customers/hooks/useDocumentLoader';
import { useDocumentResume }        from '@/pages/customers/hooks/useDocumentResume';
import { useDocumentPresence }      from '@/pages/customers/hooks/useDocumentPresence';
import { useDocumentComments }      from '@/pages/customers/hooks/useDocumentComments';
import { useDocumentEdit }          from '@/pages/customers/hooks/useDocumentEdit';
import { useTextSelection }         from '@/pages/customers/hooks/useTextSelection';
import { CURRENT_USER }             from '@/types/document';
import DocumentToolbar              from '@/pages/customers/workspace/DocumentToolbar';
import PageNavigator                from '@/pages/customers/workspace/PageNavigator';
import CommentsSidebar              from '@/pages/customers/workspace/CommentsSidebar';
import ResumePrompt                 from '@/pages/customers/workspace/ResumePrompt';
import SplitNotificationBanner      from '@/pages/customers/workspace/SplitNotificationBanner';
import EditStatusBar                from '@/pages/customers/workspace/EditStatusBar';
import FloatingCommentBubble        from '@/pages/customers/workspace/FloatingCommentBubble';
import { ConfirmModal }             from '@/components/ui/ConfirmModal';
import type { Customer }            from '@/lib/mockApi';
import type { PresenceUser }        from '@/types/document';
import type { SplitNotification }   from '@/pages/customers/workspace/SplitNotificationBanner';

function formatBytes(b: number) {
  return b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${(b / 1_000).toFixed(0)} KB`;
}

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
  const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
  const [splitPageInput,    setSplitPageInput]    = useState(1);
  const [splitNotification, setSplitNotification] = useState<SplitNotification | null>(null);

  // ── Pre-compute presence page map ─────────────────────────────────────────
  // Avoids calling usersOnPage() (a filter) N times inside PageNavigator's
  // render loop. O(M) build once per presence change instead of O(N×M).
  const presencePageMap = useMemo(() => {
    const map = new Map<number, PresenceUser[]>();
    for (const u of presence.presence) {
      const list = map.get(u.currentPage) ?? [];
      list.push(u);
      map.set(u.currentPage, list);
    }
    return map;
  }, [presence.presence]);

  const usersOnPageStable = useCallback(
    (page: number) => presencePageMap.get(page) ?? [],
    [presencePageMap],
  );

  // ── Network ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const up = () => setNetworkOnline(true), down = () => setNetworkOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // ── Reset on doc change ───────────────────────────────────────────────────
  useEffect(() => {
    documentEdit.stopEditing();
    setShowComments(false); setShowSplitDialog(false); setShowDeleteDialog(false);
    setSplitNotification(null);
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

  // ── Page navigation ───────────────────────────────────────────────────────
  const handlePageChange = useCallback((page: number) => {
    loader.setCurrentPage(page); resume.savePosition(page);
  }, [loader.setCurrentPage, resume.savePosition]);

  // ── Toolbar actions ───────────────────────────────────────────────────────
  const handleAction = useCallback((key: string) => {
    if (key === 'edit')    { documentEdit.isEditing ? documentEdit.stopEditing() : documentEdit.startEditing(); return; }
    if (key === 'comment') { setShowComments(c => !c); return; }
    if (key === 'split')   { setSplitPageInput(Math.max(1, Math.min(loader.currentPage, totalPages - 1))); setShowSplitDialog(true); return; }
    if (key === 'delete')  { setShowDeleteDialog(true); return; }
  }, [documentEdit.isEditing, documentEdit.stopEditing, documentEdit.startEditing, loader.currentPage, totalPages]);

  // ── Split confirm ─────────────────────────────────────────────────────────
  const handleSplitConfirm = useCallback(() => {
    const affected = presence.presence.filter(u => u.currentPage > splitPageInput);
    setSplitNotification({ splitAfterPage: splitPageInput, affectedUsers: affected });
    setShowSplitDialog(false);
  }, [presence.presence, splitPageInput]);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(() => {
    // Production: await deleteDocument(documentId) then call onClose()
    setShowDeleteDialog(false);
    onClose();
  }, [onClose]);

  // ── Resume ────────────────────────────────────────────────────────────────
  const handleResume = useCallback(() => {
    if (resume.resumePage) handlePageChange(resume.resumePage);
    resume.dismissPrompt();
  }, [resume.resumePage, resume.dismissPrompt, handlePageChange]);

  // ── Comment from text selection ───────────────────────────────────────────
  const handleCommentPosted = useCallback(async (text: string, selectedText: string) => {
    await docComments.addComment(loader.currentPage, text, CURRENT_USER, selectedText);
    textSel.clearSelection();
    setShowComments(true);
  }, [docComments.addComment, loader.currentPage, textSel.clearSelection]);

  // ── Panel toggle handlers ─────────────────────────────────────────────────
  const handleTogglePageNav      = useCallback(() => setShowPageNav(v => !v), []);
  const handleToggleComments     = useCallback(() => setShowComments(v => !v), []);
  const handleDismissSplit       = useCallback(() => setSplitNotification(null), []);
  const handleCloseSplitDialog   = useCallback(() => setShowSplitDialog(false), []);
  const handleCloseDeleteDialog  = useCallback(() => setShowDeleteDialog(false), []);

  // ── contentEditable input handler ─────────────────────────────────────────
  const handleInput = useCallback(() => {
    documentEdit.updatePageContent(
      loader.currentPage,
      editableRef.current?.textContent ?? '',
    );
  }, [documentEdit.updatePageContent, loader.currentPage]);

  // ── Footer navigation ─────────────────────────────────────────────────────
  const handlePrevPage = useCallback(
    () => handlePageChange(Math.max(1, loader.currentPage - 1)),
    [handlePageChange, loader.currentPage],
  );
  const handleNextPage = useCallback(
    () => handlePageChange(Math.min(totalPages || 1, loader.currentPage + 1)),
    [handlePageChange, loader.currentPage, totalPages],
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const isDocReady = loader.phase === 'ready';

  const displayContent = useMemo(
    () => documentEdit.getPageContent(
      loader.currentPage,
      loader.doc?.pages[loader.currentPage - 1]?.content ?? '',
    ),
    // getPageContent is stable (useCallback); re-runs when page or doc changes
    [documentEdit.getPageContent, loader.currentPage, loader.doc],
  );

  const viewersHere = useMemo(
    () => usersOnPageStable(loader.currentPage),
    [usersOnPageStable, loader.currentPage],
  );

  const affectedPrev = useMemo(
    () => presence.presence.filter(u => u.currentPage > splitPageInput),
    [presence.presence, splitPageInput],
  );

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
      <div data-cy="document-workspace" className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-6xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>

        {/* ── Header ── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50">
            <FileText className="size-4 text-rose-500" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span data-cy="workspace-filename" className="truncate text-sm font-semibold text-gray-900">
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

          <button data-cy="workspace-close" onClick={onClose} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="size-4" />
          </button>
        </header>

        {/* ── Resume prompt ── */}
        {resume.showPrompt && resume.resumePage && (
          <ResumePrompt
            resumePage={resume.resumePage}
            onResume={handleResume}
            onDismiss={resume.dismissPrompt}
          />
        )}

        {/* ── Split notification ── */}
        {splitNotification && (
          <SplitNotificationBanner
            notification={splitNotification}
            onDismiss={handleDismissSplit}
          />
        )}

        {/* ── Toolbar ── */}
        <DocumentToolbar
          isEditing={documentEdit.isEditing}
          showPageNav={showPageNav}
          showComments={showComments}
          isDocReady={isDocReady}
          onAction={handleAction}
          onTogglePageNav={handleTogglePageNav}
          onToggleComments={handleToggleComments}
        />

        {/* ── Edit mode status bar (auto-save indicator + Done) ── */}
        {documentEdit.isEditing && (
          <EditStatusBar
            saveStatus={documentEdit.saveStatus}
            onStopEditing={documentEdit.stopEditing}
          />
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
              usersOnPage={usersOnPageStable}
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
                      data-cy="workspace-content-edit"
                      ref={editableRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleInput}
                      className="flex-1 overflow-y-auto bg-amber-50/40 p-6 font-mono text-xs leading-relaxed text-gray-800 outline-none whitespace-pre-wrap"
                      style={{ minHeight: 0 }}
                    />
                  ) : (
                    /* ── View mode: read-only pre; onMouseUp fires selection hook ── */
                    <div
                      data-cy="workspace-content-view"
                      onMouseUp={textSel.handleMouseUp}
                      className="flex-1 overflow-y-auto"
                    >
                      <pre data-cy="workspace-content-text" className="min-h-full cursor-text select-text p-6 font-mono text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
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
            <button
              data-cy="workspace-prev-page"
              onClick={handlePrevPage}
              disabled={loader.currentPage <= 1 || !isDocReady}
              className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <span data-cy="workspace-page-indicator" className="text-xs font-medium text-gray-700">
              {loader.currentPage} / {totalPages || '—'}
            </span>
            <button
              data-cy="workspace-next-page"
              onClick={handleNextPage}
              disabled={loader.currentPage >= totalPages || !isDocReady}
              className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>

        {/* ── Split dialog ── */}
        <ConfirmModal
          open={showSplitDialog}
          title="Split Document"
          description={`Creates two documents: pages 1–${splitPageInput} and pages ${splitPageInput + 1}–${totalPages}.`}
          confirmLabel="Confirm Split"
          disabled={splitPageInput < 1 || splitPageInput >= totalPages}
          onConfirm={handleSplitConfirm}
          onCancel={handleCloseSplitDialog}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Split after page</span>
            <input
              type="number" min={1} max={Math.max(1, totalPages - 1)}
              value={splitPageInput} onChange={e => setSplitPageInput(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />
          </label>
          {affectedPrev.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
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
        </ConfirmModal>

        {/* ── Delete dialog ── */}
        <ConfirmModal
          open={showDeleteDialog}
          title="Delete Document"
          description="This will permanently remove the document. This action cannot be undone."
          confirmLabel="Delete Document"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleCloseDeleteDialog}
        >
          {presence.presence.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
              <p>
                <span className="font-semibold">{presence.presence.map(u => u.name).join(' and ')} </span>
                {presence.presence.length === 1 ? 'is' : 'are'} currently viewing this document and will lose access.
              </p>
            </div>
          )}
        </ConfirmModal>
      </div>

      {/* ── Floating comment bubble (fixed, outside panel) ── */}
      <FloatingCommentBubble
        selection={textSel.selection}
        onCommentPosted={handleCommentPosted}
        onClearSelection={textSel.clearSelection}
      />
    </>
  );
}
