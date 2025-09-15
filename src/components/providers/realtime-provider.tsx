"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/utils/supabase/client";

interface RealtimeContextValue {
  unreadCount: number;
  isConnected: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Function to fetch current unread count via API
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!userId) return 0;

    try {
      console.log("📬 BROADCAST: Fetching unread count via API...");

      const response = await fetch("/api/inbox/unread-count", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("❌ API response not ok:", response.status);
        return 0;
      }

      const data = await response.json();
      const unreadCount = data.count || 0; // API returns 'count', not 'unreadCount'
      console.log("📬 BROADCAST: Fetched count via API:", unreadCount);
      return unreadCount;
    } catch (error) {
      console.error("❌ Error fetching unread count via API:", error);
      return 0;
    }
  }, [userId]);

  // Refresh function that can be called externally
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
      console.log(`🔔 Global: Refreshed unread count: ${count}`);
    } catch (error) {
      console.error("❌ Global: Error refreshing unread count:", error);
    }
  }, [userId, fetchUnreadCount]);

  useEffect(() => {
    if (!userId) {
      console.log("📬 BROADCAST: No userId provided, skipping setup");
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    console.log(`📬 BROADCAST: Starting setup for user: ${userId}`);

    const supabase = createClient();
    let cleanup: (() => void) | undefined;

    const setupBroadcastRealtime = async () => {
      try {
        // 1. Get initial unread count
        const initialCount = await fetchUnreadCount();
        setUnreadCount(initialCount);
        console.log(`📬 BROADCAST: Initial unread count: ${initialCount}`);

        // 2. Set up simple broadcast subscription
        console.log(`📬 BROADCAST: Creating broadcast channel...`);
        const channel = supabase
          .channel(`unread-messages-${userId}`)
          .on(
            "broadcast",
            { event: "unread_count_changed" },
            async (payload) => {
              console.log("📬 BROADCAST: Unread count change event received!");
              console.log("📬 BROADCAST: Payload:", payload);

              // Check if this event is for the current user
              if (payload.payload?.userId === userId) {
                console.log(
                  "📬 BROADCAST: Event is for current user, refreshing count"
                );
                await refreshUnreadCount();
              } else {
                console.log(
                  "📬 BROADCAST: Event is for different user, ignoring"
                );
              }
            }
          )
          .subscribe((status) => {
            console.log("📬 BROADCAST: Subscription status:", status);

            if (status === "SUBSCRIBED") {
              console.log("✅ 📬 BROADCAST: Successfully subscribed!");
              setIsConnected(true);
            } else if (status === "CLOSED") {
              console.log("❌ 📬 BROADCAST: Subscription closed");
              setIsConnected(false);
            } else if (status === "CHANNEL_ERROR") {
              console.log("⚠️ 📬 BROADCAST: Channel error occurred");
              setIsConnected(false);
            } else {
              console.log(`🔄 📬 BROADCAST: Status changed to: ${status}`);
              setIsConnected(false);
            }
          });

        cleanup = () => {
          console.log("🧹 📬 BROADCAST: Cleaning up subscription");
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("❌ 📬 BROADCAST: Error setting up realtime:", error);
        setIsConnected(false);
      }
    };

    setupBroadcastRealtime();

    return () => {
      console.log("🔄 📬 BROADCAST: Component unmounting, cleaning up...");
      if (cleanup) cleanup();
    };
  }, [userId, fetchUnreadCount, refreshUnreadCount]);

  return (
    <RealtimeContext.Provider
      value={{ unreadCount, isConnected, refreshUnreadCount }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error(
      "useRealtimeContext must be used within a RealtimeProvider"
    );
  }
  return context;
}
