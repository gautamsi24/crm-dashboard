import { memo } from 'react';
import { Loader2, CheckCircle2, LogOut } from 'lucide-react';
import type { SaveStatus } from '@/pages/customers/hooks/useDocumentEdit';

interface EditStatusBarProps {
  saveStatus:    SaveStatus;
  onStopEditing: () => void;
}

const EditStatusBar = memo(function EditStatusBar({ saveStatus, onStopEditing }: EditStatusBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-1.5">
      <span className="flex items-center gap-1.5 text-xs">
        {saveStatus === 'saving' && (
          <><Loader2 className="size-3 animate-spin text-amber-500" /><span className="text-amber-600">Saving…</span></>
        )}
        {saveStatus === 'saved' && (
          <><CheckCircle2 className="size-3 text-emerald-500" /><span className="text-emerald-600">Saved</span></>
        )}
        {saveStatus === 'idle' && (
          <span className="text-amber-500">Edit mode — changes save automatically</span>
        )}
      </span>
      <button
        onClick={onStopEditing}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
      >
        <LogOut className="size-3" /> Done editing
      </button>
    </div>
  );
});

export default EditStatusBar;
