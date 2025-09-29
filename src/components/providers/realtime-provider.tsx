"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

// Environment-based debug logging
const isDev = process.env.NODE_ENV === "development";
const debug = (message: string, ...args: unknown[]) => {
  if (isDev) console.log(message, ...args);
};

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!userId) return 0;

    try {
      debug(`🔢 REALTIME: Fetching unread count for user: ${userId}`);
      const response = await fetch("/api/inbox/unread-count", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(
          "❌ REALTIME: Failed to fetch unread count:",
          response.status
        );
        return 0;
      }

      const data = await response.json();
      const count = data.count || 0;

      debug(`✅ REALTIME: Unread count for user ${userId}: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ REALTIME: Error fetching unread count:", error);
      return 0;
    }
  }, [userId]);

  // Refresh unread count and update state
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    const count = await fetchUnreadCount();
    setUnreadCount(count);
    debug(`🔔 REALTIME: Refreshed unread count to: ${count}`);
  }, [fetchUnreadCount]);

  // Check if current page needs immediate unread count
  const needsImmediateCount = useCallback((): boolean => {
    if (!pathname) return false;
    return (
      pathname === "/" ||
      pathname.includes("/inbox") ||
      pathname.includes("/profile")
    );
  }, [pathname]);

  useEffect(() => {
    if (!userId) {
      debug("⚠️ REALTIME: No userId provided, skipping setup");
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    debug(`🚀 REALTIME: Setting up for user: ${userId}`);
    debug(`🚀 REALTIME: Current pathname: ${pathname}`);

    let mounted = true;
    const supabase = supabaseRef.current;

    const setupRealtime = async () => {
      try {
        // 1. Load initial unread count
        if (needsImmediateCount()) {
          debug(
            "📱 REALTIME: Loading unread count immediately (critical page)"
          );
          await refreshUnreadCount();
        } else {
          debug("⏳ REALTIME: Deferring unread count load (non-critical page)");
          // Load in background for non-critical pages
          setTimeout(async () => {
            if (mounted) {
              debug("🔄 REALTIME: Loading unread count in background");
              await refreshUnreadCount();
            }
          }, 1000);
        }

        // 2. Set up Supabase Realtime subscription
        debug("🔌 REALTIME: Setting up Supabase Realtime subscription...");

        // Clean up existing channel
        if (channelRef.current) {
          debug("🧹 REALTIME: Cleaning up existing channel");
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Get current session for authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.error(
            "❌ REALTIME: No active session - cannot subscribe to realtime"
          );
          return;
        }

        debug(
          "🔑 REALTIME: Active session found, setting up authenticated channel"
        );

        // Create channel with proper authentication
        const channelName = `user:${userId}:unread`;
        debug(`📡 REALTIME: Creating channel: ${channelName}`);

        const channel = supabase
          .channel(channelName, {
            config: {
              broadcast: {
                self: false, // Don't receive our own messages
              },
            },
          })
          .on("broadcast", { event: "unread_count_changed" }, (payload) => {
            debug("📨 REALTIME: Received broadcast event!");
            debug(
              "📨 REALTIME: Full payload:",
              JSON.stringify(payload, null, 2)
            );

            if (payload && payload.payload) {
              const eventData = payload.payload;
              debug(
                "📨 REALTIME: Event data:",
                JSON.stringify(eventData, null, 2)
              );

              // Check if this event is for the current user
              if (eventData.userId === userId) {
                debug(
                  "✅ REALTIME: Event is for current user - refreshing count!"
                );
                debug("📨 REALTIME: Action:", eventData.action);
                debug("📨 REALTIME: Message Type:", eventData.messageType);

                // Refresh the unread count
                if (mounted) {
                  refreshUnreadCount();
                }
              } else {
                debug(
                  `⚠️ REALTIME: Event is for different user: expected ${userId}, got ${eventData.userId}`
                );
              }
            } else {
              debug("⚠️ REALTIME: Received event with no payload");
            }
          })
          .subscribe((status, err) => {
            debug(`📡 REALTIME: Subscription status: ${status}`);

            if (err) {
              console.error("❌ REALTIME: Subscription error:", err);
            }

            if (status === "SUBSCRIBED") {
              debug(
                "✅ REALTIME: Successfully subscribed to realtime channel!"
              );
              debug(`✅ REALTIME: Channel: ${channelName}`);
              debug("✅ REALTIME: Listening for: unread_count_changed");

              if (mounted) {
                setIsConnected(true);
              }
            } else if (status === "CLOSED") {
              debug("❌ REALTIME: Channel subscription closed");
              if (mounted) {
                setIsConnected(false);
              }
            } else if (status === "CHANNEL_ERROR") {
              console.error("❌ REALTIME: Channel error");
              if (mounted) {
                setIsConnected(false);
              }
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error("❌ REALTIME: Setup error:", error);
        setIsConnected(false);
      }
    };

    setupRealtime();

    // Cleanup function
    return () => {
      debug("🧹 REALTIME: Cleaning up realtime provider");
      mounted = false;

      if (channelRef.current) {
        debug("🧹 REALTIME: Unsubscribing from channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsConnected(false);
    };
  }, [userId, pathname, refreshUnreadCount, needsImmediateCount]);

  const value: RealtimeContextValue = {
    unreadCount,
    isConnected,
    refreshUnreadCount,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

// Backward compatibility export
export const useRealtimeContext = useRealtime;
