import { memo } from 'react';

interface ResumePromptProps {
  resumePage: number;
  onResume:   () => void;
  onDismiss:  () => void;
}

const ResumePrompt = memo(function ResumePrompt({ resumePage, onResume, onDismiss }: ResumePromptProps) {
  return (
    <aside role="alert" aria-live="assertive" aria-atomic="true" className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-2">
      <p className="text-xs text-amber-800">
        You were last on <span className="font-semibold">page {resumePage}</span>. Continue?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onResume}
          className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
        >
          Resume
        </button>
        <button
          onClick={onDismiss}
          className="rounded-md px-3 py-1 text-xs text-amber-700 hover:bg-amber-100"
        >
          Start from page 1
        </button>
      </div>
    </aside>
  );
});

export default ResumePrompt;
