"use client";

import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

interface InboxUnreadBadgeProps {
  // Pass unread count as a prop instead of getting from context
  unreadCount?: number;
  // Optional className for styling variations
  className?: string;
}

/**
 * Client component that displays the unread message count badge
 * Now uses props instead of complex context
 */
export function InboxUnreadBadge({
  unreadCount = 0,
  className,
}: InboxUnreadBadgeProps) {
  const pathname = usePathname();

  // Don't show badge if user is currently on the inbox page
  const isOnInboxPage = pathname === "/inbox";

  if (unreadCount === 0 || isOnInboxPage) {
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
