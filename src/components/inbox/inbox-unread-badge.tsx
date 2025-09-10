"use client";

import { Badge } from "@/components/ui/badge";
import { useUnreadCount } from "@/hooks/use-inbox";
import { usePathname } from "next/navigation";

interface InboxUnreadBadgeProps {
  // Optional prop for backward compatibility
  unreadCount?: number;
  // Optional className for styling variations
  className?: string;
}

/**
 * Client component that displays the unread message count badge
 * Now uses React Query for optimized data fetching
 */
export function InboxUnreadBadge({
  unreadCount: propUnreadCount,
  className,
}: InboxUnreadBadgeProps) {
  const { data: unreadData } = useUnreadCount();
  const pathname = usePathname();

  // Use React Query count if available, fall back to prop for backward compatibility
  const displayCount = unreadData?.count ?? propUnreadCount ?? 0;

  // Don't show badge if user is currently on the inbox page
  const isOnInboxPage = pathname === "/inbox";

  if (displayCount === 0 || isOnInboxPage) {
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
