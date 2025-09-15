"use client";

import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { useRealtimeContext } from "@/components/providers/realtime-provider";

interface InboxUnreadBadgeProps {
  className?: string;
}

/**
 * Simple unread badge that uses the global RealtimeProvider
 */
export function InboxUnreadBadge({ className }: InboxUnreadBadgeProps) {
  const { unreadCount } = useRealtimeContext();
  const pathname = usePathname();

  // Don't show badge if user is on inbox page or count is 0
  if (unreadCount === 0 || pathname === "/inbox") {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold min-w-[20px] rounded-full ${
        className || ""
      }`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
