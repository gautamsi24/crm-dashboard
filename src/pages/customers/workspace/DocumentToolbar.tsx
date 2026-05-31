/**
 * DocumentToolbar
 *
 * RBAC-aware action bar. Every action is always visible — disabled ones show
 * a tooltip explaining what permission is needed. Nothing is hidden, because
 * hiding actions silently makes the UI confusing for users who don't know what
 * features exist.
 *
 * Phase 2: wire each handler to the real operation (canvas split, merge, etc.)
 */

import {
  Pencil, Scissors, GitMerge, Trash2,
  MessageSquare, Highlighter, PanelLeft, PanelRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types/auth';

interface ToolbarAction {
  key:         string;
  label:       string;
  permission:  Permission;
  icon:        React.ElementType;
  danger?:     boolean;
  separator?:  boolean; // adds a divider before this item
}

const ACTIONS: ToolbarAction[] = [
  { key: 'edit',     label: 'Edit',     permission: 'document:edit',    icon: Pencil       },
  { key: 'split',    label: 'Split',    permission: 'document:split',   icon: Scissors     },
  { key: 'merge',    label: 'Merge',    permission: 'document:merge',   icon: GitMerge     },
  { key: 'delete',   label: 'Delete',   permission: 'document:delete',  icon: Trash2,      danger: true },
  { key: 'comment',  label: 'Comment',  permission: 'document:comment', icon: MessageSquare, separator: true },
  { key: 'annotate', label: 'Annotate', permission: 'document:annotate',icon: Highlighter  },
];

interface DocumentToolbarProps {
  isEditing:       boolean;
  showPageNav:     boolean;
  showComments:    boolean;
  isDocReady:      boolean;
  onAction:        (key: string) => void;
  onTogglePageNav: () => void;
  onToggleComments:() => void;
}

export default function DocumentToolbar({
  isEditing, showPageNav, showComments, isDocReady,
  onAction, onTogglePageNav, onToggleComments,
}: DocumentToolbarProps) {
  const { hasPermission } = useAuth();

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-1.5">

      {/* Panel toggles */}
      <div className="flex items-center gap-1">
        <ToggleButton
          icon={PanelLeft}
          active={showPageNav}
          title={showPageNav ? 'Hide page navigator' : 'Show page navigator'}
          onClick={onTogglePageNav}
        />
        <ToggleButton
          icon={PanelRight}
          active={showComments}
          title={showComments ? 'Hide comments' : 'Show comments'}
          onClick={onToggleComments}
          disabled={!hasPermission('document:comment')}
        />
      </div>

      {/* Document actions */}
      <div className="flex items-center">
        {ACTIONS.map(action => {
          const allowed  = hasPermission(action.permission);
          const isActive = action.key === 'edit' ? isEditing : false;

          return (
            <span key={action.key} className="flex items-center">
              {action.separator && (
                <span className="mx-2 h-4 w-px bg-gray-200" />
              )}
              <ActionButton
                label={action.label}
                icon={action.icon}
                active={isActive}
                allowed={allowed}
                danger={action.danger}
                disabled={!isDocReady}
                disabledReason={
                  !isDocReady
                    ? 'Document is loading'
                    : !allowed
                      ? `Requires "document:${action.key}" permission`
                      : undefined
                }
                onClick={() => allowed && isDocReady && onAction(action.key)}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Internal button components ────────────────────────────────────────────────

function ActionButton({
  label, icon: Icon, active, allowed, danger, disabled, disabledReason, onClick,
}: {
  label:          string;
  icon:           React.ElementType;
  active:         boolean;
  allowed:        boolean;
  danger?:        boolean;
  disabled:       boolean;
  disabledReason?: string;
  onClick:        () => void;
}) {
  const isDisabled = disabled || !allowed;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={disabledReason}
      className={cn(
        'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
        isDisabled
          ? 'cursor-not-allowed text-gray-300'
          : active
            ? danger
              ? 'bg-rose-100 text-rose-700'
              : 'bg-violet-100 text-violet-700'
            : danger
              ? 'text-rose-500 hover:bg-rose-50'
              : 'text-gray-600 hover:bg-gray-200',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function ToggleButton({
  icon: Icon, active, title, onClick, disabled,
}: {
  icon:     React.ElementType;
  active:   boolean;
  title:    string;
  onClick:  () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex size-7 items-center justify-center rounded transition-colors',
        disabled
          ? 'cursor-not-allowed text-gray-300'
          : active
            ? 'bg-gray-200 text-gray-700'
            : 'text-gray-500 hover:bg-gray-200',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
