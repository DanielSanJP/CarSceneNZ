"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { InboxMessage } from "@/types/inbox";

interface RealtimeContextValue {
  unreadCount: number;
  messages: InboxMessage[];
  isConnected: boolean;
  refreshUnreadCount: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
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

// Create stable supabase client
const supabase = createClient();

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch unread count from server action
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!userId) return 0;

    try {
      debug(`🔢 REALTIME: Fetching unread count for user: ${userId}`);
      const { getUnreadCount } = await import("@/lib/actions");
      const result = await getUnreadCount();

      if (!result.success) {
        console.error(
          "❌ REALTIME: Failed to fetch unread count:",
          result.error
        );
        return 0;
      }

      const count = result.count || 0;
      debug(`✅ REALTIME: Unread count for user ${userId}: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ REALTIME: Error fetching unread count:", error);
      return 0;
    }
  }, [userId]);

  // Fetch messages from server action
  const fetchMessages = useCallback(async (): Promise<InboxMessage[]> => {
    if (!userId) return [];

    try {
      debug(`📬 REALTIME: Fetching messages for user: ${userId}`);
      const { getInboxMessages } = await import("@/lib/actions");
      const result = await getInboxMessages();

      if (!result.success) {
        console.error("❌ REALTIME: Failed to fetch messages:", result.error);
        return [];
      }

      const messageList = result.messages || [];
      debug(`✅ REALTIME: Messages for user ${userId}: ${messageList.length}`);
      return messageList as InboxMessage[];
    } catch (error) {
      console.error("❌ REALTIME: Error fetching messages:", error);
      return [];
    }
  }, [userId]);

  // Refresh unread count and update state
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    const count = await fetchUnreadCount();
    setUnreadCount(count);
    debug(`🔔 REALTIME: Refreshed unread count to: ${count}`);
  }, [fetchUnreadCount]);

  // Refresh messages and update state
  const refreshMessages = useCallback(async (): Promise<void> => {
    const messageList = await fetchMessages();
    setMessages(messageList);
    debug(`📬 REALTIME: Refreshed messages to: ${messageList.length}`);
  }, [fetchMessages]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      debug(`📨 REALTIME: Marking all messages as read for user: ${userId}`);
      const { markAllMessagesAsRead } = await import("@/lib/actions");
      const result = await markAllMessagesAsRead();

      if (!result.success) {
        console.error(
          "❌ REALTIME: Failed to mark messages as read:",
          result.error
        );
        return;
      }

      debug(`✅ REALTIME: Marked ${result.markedCount || 0} messages as read`);

      // Update local state
      setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("❌ REALTIME: Error marking messages as read:", error);
    }
  }, [userId]);

  // Remove a message from local state (for deletions like rejections)
  const removeMessage = useCallback(
    async (messageId: string): Promise<void> => {
      debug(`🗑️ REALTIME: Removing message ${messageId} from local state`);

      setMessages((prev) => {
        const messageToRemove = prev.find((msg) => msg.id === messageId);
        const filteredMessages = prev.filter((msg) => msg.id !== messageId);

        // If the removed message was unread, decrement unread count
        if (messageToRemove && !messageToRemove.is_read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }

        debug(
          `✅ REALTIME: Removed message ${messageId}, ${filteredMessages.length} messages remaining`
        );
        return filteredMessages;
      });
    },
    []
  );

  // Simple subscription setup - only runs when userId changes
  useEffect(() => {
    if (!userId) {
      debug("⚠️ REALTIME: No userId provided, skipping setup");
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    debug(`🚀 REALTIME: Setting up realtime for user: ${userId}`);

    // Load initial data
    const loadInitialData = async () => {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
      debug(`🔔 REALTIME: Initial unread count: ${count}`);

      const messageList = await fetchMessages();
      setMessages(messageList);
      debug(`📬 REALTIME: Initial messages loaded: ${messageList.length}`);
    };

    loadInitialData();

    // Create channel - simple naming convention
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
        debug("📨 REALTIME: Payload:", payload);

        if (payload && payload.payload) {
          const eventData = payload.payload;

          // Check if this event is for the current user
          if (eventData.userId === userId) {
            debug("✅ REALTIME: Event is for current user");

            // Use database count directly from trigger (bulletproof approach)
            if (eventData.unreadCount !== undefined) {
              setUnreadCount(eventData.unreadCount);
              debug(
                `🔔 REALTIME: Updated unread count to: ${eventData.unreadCount}`
              );
            }

            // Handle different actions
            if (eventData.action === "new_message") {
              refreshMessages(); // Refresh messages list
            } else if (eventData.action === "message_read") {
              // Update specific message
              if (eventData.messageId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === eventData.messageId
                      ? { ...msg, is_read: true }
                      : msg
                  )
                );
              }
            } else if (eventData.action === "message_deleted") {
              // Remove deleted message
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== eventData.messageId)
              );
            }
          }
        }
      })
      .subscribe((status) => {
        debug(`📡 REALTIME: Subscription status: ${status}`);

        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          debug("✅ REALTIME: Successfully connected!");
        } else if (status === "CLOSED") {
          setIsConnected(false);
          debug("❌ REALTIME: Connection closed");
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error("❌ REALTIME: Channel error");
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          console.error("⏰ REALTIME: Connection timed out");
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      debug("🧹 REALTIME: Cleaning up subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, fetchUnreadCount, fetchMessages, refreshMessages]); // Include all dependencies

  const value: RealtimeContextValue = {
    unreadCount,
    messages,
    isConnected,
    refreshUnreadCount,
    refreshMessages,
    markAllAsRead,
    removeMessage,
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
