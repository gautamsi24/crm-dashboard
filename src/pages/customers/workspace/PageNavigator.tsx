/**
 * PageNavigator — left sidebar with clickable page list.
 * Shows loading state for unready pages and presence dots for pages
 * where other users are currently active.
 */

import { cn } from '@/lib/utils';
import type { PresenceUser } from '@/types/document';

interface PageNavigatorProps {
  totalPages:  number;
  pagesReady:  number;
  currentPage: number;
  onPageSelect:(page: number) => void;
  usersOnPage: (page: number) => PresenceUser[];
}

export default function PageNavigator({
  totalPages, pagesReady, currentPage, onPageSelect, usersOnPage,
}: PageNavigatorProps) {
  if (totalPages === 0) return null;

  return (
    <aside className="flex w-44 shrink-0 flex-col overflow-hidden border-r border-gray-100 bg-gray-50">
      <h2 className="shrink-0 border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Pages
      </h2>

      <nav aria-label="Document pages" className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum   = i + 1;
          const isReady   = pageNum <= pagesReady;
          const isCurrent = pageNum === currentPage;
          const viewers   = usersOnPage(pageNum);

          return (
            <button
              key={pageNum}
              onClick={() => isReady && onPageSelect(pageNum)}
              disabled={!isReady}
              title={
                viewers.length
                  ? viewers.map(v => `${v.name} is here`).join(', ')
                  : undefined
              }
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                !isReady
                  ? 'cursor-not-allowed'
                  : isCurrent
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-200',
              )}
            >
              {/* Thumbnail placeholder */}
              <div
                className={cn(
                  'flex h-8 w-6 shrink-0 items-center justify-center rounded border text-[9px] font-bold',
                  !isReady
                    ? 'animate-pulse border-gray-200 bg-gray-100 text-gray-300'
                    : isCurrent
                      ? 'border-white/30 bg-white/20 text-white'
                      : 'border-gray-200 bg-white text-gray-400',
                )}
              >
                {isReady ? pageNum : ''}
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-medium leading-none', !isReady && 'text-gray-300')}>
                  {isReady ? `Page ${pageNum}` : 'Loading…'}
                </p>

                {/* Presence avatars for this page */}
                {isReady && viewers.length > 0 && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {viewers.map(v => (
                      <span
                        key={v.id}
                        className={cn(
                          'flex size-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white',
                          v.color,
                          isCurrent ? 'ring-1 ring-white' : '',
                        )}
                      >
                        {v.initials[0]}
                      </span>
                    ))}
                    <span className={cn(
                      'ml-0.5 text-[9px]',
                      isCurrent ? 'text-white/70' : 'text-gray-400',
                    )}>
                      here
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {pagesReady < totalPages && totalPages > 0 && (
        <p aria-live="polite" className="shrink-0 border-t border-gray-100 px-3 py-2 text-center text-[10px] text-gray-400">
          {pagesReady} / {totalPages} loaded
        </p>
      )}
    </aside>
  );
}
