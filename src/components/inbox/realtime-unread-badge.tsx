"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

interface RealtimeUnreadBadgeProps {
  userId: string | null;
}

export function RealtimeUnreadBadge({ userId }: RealtimeUnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  console.log("🚀 REALTIME BADGE: Component rendering", {
    userId,
    currentCount: unreadCount,
    isClient,
    pathname,
  });

  // Client-side hydration check
  useEffect(() => {
    console.log("🚀 REALTIME BADGE: Hydration useEffect running!");
    setIsClient(true);
  }, []);

  // Initial fetch when client is ready
  useEffect(() => {
    console.log("🚀 REALTIME BADGE: Initial fetch useEffect running!", {
      isClient,
      userId,
    });

    const fetchUnreadCount = async () => {
      if (!userId || !isClient) {
        console.log(
          "🚀 REALTIME BADGE: Skipping fetch - no userId or not client"
        );
        return;
      }

      try {
        console.log("🚀 REALTIME BADGE: Fetching count from API...");
        const response = await fetch(
          `/api/inbox/unread-count?userId=${encodeURIComponent(userId)}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newCount = data.count || 0;
          console.log("🚀 REALTIME BADGE: API returned count:", newCount);
          setUnreadCount(newCount);
        } else {
          console.error("🚀 REALTIME BADGE: API error:", response.statusText);
        }
      } catch (error) {
        console.error("🚀 REALTIME BADGE: Fetch error:", error);
      }
    };

    if (isClient && userId) {
      fetchUnreadCount();
    }
  }, [isClient, userId]);

  // Set up real-time subscription
  useEffect(() => {
    console.log("🚀 REALTIME BADGE: Real-time useEffect running!", {
      isClient,
      userId,
    });

    if (!isClient || !userId) {
      console.log("🚀 REALTIME BADGE: Skipping real-time - not ready");
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        console.log(
          "🚀 REALTIME BADGE: Fetching fresh count from real-time..."
        );
        const response = await fetch(
          `/api/inbox/unread-count?userId=${encodeURIComponent(userId)}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newCount = data.count || 0;
          console.log(
            "🚀 REALTIME BADGE: Real-time API returned count:",
            newCount
          );
          setUnreadCount(newCount);
        } else {
          console.error(
            "🚀 REALTIME BADGE: Real-time API error:",
            response.statusText
          );
        }
      } catch (error) {
        console.error("🚀 REALTIME BADGE: Real-time fetch error:", error);
      }
    };

    console.log("🚀 REALTIME BADGE: Setting up real-time subscription...");
    const supabase = createClient();

    const channel = supabase
      .channel(`unread-badge-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log(
            "🚀 REALTIME BADGE: Real-time event received:",
            payload.eventType
          );
          // Fetch fresh count when any message changes
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        console.log("🚀 REALTIME BADGE: Subscription status:", status);
      });

    return () => {
      console.log("🚀 REALTIME BADGE: Cleaning up subscription");
      channel.unsubscribe();
    };
  }, [isClient, userId]);

  // Don't show badge if no count or on inbox page
  const isOnInboxPage = pathname === "/inbox";
  if (!isClient || !userId || unreadCount === 0 || isOnInboxPage) {
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
