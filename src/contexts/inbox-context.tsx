"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface InboxContextType {
  unreadCount: number;
  isConnected: boolean;
  error: string | null;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: () => Promise<void>;
  setInboxPageActive: (isActive: boolean) => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

interface InboxProviderProps {
  children: React.ReactNode;
  userId: string | null;
  initialUnreadCount?: number;
}

export function InboxProvider({
  children,
  userId,
  initialUnreadCount = 0,
}: InboxProviderProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInboxPageActive, setIsInboxPageActive] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Function to fetch unread count from server
  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`/api/inbox/unread-count?userId=${userId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const { count } = await response.json();
        setUnreadCount(count);
      } else {
        console.error("Failed to fetch unread count");
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [userId]);

  // Function to mark messages as read (called when visiting inbox)
  const markAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch("/api/inbox/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [userId]);

  // Function to set inbox page active state
  const setInboxPageActive = useCallback((isActive: boolean) => {
    setIsInboxPageActive(isActive);
    // Note: Don't auto-mark as read here since server-side already handles it
    // Only mark as read when new messages arrive while actively viewing
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      // Note: Don't auto-mark as read on visibility change
      // Server-side handles initial read state, only mark when new messages arrive
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Set up real-time subscription for badge counting only
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel;

    async function setupRealtime() {
      try {
        setError(null);

        // Create realtime channel for badge counting only (no message content handling)
        channel = supabase
          .channel(`inbox-badges-${userId}`)
          .on("broadcast", { event: "new_message_badge" }, async (payload) => {
            console.log("New message badge broadcast received:", payload);

            // Only process if message is for this user
            if (payload.payload?.receiver_id === userId) {
              // Check if user is currently on inbox page and page is visible
              const shouldAutoMarkRead = isInboxPageActive && isPageVisible;

              if (shouldAutoMarkRead) {
                // User is on inbox page - auto mark as read (no badge increment)
                console.log(
                  "Auto-marking new message as read (user on inbox page)"
                );
                markAsRead();
              } else {
                // User not on inbox page - increment badge count
                console.log(
                  "Incrementing unread count (user not on inbox page)"
                );
                setUnreadCount((prev) => prev + 1);
              }
            }
          })
          .on("broadcast", { event: "messages_marked_read" }, (payload) => {
            console.log("Messages marked read broadcast received:", payload);

            // Only process if it's for this user
            if (payload.payload?.user_id === userId) {
              console.log("Clearing badge count - messages marked as read");
              setUnreadCount(0);
            }
          })
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "users",
              filter: `id=eq.${userId}`,
            },
            async (payload: {
              new?: { last_seen_inbox?: string };
              old?: { last_seen_inbox?: string };
            }) => {
              // Listen for updates to last_seen_inbox to refresh count
              if (
                payload.new?.last_seen_inbox !== payload.old?.last_seen_inbox
              ) {
                console.log("User visited inbox, refreshing count");
                await refreshUnreadCount();
              }
            }
          )
          .subscribe((status) => {
            console.log("Inbox badge realtime status:", status);

            switch (status) {
              case "SUBSCRIBED":
                setIsConnected(true);
                setError(null);
                console.log("✅ Successfully subscribed to badge counting");
                break;
              case "CHANNEL_ERROR":
                setIsConnected(false);
                setError("Failed to connect to real-time updates");
                console.error("❌ Badge channel error");
                break;
              case "TIMED_OUT":
                setIsConnected(false);
                setError("Connection timed out");
                console.error("⏱️ Badge connection timed out");
                break;
              case "CLOSED":
                setIsConnected(false);
                console.log("🔌 Badge connection closed");
                break;
              default:
                console.log("Unhandled badge realtime status:", status);
            }
          });
      } catch (err) {
        console.error("Error setting up inbox badge realtime:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsConnected(false);
      }
    }

    setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        console.log("Cleaning up inbox badge realtime subscription");
        supabase.removeChannel(channel);
      }
    };
  }, [
    userId,
    refreshUnreadCount,
    isInboxPageActive,
    isPageVisible,
    markAsRead,
  ]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Update unread count when initial count changes (e.g., on navigation)
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  const value: InboxContextType = {
    unreadCount,
    isConnected,
    error,
    refreshUnreadCount,
    markAsRead,
    setInboxPageActive,
  };

  return (
    <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
  );
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
}
