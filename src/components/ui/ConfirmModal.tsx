import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmModalProps {
  open:          boolean;
  title:         string;
  description?:  string;
  confirmLabel?: string;
  cancelLabel?:  string;
  /** 'danger' renders a red confirm button and a warning icon in the title */
  variant?:      'default' | 'danger';
  /** Disables the confirm button (e.g. while input is invalid) */
  disabled?:     boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
  /** Extra content rendered between the description and the action buttons */
  children?:     React.ReactNode;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  disabled     = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30"
    >
      <div className="w-96 rounded-2xl bg-white p-6 shadow-2xl">

        <header className="mb-1 flex items-start gap-2">
          {variant === 'danger' && (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden="true" />
          )}
          <h3
            id="confirm-modal-title"
            className="text-sm font-bold text-gray-900"
          >
            {title}
          </h3>
        </header>

        {description && (
          <p className="mb-4 text-xs text-gray-500">{description}</p>
        )}

        {children && <div className="mb-4 space-y-3">{children}</div>}

        <footer className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40',
              variant === 'danger' ? 'bg-rose-600' : 'bg-primary',
            )}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
