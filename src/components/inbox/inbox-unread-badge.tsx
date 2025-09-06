"use client";

import { Badge } from "@/components/ui/badge";

interface InboxUnreadBadgeProps {
  unreadCount: number;
}

/**
 * Client component that displays the unread message count badge
 * Receives the unread count as a prop from a server component
 */
export function InboxUnreadBadge({ unreadCount }: InboxUnreadBadgeProps) {
  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold min-w-[20px] rounded-full"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
