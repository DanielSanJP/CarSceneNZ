"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface RealtimeUnreadBadgeProps {
  userId: string | null;
}

export function RealtimeUnreadBadge({ userId }: RealtimeUnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  console.log("� BADGE: Rendering", { userId, unreadCount });

  // Step 1: Basic working useEffect with API fetch
  useEffect(() => {
    console.log("✅ useEffect running!", { userId });

    if (!userId) {
      console.log("✅ No userId, skipping");
      return;
    }

    // Simple API fetch (no complex async setup)
    fetch(`/api/inbox/unread-count?userId=${encodeURIComponent(userId)}`)
      .then((response) => response.json())
      .then((data) => {
        const count = data.count || 0;
        console.log("✅ Fetched count:", count);
        setUnreadCount(count);
      })
      .catch((error) => {
        console.error("✅ Fetch error:", error);
      });
  }, [userId]);

  console.log("🚀 BADGE: About to render", { unreadCount });

  if (!userId || unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="text-xs">
      {unreadCount}
    </Badge>
  );
}
