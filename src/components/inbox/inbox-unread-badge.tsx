"use client";

import { Badge } from "@/components/ui/badge";
import { useInboxSafe } from "@/hooks/use-inbox-safe";

interface InboxUnreadBadgeProps {
  // Optional prop for backward compatibility
  unreadCount?: number;
  // Optional className for styling variations
  className?: string;
}

/**
 * Client component that displays the unread message count badge
 * Now uses global inbox context for real-time updates
 */
export function InboxUnreadBadge({
  unreadCount: propUnreadCount,
  className,
}: InboxUnreadBadgeProps) {
  const { unreadCount: contextUnreadCount } = useInboxSafe();

  // Use context count if available, fall back to prop for backward compatibility
  const displayCount = contextUnreadCount ?? propUnreadCount ?? 0;

  if (displayCount === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold min-w-[20px] rounded-full ${
        className || ""
      }`}
    >
      {displayCount > 99 ? "99+" : displayCount}
    </Badge>
  );
}
