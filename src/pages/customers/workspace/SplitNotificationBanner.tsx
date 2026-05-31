import { memo } from 'react';
import { Scissors } from 'lucide-react';
import type { PresenceUser } from '@/types/document';

export interface SplitNotification {
  splitAfterPage: number;
  affectedUsers:  PresenceUser[];
}

interface SplitNotificationBannerProps {
  notification: SplitNotification;
  onDismiss:    () => void;
}

const SplitNotificationBanner = memo(function SplitNotificationBanner({
  notification, onDismiss,
}: SplitNotificationBannerProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-orange-100 bg-orange-50 px-5 py-2.5">
      <div className="flex items-start gap-2 text-xs text-orange-800">
        <Scissors className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
        <div>
          <p className="font-semibold">Document split after page {notification.splitAfterPage}.</p>
          <p className="mt-0.5">
            {notification.affectedUsers.length > 0
              ? `${notification.affectedUsers.map(u => u.name).join(' and ')} were working on the affected section and have been notified.`
              : 'No other users were on the affected pages.'}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-0.5 text-[10px] text-orange-600 hover:bg-orange-100"
      >
        Dismiss
      </button>
    </div>
  );
});

export default SplitNotificationBanner;
