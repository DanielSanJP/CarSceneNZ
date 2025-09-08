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
  const setInboxPageActive = useCallback(
    (isActive: boolean) => {
      setIsInboxPageActive(isActive);

      // If user is on inbox page and page is visible, mark as read
      if (isActive && isPageVisible) {
        markAsRead();
      }
    },
    [isPageVisible, markAsRead]
  );

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      // If page becomes visible and user is on inbox, mark as read
      if (isVisible && isInboxPageActive) {
        markAsRead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isInboxPageActive, markAsRead]);

  // Set up real-time subscription for new messages
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

        // Create realtime channel for this user's messages
        channel = supabase
          .channel(`inbox-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT", // Only listen for new messages
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${userId}`,
            },
            async (payload) => {
              console.log("New message received:", payload);

              // Check if user is currently on inbox page and page is visible
              const shouldAutoMarkRead = isInboxPageActive && isPageVisible;

              if (shouldAutoMarkRead) {
                // Don't increment count, just mark as read immediately
                console.log(
                  "Auto-marking new message as read (user on inbox page)"
                );
                setTimeout(() => markAsRead(), 100); // Small delay to ensure message is saved
              } else {
                // Increment unread count for normal behavior
                setUnreadCount((prev) => prev + 1);
              }

              // Optional: Show a toast notification
              if (typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "granted") {
                  new Notification("New message received", {
                    body: "You have a new message in your inbox",
                    icon: "/favicon.ico",
                  });
                }
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "users",
              filter: `id=eq.${userId}`,
            },
            async (payload) => {
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
            console.log("Inbox realtime status:", status);

            switch (status) {
              case "SUBSCRIBED":
                setIsConnected(true);
                setError(null);
                break;
              case "CHANNEL_ERROR":
                setIsConnected(false);
                setError("Failed to connect to real-time updates");
                break;
              case "TIMED_OUT":
                setIsConnected(false);
                setError("Connection timed out");
                break;
              case "CLOSED":
                setIsConnected(false);
                break;
              default:
                console.log("Unhandled realtime status:", status);
            }
          });
      } catch (err) {
        console.error("Error setting up inbox realtime:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsConnected(false);
      }
    }

    setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        console.log("Cleaning up inbox realtime subscription");
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
